/**
 * Enhanced Chat Storage Service - Simplified Version
 * Provides basic chat storage functionality for the core web app
 */

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sessionId?: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export class EnhancedChatStorageService {
  private static instance: EnhancedChatStorageService;
  private sessions: Map<string, ChatSession> = new Map();

  static getInstance(): EnhancedChatStorageService {
    if (!EnhancedChatStorageService.instance) {
      EnhancedChatStorageService.instance = new EnhancedChatStorageService();
    }
    return EnhancedChatStorageService.instance;
  }

  async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'New Chat'
      };
      this.sessions.set(sessionId, session);
    }

    session.messages.push(message);
    session.updatedAt = new Date();

    // Store in localStorage for persistence
    try {
      localStorage.setItem(`chat_session_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Try to load from localStorage
      try {
        const stored = localStorage.getItem(`chat_session_${sessionId}`);
        if (stored) {
          session = JSON.parse(stored);
          if (session) {
            this.sessions.set(sessionId, session);
          }
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }

    return session || null;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    const sessions: ChatSession[] = [];
    
    // Load from localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chat_session_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const session = JSON.parse(stored);
            sessions.push(session);
            this.sessions.set(session.id, session);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load sessions from localStorage:', error);
    }

    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    try {
      localStorage.removeItem(`chat_session_${sessionId}`);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  }

  async clearAllSessions(): Promise<void> {
    this.sessions.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chat_session_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const enhancedChatStorageService = EnhancedChatStorageService.getInstance();
