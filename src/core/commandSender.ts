import { CARD_READER_CONFIG } from "../config/constants";
import { PCReader, PCProtocol } from "../types";
import { PCSCErrorHandler } from "../utils/pcscErrorHandler";
import { logger } from "../utils/logger";

export class CommandSender {
  static async sendRawCommand(
    reader: PCReader,
    protocol: PCProtocol,
    data: number[],
    readTimeout: number,
    retries: number = 2
  ): Promise<Buffer> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.transmitCommand(reader, protocol, data, readTimeout);
      } catch (error) {
        const err = error as Error;
        
        // Check for protocol mismatch during command transmission
        if (PCSCErrorHandler.isProtocolMismatchError(err)) {
          logger.warn(`Protocol mismatch during command, attempt ${attempt + 1}/${retries + 1}:`, err.message);
          // For protocol mismatch, wait longer before retry to allow protocol reset
          if (attempt < retries) {
            await this.delay(2000); // Longer delay for protocol issues
          }
        } else {
          logger.warn(`Command failed, attempt ${attempt + 1}/${retries + 1}:`, err.message);
          if (attempt < retries) {
            await this.delay(500);
          }
        }
        
        if (attempt === retries) {
          throw error;
        }
      }
    }
    throw new Error('All command attempts failed');
  }

  private static transmitCommand(
    reader: PCReader,
    protocol: PCProtocol,
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
        (err: Error | null, responseData?: Buffer) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else if (responseData) {
            resolve(responseData);
          } else {
            reject(new Error('Transmission successful but no response data received'));
          }
        }
      );
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}