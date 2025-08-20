/**
 * Unified Chat Context Provider
 * Critical-1 Fix: Eliminates chat UI message disappearance by providing single source of truth
 * 
 * Consolidates functionality from ChatContext.tsx and EnhancedChatProvider.tsx
 * to resolve state conflicts causing message disappearance issues.
 * 
 * Implementation follows: docs/plan/2025-08-16-authentication-system-fixes-implementation-plan.md
 * Section 4.1 - Chat UI Message Disappearance Technical Solution
 */

'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatMessage,
  ChatSession,
  ChatUIState,
  ChatUIConfig,
  ConversationContext,
  CreateMessageInput
} from '@/types/chatbot';
import { supabase } from '@/lib/conn/supabaseClient';

// Unified Chat State - Single Source of Truth
interface UnifiedChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  sessions: Record<string, ChatSession>;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  loadingStage: string;
  estimatedTime: number;
}

// Unified Chat Context Type
interface UnifiedChatContextType {
  // State
  uiState: ChatUIState;
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  config: ChatUIConfig;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  loadingStage: string;
  estimatedTime: number;
  conversationContext: ConversationContext;

  // UI Actions
  toggleChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  setTyping: (typing: boolean) => void;
  clearError: () => void;

  // Message Actions
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: CreateMessageInput) => ChatMessage;
  updateMessageStatus: (messageId: string, status: ChatMessage['status']) => void;
  clearMessages: () => void;

  // Session Actions
  startNewSession: () => string;
  switchSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => boolean;
  getSessions: () => ChatSession[];

  // Configuration
  updateConfig: (config: Partial<ChatUIConfig>) => void;

  // Context Management
  updateContext: (context: Partial<ConversationContext>) => void;

  // Guest Conversion (placeholder for backward compatibility)
  guestSessionData: any;
  isEligibleForConversion: boolean;
  shouldShowConversionPrompt: boolean;
  dismissConversionPrompt: () => void;
  skipConversion: () => void;
}

// Error Boundary for Chat Context
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 [UNIFIED_CHAT] Error boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [UNIFIED_CHAT] Error boundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Chat Error</h3>
          <p className="text-red-600 text-sm">
            Terjadi kesalahan pada sistem chat. Silakan refresh halaman.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Refresh Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create context
const UnifiedChatContext = createContext<UnifiedChatContextType | undefined>(undefined);

// Default configurations
const DEFAULT_UI_STATE: ChatUIState = {
  isOpen: false,
  isMinimized: false,
  isTyping: false,
  hasUnreadMessages: false,
};

const DEFAULT_CONFIG: ChatUIConfig = {
  position: 'bottom-right',
  theme: 'auto',
  showTimestamps: true,
  enableSounds: false,
  maxMessages: 100,
  autoSave: true,
};

const DEFAULT_CONVERSATION_CONTEXT: ConversationContext = {
  currentTopic: undefined,
  lastQuery: undefined,
  userPreferences: {
    language: 'id',
    dataFormat: 'table',
    verbosity: 'detailed',
  },
  sessionData: undefined,
};

// Unified Chat Provider Component
export const UnifiedChatProvider: React.FC<{ 
  children: React.ReactNode;
  userId?: string;
  onMessageSent?: (message: string) => Promise<string>;
}> = ({ children, userId, onMessageSent }) => {
  
  // Core state - Single Source of Truth
  const [chatState, setChatState] = useState<UnifiedChatState>({
    messages: [],
    currentSession: null,
    sessions: {},
    isLoading: false,
    error: null,
    isTyping: false,
    loadingStage: '',
    estimatedTime: 0,
  });

  // UI state
  const [uiState, setUIState] = useState<ChatUIState>(DEFAULT_UI_STATE);
  const [config, setConfig] = useState<ChatUIConfig>(DEFAULT_CONFIG);
  const [conversationContext, setConversationContext] = useState<ConversationContext>(DEFAULT_CONVERSATION_CONTEXT);

  // Rate limiting and duplicate detection
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  // Initialize default session
  useEffect(() => {
    if (!chatState.currentSession) {
      const defaultSession: ChatSession = {
        id: uuidv4(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId || 'guest',
        isActive: true
      };

      setChatState(prev => ({
        ...prev,
        currentSession: defaultSession,
        sessions: {
          ...prev.sessions,
          [defaultSession.id]: defaultSession
        }
      }));
    }
  }, [userId, chatState.currentSession]);

  // UI Actions
  const toggleChat = useCallback(() => {
    setUIState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const minimizeChat = useCallback(() => {
    setUIState(prev => ({ ...prev, isMinimized: true, isOpen: false }));
  }, []);

  const maximizeChat = useCallback(() => {
    setUIState(prev => ({ ...prev, isMinimized: false, isOpen: true }));
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    setChatState(prev => ({ ...prev, isTyping: typing }));
  }, []);

  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  // Message Actions - Core Implementation
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const now = Date.now();

    // Rate limiting: prevent messages sent too quickly
    if (now - lastMessageTime < 1000) {
      console.log('⚡ [UNIFIED_CHAT] Rate limit: Message sent too quickly, ignoring:', content);
      return;
    }

    // Check for duplicate messages
    const recentDuplicate = chatState.messages.find(msg =>
      msg.sender === 'user' &&
      msg.content.trim().toLowerCase() === content.trim().toLowerCase() &&
      (now - new Date(msg.timestamp).getTime()) < 5000 // 5 seconds
    );

    if (recentDuplicate) {
      console.log('🔄 [UNIFIED_CHAT] Duplicate message detected, ignoring:', content);
      return;
    }

    setLastMessageTime(now);

    // Create user message - Add immediately to state
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: content.trim(),
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
      status: 'sent'
    };

    console.log('📤 [UNIFIED_CHAT] Adding user message to state:', userMessage.content);

    // Add user message immediately to state
    setChatState(prev => {
      const updatedMessages = [...prev.messages, userMessage];
      const updatedSession = prev.currentSession ? {
        ...prev.currentSession,
        messages: updatedMessages,
        updatedAt: new Date()
      } : null;

      return {
        ...prev,
        messages: updatedMessages,
        currentSession: updatedSession,
        sessions: updatedSession ? {
          ...prev.sessions,
          [updatedSession.id]: updatedSession
        } : prev.sessions,
        isTyping: true,
        loadingStage: 'Memproses permintaan...'
      };
    });

    // Update conversation context
    setConversationContext(prev => ({
      ...prev,
      lastQuery: content,
    }));

    try {
      // Call API for AI response
      let response = 'Maaf, saya belum dapat memproses permintaan Anda saat ini.';

      if (onMessageSent) {
        response = await onMessageSent(content);
        
        if (!response || typeof response !== 'string' || response.trim() === '') {
          response = 'Maaf, tidak ada respons yang diterima. Silakan coba lagi.';
        }
      }

      console.log('📥 [UNIFIED_CHAT] Received AI response:', response.substring(0, 100) + '...');

      // Create AI message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: response,
        sender: 'selly',
        type: 'text',
        timestamp: new Date(),
        status: 'sent'
      };

      // Add AI response to state
      setChatState(prev => {
        const updatedMessages = [...prev.messages, aiMessage];
        const updatedSession = prev.currentSession ? {
          ...prev.currentSession,
          messages: updatedMessages,
          updatedAt: new Date()
        } : null;

        return {
          ...prev,
          messages: updatedMessages,
          currentSession: updatedSession,
          sessions: updatedSession ? {
            ...prev.sessions,
            [updatedSession.id]: updatedSession
          } : prev.sessions,
          isTyping: false,
          loadingStage: '',
          estimatedTime: 0
        };
      });

      console.log('✅ [UNIFIED_CHAT] AI message added to state successfully');

    } catch (error) {
      console.error('❌ [UNIFIED_CHAT] Error processing message:', error);
      
      setChatState(prev => ({
        ...prev,
        error: 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
        isTyping: false,
        loadingStage: '',
        estimatedTime: 0
      }));
    }
  }, [chatState.messages, lastMessageTime, onMessageSent]);

  const addMessage = useCallback((message: CreateMessageInput): ChatMessage => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      status: 'sent',
      ...message,
    };

    setChatState(prev => {
      const updatedMessages = [...prev.messages, newMessage];
      const updatedSession = prev.currentSession ? {
        ...prev.currentSession,
        messages: updatedMessages,
        updatedAt: new Date()
      } : null;

      return {
        ...prev,
        messages: updatedMessages,
        currentSession: updatedSession,
        sessions: updatedSession ? {
          ...prev.sessions,
          [updatedSession.id]: updatedSession
        } : prev.sessions
      };
    });

    return newMessage;
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: ChatMessage['status']) => {
    setChatState(prev => {
      const updatedMessages = prev.messages.map(msg =>
        msg.id === messageId ? { ...msg, status } : msg
      );

      const updatedSession = prev.currentSession ? {
        ...prev.currentSession,
        messages: updatedMessages,
        updatedAt: new Date(),
      } : null;

      return {
        ...prev,
        messages: updatedMessages,
        currentSession: updatedSession,
        sessions: updatedSession ? {
          ...prev.sessions,
          [updatedSession.id]: updatedSession
        } : prev.sessions
      };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setChatState(prev => {
      const clearedSession = prev.currentSession ? {
        ...prev.currentSession,
        messages: [],
        updatedAt: new Date()
      } : null;

      return {
        ...prev,
        messages: [],
        currentSession: clearedSession,
        sessions: clearedSession ? {
          ...prev.sessions,
          [clearedSession.id]: clearedSession
        } : prev.sessions
      };
    });
  }, []);

  // Session Actions
  const startNewSession = useCallback((): string => {
    const newSession: ChatSession = {
      id: uuidv4(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId || 'guest',
      isActive: true
    };

    setChatState(prev => ({
      ...prev,
      messages: [],
      currentSession: newSession,
      sessions: {
        ...prev.sessions,
        [newSession.id]: newSession
      }
    }));

    return newSession.id;
  }, [userId]);

  const switchSession = useCallback((sessionId: string): boolean => {
    const session = chatState.sessions[sessionId];
    if (!session) return false;

    setChatState(prev => ({
      ...prev,
      messages: session.messages,
      currentSession: session
    }));

    return true;
  }, [chatState.sessions]);

  const deleteSession = useCallback((sessionId: string): boolean => {
    if (!chatState.sessions[sessionId]) return false;

    setChatState(prev => {
      const { [sessionId]: deleted, ...remainingSessions } = prev.sessions;
      
      // If deleting current session, switch to another or create new
      let newCurrentSession = prev.currentSession;
      let newMessages = prev.messages;
      
      if (prev.currentSession?.id === sessionId) {
        const remainingSessionIds = Object.keys(remainingSessions);
        if (remainingSessionIds.length > 0) {
          newCurrentSession = remainingSessions[remainingSessionIds[0]];
          newMessages = newCurrentSession.messages;
        } else {
          // Create new session if no sessions remain
          const defaultSession: ChatSession = {
            id: uuidv4(),
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId || 'guest',
            isActive: true
          };
          newCurrentSession = defaultSession;
          newMessages = [];
          remainingSessions[defaultSession.id] = defaultSession;
        }
      }

      return {
        ...prev,
        messages: newMessages,
        currentSession: newCurrentSession,
        sessions: remainingSessions
      };
    });

    return true;
  }, [chatState.sessions, userId]);

  const getSessions = useCallback((): ChatSession[] => {
    return Object.values(chatState.sessions);
  }, [chatState.sessions]);

  // Configuration
  const updateConfig = useCallback((newConfig: Partial<ChatUIConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Context Management
  const updateContext = useCallback((context: Partial<ConversationContext>) => {
    setConversationContext(prev => ({ ...prev, ...context }));
  }, []);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (uiState.isOpen && uiState.hasUnreadMessages) {
      setUIState(prev => ({ ...prev, hasUnreadMessages: false }));
    }
  }, [uiState.isOpen, uiState.hasUnreadMessages]);

  // Check for new messages and update unread status
  useEffect(() => {
    if (!uiState.isOpen && chatState.messages.length > 0) {
      const lastMessage = chatState.messages[chatState.messages.length - 1];
      if (lastMessage && lastMessage.sender === 'selly') {
        const messageTime = lastMessage.timestamp.getTime();
        const now = Date.now();
        // Mark as unread if message is less than 5 seconds old and chat is closed
        if (now - messageTime < 5000) {
          setUIState(prev => ({ ...prev, hasUnreadMessages: true }));
        }
      }
    }
  }, [chatState.messages, uiState.isOpen]);

  // Context value
  const contextValue: UnifiedChatContextType = {
    // State
    uiState,
    messages: chatState.messages, // Single source of truth
    currentSession: chatState.currentSession,
    config,
    isLoading: chatState.isLoading,
    error: chatState.error,
    isTyping: chatState.isTyping,
    loadingStage: chatState.loadingStage,
    estimatedTime: chatState.estimatedTime,
    conversationContext,

    // UI Actions
    toggleChat,
    minimizeChat,
    maximizeChat,
    setTyping,
    clearError,

    // Message Actions
    sendMessage,
    addMessage,
    updateMessageStatus,
    clearMessages,

    // Session Actions
    startNewSession,
    switchSession,
    deleteSession,
    getSessions,

    // Configuration
    updateConfig,

    // Context Management
    updateContext,

    // Guest Conversion (placeholder for backward compatibility)
    guestSessionData: undefined,
    isEligibleForConversion: false,
    shouldShowConversionPrompt: false,
    dismissConversionPrompt: () => {},
    skipConversion: () => {},
  };

  console.log('🔄 [UNIFIED_CHAT] Context render - Messages count:', chatState.messages.length);

  return (
    <UnifiedChatContext.Provider value={contextValue}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </UnifiedChatContext.Provider>
  );
};

// Hook to use the unified chat context
export const useUnifiedChat = (): UnifiedChatContextType => {
  const context = useContext(UnifiedChatContext);
  if (context === undefined) {
    throw new Error('useUnifiedChat must be used within a UnifiedChatProvider');
  }
  return context;
};

// Export context for direct access if needed
export { UnifiedChatContext };
