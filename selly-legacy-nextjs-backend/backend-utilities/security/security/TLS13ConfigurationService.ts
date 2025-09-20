/**
 * TLS 1.3 Configuration Service - Phase 3 Week 2
 * Implements TLS 1.3 with approved cipher suites for Indonesian government compliance
 * 
 * Provides secure transport layer configuration for government-grade communications
 */

import crypto from 'crypto';
import { z } from 'zod';

// Schema Definitions
export const TLSConfigurationSchema = z.object({
  minVersion: z.enum(['TLSv1.2', 'TLSv1.3']),
  maxVersion: z.enum(['TLSv1.3']),
  cipherSuites: z.array(z.string()),
  enableOCSP: z.boolean(),
  enableSCT: z.boolean(),
  requireClientCert: z.boolean(),
  enableHSTS: z.boolean(),
  hstsMaxAge: z.number()
});

export interface TLSConfiguration {
  minVersion: 'TLSv1.2' | 'TLSv1.3';
  maxVersion: 'TLSv1.3';
  cipherSuites: string[];
  enableOCSP: boolean; // Online Certificate Status Protocol
  enableSCT: boolean; // Signed Certificate Timestamps
  requireClientCert: boolean;
  enableHSTS: boolean; // HTTP Strict Transport Security
  hstsMaxAge: number; // seconds
  enablePerfectForwardSecrecy: boolean;
  enableSessionTickets: boolean;
  sessionTimeout: number; // seconds
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  keySize: number;
  signatureAlgorithm: string;
  isValid: boolean;
  isGovernmentApproved: boolean;
}

export interface TLSConnectionInfo {
  version: string;
  cipherSuite: string;
  keyExchange: string;
  authentication: string;
  encryption: string;
  mac: string;
  compression: string;
  serverCertificate: CertificateInfo;
  clientCertificate?: CertificateInfo;
  sessionId: string;
  sessionTicket?: string;
  connectionTime: Date;
  isSecure: boolean;
  complianceLevel: 'standard' | 'government' | 'classified';
}

export interface TLSMetrics {
  totalConnections: number;
  secureConnections: number;
  failedHandshakes: number;
  certificateErrors: number;
  protocolErrors: number;
  averageHandshakeTime: number; // milliseconds
  tls13Connections: number;
  tls12Connections: number;
  perfectForwardSecrecyConnections: number;
  complianceScore: number;
}

/**
 * TLS 1.3 Configuration Service
 * Implements Indonesian government TLS standards
 */
export class TLS13ConfigurationService {
  private config: TLSConfiguration;
  private metrics: TLSMetrics;
  private approvedCipherSuites: string[];
  private governmentCertificates: Map<string, CertificateInfo>;
  private isInitialized: boolean;

  constructor(config: Partial<TLSConfiguration> = {}) {
    this.config = {
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      cipherSuites: [], // Will be populated with approved suites
      enableOCSP: true,
      enableSCT: true,
      requireClientCert: false,
      enableHSTS: true,
      hstsMaxAge: 31536000, // 1 year
      enablePerfectForwardSecrecy: true,
      enableSessionTickets: false, // Disabled for government compliance
      sessionTimeout: 300, // 5 minutes
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.approvedCipherSuites = [];
    this.governmentCertificates = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the TLS 1.3 Configuration Service
   */
  async initialize(): Promise<void> {
    console.log('🔒 [TLS13_CONFIG] Initializing TLS 1.3 configuration service...');
    
    try {
      // Load approved cipher suites for Indonesian government
      await this.loadApprovedCipherSuites();
      
      // Initialize government certificate store
      await this.initializeGovernmentCertificates();
      
      // Validate TLS configuration
      await this.validateTLSConfiguration();
      
      this.isInitialized = true;
      console.log('✅ [TLS13_CONFIG] TLS 1.3 configuration service initialized successfully');
      
    } catch (error) {
      console.error('❌ [TLS13_CONFIG] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get TLS 1.3 configuration for server
   */
  getServerTLSConfig(): {
    secureProtocol: string;
    minVersion: string;
    maxVersion: string;
    ciphers: string;
    honorCipherOrder: boolean;
    secureOptions: number;
    sessionTimeout: number;
    ticketKeys?: Buffer[];
  } {
    console.log('🔧 [TLS13_CONFIG] Generating server TLS configuration...');
    
    // Node.js TLS constants
    const SSL_OP_NO_SSLv2 = 0x01000000;
    const SSL_OP_NO_SSLv3 = 0x02000000;
    const SSL_OP_NO_TLSv1 = 0x04000000;
    const SSL_OP_NO_TLSv1_1 = 0x10000000;
    const SSL_OP_CIPHER_SERVER_PREFERENCE = 0x00400000;
    const SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION = 0x00010000;
    
    let secureOptions = SSL_OP_NO_SSLv2 | SSL_OP_NO_SSLv3 | SSL_OP_NO_TLSv1 | SSL_OP_NO_TLSv1_1;
    
    if (this.config.minVersion === 'TLSv1.3') {
      // Force TLS 1.3 only for maximum security
      secureOptions |= 0x20000000; // SSL_OP_NO_TLSv1_2 equivalent
    }
    
    secureOptions |= SSL_OP_CIPHER_SERVER_PREFERENCE;
    secureOptions |= SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

    const tlsConfig: any = {
      secureProtocol: 'TLSv1_3_method',
      minVersion: this.config.minVersion,
      maxVersion: this.config.maxVersion,
      ciphers: this.approvedCipherSuites.join(':'),
      honorCipherOrder: true,
      secureOptions,
      sessionTimeout: this.config.sessionTimeout
    };

    // Add session ticket keys if disabled (for government compliance)
    if (!this.config.enableSessionTickets) {
      tlsConfig.ticketKeys = []; // Empty array disables session tickets
    }

    console.log('✅ [TLS13_CONFIG] Server TLS configuration generated');
    return tlsConfig;
  }

  /**
   * Get TLS 1.3 configuration for client
   */
  getClientTLSConfig(): {
    secureProtocol: string;
    minVersion: string;
    maxVersion: string;
    ciphers: string;
    checkServerIdentity: boolean;
    rejectUnauthorized: boolean;
    secureOptions: number;
  } {
    console.log('🔧 [TLS13_CONFIG] Generating client TLS configuration...');
    
    const SSL_OP_NO_SSLv2 = 0x01000000;
    const SSL_OP_NO_SSLv3 = 0x02000000;
    const SSL_OP_NO_TLSv1 = 0x04000000;
    const SSL_OP_NO_TLSv1_1 = 0x10000000;
    
    let secureOptions = SSL_OP_NO_SSLv2 | SSL_OP_NO_SSLv3 | SSL_OP_NO_TLSv1 | SSL_OP_NO_TLSv1_1;
    
    if (this.config.minVersion === 'TLSv1.3') {
      secureOptions |= 0x20000000; // Force TLS 1.3 only
    }

    const tlsConfig = {
      secureProtocol: 'TLSv1_3_method',
      minVersion: this.config.minVersion,
      maxVersion: this.config.maxVersion,
      ciphers: this.approvedCipherSuites.join(':'),
      checkServerIdentity: true,
      rejectUnauthorized: true,
      secureOptions
    };

    console.log('✅ [TLS13_CONFIG] Client TLS configuration generated');
    return tlsConfig;
  }

  /**
   * Validate TLS connection security
   */
  validateTLSConnection(connectionInfo: Partial<TLSConnectionInfo>): {
    isValid: boolean;
    securityLevel: 'low' | 'medium' | 'high' | 'government';
    violations: string[];
    recommendations: string[];
    complianceScore: number;
  } {
    console.log('🔍 [TLS13_CONFIG] Validating TLS connection security...');
    
    const violations: string[] = [];
    const recommendations: string[] = [];
    let securityLevel: 'low' | 'medium' | 'high' | 'government' = 'low';
    let complianceScore = 0;

    // Check TLS version
    if (connectionInfo.version === 'TLSv1.3') {
      complianceScore += 30;
      securityLevel = 'high';
    } else if (connectionInfo.version === 'TLSv1.2') {
      complianceScore += 20;
      securityLevel = 'medium';
      recommendations.push('Upgrade to TLS 1.3 for enhanced security');
    } else {
      violations.push(`Insecure TLS version: ${connectionInfo.version}`);
      recommendations.push('Use TLS 1.3 or minimum TLS 1.2');
    }

    // Check cipher suite
    if (connectionInfo.cipherSuite && this.approvedCipherSuites.includes(connectionInfo.cipherSuite)) {
      complianceScore += 25;
    } else {
      violations.push(`Unapproved cipher suite: ${connectionInfo.cipherSuite}`);
      recommendations.push('Use government-approved cipher suites');
    }

    // Check perfect forward secrecy
    if (connectionInfo.keyExchange?.includes('ECDHE') || connectionInfo.keyExchange?.includes('DHE')) {
      complianceScore += 20;
    } else {
      violations.push('Perfect Forward Secrecy not enabled');
      recommendations.push('Enable Perfect Forward Secrecy with ECDHE or DHE key exchange');
    }

    // Check certificate
    if (connectionInfo.serverCertificate?.isValid) {
      complianceScore += 15;
      if (connectionInfo.serverCertificate.isGovernmentApproved) {
        complianceScore += 10;
        securityLevel = 'government';
      }
    } else {
      violations.push('Invalid server certificate');
      recommendations.push('Use valid government-approved certificates');
    }

    const isValid = violations.length === 0 && complianceScore >= 70;

    const result = {
      isValid,
      securityLevel,
      violations,
      recommendations,
      complianceScore
    };

    console.log(`✅ [TLS13_CONFIG] TLS connection validation completed. Score: ${complianceScore}/100`);
    return result;
  }

  /**
   * Generate HSTS headers for government compliance
   */
  generateHSTSHeaders(): Record<string, string> {
    if (!this.config.enableHSTS) {
      return {};
    }

    return {
      'Strict-Transport-Security': `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  /**
   * Get TLS metrics
   */
  getMetrics(): TLSMetrics {
    return { ...this.metrics };
  }

  /**
   * Load approved cipher suites for Indonesian government
   */
  private async loadApprovedCipherSuites(): Promise<void> {
    // Indonesian government approved TLS 1.3 cipher suites
    this.approvedCipherSuites = [
      // TLS 1.3 cipher suites (AEAD only)
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      
      // TLS 1.2 fallback cipher suites (if TLS 1.2 is allowed)
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'DHE-RSA-AES256-GCM-SHA384',
      'DHE-RSA-AES128-GCM-SHA256'
    ];

    // Update configuration with approved cipher suites
    this.config.cipherSuites = this.approvedCipherSuites;

    console.log(`🔐 [TLS13_CONFIG] Loaded ${this.approvedCipherSuites.length} approved cipher suites`);
  }

  /**
   * Initialize government certificate store
   */
  private async initializeGovernmentCertificates(): Promise<void> {
    // In production, this would load actual government CA certificates
    // For now, we'll create placeholder certificate info
    
    const governmentCA: CertificateInfo = {
      subject: 'CN=Indonesian Government Root CA, O=Republic of Indonesia, C=ID',
      issuer: 'CN=Indonesian Government Root CA, O=Republic of Indonesia, C=ID',
      validFrom: new Date('2020-01-01'),
      validTo: new Date('2030-12-31'),
      fingerprint: crypto.createHash('sha256').update('indonesian-gov-ca').digest('hex'),
      keySize: 4096,
      signatureAlgorithm: 'RSA-SHA256',
      isValid: true,
      isGovernmentApproved: true
    };

    this.governmentCertificates.set('indonesian-gov-ca', governmentCA);

    console.log('🏛️ [TLS13_CONFIG] Government certificate store initialized');
  }

  /**
   * Validate TLS configuration
   */
  private async validateTLSConfiguration(): Promise<void> {
    // Validate configuration against Indonesian government standards
    TLSConfigurationSchema.parse(this.config);

    // Ensure minimum security requirements
    if (this.config.minVersion !== 'TLSv1.3' && this.config.minVersion !== 'TLSv1.2') {
      throw new Error('Minimum TLS version must be 1.2 or 1.3 for government compliance');
    }

    if (this.config.cipherSuites.length === 0) {
      throw new Error('At least one approved cipher suite must be configured');
    }

    if (!this.config.enableHSTS) {
      console.warn('⚠️ [TLS13_CONFIG] HSTS is disabled - consider enabling for enhanced security');
    }

    console.log('✅ [TLS13_CONFIG] TLS configuration validation passed');
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): TLSMetrics {
    return {
      totalConnections: 0,
      secureConnections: 0,
      failedHandshakes: 0,
      certificateErrors: 0,
      protocolErrors: 0,
      averageHandshakeTime: 0,
      tls13Connections: 0,
      tls12Connections: 0,
      perfectForwardSecrecyConnections: 0,
      complianceScore: 100
    };
  }

  /**
   * Record TLS connection metrics
   */
  recordConnection(connectionInfo: TLSConnectionInfo, handshakeTime: number): void {
    this.metrics.totalConnections++;
    
    if (connectionInfo.isSecure) {
      this.metrics.secureConnections++;
    }

    if (connectionInfo.version === 'TLSv1.3') {
      this.metrics.tls13Connections++;
    } else if (connectionInfo.version === 'TLSv1.2') {
      this.metrics.tls12Connections++;
    }

    if (connectionInfo.keyExchange?.includes('ECDHE') || connectionInfo.keyExchange?.includes('DHE')) {
      this.metrics.perfectForwardSecrecyConnections++;
    }

    // Update average handshake time
    this.metrics.averageHandshakeTime = 
      (this.metrics.averageHandshakeTime * (this.metrics.totalConnections - 1) + handshakeTime) / 
      this.metrics.totalConnections;
  }

  /**
   * Get system status
   */
  getStatus(): {
    isInitialized: boolean;
    tlsVersion: string;
    approvedCipherSuites: number;
    hstsEnabled: boolean;
    governmentCompliant: boolean;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    return {
      isInitialized: this.isInitialized,
      tlsVersion: this.config.maxVersion,
      approvedCipherSuites: this.approvedCipherSuites.length,
      hstsEnabled: this.config.enableHSTS,
      governmentCompliant: this.config.minVersion === 'TLSv1.3' && this.config.enableHSTS,
      systemHealth: this.isInitialized ? 'healthy' : 'unhealthy'
    };
  }
}

// Singleton instance
let tls13ConfigurationService: TLS13ConfigurationService | null = null;

export function getTLS13ConfigurationService(config?: Partial<TLSConfiguration>): TLS13ConfigurationService {
  if (!tls13ConfigurationService) {
    tls13ConfigurationService = new TLS13ConfigurationService(config);
  }
  return tls13ConfigurationService;
}
