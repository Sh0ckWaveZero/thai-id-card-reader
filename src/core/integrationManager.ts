/**
 * Central Integration Manager
 * Manages all system integrations and message routing
 */

import fs from 'fs/promises';
import path from 'path';
import { 
  IntegrationManager as IIntegrationManager, 
  IntegrationConfig, 
  ValidationResult, 
  Integration,
  IntegrationRegistry,
  IntegrationEvent,
  IntegrationEventHandler
} from '../types/integration';
import { MedhisIntegration } from '../integrations/medhis/medhisIntegration';

class IntegrationRegistryImpl implements IntegrationRegistry {
  private integrations = new Map<string, Integration>();

  register(integration: Integration): void {
    this.integrations.set(integration.name.toLowerCase(), integration);
  }

  unregister(name: string): void {
    this.integrations.delete(name.toLowerCase());
  }

  get(name: string): Integration | undefined {
    return this.integrations.get(name.toLowerCase());
  }

  getAll(): Integration[] {
    return Array.from(this.integrations.values());
  }

  getEnabled(): Integration[] {
    return this.getAll().filter(integration => 
      integration.config.enabled && integration.isHealthy()
    );
  }
}

export class IntegrationManager implements IIntegrationManager {
  private registry: IntegrationRegistry;
  private eventHandlers: IntegrationEventHandler[] = [];
  private configPath?: string;

  constructor(configPath?: string) {
    this.registry = new IntegrationRegistryImpl();
    this.configPath = configPath;
  }

  /**
   * Initialize with integration configurations
   */
  async initialize(configs: IntegrationConfig[]): Promise<void> {
    // Integration Manager initialization

    // Clear existing integrations
    for (const integration of this.registry.getAll()) {
      await integration.shutdown();
      this.registry.unregister(integration.name);
    }

    // Initialize new integrations
    for (const config of configs) {
      if (!config.enabled) {
        // Skipping disabled integration
        continue;
      }

      try {
        const integration = this.createIntegration(config);
        integration.addEventListener(this.handleIntegrationEvent.bind(this));
        
        await integration.initialize();
        this.registry.register(integration);
        
        // Integration initialized successfully
      } catch (error) {
        // Integration initialization failed
        // Continue with other integrations
      }
    }

    // Integration Manager ready
  }

  /**
   * Validate message using available integrations
   */
  validateMessage(data: string): ValidationResult {
    const enabledIntegrations = this.registry.getEnabled()
      .sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0)); // Sort by priority

    if (enabledIntegrations.length === 0) {
      return {
        isValid: false,
        error: 'No active integrations available'
      };
    }

    // Try each integration in priority order
    for (const integration of enabledIntegrations) {
      try {
        const result = integration.validateMessage(data);
        
        if (result.isValid) {
          // Message validation successful
          return result;
        }
      } catch (error) {
        // Validation error occurred
        // Continue to next integration
      }
    }

    // If no integration could validate the message
    return {
      isValid: false,
      error: 'Message format not recognized by any active integration',
      metadata: {
        triedIntegrations: enabledIntegrations.map(i => i.name),
        messageLength: data.length
      }
    };
  }

  /**
   * Get active integration names
   */
  getActiveIntegrations(): string[] {
    return this.registry.getEnabled().map(integration => integration.name);
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<void> {
    if (!this.configPath) {
      throw new Error('No config path specified for reload');
    }

    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      const integrationConfigs = Object.values(config.integrations || {}) as IntegrationConfig[];
      
      // Add custom integrations if they exist
      if (config.integrations?.custom && Array.isArray(config.integrations.custom)) {
        integrationConfigs.push(...config.integrations.custom);
      }

      await this.initialize(integrationConfigs);
      // Configuration reloaded
    } catch (error) {
      // Configuration reload failed
      throw error;
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
   * Get integration metadata
   */
  getIntegrationsMetadata(): Record<string, any>[] {
    return this.registry.getAll().map(integration => integration.getMetadata());
  }

  /**
   * Create integration instance based on config
   */
  private createIntegration(config: IntegrationConfig): Integration {
    // Factory pattern for creating integrations
    switch (config.name.toLowerCase()) {
      case 'medhis centrix':
      case 'medhis':
        return new MedhisIntegration(config);
      
      default:
        // For custom integrations, we could load them dynamically
        throw new Error(`Unknown integration type: ${config.name}`);
    }
  }

  /**
   * Handle integration events
   */
  private handleIntegrationEvent(event: IntegrationEvent): void {
    // Integration event handled
    
    // Forward event to registered handlers
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // Event handler error
      }
    });
  }

  /**
   * Shutdown all integrations
   */
  async shutdown(): Promise<void> {
    // Integration Manager shutdown initiated
    
    const shutdownPromises = this.registry.getAll().map(async integration => {
      try {
        await integration.shutdown();
        // Integration shutdown completed
      } catch (error) {
        // Integration shutdown error
      }
    });

    await Promise.allSettled(shutdownPromises);
    // Integration Manager shutdown completed
  }
}

// Export singleton instance
export const integrationManager = new IntegrationManager();