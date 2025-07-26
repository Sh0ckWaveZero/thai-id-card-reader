import { DataTransformer } from '../../../src/utils/dataTransformer';
import { SmartCardReturnData } from '../../../src/types';

// Mock AddressParser
jest.mock('../../../src/utils/addressParser', () => ({
  AddressParser: {
    parseAddress: jest.fn((address: string) => ({
      houseNumber: '123',
      villageNumber: '5',
      tambol: 'ตำบลในเมือง',
      amphur: 'อำเภอเมือง'
    }))
  }
}));

describe('DataTransformer', () => {
  describe('smartCardToMedis', () => {
    it('should transform complete smart card data to MEDIS format', () => {
      const smartCardData: Partial<SmartCardReturnData> = {
        citizenID: '1234567890123',
        firstNameTH: 'สมชาย',
        lastNameTH: 'ใจดี',
        titleTH: 'นาย',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        address: '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง',
        photoAsBase64Uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA=='
      };

      const result = DataTransformer.smartCardToMedis(smartCardData);

      expect(result).toEqual({
        mode: 'readsmartcard',
        Citizenid: '1234567890123',
        Th_Firstname: 'สมชาย',
        Th_Middlename: null,
        Th_Lastname: 'ใจดี',
        Th_Prefix: 'นาย',
        Birthday: '1990/01/15',
        Sex: 1,
        Address: '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง',
        addrHouseNo: '123',
        addrVillageNo: '5',
        addrTambol: 'ตำบลในเมือง',
        addrAmphur: 'อำเภอเมือง',
        PhotoRaw: '/9j/4AAQSkZJRgABAQEAAA=='
      });
    });

    it('should handle female gender correctly', () => {
      const smartCardData: Partial<SmartCardReturnData> = {
        gender: 'female'
      };

      const result = DataTransformer.smartCardToMedis(smartCardData);
      expect(result.Sex).toBe(2);
    });

    it('should handle missing data gracefully', () => {
      const smartCardData: Partial<SmartCardReturnData> = {};

      const result = DataTransformer.smartCardToMedis(smartCardData);

      expect(result).toEqual({
        mode: 'readsmartcard',
        Citizenid: '',
        Th_Firstname: '',
        Th_Middlename: null,
        Th_Lastname: '',
        Th_Prefix: '',
        Birthday: '',
        Sex: 2, // Default to female when no gender provided
        Address: '',
        addrHouseNo: '123',
        addrVillageNo: '5',
        addrTambol: 'ตำบลในเมือง',
        addrAmphur: 'อำเภอเมือง',
        PhotoRaw: ''
      });
    });

    it('should handle photo without data prefix', () => {
      const smartCardData: Partial<SmartCardReturnData> = {
        photoAsBase64Uri: '/9j/4AAQSkZJRgABAQEAAA=='
      };

      const result = DataTransformer.smartCardToMedis(smartCardData);
      expect(result.PhotoRaw).toBe('/9j/4AAQSkZJRgABAQEAAA==');
    });
  });

  describe('removeJunk', () => {
    it('should remove hash symbols and normalize spaces', () => {
      const input = 'Text#with#hash#symbols';
      const result = DataTransformer.removeJunk(input);
      expect(result).toBe('Text with hash symbols');
    });

    it('should replace null bytes with spaces', () => {
      const input = 'Text\x00with\x00nulls';
      const result = DataTransformer.removeJunk(input);
      expect(result).toBe('Text with nulls');
    });

    it('should trim whitespace', () => {
      const input = '  Text with spaces  ';
      const result = DataTransformer.removeJunk(input);
      expect(result).toBe('Text with spaces');
    });

    it('should handle multiple junk characters', () => {
      const input = '##Text#\x00with\x00various##junk##';
      const result = DataTransformer.removeJunk(input);
      expect(result).toBe('  Text  with various  junk');
    });

    it('should handle empty string', () => {
      const result = DataTransformer.removeJunk('');
      expect(result).toBe('');
    });
  });

  describe('processSmartCardData', () => {
    it('should process and clean smart card data', () => {
      const rawData: SmartCardReturnData = {
        citizenID: '1234567890123',
        titleTH: 'นาย',
        titleEN: 'MR.',
        fullNameTH: 'นาย#สมชาย##ใจดี',
        fullNameEN: 'MR.#SOMCHAI##JAIDEE',
        firstNameTH: 'สมชาย',
        firstNameEN: 'SOMCHAI',
        lastNameTH: 'ใจดี',
        lastNameEN: 'JAIDEE',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        address: '123 หมู่ 5#ตำบลในเมือง',
        cardIssuer: 'Department of Provincial Administration',
        issueDate: '2020-01-01',
        expireDate: '2030-01-01',
        photoAsBase64Uri: '/9j/4AAQSkZJRgABAQEAAA=='
      };

      const result = DataTransformer.processSmartCardData(rawData);

      expect(result.citizenID).toBe('1234567890123');
      expect(result.titleTH).toBe('นาย');
      expect(result.firstNameTH).toBe('สมชาย');
      expect(result.lastNameTH).toBe('ใจดี');
      expect(result.address).toBe('123 หมู่ 5 ตำบลในเมือง');
    });

    it('should handle gender conversion', () => {
      const rawData: SmartCardReturnData = {
        citizenID: '1234567890123',
        titleTH: 'นางสาว',
        titleEN: 'MISS',
        fullNameTH: 'นางสาว#สมหญิง##ใจดี',
        fullNameEN: 'MISS#SOMYING##JAIDEE',
        firstNameTH: 'สมหญิง',
        firstNameEN: 'SOMYING',
        lastNameTH: 'ใจดี',
        lastNameEN: 'JAIDEE',
        dateOfBirth: '1995-05-20',
        gender: '1' as any, // Raw data has gender as string
        address: '456 ตำบลบางนา',
        cardIssuer: 'Department of Provincial Administration',
        issueDate: '2021-01-01',
        expireDate: '2031-01-01',
        photoAsBase64Uri: ''
      };

      const result = DataTransformer.processSmartCardData(rawData);

      expect(result.gender).toBe('male'); // '1' -> 'male'
      expect(result.titleTH).toBe('นางสาว');
      expect(result.firstNameTH).toBe('สมหญิง');
      expect(result.lastNameTH).toBe('ใจดี');
    });

    it('should add photo data prefix', () => {
      const rawData: SmartCardReturnData = {
        citizenID: '1234567890123',
        titleTH: 'นาย',
        titleEN: 'MR.',
        fullNameTH: 'นาย#สมชาย##ใจดี',
        fullNameEN: 'MR.#SOMCHAI##JAIDEE',
        firstNameTH: 'สมชาย',
        firstNameEN: 'SOMCHAI',
        lastNameTH: 'ใจดี',
        lastNameEN: 'JAIDEE',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        address: '123 หมู่ 5',
        cardIssuer: 'Department of Provincial Administration',
        issueDate: '2020-01-01',
        expireDate: '2030-01-01',
        photoAsBase64Uri: '/9j/4AAQSkZJRgABAQEAAA=='
      };

      const result = DataTransformer.processSmartCardData(rawData);

      expect(result.photoAsBase64Uri).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA==');
    });
  });
});