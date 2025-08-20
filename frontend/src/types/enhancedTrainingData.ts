/**
 * Enhanced Training Data Types for SELLY
 * Phase 1 Priority 1: Real User Data Collection System
 * 
 * Extends existing training data structures with real-time analysis,
 * conversation flow tracking, and user feedback collection capabilities
 */

// Base conversation step for tracking user interaction flow
export interface ConversationStep {
  stepId: string;
  timestamp: string;
  userInput: string;
  systemResponse: string;
  responseType: 'knowledge_base' | 'enhanced_ai' | 'fallback' | 'error';
  processingTime: number;
  confidence: number;
  contextUsed: string[];
  userSatisfaction?: number; // 1-5 scale
}

// Real-time query classification system
export interface QueryClassification {
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
  serviceType: string;
  complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  documentTypes: string[];
  requiredActions: string[];
  estimatedResolutionTime: number; // in minutes
  classificationTimestamp: string;
  classificationModel: string;
}

// Semantic analysis metadata for enhanced understanding
export interface SemanticMetadata {
  semanticSimilarity: number;
  keyPhrases: string[];
  namedEntities: NamedEntity[];
  sentiment: SentimentAnalysis;
  languageVariant: 'formal' | 'casual' | 'regional' | 'mixed';
  culturalContext: CulturalContext;
  topicClusters: string[];
  semanticEmbedding?: number[]; // Optional vector representation
  processingTimestamp: string;
}

// Named entity recognition results
export interface NamedEntity {
  text: string;
  label: 'PERSON' | 'LOCATION' | 'ORGANIZATION' | 'DOCUMENT' | 'DATE' | 'NUMBER' | 'OTHER';
  confidence: number;
  startIndex: number;
  endIndex: number;
}

// Sentiment analysis results
export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: EmotionScore[];
  tone: 'formal' | 'casual' | 'frustrated' | 'satisfied' | 'confused' | 'urgent';
  politeness: number; // 0-1 scale
}

// Emotion scoring for detailed sentiment analysis
export interface EmotionScore {
  emotion: 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust' | 'neutral';
  score: number; // 0-1 scale
}

// Cultural context analysis
export interface CulturalContext {
  region: 'jakarta' | 'garut' | 'sundanese' | 'javanese' | 'general_indonesian';
  formalityLevel: number; // 0-1 scale
  respectLevel: number; // 0-1 scale
  localTermsUsed: string[];
  culturalMarkers: string[];
}

// User feedback collection system
export interface UserFeedback {
  feedbackId: string;
  userId?: string;
  sessionId: string;
  queryId: string;
  timestamp: string;
  feedbackType: 'rating' | 'text' | 'thumbs' | 'detailed' | 'suggestion';
  
  // Rating feedback (1-5 scale)
  overallSatisfaction?: number;
  responseAccuracy?: number;
  responseSpeed?: number;
  responseHelpfulness?: number;
  userExperience?: number;
  
  // Text feedback
  textFeedback?: string;
  suggestions?: string;
  
  // Thumbs feedback
  thumbsUp?: boolean;
  
  // Detailed feedback
  detailedFeedback?: DetailedFeedback;
  
  // Metadata
  feedbackSource: 'chat_interface' | 'follow_up_survey' | 'proactive_request' | 'admin_review';
  responseContext: ResponseContext;
  userContext: UserContext;
}

// Detailed feedback structure
export interface DetailedFeedback {
  contentQuality: number; // 1-5
  personalization: number; // 1-5
  culturalAppropriateness: number; // 1-5
  responseTime: number; // 1-5
  completeness: number; // 1-5
  clarity: number; // 1-5
  actionability: number; // 1-5
  followUpNeeded: boolean;
  specificIssues: string[];
  positiveAspects: string[];
  improvementSuggestions: string[];
}

// Response context for feedback analysis
export interface ResponseContext {
  responseType: string;
  enhancementMode: boolean;
  enhancementLayers: string[];
  processingTime: number;
  fallbackUsed: boolean;
  knowledgeSourcesUsed: string[];
  personalizationApplied: boolean;
}

// User context for feedback analysis
export interface UserContext {
  isFirstTimeUser: boolean;
  previousInteractions: number;
  preferredCommunicationStyle: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timeOfDay: string;
  sessionDuration: number;
  queriesInSession: number;
}

// Enhanced unanswered query interface extending the original
export interface EnhancedUnansweredQuery {
  // Original UnansweredQuery fields
  id: string;
  timestamp: string;
  userId?: string;
  query: string;
  detectedServiceType: string;
  conversationContext: {
    previousMessages: string[];
    timeOfDay: string;
    isFirstInteraction: boolean;
  };
  responseGiven: string;
  responseType: 'fallback' | 'generic_ai' | 'error';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_training' | 'trained' | 'resolved';
  metadata: {
    confidence: number;
    complexity: 'simple' | 'medium' | 'complex';
    category: string;
    tags: string[];
  };
  
  // Enhanced fields for real-time analysis
  conversationFlow: ConversationStep[];
  realTimeClassification: QueryClassification;
  semanticAnalysis: SemanticMetadata;
  userFeedback?: UserFeedback[];
  
  // Additional enhancement metadata
  enhancementMetadata: {
    enhancedModeUsed: boolean;
    enhancementLayers: string[];
    personalizationApplied: boolean;
    contextIntelligenceUsed: boolean;
    qualityScore: number;
    improvementPotential: number; // 0-1 scale
    trainingValue: number; // 0-1 scale for prioritizing training data
  };
  
  // Analytics and tracking
  analyticsData: {
    sessionId: string;
    userAgent?: string;
    deviceInfo?: string;
    geolocation?: string;
    referrer?: string;
    sessionStartTime: string;
    totalSessionQueries: number;
    averageResponseTime: number;
  };
  
  // Resolution tracking
  resolutionData?: {
    resolvedBy: 'training' | 'manual_review' | 'system_improvement' | 'user_feedback';
    resolutionTimestamp: string;
    resolutionNotes: string;
    resolutionEffectiveness: number; // 0-1 scale
    followUpRequired: boolean;
  };
}

// Training data entry with enhanced capabilities
export interface EnhancedTrainingDataEntry {
  // Original fields
  query: string;
  expectedResponse: string;
  serviceType: string;
  category: string;
  priority: number;
  examples: string[];
  relatedQueries: string[];
  
  // Enhanced fields
  semanticVariations: string[];
  contextualExamples: ContextualExample[];
  qualityMetrics: TrainingQualityMetrics;
  validationResults: ValidationResults;
  learningOutcomes: LearningOutcome[];
}

// Contextual example for training
export interface ContextualExample {
  example: string;
  context: string;
  expectedOutcome: string;
  difficulty: 'easy' | 'medium' | 'hard';
  culturalRelevance: number; // 0-1 scale
}

// Training quality metrics
export interface TrainingQualityMetrics {
  dataQuality: number; // 0-1 scale
  representativeness: number; // 0-1 scale
  diversity: number; // 0-1 scale
  accuracy: number; // 0-1 scale
  completeness: number; // 0-1 scale
  freshness: number; // 0-1 scale (how recent the data is)
}

// Validation results for training data
export interface ValidationResults {
  validated: boolean;
  validatedBy: 'automated' | 'expert' | 'user_feedback' | 'cross_validation';
  validationTimestamp: string;
  validationScore: number; // 0-1 scale
  validationNotes: string;
  issuesFound: string[];
  recommendedImprovements: string[];
}

// Learning outcome tracking
export interface LearningOutcome {
  outcomeId: string;
  trainingTimestamp: string;
  modelVersion: string;
  performanceImprovement: number; // percentage improvement
  accuracyGain: number;
  userSatisfactionImpact: number;
  deploymentStatus: 'pending' | 'deployed' | 'rolled_back';
  notes: string;
}

// Real-time analytics data structure
export interface RealTimeAnalytics {
  timestamp: string;
  queryVolume: number;
  averageResponseTime: number;
  successRate: number;
  fallbackRate: number;
  userSatisfactionAverage: number;
  topQueries: string[];
  topIssues: string[];
  performanceMetrics: PerformanceMetrics;
}

// Performance metrics for monitoring
export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  accuracy: {
    queryUnderstanding: number;
    responseRelevance: number;
    taskCompletion: number;
  };
  efficiency: {
    cacheHitRate: number;
    memoryUsage: number;
    cpuUsage: number;
    throughput: number;
  };
}

// Export utility types for type checking
export type FeedbackType = UserFeedback['feedbackType'];
export type QueryComplexity = QueryClassification['complexity'];
export type ResponseType = ConversationStep['responseType'];
export type TrainingStatus = EnhancedUnansweredQuery['status'];
export type ResolutionMethod = NonNullable<EnhancedUnansweredQuery['resolutionData']>['resolvedBy'];
