import PCSC from "pcsclite"
import EventEmitter from "events"
import { apdu } from "./apdu/apdu"
import moment from 'moment'
import { SmartCardReturnData } from "./types"
import { DataTransformer } from "./utils/dataTransformer"
import { CardReaderConnection } from "./core/cardReaderConnection"
import { CommandSender } from "./core/commandSender"
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
    const pcsc = PCSC()
    pcsc.on("reader", function (reader) {
      logger.info("New reader detected", reader.name)

      reader.on("error", function (err) {
        logger.error("Error(", this.name, "):", err.message)
      })

      reader.on("status", async function (status) {
        logger.debug("Status(", this.name, "):", status)
       
        var changes = this.state ^ status.state
        if (changes) {
          if (
            changes & this.SCARD_STATE_EMPTY &&
            status.state & this.SCARD_STATE_EMPTY
          ) {
            logger.info("card removed")
            reader.disconnect(reader.SCARD_LEAVE_CARD, function (err) {
              if (err) {
                logger.error(err)
              } else {
                logger.info("Disconnected")
              }
            })
          } else if (
            changes & this.SCARD_STATE_PRESENT &&
            status.state & this.SCARD_STATE_PRESENT
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

            const sendRawCommand = async (data: number[], retries = 2): Promise<Buffer> => {
              return CommandSender.sendRawCommand(reader, protocol, data, that.readTimeout, retries)
            }

            try {
              logger.info('Selecting card application...')
              await sendRawCommand(apdu.select)
              logger.info('Card application selected successfully')
              
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
              
              try {
                data.citizenID = await getData(apdu.citizenID)
                logger.info('Citizen ID read successfully')
              } catch (error) {
                logger.error('Failed to read citizen ID:', error)
                throw new Error('Failed to read citizen ID')
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
              reader.disconnect(()=>{
                logger.info('read complete disconnect')
              })
            } catch (error) {
              logger.error('Card reading error:', error)
              that.eventEmitter.emit("READ_ERROR", `Card reading failed: ${(error as Error).message}`)
              reader.disconnect(()=>{
                logger.info('error disconnect')
              })
            }
          }
        }
      })

      reader.on("end", function () {
        logger.info("Reader", this.name, "removed")
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

