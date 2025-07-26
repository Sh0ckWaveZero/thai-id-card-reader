import PCSC from "pcsclite"
import EventEmitter from "events"
import { apdu } from "./apdu/apdu"
import moment from 'moment'
import { SmartCardReturnData, PCSC as IPcsc, PCReader } from "./types"
import { DataTransformer } from "./utils/dataTransformer"
import { CardReaderConnection } from "./core/cardReaderConnection"
import { CommandSender } from "./core/commandSender"
import { PCSCErrorHandler } from "./utils/pcscErrorHandler"
import { logger } from "./utils/logger"
import { CARD_READER_CONFIG, RESPONSE_MESSAGES } from "./config/constants"
const legacy = require("legacy-encoding")

export default class ThaiIDCardReader {
  private eventEmitter: EventEmitter
  private readTimeout: number = CARD_READER_CONFIG.DEFAULT_READ_TIMEOUT
  private insertCardDelay: number = CARD_READER_CONFIG.DEFAULT_INSERT_DELAY
  constructor() {
    this.eventEmitter = new EventEmitter()
  }
  setReadTimeout(timeout : number) {
    this.readTimeout = timeout
  }
  setInsertCardDelay(timeout : number) {
    this.insertCardDelay = timeout
  }
  onReadComplete(callBack: (data: Partial<SmartCardReturnData>) => void) {
    this.eventEmitter.on("READ_COMPLETE", (data: SmartCardReturnData) => {
      const result = DataTransformer.processSmartCardData(data);
      callBack(result);
    })
  }
  onReadError(callBack: (error: string) => void) {
    this.eventEmitter.on("READ_ERROR", (error: string) => {
      callBack(error)
    })
  }

  init() {
    const that = this
    logger.info("ThaiSmartCardConnector init")
    const pcsc = PCSC() as IPcsc
    pcsc.on("reader", function (reader: PCReader) {
      logger.info("New reader detected", reader.name)

      reader.on("error", (err) => {
        logger.error("Error(", reader.name, "):", err.message)
      })

      reader.on("status", async (status) => {
        logger.debug("Status(", reader.name, "):", status)
       
        var changes = reader.state ^ status.state
        if (changes) {
          if (
            changes & reader.SCARD_STATE_EMPTY &&
            status.state & reader.SCARD_STATE_EMPTY
          ) {
            logger.info("card removed")
            reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
              if (err) {
                logger.error('Disconnect error:', err.message)
              } else {
                logger.info("Disconnected")
              }
            })
          } else if (
            changes & reader.SCARD_STATE_PRESENT &&
            status.state & reader.SCARD_STATE_PRESENT
          ) {
            logger.info("card inserted")
            await delay(that.insertCardDelay)
            
            const connectionResult = await CardReaderConnection.attemptConnection(reader)
            
            if (!connectionResult.connected) {
              that.eventEmitter.emit("READ_ERROR", RESPONSE_MESSAGES.CONNECTION_FAILED)
              return
            }
            
            const protocol = connectionResult.protocol
            logger.info("Protocol(", reader.name, "):", protocol)

            if (!protocol) {
              that.eventEmitter.emit("READ_ERROR", "No protocol available for card connection")
              return
            }

            const sendRawCommand = async (data: number[], retries = 2): Promise<Buffer> => {
              return CommandSender.sendRawCommand(reader, protocol, data, that.readTimeout, retries)
            }

            try {
              logger.info('Selecting card application...')
              await sendRawCommand(apdu.select)
              logger.info('Card application selected successfully')
              
              // Validate card state before reading
              const isCardReady = await PCSCErrorHandler.validateCardState(reader);
              if (!isCardReady) {
                throw new Error('Card not ready for reading');
              }
              
              const getData = async (command: number[]) => {
                let temp = await sendRawCommand(command)
                let result = await sendRawCommand([
                  ...apdu.getResponse,
                  temp[1],
                ])
                result = result.slice(0, -2)
                return legacy.decode(result, "tis620")
              }
              const getPhoto = async (command: number[]) => {
                let temp = await sendRawCommand(command)
                let result = await sendRawCommand([
                  ...apdu.getResponse,
                  temp[1],
                ])
                result = result.slice(0, -2)
                return result
              }
              
              logger.info('Reading card data...')
              let data: Partial<SmartCardReturnData> = {}
              
              // Enhanced citizen ID reading with retry logic
              try {
                data.citizenID = await PCSCErrorHandler.retryWithBackoff(
                  () => getData(apdu.citizenID),
                  CARD_READER_CONFIG.CITIZEN_ID_RETRIES
                );
                logger.info('Citizen ID read successfully');
              } catch (error) {
                const errorInfo = PCSCErrorHandler.analyzeError(error as Error);
                logger.error('Failed to read citizen ID:', errorInfo.message);
                throw new Error(errorInfo.userMessage);
              }
              
              data.fullNameTH = await getData(apdu.fullNameTH)
              data.fullNameEN = await getData(apdu.fullNameEN)
              data.gender = await getData(apdu.gender)
              data.cardIssuer = await getData(apdu.cardIssuer)
              data.dateOfBirth = moment(await getData(apdu.dateOfBirth),'YYYYMMDD').add(-543,'years').format('YYYY-MM-DD')
              data.issueDate = moment(await getData(apdu.issueDate),'YYYYMMDD').add(-543,'years').format('YYYY-MM-DD')
              data.expireDate = moment(await getData(apdu.expireDate),'YYYYMMDD').add(-543,'years').format('YYYY-MM-DD')
              data.address = await getData(apdu.address)
              
              logger.info('Reading photo data...')
              let photo: Buffer = Buffer.from([])
              for (let i = 0; i < apdu.photos.length; i++) {
                try {
                  let tempPhoto = await getPhoto(apdu.photos[i])
                  photo = Buffer.concat([photo, tempPhoto])
                  logger.debug(`Photo segment ${i + 1}/${apdu.photos.length} read`)
                } catch (error) {
                  logger.warn(`Failed to read photo segment ${i + 1}:`, error)
                  // Continue with other segments
                }
              }
              data.photoAsBase64Uri = photo.toString("base64")
              
              logger.info('Card data read successfully')
              that.eventEmitter.emit("READ_COMPLETE", data)
              reader.disconnect(reader.SCARD_LEAVE_CARD, ()=>{
                logger.info('read complete disconnect')
              })
            } catch (error) {
              const cardError = error as Error;
              
              // Enhanced error handling with PCSC error analysis
              if (PCSCErrorHandler.isProtocolMismatchError(cardError)) {
                logger.error('Card reading error (protocol mismatch):', cardError.message);
                const errorInfo = PCSCErrorHandler.analyzeError(cardError);
                that.eventEmitter.emit("READ_ERROR", errorInfo.userMessage);
              } else if (PCSCErrorHandler.isCitizenIdError(cardError)) {
                const errorInfo = PCSCErrorHandler.analyzeError(cardError);
                logger.error('Card reading error (citizen ID):', errorInfo.message);
                that.eventEmitter.emit("READ_ERROR", errorInfo.userMessage);
              } else {
                logger.error('Card reading error (general):', cardError.message);
                that.eventEmitter.emit("READ_ERROR", `Card reading failed: ${cardError.message}`);
              }
              
              reader.disconnect(reader.SCARD_LEAVE_CARD, ()=>{
                logger.info('error disconnect')
              })
            }
          }
        }
      })

      reader.on("end", () => {
        logger.info("Reader", reader.name, "removed")
      })
    })

    pcsc.on("error", (err) => {
      logger.error("PCSC error", err.message)
      this.eventEmitter.emit("READ_ERROR", err.message)
    })
  }
}

function delay(timeout : number) {
  return new Promise((resolve,reject)=>{
    setTimeout(() => {
      resolve(true)
    }, timeout);
  })
}

