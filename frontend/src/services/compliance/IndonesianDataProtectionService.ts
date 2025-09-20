/**
 * Indonesian Data Protection Service - Simplified Version
 * Provides basic data protection compliance for the core web app
 */

export interface DataProcessingConsent {
  userId: string;
  consentGiven: boolean;
  consentDate: Date;
  purposes: string[];
  dataTypes: string[];
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  autoDelete: boolean;
}

export class IndonesianDataProtectionService {
  private static instance: IndonesianDataProtectionService;
  private consents: Map<string, DataProcessingConsent> = new Map();
  private retentionPolicies: DataRetentionPolicy[] = [
    { dataType: 'chat_messages', retentionPeriod: 365, autoDelete: true },
    { dataType: 'user_sessions', retentionPeriod: 30, autoDelete: true },
    { dataType: 'query_history', retentionPeriod: 180, autoDelete: true }
  ];

  static getInstance(): IndonesianDataProtectionService {
    if (!IndonesianDataProtectionService.instance) {
      IndonesianDataProtectionService.instance = new IndonesianDataProtectionService();
    }
    return IndonesianDataProtectionService.instance;
  }

  async recordConsent(userId: string, purposes: string[], dataTypes: string[]): Promise<void> {
    const consent: DataProcessingConsent = {
      userId,
      consentGiven: true,
      consentDate: new Date(),
      purposes,
      dataTypes
    };

    this.consents.set(userId, consent);

    // Store in localStorage for persistence
    try {
      const consentsArray = Array.from(this.consents.entries());
      localStorage.setItem('data_protection_consents', JSON.stringify(consentsArray));
    } catch (error) {
      console.warn('Failed to save consent data:', error);
    }
  }

  async getConsent(userId: string): Promise<DataProcessingConsent | null> {
    let consent = this.consents.get(userId);

    if (!consent) {
      // Try to load from localStorage
      try {
        const stored = localStorage.getItem('data_protection_consents');
        if (stored) {
          const consentsArray = JSON.parse(stored);
          this.consents = new Map(consentsArray);
          consent = this.consents.get(userId);
        }
      } catch (error) {
        console.warn('Failed to load consent data:', error);
      }
    }

    return consent || null;
  }

  async hasValidConsent(userId: string, purpose: string, dataType: string): Promise<boolean> {
    const consent = await this.getConsent(userId);
    
    if (!consent || !consent.consentGiven) {
      return false;
    }

    return consent.purposes.includes(purpose) && consent.dataTypes.includes(dataType);
  }

  async revokeConsent(userId: string): Promise<void> {
    const consent = this.consents.get(userId);
    if (consent) {
      consent.consentGiven = false;
      this.consents.set(userId, consent);

      // Update localStorage
      try {
        const consentsArray = Array.from(this.consents.entries());
        localStorage.setItem('data_protection_consents', JSON.stringify(consentsArray));
      } catch (error) {
        console.warn('Failed to update consent data:', error);
      }
    }
  }

  async validateDataProcessing(userId: string, purpose: string, dataType: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const hasConsent = await this.hasValidConsent(userId, purpose, dataType);
    
    if (!hasConsent) {
      return {
        allowed: false,
        reason: 'User consent required for data processing'
      };
    }

    return { allowed: true };
  }

  async getRetentionPolicy(dataType: string): Promise<DataRetentionPolicy | null> {
    return this.retentionPolicies.find(policy => policy.dataType === dataType) || null;
  }

  async shouldDeleteData(dataType: string, createdDate: Date): Promise<boolean> {
    const policy = await this.getRetentionPolicy(dataType);
    
    if (!policy || !policy.autoDelete) {
      return false;
    }

    const retentionMs = policy.retentionPeriod * 24 * 60 * 60 * 1000;
    const dataAge = Date.now() - createdDate.getTime();
    
    return dataAge > retentionMs;
  }

  async cleanupExpiredData(): Promise<{
    deletedItems: number;
    dataTypes: string[];
  }> {
    let deletedItems = 0;
    const dataTypes: string[] = [];

    // This is a simplified implementation
    // In a real app, this would clean up actual data based on retention policies
    
    try {
      // Check chat sessions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chat_session_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const session = JSON.parse(stored);
            const shouldDelete = await this.shouldDeleteData('chat_messages', new Date(session.createdAt));
            
            if (shouldDelete) {
              localStorage.removeItem(key);
              deletedItems++;
              if (!dataTypes.includes('chat_messages')) {
                dataTypes.push('chat_messages');
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup expired data:', error);
    }

    return { deletedItems, dataTypes };
  }

  async getComplianceReport(): Promise<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    retentionPolicies: number;
    lastCleanup?: Date;
  }> {
    // Load consents if needed
    if (this.consents.size === 0) {
      await this.getConsent('dummy'); // This will trigger loading from localStorage
    }

    const consentsArray = Array.from(this.consents.values());
    const activeConsents = consentsArray.filter(c => c.consentGiven).length;
    const revokedConsents = consentsArray.filter(c => !c.consentGiven).length;

    return {
      totalConsents: consentsArray.length,
      activeConsents,
      revokedConsents,
      retentionPolicies: this.retentionPolicies.length
    };
  }
}

// Export singleton instance
export const indonesianDataProtectionService = IndonesianDataProtectionService.getInstance();
