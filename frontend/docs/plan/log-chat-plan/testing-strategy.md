# Testing Strategy

**Document**: Comprehensive Testing Approach  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🧪 **Testing Overview**

The SELLY Comprehensive Chat Logging System requires thorough testing across multiple dimensions: functionality, privacy compliance, performance, and data integrity. This document outlines a comprehensive testing strategy to ensure system reliability and regulatory compliance.

### **Testing Principles**
1. **Privacy First**: All tests must validate privacy compliance
2. **Data Integrity**: Ensure no data loss or corruption
3. **Performance Validation**: Meet all performance targets
4. **User Experience**: Maintain seamless user experience
5. **Backward Compatibility**: Existing functionality unaffected

---

## 🔧 **Unit Testing Strategy**

### **Database Layer Testing**

```typescript
// File: src/services/chatbot/__tests__/comprehensiveChatLogger.test.ts

import { ComprehensiveChatLogger } from '../comprehensiveChatLogger';
import { createClient } from '@supabase/supabase-js';

describe('ComprehensiveChatLogger', () => {
  let chatLogger: ComprehensiveChatLogger;
  let mockSupabase: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis()
    };

    chatLogger = new ComprehensiveChatLogger({
      enableGuestLogging: true,
      dataRetentionDays: 90,
      contentSanitization: true
    });
  });

  describe('Session Management', () => {
    test('should create authenticated session successfully', async () => {
      const userId = 'test-user-id';
      const expectedSessionId = 'test-session-id';

      mockSupabase.single.mockResolvedValue({
        data: { id: expectedSessionId },
        error: null
      });

      const sessionId = await chatLogger.createAuthenticatedSession(userId);
      
      expect(sessionId).toBe(expectedSessionId);
      expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          sessionType: 'authenticated'
        })
      );
    });

    test('should create guest session with UUID', async () => {
      const expectedSessionId = 'test-session-id';
      const expectedGuestUuid = 'guest_123_abc';

      mockSupabase.single.mockResolvedValue({
        data: { id: expectedSessionId, created_at: new Date() },
        error: null
      });

      const result = await chatLogger.createGuestSession();
      
      expect(result.sessionId).toBe(expectedSessionId);
      expect(result.guestUuid).toMatch(/^guest_\d+_[a-z0-9]+$/);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionType: 'guest',
          guestUuid: expect.stringMatching(/^guest_\d+_[a-z0-9]+$/)
        })
      );
    });

    test('should handle session creation errors', async () => {
      const userId = 'test-user-id';
      const error = new Error('Database connection failed');

      mockSupabase.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(chatLogger.createAuthenticatedSession(userId))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Message Logging', () => {
    test('should log user message with sanitization', async () => {
      const sessionId = 'test-session-id';
      const content = 'My NIK is 1234567890123456 and email is test@example.com';
      const expectedMessageId = 'test-message-id';

      mockSupabase.single.mockResolvedValue({
        data: { id: expectedMessageId },
        error: null
      });

      const messageId = await chatLogger.logMessage(sessionId, 'user', content);
      
      expect(messageId).toBe(expectedMessageId);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          messageType: 'user',
          content: 'My NIK is [NIK_REDACTED] and email is [EMAIL_REDACTED]',
          contentSanitized: true
        })
      );
    });

    test('should log assistant message with metadata', async () => {
      const sessionId = 'test-session-id';
      const content = 'Here is your KTP information';
      const metadata = {
        serviceType: 'ktp',
        responseType: 'knowledge_base' as const,
        confidenceScore: 0.95,
        processingTime: 150
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 'test-message-id' },
        error: null
      });

      await chatLogger.logMessage(sessionId, 'assistant', content, metadata);
      
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          messageType: 'assistant',
          content,
          serviceType: 'ktp',
          responseType: 'knowledge_base',
          confidenceScore: 0.95,
          processingTimeMs: 150
        })
      );
    });
  });

  describe('Content Sanitization', () => {
    test('should sanitize NIK numbers', () => {
      const content = 'My NIK is 1234567890123456';
      const sanitized = chatLogger['sanitizeContent'](content);
      expect(sanitized).toBe('My NIK is [NIK_REDACTED]');
    });

    test('should sanitize NIP numbers', () => {
      const content = 'My NIP is 123456789012345678';
      const sanitized = chatLogger['sanitizeContent'](content);
      expect(sanitized).toBe('My NIP is [NIP_REDACTED]');
    });

    test('should sanitize email addresses', () => {
      const content = 'Contact me at user@example.com';
      const sanitized = chatLogger['sanitizeContent'](content);
      expect(sanitized).toBe('Contact me at [EMAIL_REDACTED]');
    });

    test('should sanitize phone numbers', () => {
      const content = 'Call me at 08123456789';
      const sanitized = chatLogger['sanitizeContent'](content);
      expect(sanitized).toBe('Call me at [PHONE_REDACTED]');
    });
  });

  describe('Privacy Compliance', () => {
    test('should schedule data deletion correctly', async () => {
      const sessionId = 'test-session-id';
      const content = 'Test message';
      const retentionDays = 90;

      mockSupabase.single.mockResolvedValue({
        data: { id: 'test-message-id' },
        error: null
      });

      await chatLogger.logMessage(sessionId, 'user', content);
      
      const expectedDeletionDate = new Date();
      expectedDeletionDate.setDate(expectedDeletionDate.getDate() + retentionDays);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledDeletionAt: expect.any(Date)
        })
      );
    });

    test('should anonymize session data', async () => {
      const sessionId = 'test-session-id';

      mockSupabase.eq.mockReturnThis();
      mockSupabase.update.mockResolvedValue({ error: null });

      await chatLogger.anonymizeSession(sessionId);
      
      expect(mockSupabase.update).toHaveBeenCalledWith({
        content: '[ANONYMIZED]',
        anonymizedAt: expect.any(String),
        conversationContext: {}
      });
    });
  });
});
```

### **API Integration Testing**

```typescript
// File: src/app/api/chat/__tests__/route.test.ts

import { POST } from '../route';
import { NextRequest } from 'next/server';

describe('/api/chat', () => {
  let mockChatLogger: any;
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockChatLogger = {
      createAuthenticatedSession: jest.fn(),
      createGuestSession: jest.fn(),
      logMessage: jest.fn()
    };

    mockRequest = {
      json: jest.fn(),
      headers: {
        get: jest.fn()
      }
    };
  });

  test('should handle authenticated user chat', async () => {
    const sessionId = 'test-session-id';
    const userId = 'test-user-id';

    mockRequest.json!.mockResolvedValue({
      message: 'Hello SELLY',
      context: { userId }
    });

    mockChatLogger.createAuthenticatedSession.mockResolvedValue(sessionId);
    mockChatLogger.logMessage.mockResolvedValue('message-id');

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(data.sessionId).toBe(sessionId);
    expect(mockChatLogger.createAuthenticatedSession).toHaveBeenCalledWith(
      userId,
      expect.any(Object)
    );
    expect(mockChatLogger.logMessage).toHaveBeenCalledTimes(2); // User + Assistant
  });

  test('should handle guest user chat', async () => {
    const sessionId = 'test-session-id';
    const guestUuid = 'guest_123_abc';

    mockRequest.json!.mockResolvedValue({
      message: 'Hello SELLY'
    });

    mockChatLogger.createGuestSession.mockResolvedValue({
      sessionId,
      guestUuid
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(data.sessionId).toBe(sessionId);
    expect(data.guestUuid).toBe(guestUuid);
    expect(mockChatLogger.createGuestSession).toHaveBeenCalled();
  });

  test('should handle API errors gracefully', async () => {
    mockRequest.json!.mockResolvedValue({
      message: 'Test message'
    });

    mockChatLogger.createGuestSession.mockRejectedValue(
      new Error('Database connection failed')
    );

    const response = await POST(mockRequest as NextRequest);
    
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Terjadi kesalahan saat memproses permintaan Anda');
  });
});
```

---

## 🔒 **Privacy Compliance Testing**

### **GDPR Rights Testing**

```typescript
// File: src/services/chatbot/__tests__/privacyCompliance.test.ts

import { DataAccessService, DataDeletionService } from '../privacyServices';

describe('Privacy Compliance', () => {
  describe('Right of Access (Article 15)', () => {
    test('should export user data in correct format', async () => {
      const dataAccessService = new DataAccessService();
      const userId = 'test-user-id';

      const exportData = await dataAccessService.exportUserData({
        userId,
        requestDate: new Date(),
        requestType: 'full_export',
        dataCategories: ['chat_messages', 'sessions'],
        format: 'json'
      });

      expect(exportData).toHaveProperty('userId', userId);
      expect(exportData).toHaveProperty('exportDate');
      expect(exportData).toHaveProperty('sessions');
      expect(exportData).toHaveProperty('messages');
      expect(exportData.messages).toBeInstanceOf(Array);
      
      // Verify sensitive data is sanitized in export
      exportData.messages.forEach(message => {
        expect(message.sessionId).toBe('[SESSION_ID]');
        expect(message.ipAddress).toBeUndefined();
        expect(message.userAgent).toBeUndefined();
      });
    });
  });

  describe('Right to Erasure (Article 17)', () => {
    test('should delete all user data', async () => {
      const dataDeletionService = new DataDeletionService();
      const userId = 'test-user-id';

      const deletionReport = await dataDeletionService.processUserDeletion({
        userId,
        requestDate: new Date(),
        deletionScope: 'all_data',
        reason: 'user_request',
        confirmationRequired: false
      });

      expect(deletionReport.userId).toBe(userId);
      expect(deletionReport.scope).toBe('all_data');
      expect(deletionReport.itemsDeleted.sessions).toBeGreaterThan(0);
      expect(deletionReport.itemsDeleted.messages).toBeGreaterThan(0);
      expect(deletionReport.errors).toHaveLength(0);
    });

    test('should handle partial deletion requests', async () => {
      const dataDeletionService = new DataDeletionService();
      const sessionIds = ['session-1', 'session-2'];

      const deletionReport = await dataDeletionService.processUserDeletion({
        userId: 'test-user-id',
        requestDate: new Date(),
        deletionScope: 'specific_sessions',
        sessionIds,
        reason: 'user_request',
        confirmationRequired: false
      });

      expect(deletionReport.scope).toBe('specific_sessions');
      expect(deletionReport.itemsDeleted.sessions).toBe(sessionIds.length);
    });
  });

  describe('Data Retention Compliance', () => {
    test('should automatically delete expired data', async () => {
      const dataRetentionService = new DataRetentionService();
      
      const deletedCount = await dataRetentionService.deleteExpiredData();
      
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    test('should anonymize data past anonymization threshold', async () => {
      const dataRetentionService = new DataRetentionService();
      
      const anonymizedCount = await dataRetentionService.anonymizeExpiredData();
      
      expect(typeof anonymizedCount).toBe('number');
      expect(anonymizedCount).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## ⚡ **Performance Testing**

### **Load Testing Strategy**

```typescript
// File: src/services/chatbot/__tests__/performance.test.ts

describe('Performance Testing', () => {
  describe('Chat Logging Performance', () => {
    test('should log messages within performance targets', async () => {
      const chatLogger = new ComprehensiveChatLogger();
      const sessionId = await chatLogger.createGuestSession();
      
      const startTime = performance.now();
      
      await chatLogger.logMessage(
        sessionId.sessionId,
        'user',
        'Test message for performance testing'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 50ms target
      expect(duration).toBeLessThan(50);
    });

    test('should handle concurrent logging requests', async () => {
      const chatLogger = new ComprehensiveChatLogger();
      const sessionId = await chatLogger.createGuestSession();
      
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        chatLogger.logMessage(
          sessionId.sessionId,
          'user',
          `Concurrent message ${i}`
        )
      );
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      expect(results).toHaveLength(concurrentRequests);
      expect(endTime - startTime).toBeLessThan(500); // 500ms for 10 concurrent requests
    });
  });

  describe('Database Performance', () => {
    test('should query sessions efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate database query
      const sessions = await supabase
        .from('chat_sessions')
        .select('*')
        .limit(100);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms target for database queries
      expect(sessions.error).toBeNull();
    });
  });
});
```

### **Memory and Resource Testing**

```typescript
// File: src/services/chatbot/__tests__/resourceUsage.test.ts

describe('Resource Usage Testing', () => {
  test('should not cause memory leaks', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const chatLogger = new ComprehensiveChatLogger();
    
    // Simulate heavy usage
    for (let i = 0; i < 1000; i++) {
      const session = await chatLogger.createGuestSession();
      await chatLogger.logMessage(session.sessionId, 'user', `Message ${i}`);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

---

## 🔄 **Integration Testing**

### **End-to-End User Flows**

```typescript
// File: src/__tests__/e2e/chatLogging.test.ts

import { test, expect } from '@playwright/test';

test.describe('Chat Logging E2E', () => {
  test('guest user complete chat flow', async ({ page }) => {
    // Navigate to chat interface
    await page.goto('/');
    
    // Open chat
    await page.click('[data-testid="chat-toggle"]');
    
    // Send message as guest
    await page.fill('[data-testid="chat-input"]', 'Hello SELLY');
    await page.click('[data-testid="send-button"]');
    
    // Verify response
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Halo');
    
    // Verify guest UUID is stored
    const guestUuid = await page.evaluate(() => 
      localStorage.getItem('selly_guest_uuid')
    );
    expect(guestUuid).toMatch(/^guest_\d+_[a-z0-9]+$/);
    
    // Send follow-up message
    await page.fill('[data-testid="chat-input"]', 'What is KTP?');
    await page.click('[data-testid="send-button"]');
    
    // Verify conversation continues with same session
    const messages = await page.locator('[data-testid="chat-message"]').count();
    expect(messages).toBeGreaterThan(2);
  });

  test('authenticated user chat flow', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Open chat
    await page.click('[data-testid="chat-toggle"]');
    
    // Send message as authenticated user
    await page.fill('[data-testid="chat-input"]', 'Show me my data');
    await page.click('[data-testid="send-button"]');
    
    // Verify authenticated user gets personalized response
    await expect(page.locator('[data-testid="chat-message"]').last())
      .toContainText('data Anda');
    
    // Verify no guest UUID is stored
    const guestUuid = await page.evaluate(() => 
      localStorage.getItem('selly_guest_uuid')
    );
    expect(guestUuid).toBeNull();
  });
});
```

---

## 📊 **Test Coverage Requirements**

### **Coverage Targets**

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| ComprehensiveChatLogger | 95% | 90% | 80% |
| Privacy Services | 100% | 95% | 85% |
| Chat API | 90% | 95% | 90% |
| Frontend Integration | 85% | 90% | 95% |

### **Test Execution Strategy**

```bash
# Unit Tests (Run on every commit)
npm run test:unit

# Integration Tests (Run on PR)
npm run test:integration

# E2E Tests (Run on staging deployment)
npm run test:e2e

# Performance Tests (Run weekly)
npm run test:performance

# Privacy Compliance Tests (Run on release)
npm run test:privacy
```

---

**Next**: Continue with [`monitoring-maintenance.md`](./monitoring-maintenance.md) for ongoing maintenance procedures and performance monitoring.
