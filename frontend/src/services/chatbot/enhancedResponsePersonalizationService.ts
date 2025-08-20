/**
 * Enhanced Response Personalization Service
 * Phase 2: Intelligence Enhancement - Advanced Response Personalization
 * 
 * Provides intelligent response personalization based on user context,
 * conversation history, and adaptive learning from user interactions.
 * 
 * Created: 2025-08-13
 * Version: 2.0
 * Compliance: WCAG 2.1 AA, Indonesian Cultural Adaptation
 */

import { PersonalizedContext, EnhancedConversationContextManager } from './enhancedConversationContextManager';
import { EnhancedUserContext } from './enhancedUserContextService';

export interface PersonalizationStrategy {
  name: string;
  priority: number;
  applicableContexts: string[];
  transform: (content: string, context: PersonalizedContext) => string;
}

export interface PersonalizationResult {
  originalContent: string;
  personalizedContent: string;
  strategiesApplied: string[];
  personalizationScore: number;
  personalizationApplied: boolean;
  culturalAdaptation: boolean;
  userSpecificElements: {
    nameUsage: boolean;
    roleAwareness: boolean;
    preferenceAlignment: boolean;
    conversationContinuity: boolean;
  };
}

export interface AdaptiveLearning {
  userInteractionPatterns: {
    preferredGreetingStyle: string;
    responseLength: 'short' | 'medium' | 'long';
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    formalityPreference: 'casual' | 'professional' | 'formal';
  };
  conversationInsights: {
    frequentTopics: string[];
    successfulResponsePatterns: string[];
    userSatisfactionIndicators: string[];
  };
  adaptationHistory: {
    timestamp: Date;
    strategy: string;
    effectiveness: number;
  }[];
}

/**
 * Enhanced Response Personalization Service
 * Provides intelligent, context-aware response personalization
 */
export class EnhancedResponsePersonalizationService {
  private static instance: EnhancedResponsePersonalizationService;
  private contextManager: EnhancedConversationContextManager;
  private personalizationStrategies: PersonalizationStrategy[] = [];
  private adaptiveLearningCache = new Map<string, AdaptiveLearning>();

  public static getInstance(): EnhancedResponsePersonalizationService {
    if (!EnhancedResponsePersonalizationService.instance) {
      EnhancedResponsePersonalizationService.instance = new EnhancedResponsePersonalizationService();
    }
    return EnhancedResponsePersonalizationService.instance;
  }

  constructor() {
    this.contextManager = EnhancedConversationContextManager.getInstance();
    this.initializePersonalizationStrategies();
  }

  /**
   * Personalize response with comprehensive context awareness
   */
  public async personalizeResponse(
    originalContent: string,
    sessionId: string,
    userId?: string,
    query?: string
  ): Promise<PersonalizationResult> {
    try {
      // Get personalized context
      const context = await this.contextManager.getPersonalizedContext(sessionId, userId);
      
      // Apply personalization strategies
      let personalizedContent = originalContent;
      const strategiesApplied: string[] = [];
      let personalizationScore = 0;

      // Sort strategies by priority and apply them
      const applicableStrategies = this.getApplicableStrategies(context);
      
      for (const strategy of applicableStrategies) {
        const beforeContent = personalizedContent;
        personalizedContent = strategy.transform(personalizedContent, context);
        
        if (beforeContent !== personalizedContent) {
          strategiesApplied.push(strategy.name);
          personalizationScore += strategy.priority * 0.1;
        }
      }

      // Apply adaptive learning insights
      if (userId) {
        personalizedContent = await this.applyAdaptiveLearning(
          personalizedContent,
          userId,
          context
        );
      }

      // Analyze personalization elements
      const userSpecificElements = this.analyzePersonalizationElements(
        originalContent,
        personalizedContent,
        context
      );

      // Update adaptive learning
      if (userId && query) {
        await this.updateAdaptiveLearning(userId, query, originalContent, personalizedContent);
      }

      return {
        originalContent,
        personalizedContent,
        strategiesApplied,
        personalizationScore: Math.min(personalizationScore, 1.0),
        personalizationApplied: strategiesApplied.length > 0,
        culturalAdaptation: strategiesApplied.includes('cultural_adaptation'),
        userSpecificElements
      };

    } catch (error) {
      console.error('❌ [RESPONSE_PERSONALIZATION] Personalization failed:', error);
      return {
        originalContent,
        personalizedContent: originalContent,
        strategiesApplied: [],
        personalizationScore: 0,
        personalizationApplied: false,
        culturalAdaptation: false,
        userSpecificElements: {
          nameUsage: false,
          roleAwareness: false,
          preferenceAlignment: false,
          conversationContinuity: false
        }
      };
    }
  }

  /**
   * Initialize personalization strategies
   */
  private initializePersonalizationStrategies(): void {
    this.personalizationStrategies = [
      // High Priority Strategies
      {
        name: 'user_name_integration',
        priority: 10,
        applicableContexts: ['authenticated'],
        transform: (content: string, context: PersonalizedContext) => {
          if (!context.userProfile?.nama_lengkap) return content;
          
          return content
            .replace(/\bPengguna\b/g, context.userProfile.nama_lengkap)
            .replace(/\bAnda\b/g, `${context.userProfile.preferredAddress} ${context.userProfile.nama_lengkap}`)
            .replace(/\bKak\b/g, context.userProfile.preferredAddress);
        }
      },
      
      {
        name: 'role_based_formality',
        priority: 9,
        applicableContexts: ['authenticated'],
        transform: (content: string, context: PersonalizedContext) => {
          if (!context.userProfile?.role) return content;
          
          const formalityLevel = context.adaptiveSettings.formalityLevel;
          
          if (formalityLevel > 0.8) {
            return content
              .replace(/bisa/g, 'dapat')
              .replace(/gimana/g, 'bagaimana')
              .replace(/udah/g, 'sudah');
          }
          
          return content;
        }
      },

      {
        name: 'conversation_continuity',
        priority: 8,
        applicableContexts: ['ongoing', 'followup'],
        transform: (content: string, context: PersonalizedContext) => {
          const stage = context.conversationMemory.conversationFlow.currentStage;
          
          if (stage === 'followup' && !content.includes('lanjut')) {
            return `Melanjutkan pembahasan sebelumnya, ${content.toLowerCase()}`;
          }
          
          if (stage === 'resolution' && context.conversationMemory.contextualHistory.followUpNeeded) {
            return `${content}\n\n💡 **Catatan**: Jika ada yang masih perlu dijelaskan, silakan tanyakan lagi.`;
          }
          
          return content;
        }
      },

      {
        name: 'cultural_adaptation',
        priority: 7,
        applicableContexts: ['all'],
        transform: (content: string, context: PersonalizedContext) => {
          const culturalSensitivity = context.adaptiveSettings.culturalSensitivity;
          
          if (culturalSensitivity > 0.8) {
            return content
              .replace(/terima kasih/gi, 'terima kasih banyak')
              .replace(/maaf/gi, 'mohon maaf')
              .replace(/silakan/gi, 'silakan dengan hormat')
              .replace(/\bsaya\b/gi, 'saya')
              .replace(/\bbisa\b/gi, 'dapat');
          }
          
          return content;
        }
      },

      // Medium Priority Strategies
      {
        name: 'response_verbosity_adaptation',
        priority: 6,
        applicableContexts: ['all'],
        transform: (content: string, context: PersonalizedContext) => {
          const verbosity = context.adaptiveSettings.responseVerbosity;
          const preferredStyle = context.conversationMemory.userPreferences.preferredResponseStyle;
          
          if (preferredStyle === 'concise' && verbosity < 0.5) {
            // Simplify response
            return this.simplifyResponse(content);
          } else if (preferredStyle === 'detailed' && verbosity > 0.7) {
            // Add more detail
            return this.enhanceResponseDetail(content);
          }
          
          return content;
        }
      },

      {
        name: 'topic_context_awareness',
        priority: 5,
        applicableContexts: ['inquiry', 'assistance'],
        transform: (content: string, context: PersonalizedContext) => {
          const recentTopics = context.conversationMemory.recentTopics;
          const currentTopic = context.currentSession.topics[0];
          
          if (recentTopics.length > 0 && currentTopic) {
            const relatedTopic = recentTopics.find(topic => 
              topic.toLowerCase().includes(currentTopic.toLowerCase())
            );
            
            if (relatedTopic && !content.includes(relatedTopic)) {
              return `${content}\n\n📋 **Terkait**: Ini berkaitan dengan ${relatedTopic} yang sebelumnya ditanyakan.`;
            }
          }
          
          return content;
        }
      },

      {
        name: 'sentiment_adaptation',
        priority: 4,
        applicableContexts: ['all'],
        transform: (content: string, context: PersonalizedContext) => {
          const sentiment = context.currentSession.sentiment;
          
          switch (sentiment) {
            case 'frustrated':
              return `Saya memahami kekhawatiran ${context.userProfile?.preferredAddress || 'Anda'}. ${content}`;
            case 'satisfied':
              return `${content}\n\n😊 Senang bisa membantu!`;
            default:
              return content;
          }
        }
      },

      // Low Priority Strategies
      {
        name: 'time_context_awareness',
        priority: 3,
        applicableContexts: ['all'],
        transform: (content: string, context: PersonalizedContext) => {
          const hour = new Date().getHours();
          const sessionDuration = Date.now() - context.currentSession.startTime.getTime();
          
          // Add time-sensitive elements for long sessions
          if (sessionDuration > 30 * 60 * 1000) { // 30 minutes
            if (hour >= 11 && hour <= 13) {
              return `${content}\n\n⏰ **Catatan**: Sudah waktunya istirahat siang. Jangan lupa beristirahat ya!`;
            }
          }
          
          return content;
        }
      },

      {
        name: 'interaction_pattern_adaptation',
        priority: 2,
        applicableContexts: ['all'],
        transform: (content: string, context: PersonalizedContext) => {
          const messageCount = context.currentSession.messageCount;
          
          // Add encouragement for new users
          if (messageCount <= 2) {
            return `${content}\n\n💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`;
          }
          
          return content;
        }
      }
    ];
  }

  /**
   * Get applicable strategies based on context
   */
  private getApplicableStrategies(context: PersonalizedContext): PersonalizationStrategy[] {
    return this.personalizationStrategies
      .filter(strategy => {
        if (strategy.applicableContexts.includes('all')) return true;
        
        // Check if user is authenticated
        if (strategy.applicableContexts.includes('authenticated') && context.userId) return true;
        
        // Check conversation stage
        if (strategy.applicableContexts.includes(context.conversationMemory.conversationFlow.currentStage)) return true;
        
        return false;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply adaptive learning insights
   */
  private async applyAdaptiveLearning(
    content: string,
    userId: string,
    context: PersonalizedContext
  ): Promise<string> {
    const learning = this.adaptiveLearningCache.get(userId);
    if (!learning) return content;

    let adaptedContent = content;

    // Apply learned preferences
    const patterns = learning.userInteractionPatterns;
    
    // Adjust response length based on learned preference
    if (patterns.responseLength === 'short' && adaptedContent.length > 200) {
      adaptedContent = this.truncateResponse(adaptedContent);
    } else if (patterns.responseLength === 'long' && adaptedContent.length < 100) {
      adaptedContent = this.expandResponse(adaptedContent, context);
    }

    // Apply successful response patterns
    const successfulPatterns = learning.conversationInsights.successfulResponsePatterns;
    for (const pattern of successfulPatterns) {
      if (Math.random() < 0.3) { // 30% chance to apply learned pattern
        adaptedContent = this.applyLearnedPattern(adaptedContent, pattern);
      }
    }

    return adaptedContent;
  }

  /**
   * Analyze personalization elements in the response
   */
  private analyzePersonalizationElements(
    original: string,
    personalized: string,
    context: PersonalizedContext
  ): PersonalizationResult['userSpecificElements'] {
    return {
      nameUsage: context.userProfile?.nama_lengkap ? 
        personalized.includes(context.userProfile.nama_lengkap) : false,
      roleAwareness: context.userProfile?.role ? 
        personalized.includes(context.userProfile.preferredAddress) : false,
      preferenceAlignment: personalized !== original,
      conversationContinuity: personalized.includes('lanjut') || 
        personalized.includes('sebelumnya') || 
        personalized.includes('terkait')
    };
  }

  /**
   * Update adaptive learning based on interaction
   */
  private async updateAdaptiveLearning(
    userId: string,
    query: string,
    originalResponse: string,
    personalizedResponse: string
  ): Promise<void> {
    try {
      let learning = this.adaptiveLearningCache.get(userId);
      
      if (!learning) {
        learning = {
          userInteractionPatterns: {
            preferredGreetingStyle: 'friendly',
            responseLength: 'medium',
            technicalLevel: 'intermediate',
            formalityPreference: 'professional'
          },
          conversationInsights: {
            frequentTopics: [],
            successfulResponsePatterns: [],
            userSatisfactionIndicators: []
          },
          adaptationHistory: []
        };
      }

      // Update interaction patterns based on query analysis
      this.updateInteractionPatterns(learning, query);
      
      // Update conversation insights
      this.updateConversationInsights(learning, query, personalizedResponse);
      
      // Record adaptation history
      learning.adaptationHistory.push({
        timestamp: new Date(),
        strategy: 'response_personalization',
        effectiveness: this.calculateEffectiveness(originalResponse, personalizedResponse)
      });

      // Keep only last 50 adaptation records
      learning.adaptationHistory = learning.adaptationHistory.slice(-50);

      this.adaptiveLearningCache.set(userId, learning);

    } catch (error) {
      console.error('❌ [RESPONSE_PERSONALIZATION] Failed to update adaptive learning:', error);
    }
  }

  /**
   * Helper methods for response transformation
   */
  private simplifyResponse(content: string): string {
    return content
      .replace(/\n\n/g, '\n')
      .replace(/📋 \*\*.*?\*\*:.*?\n/g, '')
      .replace(/💡 \*\*.*?\*\*:.*?\n/g, '')
      .split('\n')
      .slice(0, 3)
      .join('\n');
  }

  private enhanceResponseDetail(content: string): string {
    if (!content.includes('📋') && !content.includes('💡')) {
      return `${content}\n\n📋 **Detail tambahan**: Informasi ini berdasarkan regulasi terbaru dari Kemendagri.`;
    }
    return content;
  }

  private truncateResponse(content: string): string {
    if (content.length <= 200) return content;
    
    const sentences = content.split('. ');
    let result = sentences[0];
    
    for (let i = 1; i < sentences.length; i++) {
      if ((result + '. ' + sentences[i]).length > 200) break;
      result += '. ' + sentences[i];
    }
    
    return result + (result.endsWith('.') ? '' : '.');
  }

  private expandResponse(content: string, context: PersonalizedContext): string {
    const additions = [
      '\n\n💡 **Tips**: Pastikan dokumen yang dibawa sudah lengkap dan sesuai persyaratan.',
      '\n\n📋 **Catatan**: Proses ini biasanya memakan waktu 1-3 hari kerja.',
      '\n\n🔍 **Info**: Anda dapat mengecek status permohonan melalui sistem online.'
    ];
    
    const randomAddition = additions[Math.floor(Math.random() * additions.length)];
    return content + randomAddition;
  }

  private applyLearnedPattern(content: string, pattern: string): string {
    // Apply learned successful patterns
    if (pattern.includes('emoji') && !content.includes('📋') && !content.includes('💡')) {
      return `📋 ${content}`;
    }
    
    return content;
  }

  private updateInteractionPatterns(learning: AdaptiveLearning, query: string): void {
    // Analyze query length to infer response length preference
    if (query.length < 50) {
      learning.userInteractionPatterns.responseLength = 'short';
    } else if (query.length > 150) {
      learning.userInteractionPatterns.responseLength = 'long';
    }

    // Analyze formality based on language used
    if (query.includes('mohon') || query.includes('dengan hormat')) {
      learning.userInteractionPatterns.formalityPreference = 'formal';
    } else if (query.includes('gimana') || query.includes('udah')) {
      learning.userInteractionPatterns.formalityPreference = 'casual';
    }
  }

  private updateConversationInsights(learning: AdaptiveLearning, query: string, response: string): void {
    // Extract topics from query
    const topics = this.extractTopicsFromQuery(query);
    for (const topic of topics) {
      if (!learning.conversationInsights.frequentTopics.includes(topic)) {
        learning.conversationInsights.frequentTopics.push(topic);
      }
    }

    // Keep only top 10 frequent topics
    learning.conversationInsights.frequentTopics = learning.conversationInsights.frequentTopics.slice(0, 10);
  }

  private calculateEffectiveness(original: string, personalized: string): number {
    // Simple effectiveness calculation based on personalization changes
    const changes = personalized.length - original.length;
    const personalizedElements = (personalized.match(/📋|💡|🔍|😊/g) || []).length;
    
    return Math.min(0.1 + (personalizedElements * 0.2) + (Math.abs(changes) * 0.001), 1.0);
  }

  private extractTopicsFromQuery(query: string): string[] {
    const topics: string[] = [];
    const keywords = [
      'ktp', 'kartu keluarga', 'akta', 'nikah', 'cerai', 'pindah', 'domisili',
      'kelahiran', 'kematian', 'surat', 'dokumen', 'persyaratan'
    ];

    for (const keyword of keywords) {
      if (query.toLowerCase().includes(keyword)) {
        topics.push(keyword);
      }
    }

    return topics;
  }

  /**
   * Clear adaptive learning cache
   */
  public clearAdaptiveLearning(userId?: string): void {
    if (userId) {
      this.adaptiveLearningCache.delete(userId);
    } else {
      this.adaptiveLearningCache.clear();
    }
  }
}
