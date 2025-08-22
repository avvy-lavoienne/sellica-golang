/**
 * Session Continuity Manager
 * Phase 2: Intelligence Enhancement - Cross-Session Conversation Awareness
 * 
 * Manages conversation continuity across sessions, preventing repetitive
 * greetings and maintaining context awareness for returning users.
 * 
 * Created: 2025-08-13
 * Version: 2.0
 * Compliance: WCAG 2.1 AA, Privacy Protection
 */

import { EnhancedUserContextService, EnhancedUserContext } from './enhancedUserContextService';
import { EnhancedChatStorageService } from './enhancedChatStorageService';

export interface SessionContinuityContext {
  userId?: string;
  currentSessionId: string;
  previousSessionId?: string;
  sessionGap: number; // minutes since last session
  conversationState: {
    lastTopic?: string;
    lastInteractionType: 'greeting' | 'inquiry' | 'assistance' | 'resolution';
    unfinishedBusiness?: string;
    followUpRequired?: boolean;
  };
  userBehaviorPattern: {
    typicalSessionDuration: number; // minutes
    averageMessageCount: number;
    preferredInteractionStyle: 'quick' | 'detailed' | 'exploratory';
    returnFrequency: 'frequent' | 'occasional' | 'rare';
  };
  continuityScore: number; // 0-1, how much continuity to apply
}

export interface ContinuityDecision {
  shouldGreet: boolean;
  greetingType: 'full' | 'brief' | 'acknowledgment' | 'none';
  contextualOpener?: string;
  suggestedContinuation?: string;
  reasoning: string;
}

export interface SessionTransition {
  fromSessionId?: string;
  toSessionId: string;
  transitionType: 'new' | 'continuation' | 'return' | 'reconnection';
  contextCarryOver: {
    topics: string[];
    preferences: any;
    unfinishedTasks: string[];
  };
}

/**
 * Session Continuity Manager
 * Provides intelligent session continuity and context awareness
 */
export class SessionContinuityManager {
  private static instance: SessionContinuityManager;
  private userContextService: EnhancedUserContextService;
  private chatStorageService: EnhancedChatStorageService;
  private continuityCache = new Map<string, SessionContinuityContext>();
  private readonly CONTINUITY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // Continuity thresholds
  private readonly IMMEDIATE_CONTINUATION_THRESHOLD = 5; // minutes
  private readonly BRIEF_GREETING_THRESHOLD = 30; // minutes
  private readonly CONTEXT_AWARENESS_THRESHOLD = 120; // minutes (2 hours)
  private readonly FULL_GREETING_THRESHOLD = 1440; // minutes (24 hours)

  public static getInstance(): SessionContinuityManager {
    if (!SessionContinuityManager.instance) {
      SessionContinuityManager.instance = new SessionContinuityManager();
    }
    return SessionContinuityManager.instance;
  }

  constructor() {
    this.userContextService = EnhancedUserContextService.getInstance();
    this.chatStorageService = EnhancedChatStorageService.getInstance();
  }

  /**
   * Analyze session continuity and make greeting decision
   */
  public async analyzeContinuity(
    currentSessionId: string,
    userId?: string
  ): Promise<ContinuityDecision> {
    try {
      // Get continuity context
      const continuityContext = await this.buildContinuityContext(currentSessionId, userId);
      
      // Make continuity decision
      const decision = this.makeContinuityDecision(continuityContext);
      
      // Cache the context for future use
      if (userId) {
        this.setContinuityCache(userId, continuityContext);
      }

      console.log(`✅ [SESSION_CONTINUITY] Decision for session ${currentSessionId}:`, decision.reasoning);
      
      return decision;

    } catch (error) {
      console.error('❌ [SESSION_CONTINUITY] Failed to analyze continuity:', error);
      return this.getDefaultContinuityDecision();
    }
  }

  /**
   * Handle session transition and context carry-over
   */
  public async handleSessionTransition(
    fromSessionId: string | undefined,
    toSessionId: string,
    userId?: string
  ): Promise<SessionTransition> {
    try {
      let transitionType: SessionTransition['transitionType'] = 'new';
      const contextCarryOver = {
        topics: [] as string[],
        preferences: {},
        unfinishedTasks: [] as string[]
      };

      if (fromSessionId && userId) {
        // Get previous session context
        const previousSession = await this.chatStorageService.getSession(fromSessionId);
        const previousMessages = await this.chatStorageService.getConversationHistory(fromSessionId, 10);
        
        if (previousSession && previousMessages.length > 0) {
          const sessionGap = this.calculateSessionGap(previousSession.lastInteraction);
          
          // Determine transition type
          if (sessionGap < this.IMMEDIATE_CONTINUATION_THRESHOLD) {
            transitionType = 'continuation';
          } else if (sessionGap < this.CONTEXT_AWARENESS_THRESHOLD) {
            transitionType = 'return';
          } else {
            transitionType = 'reconnection';
          }

          // Extract context to carry over
          contextCarryOver.topics = this.extractTopicsFromMessages(previousMessages);
          contextCarryOver.preferences = previousSession.userPreferences || {};
          contextCarryOver.unfinishedTasks = this.identifyUnfinishedTasks(previousMessages);
        }
      }

      // Update new session with carried-over context
      if (contextCarryOver.topics.length > 0 || Object.keys(contextCarryOver.preferences).length > 0) {
        await this.chatStorageService.updateSession(toSessionId, {
          conversationContext: {
            carriedOverTopics: contextCarryOver.topics,
            previousSessionId: fromSessionId,
            transitionType,
            transitionTime: new Date().toISOString()
          },
          userPreferences: {
            ...contextCarryOver.preferences,
            continuityApplied: true
          }
        });
      }

      console.log(`✅ [SESSION_CONTINUITY] Session transition: ${transitionType}`);

      return {
        fromSessionId,
        toSessionId,
        transitionType,
        contextCarryOver
      };

    } catch (error) {
      console.error('❌ [SESSION_CONTINUITY] Failed to handle session transition:', error);
      return {
        toSessionId,
        transitionType: 'new',
        contextCarryOver: {
          topics: [],
          preferences: {},
          unfinishedTasks: []
        }
      };
    }
  }

  /**
   * Generate contextual conversation opener based on continuity
   */
  public generateContextualOpener(
    continuityContext: SessionContinuityContext,
    decision: ContinuityDecision
  ): string {
    const { conversationState, sessionGap, userBehaviorPattern } = continuityContext;
    const userProfile = continuityContext.userId ? 'authenticated' : 'guest';

    // Immediate continuation (< 5 minutes) - but still allow persona greetings
    if (sessionGap < this.IMMEDIATE_CONTINUATION_THRESHOLD) {
      if (conversationState.unfinishedBusiness) {
        return `Melanjutkan pembahasan tentang ${conversationState.unfinishedBusiness}...`;
      }
      // Return null to let PersonaService handle the greeting properly
      return '';
    }

    // Brief return (5-30 minutes)
    if (sessionGap < this.BRIEF_GREETING_THRESHOLD) {
      const name = continuityContext.userId ? 'Kak' : '';
      if (conversationState.lastTopic) {
        return `Halo lagi${name ? ` ${name}` : ''}! Masih ada yang ingin ditanyakan tentang ${conversationState.lastTopic}?`;
      }
      return `Halo lagi${name ? ` ${name}` : ''}! Ada yang bisa dibantu lagi?`;
    }

    // Context-aware return (30 minutes - 2 hours)
    if (sessionGap < this.CONTEXT_AWARENESS_THRESHOLD) {
      if (conversationState.followUpRequired) {
        return 'Selamat datang kembali! Apakah ada perkembangan dari yang tadi kita bahas?';
      }
      if (conversationState.lastTopic) {
        return `Selamat datang kembali! Sebelumnya kita membahas ${conversationState.lastTopic}. Ada yang ingin dilanjutkan?`;
      }
      return 'Selamat datang kembali! Ada yang bisa dibantu hari ini?';
    }

    // Full greeting for longer gaps
    return '';
  }

  /**
   * Build comprehensive continuity context
   */
  private async buildContinuityContext(
    currentSessionId: string,
    userId?: string
  ): Promise<SessionContinuityContext> {
    // Check cache first
    if (userId) {
      const cached = this.getContinuityCache(userId);
      if (cached && cached.currentSessionId !== currentSessionId) {
        // Update for new session
        cached.previousSessionId = cached.currentSessionId;
        cached.currentSessionId = currentSessionId;
        return cached;
      }
    }

    // Build fresh context
    let userContext: EnhancedUserContext | null = null;
    let previousSessionId: string | undefined;
    let sessionGap = 0;
    let conversationState: {
      lastTopic?: string;
      lastInteractionType: 'greeting' | 'inquiry' | 'assistance' | 'resolution';
      unfinishedBusiness?: string;
      followUpRequired?: boolean;
    } = {
      lastInteractionType: 'greeting'
    };
    let userBehaviorPattern: {
      typicalSessionDuration: number;
      averageMessageCount: number;
      preferredInteractionStyle: 'quick' | 'detailed' | 'exploratory';
      returnFrequency: 'frequent' | 'occasional' | 'rare';
    } = {
      typicalSessionDuration: 15,
      averageMessageCount: 5,
      preferredInteractionStyle: 'detailed',
      returnFrequency: 'occasional'
    };

    if (userId) {
      // Get enhanced user context
      userContext = await this.userContextService.getEnhancedUserContext(userId);
      
      if (userContext.lastInteraction) {
        sessionGap = this.calculateSessionGap(userContext.lastInteraction);
      }

      // Analyze user behavior pattern
      userBehaviorPattern = await this.analyzeUserBehaviorPattern(userId);
      
      // Get conversation state from recent history
      conversationState = await this.analyzeConversationState(userId);
    }

    // Calculate continuity score
    const continuityScore = this.calculateContinuityScore(sessionGap, userBehaviorPattern);

    return {
      userId,
      currentSessionId,
      previousSessionId,
      sessionGap,
      conversationState,
      userBehaviorPattern,
      continuityScore
    };
  }

  /**
   * Make continuity decision based on context
   */
  private makeContinuityDecision(context: SessionContinuityContext): ContinuityDecision {
    const { sessionGap, continuityScore, conversationState, userBehaviorPattern } = context;

    // Immediate continuation - allow brief acknowledgment to maintain SELLY persona
    if (sessionGap < this.IMMEDIATE_CONTINUATION_THRESHOLD) {
      return {
        shouldGreet: true,
        greetingType: 'acknowledgment',
        contextualOpener: this.generateContextualOpener(context, {} as ContinuityDecision),
        suggestedContinuation: conversationState.unfinishedBusiness,
        reasoning: `Immediate continuation (${sessionGap}min gap) - brief acknowledgment to maintain persona`
      };
    }

    // Brief acknowledgment for short gaps
    if (sessionGap < this.BRIEF_GREETING_THRESHOLD) {
      return {
        shouldGreet: true,
        greetingType: 'acknowledgment',
        contextualOpener: this.generateContextualOpener(context, {} as ContinuityDecision),
        reasoning: `Brief return (${sessionGap}min gap) - acknowledgment greeting`
      };
    }

    // Context-aware greeting for medium gaps
    if (sessionGap < this.CONTEXT_AWARENESS_THRESHOLD && continuityScore > 0.5) {
      return {
        shouldGreet: true,
        greetingType: 'brief',
        contextualOpener: this.generateContextualOpener(context, {} as ContinuityDecision),
        reasoning: `Context-aware return (${sessionGap}min gap, score: ${continuityScore.toFixed(2)})`
      };
    }

    // Full greeting for long gaps or low continuity
    return {
      shouldGreet: true,
      greetingType: 'full',
      reasoning: `Full greeting needed (${sessionGap}min gap, score: ${continuityScore.toFixed(2)})`
    };
  }

  /**
   * Calculate session gap in minutes
   */
  private calculateSessionGap(lastInteraction: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - lastInteraction.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Calculate continuity score (0-1)
   */
  private calculateContinuityScore(
    sessionGap: number,
    behaviorPattern: SessionContinuityContext['userBehaviorPattern']
  ): number {
    let score = 1.0;

    // Reduce score based on time gap
    if (sessionGap > this.IMMEDIATE_CONTINUATION_THRESHOLD) {
      score *= Math.exp(-sessionGap / 60); // Exponential decay over hours
    }

    // Adjust based on user behavior
    if (behaviorPattern.returnFrequency === 'frequent') {
      score *= 1.2; // Boost for frequent users
    } else if (behaviorPattern.returnFrequency === 'rare') {
      score *= 0.8; // Reduce for rare users
    }

    // Adjust based on interaction style
    if (behaviorPattern.preferredInteractionStyle === 'exploratory') {
      score *= 1.1; // Boost for exploratory users
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Analyze user behavior pattern from history
   */
  private async analyzeUserBehaviorPattern(
    userId: string
  ): Promise<{
    typicalSessionDuration: number;
    averageMessageCount: number;
    preferredInteractionStyle: 'quick' | 'detailed' | 'exploratory';
    returnFrequency: 'frequent' | 'occasional' | 'rare';
  }> {
    try {
      const userContext = await this.userContextService.getEnhancedUserContext(userId);
      const conversationCount = userContext.userProfile.conversationCount;

      // Determine return frequency
      let returnFrequency: 'frequent' | 'occasional' | 'rare' = 'occasional';
      if (conversationCount > 20) {
        returnFrequency = 'frequent';
      } else if (conversationCount < 5) {
        returnFrequency = 'rare';
      }

      return {
        typicalSessionDuration: 15, // Default, could be calculated from history
        averageMessageCount: Math.max(conversationCount / 3, 3),
        preferredInteractionStyle: conversationCount > 10 ? 'exploratory' : 'detailed',
        returnFrequency
      };

    } catch (error) {
      console.warn('⚠️ [SESSION_CONTINUITY] Failed to analyze behavior pattern:', error);
      return {
        typicalSessionDuration: 15,
        averageMessageCount: 5,
        preferredInteractionStyle: 'detailed',
        returnFrequency: 'occasional'
      };
    }
  }

  /**
   * Analyze conversation state from recent interactions
   */
  private async analyzeConversationState(
    userId: string
  ): Promise<SessionContinuityContext['conversationState']> {
    try {
      const userContext = await this.userContextService.getEnhancedUserContext(userId);
      const recentHistory = userContext.conversationHistory.slice(0, 5);

      if (recentHistory.length === 0) {
        return { lastInteractionType: 'greeting' };
      }

      const lastMessage = recentHistory[0];
      const lastTopic = this.extractTopicFromMessage(lastMessage.content);
      
      return {
        lastTopic,
        lastInteractionType: this.classifyInteractionType(lastMessage.content),
        unfinishedBusiness: this.identifyUnfinishedBusiness(recentHistory),
        followUpRequired: this.checkFollowUpRequired(recentHistory)
      };

    } catch (error) {
      console.warn('⚠️ [SESSION_CONTINUITY] Failed to analyze conversation state:', error);
      return { lastInteractionType: 'greeting' };
    }
  }

  /**
   * Helper methods for context analysis
   */
  private extractTopicsFromMessages(messages: any[]): string[] {
    const topics: string[] = [];
    const keywords = ['ktp', 'kartu keluarga', 'akta', 'nikah', 'cerai', 'pindah', 'domisili'];
    
    for (const message of messages) {
      for (const keyword of keywords) {
        if (message.content.toLowerCase().includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword);
        }
      }
    }
    
    return topics.slice(0, 3); // Limit to 3 topics
  }

  private identifyUnfinishedTasks(messages: any[]): string[] {
    const tasks: string[] = [];
    const indicators = ['perlu', 'harus', 'belum', 'akan', 'nanti'];
    
    for (const message of messages) {
      for (const indicator of indicators) {
        if (message.content.toLowerCase().includes(indicator)) {
          tasks.push(message.content.substring(0, 50) + '...');
          break;
        }
      }
    }
    
    return tasks.slice(0, 2); // Limit to 2 tasks
  }

  private extractTopicFromMessage(content: string): string | undefined {
    const keywords = ['ktp', 'kartu keluarga', 'akta', 'nikah', 'cerai', 'pindah', 'domisili'];
    
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }
    
    return undefined;
  }

  private classifyInteractionType(content: string): 'greeting' | 'inquiry' | 'assistance' | 'resolution' {
    if (content.toLowerCase().includes('halo') || content.toLowerCase().includes('hai')) {
      return 'greeting';
    }
    if (content.includes('?')) {
      return 'inquiry';
    }
    if (content.toLowerCase().includes('terima kasih') || content.toLowerCase().includes('selesai')) {
      return 'resolution';
    }
    return 'assistance';
  }

  private identifyUnfinishedBusiness(messages: any[]): string | undefined {
    for (const message of messages) {
      if (message.content.toLowerCase().includes('belum') || 
          message.content.toLowerCase().includes('nanti') ||
          message.content.toLowerCase().includes('akan')) {
        return message.content.substring(0, 30) + '...';
      }
    }
    return undefined;
  }

  private checkFollowUpRequired(messages: any[]): boolean {
    return messages.some(msg => 
      msg.content.toLowerCase().includes('follow up') ||
      msg.content.toLowerCase().includes('lanjut') ||
      msg.content.toLowerCase().includes('nanti')
    );
  }

  private getDefaultContinuityDecision(): ContinuityDecision {
    return {
      shouldGreet: true,
      greetingType: 'full',
      reasoning: 'Default decision due to analysis failure'
    };
  }

  /**
   * Cache management
   */
  private getContinuityCache(userId: string): SessionContinuityContext | null {
    const cached = this.continuityCache.get(userId);
    if (!cached) return null;

    // Check if cache is still valid
    const now = Date.now();
    if (now - (cached as any).timestamp > this.CONTINUITY_CACHE_TTL) {
      this.continuityCache.delete(userId);
      return null;
    }

    return cached;
  }

  private setContinuityCache(userId: string, context: SessionContinuityContext): void {
    (context as any).timestamp = Date.now();
    this.continuityCache.set(userId, context);
  }

  /**
   * Clear cache
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.continuityCache.delete(userId);
    } else {
      this.continuityCache.clear();
    }
  }
}
