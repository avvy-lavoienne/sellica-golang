'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChatMessage, 
  ChatSession, 
  ChatStorage, 
  ChatUIConfig,
  CreateMessageInput,
  CreateSessionInput 
} from '@/types/chatbot';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const STORAGE_KEYS = {
  SESSIONS: 'selly_chat_sessions',
  CONFIG: 'selly_chat_config',
  CURRENT_SESSION: 'selly_current_session',
} as const;

// Default configuration
const DEFAULT_CONFIG: ChatUIConfig = {
  position: 'bottom-right',
  theme: 'auto',
  showTimestamps: true,
  enableSounds: false,
  maxMessages: 100,
  autoSave: true,
};

// Utility functions for localStorage
const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse localStorage item ${key}:`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save to localStorage ${key}:`, error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${key}:`, error);
    }
  },
};

export function useChatHistory(userId?: string) {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatUIConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedSessions = storage.get(STORAGE_KEYS.SESSIONS, {});
      const savedConfig = storage.get(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
      const savedCurrentSession = storage.get(STORAGE_KEYS.CURRENT_SESSION, null);

      // Convert date strings back to Date objects
      const parsedSessions: Record<string, ChatSession> = {};
      Object.entries(savedSessions).forEach(([id, session]: [string, any]) => {
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
      setConfig(savedConfig);
      setCurrentSessionId(savedCurrentSession);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Gagal memuat riwayat chat');
      setIsLoading(false);
    }
  }, []);

  // Auto-save to localStorage with debouncing
  const saveToStorage = useCallback(() => {
    if (!config.autoSave) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        storage.set(STORAGE_KEYS.SESSIONS, sessions);
        storage.set(STORAGE_KEYS.CONFIG, config);
        storage.set(STORAGE_KEYS.CURRENT_SESSION, currentSessionId);
      } catch (err) {
        console.error('Failed to save chat history:', err);
        setError('Gagal menyimpan riwayat chat');
      }
    }, 1000);
  }, [sessions, config, currentSessionId]);

  // Save when data changes
  useEffect(() => {
    if (!isLoading) {
      saveToStorage();
    }
  }, [sessions, config, currentSessionId, isLoading, saveToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Create a new message
  const createMessage = useCallback((input: CreateMessageInput): ChatMessage => {
    return {
      id: input.id || uuidv4(),
      content: input.content,
      sender: input.sender,
      timestamp: input.timestamp || new Date(),
      status: input.status || 'sent',
      type: input.type,
      metadata: input.metadata,
    };
  }, []);

  // Create a new session
  const createSession = useCallback((input?: CreateSessionInput): ChatSession => {
    const now = new Date();
    return {
      id: input?.id || uuidv4(),
      userId: input?.userId || userId || 'anonymous',
      messages: input?.messages || [],
      createdAt: input?.createdAt || now,
      updatedAt: input?.updatedAt || now,
      isActive: input?.isActive ?? true,
    };
  }, [userId]);

  // Get current session
  const getCurrentSession = useCallback((): ChatSession | null => {
    if (!currentSessionId || !sessions[currentSessionId]) {
      return null;
    }
    return sessions[currentSessionId];
  }, [currentSessionId, sessions]);

  // Start a new session
  const startNewSession = useCallback((): string => {
    const newSession = createSession();
    setSessions(prev => ({
      ...prev,
      [newSession.id]: newSession,
    }));
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, [createSession]);

  // Switch to an existing session
  const switchToSession = useCallback((sessionId: string): boolean => {
    if (!sessions[sessionId]) {
      setError('Session tidak ditemukan');
      return false;
    }
    setCurrentSessionId(sessionId);
    return true;
  }, [sessions]);

  // Add message to current session
  const addMessage = useCallback((input: CreateMessageInput): ChatMessage => {
    const message = createMessage(input);

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
      const updatedMessages = [...session.messages, message];
      
      // Limit messages if configured
      const limitedMessages = config.maxMessages > 0 
        ? updatedMessages.slice(-config.maxMessages)
        : updatedMessages;

      const updatedSession = {
        ...session,
        messages: limitedMessages,
        updatedAt: new Date(),
      };

      console.log('useChatHistory: Session updated', {
        sessionId: targetSessionId,
        messagesCount: updatedSession.messages.length,
        lastMessage: updatedSession.messages[updatedSession.messages.length - 1]?.content?.substring(0, 50)
      });

      return {
        ...prev,
        [targetSessionId]: updatedSession,
      };
    });

    return message;
  }, [currentSessionId, createMessage, createSession, config.maxMessages]);

  // Update message status
  const updateMessageStatus = useCallback((
    messageId: string, 
    status: ChatMessage['status'],
    sessionId?: string
  ): boolean => {
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId || !sessions[targetSessionId]) {
      return false;
    }

    setSessions(prev => {
      const session = prev[targetSessionId];
      const messageIndex = session.messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return prev;
      }

      const updatedMessages = [...session.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        status,
      };

      return {
        ...prev,
        [targetSessionId]: {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      };
    });

    return true;
  }, [currentSessionId, sessions]);

  // Update message content
  const updateMessage = useCallback((
    messageId: string,
    updates: Partial<ChatMessage>,
    sessionId?: string
  ): boolean => {
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId || !sessions[targetSessionId]) {
      return false;
    }

    setSessions(prev => {
      const session = prev[targetSessionId];
      const messageIndex = session.messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return prev;
      }

      const updatedMessages = [...session.messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        ...updates,
        id: messageId, // Preserve original ID
      };

      return {
        ...prev,
        [targetSessionId]: {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      };
    });

    return true;
  }, [currentSessionId, sessions]);

  // Delete a message
  const deleteMessage = useCallback((messageId: string, sessionId?: string): boolean => {
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId || !sessions[targetSessionId]) {
      return false;
    }

    setSessions(prev => {
      const session = prev[targetSessionId];
      const updatedMessages = session.messages.filter(msg => msg.id !== messageId);

      return {
        ...prev,
        [targetSessionId]: {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      };
    });

    return true;
  }, [currentSessionId, sessions]);

  // Clear current session
  const clearCurrentSession = useCallback((): boolean => {
    if (!currentSessionId || !sessions[currentSessionId]) {
      return false;
    }

    setSessions(prev => ({
      ...prev,
      [currentSessionId]: {
        ...prev[currentSessionId],
        messages: [],
        updatedAt: new Date(),
      },
    }));

    return true;
  }, [currentSessionId, sessions]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string): boolean => {
    if (!sessions[sessionId]) {
      return false;
    }

    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[sessionId];
      return newSessions;
    });

    // Switch to another session if current was deleted
    if (sessionId === currentSessionId) {
      const remainingSessions = Object.keys(sessions).filter(id => id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0]);
      } else {
        setCurrentSessionId(null);
      }
    }

    return true;
  }, [sessions, currentSessionId]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<ChatUIConfig>): void => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Get session list
  const getSessionList = useCallback((): ChatSession[] => {
    return Object.values(sessions).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, [sessions]);

  // Clear all data
  const clearAllData = useCallback((): void => {
    setSessions({});
    setCurrentSessionId(null);
    storage.remove(STORAGE_KEYS.SESSIONS);
    storage.remove(STORAGE_KEYS.CURRENT_SESSION);
  }, []);

  // Export data
  const exportData = useCallback((): ChatStorage => {
    return {
      sessions,
      config,
      analytics: [], // TODO: Implement analytics
      lastCleanup: new Date(),
    };
  }, [sessions, config]);

  return {
    // State
    sessions,
    currentSessionId,
    currentSession: getCurrentSession(),
    config,
    isLoading,
    error,

    // Session management
    startNewSession,
    switchToSession,
    deleteSession,
    getSessionList,

    // Message management
    addMessage,
    updateMessage,
    updateMessageStatus,
    deleteMessage,
    clearCurrentSession,

    // Configuration
    updateConfig,

    // Utilities
    clearAllData,
    exportData,
    createMessage,
    createSession,
  };
}
