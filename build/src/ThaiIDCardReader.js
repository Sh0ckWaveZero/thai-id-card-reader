"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pcsclite_1 = __importDefault(require("pcsclite"));
const events_1 = __importDefault(require("events"));
const apdu_1 = require("./apdu/apdu");
const moment_1 = __importDefault(require("moment"));
const dataTransformer_1 = require("./utils/dataTransformer");
const cardReaderConnection_1 = require("./core/cardReaderConnection");
const commandSender_1 = require("./core/commandSender");
const logger_1 = require("./utils/logger");
const constants_1 = require("./config/constants");
const legacy = require("legacy-encoding");
class ThaiIDCardReader {
    constructor() {
        this.readTimeout = constants_1.CARD_READER_CONFIG.DEFAULT_READ_TIMEOUT;
        this.insertCardDelay = constants_1.CARD_READER_CONFIG.DEFAULT_INSERT_DELAY;
        this.eventEmitter = new events_1.default();
    }
    setReadTimeout(timeout) {
        this.readTimeout = timeout;
    }
    setInsertCardDelay(timeout) {
        this.insertCardDelay = timeout;
    }
    onReadComplete(callBack) {
        this.eventEmitter.on("READ_COMPLETE", (data) => {
            const result = dataTransformer_1.DataTransformer.processSmartCardData(data);
            callBack(result);
        });
    }
    onReadError(callBack) {
        this.eventEmitter.on("READ_ERROR", (error) => {
            callBack(error);
        });
    }
    init() {
        const that = this;
        logger_1.logger.info("ThaiSmartCardConnector init");
        const pcsc = (0, pcsclite_1.default)();
        pcsc.on("reader", function (reader) {
            logger_1.logger.info("New reader detected", reader.name);
            reader.on("error", function (err) {
                logger_1.logger.error("Error(", this.name, "):", err.message);
            });
            reader.on("status", function (status) {
                return __awaiter(this, void 0, void 0, function* () {
                    logger_1.logger.debug("Status(", this.name, "):", status);
                    var changes = this.state ^ status.state;
                    if (changes) {
                        if (changes & this.SCARD_STATE_EMPTY &&
                            status.state & this.SCARD_STATE_EMPTY) {
                            logger_1.logger.info("card removed");
                            reader.disconnect(reader.SCARD_LEAVE_CARD, function (err) {
                                if (err) {
                                    logger_1.logger.error(err);
                                }
                                else {
                                    logger_1.logger.info("Disconnected");
                                }
                            });
                        }
                        else if (changes & this.SCARD_STATE_PRESENT &&
                            status.state & this.SCARD_STATE_PRESENT) {
                            logger_1.logger.info("card inserted");
                            yield delay(that.insertCardDelay);
                            const connectionResult = yield cardReaderConnection_1.CardReaderConnection.attemptConnection(reader);
                            if (!connectionResult.connected) {
                                that.eventEmitter.emit("READ_ERROR", constants_1.RESPONSE_MESSAGES.CONNECTION_FAILED);
                                return;
                            }
                            const protocol = connectionResult.protocol;
                            logger_1.logger.info("Protocol(", reader.name, "):", protocol);
                            const sendRawCommand = (data_1, ...args_1) => __awaiter(this, [data_1, ...args_1], void 0, function* (data, retries = 2) {
                                return commandSender_1.CommandSender.sendRawCommand(reader, protocol, data, that.readTimeout, retries);
                            });
                            try {
                                logger_1.logger.info('Selecting card application...');
                                yield sendRawCommand(apdu_1.apdu.select);
                                logger_1.logger.info('Card application selected successfully');
                                const getData = (command) => __awaiter(this, void 0, void 0, function* () {
                                    let temp = yield sendRawCommand(command);
                                    let result = yield sendRawCommand([
                                        ...apdu_1.apdu.getResponse,
                                        temp[1],
                                    ]);
                                    result = result.slice(0, -2);
                                    return legacy.decode(result, "tis620");
                                });
                                const getPhoto = (command) => __awaiter(this, void 0, void 0, function* () {
                                    let temp = yield sendRawCommand(command);
                                    let result = yield sendRawCommand([
                                        ...apdu_1.apdu.getResponse,
                                        temp[1],
                                    ]);
                                    result = result.slice(0, -2);
                                    return result;
                                });
                                logger_1.logger.info('Reading card data...');
                                let data = {};
                                try {
                                    data.citizenID = yield getData(apdu_1.apdu.citizenID);
                                    logger_1.logger.info('Citizen ID read successfully');
                                }
                                catch (error) {
                                    logger_1.logger.error('Failed to read citizen ID:', error);
                                    throw new Error('Failed to read citizen ID');
                                }
                                data.fullNameTH = yield getData(apdu_1.apdu.fullNameTH);
                                data.fullNameEN = yield getData(apdu_1.apdu.fullNameEN);
                                data.gender = yield getData(apdu_1.apdu.gender);
                                data.cardIssuer = yield getData(apdu_1.apdu.cardIssuer);
                                data.dateOfBirth = (0, moment_1.default)(yield getData(apdu_1.apdu.dateOfBirth), 'YYYYMMDD').add(-543, 'years').format('YYYY-MM-DD');
                                data.issueDate = (0, moment_1.default)(yield getData(apdu_1.apdu.issueDate), 'YYYYMMDD').add(-543, 'years').format('YYYY-MM-DD');
                                data.expireDate = (0, moment_1.default)(yield getData(apdu_1.apdu.expireDate), 'YYYYMMDD').add(-543, 'years').format('YYYY-MM-DD');
                                data.address = yield getData(apdu_1.apdu.address);
                                logger_1.logger.info('Reading photo data...');
                                let photo = Buffer.from([]);
                                for (let i = 0; i < apdu_1.apdu.photos.length; i++) {
                                    try {
                                        let tempPhoto = yield getPhoto(apdu_1.apdu.photos[i]);
                                        photo = Buffer.concat([photo, tempPhoto]);
                                        logger_1.logger.debug(`Photo segment ${i + 1}/${apdu_1.apdu.photos.length} read`);
                                    }
                                    catch (error) {
                                        logger_1.logger.warn(`Failed to read photo segment ${i + 1}:`, error);
                                        // Continue with other segments
                                    }
                                }
                                data.photoAsBase64Uri = photo.toString("base64");
                                logger_1.logger.info('Card data read successfully');
                                that.eventEmitter.emit("READ_COMPLETE", data);
                                reader.disconnect(() => {
                                    logger_1.logger.info('read complete disconnect');
                                });
                            }
                            catch (error) {
                                logger_1.logger.error('Card reading error:', error);
                                that.eventEmitter.emit("READ_ERROR", `Card reading failed: ${error.message}`);
                                reader.disconnect(() => {
                                    logger_1.logger.info('error disconnect');
                                });
                            }
                        }
                    }
                });
            });
            reader.on("end", function () {
                logger_1.logger.info("Reader", this.name, "removed");
            });
        });
        pcsc.on("error", (err) => {
            logger_1.logger.error("PCSC error", err.message);
            this.eventEmitter.emit("READ_ERROR", err.message);
        });
    }
}
exports.default = ThaiIDCardReader;
function delay(timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, timeout);
    });
}
