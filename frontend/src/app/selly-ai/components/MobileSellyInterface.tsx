'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  TrashIcon,
  SparklesIcon,
  CpuChipIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import { EnhancedChatMessage } from '@/components/chatbot/EnhancedChatMessage';
import { cn } from '@/lib/conn/utils';

interface MobileSellyInterfaceProps {
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
}

// Memoized backdrop effects component for performance
const MobileBackdropEffects = memo(() => (
  <div className="absolute inset-0 opacity-20">
    {/* Primary glow effect */}
    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl bg-primary/25 opacity-40 animate-pulse" />
    {/* Secondary glow effect */}
    <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-xl bg-primary/20 opacity-30" />
  </div>
));

MobileBackdropEffects.displayName = 'MobileBackdropEffects';

const mobileQuickActions = [
  {
    label: 'KTP Baru',
    icon: '🆔',
    query: 'Bagaimana cara membuat KTP baru?',
    color: 'from-blue-500/20 to-blue-600/10'
  },
  {
    label: 'Akta Lahir',
    icon: '📋',
    query: 'Apa persyaratan akta kelahiran?',
    color: 'from-green-500/20 to-green-600/10'
  },
  {
    label: 'Kartu Keluarga',
    icon: '👨‍👩‍👧‍👦',
    query: 'Cara mengurus kartu keluarga?',
    color: 'from-purple-500/20 to-purple-600/10'
  },
  {
    label: 'Info Layanan',
    icon: 'ℹ️',
    query: 'Jam operasional dan biaya pelayanan?',
    color: 'from-orange-500/20 to-orange-600/10'
  },
];

/**
 * Mobile-optimized SELLY AI Interface
 * Designed specifically for mobile devices with touch interactions and enterprise-grade styling
 */
export function MobileSellyInterface({
  className,
  delay = 0,
  disableAnimations = false
}: MobileSellyInterfaceProps) {
  const {
    messages,
    isTyping,
    loadingStage,
    estimatedTime,
    sendMessage,
    clearMessages,
    startNewSession,
  } = useChat();

  // Mobile-specific state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Memoized color schemes matching dashboard design system
  const colorSchemes = useMemo(() => ({
    primary: {
      bg: 'bg-primary/8',
      text: 'text-primary',
      accent: 'text-primary/80',
      borderClass: 'border-primary/25',
      glowClass: 'shadow-primary/25',
      gradientClass: 'bg-gradient-to-r from-primary/80 to-primary/60',
      shadowClass: 'shadow-lg shadow-primary/20',
      iconBg: 'bg-primary/10',
      iconBorder: 'border-primary/20',
    }
  }), []);

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
      },
    },
  };

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
    if (window.confirm('Hapus semua percakapan?')) {
      clearMessages();
      startNewSession();
      setShowQuickActions(true);
      setShowMenu(false);
    }
  }, [clearMessages, startNewSession]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col h-screen bg-gradient-to-br from-background via-background/95 to-primary/5",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Enhanced Mobile Header with glass-morphism */}
      <motion.header
        variants={itemVariants}
        className="sticky top-0 z-50 overflow-hidden"
      >
        {/* Multi-layer glass-morphism background */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md border-b border-border/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5" />

        {/* Background decoration */}
        <MobileBackdropEffects />
        <div className="relative z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 hover:bg-primary/10 transition-colors duration-300 rounded-xl"
              aria-label="Kembali"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              {/* Enhanced SELLY Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-xl border-2 border-background/20">
                  <SparklesIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-primary/20 rounded-full blur opacity-75 animate-pulse" />
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-lg opacity-50 animate-pulse [animation-delay:0.5s]" />
              </div>

              <div>
                <h1 className="font-bold text-foreground text-base">SELLY</h1>
                <div className="text-xs text-muted-foreground">
                  {isTyping ? (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/30 border border-border/20">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce inline-block" />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.1s] inline-block" />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s] inline-block" />
                      </span>
                      <span className="font-medium">Mengetik...</span>
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded-md bg-muted/20 border border-border/20">
                      <span className="font-medium">AI Assistant</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-primary/10 transition-colors duration-300 rounded-xl"
            aria-label="Menu"
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced menu with glass-morphism */}
              <Card className="h-full rounded-none rounded-l-2xl border-l border-border/40 bg-background/90 backdrop-blur-md shadow-2xl">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl bg-primary/20 opacity-40" />
                  <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-xl bg-primary/15 opacity-30" />
                </div>

                <CardContent className="relative z-10 p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Bars3Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Menu SELLY</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMenu(false)}
                      className="p-2 rounded-xl hover:bg-primary/10"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-4 mb-8">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-4 h-14 rounded-xl bg-muted/20 backdrop-blur-sm border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                      onClick={handleClearChat}
                    >
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/60">
                        <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-medium">Hapus Percakapan</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-4 h-14 rounded-xl bg-muted/20 backdrop-blur-sm border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                      onClick={() => {
                        setShowQuickActions(!showQuickActions);
                        setShowMenu(false);
                      }}
                    >
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <SparklesIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">
                        {showQuickActions ? 'Sembunyikan' : 'Tampilkan'} Aksi Cepat
                      </span>
                    </Button>
                  </div>

                  <div className="flex-1 pt-6 border-t border-border/30">
                    <Card className="border-border/40 bg-background/60 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                            <CpuChipIcon className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-base font-bold text-foreground">Tentang SELLY</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          AI Assistant untuk pelayanan administrasi kependudukan
                          Kabupaten Garut dengan dukungan bahasa Indonesia natural.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <CpuChipIcon className="h-3 w-3 mr-1" />
                            AI Enhanced
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <GlobeAltIcon className="h-3 w-3 mr-1" />
                            Bahasa Indonesia
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-8"
          >
            <Card className="mx-4 border-border/40 bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl bg-primary/25 opacity-40 animate-pulse" />
                <div className="absolute -bottom-3 -left-3 h-12 w-12 rounded-full blur-xl bg-primary/20 opacity-30" />
              </div>

              <CardContent className="relative z-10 p-6">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-2xl border-4 border-background/20">
                    <SparklesIcon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -inset-3 bg-gradient-to-r from-primary/25 to-primary/15 rounded-full blur-2xl opacity-60 animate-pulse" />
                  <div className="absolute -inset-5 bg-gradient-to-r from-primary/15 to-primary/8 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:0.5s]" />
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Halo! Saya SELLY
                  </h2>
                </div>

                <div className="px-4 py-3 rounded-lg bg-muted/30 border border-border/30 backdrop-blur-sm">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    AI Assistant untuk membantu Anda dengan layanan administrasi
                    kependudukan Kabupaten Garut
                  </p>
                </div>

                <div className="flex justify-center gap-2 mt-4">
                  <Badge variant="secondary" className="text-xs">
                    <CpuChipIcon className="h-3 w-3 mr-1" />
                    AI Enhanced
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <GlobeAltIcon className="h-3 w-3 mr-1" />
                    Bahasa Indonesia
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="transition-all duration-300"
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
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span>{loadingStage || "SELLY sedang mengetik..."}</span>
            </div>
            
            {estimatedTime > 1000 && (
              <div className="px-4">
                <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out animate-pulse"
                    style={{ width: '60%' }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  ~{Math.ceil(estimatedTime / 1000)} detik
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
            className="px-4 py-3"
          >
            <div className="px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 mb-4">
              <p className="text-sm font-bold text-foreground text-center">
                Pertanyaan Populer
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {mobileQuickActions.map((action, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card className="border-border/40 bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden">
                    {/* Card background decoration */}
                    <div className="absolute inset-0 opacity-20">
                      <div className={cn(
                        "absolute -right-2 -top-2 h-8 w-8 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        action.color.replace('from-', 'bg-').replace('/20', '/30').split(' ')[0]
                      )} />
                    </div>

                    <CardContent className="relative z-10 p-4 group cursor-pointer" onClick={() => handleQuickAction(action.query)}>
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                          {action.icon}
                        </div>
                        <div className="px-2 py-1 rounded-md bg-muted/20 border border-border/20 backdrop-blur-sm">
                          <span className="text-xs font-semibold text-center leading-tight group-hover:text-primary transition-colors duration-300">
                            {action.label}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile Input Area with glass-morphism */}
      <motion.div
        variants={itemVariants}
        className="sticky bottom-0 overflow-hidden"
      >
        {/* Multi-layer glass-morphism background */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md border-t border-border/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:via-white/2 dark:to-white/5" />

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full blur-xl bg-primary/20 opacity-40" />
          <div className="absolute -left-2 -bottom-2 h-8 w-8 rounded-full blur-lg bg-primary/15 opacity-30" />
        </div>

        <div className="relative z-10 p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ketik pertanyaan Anda..."
                className={cn(
                  "min-h-[52px] max-h-[120px] resize-none text-base rounded-2xl",
                  "bg-background/70 backdrop-blur-sm border-border/40",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                  "transition-all duration-300 shadow-lg",
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
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!inputValue.trim() || isSubmitting}
              className={cn(
                "h-14 w-14 p-0 rounded-2xl shadow-xl transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70 hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "border-2 border-background/20"
              )}
              aria-label="Kirim pesan"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-6 w-6" />
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
