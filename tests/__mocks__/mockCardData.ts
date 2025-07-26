import { SmartCardReturnData, MedisPatientData } from '../../src/types';

export const mockSmartCardData: SmartCardReturnData = {
  citizenID: '1234567890123',
  fullNameTH: 'นาย สมชาย ใจดี',
  fullNameEN: 'MR. SOMCHAI JAIDEE',
  firstNameTH: 'สมชาย',
  lastNameTH: 'ใจดี',
  titleTH: 'นาย',
  dateOfBirth: '1990-01-15',
  gender: 'male',
  address: '123/45 หมู่ 8 ตำบลบางใหญ่ อำเภอบางใหญ่ จังหวัดนนทบุรี 11140',
  cardIssuer: 'Department of Provincial Administration',
  issueDate: '2020-01-01',
  expireDate: '2030-01-01',
  photoAsBase64Uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA=='
};

export const mockSmartCardDataFemale: SmartCardReturnData = {
  citizenID: '9876543210987',
  fullNameTH: 'นางสาว สมหญิง ใจดี',
  fullNameEN: 'MISS SOMYING JAIDEE',
  firstNameTH: 'สมหญิng',
  lastNameTH: 'ใจดี',
  titleTH: 'นางสาว',
  dateOfBirth: '1995-05-20',
  gender: 'female',
  address: '456 หมู่ 12 ตำบลบางนา อำเภอบางนา จังหวัดกรุงเทพมหานคร 10260',
  cardIssuer: 'Department of Provincial Administration',
  issueDate: '2021-06-01',
  expireDate: '2031-06-01',
  photoAsBase64Uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBBB=='
};

export const mockMedisData: MedisPatientData = {
  mode: 'readsmartcard',
  Citizenid: '1234567890123',
  Th_Firstname: 'สมชาย',
  Th_Middlename: null,
  Th_Lastname: 'ใจดี',
  Th_Prefix: 'นาย',
  Birthday: '1990/01/15',
  Sex: 1,
  Address: '123/45 หมู่ 8 ตำบลบางใหญ่ อำเภอบางใหญ่ จังหวัดนนทบุรี 11140',
  addrHouseNo: '123/45',
  addrVillageNo: '8',
  addrTambol: 'ตำบลบางใหญ่',
  addrAmphur: 'อำเภอบางใหญ่',
  PhotoRaw: '/9j/4AAQSkZJRgABAQEAAA=='
};

export const mockPartialSmartCardData: Partial<SmartCardReturnData> = {
  citizenID: '1111111111111',
  fullNameTH: 'นาย ทดสอบ ระบบ',
  dateOfBirth: '1985-12-31',
  gender: 'male'
};

export const mockInvalidSmartCardData: Partial<SmartCardReturnData> = {
  citizenID: '123', // Invalid length
  fullNameTH: '', // Empty name
  dateOfBirth: 'invalid-date',
  gender: 'unknown' as any // Invalid gender
};

export const mockAddressVariations = {
  withVillage: '123/45 หมู่ 8 ตำบลบางใหญ่ อำเภอบางใหญ่',
  withoutVillage: '789 ตำบลในเมือง อำเภอเมือง',
  minimal: '456 บ้านเลขที่ 456',
  complex: '888/999 หมู่ 15 ซอย ABC ถนน XYZ ตำบลบางบัวทอง อำเภอบางบัวทอง จังหวัดนนทบุรี 11110'
};

export const mockErrorScenarios = {
  cardNotPresent: 'No card present in reader',
  connectionFailed: 'Failed to connect to smart card',
  readTimeout: 'Card reading timeout',
  protocolMismatch: 'Protocol mismatch error',
  citizenIdError: 'Failed to read citizen ID',
  photoReadError: 'Failed to read photo data'
};

export const mockWebSocketMessages = {
  startReading: { type: 'startReading' },
  stopReading: { type: 'stopReading' },
  medisMode: { mode: 'readsmartcard' },
  invalidType: { type: 'invalidOperation' },
  invalidJson: '{ invalid json syntax }',
  nonObject: ['array', 'instead', 'of', 'object'],
  withMessage: { message: 'Custom message' },
  withError: { error: 'Custom error' }
};

export const mockIntegrationConfigs = [
  {
    name: 'MEDHIS',
    enabled: true,
    validator: 'MedhisValidator',
    messageValidator: 'validateMedisMessage',
    description: 'MEDHIS Hospital Integration System'
  },
  {
    name: 'Hospital',
    enabled: false,
    validator: 'HospitalValidator',
    messageValidator: 'validateHospitalMessage',
    description: 'Custom Hospital Integration'
  },
  {
    name: 'TestIntegration',
    enabled: true,
    validator: 'TestValidator',
    description: 'Test Integration for Unit Tests'
  }
];