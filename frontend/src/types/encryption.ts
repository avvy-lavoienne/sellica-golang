/**
 * Encryption Type Definitions - Phase 3 Week 19-20
 * Government-Grade Encryption Types for Indonesian Compliance
 * 
 * Compatible with UU No. 27 Tahun 2022 (Personal Data Protection Law)
 * Supports AES-256-GCM, TLS 1.3, and Hardware Security Module (HSM) integration
 */

// Re-export compliance types for consistency
import type { DataClassification } from './compliance';
export type { DataClassification } from './compliance';

/**
 * Encryption Algorithm Types
 * Government-approved encryption algorithms
 */
export type EncryptionAlgorithm = 
  | 'AES-256-GCM'      // Primary: Government-grade symmetric encryption
  | 'AES-256-CBC'      // Alternative: For legacy compatibility
  | 'ChaCha20-Poly1305' // Alternative: High-performance encryption
  | 'RSA-4096'         // Asymmetric: For key exchange
  | 'ECDSA-P384';      // Elliptic curve: For digital signatures

/**
 * Key Derivation Function Types
 * Approved key derivation methods
 */
export type KeyDerivationFunction = 
  | 'PBKDF2'    // Standard: Password-Based Key Derivation Function 2
  | 'Argon2id'  // Recommended: Memory-hard function
  | 'scrypt'    // Alternative: Sequential memory-hard function
  | 'HKDF';     // HMAC-based: Key Derivation Function

/**
 * Encryption Configuration
 * Complete configuration for government-grade encryption
 */
export interface EncryptionConfiguration {
  // Core Algorithm Settings
  algorithm: EncryptionAlgorithm;
  keyDerivation: KeyDerivationFunction;
  
  // Key Management
  keyRotationInterval: number; // hours (default: 2160 = 90 days)
  keyRetentionPeriod: number;  // days (default: 2555 = 7 years)
  keyEscrowEnabled: boolean;   // Required for government compliance
  
  // Hardware Security Module
  hsmEnabled: boolean;         // Use HSM for highest security keys
  hsmProvider?: string;        // HSM provider (e.g., 'AWS CloudHSM', 'Azure Dedicated HSM')
  
  // Compliance Level
  complianceLevel: 'standard' | 'government' | 'classified';
  
  // Cryptographic Parameters
  keyLength: number;           // bits (256 for AES-256)
  ivLength: number;            // bytes (12 for GCM)
  tagLength: number;           // bytes (16 for GCM)
  saltLength: number;          // bytes (32 recommended)
  iterations: number;          // PBKDF2 iterations (100000+ recommended)
  
  // Performance Settings
  enableCompression: boolean;  // Compress before encryption
  enableParallelProcessing: boolean; // Use multiple threads
  maxConcurrentOperations: number;   // Limit concurrent operations
}

/**
 * Encryption Key Metadata
 * Complete key lifecycle information
 */
export interface EncryptionKeyMetadata {
  version: number;             // Key version for rotation tracking
  rotationCount: number;       // Number of times key has been rotated
  lastUsed: Date;             // Last usage timestamp
  usageCount: number;         // Total usage count
  createdBy?: string;         // User who created the key
  rotatedBy?: string;         // User who last rotated the key
  purpose: string[];          // Allowed purposes for this key
  restrictions?: {
    maxUsageCount?: number;   // Maximum allowed usage
    allowedOperations?: ('encrypt' | 'decrypt' | 'sign' | 'verify')[];
    allowedClassifications?: DataClassification[];
  };
}

/**
 * Key Status Types
 * Comprehensive key lifecycle states
 */
export type KeyStatus = 
  | 'generating'    // Key is being generated
  | 'active'        // Key is active and can be used
  | 'rotating'      // Key is being rotated
  | 'deprecated'    // Key is deprecated but still usable
  | 'expired'       // Key has expired
  | 'revoked'       // Key has been revoked
  | 'compromised'   // Key is suspected to be compromised
  | 'destroyed';    // Key has been securely destroyed

/**
 * Key Usage Types
 * Defines how a key can be used
 */
export type KeyUsage = 
  | 'encryption'     // Data encryption/decryption
  | 'signing'        // Digital signatures
  | 'key_agreement'  // Key exchange
  | 'key_wrapping'   // Key encryption
  | 'authentication' // Authentication tokens
  | 'audit_logging'; // Audit trail protection

/**
 * Encryption Operation Types
 * All possible encryption operations for audit logging
 */
export type EncryptionOperation = 
  | 'encrypt'        // Data encryption
  | 'decrypt'        // Data decryption
  | 'key_generate'   // Key generation
  | 'key_rotate'     // Key rotation
  | 'key_revoke'     // Key revocation
  | 'key_destroy'    // Key destruction
  | 'key_export'     // Key export (for escrow)
  | 'key_import'     // Key import
  | 'sign'           // Digital signing
  | 'verify'         // Signature verification
  | 'key_derive';    // Key derivation

/**
 * Encryption Performance Metrics
 * Detailed performance tracking
 */
export interface EncryptionPerformanceMetrics {
  processingTime: number;      // milliseconds
  dataSize: number;           // bytes
  throughput?: number;        // bytes per second
  cpuUsage?: number;          // percentage
  memoryUsage?: number;       // bytes
  cacheHitRate?: number;      // percentage
  operationType: EncryptionOperation;
  timestamp: Date;
}

/**
 * Encryption Audit Entry
 * Complete audit trail for compliance
 */
export interface EncryptionAuditEntry {
  // Operation Details
  operation: EncryptionOperation;
  operationId: string;        // Unique operation identifier
  
  // Key Information
  keyId: string;
  keyVersion?: number;
  
  // Data Classification
  dataClassification: DataClassification;
  dataCategory?: string;      // Additional categorization
  
  // User Context
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Timing
  timestamp: Date;
  duration: number;           // milliseconds
  
  // Result
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Performance
  performanceMetrics: EncryptionPerformanceMetrics;
  
  // Compliance
  complianceFlags?: {
    requiresNotification: boolean;  // Breach notification required
    requiresApproval: boolean;      // Operation requires approval
    retentionPeriod: number;        // Days to retain audit entry
    classification: DataClassification;
  };
  
  // Digital Signature (for tamper-proof audit)
  digitalSignature?: string;
  signatureAlgorithm?: string;
}

/**
 * Encryption Error Types
 * Comprehensive error classification
 */
export interface EncryptionError extends Error {
  code: string;
  category: 'key_management' | 'encryption' | 'decryption' | 'configuration' | 'compliance' | 'hsm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  timestamp: Date;
  context?: {
    keyId?: string;
    operation?: EncryptionOperation;
    dataClassification?: DataClassification;
    userId?: string;
  };
}

/**
 * HSM (Hardware Security Module) Interface
 * Standardized interface for HSM operations
 */
export interface HSMInterface {
  // Initialization
  initialize(config?: any): Promise<void>;
  isAvailable(): boolean;
  getStatus(): Promise<HSMStatus>;
  
  // Key Management
  generateKey(options: HSMKeyGenerationOptions): Promise<string>; // Returns key ID
  importKey(keyData: Buffer, options: HSMKeyImportOptions): Promise<string>;
  exportKey(keyId: string, options: HSMKeyExportOptions): Promise<Buffer>;
  destroyKey(keyId: string): Promise<void>;
  
  // Cryptographic Operations
  encrypt(data: Buffer, keyId: string, options?: HSMEncryptionOptions): Promise<Buffer>;
  decrypt(encryptedData: Buffer, keyId: string, options?: HSMDecryptionOptions): Promise<Buffer>;
  sign(data: Buffer, keyId: string, algorithm: string): Promise<Buffer>;
  verify(data: Buffer, signature: Buffer, keyId: string, algorithm: string): Promise<boolean>;
  
  // Audit and Compliance
  getAuditLog(startDate?: Date, endDate?: Date): Promise<HSMAuditEntry[]>;
  getKeyMetadata(keyId: string): Promise<HSMKeyMetadata>;
}

/**
 * HSM Status Information
 */
export interface HSMStatus {
  connected: boolean;
  authenticated: boolean;
  firmwareVersion: string;
  availableSlots: number;
  usedSlots: number;
  supportedAlgorithms: EncryptionAlgorithm[];
  complianceCertifications: string[];
  lastHealthCheck: Date;
}

/**
 * HSM Key Generation Options
 */
export interface HSMKeyGenerationOptions {
  algorithm: EncryptionAlgorithm;
  keyLength: number;
  usage: KeyUsage[];
  extractable: boolean;
  persistent: boolean;
  label?: string;
  classification: DataClassification;
}

/**
 * HSM Key Import Options
 */
export interface HSMKeyImportOptions {
  algorithm: EncryptionAlgorithm;
  usage: KeyUsage[];
  persistent: boolean;
  label?: string;
  classification: DataClassification;
}

/**
 * HSM Key Export Options
 */
export interface HSMKeyExportOptions {
  format: 'raw' | 'pkcs8' | 'pkcs1' | 'spki';
  password?: string;
  wrappingKeyId?: string;
}

/**
 * HSM Encryption Options
 */
export interface HSMEncryptionOptions {
  algorithm?: EncryptionAlgorithm;
  iv?: Buffer;
  additionalData?: Buffer;
}

/**
 * HSM Decryption Options
 */
export interface HSMDecryptionOptions {
  algorithm?: EncryptionAlgorithm;
  iv?: Buffer;
  additionalData?: Buffer;
  authTag?: Buffer;
}

/**
 * HSM Audit Entry
 */
export interface HSMAuditEntry {
  timestamp: Date;
  operation: string;
  keyId?: string;
  userId?: string;
  result: 'success' | 'failure';
  errorCode?: string;
  details?: any;
}

/**
 * HSM Key Metadata
 */
export interface HSMKeyMetadata {
  keyId: string;
  algorithm: EncryptionAlgorithm;
  keyLength: number;
  usage: KeyUsage[];
  created: Date;
  lastUsed?: Date;
  usageCount: number;
  extractable: boolean;
  persistent: boolean;
  label?: string;
  classification: DataClassification;
}

/**
 * Encryption Service Interface
 * Standardized interface for encryption services
 */
export interface EncryptionServiceInterface {
  // Initialization
  initialize(config?: Partial<EncryptionConfiguration>): Promise<void>;
  isInitialized(): boolean;
  
  // Key Management
  generateKey(purpose: string, classification: DataClassification): Promise<string>; // Returns key ID
  rotateKey(keyId: string): Promise<string>; // Returns new key ID
  revokeKey(keyId: string, reason?: string): Promise<void>;
  
  // Encryption Operations
  encrypt(data: any, classification: DataClassification, purpose?: string, userId?: string): Promise<any>;
  decrypt(encryptedData: any, userId?: string): Promise<any>;
  
  // Audit and Compliance
  getAuditLog(startDate?: Date, endDate?: Date): Promise<EncryptionAuditEntry[]>;
  getMetrics(): Promise<EncryptionPerformanceMetrics[]>;
  validateCompliance(): Promise<boolean>;
}

// Default encryption configuration for Indonesian government compliance
export const DEFAULT_GOVERNMENT_ENCRYPTION_CONFIG: EncryptionConfiguration = {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'Argon2id',
  keyRotationInterval: 2160, // 90 days
  keyRetentionPeriod: 2555,  // 7 years
  keyEscrowEnabled: true,
  hsmEnabled: false, // Enable in production
  complianceLevel: 'government',
  keyLength: 256,
  ivLength: 12,
  tagLength: 16,
  saltLength: 32,
  iterations: 100000,
  enableCompression: false,
  enableParallelProcessing: true,
  maxConcurrentOperations: 10
};
