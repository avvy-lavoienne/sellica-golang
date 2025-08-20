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
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { EnhancedChatMessage } from '@/components/chatbot/EnhancedChatMessage';
import { EnhancedSellyToggle } from '@/components/chatbot/EnhancedSellyToggle';
import { cn } from '@/lib/conn/utils';
import { ThemeProvider } from '@/components/ThemeProvider';
import { pageTransition, fadeInUp, staggerContainer } from '@/lib/animations';
import { QUICK_ACTIONS } from '@/types/chatbot';
import { SellyWelcomeCard } from './components/SellyWelcomeCard';
import { MobileSellyInterface } from './components/MobileSellyInterface';
import { isMobile } from '@/utils/mobile';

interface SellyAIPageContentProps {
  className?: string;
}

/**
 * Generate a stable UUID for guest users
 */
function generateGuestUserId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Standalone SELLY AI Assistant Page Content
 * Enterprise-grade design with glass-morphism effects and full accessibility
 */
function SellyAIPageContent({ className }: SellyAIPageContentProps) {
  const {
    messages,
    isTyping,
    loadingStage,
    estimatedTime,
    sendMessage,
    clearMessages,
    startNewSession,
  } = useChat();

  // Page state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [enhancedMode, setEnhancedMode] = useState(true); // Default to enhanced for selly-ai page

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
  }, []);

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
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <SparklesIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-full blur opacity-75 animate-pulse" />
                </div>
                
                <div>
                  <h1 className="text-xl font-bold text-foreground">SELLY AI Assistant</h1>
                  <div className="text-sm text-muted-foreground">
                    {isTyping ? (
                      <span className="flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce inline-block" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.1s] inline-block" />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s] inline-block" />
                        </span>
                        {loadingStage || "Sedang mengetik..."}
                        {estimatedTime > 0 && (
                          <span className="opacity-70">
                            (~{Math.ceil(estimatedTime / 1000)}s)
                          </span>
                        )}
                      </span>
                    ) : "Spesialis Pencatatan Sipil Kabupaten Garut"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* SELLY Enhancement Toggle */}
              <div className="hidden md:block">
                <EnhancedSellyToggle
                  onModeChange={handleEnhancementModeChange}
                  initialMode={enhancedMode}
                  showAdvancedOptions={true}
                  className="scale-90"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-primary/10 transition-colors duration-300"
                  aria-label={isMinimized ? "Perbesar" : "Perkecil"}
                >
                  <MinusIcon className="h-5 w-5" />
                </Button>

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
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    setShowQuickActions(!showQuickActions);
                    setShowMenu(false);
                  }}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  {showQuickActions ? 'Sembunyikan' : 'Tampilkan'} Aksi Cepat
                </Button>

                {/* Mobile Enhancement Toggle */}
                <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
                  <p className="text-sm font-medium text-foreground mb-3">Mode SELLY</p>
                  <EnhancedSellyToggle
                    onModeChange={handleEnhancementModeChange}
                    initialMode={enhancedMode}
                    showAdvancedOptions={true}
                    className="scale-95"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Tentang SELLY</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    SELLY adalah AI Assistant yang dirancang khusus untuk membantu 
                    pelayanan administrasi kependudukan di Kabupaten Garut dengan 
                    kemampuan bahasa Indonesia yang natural dan akses data real-time.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Container */}
      <motion.div
        variants={staggerContainer}
        className={cn(
          "container mx-auto px-4 py-6 transition-all duration-300",
          isMinimized && "opacity-50 scale-95"
        )}
      >
        <div className="max-w-4xl mx-auto">
          {/* Chat Messages Area */}
          <div className="bg-background/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="h-[calc(100vh-280px)] overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <SellyWelcomeCard onQuickActionClick={handleQuickAction} />
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={fadeInUp}
                    className="transition-all duration-300 hover:scale-[1.01]"
                  >
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
                  </motion.div>
                ))
              )}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                    <span>{loadingStage || "SELLY sedang memproses..."}</span>
                  </div>
                  
                  {/* Progress indicator */}
                  {estimatedTime > 1000 && (
                    <div className="space-y-2">
                      <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out animate-pulse"
                          style={{ width: '60%' }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Estimasi: {Math.ceil(estimatedTime / 1000)} detik
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickActions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-8"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Aksi Cepat
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pilih kategori layanan yang Anda butuhkan
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUICK_ACTIONS.slice(0, 8).map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => handleQuickAction(action.query)}
                        className={cn(
                          "h-auto py-6 px-4 text-left justify-start w-full",
                          "bg-background/40 backdrop-blur-sm border border-border/30",
                          "hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]",
                          "transition-all duration-300 group rounded-xl"
                        )}
                      >
                        <div className="flex flex-col items-center gap-3 w-full">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-xl">{action.icon}</span>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors duration-300">
                              {action.label}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
  const [guestUserId, setGuestUserId] = useState('guest_initial');

  // Generate unique guest ID on client-side only to avoid hydration mismatch
  useEffect(() => {
    setGuestUserId(generateGuestUserId());
  }, []);

  const handleMessageSent = useCallback(async (message: string): Promise<string> => {
    try {
      console.log('🚀 [SELLY_AI_PAGE] Sending message to API:', message);

      // Call the actual chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            userId: guestUserId,
            timestamp: new Date().toISOString(),
            enhancedMode: true, // Always use enhanced mode for selly-ai page
            source: 'selly-ai-page'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      console.log('✅ [SELLY_AI_PAGE] Received response from API:', data.response);
      return data.response;
    } catch (error) {
      console.error('❌ [SELLY_AI_PAGE] Error processing message:', error);

      // Return a user-friendly error message instead of throwing
      return 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi dalam beberapa saat.';
    }
  }, [guestUserId]);

  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <div className="min-h-screen">
        <ChatProvider userId={guestUserId} onMessageSent={handleMessageSent}>
          <SellyAIPageContent />
        </ChatProvider>
      </div>
    </ThemeProvider>
  );
}
