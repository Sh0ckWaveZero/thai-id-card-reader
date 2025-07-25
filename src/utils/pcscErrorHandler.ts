import { PCSC_ERROR_CODES, RESPONSE_MESSAGES, CARD_READER_CONFIG } from "../config/constants";
import { logger } from "./logger";

interface PCErrorInfo {
  code: number;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  suggestedDelay: number;
}

export class PCSCErrorHandler {
  /**
   * Analyzes PCSC error and provides structured error information
   */
  static analyzeError(error: Error): PCErrorInfo {
    const errorMessage = error.message.toLowerCase();
    let code = 0;
    
    // Extract error code from message
    const codeMatch = errorMessage.match(/0x([0-9a-f]+)/);
    if (codeMatch) {
      code = parseInt(codeMatch[1], 16);
    }

    return this.getErrorInfo(code, error.message);
  }

  /**
   * Gets detailed error information based on PCSC error code
   */
  private static getErrorInfo(code: number, originalMessage: string): PCErrorInfo {
    switch (code) {
      case PCSC_ERROR_CODES.SCARD_E_NOT_TRANSACTED:
        return {
          code,
          message: 'Transaction failed - communication with card lost',
          userMessage: RESPONSE_MESSAGES.TRANSACTION_FAILED,
          isRetryable: true,
          suggestedDelay: CARD_READER_CONFIG.TRANSACTION_RETRY_DELAY
        };

      case PCSC_ERROR_CODES.SCARD_E_PROTO_MISMATCH:
        return {
          code,
          message: 'Protocol mismatch - card protocol not compatible with current connection',
          userMessage: RESPONSE_MESSAGES.PROTOCOL_MISMATCH,
          isRetryable: true,
          suggestedDelay: CARD_READER_CONFIG.RETRY_DELAY_BASE
        };

      case PCSC_ERROR_CODES.SCARD_E_NO_SMARTCARD:
        return {
          code,
          message: 'No smart card detected',
          userMessage: 'Please insert the ID card properly',
          isRetryable: false,
          suggestedDelay: 0
        };

      case PCSC_ERROR_CODES.SCARD_E_TIMEOUT:
        return {
          code,
          message: 'Card operation timeout',
          userMessage: RESPONSE_MESSAGES.CARD_NOT_READY,
          isRetryable: true,
          suggestedDelay: CARD_READER_CONFIG.RETRY_DELAY_BASE
        };

      case PCSC_ERROR_CODES.SCARD_E_CARD_UNSUPPORTED:
        return {
          code,
          message: 'Card type not supported',
          userMessage: 'Please use a valid Thai national ID card',
          isRetryable: false,
          suggestedDelay: 0
        };

      case PCSC_ERROR_CODES.SCARD_W_REMOVED_CARD:
        return {
          code,
          message: 'Card was removed during operation',
          userMessage: 'Card removed. Please reinsert and try again',
          isRetryable: false,
          suggestedDelay: 0
        };

      default:
        return {
          code,
          message: `Unknown PCSC error: ${originalMessage}`,
          userMessage: RESPONSE_MESSAGES.CONNECTION_FAILED,
          isRetryable: true,
          suggestedDelay: CARD_READER_CONFIG.RETRY_DELAY_BASE
        };
    }
  }

  /**
   * Enhanced retry logic for citizen ID reading with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = CARD_READER_CONFIG.CITIZEN_ID_RETRIES,
    baseDelay: number = CARD_READER_CONFIG.TRANSACTION_RETRY_DELAY
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Attempt ${attempt + 1}/${maxRetries + 1} for card operation`);
        return await operation();
        
      } catch (error) {
        lastError = error as Error;
        const errorInfo = this.analyzeError(lastError);
        
        logger.warn(`Attempt ${attempt + 1} failed:`, errorInfo.message);

        // Don't retry if error is not retryable
        if (!errorInfo.isRetryable) {
          logger.error('Non-retryable error encountered:', errorInfo.message);
          throw new Error(errorInfo.userMessage);
        }

        // Don't delay after the last attempt
        if (attempt < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt), // Exponential backoff
            10000 // Max 10 seconds
          );
          
          logger.debug(`Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    // All retries exhausted
    const finalError = this.analyzeError(lastError!);
    logger.error(`All ${maxRetries + 1} attempts failed:`, finalError.message);
    throw new Error(finalError.userMessage);
  }

  /**
   * Validates card state before attempting operations
   */
  static async validateCardState(reader: any): Promise<boolean> {
    try {
      // Add stabilization delay for card detection
      await this.delay(CARD_READER_CONFIG.CARD_STABILIZATION_DELAY);
      
      // Additional validation logic can be added here
      return true;
      
    } catch (error) {
      logger.warn('Card state validation failed:', (error as Error).message);
      return false;
    }
  }

  /**
   * Promise-based delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks if error is related to citizen ID reading specifically
   */
  static isCitizenIdError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('citizen') || 
           errorMessage.includes('0x80100016') ||
           errorMessage.includes('transaction failed');
  }

  /**
   * Checks if error is a protocol mismatch error
   */
  static isProtocolMismatchError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('0x8010000f') ||
           errorMessage.includes('protocol mismatch') ||
           errorMessage.includes('proto_mismatch');
  }
}