/**
 * Enhanced Chat Context - Week 2 Implementation
 * Integrated with unified type system and storage layer
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
// import {
//   UnifiedSession,
//   EnhancedChatMessage,
//   EnhancedChatSession,
//   SessionState,
//   SessionEventType,
//   FeatureFlagContext,
//   SyncStatus,
//   PerformanceMetrics,
//   SessionConfig
// } from '@/services/session/unifiedTypes'; // Disabled for core build

// Mock types for core build
type UnifiedSession = any;
type EnhancedChatMessage = any;
type EnhancedChatSession = any;
type SessionState = any;
type SessionEventType = any;
type FeatureFlagContext = any;
type SyncStatus = any;
type PerformanceMetrics = any;
type SessionConfig = any;
import { useEnhancedChatHistory } from '@/hooks/useEnhancedChatHistory';
// import { SessionStorageAdapter } from '@/services/session/storage'; // Disabled for core build
// import { createDefaultStorage } from '@/services/session/storage'; // Disabled for core build

// Mock types and services for core build
type SessionStorageAdapter = any;
const createDefaultStorage = () => ({ logError: () => {} });

// Enhanced Chat Context State
export interface EnhancedChatState {
  // Session Management
  currentSession: UnifiedSession | null;
  chatSession: EnhancedChatSession | null;
  sessionState: SessionState;
  
  // Messages and Communication
  messages: EnhancedChatMessage[];
  isTyping: boolean;
  isProcessing: boolean;
  
  // Real-time and Sync
  syncStatus: SyncStatus;
  isOnline: boolean;
  
  // Performance and Monitoring
  performanceMetrics: PerformanceMetrics | null;
  
  // Feature Flags and Configuration
  featureFlags: Record<string, boolean>;
  config: SessionConfig;
  
  // UI State
  isMinimized: boolean;
  isDragging: boolean;
  position: { x: number; y: number };
  
  // Error Handling
  error: string | null;
  lastError: Error | null;
}

// Enhanced Chat Actions
export type EnhancedChatAction =
  | { type: 'SET_SESSION'; payload: UnifiedSession }
  | { type: 'SET_CHAT_SESSION'; payload: EnhancedChatSession }
  | { type: 'UPDATE_SESSION_STATE'; payload: SessionState }
  | { type: 'ADD_MESSAGE'; payload: EnhancedChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<EnhancedChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'UPDATE_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'UPDATE_PERFORMANCE'; payload: PerformanceMetrics }
  | { type: 'UPDATE_FEATURE_FLAGS'; payload: Record<string, boolean> }
  | { type: 'UPDATE_CONFIG'; payload: Partial<SessionConfig> }
  | { type: 'SET_MINIMIZED'; payload: boolean }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'SET_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Enhanced Chat Context Interface
export interface EnhancedChatContextType {
  // State
  state: EnhancedChatState;
  
  // Session Operations
  createSession: (type?: 'guest' | 'authenticated') => Promise<UnifiedSession>;
  switchSession: (sessionId: string) => Promise<boolean>;
  endSession: () => Promise<void>;
  convertGuestSession: (userId: string) => Promise<boolean>;
  
  // Message Operations
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<EnhancedChatMessage>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  reactToMessage: (messageId: string, reaction: string) => Promise<boolean>;
  
  // Real-time Operations
  startSync: () => Promise<void>;
  stopSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  
  // UI Operations
  minimize: () => void;
  maximize: () => void;
  toggleMinimized: () => void;
  updatePosition: (position: { x: number; y: number }) => void;
  
  // Feature Flag Operations
  isFeatureEnabled: (flagName: string) => boolean;
  updateFeatureFlag: (flagName: string, enabled: boolean) => void;
  
  // Performance Operations
  getPerformanceMetrics: () => PerformanceMetrics | null;
  reportPerformanceIssue: (issue: string) => void;
  
  // Error Handling
  clearError: () => void;
  handleError: (error: Error) => void;
  
  // Storage Operations
  exportChatData: () => Promise<string>;
  importChatData: (data: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
}

// Default Configuration
const DEFAULT_CONFIG: SessionConfig = {
  defaultTTL: 30 * 24 * 60 * 60, // 30 days
  guestSessionTTL: 7 * 24 * 60 * 60, // 7 days
  maxConcurrentSessions: 5,
  enableRealTimeSync: true,
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  storageConfig: {
    primaryStorage: 'redis',
    fallbackStorage: 'localStorage',
    enableCompression: false,
    enableEncryption: false,
    maxCacheSize: 1000,
    cleanupInterval: 60 * 60 * 1000 // 1 hour
  },
  securityConfig: {
    requireEncryption: false,
    sessionTimeout: 24 * 60 * 60, // 24 hours
    maxLoginAttempts: 5,
    enableAuditLog: true,
    dataRetentionDays: 90,
    anonymizeAfterDays: 365
  },
  featureFlags: {
    enhancedStorage: true,
    realTimeSync: true,
    performanceMonitoring: true,
    advancedAnalytics: false,
    experimentalFeatures: false
  }
};

// Initial State
const initialState: EnhancedChatState = {
  currentSession: null,
  chatSession: null,
  sessionState: 'initializing',
  messages: [],
  isTyping: false,
  isProcessing: false,
  syncStatus: {
    isConnected: false,
    pendingEvents: 0,
    syncErrors: [],
    connectionQuality: 'disconnected'
  },
  isOnline: true,
  performanceMetrics: null,
  featureFlags: DEFAULT_CONFIG.featureFlags,
  config: DEFAULT_CONFIG,
  isMinimized: false,
  isDragging: false,
  position: { x: 20, y: 20 },
  error: null,
  lastError: null
};

// Reducer
function enhancedChatReducer(state: EnhancedChatState, action: EnhancedChatAction): EnhancedChatState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
        sessionState: 'active'
      };
      
    case 'SET_CHAT_SESSION':
      return {
        ...state,
        chatSession: action.payload,
        messages: action.payload.messages
      };
      
    case 'UPDATE_SESSION_STATE':
      return {
        ...state,
        sessionState: action.payload
      };
      
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
      
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
      
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
      
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };
      
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
      
    case 'UPDATE_SYNC_STATUS':
      return {
        ...state,
        syncStatus: action.payload
      };
      
    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.payload
      };
      
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performanceMetrics: action.payload
      };
      
    case 'UPDATE_FEATURE_FLAGS':
      return {
        ...state,
        featureFlags: { ...state.featureFlags, ...action.payload }
      };
      
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
      
    case 'SET_MINIMIZED':
      return {
        ...state,
        isMinimized: action.payload
      };
      
    case 'SET_DRAGGING':
      return {
        ...state,
        isDragging: action.payload
      };
      
    case 'SET_POSITION':
      return {
        ...state,
        position: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        lastError: null
      };
      
    case 'RESET_STATE':
      return initialState;
      
    default:
      return state;
  }
}

// Create Context
const EnhancedChatContext = createContext<EnhancedChatContextType | undefined>(undefined);

// Provider Props
export interface EnhancedChatProviderProps {
  children: React.ReactNode;
  userId?: string;
  storageAdapter?: SessionStorageAdapter;
  config?: Partial<SessionConfig>;
}

// Enhanced Chat Provider
export function EnhancedChatProvider({ 
  children, 
  userId, 
  storageAdapter,
  config: userConfig 
}: EnhancedChatProviderProps) {
  const [state, dispatch] = useReducer(enhancedChatReducer, {
    ...initialState,
    config: { ...DEFAULT_CONFIG, ...userConfig }
  });

  // Initialize storage adapter
  const storage = useMemo(() => {
    return storageAdapter || createDefaultStorage();
  }, [storageAdapter]);

  // Enhanced chat history hook
  const {
    sessions,
    currentSession,
    addMessage,
    updateMessage,
    deleteMessage,
    createSession: createChatSession,
    switchSession: switchChatSession,
    syncSessions,
    exportSessions,
    importSessions,
    clearAllData: clearChatData,
    sessionMetrics,
    syncStatus: chatSyncStatus,
    offlineMode
  } = useEnhancedChatHistory(userId, {
    storageAdapter: storage,
    enableRealTimeSync: state.config.enableRealTimeSync,
    enableAnalytics: state.config.enableAnalytics,
    enableOfflineMode: true,
    sessionTTL: state.config.defaultTTL
  });

  // Sync state with chat history
  useEffect(() => {
    if (currentSession) {
      // Convert ChatSession to UnifiedSession
      const baseSession = {
        id: currentSession.id,
        createdAt: currentSession.createdAt,
        updatedAt: currentSession.updatedAt,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        lastAccessedAt: new Date(),
        isActive: currentSession.isActive,
        devices: [],
        conversationHistory: currentSession.messages.map(msg => ({
          id: msg.id,
          query: msg.sender === 'user' ? msg.content : '',
          response: msg.sender === 'selly' ? msg.content : '',
          timestamp: msg.timestamp,
          metadata: msg.metadata
        })),
        userPreferences: {
          language: 'id' as const,
          dataFormat: 'summary' as const,
          verbosity: 'detailed' as const
        }
      };

      let unifiedSession: UnifiedSession;

      if (currentSession.userId) {
        // Authenticated session
        unifiedSession = {
          ...baseSession,
          type: 'authenticated',
          userId: currentSession.userId,
          primaryDeviceId: '',
          conversationContext: {
            userPreferences: baseSession.userPreferences
          },
          analytics: {
            totalQueries: currentSession.messages.length,
            averageResponseTime: 0,
            cacheHitRate: 0,
            mostUsedServices: [],
            sessionDuration: 0,
            deviceSwitches: 0,
            errorCount: 0
          },
          security: {
            encryptionLevel: 'basic',
            dataRetentionPolicy: 'standard',
            privacyConsent: true,
            anonymizationLevel: 'none',
            accessControls: [],
            auditLog: []
          }
        } as UnifiedSession;
      } else {
        // Guest session
        unifiedSession = {
          ...baseSession,
          type: 'guest',
          guestUuid: `guest_${currentSession.id}`,
          conversionEligible: true,
          conversionAttempts: 0
        } as UnifiedSession;
      }

      dispatch({ type: 'SET_SESSION', payload: unifiedSession });
    }
  }, [currentSession]);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_SYNC_STATUS',
      payload: {
        isConnected: !offlineMode,
        pendingEvents: 0,
        syncErrors: [],
        connectionQuality: offlineMode ? 'disconnected' : 'excellent'
      }
    });
  }, [offlineMode]);

  // PHASE 2: Enhanced chat data clearing functions
  const clearAllEnhancedChatData = useCallback(() => {
    try {
      console.log('🧹 [ENHANCED_CHAT_CONTEXT] Starting comprehensive enhanced chat data cleanup...');

      // Clear localStorage SELLY keys
      const sellyKeys = [
        'selly_chat_sessions',
        'selly_current_session',
        'selly_chat_config',
        'selly-enhanced-mode'
      ];

      sellyKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ [ENHANCED_CHAT_CONTEXT] Cleared localStorage key: ${key}`);
      });

      // Pattern-based clearing
      const allKeys = Object.keys(localStorage);
      let patternClearedCount = 0;

      allKeys.forEach(key => {
        if (key.startsWith('selly_') || key.startsWith('selly-')) {
          localStorage.removeItem(key);
          patternClearedCount++;
          console.log(`🗑️ [ENHANCED_CHAT_CONTEXT] Pattern-cleared key: ${key}`);
        }
      });

      // Reset enhanced chat state
      dispatch({ type: 'RESET_STATE' });

      console.log(`✅ [ENHANCED_CHAT_CONTEXT] Enhanced chat data cleanup completed. Cleared ${sellyKeys.length} specific keys and ${patternClearedCount} pattern-matched keys.`);

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_CONTEXT] Error during enhanced chat data cleanup:', error);
    }
  }, []);

  const resetEnhancedChatServices = useCallback(async () => {
    try {
      console.log('🔄 [ENHANCED_CHAT_CONTEXT] Resetting enhanced chat services...');

      // Clear EnhancedChatStorageService cache
      try {
        const { EnhancedChatStorageService } = await import('@/services/chatbot/enhancedChatStorageService');
        const chatStorageService = EnhancedChatStorageService.getInstance();
        chatStorageService.clearLocalCache();
        console.log('🧹 [ENHANCED_CHAT_CONTEXT] Cleared EnhancedChatStorageService cache');
      } catch (cacheError) {
        console.warn('⚠️ [ENHANCED_CHAT_CONTEXT] Could not clear enhanced chat service cache:', cacheError);
      }

      // Clear storage adapter if available
      if (storageAdapter) {
        try {
          await storageAdapter.clear();
          console.log('🧹 [ENHANCED_CHAT_CONTEXT] Cleared storage adapter');
        } catch (storageError) {
          console.warn('⚠️ [ENHANCED_CHAT_CONTEXT] Could not clear storage adapter:', storageError);
        }
      }

      // Reset to initial state
      dispatch({ type: 'RESET_STATE' });

      console.log('✅ [ENHANCED_CHAT_CONTEXT] Enhanced chat services reset completed');

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_CONTEXT] Error resetting enhanced chat services:', error);
    }
  }, [storageAdapter]);

  // PHASE 2: Auth state change listener for enhanced chat context
  useEffect(() => {
    console.log('🔐 [ENHANCED_CHAT_CONTEXT] Setting up enhanced auth state change listener...');

    // Import supabase dynamically to avoid SSR issues
    const setupAuthListener = async () => {
      try {
        const { supabase } = await import('@/lib/conn/supabaseClient');

        // Helper function to determine if enhanced chat data should be cleared
        const shouldClearEnhancedChatData = (event: string, session: any, previousUserId?: string): boolean => {
          // Always clear on explicit logout
          if (event === 'SIGNED_OUT') {
            return true;
          }

          // Clear on user switch (different user signing in)
          if (event === 'SIGNED_IN' && session?.user) {
            const currentUserId = session.user.id;
            // Only clear if this is a different user than before
            if (previousUserId && previousUserId !== currentUserId) {
              console.log(`🔄 [ENHANCED_CHAT_CONTEXT] User switch detected: ${previousUserId.slice(0, 8)} → ${currentUserId.slice(0, 8)}`);
              return true;
            }
            // Don't clear for same user re-authentication (app switch scenario)
            return false;
          }

          // Never clear on token refresh or other events
          return false;
        };

        let previousUserId: string | undefined;

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              console.log(`🔐 [ENHANCED_CHAT_CONTEXT] Enhanced auth state change detected: ${event}`);

              if (shouldClearEnhancedChatData(event, session, previousUserId)) {
                if (event === 'SIGNED_OUT') {
                  console.log('👋 [ENHANCED_CHAT_CONTEXT] User signed out - clearing all enhanced chat data');
                } else {
                  console.log('👤 [ENHANCED_CHAT_CONTEXT] User switch detected - clearing previous user enhanced data');
                }
                clearAllEnhancedChatData();
                await resetEnhancedChatServices();
              }

              if (event === 'SIGNED_IN' && session?.user) {
                const currentUserId = session.user.id;
                console.log(`👤 [ENHANCED_CHAT_CONTEXT] User authenticated - maintaining enhanced chat for user: ${currentUserId.slice(0, 8)}...`);

                // Initialize for user (only if new user or first time)
                if (!previousUserId || previousUserId !== currentUserId) {
                  dispatch({
                    type: 'UPDATE_SESSION_STATE',
                    payload: 'active'
                  });
                }

                previousUserId = currentUserId;

              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('🔄 [ENHANCED_CHAT_CONTEXT] Token refreshed - maintaining enhanced session');
                // Don't clear data on token refresh

              } else if (event === 'SIGNED_OUT') {
                previousUserId = undefined;
              }

            } catch (error) {
              console.error('❌ [ENHANCED_CHAT_CONTEXT] Error handling enhanced auth state change:', error);
            }
          }
        );

        // Return cleanup function
        return () => {
          console.log('🧹 [ENHANCED_CHAT_CONTEXT] Cleaning up enhanced auth state listener');
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };

      } catch (error) {
        console.error('❌ [ENHANCED_CHAT_CONTEXT] Error setting up enhanced auth listener:', error);
        return () => {}; // Return empty cleanup function
      }
    };

    let cleanup: (() => void) | undefined;

    setupAuthListener().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [clearAllEnhancedChatData, resetEnhancedChatServices]);

  // Session Operations
  const createSession = useCallback(async (type: 'guest' | 'authenticated' = 'guest'): Promise<UnifiedSession> => {
    try {
      const session = createChatSession({
        userId: type === 'authenticated' && userId ? userId : 'anonymous',
        messages: [],
        isActive: true
      });
      
      let unifiedSession: UnifiedSession;

      if (type === 'authenticated' && userId) {
        unifiedSession = {
          ...session,
          type: 'authenticated',
          userId,
          expiresAt: new Date(Date.now() + state.config.defaultTTL * 1000),
          lastAccessedAt: new Date(),
          devices: [],
          primaryDeviceId: '',
          conversationHistory: [],
          conversationContext: {
            userPreferences: {
              language: 'id',
              dataFormat: 'summary',
              verbosity: 'detailed'
            }
          },
          userPreferences: {
            language: 'id',
            dataFormat: 'summary',
            verbosity: 'detailed'
          },
          analytics: {
            totalQueries: 0,
            averageResponseTime: 0,
            cacheHitRate: 0,
            mostUsedServices: [],
            sessionDuration: 0,
            deviceSwitches: 0,
            errorCount: 0
          },
          security: {
            encryptionLevel: 'basic',
            dataRetentionPolicy: 'standard',
            privacyConsent: true,
            anonymizationLevel: 'none',
            accessControls: [],
            auditLog: []
          }
        };
      } else {
        unifiedSession = {
          ...session,
          type: 'guest',
          guestUuid: `guest_${session.id}`,
          expiresAt: new Date(Date.now() + state.config.guestSessionTTL * 1000),
          lastAccessedAt: new Date(),
          devices: [],
          conversationHistory: [],
          userPreferences: {
            language: 'id',
            dataFormat: 'summary',
            verbosity: 'detailed'
          },
          conversionEligible: true,
          conversionAttempts: 0
        };
      }

      dispatch({ type: 'SET_SESSION', payload: unifiedSession });
      return unifiedSession;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create session' });
      throw error;
    }
  }, [createChatSession, userId, state.config]);

  const switchSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const success = switchChatSession(sessionId);
      if (success) {
        dispatch({ type: 'UPDATE_SESSION_STATE', payload: 'active' });
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch session' });
      return false;
    }
  }, [switchChatSession]);

  const endSession = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'UPDATE_SESSION_STATE', payload: 'archived' });
      dispatch({ type: 'SET_SESSION', payload: null as any });
      dispatch({ type: 'SET_CHAT_SESSION', payload: null as any });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to end session' });
    }
  }, []);

  const convertGuestSession = useCallback(async (targetUserId: string): Promise<boolean> => {
    try {
      // Implementation would integrate with guest session manager
      dispatch({ type: 'UPDATE_SESSION_STATE', payload: 'converting' });
      // Simulate conversion process
      await new Promise(resolve => setTimeout(resolve, 1000));
      dispatch({ type: 'UPDATE_SESSION_STATE', payload: 'active' });
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to convert session' });
      return false;
    }
  }, []);

  // Message Operations
  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'file' | 'action' | 'system_notification' = 'text'
  ): Promise<EnhancedChatMessage> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      
      const message = addMessage({
        content,
        sender: 'user',
        type: 'text', // Convert to ChatMessage type
        status: 'sending'
      });

      const enhancedMessage: EnhancedChatMessage = {
        id: message.id,
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp,
        type: type, // Use the EnhancedChatMessage type
        status: message.status === 'error' ? 'failed' : message.status, // Map status values
        reactions: [],
        metadata: {
          processingTime: 0,
          cached: false
        }
      };

      dispatch({ type: 'ADD_MESSAGE', payload: enhancedMessage });
      
      // Update message status
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: message.id, 
            updates: { status: 'sent' } 
          } 
        });
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }, 500);

      return enhancedMessage;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
      dispatch({ type: 'SET_PROCESSING', payload: false });
      throw error;
    }
  }, [addMessage]);

  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    try {
      const success = updateMessage(messageId, { content: newContent });
      if (success) {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: messageId, 
            updates: { content: newContent } 
          } 
        });
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to edit message' });
      return false;
    }
  }, [updateMessage]);

  const deleteMessageHandler = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const success = deleteMessage(messageId);
      if (success) {
        dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete message' });
      return false;
    }
  }, [deleteMessage]);

  const reactToMessage = useCallback(async (messageId: string, reaction: string): Promise<boolean> => {
    try {
      // Implementation for message reactions
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: messageId, 
          updates: { 
            reactions: [
              { 
                type: reaction as any, 
                timestamp: new Date(),
                userId 
              }
            ] 
          } 
        } 
      });
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to react to message' });
      return false;
    }
  }, [userId]);

  // Real-time Operations
  const startSync = useCallback(async (): Promise<void> => {
    try {
      await syncSessions();
      dispatch({ 
        type: 'UPDATE_SYNC_STATUS', 
        payload: { 
          ...state.syncStatus, 
          isConnected: true,
          connectionQuality: 'excellent'
        } 
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start sync' });
    }
  }, [syncSessions, state.syncStatus]);

  const stopSync = useCallback(async (): Promise<void> => {
    dispatch({ 
      type: 'UPDATE_SYNC_STATUS', 
      payload: { 
        ...state.syncStatus, 
        isConnected: false,
        connectionQuality: 'disconnected'
      } 
    });
  }, [state.syncStatus]);

  const forceSync = useCallback(async (): Promise<void> => {
    await startSync();
  }, [startSync]);

  // UI Operations
  const minimize = useCallback(() => {
    dispatch({ type: 'SET_MINIMIZED', payload: true });
  }, []);

  const maximize = useCallback(() => {
    dispatch({ type: 'SET_MINIMIZED', payload: false });
  }, []);

  const toggleMinimized = useCallback(() => {
    dispatch({ type: 'SET_MINIMIZED', payload: !state.isMinimized });
  }, [state.isMinimized]);

  const updatePosition = useCallback((position: { x: number; y: number }) => {
    dispatch({ type: 'SET_POSITION', payload: position });
  }, []);

  // Feature Flag Operations
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return state.featureFlags[flagName] || false;
  }, [state.featureFlags]);

  const updateFeatureFlag = useCallback((flagName: string, enabled: boolean) => {
    dispatch({ 
      type: 'UPDATE_FEATURE_FLAGS', 
      payload: { [flagName]: enabled } 
    });
  }, []);

  // Performance Operations
  const getPerformanceMetrics = useCallback((): PerformanceMetrics | null => {
    return state.performanceMetrics;
  }, [state.performanceMetrics]);

  const reportPerformanceIssue = useCallback((issue: string) => {
    console.warn('Performance issue reported:', issue);
    // Implementation for performance issue reporting
  }, []);

  // Error Handling
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const handleError = useCallback((error: Error) => {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    console.error('Enhanced Chat Error:', error);
  }, []);

  // Storage Operations
  const exportChatData = useCallback(async (): Promise<string> => {
    try {
      return await exportSessions();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to export chat data' });
      throw error;
    }
  }, [exportSessions]);

  const importChatData = useCallback(async (data: string): Promise<boolean> => {
    try {
      return await importSessions(data);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import chat data' });
      return false;
    }
  }, [importSessions]);

  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      await clearChatData();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear all data' });
    }
  }, [clearChatData]);

  // Context Value
  const contextValue: EnhancedChatContextType = {
    state,
    createSession,
    switchSession,
    endSession,
    convertGuestSession,
    sendMessage,
    editMessage,
    deleteMessage: deleteMessageHandler,
    reactToMessage,
    startSync,
    stopSync,
    forceSync,
    minimize,
    maximize,
    toggleMinimized,
    updatePosition,
    isFeatureEnabled,
    updateFeatureFlag,
    getPerformanceMetrics,
    reportPerformanceIssue,
    clearError,
    handleError,
    exportChatData,
    importChatData,
    clearAllData
  };

  return (
    <EnhancedChatContext.Provider value={contextValue}>
      {children}
    </EnhancedChatContext.Provider>
  );
}

// Hook to use Enhanced Chat Context
export function useEnhancedChat(): EnhancedChatContextType {
  const context = useContext(EnhancedChatContext);
  if (context === undefined) {
    throw new Error('useEnhancedChat must be used within an EnhancedChatProvider');
  }
  return context;
}

// Export context for advanced usage
export { EnhancedChatContext };
