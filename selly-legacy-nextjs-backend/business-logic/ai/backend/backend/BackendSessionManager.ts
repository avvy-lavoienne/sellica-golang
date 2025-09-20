/**
 * Backend Session Manager - Phase 3 Integration
 * Session-aware chat processing and conversation context management
 * Week 2, Days 8-9: Session Management Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { BackendAIService } from './BackendAIService';
import { BackendAuthService } from './BackendAuthService';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  context: Record<string, any>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    language?: string;
    preferences?: Record<string, any>;
  };
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SessionContext {
  sessionId: string;
  conversationHistory: SessionMessage[];
  userPreferences: Record<string, any>;
  contextData: Record<string, any>;
  lastActivity: string;
}

export interface SessionConfig {
  maxSessionDuration: number; // milliseconds
  maxMessagesPerSession: number;
  enableContextPreservation: boolean;
  enableConversationHistory: boolean;
  cacheSessionData: boolean;
  sessionCleanupInterval: number;
}

/**
 * Backend Session Manager
 * Manages session-aware chat processing with conversation context preservation
 */
export class BackendSessionManager {
  private backendService: BackendAIService;
  private authService: BackendAuthService;
  private activeSessions: Map<string, SessionContext> = new Map();
  private sessionCache: Map<string, ChatSession> = new Map();
  private config: SessionConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private baseURL: string;

  constructor(config?: Partial<SessionConfig>) {
    this.backendService = new BackendAIService();
    this.authService = new BackendAuthService();
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    this.config = {
      maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      maxMessagesPerSession: 1000,
      enableContextPreservation: true,
      enableConversationHistory: true,
      cacheSessionData: true,
      sessionCleanupInterval: 60 * 60 * 1000, // 1 hour
      ...config
    };

    // Start session cleanup if enabled
    if (this.config.sessionCleanupInterval > 0) {
      this.startSessionCleanup();
    }

    aiLogger.backend.info('💬 Backend Session Manager initialized', {
      config: this.config,
      baseURL: this.baseURL
    });
  }

  /**
   * Create a new chat session
   */
  async createSession(userId?: string): Promise<ChatSession> {
    try {
      if (!isFeatureEnabled('enableBackendSessionManagement')) {
        throw new Error('Backend session management is disabled');
      }

      const authContext = await this.authService.getAuthContext();
      const sessionUserId = userId || authContext.userId;

      const headers = await this.authService.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/chat/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: sessionUserId,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString()
          }
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const session: ChatSession = await response.json();

      // Cache session if enabled
      if (this.config.cacheSessionData) {
        this.sessionCache.set(session.id, session);
      }

      // Initialize session context
      const sessionContext: SessionContext = {
        sessionId: session.id,
        conversationHistory: [],
        userPreferences: {},
        contextData: session.context || {},
        lastActivity: new Date().toISOString()
      };

      this.activeSessions.set(session.id, sessionContext);

      aiLogger.backend.info('✅ Chat session created', {
        sessionId: session.id,
        userId: sessionUserId
      });

      return session;

    } catch (error) {
      aiLogger.backend.error('❌ Failed to create chat session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get existing session
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      // Check cache first
      if (this.config.cacheSessionData && this.sessionCache.has(sessionId)) {
        return this.sessionCache.get(sessionId)!;
      }

      const headers = await this.authService.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get session: ${response.status}`);
      }

      const session: ChatSession = await response.json();

      // Update cache
      if (this.config.cacheSessionData) {
        this.sessionCache.set(sessionId, session);
      }

      return session;

    } catch (error) {
      aiLogger.backend.error('❌ Failed to get session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      return null;
    }
  }

  /**
   * Process session-aware chat query
   */
  async processSessionChat(
    sessionId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    try {
      // Get or create session context
      let sessionContext = this.activeSessions.get(sessionId);
      
      if (!sessionContext) {
        const session = await this.getSession(sessionId);
        if (!session) {
          throw new Error(`Session not found: ${sessionId}`);
        }

        sessionContext = {
          sessionId,
          conversationHistory: [],
          userPreferences: {},
          contextData: session.context || {},
          lastActivity: new Date().toISOString()
        };

        this.activeSessions.set(sessionId, sessionContext);
      }

      // Add user message to conversation history
      if (this.config.enableConversationHistory) {
        const userMessage: SessionMessage = {
          id: `msg_${Date.now()}_user`,
          sessionId,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };

        sessionContext.conversationHistory.push(userMessage);
      }

      // Prepare enhanced context with session data
      const enhancedContext = {
        ...context,
        sessionId,
        conversationHistory: this.config.enableConversationHistory 
          ? sessionContext.conversationHistory.slice(-10) // Last 10 messages
          : [],
        userPreferences: sessionContext.userPreferences,
        contextData: sessionContext.contextData
      };

      // Process query with backend
      const response = await this.backendService.processSessionQuery(
        message,
        sessionId,
        enhancedContext
      );

      // Add assistant response to conversation history
      if (this.config.enableConversationHistory) {
        const assistantMessage: SessionMessage = {
          id: `msg_${Date.now()}_assistant`,
          sessionId,
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          metadata: response.metadata
        };

        sessionContext.conversationHistory.push(assistantMessage);

        // Limit conversation history size
        if (sessionContext.conversationHistory.length > this.config.maxMessagesPerSession) {
          sessionContext.conversationHistory = sessionContext.conversationHistory.slice(-this.config.maxMessagesPerSession);
        }
      }

      // Update session context
      sessionContext.lastActivity = new Date().toISOString();

      // Update context data if provided in response
      if (response.metadata?.updatedContext) {
        sessionContext.contextData = {
          ...sessionContext.contextData,
          ...response.metadata.updatedContext
        };
      }

      // Enhance response with session metadata
      const enhancedResponse: AIResponse = {
        ...response,
        metadata: {
          ...response.metadata,
          sessionId,
          messageCount: sessionContext.conversationHistory.length,
          sessionContext: this.config.enableContextPreservation ? {
            hasHistory: sessionContext.conversationHistory.length > 0,
            contextKeys: Object.keys(sessionContext.contextData),
            lastActivity: sessionContext.lastActivity
          } : undefined
        }
      };

      aiLogger.backend.info('💬 Session chat processed', {
        sessionId,
        messageLength: message.length,
        responseLength: response.content.length,
        conversationLength: sessionContext.conversationHistory.length,
        processingTime: response.metadata?.processingTime
      });

      return enhancedResponse;

    } catch (error) {
      aiLogger.backend.error('❌ Session chat processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        messageLength: message.length
      });
      throw error;
    }
  }

  /**
   * Get session conversation history
   */
  getSessionHistory(sessionId: string): SessionMessage[] {
    const sessionContext = this.activeSessions.get(sessionId);
    return sessionContext?.conversationHistory || [];
  }

  /**
   * Update session context
   */
  updateSessionContext(
    sessionId: string, 
    contextUpdates: Record<string, any>
  ): void {
    const sessionContext = this.activeSessions.get(sessionId);
    
    if (sessionContext) {
      sessionContext.contextData = {
        ...sessionContext.contextData,
        ...contextUpdates
      };
      sessionContext.lastActivity = new Date().toISOString();

      aiLogger.backend.debug('🔄 Session context updated', {
        sessionId,
        updatedKeys: Object.keys(contextUpdates)
      });
    }
  }

  /**
   * Update user preferences for session
   */
  updateUserPreferences(
    sessionId: string,
    preferences: Record<string, any>
  ): void {
    const sessionContext = this.activeSessions.get(sessionId);
    
    if (sessionContext) {
      sessionContext.userPreferences = {
        ...sessionContext.userPreferences,
        ...preferences
      };
      sessionContext.lastActivity = new Date().toISOString();

      aiLogger.backend.debug('👤 User preferences updated', {
        sessionId,
        preferenceKeys: Object.keys(preferences)
      });
    }
  }

  /**
   * Clear session data
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      
      // Remove from cache
      this.sessionCache.delete(sessionId);

      // Optionally clear from backend (if endpoint exists)
      try {
        const headers = await this.authService.getAuthHeaders();
        
        await fetch(`${this.baseURL}/chat/sessions/${sessionId}`, {
          method: 'DELETE',
          headers,
          signal: AbortSignal.timeout(5000)
        });
      } catch (error) {
        // Non-critical error - session cleared locally
        aiLogger.backend.warn('⚠️ Failed to clear session from backend', {
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      aiLogger.backend.info('🧹 Session cleared', { sessionId });

    } catch (error) {
      aiLogger.backend.error('❌ Failed to clear session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(): {
    activeSessions: number;
    cachedSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  } {
    const totalMessages = Array.from(this.activeSessions.values())
      .reduce((sum, session) => sum + session.conversationHistory.length, 0);

    const activeSessions = this.activeSessions.size;
    const averageMessagesPerSession = activeSessions > 0 ? totalMessages / activeSessions : 0;

    return {
      activeSessions,
      cachedSessions: this.sessionCache.size,
      totalMessages,
      averageMessagesPerSession
    };
  }

  /**
   * Start session cleanup process
   */
  private startSessionCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.sessionCleanupInterval);

    aiLogger.backend.info('🧹 Session cleanup started', {
      interval: this.config.sessionCleanupInterval
    });
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, sessionContext] of this.activeSessions.entries()) {
      const lastActivity = new Date(sessionContext.lastActivity).getTime();
      const sessionAge = now - lastActivity;

      if (sessionAge > this.config.maxSessionDuration) {
        this.activeSessions.delete(sessionId);
        this.sessionCache.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      aiLogger.backend.info('🧹 Expired sessions cleaned up', {
        cleanedCount,
        remainingActiveSessions: this.activeSessions.size
      });
    }
  }

  /**
   * Stop session manager
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.activeSessions.clear();
    this.sessionCache.clear();

    aiLogger.backend.info('🛑 Backend Session Manager stopped');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Session manager configuration updated', {
      config: this.config
    });

    // Restart cleanup with new interval if changed
    if (this.cleanupInterval && newConfig.sessionCleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.startSessionCleanup();
    }
  }
}
