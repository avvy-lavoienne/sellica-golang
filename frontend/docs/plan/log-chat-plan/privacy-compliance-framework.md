# Privacy & Compliance Framework

**Document**: GDPR Compliance and Data Protection  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🔒 **GDPR Compliance Overview**

The SELLY Chat Logging System is designed with privacy-by-design principles to ensure full compliance with the General Data Protection Regulation (GDPR) and other applicable privacy laws.

### **Legal Basis for Processing**

**Article 6(1)(f) - Legitimate Interest**
- **Purpose**: AI model training and service improvement
- **Legitimate Interest**: Enhancing user experience and service quality
- **Balancing Test**: User benefits outweigh privacy risks
- **Safeguards**: Data minimization, anonymization, user control

---

## 📋 **Data Subject Rights Implementation**

### **Article 15 - Right of Access**

```typescript
// Data export functionality
export interface DataAccessRequest {
  userId?: string;
  guestUuid?: string;
  requestDate: Date;
  requestType: 'full_export' | 'summary' | 'specific_data';
  dataCategories: DataCategory[];
  format: 'json' | 'csv' | 'pdf';
}

export class DataAccessService {
  async exportUserData(request: DataAccessRequest): Promise<UserDataExport> {
    const startTime = performance.now();
    
    try {
      // Gather all user data
      const sessions = await this.getUserSessions(request);
      const messages = await this.getUserMessages(request);
      const preferences = await this.getUserPreferences(request);
      const consents = await this.getUserConsents(request);
      
      const exportData: UserDataExport = {
        userId: request.userId,
        guestUuid: request.guestUuid,
        exportDate: new Date(),
        sessions,
        messages: this.sanitizeExportData(messages),
        preferences,
        consents,
        metadata: {
          exportType: request.requestType,
          processingTime: performance.now() - startTime,
          dataCategories: request.dataCategories
        }
      };
      
      // Log the data access request for audit purposes
      await this.logDataAccess(request, exportData);
      
      return exportData;
    } catch (error) {
      await this.logDataAccessError(request, error);
      throw error;
    }
  }

  private sanitizeExportData(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(message => ({
      ...message,
      // Remove internal system fields from export
      id: undefined,
      sessionId: '[SESSION_ID]',
      ipAddress: undefined,
      userAgent: undefined
    }));
  }
}
```

### **Article 17 - Right to Erasure (Right to be Forgotten)**

```typescript
export interface DeletionRequest {
  userId?: string;
  guestUuid?: string;
  requestDate: Date;
  deletionScope: 'all_data' | 'chat_data' | 'specific_sessions';
  sessionIds?: string[];
  reason: DeletionReason;
  confirmationRequired: boolean;
}

export type DeletionReason = 
  | 'user_request'
  | 'data_no_longer_necessary'
  | 'consent_withdrawn'
  | 'unlawful_processing'
  | 'legal_obligation';

export class DataDeletionService {
  async processUserDeletion(request: DeletionRequest): Promise<DeletionReport> {
    const startTime = performance.now();
    
    try {
      // Validate deletion request
      await this.validateDeletionRequest(request);
      
      // Create audit record before deletion
      const auditRecord = await this.createDeletionAudit(request);
      
      let deletionReport: DeletionReport = {
        requestId: auditRecord.id,
        userId: request.userId,
        guestUuid: request.guestUuid,
        deletionDate: new Date(),
        scope: request.deletionScope,
        itemsDeleted: {
          sessions: 0,
          messages: 0,
          preferences: 0,
          consents: 0
        },
        processingTime: 0,
        errors: []
      };

      // Delete based on scope
      switch (request.deletionScope) {
        case 'all_data':
          deletionReport = await this.deleteAllUserData(request, deletionReport);
          break;
        case 'chat_data':
          deletionReport = await this.deleteChatData(request, deletionReport);
          break;
        case 'specific_sessions':
          deletionReport = await this.deleteSpecificSessions(request, deletionReport);
          break;
      }
      
      deletionReport.processingTime = performance.now() - startTime;
      
      // Update audit record with results
      await this.updateDeletionAudit(auditRecord.id, deletionReport);
      
      return deletionReport;
    } catch (error) {
      await this.logDeletionError(request, error);
      throw error;
    }
  }

  private async deleteAllUserData(
    request: DeletionRequest, 
    report: DeletionReport
  ): Promise<DeletionReport> {
    // Delete messages first (due to foreign key constraints)
    const messagesDeleted = await this.deleteUserMessages(request);
    report.itemsDeleted.messages = messagesDeleted;
    
    // Delete sessions
    const sessionsDeleted = await this.deleteUserSessions(request);
    report.itemsDeleted.sessions = sessionsDeleted;
    
    // Delete preferences
    const preferencesDeleted = await this.deleteUserPreferences(request);
    report.itemsDeleted.preferences = preferencesDeleted;
    
    // Delete consent records (keep audit trail)
    const consentsDeleted = await this.deleteUserConsents(request);
    report.itemsDeleted.consents = consentsDeleted;
    
    return report;
  }
}
```

### **Article 20 - Right to Data Portability**

```typescript
export interface DataPortabilityRequest {
  userId?: string;
  guestUuid?: string;
  targetFormat: 'json' | 'csv' | 'xml';
  includeMetadata: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export class DataPortabilityService {
  async exportPortableData(request: DataPortabilityRequest): Promise<PortableDataExport> {
    const data = await this.gatherPortableData(request);
    
    return {
      format: request.targetFormat,
      exportDate: new Date(),
      dataStructure: 'standardized',
      data: this.formatForPortability(data, request.targetFormat),
      metadata: request.includeMetadata ? this.generateMetadata(data) : undefined
    };
  }

  private formatForPortability(data: any, format: string): any {
    switch (format) {
      case 'json':
        return this.formatAsJSON(data);
      case 'csv':
        return this.formatAsCSV(data);
      case 'xml':
        return this.formatAsXML(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

---

## 🛡️ **Data Protection Measures**

### **Data Minimization (Article 5(1)(c))**

```typescript
export interface DataMinimizationPolicy {
  collectOnlyNecessary: boolean;
  automaticDataReduction: boolean;
  regularDataReview: boolean;
  minimumDataRetention: number; // days
}

export class DataMinimizationService {
  private policy: DataMinimizationPolicy = {
    collectOnlyNecessary: true,
    automaticDataReduction: true,
    regularDataReview: true,
    minimumDataRetention: 30
  };

  async applyDataMinimization(message: ChatMessage): Promise<ChatMessage> {
    // Remove unnecessary metadata
    const minimizedMessage = {
      ...message,
      // Keep only essential fields
      userAgent: undefined,
      ipAddress: this.anonymizeIP(message.ipAddress),
      conversationContext: this.minimizeContext(message.conversationContext)
    };
    
    return minimizedMessage;
  }

  private minimizeContext(context: ConversationContext): ConversationContext {
    return {
      // Keep only essential context for AI training
      currentTopic: context.currentTopic,
      userIntent: context.userIntent,
      // Remove detailed user information
      previousMessages: context.previousMessages?.slice(-3), // Keep only last 3
      userPreferences: undefined // Remove detailed preferences
    };
  }
}
```

### **Purpose Limitation (Article 5(1)(b))**

```typescript
export interface ProcessingPurpose {
  id: string;
  name: string;
  description: string;
  legalBasis: string;
  dataCategories: DataCategory[];
  retentionPeriod: number;
  automaticDeletion: boolean;
}

export const PROCESSING_PURPOSES: ProcessingPurpose[] = [
  {
    id: 'ai_training',
    name: 'AI Model Training',
    description: 'Improve AI response quality and accuracy',
    legalBasis: 'legitimate_interest',
    dataCategories: ['chat_messages', 'user_interactions'],
    retentionPeriod: 90,
    automaticDeletion: true
  },
  {
    id: 'service_improvement',
    name: 'Service Quality Improvement',
    description: 'Analyze usage patterns to improve user experience',
    legalBasis: 'legitimate_interest',
    dataCategories: ['session_metadata', 'performance_metrics'],
    retentionPeriod: 180,
    automaticDeletion: true
  }
];

export class PurposeLimitationService {
  async validateProcessingPurpose(
    dataType: DataCategory, 
    purpose: string
  ): Promise<boolean> {
    const processingPurpose = PROCESSING_PURPOSES.find(p => p.id === purpose);
    
    if (!processingPurpose) {
      throw new Error(`Invalid processing purpose: ${purpose}`);
    }
    
    return processingPurpose.dataCategories.includes(dataType);
  }

  async enforceRetentionPeriods(): Promise<void> {
    for (const purpose of PROCESSING_PURPOSES) {
      if (purpose.automaticDeletion) {
        await this.deleteDataByPurpose(purpose);
      }
    }
  }
}
```

### **Storage Limitation (Article 5(1)(e))**

```typescript
export interface StorageLimitationConfig {
  defaultRetentionDays: number;
  maxRetentionDays: number;
  anonymizationThreshold: number;
  automaticDeletion: boolean;
  gracePeriodsEnabled: boolean;
}

export class StorageLimitationService {
  private config: StorageLimitationConfig = {
    defaultRetentionDays: 90,
    maxRetentionDays: 365,
    anonymizationThreshold: 30,
    automaticDeletion: true,
    gracePeriodsEnabled: true
  };

  async enforceStorageLimits(): Promise<StorageLimitationReport> {
    const report: StorageLimitationReport = {
      processedRecords: 0,
      anonymizedRecords: 0,
      deletedRecords: 0,
      errors: [],
      processingDate: new Date()
    };

    try {
      // Anonymize data past anonymization threshold
      const anonymized = await this.anonymizeExpiredData();
      report.anonymizedRecords = anonymized;

      // Delete data past retention period
      const deleted = await this.deleteExpiredData();
      report.deletedRecords = deleted;

      report.processedRecords = anonymized + deleted;
    } catch (error) {
      report.errors.push(error.message);
    }

    return report;
  }

  private async anonymizeExpiredData(): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - this.config.anonymizationThreshold);

    const { data, error } = await this.supabase
      .from('chat_messages')
      .update({
        content: '[ANONYMIZED]',
        anonymizedAt: new Date().toISOString(),
        conversationContext: {}
      })
      .lt('timestamp', threshold.toISOString())
      .is('anonymized_at', null)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }
}
```

---

## 📝 **Consent Management System**

### **Consent Collection and Management**

```typescript
export interface ConsentRecord {
  id: string;
  userId?: string;
  guestUuid?: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  consentText: string;
  version: string;
}

export class ConsentManagementService {
  async recordConsent(consent: Partial<ConsentRecord>): Promise<string> {
    const consentRecord: ConsentRecord = {
      id: this.generateConsentId(),
      timestamp: new Date(),
      consentMethod: 'explicit',
      version: '1.0',
      ...consent
    } as ConsentRecord;

    const { data, error } = await this.supabase
      .from('consent_records')
      .insert(consentRecord)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async withdrawConsent(
    userId: string | undefined,
    guestUuid: string | undefined,
    consentType: ConsentType
  ): Promise<void> {
    // Record consent withdrawal
    await this.recordConsent({
      userId,
      guestUuid,
      consentType,
      granted: false,
      consentMethod: 'explicit',
      consentText: 'User withdrew consent'
    });

    // Apply data processing restrictions
    await this.applyConsentWithdrawal(userId, guestUuid, consentType);
  }

  async getConsentStatus(
    userId: string | undefined,
    guestUuid: string | undefined
  ): Promise<ConsentStatus> {
    const consents = await this.supabase
      .from('consent_records')
      .select('*')
      .or(`user_id.eq.${userId},guest_uuid.eq.${guestUuid}`)
      .order('timestamp', { ascending: false });

    return this.buildConsentStatus(consents.data || []);
  }

  private async applyConsentWithdrawal(
    userId: string | undefined,
    guestUuid: string | undefined,
    consentType: ConsentType
  ): Promise<void> {
    switch (consentType) {
      case 'data_collection':
        await this.stopDataCollection(userId, guestUuid);
        break;
      case 'training_data_usage':
        await this.removeFromTrainingData(userId, guestUuid);
        break;
      case 'analytics':
        await this.excludeFromAnalytics(userId, guestUuid);
        break;
    }
  }
}
```

---

## 🔍 **Privacy Impact Assessment**

### **Data Processing Activities Record**

```typescript
export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfers: boolean;
  retentionPeriod: string;
  securityMeasures: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export const CHAT_LOGGING_PROCESSING_ACTIVITIES: ProcessingActivity[] = [
  {
    id: 'chat_message_logging',
    name: 'Chat Message Logging',
    purpose: 'AI training and service improvement',
    legalBasis: 'Legitimate interest (Article 6(1)(f))',
    dataCategories: ['chat_messages', 'session_metadata'],
    dataSubjects: ['website_visitors', 'registered_users'],
    recipients: ['internal_ai_team', 'data_processors'],
    thirdCountryTransfers: false,
    retentionPeriod: '90 days',
    securityMeasures: [
      'encryption_at_rest',
      'encryption_in_transit',
      'access_controls',
      'audit_logging',
      'data_anonymization'
    ],
    riskLevel: 'medium'
  }
];
```

---

**Next**: Continue with [`integration-guidelines.md`](./integration-guidelines.md) for step-by-step integration instructions with existing SELLY components.
