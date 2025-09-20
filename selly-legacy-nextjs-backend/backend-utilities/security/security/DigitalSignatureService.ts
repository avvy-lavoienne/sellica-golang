/**
 * Digital Signature Service - Phase 3 Week 21-22
 * RSA-4096 digital signatures for audit integrity and government compliance
 * 
 * Implements government-grade digital signatures with certificate management
 * Compatible with Indonesian government PKI standards
 */

import crypto from 'crypto';
import type { DataClassification } from '../../types/compliance';
import type { GovernmentGradeEncryption } from './GovernmentGradeEncryption';

export interface DigitalSignatureConfig {
  algorithm: 'RSA-4096' | 'ECDSA-P384' | 'EdDSA';
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  keyRotationInterval: number; // hours
  certificateValidityPeriod: number; // days
  enableCertificateChain: boolean;
  enableTimestamping: boolean;
  enableRevocationChecking: boolean;
  complianceLevel: 'standard' | 'government' | 'classified';
}

export interface SigningKey {
  keyId: string;
  algorithm: string;
  publicKey: string; // PEM format
  privateKey: string; // PEM format (encrypted)
  certificate?: X509Certificate;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked' | 'compromised';
  usage: 'signing' | 'verification' | 'both';
  classification: DataClassification;
}

export interface X509Certificate {
  version: number;
  serialNumber: string;
  issuer: CertificateSubject;
  subject: CertificateSubject;
  validFrom: Date;
  validTo: Date;
  publicKey: string;
  signature: string;
  extensions?: CertificateExtension[];
}

export interface CertificateSubject {
  commonName: string;
  organization: string;
  organizationalUnit?: string;
  country: string;
  state?: string;
  locality?: string;
  emailAddress?: string;
}

export interface CertificateExtension {
  oid: string;
  critical: boolean;
  value: string;
}

export interface DigitalSignatureResult {
  signature: string; // Base64 encoded
  algorithm: string;
  hashAlgorithm: string;
  keyId: string;
  timestamp: Date;
  certificateChain?: string[];
  timestampToken?: string;
}

export interface SignatureVerificationResult {
  isValid: boolean;
  keyId: string;
  algorithm: string;
  timestamp: Date;
  certificateValid: boolean;
  trustChainValid: boolean;
  notRevoked: boolean;
  errorMessage?: string;
  verificationTime: number; // milliseconds
}

export interface CertificateAuthority {
  name: string;
  rootCertificate: string;
  intermediateCertificates: string[];
  crlEndpoint?: string; // Certificate Revocation List
  ocspEndpoint?: string; // Online Certificate Status Protocol
}

/**
 * Digital Signature Service
 * Implements government-grade digital signatures with PKI support
 */
export class DigitalSignatureService {
  private static instance: DigitalSignatureService;
  private config: DigitalSignatureConfig;
  private signingKeys: Map<string, SigningKey>;
  private certificateAuthorities: Map<string, CertificateAuthority>;
  private encryptionService: GovernmentGradeEncryption | null;
  private isInitialized: boolean = false;

  private constructor(config?: Partial<DigitalSignatureConfig>) {
    this.config = {
      algorithm: 'RSA-4096',
      hashAlgorithm: 'SHA-256',
      keyRotationInterval: 2160, // 90 days
      certificateValidityPeriod: 1095, // 3 years
      enableCertificateChain: true,
      enableTimestamping: true,
      enableRevocationChecking: false, // Disabled for development
      complianceLevel: 'government',
      ...config
    };

    this.signingKeys = new Map();
    this.certificateAuthorities = new Map();
    this.encryptionService = null;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<DigitalSignatureConfig>): DigitalSignatureService {
    if (!DigitalSignatureService.instance) {
      DigitalSignatureService.instance = new DigitalSignatureService(config);
    }
    return DigitalSignatureService.instance;
  }

  /**
   * Initialize digital signature service
   */
  public async initialize(encryptionService?: GovernmentGradeEncryption): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔏 [DIGITAL_SIGNATURE] Initializing digital signature service...');

    try {
      this.encryptionService = encryptionService || null;

      // Generate master signing keys
      await this.generateMasterSigningKeys();

      // Initialize certificate authorities
      await this.initializeCertificateAuthorities();

      this.isInitialized = true;
      console.log('✅ [DIGITAL_SIGNATURE] Digital signature service initialized');

    } catch (error) {
      console.error('❌ [DIGITAL_SIGNATURE] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate digital signature for data
   */
  public async generateSignature(
    data: any,
    keyId?: string,
    classification: DataClassification = 'internal'
  ): Promise<DigitalSignatureResult> {
    const startTime = performance.now();

    try {
      // Get signing key
      const signingKey = keyId ? this.signingKeys.get(keyId) : this.getDefaultSigningKey(classification);
      if (!signingKey || signingKey.status !== 'active') {
        throw new Error(`No active signing key available for classification: ${classification}`);
      }

      // Prepare data for signing
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataHash = crypto.createHash(this.config.hashAlgorithm.toLowerCase().replace('-', '')).update(dataString).digest();

      // Create signature
      const signature = crypto.sign(this.config.hashAlgorithm.toLowerCase(), dataHash, signingKey.privateKey);

      const result: DigitalSignatureResult = {
        signature: signature.toString('base64'),
        algorithm: signingKey.algorithm,
        hashAlgorithm: this.config.hashAlgorithm,
        keyId: signingKey.keyId,
        timestamp: new Date()
      };

      // Add certificate chain if enabled
      if (this.config.enableCertificateChain && signingKey.certificate) {
        result.certificateChain = [this.encodeCertificate(signingKey.certificate)];
      }

      // Add timestamp token if enabled
      if (this.config.enableTimestamping) {
        result.timestampToken = await this.generateTimestampToken(result.signature);
      }

      const processingTime = performance.now() - startTime;
      console.log(`🔏 [DIGITAL_SIGNATURE] Generated signature with key ${signingKey.keyId} (${processingTime.toFixed(2)}ms)`);

      return result;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [DIGITAL_SIGNATURE] Signature generation failed (${processingTime.toFixed(2)}ms):`, error);
      throw error;
    }
  }

  /**
   * Verify digital signature
   */
  public async verifySignature(
    data: any,
    signatureResult: DigitalSignatureResult
  ): Promise<SignatureVerificationResult> {
    const startTime = performance.now();

    try {
      const verification: SignatureVerificationResult = {
        isValid: false,
        keyId: signatureResult.keyId,
        algorithm: signatureResult.algorithm,
        timestamp: signatureResult.timestamp,
        certificateValid: true,
        trustChainValid: true,
        notRevoked: true,
        verificationTime: 0
      };

      // Get signing key
      const signingKey = this.signingKeys.get(signatureResult.keyId);
      if (!signingKey) {
        verification.errorMessage = `Signing key not found: ${signatureResult.keyId}`;
        verification.verificationTime = performance.now() - startTime;
        return verification;
      }

      // Prepare data for verification
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataHash = crypto.createHash(signatureResult.hashAlgorithm.toLowerCase().replace('-', '')).update(dataString).digest();

      // Verify signature
      const signatureBuffer = Buffer.from(signatureResult.signature, 'base64');
      verification.isValid = crypto.verify(
        signatureResult.hashAlgorithm.toLowerCase(),
        dataHash,
        signingKey.publicKey,
        signatureBuffer
      );

      // Verify certificate if present
      if (signatureResult.certificateChain && signatureResult.certificateChain.length > 0) {
        verification.certificateValid = await this.verifyCertificateChain(signatureResult.certificateChain);
      }

      // Check revocation status if enabled
      if (this.config.enableRevocationChecking) {
        verification.notRevoked = await this.checkRevocationStatus(signatureResult.keyId);
      }

      // Verify timestamp token if present
      if (signatureResult.timestampToken) {
        const timestampValid = await this.verifyTimestampToken(signatureResult.timestampToken);
        if (!timestampValid) {
          verification.isValid = false;
          verification.errorMessage = 'Invalid timestamp token';
        }
      }

      verification.verificationTime = performance.now() - startTime;

      if (verification.isValid) {
        console.log(`✅ [DIGITAL_SIGNATURE] Signature verified for key ${signatureResult.keyId} (${verification.verificationTime.toFixed(2)}ms)`);
      } else {
        console.warn(`⚠️ [DIGITAL_SIGNATURE] Signature verification failed for key ${signatureResult.keyId}: ${verification.errorMessage}`);
      }

      return verification;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [DIGITAL_SIGNATURE] Signature verification error (${processingTime.toFixed(2)}ms):`, error);

      return {
        isValid: false,
        keyId: signatureResult.keyId,
        algorithm: signatureResult.algorithm,
        timestamp: signatureResult.timestamp,
        certificateValid: false,
        trustChainValid: false,
        notRevoked: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown verification error',
        verificationTime: processingTime
      };
    }
  }

  /**
   * Generate master signing keys for different classifications
   */
  private async generateMasterSigningKeys(): Promise<void> {
    const classifications: DataClassification[] = ['public', 'internal', 'confidential', 'secret'];

    for (const classification of classifications) {
      try {
        const signingKey = await this.generateSigningKey(classification);
        this.signingKeys.set(signingKey.keyId, signingKey);
        console.log(`🔑 [DIGITAL_SIGNATURE] Generated ${classification} signing key: ${signingKey.keyId}`);
      } catch (error) {
        console.error(`❌ [DIGITAL_SIGNATURE] Failed to generate ${classification} signing key:`, error);
      }
    }
  }

  /**
   * Generate new signing key
   */
  private async generateSigningKey(classification: DataClassification): Promise<SigningKey> {
    const keyId = crypto.randomUUID();

    // Generate RSA-4096 key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // Encrypt private key if encryption service is available
    let encryptedPrivateKey = privateKey;
    if (this.encryptionService) {
      try {
        const encrypted = await this.encryptionService.encryptSensitiveData(
          privateKey,
          classification,
          'key_encryption'
        );
        encryptedPrivateKey = JSON.stringify(encrypted);
      } catch (error) {
        console.warn('⚠️ [DIGITAL_SIGNATURE] Failed to encrypt private key, storing unencrypted');
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.certificateValidityPeriod * 24 * 60 * 60 * 1000);

    const signingKey: SigningKey = {
      keyId,
      algorithm: this.config.algorithm,
      publicKey,
      privateKey: encryptedPrivateKey,
      createdAt: now,
      expiresAt,
      status: 'active',
      usage: 'both',
      classification
    };

    // Generate self-signed certificate if enabled
    if (this.config.enableCertificateChain) {
      signingKey.certificate = await this.generateSelfSignedCertificate(signingKey);
    }

    return signingKey;
  }

  /**
   * Generate self-signed certificate
   */
  private async generateSelfSignedCertificate(signingKey: SigningKey): Promise<X509Certificate> {
    const subject: CertificateSubject = {
      commonName: `SELLY Audit System ${signingKey.classification}`,
      organization: 'Dinas Kependudukan dan Pencatatan Sipil',
      organizationalUnit: 'Digital Services',
      country: 'ID',
      state: 'Jawa Barat',
      locality: 'Garut',
      emailAddress: 'admin@disdukcapil-garut.go.id'
    };

    // Create certificate data
    const certificateData = {
      version: 3,
      serialNumber: crypto.randomBytes(16).toString('hex'),
      issuer: subject,
      subject: subject,
      validFrom: signingKey.createdAt,
      validTo: signingKey.expiresAt,
      publicKey: signingKey.publicKey
    };

    // Generate signature for certificate
    const certificateString = JSON.stringify(certificateData);
    const certificateHash = crypto.createHash('sha256').update(certificateString).digest();
    const signature = crypto.sign('sha256', certificateHash, signingKey.privateKey);

    const certificate: X509Certificate = {
      ...certificateData,
      signature: signature.toString('base64'),
      extensions: [
        {
          oid: '2.5.29.15', // Key Usage
          critical: true,
          value: 'digitalSignature,keyEncipherment'
        },
        {
          oid: '2.5.29.37', // Extended Key Usage
          critical: false,
          value: 'serverAuth,clientAuth'
        }
      ]
    };

    return certificate;
  }

  /**
   * Get default signing key for classification
   */
  private getDefaultSigningKey(classification: DataClassification): SigningKey | undefined {
    for (const [keyId, key] of this.signingKeys) {
      if (key.classification === classification && key.status === 'active') {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Initialize certificate authorities
   */
  private async initializeCertificateAuthorities(): Promise<void> {
    // Mock Indonesian Government CA for development
    const indonesianGovCA: CertificateAuthority = {
      name: 'Indonesian Government Root CA',
      rootCertificate: 'mock_root_certificate_base64',
      intermediateCertificates: ['mock_intermediate_certificate_base64'],
      crlEndpoint: 'https://crl.pki.go.id/root.crl',
      ocspEndpoint: 'https://ocsp.pki.go.id'
    };

    this.certificateAuthorities.set('indonesian_gov', indonesianGovCA);
    console.log('🏛️ [DIGITAL_SIGNATURE] Initialized certificate authorities');
  }

  /**
   * Verify certificate chain
   */
  private async verifyCertificateChain(certificateChain: string[]): Promise<boolean> {
    // Mock certificate chain verification for development
    // In production, this would validate against real CA certificates
    return certificateChain.length > 0;
  }

  /**
   * Check revocation status
   */
  private async checkRevocationStatus(keyId: string): Promise<boolean> {
    // Mock revocation check for development
    // In production, this would check CRL or OCSP
    return true;
  }

  /**
   * Generate timestamp token
   */
  private async generateTimestampToken(signature: string): Promise<string> {
    // Mock timestamp token for development
    // In production, this would use a trusted timestamp authority
    const timestamp = new Date().toISOString();
    const tokenData = { signature, timestamp };
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  /**
   * Verify timestamp token
   */
  private async verifyTimestampToken(timestampToken: string): Promise<boolean> {
    try {
      const tokenData = JSON.parse(Buffer.from(timestampToken, 'base64').toString());
      return tokenData.signature && tokenData.timestamp;
    } catch {
      return false;
    }
  }

  /**
   * Encode certificate to PEM format
   */
  private encodeCertificate(certificate: X509Certificate): string {
    // Mock certificate encoding for development
    // In production, this would generate proper X.509 PEM format
    return Buffer.from(JSON.stringify(certificate)).toString('base64');
  }

  /**
   * Get signature statistics
   */
  public getSignatureStatistics(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    keysByClassification: Record<DataClassification, number>;
  } {
    const stats = {
      totalKeys: this.signingKeys.size,
      activeKeys: 0,
      expiredKeys: 0,
      keysByClassification: {} as Record<DataClassification, number>
    };

    for (const key of this.signingKeys.values()) {
      if (key.status === 'active') {
        stats.activeKeys++;
      } else if (key.status === 'expired') {
        stats.expiredKeys++;
      }

      stats.keysByClassification[key.classification] = (stats.keysByClassification[key.classification] || 0) + 1;
    }

    return stats;
  }

  /**
   * Rotate expired signing keys
   */
  public async rotateExpiredKeys(): Promise<number> {
    const now = new Date();
    let rotatedCount = 0;

    for (const [keyId, key] of this.signingKeys) {
      if (key.status === 'active' && now > key.expiresAt) {
        try {
          // Mark old key as expired
          key.status = 'expired';

          // Generate new key
          const newKey = await this.generateSigningKey(key.classification);
          this.signingKeys.set(newKey.keyId, newKey);

          rotatedCount++;
          console.log(`🔄 [DIGITAL_SIGNATURE] Rotated ${key.classification} signing key: ${keyId} -> ${newKey.keyId}`);

        } catch (error) {
          console.error(`❌ [DIGITAL_SIGNATURE] Failed to rotate key ${keyId}:`, error);
        }
      }
    }

    if (rotatedCount > 0) {
      console.log(`🔄 [DIGITAL_SIGNATURE] Rotated ${rotatedCount} expired signing keys`);
    }

    return rotatedCount;
  }
}
