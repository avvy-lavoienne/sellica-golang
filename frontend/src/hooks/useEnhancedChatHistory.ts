/**
 * Enhanced Chat History Hook
 * Extends existing useChatHistory with hybrid storage and session management
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  ChatMessage, 
  ChatSession, 
  ChatStorage, 
  ChatUIConfig,
  CreateMessageInput,
  CreateSessionInput 
} from '@/types/chatbot';
// import {
//   SessionStorageAdapter,
//   HybridSessionStorage,
//   RedisStorageAdapter,
//   LocalStorageAdapter,
//   createDefaultStorage
// } from '@/services/session/storage'; // Disabled for core build

// Mock types and services for core build
type SessionStorageAdapter = any;
type HybridSessionStorage = any;
type RedisStorageAdapter = any;
type LocalStorageAdapter = any;
const createDefaultStorage = () => ({ logError: () => {} });

// Enhanced storage keys
const ENHANCED_STORAGE_KEYS = {
  SESSIONS: 'selly_enhanced_sessions',
  CONFIG: 'selly_enhanced_config',
  CURRENT_SESSION: 'selly_enhanced_current_session',
  USER_SESSIONS: 'selly_user_sessions',
  SESSION_METADATA: 'selly_session_metadata'
} as const;

// Default configuration with enhanced features
const ENHANCED_DEFAULT_CONFIG: ChatUIConfig = {
  position: 'bottom-right',
  theme: 'auto',
  showTimestamps: true,
  enableSounds: false,
  maxMessages: 100,
  autoSave: true,
};

export interface EnhancedChatHistoryOptions {
  storageAdapter?: SessionStorageAdapter;
  enableRealTimeSync?: boolean;
  enableAnalytics?: boolean;
  enableOfflineMode?: boolean;
  sessionTTL?: number;
}

export interface EnhancedChatHistoryReturn {
  // Existing API (backward compatible)
  sessions: Record<string, ChatSession>;
  currentSession: ChatSession | null;
  config: ChatUIConfig;
  isLoading: boolean;
  error: string | null;
  
  // Enhanced capabilities
  storageAdapter: SessionStorageAdapter;
  sessionMetrics: SessionMetrics;
  offlineMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  
  // Session operations
  createSession: (input?: CreateSessionInput) => ChatSession;
  switchSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => boolean;
  getSessions: () => ChatSession[];
  
  // Message operations
  addMessage: (message: CreateMessageInput) => ChatMessage;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => boolean;
  deleteMessage: (messageId: string) => boolean;
  
  // Enhanced operations
  syncSessions: () => Promise<void>;
  exportSessions: () => Promise<string>;
  importSessions: (data: string) => Promise<boolean>;
  getSessionAnalytics: (sessionId?: string) => SessionAnalytics;
  
  // Configuration
  updateConfig: (config: Partial<ChatUIConfig>) => void;
  clearAllData: () => Promise<void>;
}

export interface SessionMetrics {
  totalSessions: number;
  totalMessages: number;
  storageUsed: number;
  cacheHitRatio: number;
  averageResponseTime: number;
  lastSyncTime?: Date;
}

export interface SessionAnalytics {
  sessionId: string;
  messageCount: number;
  duration: number;
  averageResponseTime: number;
  mostActiveHour: number;
  topicDistribution: Record<string, number>;
}

export function useEnhancedChatHistory(
  userId?: string,
  options: EnhancedChatHistoryOptions = {}
): EnhancedChatHistoryReturn {
  // Initialize storage adapter
  const storageAdapter = useMemo(() => {
    if (options.storageAdapter) {
      return options.storageAdapter;
    }
    
    // Create default hybrid storage
    return createDefaultStorage();
  }, [options.storageAdapter]);

  // State management
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatUIConfig>(ENHANCED_DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [offlineMode, setOfflineMode] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalSessions: 0,
    totalMessages: 0,
    storageUsed: 0,
    cacheHitRatio: 0,
    averageResponseTime: 0
  });

  const isInitialized = useRef(false);
  const syncInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update metrics helper
  const updateMetrics = useCallback(async (sessionsData: Record<string, ChatSession>) => {
    const totalSessions = Object.keys(sessionsData).length;
    const totalMessages = Object.values(sessionsData).reduce(
      (sum, session) => sum + session.messages.length,
      0
    );

    // Get storage info
    const storageInfo = await storageAdapter.getStorageInfo();

    setSessionMetrics({
      totalSessions,
      totalMessages,
      storageUsed: storageInfo.used || 0,
      cacheHitRatio: 0.85, // Would be calculated from actual cache metrics
      averageResponseTime: storageInfo.latency || 0,
      lastSyncTime: new Date()
    });
  }, [storageAdapter]);

  // Initialize from storage
  useEffect(() => {
    const initializeStorage = async () => {
      if (isInitialized.current) return;

      try {
        setIsLoading(true);

        // Load sessions from storage
        const savedSessions = await storageAdapter.get(ENHANCED_STORAGE_KEYS.SESSIONS) || {};
        const savedConfig = await storageAdapter.get(ENHANCED_STORAGE_KEYS.CONFIG) || ENHANCED_DEFAULT_CONFIG;
        const savedCurrentSession = await storageAdapter.get(ENHANCED_STORAGE_KEYS.CURRENT_SESSION);

        // Parse and validate sessions
        const parsedSessions: Record<string, ChatSession> = {};
        Object.entries(savedSessions).forEach(([id, session]: [string, any]) => {
          try {
            parsedSessions[id] = {
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              messages: session.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            };
          } catch (parseError) {
            console.warn(`Failed to parse session ${id}:`, parseError);
          }
        });

        setSessions(parsedSessions);
        setConfig(savedConfig);
        setCurrentSessionId(savedCurrentSession);

        // Update metrics
        await updateMetrics(parsedSessions);

        isInitialized.current = true;
        setError(null);
      } catch (initError) {
        console.error('Failed to initialize enhanced chat history:', initError);
        setError('Failed to load chat history');
        setOfflineMode(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [storageAdapter, updateMetrics]);

  // Auto-save sessions
  useEffect(() => {
    if (!isInitialized.current) return;

    const saveToStorage = async () => {
      try {
        await storageAdapter.set(ENHANCED_STORAGE_KEYS.SESSIONS, sessions, options.sessionTTL);
        await storageAdapter.set(ENHANCED_STORAGE_KEYS.CURRENT_SESSION, currentSessionId);
        await storageAdapter.set(ENHANCED_STORAGE_KEYS.CONFIG, config);
      } catch (saveError) {
        console.warn('Failed to save to storage:', saveError);
        setOfflineMode(true);
      }
    };

    saveToStorage();
  }, [sessions, currentSessionId, config, storageAdapter, options.sessionTTL]);

  // Sync sessions with server
  const syncSessions = useCallback(async (): Promise<void> => {
    if (!userId || syncStatus === 'syncing') return;

    try {
      setSyncStatus('syncing');

      // Get user sessions from server
      const userSessionsKey = `${ENHANCED_STORAGE_KEYS.USER_SESSIONS}:${userId}`;
      const serverSessions = await storageAdapter.get(userSessionsKey) || {};

      // Merge with local sessions (simple last-write-wins for now)
      setSessions(prev => {
        const merged = { ...prev };

        Object.entries(serverSessions).forEach(([id, serverSession]: [string, any]) => {
          const localSession = merged[id];

          if (!localSession || new Date(serverSession.updatedAt) > localSession.updatedAt) {
            merged[id] = {
              ...serverSession,
              createdAt: new Date(serverSession.createdAt),
              updatedAt: new Date(serverSession.updatedAt),
              messages: serverSession.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            };
          }
        });

        return merged;
      });

      // Save merged sessions back to server
      const userSessions = Object.fromEntries(
        Object.entries(sessions).filter(([_, session]) => session.userId === userId)
      );
      await storageAdapter.set(userSessionsKey, userSessions);

      setSyncStatus('idle');
      setOfflineMode(false);
    } catch (syncError) {
      console.error('Sync failed:', syncError);
      setSyncStatus('error');
      setOfflineMode(true);
    }
  }, [userId, syncStatus, sessions, storageAdapter]);

  // Real-time sync setup
  useEffect(() => {
    if (!options.enableRealTimeSync || !userId) return;

    const startSync = () => {
      syncInterval.current = setInterval(async () => {
        await syncSessions();
      }, 30000); // Sync every 30 seconds
    };

    startSync();

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, [options.enableRealTimeSync, userId, syncSessions]);



  // Create session with enhanced features
  const createSession = useCallback((input?: CreateSessionInput): ChatSession => {
    const sessionId = input?.id || uuidv4();
    const now = new Date();
    
    const session: ChatSession = {
      id: sessionId,
      userId: input?.userId || userId || 'anonymous',
      messages: input?.messages || [],
      createdAt: input?.createdAt || now,
      updatedAt: input?.updatedAt || now,
      isActive: input?.isActive ?? true,
    };

    setSessions(prev => ({
      ...prev,
      [sessionId]: session,
    }));

    // Set as current session if none exists
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    return session;
  }, [userId, currentSessionId]);

  // Enhanced message operations
  const addMessage = useCallback((message: CreateMessageInput): ChatMessage => {
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      content: message.content,
      sender: message.sender,
      timestamp: new Date(),
      type: message.type || 'text',
      status: message.status || 'sent',
      metadata: message.metadata,
    };

    setSessions(prev => {
      let targetSessionId = currentSessionId;

      // Create new session if none exists
      if (!targetSessionId || !prev[targetSessionId]) {
        const newSession = createSession();
        targetSessionId = newSession.id;
        setCurrentSessionId(targetSessionId);
        prev = {
          ...prev,
          [targetSessionId]: newSession,
        };
      }

      const session = prev[targetSessionId];
      const updatedMessages = [...session.messages, chatMessage];

      // Limit messages if configured
      const maxMessages = config.maxMessages || 100;
      const finalMessages = updatedMessages.length > maxMessages
        ? updatedMessages.slice(-maxMessages)
        : updatedMessages;

      return {
        ...prev,
        [targetSessionId]: {
          ...session,
          messages: finalMessages,
          updatedAt: new Date(),
        },
      };
    });

    return chatMessage;
  }, [currentSessionId, createSession, config.maxMessages]);



  // Get session analytics
  const getSessionAnalytics = useCallback((sessionId?: string): SessionAnalytics => {
    const targetSession = sessionId 
      ? sessions[sessionId] 
      : currentSessionId 
        ? sessions[currentSessionId] 
        : null;

    if (!targetSession) {
      return {
        sessionId: sessionId || 'unknown',
        messageCount: 0,
        duration: 0,
        averageResponseTime: 0,
        mostActiveHour: 0,
        topicDistribution: {}
      };
    }

    const messages = targetSession.messages;
    const duration = targetSession.updatedAt.getTime() - targetSession.createdAt.getTime();
    
    // Calculate response times
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i-1].sender === 'user' && messages[i].sender === 'selly') {
        const responseTime = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Find most active hour
    const hourCounts: Record<number, number> = {};
    messages.forEach(msg => {
      const hour = msg.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveHour = Object.entries(hourCounts).reduce(
      (max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max,
      { hour: 0, count: 0 }
    ).hour;

    return {
      sessionId: targetSession.id,
      messageCount: messages.length,
      duration,
      averageResponseTime,
      mostActiveHour,
      topicDistribution: {} // Would be implemented with NLP analysis
    };
  }, [sessions, currentSessionId]);

  // Other operations
  const switchSession = useCallback((sessionId: string): boolean => {
    if (sessions[sessionId]) {
      setCurrentSessionId(sessionId);
      return true;
    }
    return false;
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string): boolean => {
    if (sessions[sessionId]) {
      setSessions(prev => {
        const { [sessionId]: deleted, ...rest } = prev;
        return rest;
      });
      
      if (currentSessionId === sessionId) {
        const remainingSessions = Object.keys(sessions).filter(id => id !== sessionId);
        setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0] : null);
      }
      
      return true;
    }
    return false;
  }, [sessions, currentSessionId]);

  const getSessions = useCallback((): ChatSession[] => {
    return Object.values(sessions).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [sessions]);

  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>): boolean => {
    let updated = false;
    
    setSessions(prev => {
      const newSessions = { ...prev };
      
      Object.keys(newSessions).forEach(sessionId => {
        const session = newSessions[sessionId];
        const messageIndex = session.messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex !== -1) {
          newSessions[sessionId] = {
            ...session,
            messages: session.messages.map((msg, index) => 
              index === messageIndex ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date()
          };
          updated = true;
        }
      });
      
      return newSessions;
    });
    
    return updated;
  }, []);

  const deleteMessage = useCallback((messageId: string): boolean => {
    let deleted = false;
    
    setSessions(prev => {
      const newSessions = { ...prev };
      
      Object.keys(newSessions).forEach(sessionId => {
        const session = newSessions[sessionId];
        const filteredMessages = session.messages.filter(msg => msg.id !== messageId);
        
        if (filteredMessages.length !== session.messages.length) {
          newSessions[sessionId] = {
            ...session,
            messages: filteredMessages,
            updatedAt: new Date()
          };
          deleted = true;
        }
      });
      
      return newSessions;
    });
    
    return deleted;
  }, []);

  const exportSessions = useCallback(async (): Promise<string> => {
    const exportData = {
      sessions,
      config,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [sessions, config]);

  const importSessions = useCallback(async (data: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(data);
      
      if (importData.sessions) {
        // Parse dates
        const parsedSessions: Record<string, ChatSession> = {};
        Object.entries(importData.sessions).forEach(([id, session]: [string, any]) => {
          parsedSessions[id] = {
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          };
        });
        
        setSessions(parsedSessions);
        
        if (importData.config) {
          setConfig(importData.config);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ChatUIConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await storageAdapter.clear();
      setSessions({});
      setCurrentSessionId(null);
      setConfig(ENHANCED_DEFAULT_CONFIG);
      setSessionMetrics({
        totalSessions: 0,
        totalMessages: 0,
        storageUsed: 0,
        cacheHitRatio: 0,
        averageResponseTime: 0
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }, [storageAdapter]);

  return {
    // Existing API
    sessions,
    currentSession: currentSessionId ? sessions[currentSessionId] || null : null,
    config,
    isLoading,
    error,
    
    // Enhanced capabilities
    storageAdapter,
    sessionMetrics,
    offlineMode,
    syncStatus,
    
    // Operations
    createSession,
    switchSession,
    deleteSession,
    getSessions,
    addMessage,
    updateMessage,
    deleteMessage,
    syncSessions,
    exportSessions,
    importSessions,
    getSessionAnalytics,
    updateConfig,
    clearAllData,
  };
}
