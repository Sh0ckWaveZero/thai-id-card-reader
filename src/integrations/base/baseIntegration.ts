/**
 * Base Integration Interface
 * Abstract base class for all system integrations
 */

import { Integration, IntegrationConfig, MessageValidator, ValidationResult, IntegrationEvent, IntegrationEventHandler } from '../../types/integration';

export abstract class BaseIntegration implements Integration {
  public readonly name: string;
  public readonly version: string;
  public readonly config: IntegrationConfig;
  public abstract readonly validator: MessageValidator;
  
  private eventHandlers: IntegrationEventHandler[] = [];
  private initialized = false;
  private healthy = true;

  constructor(config: IntegrationConfig) {
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.config = config;
  }

  /**
   * Initialize the integration
   */
  async initialize(): Promise<void> {
    try {
      await this.doInitialize();
      this.initialized = true;
      this.healthy = true;
      this.emitEvent({
        type: 'loaded',
        integration: this.name,
        timestamp: new Date()
      });
    } catch (error) {
      this.healthy = false;
      this.emitEvent({
        type: 'error',
        integration: this.name,
        timestamp: new Date(),
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Shutdown the integration
   */
  async shutdown(): Promise<void> {
    try {
      await this.doShutdown();
      this.initialized = false;
      this.emitEvent({
        type: 'unloaded',
        integration: this.name,
        timestamp: new Date()
      });
    } catch (error) {
      this.emitEvent({
        type: 'error',
        integration: this.name,
        timestamp: new Date(),
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Check if integration is healthy
   */
  isHealthy(): boolean {
    return this.healthy && this.initialized;
  }

  /**
   * Validate a message using this integration
   */
  validateMessage(data: string): ValidationResult {
    if (!this.isHealthy()) {
      return {
        isValid: false,
        error: `Integration ${this.name} is not healthy`,
        integrationUsed: this.name
      };
    }

    try {
      const result = this.validator.validate(data);
      
      if (result.isValid) {
        this.emitEvent({
          type: 'message_processed',
          integration: this.name,
          timestamp: new Date(),
          data: { messageLength: data.length, success: true }
        });
      }

      return {
        ...result,
        integrationUsed: this.name
      };
    } catch (error) {
      this.healthy = false;
      this.emitEvent({
        type: 'error',
        integration: this.name,
        timestamp: new Date(),
        error: error as Error
      });

      return {
        isValid: false,
        error: `Validation error: ${(error as Error).message}`,
        integrationUsed: this.name
      };
    }
  }

  /**
   * Add event handler
   */
  addEventListener(handler: IntegrationEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(handler: IntegrationEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Emit integration event
   */
  protected emitEvent(event: IntegrationEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // Event handler error silently ignored
      }
    });
  }

  /**
   * Override for custom initialization logic
   */
  protected async doInitialize(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override for custom shutdown logic
   */
  protected async doShutdown(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Get integration metadata
   */
  getMetadata(): Record<string, any> {
    return {
      name: this.name,
      version: this.version,
      enabled: this.config.enabled,
      healthy: this.healthy,
      initialized: this.initialized,
      supportedFormats: this.validator.getSupportedFormats(),
      settings: this.config.settings || {}
    };
  }
}