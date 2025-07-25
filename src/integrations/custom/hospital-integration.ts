/**
 * Example Custom Hospital Integration
 * Shows how to implement a custom integration for other hospital systems
 */

import { BaseIntegration } from '../base/base-integration';
import { BaseValidator } from '../base/base-validator';
import { IntegrationConfig, MessageValidator, ValidationResult, GenericMessage } from '../../types/integration';

class HospitalValidator extends BaseValidator<GenericMessage> {
  protected integrationName = 'Hospital System X';
  protected supportedFormats = ['hospital-read-card', 'hospital-api'];

  validate(data: string): ValidationResult<GenericMessage> {
    const parseResult = this.safeJsonParse(data);
    if (!parseResult.success) {
      return this.createResult(false, undefined, parseResult.error);
    }

    const parsed = parseResult.data;
    const structureError = this.validateObjectStructure(parsed);
    if (structureError) {
      return this.createResult(false, undefined, structureError);
    }

    // Check for Hospital X format: { action: "read_card", department: "string" }
    if (this.isHospitalFormat(parsed)) {
      return this.createResult(
        true,
        {
          type: 'read_card',
          action: parsed.action,
          data: parsed,
          timestamp: new Date().toISOString()
        } as GenericMessage,
        undefined,
        {
          format: 'hospital-read-card',
          department: parsed.department
        }
      );
    }

    return this.createResult(false, undefined, 'Not a Hospital System X format');
  }

  private isHospitalFormat(obj: any): boolean {
    return obj.action === 'read_card' && 
           typeof obj.department === 'string';
  }
}

export class HospitalIntegration extends BaseIntegration {
  public readonly validator: MessageValidator;

  constructor(config: IntegrationConfig) {
    super(config);
    this.validator = new HospitalValidator();
  }

  protected async doInitialize(): Promise<void> {
    console.log(`Initializing ${this.name} integration...`);
    
    // Custom initialization logic for Hospital System
    if (this.config.settings?.apiEndpoint) {
      console.log(`Hospital API endpoint: ${this.config.settings.apiEndpoint}`);
    }

    console.log(`${this.name} integration initialized`);
  }

  protected async doShutdown(): Promise<void> {
    console.log(`Shutting down ${this.name} integration...`);
    // Custom cleanup
  }

  getMetadata(): Record<string, any> {
    return {
      ...super.getMetadata(),
      customFeatures: ['department-routing', 'patient-lookup'],
      apiVersion: 'v2.1',
      supportedDepartments: ['emergency', 'outpatient', 'inpatient']
    };
  }
}