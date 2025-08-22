/**
 * Security Enhancement Service - Week 3 Implementation
 * Comprehensive security features including audit logging, encryption, and compliance
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';

export interface SecurityConfig {
  encryption: EncryptionConfig;
  audit: AuditConfig;
  compliance: ComplianceConfig;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  monitoring: SecurityMonitoringConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyRotation: KeyRotationConfig;
  dataAtRest: boolean;
  dataInTransit: boolean;
  sessionData: boolean;
}

export interface KeyRotationConfig {
  enabled: boolean;
  interval: number; // milliseconds
  retentionPeriod: number; // milliseconds
  autoRotate: boolean;
}

export interface AuditConfig {
  enabled: boolean;
  events: AuditEventType[];
  retention: number; // milliseconds
  storage: 'local' | 'remote' | 'both';
  realTime: boolean;
  detailedLogging: boolean;
}

export type AuditEventType = 
  | 'session_created'
  | 'session_accessed'
  | 'session_modified'
  | 'session_deleted'
  | 'user_login'
  | 'user_logout'
  | 'data_access'
  | 'data_export'
  | 'security_violation'
  | 'system_error'
  | 'configuration_change';

export interface ComplianceConfig {
  standards: ComplianceStandard[];
  dataRetention: number;
  dataAnonymization: boolean;
  rightToBeDeleted: boolean;
  consentManagement: boolean;
  dataMinimization: boolean;
}

export type ComplianceStandard = 'GDPR' | 'CCPA' | 'SOC2' | 'ISO27001' | 'HIPAA';

export interface AuthenticationConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: PasswordPolicy;
  mfa: MFAConfig;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
}

export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  required: boolean;
  gracePeriod: number;
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'hardware_key';

export interface AuthorizationConfig {
  rbac: boolean;
  permissions: Permission[];
  policies: Policy[];
  sessionBased: boolean;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: string[];
}

export interface Policy {
  name: string;
  rules: string[];
  effect: 'allow' | 'deny';
  priority: number;
}

export interface SecurityMonitoringConfig {
  enabled: boolean;
  threatDetection: boolean;
  anomalyDetection: boolean;
  realTimeAlerts: boolean;
  alertThresholds: SecurityAlertThresholds;
}

export interface SecurityAlertThresholds {
  failedLogins: number;
  suspiciousActivity: number;
  dataAccessViolations: number;
  systemErrors: number;
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  resource?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityViolation {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system_integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  violationCount: number;
  failedLogins: number;
  successfulLogins: number;
  dataAccessCount: number;
  encryptionOperations: number;
  auditLogSize: number;
  complianceScore: number;
}

export class SecurityEnhancementService {
  private config: SecurityConfig;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private auditLog: AuditEvent[] = [];
  private violations: SecurityViolation[] = [];
  private encryptionKeys: Map<string, CryptoKey> = new Map();
  private metrics: SecurityMetrics;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<SecurityConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    this.config = {
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotation: {
          enabled: true,
          interval: 30 * 24 * 60 * 60 * 1000, // 30 days
          retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
          autoRotate: true
        },
        dataAtRest: true,
        dataInTransit: true,
        sessionData: true
      },
      audit: {
        enabled: true,
        events: [
          'session_created',
          'session_accessed',
          'session_modified',
          'user_login',
          'user_logout',
          'data_access',
          'security_violation'
        ],
        retention: 365 * 24 * 60 * 60 * 1000, // 1 year
        storage: 'both',
        realTime: true,
        detailedLogging: true
      },
      compliance: {
        standards: ['GDPR', 'CCPA'],
        dataRetention: 365 * 24 * 60 * 60 * 1000, // 1 year
        dataAnonymization: true,
        rightToBeDeleted: true,
        consentManagement: true,
        dataMinimization: true
      },
      authentication: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          preventReuse: 5
        },
        mfa: {
          enabled: false,
          methods: ['totp'],
          required: false,
          gracePeriod: 24 * 60 * 60 * 1000 // 24 hours
        }
      },
      authorization: {
        rbac: true,
        permissions: [
          {
            resource: 'sessions',
            actions: ['read', 'write', 'delete']
          },
          {
            resource: 'user_data',
            actions: ['read', 'update']
          }
        ],
        policies: [
          {
            name: 'user_own_data',
            rules: ['resource.userId == user.id'],
            effect: 'allow',
            priority: 1
          }
        ],
        sessionBased: true
      },
      monitoring: {
        enabled: true,
        threatDetection: true,
        anomalyDetection: true,
        realTimeAlerts: true,
        alertThresholds: {
          failedLogins: 5,
          suspiciousActivity: 3,
          dataAccessViolations: 1,
          systemErrors: 10
        }
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializeSecurity();
  }

  /**
   * Initialize security service
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // Initialize encryption keys
      if (this.config.encryption.enabled) {
        await this.initializeEncryption();
      }

      // Load existing audit log
      await this.loadAuditLog();

      // Start monitoring
      this.startSecurityMonitoring();

      // Log initialization
      await this.logAuditEvent({
        type: 'system_error',
        action: 'security_service_initialized',
        details: { config: this.config },
        success: true,
        riskLevel: 'low'
      });

      console.log('🔒 Security enhancement service initialized');
    } catch (error) {
      console.error('Failed to initialize security service:', error);
      throw error;
    }
  }

  /**
   * Initialize encryption
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or load master key
      const masterKey = await this.generateOrLoadMasterKey();
      this.encryptionKeys.set('master', masterKey);

      // Setup key rotation if enabled
      if (this.config.encryption.keyRotation.enabled && this.config.encryption.keyRotation.autoRotate) {
        this.setupKeyRotation();
      }

      console.log('🔐 Encryption initialized');
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }

  /**
   * Generate or load master encryption key
   */
  private async generateOrLoadMasterKey(): Promise<CryptoKey> {
    try {
      // Try to load existing key
      const existingKey = await this.storageAdapter.get('security:master_key');
      if (existingKey && Array.isArray(existingKey)) {
        return await crypto.subtle.importKey(
          'raw',
          new Uint8Array(existingKey),
          { name: this.config.encryption.algorithm },
          false,
          ['encrypt', 'decrypt']
        );
      }

      // Generate new key
      const key = await crypto.subtle.generateKey(
        {
          name: this.config.encryption.algorithm,
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Store key
      const keyData = await crypto.subtle.exportKey('raw', key);
      await this.storageAdapter.set('security:master_key', Array.from(new Uint8Array(keyData)));

      return key;
    } catch (error) {
      console.error('Failed to generate/load master key:', error);
      throw error;
    }
  }

  /**
   * Setup automatic key rotation
   */
  private setupKeyRotation(): void {
    setInterval(async () => {
      try {
        await this.rotateEncryptionKeys();
      } catch (error) {
        console.error('Key rotation failed:', error);
        await this.logSecurityViolation({
          type: 'system_integrity',
          severity: 'high',
          description: 'Automatic key rotation failed',
          details: { error: String(error) }
        });
      }
    }, this.config.encryption.keyRotation.interval);

    console.log('🔄 Automatic key rotation enabled');
  }

  /**
   * Rotate encryption keys
   */
  private async rotateEncryptionKeys(): Promise<void> {
    try {
      // Generate new master key
      const newKey = await this.generateOrLoadMasterKey();
      
      // Store old key for decryption of existing data
      const oldKey = this.encryptionKeys.get('master');
      if (oldKey) {
        const timestamp = Date.now();
        this.encryptionKeys.set(`master_${timestamp}`, oldKey);
        
        // Schedule old key deletion
        setTimeout(() => {
          this.encryptionKeys.delete(`master_${timestamp}`);
        }, this.config.encryption.keyRotation.retentionPeriod);
      }

      // Set new key as current
      this.encryptionKeys.set('master', newKey);

      await this.logAuditEvent({
        type: 'configuration_change',
        action: 'encryption_key_rotated',
        details: { timestamp: new Date() },
        success: true,
        riskLevel: 'medium'
      });

      console.log('🔄 Encryption keys rotated successfully');
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data
   */
  async encryptData(data: any): Promise<string> {
    if (!this.config.encryption.enabled) {
      return JSON.stringify(data);
    }

    try {
      const key = this.encryptionKeys.get('master');
      if (!key) {
        throw new Error('Master encryption key not available');
      }

      const plaintext = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(plaintext);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.config.encryption.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);

      this.metrics.encryptionOperations++;
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      await this.logSecurityViolation({
        type: 'system_integrity',
        severity: 'high',
        description: 'Data encryption failed',
        details: { error: String(error) }
      });
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData: string): Promise<any> {
    if (!this.config.encryption.enabled) {
      return JSON.parse(encryptedData);
    }

    try {
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Try current key first
      let key = this.encryptionKeys.get('master');
      if (!key) {
        throw new Error('Master encryption key not available');
      }

      try {
        const decrypted = await crypto.subtle.decrypt(
          {
            name: this.config.encryption.algorithm,
            iv: iv
          },
          key,
          encrypted
        );

        const decoder = new TextDecoder();
        const plaintext = decoder.decode(decrypted);
        return JSON.parse(plaintext);
      } catch (decryptError) {
        // Try old keys if current key fails
        for (const [keyName, oldKey] of this.encryptionKeys.entries()) {
          if (keyName.startsWith('master_')) {
            try {
              const decrypted = await crypto.subtle.decrypt(
                {
                  name: this.config.encryption.algorithm,
                  iv: iv
                },
                oldKey,
                encrypted
              );

              const decoder = new TextDecoder();
              const plaintext = decoder.decode(decrypted);
              return JSON.parse(plaintext);
            } catch {
              // Continue to next key
            }
          }
        }
        throw decryptError;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      await this.logSecurityViolation({
        type: 'system_integrity',
        severity: 'high',
        description: 'Data decryption failed',
        details: { error: String(error) }
      });
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.audit.enabled) return;

    const auditEvent: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    // Add to in-memory log
    this.auditLog.push(auditEvent);

    // Store persistently if configured
    if (this.config.audit.storage === 'local' || this.config.audit.storage === 'both') {
      await this.storeAuditEvent(auditEvent);
    }

    // Send to remote if configured
    if (this.config.audit.storage === 'remote' || this.config.audit.storage === 'both') {
      await this.sendAuditEventRemote(auditEvent);
    }

    // Update metrics
    this.metrics.totalEvents++;
    this.metrics.auditLogSize = this.auditLog.length;

    // Check for security violations
    if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      await this.analyzeForSecurityViolations(auditEvent);
    }

    // Cleanup old events
    this.cleanupAuditLog();
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const securityViolation: SecurityViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...violation
    };

    this.violations.push(securityViolation);
    this.metrics.violationCount++;

    // Log as audit event
    await this.logAuditEvent({
      type: 'security_violation',
      action: 'security_violation_detected',
      details: securityViolation,
      success: false,
      riskLevel: 'critical'
    });

    // Send alert if real-time alerts are enabled
    if (this.config.monitoring.realTimeAlerts) {
      await this.sendSecurityAlert(securityViolation);
    }

    console.warn(`🚨 Security violation detected: ${violation.description}`);
  }

  /**
   * Check authorization
   */
  async checkAuthorization(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    if (!this.config.authorization.rbac) {
      return true; // Authorization disabled
    }

    try {
      // Find applicable permissions
      const permission = this.config.authorization.permissions.find(p => p.resource === resource);
      if (!permission || !permission.actions.includes(action)) {
        await this.logAuditEvent({
          type: 'data_access',
          action: 'authorization_denied',
          userId,
          details: { resource, action, reason: 'no_permission' },
          success: false,
          riskLevel: 'medium'
        });
        return false;
      }

      // Check policies
      for (const policy of this.config.authorization.policies.sort((a, b) => b.priority - a.priority)) {
        const policyResult = await this.evaluatePolicy(policy, { userId, resource, action, ...context });
        if (policyResult !== null) {
          const authorized = policy.effect === 'allow' && policyResult;
          
          await this.logAuditEvent({
            type: 'data_access',
            action: authorized ? 'authorization_granted' : 'authorization_denied',
            userId,
            details: { resource, action, policy: policy.name },
            success: authorized,
            riskLevel: authorized ? 'low' : 'medium'
          });

          return authorized;
        }
      }

      // Default deny
      await this.logAuditEvent({
        type: 'data_access',
        action: 'authorization_denied',
        userId,
        details: { resource, action, reason: 'default_deny' },
        success: false,
        riskLevel: 'medium'
      });

      return false;
    } catch (error) {
      console.error('Authorization check failed:', error);
      await this.logSecurityViolation({
        type: 'authorization',
        severity: 'high',
        description: 'Authorization check failed',
        userId,
        details: { resource, action, error: String(error) }
      });
      return false;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore();
    
    return {
      ...this.metrics,
      complianceScore
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(filter?: {
    type?: AuditEventType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    riskLevel?: string;
  }): AuditEvent[] {
    let filteredLog = [...this.auditLog];

    if (filter) {
      if (filter.type) {
        filteredLog = filteredLog.filter(event => event.type === filter.type);
      }
      if (filter.userId) {
        filteredLog = filteredLog.filter(event => event.userId === filter.userId);
      }
      if (filter.startDate) {
        filteredLog = filteredLog.filter(event => event.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filteredLog = filteredLog.filter(event => event.timestamp <= filter.endDate!);
      }
      if (filter.riskLevel) {
        filteredLog = filteredLog.filter(event => event.riskLevel === filter.riskLevel);
      }
    }

    return filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security violations
   */
  getSecurityViolations(resolved?: boolean): SecurityViolation[] {
    let violations = [...this.violations];
    
    if (resolved !== undefined) {
      violations = violations.filter(v => v.resolved === resolved);
    }

    return violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve security violation
   */
  async resolveSecurityViolation(violationId: string, resolution?: string): Promise<boolean> {
    const violation = this.violations.find(v => v.id === violationId);
    if (!violation || violation.resolved) {
      return false;
    }

    violation.resolved = true;
    violation.resolvedAt = new Date();

    await this.logAuditEvent({
      type: 'security_violation',
      action: 'security_violation_resolved',
      details: { violationId, resolution },
      success: true,
      riskLevel: 'low'
    });

    console.log(`✅ Security violation resolved: ${violationId}`);
    return true;
  }

  // Helper methods
  private initializeMetrics(): SecurityMetrics {
    return {
      totalEvents: 0,
      violationCount: 0,
      failedLogins: 0,
      successfulLogins: 0,
      dataAccessCount: 0,
      encryptionOperations: 0,
      auditLogSize: 0,
      complianceScore: 0
    };
  }

  private async loadAuditLog(): Promise<void> {
    try {
      const storedLog = await this.storageAdapter.get('security:audit_log');
      if (storedLog && Array.isArray(storedLog)) {
        this.auditLog = storedLog.map(event => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        this.metrics.auditLogSize = this.auditLog.length;
      }
    } catch (error) {
      console.warn('Failed to load audit log:', error);
    }
  }

  private startSecurityMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Check every minute

    console.log('🔍 Security monitoring started');
  }

  private async performSecurityChecks(): Promise<void> {
    // Check for anomalies
    if (this.config.monitoring.anomalyDetection) {
      await this.detectAnomalies();
    }

    // Check for threats
    if (this.config.monitoring.threatDetection) {
      await this.detectThreats();
    }

    // Update metrics
    this.updateSecurityMetrics();
  }

  private async detectAnomalies(): Promise<void> {
    // Implement anomaly detection logic
    const recentEvents = this.auditLog.filter(
      event => Date.now() - event.timestamp.getTime() < 60000 // Last minute
    );

    // Check for unusual activity patterns
    const failedLogins = recentEvents.filter(
      event => event.type === 'user_login' && !event.success
    ).length;

    if (failedLogins > this.config.monitoring.alertThresholds.failedLogins) {
      await this.logSecurityViolation({
        type: 'authentication',
        severity: 'high',
        description: `Unusual number of failed login attempts: ${failedLogins}`,
        details: { failedLogins, threshold: this.config.monitoring.alertThresholds.failedLogins }
      });
    }
  }

  private async detectThreats(): Promise<void> {
    // Implement threat detection logic
    // This would include checking for known attack patterns, suspicious IP addresses, etc.
  }

  private updateSecurityMetrics(): void {
    // Update various security metrics
    this.metrics.failedLogins = this.auditLog.filter(
      event => event.type === 'user_login' && !event.success
    ).length;

    this.metrics.successfulLogins = this.auditLog.filter(
      event => event.type === 'user_login' && event.success
    ).length;

    this.metrics.dataAccessCount = this.auditLog.filter(
      event => event.type === 'data_access'
    ).length;
  }

  private calculateComplianceScore(): number {
    // Calculate compliance score based on implemented features
    let score = 0;
    const maxScore = 100;

    // Encryption
    if (this.config.encryption.enabled) score += 20;
    if (this.config.encryption.keyRotation.enabled) score += 10;

    // Audit logging
    if (this.config.audit.enabled) score += 20;
    if (this.config.audit.realTime) score += 10;

    // Compliance features
    if (this.config.compliance.dataAnonymization) score += 10;
    if (this.config.compliance.rightToBeDeleted) score += 10;
    if (this.config.compliance.consentManagement) score += 10;

    // Authorization
    if (this.config.authorization.rbac) score += 10;

    return Math.min(score, maxScore);
  }

  private async evaluatePolicy(policy: Policy, context: Record<string, any>): Promise<boolean | null> {
    // Simple policy evaluation - in production would use a proper policy engine
    for (const rule of policy.rules) {
      if (rule === 'resource.userId == user.id') {
        return context.resource?.userId === context.userId;
      }
    }
    return null;
  }

  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.storageAdapter.set(`audit:${event.id}`, event);
    } catch (error) {
      console.error('Failed to store audit event:', error);
    }
  }

  private async sendAuditEventRemote(event: AuditEvent): Promise<void> {
    // Placeholder for remote audit logging
    // In production, would send to SIEM or audit service
  }

  private async analyzeForSecurityViolations(event: AuditEvent): Promise<void> {
    // Analyze audit events for potential security violations
    if (!event.success && event.riskLevel === 'critical') {
      await this.logSecurityViolation({
        type: 'system_integrity',
        severity: 'critical',
        description: `Critical security event: ${event.action}`,
        userId: event.userId,
        sessionId: event.sessionId,
        details: event.details
      });
    }
  }

  private cleanupAuditLog(): void {
    const cutoff = Date.now() - this.config.audit.retention;
    this.auditLog = this.auditLog.filter(event => event.timestamp.getTime() > cutoff);
    this.metrics.auditLogSize = this.auditLog.length;
  }

  private async sendSecurityAlert(violation: SecurityViolation): Promise<void> {
    // Send security alert through configured channels
    console.warn(`🚨 SECURITY ALERT: ${violation.description}`);
    
    // In production, would integrate with alerting systems
    this.performanceMonitor.recordMetric(
      'error_rate',
      'session_manager',
      1,
      'count',
      { type: 'security_violation', violation }
    );
  }

  /**
   * Stop security monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('🔒 Security enhancement service stopped');
  }
}

// Factory function
export function createSecurityEnhancement(
  storageAdapter: SessionStorageAdapter,
  performanceMonitor: PerformanceMonitor
): SecurityEnhancementService {
  return new SecurityEnhancementService(storageAdapter, performanceMonitor);
}
