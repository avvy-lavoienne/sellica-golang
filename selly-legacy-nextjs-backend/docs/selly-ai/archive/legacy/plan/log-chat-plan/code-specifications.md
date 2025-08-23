# Code Specifications

**Document**: TypeScript Interfaces and Service Classes  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🔧 **Core TypeScript Interfaces**

### **Session Management Interfaces**

```typescript
// Core session types
export interface ChatSession {
  id: string;
  userId?: string;
  guestUuid?: string;
  sessionType: 'authenticated' | 'guest';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata: SessionMetadata;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  consentGiven: boolean;
  consentTimestamp?: Date;
  dataRetentionDays: number;
}

export interface SessionMetadata {
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browserInfo?: string;
  location?: string;
  userPreferences?: UserPreferences;
  conversationContext?: ConversationContext;
}

export interface GuestSessionInfo {
  sessionId: string;
  guestUuid: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### **Message and Logging Interfaces**

```typescript
// Message types
export interface ChatMessage {
  id: string;
  sessionId: string;
  messageType: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  
  // AI training fields
  serviceType?: string;
  responseType?: 'knowledge_base' | 'fallback' | 'enhanced_ai' | 'error';
  confidenceScore?: number;
  processingTimeMs?: number;
  
  // Context and enhancement
  conversationContext: ConversationContext;
  enhancementLayers: string[];
  userFeedback?: UserFeedback;
  
  // Content analysis
  detectedIntent?: string;
  emotionalTone?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  
  // Privacy and retention
  anonymizedAt?: Date;
  scheduledDeletionAt?: Date;
  contentSanitized: boolean;
  
  // Quality metrics
  trainingValueScore: number;
  qualityFlags: string[];
}

export interface ConversationContext {
  previousMessages?: string[];
  currentTopic?: string;
  userIntent?: string;
  sessionLength?: number;
  timeOfDay?: string;
  userPreferences?: UserPreferences;
}

export interface UserFeedback {
  rating?: number;
  helpful?: boolean;
  accuracy?: number;
  relevance?: number;
  comments?: string;
  timestamp: Date;
}
```

### **Privacy and Compliance Interfaces**

```typescript
// Privacy management
export interface PrivacyConsent {
  userId?: string;
  guestUuid?: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type ConsentType = 
  | 'data_collection'
  | 'training_data_usage'
  | 'analytics'
  | 'marketing'
  | 'third_party_sharing';

export interface DataRetentionPolicy {
  retentionDays: number;
  anonymizationDelay: number;
  deletionGracePeriod: number;
  backupRetentionDays: number;
}

export interface UserDataExport {
  userId?: string;
  guestUuid?: string;
  exportDate: Date;
  sessions: ChatSession[];
  messages: ChatMessage[];
  preferences: UserPreferences;
  consents: PrivacyConsent[];
}
```

---

## 🏗️ **Core Service Classes**

### **ComprehensiveChatLogger Service**

```typescript
export interface ChatLoggerConfig {
  enableGuestLogging: boolean;
  dataRetentionDays: number;
  anonymizationDelay: number;
  enableTrainingDataCollection: boolean;
  privacyLevel: 'minimal' | 'standard' | 'comprehensive';
  contentSanitization: boolean;
  performanceMonitoring: boolean;
}

export class ComprehensiveChatLogger {
  private supabase: SupabaseClient;
  private config: ChatLoggerConfig;
  private guestManager: GuestUserManager;
  private retentionService: DataRetentionService;
  private performanceMonitor: PerformanceMonitor;

  constructor(config: Partial<ChatLoggerConfig> = {}) {
    this.config = {
      enableGuestLogging: true,
      dataRetentionDays: 90,
      anonymizationDelay: 30,
      enableTrainingDataCollection: true,
      privacyLevel: 'standard',
      contentSanitization: true,
      performanceMonitoring: true,
      ...config
    };
    
    this.initializeServices();
  }

  // Session Management
  async createAuthenticatedSession(
    userId: string, 
    metadata?: SessionMetadata
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      const session: Partial<ChatSession> = {
        userId,
        sessionType: 'authenticated',
        metadata: metadata || {},
        expiresAt: this.calculateExpirationDate(),
        userAgent: this.getUserAgent(),
        ipAddress: this.getAnonymizedIP(),
        dataRetentionDays: this.config.dataRetentionDays
      };

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert(session)
        .select('id')
        .single();

      if (error) throw error;
      
      this.trackPerformance('createAuthenticatedSession', startTime);
      return data.id;
    } catch (error) {
      this.handleError('createAuthenticatedSession', error);
      throw error;
    }
  }

  async createGuestSession(guestUuid?: string): Promise<GuestSessionInfo> {
    const startTime = performance.now();
    
    try {
      const uuid = guestUuid || this.guestManager.generateGuestUUID();
      
      const session: Partial<ChatSession> = {
        guestUuid: uuid,
        sessionType: 'guest',
        expiresAt: this.calculateExpirationDate(),
        userAgent: this.getUserAgent(),
        ipAddress: this.getAnonymizedIP(),
        dataRetentionDays: this.config.dataRetentionDays
      };

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert(session)
        .select('id, created_at')
        .single();

      if (error) throw error;
      
      this.trackPerformance('createGuestSession', startTime);
      
      return {
        sessionId: data.id,
        guestUuid: uuid,
        expiresAt: session.expiresAt!,
        createdAt: data.created_at
      };
    } catch (error) {
      this.handleError('createGuestSession', error);
      throw error;
    }
  }

  // Message Logging
  async logMessage(
    sessionId: string,
    messageType: 'user' | 'assistant',
    content: string,
    metadata?: MessageMetadata
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      const message: Partial<ChatMessage> = {
        sessionId,
        messageType,
        content: this.config.contentSanitization ? 
          this.sanitizeContent(content) : content,
        serviceType: metadata?.serviceType,
        responseType: metadata?.responseType,
        confidenceScore: metadata?.confidenceScore,
        processingTimeMs: metadata?.processingTime,
        conversationContext: metadata?.conversationContext || {},
        enhancementLayers: metadata?.enhancementLayers || [],
        scheduledDeletionAt: this.calculateDeletionDate(),
        contentSanitized: this.config.contentSanitization,
        trainingValueScore: this.calculateTrainingValue(content, metadata)
      };

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert(message)
        .select('id')
        .single();

      if (error) throw error;
      
      // Queue for training data processing if enabled
      if (this.config.enableTrainingDataCollection) {
        await this.queueForTrainingDataProcessing(data.id, metadata);
      }
      
      this.trackPerformance('logMessage', startTime);
      return data.id;
    } catch (error) {
      this.handleError('logMessage', error);
      throw error;
    }
  }

  // Privacy and Compliance Methods
  async anonymizeSession(sessionId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Anonymize all messages in the session
      await this.supabase
        .from('chat_messages')
        .update({
          content: '[ANONYMIZED]',
          anonymizedAt: new Date().toISOString(),
          conversationContext: {}
        })
        .eq('session_id', sessionId);

      // Update session metadata
      await this.supabase
        .from('chat_sessions')
        .update({
          metadata: {},
          userAgent: null,
          ipAddress: null,
          referrer: null
        })
        .eq('id', sessionId);
      
      this.trackPerformance('anonymizeSession', startTime);
    } catch (error) {
      this.handleError('anonymizeSession', error);
      throw error;
    }
  }

  async deleteExpiredData(): Promise<number> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .delete()
        .lt('scheduled_deletion_at', new Date().toISOString())
        .select('id');

      if (error) throw error;
      
      const deletedCount = data?.length || 0;
      this.trackPerformance('deleteExpiredData', startTime);
      
      return deletedCount;
    } catch (error) {
      this.handleError('deleteExpiredData', error);
      throw error;
    }
  }

  // Private helper methods
  private sanitizeContent(content: string): string {
    return content
      .replace(/\b\d{16}\b/g, '[NIK_REDACTED]')
      .replace(/\b\d{18}\b/g, '[NIP_REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{10,15}\b/g, '[PHONE_REDACTED]');
  }

  private calculateExpirationDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.config.dataRetentionDays);
    return date;
  }

  private calculateDeletionDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.config.dataRetentionDays);
    return date;
  }

  private calculateTrainingValue(
    content: string, 
    metadata?: MessageMetadata
  ): number {
    let score = 0.5; // Base score
    
    // Increase score for longer, more detailed content
    if (content.length > 100) score += 0.1;
    if (content.length > 300) score += 0.1;
    
    // Increase score for high confidence responses
    if (metadata?.confidenceScore && metadata.confidenceScore > 0.8) {
      score += 0.2;
    }
    
    // Increase score for specific service types
    if (metadata?.serviceType && 
        ['ktp', 'akta_kelahiran', 'kartu_keluarga'].includes(metadata.serviceType)) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private trackPerformance(operation: string, startTime: number): void {
    if (this.config.performanceMonitoring) {
      const duration = performance.now() - startTime;
      this.performanceMonitor.track(operation, duration);
    }
  }

  private handleError(operation: string, error: any): void {
    console.error(`ChatLogger.${operation} error:`, error);
    if (this.config.performanceMonitoring) {
      this.performanceMonitor.trackError(operation, error);
    }
  }
}
```

---

## 🔑 **Supporting Service Interfaces**

### **Guest User Manager**

```typescript
export class GuestUserManager {
  private readonly GUEST_UUID_PREFIX = 'guest_';
  private readonly UUID_LENGTH = 32;
  
  generateGuestUUID(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.GUEST_UUID_PREFIX}${timestamp}_${random}`;
  }

  validateGuestUUID(uuid: string): boolean {
    const pattern = new RegExp(`^${this.GUEST_UUID_PREFIX}[a-z0-9_]+$`);
    return pattern.test(uuid) && uuid.length >= 20 && uuid.length <= 50;
  }

  async getGuestSession(guestUuid: string): Promise<ChatSession | null> {
    // Implementation for retrieving guest session
  }

  async cleanupExpiredGuests(): Promise<number> {
    // Implementation for cleaning up expired guest sessions
  }
}
```

### **Data Retention Service**

```typescript
export interface RetentionReport {
  processedSessions: number;
  anonymizedMessages: number;
  deletedMessages: number;
  errors: string[];
  processingTime: number;
}

export class DataRetentionService {
  private supabase: SupabaseClient;
  private config: DataRetentionPolicy;

  async scheduleDataDeletion(
    messageId: string, 
    retentionDays: number
  ): Promise<void> {
    // Implementation for scheduling data deletion
  }

  async anonymizeExpiredData(): Promise<number> {
    // Implementation for anonymizing expired data
  }

  async deleteExpiredData(): Promise<number> {
    // Implementation for deleting expired data
  }

  async generateRetentionReport(): Promise<RetentionReport> {
    // Implementation for generating retention reports
  }
}
```

---

**Next**: Continue with [`privacy-compliance-framework.md`](./privacy-compliance-framework.md) for GDPR compliance and data protection measures.
