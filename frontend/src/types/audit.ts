/**
 * Audit Type Definitions - Phase 3 Week 21-22
 * Comprehensive TypeScript interfaces for Indonesian government audit compliance
 * 
 * Compatible with UU No. 27 Tahun 2022 (Personal Data Protection Law)
 * Supports tamper-proof audit trails and digital signatures
 */

// Import compliance and encryption types for consistency
import type { DataClassification, LegalBasis } from './compliance';
import type { EncryptionAlgorithm } from './encryption';

// Re-export for external use
export type { DataClassification, LegalBasis } from './compliance';
export type { EncryptionAlgorithm } from './encryption';

/**
 * Audit Event Types
 * Comprehensive categorization of auditable events
 */
export type AuditEventType = 
  // User Authentication Events
  | 'user_login'
  | 'user_logout'
  | 'user_registration'
  | 'user_authentication_failed'
  | 'user_password_change'
  | 'user_account_locked'
  | 'user_account_unlocked'
  
  // Data Access Events
  | 'data_access'
  | 'data_read'
  | 'data_write'
  | 'data_modification'
  | 'data_deletion'
  | 'data_export'
  | 'data_import'
  | 'data_backup'
  | 'data_restore'
  
  // AI Processing Events
  | 'ai_processing'
  | 'ai_query'
  | 'ai_response'
  | 'ai_training'
  | 'ai_model_update'
  | 'ai_inference'
  
  // Security Events
  | 'security_violation'
  | 'encryption_operation'
  | 'key_generation'
  | 'key_rotation'
  | 'key_revocation'
  | 'certificate_issued'
  | 'certificate_revoked'
  | 'signature_generation'
  | 'signature_verification'
  
  // Compliance Events
  | 'compliance_check'
  | 'compliance_violation'
  | 'consent_granted'
  | 'consent_withdrawn'
  | 'data_retention_policy_applied'
  | 'data_anonymization'
  | 'breach_notification'
  
  // System Events
  | 'system_startup'
  | 'system_shutdown'
  | 'system_error'
  | 'system_maintenance'
  | 'configuration_change'
  | 'service_registration'
  | 'service_deregistration'
  
  // Government Integration Events
  | 'government_data_request'
  | 'government_data_response'
  | 'government_system_integration'
  | 'government_compliance_check'
  | 'government_audit_request'
  
  // Audit System Events
  | 'audit_event'
  | 'audit_chain_validation'
  | 'audit_integrity_check'
  | 'audit_export'
  | 'audit_archive';

/**
 * Audit Event Outcome Types
 */
export type AuditEventOutcome = 'success' | 'failure' | 'warning' | 'info';

/**
 * Audit Event Severity Levels
 */
export type AuditEventSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Digital Signature Algorithm Types
 */
export type DigitalSignatureAlgorithm = 'RSA-4096' | 'ECDSA-P384' | 'EdDSA';

/**
 * Hash Algorithm Types
 */
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Audit Storage Types
 */
export type AuditStorageType = 'local' | 'database' | 'blockchain' | 'hybrid' | 'distributed';

/**
 * Compliance Standards
 */
export type ComplianceStandard = 
  | 'UU_27_2022'      // Indonesian Personal Data Protection Law
  | 'ISO_27001'       // Information Security Management
  | 'SOC_2'           // Service Organization Control 2
  | 'GDPR'            // General Data Protection Regulation
  | 'NIST_CSF'        // NIST Cybersecurity Framework
  | 'BSSN'            // Badan Siber dan Sandi Negara
  | 'SNI_ISO_27001';  // Standar Nasional Indonesia

/**
 * Core Audit Event Interface
 * Base structure for all audit events
 */
export interface AuditEvent {
  // Event Identification
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  
  // User Context
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  
  // Event Details
  resource: string;
  action: string;
  outcome: AuditEventOutcome;
  severity?: AuditEventSeverity;
  details: any;
  
  // Data Classification
  classification: DataClassification;
  legalBasis?: LegalBasis;
  processingPurpose?: string;
  
  // Retention and Compliance
  retentionPeriod: number; // days
  complianceStandards?: ComplianceStandard[];
  
  // Audit Chain Integrity
  chainIndex: number;
  previousEventHash?: string;
  integrityHash: string;
  
  // Digital Signature
  digitalSignature?: DigitalSignature;
  
  // Additional Metadata
  correlationId?: string;
  parentEventId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Digital Signature Interface
 * Government-grade digital signatures for audit integrity
 */
export interface DigitalSignature {
  algorithm: DigitalSignatureAlgorithm;
  hashAlgorithm: HashAlgorithm;
  signature: string; // Base64 encoded
  publicKey: string; // Base64 encoded
  keyId: string;
  signerId: string;
  timestamp: Date;
  certificateChain?: string[]; // Certificate chain for validation
  timestampToken?: string; // Trusted timestamp token
  nonRepudiation: boolean;
}

/**
 * Audit Chain Validation Result
 * Results of audit chain integrity validation
 */
export interface AuditChainValidation {
  isValid: boolean;
  validationTime: number; // milliseconds
  lastValidatedIndex: number;
  integrityScore: number; // 0-100
  
  // Integrity Issues
  brokenLinks: number[];
  tamperedEvents: string[];
  missingSignatures: string[];
  invalidSignatures: string[];
  
  // Validation Details
  totalEvents: number;
  validatedEvents: number;
  skippedEvents: number;
  
  // Recommendations
  recommendations?: string[];
  criticalIssues?: string[];
}

/**
 * Audit Search Criteria
 * Flexible search parameters for audit events
 */
export interface AuditSearchCriteria {
  // Time Range
  startDate?: Date;
  endDate?: Date;
  
  // Event Filters
  eventTypes?: AuditEventType[];
  outcomes?: AuditEventOutcome[];
  severities?: AuditEventSeverity[];
  
  // User Filters
  userIds?: string[];
  sessionIds?: string[];
  ipAddresses?: string[];
  
  // Data Filters
  classifications?: DataClassification[];
  resources?: string[];
  actions?: string[];
  
  // Compliance Filters
  complianceStandards?: ComplianceStandard[];
  legalBases?: LegalBasis[];
  
  // Search Options
  searchText?: string;
  tags?: string[];
  correlationId?: string;
  parentEventId?: string;
  
  // Pagination
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Validation Filters
  signatureRequired?: boolean;
  integrityValidated?: boolean;
  includeDeleted?: boolean;
}

/**
 * Audit Statistics Interface
 * Comprehensive audit system statistics
 */
export interface AuditStatistics {
  // Event Counts
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByOutcome: Record<AuditEventOutcome, number>;
  eventsByClassification: Record<DataClassification, number>;
  eventsBySeverity: Record<AuditEventSeverity, number>;
  
  // Time-based Statistics
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  eventsThisYear: number;
  
  // Integrity Statistics
  chainIntegrityScore: number;
  signedEvents: number;
  unsignedEvents: number;
  validSignatures: number;
  invalidSignatures: number;
  
  // Performance Statistics
  averageEventSize: number; // bytes
  averageProcessingTime: number; // milliseconds
  storageUsed: number; // bytes
  
  // Compliance Statistics
  complianceScore: number; // 0-100
  complianceViolations: number;
  retentionCompliance: number; // percentage
  
  // System Health
  lastValidation: Date | null;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: number; // milliseconds
}

/**
 * Audit Configuration Interface
 * Comprehensive audit system configuration
 */
export interface AuditConfiguration {
  // Core Settings
  enabled: boolean;
  enableTamperProofing: boolean;
  enableDigitalSignatures: boolean;
  enableRealTimeValidation: boolean;
  
  // Retention Settings
  defaultRetentionPeriod: number; // days
  maxRetentionPeriod: number; // days
  autoArchiveEnabled: boolean;
  autoDeleteEnabled: boolean;
  
  // Storage Settings
  storageType: AuditStorageType;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
  
  // Blockchain Settings
  blockchainIntegration: boolean;
  blockchainProvider?: string;
  blockchainNetwork?: string;
  
  // Performance Settings
  maxChainLength: number;
  validationInterval: number; // milliseconds
  batchSize: number;
  asyncProcessing: boolean;
  
  // Compliance Settings
  complianceLevel: 'standard' | 'government' | 'classified';
  requiredStandards: ComplianceStandard[];
  auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  // Notification Settings
  alertOnViolations: boolean;
  alertOnIntegrityFailure: boolean;
  alertOnStorageThreshold: boolean;
  notificationChannels: string[];
  
  // Security Settings
  requireSignatures: boolean;
  signatureAlgorithm: DigitalSignatureAlgorithm;
  hashAlgorithm: HashAlgorithm;
  keyRotationInterval: number; // hours
  
  // Export Settings
  exportFormats: string[];
  exportEncryption: boolean;
  exportSignatures: boolean;
}

/**
 * Audit Export Format
 * Supported formats for audit data export
 */
export interface AuditExportFormat {
  format: 'json' | 'xml' | 'csv' | 'pdf' | 'blockchain';
  encrypted: boolean;
  signed: boolean;
  compressed: boolean;
  includeMetadata: boolean;
  includeSignatures: boolean;
  includeCertificates: boolean;
}

/**
 * Audit Report Interface
 * Comprehensive audit reporting structure
 */
export interface AuditReport {
  // Report Metadata
  reportId: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'summary' | 'detailed' | 'compliance' | 'forensic';
  
  // Report Period
  startDate: Date;
  endDate: Date;
  
  // Report Content
  statistics: AuditStatistics;
  events: AuditEvent[];
  violations: ComplianceViolation[];
  recommendations: string[];
  
  // Validation Results
  chainValidation: AuditChainValidation;
  complianceValidation: ComplianceValidationResult;
  
  // Report Signature
  digitalSignature?: DigitalSignature;
  reportHash: string;
}

/**
 * Compliance Violation Interface
 * Detailed compliance violation information
 */
export interface ComplianceViolation {
  violationId: string;
  timestamp: Date;
  violationType: string;
  severity: AuditEventSeverity;
  description: string;
  affectedEvents: string[];
  complianceStandard: ComplianceStandard;
  remediation: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

/**
 * Compliance Validation Result
 * Results of compliance validation checks
 */
export interface ComplianceValidationResult {
  isCompliant: boolean;
  complianceScore: number; // 0-100
  validationTime: number; // milliseconds
  
  // Standard-specific Results
  standardResults: Record<ComplianceStandard, {
    compliant: boolean;
    score: number;
    violations: ComplianceViolation[];
    recommendations: string[];
  }>;
  
  // Overall Results
  totalViolations: number;
  criticalViolations: number;
  highViolations: number;
  mediumViolations: number;
  lowViolations: number;
  
  // Recommendations
  recommendations: string[];
  nextAuditDate: Date;
}

// Default audit configuration for Indonesian government compliance
export const DEFAULT_GOVERNMENT_AUDIT_CONFIG: AuditConfiguration = {
  enabled: true,
  enableTamperProofing: true,
  enableDigitalSignatures: true,
  enableRealTimeValidation: true,
  defaultRetentionPeriod: 2555, // 7 years
  maxRetentionPeriod: 3650, // 10 years
  autoArchiveEnabled: true,
  autoDeleteEnabled: false, // Never auto-delete government records
  storageType: 'hybrid',
  compressionEnabled: false,
  encryptionEnabled: true,
  backupEnabled: true,
  blockchainIntegration: false, // Enable in production
  maxChainLength: 100000,
  validationInterval: 300000, // 5 minutes
  batchSize: 1000,
  asyncProcessing: true,
  complianceLevel: 'government',
  requiredStandards: ['UU_27_2022', 'ISO_27001', 'BSSN'],
  auditFrequency: 'monthly',
  alertOnViolations: true,
  alertOnIntegrityFailure: true,
  alertOnStorageThreshold: true,
  notificationChannels: ['email', 'sms', 'dashboard'],
  requireSignatures: true,
  signatureAlgorithm: 'RSA-4096',
  hashAlgorithm: 'SHA-256',
  keyRotationInterval: 2160, // 90 days
  exportFormats: ['json', 'xml', 'pdf'],
  exportEncryption: true,
  exportSignatures: true
};
