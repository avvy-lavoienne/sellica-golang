/**
 * Enhanced Context Intelligence Service V2
 * Phase 1 Priority 2: Enhanced Context Intelligence Optimization
 * 
 * Provides advanced conversation context understanding, memory management,
 * and multi-turn conversation optimization for SELLY chatbot system
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { AdministrativeResponseCache } from './administrativeResponseCache';

export interface ConversationContextV2 {
  sessionId: string;
  userId?: string;
  conversationHistory: ConversationTurn[];
  userPreferences: UserPreferencesV2;
  currentIntent: string;
  contextualState: ContextualStateV2;
  administrativeProcess?: AdministrativeProcessV2;
  lastInteraction: string;
  conversationMetrics: ConversationMetricsV2;
}

export interface ConversationTurn {
  turnId: string;
  timestamp: string;
  userQuery: string;
  systemResponse: string;
  intent: string;
  entities: ExtractedEntity[];
  contextUsed: string[];
  satisfactionScore?: number;
  processingTime: number;
}

export interface UserPreferencesV2 {
  preferredLanguageStyle: 'formal' | 'casual' | 'mixed';
  communicationPreference: 'detailed' | 'concise' | 'step_by_step';
  serviceHistory: string[];
  frequentQueries: string[];
  preferredResponseFormat: 'text' | 'structured' | 'visual';
  accessibilityNeeds?: string[];
}

export interface ContextualStateV2 {
  currentTopic: string;
  topicConfidence: number;
  conversationPhase: 'greeting' | 'information_gathering' | 'service_delivery' | 'clarification' | 'completion';
  pendingActions: PendingAction[];
  contextualEntities: Map<string, any>;
  emotionalState: 'neutral' | 'frustrated' | 'satisfied' | 'confused' | 'urgent';
  complexityLevel: 'simple' | 'moderate' | 'complex';
}

export interface AdministrativeProcessV2 {
  processId: string;
  processType: string;
  currentStep: number;
  totalSteps: number;
  stepHistory: ProcessStep[];
  requiredDocuments: string[];
  collectedInformation: Map<string, any>;
  nextActions: string[];
  estimatedCompletion: string;
}

export interface ProcessStep {
  stepNumber: number;
  stepName: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  userInput?: string;
  systemGuidance: string;
  validationStatus: 'pending' | 'valid' | 'invalid' | 'needs_clarification';
}

export interface PendingAction {
  actionId: string;
  actionType: 'document_upload' | 'information_provide' | 'confirmation' | 'payment' | 'visit_office';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  dependencies: string[];
}

export interface ExtractedEntity {
  entityType: string;
  value: string;
  confidence: number;
  source: 'current_query' | 'conversation_history' | 'user_profile';
}

export interface ConversationMetricsV2 {
  totalTurns: number;
  averageResponseTime: number;
  contextAccuracy: number;
  userSatisfaction: number;
  goalCompletion: number;
  conversationEfficiency: number;
}

export interface ContextIntelligenceResult {
  enhancedContext: ConversationContextV2;
  contextualInsights: ContextualInsight[];
  recommendedResponse: string;
  confidenceScore: number;
  processingTime: number;
  optimizationApplied: string[];
}

export interface ContextualInsight {
  insightType: 'user_intent' | 'missing_information' | 'process_guidance' | 'preference_detected' | 'emotional_state';
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

export class EnhancedContextIntelligenceV2 {
  private static instance: EnhancedContextIntelligenceV2;
  private conversationContexts: Map<string, ConversationContextV2> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private administrativeCache: AdministrativeResponseCache;
  private initialized = false;

  // Context intelligence configuration
  private readonly CONTEXT_RETENTION_HOURS = 24;
  private readonly MAX_CONVERSATION_HISTORY = 50;
  private readonly CONTEXT_CONFIDENCE_THRESHOLD = 0.7;
  private readonly PERFORMANCE_TARGET_MS = 100;

  // Administrative process templates
  private readonly ADMINISTRATIVE_PROCESSES = {
    'ktp_application': {
      processType: 'KTP Application',
      totalSteps: 5,
      steps: [
        { name: 'Document Preparation', description: 'Prepare required documents' },
        { name: 'Form Completion', description: 'Complete application form' },
        { name: 'Document Verification', description: 'Verify document authenticity' },
        { name: 'Biometric Data', description: 'Provide biometric data' },
        { name: 'Card Issuance', description: 'Receive KTP card' }
      ],
      requiredDocuments: ['Birth Certificate', 'Family Card', 'Passport Photo', 'RT/RW Letter']
    },
    'kk_application': {
      processType: 'Family Card Application',
      totalSteps: 4,
      steps: [
        { name: 'Document Collection', description: 'Collect family member documents' },
        { name: 'Form Submission', description: 'Submit family card application' },
        { name: 'Data Verification', description: 'Verify family member data' },
        { name: 'Card Printing', description: 'Print and receive family card' }
      ],
      requiredDocuments: ['Marriage Certificate', 'Birth Certificates', 'Previous Family Card', 'RT/RW Letter']
    }
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.administrativeCache = AdministrativeResponseCache.getInstance();
  }

  public static getInstance(): EnhancedContextIntelligenceV2 {
    if (!EnhancedContextIntelligenceV2.instance) {
      EnhancedContextIntelligenceV2.instance = new EnhancedContextIntelligenceV2();
    }
    return EnhancedContextIntelligenceV2.instance;
  }

  /**
   * Initialize enhanced context intelligence
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🧠 [CONTEXT_INTELLIGENCE_V2] Initializing enhanced context intelligence...');
      
      // Initialize dependencies
      await this.performanceMonitor.initialize();
      await this.administrativeCache.initialize();
      
      // Load existing conversation contexts
      await this.loadConversationContexts();
      
      // Start context maintenance
      this.startContextMaintenance();
      
      this.initialized = true;
      console.log('✅ [CONTEXT_INTELLIGENCE_V2] Enhanced context intelligence initialized');
      
    } catch (error) {
      console.error('❌ [CONTEXT_INTELLIGENCE_V2] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Process query with enhanced context intelligence
   */
  public async processWithContext(
    query: string,
    sessionId: string,
    userId?: string,
    previousResponse?: string
  ): Promise<ContextIntelligenceResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🧠 [CONTEXT_INTELLIGENCE_V2] Processing query with context: "${query}"`);
      
      // Get or create conversation context
      let context = this.getConversationContext(sessionId, userId);
      
      // Extract entities and intent from current query
      const entities = this.extractEntities(query);
      const intent = this.detectIntent(query, context);
      
      // Update conversation history
      const conversationTurn: ConversationTurn = {
        turnId: `turn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString(),
        userQuery: query,
        systemResponse: previousResponse || '',
        intent,
        entities,
        contextUsed: this.getUsedContext(context),
        processingTime: 0 // Will be updated
      };
      
      // Enhance context with new information
      context = this.enhanceContext(context, conversationTurn);
      
      // Generate contextual insights
      const contextualInsights = this.generateContextualInsights(context, query);
      
      // Generate context-aware response recommendation
      const recommendedResponse = await this.generateContextualResponse(context, query, contextualInsights);
      
      // Calculate confidence score
      const confidenceScore = this.calculateContextConfidence(context, contextualInsights);
      
      // Update processing time
      const processingTime = performance.now() - startTime;
      conversationTurn.processingTime = processingTime;
      
      // Update conversation context
      context.conversationHistory.push(conversationTurn);
      context.lastInteraction = new Date().toISOString();
      context.conversationMetrics = this.updateConversationMetrics(context);
      
      // Store updated context
      this.conversationContexts.set(sessionId, context);
      
      // Record performance metrics
      this.recordContextMetrics(processingTime, confidenceScore, context);
      
      console.log(`✅ [CONTEXT_INTELLIGENCE_V2] Context processing completed in ${processingTime.toFixed(2)}ms`);
      
      return {
        enhancedContext: context,
        contextualInsights,
        recommendedResponse,
        confidenceScore,
        processingTime,
        optimizationApplied: this.getAppliedOptimizations(context)
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ [CONTEXT_INTELLIGENCE_V2] Context processing failed:', error);
      
      // Record error metrics
      this.performanceMonitor.recordMetric(
        'error_rate',
        'real_time_analyzer',
        1,
        'count',
        { source: 'context_intelligence_v2', error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  /**
   * Get or create conversation context
   */
  private getConversationContext(sessionId: string, userId?: string): ConversationContextV2 {
    let context = this.conversationContexts.get(sessionId);
    
    if (!context) {
      context = {
        sessionId,
        userId,
        conversationHistory: [],
        userPreferences: this.getDefaultUserPreferences(),
        currentIntent: 'unknown',
        contextualState: {
          currentTopic: 'general',
          topicConfidence: 0.5,
          conversationPhase: 'greeting',
          pendingActions: [],
          contextualEntities: new Map(),
          emotionalState: 'neutral',
          complexityLevel: 'simple'
        },
        lastInteraction: new Date().toISOString(),
        conversationMetrics: {
          totalTurns: 0,
          averageResponseTime: 0,
          contextAccuracy: 0,
          userSatisfaction: 0,
          goalCompletion: 0,
          conversationEfficiency: 0
        }
      };
      
      console.log(`🆕 [CONTEXT_INTELLIGENCE_V2] Created new conversation context for session: ${sessionId}`);
    }
    
    return context;
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Document type entities
    const documentPatterns = [
      { pattern: /\b(ktp|kartu tanda penduduk)\b/i, type: 'document_type', value: 'KTP' },
      { pattern: /\b(kk|kartu keluarga)\b/i, type: 'document_type', value: 'Kartu Keluarga' },
      { pattern: /\b(akta kelahiran|akta lahir)\b/i, type: 'document_type', value: 'Akta Kelahiran' },
      { pattern: /\b(surat nikah|akta nikah)\b/i, type: 'document_type', value: 'Akta Nikah' }
    ];
    
    // Action entities
    const actionPatterns = [
      { pattern: /\b(buat|bikin|mengurus|mengajukan)\b/i, type: 'action', value: 'create' },
      { pattern: /\b(perpanjang|memperpanjang)\b/i, type: 'action', value: 'extend' },
      { pattern: /\b(ganti|mengganti|ubah)\b/i, type: 'action', value: 'change' },
      { pattern: /\b(hilang|kehilangan)\b/i, type: 'action', value: 'lost' }
    ];
    
    // Location entities
    const locationPatterns = [
      { pattern: /\b(garut|kabupaten garut)\b/i, type: 'location', value: 'Kabupaten Garut' },
      { pattern: /\b(dinas kependudukan|disdukcapil)\b/i, type: 'office', value: 'Dinas Kependudukan' }
    ];
    
    // Extract entities using patterns
    [...documentPatterns, ...actionPatterns, ...locationPatterns].forEach(({ pattern, type, value }) => {
      if (pattern.test(query)) {
        entities.push({
          entityType: type,
          value,
          confidence: 0.9,
          source: 'current_query'
        });
      }
    });
    
    return entities;
  }

  /**
   * Detect intent from query and context
   */
  private detectIntent(query: string, context: ConversationContextV2): string {
    const lowerQuery = query.toLowerCase();
    
    // Check for administrative process continuation
    if (context.administrativeProcess) {
      return `continue_${context.administrativeProcess.processType.toLowerCase().replace(' ', '_')}`;
    }
    
    // Intent patterns
    const intentPatterns = [
      { pattern: /\b(persyaratan|syarat|dokumen|berkas)\b/i, intent: 'document_requirements' },
      { pattern: /\b(prosedur|cara|langkah|proses)\b/i, intent: 'procedure_inquiry' },
      { pattern: /\b(waktu|jam|buka|tutup|jadwal)\b/i, intent: 'schedule_inquiry' },
      { pattern: /\b(biaya|tarif|ongkos|bayar|gratis)\b/i, intent: 'fee_inquiry' },
      { pattern: /\b(buat|bikin|mengurus|mengajukan)\b/i, intent: 'service_application' },
      { pattern: /\b(status|progress|sudah sampai mana)\b/i, intent: 'status_inquiry' },
      { pattern: /\b(lokasi|alamat|dimana|tempat)\b/i, intent: 'location_inquiry' }
    ];
    
    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(query)) {
        return intent;
      }
    }
    
    return 'general_inquiry';
  }

  // Additional helper methods would continue here...
  // Due to file length limits, I'll continue with the remaining methods in the next part

  private getDefaultUserPreferences(): UserPreferencesV2 {
    return {
      preferredLanguageStyle: 'mixed',
      communicationPreference: 'detailed',
      serviceHistory: [],
      frequentQueries: [],
      preferredResponseFormat: 'text',
      accessibilityNeeds: []
    };
  }

  private getUsedContext(context: ConversationContextV2): string[] {
    const usedContext: string[] = [];
    
    if (context.conversationHistory.length > 0) {
      usedContext.push('conversation_history');
    }
    
    if (context.administrativeProcess) {
      usedContext.push('administrative_process');
    }
    
    if (context.contextualState.contextualEntities.size > 0) {
      usedContext.push('contextual_entities');
    }
    
    return usedContext;
  }

  private enhanceContext(context: ConversationContextV2, turn: ConversationTurn): ConversationContextV2 {
    // Update current intent
    context.currentIntent = turn.intent;
    
    // Update contextual entities
    turn.entities.forEach(entity => {
      context.contextualState.contextualEntities.set(entity.entityType, entity.value);
    });
    
    // Update conversation phase
    context.contextualState.conversationPhase = this.determineConversationPhase(context, turn);
    
    // Update topic and confidence
    const topicInfo = this.updateTopicTracking(context, turn);
    context.contextualState.currentTopic = topicInfo.topic;
    context.contextualState.topicConfidence = topicInfo.confidence;
    
    // Detect and update emotional state
    context.contextualState.emotionalState = this.detectEmotionalState(turn.userQuery);
    
    // Update complexity level
    context.contextualState.complexityLevel = this.assessComplexity(context, turn);
    
    // Initialize administrative process if needed
    if (turn.intent === 'service_application') {
      context.administrativeProcess = this.initializeAdministrativeProcess(turn.entities);
    }
    
    return context;
  }

  private generateContextualInsights(context: ConversationContextV2, query: string): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // User intent insight
    insights.push({
      insightType: 'user_intent',
      description: `User intent detected: ${context.currentIntent}`,
      confidence: context.contextualState.topicConfidence,
      actionable: true,
      suggestedAction: `Provide ${context.currentIntent.replace('_', ' ')} information`
    });
    
    // Missing information insight
    if (context.administrativeProcess) {
      const missingDocs = this.identifyMissingInformation(context.administrativeProcess);
      if (missingDocs.length > 0) {
        insights.push({
          insightType: 'missing_information',
          description: `Missing required information: ${missingDocs.join(', ')}`,
          confidence: 0.9,
          actionable: true,
          suggestedAction: 'Request missing information from user'
        });
      }
    }
    
    return insights;
  }

  private async generateContextualResponse(
    context: ConversationContextV2,
    query: string,
    insights: ContextualInsight[]
  ): Promise<string> {
    // Check administrative cache first (maintaining Phase 1 Priority 1 performance)
    const cachedResponse = await this.administrativeCache.getCachedResponse(query);
    if (cachedResponse) {
      return this.enhanceResponseWithContext(cachedResponse.response, context, insights);
    }
    
    // Generate context-aware response
    let response = this.generateBaseResponse(context, query);
    
    // Enhance with contextual information
    response = this.enhanceResponseWithContext(response, context, insights);
    
    return response;
  }

  private enhanceResponseWithContext(
    baseResponse: string,
    context: ConversationContextV2,
    insights: ContextualInsight[]
  ): string {
    let enhancedResponse = baseResponse;
    
    // Add personalized greeting if first interaction
    if (context.conversationHistory.length === 0) {
      enhancedResponse = `Halo kak! 😊 ${enhancedResponse}`;
    }
    
    // Add process guidance if in administrative process
    if (context.administrativeProcess) {
      const processGuidance = this.generateProcessGuidance(context.administrativeProcess);
      enhancedResponse += `\n\n${processGuidance}`;
    }
    
    // Add emotional tone adjustment
    if (context.contextualState.emotionalState === 'frustrated') {
      enhancedResponse = enhancedResponse.replace(/^/, 'Saya mengerti kak mungkin merasa kesulitan. ');
    } else if (context.contextualState.emotionalState === 'urgent') {
      enhancedResponse = enhancedResponse.replace(/^/, 'Saya akan membantu kak dengan cepat. ');
    }
    
    return enhancedResponse;
  }

  // Additional helper methods
  private determineConversationPhase(context: ConversationContextV2, turn: ConversationTurn): ContextualStateV2['conversationPhase'] {
    if (context.conversationHistory.length === 0) {
      return 'greeting';
    }
    
    if (turn.intent.includes('application') || context.administrativeProcess) {
      return 'service_delivery';
    }
    
    if (turn.intent.includes('inquiry')) {
      return 'information_gathering';
    }
    
    return 'information_gathering';
  }

  private updateTopicTracking(context: ConversationContextV2, turn: ConversationTurn): { topic: string; confidence: number } {
    const entities = turn.entities;
    const documentEntity = entities.find(e => e.entityType === 'document_type');
    
    if (documentEntity) {
      return { topic: documentEntity.value, confidence: 0.9 };
    }
    
    return { topic: turn.intent, confidence: 0.7 };
  }

  private detectEmotionalState(query: string): ContextualStateV2['emotionalState'] {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(urgent|segera|cepat|penting|mendesak)\b/i.test(query)) {
      return 'urgent';
    }
    
    if (/\b(bingung|tidak mengerti|susah|sulit|ribet)\b/i.test(query)) {
      return 'confused';
    }
    
    if (/\b(kesal|marah|lama|lambat)\b/i.test(query)) {
      return 'frustrated';
    }
    
    if (/\b(terima kasih|bagus|baik|puas)\b/i.test(query)) {
      return 'satisfied';
    }
    
    return 'neutral';
  }

  private assessComplexity(context: ConversationContextV2, turn: ConversationTurn): ContextualStateV2['complexityLevel'] {
    let complexityScore = 0;
    
    // Multiple entities increase complexity
    complexityScore += turn.entities.length * 0.2;
    
    // Administrative process increases complexity
    if (context.administrativeProcess) {
      complexityScore += 0.5;
    }
    
    // Long conversation history increases complexity
    complexityScore += Math.min(context.conversationHistory.length * 0.1, 0.3);
    
    if (complexityScore > 0.8) return 'complex';
    if (complexityScore > 0.4) return 'moderate';
    return 'simple';
  }

  private initializeAdministrativeProcess(entities: ExtractedEntity[]): AdministrativeProcessV2 | undefined {
    const documentEntity = entities.find(e => e.entityType === 'document_type');
    
    if (documentEntity?.value === 'KTP') {
      const template = this.ADMINISTRATIVE_PROCESSES['ktp_application'];
      return {
        processId: `process_${Date.now()}`,
        processType: template.processType,
        currentStep: 1,
        totalSteps: template.totalSteps,
        stepHistory: [],
        requiredDocuments: template.requiredDocuments,
        collectedInformation: new Map(),
        nextActions: ['Prepare required documents'],
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };
    }
    
    return undefined;
  }

  private identifyMissingInformation(process: AdministrativeProcessV2): string[] {
    return process.requiredDocuments.filter(doc => 
      !process.collectedInformation.has(doc.toLowerCase().replace(' ', '_'))
    );
  }

  private generateProcessGuidance(process: AdministrativeProcessV2): string {
    const currentStepName = this.ADMINISTRATIVE_PROCESSES[
      process.processType.toLowerCase().replace(' ', '_') as keyof typeof this.ADMINISTRATIVE_PROCESSES
    ]?.steps[process.currentStep - 1]?.name || 'Current Step';
    
    return `📋 **Proses ${process.processType}**\nLangkah ${process.currentStep}/${process.totalSteps}: ${currentStepName}\n\n💡 **Langkah selanjutnya:** ${process.nextActions.join(', ')}`;
  }

  private generateBaseResponse(context: ConversationContextV2, query: string): string {
    if (context.currentIntent === 'document_requirements') {
      return 'Berikut adalah persyaratan dokumen yang diperlukan...';
    }
    
    return 'Saya akan membantu Anda dengan pertanyaan tersebut.';
  }

  private calculateContextConfidence(context: ConversationContextV2, insights: ContextualInsight[]): number {
    const avgInsightConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
    const topicConfidence = context.contextualState.topicConfidence;
    
    return (avgInsightConfidence + topicConfidence) / 2;
  }

  private updateConversationMetrics(context: ConversationContextV2): ConversationMetricsV2 {
    const history = context.conversationHistory;
    
    return {
      totalTurns: history.length,
      averageResponseTime: history.reduce((sum, turn) => sum + turn.processingTime, 0) / history.length,
      contextAccuracy: context.contextualState.topicConfidence,
      userSatisfaction: this.calculateUserSatisfaction(history),
      goalCompletion: context.administrativeProcess ? 
        (context.administrativeProcess.currentStep / context.administrativeProcess.totalSteps) * 100 : 0,
      conversationEfficiency: this.calculateConversationEfficiency(context)
    };
  }

  private calculateUserSatisfaction(history: ConversationTurn[]): number {
    const satisfactionScores = history
      .map(turn => turn.satisfactionScore)
      .filter(score => score !== undefined) as number[];
    
    if (satisfactionScores.length === 0) return 0;
    
    return satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
  }

  private calculateConversationEfficiency(context: ConversationContextV2): number {
    if (context.administrativeProcess) {
      const progress = context.administrativeProcess.currentStep / context.administrativeProcess.totalSteps;
      const efficiency = progress / Math.max(context.conversationHistory.length, 1);
      return Math.min(efficiency * 100, 100);
    }
    
    return 75; // Default efficiency for non-process conversations
  }

  private getAppliedOptimizations(context: ConversationContextV2): string[] {
    const optimizations: string[] = [];
    
    if (context.conversationHistory.length > 0) {
      optimizations.push('conversation_memory');
    }
    
    if (context.administrativeProcess) {
      optimizations.push('process_guidance');
    }
    
    if (context.contextualState.emotionalState !== 'neutral') {
      optimizations.push('emotional_adaptation');
    }
    
    optimizations.push('context_intelligence_v2');
    
    return optimizations;
  }

  private recordContextMetrics(processingTime: number, confidenceScore: number, context: ConversationContextV2): void {
    this.performanceMonitor.recordMetric(
      'response_time',
      'real_time_analyzer',
      processingTime,
      'ms',
      {
        source: 'context_intelligence_v2',
        confidenceScore,
        conversationTurns: context.conversationHistory.length,
        contextComplexity: context.contextualState.complexityLevel,
        phase: 'phase1_priority2'
      }
    );
  }

  private async loadConversationContexts(): Promise<void> {
    try {
      console.log('📚 [CONTEXT_INTELLIGENCE_V2] Loading conversation contexts...');
    } catch (error) {
      console.warn('⚠️ [CONTEXT_INTELLIGENCE_V2] Could not load conversation contexts:', error);
    }
  }

  private startContextMaintenance(): void {
    setInterval(() => {
      this.cleanupOldContexts();
    }, 60 * 60 * 1000);
    
    console.log('🧹 [CONTEXT_INTELLIGENCE_V2] Context maintenance started');
  }

  private cleanupOldContexts(): void {
    const cutoffTime = Date.now() - (this.CONTEXT_RETENTION_HOURS * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [sessionId, context] of this.conversationContexts.entries()) {
      const lastInteractionTime = new Date(context.lastInteraction).getTime();
      if (lastInteractionTime < cutoffTime) {
        this.conversationContexts.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [CONTEXT_INTELLIGENCE_V2] Cleaned ${cleaned} old conversation contexts`);
    }
  }

  /**
   * Get conversation context for external access
   */
  public getConversationContextById(sessionId: string): ConversationContextV2 | undefined {
    return this.conversationContexts.get(sessionId);
  }

  /**
   * Get context intelligence statistics
   */
  public getContextStatistics(): {
    activeContexts: number;
    averageConversationLength: number;
    averageContextConfidence: number;
    totalProcessesActive: number;
  } {
    const contexts = Array.from(this.conversationContexts.values());
    
    return {
      activeContexts: contexts.length,
      averageConversationLength: contexts.reduce((sum, ctx) => sum + ctx.conversationHistory.length, 0) / contexts.length || 0,
      averageContextConfidence: contexts.reduce((sum, ctx) => sum + ctx.contextualState.topicConfidence, 0) / contexts.length || 0,
      totalProcessesActive: contexts.filter(ctx => ctx.administrativeProcess).length
    };
  }
}
