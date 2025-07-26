import { MessageValidator } from '../../../src/utils/messageValidator';

// Mock IntegrationManager
jest.mock('../../../src/config/integrationConfig', () => ({
  IntegrationManager: jest.fn().mockImplementation(() => ({
    getEnabledIntegrations: jest.fn(() => [
      {
        name: 'MEDHIS',
        messageValidator: 'validateMedisMessage'
      }
    ])
  }))
}));

describe('MessageValidator', () => {
  describe('validateWebSocketMessage', () => {
    it('should validate correct WebSocket message', () => {
      const validMessage = JSON.stringify({
        type: 'startReading'
      });

      const result = MessageValidator.validateWebSocketMessage(validMessage);

      expect(result.isValid).toBe(true);
      expect(result.message).toEqual({ type: 'startReading' });
      expect(result.error).toBeUndefined();
    });

    it('should validate stopReading message', () => {
      const validMessage = JSON.stringify({
        type: 'stopReading'
      });

      const result = MessageValidator.validateWebSocketMessage(validMessage);

      expect(result.isValid).toBe(true);
      expect(result.message).toEqual({ type: 'stopReading' });
    });

    it('should reject invalid message type', () => {
      const invalidMessage = JSON.stringify({
        type: 'invalidType'
      });

      const result = MessageValidator.validateWebSocketMessage(invalidMessage);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid message type');
    });

    it('should reject non-string message type', () => {
      const invalidMessage = JSON.stringify({
        type: 123
      });

      const result = MessageValidator.validateWebSocketMessage(invalidMessage);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message type must be a string');
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      const result = MessageValidator.validateWebSocketMessage(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should reject non-object messages', () => {
      const arrayMessage = JSON.stringify(['array', 'message']);

      const result = MessageValidator.validateWebSocketMessage(arrayMessage);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message must be a JSON object');
    });

    it('should validate message with mode field', () => {
      const modeMessage = JSON.stringify({
        mode: 'readsmartcard'
      });

      const result = MessageValidator.validateWebSocketMessage(modeMessage);

      expect(result.isValid).toBe(true);
      expect(result.message).toEqual({ mode: 'readsmartcard' });
    });

    it('should reject non-string mode field', () => {
      const invalidMode = JSON.stringify({
        mode: 123
      });

      const result = MessageValidator.validateWebSocketMessage(invalidMode);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Mode must be a string');
    });
  });

  describe('validateMedisMessage', () => {
    it('should validate MEDHIS readsmartcard message', () => {
      const medisMessage = JSON.stringify({
        mode: 'readsmartcard'
      });

      const result = MessageValidator.validateMedisMessage(medisMessage);

      expect(result.isValid).toBe(true);
      expect(result.message).toEqual({ mode: 'readsmartcard' });
    });

    it('should fall back to standard validation for non-MEDHIS messages', () => {
      const standardMessage = JSON.stringify({
        type: 'startReading'
      });

      const result = MessageValidator.validateMedisMessage(standardMessage);

      expect(result.isValid).toBe(true);
      expect(result.message).toEqual({ type: 'startReading' });
    });

    it('should reject invalid JSON in MEDHIS validator', () => {
      const invalidJson = '{ invalid json }';

      const result = MessageValidator.validateMedisMessage(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });
  });

  describe('validateMessage', () => {
    it('should use integration-specific validator when available', () => {
      const medisMessage = JSON.stringify({
        mode: 'readsmartcard'
      });

      const result = MessageValidator.validateMessage(medisMessage);

      expect(result.isValid).toBe(true);
      expect(result.integrationUsed).toBe('MEDHIS');
    });

    it('should fall back to generic validation when integration fails', () => {
      const standardMessage = JSON.stringify({
        type: 'startReading'
      });

      const result = MessageValidator.validateMessage(standardMessage);

      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = MessageValidator.sanitizeString(input);
      expect(result).toBe('scriptalert("xss")/scriptHello');
    });

    it('should remove javascript: protocols', () => {
      const input = 'javascript:alert("xss")';
      const result = MessageValidator.sanitizeString(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss") Hello';
      const result = MessageValidator.sanitizeString(input);
      expect(result).toBe('alert("xss") Hello');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = MessageValidator.sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    it('should limit string length', () => {
      const input = 'a'.repeat(1500);
      const result = MessageValidator.sanitizeString(input);
      expect(result.length).toBe(1000);
    });

    it('should handle empty string', () => {
      const result = MessageValidator.sanitizeString('');
      expect(result).toBe('');
    });

    it('should handle multiple security threats', () => {
      const input = '  <script>javascript:alert("xss")</script> onclick=hack()  ';
      const result = MessageValidator.sanitizeString(input);
      expect(result).toBe('scriptalert("xss")/script');
    });
  });
});