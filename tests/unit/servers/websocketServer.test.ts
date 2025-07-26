import { WebSocketServerManager } from '../../../src/servers/websocketServer';
import { WebSocket } from 'ws';

// Mock dependencies
jest.mock('../../../src/thaiIdCardReader', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    setInsertCardDelay: jest.fn(),
    setReadTimeout: jest.fn(),
    onReadComplete: jest.fn(),
    onReadError: jest.fn()
  }));
});

jest.mock('../../../src/core/integrationManager', () => ({
  integrationManager: {
    validateMessage: jest.fn((data: string) => ({
      isValid: true,
      message: JSON.parse(data),
      integrationUsed: 'MEDHIS'
    }))
  }
}));

describe('WebSocketServerManager', () => {
  let serverManager: WebSocketServerManager;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    serverManager = new WebSocketServerManager();
    mockWebSocket = {
      send: jest.fn(),
      on: jest.fn(),
      close: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start WebSocket server on configured port', () => {
      const mockWss = {
        on: jest.fn()
      };
      
      // Mock WebSocketServer constructor
      const { WebSocketServer } = require('ws');
      WebSocketServer.mockImplementation(() => mockWss);

      serverManager.start();

      expect(WebSocketServer).toHaveBeenCalledWith({
        port: expect.any(Number)
      });
      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    it('should send welcome message on new connection', () => {
      // Access private method for testing
      const handleConnection = (serverManager as any).handleConnection.bind(serverManager);
      
      handleConnection(mockWebSocket);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: expect.stringContaining('connected') })
      );
    });

    it('should set up event listeners for WebSocket', () => {
      const handleConnection = (serverManager as any).handleConnection.bind(serverManager);
      
      handleConnection(mockWebSocket);

      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('handleMessage', () => {
    it('should process valid readsmartcard mode message', () => {
      const handleMessage = (serverManager as any).handleMessage.bind(serverManager);
      const testMessage = Buffer.from(JSON.stringify({ mode: 'readsmartcard' }));

      handleMessage(mockWebSocket, testMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: expect.stringContaining('ready') })
      );
    });

    it('should process startReading message type', () => {
      const handleMessage = (serverManager as any).handleMessage.bind(serverManager);
      const testMessage = Buffer.from(JSON.stringify({ type: 'startReading' }));

      handleMessage(mockWebSocket, testMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: expect.stringContaining('ready') })
      );
    });

    it('should process stopReading message type', () => {
      const handleMessage = (serverManager as any).handleMessage.bind(serverManager);
      const testMessage = Buffer.from(JSON.stringify({ type: 'stopReading' }));

      handleMessage(mockWebSocket, testMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: expect.stringContaining('stopped') })
      );
    });

    it('should handle unknown message type', () => {
      const handleMessage = (serverManager as any).handleMessage.bind(serverManager);
      const testMessage = Buffer.from(JSON.stringify({ type: 'unknown' }));

      handleMessage(mockWebSocket, testMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ error: expect.stringContaining('Unknown') })
      );
    });

    it('should handle invalid message validation', () => {
      // Mock validation to return invalid
      const { integrationManager } = require('../../../src/core/integrationManager');
      integrationManager.validateMessage.mockReturnValueOnce({
        isValid: false,
        error: 'Invalid message format'
      });

      const handleMessage = (serverManager as any).handleMessage.bind(serverManager);
      const testMessage = Buffer.from('invalid message');

      handleMessage(mockWebSocket, testMessage);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ error: 'Invalid message format' })
      );
    });
  });

  describe('startCardReading', () => {
    it('should initialize card reader for WebSocket connection', () => {
      const startCardReading = (serverManager as any).startCardReading.bind(serverManager);
      
      startCardReading(mockWebSocket);

      // Verify that a new card reader instance was created and configured
      const ThaiIDCardReader = require('../../../src/thaiIdCardReader');
      const mockInstance = ThaiIDCardReader.mock.results[0].value;
      
      expect(mockInstance.init).toHaveBeenCalled();
      expect(mockInstance.setInsertCardDelay).toHaveBeenCalled();
      expect(mockInstance.setReadTimeout).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should close WebSocket server', () => {
      const mockWss = {
        close: jest.fn(),
        on: jest.fn()
      };

      // Set up server instance
      (serverManager as any).wss = mockWss;

      serverManager.stop();

      expect(mockWss.close).toHaveBeenCalled();
      expect((serverManager as any).wss).toBeNull();
    });

    it('should handle stop when server is not running', () => {
      // Should not throw error when wss is null
      expect(() => serverManager.stop()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle WebSocket send errors gracefully', () => {
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('WebSocket send error');
      });

      const sendMessage = (serverManager as any).sendMessage.bind(serverManager);
      
      // Should not throw error
      expect(() => {
        sendMessage(mockWebSocket, { message: 'test' });
      }).not.toThrow();
    });
  });
});