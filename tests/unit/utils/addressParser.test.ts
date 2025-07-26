import { AddressParser } from '../../../src/utils/addressParser';

describe('AddressParser', () => {
  describe('extractHouseNumber', () => {
    it('should extract simple house number', () => {
      const address = '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง';
      expect(AddressParser.extractHouseNumber(address)).toBe('123');
    });

    it('should extract house number with fraction', () => {
      const address = '123/45 หมู่ 2 ตำบลบางใหญ่';
      expect(AddressParser.extractHouseNumber(address)).toBe('123/45');
    });

    it('should return empty string for invalid format', () => {
      const address = 'หมู่ 5 ตำบลในเมือง';
      expect(AddressParser.extractHouseNumber(address)).toBe('');
    });

    it('should handle empty address', () => {
      expect(AddressParser.extractHouseNumber('')).toBe('');
    });
  });

  describe('extractVillageNumber', () => {
    it('should extract village number with standard format', () => {
      const address = '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง';
      expect(AddressParser.extractVillageNumber(address)).toBe('5');
    });

    it('should extract village number with spaces', () => {
      const address = '123 หมู่   12 ตำบลบางใหญ่';
      expect(AddressParser.extractVillageNumber(address)).toBe('12');
    });

    it('should return empty string when no village number', () => {
      const address = '123 ตำบลในเมือง อำเภอเมือง';
      expect(AddressParser.extractVillageNumber(address)).toBe('');
    });

    it('should handle multiple digit village numbers', () => {
      const address = '45 หมู่ 15 ตำบลสวนผึ้ง';
      expect(AddressParser.extractVillageNumber(address)).toBe('15');
    });
  });

  describe('extractTambol', () => {
    it('should extract tambol name', () => {
      const address = '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง';
      expect(AddressParser.extractTambol(address)).toBe('ตำบลในเมือง');
    });

    it('should extract tambol with complex name', () => {
      const address = '456 หมู่ 2 ตำบลบางบัวทอง อำเภอบางบัวทอง';
      expect(AddressParser.extractTambol(address)).toBe('ตำบลบางบัวทอง');
    });

    it('should return empty string when no tambol', () => {
      const address = '123 หมู่ 5 อำเภอเมือง';
      expect(AddressParser.extractTambol(address)).toBe('');
    });
  });

  describe('extractAmphur', () => {
    it('should extract amphur name', () => {
      const address = '123 หมู่ 5 ตำบลในเมือง อำเภอเมือง';
      expect(AddressParser.extractAmphur(address)).toBe('อำเภอเมือง');
    });

    it('should extract amphur with complex name', () => {
      const address = '789 ตำบลคลองหนึ่ง อำเภอคลองหลวง';
      expect(AddressParser.extractAmphur(address)).toBe('อำเภอคลองหลวง');
    });

    it('should return empty string when no amphur', () => {
      const address = '123 หมู่ 5 ตำบลในเมือง';
      expect(AddressParser.extractAmphur(address)).toBe('');
    });
  });

  describe('parseAddress', () => {
    it('should parse complete Thai address', () => {
      const address = '123/45 หมู่ 8 ตำบลบางใหญ่ อำเภอบางใหญ่';
      const result = AddressParser.parseAddress(address);
      
      expect(result).toEqual({
        houseNumber: '123/45',
        villageNumber: '8',
        tambol: 'ตำบลบางใหญ่',
        amphur: 'อำเภอบางใหญ่'
      });
    });

    it('should handle partial address information', () => {
      const address = '99 ตำบลในเมือง';
      const result = AddressParser.parseAddress(address);
      
      expect(result).toEqual({
        houseNumber: '99',
        villageNumber: '',
        tambol: 'ตำบลในเมือง',
        amphur: ''
      });
    });

    it('should handle empty address', () => {
      const result = AddressParser.parseAddress('');
      
      expect(result).toEqual({
        houseNumber: '',
        villageNumber: '',
        tambol: '',
        amphur: ''
      });
    });

    it('should handle malformed address', () => {
      const address = 'invalid address format';
      const result = AddressParser.parseAddress(address);
      
      expect(result).toEqual({
        houseNumber: '',
        villageNumber: '',
        tambol: '',
        amphur: ''
      });
    });
  });
});