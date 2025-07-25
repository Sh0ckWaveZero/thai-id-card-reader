import { CARD_READER_CONFIG } from "../config/constants";
import { ConnectionMode } from "../types";
import { logger } from "../utils/logger";

export class CardReaderConnection {
  private static readonly CONNECTION_MODES: ConnectionMode[] = [
    'SCARD_SHARE_SHARED',
    'SCARD_SHARE_EXCLUSIVE',
    'SCARD_SHARE_DIRECT'
  ];

  static async attemptConnection(reader: any): Promise<{ connected: boolean; protocol: any }> {
    let connected = false;
    let protocol: any = null;

    for (const mode of this.CONNECTION_MODES) {
      const result = await this.tryConnectionMode(reader, mode);
      if (result.connected) {
        connected = true;
        protocol = result.protocol;
        break;
      }
    }

    return { connected, protocol };
  }

  private static async tryConnectionMode(reader: any, mode: ConnectionMode): Promise<{ connected: boolean; protocol: any }> {
    const scardMode = this.getScardMode(reader, mode);
    
    for (let retry = 0; retry < CARD_READER_CONFIG.MAX_RETRIES; retry++) {
      try {
        logger.info(`Attempting connection with mode ${mode}, retry ${retry + 1}/${CARD_READER_CONFIG.MAX_RETRIES}`);
        
        if (retry > 0) {
          await this.delay(CARD_READER_CONFIG.RETRY_DELAY_BASE * retry);
        }
        
        const protocol = await this.connectWithTimeout(reader, scardMode);
        logger.info(`Connected successfully with mode ${mode}`);
        return { connected: true, protocol };
        
      } catch (error) {
        logger.warn(`Mode ${mode}, retry ${retry + 1} failed:`, (error as Error).message);
        if (retry === CARD_READER_CONFIG.MAX_RETRIES - 1) {
          logger.warn(`All retries exhausted for mode ${mode}`);
        }
      }
    }
    
    return { connected: false, protocol: null };
  }

  private static getScardMode(reader: any, mode: ConnectionMode): any {
    switch (mode) {
      case 'SCARD_SHARE_SHARED':
        return reader.SCARD_SHARE_SHARED;
      case 'SCARD_SHARE_EXCLUSIVE':
        return reader.SCARD_SHARE_EXCLUSIVE;
      case 'SCARD_SHARE_DIRECT':
        return reader.SCARD_SHARE_DIRECT;
    }
  }

  private static connectWithTimeout(reader: any, shareMode: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, CARD_READER_CONFIG.CONNECTION_TIMEOUT);
      
      reader.connect({ share_mode: shareMode }, (err: any, protocol: any) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve(protocol);
        }
      });
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}