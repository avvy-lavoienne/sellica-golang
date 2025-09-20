/**
 * Enhanced Context Intelligence System for SELLY
 * Advanced conversation context tracking with user preference learning
 * and adaptive response selection based on interaction patterns
 */

export interface UserProfile {
  userId: string;
  preferences: {
    responseFormat: 'detailed' | 'concise' | 'step-by-step' | 'conversational';
    communicationStyle: 'formal' | 'casual' | 'friendly';
    preferredAddress: 'kak' | 'kakak' | 'auto';
    informationDepth: 'basic' | 'intermediate' | 'detailed';
    languageStyle: 'standard' | 'casual' | 'regional';
  };
  interactionHistory: {
    totalInteractions: number;
    commonTopics: string[];
    successfulQueries: string[];
    preferredServices: string[];
    timePatterns: Record<string, number>; // hour -> interaction count
    satisfactionScores: number[];
  };
  learningProfile: {
    understandingLevel: 'beginner' | 'intermediate' | 'advanced';
    frequentMistakes: string[];
    helpfulExplanations: string[];
    skipPatterns: string[];
  };
  contextMemory: {
    recentTopics: Array<{topic: string; timestamp: Date; relevance: number}>;
    ongoingTasks: Array<{task: string; progress: number; lastUpdate: Date}>;
    followUpNeeded: Array<{query: string; reason: string; priority: number}>;
  };
}

export interface EnhancedConversationContext {
  // Current session context
  sessionId: string;
  currentQuery: string;
  queryIntent: string;
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'confused';
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  
  // User context
  userProfile: UserProfile;
  isReturningUser: boolean;
  sessionLength: number;
  previousQueries: string[];
  
  // Temporal context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isBusinessHours: boolean;
  
  // Conversation flow
  conversationStage: 'greeting' | 'inquiry' | 'clarification' | 'resolution' | 'follow-up';
  topicContinuity: boolean;
  needsElaboration: boolean;
  
  // Adaptive elements
  responseComplexity: 'simple' | 'moderate' | 'complex';
  culturalContext: 'formal-government' | 'casual-friendly' | 'respectful-traditional';
  adaptationTriggers: string[];
}

export class EnhancedContextIntelligence {
  private userProfiles: Map<string, UserProfile> = new Map();
  private contextHistory: Map<string, EnhancedConversationContext[]> = new Map();
  private adaptationRules: Map<string, Function> = new Map();

  constructor() {
    this.initializeAdaptationRules();
  }

  /**
   * Analyze and enhance conversation context
   */
  public analyzeContext(
    query: string,
    userId?: string,
    sessionId?: string,
    previousContext?: any
  ): EnhancedConversationContext {
    
    // Get or create user profile
    const userProfile = this.getUserProfile(userId);
    
    // Analyze current query
    const queryAnalysis = this.analyzeQuery(query);
    
    // Build enhanced context
    const enhancedContext: EnhancedConversationContext = {
      sessionId: sessionId || this.generateSessionId(),
      currentQuery: query,
      queryIntent: queryAnalysis.intent,
      emotionalTone: queryAnalysis.emotionalTone,
      urgencyLevel: queryAnalysis.urgencyLevel,
      
      userProfile,
      isReturningUser: userProfile.interactionHistory.totalInteractions > 0,
      sessionLength: this.getSessionLength(sessionId),
      previousQueries: this.getPreviousQueries(sessionId, 5),
      
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
      isBusinessHours: this.isBusinessHours(),
      
      conversationStage: this.determineConversationStage(query, previousContext),
      topicContinuity: this.checkTopicContinuity(query, userProfile),
      needsElaboration: queryAnalysis.needsElaboration,
      
      responseComplexity: this.determineResponseComplexity(userProfile, queryAnalysis),
      culturalContext: this.determineCulturalContext(userProfile, queryAnalysis),
      adaptationTriggers: this.identifyAdaptationTriggers(userProfile, queryAnalysis)
    };

    // Update user profile with new interaction
    this.updateUserProfile(userId, enhancedContext);
    
    // Store context for future reference
    this.storeContext(sessionId, enhancedContext);

    return enhancedContext;
  }

  /**
   * Get adaptive response configuration based on context
   */
  public getAdaptiveResponseConfig(context: EnhancedConversationContext): {
    format: string;
    tone: string;
    depth: string;
    style: string;
    personalization: string[];
  } {
    const config = {
      format: context.userProfile.preferences.responseFormat,
      tone: context.userProfile.preferences.communicationStyle,
      depth: context.userProfile.preferences.informationDepth,
      style: context.userProfile.preferences.languageStyle,
      personalization: [] as string[]
    };

    // Apply contextual adaptations
    if (context.emotionalTone === 'frustrated') {
      config.tone = 'friendly';
      config.personalization.push('acknowledge_frustration');
    }

    if (context.urgencyLevel === 'urgent') {
      config.format = 'concise';
      config.personalization.push('prioritize_solution');
    }

    if (context.isReturningUser && context.topicContinuity) {
      config.personalization.push('reference_previous_interaction');
    }

    if (context.userProfile.learningProfile.understandingLevel === 'beginner') {
      config.depth = 'basic';
      config.personalization.push('add_explanatory_context');
    }

    return config;
  }

  /**
   * Learn from user interaction feedback
   */
  public learnFromInteraction(
    userId: string,
    query: string,
    response: string,
    userFeedback: {
      helpful: boolean;
      clarity: number; // 1-5
      completeness: number; // 1-5
      tone: number; // 1-5
    }
  ): void {
    const userProfile = this.getUserProfile(userId);
    
    // Update satisfaction scores
    const overallScore = (userFeedback.clarity + userFeedback.completeness + userFeedback.tone) / 3;
    userProfile.interactionHistory.satisfactionScores.push(overallScore);
    
    // Learn preferences from feedback
    if (userFeedback.helpful) {
      userProfile.interactionHistory.successfulQueries.push(query);
    }
    
    // Adjust preferences based on feedback patterns
    this.adjustUserPreferences(userProfile, userFeedback);
    
    // Update user profile
    this.userProfiles.set(userId, userProfile);
  }

  /**
   * Generate contextual suggestions for response enhancement
   */
  public generateContextualSuggestions(context: EnhancedConversationContext): string[] {
    const suggestions: string[] = [];
    
    // Based on user history
    if (context.userProfile.contextMemory.followUpNeeded.length > 0) {
      suggestions.push('reference_pending_tasks');
    }
    
    // Based on conversation stage
    if (context.conversationStage === 'resolution') {
      suggestions.push('offer_additional_help');
    }
    
    // Based on emotional tone
    if (context.emotionalTone === 'confused') {
      suggestions.push('provide_step_by_step_guidance');
    }
    
    // Based on time context
    if (!context.isBusinessHours) {
      suggestions.push('mention_office_hours');
    }
    
    return suggestions;
  }

  /**
   * Analyze query for intent, emotion, and complexity
   */
  private analyzeQuery(query: string): {
    intent: string;
    emotionalTone: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'confused';
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    needsElaboration: boolean;
  } {
    const lowerQuery = query.toLowerCase();
    
    // Intent analysis
    let intent = 'general_inquiry';
    if (lowerQuery.includes('ktp')) intent = 'ktp_service';
    if (lowerQuery.includes('kk')) intent = 'kk_service';
    if (lowerQuery.includes('akta')) intent = 'akta_service';
    if (lowerQuery.includes('data') || lowerQuery.includes('berapa')) intent = 'data_inquiry';
    
    // Emotional tone analysis
    let emotionalTone: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'confused' = 'neutral';
    if (lowerQuery.includes('bingung') || lowerQuery.includes('tidak tahu')) emotionalTone = 'confused';
    if (lowerQuery.includes('susah') || lowerQuery.includes('ribet')) emotionalTone = 'frustrated';
    if (lowerQuery.includes('terima kasih') || lowerQuery.includes('bagus')) emotionalTone = 'positive';
    
    // Urgency analysis
    let urgencyLevel: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (lowerQuery.includes('urgent') || lowerQuery.includes('segera')) urgencyLevel = 'urgent';
    if (lowerQuery.includes('cepat') || lowerQuery.includes('hari ini')) urgencyLevel = 'high';
    
    // Elaboration needs
    const needsElaboration = lowerQuery.length < 10 || 
                           lowerQuery.split(' ').length < 3 ||
                           lowerQuery.includes('gimana') ||
                           lowerQuery.includes('bagaimana');
    
    return { intent, emotionalTone, urgencyLevel, needsElaboration };
  }

  /**
   * Get or create user profile
   */
  private getUserProfile(userId?: string): UserProfile {
    if (!userId) {
      return this.createDefaultProfile('anonymous');
    }
    
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, this.createDefaultProfile(userId));
    }
    
    return this.userProfiles.get(userId)!;
  }

  /**
   * Create default user profile
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        responseFormat: 'conversational',
        communicationStyle: 'friendly',
        preferredAddress: 'auto',
        informationDepth: 'intermediate',
        languageStyle: 'standard'
      },
      interactionHistory: {
        totalInteractions: 0,
        commonTopics: [],
        successfulQueries: [],
        preferredServices: [],
        timePatterns: {},
        satisfactionScores: []
      },
      learningProfile: {
        understandingLevel: 'intermediate',
        frequentMistakes: [],
        helpfulExplanations: [],
        skipPatterns: []
      },
      contextMemory: {
        recentTopics: [],
        ongoingTasks: [],
        followUpNeeded: []
      }
    };
  }

  /**
   * Initialize adaptation rules
   */
  private initializeAdaptationRules(): void {
    // Add adaptation rules for different scenarios
    this.adaptationRules.set('frustrated_user', (context: EnhancedConversationContext) => {
      return {
        tone: 'empathetic',
        format: 'step-by-step',
        personalization: ['acknowledge_difficulty', 'offer_personal_assistance']
      };
    });
    
    this.adaptationRules.set('returning_user', (context: EnhancedConversationContext) => {
      return {
        personalization: ['welcome_back', 'reference_previous_interaction']
      };
    });
  }

  // Helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 15; // Mon-Fri 8AM-3PM
  }

  private getSessionLength(sessionId?: string): number {
    if (!sessionId) return 0;
    const contexts = this.contextHistory.get(sessionId) || [];
    return contexts.length;
  }

  private getPreviousQueries(sessionId?: string, limit: number = 5): string[] {
    if (!sessionId) return [];
    const contexts = this.contextHistory.get(sessionId) || [];
    return contexts.slice(-limit).map(ctx => ctx.currentQuery);
  }

  private determineConversationStage(query: string, previousContext?: any): 'greeting' | 'inquiry' | 'clarification' | 'resolution' | 'follow-up' {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('halo') || lowerQuery.includes('hai')) return 'greeting';
    if (lowerQuery.includes('terima kasih') || lowerQuery.includes('sudah jelas')) return 'resolution';
    if (lowerQuery.includes('maksudnya') || lowerQuery.includes('bisa dijelaskan')) return 'clarification';
    if (previousContext && lowerQuery.includes('lalu')) return 'follow-up';
    
    return 'inquiry';
  }

  private checkTopicContinuity(query: string, userProfile: UserProfile): boolean {
    const recentTopics = userProfile.contextMemory.recentTopics;
    if (recentTopics.length === 0) return false;
    
    const currentTopic = this.extractTopic(query);
    const lastTopic = recentTopics[recentTopics.length - 1]?.topic;
    
    return currentTopic === lastTopic;
  }

  private extractTopic(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('ktp')) return 'ktp';
    if (lowerQuery.includes('kk')) return 'kk';
    if (lowerQuery.includes('akta')) return 'akta';
    if (lowerQuery.includes('data')) return 'data';
    return 'general';
  }

  private determineResponseComplexity(userProfile: UserProfile, queryAnalysis: any): 'simple' | 'moderate' | 'complex' {
    if (userProfile.learningProfile.understandingLevel === 'beginner') return 'simple';
    if (queryAnalysis.needsElaboration) return 'simple';
    if (userProfile.preferences.informationDepth === 'detailed') return 'complex';
    return 'moderate';
  }

  private determineCulturalContext(userProfile: UserProfile, queryAnalysis: any): 'formal-government' | 'casual-friendly' | 'respectful-traditional' {
    if (userProfile.preferences.communicationStyle === 'formal') return 'formal-government';
    if (queryAnalysis.emotionalTone === 'frustrated') return 'respectful-traditional';
    return 'casual-friendly';
  }

  private identifyAdaptationTriggers(userProfile: UserProfile, queryAnalysis: any): string[] {
    const triggers: string[] = [];
    
    if (queryAnalysis.emotionalTone === 'frustrated') triggers.push('frustrated_user');
    if (userProfile.interactionHistory.totalInteractions > 0) triggers.push('returning_user');
    if (queryAnalysis.urgencyLevel === 'urgent') triggers.push('urgent_request');
    
    return triggers;
  }

  private updateUserProfile(userId?: string, context?: EnhancedConversationContext): void {
    if (!userId || !context) return;
    
    const profile = this.getUserProfile(userId);
    profile.interactionHistory.totalInteractions++;
    
    // Update recent topics
    const topic = this.extractTopic(context.currentQuery);
    profile.contextMemory.recentTopics.push({
      topic,
      timestamp: new Date(),
      relevance: 1.0
    });
    
    // Keep only last 10 topics
    if (profile.contextMemory.recentTopics.length > 10) {
      profile.contextMemory.recentTopics = profile.contextMemory.recentTopics.slice(-10);
    }
    
    this.userProfiles.set(userId, profile);
  }

  private storeContext(sessionId?: string, context?: EnhancedConversationContext): void {
    if (!sessionId || !context) return;
    
    if (!this.contextHistory.has(sessionId)) {
      this.contextHistory.set(sessionId, []);
    }
    
    this.contextHistory.get(sessionId)!.push(context);
  }

  private adjustUserPreferences(userProfile: UserProfile, feedback: any): void {
    // Adjust preferences based on feedback patterns
    if (feedback.clarity < 3) {
      // User finds responses unclear, prefer simpler format
      if (userProfile.preferences.responseFormat === 'detailed') {
        userProfile.preferences.responseFormat = 'step-by-step';
      }
    }
    
    if (feedback.completeness < 3) {
      // User wants more information
      if (userProfile.preferences.informationDepth === 'basic') {
        userProfile.preferences.informationDepth = 'intermediate';
      }
    }
  }
}
