/**
 * Session-Aware Persona Service for SELLY AI
 * Enhanced PersonaService with unified session management integration
 */

import { PersonaService, PersonaEnhancedResponse, ConversationContext } from '../chatbot/personaService';
import { UnifiedSessionManager } from './unifiedSessionManager';
import { DocumentPatternCache } from '../cache/documentPatternCache';
import { EnhancedSessionData, UserPreferences } from './types';

export interface SessionAwarePersonaResponse extends PersonaEnhancedResponse {
  sessionContext?: {
    sessionId: string;
    conversationStage: string;
    userExpertiseLevel: 'beginner' | 'intermediate' | 'expert';
    previousInteractions: number;
    preferredResponseStyle: string;
  };
}

export class SessionAwarePersonaService extends PersonaService {
  private sessionManager: UnifiedSessionManager;
  private documentCache: DocumentPatternCache;
  private static instance: SessionAwarePersonaService;

  private constructor() {
    super();
    this.sessionManager = UnifiedSessionManager.getInstance();
    this.documentCache = DocumentPatternCache.getInstance();
    console.log('✅ [SESSION_PERSONA] Session-aware persona service initialized');
  }

  public static getInstance(): SessionAwarePersonaService {
    if (!SessionAwarePersonaService.instance) {
      SessionAwarePersonaService.instance = new SessionAwarePersonaService();
    }
    return SessionAwarePersonaService.instance;
  }

  /**
   * Apply persona with session context awareness
   */
  async applyPersonaWithSession(
    query: string,
    sessionId: string,
    baseResponse?: string
  ): Promise<SessionAwarePersonaResponse> {
    const startTime = performance.now();
    
    try {
      // Get session data for context
      const sessionData = await this.sessionManager.getSession(sessionId);
      if (!sessionData) {
        console.warn(`⚠️ [SESSION_PERSONA] Session not found: ${sessionId}, using default persona`);
        return this.fallbackToDefaultPersona(query, baseResponse);
      }

      // Build enhanced conversation context from session
      const enhancedContext = this.buildEnhancedContext(sessionData, query);
      
      // Check document pattern cache first
      const cachedResponse = await this.documentCache.getCachedDocumentResponse(query, sessionId);
      if (cachedResponse) {
        const sessionAwareResponse = await this.enhanceWithSessionPersona(
          cachedResponse.response,
          sessionData,
          enhancedContext
        );
        
        console.log(`🎯 [SESSION_PERSONA] Used cached response with session persona (${(performance.now() - startTime).toFixed(2)}ms)`);
        return sessionAwareResponse;
      }

      // Apply base persona with session context
      const basePersonaResponse = await super.applyPersona(
        baseResponse || query,
        query,
        enhancedContext
      );

      // Enhance with session-specific personalization
      const sessionAwareResponse = await this.enhanceWithSessionPersona(
        basePersonaResponse.content,
        sessionData,
        enhancedContext
      );

      // Cache the response for future use
      await this.documentCache.cacheDocumentResponse(
        query,
        sessionAwareResponse.content,
        sessionAwareResponse.metadata?.confidence || 0.8,
        sessionId
      );

      // Update session with interaction data
      await this.updateSessionInteraction(sessionId, query, sessionAwareResponse);

      const processingTime = performance.now() - startTime;
      console.log(`✅ [SESSION_PERSONA] Applied session-aware persona (${processingTime.toFixed(2)}ms)`);

      return sessionAwareResponse;

    } catch (error) {
      console.error('❌ [SESSION_PERSONA] Error applying session persona:', error);
      return this.fallbackToDefaultPersona(query, baseResponse);
    }
  }

  /**
   * Build enhanced conversation context from session data
   */
  private buildEnhancedContext(sessionData: EnhancedSessionData, query: string): ConversationContext {
    const userExpertiseLevel = this.assessUserExpertise(sessionData);
    const conversationStage = this.determineConversationStage(sessionData);
    
    return {
      isFirstInteraction: sessionData.conversationHistory.length === 0,
      timeOfDay: this.getCurrentTimeOfDay(),
      userGreeting: sessionData.conversationHistory.length > 0 ?
        sessionData.conversationHistory[0].query : undefined,
      previousInteractions: sessionData.conversationHistory.length,
      currentTopic: sessionData.administrativeContext?.currentService,
      userId: sessionData.userId,
      conversationLength: sessionData.conversationHistory.length > 10 ? 'long' :
        sessionData.conversationHistory.length > 3 ? 'medium' : 'short',
      userTone: this.detectUserTone(sessionData)
    };
  }

  /**
   * Enhance response with session-specific personalization
   */
  private async enhanceWithSessionPersona(
    baseResponse: string,
    sessionData: EnhancedSessionData,
    context: ConversationContext
  ): Promise<SessionAwarePersonaResponse> {
    const userExpertiseLevel = this.assessUserExpertise(sessionData);
    const conversationStage = this.determineConversationStage(sessionData);
    const preferredStyle = sessionData.userPreferences.personaSettings?.responseStyle || 'conversational';

    let enhancedResponse = baseResponse;

    // Apply expertise-level adjustments
    enhancedResponse = this.adjustForExpertiseLevel(enhancedResponse, userExpertiseLevel);

    // Apply conversation stage adjustments
    enhancedResponse = this.adjustForConversationStage(enhancedResponse, conversationStage, sessionData);

    // Apply cultural and regional context
    enhancedResponse = this.applyCulturalContext(enhancedResponse, sessionData.userPreferences);

    // Add session continuity elements
    enhancedResponse = this.addSessionContinuity(enhancedResponse, sessionData);

    return {
      content: enhancedResponse,
      type: 'information',
      metadata: {
        personaApplied: true,
        confidence: 0.92,
        knowledgeUsed: true
      },
      sessionContext: {
        sessionId: sessionData.id,
        conversationStage,
        userExpertiseLevel,
        previousInteractions: sessionData.conversationHistory.length,
        preferredResponseStyle: preferredStyle
      }
    };
  }

  /**
   * Assess user expertise level based on session history
   */
  private assessUserExpertise(sessionData: EnhancedSessionData): 'beginner' | 'intermediate' | 'expert' {
    const totalQueries = sessionData.conversationHistory.length;
    const uniqueServices = new Set(
      sessionData.conversationHistory
        .map(turn => turn.metadata?.serviceType)
        .filter(Boolean)
    ).size;

    if (totalQueries >= 20 && uniqueServices >= 5) return 'expert';
    if (totalQueries >= 5 && uniqueServices >= 2) return 'intermediate';
    return 'beginner';
  }

  /**
   * Determine current conversation stage
   */
  private determineConversationStage(sessionData: EnhancedSessionData): string {
    const recentQueries = sessionData.conversationHistory.slice(-3);
    
    if (recentQueries.length === 0) return 'greeting';
    if (recentQueries.some(q => q.query.includes('syarat') || q.query.includes('persyaratan'))) {
      return 'requirements_inquiry';
    }
    if (recentQueries.some(q => q.query.includes('cara') || q.query.includes('bagaimana'))) {
      return 'process_inquiry';
    }
    if (sessionData.administrativeContext?.processStage) {
      return sessionData.administrativeContext.processStage;
    }
    
    return 'general_inquiry';
  }

  /**
   * Adjust response based on user expertise level
   */
  private adjustForExpertiseLevel(response: string, level: 'beginner' | 'intermediate' | 'expert'): string {
    switch (level) {
      case 'beginner':
        // Add more explanatory context and step-by-step guidance
        if (!response.includes('Langkah-langkah')) {
          response += '\n\n📋 **Panduan Langkah demi Langkah:**\n1. Siapkan dokumen yang diperlukan\n2. Datang ke kantor Disdukcapil\n3. Ambil nomor antrian\n4. Serahkan dokumen untuk verifikasi';
        }
        break;
      
      case 'intermediate':
        // Add helpful tips and common pitfalls
        response += '\n\n💡 **Tips:** Pastikan semua dokumen sudah dilegalisir dan bawa fotokopi tambahan untuk berjaga-jaga.';
        break;
      
      case 'expert':
        // Provide concise, direct information with advanced options
        response += '\n\n⚡ **Info Lanjutan:** Untuk proses lebih cepat, Anda dapat menggunakan layanan online atau membuat janji temu terlebih dahulu.';
        break;
    }
    
    return response;
  }

  /**
   * Adjust response based on conversation stage
   */
  private adjustForConversationStage(
    response: string, 
    stage: string, 
    sessionData: EnhancedSessionData
  ): string {
    switch (stage) {
      case 'greeting':
        const timeGreeting = this.getCurrentTimeBasedGreeting();
        response = `${timeGreeting} Saya SELLY, asisten AI Disdukcapil Kabupaten Garut. ${response}`;
        break;
        
      case 'requirements_inquiry':
        if (!response.includes('Persyaratan')) {
          response = `📋 **Persyaratan yang Diperlukan:**\n\n${response}`;
        }
        break;
        
      case 'process_inquiry':
        if (!response.includes('Prosedur')) {
          response = `🔄 **Prosedur Pelayanan:**\n\n${response}`;
        }
        break;
        
      case 'completion':
        response += '\n\n✅ Apakah ada layanan lain yang bisa saya bantu hari ini?';
        break;
    }
    
    return response;
  }

  /**
   * Apply cultural and regional context
   */
  private applyCulturalContext(response: string, preferences: UserPreferences): string {
    const culturalContext = preferences.personaSettings?.culturalContext || 'regional_garut';
    
    if (culturalContext === 'regional_garut') {
      // Add Garut-specific information
      if (!response.includes('Kabupaten Garut')) {
        response = response.replace(
          /Dinas Kependudukan/g,
          'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut'
        );
      }
    }
    
    return response;
  }

  /**
   * Add session continuity elements
   */
  private addSessionContinuity(response: string, sessionData: EnhancedSessionData): string {
    const previousInteractions = sessionData.conversationHistory.length;
    
    if (previousInteractions > 0) {
      const lastService = sessionData.administrativeContext?.currentService;
      if (lastService && !response.includes(lastService)) {
        response += `\n\n🔗 **Terkait dengan layanan ${lastService} yang Anda tanyakan sebelumnya**, informasi ini dapat membantu melengkapi proses Anda.`;
      }
    }
    
    return response;
  }

  /**
   * Get time-based greeting
   */
  private getCurrentTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi!';
    if (hour < 15) return 'Selamat siang!';
    if (hour < 18) return 'Selamat sore!';
    return 'Selamat malam!';
  }

  /**
   * Update session with interaction data
   */
  private async updateSessionInteraction(
    sessionId: string,
    query: string,
    response: SessionAwarePersonaResponse
  ): Promise<void> {
    try {
      const sessionData = await this.sessionManager.getSession(sessionId);
      if (!sessionData) return;

      // Add conversation turn
      const conversationTurn = {
        id: `turn_${Date.now()}`,
        query,
        response: response.content,
        timestamp: new Date(),
        metadata: {
          confidence: response.metadata?.confidence || 0.8,
          model: 'SessionAwarePersonaService',
          processingTime: 0,
          cached: false,
          serviceType: response.sessionContext?.conversationStage
        }
      };

      // Update analytics
      const updatedAnalytics = {
        ...sessionData.analytics,
        totalQueries: sessionData.analytics.totalQueries + 1,
        averageResponseTime: (
          (sessionData.analytics.averageResponseTime * sessionData.analytics.totalQueries + 0) /
          (sessionData.analytics.totalQueries + 1)
        )
      };

      await this.sessionManager.updateSession(sessionId, {
        conversationHistory: [...sessionData.conversationHistory, conversationTurn],
        analytics: updatedAnalytics,
        lastAccessedAt: new Date()
      });

    } catch (error) {
      console.error('❌ [SESSION_PERSONA] Failed to update session interaction:', error);
    }
  }

  /**
   * Get time of day for greeting context
   */
  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Detect user tone from session data
   */
  private detectUserTone(sessionData: EnhancedSessionData): 'formal' | 'casual' | 'friendly' {
    const recentQueries = sessionData.conversationHistory.slice(-3);
    const queryText = recentQueries.map(q => q.query.toLowerCase()).join(' ');

    if (queryText.includes('pak') || queryText.includes('bu') || queryText.includes('mohon')) {
      return 'formal';
    }
    if (queryText.includes('kak') || queryText.includes('dong') || queryText.includes('gimana')) {
      return 'casual';
    }
    return 'friendly';
  }

  /**
   * Fallback to default persona when session is unavailable
   */
  private async fallbackToDefaultPersona(
    query: string,
    baseResponse?: string
  ): Promise<SessionAwarePersonaResponse> {
    const defaultContext: ConversationContext = {
      isFirstInteraction: true,
      timeOfDay: this.getCurrentTimeOfDay(),
      previousInteractions: 0,
      conversationLength: 'short',
      userTone: 'casual'
    };

    const basePersonaResponse = await super.applyPersona(
      baseResponse || query,
      query,
      defaultContext
    );

    return {
      ...basePersonaResponse,
      sessionContext: {
        sessionId: 'fallback',
        conversationStage: 'general_inquiry',
        userExpertiseLevel: 'beginner',
        previousInteractions: 0,
        preferredResponseStyle: 'conversational'
      }
    };
  }
}
