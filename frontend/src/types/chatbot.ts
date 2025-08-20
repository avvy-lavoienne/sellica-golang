// Chatbot message types
export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "selly";
  timestamp: Date;
  status: "sending" | "sent" | "error";
  type: "text" | "data" | "chart" | "table" | "administrative";
  metadata?: {
    query?: string;
    dataType?: string;
    tableData?: any[];
    chartData?: any;
    error?: string;
    suggestions?: string[];
    confidence?: number;
    dataQuery?: string;
    // AI Enhancement metadata
    aiEnhanced?: boolean;
    aiMetadata?: {
      aiProcessingTime: number;
      modelsUsed: string[];
      pipelineUsed: string;
      accelerated: boolean;
      confidence: number;
    };
    aiError?: string;
    // Enhanced metadata
    schemaInsights?: {
      suggestedColumns: string[];
      availableAnalytics: string[];
      tableRelationships: string[];
      dataQualityNotes: string[];
    };
    proactiveInsights?: Array<{
      type: string;
      title: string;
      description: string;
      query: string;
      confidence: number;
      complexity: string;
    }>;
    queryOptimizations?: string[];
    chartConfig?: any; // ChartConfig from visualizationEngine
    // TensorFlow-specific metadata
    tensorflowInsights?: any;
    semanticSuggestions?: string[];
    followUpQuestions?: string[];
    modelUsed?: string;
    processingStrategy?: string;
    semanticConfidence?: number;
    enhancementLevel?: string;
    fallbackUsed?: boolean;
    sentiment?: any;
    extractedEntities?: any[];
    // Error handling metadata
    errorHandled?: boolean;
    errorType?: string;
    fallbackMode?: boolean;
    fallbackReason?: string;
    processingTime?: number;
    severity?: string;
    retryable?: boolean;
    retryAfter?: number;
  };
}

// Chat session types
export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// AI service types
export interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// Enhanced AI Response with schema insights
export interface EnhancedAIResponse extends AIResponse {
  schemaInsights?: {
    suggestedColumns: string[];
    availableAnalytics: string[];
    tableRelationships: string[];
    dataQualityNotes: string[];
  };
  proactiveInsights?: Array<{
    type: string;
    title: string;
    description: string;
    query: string;
    confidence: number;
    complexity: string;
  }>;
  followUpQuestions?: string[];
  queryOptimizations?: string[];
}

export interface AIResponse {
  content: string;
  type: "text" | "data" | "chart" | "table" | "administrative";
  metadata?: {
    confidence?: number;
    dataQuery?: string;
    suggestions?: string[];
    relatedTopics?: string[];
    error?: string;
    // AI Enhancement metadata
    aiEnhanced?: boolean;
    model?: string;
    aiMetadata?: {
      aiProcessingTime: number;
      modelsUsed: string[];
      pipelineUsed: string;
      accelerated: boolean;
      confidence: number;
    };
    aiError?: string;
    // DeepSeek Enhancement metadata
    deepSeekEnhanced?: boolean;
    originalContent?: string;
    enhancementMetadata?: {
      enhanced: boolean;
      processingTime: number;
      confidence: number;
      model: string;
      fallbackUsed: boolean;
      error?: string;
    };
    // Groq Enhancement metadata (fast alternative to DeepSeek)
    groqEnhanced?: boolean;
    // Performance Optimization metadata
    cached?: boolean;
    cacheHitCount?: number;
    performanceOptimized?: boolean;
    // Enhanced metadata
    schemaInsights?: {
      suggestedColumns: string[];
      availableAnalytics: string[];
      tableRelationships: string[];
      dataQualityNotes: string[];
    };
    proactiveInsights?: Array<{
      type: string;
      title: string;
      description: string;
      query: string;
      confidence: number;
      complexity: string;
    }>;
    queryOptimizations?: string[];
    chartConfig?: any; // ChartConfig from visualizationEngine
    // TensorFlow-specific metadata
    tensorflowInsights?: any;
    semanticSuggestions?: string[];
    followUpQuestions?: string[];
    modelUsed?: string;
    processingStrategy?: string;
    semanticConfidence?: number;
    enhancementLevel?: string;
    fallbackUsed?: boolean;
    sentiment?: any;
    extractedEntities?: any[];
    // Error handling metadata
    errorHandled?: boolean;
    errorType?: string;
    fallbackMode?: boolean;
    fallbackReason?: string;
    processingTime?: number;
    severity?: string;
    retryable?: boolean;
    retryAfter?: number;
    // Table and data metadata
    dataType?: string;
    tableData?: any[];
    // Persona enhancement metadata
    personaApplied?: boolean;
    personaType?: string;
    greetingProtocolUsed?: string;
    culturalSensitivityApplied?: boolean;
    trainingQueryId?: string;
    trainingNeeded?: boolean;
    knowledgeUsed?: boolean;
    serviceType?: string;
    bypassedAI?: boolean;
    fastResponse?: boolean;
  };
}

// Query processing types
export interface QueryIntent {
  type:
    | "data_request"
    | "statistics"
    | "search"
    | "help"
    | "general"
    | "database_test";
  confidence: number;
  entities: {
    table?: string;
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    filters?: Record<string, any>;
    searchTerm?: string;
    specificMonth?: number;
    specificYear?: number;
  };
  parameters?: Record<string, any>;
}

export interface DataQueryResult {
  success: boolean;
  data?: any[];
  summary?: string;
  visualizationType?: 'table' | 'chart' | 'stats' | 'dashboard' | 'workflow';
  error?: string;
  suggestions?: string[];
  metadata?: {
    totalCount?: number;
    queryType?: string;
    processingTime?: number;
  };
}

// Chat UI types
export interface ChatUIState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  hasUnreadMessages: boolean;
  currentSession?: string;
}

export interface ChatUIConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  showTimestamps: boolean;
  enableSounds: boolean;
  maxMessages: number;
  autoSave: boolean;
}

// Quick action types
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  query: string;
  category: 'data' | 'statistics' | 'help' | 'navigation';
}

// Predefined quick actions for Indonesian interface
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'overview',
    label: 'Ringkasan Data',
    description: 'Tampilkan ringkasan semua data dalam sistem',
    icon: '📊',
    query: 'Berikan ringkasan lengkap data dalam sistem',
    category: 'statistics'
  },
  {
    id: 'recent_activities',
    label: 'Aktivitas Terbaru',
    description: 'Lihat aktivitas terbaru dalam sistem',
    icon: '🕒',
    query: 'Tampilkan aktivitas terbaru dalam 7 hari terakhir',
    category: 'data'
  },
  {
    id: 'user_stats',
    label: 'Statistik Pengguna',
    description: 'Informasi tentang pengguna sistem',
    icon: '👥',
    query: 'Berikan statistik pengguna sistem',
    category: 'statistics'
  },
  {
    id: 'data_quality',
    label: 'Kualitas Data',
    description: 'Status kelengkapan dan kualitas data',
    icon: '✅',
    query: 'Bagaimana kualitas data dalam sistem saat ini?',
    category: 'statistics'
  },
  {
    id: 'help',
    label: 'Bantuan',
    description: 'Pelajari cara menggunakan SELLY',
    icon: '❓',
    query: 'Bagaimana cara menggunakan SELLY untuk mencari informasi?',
    category: 'help'
  },
  {
    id: 'search_records',
    label: 'Cari Data',
    description: 'Cari data berdasarkan nama atau NIK',
    icon: '🔍',
    query: 'Bagaimana cara mencari data berdasarkan nama atau NIK?',
    category: 'help'
  }
];

// Error types
export interface ChatError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// Analytics types
export interface ChatAnalytics {
  sessionId: string;
  userId: string;
  messageCount: number;
  queryTypes: Record<string, number>;
  responseTime: number[];
  userSatisfaction?: number;
  commonQueries: string[];
  errorCount: number;
}

// Storage types
export interface ChatStorage {
  sessions: Record<string, ChatSession>;
  config: ChatUIConfig;
  analytics: ChatAnalytics[];
  lastCleanup: Date;
}

// Context types for maintaining conversation context
export interface ConversationContext {
  currentTopic?: string;
  lastQuery?: string;
  userPreferences?: {
    language: 'id' | 'en';
    dataFormat: 'table' | 'chart' | 'summary';
    verbosity: 'brief' | 'detailed';
  };
  sessionData?: {
    userName?: string;
    userRole?: string;
    accessLevel?: string;
  };
}

// Response formatting types
export interface FormattedResponse {
  text: string;
  data?: {
    type: 'table' | 'chart' | 'stats' | 'list';
    content: any;
    title?: string;
    description?: string;
  };
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
  followUp?: string[];
}

// Database query types specific to our schema
export interface DatabaseQuery {
  table: string;
  operation: 'select' | 'count' | 'aggregate';
  fields?: string[];
  filters?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
    value: any;
  }[];
  orderBy?: {
    field: string;
    ascending: boolean;
  };
  limit?: number;
  dateRange?: {
    field: string;
    start?: Date;
    end?: Date;
  };
}

// System status types
export interface SystemStatus {
  database: 'online' | 'offline' | 'degraded';
  aiService: 'online' | 'offline' | 'degraded';
  lastHealthCheck: Date;
  responseTime: number;
  errorRate: number;
}

// Notification types
export interface ChatNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Export utility type for message creation
export type CreateMessageInput = Omit<ChatMessage, 'id' | 'timestamp' | 'status'> & {
  id?: string;
  timestamp?: Date;
  status?: ChatMessage['status'];
};

// Export utility type for session creation
export type CreateSessionInput = Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
