/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

// Mock pcsclite module to prevent hardware dependency in tests
jest.mock('pcsclite', () => {
  const mockPcsc = jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }));
  return mockPcsc;
});

// Mock ws (WebSocket) module
jest.mock('ws', () => ({
  WebSocketServer: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn()
  })),
  WebSocket: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn()
  }))
}));

// Mock legacy-encoding
jest.mock('legacy-encoding', () => ({
  decode: jest.fn((buffer: Buffer, encoding: string) => {
    return buffer.toString('utf8');
  })
}));

// Mock console methods to prevent log spam during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(10000);