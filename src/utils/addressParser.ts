import { AddressComponents } from '../types';

export class AddressParser {
  static extractHouseNumber(address: string): string {
    const match = address.match(/^(\d+\/?\d*)/);
    return match ? match[1] : "";
  }

  static extractVillageNumber(address: string): string {
    const match = address.match(/หมู่\s*(\d+)/);
    return match ? match[1] : "";
  }

  static extractTambol(address: string): string {
    const match = address.match(/ตำบล([^\s]+)/);
    return match ? `ตำบล${match[1]}` : "";
  }

  static extractAmphur(address: string): string {
    const match = address.match(/อำเภอ([^\s]+)/);
    return match ? `อำเภอ${match[1]}` : "";
  }

  static parseAddress(address: string): AddressComponents {
    return {
      houseNumber: this.extractHouseNumber(address),
      villageNumber: this.extractVillageNumber(address),
      tambol: this.extractTambol(address),
      amphur: this.extractAmphur(address)
    };
  }
}