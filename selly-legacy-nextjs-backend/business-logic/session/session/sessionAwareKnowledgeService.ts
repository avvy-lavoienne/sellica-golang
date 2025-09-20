/**
 * Session-Aware Knowledge Service for SELLY AI
 * Enhanced KnowledgeService with session context and document pattern caching
 */

import { KnowledgeService, ServiceInfo } from '../chatbot/knowledgeService';
import { UnifiedSessionManager } from './unifiedSessionManager';
import { DocumentPatternCache } from '../cache/documentPatternCache';
import { EnhancedSessionData } from './types';

export interface ContextualKnowledgeResponse {
  serviceInfo: ServiceInfo | string;
  sessionContext: {
    isFollowUp: boolean;
    relatedToPrevious: boolean;
    suggestedNextSteps: string[];
    contextualRecommendations: string[];
  };
  personalization: {
    expertiseLevel: 'beginner' | 'intermediate' | 'expert';
    preferredDetail: 'concise' | 'detailed' | 'comprehensive';
    culturalContext: string;
  };
  cacheInfo: {
    cached: boolean;
    source: 'session' | 'document_pattern' | 'knowledge_base';
    confidence: number;
  };
}

export class SessionAwareKnowledgeService {
  private knowledgeBase: KnowledgeService;
  private sessionManager: UnifiedSessionManager;
  private documentCache: DocumentPatternCache;
  private static instance: SessionAwareKnowledgeService;

  private constructor() {
    this.knowledgeBase = KnowledgeService.getInstance();
    this.sessionManager = UnifiedSessionManager.getInstance();
    this.documentCache = DocumentPatternCache.getInstance();
    console.log('✅ [SESSION_KNOWLEDGE] Session-aware knowledge service initialized');
  }

  public static getInstance(): SessionAwareKnowledgeService {
    if (!SessionAwareKnowledgeService.instance) {
      SessionAwareKnowledgeService.instance = new SessionAwareKnowledgeService();
    }
    return SessionAwareKnowledgeService.instance;
  }

  /**
   * Get contextual knowledge based on session history and patterns
   */
  async getContextualKnowledge(
    query: string,
    sessionId: string
  ): Promise<ContextualKnowledgeResponse> {
    const startTime = performance.now();
    
    try {
      // Get session data for context
      const sessionData = await this.sessionManager.getSession(sessionId);
      if (!sessionData) {
        console.warn(`⚠️ [SESSION_KNOWLEDGE] Session not found: ${sessionId}, using base knowledge`);
        return this.fallbackToBaseKnowledge(query);
      }

      // Check document pattern cache first (L0)
      const cachedResponse = await this.documentCache.getCachedDocumentResponse(query, sessionId);
      if (cachedResponse) {
        const contextualResponse = this.enhanceWithSessionContext(
          cachedResponse.response,
          sessionData,
          query,
          'document_pattern',
          cachedResponse.confidence
        );
        
        console.log(`🎯 [SESSION_KNOWLEDGE] Document pattern cache HIT (${(performance.now() - startTime).toFixed(2)}ms)`);
        return contextualResponse;
      }

      // Build contextual factors from session
      const contextualFactors = this.buildContextualFactors(sessionData, query);
      
      // Get knowledge from base service with context
      const baseKnowledge = await this.knowledgeBase.getServiceInfo(query);
      
      if (typeof baseKnowledge === 'string' || !baseKnowledge) {
        // Handle string responses or null responses
        const enhancedResponse = await this.enhanceStringResponse(
          baseKnowledge || 'Maaf, informasi tidak ditemukan.',
          sessionData,
          query
        );
        
        // Cache the enhanced response
        await this.documentCache.cacheDocumentResponse(
          query,
          enhancedResponse,
          0.7,
          sessionId
        );
        
        return this.enhanceWithSessionContext(
          enhancedResponse,
          sessionData,
          query,
          'knowledge_base',
          0.7
        );
      }

      // Enhance ServiceInfo with session context
      const enhancedServiceInfo = this.enhanceServiceInfoWithContext(
        baseKnowledge,
        sessionData,
        contextualFactors
      );

      // Format as response string
      const formattedResponse = this.formatServiceInfoResponse(enhancedServiceInfo, sessionData);
      
      // Cache the response for future use
      await this.documentCache.cacheDocumentResponse(
        query,
        formattedResponse,
        0.9,
        sessionId
      );

      const processingTime = performance.now() - startTime;
      console.log(`✅ [SESSION_KNOWLEDGE] Contextual knowledge retrieved (${processingTime.toFixed(2)}ms)`);

      return this.enhanceWithSessionContext(
        formattedResponse,
        sessionData,
        query,
        'knowledge_base',
        0.9
      );

    } catch (error) {
      console.error('❌ [SESSION_KNOWLEDGE] Error getting contextual knowledge:', error);
      return this.fallbackToBaseKnowledge(query);
    }
  }

  /**
   * Build contextual factors from session data
   */
  private buildContextualFactors(sessionData: EnhancedSessionData, query: string) {
    return {
      previousQueries: this.extractPreviousQueries(sessionData),
      currentDocumentType: sessionData.administrativeContext?.documentType,
      userExpertiseLevel: this.assessUserExpertise(sessionData),
      conversationStage: this.determineConversationStage(sessionData),
      preferredDetail: sessionData.userPreferences.verbosity,
      culturalContext: sessionData.userPreferences.personaSettings?.culturalContext || 'regional_garut',
      deviceType: sessionData.devices[0]?.deviceType || 'desktop',
      sessionDuration: Date.now() - sessionData.createdAt.getTime(),
      totalInteractions: sessionData.conversationHistory.length
    };
  }

  /**
   * Extract previous queries for context
   */
  private extractPreviousQueries(sessionData: EnhancedSessionData): string[] {
    return sessionData.conversationHistory
      .slice(-5) // Last 5 queries for context
      .map(turn => turn.query);
  }

  /**
   * Assess user expertise level
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
   * Determine conversation stage
   */
  private determineConversationStage(sessionData: EnhancedSessionData): string {
    if (sessionData.administrativeContext?.processStage) {
      return sessionData.administrativeContext.processStage;
    }

    const recentQueries = sessionData.conversationHistory.slice(-3);
    if (recentQueries.length === 0) return 'initial';
    
    const queryText = recentQueries.map(q => q.query.toLowerCase()).join(' ');
    
    if (queryText.includes('syarat') || queryText.includes('persyaratan')) {
      return 'requirements_inquiry';
    }
    if (queryText.includes('cara') || queryText.includes('bagaimana')) {
      return 'process_inquiry';
    }
    if (queryText.includes('biaya') || queryText.includes('tarif')) {
      return 'cost_inquiry';
    }
    
    return 'general_inquiry';
  }

  /**
   * Enhance ServiceInfo with session context
   */
  private enhanceServiceInfoWithContext(
    serviceInfo: ServiceInfo,
    sessionData: EnhancedSessionData,
    contextualFactors: any
  ): ServiceInfo {
    // Add contextual recommendations based on user history
    const contextualRecommendations = this.generateContextualRecommendations(
      serviceInfo,
      sessionData,
      contextualFactors
    );

    // Enhance requirements based on user expertise
    const enhancedRequirements = this.enhanceRequirementsForUser(
      serviceInfo.requirements,
      contextualFactors.userExpertiseLevel
    );

    return {
      ...serviceInfo,
      requirements: enhancedRequirements,
      specialCases: {
        ...serviceInfo.specialCases,
        contextual_recommendations: contextualRecommendations,
        user_expertise_level: [contextualFactors.userExpertiseLevel],
        session_context: [`${contextualFactors.conversationStage}_stage`]
      }
    };
  }

  /**
   * Generate contextual recommendations
   */
  private generateContextualRecommendations(
    serviceInfo: ServiceInfo,
    sessionData: EnhancedSessionData,
    contextualFactors: any
  ): string[] {
    const recommendations: string[] = [];

    // Based on previous queries
    if (contextualFactors.previousQueries.some((q: string) => q.includes('ktp'))) {
      recommendations.push('Pastikan KTP Anda masih berlaku untuk proses ini');
    }

    // Based on expertise level
    if (contextualFactors.userExpertiseLevel === 'beginner') {
      recommendations.push('Disarankan untuk menghubungi call center terlebih dahulu');
      recommendations.push('Bawa fotokopi tambahan untuk semua dokumen');
    }

    // Based on device type
    if (contextualFactors.deviceType === 'mobile') {
      recommendations.push('Anda dapat menggunakan layanan online untuk beberapa tahap proses');
    }

    // Based on time patterns
    const hour = new Date().getHours();
    if (hour >= 11 && hour <= 13) {
      recommendations.push('Waktu terbaik untuk datang adalah pagi hari (08:00-11:00) untuk menghindari antrian panjang');
    }

    return recommendations;
  }

  /**
   * Enhance requirements based on user expertise
   */
  private enhanceRequirementsForUser(
    requirements: any[],
    expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  ): any[] {
    return requirements.map(req => {
      if (expertiseLevel === 'beginner') {
        return {
          ...req,
          note: req.note || 'Pastikan dokumen asli dan fotokopi tersedia'
        };
      }
      return req;
    });
  }

  /**
   * Format ServiceInfo as response string
   */
  private formatServiceInfoResponse(serviceInfo: ServiceInfo, sessionData: EnhancedSessionData): string {
    const userLevel = this.assessUserExpertise(sessionData);
    let response = `📋 **${serviceInfo.serviceName}**\n\n`;

    // Add requirements
    if (serviceInfo.requirements && serviceInfo.requirements.length > 0) {
      response += '**Persyaratan:**\n';
      serviceInfo.requirements.forEach((req, index) => {
        response += `${index + 1}. ${req.name}${req.required ? ' (Wajib)' : ' (Opsional)'}\n`;
      });
      response += '\n';
    }

    // Add process steps for beginners
    if (userLevel === 'beginner' && serviceInfo.processSteps && serviceInfo.processSteps.length > 0) {
      response += '**Langkah-langkah:**\n';
      serviceInfo.processSteps.forEach((step, index) => {
        response += `${index + 1}. ${step}\n`;
      });
      response += '\n';
    }

    // Add contextual information
    if (serviceInfo.specialCases?.contextual_recommendations) {
      response += '**Rekomendasi untuk Anda:**\n';
      serviceInfo.specialCases.contextual_recommendations.forEach((rec: string) => {
        response += `• ${rec}\n`;
      });
      response += '\n';
    }

    // Add basic info
    response += `⏱️ **Waktu Proses:** ${serviceInfo.duration}\n`;
    response += `💰 **Biaya:** ${serviceInfo.cost}\n`;
    response += `🏢 **Jam Layanan:** ${serviceInfo.officeHours}`;

    return response;
  }

  /**
   * Enhance string response with session context
   */
  private async enhanceStringResponse(
    baseResponse: string,
    sessionData: EnhancedSessionData,
    query: string
  ): Promise<string> {
    const userLevel = this.assessUserExpertise(sessionData);
    let enhancedResponse = baseResponse;

    // Add helpful context for beginners
    if (userLevel === 'beginner') {
      enhancedResponse += '\n\n💡 **Tips:** Jika Anda memerlukan bantuan lebih lanjut, silakan hubungi call center Disdukcapil Kabupaten Garut di (0262) 123456.';
    }

    // Add session continuity
    if (sessionData.conversationHistory.length > 0) {
      const lastQuery = sessionData.conversationHistory[sessionData.conversationHistory.length - 1];
      if (lastQuery && this.isRelatedQuery(query, lastQuery.query)) {
        enhancedResponse += '\n\n🔗 **Terkait dengan pertanyaan sebelumnya**, informasi ini dapat membantu melengkapi proses Anda.';
      }
    }

    return enhancedResponse;
  }

  /**
   * Check if queries are related
   */
  private isRelatedQuery(currentQuery: string, previousQuery: string): boolean {
    const currentWords = currentQuery.toLowerCase().split(' ');
    const previousWords = previousQuery.toLowerCase().split(' ');
    
    const commonWords = currentWords.filter(word => 
      previousWords.includes(word) && word.length > 3
    );
    
    return commonWords.length >= 2;
  }

  /**
   * Enhance response with session context
   */
  private enhanceWithSessionContext(
    response: string,
    sessionData: EnhancedSessionData,
    query: string,
    source: 'session' | 'document_pattern' | 'knowledge_base',
    confidence: number
  ): ContextualKnowledgeResponse {
    const contextualFactors = this.buildContextualFactors(sessionData, query);
    
    return {
      serviceInfo: response,
      sessionContext: {
        isFollowUp: sessionData.conversationHistory.length > 0,
        relatedToPrevious: this.isRelatedToPreviousQueries(query, sessionData),
        suggestedNextSteps: this.generateNextSteps(query, sessionData),
        contextualRecommendations: this.generateContextualRecommendations(
          {
            serviceName: 'General',
            serviceCode: 'GEN-001',
            serviceType: 'General Information',
            requirements: [],
            processSteps: [],
            duration: '',
            cost: '',
            officeHours: ''
          },
          sessionData,
          contextualFactors
        )
      },
      personalization: {
        expertiseLevel: contextualFactors.userExpertiseLevel,
        preferredDetail: contextualFactors.preferredDetail,
        culturalContext: contextualFactors.culturalContext
      },
      cacheInfo: {
        cached: source !== 'knowledge_base',
        source,
        confidence
      }
    };
  }

  /**
   * Check if query is related to previous queries
   */
  private isRelatedToPreviousQueries(query: string, sessionData: EnhancedSessionData): boolean {
    if (sessionData.conversationHistory.length === 0) return false;
    
    const recentQueries = sessionData.conversationHistory.slice(-3);
    return recentQueries.some(turn => this.isRelatedQuery(query, turn.query));
  }

  /**
   * Generate suggested next steps
   */
  private generateNextSteps(query: string, sessionData: EnhancedSessionData): string[] {
    const steps: string[] = [];
    
    if (query.includes('syarat') || query.includes('persyaratan')) {
      steps.push('Tanyakan tentang proses pengajuan');
      steps.push('Cek lokasi dan jam layanan');
    } else if (query.includes('cara') || query.includes('proses')) {
      steps.push('Tanyakan tentang biaya layanan');
      steps.push('Cek estimasi waktu penyelesaian');
    }
    
    // Add general next steps
    steps.push('Siapkan dokumen yang diperlukan');
    steps.push('Buat janji temu jika diperlukan');
    
    return steps;
  }

  /**
   * Fallback to base knowledge when session is unavailable
   */
  private async fallbackToBaseKnowledge(query: string): Promise<ContextualKnowledgeResponse> {
    const baseKnowledge = await this.knowledgeBase.getServiceInfo(query);

    // Create a minimal mock session data for formatting
    const mockSessionData: Partial<EnhancedSessionData> = {
      conversationHistory: [],
      userPreferences: {
        language: 'id',
        dataFormat: 'summary',
        verbosity: 'detailed'
      }
    };

    const response = typeof baseKnowledge === 'string' ? baseKnowledge :
      baseKnowledge ? this.formatServiceInfoResponse(baseKnowledge, mockSessionData as EnhancedSessionData) : 'Informasi tidak ditemukan.';

    return {
      serviceInfo: response,
      sessionContext: {
        isFollowUp: false,
        relatedToPrevious: false,
        suggestedNextSteps: ['Siapkan dokumen yang diperlukan'],
        contextualRecommendations: []
      },
      personalization: {
        expertiseLevel: 'beginner',
        preferredDetail: 'detailed',
        culturalContext: 'regional_garut'
      },
      cacheInfo: {
        cached: false,
        source: 'knowledge_base',
        confidence: 0.7
      }
    };
  }
}
