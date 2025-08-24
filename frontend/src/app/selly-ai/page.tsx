'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  TrashIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedChatProvider, useUnifiedChat } from '@/contexts/UnifiedChatContext';
import { EnhancedChatMessage } from '@/components/chatbot/EnhancedChatMessage';
import { EnhancedSellyToggle } from '@/components/chatbot/EnhancedSellyToggle';
// DISABLED FOR CORE BUILD - Using simplified chat functionality
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// import { aiService } from '../../../selly-legacy-nextjs-backend/business-logic/chatbot/core/aiService';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { cn } from '@/lib/conn/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import { pageTransition, fadeInUp, staggerContainer } from '@/lib/animations';
import { QUICK_ACTIONS } from '@/types/chatbot';
import { SellyWelcomeCard } from './components/SellyWelcomeCard'; // Disabled for core build
import { MobileSellyInterface } from './components/MobileSellyInterface'; // Disabled for core build
import { isMobile } from '@/utils/mobile';

interface SellyAIPageContentProps {
  className?: string;
  enhancedMode: boolean;
  setEnhancedMode: (mode: boolean) => void;
}



/**
 * Standalone SELLY AI Assistant Page Content
 * Enterprise-grade design with glass-morphism effects and full accessibility
 */
function SellyAIPageContent({ className, enhancedMode, setEnhancedMode }: SellyAIPageContentProps) {
  const {
    messages,
    isTyping,
    loadingStage,
    estimatedTime,
    sendMessage,
    clearMessages,
    startNewSession,
  } = useUnifiedChat();

  // Page state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check for mobile view - start with false to match SSR
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = isMobile();
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
      setIsMobileView(isMobileDevice || isSmallScreen);
    };

    // Only check after component mounts to avoid hydration mismatch
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle message submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsSubmitting(true);
    setShowQuickActions(false);

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue, isSubmitting, sendMessage]);

  // Handle quick action
  const handleQuickAction = useCallback((query: string) => {
    setInputValue(query);
    setShowQuickActions(false);
    inputRef.current?.focus();
  }, []);

  // Handle clear chat with confirmation
  const handleClearChat = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua percakapan?')) {
      clearMessages();
      startNewSession();
      setShowQuickActions(true);
      setShowMenu(false);
    }
  }, [clearMessages, startNewSession]);

  // Handle menu toggle
  const toggleMenu = useCallback(() => {
    setShowMenu(!showMenu);
  }, [showMenu]);

  // Handle enhancement mode change
  const handleEnhancementModeChange = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    console.log(`🔄 [SELLY_AI_PAGE] Enhancement mode changed to: ${enabled ? 'Enhanced' : 'Standard'}`);
  }, [setEnhancedMode]);

  // Render mobile interface for mobile devices
  if (isMobileView) {
    return <MobileSellyInterface className={className} />;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className={cn(
        "min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Glass-morphism Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        variants={fadeInUp}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="p-2 hover:bg-primary/10 transition-colors duration-300"
                aria-label="Kembali"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-5 w-5 text-primary-foreground" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-foreground">SELLY AI Assistant</h1>
                  <div className="text-sm text-muted-foreground">
                    Spesialis Pencatatan Sipil Kabupaten Garut
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="p-2 hover:bg-primary/10 transition-colors duration-300"
                aria-label="Menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-border/50 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu SELLY</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(false)}
                  className="p-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={handleClearChat}
                >
                  <TrashIcon className="h-4 w-4" />
                  Hapus Percakapan
                </Button>

                {/* Simple Enhancement Toggle */}
                <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                  <p className="text-sm font-medium text-foreground mb-3">Mode SELLY</p>
                  <EnhancedSellyToggle
                    onModeChange={handleEnhancementModeChange}
                    initialMode={enhancedMode}
                    className="scale-95"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Chat Messages Area */}
          <div className="bg-background/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="h-[calc(100vh-280px)] overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <SellyWelcomeCard onQuickActionClick={handleQuickAction} />
              ) : (
                messages.map((message) => (
                  <div key={message.id}>
                    <EnhancedChatMessage
                      message={message}
                      onFollowUpClick={(query) => {
                        setInputValue(query);
                        inputRef.current?.focus();
                      }}
                      onInsightClick={(insight) => {
                        if (insight.query) {
                          setInputValue(insight.query);
                          inputRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                  <span>SELLY sedang memproses...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length === 0 && (
            <div className="mt-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Aksi Cepat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pilih kategori layanan yang Anda butuhkan
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_ACTIONS.slice(0, 8).map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    onClick={() => handleQuickAction(action.query)}
                    className={cn(
                      "h-auto py-6 px-4 text-left justify-start w-full",
                      "bg-background/40 backdrop-blur-sm border border-border/30",
                      "hover:border-primary/40 hover:bg-primary/5",
                      "transition-colors duration-200 rounded-xl"
                    )}
                  >
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl">{action.icon}</span>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm mb-1">
                          {action.label}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tanyakan apa saja tentang layanan administrasi kependudukan..."
                  className={cn(
                    "min-h-[56px] max-h-[120px] resize-none text-base",
                    "bg-background/60 backdrop-blur-sm border-border/50",
                    "focus:border-primary/50 focus:ring-primary/20",
                    "transition-all duration-300",
                    "placeholder:text-muted-foreground/70"
                  )}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />

                {/* Character count indicator */}
                {inputValue.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {inputValue.length}/500
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!inputValue.trim() || isSubmitting}
                className={cn(
                  "h-14 w-14 p-0 rounded-full",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                )}
                aria-label="Kirim pesan"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </Button>
            </form>

            {/* Input hints */}
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                Tekan <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd> untuk mengirim,
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border ml-1">Shift + Enter</kbd> untuk baris baru
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Main SELLY AI Page Component with Provider
 * Supports both authenticated and guest users
 */
export default function SellyAIPage() {
  const [enhancedMode, setEnhancedMode] = useState(true); // Move enhancement mode to main component

  // Use authenticated user hook to resolve authentication inconsistency
  const { userId, isAuthenticated, isLoading } = useAuthenticatedUser();

  // PHASE 2: SELLY AI page data clearing functions
  const clearSellyAIPageData = useCallback(() => {
    try {
      console.log('🧹 [SELLY_AI_PAGE] Starting SELLY AI page data cleanup...');

      // Clear localStorage SELLY keys
      const sellyKeys = [
        'selly_chat_sessions',
        'selly_current_session',
        'selly_chat_config',
        'selly-enhanced-mode'
      ];

      sellyKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ [SELLY_AI_PAGE] Cleared localStorage key: ${key}`);
      });

      // Pattern-based clearing
      const allKeys = Object.keys(localStorage);
      let patternClearedCount = 0;

      allKeys.forEach(key => {
        if (key.startsWith('selly_') || key.startsWith('selly-')) {
          localStorage.removeItem(key);
          patternClearedCount++;
          console.log(`🗑️ [SELLY_AI_PAGE] Pattern-cleared key: ${key}`);
        }
      });

      // Reset page state
      setEnhancedMode(true); // Reset to default

      console.log(`✅ [SELLY_AI_PAGE] SELLY AI page data cleanup completed. Cleared ${sellyKeys.length} specific keys and ${patternClearedCount} pattern-matched keys.`);

    } catch (error) {
      console.error('❌ [SELLY_AI_PAGE] Error during SELLY AI page data cleanup:', error);
    }
  }, []);

  const resetSellyAIPageServices = useCallback(async () => {
    try {
      console.log('🔄 [SELLY_AI_PAGE] Resetting SELLY AI page services...');

      // Clear EnhancedChatStorageService cache (disabled for core build)
      try {
        // const { EnhancedChatStorageService } = await import('@/services/chatbot/enhancedChatStorageService'); // Disabled for core build
        // const chatStorageService = EnhancedChatStorageService.getInstance(); // Disabled for core build
        // chatStorageService.clearLocalCache(); // Disabled for core build
        console.log('🧹 [SELLY_AI_PAGE] EnhancedChatStorageService cache clearing disabled in core build mode');
      } catch (cacheError) {
        console.warn('⚠️ [SELLY_AI_PAGE] Could not clear chat service cache:', cacheError);
      }

      // Note: User ID is now managed by useAuthenticatedUser hook

      console.log('✅ [SELLY_AI_PAGE] SELLY AI page services reset completed');

    } catch (error) {
      console.error('❌ [SELLY_AI_PAGE] Error resetting SELLY AI page services:', error);
    }
  }, []);

  // PHASE 2: Auth state change listener for SELLY AI page
  useEffect(() => {
    console.log('🔐 [SELLY_AI_PAGE] Setting up SELLY AI page auth state change listener...');

    // Import supabase dynamically to avoid SSR issues
    const setupAuthListener = async () => {
      try {
        const { supabase } = await import('@/lib/conn/supabaseClient');

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              console.log(`🔐 [SELLY_AI_PAGE] SELLY AI page auth state change detected: ${event}`);

              if (event === 'SIGNED_OUT') {
                console.log('👋 [SELLY_AI_PAGE] User signed out - clearing all SELLY AI page data');
                clearSellyAIPageData();
                await resetSellyAIPageServices();

              } else if (event === 'SIGNED_IN' && session?.user) {
                console.log(`👤 [SELLY_AI_PAGE] User signed in - reinitializing SELLY AI page for user: ${session.user.id.slice(0, 8)}...`);
                clearSellyAIPageData(); // Clear previous user's data
                await resetSellyAIPageServices();

              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('🔄 [SELLY_AI_PAGE] Token refreshed - maintaining SELLY AI page session');
                // Don't clear data on token refresh
              }

            } catch (error) {
              console.error('❌ [SELLY_AI_PAGE] Error handling SELLY AI page auth state change:', error);
            }
          }
        );

        // Return cleanup function
        return () => {
          console.log('🧹 [SELLY_AI_PAGE] Cleaning up SELLY AI page auth state listener');
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };

      } catch (error) {
        console.error('❌ [SELLY_AI_PAGE] Error setting up SELLY AI page auth listener:', error);
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
  }, [clearSellyAIPageData, resetSellyAIPageServices]);

  const handleMessageSent = useCallback(async (message: string): Promise<string> => {
    try {
      console.log('🚀 [SELLY_AI_PAGE] Processing message with enhanced workflow:', message);

      // Enhanced context with proper metadata (matching dashboard implementation)
      const enhancedContext = {
        userId: userId,
        timestamp: new Date().toISOString(),
        enhancedMode: enhancedMode, // Use actual enhancement mode state
        source: 'selly-ai-page',
        sessionId: `selly-ai-${userId}`,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        metadata: {
          standalone: true,
          pageType: 'selly-ai',
          enhanced: enhancedMode
        }
      };

      // First tier: Try Go Backend API endpoint for AI-powered responses
      try {
        console.log('🔄 [SELLY_AI_PAGE] Attempting Go Backend API call...');
        const response = await fetch('http://localhost:8080/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            context: enhancedContext,
            enhancementMode: enhancedMode ? 'enhanced' : 'standard', // Dynamic enhancement mode
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.response) {
            console.log('✅ [SELLY_AI_PAGE] Go Backend API call successful');
            return data.response;
          }
        }

        console.log('⚠️ [SELLY_AI_PAGE] Primary API call failed, trying fallback...');
      } catch (apiError) {
        console.log('⚠️ [SELLY_AI_PAGE] Primary API error, trying fallback:', apiError);
      }

      // Second tier: Fallback with basic Indonesian response
      try {
        console.log('🔄 [SELLY_AI_PAGE] Using intelligent fallback response...');

        // Provide intelligent Indonesian response based on query content
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = '';

        if (lowerMessage.includes('ktp')) {
          fallbackResponse = 'Untuk mengurus KTP, Anda perlu membawa dokumen persyaratan ke Dinas Kependudukan dan Pencatatan Sipil. Apakah ada hal spesifik yang ingin Anda tanyakan tentang KTP?';
        } else if (lowerMessage.includes('kk') || lowerMessage.includes('kartu keluarga')) {
          fallbackResponse = 'Untuk mengurus Kartu Keluarga, silakan datang ke Dinas Kependudukan dengan membawa dokumen yang diperlukan. Ada yang bisa saya bantu lebih lanjut?';
        } else if (lowerMessage.includes('akta')) {
          fallbackResponse = 'Untuk mengurus akta kelahiran, Anda perlu membawa dokumen persyaratan ke Dinas Kependudukan. Apakah Anda memerlukan informasi lebih detail?';
        } else {
          fallbackResponse = 'Halo! Saya SELLY, asisten virtual Dinas Kependudukan dan Pencatatan Sipil. Bagaimana saya bisa membantu Anda hari ini?';
        }

        console.log('✅ [SELLY_AI_PAGE] Intelligent fallback response generated');
        return fallbackResponse;
      } catch (localError) {
        console.log('⚠️ [SELLY_AI_PAGE] Fallback processing failed:', localError);
      }

      // Third tier: Final fallback with helpful message
      console.log('⚠️ [SELLY_AI_PAGE] All processing methods failed, using fallback message');
      return `Maaf, saya sedang mengalami gangguan teknis sementara.

Silakan coba:
• Muat ulang halaman dan kirim pesan lagi
• Periksa koneksi internet Anda
• Coba lagi dalam beberapa menit

Jika masalah berlanjut, silakan hubungi administrator sistem.`;

    } catch (error) {
      console.error('❌ [SELLY_AI_PAGE] Critical error in message processing:', error);
      return 'Maaf, terjadi kesalahan sistem. Silakan muat ulang halaman dan coba lagi.';
    }
  }, [userId, enhancedMode]);

  // Show loading state while determining user authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading SELLY AI...</div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <div className="min-h-screen">
        <UnifiedChatProvider userId={userId} onMessageSent={handleMessageSent}>
          <SellyAIPageContent
            enhancedMode={enhancedMode}
            setEnhancedMode={setEnhancedMode}
          />
        </UnifiedChatProvider>
      </div>
    </ThemeProvider>
  );
}
