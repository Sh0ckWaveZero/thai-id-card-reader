export interface SmartCardReturnData {
  citizenID: string;
  titleTH: string;
  titleEN: string;
  fullNameTH: string;
  fullNameEN: string;
  firstNameTH: string;
  firstNameEN: string;
  lastNameTH: string;
  lastNameEN: string;
  dateOfBirth: string;
  gender: "male" | "female";
  cardIssuer: string;
  issueDate: string;
  expireDate: string;
  address: string;
  photoAsBase64Uri: string;
}

// Common alias for compatibility
export type ThaiIDCardData = SmartCardReturnData;

export interface MedisPatientData {
  mode: "readsmartcard";
  Citizenid: string;
  Th_Firstname: string;
  Th_Middlename: null;
  Th_Lastname: string;
  Th_Prefix: string;
  Birthday: string;
  Sex: 1 | 2; // 1 = Male, 2 = Female
  Address: string;
  addrHouseNo: string;
  addrVillageNo: string;
  addrTambol: string;
  addrAmphur: string;
  PhotoRaw: string;
}

export interface WebSocketMessage {
  type?: 'startReading' | 'stopReading';
  mode?: string;
  action?: string; // For generic integrations
  message?: string;
  error?: string;
  data?: any; // Integration-specific data
  integrationUsed?: string; // Track which integration processed the message
  metadata?: Record<string, any>; // Additional integration-specific data
}

export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AddressComponents {
  houseNumber: string;
  villageNumber: string;
  tambol: string;
  amphur: string;
}

export type ConnectionMode = 'SCARD_SHARE_SHARED' | 'SCARD_SHARE_EXCLUSIVE' | 'SCARD_SHARE_DIRECT';

// PCSC Library Interfaces
export interface PCReader {
  name: string;
  state: number;
  SCARD_STATE_EMPTY: number;
  SCARD_STATE_PRESENT: number;
  SCARD_LEAVE_CARD: number;
  SCARD_SHARE_SHARED: number;
  SCARD_SHARE_EXCLUSIVE: number;
  SCARD_SHARE_DIRECT: number;
  
  on(event: 'error', callback: (err: Error) => void): void;
  on(event: 'status', callback: (status: PCReaderStatus) => void): void;
  on(event: 'end', callback: () => void): void;
  
  connect(options: PCConnectOptions, callback: (err: Error | null, protocol?: PCProtocol) => void): void;
  disconnect(disposition: number, callback?: (err: Error | null) => void): void;
  transmit(
    buffer: Buffer,
    responseLength: number,
    protocol: PCProtocol,
    callback: (err: Error | null, response?: Buffer) => void
  ): void;
}

export interface PCReaderStatus {
  state: number;
}

export interface PCConnectOptions {
  share_mode: number;
}

export interface PCProtocol {
  // Protocol is typically a number representing the protocol type
  // This is often an opaque value from the PCSC library
}

export interface PCSC {
  on(event: 'reader', callback: (reader: PCReader) => void): void;
  on(event: 'error', callback: (err: Error) => void): void;
}

export interface ConnectionResult {
  connected: boolean;
  protocol: PCProtocol | null;
}