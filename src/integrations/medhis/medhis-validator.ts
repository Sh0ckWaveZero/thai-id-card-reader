/**
 * MEDHIS Centrix Message Validator
 * Validates MEDHIS-specific message formats
 */

import { BaseValidator } from '../base/base-validator';
import { ValidationResult, MedhisMessage } from '../../types/integration';

export class MedhisValidator extends BaseValidator<MedhisMessage> {
  protected integrationName = 'MEDHIS Centrix';
  protected supportedFormats = ['medhis-readsmartcard', 'legacy-mode'];

  /**
   * Validate MEDHIS message format
   */
  validate(data: string): ValidationResult<MedhisMessage> {
    // Parse JSON safely
    const parseResult = this.safeJsonParse(data);
    if (!parseResult.success) {
      return this.createResult(false, undefined, parseResult.error);
    }

    const parsed = parseResult.data;

    // Validate basic structure
    const structureError = this.validateObjectStructure(parsed);
    if (structureError) {
      return this.createResult(false, undefined, structureError);
    }

    // Check for MEDHIS readsmartcard mode
    if (this.isMedhisReadSmartcard(parsed)) {
      return this.createResult(
        true, 
        { mode: 'readsmartcard', ...parsed } as MedhisMessage,
        undefined,
        { 
          format: 'medhis-readsmartcard',
          timestamp: new Date().toISOString()
        }
      );
    }

    // Check for other MEDHIS patterns
    if (this.isMedhisCompatible(parsed)) {
      return this.createResult(
        true,
        parsed as MedhisMessage,
        undefined,
        {
          format: 'medhis-compatible',
          timestamp: new Date().toISOString()
        }
      );
    }

    return this.createResult(
      false, 
      undefined, 
      'Message does not match MEDHIS format'
    );
  }

  /**
   * Check if message is MEDHIS readsmartcard format
   */
  private isMedhisReadSmartcard(obj: any): boolean {
    return obj.mode === 'readsmartcard';
  }

  /**
   * Check if message is MEDHIS compatible
   */
  private isMedhisCompatible(obj: any): boolean {
    // Additional MEDHIS patterns can be added here
    // For now, we only support readsmartcard mode
    return false;
  }

  /**
   * Transform legacy MEDHIS format to standard format
   */
  transformLegacyFormat(data: any): MedhisMessage {
    return {
      mode: 'readsmartcard',
      ...data,
      timestamp: new Date().toISOString()
    };
  }
}