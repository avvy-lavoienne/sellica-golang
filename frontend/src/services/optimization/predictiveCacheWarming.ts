/**
 * Predictive Cache Warming Service - Week 4 Implementation
 * Session-based predictive warming using conversation patterns and user behavior
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { EnhancedSessionCache } from '@/services/session/enhancedSessionCache';
import { UnifiedSession, SessionType } from '@/services/session/unifiedTypes';
import { ChatMessage } from '@/types/chatbot';

export interface WarmingPattern {
  id: string;
  sessionType: SessionType;
  userId?: string;
  pattern: {
    messageTypes: string[];
    timeOfDay: number[]; // Hours 0-23
    dayOfWeek: number[]; // 0-6 (Sunday-Saturday)
    conversationFlow: string[];
    userPreferences: Record<string, any>;
  };
  frequency: number;
  lastSeen: Date;
  confidence: number; // 0-1
  warmingKeys: string[];
}

export interface WarmingJob {
  id: string;
  sessionId: string;
  userId?: string;
  keys: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduledAt: Date;
  executedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pattern?: WarmingPattern;
  metadata: {
    trigger: 'pattern' | 'manual' | 'scheduled';
    confidence: number;
    estimatedBenefit: number;
  };
}

export interface WarmingConfig {
  enabled: boolean;
  maxConcurrentJobs: number;
  maxJobsPerSession: number;
  minConfidenceThreshold: number;
  warmingWindow: number; // minutes
  patternAnalysis: {
    enabled: boolean;
    minSampleSize: number;
    analysisInterval: number; // minutes
    retentionPeriod: number; // days
  };
  scheduling: {
    enabled: boolean;
    peakHours: number[]; // Hours when warming should be more aggressive
    offPeakHours: number[]; // Hours when warming should be reduced
    maxWarmingRate: number; // operations per minute
  };
}

export interface WarmingMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  cacheHitImprovement: number;
  patternsDetected: number;
  activePatterns: number;
  warmingEfficiency: number; // successful predictions / total predictions
}

export class PredictiveCacheWarming {
  private config: WarmingConfig;
  private storageAdapter: SessionStorageAdapter;
  private cacheService: EnhancedSessionCache;
  private patterns: Map<string, WarmingPattern> = new Map();
  private warmingJobs: Map<string, WarmingJob> = new Map();
  private runningJobs: Set<string> = new Set();
  private metrics: WarmingMetrics;
  private analysisInterval?: NodeJS.Timeout;
  private warmingInterval?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    cacheService: EnhancedSessionCache,
    config?: Partial<WarmingConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.cacheService = cacheService;
    
    this.config = {
      enabled: true,
      maxConcurrentJobs: 5,
      maxJobsPerSession: 3,
      minConfidenceThreshold: 0.7,
      warmingWindow: 15, // 15 minutes
      patternAnalysis: {
        enabled: true,
        minSampleSize: 10,
        analysisInterval: 30, // 30 minutes
        retentionPeriod: 30 // 30 days
      },
      scheduling: {
        enabled: true,
        peakHours: [9, 10, 11, 14, 15, 16], // Business hours
        offPeakHours: [0, 1, 2, 3, 4, 5, 22, 23], // Night hours
        maxWarmingRate: 10 // 10 operations per minute
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
    
    if (this.config.enabled) {
      this.startPatternAnalysis();
      this.startWarmingScheduler();
    }

    console.log('🔥 Predictive Cache Warming Service initialized');
  }

  /**
   * Analyze session patterns and schedule warming
   */
  async analyzeSessionPattern(session: UnifiedSession, messages: ChatMessage[]): Promise<void> {
    if (!this.config.patternAnalysis.enabled || messages.length < this.config.patternAnalysis.minSampleSize) {
      return;
    }

    try {
      const pattern = await this.extractPattern(session, messages);
      if (pattern && pattern.confidence >= this.config.minConfidenceThreshold) {
        this.patterns.set(pattern.id, pattern);
        
        // Schedule warming based on pattern
        await this.schedulePatternBasedWarming(session, pattern);
        
        console.log(`🔍 Pattern detected for session ${session.id} (confidence: ${pattern.confidence})`);
      }
    } catch (error) {
      console.error('Pattern analysis error:', error);
    }
  }

  /**
   * Trigger immediate warming for session
   */
  async warmSession(sessionId: string, userId?: string, priority: WarmingJob['priority'] = 'normal'): Promise<string> {
    const jobId = this.generateJobId();
    
    // Find relevant patterns
    const relevantPatterns = Array.from(this.patterns.values())
      .filter(p => !userId || p.userId === userId)
      .sort((a, b) => b.confidence - a.confidence);

    const warmingKeys = this.generateWarmingKeys(sessionId, relevantPatterns);
    
    const job: WarmingJob = {
      id: jobId,
      sessionId,
      userId,
      keys: warmingKeys,
      priority,
      scheduledAt: new Date(),
      status: 'pending',
      pattern: relevantPatterns[0],
      metadata: {
        trigger: 'manual',
        confidence: relevantPatterns[0]?.confidence || 0.5,
        estimatedBenefit: this.calculateEstimatedBenefit(warmingKeys, relevantPatterns[0])
      }
    };

    this.warmingJobs.set(jobId, job);
    
    // Execute immediately if high priority
    if (priority === 'critical' || priority === 'high') {
      await this.executeWarmingJob(job);
    }

    console.log(`🔥 Warming job scheduled: ${jobId} (${warmingKeys.length} keys)`);
    return jobId;
  }

  /**
   * Get warming metrics
   */
  getMetrics(): WarmingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active patterns
   */
  getActivePatterns(): WarmingPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get warming job status
   */
  getJobStatus(jobId: string): WarmingJob | null {
    return this.warmingJobs.get(jobId) || null;
  }

  /**
   * Stop warming service
   */
  stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
    console.log('🛑 Predictive Cache Warming Service stopped');
  }

  // Private methods
  private async extractPattern(session: UnifiedSession, messages: ChatMessage[]): Promise<WarmingPattern | null> {
    try {
      const now = new Date();
      const messageTypes = messages.map(m => m.type || 'text');
      const conversationFlow = this.extractConversationFlow(messages);
      
      const pattern: WarmingPattern = {
        id: this.generatePatternId(session),
        sessionType: session.type,
        userId: session.type === 'authenticated' ? (session as any).userId : undefined,
        pattern: {
          messageTypes: [...new Set(messageTypes)],
          timeOfDay: [now.getHours()],
          dayOfWeek: [now.getDay()],
          conversationFlow,
          userPreferences: this.extractUserPreferences(messages)
        },
        frequency: 1,
        lastSeen: now,
        confidence: this.calculatePatternConfidence(messages),
        warmingKeys: this.generatePatternWarmingKeys(session, messages)
      };

      return pattern;
    } catch (error) {
      console.error('Pattern extraction error:', error);
      return null;
    }
  }

  private extractConversationFlow(messages: ChatMessage[]): string[] {
    // Extract conversation flow patterns
    const flow: string[] = [];
    let currentTopic = '';
    
    for (const message of messages) {
      const topic = this.extractTopicFromMessage(message);
      if (topic && topic !== currentTopic) {
        flow.push(topic);
        currentTopic = topic;
      }
    }
    
    return flow;
  }

  private extractTopicFromMessage(message: ChatMessage): string {
    const content = message.content.toLowerCase();
    
    // Indonesian administrative service topics
    if (content.includes('ktp') || content.includes('kartu tanda penduduk')) {
      return 'ktp';
    }
    if (content.includes('kartu keluarga') || content.includes('kk')) {
      return 'kartu_keluarga';
    }
    if (content.includes('akta kelahiran') || content.includes('akta lahir')) {
      return 'akta_kelahiran';
    }
    if (content.includes('surat nikah') || content.includes('akta nikah')) {
      return 'akta_nikah';
    }
    if (content.includes('paspor')) {
      return 'paspor';
    }
    
    return 'general';
  }

  private extractUserPreferences(messages: ChatMessage[]): Record<string, any> {
    const preferences: Record<string, any> = {};
    
    // Extract language preference
    const indonesianWords = messages.filter(m => 
      m.content.match(/\b(saya|anda|dengan|untuk|dari|yang|ini|itu)\b/i)
    ).length;
    
    preferences.language = indonesianWords > messages.length * 0.5 ? 'id' : 'en';
    
    // Extract communication style
    const formalWords = messages.filter(m => 
      m.content.match(/\b(mohon|terima kasih|selamat|hormat)\b/i)
    ).length;
    
    preferences.communicationStyle = formalWords > 0 ? 'formal' : 'casual';
    
    return preferences;
  }

  private calculatePatternConfidence(messages: ChatMessage[]): number {
    let confidence = 0.5; // Base confidence
    
    // More messages = higher confidence
    confidence += Math.min(messages.length / 20, 0.3);
    
    // Consistent message types = higher confidence
    const messageTypes = messages.map(m => m.type || 'text');
    const uniqueTypes = new Set(messageTypes);
    if (uniqueTypes.size <= 2) {
      confidence += 0.1;
    }
    
    // Recent activity = higher confidence
    const latestMessage = messages[messages.length - 1];
    const timeSinceLatest = Date.now() - latestMessage.timestamp.getTime();
    if (timeSinceLatest < 60000) { // Within 1 minute
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private generatePatternWarmingKeys(session: UnifiedSession, messages: ChatMessage[]): string[] {
    const keys: string[] = [];
    
    // Session-specific keys
    keys.push(`session:${session.id}:state`);
    keys.push(`session:${session.id}:preferences`);
    
    // User-specific keys (if authenticated)
    const userId = session.type === 'authenticated' ? (session as any).userId : undefined;
    if (userId) {
      keys.push(`user:${userId}:profile`);
      keys.push(`user:${userId}:history`);
    }
    
    // Topic-specific keys based on conversation
    const topics = messages.map(m => this.extractTopicFromMessage(m));
    const uniqueTopics = [...new Set(topics)];
    
    for (const topic of uniqueTopics) {
      keys.push(`topic:${topic}:info`);
      keys.push(`topic:${topic}:templates`);
    }
    
    return keys;
  }

  private async schedulePatternBasedWarming(session: UnifiedSession, pattern: WarmingPattern): Promise<void> {
    const jobId = this.generateJobId();
    
    const userId = session.type === 'authenticated' ? (session as any).userId : undefined;

    const job: WarmingJob = {
      id: jobId,
      sessionId: session.id,
      userId,
      keys: pattern.warmingKeys,
      priority: 'normal',
      scheduledAt: new Date(Date.now() + (this.config.warmingWindow * 60 * 1000)),
      status: 'pending',
      pattern,
      metadata: {
        trigger: 'pattern',
        confidence: pattern.confidence,
        estimatedBenefit: this.calculateEstimatedBenefit(pattern.warmingKeys, pattern)
      }
    };

    this.warmingJobs.set(jobId, job);
  }

  private async executeWarmingJob(job: WarmingJob): Promise<void> {
    if (this.runningJobs.has(job.id) || this.runningJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    this.runningJobs.add(job.id);
    job.status = 'running';
    job.executedAt = new Date();

    const startTime = performance.now();

    try {
      // Execute warming operations
      const warmingPromises = job.keys.map(key => 
        this.warmCacheKey(key, job.sessionId, job.userId)
      );

      await Promise.allSettled(warmingPromises);
      
      job.status = 'completed';
      this.metrics.completedJobs++;
      
      console.log(`✅ Warming job completed: ${job.id} (${job.keys.length} keys)`);
      
    } catch (error) {
      job.status = 'failed';
      this.metrics.failedJobs++;
      console.error(`❌ Warming job failed: ${job.id}`, error);
    } finally {
      this.runningJobs.delete(job.id);
      
      const executionTime = performance.now() - startTime;
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime + executionTime) / 2;
    }
  }

  private async warmCacheKey(key: string, sessionId: string, userId?: string): Promise<void> {
    try {
      // Check if key is already cached
      const cached = await this.cacheService.get(key, sessionId);
      if (cached !== null) {
        return; // Already cached
      }

      // Generate or fetch data for warming
      const data = await this.generateWarmingData(key, sessionId, userId);
      if (data) {
        await this.cacheService.set(
          key, 
          data, 
          sessionId, 
          userId ? 'authenticated' : 'guest',
          userId,
          { priority: 'low', source: 'session' }
        );
      }
    } catch (error) {
      console.error(`Failed to warm cache key ${key}:`, error);
    }
  }

  private async generateWarmingData(key: string, sessionId: string, userId?: string): Promise<any> {
    // This would generate appropriate data based on the key type
    // For now, return placeholder data
    
    if (key.includes('session:') && key.includes(':state')) {
      return { initialized: true, warmed: true, timestamp: Date.now() };
    }
    
    if (key.includes('user:') && key.includes(':profile')) {
      return { preferences: {}, settings: {}, warmed: true };
    }
    
    if (key.includes('topic:')) {
      return { templates: [], info: {}, warmed: true };
    }
    
    return { warmed: true, timestamp: Date.now() };
  }

  private generateWarmingKeys(sessionId: string, patterns: WarmingPattern[]): string[] {
    const keys = new Set<string>();
    
    // Add session-specific keys
    keys.add(`session:${sessionId}:state`);
    keys.add(`session:${sessionId}:preferences`);
    
    // Add pattern-based keys
    for (const pattern of patterns.slice(0, 3)) { // Top 3 patterns
      pattern.warmingKeys.forEach(key => keys.add(key));
    }
    
    return Array.from(keys);
  }

  private calculateEstimatedBenefit(keys: string[], pattern?: WarmingPattern): number {
    let benefit = keys.length * 0.1; // Base benefit per key
    
    if (pattern) {
      benefit *= pattern.confidence; // Scale by confidence
      benefit *= pattern.frequency; // Scale by frequency
    }
    
    return Math.min(benefit, 1.0);
  }

  private startPatternAnalysis(): void {
    if (!this.config.patternAnalysis.enabled) return;
    
    this.analysisInterval = setInterval(() => {
      this.analyzePatterns();
    }, this.config.patternAnalysis.analysisInterval * 60 * 1000);
  }

  private startWarmingScheduler(): void {
    if (!this.config.scheduling.enabled) return;
    
    this.warmingInterval = setInterval(() => {
      this.processWarmingQueue();
    }, 60 * 1000); // Every minute
  }

  private async analyzePatterns(): Promise<void> {
    console.log('🔍 Analyzing warming patterns...');
    // Pattern analysis logic would go here
  }

  private async processWarmingQueue(): Promise<void> {
    const pendingJobs = Array.from(this.warmingJobs.values())
      .filter(job => job.status === 'pending' && job.scheduledAt <= new Date())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    for (const job of pendingJobs.slice(0, this.config.maxConcurrentJobs - this.runningJobs.size)) {
      await this.executeWarmingJob(job);
    }
  }

  private getPriorityWeight(priority: WarmingJob['priority']): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private generateJobId(): string {
    return `warming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(session: UnifiedSession): string {
    const userId = session.type === 'authenticated' ? (session as any).userId : 'guest';
    return `pattern_${session.type}_${userId}_${Date.now()}`;
  }

  private initializeMetrics(): WarmingMetrics {
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageExecutionTime: 0,
      cacheHitImprovement: 0,
      patternsDetected: 0,
      activePatterns: 0,
      warmingEfficiency: 0
    };
  }
}
