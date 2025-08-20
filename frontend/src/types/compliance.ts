/**
 * Indonesian Government Compliance Types
 * Phase 3 Security Enhancement - TypeScript interfaces for compliance requirements
 * 
 * Implements UU No. 27 Tahun 2022 (Personal Data Protection Law) type definitions
 */

// Data Classification Levels (Indonesian Government Standards)
export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret';

// Legal Basis for Data Processing (UU No. 27 Tahun 2022)
export type LegalBasis = 
  | 'consent'              // Persetujuan
  | 'contract'             // Kontrak
  | 'legal_obligation'     // Kewajiban hukum
  | 'vital_interests'      // Kepentingan vital
  | 'public_task'          // Tugas publik
  | 'legitimate_interests'; // Kepentingan yang sah

// Data Categories for Indonesian Compliance
export interface DataCategory {
  category: 'general' | 'sensitive' | 'specific';
  dataTypes: string[];
  description: string;
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  classification: DataClassification;
}

// Processing Purposes for Indonesian Data Protection
export interface ProcessingPurpose {
  purpose: string;
  description: string;
  legalBasis: LegalBasis;
  dataMinimization: boolean;
  automatedDecisionMaking: boolean;
}

// Indonesian Government Data Protection Compliance Status
export interface ComplianceStatus {
  isCompliant: boolean;
  complianceLevel: 'full' | 'partial' | 'non_compliant';
  lastAuditDate: Date;
  nextAuditDue: Date;
  violations: ComplianceViolation[];
  recommendations: string[];
}

// Compliance Violation Types
export interface ComplianceViolation {
  violationType: 'consent' | 'data_minimization' | 'retention' | 'security' | 'notification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  status: 'open' | 'in_progress' | 'resolved';
  remediation: string[];
}

// Audit Trail Entry for Indonesian Compliance
export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: string;
  operation: string;
  dataCategories: string[];
  legalBasis: LegalBasis;
  processingPurpose: string;
  dataClassification: DataClassification;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  complianceStatus: 'validated' | 'warning' | 'violation';
  retentionPeriod: number; // days
  digitalSignature?: string;
}

// Breach Notification (72-hour requirement)
export interface BreachNotification {
  id: string;
  detectedAt: Date;
  reportedAt: Date;
  breachType: 'unauthorized_access' | 'data_loss' | 'system_compromise' | 'human_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  dataCategories: string[];
  dataClassification: DataClassification[];
  description: string;
  containmentActions: string[];
  notificationStatus: {
    authorities: 'pending' | 'notified' | 'acknowledged';
    users: 'pending' | 'notified' | 'acknowledged';
    timeline: {
      detection: Date;
      containment: Date;
      assessment: Date;
      notification: Date;
    };
  };
}

// Data Subject Rights (Indonesian Data Protection Law)
export interface DataSubjectRights {
  rightToAccess: boolean;
  rightToRectification: boolean;
  rightToErasure: boolean;
  rightToRestriction: boolean;
  rightToPortability: boolean;
  rightToObject: boolean;
  rightsRelatedToAutomatedDecisionMaking: boolean;
}

// Data Processing Record (Article 40 UU No. 27 Tahun 2022)
export interface DataProcessingRecord {
  id: string;
  dataController: string;
  dataProcessor?: string;
  processingPurpose: string;
  legalBasis: LegalBasis;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients: string[];
  internationalTransfers: {
    countries: string[];
    safeguards: string[];
  };
  retentionPeriod: number;
  securityMeasures: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Indonesian Government Integration Requirements
export interface GovernmentIntegrationCompliance {
  systemName: string;
  integrationLevel: 'basic' | 'standard' | 'advanced' | 'full';
  certificationStatus: {
    iso27001: boolean;
    sni: boolean; // Standar Nasional Indonesia
    bssn: boolean; // Badan Siber dan Sandi Negara
  };
  dataLocalization: {
    dataCenter: 'indonesia' | 'asean' | 'international';
    region: string;
    compliance: boolean;
  };
  auditRequirements: {
    frequency: 'monthly' | 'quarterly' | 'annually';
    lastAudit: Date;
    nextAudit: Date;
    auditor: string;
  };
}

// Consent Management Types
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  dataCategories: string[];
  processingPurposes: string[];
  legalBasis: LegalBasis;
  consentGiven: boolean;
  consentDate: Date;
  expiryDate?: Date;
  withdrawalDate?: Date;
  consentMethod: 'web_form' | 'mobile_app' | 'email' | 'phone' | 'in_person';
  ipAddress: string;
  userAgent: string;
  digitalSignature?: string;
  parentalConsent?: {
    required: boolean;
    obtained: boolean;
    parentId: string;
    verificationMethod: string;
  };
}

// Data Retention Policy
export interface DataRetentionPolicy {
  dataCategory: string;
  retentionPeriod: number; // days
  retentionReason: string;
  disposalMethod: 'secure_deletion' | 'anonymization' | 'archival';
  reviewFrequency: number; // days
  lastReview: Date;
  nextReview: Date;
  complianceRequirements: string[];
}

// Privacy Impact Assessment (Indonesian Requirements)
export interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  assessmentDate: Date;
  assessor: string;
  dataProcessingDescription: string;
  dataCategories: DataCategory[];
  legalBasis: LegalBasis[];
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  identifiedRisks: {
    risk: string;
    likelihood: number; // 1-5
    impact: number; // 1-5
    mitigation: string[];
  }[];
  recommendations: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'conditional';
  approver: string;
  approvalDate?: Date;
}

// Indonesian Language Support for Compliance
export interface IndonesianComplianceText {
  consentText: {
    id: string;
    en: string;
  };
  privacyNotice: {
    id: string;
    en: string;
  };
  dataSubjectRights: {
    id: string;
    en: string;
  };
  breachNotification: {
    id: string;
    en: string;
  };
}

// All types are already exported above, no need for re-export
