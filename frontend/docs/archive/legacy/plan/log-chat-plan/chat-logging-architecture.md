# Chat Logging System Architecture

**Document**: Technical Architecture Overview  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🏗️ **System Architecture Overview**

The SELLY Comprehensive Chat Logging System is designed as a privacy-compliant, scalable solution that captures all user interactions for AI training while supporting both authenticated and guest users.

### **Core Design Principles**

1. **Privacy by Design**: GDPR compliance built into every component
2. **Dual User Support**: Seamless handling of authenticated and guest users
3. **Data Quality**: Structured, high-quality data optimized for AI training
4. **Performance**: Sub-200ms logging overhead with async processing
5. **Scalability**: Designed to handle 10,000+ daily interactions

---

## 🔄 **Data Flow Architecture**

### **High-Level Data Flow**

```
User Interaction
       ↓
   User Type?
   ↙        ↘
Authenticated  Guest
   ↓           ↓
Get User    Create/Get
Session     Guest UUID
   ↓           ↓
   └─────┬─────┘
         ↓
   Chat API Endpoint
         ↓
   Process Message
         ↓
ComprehensiveChatLogger
    ↙         ↘
Database    Training Data
Storage     Pipeline
   ↓           ↓
Data        AI Training
Retention   Data
Service
   ↓
Anonymization/
Deletion
```

### **Component Interaction Flow**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Chat API       │    │   Database      │
│   ChatContext   │◄──►│   /api/chat      │◄──►│   Supabase      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Session Mgmt  │    │   Chat Logger    │    │   Retention     │
│   Guest UUID    │    │   Service        │    │   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🗄️ **Database Architecture**

### **Core Tables Structure**

```sql
-- Primary Tables
chat_sessions (Session management)
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key to auth.users)
├── guest_uuid (UUID, for unauthenticated users)
├── session_type (TEXT: 'authenticated' | 'guest')
├── created_at, updated_at, expires_at
└── metadata (JSONB)

chat_messages (Message storage)
├── id (UUID, Primary Key)
├── session_id (UUID, Foreign Key to chat_sessions)
├── message_type (TEXT: 'user' | 'assistant')
├── content (TEXT)
├── timestamp (TIMESTAMP WITH TIME ZONE)
├── service_type, response_type, confidence_score
├── conversation_context (JSONB)
├── enhancement_layers (TEXT[])
└── privacy fields (anonymized_at, scheduled_deletion_at)
```

### **Relationships and Constraints**

```sql
-- Foreign Key Relationships
chat_sessions.user_id → auth.users.id (CASCADE DELETE)
chat_messages.session_id → chat_sessions.id (CASCADE DELETE)

-- Business Logic Constraints
CHECK (user_id IS NOT NULL XOR guest_uuid IS NOT NULL)
CHECK (session_type IN ('authenticated', 'guest'))
CHECK (message_type IN ('user', 'assistant'))
CHECK (response_type IN ('knowledge_base', 'fallback', 'enhanced_ai', 'error'))
```

---

## 🔧 **Service Architecture**

### **Core Services**

#### **1. ComprehensiveChatLogger**
```typescript
interface ComprehensiveChatLogger {
  // Session Management
  createAuthenticatedSession(userId: string): Promise<string>
  createGuestSession(guestUuid?: string): Promise<SessionInfo>
  
  // Message Logging
  logMessage(sessionId: string, type: MessageType, content: string): Promise<string>
  
  // Privacy & Compliance
  anonymizeSession(sessionId: string): Promise<void>
  deleteExpiredData(): Promise<void>
}
```

#### **2. GuestUserManager**
```typescript
interface GuestUserManager {
  generateGuestUUID(): string
  validateGuestUUID(uuid: string): boolean
  getGuestSession(uuid: string): Promise<SessionInfo | null>
  cleanupExpiredGuests(): Promise<void>
}
```

#### **3. DataRetentionService**
```typescript
interface DataRetentionService {
  scheduleDataDeletion(messageId: string, retentionDays: number): Promise<void>
  anonymizeExpiredData(): Promise<number>
  deleteExpiredData(): Promise<number>
  generateRetentionReport(): Promise<RetentionReport>
}
```

### **Service Integration Points**

```typescript
// Integration with existing TrainingDataCollector
class EnhancedTrainingDataCollector extends TrainingDataCollector {
  async logEnhancedQuery(
    query: string,
    serviceType: string,
    response: string,
    context: EnhancedContext
  ): Promise<string> {
    // Enhanced logging with chat session integration
    const messageId = await this.chatLogger.logMessage(
      context.sessionId,
      'user',
      query,
      { serviceType, ...context }
    );
    
    return messageId;
  }
}
```

---

## 🔒 **Security Architecture**

### **Data Protection Layers**

1. **Input Sanitization**
   ```typescript
   sanitizeContent(content: string): string {
     return content
       .replace(/\b\d{16}\b/g, '[NIK_REDACTED]')     // Indonesian NIK
       .replace(/\b\d{18}\b/g, '[NIP_REDACTED]')     // Indonesian NIP
       .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
       .replace(/\b\d{10,15}\b/g, '[PHONE_REDACTED]');
   }
   ```

2. **IP Anonymization**
   ```typescript
   anonymizeIP(ip: string): string {
     const parts = ip.split('.');
     return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
   }
   ```

3. **Database Security**
   - Row Level Security (RLS) policies
   - Encrypted storage for sensitive fields
   - Audit logging for all data access

### **Privacy Controls**

```typescript
interface PrivacyControls {
  // User Rights (GDPR Articles 15-22)
  exportUserData(userId: string): Promise<UserDataExport>
  deleteUserData(userId: string): Promise<DeletionReport>
  anonymizeUserData(userId: string): Promise<AnonymizationReport>
  
  // Consent Management
  recordConsent(userId: string, consentType: ConsentType): Promise<void>
  withdrawConsent(userId: string, consentType: ConsentType): Promise<void>
  getConsentStatus(userId: string): Promise<ConsentStatus>
}
```

---

## 📊 **Performance Architecture**

### **Performance Targets**

| Metric | Target | Monitoring |
|--------|--------|------------|
| Logging Latency | < 50ms | Real-time |
| API Response Time | < 200ms | Per request |
| Database Query Time | < 100ms | Query-level |
| Data Retention Processing | < 5 minutes | Daily batch |
| Guest Session Cleanup | < 2 minutes | Hourly batch |

### **Optimization Strategies**

1. **Async Processing**
   ```typescript
   async logMessage(sessionId: string, type: MessageType, content: string) {
     // Non-blocking logging
     setImmediate(() => {
       this.processMessageLogging(sessionId, type, content);
     });
     
     return this.generateMessageId();
   }
   ```

2. **Database Indexing**
   ```sql
   -- Performance indexes
   CREATE INDEX CONCURRENTLY idx_chat_sessions_user_created 
     ON chat_sessions(user_id, created_at DESC);
   CREATE INDEX CONCURRENTLY idx_chat_messages_session_timestamp 
     ON chat_messages(session_id, timestamp DESC);
   CREATE INDEX CONCURRENTLY idx_chat_messages_service_type 
     ON chat_messages(service_type) WHERE service_type IS NOT NULL;
   ```

3. **Caching Strategy**
   ```typescript
   interface CachingStrategy {
     sessionCache: LRUCache<string, SessionInfo>     // 1000 sessions
     userPrefsCache: LRUCache<string, UserPrefs>     // 500 users
     guestUUIDCache: LRUCache<string, GuestInfo>     // 2000 guests
   }
   ```

---

## 🔄 **Integration Architecture**

### **Existing System Integration**

```typescript
// Integration points with current SELLY system
interface SystemIntegration {
  // Chat API Integration
  enhanceChatAPI(): void                    // Add logging to /api/chat
  
  // Context Integration  
  enhanceChatContext(): void                // Add guest support to ChatContext
  
  // Training Data Integration
  enhanceTrainingCollector(): void          // Integrate with existing collector
  
  // Database Integration
  extendDatabaseSchema(): void              // Add new tables to existing schema
}
```

### **Backward Compatibility**

- **Existing TrainingDataCollector**: Enhanced, not replaced
- **Current ChatContext**: Extended with guest user support
- **Database Schema**: Additive changes only, no breaking modifications
- **API Endpoints**: Backward-compatible enhancements

---

## 📈 **Scalability Architecture**

### **Horizontal Scaling**

```typescript
interface ScalabilityFeatures {
  // Database Partitioning
  partitionByDate: boolean                  // Monthly partitions for chat_messages
  
  // Load Balancing
  distributedLogging: boolean               // Multiple logger instances
  
  // Caching
  redisIntegration: boolean                 // Distributed session cache
  
  // Background Processing
  queueSystem: boolean                      // Message queue for heavy operations
}
```

### **Growth Projections**

| Timeframe | Daily Messages | Storage Growth | Performance Impact |
|-----------|----------------|----------------|--------------------|
| Month 1 | 1,000 | 10 MB/day | Minimal |
| Month 6 | 5,000 | 50 MB/day | Low |
| Year 1 | 20,000 | 200 MB/day | Moderate |
| Year 2 | 50,000 | 500 MB/day | Requires optimization |

---

**Next**: Continue with [`database-schema.md`](./database-schema.md) for detailed database design specifications.
