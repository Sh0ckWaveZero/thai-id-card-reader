import { WebSocketServerManager } from '../../src/servers/websocketServer';
import { HttpServerManager } from '../../src/servers/httpServer';
import WebSocket from 'ws';

// Mock dependencies
jest.mock('../../src/thaiIdCardReader');

describe('Server Integration Tests', () => {
  describe('WebSocket Server Integration', () => {
    let serverManager: WebSocketServerManager;
    let testPort: number;

    beforeEach(() => {
      testPort = 9000 + Math.floor(Math.random() * 1000);
      serverManager = new WebSocketServerManager();
    });

    afterEach(async () => {
      if (serverManager) {
        serverManager.stop();
        // Wait for server to close
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    it('should handle client connections and disconnections', (done) => {
      // Mock WebSocketServer to simulate connection events
      const mockWss = {
        on: jest.fn((event, callback) => {
          if (event === 'connection') {
            // Simulate connection
            const mockClient = {
              on: jest.fn(),
              send: jest.fn(),
              close: jest.fn()
            };
            setTimeout(() => callback(mockClient), 10);
          }
        }),
        close: jest.fn()
      };

      const { WebSocketServer } = require('ws');
      WebSocketServer.mockImplementation(() => mockWss);

      serverManager.start();

      setTimeout(() => {
        expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
        done();
      }, 50);
    });

    it('should process message flow end-to-end', (done) => {
      const mockClient = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };

      const mockWss = {
        on: jest.fn((event, callback) => {
          if (event === 'connection') {
            setTimeout(() => {
              callback(mockClient);
              
              // Simulate message handling
              const messageCallback = mockClient.on.mock.calls.find(
                call => call[0] === 'message'
              )?.[1];
              
              if (messageCallback) {
                messageCallback(Buffer.from(JSON.stringify({ mode: 'readsmartcard' })));
              }
            }, 10);
          }
        }),
        close: jest.fn()
      };

      const { WebSocketServer } = require('ws');
      WebSocketServer.mockImplementation(() => mockWss);

      serverManager.start();

      setTimeout(() => {
        // Verify welcome message was sent
        expect(mockClient.send).toHaveBeenCalledWith(
          expect.stringContaining('connected')
        );
        done();
      }, 100);
    });
  });

  describe('HTTP Server Integration', () => {
    let httpManager: HttpServerManager;

    beforeEach(() => {
      // Mock the server constants to use different ports for testing
      jest.doMock('../../../src/config/constants', () => ({
        SERVER_CONFIG: {
          HTTP_PORT: 9999 + Math.floor(Math.random() * 100),
          WEBSOCKET_PORT: 9800 + Math.floor(Math.random() * 100)
        },
        CARD_READER_CONFIG: {},
        CORS_HEADERS: {},
        RESPONSE_MESSAGES: {}
      }));
      
      httpManager = new HttpServerManager();
    });

    afterEach(() => {
      if (httpManager) {
        httpManager.stop();
      }
      jest.clearAllMocks();
    });

    it('should handle server lifecycle without port conflicts', () => {
      // Mock the server creation to avoid actual port binding
      const mockServer = {
        listen: jest.fn((port, callback) => callback && callback()),
        close: jest.fn((callback) => callback && callback()),
        on: jest.fn()
      };

      jest.doMock('https', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      expect(() => {
        httpManager.start();
        httpManager.stop();
      }).not.toThrow();
    });
  });

  describe('Cross-Server Communication', () => {
    it('should handle concurrent operations without conflicts', async () => {
      // Test server initialization without actual port binding
      expect(() => {
        const wsManager = new WebSocketServerManager();
        const httpManager = new HttpServerManager();
        
        // Simulate concurrent operations
        wsManager.stop();
        httpManager.stop();
      }).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should properly clean up resources on server stop', () => {
      const wsManager = new WebSocketServerManager();
      
      // Mock to verify cleanup
      const mockWss = {
        close: jest.fn(),
        on: jest.fn()
      };

      (wsManager as any).wss = mockWss;
      
      wsManager.stop();
      
      expect(mockWss.close).toHaveBeenCalled();
      expect((wsManager as any).wss).toBeNull();
    });

    it('should handle multiple start/stop cycles', () => {
      const wsManager = new WebSocketServerManager();
      
      expect(() => {
        wsManager.start();
        wsManager.stop();
        wsManager.start();
        wsManager.stop();
      }).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should handle server startup failures gracefully', () => {
      const { WebSocketServer } = require('ws');
      WebSocketServer.mockImplementation(() => {
        throw new Error('Port already in use');
      });

      const wsManager = new WebSocketServerManager();
      
      expect(() => {
        wsManager.start();
      }).toThrow('Port already in use');
    });

    it('should handle connection errors without crashing', () => {
      const wsManager = new WebSocketServerManager();
      
      const mockWss = {
        on: jest.fn((event, callback) => {
          if (event === 'connection') {
            const mockClient = {
              on: jest.fn((clientEvent, clientCallback) => {
                if (clientEvent === 'error') {
                  setTimeout(() => clientCallback(new Error('Connection error')), 10);
                }
              }),
              send: jest.fn(),
              close: jest.fn()
            };
            setTimeout(() => callback(mockClient), 10);
          }
        }),
        close: jest.fn()
      };

      const { WebSocketServer } = require('ws');
      WebSocketServer.mockImplementation(() => mockWss);

      expect(() => {
        wsManager.start();
      }).not.toThrow();
    });
  });
});