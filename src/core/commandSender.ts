import { CARD_READER_CONFIG } from "../config/constants";
import { logger } from "../utils/logger";

export class CommandSender {
  static async sendRawCommand(
    reader: any,
    protocol: any,
    data: number[],
    readTimeout: number,
    retries: number = 2
  ): Promise<Buffer> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.transmitCommand(reader, protocol, data, readTimeout);
      } catch (error) {
        logger.warn(`Command failed, attempt ${attempt + 1}/${retries + 1}:`, (error as Error).message);
        if (attempt === retries) {
          throw error;
        }
        await this.delay(500);
      }
    }
    throw new Error('All command attempts failed');
  }

  private static transmitCommand(
    reader: any,
    protocol: any,
    data: number[],
    readTimeout: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, Math.max(readTimeout * 1000, CARD_READER_CONFIG.COMMAND_MIN_TIMEOUT));
      
      reader.transmit(
        Buffer.from(data),
        data[data.length - 1] + 2,
        protocol,
        (err: any, responseData: Buffer) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve(responseData);
          }
        }
      );
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}