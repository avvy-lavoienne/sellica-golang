/**
 * Contextual Memory Enhancement Service
 * Phase 1 Priority 2: Enhanced Context Intelligence Optimization
 * 
 * Provides advanced memory management for user preferences, conversation history,
 * and personalized response optimization based on interaction patterns
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { ConversationContextV2, UserPreferencesV2, ConversationTurn } from './enhancedContextIntelligenceV2';

export interface UserMemoryProfile {
  userId: string;
  createdAt: string;
  lastUpdated: string;
  interactionCount: number;
  preferences: EnhancedUserPreferences;
  conversationPatterns: ConversationPattern[];
  serviceUsageHistory: ServiceUsageRecord[];
  personalizedResponses: PersonalizedResponse[];
  learningMetrics: LearningMetrics;
}

export interface EnhancedUserPreferences extends UserPreferencesV2 {
  responseSpeed: 'instant' | 'detailed' | 'comprehensive';
  informationDepth: 'basic' | 'intermediate' | 'expert';
  interactionStyle: 'professional' | 'friendly' | 'casual';
  notificationPreferences: NotificationPreference[];
  adaptiveSettings: AdaptiveSettings;
}

export interface ConversationPattern {
  patternId: string;
  patternType: 'greeting' | 'inquiry_sequence' | 'process_completion' | 'problem_solving';
  frequency: number;
  averageLength: number;
  commonQueries: string[];
  successRate: number;
  lastOccurrence: string;
  contextualTriggers: string[];
}

export interface ServiceUsageRecord {
  serviceType: string;
  usageCount: number;
  lastUsed: string;
  averageCompletionTime: number;
  successRate: number;
  commonIssues: string[];
  preferredApproach: 'step_by_step' | 'overview_first' | 'direct_action';
}

export interface PersonalizedResponse {
  responseId: string;
  triggerPattern: string;
  personalizedContent: string;
  effectivenessScore: number;
  usageCount: number;
  lastUsed: string;
  contextualFactors: string[];
}

export interface NotificationPreference {
  type: 'process_update' | 'document_reminder' | 'service_completion' | 'system_update';
  enabled: boolean;
  timing: 'immediate' | 'daily_summary' | 'weekly_summary';
  channel: 'chat' | 'email' | 'sms';
}

export interface AdaptiveSettings {
  learningEnabled: boolean;
  adaptationSpeed: 'conservative' | 'moderate' | 'aggressive';
  privacyLevel: 'minimal' | 'standard' | 'comprehensive';
  dataRetentionDays: number;
  personalizationLevel: number; // 0-100
}

export interface LearningMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageSatisfaction: number;
  preferenceAccuracy: number;
  adaptationEffectiveness: number;
  memoryUtilization: number;
}

export interface MemoryEnhancementResult {
  userProfile: UserMemoryProfile;
  personalizedRecommendations: string[];
  contextualEnhancements: ContextualEnhancement[];
  memoryOptimizations: MemoryOptimization[];
  processingTime: number;
}

export interface ContextualEnhancement {
  enhancementType: 'response_personalization' | 'process_optimization' | 'preference_adaptation' | 'pattern_recognition';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface MemoryOptimization {
  optimizationType: 'preference_learning' | 'pattern_consolidation' | 'response_caching' | 'context_compression';
  description: string;
  memoryImpact: number; // MB
  performanceImpact: number; // ms
  effectiveness: number; // 0-100
}

export class ContextualMemoryEnhancement {
  private static instance: ContextualMemoryEnhancement;
  private userMemoryProfiles: Map<string, UserMemoryProfile> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private initialized = false;

  // Memory configuration
  private readonly MEMORY_RETENTION_DAYS = 90;
  private readonly MAX_CONVERSATION_PATTERNS = 20;
  private readonly MAX_PERSONALIZED_RESPONSES = 50;
  private readonly LEARNING_THRESHOLD = 0.7;
  private readonly PERFORMANCE_TARGET_MS = 50;

  // Default preferences
  private readonly DEFAULT_PREFERENCES: EnhancedUserPreferences = {
    preferredLanguageStyle: 'mixed',
    communicationPreference: 'detailed',
    serviceHistory: [],
    frequentQueries: [],
    preferredResponseFormat: 'text',
    accessibilityNeeds: [],
    responseSpeed: 'detailed',
    informationDepth: 'intermediate',
    interactionStyle: 'friendly',
    notificationPreferences: [
      { type: 'process_update', enabled: true, timing: 'immediate', channel: 'chat' },
      { type: 'document_reminder', enabled: true, timing: 'daily_summary', channel: 'chat' }
    ],
    adaptiveSettings: {
      learningEnabled: true,
      adaptationSpeed: 'moderate',
      privacyLevel: 'standard',
      dataRetentionDays: 90,
      personalizationLevel: 70
    }
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public static getInstance(): ContextualMemoryEnhancement {
    if (!ContextualMemoryEnhancement.instance) {
      ContextualMemoryEnhancement.instance = new ContextualMemoryEnhancement();
    }
    return ContextualMemoryEnhancement.instance;
  }

  /**
   * Initialize contextual memory enhancement
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🧠 [MEMORY_ENHANCEMENT] Initializing contextual memory enhancement...');
      
      // Initialize performance monitor
      await this.performanceMonitor.initialize();
      
      // Load existing user memory profiles
      await this.loadUserMemoryProfiles();
      
      // Start memory maintenance
      this.startMemoryMaintenance();
      
      this.initialized = true;
      console.log('✅ [MEMORY_ENHANCEMENT] Contextual memory enhancement initialized');
      
    } catch (error) {
      console.error('❌ [MEMORY_ENHANCEMENT] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Enhance user memory with conversation context
   */
  public async enhanceUserMemory(
    userId: string,
    conversationContext: ConversationContextV2,
    satisfactionScore?: number
  ): Promise<MemoryEnhancementResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🧠 [MEMORY_ENHANCEMENT] Enhancing memory for user: ${userId}`);
      
      // Get or create user memory profile
      let userProfile = this.getUserMemoryProfile(userId);
      
      // Update interaction count
      userProfile.interactionCount++;
      userProfile.lastUpdated = new Date().toISOString();
      
      // Learn from conversation patterns
      this.learnConversationPatterns(userProfile, conversationContext);
      
      // Update service usage history
      this.updateServiceUsageHistory(userProfile, conversationContext);
      
      // Adapt user preferences
      this.adaptUserPreferences(userProfile, conversationContext, satisfactionScore);
      
      // Generate personalized responses
      this.generatePersonalizedResponses(userProfile, conversationContext);
      
      // Update learning metrics
      this.updateLearningMetrics(userProfile, conversationContext, satisfactionScore);
      
      // Generate contextual enhancements
      const contextualEnhancements = this.generateContextualEnhancements(userProfile, conversationContext);
      
      // Generate memory optimizations
      const memoryOptimizations = this.generateMemoryOptimizations(userProfile);
      
      // Generate personalized recommendations
      const personalizedRecommendations = this.generatePersonalizedRecommendations(userProfile);
      
      // Store updated profile
      this.userMemoryProfiles.set(userId, userProfile);
      
      const processingTime = performance.now() - startTime;
      
      // Record performance metrics
      this.recordMemoryMetrics(processingTime, userProfile);
      
      console.log(`✅ [MEMORY_ENHANCEMENT] Memory enhancement completed in ${processingTime.toFixed(2)}ms`);
      
      return {
        userProfile,
        personalizedRecommendations,
        contextualEnhancements,
        memoryOptimizations,
        processingTime
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ [MEMORY_ENHANCEMENT] Memory enhancement failed:', error);
      
      // Record error metrics
      this.performanceMonitor.recordMetric(
        'error_rate',
        'real_time_analyzer',
        1,
        'count',
        { source: 'memory_enhancement', error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  /**
   * Get personalized response for user
   */
  public getPersonalizedResponse(userId: string, query: string, baseResponse: string): string {
    const userProfile = this.userMemoryProfiles.get(userId);
    if (!userProfile) return baseResponse;

    // Find matching personalized response
    const personalizedResponse = userProfile.personalizedResponses.find(response => 
      new RegExp(response.triggerPattern, 'i').test(query)
    );

    if (personalizedResponse) {
      personalizedResponse.usageCount++;
      personalizedResponse.lastUsed = new Date().toISOString();
      return this.applyPersonalization(personalizedResponse.personalizedContent, userProfile);
    }

    // Apply general personalization to base response
    return this.applyPersonalization(baseResponse, userProfile);
  }

  /**
   * Get user memory profile
   */
  private getUserMemoryProfile(userId: string): UserMemoryProfile {
    let profile = this.userMemoryProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        interactionCount: 0,
        preferences: { ...this.DEFAULT_PREFERENCES },
        conversationPatterns: [],
        serviceUsageHistory: [],
        personalizedResponses: [],
        learningMetrics: {
          totalInteractions: 0,
          successfulInteractions: 0,
          averageSatisfaction: 0,
          preferenceAccuracy: 0,
          adaptationEffectiveness: 0,
          memoryUtilization: 0
        }
      };
      
      console.log(`🆕 [MEMORY_ENHANCEMENT] Created new memory profile for user: ${userId}`);
    }
    
    return profile;
  }

  /**
   * Learn conversation patterns from user interactions
   */
  private learnConversationPatterns(profile: UserMemoryProfile, context: ConversationContextV2): void {
    if (context.conversationHistory.length < 2) return;

    const patternType = this.identifyPatternType(context);
    let pattern = profile.conversationPatterns.find(p => p.patternType === patternType);

    if (!pattern) {
      pattern = {
        patternId: `pattern_${Date.now()}`,
        patternType,
        frequency: 0,
        averageLength: 0,
        commonQueries: [],
        successRate: 0,
        lastOccurrence: new Date().toISOString(),
        contextualTriggers: []
      };
      profile.conversationPatterns.push(pattern);
    }

    // Update pattern metrics
    pattern.frequency++;
    pattern.averageLength = (pattern.averageLength + context.conversationHistory.length) / 2;
    pattern.lastOccurrence = new Date().toISOString();

    // Update common queries
    const currentQueries = context.conversationHistory.map(turn => turn.userQuery);
    currentQueries.forEach(query => {
      if (!pattern.commonQueries.includes(query) && pattern.commonQueries.length < 10) {
        pattern.commonQueries.push(query);
      }
    });

    // Update success rate based on conversation completion
    const completionScore = context.conversationMetrics.goalCompletion / 100;
    pattern.successRate = (pattern.successRate + completionScore) / 2;

    // Limit number of patterns
    if (profile.conversationPatterns.length > this.MAX_CONVERSATION_PATTERNS) {
      profile.conversationPatterns.sort((a, b) => b.frequency - a.frequency);
      profile.conversationPatterns = profile.conversationPatterns.slice(0, this.MAX_CONVERSATION_PATTERNS);
    }
  }

  /**
   * Update service usage history
   */
  private updateServiceUsageHistory(profile: UserMemoryProfile, context: ConversationContextV2): void {
    const serviceType = this.extractServiceType(context);
    if (!serviceType) return;

    let serviceRecord = profile.serviceUsageHistory.find(record => record.serviceType === serviceType);

    if (!serviceRecord) {
      serviceRecord = {
        serviceType,
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        averageCompletionTime: 0,
        successRate: 0,
        commonIssues: [],
        preferredApproach: 'step_by_step'
      };
      profile.serviceUsageHistory.push(serviceRecord);
    }

    // Update service metrics
    serviceRecord.usageCount++;
    serviceRecord.lastUsed = new Date().toISOString();

    const completionTime = context.conversationMetrics.averageResponseTime;
    serviceRecord.averageCompletionTime = (serviceRecord.averageCompletionTime + completionTime) / 2;

    const successRate = context.conversationMetrics.goalCompletion / 100;
    serviceRecord.successRate = (serviceRecord.successRate + successRate) / 2;

    // Determine preferred approach based on conversation patterns
    serviceRecord.preferredApproach = this.determinePreferredApproach(context);
  }

  /**
   * Adapt user preferences based on interaction patterns
   */
  private adaptUserPreferences(
    profile: UserMemoryProfile, 
    context: ConversationContextV2, 
    satisfactionScore?: number
  ): void {
    if (!profile.preferences.adaptiveSettings.learningEnabled) return;

    const adaptationSpeed = profile.preferences.adaptiveSettings.adaptationSpeed;
    const learningRate = adaptationSpeed === 'aggressive' ? 0.3 : adaptationSpeed === 'moderate' ? 0.2 : 0.1;

    // Adapt communication preference based on conversation length
    if (context.conversationHistory.length > 5) {
      profile.preferences.communicationPreference = 'step_by_step';
    } else if (context.conversationHistory.length <= 2) {
      profile.preferences.communicationPreference = 'concise';
    }

    // Adapt response speed based on user behavior
    const avgResponseTime = context.conversationMetrics.averageResponseTime;
    if (avgResponseTime < 100) {
      profile.preferences.responseSpeed = 'instant';
    } else if (avgResponseTime > 500) {
      profile.preferences.responseSpeed = 'comprehensive';
    }

    // Adapt interaction style based on emotional state patterns
    const emotionalStates = context.conversationHistory.map(turn => 
      this.detectEmotionalStateFromQuery(turn.userQuery)
    );
    
    const formalCount = emotionalStates.filter(state => state === 'formal').length;
    const casualCount = emotionalStates.filter(state => state === 'casual').length;
    
    if (formalCount > casualCount) {
      profile.preferences.interactionStyle = 'professional';
    } else if (casualCount > formalCount) {
      profile.preferences.interactionStyle = 'casual';
    }

    // Update frequent queries
    const currentQuery = context.conversationHistory[context.conversationHistory.length - 1]?.userQuery;
    if (currentQuery && !profile.preferences.frequentQueries.includes(currentQuery)) {
      profile.preferences.frequentQueries.push(currentQuery);
      if (profile.preferences.frequentQueries.length > 20) {
        profile.preferences.frequentQueries = profile.preferences.frequentQueries.slice(-20);
      }
    }
  }

  /**
   * Generate personalized responses based on user patterns
   */
  private generatePersonalizedResponses(profile: UserMemoryProfile, context: ConversationContextV2): void {
    const currentQuery = context.conversationHistory[context.conversationHistory.length - 1]?.userQuery;
    if (!currentQuery) return;

    // Check if we should create a new personalized response
    const existingResponse = profile.personalizedResponses.find(response => 
      new RegExp(response.triggerPattern, 'i').test(currentQuery)
    );

    if (!existingResponse && profile.personalizedResponses.length < this.MAX_PERSONALIZED_RESPONSES) {
      const personalizedResponse: PersonalizedResponse = {
        responseId: `response_${Date.now()}`,
        triggerPattern: this.generateTriggerPattern(currentQuery),
        personalizedContent: this.generatePersonalizedContent(currentQuery, profile),
        effectivenessScore: 0.5, // Initial score
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        contextualFactors: this.extractContextualFactors(context)
      };

      profile.personalizedResponses.push(personalizedResponse);
    }
  }

  /**
   * Update learning metrics
   */
  private updateLearningMetrics(
    profile: UserMemoryProfile, 
    context: ConversationContextV2, 
    satisfactionScore?: number
  ): void {
    const metrics = profile.learningMetrics;
    
    metrics.totalInteractions++;
    
    if (context.conversationMetrics.goalCompletion > 80) {
      metrics.successfulInteractions++;
    }
    
    if (satisfactionScore !== undefined) {
      metrics.averageSatisfaction = (metrics.averageSatisfaction + satisfactionScore) / 2;
    }
    
    // Calculate preference accuracy based on successful interactions
    metrics.preferenceAccuracy = (metrics.successfulInteractions / metrics.totalInteractions) * 100;
    
    // Calculate adaptation effectiveness
    metrics.adaptationEffectiveness = Math.min(
      (profile.conversationPatterns.length / this.MAX_CONVERSATION_PATTERNS) * 100,
      100
    );
    
    // Calculate memory utilization
    const memoryUsage = (
      profile.conversationPatterns.length +
      profile.serviceUsageHistory.length +
      profile.personalizedResponses.length
    ) / (this.MAX_CONVERSATION_PATTERNS + 20 + this.MAX_PERSONALIZED_RESPONSES);
    
    metrics.memoryUtilization = memoryUsage * 100;
  }

  /**
   * Generate contextual enhancements
   */
  private generateContextualEnhancements(
    profile: UserMemoryProfile, 
    context: ConversationContextV2
  ): ContextualEnhancement[] {
    const enhancements: ContextualEnhancement[] = [];

    // Response personalization enhancement
    if (profile.personalizedResponses.length > 0) {
      enhancements.push({
        enhancementType: 'response_personalization',
        description: `${profile.personalizedResponses.length} personalized responses available`,
        confidence: 0.9,
        impact: 'high',
        implementation: 'Apply user-specific response patterns'
      });
    }

    // Process optimization enhancement
    if (profile.serviceUsageHistory.length > 0) {
      const mostUsedService = profile.serviceUsageHistory.reduce((prev, current) => 
        prev.usageCount > current.usageCount ? prev : current
      );
      
      enhancements.push({
        enhancementType: 'process_optimization',
        description: `Optimize for ${mostUsedService.serviceType} (${mostUsedService.usageCount} uses)`,
        confidence: 0.8,
        impact: 'medium',
        implementation: `Use ${mostUsedService.preferredApproach} approach`
      });
    }

    // Preference adaptation enhancement
    if (profile.learningMetrics.adaptationEffectiveness > 70) {
      enhancements.push({
        enhancementType: 'preference_adaptation',
        description: `High adaptation effectiveness (${profile.learningMetrics.adaptationEffectiveness.toFixed(1)}%)`,
        confidence: 0.85,
        impact: 'high',
        implementation: 'Continue adaptive learning with current settings'
      });
    }

    return enhancements;
  }

  /**
   * Generate memory optimizations
   */
  private generateMemoryOptimizations(profile: UserMemoryProfile): MemoryOptimization[] {
    const optimizations: MemoryOptimization[] = [];

    // Pattern consolidation
    if (profile.conversationPatterns.length > 15) {
      optimizations.push({
        optimizationType: 'pattern_consolidation',
        description: 'Consolidate similar conversation patterns',
        memoryImpact: -2.5,
        performanceImpact: -10,
        effectiveness: 85
      });
    }

    // Response caching
    if (profile.personalizedResponses.length > 30) {
      optimizations.push({
        optimizationType: 'response_caching',
        description: 'Cache frequently used personalized responses',
        memoryImpact: 1.0,
        performanceImpact: -25,
        effectiveness: 90
      });
    }

    return optimizations;
  }

  /**
   * Generate personalized recommendations
   */
  private generatePersonalizedRecommendations(profile: UserMemoryProfile): string[] {
    const recommendations: string[] = [];

    // Service recommendations based on usage history
    if (profile.serviceUsageHistory.length > 0) {
      const recentServices = profile.serviceUsageHistory
        .filter(service => {
          const daysSinceLastUse = (Date.now() - new Date(service.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastUse < 30;
        })
        .sort((a, b) => b.usageCount - a.usageCount);

      if (recentServices.length > 0) {
        recommendations.push(`Frequently used service: ${recentServices[0].serviceType}`);
      }
    }

    // Preference-based recommendations
    if (profile.preferences.communicationPreference === 'step_by_step') {
      recommendations.push('Provide detailed step-by-step guidance');
    } else if (profile.preferences.communicationPreference === 'concise') {
      recommendations.push('Keep responses brief and to the point');
    }

    // Pattern-based recommendations
    const mostFrequentPattern = profile.conversationPatterns.reduce((prev, current) => 
      prev.frequency > current.frequency ? prev : current, profile.conversationPatterns[0]
    );

    if (mostFrequentPattern) {
      recommendations.push(`Common conversation pattern: ${mostFrequentPattern.patternType}`);
    }

    return recommendations;
  }

  /**
   * Apply personalization to response
   */
  private applyPersonalization(response: string, profile: UserMemoryProfile): string {
    let personalizedResponse = response;

    // Apply interaction style
    if (profile.preferences.interactionStyle === 'professional') {
      personalizedResponse = personalizedResponse.replace(/kak/g, 'Bapak/Ibu');
    } else if (profile.preferences.interactionStyle === 'casual') {
      personalizedResponse = personalizedResponse.replace(/Bapak\/Ibu/g, 'kak');
    }

    // Apply communication preference
    if (profile.preferences.communicationPreference === 'concise') {
      // Simplify response (basic implementation)
      personalizedResponse = personalizedResponse.split('\n').slice(0, 3).join('\n');
    }

    return personalizedResponse;
  }

  // Helper methods
  private identifyPatternType(context: ConversationContextV2): ConversationPattern['patternType'] {
    if (context.conversationHistory.length === 1) return 'greeting';
    if (context.administrativeProcess) return 'process_completion';
    if (context.currentIntent.includes('inquiry')) return 'inquiry_sequence';
    return 'problem_solving';
  }

  private extractServiceType(context: ConversationContextV2): string | null {
    const entities = context.conversationHistory.flatMap(turn => turn.entities);
    const documentEntity = entities.find(entity => entity.entityType === 'document_type');
    return documentEntity?.value || null;
  }

  private determinePreferredApproach(context: ConversationContextV2): ServiceUsageRecord['preferredApproach'] {
    if (context.conversationHistory.length > 5) return 'step_by_step';
    if (context.conversationHistory.length <= 2) return 'direct_action';
    return 'overview_first';
  }

  private detectEmotionalStateFromQuery(query: string): 'formal' | 'casual' | 'neutral' {
    if (/\b(mohon|dimohon|terima kasih|hormat)\b/i.test(query)) return 'formal';
    if (/\b(gimana|kayak|dong|nih|sih)\b/i.test(query)) return 'casual';
    return 'neutral';
  }

  private generateTriggerPattern(query: string): string {
    // Simple pattern generation - extract key words
    const words = query.toLowerCase().split(' ').filter(word => word.length > 3);
    return words.slice(0, 3).join('|');
  }

  private generatePersonalizedContent(query: string, profile: UserMemoryProfile): string {
    // Generate personalized content based on user preferences
    const baseContent = `Berdasarkan preferensi Anda, berikut informasi mengenai "${query}":`;
    
    if (profile.preferences.communicationPreference === 'detailed') {
      return `${baseContent}\n\nSaya akan memberikan penjelasan lengkap sesuai dengan kebiasaan interaksi Anda sebelumnya.`;
    }
    
    return baseContent;
  }

  private extractContextualFactors(context: ConversationContextV2): string[] {
    const factors: string[] = [];
    
    factors.push(`conversation_length:${context.conversationHistory.length}`);
    factors.push(`emotional_state:${context.contextualState.emotionalState}`);
    factors.push(`complexity:${context.contextualState.complexityLevel}`);
    
    if (context.administrativeProcess) {
      factors.push(`process:${context.administrativeProcess.processType}`);
    }
    
    return factors;
  }

  private recordMemoryMetrics(processingTime: number, profile: UserMemoryProfile): void {
    this.performanceMonitor.recordMetric(
      'response_time',
      'real_time_analyzer',
      processingTime,
      'ms',
      {
        source: 'memory_enhancement',
        userId: profile.userId,
        interactionCount: profile.interactionCount,
        memoryUtilization: profile.learningMetrics.memoryUtilization,
        phase: 'phase1_priority2'
      }
    );
  }

  private async loadUserMemoryProfiles(): Promise<void> {
    try {
      console.log('📚 [MEMORY_ENHANCEMENT] Loading user memory profiles...');
      // In a real implementation, this would load from persistent storage
    } catch (error) {
      console.warn('⚠️ [MEMORY_ENHANCEMENT] Could not load user memory profiles:', error);
    }
  }

  private startMemoryMaintenance(): void {
    // Clean up old memory data every 24 hours
    setInterval(() => {
      this.cleanupOldMemoryData();
    }, 24 * 60 * 60 * 1000);
    
    console.log('🧹 [MEMORY_ENHANCEMENT] Memory maintenance started');
  }

  private cleanupOldMemoryData(): void {
    const cutoffTime = Date.now() - (this.MEMORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [userId, profile] of this.userMemoryProfiles.entries()) {
      const lastUpdateTime = new Date(profile.lastUpdated).getTime();
      if (lastUpdateTime < cutoffTime) {
        this.userMemoryProfiles.delete(userId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [MEMORY_ENHANCEMENT] Cleaned ${cleaned} old memory profiles`);
    }
  }

  /**
   * Get memory statistics
   */
  public getMemoryStatistics(): {
    totalProfiles: number;
    averageInteractions: number;
    averageSatisfaction: number;
    memoryUtilization: number;
  } {
    const profiles = Array.from(this.userMemoryProfiles.values());
    
    return {
      totalProfiles: profiles.length,
      averageInteractions: profiles.reduce((sum, p) => sum + p.interactionCount, 0) / profiles.length || 0,
      averageSatisfaction: profiles.reduce((sum, p) => sum + p.learningMetrics.averageSatisfaction, 0) / profiles.length || 0,
      memoryUtilization: profiles.reduce((sum, p) => sum + p.learningMetrics.memoryUtilization, 0) / profiles.length || 0
    };
  }

  /**
   * Get user memory profile for external access
   */
  public getUserMemoryProfileById(userId: string): UserMemoryProfile | undefined {
    return this.userMemoryProfiles.get(userId);
  }
}
