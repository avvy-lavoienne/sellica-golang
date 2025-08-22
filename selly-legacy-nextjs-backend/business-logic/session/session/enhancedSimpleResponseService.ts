/**
 * Enhanced SimpleResponseService with Unified Session Management
 * Phase 2 Implementation: Session-aware AI responses with advanced caching
 */

// Phase 1: Use ServiceContainer for dependency injection
import { getSimpleResponseService, type SimpleResponseService } from '../core/ServiceRegistration';
import { SimpleResponseResult } from '../chatbot/simpleResponseService';
import { UnifiedSessionManager } from './unifiedSessionManager';
import { SessionAwarePersonaService } from './sessionAwarePersonaService';
import { SessionAwareKnowledgeService } from './sessionAwareKnowledgeService';
import { DocumentPatternCache } from '../cache/documentPatternCache';
import { CachePerformanceMonitor } from '../cache/cachePerformanceMonitor';
import { EnhancedSessionData, ConversationTurn } from './types';

export interface SessionAwareResponseResult extends SimpleResponseResult {
  sessionMetadata: {
    sessionId: string;
    sessionType: 'authenticated' | 'guest' | 'converting';
    conversationTurn: number;
    userExpertiseLevel: 'beginner' | 'intermediate' | 'expert';
    conversationStage: string;
    cacheLayerUsed: 'L0' | 'L1' | 'L2' | 'L3' | 'generated';
    sessionContinuity: boolean;
    deviceType: string;
    culturalContext: string;
  };
  recommendations?: {
    nextSteps: string[];
    relatedServices: string[];
    optimizationSuggestions: string[];
  };
}

export interface SessionQueryContext {
  sessionId?: string;
  userId?: string;
  deviceId?: string;
  administrativeContext?: {
    currentService?: string;
    documentType?: string;
    processStage?: 'inquiry' | 'requirements' | 'submission' | 'processing' | 'completion';
    officeLocation?: 'garut_pusat' | 'garut_utara' | 'garut_selatan' | 'online';
    appointmentId?: string;
    referenceNumber?: string;
    priority?: 'normal' | 'urgent' | 'emergency';
  };
}

export class EnhancedSimpleResponseService {
  private baseService: SimpleResponseService;
  private sessionManager: UnifiedSessionManager;
  private sessionAwarePersona: SessionAwarePersonaService;
  private sessionAwareKnowledge: SessionAwareKnowledgeService;
  private documentCache: DocumentPatternCache;
  private performanceMonitor: CachePerformanceMonitor;
  private static instance: EnhancedSimpleResponseService;

  private constructor() {
    // Phase 1: Use ServiceContainer for dependency injection
    this.baseService = getSimpleResponseService();
    this.sessionManager = UnifiedSessionManager.getInstance();
    this.sessionAwarePersona = SessionAwarePersonaService.getInstance();
    this.sessionAwareKnowledge = SessionAwareKnowledgeService.getInstance();
    this.documentCache = DocumentPatternCache.getInstance();
    this.performanceMonitor = CachePerformanceMonitor.getInstance();

    console.log('✅ [ENHANCED_RESPONSE] Enhanced SimpleResponseService initialized with session management');
  }

  public static getInstance(): EnhancedSimpleResponseService {
    if (!EnhancedSimpleResponseService.instance) {
      EnhancedSimpleResponseService.instance = new EnhancedSimpleResponseService();
    }
    return EnhancedSimpleResponseService.instance;
  }

  /**
   * Process query with session-aware enhancements
   */
  async processQueryWithSession(
    query: string,
    sessionContext: SessionQueryContext
  ): Promise<SessionAwareResponseResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🚀 [ENHANCED_RESPONSE] Processing session-aware query: "${query}"`);
      console.log(`📋 [ENHANCED_RESPONSE] Session context:`, sessionContext);

      // Step 1: Get or create session
      const sessionData = await this.getOrCreateSession(sessionContext);
      
      // Step 2: Multi-level session-aware caching check
      const cachedResponse = await this.checkSessionAwareCaches(query, sessionData);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Step 3: Generate response with session context
      const baseResponse = await this.baseService.processQuery(query, {
        userId: sessionContext.userId,
        user: sessionContext.userId ? { id: sessionContext.userId } : undefined
      });

      // Step 4: Enhance with session-aware persona
      const personaEnhancedResponse = await this.sessionAwarePersona.applyPersonaWithSession(
        query,
        sessionData.id,
        baseResponse.content
      );

      // Step 5: Get contextual knowledge enhancements
      const knowledgeEnhancement = await this.sessionAwareKnowledge.getContextualKnowledge(
        query,
        sessionData.id
      );

      // Step 6: Build comprehensive session-aware response
      const sessionAwareResponse = await this.buildSessionAwareResponse(
        baseResponse,
        personaEnhancedResponse,
        knowledgeEnhancement,
        sessionData,
        query
      );

      // Step 7: Update session with new interaction
      await this.updateSessionWithInteraction(sessionData.id, query, sessionAwareResponse);

      // Step 8: Cache the enhanced response
      await this.cacheSessionAwareResponse(query, sessionAwareResponse, sessionData);

      const processingTime = performance.now() - startTime;
      console.log(`✅ [ENHANCED_RESPONSE] Session-aware response generated in ${processingTime.toFixed(2)}ms`);

      return {
        ...sessionAwareResponse,
        metadata: {
          ...sessionAwareResponse.metadata,
          processingTime
        }
      };

    } catch (error) {
      console.error('❌ [ENHANCED_RESPONSE] Error processing session-aware query:', error);
      return this.generateErrorResponse(query, sessionContext, error);
    }
  }

  /**
   * Get or create session based on context
   */
  private async getOrCreateSession(context: SessionQueryContext): Promise<EnhancedSessionData> {
    // If sessionId provided, try to get existing session
    if (context.sessionId) {
      const existingSession = await this.sessionManager.getSession(context.sessionId);
      if (existingSession) {
        console.log(`🔍 [ENHANCED_RESPONSE] Using existing session: ${context.sessionId}`);
        return existingSession;
      }
    }

    // Create new session
    const sessionType = context.userId ? 'authenticated' : 'guest';
    const sessionInfo = await this.sessionManager.createSession(sessionType, {
      userId: context.userId,
      initialContext: {
        administrativeContext: context.administrativeContext
      }
    });

    const sessionData = await this.sessionManager.getSession(sessionInfo.id);
    if (!sessionData) {
      throw new Error('Failed to create session');
    }

    console.log(`✨ [ENHANCED_RESPONSE] Created new ${sessionType} session: ${sessionInfo.id}`);
    return sessionData;
  }

  /**
   * Check all session-aware cache layers
   */
  private async checkSessionAwareCaches(
    query: string,
    sessionData: EnhancedSessionData
  ): Promise<SessionAwareResponseResult | null> {
    const startTime = performance.now();

    try {
      // L0: Document Pattern Cache (Indonesian-specific)
      console.log('🇮🇩 [ENHANCED_RESPONSE] Checking L0: Document Pattern Cache...');
      const documentCacheResult = await this.documentCache.getCachedDocumentResponse(query, sessionData.id);
      if (documentCacheResult) {
        const processingTime = performance.now() - startTime;
        this.performanceMonitor.recordCacheHit('redis', processingTime);
        
        return this.formatCachedResponse(
          documentCacheResult.response,
          sessionData,
          'L0',
          documentCacheResult.confidence,
          processingTime,
          query
        );
      }

      // L1: Session Memory Cache (conversation-specific)
      console.log('💾 [ENHANCED_RESPONSE] Checking L1: Session Memory Cache...');
      const sessionCacheKey = this.buildSessionCacheKey(query, sessionData);
      const memoryCached = this.getFromSessionMemoryCache(sessionCacheKey);
      if (memoryCached) {
        const processingTime = performance.now() - startTime;
        this.performanceMonitor.recordCacheHit('memory', processingTime);
        
        return this.formatCachedResponse(
          memoryCached.content,
          sessionData,
          'L1',
          memoryCached.confidence,
          processingTime,
          query
        );
      }

      // L2: Upstash Redis Cache (distributed)
      console.log('☁️ [ENHANCED_RESPONSE] Checking L2: Upstash Redis Cache...');
      // This will be handled by the base service's existing caching

      console.log('❌ [ENHANCED_RESPONSE] No cache hits found, proceeding to generation');
      return null;

    } catch (error) {
      console.error('❌ [ENHANCED_RESPONSE] Error checking session-aware caches:', error);
      return null;
    }
  }

  /**
   * Build comprehensive session-aware response
   */
  private async buildSessionAwareResponse(
    baseResponse: SimpleResponseResult,
    personaResponse: any,
    knowledgeEnhancement: any,
    sessionData: EnhancedSessionData,
    query: string
  ): Promise<SessionAwareResponseResult> {
    const userExpertiseLevel = this.assessUserExpertise(sessionData);
    const conversationStage = this.determineConversationStage(sessionData);
    
    // Combine all enhancements intelligently
    let enhancedContent = personaResponse.content || baseResponse.content;
    
    // Add contextual recommendations if available
    const recommendations = this.generateSessionRecommendations(sessionData, query);

    return {
      content: enhancedContent,
      type: baseResponse.type,
      metadata: {
        ...baseResponse.metadata,
        confidence: Math.max(
          baseResponse.metadata?.confidence || 0.7,
          personaResponse.metadata?.confidence || 0.7
        ),
        model: 'Enhanced SimpleResponseService (Session-Aware)',
        knowledgeUsed: true,
        suggestionCount: recommendations.nextSteps.length
      },
      sessionMetadata: {
        sessionId: sessionData.id,
        sessionType: sessionData.type,
        conversationTurn: sessionData.conversationHistory.length + 1,
        userExpertiseLevel,
        conversationStage,
        cacheLayerUsed: 'generated',
        sessionContinuity: sessionData.conversationHistory.length > 0,
        deviceType: sessionData.devices[0]?.deviceType || 'desktop',
        culturalContext: sessionData.userPreferences.personaSettings?.culturalContext || 'regional_garut'
      },
      recommendations
    };
  }

  /**
   * Update session with new interaction
   */
  private async updateSessionWithInteraction(
    sessionId: string,
    query: string,
    response: SessionAwareResponseResult
  ): Promise<void> {
    try {
      const conversationTurn: ConversationTurn = {
        id: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        query,
        response: response.content,
        timestamp: new Date(),
        metadata: {
          confidence: response.metadata?.confidence || 0.8,
          model: response.metadata?.model || 'Enhanced SimpleResponseService',
          processingTime: response.metadata?.processingTime || 0,
          cached: response.sessionMetadata.cacheLayerUsed !== 'generated',
          serviceType: response.sessionMetadata.conversationStage
        }
      };

      const sessionData = await this.sessionManager.getSession(sessionId);
      if (sessionData) {
        await this.sessionManager.updateSession(sessionId, {
          conversationHistory: [...sessionData.conversationHistory, conversationTurn],
          lastAccessedAt: new Date(),
          analytics: {
            ...sessionData.analytics,
            totalQueries: sessionData.analytics.totalQueries + 1,
            averageResponseTime: (
              (sessionData.analytics.averageResponseTime * sessionData.analytics.totalQueries + 
               (response.metadata?.processingTime || 0)) / 
              (sessionData.analytics.totalQueries + 1)
            )
          }
        });
      }

    } catch (error) {
      console.error('❌ [ENHANCED_RESPONSE] Failed to update session interaction:', error);
    }
  }

  /**
   * Cache session-aware response
   */
  private async cacheSessionAwareResponse(
    query: string,
    response: SessionAwareResponseResult,
    sessionData: EnhancedSessionData
  ): Promise<void> {
    try {
      // Cache in document pattern cache
      await this.documentCache.cacheDocumentResponse(
        query,
        response.content,
        response.metadata?.confidence || 0.8,
        sessionData.id
      );

      // Cache in session memory cache
      const sessionCacheKey = this.buildSessionCacheKey(query, sessionData);
      this.setInSessionMemoryCache(sessionCacheKey, {
        content: response.content,
        confidence: response.metadata?.confidence || 0.8,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ [ENHANCED_RESPONSE] Failed to cache session-aware response:', error);
    }
  }

  /**
   * Helper methods
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

  private generateSessionRecommendations(sessionData: EnhancedSessionData, query: string) {
    const nextSteps: string[] = [];
    const relatedServices: string[] = [];
    const optimizationSuggestions: string[] = [];

    // Generate next steps based on conversation stage
    const stage = this.determineConversationStage(sessionData);
    switch (stage) {
      case 'requirements_inquiry':
        nextSteps.push('Tanyakan tentang proses pengajuan');
        nextSteps.push('Cek lokasi dan jam layanan');
        break;
      case 'process_inquiry':
        nextSteps.push('Tanyakan tentang biaya layanan');
        nextSteps.push('Cek estimasi waktu penyelesaian');
        break;
      case 'cost_inquiry':
        nextSteps.push('Siapkan dokumen yang diperlukan');
        nextSteps.push('Buat janji temu jika diperlukan');
        break;
    }

    // Generate related services based on query
    if (query.includes('ktp')) {
      relatedServices.push('Kartu Keluarga (KK)');
      relatedServices.push('Kartu Identitas Anak (KIA)');
    }
    if (query.includes('akta')) {
      relatedServices.push('Legalisir dokumen');
      relatedServices.push('Surat keterangan');
    }

    // Generate optimization suggestions based on user expertise
    const expertise = this.assessUserExpertise(sessionData);
    if (expertise === 'beginner') {
      optimizationSuggestions.push('Gunakan layanan online untuk menghemat waktu');
      optimizationSuggestions.push('Hubungi call center untuk konsultasi awal');
    } else if (expertise === 'expert') {
      optimizationSuggestions.push('Manfaatkan layanan prioritas untuk proses lebih cepat');
      optimizationSuggestions.push('Pertimbangkan layanan bundling untuk efisiensi');
    }

    return {
      nextSteps,
      relatedServices,
      optimizationSuggestions
    };
  }

  private buildSessionCacheKey(query: string, sessionData: EnhancedSessionData): string {
    const normalizedQuery = query.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    const contextKey = sessionData.administrativeContext?.currentService || 'general';
    const languageKey = sessionData.userPreferences.language;
    
    return `session_cache:${sessionData.id}:${contextKey}:${languageKey}:${normalizedQuery}`;
  }

  private sessionMemoryCache = new Map<string, any>();

  private getFromSessionMemoryCache(key: string): any {
    const cached = this.sessionMemoryCache.get(key);
    if (cached && Date.now() - cached.timestamp.getTime() < 300000) { // 5 minutes
      return cached;
    }
    return null;
  }

  private setInSessionMemoryCache(key: string, value: any): void {
    this.sessionMemoryCache.set(key, {
      ...value,
      timestamp: new Date()
    });
    
    // Cleanup old entries (keep only last 100)
    if (this.sessionMemoryCache.size > 100) {
      const entries = Array.from(this.sessionMemoryCache.entries());
      entries.sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());
      this.sessionMemoryCache.clear();
      entries.slice(0, 100).forEach(([k, v]) => this.sessionMemoryCache.set(k, v));
    }
  }

  private formatCachedResponse(
    content: string,
    sessionData: EnhancedSessionData,
    cacheLayer: 'L0' | 'L1' | 'L2' | 'L3',
    confidence: number,
    processingTime: number,
    query: string = ''
  ): SessionAwareResponseResult {
    const userExpertiseLevel = this.assessUserExpertise(sessionData);
    const conversationStage = this.determineConversationStage(sessionData);
    
    return {
      content,
      type: 'administrative',
      metadata: {
        confidence,
        processingTime,
        model: `${cacheLayer} Cache (Session-Aware)`,
        knowledgeUsed: true,
        suggestionCount: 0
      },
      sessionMetadata: {
        sessionId: sessionData.id,
        sessionType: sessionData.type,
        conversationTurn: sessionData.conversationHistory.length + 1,
        userExpertiseLevel,
        conversationStage,
        cacheLayerUsed: cacheLayer,
        sessionContinuity: sessionData.conversationHistory.length > 0,
        deviceType: sessionData.devices[0]?.deviceType || 'desktop',
        culturalContext: sessionData.userPreferences.personaSettings?.culturalContext || 'regional_garut'
      },
      recommendations: this.generateSessionRecommendations(sessionData, query)
    };
  }

  private generateErrorResponse(
    query: string,
    context: SessionQueryContext,
    error: any
  ): SessionAwareResponseResult {
    return {
      content: 'Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi dalam beberapa saat.',
      type: 'text',
      metadata: {
        confidence: 0.1,
        processingTime: 0,
        model: 'Error Handler',
        knowledgeUsed: false,
        suggestionCount: 0,
        error: error instanceof Error ? error.message : String(error)
      },
      sessionMetadata: {
        sessionId: context.sessionId || 'error',
        sessionType: 'guest',
        conversationTurn: 0,
        userExpertiseLevel: 'beginner',
        conversationStage: 'error',
        cacheLayerUsed: 'generated',
        sessionContinuity: false,
        deviceType: 'unknown',
        culturalContext: 'regional_garut'
      }
    };
  }
}
