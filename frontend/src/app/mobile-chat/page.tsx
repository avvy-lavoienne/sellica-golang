'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  PhotoIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedChatProvider, useUnifiedChat } from '@/contexts/UnifiedChatContext';
import { EnhancedChatMessage } from '@/components/chatbot/EnhancedChatMessage';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';
// DISABLED FOR CORE BUILD - Using simplified chat functionality
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// import { aiService } from '../../../selly-legacy-nextjs-backend/business-logic/chatbot/core/aiService';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { cn } from '@/lib/conn/utils';

interface MobileChatContentProps {
  className?: string;
}

/**
 * Mobile-optimized SELLY Chat Interface
 * Designed specifically for mobile devices with touch interactions
 */
function MobileChatContent({ className }: MobileChatContentProps) {
  const {
    messages,
    isTyping,
    loadingStage,
    estimatedTime,
    sendMessage,
    clearMessages,
  } = useUnifiedChat();

  // Mobile-specific state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Mobile-optimized quick actions
  const quickActions = [
    { label: 'Tampilkan Data', query: 'Tampilkan data sistem' },
    { label: 'Statistik', query: 'Berapa total aktivitas user hari ini?' },
    { label: 'Cari Data', query: 'Cari data dengan nama ' },
    { label: 'Salah Rekam', query: 'Tampilkan data salah rekam' },
  ];

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

  // Handle voice recording (placeholder for future implementation)
  const handleVoiceToggle = useCallback(() => {
    setIsVoiceRecording(!isVoiceRecording);
    // TODO: Implement voice recording functionality
  }, [isVoiceRecording]);

  // Handle menu toggle
  const toggleMenu = useCallback(() => {
    setShowMenu(!showMenu);
  }, [showMenu]);

  // Handle swipe gestures
  const handleSwipe = useCallback((messageId: string, info: PanInfo) => {
    const swipeThreshold = 100;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      setSwipedMessageId(messageId);
      // Auto-hide after 3 seconds
      setTimeout(() => setSwipedMessageId(null), 3000);
    }
  }, []);

  // Handle pull-to-refresh
  const handlePullToRefresh = useCallback((info: PanInfo) => {
    const pullThreshold = 100;
    if (info.offset.y > pullThreshold) {
      // Refresh conversation or reload data
      window.location.reload();
    }
  }, []);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gradient-to-br from-background via-background/95 to-primary/5",
      "relative overflow-hidden",
      className
    )}>
      {/* Mobile Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="font-semibold text-foreground">SELLY</h1>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      {loadingStage || "Sedang mengetik..."}
                      {estimatedTime > 0 && (
                        <span className="opacity-70">
                          (~{Math.ceil(estimatedTime / 1000)}s)
                        </span>
                      )}
                    </span>
                  ) : "AI Assistant"}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="p-2"
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-80 bg-background border-l border-border/50 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    clearMessages();
                    setShowMenu(false);
                  }}
                >
                  Hapus Percakapan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowQuickActions(!showQuickActions);
                    setShowMenu(false);
                  }}
                >
                  {showQuickActions ? 'Sembunyikan' : 'Tampilkan'} Quick Actions
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Halo! Saya SELLY</h2>
            <p className="text-muted-foreground mb-4">
              AI Assistant untuk membantu Anda mengakses data sistem SELLICA
            </p>
          </motion.div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleSwipe(message.id, info)}
            className="relative"
          >
            {/* Swipe Action Indicators */}
            <div className="absolute inset-y-0 left-0 w-16 bg-blue-500/20 rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-blue-500 text-xs">Reply</span>
            </div>
            <div className="absolute inset-y-0 right-0 w-16 bg-red-500/20 rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-red-500 text-xs">Delete</span>
            </div>

            <div className={cn(
              "transition-all duration-200",
              swipedMessageId === message.id && "scale-95 opacity-80"
            )}>
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
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span>{loadingStage || "SELLY sedang mengetik..."}</span>
            </div>
            
            {/* Mobile Progress Bar */}
            {estimatedTime > 1000 && (
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, ((Date.now() - Date.now()) / estimatedTime) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {estimatedTime > 0 && `Estimasi: ${Math.ceil(estimatedTime / 1000)} detik`}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2"
          >
            <p className="text-sm text-muted-foreground mb-3">Aksi Cepat:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.query)}
                  className="text-left justify-start h-auto py-3 px-4"
                >
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Input Area */}
      <div className="sticky bottom-16 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ketik pesan Anda..."
              className="min-h-[44px] max-h-[120px] resize-none pr-20 text-base"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            {/* Voice and Photo buttons */}
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "p-2 h-8 w-8",
                  isVoiceRecording && "bg-red-500 text-white"
                )}
              >
                <MicrophoneIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8"
              >
                <PhotoIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || isSubmitting}
            className="h-11 w-11 p-0 rounded-full"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation currentPath="/mobile-chat" />
    </div>
  );
}

/**
 * Mobile Chat Page with Provider
 */
export default function MobileChatPage() {
  // Use authenticated user hook to resolve authentication inconsistency
  const { userId, isAuthenticated, isLoading } = useAuthenticatedUser();

  const handleMessageSent = useCallback(async (message: string) => {
    try {
      // const response = await aiService.processQuery(message); // Disabled for core build
      const response = { content: `Core build mode response: ${message}` }; // Mock response
      return response.content;
    } catch (error) {
      console.error('Error processing message:', error);
      return 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
    }
  }, []);

  // Show loading state while determining user authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading Mobile Chat...</div>
      </div>
    );
  }

  return (
    <UnifiedChatProvider userId={userId} onMessageSent={handleMessageSent}>
      <MobileChatContent />
    </UnifiedChatProvider>
  );
}
