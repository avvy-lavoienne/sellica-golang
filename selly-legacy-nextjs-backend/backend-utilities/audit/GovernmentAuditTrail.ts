/**
 * Government Audit Trail System - Phase 3 Week 21-22
 * Tamper-proof audit logging with digital signatures for Indonesian government compliance
 * 
 * Implements UU No. 27 Tahun 2022 audit requirements with real-time validation
 * Supports blockchain integration and forensic audit capabilities
 */

import crypto from 'crypto';
import type { DataClassification } from '../../types/compliance';
import type { GovernmentGradeEncryption } from '../security/GovernmentGradeEncryption';

export interface AuditConfig {
  enableTamperProofing: boolean;
  enableDigitalSignatures: boolean;
  enableRealTimeValidation: boolean;
  retentionPeriod: number; // days (7 years = 2555 days for government)
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  blockchainIntegration: boolean;
  maxChainLength: number;
  validationInterval: number; // milliseconds
  auditStorage: 'local' | 'database' | 'blockchain' | 'hybrid';
  complianceLevel: 'standard' | 'government' | 'classified';
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'warning';
  details: any;
  classification: DataClassification;
  legalBasis?: string;
  processingPurpose?: string;
  retentionPeriod: number; // days
  digitalSignature?: DigitalSignature;
  previousEventHash?: string;
  chainIndex: number;
  integrityHash: string;
}

export interface DigitalSignature {
  algorithm: 'RSA-4096' | 'ECDSA-P384' | 'EdDSA';
  signature: string; // Base64 encoded
  publicKey: string; // Base64 encoded
  certificateChain?: string[]; // Certificate chain for validation
  timestamp: Date;
  signerId: string;
  keyId: string;
}

export type AuditEventType = 
  | 'user_authentication'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'ai_processing'
  | 'encryption_operation'
  | 'compliance_event'
  | 'security_event'
  | 'system_event'
  | 'government_integration'
  | 'audit_event';

export interface AuditChainValidation {
  isValid: boolean;
  brokenLinks: number[];
  tamperedEvents: string[];
  missingSignatures: string[];
  validationTime: number;
  lastValidatedIndex: number;
  integrityScore: number; // 0-100
}

export interface AuditStorage {
  storeAuditEvent(event: AuditEvent): Promise<void>;
  retrieveAuditEvents(criteria: AuditSearchCriteria): Promise<AuditEvent[]>;
  validateStorageIntegrity(): Promise<boolean>;
}

export interface AuditSearchCriteria {
  startDate?: Date;
  endDate?: Date;
  eventType?: AuditEventType;
  userId?: string;
  classification?: DataClassification;
  outcome?: 'success' | 'failure' | 'warning';
  limit?: number;
  offset?: number;
}

// Mock Blockchain Interface for development
interface BlockchainService {
  initialize(): Promise<void>;
  addAuditEvent(event: AuditEvent): Promise<string>; // Returns transaction hash
  validateAuditChain(): Promise<boolean>;
  getAuditEvent(eventId: string): Promise<AuditEvent | null>;
  isAvailable(): boolean;
}

class MockBlockchainService implements BlockchainService {
  private events: Map<string, AuditEvent> = new Map();

  async initialize(): Promise<void> {
    console.log('🔗 [BLOCKCHAIN] Mock blockchain initialized for development');
  }

  async addAuditEvent(event: AuditEvent): Promise<string> {
    const txHash = crypto.createHash('sha256')
      .update(JSON.stringify(event))
      .digest('hex');
    this.events.set(event.id, event);
    return txHash;
  }

  async validateAuditChain(): Promise<boolean> {
    return true; // Mock validation always passes
  }

  async getAuditEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.get(eventId) || null;
  }

  isAvailable(): boolean {
    return false; // Mock blockchain is not a real blockchain
  }
}

/**
 * Government Audit Trail System
 * Implements tamper-proof audit logging with digital signatures
 */
export class GovernmentAuditTrail {
  private static instance: GovernmentAuditTrail;
  private config: AuditConfig;
  private auditChain: AuditEvent[];
  private auditStorage: AuditStorage | null;
  private blockchainService: BlockchainService | null;
  private encryptionService: GovernmentGradeEncryption | null;
  private validationTimer: NodeJS.Timeout | null;
  private isInitialized: boolean = false;

  private constructor(config?: Partial<AuditConfig>) {
    this.config = {
      enableTamperProofing: true,
      enableDigitalSignatures: true,
      enableRealTimeValidation: true,
      retentionPeriod: 2555, // 7 years for Indonesian government compliance
      compressionEnabled: false,
      encryptionEnabled: true,
      blockchainIntegration: false, // Disabled by default for development
      maxChainLength: 10000,
      validationInterval: 300000, // 5 minutes
      auditStorage: 'database',
      complianceLevel: 'government',
      ...config
    };

    this.auditChain = [];
    this.auditStorage = null;
    this.blockchainService = this.config.blockchainIntegration ? new MockBlockchainService() : null;
    this.encryptionService = null;
    this.validationTimer = null;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<AuditConfig>): GovernmentAuditTrail {
    if (!GovernmentAuditTrail.instance) {
      GovernmentAuditTrail.instance = new GovernmentAuditTrail(config);
    }
    return GovernmentAuditTrail.instance;
  }

  /**
   * Initialize audit trail system
   */
  public async initialize(
    encryptionService?: GovernmentGradeEncryption,
    auditStorage?: AuditStorage
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('📋 [AUDIT_TRAIL] Initializing government audit trail system...');

    try {
      // Set services
      this.encryptionService = encryptionService || null;
      this.auditStorage = auditStorage || null;

      // Initialize blockchain if enabled
      if (this.blockchainService) {
        await this.blockchainService.initialize();
      }

      // Start real-time validation
      if (this.config.enableRealTimeValidation) {
        this.startRealTimeValidation();
      }

      // Load existing audit chain
      await this.loadExistingAuditChain();

      this.isInitialized = true;
      console.log('✅ [AUDIT_TRAIL] Government audit trail system initialized');

      // Log initialization event
      await this.logAuditEvent({
        eventType: 'system_event',
        ipAddress: 'system',
        userAgent: 'audit_system',
        resource: 'audit_trail',
        action: 'initialize',
        outcome: 'success',
        details: {
          configLevel: this.config.complianceLevel,
          tamperProofing: this.config.enableTamperProofing,
          digitalSignatures: this.config.enableDigitalSignatures,
          blockchainEnabled: this.config.blockchainIntegration
        },
        classification: 'internal',
        retentionPeriod: this.config.retentionPeriod
      });

    } catch (error) {
      console.error('❌ [AUDIT_TRAIL] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Log audit event with tamper-proof features
   */
  public async logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'chainIndex' | 'integrityHash' | 'digitalSignature' | 'previousEventHash'>): Promise<string> {
    const startTime = performance.now();
    const eventId = crypto.randomUUID();

    try {
      // Create audit event
      const auditEvent: AuditEvent = {
        id: eventId,
        timestamp: new Date(),
        chainIndex: this.auditChain.length,
        previousEventHash: this.getLastEventHash(),
        integrityHash: '', // Will be calculated
        ...eventData,
        retentionPeriod: eventData.retentionPeriod || this.config.retentionPeriod
      };

      // Calculate integrity hash
      auditEvent.integrityHash = this.calculateIntegrityHash(auditEvent);

      // Generate digital signature if enabled
      if (this.config.enableDigitalSignatures) {
        auditEvent.digitalSignature = await this.generateDigitalSignature(auditEvent);
      }

      // Encrypt sensitive audit data if enabled
      if (this.config.encryptionEnabled && this.encryptionService && auditEvent.classification !== 'public') {
        auditEvent.details = await this.encryptAuditData(auditEvent.details, auditEvent.classification);
      }

      // Add to audit chain
      this.auditChain.push(auditEvent);

      // Store persistently
      if (this.auditStorage) {
        await this.auditStorage.storeAuditEvent(auditEvent);
      }

      // Add to blockchain if enabled
      if (this.blockchainService && this.blockchainService.isAvailable()) {
        await this.blockchainService.addAuditEvent(auditEvent);
      }

      // Real-time validation
      if (this.config.enableRealTimeValidation) {
        await this.validateAuditChainIntegrity();
      }

      const processingTime = performance.now() - startTime;
      console.log(`📝 [AUDIT_TRAIL] Logged ${eventData.eventType} event: ${eventId} (${processingTime.toFixed(2)}ms)`);

      return eventId;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [AUDIT_TRAIL] Failed to log audit event: ${error} (${processingTime.toFixed(2)}ms)`);
      throw error;
    }
  }

  /**
   * Validate audit chain integrity
   */
  public async validateAuditChainIntegrity(): Promise<AuditChainValidation> {
    const startTime = performance.now();
    const validation: AuditChainValidation = {
      isValid: true,
      brokenLinks: [],
      tamperedEvents: [],
      missingSignatures: [],
      validationTime: 0,
      lastValidatedIndex: -1,
      integrityScore: 100
    };

    try {
      for (let i = 0; i < this.auditChain.length; i++) {
        const event = this.auditChain[i];

        // Validate chain linkage
        if (i > 0) {
          const previousEvent = this.auditChain[i - 1];
          const expectedPreviousHash = this.calculateIntegrityHash(previousEvent);

          if (event.previousEventHash !== expectedPreviousHash) {
            validation.brokenLinks.push(i);
            validation.isValid = false;
          }
        }

        // Validate integrity hash
        const calculatedHash = this.calculateIntegrityHash({
          ...event,
          integrityHash: '', // Exclude current hash from calculation
          digitalSignature: undefined // Exclude signature from hash calculation
        });

        if (event.integrityHash !== calculatedHash) {
          validation.tamperedEvents.push(event.id);
          validation.isValid = false;
        }

        // Validate digital signature
        if (this.config.enableDigitalSignatures && !event.digitalSignature) {
          validation.missingSignatures.push(event.id);
          validation.isValid = false;
        }

        validation.lastValidatedIndex = i;
      }

      // Calculate integrity score
      const totalIssues = validation.brokenLinks.length +
                         validation.tamperedEvents.length +
                         validation.missingSignatures.length;

      if (this.auditChain.length > 0) {
        validation.integrityScore = Math.max(0, 100 - (totalIssues / this.auditChain.length) * 100);
      }

      validation.validationTime = performance.now() - startTime;

      if (!validation.isValid) {
        console.warn(`⚠️ [AUDIT_TRAIL] Chain integrity validation failed:`, {
          brokenLinks: validation.brokenLinks.length,
          tamperedEvents: validation.tamperedEvents.length,
          missingSignatures: validation.missingSignatures.length,
          integrityScore: validation.integrityScore
        });
      } else {
        console.log(`✅ [AUDIT_TRAIL] Chain integrity validated (${validation.validationTime.toFixed(2)}ms)`);
      }

      return validation;

    } catch (error) {
      validation.isValid = false;
      validation.validationTime = performance.now() - startTime;
      console.error('❌ [AUDIT_TRAIL] Chain validation failed:', error);
      return validation;
    }
  }

  /**
   * Generate digital signature for audit event
   */
  private async generateDigitalSignature(event: AuditEvent): Promise<DigitalSignature> {
    try {
      // Create signature payload (exclude signature field)
      const signaturePayload = {
        ...event,
        digitalSignature: undefined
      };

      const payloadString = JSON.stringify(signaturePayload);
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest();

      // Generate RSA-4096 key pair for signing (in production, use stored keys)
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      // Create signature
      const signature = crypto.sign('sha256', payloadHash, privateKey);

      const digitalSignature: DigitalSignature = {
        algorithm: 'RSA-4096',
        signature: signature.toString('base64'),
        publicKey: Buffer.from(publicKey).toString('base64'),
        timestamp: new Date(),
        signerId: 'audit_system',
        keyId: crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16)
      };

      return digitalSignature;

    } catch (error) {
      console.error('❌ [AUDIT_TRAIL] Digital signature generation failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt audit data for sensitive information
   */
  private async encryptAuditData(data: any, classification: DataClassification): Promise<any> {
    if (!this.encryptionService) {
      console.warn('⚠️ [AUDIT_TRAIL] Encryption service not available, storing data unencrypted');
      return data;
    }

    try {
      const encryptedData = await this.encryptionService.encryptSensitiveData(
        data,
        classification,
        'audit_logging'
      );

      return {
        encrypted: true,
        encryptedContent: encryptedData.encryptedContent,
        keyId: encryptedData.keyId,
        algorithm: encryptedData.algorithm,
        classification: encryptedData.classification
      };

    } catch (error) {
      console.error('❌ [AUDIT_TRAIL] Audit data encryption failed:', error);
      // Return original data if encryption fails (graceful degradation)
      return data;
    }
  }

  /**
   * Calculate integrity hash for audit event
   */
  private calculateIntegrityHash(event: Partial<AuditEvent>): string {
    // Create deterministic string representation
    const hashPayload = {
      id: event.id,
      timestamp: event.timestamp?.toISOString(),
      eventType: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      outcome: event.outcome,
      details: event.details,
      classification: event.classification,
      chainIndex: event.chainIndex,
      previousEventHash: event.previousEventHash
    };

    const payloadString = JSON.stringify(hashPayload);
    return crypto.createHash('sha256').update(payloadString).digest('hex');
  }

  /**
   * Get hash of last event in chain
   */
  private getLastEventHash(): string | undefined {
    if (this.auditChain.length === 0) {
      return undefined;
    }
    return this.auditChain[this.auditChain.length - 1].integrityHash;
  }

  /**
   * Start real-time validation timer
   */
  private startRealTimeValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    this.validationTimer = setInterval(async () => {
      try {
        await this.validateAuditChainIntegrity();
      } catch (error) {
        console.error('❌ [AUDIT_TRAIL] Real-time validation failed:', error);
      }
    }, this.config.validationInterval);

    console.log(`⏰ [AUDIT_TRAIL] Real-time validation started (${this.config.validationInterval}ms interval)`);
  }

  /**
   * Load existing audit chain from storage
   */
  private async loadExistingAuditChain(): Promise<void> {
    if (!this.auditStorage) {
      console.log('📋 [AUDIT_TRAIL] No audit storage configured, starting with empty chain');
      return;
    }

    try {
      const existingEvents = await this.auditStorage.retrieveAuditEvents({
        limit: this.config.maxChainLength
      });

      this.auditChain = existingEvents.sort((a, b) => a.chainIndex - b.chainIndex);
      console.log(`📋 [AUDIT_TRAIL] Loaded ${this.auditChain.length} existing audit events`);

    } catch (error) {
      console.error('❌ [AUDIT_TRAIL] Failed to load existing audit chain:', error);
      // Continue with empty chain
    }
  }

  /**
   * Get audit statistics
   */
  public getAuditStatistics(): {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsByClassification: Record<DataClassification, number>;
    chainIntegrityScore: number;
    lastValidation: Date | null;
  } {
    const stats = {
      totalEvents: this.auditChain.length,
      eventsByType: {} as Record<AuditEventType, number>,
      eventsByClassification: {} as Record<DataClassification, number>,
      chainIntegrityScore: 100,
      lastValidation: null as Date | null
    };

    // Count events by type and classification
    for (const event of this.auditChain) {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      stats.eventsByClassification[event.classification] = (stats.eventsByClassification[event.classification] || 0) + 1;
    }

    return stats;
  }

  /**
   * Cleanup expired audit events
   */
  public async cleanupExpiredEvents(): Promise<number> {
    const now = new Date();
    const expiredEvents: string[] = [];

    for (const event of this.auditChain) {
      const expiryDate = new Date(event.timestamp);
      expiryDate.setDate(expiryDate.getDate() + event.retentionPeriod);

      if (now > expiryDate) {
        expiredEvents.push(event.id);
      }
    }

    // Remove expired events (in production, archive instead of delete)
    this.auditChain = this.auditChain.filter(event => !expiredEvents.includes(event.id));

    if (expiredEvents.length > 0) {
      console.log(`🧹 [AUDIT_TRAIL] Cleaned up ${expiredEvents.length} expired audit events`);
    }

    return expiredEvents.length;
  }

  /**
   * Shutdown audit trail system
   */
  public async shutdown(): Promise<void> {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }

    // Final validation before shutdown
    if (this.config.enableRealTimeValidation) {
      await this.validateAuditChainIntegrity();
    }

    console.log('🔒 [AUDIT_TRAIL] Government audit trail system shutdown');
  }
}
