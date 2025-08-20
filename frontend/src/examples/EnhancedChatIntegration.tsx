/**
 * Enhanced Chat Integration Example
 * Demonstrates how to integrate the guest-to-auth conversion workflow
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedChatProvider, useUnifiedChat } from '@/contexts/UnifiedChatContext';
import { ConversionNotification } from '@/components/chat/ConversionNotification';

// Mock authentication service
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthService {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  onAuthStateChange: (callback: (user: User | null) => void) => () => void;
}

const mockAuthService: AuthService = {
  currentUser: null,
  
  async login(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = {
      id: 'user_' + Date.now(),
      email,
      name: email.split('@')[0]
    };
    
    this.currentUser = user;
    return user;
  },
  
  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.currentUser = null;
  },
  
  onAuthStateChange(callback: (user: User | null) => void) {
    // In a real app, this would listen to auth state changes
    const interval = setInterval(() => {
      callback(this.currentUser);
    }, 1000);
    
    return () => clearInterval(interval);
  }
};

// Chat interface component
function ChatInterface() {
  const {
    messages,
    sendMessage,
    isTyping,
    currentSession
  } = useUnifiedChat();

  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage(messageInput);
    setMessageInput('');
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <h3 className="font-semibold">SELLY Assistant</h3>
        <div className="text-xs opacity-75">
          Session: {currentSession?.id ? 'Active' : 'None'} |
          Messages: {messages.length}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Mulai percakapan dengan SELLY...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-3 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('id-ID')}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="text-left">
            <div className="inline-block bg-white border px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ketik pesan Anda..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="p-2 bg-green-50 border-t text-sm text-green-800">
        Status: Connected to SELLY
      </div>
    </div>
  );
}

// Login form component
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="font-semibold text-lg">Login to Save Chat History</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// Main application component
export function EnhancedChatIntegrationExample() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = mockAuthService.onAuthStateChange(setUser);
    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const loggedInUser = await mockAuthService.login(email, password);
      setUser(loggedInUser);
      setShowLogin(false);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await mockAuthService.logout();
    setUser(null);
  };

  // Mock message handler
  const handleMessageSent = async (content: string): Promise<string> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple response logic
    if (content.toLowerCase().includes('halo') || content.toLowerCase().includes('hai')) {
      return 'Halo! Saya SELLY, asisten virtual untuk layanan administrasi. Ada yang bisa saya bantu?';
    }
    
    if (content.toLowerCase().includes('ktp')) {
      return 'Untuk pengurusan KTP, Anda perlu menyiapkan dokumen berikut: 1) Kartu Keluarga, 2) Akta Kelahiran, 3) Surat Keterangan Pindah (jika pindah domisili). Apakah ada yang ingin Anda tanyakan lebih lanjut?';
    }
    
    return `Terima kasih atas pertanyaan Anda: "${content}". Saya sedang memproses informasi yang Anda butuhkan. Apakah ada hal lain yang bisa saya bantu?`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SELLY Enhanced Chat Integration
        </h1>
        <p className="text-gray-600">
          Demonstrasi integrasi guest-to-auth conversion workflow
        </p>
      </div>

      {/* User Status */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-center">
          <div>
            {user ? (
              <div>
                <span className="text-green-600 font-medium">✓ Logged in as:</span>
                <span className="ml-2">{user.name} ({user.email})</span>
              </div>
            ) : (
              <span className="text-gray-600">Not logged in (Guest mode)</span>
            )}
          </div>
          <div className="space-x-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login Form */}
      {showLogin && !user && (
        <LoginForm onLogin={handleLogin} />
      )}

      {/* Unified Chat Provider - MIGRATED FROM DEPRECATED EnhancedChatProvider */}
      <UnifiedChatProvider
        userId={user?.id}
        onMessageSent={handleMessageSent}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>

          {/* Session Info */}
          <div className="space-y-4">
            <SessionInfo />
            <FeatureStatus />
          </div>
        </div>
      </UnifiedChatProvider>
    </div>
  );
}

// Session info component - MIGRATED FROM DEPRECATED useEnhancedChat
function SessionInfo() {
  const { currentSession, messages } = useUnifiedChat();

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-semibold mb-3">Session Information</h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Session ID:</span>
          <span className="ml-2 text-xs">{currentSession?.id || 'No session'}</span>
        </div>
        <div>
          <span className="font-medium">Messages:</span>
          <span className="ml-2">{messages.length}</span>
        </div>
        <div>
          <span className="font-medium">Last Activity:</span>
          <span className="ml-2 text-xs">
            {currentSession?.updatedAt?.toLocaleTimeString('id-ID') || 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-medium">Status:</span>
          <span className="ml-2">Active</span>
        </div>
      </div>
    </div>
  );
}

// Feature status component - MIGRATED FROM DEPRECATED useEnhancedChat
function FeatureStatus() {
  // Mock features for demo purposes since UnifiedChat doesn't expose feature flags
  const enabledFeatures = {
    enhanced_session_storage: true,
    guest_session_persistence: true,
    conversation_context: true,
    performance_monitoring: true
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-semibold mb-3">Enabled Features</h4>
      <div className="space-y-1">
        {Object.entries(enabledFeatures).map(([feature, enabled]) => (
          <div key={feature} className="flex items-center text-sm">
            <span className={`w-2 h-2 rounded-full mr-2 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-xs">{feature.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
