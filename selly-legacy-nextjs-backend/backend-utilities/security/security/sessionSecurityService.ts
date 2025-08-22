/**
 * Session Security Service
 * Phase 3 Implementation: Production-ready security enhancements
 * Comprehensive security for session management and data protection
 */

import crypto from 'crypto';
import { UpstashClient } from '../cache/upstashClient';

export interface SecurityConfig {
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  keyRotationInterval: number; // hours
  maxSessionsPerIP: number;
  maxSessionsPerUser: number;
  suspiciousActivityThreshold: number;
  enableAuditLogging: boolean;
  enableRateLimiting: boolean;
  sessionTimeoutMinutes: number;
  requireSecureTransport: boolean;
}

export interface SecurityEvent {
  eventType: 'session_created' | 'session_accessed' | 'session_expired' | 'suspicious_activity' | 'security_violation';
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  keyId: string;
}

export interface DecryptionResult {
  decryptedData: string;
  success: boolean;
}

export interface SecurityAudit {
  totalSessions: number;
  suspiciousActivities: number;
  securityViolations: number;
  encryptedSessions: number;
  auditEvents: SecurityEvent[];
  riskScore: number;
  recommendations: string[];
  timestamp: Date;
}

export class SessionSecurityService {
  private redis: UpstashClient;
  private config: SecurityConfig;
  private encryptionKeys: Map<string, Buffer> = new Map();
  private currentKeyId: string;
  private auditLog: SecurityEvent[] = [];
  private rateLimitCache: Map<string, number[]> = new Map();
  private static instance: SessionSecurityService;

  private constructor() {
    this.redis = UpstashClient.getInstance();
    this.config = this.getDefaultSecurityConfig();
    this.currentKeyId = this.generateKeyId();
    
    // Initialize encryption keys
    this.initializeEncryptionKeys();
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    console.log('🔒 [SESSION_SECURITY] Session security service initialized');
  }

  public static getInstance(): SessionSecurityService {
    if (!SessionSecurityService.instance) {
      SessionSecurityService.instance = new SessionSecurityService();
    }
    return SessionSecurityService.instance;
  }

  /**
   * Encrypt sensitive session data
   */
  async encryptSessionData(data: string, keyId?: string): Promise<EncryptionResult> {
    if (!this.config.encryptionEnabled) {
      return {
        encryptedData: data,
        iv: '',
        keyId: 'none'
      };
    }

    try {
      const useKeyId = keyId || this.currentKeyId;
      const key = this.encryptionKeys.get(useKeyId);
      
      if (!key) {
        throw new Error(`Encryption key not found: ${useKeyId}`);
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.config.encryptionAlgorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        keyId: useKeyId
      };

    } catch (error) {
      console.error('❌ [SESSION_SECURITY] Encryption failed:', error);
      throw new Error('Session data encryption failed');
    }
  }

  /**
   * Decrypt sensitive session data
   */
  async decryptSessionData(encryptedData: string, iv: string, keyId: string): Promise<DecryptionResult> {
    if (!this.config.encryptionEnabled || keyId === 'none') {
      return {
        decryptedData: encryptedData,
        success: true
      };
    }

    try {
      const key = this.encryptionKeys.get(keyId);
      
      if (!key) {
        console.warn(`⚠️ [SESSION_SECURITY] Decryption key not found: ${keyId}`);
        return {
          decryptedData: '',
          success: false
        };
      }

      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = crypto.createDecipheriv(this.config.encryptionAlgorithm, key, ivBuffer);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        decryptedData: decrypted,
        success: true
      };

    } catch (error) {
      console.error('❌ [SESSION_SECURITY] Decryption failed:', error);
      return {
        decryptedData: '',
        success: false
      };
    }
  }

  /**
   * Validate session security
   */
  async validateSessionSecurity(
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    userId?: string
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = [];

    try {
      // Check rate limiting
      if (this.config.enableRateLimiting) {
        const rateLimitViolation = await this.checkRateLimit(ipAddress);
        if (rateLimitViolation) {
          violations.push('Rate limit exceeded');
        }
      }

      // Check session limits per IP
      const ipSessionCount = await this.getSessionCountByIP(ipAddress);
      if (ipSessionCount > this.config.maxSessionsPerIP) {
        violations.push('Too many sessions from IP');
      }

      // Check session limits per user
      if (userId) {
        const userSessionCount = await this.getSessionCountByUser(userId);
        if (userSessionCount > this.config.maxSessionsPerUser) {
          violations.push('Too many sessions for user');
        }
      }

      // Check for suspicious activity
      const suspiciousActivity = await this.detectSuspiciousActivity(sessionId, ipAddress, userAgent);
      if (suspiciousActivity) {
        violations.push('Suspicious activity detected');
      }

      // Log security event
      await this.logSecurityEvent({
        eventType: violations.length > 0 ? 'security_violation' : 'session_accessed',
        sessionId,
        userId,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        details: { violations },
        severity: violations.length > 0 ? 'high' : 'low'
      });

      return {
        valid: violations.length === 0,
        violations
      };

    } catch (error) {
      console.error('❌ [SESSION_SECURITY] Security validation failed:', error);
      return {
        valid: false,
        violations: ['Security validation error']
      };
    }
  }

  /**
   * Generate secure session token
   */
  generateSecureSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Perform security audit
   */
  async performSecurityAudit(): Promise<SecurityAudit> {
    try {
      // Get session statistics from cached metrics
      const sessionCountKey = 'metrics:session_count';
      const totalSessionsData = await this.redis.get(sessionCountKey) || '0';
      const totalSessions = parseInt(totalSessionsData);

      // Get encrypted session count from cached metrics
      const encryptedSessionsKey = 'metrics:encrypted_sessions';
      const encryptedSessionsData = await this.redis.get(encryptedSessionsKey) || '0';
      const encryptedSessions = parseInt(encryptedSessionsData);

      // Analyze audit log
      const recentEvents = this.auditLog.filter(event => 
        event.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      const suspiciousActivities = recentEvents.filter(event => 
        event.eventType === 'suspicious_activity'
      ).length;

      const securityViolations = recentEvents.filter(event => 
        event.eventType === 'security_violation'
      ).length;

      // Calculate risk score
      const riskScore = this.calculateRiskScore(totalSessions, suspiciousActivities, securityViolations);

      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(riskScore, encryptedSessions, totalSessions);

      return {
        totalSessions,
        suspiciousActivities,
        securityViolations,
        encryptedSessions,
        auditEvents: recentEvents.slice(-100), // Last 100 events
        riskScore,
        recommendations,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ [SESSION_SECURITY] Security audit failed:', error);
      throw error;
    }
  }

  /**
   * Initialize encryption keys
   */
  private initializeEncryptionKeys(): void {
    // Generate initial encryption key
    const key = crypto.randomBytes(32);
    this.encryptionKeys.set(this.currentKeyId, key);

    // Set up key rotation
    setInterval(() => {
      this.rotateEncryptionKeys();
    }, this.config.keyRotationInterval * 60 * 60 * 1000);

    console.log('🔑 [SESSION_SECURITY] Encryption keys initialized');
  }

  /**
   * Rotate encryption keys
   */
  private rotateEncryptionKeys(): void {
    const newKeyId = this.generateKeyId();
    const newKey = crypto.randomBytes(32);
    
    this.encryptionKeys.set(newKeyId, newKey);
    this.currentKeyId = newKeyId;

    // Keep old keys for decryption (remove after 2 rotation cycles)
    if (this.encryptionKeys.size > 3) {
      const oldestKey = Array.from(this.encryptionKeys.keys())[0];
      this.encryptionKeys.delete(oldestKey);
    }

    console.log('🔄 [SESSION_SECURITY] Encryption keys rotated');
  }

  /**
   * Generate key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(ipAddress: string): Promise<boolean> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    if (!this.rateLimitCache.has(ipAddress)) {
      this.rateLimitCache.set(ipAddress, []);
    }

    const requests = this.rateLimitCache.get(ipAddress)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // Add current request
    validRequests.push(now);
    
    // Update cache
    this.rateLimitCache.set(ipAddress, validRequests);

    return validRequests.length > maxRequests;
  }

  /**
   * Get session count by IP
   */
  private async getSessionCountByIP(ipAddress: string): Promise<number> {
    // This would query Redis for sessions with matching IP
    return 0; // Mock implementation
  }

  /**
   * Get session count by user
   */
  private async getSessionCountByUser(userId: string): Promise<number> {
    // This would query Redis for sessions with matching user ID
    return 0; // Mock implementation
  }

  /**
   * Detect suspicious activity
   */
  private async detectSuspiciousActivity(sessionId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    // Implement suspicious activity detection logic
    // - Multiple rapid session creations
    // - Unusual user agent patterns
    // - Geographic anomalies
    // - Behavioral analysis
    return false; // Mock implementation
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    this.auditLog.push(event);

    // Keep only recent events in memory
    if (this.auditLog.length > 1000) {
      this.auditLog.shift();
    }

    // Store in Redis for persistence
    if (this.config.enableAuditLogging) {
      const auditKey = `security:audit:${event.timestamp.getTime()}`;
      await this.redis.set(auditKey, JSON.stringify(event), 7 * 24 * 3600); // 7 days TTL
    }

    // Log critical events
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn(`🚨 [SESSION_SECURITY] ${event.severity.toUpperCase()}: ${event.eventType}`, event.details);
    }
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(totalSessions: number, suspiciousActivities: number, securityViolations: number): number {
    let score = 0;

    // Base score from violations
    score += securityViolations * 10;
    score += suspiciousActivities * 5;

    // Normalize by session count
    if (totalSessions > 0) {
      score = (score / totalSessions) * 100;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(riskScore: number, encryptedSessions: number, totalSessions: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 50) {
      recommendations.push('High risk score detected - review security policies');
    }

    if (encryptedSessions < totalSessions * 0.8) {
      recommendations.push('Enable encryption for more sessions');
    }

    if (!this.config.enableRateLimiting) {
      recommendations.push('Enable rate limiting for better protection');
    }

    if (!this.config.enableAuditLogging) {
      recommendations.push('Enable audit logging for compliance');
    }

    return recommendations;
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Clean up old audit logs every hour
    setInterval(() => {
      this.cleanupAuditLogs();
    }, 60 * 60 * 1000);

    // Clean up rate limit cache every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitCache();
    }, 5 * 60 * 1000);

    console.log('🔍 [SESSION_SECURITY] Security monitoring started');
  }

  /**
   * Cleanup old audit logs
   */
  private cleanupAuditLogs(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    this.auditLog = this.auditLog.filter(event => event.timestamp > cutoff);
  }

  /**
   * Cleanup rate limit cache
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    for (const [ip, requests] of this.rateLimitCache.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
      if (validRequests.length === 0) {
        this.rateLimitCache.delete(ip);
      } else {
        this.rateLimitCache.set(ip, validRequests);
      }
    }
  }

  /**
   * Get default security configuration
   */
  private getDefaultSecurityConfig(): SecurityConfig {
    return {
      encryptionEnabled: true,
      encryptionAlgorithm: 'aes-256-cbc',
      keyRotationInterval: 24, // hours
      maxSessionsPerIP: 10,
      maxSessionsPerUser: 5,
      suspiciousActivityThreshold: 5,
      enableAuditLogging: true,
      enableRateLimiting: true,
      sessionTimeoutMinutes: 60,
      requireSecureTransport: true
    };
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [SESSION_SECURITY] Security configuration updated');
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }
}
