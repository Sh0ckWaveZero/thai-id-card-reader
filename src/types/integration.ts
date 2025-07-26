/**
 * Core Integration System Types
 * Defines interfaces for pluggable integration system
 */

export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  priority?: number;
  version?: string;
  validator?: string;
  messageFormat?: Record<string, any>;
  compatibilityMode?: boolean;
  settings?: Record<string, any>;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  message?: T;
  error?: string;
  integrationUsed?: string;
  metadata?: Record<string, any>;
}

export interface MessageValidator<T = any> {
  validate(data: string): ValidationResult<T>;
  getIntegrationName(): string;
  getSupportedFormats(): string[];
}

export interface Integration {
  name: string;
  version: string;
  validator: MessageValidator;
  config: IntegrationConfig;
  
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isHealthy(): boolean;
  addEventListener(handler: IntegrationEventHandler): void;
  validateMessage(data: string): ValidationResult;
  getMetadata(): Record<string, any>;
}

export interface IntegrationRegistry {
  register(integration: Integration): void;
  unregister(name: string): void;
  get(name: string): Integration | undefined;
  getAll(): Integration[];
  getEnabled(): Integration[];
}

export interface IntegrationManager {
  initialize(configs: IntegrationConfig[]): Promise<void>;
  validateMessage(data: string): ValidationResult;
  getActiveIntegrations(): string[];
  reloadConfig(): Promise<void>;
}

// Message Types
export interface BaseMessage {
  timestamp?: string;
  messageId?: string;
  [key: string]: any;
}

export interface GenericMessage extends BaseMessage {
  type?: string;
  action?: string;
  data?: any;
}

export interface MedhisMessage extends BaseMessage {
  mode: 'readsmartcard';
}

// Integration Events
export interface IntegrationEvent {
  type: 'loaded' | 'unloaded' | 'error' | 'message_processed';
  integration: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

export type IntegrationEventHandler = (event: IntegrationEvent) => void;