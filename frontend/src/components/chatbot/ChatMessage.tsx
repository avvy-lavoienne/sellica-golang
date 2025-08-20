'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/conn/utils';
import { ChatMessage as ChatMessageType } from '@/types/chatbot';
import { MarkdownRenderer } from './MarkdownRenderer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
  className?: string;
}

export function ChatMessage({ 
  message, 
  showTimestamp = true, 
  className 
}: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isError = message.status === 'error';

  // Message status icon
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <ClockIcon className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <CheckIcon className="h-3 w-3 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  // Message type icon
  const getTypeIcon = () => {
    switch (message.type) {
      case 'data':
        return <DocumentTextIcon className="h-4 w-4 text-blue-500" />;
      case 'chart':
        return <ChartBarIcon className="h-4 w-4 text-green-500" />;
      case 'table':
        return <TableCellsIcon className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  // Animation variants
  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
      )}>
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <span className="text-sm font-bold">S</span>
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "relative rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm",
          "border transition-all duration-200",
          
          // User message styling
          isUser && [
            "bg-primary/90 text-primary-foreground border-primary/20",
            "ml-auto",
            // Shiny border glow for user messages
            "before:absolute before:inset-0 before:rounded-2xl before:p-[1px]",
            "before:bg-gradient-to-r before:from-primary/50 before:via-primary/30 before:to-primary/50",
            "before:mask-composite:exclude before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
          ],
          
          // SELLY message styling
          !isUser && [
            "bg-background/80 text-foreground border-border/50",
            "hover:bg-background/90 hover:border-border/70"
          ],
          
          // Error state
          isError && "border-destructive/50 bg-destructive/5"
        )}>
          
          {/* Message Type Indicator */}
          {!isUser && message.type !== 'text' && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
              {getTypeIcon()}
              <span className="text-xs font-medium text-muted-foreground">
                {message.type === 'data' && 'Data Response'}
                {message.type === 'chart' && 'Chart Data'}
                {message.type === 'table' && 'Table Data'}
              </span>
            </div>
          )}

          {/* Message Text */}
          <div className={cn(
            isError && "text-destructive"
          )}>
            <MarkdownRenderer
              content={message.content}
              isUser={isUser}
              className={isError ? "text-destructive" : ""}
            />
          </div>

          {/* Metadata Display */}
          {message.metadata && (
            <div className="mt-3 pt-3 border-t border-border/30">
              {/* Error Details */}
              {message.metadata.error && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                  <strong>Error:</strong> {message.metadata.error}
                </div>
              )}

              {/* Data Type Info */}
              {message.metadata.dataType && (
                <div className="text-xs text-muted-foreground">
                  <strong>Tipe Data:</strong> {message.metadata.dataType}
                </div>
              )}

              {/* Query Info */}
              {message.metadata.query && (
                <div className="text-xs text-muted-foreground mt-1">
                  <strong>Query:</strong> {message.metadata.query}
                </div>
              )}

              {/* Table Data Preview */}
              {message.metadata.tableData && Array.isArray(message.metadata.tableData) && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Data Preview ({message.metadata.tableData.length} records):
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <div className="text-xs font-mono">
                      {message.metadata.tableData.slice(0, 3).map((row, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          {JSON.stringify(row, null, 2).slice(0, 100)}
                          {JSON.stringify(row, null, 2).length > 100 && '...'}
                        </div>
                      ))}
                      {message.metadata.tableData.length > 3 && (
                        <div className="text-muted-foreground italic">
                          ... dan {message.metadata.tableData.length - 3} record lainnya
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Data Preview */}
              {message.metadata.chartData && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Chart Data:
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-xs font-mono">
                      {JSON.stringify(message.metadata.chartData, null, 2).slice(0, 200)}
                      {JSON.stringify(message.metadata.chartData, null, 2).length > 200 && '...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message Tail */}
          <div className={cn(
            "absolute top-3 w-3 h-3 transform rotate-45",
            isUser 
              ? "right-[-6px] bg-primary/90 border-r border-b border-primary/20" 
              : "left-[-6px] bg-background/80 border-l border-t border-border/50"
          )} />
        </div>

        {/* Timestamp and Status */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-2 mt-1 px-2",
            isUser ? "justify-end" : "justify-start"
          )}>
            <span className="text-xs text-muted-foreground">
              {format(message.timestamp, 'HH:mm', { locale: id })}
            </span>
            {isUser && getStatusIcon()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Message List Component
interface ChatMessageListProps {
  messages: ChatMessageType[];
  showTimestamps?: boolean;
  className?: string;
}

export function ChatMessageList({ 
  messages, 
  showTimestamps = true, 
  className 
}: ChatMessageListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          showTimestamp={showTimestamps}
        />
      ))}
    </div>
  );
}

// Typing Indicator Component
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-3", className)}
    >
      {/* SELLY Avatar */}
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
        <span className="text-sm font-bold">S</span>
      </div>

      {/* Typing Bubble */}
      <div className="bg-background/80 border border-border/50 rounded-2xl px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
          </div>
          <span className="text-sm text-muted-foreground">SELLY sedang mengetik...</span>
        </div>
      </div>
    </motion.div>
  );
}
