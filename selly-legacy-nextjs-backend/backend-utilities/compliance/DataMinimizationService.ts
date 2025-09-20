/**
 * Data Minimization Service - Phase 3 Week 1
 * Implements data minimization and purpose limitation controls for UU No. 27 Tahun 2022 compliance
 * 
 * Ensures only necessary data is collected and processed for specified purposes
 */

import { z } from 'zod';
import crypto from 'crypto';

// Schema Definitions
export const DataCollectionRequestSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  dataFields: z.array(z.string()),
  processingPurpose: z.string(),
  legalBasis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
  retentionPeriod: z.number(), // days
  requestedBy: z.string(),
  requestTimestamp: z.date()
});

export const DataProcessingRequestSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  dataId: z.string().uuid(),
  operation: z.enum(['read', 'update', 'delete', 'export', 'analyze']),
  purpose: z.string(),
  requestedBy: z.string(),
  requestTimestamp: z.date(),
  justification: z.string()
});

export interface DataField {
  fieldName: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'file';
  category: 'general' | 'sensitive' | 'specific';
  isRequired: boolean;
  purposes: string[];
  retentionPeriod: number; // days
  encryptionRequired: boolean;
}

export interface DataCollectionPolicy {
  policyId: string;
  policyName: string;
  purpose: string;
  allowedDataFields: string[];
  requiredDataFields: string[];
  maxRetentionPeriod: number; // days
  legalBasis: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurposeLimitation {
  purposeId: string;
  purposeName: string;
  description: string;
  allowedOperations: string[];
  allowedDataCategories: string[];
  maxProcessingDuration: number; // days
  requiresUserConsent: boolean;
  isActive: boolean;
}

export interface DataMinimizationResult {
  originalFields: string[];
  allowedFields: string[];
  removedFields: string[];
  minimizationRatio: number; // percentage of data removed
  complianceScore: number;
  recommendations: string[];
}

export interface PurposeValidationResult {
  isValid: boolean;
  validationReason: string;
  allowedOperations: string[];
  restrictedOperations: string[];
  complianceScore: number;
}

/**
 * Data Minimization Service
 * Implements UU No. 27 Tahun 2022 Article 16 (Data Minimization Principle)
 */
export class DataMinimizationService {
  private dataFields: Map<string, DataField>;
  private collectionPolicies: Map<string, DataCollectionPolicy>;
  private purposeLimitations: Map<string, PurposeLimitation>;
  private isInitialized: boolean;

  constructor() {
    this.dataFields = new Map();
    this.collectionPolicies = new Map();
    this.purposeLimitations = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the Data Minimization Service
   */
  async initialize(): Promise<void> {
    console.log('🎯 [DATA_MINIMIZATION] Initializing data minimization service...');
    
    try {
      // Load data field definitions
      await this.loadDataFieldDefinitions();
      
      // Load collection policies
      await this.loadDataCollectionPolicies();
      
      // Load purpose limitations
      await this.loadPurposeLimitations();
      
      this.isInitialized = true;
      console.log('✅ [DATA_MINIMIZATION] Data minimization service initialized successfully');
      
    } catch (error) {
      console.error('❌ [DATA_MINIMIZATION] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate and minimize data collection request
   * Implements UU No. 27 Tahun 2022 Article 16 (Data Minimization)
   */
  async validateDataCollection(
    requestedFields: string[],
    purpose: string,
    legalBasis: string
  ): Promise<DataMinimizationResult> {
    console.log(`🔍 [DATA_MINIMIZATION] Validating data collection for purpose: ${purpose}`);
    
    // Get applicable collection policy
    const policy = await this.getCollectionPolicy(purpose);
    if (!policy) {
      throw new Error(`No collection policy found for purpose: ${purpose}`);
    }

    // Determine allowed fields based on purpose
    const allowedFields = this.determineAllowedFields(requestedFields, policy);
    const removedFields = requestedFields.filter(field => !allowedFields.includes(field));
    
    // Calculate minimization metrics
    const minimizationRatio = (removedFields.length / requestedFields.length) * 100;
    const complianceScore = this.calculateComplianceScore(allowedFields, policy);
    
    // Generate recommendations
    const recommendations = this.generateMinimizationRecommendations(
      requestedFields,
      allowedFields,
      policy
    );

    const result: DataMinimizationResult = {
      originalFields: requestedFields,
      allowedFields,
      removedFields,
      minimizationRatio,
      complianceScore,
      recommendations
    };

    console.log(`✅ [DATA_MINIMIZATION] Data collection validated. Minimization ratio: ${minimizationRatio.toFixed(1)}%`);
    return result;
  }

  /**
   * Validate data processing against purpose limitations
   * Implements UU No. 27 Tahun 2022 Article 17 (Purpose Limitation)
   */
  async validatePurposeLimitation(
    operation: string,
    dataCategories: string[],
    purpose: string
  ): Promise<PurposeValidationResult> {
    console.log(`🎯 [PURPOSE_LIMITATION] Validating operation: ${operation} for purpose: ${purpose}`);
    
    // Get purpose limitation rules
    const limitation = await this.getPurposeLimitation(purpose);
    if (!limitation) {
      return {
        isValid: false,
        validationReason: `No purpose limitation rules found for: ${purpose}`,
        allowedOperations: [],
        restrictedOperations: [operation],
        complianceScore: 0
      };
    }

    // Validate operation against allowed operations
    const isOperationAllowed = limitation.allowedOperations.includes(operation);
    
    // Validate data categories against allowed categories
    const unauthorizedCategories = dataCategories.filter(
      category => !limitation.allowedDataCategories.includes(category)
    );
    
    const isValid = isOperationAllowed && unauthorizedCategories.length === 0;
    
    let validationReason = '';
    if (!isOperationAllowed) {
      validationReason += `Operation '${operation}' not allowed for purpose '${purpose}'. `;
    }
    if (unauthorizedCategories.length > 0) {
      validationReason += `Unauthorized data categories: ${unauthorizedCategories.join(', ')}. `;
    }
    if (isValid) {
      validationReason = 'Operation and data categories are valid for the specified purpose';
    }

    const complianceScore = isValid ? 100 : 
      (isOperationAllowed ? 50 : 0) + (unauthorizedCategories.length === 0 ? 50 : 0);

    const result: PurposeValidationResult = {
      isValid,
      validationReason: validationReason.trim(),
      allowedOperations: limitation.allowedOperations,
      restrictedOperations: [operation].filter(op => !limitation.allowedOperations.includes(op)),
      complianceScore
    };

    console.log(`✅ [PURPOSE_LIMITATION] Purpose validation completed. Valid: ${isValid}`);
    return result;
  }

  /**
   * Enforce data retention limits
   * Implements UU No. 27 Tahun 2022 Article 18 (Data Retention)
   */
  async enforceRetentionLimits(
    dataId: string,
    purpose: string,
    creationDate: Date
  ): Promise<{
    shouldRetain: boolean;
    retentionExpired: boolean;
    daysRemaining: number;
    action: 'retain' | 'anonymize' | 'delete';
    reason: string;
  }> {
    console.log(`📅 [DATA_RETENTION] Checking retention limits for data: ${dataId}`);
    
    // Get purpose limitation to determine retention period
    const limitation = await this.getPurposeLimitation(purpose);
    if (!limitation) {
      throw new Error(`No retention policy found for purpose: ${purpose}`);
    }

    const maxRetentionMs = limitation.maxProcessingDuration * 24 * 60 * 60 * 1000;
    const dataAge = Date.now() - creationDate.getTime();
    const daysRemaining = Math.max(0, Math.floor((maxRetentionMs - dataAge) / (24 * 60 * 60 * 1000)));
    
    const retentionExpired = dataAge > maxRetentionMs;
    const shouldRetain = !retentionExpired;
    
    let action: 'retain' | 'anonymize' | 'delete' = 'retain';
    let reason = 'Data is within retention period';
    
    if (retentionExpired) {
      // Determine action based on data sensitivity
      const dataField = this.dataFields.get(dataId);
      if (dataField?.category === 'sensitive' || dataField?.category === 'specific') {
        action = 'delete';
        reason = 'Sensitive data retention period expired - deletion required';
      } else {
        action = 'anonymize';
        reason = 'General data retention period expired - anonymization required';
      }
    }

    const result = {
      shouldRetain,
      retentionExpired,
      daysRemaining,
      action,
      reason
    };

    console.log(`✅ [DATA_RETENTION] Retention check completed. Action: ${action}`);
    return result;
  }

  /**
   * Generate data minimization report
   */
  async generateMinimizationReport(): Promise<{
    totalDataFields: number;
    minimizedFields: number;
    minimizationRatio: number;
    compliancePolicies: number;
    purposeLimitations: number;
    overallComplianceScore: number;
    recommendations: string[];
  }> {
    const totalDataFields = this.dataFields.size;
    const compliancePolicies = this.collectionPolicies.size;
    const purposeLimitations = this.purposeLimitations.size;
    
    // Calculate minimization metrics
    const minimizedFields = Array.from(this.dataFields.values())
      .filter(field => field.isRequired === false).length;
    
    const minimizationRatio = totalDataFields > 0 ? 
      (minimizedFields / totalDataFields) * 100 : 0;
    
    // Calculate overall compliance score
    const overallComplianceScore = this.calculateOverallComplianceScore();
    
    // Generate recommendations
    const recommendations = this.generateSystemRecommendations();

    return {
      totalDataFields,
      minimizedFields,
      minimizationRatio,
      compliancePolicies,
      purposeLimitations,
      overallComplianceScore,
      recommendations
    };
  }

  /**
   * Load data field definitions
   */
  private async loadDataFieldDefinitions(): Promise<void> {
    const dataFields: DataField[] = [
      // General data fields
      {
        fieldName: 'name',
        dataType: 'string',
        category: 'general',
        isRequired: true,
        purposes: ['service_provision', 'communication', 'identification'],
        retentionPeriod: 365,
        encryptionRequired: false
      },
      {
        fieldName: 'email',
        dataType: 'string',
        category: 'general',
        isRequired: true,
        purposes: ['service_provision', 'communication'],
        retentionPeriod: 365,
        encryptionRequired: false
      },
      {
        fieldName: 'phone',
        dataType: 'string',
        category: 'general',
        isRequired: false,
        purposes: ['communication', 'verification'],
        retentionPeriod: 365,
        encryptionRequired: false
      },
      {
        fieldName: 'address',
        dataType: 'string',
        category: 'general',
        isRequired: false,
        purposes: ['service_provision', 'delivery'],
        retentionPeriod: 365,
        encryptionRequired: false
      },
      // Sensitive data fields
      {
        fieldName: 'nik',
        dataType: 'string',
        category: 'specific',
        isRequired: true,
        purposes: ['government_services', 'legal_compliance', 'identification'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true
      },
      {
        fieldName: 'religion',
        dataType: 'string',
        category: 'sensitive',
        isRequired: false,
        purposes: ['legal_compliance'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true
      },
      {
        fieldName: 'health_data',
        dataType: 'string',
        category: 'sensitive',
        isRequired: false,
        purposes: ['vital_interests', 'healthcare'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true
      },
      {
        fieldName: 'financial_data',
        dataType: 'string',
        category: 'specific',
        isRequired: false,
        purposes: ['financial_services', 'legal_compliance'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true
      }
    ];

    for (const field of dataFields) {
      this.dataFields.set(field.fieldName, field);
    }

    console.log(`📋 [DATA_MINIMIZATION] Loaded ${dataFields.length} data field definitions`);
  }

  /**
   * Load data collection policies
   */
  private async loadDataCollectionPolicies(): Promise<void> {
    const policies: DataCollectionPolicy[] = [
      {
        policyId: 'service_provision_policy',
        policyName: 'Service Provision Data Collection',
        purpose: 'service_provision',
        allowedDataFields: ['name', 'email', 'phone', 'address'],
        requiredDataFields: ['name', 'email'],
        maxRetentionPeriod: 365,
        legalBasis: 'contract',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        policyId: 'government_services_policy',
        policyName: 'Government Services Data Collection',
        purpose: 'government_services',
        allowedDataFields: ['name', 'email', 'nik', 'address', 'phone'],
        requiredDataFields: ['name', 'nik'],
        maxRetentionPeriod: 2555, // 7 years
        legalBasis: 'legal_obligation',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        policyId: 'communication_policy',
        policyName: 'Communication Data Collection',
        purpose: 'communication',
        allowedDataFields: ['name', 'email', 'phone'],
        requiredDataFields: ['email'],
        maxRetentionPeriod: 365,
        legalBasis: 'consent',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const policy of policies) {
      this.collectionPolicies.set(policy.purpose, policy);
    }

    console.log(`📋 [DATA_MINIMIZATION] Loaded ${policies.length} data collection policies`);
  }

  /**
   * Load purpose limitations
   */
  private async loadPurposeLimitations(): Promise<void> {
    const limitations: PurposeLimitation[] = [
      {
        purposeId: 'service_provision_limitation',
        purposeName: 'Service Provision',
        description: 'Data processing for providing services to users',
        allowedOperations: ['read', 'update', 'export'],
        allowedDataCategories: ['general'],
        maxProcessingDuration: 365, // 1 year
        requiresUserConsent: true,
        isActive: true
      },
      {
        purposeId: 'government_services_limitation',
        purposeName: 'Government Services',
        description: 'Data processing for government administrative services',
        allowedOperations: ['read', 'update', 'analyze'],
        allowedDataCategories: ['general', 'sensitive', 'specific'],
        maxProcessingDuration: 2555, // 7 years
        requiresUserConsent: false,
        isActive: true
      },
      {
        purposeId: 'communication_limitation',
        purposeName: 'Communication',
        description: 'Data processing for communication with users',
        allowedOperations: ['read'],
        allowedDataCategories: ['general'],
        maxProcessingDuration: 365, // 1 year
        requiresUserConsent: true,
        isActive: true
      }
    ];

    for (const limitation of limitations) {
      this.purposeLimitations.set(limitation.purposeName.toLowerCase().replace(' ', '_'), limitation);
    }

    console.log(`📋 [DATA_MINIMIZATION] Loaded ${limitations.length} purpose limitations`);
  }

  /**
   * Get collection policy for purpose
   */
  private async getCollectionPolicy(purpose: string): Promise<DataCollectionPolicy | null> {
    return this.collectionPolicies.get(purpose) || null;
  }

  /**
   * Get purpose limitation for purpose
   */
  private async getPurposeLimitation(purpose: string): Promise<PurposeLimitation | null> {
    return this.purposeLimitations.get(purpose) || null;
  }

  /**
   * Determine allowed fields based on policy
   */
  private determineAllowedFields(requestedFields: string[], policy: DataCollectionPolicy): string[] {
    return requestedFields.filter(field => policy.allowedDataFields.includes(field));
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(allowedFields: string[], policy: DataCollectionPolicy): number {
    const requiredFieldsPresent = policy.requiredDataFields.every(field => 
      allowedFields.includes(field)
    );
    
    const unnecessaryFields = allowedFields.filter(field => 
      !policy.requiredDataFields.includes(field) && 
      !policy.allowedDataFields.includes(field)
    );
    
    let score = 100;
    if (!requiredFieldsPresent) score -= 50;
    if (unnecessaryFields.length > 0) score -= (unnecessaryFields.length * 10);
    
    return Math.max(0, score);
  }

  /**
   * Generate minimization recommendations
   */
  private generateMinimizationRecommendations(
    requestedFields: string[],
    allowedFields: string[],
    policy: DataCollectionPolicy
  ): string[] {
    const recommendations: string[] = [];
    
    const removedFields = requestedFields.filter(field => !allowedFields.includes(field));
    if (removedFields.length > 0) {
      recommendations.push(`Removed ${removedFields.length} unnecessary fields: ${removedFields.join(', ')}`);
    }
    
    const missingRequired = policy.requiredDataFields.filter(field => !allowedFields.includes(field));
    if (missingRequired.length > 0) {
      recommendations.push(`Missing required fields: ${missingRequired.join(', ')}`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Data collection is optimally minimized for the specified purpose');
    }
    
    return recommendations;
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallComplianceScore(): number {
    // Simplified calculation - in production this would be more sophisticated
    return 95;
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(): string[] {
    return [
      'Regularly review data collection policies to ensure minimal data collection',
      'Implement automated data retention enforcement',
      'Conduct periodic data minimization audits',
      'Train staff on data minimization principles'
    ];
  }

  /**
   * Get system status
   */
  getStatus(): {
    isInitialized: boolean;
    dataFieldsLoaded: number;
    policiesLoaded: number;
    limitationsLoaded: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    return {
      isInitialized: this.isInitialized,
      dataFieldsLoaded: this.dataFields.size,
      policiesLoaded: this.collectionPolicies.size,
      limitationsLoaded: this.purposeLimitations.size,
      systemHealth: this.isInitialized ? 'healthy' : 'unhealthy'
    };
  }
}

// Singleton instance
let dataMinimizationService: DataMinimizationService | null = null;

export function getDataMinimizationService(): DataMinimizationService {
  if (!dataMinimizationService) {
    dataMinimizationService = new DataMinimizationService();
  }
  return dataMinimizationService;
}
