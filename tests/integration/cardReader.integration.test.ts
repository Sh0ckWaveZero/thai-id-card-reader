import ThaiIDCardReader from '../../src/thaiIdCardReader';
import { SmartCardReturnData } from '../../src/types';

// Mock PCSC at a higher level for integration tests
jest.mock('pcsclite');

describe('Thai ID Card Reader Integration', () => {
  let cardReader: ThaiIDCardReader;
  
  beforeEach(() => {
    cardReader = new ThaiIDCardReader();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Card Reader Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        cardReader.init();
      }).not.toThrow();
    });

    it('should set default timeout values', () => {
      expect(() => {
        cardReader.setReadTimeout(5000);
        cardReader.setInsertCardDelay(1000);
      }).not.toThrow();
    });
  });

  describe('Event Handler Registration', () => {
    it('should register onReadComplete callback', () => {
      const mockCallback = jest.fn();
      
      expect(() => {
        cardReader.onReadComplete(mockCallback);
      }).not.toThrow();
    });

    it('should register onReadError callback', () => {
      const mockCallback = jest.fn();
      
      expect(() => {
        cardReader.onReadError(mockCallback);
      }).not.toThrow();
    });

    it('should handle multiple callback registrations', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      expect(() => {
        cardReader.onReadComplete(callback1);
        cardReader.onReadComplete(callback2);
        cardReader.onReadError(callback1);
        cardReader.onReadError(callback2);
      }).not.toThrow();
    });
  });

  describe('Card Reading Simulation', () => {
    it('should emit read complete event with processed data', (done) => {
      const mockCardData: SmartCardReturnData = {
        citizenID: '1234567890123',
        titleTH: 'นาย',
        titleEN: 'MR.',
        fullNameTH: 'นาย สมชาย ใจดี',
        fullNameEN: 'MR. SOMCHAI JAIDEE',
        firstNameTH: 'สมชาย',
        firstNameEN: 'SOMCHAI',
        lastNameTH: 'ใจดี',
        lastNameEN: 'JAIDEE',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        address: '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง',
        cardIssuer: 'Department of Provincial Administration',
        issueDate: '2020-01-01',
        expireDate: '2030-01-01',
        photoAsBase64Uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA=='
      };

      cardReader.onReadComplete((data) => {
        expect(data).toBeDefined();
        expect(data.citizenID).toBe('1234567890123');
        expect(data.firstNameTH).toBe('สมชาย');
        expect(data.lastNameTH).toBe('ใจดี');
        expect(data.titleTH).toBe('นาย');
        done();
      });

      // Manually trigger the event for testing
      (cardReader as any).eventEmitter.emit('READ_COMPLETE', mockCardData);
    });

    it('should emit read error event', (done) => {
      const expectedError = 'Card reading failed';

      cardReader.onReadError((error) => {
        expect(error).toBe(expectedError);
        done();
      });

      // Manually trigger the error event for testing
      (cardReader as any).eventEmitter.emit('READ_ERROR', expectedError);
    });
  });

  describe('Configuration Management', () => {
    it('should maintain timeout configurations', () => {
      const readTimeout = 8000;
      const insertDelay = 2000;

      cardReader.setReadTimeout(readTimeout);
      cardReader.setInsertCardDelay(insertDelay);

      // Access private properties for verification
      expect((cardReader as any).readTimeout).toBe(readTimeout);
      expect((cardReader as any).insertCardDelay).toBe(insertDelay);
    });
  });

  describe('Error Handling', () => {
    it('should handle PCSC initialization errors gracefully', () => {
      const mockPCSC = require('pcsclite');
      const mockInstance = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            // Simulate PCSC error
            setTimeout(() => callback(new Error('PCSC initialization failed')), 10);
          }
        })
      };
      mockPCSC.mockReturnValue(mockInstance);

      const errorCallback = jest.fn();
      cardReader.onReadError(errorCallback);

      cardReader.init();

      // Wait for async error handling
      setTimeout(() => {
        expect(errorCallback).toHaveBeenCalledWith('PCSC initialization failed');
      }, 50);
    });
  });

  describe('Memory Management', () => {
    it('should not leak event listeners', () => {
      const initialListenerCount = (cardReader as any).eventEmitter.listenerCount('READ_COMPLETE');
      
      // Add multiple listeners
      for (let i = 0; i < 5; i++) {
        cardReader.onReadComplete(() => {});
      }

      const finalListenerCount = (cardReader as any).eventEmitter.listenerCount('READ_COMPLETE');
      expect(finalListenerCount).toBe(initialListenerCount + 5);
    });
  });
});