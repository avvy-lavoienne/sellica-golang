/**
 * Unified Session Management Types for SELLY AI
 * Comprehensive type definitions for session management system
 */

export type SessionType = 'authenticated' | 'guest' | 'converting';

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

export interface ConversationTurn {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    model?: string;
    processingTime?: number;
    cached?: boolean;
    serviceType?: string;
  };
}

export interface UserPreferences {
  language: 'id' | 'en';
  dataFormat: 'summary' | 'detailed' | 'raw';
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  personaSettings?: {
    formalityLevel: 'formal' | 'friendly' | 'casual';
    responseStyle: 'professional' | 'conversational' | 'educational';
    culturalContext: 'indonesian' | 'regional_garut' | 'universal';
  };
  notificationSettings?: {
    enableSounds: boolean;
    enablePushNotifications: boolean;
    sessionReminders: boolean;
  };
}

export interface AdministrativeContext {
  currentService?: string;
  documentType?: string;
  processStage?: 'inquiry' | 'requirements' | 'submission' | 'processing' | 'completion';
  officeLocation?: 'garut_pusat' | 'garut_utara' | 'garut_selatan' | 'online';
  appointmentId?: string;
  referenceNumber?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
}

export interface EnhancedSessionData {
  // Core Identification
  id: string;
  type: SessionType;
  userId?: string;
  guestUuid?: string;
  
  // Temporal Management
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  
  // Multi-Device Support
  devices: DeviceSession[];
  primaryDeviceId: string;
  
  // Conversation Data
  conversationHistory: ConversationTurn[];
  conversationContext: {
    userPreferences: UserPreferences;
    currentTopic?: string;
    conversationStage?: string;
    lastIntent?: string;
  };
  userPreferences: UserPreferences;
  
  // Administrative Context (Disdukcapil-specific)
  administrativeContext?: AdministrativeContext;
  
  // Performance & Analytics
  analytics: {
    totalQueries: number;
    averageResponseTime: number;
    cacheHitRate: number;
    mostUsedServices: string[];
    sessionDuration: number;
    deviceSwitches: number;
  };
  
  // Security & Privacy
  security: {
    encryptionLevel: 'basic' | 'enhanced';
    dataRetentionPolicy: 'session' | 'extended' | 'permanent';
    privacyConsent: boolean;
    anonymizationLevel: 'none' | 'partial' | 'full';
  };
}

export interface SessionOptions {
  userId?: string;
  deviceInfo?: Partial<DeviceSession>;
  initialContext?: {
    userPreferences?: Partial<UserPreferences>;
    administrativeContext?: Partial<AdministrativeContext>;
  };
  expirationHours?: number;
  encryptionLevel?: 'basic' | 'enhanced';
  dataRetentionPolicy?: 'session' | 'extended' | 'permanent';
}

export interface SessionInfo {
  id: string;
  type: SessionType;
  userId?: string;
  guestUuid?: string;
  createdAt: Date;
  expiresAt: Date;
  deviceCount: number;
  isActive: boolean;
}

export interface SessionEvent {
  type: 'created' | 'updated' | 'accessed' | 'converted' | 'expired' | 'deleted';
  sessionId: string;
  timestamp: Date;
  deviceId: string;
  metadata?: Record<string, any>;
}

export interface SessionAnalytics {
  sessionId: string;
  totalDuration: number;
  messageCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  deviceSwitches: number;
  mostUsedServices: Array<{
    service: string;
    count: number;
    averageTime: number;
  }>;
  conversationFlow: Array<{
    stage: string;
    duration: number;
    messageCount: number;
  }>;
  performanceMetrics: {
    fastestResponse: number;
    slowestResponse: number;
    averageThinkTime: number;
    errorRate: number;
  };
}

export interface CleanupResult {
  sessionsDeleted: number;
  dataFreed: number; // in bytes
  errors: string[];
  duration: number; // in milliseconds
}

export interface SessionSyncResult {
  success: boolean;
  syncedDevices: number;
  conflicts: number;
  lastSyncTime: Date;
  failedDevices?: number;
  errors?: string[];
}

export interface ConversionResult {
  success: boolean;
  newSessionId: string;
  migratedData: {
    messages: number;
    preferences: boolean;
    context: boolean;
  };
  errors?: string[];
}

// Storage layer interfaces
export interface SessionStorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  scan(pattern: string): Promise<string[]>;
  pipeline(): SessionStoragePipeline;
}

export interface SessionStoragePipeline {
  set(key: string, value: any, ttl?: number): SessionStoragePipeline;
  get(key: string): SessionStoragePipeline;
  delete(key: string): SessionStoragePipeline;
  exec(): Promise<any[]>;
}

// Configuration interfaces
export interface SessionManagerConfig {
  redis: {
    keyPrefix: string;
    defaultTTL: number;
    maxRetries: number;
    retryDelay: number;
  };
  session: {
    guestSessionTTL: number;
    authenticatedSessionTTL: number;
    maxDevicesPerSession: number;
    cleanupInterval: number;
  };
  security: {
    encryptSensitiveData: boolean;
    anonymizeGuestData: boolean;
    enableCrossDeviceSync: boolean;
    requireConsentForAnalytics: boolean;
  };
  performance: {
    enableLocalCache: boolean;
    localCacheSize: number;
    batchOperations: boolean;
    compressionEnabled: boolean;
  };
}

// Error types
export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND', sessionId, false);
  }
}

export class SessionExpiredError extends SessionError {
  constructor(sessionId: string) {
    super(`Session expired: ${sessionId}`, 'SESSION_EXPIRED', sessionId, false);
  }
}

export class SessionConversionError extends SessionError {
  constructor(sessionId: string, reason: string) {
    super(`Session conversion failed: ${reason}`, 'CONVERSION_FAILED', sessionId, true);
  }
}

export class SessionSyncError extends SessionError {
  constructor(sessionId: string, reason: string) {
    super(`Session sync failed: ${reason}`, 'SYNC_FAILED', sessionId, true);
  }
}
