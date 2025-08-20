# Integration Guidelines

**Document**: Step-by-Step Integration Instructions  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🔗 **Integration Overview**

This document provides detailed step-by-step instructions for integrating the Comprehensive Chat Logging System with existing SELLY components while maintaining backward compatibility and system stability.

### **Integration Principles**
1. **Backward Compatibility**: No breaking changes to existing functionality
2. **Gradual Enhancement**: Additive improvements to current systems
3. **Minimal Disruption**: Zero downtime deployment strategy
4. **Rollback Ready**: Each integration step includes rollback procedures

---

## 🗄️ **Database Integration**

### **Step 1: Database Schema Deployment**

#### **1.1 Pre-deployment Checklist**
```bash
# Verify database connection and permissions
□ Test Supabase connection with service role key
□ Verify CREATE TABLE permissions
□ Check available storage space (estimate 100MB for initial deployment)
□ Backup current database schema
□ Test rollback procedures
```

#### **1.2 Schema Deployment Script**
```sql
-- File: migrations/001_chat_logging_schema.sql
-- Deploy in transaction for rollback capability

BEGIN;

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_uuid UUID,
  session_type TEXT NOT NULL CHECK (session_type IN ('authenticated', 'guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  data_retention_days INTEGER DEFAULT 90,
  
  CONSTRAINT check_user_identification CHECK (
    (user_id IS NOT NULL AND guest_uuid IS NULL) OR 
    (user_id IS NULL AND guest_uuid IS NOT NULL)
  ),
  CONSTRAINT unique_guest_uuid UNIQUE (guest_uuid)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service_type TEXT,
  response_type TEXT CHECK (response_type IN ('knowledge_base', 'fallback', 'enhanced_ai', 'error')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  conversation_context JSONB DEFAULT '{}',
  enhancement_layers TEXT[],
  user_feedback JSONB,
  detected_intent TEXT,
  emotional_tone TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  anonymized_at TIMESTAMP WITH TIME ZONE,
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
  content_sanitized BOOLEAN DEFAULT FALSE,
  training_value_score DECIMAL(3,2) DEFAULT 0.5,
  quality_flags TEXT[]
);

-- Create indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_id 
  ON chat_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_guest_uuid 
  ON chat_sessions(guest_uuid) WHERE guest_uuid IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_session_id 
  ON chat_messages(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_timestamp 
  ON chat_messages(timestamp DESC);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their own chat sessions" ON chat_sessions
  FOR ALL USING (
    auth.uid() = user_id OR 
    (session_type = 'guest' AND guest_uuid IS NOT NULL)
  );

CREATE POLICY "Users can access their own chat messages" ON chat_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE auth.uid() = user_id OR 
            (session_type = 'guest' AND guest_uuid IS NOT NULL)
    )
  );

COMMIT;
```

#### **1.3 Deployment Verification**
```sql
-- Verify deployment
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE tablename IN ('chat_sessions', 'chat_messages');

-- Test basic operations
INSERT INTO chat_sessions (guest_uuid, session_type) 
VALUES ('test_guest_uuid', 'guest');

SELECT * FROM chat_sessions WHERE guest_uuid = 'test_guest_uuid';

-- Cleanup test data
DELETE FROM chat_sessions WHERE guest_uuid = 'test_guest_uuid';
```

---

## 🔧 **Backend Service Integration**

### **Step 2: ComprehensiveChatLogger Implementation**

#### **2.1 Create Service File**
```typescript
// File: src/services/chatbot/comprehensiveChatLogger.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';

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
  private supabase: SupabaseClient<Database>;
  private config: ChatLoggerConfig;
  private static instance: ComprehensiveChatLogger;

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

    // Initialize Supabase client with service role for logging
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  public static getInstance(config?: Partial<ChatLoggerConfig>): ComprehensiveChatLogger {
    if (!ComprehensiveChatLogger.instance) {
      ComprehensiveChatLogger.instance = new ComprehensiveChatLogger(config);
    }
    return ComprehensiveChatLogger.instance;
  }

  // Implementation methods (as specified in code-specifications.md)
  async createAuthenticatedSession(userId: string, metadata?: any): Promise<string> {
    // Implementation here
  }

  async createGuestSession(guestUuid?: string): Promise<{ sessionId: string, guestUuid: string }> {
    // Implementation here
  }

  async logMessage(
    sessionId: string,
    messageType: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<string> {
    // Implementation here
  }

  // Additional methods...
}

// Export singleton instance
export const chatLogger = ComprehensiveChatLogger.getInstance();
```

#### **2.2 Integration with Existing TrainingDataCollector**

```typescript
// File: src/services/chatbot/enhancedTrainingDataCollector.ts

import { TrainingDataCollector } from './trainingDataCollector';
import { ComprehensiveChatLogger } from './comprehensiveChatLogger';

export class EnhancedTrainingDataCollector extends TrainingDataCollector {
  private chatLogger: ComprehensiveChatLogger;

  constructor() {
    super();
    this.chatLogger = ComprehensiveChatLogger.getInstance();
  }

  /**
   * Enhanced logging method that integrates with chat logging system
   */
  public async logEnhancedQuery(
    query: string,
    serviceType: string,
    responseGiven: string,
    context: {
      userId?: string;
      sessionId?: string;
      guestUuid?: string;
      previousMessages?: string[];
      confidence?: number;
      responseType?: 'fallback' | 'generic_ai' | 'error' | 'knowledge_base' | 'enhanced_ai';
      processingTime?: number;
      enhancementMode?: boolean;
      enhancementLayers?: string[];
      userAgent?: string;
      deviceInfo?: string;
    }
  ): Promise<string> {
    // Call parent method for backward compatibility
    const originalQueryId = await super.logEnhancedQuery(
      query,
      serviceType,
      responseGiven,
      context
    );

    // Enhanced logging with chat session integration
    try {
      let sessionId = context.sessionId;

      // Create session if not provided
      if (!sessionId) {
        if (context.userId) {
          sessionId = await this.chatLogger.createAuthenticatedSession(
            context.userId,
            { userAgent: context.userAgent, deviceInfo: context.deviceInfo }
          );
        } else {
          const guestSession = await this.chatLogger.createGuestSession(context.guestUuid);
          sessionId = guestSession.sessionId;
        }
      }

      // Log user message
      await this.chatLogger.logMessage(sessionId, 'user', query, {
        serviceType,
        conversationContext: {
          previousMessages: context.previousMessages,
          enhancementMode: context.enhancementMode
        }
      });

      // Log assistant response
      await this.chatLogger.logMessage(sessionId, 'assistant', responseGiven, {
        serviceType,
        responseType: context.responseType,
        confidenceScore: context.confidence,
        processingTime: context.processingTime,
        enhancementLayers: context.enhancementLayers
      });

    } catch (error) {
      console.error('Enhanced chat logging failed:', error);
      // Don't throw - maintain backward compatibility
    }

    return originalQueryId;
  }
}

// Replace the existing instance
export const enhancedTrainingCollector = new EnhancedTrainingDataCollector();
```

### **Step 3: Chat API Integration**

#### **3.1 Update Existing Chat API**

```typescript
// File: src/app/api/chat/route.ts (modifications)

import { ComprehensiveChatLogger } from '@/services/chatbot/comprehensiveChatLogger';
import { EnhancedTrainingDataCollector } from '@/services/chatbot/enhancedTrainingDataCollector';

// Add at the top of the file
const chatLogger = ComprehensiveChatLogger.getInstance();
const enhancedTrainingCollector = new EnhancedTrainingDataCollector();

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  let sessionId: string | undefined;
  let guestUuid: string | undefined;

  try {
    // Parse the request body (existing code)
    const { message, context, enhancementMode, sessionId: existingSessionId } = await request.json();

    // Existing validation (keep as is)
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    // Enhanced session management
    const user = await getCurrentUser(request); // Implement this helper
    
    if (user) {
      // Authenticated user
      sessionId = existingSessionId || await chatLogger.createAuthenticatedSession(user.id, {
        userAgent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer')
      });
    } else {
      // Guest user
      if (existingSessionId && context?.guestUuid) {
        sessionId = existingSessionId;
        guestUuid = context.guestUuid;
      } else {
        const guestSession = await chatLogger.createGuestSession();
        sessionId = guestSession.sessionId;
        guestUuid = guestSession.guestUuid;
      }
    }

    // Log user message
    await chatLogger.logMessage(sessionId, 'user', message, {
      conversationContext: context
    });

    // Existing message processing logic (keep as is)
    console.log('🔍 [API] Processing message:', message);
    
    // ... existing processing logic ...

    // Enhanced response logging
    if (response) {
      await chatLogger.logMessage(sessionId, 'assistant', response.content, {
        serviceType: response.serviceType || context?.detectedServiceType,
        responseType: response.type,
        confidenceScore: response.metadata?.confidence,
        processingTime: response.metadata?.processingTime,
        enhancementLayers: response.metadata?.enhancementLayers
      });
    }

    // Return enhanced response
    return NextResponse.json({
      success: true,
      response: response.content,
      type: response.type,
      sessionId, // Include session ID
      guestUuid, // Include guest UUID for guest users
      metadata: {
        ...response.metadata,
        processingTime: performance.now() - requestStartTime,
        cached: false
      }
    });

  } catch (error) {
    // Log error if session exists
    if (sessionId) {
      try {
        await chatLogger.logMessage(sessionId, 'assistant', 'Error occurred', {
          responseType: 'error',
          conversationContext: { error: error.message }
        });
      } catch (loggingError) {
        console.error('Failed to log error message:', loggingError);
      }
    }

    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat memproses permintaan Anda',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get current user
async function getCurrentUser(request: NextRequest) {
  try {
    // Implement based on your authentication system
    // This is a placeholder - adapt to your auth implementation
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    
    // Your user extraction logic here
    return null; // Return user object or null
  } catch (error) {
    return null;
  }
}
```

---

## 🌐 **Frontend Integration**

### **Step 4: ChatContext Enhancement**

#### **4.1 Update ChatContext for Guest Support**

```typescript
// File: src/contexts/ChatContext.tsx (modifications)

import { useState, useEffect, useCallback } from 'react';

// Add guest user state management
export function ChatProvider({ children, userId }: ChatProviderProps) {
  const [guestUuid, setGuestUuid] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Existing state (keep as is)
  const chatHistory = useChatHistory(userId);
  // ... other existing state ...

  // Initialize guest UUID if not authenticated
  useEffect(() => {
    if (!userId) {
      const storedGuestUuid = localStorage.getItem('selly_guest_uuid');
      if (storedGuestUuid) {
        setGuestUuid(storedGuestUuid);
      } else {
        const newGuestUuid = generateGuestUUID();
        setGuestUuid(newGuestUuid);
        localStorage.setItem('selly_guest_uuid', newGuestUuid);
      }
    } else {
      // Clear guest UUID for authenticated users
      localStorage.removeItem('selly_guest_uuid');
      setGuestUuid(null);
    }
  }, [userId]);

  // Enhanced sendMessage function
  const sendMessage = useCallback(async (message: string) => {
    setIsTyping(true);
    setLoadingStage("Memproses pesan...");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          context: {
            userId,
            guestUuid,
            previousMessages: chatHistory.currentSession?.messages.slice(-5).map(m => m.content),
            // ... other existing context
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update session info
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.guestUuid && !userId) {
        setGuestUuid(data.guestUuid);
        localStorage.setItem('selly_guest_uuid', data.guestUuid);
      }

      // Add messages to chat history (existing logic)
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
      };

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        status: 'received',
        metadata: data.metadata
      };

      chatHistory.addMessage(userMessage);
      chatHistory.addMessage(assistantMessage);

      return data.response;

    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    } finally {
      setIsTyping(false);
      setLoadingStage("");
    }
  }, [sessionId, userId, guestUuid, chatHistory]);

  // ... rest of existing implementation
}

// Helper function to generate guest UUID
function generateGuestUUID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `guest_${timestamp}_${random}`;
}
```

---

## ✅ **Integration Checklist**

### **Pre-Integration Verification**
```bash
□ Database backup completed
□ Environment variables configured
□ Service role permissions verified
□ Development environment tested
□ Rollback procedures documented
```

### **Phase 1: Database Integration**
```bash
□ Schema deployment successful
□ Indexes created without errors
□ RLS policies active and tested
□ Functions and triggers working
□ Performance baseline established
```

### **Phase 2: Backend Integration**
```bash
□ ComprehensiveChatLogger service deployed
□ TrainingDataCollector integration tested
□ Chat API modifications deployed
□ Error handling verified
□ Backward compatibility confirmed
```

### **Phase 3: Frontend Integration**
```bash
□ ChatContext updates deployed
□ Guest user flow tested
□ Session persistence working
□ Mobile compatibility verified
□ User experience unchanged for existing users
```

### **Post-Integration Verification**
```bash
□ End-to-end testing completed
□ Performance metrics within targets
□ Error rates acceptable
□ User acceptance testing passed
□ Documentation updated
```

---

**Next**: Continue with [`testing-strategy.md`](./testing-strategy.md) for comprehensive testing approach covering functionality, privacy compliance, and performance.
