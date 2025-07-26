/**
 * Base Message Validator
 * Abstract base class for message validation
 */

import { MessageValidator, ValidationResult } from '../../types/integration';

export abstract class BaseValidator<T = any> implements MessageValidator<T> {
  protected abstract integrationName: string;
  protected abstract supportedFormats: string[];

  /**
   * Validate message data
   */
  abstract validate(data: string): ValidationResult<T>;

  /**
   * Get integration name
   */
  getIntegrationName(): string {
    return this.integrationName;
  }

  /**
   * Get supported message formats
   */
  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }

  /**
   * Safe JSON parsing with error handling
   */
  protected safeJsonParse(data: string): { success: boolean; data?: any; error?: string } {
    try {
      const parsed = JSON.parse(data);
      return { success: true, data: parsed };
    } catch (error) {
      return { 
        success: false, 
        error: `Invalid JSON: ${(error as Error).message}` 
      };
    }
  }

  /**
   * Validate basic object structure
   */
  protected validateObjectStructure(obj: any): string | null {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return 'Message must be a JSON object';
    }
    return null;
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Create validation result
   */
  protected createResult(
    isValid: boolean, 
    message?: T, 
    error?: string, 
    metadata?: Record<string, any>
  ): ValidationResult<T> {
    return {
      isValid,
      message,
      error,
      integrationUsed: this.integrationName,
      metadata
    };
  }

  /**
   * Validate required fields
   */
  protected validateRequiredFields(obj: any, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (obj[field] === undefined || obj[field] === null) {
        return `Required field '${field}' is missing`;
      }
    }
    return null;
  }

  /**
   * Validate field types
   */
  protected validateFieldTypes(obj: any, fieldTypes: Record<string, string>): string | null {
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (obj[field] !== undefined) {
        const actualType = typeof obj[field];
        if (actualType !== expectedType) {
          return `Field '${field}' must be ${expectedType}, got ${actualType}`;
        }
      }
    }
    return null;
  }

  /**
   * Check if message matches pattern
   */
  protected matchesPattern(obj: any, pattern: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(pattern)) {
      if (obj[key] !== value) {
        return false;
      }
    }
    return true;
  }
}