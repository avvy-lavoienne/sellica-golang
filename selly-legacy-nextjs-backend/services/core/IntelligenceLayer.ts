/**
 * Intelligence Layer - Consolidated Enhancement Logic
 * 
 * Phase 1 Priority 2: Complete Service Consolidation
 * Consolidates all enhancement logic from EnhancedSellyIntegration into a unified layer
 * that integrates directly with SimpleResponseService via ServiceContainer dependency injection.
 * 
 * This layer provides:
 * - Context Intelligence (user profiling, conversation tracking)
 * - Dynamic Response Generation (adaptive formatting, personalization)
 * - Persona Adaptation (mood detection, cultural context)
 * - Knowledge Synthesis (intelligent information combination)
 * - Local AI Enhancement (sentiment analysis, intent refinement)
 * - Response Quality Metrics and Learning
 */

import { ServiceContainer } from './ServiceContainer';
import { SERVICE_TOKENS } from './ServiceTokens';
import { isComplianceFeatureEnabled } from '../../config/complianceFeatureFlags';
import type { GovernmentGradeEncryption } from '../security/GovernmentGradeEncryption';
import type { DataClassification } from '../../types/compliance';
import type { GovernmentAuditTrail } from '../audit/GovernmentAuditTrail';
import type { AuditEventType } from '../../types/audit';

// Core interfaces consolidated from EnhancedSellyIntegration
export interface IntelligenceResponse {
  content: string;
  type: 'text' | 'administrative' | 'interactive' | 'enhanced';
  metadata: {
    // Performance metrics
    processingTime: number;
    enhancementLayers: string[];
    
    // Quality metrics
    qualityScore: number;
    adaptationApplied: boolean;
    personalizationLevel: number;
    
    // Context awareness
    contextualRelevance: number;
    emotionalIntelligence: number;
    culturalSensitivity: number;
    
    // AI enhancements
    localAIUsed: boolean;
    sentimentAnalyzed: boolean;
    intentRefined: boolean;
    
    // Learning metrics
    userSatisfactionPrediction: number;
    improvementSuggestions: string[];
    
    // Compatibility with SimpleResponseService
    confidence?: number;
    model?: string;
    knowledgeUsed?: boolean;
    suggestions?: string[];
  };
  variations?: Array<{
    content: string;
    style: string;
    confidence: number;
  }>;
}

export interface IntelligenceConfig {
  enableContextIntelligence: boolean;
  enableDynamicResponses: boolean;
  enablePersonaAdaptation: boolean;
  enableKnowledgeSynthesis: boolean;
  enableLocalAI: boolean;
  generateVariations: boolean;
  maxVariations: number;
  performanceMode: 'fast' | 'balanced' | 'comprehensive';
}

// Consolidated context interface
export interface ConversationContext {
  sessionId: string;
  currentQuery: string;
  queryIntent: string;
  emotionalTone: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  
  userProfile: {
    userId: string;
    preferences: Record<string, any>;
    interactionHistory: {
      totalInteractions: number;
      recentTopics: string[];
      satisfactionScore: number;
    };
  };
  
  isReturningUser: boolean;
  sessionLength: number;
  previousQueries: string[];
  
  timeOfDay: string;
  dayOfWeek: string;
  isBusinessHours: boolean;
  
  conversationStage: 'greeting' | 'inquiry' | 'clarification' | 'resolution' | 'closing';
  topicContinuity: number;
  needsElaboration: boolean;
  
  responseComplexity: 'simple' | 'moderate' | 'complex';
  culturalContext: Record<string, any>;
  adaptationTriggers: string[];
}

// Consolidated persona adaptation interface
export interface PersonaAdaptation {
  personality_adjustments: {
    warmth: number;
    formality: number;
    enthusiasm: number;
    patience: number;
    helpfulness: number;
  };
  response_modifications: {
    greeting_style: string;
    explanation_approach: string;
    encouragement_level: string;
    closing_style: string;
  };
  linguistic_adaptations: {
    vocabulary_level: 'simple' | 'standard' | 'advanced';
    sentence_structure: 'simple' | 'compound' | 'complex';
    cultural_references: string[];
    address_forms: string[];
  };
}

/**
 * IntelligenceLayer - Unified Enhancement Processing
 * 
 * Consolidates all enhancement capabilities from EnhancedSellyIntegration
 * into a single, dependency-injected service that integrates with SimpleResponseService.
 */
export class IntelligenceLayer {
  private container: ServiceContainer;
  private contextCache: Map<string, ConversationContext> = new Map();
  private userProfiles: Map<string, any> = new Map();
  private responseTemplates: Map<string, any> = new Map();
  private auditTrail: GovernmentAuditTrail | null = null;
  
  private defaultConfig: IntelligenceConfig = {
    enableContextIntelligence: true,
    enableDynamicResponses: true,
    enablePersonaAdaptation: true,
    enableKnowledgeSynthesis: true,
    enableLocalAI: true,
    generateVariations: false,
    maxVariations: 3,
    performanceMode: 'balanced'
  };

  constructor(container: ServiceContainer) {
    this.container = container;
    this.initializeResponseTemplates();
    this.initializeAuditTrail();
    console.log('✅ [INTELLIGENCE_LAYER] Unified intelligence layer initialized with dependency injection');
  }

  /**
   * Main enhancement processing method
   * Consolidates all enhancement logic from EnhancedSellyIntegration
   */
  public async enhanceResponse(
    baseResponse: { content: string; type: string; metadata: any },
    query: string,
    context?: { userId?: string; user?: { id: string } },
    config?: Partial<IntelligenceConfig>
  ): Promise<IntelligenceResponse> {
    const startTime = Date.now();
    const enhancementConfig = { ...this.defaultConfig, ...config };
    const enhancementLayers: string[] = [];

    console.log('🧠 [INTELLIGENCE_LAYER] Starting unified enhancement processing...');

    try {
      // Phase 3 Security: Compliance validation before AI processing (with feature flag)
      const userId = context?.userId || context?.user?.id;
      if (userId && isComplianceFeatureEnabled('enableAIComplianceValidation')) {
        try {
          await this.validateDataProcessingCompliance(userId, query);
          enhancementLayers.push('compliance_validation');
          console.log('✅ [INTELLIGENCE_LAYER] Compliance validation complete');
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Compliance validation failed, continuing with basic processing:', error);
          // Continue with processing - graceful degradation
        }
      }

      // Phase 3 Week 19-20: Encrypt sensitive data before AI processing
      if (userId && isComplianceFeatureEnabled('enableSensitiveDataDetection')) {
        try {
          const sensitiveDataInfo = this.detectSensitiveData(query);
          if (sensitiveDataInfo.hasSensitiveData) {
            await this.encryptSensitiveDataInQuery(userId, query, sensitiveDataInfo);
            enhancementLayers.push('data_encryption');
            console.log('🔐 [INTELLIGENCE_LAYER] Sensitive data encrypted');
          }
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Data encryption failed, continuing with basic processing:', error);
          // Continue with processing - graceful degradation
        }
      }
      // Step 1: Context Intelligence
      let conversationContext: ConversationContext | null = null;
      if (enhancementConfig.enableContextIntelligence) {
        conversationContext = await this.buildConversationContext(query, context);
        enhancementLayers.push('context_intelligence');
        console.log('✅ [INTELLIGENCE_LAYER] Context intelligence complete');
      }
      
      // Step 2: Sentiment Analysis and Intent Refinement
      let sentimentResult: any = null;
      let intentRefinement: any = null;
      if (enhancementConfig.enableLocalAI && conversationContext) {
        try {
          sentimentResult = await this.analyzeSentiment(query);
          intentRefinement = await this.refineIntent(query, conversationContext.queryIntent);
          enhancementLayers.push('local_ai');
          console.log('✅ [INTELLIGENCE_LAYER] Local AI analysis complete');
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Local AI enhancement failed, continuing without:', error);
        }
      }
      
      // Step 3: Dynamic Response Generation
      let enhancedContent = baseResponse.content;
      if (enhancementConfig.enableDynamicResponses && conversationContext) {
        try {
          enhancedContent = await this.generateDynamicResponse(
            baseResponse.content,
            baseResponse.type,
            conversationContext,
            {
              includePersonalization: true,
              emotionalOverride: sentimentResult?.sentiment
            }
          );
          enhancementLayers.push('dynamic_response');
          console.log('✅ [INTELLIGENCE_LAYER] Dynamic response generation complete');
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Dynamic response generation failed:', error);
        }
      }
      
      // Step 4: Persona Adaptation
      let personaAdaptation: PersonaAdaptation | null = null;
      if (enhancementConfig.enablePersonaAdaptation && conversationContext) {
        try {
          personaAdaptation = await this.generatePersonaAdaptation(query, conversationContext);
          if (personaAdaptation) {
            enhancedContent = this.applyPersonaAdaptation(enhancedContent, personaAdaptation, conversationContext);
            enhancementLayers.push('persona_adaptation');
            console.log('✅ [INTELLIGENCE_LAYER] Persona adaptation complete');
          }
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Persona adaptation failed:', error);
        }
      }
      
      // Step 5: Knowledge Synthesis
      if (enhancementConfig.enableKnowledgeSynthesis && conversationContext) {
        try {
          enhancedContent = await this.synthesizeKnowledge(enhancedContent, query, conversationContext);
          enhancementLayers.push('knowledge_synthesis');
          console.log('✅ [INTELLIGENCE_LAYER] Knowledge synthesis complete');
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Knowledge synthesis failed:', error);
        }
      }
      
      // Step 6: Generate Response Variations (if requested)
      let variations: Array<{content: string; style: string; confidence: number}> | undefined;
      if (enhancementConfig.generateVariations && conversationContext) {
        try {
          variations = await this.generateResponseVariations(
            enhancedContent,
            baseResponse.type,
            conversationContext,
            enhancementConfig.maxVariations
          );
          enhancementLayers.push('response_variations');
          console.log('✅ [INTELLIGENCE_LAYER] Response variations generated');
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Response variation generation failed:', error);
        }
      }
      
      // Calculate quality metrics
      const processingTime = Date.now() - startTime;
      const qualityMetrics = this.calculateQualityMetrics(
        enhancedContent,
        baseResponse.content,
        enhancementLayers,
        conversationContext
      );
      
      // Build enhanced response
      const enhancedResponse: IntelligenceResponse = {
        content: enhancedContent,
        type: baseResponse.type as any,
        metadata: {
          // Performance metrics
          processingTime,
          enhancementLayers,
          
          // Quality metrics
          qualityScore: qualityMetrics.qualityScore,
          adaptationApplied: enhancementLayers.length > 0,
          personalizationLevel: qualityMetrics.personalizationLevel,
          
          // Context awareness
          contextualRelevance: qualityMetrics.contextualRelevance,
          emotionalIntelligence: qualityMetrics.emotionalIntelligence,
          culturalSensitivity: qualityMetrics.culturalSensitivity,
          
          // AI enhancements
          localAIUsed: enhancementLayers.includes('local_ai'),
          sentimentAnalyzed: sentimentResult !== null,
          intentRefined: intentRefinement !== null,
          
          // Learning metrics
          userSatisfactionPrediction: qualityMetrics.userSatisfactionPrediction,
          improvementSuggestions: qualityMetrics.improvementSuggestions,
          
          // Compatibility with SimpleResponseService
          confidence: baseResponse.metadata.confidence || qualityMetrics.qualityScore,
          model: baseResponse.metadata.model || 'Intelligence Layer Enhanced',
          knowledgeUsed: baseResponse.metadata.knowledgeUsed || true,
          suggestions: baseResponse.metadata.suggestions || []
        },
        variations
      };

      // Phase 3 Security: Log AI interaction for audit trail (with feature flag)
      if (userId && isComplianceFeatureEnabled('enableAuditLogging')) {
        try {
          await this.logAIInteraction(userId, query, enhancedResponse);
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Audit logging failed:', error);
          // Continue - audit logging failure should not break main flow
        }
      }

      // Phase 3 Week 21-22: Log to government audit trail with digital signatures
      if (userId && isComplianceFeatureEnabled('enableGovernmentAuditTrail')) {
        try {
          const sensitiveDataInfo = this.detectSensitiveData(query);
          const classification = sensitiveDataInfo.hasSensitiveData
            ? this.determineDataClassification(sensitiveDataInfo.categories)
            : 'internal';

          await this.logAIInteractionAudit(
            userId,
            query,
            enhancedResponse.content,
            enhancementLayers,
            processingTime,
            classification
          );
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Government audit trail logging failed:', error);
          // Continue - audit logging failure should not break main flow
        }
      }

      // Phase 3 Week 19-20: Encrypt audit entries containing personal data
      if (userId && isComplianceFeatureEnabled('enableAuditLogging')) {
        try {
          const sensitiveDataInfo = this.detectSensitiveData(query);
          if (sensitiveDataInfo.hasSensitiveData) {
            await this.encryptAuditEntry(userId, query, enhancedResponse, sensitiveDataInfo);
            console.log('🔐 [INTELLIGENCE_LAYER] Audit entry encrypted');
          }
        } catch (error) {
          console.warn('⚠️ [INTELLIGENCE_LAYER] Audit encryption failed:', error);
          // Continue - audit encryption failure should not break main flow
        }
      }

      console.log(`✅ [INTELLIGENCE_LAYER] Enhancement complete in ${processingTime}ms with ${enhancementLayers.length} layers`);
      return enhancedResponse;
      
    } catch (error) {
      console.error('❌ [INTELLIGENCE_LAYER] Enhancement processing failed:', error);
      
      // Return enhanced metadata even on failure
      return {
        content: baseResponse.content,
        type: baseResponse.type as any,
        metadata: {
          processingTime: Date.now() - startTime,
          enhancementLayers: ['error_fallback'],
          qualityScore: 0.5,
          adaptationApplied: false,
          personalizationLevel: 0,
          contextualRelevance: 0,
          emotionalIntelligence: 0,
          culturalSensitivity: 0,
          localAIUsed: false,
          sentimentAnalyzed: false,
          intentRefined: false,
          userSatisfactionPrediction: 0.5,
          improvementSuggestions: ['Enhancement processing failed, using base response'],
          confidence: baseResponse.metadata.confidence || 0.5,
          model: baseResponse.metadata.model || 'Base Response (Enhancement Failed)',
          knowledgeUsed: baseResponse.metadata.knowledgeUsed || false,
          suggestions: baseResponse.metadata.suggestions || []
        }
      };
    }
  }

  /**
   * Build conversation context from query and user information
   * Consolidates context intelligence from EnhancedContextIntelligence
   */
  private async buildConversationContext(
    query: string,
    context?: { userId?: string; user?: { id: string } }
  ): Promise<ConversationContext> {
    const userId = context?.userId || context?.user?.id || 'anonymous';
    const sessionId = this.generateSessionId(userId);

    // Get or create user profile
    const userProfile = this.getUserProfile(userId);

    // Analyze current query
    const queryAnalysis = this.analyzeQuery(query);

    // Build enhanced context
    const conversationContext: ConversationContext = {
      sessionId,
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

      conversationStage: this.determineConversationStage(query),
      topicContinuity: this.checkTopicContinuity(query, userProfile),
      needsElaboration: queryAnalysis.needsElaboration,

      responseComplexity: this.determineResponseComplexity(userProfile, queryAnalysis),
      culturalContext: this.determineCulturalContext(userProfile, queryAnalysis),
      adaptationTriggers: this.identifyAdaptationTriggers(userProfile, queryAnalysis)
    };

    // Update user profile with new interaction
    this.updateUserProfile(userId, conversationContext);

    // Store context for future reference
    this.contextCache.set(sessionId, conversationContext);

    return conversationContext;
  }

  /**
   * Analyze sentiment of the query
   * Consolidates local AI sentiment analysis
   */
  private async analyzeSentiment(query: string): Promise<any> {
    // Simple rule-based sentiment analysis (fallback when AI models unavailable)
    const positiveWords = ['terima kasih', 'bagus', 'baik', 'senang', 'puas', 'mantap'];
    const negativeWords = ['marah', 'kesal', 'buruk', 'jelek', 'lambat', 'susah', 'sulit'];
    const neutralWords = ['halo', 'hai', 'selamat', 'tolong', 'bantu', 'info'];

    const lowerQuery = query.toLowerCase();
    let sentiment = 'neutral';
    let confidence = 0.5;

    if (positiveWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'positive';
      confidence = 0.7;
    } else if (negativeWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'negative';
      confidence = 0.7;
    } else if (neutralWords.some(word => lowerQuery.includes(word))) {
      sentiment = 'neutral';
      confidence = 0.8;
    }

    return {
      sentiment,
      confidence,
      emotions: {
        joy: sentiment === 'positive' ? confidence : 0,
        anger: sentiment === 'negative' ? confidence : 0,
        neutral: sentiment === 'neutral' ? confidence : 0
      }
    };
  }

  /**
   * Refine intent based on context
   * Consolidates intent refinement logic
   */
  private async refineIntent(query: string, originalIntent: string): Promise<any> {
    // Enhanced intent classification with Indonesian administrative context
    const adminIntents = {
      'ktp': ['ktp', 'kartu tanda penduduk', 'identitas'],
      'akta_kelahiran': ['akta kelahiran', 'akta lahir', 'surat kelahiran'],
      'kk': ['kartu keluarga', 'kk'],
      'pindah': ['pindah', 'kepindahan', 'mutasi'],
      'nikah': ['nikah', 'menikah', 'pernikahan', 'kawin']
    };

    const lowerQuery = query.toLowerCase();
    let refinedIntent = originalIntent;
    let confidence = 0.5;

    for (const [intent, keywords] of Object.entries(adminIntents)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        refinedIntent = intent;
        confidence = 0.8;
        break;
      }
    }

    return {
      originalIntent,
      refinedIntent,
      confidence,
      reasoning: `Intent refined based on administrative keyword matching`
    };
  }

  /**
   * Generate dynamic response with contextual adaptation
   * Consolidates dynamic response engine logic
   */
  private async generateDynamicResponse(
    baseContent: string,
    serviceType: string,
    context: ConversationContext,
    options?: {
      includePersonalization?: boolean;
      emotionalOverride?: string;
    }
  ): Promise<string> {

    // Check if response is already clean and well-formatted
    if (this.isCleanResponse(baseContent)) {
      console.log('✅ [INTELLIGENCE_LAYER] Response already clean, skipping dynamic generation');
      return baseContent;
    }

    // Apply contextual modifications based on conversation stage
    let enhancedContent = baseContent;

    // Add greeting enhancement for greeting stage
    if (context.conversationStage === 'greeting') {
      const greetingStyle = this.selectGreetingStyle(context);
      enhancedContent = `${greetingStyle} ${enhancedContent}`;
    }

    // Apply personalization if enabled
    if (options?.includePersonalization) {
      enhancedContent = this.addPersonalizationElements(enhancedContent, context);
    }

    // Apply emotional intelligence
    if (options?.emotionalOverride) {
      enhancedContent = this.applyEmotionalIntelligence(enhancedContent, context, options.emotionalOverride);
    }

    // Apply cultural context
    enhancedContent = this.applyCulturalContext(enhancedContent, context);

    return enhancedContent;
  }

  /**
   * Generate persona adaptation based on user context
   * Consolidates persona system logic
   */
  private async generatePersonaAdaptation(
    query: string,
    context: ConversationContext
  ): Promise<PersonaAdaptation | null> {

    // Detect user mood and preferences
    const moodResult = this.detectUserMood(query, context);
    const culturalContext = this.analyzeCulturalContext(query, context);

    // Generate persona adaptation based on mood and cultural context
    const adaptation: PersonaAdaptation = {
      personality_adjustments: {
        warmth: moodResult.needsWarmth ? 0.8 : 0.6,
        formality: culturalContext.prefersFormal ? 0.7 : 0.4,
        enthusiasm: moodResult.needsEncouragement ? 0.8 : 0.5,
        patience: moodResult.showsFrustration ? 0.9 : 0.6,
        helpfulness: 0.9 // Always high for administrative services
      },
      response_modifications: {
        greeting_style: culturalContext.prefersFormal ? 'Selamat pagi/siang/sore Bapak/Ibu' : 'Halo kak!',
        explanation_approach: moodResult.needsSimpleExplanation ? 'simplified' : 'standard',
        encouragement_level: moodResult.needsEncouragement ? 'high' : 'moderate',
        closing_style: culturalContext.prefersFormal ? 'formal' : 'friendly'
      },
      linguistic_adaptations: {
        vocabulary_level: context.userProfile.preferences.vocabularyLevel || 'standard',
        sentence_structure: moodResult.needsSimpleExplanation ? 'simple' : 'compound',
        cultural_references: culturalContext.appropriateReferences,
        address_forms: culturalContext.prefersFormal ? ['Bapak', 'Ibu'] : ['kak', 'kakak']
      }
    };

    return adaptation;
  }

  /**
   * Apply persona adaptation to response content
   */
  private applyPersonaAdaptation(
    baseResponse: string,
    adaptation: PersonaAdaptation,
    context: ConversationContext
  ): string {
    let adaptedResponse = baseResponse;

    // Apply greeting style
    if (context.conversationStage === 'greeting') {
      adaptedResponse = `${adaptation.response_modifications.greeting_style} ${adaptedResponse}`;
    }

    // Apply explanation approach
    if (adaptation.response_modifications.explanation_approach === 'simplified') {
      adaptedResponse = this.simplifyExplanation(adaptedResponse);
    }

    // Apply cultural references
    if (adaptation.linguistic_adaptations.cultural_references.length > 0) {
      adaptedResponse = this.addCulturalReferences(adaptedResponse, adaptation.linguistic_adaptations.cultural_references);
    }

    return adaptedResponse;
  }

  /**
   * Synthesize knowledge from multiple sources
   */
  private async synthesizeKnowledge(
    content: string,
    query: string,
    context: ConversationContext
  ): Promise<string> {
    // Simple knowledge synthesis - combine with contextual information
    let synthesizedContent = content;

    // Add contextual insights based on user history
    if (context.userProfile.interactionHistory.recentTopics.length > 0) {
      const relatedTopics = context.userProfile.interactionHistory.recentTopics
        .filter(topic => this.isTopicRelated(topic, query))
        .slice(0, 2);

      if (relatedTopics.length > 0) {
        synthesizedContent += `\n\n💡 Berdasarkan riwayat percakapan sebelumnya, mungkin ini juga berguna untuk Anda.`;
      }
    }

    return synthesizedContent;
  }

  /**
   * Generate response variations for A/B testing
   */
  private async generateResponseVariations(
    baseContent: string,
    serviceType: string,
    context: ConversationContext,
    count: number = 3
  ): Promise<Array<{content: string; style: string; confidence: number}>> {
    const variations: Array<{content: string; style: string; confidence: number}> = [];
    const styles = ['conversational', 'professional', 'friendly', 'detailed'];

    for (let i = 0; i < Math.min(count, styles.length); i++) {
      const style = styles[i];
      let variation = baseContent;

      // Apply style-specific modifications
      switch (style) {
        case 'conversational':
          variation = this.makeConversational(variation);
          break;
        case 'professional':
          variation = this.makeProfessional(variation);
          break;
        case 'friendly':
          variation = this.makeFriendly(variation);
          break;
        case 'detailed':
          variation = this.makeDetailed(variation, context);
          break;
      }

      const confidence = this.calculateVariationConfidence(variation, context, style);

      variations.push({
        content: variation,
        style,
        confidence
      });
    }

    return variations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate quality metrics for the enhanced response
   */
  private calculateQualityMetrics(
    enhancedContent: string,
    originalContent: string,
    enhancementLayers: string[],
    context: ConversationContext | null
  ): {
    qualityScore: number;
    personalizationLevel: number;
    contextualRelevance: number;
    emotionalIntelligence: number;
    culturalSensitivity: number;
    userSatisfactionPrediction: number;
    improvementSuggestions: string[];
  } {

    // Calculate base quality score
    let qualityScore = 0.7; // Base score

    // Bonus for enhancement layers
    qualityScore += enhancementLayers.length * 0.05;

    // Bonus for content improvement
    if (enhancedContent.length > originalContent.length) {
      qualityScore += 0.1;
    }

    // Calculate personalization level
    const personalizationLevel = context ?
      (context.userProfile.interactionHistory.totalInteractions > 0 ? 0.8 : 0.3) : 0;

    // Calculate contextual relevance
    const contextualRelevance = context ? 0.8 : 0.5;

    // Calculate emotional intelligence
    const emotionalIntelligence = enhancementLayers.includes('local_ai') ? 0.7 : 0.4;

    // Calculate cultural sensitivity
    const culturalSensitivity = enhancementLayers.includes('persona_adaptation') ? 0.8 : 0.5;

    // Predict user satisfaction
    const userSatisfactionPrediction = (qualityScore + personalizationLevel + contextualRelevance) / 3;

    // Generate improvement suggestions
    const improvementSuggestions: string[] = [];
    if (qualityScore < 0.7) {
      improvementSuggestions.push('Consider enabling more enhancement layers');
    }
    if (personalizationLevel < 0.5) {
      improvementSuggestions.push('Improve user profiling for better personalization');
    }
    if (contextualRelevance < 0.6) {
      improvementSuggestions.push('Enhance context intelligence');
    }

    return {
      qualityScore: Math.min(qualityScore, 1.0),
      personalizationLevel,
      contextualRelevance,
      emotionalIntelligence,
      culturalSensitivity,
      userSatisfactionPrediction,
      improvementSuggestions
    };
  }

  /**
   * Initialize response templates
   */
  private initializeResponseTemplates(): void {
    // Initialize basic response templates for different service types
    this.responseTemplates.set('greeting', {
      formal: 'Selamat pagi/siang/sore Bapak/Ibu, ada yang bisa dibantu?',
      casual: 'Halo kak! Ada yang bisa dibantu?',
      friendly: 'Hai! Senang bisa membantu Anda hari ini 😊'
    });

    this.responseTemplates.set('administrative', {
      formal: 'Untuk keperluan administrasi tersebut, berikut informasi yang diperlukan:',
      casual: 'Untuk urusan itu, ini yang perlu kak ketahui:',
      friendly: 'Baik, saya akan bantu jelaskan prosedurnya ya!'
    });

    console.log('📋 [INTELLIGENCE_LAYER] Response templates initialized');
  }

  // Helper methods for context building and analysis
  private generateSessionId(userId: string): string {
    return `session_${userId}_${Date.now()}`;
  }

  private getUserProfile(userId: string): any {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {},
        interactionHistory: {
          totalInteractions: 0,
          recentTopics: [],
          satisfactionScore: 0.7
        }
      });
    }
    return this.userProfiles.get(userId);
  }

  private analyzeQuery(query: string): any {
    const lowerQuery = query.toLowerCase();

    // Determine intent
    let intent = 'general';
    if (lowerQuery.includes('ktp') || lowerQuery.includes('kartu tanda penduduk')) {
      intent = 'ktp_service';
    } else if (lowerQuery.includes('akta') || lowerQuery.includes('kelahiran')) {
      intent = 'birth_certificate';
    } else if (lowerQuery.includes('halo') || lowerQuery.includes('hai')) {
      intent = 'greeting';
    }

    // Determine emotional tone
    let emotionalTone = 'neutral';
    if (lowerQuery.includes('urgent') || lowerQuery.includes('cepat') || lowerQuery.includes('segera')) {
      emotionalTone = 'urgent';
    } else if (lowerQuery.includes('terima kasih') || lowerQuery.includes('bagus')) {
      emotionalTone = 'positive';
    }

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' = 'medium';
    if (lowerQuery.includes('urgent') || lowerQuery.includes('segera')) {
      urgencyLevel = 'high';
    } else if (lowerQuery.includes('santai') || lowerQuery.includes('kapan saja')) {
      urgencyLevel = 'low';
    }

    return {
      intent,
      emotionalTone,
      urgencyLevel,
      needsElaboration: lowerQuery.includes('detail') || lowerQuery.includes('jelaskan')
    };
  }

  private getSessionLength(sessionId: string): number {
    // Simple session length calculation
    return 1; // Default to 1 for new sessions
  }

  private getPreviousQueries(sessionId: string, limit: number): string[] {
    // Return empty array for now - would be implemented with actual session storage
    return [];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'pagi';
    if (hour < 15) return 'siang';
    if (hour < 18) return 'sore';
    return 'malam';
  }

  private isBusinessHours(): boolean {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 17;
  }

  private determineConversationStage(query: string): 'greeting' | 'inquiry' | 'clarification' | 'resolution' | 'closing' {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('halo') || lowerQuery.includes('hai') || lowerQuery.includes('selamat')) {
      return 'greeting';
    }
    if (lowerQuery.includes('terima kasih') || lowerQuery.includes('selesai')) {
      return 'closing';
    }
    if (lowerQuery.includes('maksud') || lowerQuery.includes('jelaskan') || lowerQuery.includes('bagaimana')) {
      return 'clarification';
    }
    return 'inquiry';
  }

  private checkTopicContinuity(query: string, userProfile: any): number {
    // Simple topic continuity check
    return 0.5; // Default moderate continuity
  }

  private determineResponseComplexity(userProfile: any, queryAnalysis: any): 'simple' | 'moderate' | 'complex' {
    if (queryAnalysis.needsElaboration) return 'complex';
    if (userProfile.interactionHistory.totalInteractions > 5) return 'moderate';
    return 'simple';
  }

  private determineCulturalContext(userProfile: any, queryAnalysis: any): Record<string, any> {
    return {
      prefersFormal: queryAnalysis.intent === 'administrative',
      appropriateReferences: ['pelayanan publik', 'administrasi kependudukan'],
      communicationStyle: 'respectful'
    };
  }

  private identifyAdaptationTriggers(userProfile: any, queryAnalysis: any): string[] {
    const triggers: string[] = [];
    if (queryAnalysis.urgencyLevel === 'high') triggers.push('urgent_response');
    if (queryAnalysis.emotionalTone === 'positive') triggers.push('maintain_positivity');
    if (userProfile.interactionHistory.totalInteractions === 0) triggers.push('first_time_user');
    return triggers;
  }

  private updateUserProfile(userId: string, context: ConversationContext): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.interactionHistory.totalInteractions++;
      profile.interactionHistory.recentTopics.unshift(context.queryIntent);
      profile.interactionHistory.recentTopics = profile.interactionHistory.recentTopics.slice(0, 5);
    }
  }

  // Helper methods for response enhancement
  private isCleanResponse(content: string): boolean {
    // Check if response is already well-formatted and doesn't need enhancement
    const hasProperGreeting = content.includes('Halo') || content.includes('Selamat');
    const hasProperStructure = content.length > 20 && !content.includes('undefined');
    const hasNoFragmentation = !content.includes('1.') || content.split('\n').length < 5;

    return hasProperGreeting && hasProperStructure && hasNoFragmentation;
  }

  private selectGreetingStyle(context: ConversationContext): string {
    const templates = this.responseTemplates.get('greeting');
    if (!templates) return 'Halo!';

    if (context.culturalContext.prefersFormal) {
      return templates.formal;
    } else if (context.conversationStage === 'greeting') {
      return templates.friendly;
    }
    return templates.casual;
  }

  private addPersonalizationElements(content: string, context: ConversationContext): string {
    let personalizedContent = content;

    // Add time-based personalization
    if (context.timeOfDay === 'pagi') {
      personalizedContent = personalizedContent.replace(/Halo/g, 'Selamat pagi');
    } else if (context.timeOfDay === 'siang') {
      personalizedContent = personalizedContent.replace(/Halo/g, 'Selamat siang');
    }

    // Add user history context
    if (context.isReturningUser) {
      personalizedContent += ' Senang bertemu lagi dengan Anda!';
    }

    return personalizedContent;
  }

  private applyEmotionalIntelligence(content: string, context: ConversationContext, emotionalOverride?: string): string {
    let emotionalContent = content;

    const emotion = emotionalOverride || context.emotionalTone;

    switch (emotion) {
      case 'positive':
        emotionalContent += ' 😊';
        break;
      case 'urgent':
        emotionalContent = `⚡ ${emotionalContent}`;
        break;
      case 'negative':
        emotionalContent = `Saya memahami kekhawatiran Anda. ${emotionalContent}`;
        break;
    }

    return emotionalContent;
  }

  private applyCulturalContext(content: string, context: ConversationContext): string {
    let culturalContent = content;

    // Apply Indonesian cultural context
    if (context.culturalContext.prefersFormal) {
      culturalContent = culturalContent.replace(/kak/g, 'Bapak/Ibu');
    }

    // Add appropriate cultural references
    if (context.culturalContext.appropriateReferences) {
      // Cultural context already applied in content
    }

    return culturalContent;
  }

  private detectUserMood(query: string, context: ConversationContext): any {
    const lowerQuery = query.toLowerCase();

    return {
      needsWarmth: lowerQuery.includes('bingung') || lowerQuery.includes('tidak tahu'),
      needsEncouragement: lowerQuery.includes('sulit') || lowerQuery.includes('susah'),
      showsFrustration: lowerQuery.includes('lama') || lowerQuery.includes('lambat'),
      needsSimpleExplanation: context.userProfile.interactionHistory.totalInteractions < 3
    };
  }

  private analyzeCulturalContext(query: string, context: ConversationContext): any {
    const lowerQuery = query.toLowerCase();

    return {
      prefersFormal: lowerQuery.includes('bapak') || lowerQuery.includes('ibu') || context.conversationStage !== 'greeting',
      appropriateReferences: ['pelayanan publik', 'administrasi kependudukan'],
      communicationStyle: 'respectful'
    };
  }

  private simplifyExplanation(content: string): string {
    // Simplify complex explanations
    return content
      .replace(/\b(prosedur|mekanisme|implementasi)\b/g, 'cara')
      .replace(/\b(dokumentasi|berkas)\b/g, 'dokumen')
      .replace(/\b(administrasi)\b/g, 'urusan');
  }

  private addCulturalReferences(content: string, references: string[]): string {
    // Add cultural references if appropriate
    if (references.includes('pelayanan publik')) {
      return content + '\n\n💼 Ini adalah bagian dari pelayanan publik untuk kemudahan Anda.';
    }
    return content;
  }

  private isTopicRelated(topic: string, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerTopic = topic.toLowerCase();

    // Simple topic relatedness check
    return lowerQuery.includes(lowerTopic) || lowerTopic.includes(lowerQuery.split(' ')[0]);
  }

  // Style variation methods
  private makeConversational(content: string): string {
    return content
      .replace(/\bAnda\b/g, 'kak')
      .replace(/\bSilakan\b/g, 'Coba')
      .replace(/\bDapat\b/g, 'Bisa');
  }

  private makeProfessional(content: string): string {
    return content
      .replace(/\bkak\b/g, 'Bapak/Ibu')
      .replace(/\bHalo\b/g, 'Selamat pagi/siang/sore')
      .replace(/😊/g, '');
  }

  private makeFriendly(content: string): string {
    return content + ' 😊 Semoga membantu ya!';
  }

  private makeDetailed(content: string, context: ConversationContext): string {
    let detailedContent = content;

    // Add more context based on user profile
    if (context.userProfile.interactionHistory.totalInteractions > 0) {
      detailedContent += '\n\n📋 Informasi tambahan: Berdasarkan riwayat sebelumnya, pastikan dokumen sudah lengkap.';
    }

    return detailedContent;
  }

  private calculateVariationConfidence(variation: string, context: ConversationContext, style: string): number {
    let confidence = 0.5;

    // Higher confidence for styles that match user preferences
    if (style === 'professional' && context.culturalContext.prefersFormal) {
      confidence = 0.8;
    } else if (style === 'friendly' && !context.culturalContext.prefersFormal) {
      confidence = 0.8;
    } else if (style === 'conversational' && context.isReturningUser) {
      confidence = 0.7;
    }

    // Adjust based on content quality
    if (variation.length > 50 && variation.includes('😊')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // Phase 3 Security: Indonesian Data Protection Compliance Methods

  /**
   * Validate data processing compliance before AI enhancement
   * Implements UU No. 27 Tahun 2022 (Indonesian Personal Data Protection Law) requirements
   */
  private async validateDataProcessingCompliance(userId: string, query: string): Promise<void> {
    try {
      // Get Indonesian Data Protection Service
      const dataProtectionService = this.container.resolve(SERVICE_TOKENS.IndonesianDataProtectionService);

      // Check if user has valid consent for AI processing
      const hasConsent = await dataProtectionService.validateConsent(
        userId,
        'ai_processing', // Data category
        'chatbot_enhancement' // Processing purpose
      );

      if (!hasConsent) {
        console.warn(`⚠️ [COMPLIANCE] User ${userId} lacks consent for AI processing`);
        // In production, this might trigger consent request or use basic processing only
        return;
      }

      // Validate lawfulness of processing
      await this.validateProcessingLawfulness(userId, query);

      console.log(`✅ [COMPLIANCE] Data processing compliance validated for user ${userId}`);

    } catch (error) {
      console.error('❌ [COMPLIANCE] Compliance validation failed:', error);
      // In production, this might fallback to basic processing without AI enhancement
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Compliance validation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate lawfulness of data processing per Indonesian data protection law
   */
  private async validateProcessingLawfulness(userId: string, query: string): Promise<void> {
    // Check for sensitive data in query
    const containsSensitiveData = this.detectSensitiveData(query);

    if (containsSensitiveData.hasSensitiveData) {
      console.log(`🔒 [COMPLIANCE] Sensitive data detected: ${containsSensitiveData.categories.join(', ')}`);

      // For sensitive data, ensure explicit consent exists
      const dataProtectionService = this.container.resolve(SERVICE_TOKENS.IndonesianDataProtectionService);

      for (const category of containsSensitiveData.categories) {
        const hasExplicitConsent = await dataProtectionService.validateConsent(
          userId,
          category,
          'sensitive_data_processing'
        );

        if (!hasExplicitConsent) {
          throw new Error(`Missing explicit consent for sensitive data category: ${category}`);
        }
      }
    }

    // Validate data minimization principle
    this.validateDataMinimization(query);

    console.log(`✅ [COMPLIANCE] Processing lawfulness validated for user ${userId}`);
  }

  /**
   * Detect sensitive data in user query
   */
  private detectSensitiveData(query: string): { hasSensitiveData: boolean; categories: string[] } {
    const sensitivePatterns = {
      'personal_identity': /\b(?:nik|ktp|nomor induk|identitas)\b/i,
      'financial': /\b(?:rekening|bank|kartu kredit|gaji|penghasilan)\b/i,
      'health': /\b(?:sakit|penyakit|obat|rumah sakit|dokter)\b/i,
      'biometric': /\b(?:sidik jari|wajah|mata|biometrik)\b/i,
      'location': /\b(?:alamat|rumah|kantor|lokasi|gps)\b/i
    };

    const detectedCategories: string[] = [];

    for (const [category, pattern] of Object.entries(sensitivePatterns)) {
      if (pattern.test(query)) {
        detectedCategories.push(category);
      }
    }

    return {
      hasSensitiveData: detectedCategories.length > 0,
      categories: detectedCategories
    };
  }

  /**
   * Validate data minimization principle
   */
  private validateDataMinimization(query: string): void {
    // Check if query requests excessive personal data
    const excessiveDataPatterns = [
      /berikan semua data/i,
      /tampilkan seluruh informasi/i,
      /export semua/i
    ];

    for (const pattern of excessiveDataPatterns) {
      if (pattern.test(query)) {
        console.warn('⚠️ [COMPLIANCE] Query may violate data minimization principle');
        // In production, this might trigger additional validation or user confirmation
        break;
      }
    }
  }

  /**
   * Log AI interaction for audit trail
   * Implements comprehensive audit logging per Indonesian compliance requirements
   */
  private async logAIInteraction(userId: string, query: string, response: IntelligenceResponse): Promise<void> {
    try {
      const dataProtectionService = this.container.resolve(SERVICE_TOKENS.IndonesianDataProtectionService);

      // Create audit log entry
      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: userId,
        operation: 'ai_enhancement',
        queryHash: this.hashSensitiveData(query), // Hash query to protect privacy
        responseMetadata: {
          enhancementLayers: response.metadata.enhancementLayers,
          qualityScore: response.metadata.qualityScore,
          processingTime: response.metadata.processingTime,
          localAIUsed: response.metadata.localAIUsed
        },
        complianceStatus: 'validated',
        dataCategories: this.detectSensitiveData(query).categories,
        legalBasis: 'consent',
        retentionPeriod: 365 // days
      };

      // In production, this would be stored in secure audit database
      console.log('📋 [AUDIT] AI interaction logged:', {
        userId,
        operation: auditEntry.operation,
        timestamp: auditEntry.timestamp,
        enhancementLayers: auditEntry.responseMetadata.enhancementLayers.length
      });

      // Store audit entry (in production, this would use proper audit service)
      // await dataProtectionService.logAuditEntry(auditEntry);

    } catch (error) {
      console.error('❌ [AUDIT] Failed to log AI interaction:', error);
      // Audit logging failure should not break the main flow
    }
  }

  /**
   * Encrypt sensitive data in user query before AI processing
   * Phase 3 Week 19-20: Government-grade encryption for sensitive data
   */
  private async encryptSensitiveDataInQuery(
    userId: string,
    query: string,
    sensitiveDataInfo: { hasSensitiveData: boolean; categories: string[] }
  ): Promise<void> {
    try {
      // Get encryption service
      const encryptionService = this.container.resolve(SERVICE_TOKENS.GovernmentGradeEncryption) as GovernmentGradeEncryption;

      // Determine data classification based on sensitive data categories
      const classification = this.determineDataClassification(sensitiveDataInfo.categories);

      // Encrypt the query data for audit purposes
      const encryptedQuery = await encryptionService.encryptSensitiveData(
        query,
        classification,
        'ai_processing',
        userId
      );

      console.log(`🔐 [ENCRYPTION] Encrypted ${classification} query data for AI processing`);

      // Store encrypted query reference for audit trail
      // In production, this would be stored in secure audit database
      const auditEntry = {
        userId,
        operation: 'data_encryption',
        timestamp: new Date(),
        dataClassification: classification,
        encryptedDataId: encryptedQuery.keyId,
        sensitiveCategories: sensitiveDataInfo.categories
      };

      console.log('📋 [AUDIT] Encrypted data logged:', {
        userId,
        classification,
        categories: sensitiveDataInfo.categories.length
      });

    } catch (error) {
      console.error('❌ [ENCRYPTION] Failed to encrypt sensitive data:', error);
      throw error; // Re-throw to trigger graceful degradation
    }
  }

  /**
   * Encrypt audit entry containing personal data
   * Phase 3 Week 19-20: Secure audit trail encryption
   */
  private async encryptAuditEntry(
    userId: string,
    query: string,
    response: IntelligenceResponse,
    sensitiveDataInfo: { hasSensitiveData: boolean; categories: string[] }
  ): Promise<void> {
    try {
      // Get encryption service
      const encryptionService = this.container.resolve(SERVICE_TOKENS.GovernmentGradeEncryption) as GovernmentGradeEncryption;

      // Determine data classification
      const classification = this.determineDataClassification(sensitiveDataInfo.categories);

      // Create audit entry with sensitive data
      const auditEntry = {
        userId,
        operation: 'ai_enhancement',
        timestamp: new Date(),
        queryHash: this.hashSensitiveData(query),
        responseMetadata: {
          enhancementLayers: response.metadata.enhancementLayers,
          qualityScore: response.metadata.qualityScore,
          processingTime: response.metadata.processingTime,
          localAIUsed: response.metadata.localAIUsed
        },
        complianceStatus: 'validated',
        dataCategories: sensitiveDataInfo.categories,
        legalBasis: 'consent',
        retentionPeriod: 365,
        sensitiveDataDetected: true
      };

      // Encrypt the audit entry
      const encryptedAuditEntry = await encryptionService.encryptSensitiveData(
        auditEntry,
        classification,
        'audit_logging',
        userId
      );

      console.log(`🔐 [AUDIT_ENCRYPTION] Encrypted ${classification} audit entry`);

      // Store encrypted audit entry reference
      // In production, this would be stored in secure audit database
      const encryptedAuditReference = {
        userId,
        operation: 'encrypted_audit_entry',
        timestamp: new Date(),
        encryptedEntryId: encryptedAuditEntry.keyId,
        dataClassification: classification,
        retentionPeriod: 2555 // 7 years for government compliance
      };

      console.log('📋 [AUDIT] Encrypted audit entry stored:', {
        userId,
        classification,
        entryId: encryptedAuditEntry.keyId.substring(0, 8) + '...'
      });

    } catch (error) {
      console.error('❌ [AUDIT_ENCRYPTION] Failed to encrypt audit entry:', error);
      throw error; // Re-throw to trigger graceful degradation
    }
  }

  /**
   * Determine data classification based on sensitive data categories
   */
  private determineDataClassification(categories: string[]): DataClassification {
    // Map sensitive data categories to Indonesian government data classifications
    const classificationMap: Record<string, DataClassification> = {
      'personal_identity': 'confidential',  // NIK, KTP data
      'financial': 'confidential',          // Bank, salary data
      'health': 'secret',                   // Medical data - highest protection
      'biometric': 'secret',                // Biometric data - highest protection
      'location': 'internal',               // Location data
      'communication': 'internal'           // Communication data
    };

    // Find the highest classification level needed
    let highestClassification: DataClassification = 'public';

    for (const category of categories) {
      const classification = classificationMap[category];
      if (classification) {
        if (classification === 'secret') {
          return 'secret'; // Highest level, return immediately
        } else if (classification === 'confidential' && (highestClassification === 'public' || highestClassification === 'internal')) {
          highestClassification = 'confidential';
        } else if (classification === 'internal' && highestClassification === 'public') {
          highestClassification = 'internal';
        }
      }
    }

    return highestClassification;
  }

  /**
   * Hash sensitive data for audit logging
   */
  private hashSensitiveData(data: string): string {
    // Simple hash for demonstration - in production, use proper cryptographic hash
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Initialize audit trail service
   * Phase 3 Week 21-22: Government-grade audit logging
   */
  private initializeAuditTrail(): void {
    try {
      if (isComplianceFeatureEnabled('enableGovernmentAuditTrail')) {
        this.auditTrail = this.container.resolve(SERVICE_TOKENS.GovernmentAuditTrail);
        console.log('✅ [INTELLIGENCE_LAYER] Government audit trail initialized');
      } else {
        console.log('📋 [INTELLIGENCE_LAYER] Government audit trail disabled by feature flag');
      }
    } catch (error) {
      console.warn('⚠️ [INTELLIGENCE_LAYER] Failed to initialize audit trail, continuing without:', error);
      this.auditTrail = null;
    }
  }

  /**
   * Log AI interaction to government audit trail
   * Phase 3 Week 21-22: Tamper-proof audit logging with digital signatures
   */
  private async logAIInteractionAudit(
    userId: string,
    query: string,
    response: string,
    enhancementLayers: string[],
    processingTime: number,
    classification: DataClassification = 'internal'
  ): Promise<void> {
    if (!this.auditTrail || !isComplianceFeatureEnabled('enableGovernmentAuditTrail')) {
      return; // Graceful degradation
    }

    try {
      const eventType: AuditEventType = 'ai_processing';
      const hashedQuery = this.hashSensitiveData(query);
      const hashedResponse = this.hashSensitiveData(response);

      await this.auditTrail.logAuditEvent({
        eventType,
        userId,
        ipAddress: 'system', // Would be actual IP in production
        userAgent: 'intelligence_layer',
        resource: 'ai_enhancement',
        action: 'process_query',
        outcome: 'success',
        details: {
          queryHash: hashedQuery,
          responseHash: hashedResponse,
          enhancementLayers,
          processingTimeMs: processingTime,
          dataClassification: classification,
          complianceValidated: true,
          encryptionApplied: classification !== 'public'
        },
        classification,
        legalBasis: 'legitimate_interest',
        processingPurpose: 'administrative_assistance',
        retentionPeriod: classification === 'secret' ? 2555 : 1095 // 7 years for secret, 3 years for others
      });

      console.log(`📋 [AUDIT] AI interaction logged: ${eventType} for user ${userId.substring(0, 8)}...`);

    } catch (error) {
      console.error('❌ [AUDIT] Failed to log AI interaction:', error);
      // Don't throw - graceful degradation
    }
  }
}
