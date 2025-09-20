/**
 * Multi-turn Conversation Optimization Service
 * Phase 1 Priority 2: Enhanced Context Intelligence Optimization
 * 
 * Provides advanced multi-step conversation handling for complex administrative
 * procedures requiring multiple interactions and clarifications
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { AdministrativeResponseCache } from './administrativeResponseCache';
import { ConversationContextV2, AdministrativeProcessV2, ProcessStep } from './enhancedContextIntelligenceV2';

export interface MultiTurnConversation {
  conversationId: string;
  userId?: string;
  sessionId: string;
  conversationType: 'document_application' | 'information_gathering' | 'problem_resolution' | 'service_guidance';
  currentPhase: ConversationPhase;
  totalPhases: number;
  conversationFlow: ConversationFlowStep[];
  administrativeProcess?: AdministrativeProcessV2;
  collectedInformation: Map<string, CollectedInformation>;
  pendingClarifications: PendingClarification[];
  conversationState: ConversationState;
  optimizationMetrics: OptimizationMetrics;
}

export interface ConversationPhase {
  phaseId: string;
  phaseName: string;
  phaseType: 'initiation' | 'information_collection' | 'verification' | 'guidance' | 'completion';
  requiredInformation: RequiredInformation[];
  optionalInformation: RequiredInformation[];
  validationRules: ValidationRule[];
  nextPhaseConditions: NextPhaseCondition[];
  estimatedDuration: number; // in minutes
}

export interface ConversationFlowStep {
  stepId: string;
  stepNumber: number;
  stepType: 'user_input' | 'system_response' | 'information_request' | 'clarification' | 'confirmation';
  timestamp: string;
  content: string;
  metadata: StepMetadata;
  processingTime: number;
  success: boolean;
}

export interface RequiredInformation {
  informationId: string;
  informationType: 'document' | 'personal_data' | 'preference' | 'confirmation' | 'selection';
  fieldName: string;
  displayName: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'file' | 'selection';
  validationPattern?: string;
  required: boolean;
  collected: boolean;
  collectedAt?: string;
  value?: any;
}

export interface CollectedInformation {
  informationId: string;
  value: any;
  collectedAt: string;
  source: 'user_input' | 'system_inference' | 'document_extraction';
  confidence: number;
  validated: boolean;
  validationErrors?: string[];
}

export interface PendingClarification {
  clarificationId: string;
  clarificationType: 'missing_information' | 'ambiguous_input' | 'validation_error' | 'process_guidance';
  question: string;
  context: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedResponseType: 'text' | 'selection' | 'confirmation' | 'document';
  options?: string[];
  createdAt: string;
  attempts: number;
}

export interface ValidationRule {
  ruleId: string;
  ruleType: 'format' | 'range' | 'dependency' | 'business_logic';
  fieldName: string;
  condition: string;
  errorMessage: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface NextPhaseCondition {
  conditionId: string;
  conditionType: 'information_complete' | 'validation_passed' | 'user_confirmation' | 'system_approval';
  description: string;
  required: boolean;
  met: boolean;
}

export interface ConversationState {
  currentPhaseIndex: number;
  completionPercentage: number;
  blockedBy: string[];
  canProceed: boolean;
  estimatedTimeRemaining: number; // in minutes
  lastActivity: string;
  conversationHealth: 'healthy' | 'stalled' | 'error' | 'abandoned';
}

export interface StepMetadata {
  intent: string;
  entities: any[];
  confidence: number;
  contextUsed: string[];
  optimizationApplied: string[];
  cacheHit: boolean;
}

export interface OptimizationMetrics {
  totalSteps: number;
  averageStepTime: number;
  informationCollectionEfficiency: number;
  clarificationRate: number;
  completionRate: number;
  userSatisfactionScore: number;
  processOptimizationScore: number;
}

export interface MultiTurnOptimizationResult {
  conversation: MultiTurnConversation;
  nextRecommendedAction: RecommendedAction;
  optimizationSuggestions: OptimizationSuggestion[];
  processingTime: number;
  performanceMetrics: PerformanceMetrics;
}

export interface RecommendedAction {
  actionType: 'request_information' | 'provide_guidance' | 'seek_clarification' | 'proceed_next_phase' | 'complete_process';
  actionDescription: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  requiredInputs: string[];
  expectedOutcome: string;
}

export interface OptimizationSuggestion {
  suggestionType: 'flow_improvement' | 'information_consolidation' | 'clarification_reduction' | 'phase_optimization';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  estimatedBenefit: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  cacheUtilization: number;
  contextAccuracy: number;
  optimizationEffectiveness: number;
}

export class MultiTurnConversationOptimization {
  private static instance: MultiTurnConversationOptimization;
  private activeConversations: Map<string, MultiTurnConversation> = new Map();
  private conversationTemplates: Map<string, ConversationTemplate> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private administrativeCache: AdministrativeResponseCache;
  private initialized = false;

  // Configuration
  private readonly MAX_ACTIVE_CONVERSATIONS = 1000;
  private readonly CONVERSATION_TIMEOUT_HOURS = 24;
  private readonly MAX_CLARIFICATION_ATTEMPTS = 3;
  private readonly PERFORMANCE_TARGET_MS = 150;

  // Conversation templates for common administrative processes
  private readonly CONVERSATION_TEMPLATES = {
    'ktp_application': {
      conversationType: 'document_application' as const,
      totalPhases: 4,
      phases: [
        {
          phaseName: 'Initial Information',
          phaseType: 'initiation' as const,
          requiredInformation: [
            { fieldName: 'full_name', displayName: 'Nama Lengkap', dataType: 'string' as const, required: true },
            { fieldName: 'birth_date', displayName: 'Tanggal Lahir', dataType: 'date' as const, required: true },
            { fieldName: 'birth_place', displayName: 'Tempat Lahir', dataType: 'string' as const, required: true }
          ],
          estimatedDuration: 5
        },
        {
          phaseName: 'Document Collection',
          phaseType: 'information_collection' as const,
          requiredInformation: [
            { fieldName: 'birth_certificate', displayName: 'Akta Kelahiran', dataType: 'file' as const, required: true },
            { fieldName: 'family_card', displayName: 'Kartu Keluarga', dataType: 'file' as const, required: true },
            { fieldName: 'photo', displayName: 'Pas Foto', dataType: 'file' as const, required: true }
          ],
          estimatedDuration: 10
        },
        {
          phaseName: 'Verification',
          phaseType: 'verification' as const,
          requiredInformation: [
            { fieldName: 'address_confirmation', displayName: 'Konfirmasi Alamat', dataType: 'string' as const, required: true },
            { fieldName: 'contact_number', displayName: 'Nomor Kontak', dataType: 'string' as const, required: true }
          ],
          estimatedDuration: 5
        },
        {
          phaseName: 'Completion',
          phaseType: 'completion' as const,
          requiredInformation: [
            { fieldName: 'pickup_preference', displayName: 'Preferensi Pengambilan', dataType: 'selection' as const, required: true }
          ],
          estimatedDuration: 2
        }
      ]
    }
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.administrativeCache = AdministrativeResponseCache.getInstance();
  }

  public static getInstance(): MultiTurnConversationOptimization {
    if (!MultiTurnConversationOptimization.instance) {
      MultiTurnConversationOptimization.instance = new MultiTurnConversationOptimization();
    }
    return MultiTurnConversationOptimization.instance;
  }

  /**
   * Initialize multi-turn conversation optimization
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 [MULTI_TURN_OPTIMIZATION] Initializing multi-turn conversation optimization...');
      
      // Initialize dependencies
      await this.performanceMonitor.initialize();
      await this.administrativeCache.initialize();
      
      // Load conversation templates
      this.loadConversationTemplates();
      
      // Start conversation maintenance
      this.startConversationMaintenance();
      
      this.initialized = true;
      console.log('✅ [MULTI_TURN_OPTIMIZATION] Multi-turn conversation optimization initialized');
      
    } catch (error) {
      console.error('❌ [MULTI_TURN_OPTIMIZATION] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Optimize multi-turn conversation
   */
  public async optimizeConversation(
    sessionId: string,
    userId: string | undefined,
    currentQuery: string,
    conversationContext: ConversationContextV2
  ): Promise<MultiTurnOptimizationResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🔄 [MULTI_TURN_OPTIMIZATION] Optimizing conversation for session: ${sessionId}`);
      
      // Get or create multi-turn conversation
      let conversation = this.getOrCreateConversation(sessionId, userId, conversationContext);
      
      // Process current query in conversation context
      conversation = await this.processConversationStep(conversation, currentQuery, conversationContext);
      
      // Update conversation state
      this.updateConversationState(conversation);
      
      // Generate next recommended action
      const nextRecommendedAction = this.generateRecommendedAction(conversation);
      
      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(conversation);
      
      // Update optimization metrics
      this.updateOptimizationMetrics(conversation);
      
      // Store updated conversation
      this.activeConversations.set(sessionId, conversation);
      
      const processingTime = performance.now() - startTime;
      
      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(conversation, processingTime);
      
      // Record performance metrics
      this.recordOptimizationMetrics(processingTime, conversation);
      
      console.log(`✅ [MULTI_TURN_OPTIMIZATION] Conversation optimization completed in ${processingTime.toFixed(2)}ms`);
      
      return {
        conversation,
        nextRecommendedAction,
        optimizationSuggestions,
        processingTime,
        performanceMetrics
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ [MULTI_TURN_OPTIMIZATION] Conversation optimization failed:', error);
      
      // Record error metrics
      this.performanceMonitor.recordMetric(
        'error_rate',
        'real_time_analyzer',
        1,
        'count',
        { source: 'multi_turn_optimization', error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  /**
   * Get or create multi-turn conversation
   */
  private getOrCreateConversation(
    sessionId: string,
    userId: string | undefined,
    context: ConversationContextV2
  ): MultiTurnConversation {
    let conversation = this.activeConversations.get(sessionId);
    
    if (!conversation) {
      const conversationType = this.determineConversationType(context);
      const template = this.conversationTemplates.get(conversationType);
      
      conversation = {
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        sessionId,
        conversationType,
        currentPhase: (template?.phases[0] || this.createDefaultPhase()) as ConversationPhase,
        totalPhases: template?.totalPhases || 1,
        conversationFlow: [],
        administrativeProcess: context.administrativeProcess,
        collectedInformation: new Map(),
        pendingClarifications: [],
        conversationState: {
          currentPhaseIndex: 0,
          completionPercentage: 0,
          blockedBy: [],
          canProceed: true,
          estimatedTimeRemaining: template?.phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0) || 10,
          lastActivity: new Date().toISOString(),
          conversationHealth: 'healthy'
        },
        optimizationMetrics: {
          totalSteps: 0,
          averageStepTime: 0,
          informationCollectionEfficiency: 0,
          clarificationRate: 0,
          completionRate: 0,
          userSatisfactionScore: 0,
          processOptimizationScore: 0
        }
      };
      
      console.log(`🆕 [MULTI_TURN_OPTIMIZATION] Created new conversation: ${conversation.conversationId}`);
      this.activeConversations.set(sessionId, conversation);
    }

    return conversation;
  }

  /**
   * Process conversation step
   */
  private async processConversationStep(
    conversation: MultiTurnConversation,
    query: string,
    context: ConversationContextV2
  ): Promise<MultiTurnConversation> {
    const stepStartTime = performance.now();
    
    // Create conversation flow step
    const flowStep: ConversationFlowStep = {
      stepId: `step_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      stepNumber: conversation.conversationFlow.length + 1,
      stepType: 'user_input',
      timestamp: new Date().toISOString(),
      content: query,
      metadata: {
        intent: context.currentIntent,
        entities: [],
        confidence: context.contextualState.topicConfidence,
        contextUsed: ['conversation_history', 'administrative_process'],
        optimizationApplied: [],
        cacheHit: false
      },
      processingTime: 0,
      success: true
    };
    
    // Extract information from query
    const extractedInfo = this.extractInformationFromQuery(query, conversation.currentPhase);
    
    // Update collected information
    extractedInfo.forEach(info => {
      conversation.collectedInformation.set(info.informationId, info);
    });
    
    // Check for clarifications needed
    const clarifications = this.identifyRequiredClarifications(conversation, query);
    conversation.pendingClarifications.push(...clarifications);
    
    // Update processing time
    flowStep.processingTime = performance.now() - stepStartTime;
    
    // Add step to conversation flow
    conversation.conversationFlow.push(flowStep);
    
    // Generate system response step
    const responseStep = await this.generateSystemResponseStep(conversation, context);
    conversation.conversationFlow.push(responseStep);
    
    return conversation;
  }

  /**
   * Update conversation state
   */
  private updateConversationState(conversation: MultiTurnConversation): void {
    const state = conversation.conversationState;
    
    // Update completion percentage
    const requiredInfo = conversation.currentPhase.requiredInformation;
    const collectedCount = requiredInfo.filter(info => 
      conversation.collectedInformation.has(info.informationId)
    ).length;
    
    state.completionPercentage = (collectedCount / requiredInfo.length) * 100;
    
    // Check if can proceed to next phase
    state.canProceed = collectedCount === requiredInfo.length && conversation.pendingClarifications.length === 0;
    
    // Update blocked by
    state.blockedBy = [];
    if (conversation.pendingClarifications.length > 0) {
      state.blockedBy.push('pending_clarifications');
    }
    
    const missingInfo = requiredInfo.filter(info => !conversation.collectedInformation.has(info.informationId));
    if (missingInfo.length > 0) {
      state.blockedBy.push('missing_information');
    }
    
    // Update conversation health
    if (conversation.pendingClarifications.length > 3) {
      state.conversationHealth = 'stalled';
    } else if (state.blockedBy.length > 0) {
      state.conversationHealth = 'error';
    } else {
      state.conversationHealth = 'healthy';
    }
    
    // Update last activity
    state.lastActivity = new Date().toISOString();
    
    // Update estimated time remaining
    const currentPhaseProgress = state.completionPercentage / 100;
    const currentPhaseTimeRemaining = conversation.currentPhase.estimatedDuration * (1 - currentPhaseProgress);
    const remainingPhases = conversation.totalPhases - state.currentPhaseIndex - 1;
    state.estimatedTimeRemaining = currentPhaseTimeRemaining + (remainingPhases * 5); // Estimate 5 min per remaining phase
  }

  /**
   * Generate recommended action
   */
  private generateRecommendedAction(conversation: MultiTurnConversation): RecommendedAction {
    const state = conversation.conversationState;
    
    // Handle pending clarifications first
    if (conversation.pendingClarifications.length > 0) {
      const highPriorityClarification = conversation.pendingClarifications
        .filter(c => c.priority === 'high' || c.priority === 'critical')[0] ||
        conversation.pendingClarifications[0];
      
      return {
        actionType: 'seek_clarification',
        actionDescription: `Clarify: ${highPriorityClarification.question}`,
        priority: highPriorityClarification.priority === 'critical' ? 'urgent' : highPriorityClarification.priority,
        estimatedTime: 2,
        requiredInputs: [highPriorityClarification.expectedResponseType],
        expectedOutcome: 'Resolve clarification and continue process'
      };
    }
    
    // Check for missing information
    const missingInfo = conversation.currentPhase.requiredInformation.filter(info => 
      !conversation.collectedInformation.has(info.informationId)
    );
    
    if (missingInfo.length > 0) {
      const nextInfo = missingInfo[0];
      return {
        actionType: 'request_information',
        actionDescription: `Request ${nextInfo.displayName}`,
        priority: 'medium',
        estimatedTime: 3,
        requiredInputs: [nextInfo.dataType],
        expectedOutcome: `Collect ${nextInfo.displayName} information`
      };
    }
    
    // Check if can proceed to next phase
    if (state.canProceed && state.currentPhaseIndex < conversation.totalPhases - 1) {
      return {
        actionType: 'proceed_next_phase',
        actionDescription: 'Proceed to next phase of the process',
        priority: 'high',
        estimatedTime: 1,
        requiredInputs: [],
        expectedOutcome: 'Move to next phase'
      };
    }
    
    // Check if process is complete
    if (state.currentPhaseIndex === conversation.totalPhases - 1 && state.completionPercentage >= 100) {
      return {
        actionType: 'complete_process',
        actionDescription: 'Complete the administrative process',
        priority: 'high',
        estimatedTime: 1,
        requiredInputs: [],
        expectedOutcome: 'Process completion'
      };
    }
    
    // Default guidance action
    return {
      actionType: 'provide_guidance',
      actionDescription: 'Provide process guidance and next steps',
      priority: 'medium',
      estimatedTime: 2,
      requiredInputs: [],
      expectedOutcome: 'User understanding of next steps'
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(conversation: MultiTurnConversation): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Flow improvement suggestions
    if (conversation.optimizationMetrics.clarificationRate > 0.3) {
      suggestions.push({
        suggestionType: 'clarification_reduction',
        description: 'High clarification rate detected - improve initial information collection',
        impact: 'high',
        implementationComplexity: 'moderate',
        estimatedBenefit: 'Reduce conversation length by 20-30%'
      });
    }
    
    // Information consolidation
    if (conversation.conversationFlow.length > 10) {
      suggestions.push({
        suggestionType: 'information_consolidation',
        description: 'Long conversation detected - consolidate information requests',
        impact: 'medium',
        implementationComplexity: 'simple',
        estimatedBenefit: 'Improve user experience and reduce steps'
      });
    }
    
    // Phase optimization
    if (conversation.optimizationMetrics.averageStepTime > 300) { // 5 minutes
      suggestions.push({
        suggestionType: 'phase_optimization',
        description: 'Long step times detected - optimize phase structure',
        impact: 'high',
        implementationComplexity: 'complex',
        estimatedBenefit: 'Reduce overall process time by 40%'
      });
    }
    
    return suggestions;
  }

  /**
   * Update optimization metrics
   */
  private updateOptimizationMetrics(conversation: MultiTurnConversation): void {
    const metrics = conversation.optimizationMetrics;
    const flow = conversation.conversationFlow;
    
    metrics.totalSteps = flow.length;
    
    if (flow.length > 0) {
      metrics.averageStepTime = flow.reduce((sum, step) => sum + step.processingTime, 0) / flow.length;
    }
    
    const totalRequired = conversation.currentPhase.requiredInformation.length;
    const collected = conversation.collectedInformation.size;
    metrics.informationCollectionEfficiency = totalRequired > 0 ? (collected / totalRequired) * 100 : 0;
    
    metrics.clarificationRate = flow.length > 0 ? (conversation.pendingClarifications.length / flow.length) : 0;
    
    metrics.completionRate = conversation.conversationState.completionPercentage;
    
    // Calculate process optimization score
    metrics.processOptimizationScore = Math.min(
      (metrics.informationCollectionEfficiency + 
       (100 - metrics.clarificationRate * 100) + 
       metrics.completionRate) / 3,
      100
    );
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(conversation: MultiTurnConversation, processingTime: number): PerformanceMetrics {
    const cacheHits = conversation.conversationFlow.filter(step => step.metadata.cacheHit).length;
    const cacheUtilization = conversation.conversationFlow.length > 0 ? 
      (cacheHits / conversation.conversationFlow.length) * 100 : 0;
    
    return {
      responseTime: processingTime,
      cacheUtilization,
      contextAccuracy: conversation.conversationState.completionPercentage,
      optimizationEffectiveness: conversation.optimizationMetrics.processOptimizationScore
    };
  }

  // Helper methods
  private determineConversationType(context: ConversationContextV2): MultiTurnConversation['conversationType'] {
    if (context.administrativeProcess) {
      return 'document_application';
    }
    
    if (context.currentIntent.includes('inquiry')) {
      return 'information_gathering';
    }
    
    return 'service_guidance';
  }

  private createDefaultPhase(): ConversationPhase {
    return {
      phaseId: 'default_phase',
      phaseName: 'Information Gathering',
      phaseType: 'information_collection',
      requiredInformation: [],
      optionalInformation: [],
      validationRules: [],
      nextPhaseConditions: [],
      estimatedDuration: 5
    };
  }

  private extractInformationFromQuery(query: string, phase: ConversationPhase): CollectedInformation[] {
    const extracted: CollectedInformation[] = [];
    
    // Simple extraction logic - would be more sophisticated in practice
    phase.requiredInformation.forEach(reqInfo => {
      if (query.toLowerCase().includes(reqInfo.fieldName.toLowerCase())) {
        extracted.push({
          informationId: reqInfo.informationId,
          value: query, // Simplified - would extract actual value
          collectedAt: new Date().toISOString(),
          source: 'user_input',
          confidence: 0.8,
          validated: false
        });
      }
    });
    
    return extracted;
  }

  private identifyRequiredClarifications(conversation: MultiTurnConversation, query: string): PendingClarification[] {
    const clarifications: PendingClarification[] = [];
    
    // Check for ambiguous input
    if (query.length < 10 || query.split(' ').length < 3) {
      clarifications.push({
        clarificationId: `clarification_${Date.now()}`,
        clarificationType: 'ambiguous_input',
        question: 'Could you please provide more details about your request?',
        context: query,
        priority: 'medium',
        expectedResponseType: 'text',
        createdAt: new Date().toISOString(),
        attempts: 0
      });
    }
    
    return clarifications;
  }

  private async generateSystemResponseStep(
    conversation: MultiTurnConversation,
    context: ConversationContextV2
  ): Promise<ConversationFlowStep> {
    const stepStartTime = performance.now();
    
    // Generate appropriate response based on conversation state
    let responseContent = 'Thank you for the information. ';
    
    if (conversation.pendingClarifications.length > 0) {
      responseContent += conversation.pendingClarifications[0].question;
    } else {
      const missingInfo = conversation.currentPhase.requiredInformation.filter(info => 
        !conversation.collectedInformation.has(info.informationId)
      );
      
      if (missingInfo.length > 0) {
        responseContent += `Please provide your ${missingInfo[0].displayName}.`;
      } else {
        responseContent += 'All required information has been collected for this phase.';
      }
    }
    
    const processingTime = performance.now() - stepStartTime;
    
    return {
      stepId: `step_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      stepNumber: conversation.conversationFlow.length + 1,
      stepType: 'system_response',
      timestamp: new Date().toISOString(),
      content: responseContent,
      metadata: {
        intent: 'system_guidance',
        entities: [],
        confidence: 0.9,
        contextUsed: ['conversation_state', 'phase_requirements'],
        optimizationApplied: ['multi_turn_optimization'],
        cacheHit: false
      },
      processingTime,
      success: true
    };
  }

  private recordOptimizationMetrics(processingTime: number, conversation: MultiTurnConversation): void {
    this.performanceMonitor.recordMetric(
      'response_time',
      'real_time_analyzer',
      processingTime,
      'ms',
      {
        source: 'multi_turn_optimization',
        conversationId: conversation.conversationId,
        conversationType: conversation.conversationType,
        currentPhase: conversation.conversationState.currentPhaseIndex,
        completionPercentage: conversation.conversationState.completionPercentage,
        phase: 'phase1_priority2'
      }
    );
  }

  private loadConversationTemplates(): void {
    // Load conversation templates from configuration
    Object.entries(this.CONVERSATION_TEMPLATES).forEach(([key, template]) => {
      this.conversationTemplates.set(key, template as any);
    });
    
    console.log(`📚 [MULTI_TURN_OPTIMIZATION] Loaded ${this.conversationTemplates.size} conversation templates`);
  }

  private startConversationMaintenance(): void {
    // Clean up old conversations every hour
    setInterval(() => {
      this.cleanupOldConversations();
    }, 60 * 60 * 1000);
    
    console.log('🧹 [MULTI_TURN_OPTIMIZATION] Conversation maintenance started');
  }

  private cleanupOldConversations(): void {
    const cutoffTime = Date.now() - (this.CONVERSATION_TIMEOUT_HOURS * 60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [sessionId, conversation] of this.activeConversations.entries()) {
      const lastActivityTime = new Date(conversation.conversationState.lastActivity).getTime();
      if (lastActivityTime < cutoffTime) {
        this.activeConversations.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [MULTI_TURN_OPTIMIZATION] Cleaned ${cleaned} old conversations`);
    }
  }

  /**
   * Get conversation statistics
   */
  public getConversationStatistics(): {
    activeConversations: number;
    averageCompletionRate: number;
    averageStepsPerConversation: number;
    conversationHealthDistribution: Record<string, number>;
  } {
    const conversations = Array.from(this.activeConversations.values());
    
    const healthDistribution: Record<string, number> = {
      healthy: 0,
      stalled: 0,
      error: 0,
      abandoned: 0
    };
    
    conversations.forEach(conv => {
      healthDistribution[conv.conversationState.conversationHealth]++;
    });
    
    return {
      activeConversations: conversations.length,
      averageCompletionRate: conversations.reduce((sum, conv) => sum + conv.conversationState.completionPercentage, 0) / conversations.length || 0,
      averageStepsPerConversation: conversations.reduce((sum, conv) => sum + conv.conversationFlow.length, 0) / conversations.length || 0,
      conversationHealthDistribution: healthDistribution
    };
  }

  /**
   * Get conversation by session ID
   */
  public getConversationBySessionId(sessionId: string): MultiTurnConversation | undefined {
    return this.activeConversations.get(sessionId);
  }
}

interface ConversationTemplate {
  conversationType: MultiTurnConversation['conversationType'];
  totalPhases: number;
  phases: Omit<ConversationPhase, 'phaseId' | 'validationRules' | 'nextPhaseConditions'>[];
}
