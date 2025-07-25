import { CARD_READER_CONFIG, PROTOCOL_STRATEGIES } from "../config/constants";
import { ConnectionMode, PCReader, PCProtocol, ConnectionResult } from "../types";
import { PCSCErrorHandler } from "../utils/pcscErrorHandler";
import { logger } from "../utils/logger";

export class CardReaderConnection {
  private static readonly CONNECTION_MODES: ConnectionMode[] = [
    'SCARD_SHARE_SHARED',
    'SCARD_SHARE_EXCLUSIVE',
    'SCARD_SHARE_DIRECT'
  ];

  static async attemptConnection(reader: PCReader): Promise<ConnectionResult> {
    let connected = false;
    let protocol: PCProtocol | null = null;

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

  /**
   * Reconnects with protocol handling for protocol mismatch errors
   */
  static async reconnectWithProtocolHandling(reader: PCReader): Promise<ConnectionResult> {
    logger.info('Attempting reconnection with protocol handling...');
    
    // Disconnect first to reset connection state
    try {
      reader.disconnect(reader.SCARD_LEAVE_CARD, () => {
        logger.debug('Disconnected for protocol reset');
      });
      
      // Brief delay to allow card to reset
      await this.delay(PROTOCOL_STRATEGIES.PROTOCOL_RETRY_DELAY);
      
    } catch (error) {
      logger.warn('Disconnect during protocol reset failed:', (error as Error).message);
    }

    // Try connection with different approaches
    for (let protocolAttempt = 0; protocolAttempt < PROTOCOL_STRATEGIES.MAX_PROTOCOL_RETRIES; protocolAttempt++) {
      logger.info(`Protocol reconnection attempt ${protocolAttempt + 1}/${PROTOCOL_STRATEGIES.MAX_PROTOCOL_RETRIES}`);
      
      const result = await this.attemptConnection(reader);
      if (result.connected) {
        logger.info('Successfully reconnected with compatible protocol');
        return result;
      }
      
      if (protocolAttempt < PROTOCOL_STRATEGIES.MAX_PROTOCOL_RETRIES - 1) {
        await this.delay(PROTOCOL_STRATEGIES.PROTOCOL_RETRY_DELAY);
      }
    }

    logger.error('Failed to reconnect with compatible protocol');
    return { connected: false, protocol: null };
  }

  private static async tryConnectionMode(reader: PCReader, mode: ConnectionMode): Promise<ConnectionResult> {
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
        const err = error as Error;
        
        // Check if it's a protocol mismatch error
        if (PCSCErrorHandler.isProtocolMismatchError(err)) {
          logger.warn(`Protocol mismatch in mode ${mode}, retry ${retry + 1}:`, err.message);
          // For protocol mismatch, try reconnecting with protocol handling
          if (retry === CARD_READER_CONFIG.MAX_RETRIES - 1) {
            logger.info('Attempting protocol reconnection...');
            const reconnectResult = await this.reconnectWithProtocolHandling(reader);
            if (reconnectResult.connected) {
              return reconnectResult;
            }
          }
        } else {
          logger.warn(`Mode ${mode}, retry ${retry + 1} failed:`, err.message);
        }
        
        if (retry === CARD_READER_CONFIG.MAX_RETRIES - 1) {
          logger.warn(`All retries exhausted for mode ${mode}`);
        }
      }
    }
    
    return { connected: false, protocol: null };
  }

  private static getScardMode(reader: PCReader, mode: ConnectionMode): number {
    switch (mode) {
      case 'SCARD_SHARE_SHARED':
        return reader.SCARD_SHARE_SHARED;
      case 'SCARD_SHARE_EXCLUSIVE':
        return reader.SCARD_SHARE_EXCLUSIVE;
      case 'SCARD_SHARE_DIRECT':
        return reader.SCARD_SHARE_DIRECT;
    }
  }

  private static connectWithTimeout(reader: PCReader, shareMode: number): Promise<PCProtocol> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, CARD_READER_CONFIG.CONNECTION_TIMEOUT);
      
      reader.connect({ share_mode: shareMode }, (err: Error | null, protocol?: PCProtocol) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else if (protocol) {
          resolve(protocol);
        } else {
          reject(new Error('Connection successful but no protocol returned'));
        }
      });
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}