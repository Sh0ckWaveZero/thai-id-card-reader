/**
 * Integration Configuration
 * กำหนดค่าสำหรับการเชื่อมต่อกับระบบต่างๆ
 */

export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  messageValidator?: string;
  messageFormat?: any;
  compatibilityMode?: boolean;
}

export interface SystemIntegrations {
  medhis?: IntegrationConfig;
  centrix?: IntegrationConfig;
  custom?: IntegrationConfig[];
}

export const DEFAULT_INTEGRATIONS: SystemIntegrations = {
  medhis: {
    name: 'MEDHIS Centrix',
    enabled: true,
    messageValidator: 'validateMedisMessage',
    messageFormat: {
      trigger: { mode: 'readsmartcard' },
      response: {
        message: 'string',
        timestamp: 'ISO8601'
      }
    },
    compatibilityMode: true
  },
  custom: []
};

/**
 * Generic Integration Handler
 * รองรับการเพิ่มระบบใหม่ได้ง่าย
 */
export class IntegrationManager {
  private integrations: SystemIntegrations;

  constructor(config?: SystemIntegrations) {
    this.integrations = { ...DEFAULT_INTEGRATIONS, ...config };
  }

  getEnabledIntegrations(): IntegrationConfig[] {
    const enabled: IntegrationConfig[] = [];
    
    if (this.integrations.medhis?.enabled) {
      enabled.push(this.integrations.medhis);
    }
    
    if (this.integrations.centrix?.enabled) {
      enabled.push(this.integrations.centrix);
    }
    
    if (this.integrations.custom) {
      enabled.push(...this.integrations.custom.filter(c => c.enabled));
    }
    
    return enabled;
  }

  isIntegrationEnabled(name: string): boolean {
    const integrations = this.getEnabledIntegrations();
    return integrations.some(i => i.name.toLowerCase().includes(name.toLowerCase()));
  }

  getIntegrationConfig(name: string): IntegrationConfig | undefined {
    const integrations = this.getEnabledIntegrations();
    return integrations.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
  }
}