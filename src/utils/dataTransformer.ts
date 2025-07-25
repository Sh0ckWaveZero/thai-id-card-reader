import { SmartCardReturnData, MedisPatientData } from '../types';
import { AddressParser } from './addressParser';

export class DataTransformer {
  static smartCardToMedis(data: Partial<SmartCardReturnData>): MedisPatientData {
    const addressComponents = AddressParser.parseAddress(data.address || "");
    
    return {
      mode: "readsmartcard",
      Citizenid: data.citizenID || "",
      Th_Firstname: data.firstNameTH || "",
      Th_Middlename: null,
      Th_Lastname: data.lastNameTH || "",
      Th_Prefix: data.titleTH || "",
      Birthday: data.dateOfBirth ? data.dateOfBirth.replace(/-/g, "/") : "",
      Sex: data.gender === "male" ? 1 : 2,
      Address: data.address || "",
      addrHouseNo: addressComponents.houseNumber,
      addrVillageNo: addressComponents.villageNumber,
      addrTambol: addressComponents.tambol,
      addrAmphur: addressComponents.amphur,
      PhotoRaw: data.photoAsBase64Uri
        ? data.photoAsBase64Uri.replace("data:image/jpeg;base64,", "")
        : "",
    };
  }

  static removeJunk(str: string): string {
    let temp = str;
    temp = temp.replace(/#/g, ' ');
    temp = temp.replace(/\s{2,}/g, ' ');
    if (temp[temp.length - 1] === ' ') {
      temp = temp.slice(0, -1);
    }
    return temp;
  }

  static processSmartCardData(data: SmartCardReturnData): Partial<SmartCardReturnData> {
    return {
      citizenID: data.citizenID,
      fullNameEN: this.removeJunk(data.fullNameEN),
      fullNameTH: this.removeJunk(data.fullNameTH),
      titleEN: this.removeJunk(data.fullNameEN.split('#')[0]),
      firstNameEN: this.removeJunk(data.fullNameEN.split('#')[1]),
      lastNameEN: this.removeJunk(data.fullNameEN.split('#')[3]),
      titleTH: this.removeJunk(data.fullNameTH.split('#')[0]),
      firstNameTH: this.removeJunk(data.fullNameTH.split('#')[1]),
      lastNameTH: this.removeJunk(data.fullNameTH.split('#')[3]),
      dateOfBirth: data.dateOfBirth,
      gender: (data as any).gender === '1' ? 'male' : 'female',
      cardIssuer: this.removeJunk(data.cardIssuer),
      issueDate: this.removeJunk(data.issueDate),
      expireDate: this.removeJunk(data.expireDate),
      address: this.removeJunk(data.address),
      photoAsBase64Uri: 'data:image/jpeg;base64,' + data.photoAsBase64Uri
    };
  }
}