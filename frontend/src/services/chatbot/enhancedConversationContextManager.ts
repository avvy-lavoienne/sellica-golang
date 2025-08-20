/**
 * Enhanced Conversation Context Manager
 * Phase 2: Intelligence Enhancement - Personalized Responses & Conversation Persistence
 * 
 * Manages conversation context, memory, and personalization for intelligent
 * multi-turn conversations with user preference adaptation.
 * 
 * Created: 2025-08-13
 * Version: 2.0
 * Compliance: WCAG 2.1 AA, Indonesian Cultural Context
 */

import { EnhancedUserContext, EnhancedUserContextService } from './enhancedUserContextService';
import { EnhancedChatStorageService, ConversationMessage } from './enhancedChatStorageService';

export interface ConversationMemory {
  recentTopics: string[];
  userPreferences: {
    preferredResponseStyle: 'formal' | 'friendly' | 'concise' | 'detailed';
    frequentQuestions: string[];
    documentTypes: string[];
    interactionPatterns: {
      timeOfDay: string;
      sessionDuration: number;
      messageFrequency: number;
    };
  };
  contextualHistory: {
    lastDocumentInquiry?: string;
    lastAdministrativeAction?: string;
    ongoingProcess?: string;
    followUpNeeded?: boolean;
  };
  conversationFlow: {
    currentStage: 'greeting' | 'inquiry' | 'assistance' | 'resolution' | 'followup';
    previousStage?: string;
    stageTransitionTime: Date;
    expectedNextAction?: string;
  };
}

export interface PersonalizedContext {
  userId?: string;
  sessionId: string;
  userProfile?: {
    nama_lengkap: string;
    role: string;
    preferredAddress: string;
  };
  conversationMemory: ConversationMemory;
  currentSession: {
    startTime: Date;
    messageCount: number;
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'frustrated' | 'satisfied';
  };
  adaptiveSettings: {
    responseVerbosity: number; // 0.1-1.0
    formalityLevel: number; // 0.1-1.0
    technicalDetail: number; // 0.1-1.0
    culturalSensitivity: number; // 0.1-1.0
  };
}

export interface ContextualResponse {
  content: string;
  personalizationApplied: boolean;
  contextFactors: {
    userHistory: boolean;
    conversationFlow: boolean;
    preferences: boolean;
    culturalAdaptation: boolean;
  };
  suggestedFollowUp?: string[];
  memoryUpdates?: Partial<ConversationMemory>;
}

/**
 * Enhanced Conversation Context Manager
 * Provides intelligent conversation context and personalization
 */
export class EnhancedConversationContextManager {
  private static instance: EnhancedConversationContextManager;
  private userContextService: EnhancedUserContextService;
  private chatStorageService: EnhancedChatStorageService;
  private contextCache = new Map<string, { context: PersonalizedContext; timestamp: number }>();
  private readonly CONTEXT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  public static getInstance(): EnhancedConversationContextManager {
    if (!EnhancedConversationContextManager.instance) {
      EnhancedConversationContextManager.instance = new EnhancedConversationContextManager();
    }
    return EnhancedConversationContextManager.instance;
  }

  constructor() {
    this.userContextService = EnhancedUserContextService.getInstance();
    this.chatStorageService = EnhancedChatStorageService.getInstance();
  }

  /**
   * Get comprehensive personalized context for conversation
   */
  public async getPersonalizedContext(
    sessionId: string,
    userId?: string
  ): Promise<PersonalizedContext> {
    try {
      // Check cache first
      const cached = this.getCachedContext(sessionId);
      if (cached) {
        return cached;
      }

      // Build personalized context
      const context = await this.buildPersonalizedContext(sessionId, userId);
      
      // Cache the result
      this.setCachedContext(sessionId, context);
      
      return context;

    } catch (error) {
      console.error('❌ [ENHANCED_CONTEXT] Failed to get personalized context:', error);
      return this.getDefaultPersonalizedContext(sessionId, userId);
    }
  }

  /**
   * Apply personalization to response based on context
   */
  public async personalizeResponse(
    originalResponse: string,
    context: PersonalizedContext,
    query: string
  ): Promise<ContextualResponse> {
    try {
      let personalizedContent = originalResponse;
      const contextFactors = {
        userHistory: false,
        conversationFlow: false,
        preferences: false,
        culturalAdaptation: false
      };

      // Apply user profile personalization
      if (context.userProfile) {
        personalizedContent = this.applyUserProfilePersonalization(
          personalizedContent,
          context.userProfile
        );
        contextFactors.userHistory = true;
      }

      // Apply conversation flow awareness
      personalizedContent = this.applyConversationFlowPersonalization(
        personalizedContent,
        context.conversationMemory.conversationFlow,
        query
      );
      contextFactors.conversationFlow = true;

      // Apply user preferences
      personalizedContent = this.applyUserPreferences(
        personalizedContent,
        context.conversationMemory.userPreferences,
        context.adaptiveSettings
      );
      contextFactors.preferences = true;

      // Apply cultural adaptation
      personalizedContent = this.applyCulturalAdaptation(
        personalizedContent,
        context.adaptiveSettings.culturalSensitivity
      );
      contextFactors.culturalAdaptation = true;

      // Generate follow-up suggestions
      const suggestedFollowUp = this.generateFollowUpSuggestions(context, query);

      // Prepare memory updates
      const memoryUpdates = this.prepareMemoryUpdates(context, query, originalResponse);

      return {
        content: personalizedContent,
        personalizationApplied: true,
        contextFactors,
        suggestedFollowUp,
        memoryUpdates
      };

    } catch (error) {
      console.error('❌ [ENHANCED_CONTEXT] Personalization failed:', error);
      return {
        content: originalResponse,
        personalizationApplied: false,
        contextFactors: {
          userHistory: false,
          conversationFlow: false,
          preferences: false,
          culturalAdaptation: false
        }
      };
    }
  }

  /**
   * Update conversation memory with new interaction
   */
  public async updateConversationMemory(
    sessionId: string,
    memoryUpdates: Partial<ConversationMemory>
  ): Promise<void> {
    try {
      const context = await this.getPersonalizedContext(sessionId);
      
      // Merge memory updates
      context.conversationMemory = {
        ...context.conversationMemory,
        ...memoryUpdates,
        recentTopics: [
          ...(memoryUpdates.recentTopics || []),
          ...context.conversationMemory.recentTopics
        ].slice(0, 10), // Keep last 10 topics
      };

      // Update session metadata in storage
      await this.chatStorageService.updateSession(sessionId, {
        conversationContext: {
          memory: context.conversationMemory,
          lastUpdate: new Date().toISOString()
        }
      });

      // Update cache
      this.setCachedContext(sessionId, context);

      console.log('✅ [ENHANCED_CONTEXT] Conversation memory updated');

    } catch (error) {
      console.error('❌ [ENHANCED_CONTEXT] Failed to update memory:', error);
    }
  }

  /**
   * Build comprehensive personalized context
   */
  private async buildPersonalizedContext(
    sessionId: string,
    userId?: string
  ): Promise<PersonalizedContext> {
    // Get user context if available
    const userContext = userId 
      ? await this.userContextService.getEnhancedUserContext(userId)
      : null;

    // Get conversation history
    const conversationHistory = await this.chatStorageService.getConversationHistory(sessionId, 20);

    // Get session information
    const sessionInfo = await this.chatStorageService.getSession(sessionId);

    // Build conversation memory from history
    const conversationMemory = this.buildConversationMemoryFromHistory(
      conversationHistory,
      userContext
    );

    // Determine adaptive settings
    const adaptiveSettings = this.calculateAdaptiveSettings(
      userContext,
      conversationHistory,
      conversationMemory
    );

    // Build current session context
    const currentSession = {
      startTime: sessionInfo?.createdAt || new Date(),
      messageCount: conversationHistory.length,
      topics: this.extractTopicsFromHistory(conversationHistory),
      sentiment: this.analyzeSentimentFromHistory(conversationHistory)
    };

    return {
      userId,
      sessionId,
      userProfile: userContext?.userProfile ? {
        nama_lengkap: userContext.userProfile.nama_lengkap,
        role: userContext.userProfile.role,
        preferredAddress: this.determinePreferredAddress(userContext.userProfile)
      } : undefined,
      conversationMemory,
      currentSession,
      adaptiveSettings
    };
  }

  /**
   * Apply user profile personalization to response
   */
  private applyUserProfilePersonalization(
    content: string,
    userProfile: { nama_lengkap: string; role: string; preferredAddress: string }
  ): string {
    // Replace generic addresses with personalized ones
    let personalizedContent = content
      .replace(/\bKak\b/g, userProfile.preferredAddress)
      .replace(/\bPengguna\b/g, userProfile.nama_lengkap);

    // Add personalized touches for specific roles
    if (userProfile.role === 'admin' || userProfile.role === 'supervisor') {
      personalizedContent = personalizedContent.replace(
        /Saya SELLY/g,
        `Saya SELLY, siap membantu ${userProfile.preferredAddress} ${userProfile.nama_lengkap}`
      );
    }

    return personalizedContent;
  }

  /**
   * Apply conversation flow personalization
   */
  private applyConversationFlowPersonalization(
    content: string,
    conversationFlow: ConversationMemory['conversationFlow'],
    query: string
  ): string {
    let enhancedContent = content;

    // Add flow-aware context
    switch (conversationFlow.currentStage) {
      case 'followup':
        if (!content.includes('lanjut') && !content.includes('follow')) {
          enhancedContent = `Melanjutkan dari pertanyaan sebelumnya, ${enhancedContent.toLowerCase()}`;
        }
        break;
      case 'resolution':
        if (conversationFlow.expectedNextAction) {
          enhancedContent += `\n\n💡 **Langkah selanjutnya**: ${conversationFlow.expectedNextAction}`;
        }
        break;
    }

    return enhancedContent;
  }

  /**
   * Apply user preferences to response
   */
  private applyUserPreferences(
    content: string,
    preferences: ConversationMemory['userPreferences'],
    adaptiveSettings: PersonalizedContext['adaptiveSettings']
  ): string {
    let adaptedContent = content;

    // Adjust verbosity based on preferences
    if (preferences.preferredResponseStyle === 'concise' && adaptiveSettings.responseVerbosity < 0.5) {
      // Simplify response for concise preference
      adaptedContent = this.simplifyResponse(adaptedContent);
    } else if (preferences.preferredResponseStyle === 'detailed' && adaptiveSettings.responseVerbosity > 0.7) {
      // Add more detail for detailed preference
      adaptedContent = this.enhanceResponseDetail(adaptedContent);
    }

    return adaptedContent;
  }

  /**
   * Apply cultural adaptation to response
   */
  private applyCulturalAdaptation(
    content: string,
    culturalSensitivity: number
  ): string {
    if (culturalSensitivity > 0.8) {
      // High cultural sensitivity - add Indonesian formal elements
      return content
        .replace(/\bterima kasih\b/gi, 'terima kasih banyak')
        .replace(/\bmaaf\b/gi, 'mohon maaf');
    }
    
    return content;
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateFollowUpSuggestions(
    context: PersonalizedContext,
    query: string
  ): string[] {
    const suggestions: string[] = [];

    // Based on conversation stage
    switch (context.conversationMemory.conversationFlow.currentStage) {
      case 'inquiry':
        suggestions.push('Apakah ada dokumen lain yang perlu ditanyakan?');
        suggestions.push('Butuh informasi tentang prosedur selanjutnya?');
        break;
      case 'assistance':
        suggestions.push('Apakah penjelasan ini sudah cukup jelas?');
        suggestions.push('Ada hal lain yang perlu dibantu?');
        break;
    }

    // Based on user history
    if (context.conversationMemory.userPreferences.frequentQuestions.length > 0) {
      const lastFrequentTopic = context.conversationMemory.userPreferences.frequentQuestions[0];
      if (!query.toLowerCase().includes(lastFrequentTopic.toLowerCase())) {
        suggestions.push(`Mungkin juga butuh info tentang ${lastFrequentTopic}?`);
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Prepare memory updates based on interaction
   */
  private prepareMemoryUpdates(
    context: PersonalizedContext,
    query: string,
    response: string
  ): Partial<ConversationMemory> {
    const updates: Partial<ConversationMemory> = {};

    // Extract topics from query
    const extractedTopics = this.extractTopicsFromText(query);
    if (extractedTopics.length > 0) {
      updates.recentTopics = extractedTopics;
    }

    // Update conversation flow
    const newStage = this.determineConversationStage(query, response);
    if (newStage !== context.conversationMemory.conversationFlow.currentStage) {
      updates.conversationFlow = {
        ...context.conversationMemory.conversationFlow,
        previousStage: context.conversationMemory.conversationFlow.currentStage,
        currentStage: newStage,
        stageTransitionTime: new Date()
      };
    }

    return updates;
  }

  /**
   * Helper methods for context building and analysis
   */
  private buildConversationMemoryFromHistory(
    history: ConversationMessage[],
    userContext: EnhancedUserContext | null
  ): ConversationMemory {
    const recentTopics = this.extractTopicsFromHistory(history);
    const userMessages = history.filter(msg => msg.type === 'user');
    
    return {
      recentTopics,
      userPreferences: {
        preferredResponseStyle: this.inferResponseStyle(history),
        frequentQuestions: this.extractFrequentQuestions(userMessages),
        documentTypes: this.extractDocumentTypes(userMessages),
        interactionPatterns: this.analyzeInteractionPatterns(history)
      },
      contextualHistory: {
        lastDocumentInquiry: this.findLastDocumentInquiry(userMessages),
        lastAdministrativeAction: this.findLastAdministrativeAction(userMessages),
        ongoingProcess: this.identifyOngoingProcess(history),
        followUpNeeded: this.determineFollowUpNeed(history)
      },
      conversationFlow: {
        currentStage: this.determineCurrentStage(history),
        stageTransitionTime: new Date(),
        expectedNextAction: this.predictNextAction(history)
      }
    };
  }

  private calculateAdaptiveSettings(
    userContext: EnhancedUserContext | null,
    history: ConversationMessage[],
    memory: ConversationMemory
  ): PersonalizedContext['adaptiveSettings'] {
    return {
      responseVerbosity: this.calculateVerbosity(memory.userPreferences.preferredResponseStyle),
      formalityLevel: this.calculateFormality(userContext?.userProfile.role),
      technicalDetail: this.calculateTechnicalLevel(memory.userPreferences.documentTypes),
      culturalSensitivity: userContext?.preferences.cultural_context === 'indonesian_formal' ? 0.9 : 0.7
    };
  }

  // Additional helper methods would be implemented here...
  private extractTopicsFromHistory(history: ConversationMessage[]): string[] {
    // Implementation for topic extraction
    return [];
  }

  private analyzeSentimentFromHistory(history: ConversationMessage[]): 'positive' | 'neutral' | 'frustrated' | 'satisfied' {
    // Implementation for sentiment analysis
    return 'neutral';
  }

  private determinePreferredAddress(userProfile: any): string {
    return userProfile.role === 'admin' ? 'Bapak/Ibu' : 'Kak';
  }

  private simplifyResponse(content: string): string {
    // Implementation for response simplification
    return content;
  }

  private enhanceResponseDetail(content: string): string {
    // Implementation for response enhancement
    return content;
  }

  private extractTopicsFromText(text: string): string[] {
    // Implementation for topic extraction from text
    return [];
  }

  private determineConversationStage(query: string, response: string): ConversationMemory['conversationFlow']['currentStage'] {
    // Implementation for stage determination
    return 'inquiry';
  }

  private inferResponseStyle(history: ConversationMessage[]): 'formal' | 'friendly' | 'concise' | 'detailed' {
    return 'friendly';
  }

  private extractFrequentQuestions(messages: ConversationMessage[]): string[] {
    return [];
  }

  private extractDocumentTypes(messages: ConversationMessage[]): string[] {
    return [];
  }

  private analyzeInteractionPatterns(history: ConversationMessage[]): ConversationMemory['userPreferences']['interactionPatterns'] {
    return {
      timeOfDay: 'morning',
      sessionDuration: 0,
      messageFrequency: 0
    };
  }

  private findLastDocumentInquiry(messages: ConversationMessage[]): string | undefined {
    return undefined;
  }

  private findLastAdministrativeAction(messages: ConversationMessage[]): string | undefined {
    return undefined;
  }

  private identifyOngoingProcess(history: ConversationMessage[]): string | undefined {
    return undefined;
  }

  private determineFollowUpNeed(history: ConversationMessage[]): boolean {
    return false;
  }

  private determineCurrentStage(history: ConversationMessage[]): ConversationMemory['conversationFlow']['currentStage'] {
    return 'inquiry';
  }

  private predictNextAction(history: ConversationMessage[]): string | undefined {
    return undefined;
  }

  private calculateVerbosity(style: string): number {
    switch (style) {
      case 'concise': return 0.3;
      case 'detailed': return 0.9;
      default: return 0.6;
    }
  }

  private calculateFormality(role?: string): number {
    return role === 'admin' ? 0.9 : 0.6;
  }

  private calculateTechnicalLevel(documentTypes: string[]): number {
    return documentTypes.length > 3 ? 0.8 : 0.5;
  }

  private getCachedContext(sessionId: string): PersonalizedContext | null {
    const cached = this.contextCache.get(sessionId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CONTEXT_CACHE_TTL) {
      this.contextCache.delete(sessionId);
      return null;
    }

    return cached.context;
  }

  private setCachedContext(sessionId: string, context: PersonalizedContext): void {
    this.contextCache.set(sessionId, {
      context,
      timestamp: Date.now()
    });
  }

  private getDefaultPersonalizedContext(sessionId: string, userId?: string): PersonalizedContext {
    return {
      userId,
      sessionId,
      conversationMemory: {
        recentTopics: [],
        userPreferences: {
          preferredResponseStyle: 'friendly',
          frequentQuestions: [],
          documentTypes: [],
          interactionPatterns: {
            timeOfDay: 'morning',
            sessionDuration: 0,
            messageFrequency: 0
          }
        },
        contextualHistory: {},
        conversationFlow: {
          currentStage: 'inquiry',
          stageTransitionTime: new Date()
        }
      },
      currentSession: {
        startTime: new Date(),
        messageCount: 0,
        topics: [],
        sentiment: 'neutral'
      },
      adaptiveSettings: {
        responseVerbosity: 0.6,
        formalityLevel: 0.6,
        technicalDetail: 0.5,
        culturalSensitivity: 0.7
      }
    };
  }

  /**
   * Clear cache for specific session or all sessions
   */
  public clearCache(sessionId?: string): void {
    if (sessionId) {
      this.contextCache.delete(sessionId);
    } else {
      this.contextCache.clear();
    }
  }
}
