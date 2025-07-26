/**
 * Mock PCSC implementation for testing
 */

export interface MockPCReader {
  name: string;
  state: number;
  SCARD_STATE_EMPTY: number;
  SCARD_STATE_PRESENT: number;
  SCARD_LEAVE_CARD: number;
  on: jest.MockedFunction<any>;
  disconnect: jest.MockedFunction<any>;
  connect: jest.MockedFunction<any>;
  transmit: jest.MockedFunction<any>;
}

export interface MockPCSC {
  on: jest.MockedFunction<any>;
  close: jest.MockedFunction<any>;
}

export const createMockPCReader = (name: string = 'Mock Card Reader'): MockPCReader => ({
  name,
  state: 0,
  SCARD_STATE_EMPTY: 1,
  SCARD_STATE_PRESENT: 2,
  SCARD_LEAVE_CARD: 0,
  on: jest.fn(),
  disconnect: jest.fn((disposition, callback) => {
    setTimeout(() => callback(null), 10);
  }),
  connect: jest.fn((options, callback) => {
    setTimeout(() => callback(null, 1), 10); // Protocol 1
  }),
  transmit: jest.fn((buffer, resLen, protocol, callback) => {
    // Mock successful APDU response
    const mockResponse = Buffer.from([0x90, 0x00]); // Success status
    setTimeout(() => callback(null, mockResponse), 10);
  })
});

export const createMockPCSC = (): MockPCSC => ({
  on: jest.fn(),
  close: jest.fn()
});

export const mockCardInsertionSequence = (reader: MockPCReader) => {
  // Simulate card insertion after a delay
  setTimeout(() => {
    const statusCallback = reader.on.mock.calls.find(call => call[0] === 'status')?.[1];
    if (statusCallback) {
      statusCallback({
        state: reader.SCARD_STATE_PRESENT
      });
    }
  }, 100);
};

export const mockCardRemovalSequence = (reader: MockPCReader) => {
  // Simulate card removal
  setTimeout(() => {
    const statusCallback = reader.on.mock.calls.find(call => call[0] === 'status')?.[1];
    if (statusCallback) {
      statusCallback({
        state: reader.SCARD_STATE_EMPTY
      });
    }
  }, 100);
};

export const mockPCSCError = (pcsc: MockPCSC, errorMessage: string) => {
  setTimeout(() => {
    const errorCallback = pcsc.on.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) {
      errorCallback(new Error(errorMessage));
    }
  }, 50);
};

export const mockReaderError = (reader: MockPCReader, errorMessage: string) => {
  setTimeout(() => {
    const errorCallback = reader.on.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) {
      errorCallback(new Error(errorMessage));
    }
  }, 50);
};

// Mock APDU responses for different card operations
export const mockAPDUResponses = {
  select: Buffer.from([0x90, 0x00]), // Success
  citizenID: Buffer.from([...Buffer.from('1234567890123', 'utf8'), 0x90, 0x00]),
  fullNameTH: Buffer.from([...Buffer.from('นาย สมชาย ใจดี', 'utf8'), 0x90, 0x00]),
  fullNameEN: Buffer.from([...Buffer.from('MR. SOMCHAI JAIDEE', 'utf8'), 0x90, 0x00]),
  dateOfBirth: Buffer.from([...Buffer.from('19900115', 'utf8'), 0x90, 0x00]),
  gender: Buffer.from([...Buffer.from('male', 'utf8'), 0x90, 0x00]),
  address: Buffer.from([...Buffer.from('123 หมู่ 5 ตำบลในเมือง', 'utf8'), 0x90, 0x00]),
  photo: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x90, 0x00]), // Mock JPEG header + success
  error: Buffer.from([0x6A, 0x82]) // File not found error
};

export const setupMockPCSCWithReader = () => {
  const mockPcsc = createMockPCSC();
  const mockReader = createMockPCReader();

  // Set up reader event when PCSC is initialized
  mockPcsc.on.mockImplementation((event, callback) => {
    if (event === 'reader') {
      setTimeout(() => callback(mockReader), 10);
    }
  });

  return { mockPcsc, mockReader };
};