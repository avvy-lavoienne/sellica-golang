'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  PanInfo,
} from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MinusIcon,
  TrashIcon,
  Bars3Icon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedChatMessage } from "./EnhancedChatMessage";
import { SellyAdvancedToggle } from "./SellyAdvancedToggle";
import { ResponsiveSellyLogo } from "./SellyLogos";
import { AdaptiveWelcomeScreen } from "./AdaptiveWelcomeScreen";
import { useChat } from "@/contexts/ChatContext";
import { isMobile } from "@/utils/mobile";

interface UnifiedChatInterfaceProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  onEnhancementModeChange?: (enhanced: boolean) => void;
  initialEnhancedMode?: boolean;
}

interface DragPosition {
  x: number;
  y: number;
}

interface ClearChatDialogState {
  isOpen: boolean;
  isClearing: boolean;
}

export function UnifiedChatInterface({
  className,
  position = "bottom-right",
  onSendMessage,
  disabled = false,
  onEnhancementModeChange,
  initialEnhancedMode = false,
}: UnifiedChatInterfaceProps) {
  // Use ChatContext for state management
  const chatContext = useChat();
  const {
    messages,
    isTyping,
    loadingStage,
    estimatedTime,
    clearMessages,
    uiState: contextUIState,
    toggleChat,
    minimizeChat,
    maximizeChat
  } = chatContext;

  // Check if mobile interface should be used
  const shouldUseMobileInterface = useCallback(() => {
    const isMobileDevice = isMobile();
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 768;
    return isMobileDevice || isSmallScreen;
  }, []);

  // Mobile detection and redirection
  useEffect(() => {
    if (contextUIState.isOpen && shouldUseMobileInterface()) {
      // Redirect to mobile-optimized interface
      window.location.href = '/mobile-chat';
      return;
    }
  }, [contextUIState.isOpen, shouldUseMobileInterface]);

  // Local UI state for drag and dialog
  const [inputMessage, setInputMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<DragPosition>({
    x: 0,
    y: 0,
  });
  const [clearDialogState, setClearDialogState] = useState<ClearChatDialogState>({
    isOpen: false,
    isClearing: false,
  });
  const [enhancedMode, setEnhancedMode] = useState(initialEnhancedMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  // Load saved position on mount with safety check
  useEffect(() => {
    const savedPosition = localStorage.getItem("selly-chat-position");
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition) as DragPosition;
        // Safety check: if position is too extreme, reset to default
        if (Math.abs(parsed.x) > 400 || Math.abs(parsed.y) > 250) {
          console.log("Saved position too extreme, resetting:", parsed);
          const defaultPosition = { x: 0, y: 0 };
          setDragPosition(defaultPosition);
          localStorage.setItem("selly-chat-position", JSON.stringify(defaultPosition));
        } else {
          setDragPosition(parsed);
        }
      } catch (error) {
        console.warn("Failed to parse saved chat position:", error);
        // Reset to default on error
        const defaultPosition = { x: 0, y: 0 };
        setDragPosition(defaultPosition);
        localStorage.setItem("selly-chat-position", JSON.stringify(defaultPosition));
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (contextUIState.isOpen && !contextUIState.isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [contextUIState.isOpen, contextUIState.isMinimized]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+Delete to clear chat
      if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
        e.preventDefault();
        if (messages.length > 0 && !clearDialogState.isOpen) {
          setClearDialogState({ isOpen: true, isClearing: false });
        }
      }

      // Escape to close dialog or minimize chat
      if (e.key === 'Escape') {
        if (clearDialogState.isOpen) {
          setClearDialogState({ isOpen: false, isClearing: false });
        } else if (contextUIState.isOpen && !contextUIState.isMinimized) {
          minimizeChat();
        }
      }

      // Ctrl+M to toggle minimize/maximize
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (contextUIState.isOpen) {
          if (contextUIState.isMinimized) {
            maximizeChat();
          } else {
            minimizeChat();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [messages.length, clearDialogState.isOpen, contextUIState.isOpen, contextUIState.isMinimized, minimizeChat, maximizeChat]);

  // Enhanced handlers for follow-up questions and insights
  const handleFollowUpClick = (question: string) => {
    onSendMessage?.(question);
  };

  const handleInsightClick = (insight: any) => {
    if (insight.query) {
      onSendMessage?.(insight.query);
    }
  };

  // Drag handling functions
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_event: any, info: PanInfo) => {
      setIsDragging(false);

      // Calculate new position
      const newPosition = {
        x: dragPosition.x + info.offset.x,
        y: dragPosition.y + info.offset.y,
      };

      // Clamp position to keep chatbox visible
      const clampedPosition = {
        x: Math.max(-300, Math.min(300, newPosition.x)),
        y: Math.max(-100, Math.min(200, newPosition.y)),
      };

      setDragPosition(clampedPosition);

      // Save position to localStorage
      try {
        localStorage.setItem("selly-chat-position", JSON.stringify(clampedPosition));
      } catch (error) {
        console.warn("Failed to save chat position:", error);
      }
    },
    [dragPosition]
  );

  // Reset position function
  const resetPosition = useCallback(() => {
    const defaultPosition = { x: 0, y: 0 };
    setDragPosition(defaultPosition);
    localStorage.setItem("selly-chat-position", JSON.stringify(defaultPosition));
  }, []);

  // Emergency reset on mount if position is too extreme
  useEffect(() => {
    const checkPosition = () => {
      if (Math.abs(dragPosition.x) > 500 || Math.abs(dragPosition.y) > 300) {
        console.log("Resetting extreme position:", dragPosition);
        resetPosition();
      }
    };
    checkPosition();
  }, [dragPosition, resetPosition]);

  // Handle enhancement mode changes
  const handleEnhancementModeChange = useCallback((enabled: boolean) => {
    setEnhancedMode(enabled);
    onEnhancementModeChange?.(enabled);
    console.log(`🔄 [UNIFIED_CHAT] Enhancement mode changed to: ${enabled ? 'Enhanced' : 'Standard'}`);
  }, [onEnhancementModeChange]);

  // Keyboard shortcut to reset position
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        resetPosition();
        console.log("Position reset via keyboard shortcut");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetPosition]);

  // Message handling
  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || disabled) return;

    onSendMessage?.(inputMessage.trim());
    setInputMessage("");
  }, [inputMessage, disabled, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );



  // Clear chat functionality
  const handleClearChat = useCallback(() => {
    setClearDialogState({ isOpen: false, isClearing: true });

    try {
      clearMessages();
      console.log("Chat history cleared successfully");
    } catch (error) {
      console.error("Failed to clear chat:", error);
    } finally {
      setClearDialogState({ isOpen: false, isClearing: false });
    }
  }, [clearMessages]);

  // Position classes for chat button - improved responsiveness
  const positionClasses = {
    "bottom-right": "bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8",
    "bottom-left": "bottom-4 left-4 md:bottom-6 md:left-6 lg:bottom-8 lg:left-8",
    "top-right": "top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8",
    "top-left": "top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8",
  };

  // Animation variants
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <>
      {/* Fixed position for chat button */}
      <div className={cn("fixed z-50", positionClasses[position], className)}>
        {/* Chat Button - Only show when closed */}
        <AnimatePresence>
          {!contextUIState.isOpen && (
            <motion.div
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              className="relative"
            >
              <Button
                onClick={toggleChat}
                size="lg"
                className={cn(
                  "relative h-12 w-12 rounded-full p-0 shadow-md",
                  "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400",
                  "transition-all duration-200"
                )}
                aria-label={shouldUseMobileInterface() ? "Buka SELLY di Mode Mobile" : "Buka Chat SELLY"}
                aria-expanded={contextUIState.isOpen}
                title={shouldUseMobileInterface() ? "Buka di Mode Mobile untuk Pengalaman Lebih Baik" : "Buka Chat SELLY"}
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />

                {/* Mobile indicator */}
                {shouldUseMobileInterface() && (
                  <DevicePhoneMobileIcon className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5 text-blue-600 dark:bg-gray-800 dark:text-blue-400" />
                )}

                {/* Notification badge */}
                {contextUIState.hasUnreadMessages && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"
                  />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Draggable Chat Window */}
      <AnimatePresence>
        {contextUIState.isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.1}
            dragTransition={{
              bounceStiffness: 300,
              bounceDamping: 30,
              power: 0.1,
              timeConstant: 150
            }}
            dragConstraints={{
              top: 0,
              left: -200,
              right: 200,
              bottom: 200,
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed rounded-2xl border backdrop-blur-sm overflow-hidden",
              "bg-background/85 shadow-xl border-border/60",
              contextUIState.isMinimized ? "h-14 w-80" : "w-[420px] h-[580px] md:w-[480px] md:h-[680px] lg:w-[520px] lg:h-[720px]",
              isDragging && "shadow-2xl cursor-grabbing",
              "flex flex-col min-h-[200px]",
              !isDragging && "transition-all duration-300"
            )}
            style={{
              right: position.includes("right") ? `${20 - dragPosition.x}px` : "auto",
              left: position.includes("left") ? `${20 + dragPosition.x}px` : "auto",
              bottom: position.includes("bottom") ? `${80 - dragPosition.y}px` : "auto",
              top: position.includes("top") ? `${80 + dragPosition.y}px` : "auto",
              zIndex: 1070,
            }}
          >
            {/* Enhanced Header with Glass-morphism */}
            <div
              className={cn(
                "relative flex items-center justify-between px-4 py-3 flex-shrink-0",
                "bg-background/90 backdrop-blur-sm border-b border-border/60",
                "shadow-sm z-10",
                contextUIState.isMinimized && "cursor-pointer hover:bg-background/95 transition-colors duration-200"
              )}
              onClick={contextUIState.isMinimized ? maximizeChat : undefined}
            >
              {/* Background decoration for minimized state */}
              {contextUIState.isMinimized && (
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute -right-4 -top-2 h-12 w-12 rounded-full blur-xl bg-blue-500/20 opacity-40" />
                  <div className="absolute -bottom-1 -left-2 h-8 w-8 rounded-full blur-lg bg-indigo-500/15 opacity-30" />
                </div>
              )}

              <div className="relative z-10 flex items-center space-x-3">
                {/* SELLY Logo */}
                <ResponsiveSellyLogo
                  size={28}
                  isAdvanced={enhancedMode}
                  animated={true}
                  responsive={true}
                />
                {!contextUIState.isMinimized && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {enhancedMode ? 'SELLY Advanced' : 'SELLY'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isTyping ? `${loadingStage || "Mengetik..."} ${estimatedTime > 0 ? `(~${Math.ceil(estimatedTime / 1000)}s)` : ""}` : (enhancedMode ? "Enhanced AI Assistant" : "AI Assistant")}
                    </p>
                  </div>
                )}
                {contextUIState.isMinimized && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">SELLY</span>
                    <div className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/60">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Minimized</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Advanced Mode Toggle */}
                {!contextUIState.isMinimized && (
                  <SellyAdvancedToggle
                    onModeChange={handleEnhancementModeChange}
                    initialMode={enhancedMode}
                    size="sm"
                    showLabel={false}
                    className="mr-1"
                  />
                )}
                  {!contextUIState.isMinimized && messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClearDialogState({ isOpen: true, isClearing: false });
                      }}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      aria-label="Hapus Chat"
                      title="Hapus Chat"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                <button
                  className={cn(
                    "h-8 w-8 flex items-center justify-center cursor-move rounded-md",
                    "text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200",
                    isDragging && "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragControls.start(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    resetPosition();
                  }}
                  aria-label="Drag Handle"
                  title="Drag untuk memindahkan • Double-click untuk reset posisi"
                  tabIndex={0}
                >
                  <Bars3Icon className="h-4 w-4" />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    contextUIState.isMinimized ? maximizeChat() : minimizeChat();
                  }}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                  aria-label={contextUIState.isMinimized ? "Maximize" : "Minimize"}
                  title={contextUIState.isMinimized ? "Perbesar" : "Perkecil"}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChat();
                  }}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  aria-label="Tutup"
                  title="Tutup Chat"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!contextUIState.isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900" style={{ minHeight: 0 }}>
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400" />
                      <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                        {enhancedMode ? 'Selamat Datang di SELLY Advanced!' : 'Selamat Datang di SELLY!'}
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {enhancedMode ? 'AI Assistant dengan kemampuan enhanced' : 'Tanyakan apa saja tentang data sistem Anda.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <EnhancedChatMessage
                          key={message.id}
                          message={message}
                          onFollowUpClick={handleFollowUpClick}
                          onInsightClick={handleInsightClick}
                        />
                      ))}
                      {isTyping && (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce"></div>
                          </div>
                          <span>{loadingStage || "Mengetik..."}</span>
                          {estimatedTime > 0 && <span>(~{Math.ceil(estimatedTime / 1000)}s)</span>}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>



                {/* Input Area */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex space-x-2">
                    <Textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ketik pesan Anda..."
                      className="flex-1 min-h-[40px] text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={disabled || isTyping}
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || disabled || isTyping}
                      className="h-10 px-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Enter untuk kirim • Esc untuk tutup • Ctrl+Shift+Del untuk hapus
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Dialog */}
      <AnimatePresence>
        {clearDialogState.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setClearDialogState({ isOpen: false, isClearing: false })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Yakin ingin menghapus semua pesan? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setClearDialogState({ isOpen: false, isClearing: false })}
                  disabled={clearDialogState.isClearing}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearChat}
                  disabled={clearDialogState.isClearing}
                >
                  {clearDialogState.isClearing ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}