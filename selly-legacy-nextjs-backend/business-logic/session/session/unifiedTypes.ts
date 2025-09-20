/**
 * Unified Session Management Types - Week 2 Enhancement
 * Consolidated type system for SELLY session management
 */

// Re-export existing types for backward compatibility
export * from './types';

// Core type definitions (explicit for TypeScript resolution)
export type SessionType = 'authenticated' | 'guest' | 'converting';

// Device session interface
export interface DeviceSession {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastAccessed: Date;
  isActive: boolean;
  ipAddress?: string;
  userAgent: string;
}

// Conversation turn interface
export interface ConversationTurn {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    model?: string;
    cached?: boolean;
  };
}

// User preferences interface
export interface UserPreferences {
  language: 'id' | 'en';
  dataFormat: 'summary' | 'detailed' | 'raw';
  verbosity: 'minimal' | 'standard' | 'detailed';
  personaSettings?: {
    formalityLevel?: 'formal' | 'friendly' | 'casual';
    responseStyle?: 'conversational' | 'professional' | 'technical';
    culturalContext?: 'indonesian' | 'international';
  };
  notificationSettings?: {
    enableSounds?: boolean;
    enablePushNotifications?: boolean;
    sessionReminders?: boolean;
  };
}

// Enhanced Storage Types
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  scan(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
}

export interface StorageMetrics {
  hitRatio: number;
  missRatio: number;
  errorRate: number;
  averageResponseTime: number;
  totalOperations: number;
  cacheSize: number;
  lastUpdated: Date;
}

export interface StorageHealth {
  isHealthy: boolean;
  latency: number;
  errorCount: number;
  lastError?: Error;
  uptime: number;
}

// Enhanced Session Types
export interface BaseSession {
  id: string;
  type: SessionType;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface AuthenticatedSession extends BaseSession {
  type: 'authenticated';
  userId: string;
  userEmail?: string;
  userRole?: string;
  devices: DeviceSession[];
  primaryDeviceId: string;
  conversationHistory: ConversationTurn[];
  conversationContext: ConversationContext;
  userPreferences: UserPreferences;
  analytics: SessionAnalytics;
  security: SecuritySettings;
}

export interface GuestSession extends BaseSession {
  type: 'guest';
  guestUuid: string;
  devices: DeviceSession[];
  conversationHistory: ConversationTurn[];
  userPreferences: UserPreferences;
  conversionEligible: boolean;
  conversionAttempts: number;
}

export interface ConvertingSession extends BaseSession {
  type: 'converting';
  guestSessionId: string;
  targetUserId: string;
  conversionStartedAt: Date;
  conversionProgress: ConversionProgress;
  rollbackData?: GuestSession;
}

export type UnifiedSession = AuthenticatedSession | GuestSession | ConvertingSession;

// Administrative context interface
export interface AdministrativeContext {
  currentService?: string;
  documentType?: string;
  processStage?: string;
  requiredDocuments?: string[];
  completedSteps?: string[];
}

// User behavior pattern interface
export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  lastSeen: Date;
  confidence: number;
  category: 'query_style' | 'topic_preference' | 'interaction_pattern';
}

// Learning data interface
export interface LearningData {
  successfulInteractions: number;
  failedInteractions: number;
  averageSessionDuration: number;
  preferredResponseStyle: string;
  commonMisunderstandings: string[];
}

// Session memory interface
export interface SessionMemory {
  recentQueries: string[];
  frequentTopics: Record<string, number>;
  userPatterns: UserBehaviorPattern[];
  contextualHints: string[];
  learningData: LearningData;
}

// Enhanced Conversation Types
export interface ConversationContext {
  userPreferences: UserPreferences;
  currentTopic?: string;
  conversationStage?: 'greeting' | 'inquiry' | 'processing' | 'resolution' | 'followup';
  lastIntent?: string;
  administrativeContext?: AdministrativeContext;
  sessionMemory?: SessionMemory;
}

export interface SessionMemory {
  recentQueries: string[];
  frequentTopics: Record<string, number>;
  userPatterns: UserBehaviorPattern[];
  contextualHints: string[];
  learningData: LearningData;
}

export interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  lastSeen: Date;
  confidence: number;
  category: 'query_style' | 'topic_preference' | 'interaction_pattern';
}

export interface LearningData {
  successfulInteractions: number;
  failedInteractions: number;
  averageSessionDuration: number;
  preferredResponseStyle: string;
  commonMisunderstandings: string[];
}

// Enhanced Analytics Types
export interface SessionAnalytics {
  totalQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  mostUsedServices: string[];
  sessionDuration: number;
  deviceSwitches: number;
  errorCount: number;
  satisfactionScore?: number;
  conversionProbability?: number;
}

export interface ConversionProgress {
  step: 'initiated' | 'data_migration' | 'verification' | 'completion' | 'failed';
  progress: number; // 0-100
  migratedData: {
    messages: number;
    preferences: boolean;
    context: boolean;
    analytics: boolean;
  };
  errors: string[];
  startedAt: Date;
  estimatedCompletion?: Date;
}

// Enhanced Security Types
export interface SecuritySettings {
  encryptionLevel: 'basic' | 'enhanced' | 'maximum';
  dataRetentionPolicy: 'minimal' | 'standard' | 'extended';
  privacyConsent: boolean;
  anonymizationLevel: 'none' | 'partial' | 'full';
  accessControls: AccessControl[];
  auditLog: SecurityEvent[];
}

export interface AccessControl {
  resource: string;
  permissions: Permission[];
  conditions?: AccessCondition[];
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'admin';
  granted: boolean;
  grantedAt: Date;
  grantedBy?: string;
}

export interface AccessCondition {
  type: 'time_based' | 'location_based' | 'device_based' | 'behavior_based';
  condition: string;
  active: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'data_access' | 'permission_change' | 'security_violation';
  timestamp: Date;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

// Enhanced Chat Types (for integration with existing chatbot types)
export interface EnhancedChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'selly' | 'system';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'action' | 'system_notification';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    confidence?: number;
    processingTime?: number;
    model?: string;
    cached?: boolean;
    serviceType?: string;
    intent?: string;
    entities?: Record<string, any>;
  };
  reactions?: MessageReaction[];
  threadId?: string;
  replyToId?: string;
}

export interface MessageReaction {
  type: 'helpful' | 'not_helpful' | 'accurate' | 'inaccurate' | 'fast' | 'slow';
  userId?: string;
  timestamp: Date;
  feedback?: string;
}

export interface EnhancedChatSession {
  id: string;
  sessionId: string; // Links to UnifiedSession
  messages: EnhancedChatMessage[];
  participants: ChatParticipant[];
  status: 'active' | 'paused' | 'ended' | 'archived';
  startedAt: Date;
  endedAt?: Date;
  summary?: ChatSummary;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ChatParticipant {
  id: string;
  type: 'user' | 'ai' | 'admin';
  name: string;
  role?: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export interface ChatSummary {
  totalMessages: number;
  duration: number;
  mainTopics: string[];
  resolution: 'resolved' | 'unresolved' | 'escalated' | 'abandoned';
  satisfactionRating?: number;
  keyInsights: string[];
  actionItems: string[];
  followUpRequired: boolean;
}

// Feature Flag Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'session_type' | 'device_type' | 'time_based' | 'random';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureFlagContext {
  userId?: string;
  sessionId: string;
  sessionType: SessionType;
  deviceType: string;
  timestamp: Date;
  customAttributes?: Record<string, any>;
}

// Real-time Sync Types
export interface SyncEvent {
  id: string;
  type: 'session_update' | 'message_sent' | 'user_joined' | 'user_left' | 'status_change';
  sessionId: string;
  userId?: string;
  data: any;
  timestamp: Date;
  source: 'client' | 'server' | 'external';
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncAt?: Date;
  pendingEvents: number;
  syncErrors: SyncError[];
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export interface SyncError {
  id: string;
  type: 'connection_lost' | 'sync_failed' | 'data_conflict' | 'permission_denied';
  message: string;
  timestamp: Date;
  retryCount: number;
  resolved: boolean;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  sessionCreationTime: number;
  messageProcessingTime: number;
  storageOperationTime: number;
  syncLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'high_latency' | 'high_error_rate' | 'memory_leak' | 'storage_full' | 'sync_lag';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

// Utility Types
export type SessionEventType = 
  | 'session_created'
  | 'session_updated' 
  | 'session_deleted'
  | 'session_converted'
  | 'message_sent'
  | 'message_received'
  | 'user_joined'
  | 'user_left'
  | 'preference_updated'
  | 'security_event'
  | 'performance_alert';

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  sessionId: string;
  userId?: string;
  data: any;
  timestamp: Date;
  source: string;
  processed: boolean;
}

export type SessionState = 'initializing' | 'active' | 'idle' | 'converting' | 'expired' | 'archived';

export interface SessionTransition {
  from: SessionState;
  to: SessionState;
  trigger: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration Types
export interface SessionConfig {
  defaultTTL: number;
  guestSessionTTL: number;
  maxConcurrentSessions: number;
  enableRealTimeSync: boolean;
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  storageConfig: StorageConfig;
  securityConfig: SecurityConfig;
  featureFlags: Record<string, boolean>;
}

export interface StorageConfig {
  primaryStorage: 'redis' | 'memory' | 'localStorage';
  fallbackStorage: 'localStorage' | 'memory' | 'none';
  enableCompression: boolean;
  enableEncryption: boolean;
  maxCacheSize: number;
  cleanupInterval: number;
}

export interface SecurityConfig {
  requireEncryption: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableAuditLog: boolean;
  dataRetentionDays: number;
  anonymizeAfterDays: number;
}
