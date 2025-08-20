'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useChatHistory } from '@/hooks/useChatHistory';
import { 
  ChatMessage, 
  ChatSession, 
  ChatUIState, 
  ChatUIConfig,
  ConversationContext,
  CreateMessageInput 
} from '@/types/chatbot';
import { supabase } from '@/lib/conn/supabaseClient';

interface ChatContextType {
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  userId?: string;
  onMessageSent?: (message: string) => Promise<string>;
}

export function ChatProvider({
  children,
  userId,
  onMessageSent
}: ChatProviderProps) {
  // Chat history hook
  const chatHistory = useChatHistory(userId);



  // UI state
  const [uiState, setUIState] = useState<ChatUIState>({
    isOpen: false,
    isMinimized: false,
    isTyping: false,
    hasUnreadMessages: false,
  });

  const [isTyping, setIsTyping] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    userPreferences: {
      language: 'id',
      dataFormat: 'summary',
      verbosity: 'detailed',
    },
  });

  // Get current user info
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .single();

          if (profile) {
            setConversationContext(prev => ({
              ...prev,
              sessionData: {
                userName: profile.name || 'User',
                userRole: profile.role || 'user',
                accessLevel: profile.role === 'admin' ? 'admin' : 'user',
              },
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to get user info:', error);
      }
    };

    getCurrentUser();
  }, []);

  // UI Actions
  const toggleChat = useCallback(() => {
    console.log('ChatContext: toggleChat called, current isOpen:', uiState.isOpen);
    setUIState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasUnreadMessages: prev.isOpen ? prev.hasUnreadMessages : false,
    }));
  }, [uiState.isOpen]);

  const minimizeChat = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isMinimized: true,
    }));
  }, []);

  const maximizeChat = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isMinimized: false,
    }));
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);
    setUIState(prev => ({
      ...prev,
      isTyping: typing,
    }));
  }, []);

  const clearError = useCallback(() => {
    // Clear error from chat history if needed
  }, []);

  // Progressive loading stages
  const getLoadingStage = useCallback((elapsedTime: number): string => {
    if (elapsedTime < 500) return "Memproses permintaan...";
    if (elapsedTime < 1500) return "Menganalisis data...";
    if (elapsedTime < 3000) return "Menyiapkan hasil...";
    return "Menyelesaikan respons...";
  }, []);

  const getEstimatedTime = useCallback((query: string): number => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('cari') || lowerQuery.includes('temukan')) return 2000; // 2s for search
    if (lowerQuery.includes('statistik') || lowerQuery.includes('total')) return 1000; // 1s for stats
    if (lowerQuery.includes('tampilkan') || lowerQuery.includes('data')) return 500; // 0.5s for data
    return 1500; // 1.5s default
  }, []);

  // Message Actions
  const sendMessage = useCallback(async (content: string) => {
    try {
      const now = Date.now();

      // Rate limiting: prevent messages sent too quickly (less than 1 second apart)
      if (now - lastMessageTime < 1000) {
        console.log('⚡ [CHAT_CONTEXT] Rate limit: Message sent too quickly, ignoring:', content);
        return;
      }

      // Check for duplicate messages (same content within last 5 seconds)
      const recentMessages = chatHistory.currentSession?.messages || [];
      const recentDuplicate = recentMessages.find(msg =>
        msg.sender === 'user' &&
        msg.content.trim().toLowerCase() === content.trim().toLowerCase() &&
        (now - new Date(msg.timestamp).getTime()) < 5000 // 5 seconds
      );

      if (recentDuplicate) {
        console.log('🔄 [CHAT_CONTEXT] Duplicate message detected, ignoring:', content);
        return; // Ignore duplicate message
      }

      // Update last message time
      setLastMessageTime(now);

      const userMessage = chatHistory.addMessage({
        content,
        sender: 'user',
        type: 'text',
        status: 'sending',
      });

      // Update conversation context
      setConversationContext(prev => ({
        ...prev,
        lastQuery: content,
      }));

      // Set up progressive loading
      const estimatedDuration = getEstimatedTime(content);
      const startTime = Date.now();

      setEstimatedTime(estimatedDuration);
      setLoadingStage("Memproses permintaan...");
      setTyping(true);

      // Update loading stage progressively
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setLoadingStage(getLoadingStage(elapsed));
      }, 500);

      // Update user message status to sent
      chatHistory.updateMessageStatus(userMessage.id, 'sent');

      // Process message (call AI service or handle locally)
      let response = 'Maaf, saya belum dapat memproses permintaan Anda saat ini.';

      if (onMessageSent) {
        try {
          response = await onMessageSent(content);

          // Ensure we have a valid response
          if (!response || typeof response !== 'string' || response.trim() === '') {
            response = 'Maaf, tidak ada respons yang diterima. Silakan coba lagi.';
          }
        } catch (error) {
          console.error('❌ [CHAT_CONTEXT] Error processing message:', error);
          response = 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.';
          chatHistory.updateMessageStatus(userMessage.id, 'error');
        }
      }

      // Add AI response
      setTimeout(() => {
        clearInterval(progressInterval);

        // Only add response if it's not empty
        if (response && response.trim()) {
          const aiMessage = chatHistory.addMessage({
            content: response,
            sender: 'selly',
            type: 'text',
            status: 'sent',
          });
          console.log('✅ [CHAT_CONTEXT] AI response added:', response.substring(0, 100) + '...');
        } else {
          console.warn('⚠️ [CHAT_CONTEXT] Empty response received, not adding to chat');
        }

        setTyping(false);
        setLoadingStage("");
        setEstimatedTime(0);
      }, 1000 + Math.random() * 2000); // Simulate processing time

    } catch (error) {
      console.error('Error sending message:', error);
      setTyping(false);
      setLoadingStage("");
      setEstimatedTime(0);
    }
  }, [chatHistory, onMessageSent, setTyping, getLoadingStage, getEstimatedTime, lastMessageTime]);

  const addMessage = useCallback((message: CreateMessageInput): ChatMessage => {
    return chatHistory.addMessage(message);
  }, [chatHistory]);

  const updateMessageStatus = useCallback((messageId: string, status: ChatMessage['status']) => {
    chatHistory.updateMessageStatus(messageId, status);
  }, [chatHistory]);

  const clearMessages = useCallback(() => {
    chatHistory.clearCurrentSession();
  }, [chatHistory]);

  // Session Actions
  const startNewSession = useCallback((): string => {
    const sessionId = chatHistory.startNewSession();
    
    // Reset conversation context for new session
    setConversationContext(prev => ({
      ...prev,
      currentTopic: undefined,
      lastQuery: undefined,
    }));

    return sessionId;
  }, [chatHistory]);

  const switchSession = useCallback((sessionId: string): boolean => {
    return chatHistory.switchToSession(sessionId);
  }, [chatHistory]);

  const deleteSession = useCallback((sessionId: string): boolean => {
    return chatHistory.deleteSession(sessionId);
  }, [chatHistory]);

  const getSessions = useCallback((): ChatSession[] => {
    return chatHistory.getSessionList();
  }, [chatHistory]);

  // Configuration
  const updateConfig = useCallback((config: Partial<ChatUIConfig>) => {
    chatHistory.updateConfig(config);
  }, [chatHistory]);

  // Context Management
  const updateContext = useCallback((context: Partial<ConversationContext>) => {
    setConversationContext(prev => ({
      ...prev,
      ...context,
    }));
  }, []);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (uiState.isOpen && uiState.hasUnreadMessages) {
      setUIState(prev => ({
        ...prev,
        hasUnreadMessages: false,
      }));
    }
  }, [uiState.isOpen, uiState.hasUnreadMessages]);

  // Check for new messages and update unread status
  useEffect(() => {
    if (!uiState.isOpen && chatHistory.currentSession) {
      const lastMessage = chatHistory.currentSession.messages[chatHistory.currentSession.messages.length - 1];
      if (lastMessage && lastMessage.sender === 'selly') {
        const messageTime = lastMessage.timestamp.getTime();
        const now = Date.now();
        // Mark as unread if message is less than 5 seconds old and chat is closed
        if (now - messageTime < 5000) {
          setUIState(prev => ({
            ...prev,
            hasUnreadMessages: true,
          }));
        }
      }
    }
  }, [chatHistory.currentSession?.messages, chatHistory.currentSession, uiState.isOpen]);

  const contextValue: ChatContextType = {
    // State
    uiState,
    messages: chatHistory.currentSession?.messages || [],
    currentSession: chatHistory.currentSession,
    config: chatHistory.config,
    isLoading: chatHistory.isLoading,
    error: chatHistory.error,
    isTyping,
    loadingStage,
    estimatedTime,
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
  };



  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
}

// Hook for checking if chat is available
export function useChatAvailable(): boolean {
  try {
    const context = useContext(ChatContext);
    return context !== undefined;
  } catch {
    return false;
  }
}
