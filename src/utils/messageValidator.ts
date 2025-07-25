import { WebSocketMessage } from "../types";

interface ValidationResult {
  isValid: boolean;
  message?: WebSocketMessage;
  error?: string;
}

export class MessageValidator {
  /**
   * Validates and parses WebSocket message JSON
   */
  static validateWebSocketMessage(data: string): ValidationResult {
    try {
      const parsed = JSON.parse(data);
      
      // Check if it's an object
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
          isValid: false,
          error: 'Message must be a JSON object'
        };
      }

      // Validate message structure
      const validationError = this.validateMessageStructure(parsed);
      if (validationError) {
        return {
          isValid: false,
          error: validationError
        };
      }

      return {
        isValid: true,
        message: parsed as WebSocketMessage
      };
      
    } catch (e) {
      return {
        isValid: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Validates the structure of a WebSocket message
   */
  private static validateMessageStructure(obj: any): string | null {
    // Check for valid message types
    if (obj.type !== undefined) {
      if (typeof obj.type !== 'string') {
        return 'Message type must be a string';
      }
      
      const validTypes = ['startReading', 'stopReading'];
      if (!validTypes.includes(obj.type)) {
        return `Invalid message type. Must be one of: ${validTypes.join(', ')}`;
      }
    }

    // Check for mode (MEDHIS compatibility)
    if (obj.mode !== undefined && typeof obj.mode !== 'string') {
      return 'Mode must be a string';
    }

    // Check for message field
    if (obj.message !== undefined && typeof obj.message !== 'string') {
      return 'Message field must be a string';
    }

    // Check for error field
    if (obj.error !== undefined && typeof obj.error !== 'string') {
      return 'Error field must be a string';
    }

    return null; // No validation errors
  }

  /**
   * Validates MEDHIS-style messages (for backward compatibility)
   */
  static validateMedisMessage(data: string): ValidationResult {
    try {
      const parsed = JSON.parse(data);
      
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {
          isValid: false,
          error: 'Message must be a JSON object'
        };
      }

      // Check for MEDHIS readsmartcard mode
      if (parsed.mode === 'readsmartcard') {
        return {
          isValid: true,
          message: { mode: 'readsmartcard' } as WebSocketMessage
        };
      }

      // Fall back to standard validation
      return this.validateWebSocketMessage(data);
      
    } catch (e) {
      return {
        isValid: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Sanitizes string input to prevent potential injection attacks
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }
}