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
  message?: string;
  error?: string;
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