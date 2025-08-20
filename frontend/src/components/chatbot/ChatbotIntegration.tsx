"use client";

import React, { useCallback, useState, useEffect } from "react";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { UnifiedChatInterface } from "./UnifiedChatInterface";
import { aiService } from "@/services/chatbot/aiService";
import { cn } from "@/lib/conn/utils";

interface ChatbotIntegrationProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  disabled?: boolean;
  userId?: string;
  apiKey?: string;
  showEnhancementToggle?: boolean;
  defaultEnhancedMode?: boolean;
}

/**
 * Main chatbot integration component
 * This component should be added to the root layout or dashboard
 */
export function ChatbotIntegration({
  className,
  position = "bottom-right",
  disabled = false,
  userId,
  apiKey,
  showEnhancementToggle = true,
  defaultEnhancedMode = false,
}: ChatbotIntegrationProps) {
  console.log('🚀 ChatbotIntegration: Component rendered with props:', {
    className,
    position,
    disabled,
    userId,
    hasApiKey: !!apiKey,
    showEnhancementToggle,
    defaultEnhancedMode
  });

  // Enhanced mode state
  const [enhancedMode, setEnhancedMode] = useState(defaultEnhancedMode);
  const [advancedOptions, setAdvancedOptions] = useState({
    enableVariations: false,
    enablePersonalization: true,
    enableCulturalAdaptation: true,
    performanceMode: 'balanced' as 'fast' | 'balanced' | 'comprehensive'
  });

  // Configure AI service if API key is provided
  React.useEffect(() => {
    if (apiKey) {
      aiService.updateConfig({ apiKey });
    }
  }, [apiKey]);

  // Load saved enhancement preferences
  useEffect(() => {
    const savedMode = localStorage.getItem('selly-enhanced-mode');
    const savedOptions = localStorage.getItem('selly-advanced-options');

    if (savedMode !== null) {
      setEnhancedMode(savedMode === 'true');
    }

    if (savedOptions) {
      try {
        setAdvancedOptions(JSON.parse(savedOptions));
      } catch (error) {
        console.warn('Failed to parse saved advanced options:', error);
      }
    }
  }, []);

  const handleMessageSent = useCallback(
    async (message: string): Promise<string> => {
      try {
        // Prepare enhanced context with enhancement settings
        const enhancedContext = {
          userId,
          timestamp: new Date().toISOString(),
          enhancedMode,
          ...advancedOptions,
          // Additional context for complex queries
          complexQuery: message.length > 50 || message.includes('bagaimana') || message.includes('jelaskan'),
          enableAI: enhancedMode && advancedOptions.performanceMode !== 'fast',
          generateVariations: enhancedMode && advancedOptions.enableVariations,
          performanceMode: advancedOptions.performanceMode
        };

        console.log('🔍 [CHATBOT_INTEGRATION] Sending message with enhanced context:', {
          message: message.substring(0, 50) + '...',
          enhancedMode,
          advancedOptions
        });

        // First try to use the API endpoint for AI-powered responses
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            context: enhancedContext,
            enhancementMode: enhancedMode ? 'enhanced' : 'standard',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Log enhancement metadata if available
            if (data.metadata?.enhancedMode) {
              console.log('✨ [CHATBOT_INTEGRATION] Enhanced response received:', {
                enhancementLayers: data.metadata.enhancementLayers,
                qualityScore: data.metadata.qualityScore,
                processingTime: data.metadata.processingTime
              });
            }
            return data.response;
          }
        }

        // Fallback to local processing if API fails
        console.log("API call failed, using local processing");
        const localResponse = await aiService.processQuery(message);
        return localResponse.content;
      } catch (error) {
        console.error("Error processing message:", error);

        // Final fallback to local processing
        try {
          const localResponse = await aiService.processQuery(message);
          return localResponse.content;
        } catch (localError) {
          console.error("Local processing also failed:", localError);
          return "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.";
        }
      }
    },
    [userId, enhancedMode, advancedOptions],
  );



  return (
    <div className="relative">
      {/* Main Chatbot with Integrated Enhancement Toggle */}
      <ChatProvider userId={userId} onMessageSent={handleMessageSent}>
        <ChatbotUI
          className={className}
          position={position}
          disabled={disabled}
        />
      </ChatProvider>
    </div>
  );
}

/**
 * Internal UI component that uses the chat context
 */
function ChatbotUI({
  className,
  position,
  disabled,
}: {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  disabled?: boolean;
}) {
  const [enhancedMode, setEnhancedMode] = useState(false);

  const handleEnhancementModeChange = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    console.log(`🔄 [CHATBOT_UI] Enhancement mode changed to: ${enabled ? 'Enhanced' : 'Standard'}`);
  }, []);
  console.log('🔧 ChatbotUI: Component rendered');
  const chatContext = useChat();
  const { sendMessage } = chatContext;
  console.log('🔧 ChatbotUI: useChat returned:', {
    hasSendMessage: !!sendMessage,
    messagesCount: chatContext.messages?.length || 0
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      await sendMessage(message);
    },
    [sendMessage],
  );

  return (
    <UnifiedChatInterface
      className={className}
      position={position}
      onSendMessage={handleSendMessage}
      disabled={disabled}
      onEnhancementModeChange={handleEnhancementModeChange}
      initialEnhancedMode={enhancedMode}
    />
  );
}

/**
 * Hook to easily integrate chatbot into existing components
 */
export function useChatbotIntegration() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string>();

  const enableChatbot = useCallback((key?: string) => {
    setIsEnabled(true);
    if (key) {
      setApiKey(key);
      aiService.updateConfig({ apiKey: key });
    }
  }, []);

  const disableChatbot = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const updateApiKey = useCallback((key: string) => {
    setApiKey(key);
    aiService.updateConfig({ apiKey: key });
  }, []);

  return {
    isEnabled,
    apiKey,
    enableChatbot,
    disableChatbot,
    updateApiKey,
    isConfigured: aiService.isConfigured(),
  };
}

/**
 * Chatbot settings component for admin configuration
 */
interface ChatbotSettingsProps {
  onApiKeyChange?: (apiKey: string) => void;
  onConfigChange?: (config: any) => void;
  className?: string;
}

export function ChatbotSettings({
  onApiKeyChange,
  onConfigChange,
  className,
}: ChatbotSettingsProps) {
  const [apiKey, setApiKey] = React.useState("");
  const [isTestingConnection, setIsTestingConnection] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<
    "idle" | "success" | "error"
  >("idle");

  const handleApiKeySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKey.trim()) return;

      // Update AI service configuration
      aiService.updateConfig({ apiKey: apiKey.trim() });
      onApiKeyChange?.(apiKey.trim());

      // Test connection
      setIsTestingConnection(true);
      try {
        const isConnected = await aiService.testConnection();
        setConnectionStatus(isConnected ? "success" : "error");
      } catch (error) {
        setConnectionStatus("error");
      } finally {
        setIsTestingConnection(false);
      }
    },
    [apiKey, onApiKeyChange],
  );

  return (
    <div className={cn("mx-auto max-w-2xl space-y-6 p-4 sm:p-6", className)}>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Konfigurasi SELLY Chatbot
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Konfigurasikan chatbot SELLY untuk memberikan respons yang lebih cerdas menggunakan AI.
        </p>
      </div>

      {/* API Key Configuration */}
      <form onSubmit={handleApiKeySubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            DeepSeek API Key
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan DeepSeek API Key..."
              className={cn(
                "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
                "transition-colors duration-200",
                !apiKey.trim() && connectionStatus === "error" && "border-red-500"
              )}
              aria-invalid={connectionStatus === "error"}
              aria-describedby="apiKey-error"
            />
            <button
              type="submit"
              disabled={!apiKey.trim() || isTestingConnection}
              className={cn(
                "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white sm:w-auto",
                "hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
            >
              {isTestingConnection ? "Menguji..." : "Simpan & Uji"}
            </button>
          </div>
          {/* Connection Status */}
          {connectionStatus !== "idle" && (
            <p
              id="apiKey-error"
              className={cn(
                "mt-2 text-sm",
                connectionStatus === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
              role="alert"
            >
              {connectionStatus === "success"
                ? "✅ Koneksi berhasil! SELLY siap digunakan dengan AI."
                : "❌ Koneksi gagal. Periksa API key Anda."}
            </p>
          )}
        </div>
      </form>

      {/* Current Status */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100">
          Status Saat Ini
        </h4>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="flex justify-between sm:flex-col sm:gap-1">
            <span className="text-gray-500 dark:text-gray-400">AI Service:</span>
            <span
              className={cn(
                "font-medium",
                aiService.isConfigured() ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              )}
            >
              {aiService.isConfigured() ? "Terkonfigurasi" : "Mode Placeholder"}
            </span>
          </div>
          <div className="flex justify-between sm:flex-col sm:gap-1">
            <span className="text-gray-500 dark:text-gray-400">Database:</span>
            <span className="font-medium text-green-600 dark:text-green-400">Terhubung</span>
          </div>
          <div className="flex justify-between sm:flex-col sm:gap-1">
            <span className="text-gray-500 dark:text-gray-400">Bahasa:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">Indonesia</span>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100">
          📖 Cara Penggunaan
        </h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>Tanpa API Key: SELLY memberikan respons placeholder berdasarkan data database</li>
          <li>Dengan API Key: SELLY menggunakan AI untuk respons yang lebih cerdas</li>
          <li>Pengguna dapat bertanya tentang statistik, mencari data, atau meminta bantuan</li>
          <li>Semua respons dalam bahasa Indonesia sesuai standar sistem</li>
        </ul>
      </div>

      {/* Quick Test */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100">
          🧪 Test Cepat
        </h4>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Coba tanyakan hal berikut ke SELLY untuk menguji fungsionalitas:
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "Berikan ringkasan data sistem",
            "Statistik pengguna aktif",
            "Aktivitas terbaru minggu ini",
            "Bagaimana cara mencari data?",
          ].map((query, index) => (
            <div
              key={index}
              className="rounded-md border border-gray-200 bg-gray-100 p-2 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              &quot;{query}&quot;
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple chatbot status indicator
 */
export function ChatbotStatus({ className }: { className?: string }) {
  const isConfigured = aiService.isConfigured();

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          isConfigured ? "bg-green-500" : "bg-orange-500"
        )}
        aria-hidden="true"
      />
      <span className="text-gray-500 dark:text-gray-400">
        SELLY: {isConfigured ? "AI Aktif" : "Mode Dasar"}
      </span>
    </div>
  );
}
