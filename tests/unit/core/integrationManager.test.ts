import { integrationManager } from '../../../src/core/integrationManager';

describe('IntegrationManager', () => {
  beforeEach(() => {
    // Reset any cached state
    jest.clearAllMocks();
  });

  describe('validateMessage', () => {
    it('should handle no active integrations', () => {
      const testMessage = '{"mode":"readsmartcard"}';
      
      const result = integrationManager.validateMessage(testMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No active integrations available');
    });

    it('should handle invalid messages gracefully', () => {
      const invalidMessage = 'invalid json';
      
      const result = integrationManager.validateMessage(invalidMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return metadata for failed validation', () => {
      const testMessage = '{"unknown":"format"}';
      
      const result = integrationManager.validateMessage(testMessage);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.messageLength).toBe(testMessage.length);
    });
  });

  describe('getActiveIntegrations', () => {
    it('should return active integration names', () => {
      const activeIntegrations = integrationManager.getActiveIntegrations();
      
      expect(Array.isArray(activeIntegrations)).toBe(true);
      // Initially no integrations are registered
      expect(activeIntegrations).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', () => {
      // Test with various invalid message formats
      const testCases = [
        '',
        '{}',
        '{"invalid": true}',
        'not json at all',
        '[]'
      ];

      testCases.forEach(testMessage => {
        expect(() => {
          const result = integrationManager.validateMessage(testMessage);
          expect(result.isValid).toBe(false);
        }).not.toThrow();
      });
    });

    it('should handle empty message gracefully', () => {
      const result = integrationManager.validateMessage('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});