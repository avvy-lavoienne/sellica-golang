/**
 * Enhanced Chat Message Component
 * Displays schema insights, proactive insights, and follow-up questions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/conn/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, TrendingUp, AlertTriangle, Lightbulb, Database, Zap, MessageSquare } from 'lucide-react';
import { ChatMessage } from '@/types/chatbot';
import { EnhancedChart } from './EnhancedChart';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChartConfig } from '@/services/chatbot/visualizationEngine';

interface EnhancedChatMessageProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  onFollowUpClick?: (question: string) => void;
  onInsightClick?: (insight: any) => void;
  className?: string;
}

export function EnhancedChatMessage({
  message,
  showTimestamp = true,
  onFollowUpClick,
  onInsightClick,
  className
}: EnhancedChatMessageProps) {
  const [showInsights, setShowInsights] = React.useState(false);
  const isUser = message.sender === 'user';
  const isError = message.status === 'error';
  const hasEnhancedData = !isUser && message.metadata && (
    (message.metadata.schemaInsights?.suggestedColumns?.length || 0) > 0 ||
    (message.metadata.proactiveInsights?.length || 0) > 0 ||
    (message.metadata.suggestions?.length || 0) > 0
  );

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'correlation': return <Database className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  // Extract follow-up questions from metadata
  const followUpQuestions = message.metadata?.suggestions || [];

  // Extract chart configuration from metadata
  const chartConfig = message.metadata?.chartConfig as ChartConfig | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start", className)}
    >
      <div className={cn("max-w-[90%] sm:max-w-[75%] md:max-w-[60%] space-y-1.5")}>
        {/* Main Message */}
        <div className={cn(
          "relative px-3 py-2 rounded-xl border shadow-sm",
          "transition-colors duration-200",
          isUser 
            ? "bg-blue-600 text-white border-blue-700 dark:bg-blue-700 dark:border-blue-800"
            : "bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
          isError && "border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400"
        )}>
          <MarkdownRenderer
            content={message.content}
            isUser={isUser}
            className={isError ? "text-red-700 dark:text-red-400" : ""}
          />
        </div>

        {/* Enhanced Chart Display */}
        {!isUser && chartConfig && (
          <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <EnhancedChart
              config={chartConfig}
              onInsightClick={(insight) => {
                if (insight.relatedQuery && onFollowUpClick) {
                  onFollowUpClick(insight.relatedQuery);
                }
              }}
              onDataPointClick={(dataPoint) => {
                if (dataPoint.query && onFollowUpClick) {
                  onFollowUpClick(dataPoint.query);
                }
              }}
              height={250}
            />
          </div>
        )}

        {/* Enhanced Insights Section */}
        {hasEnhancedData && (
          <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3">
            <Collapsible open={showInsights} onOpenChange={setShowInsights}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between px-2 py-1.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Analisis Lanjutan</span>
                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {(message.metadata?.proactiveInsights?.length || 0) + (followUpQuestions.length || 0)} insights
                    </Badge>
                  </div>
                  {showInsights ? <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-3 mt-2">
                {/* Schema Insights */}
                {message.metadata?.schemaInsights && message.metadata.schemaInsights.suggestedColumns.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Database className="w-3 h-3" />
                      Kolom yang Relevan
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {message.metadata.schemaInsights.suggestedColumns.slice(0, 4).map((column, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proactive Insights */}
                {message.metadata?.proactiveInsights && message.metadata.proactiveInsights.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" />
                      Analisis Proaktif
                    </h4>
                    <div className="space-y-1.5">
                      {message.metadata.proactiveInsights.slice(0, 3).map((insight, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => onInsightClick?.(insight)}
                        >
                          <div className="flex items-start gap-2">
                            {getInsightIcon(insight.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{insight.title}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getComplexityColor(insight.complexity))}
                                >
                                  {insight.complexity}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {insight.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Questions */}
                {followUpQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Pertanyaan Lanjutan
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {followUpQuestions.slice(0, 4).map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => onFollowUpClick?.(question)}
                          className="h-auto py-1.5 px-2 text-xs text-left justify-start hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          <span className="line-clamp-1">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Query Optimizations */}
                {message.metadata?.queryOptimizations && message.metadata.queryOptimizations.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      Saran Optimasi
                    </h4>
                    <div className="space-y-1">
                      {message.metadata.queryOptimizations.slice(0, 2).map((optimization, index) => (
                        <div key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                          💡 {optimization}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "text-xs text-gray-500 dark:text-gray-400 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {format(message.timestamp, 'HH:mm', { locale: id })}
          </div>
        )}
      </div>
    </motion.div>
  );
}