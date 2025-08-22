/**
 * Enhanced SELLY Configuration Service
 * Manages enhancement settings, user preferences, and system configuration
 */

export interface EnhancedSellySettings {
  // Global enhancement settings
  globalEnhancementMode: 'standard' | 'enhanced' | 'adaptive';
  defaultPerformanceMode: 'fast' | 'balanced' | 'comprehensive';
  
  // Feature toggles
  features: {
    contextIntelligence: boolean;
    dynamicResponses: boolean;
    personaAdaptation: boolean;
    knowledgeSynthesis: boolean;
    localAI: boolean;
    responseVariations: boolean;
    userLearning: boolean;
    culturalAdaptation: boolean;
  };
  
  // Performance settings
  performance: {
    maxProcessingTime: number; // ms
    cacheEnabled: boolean;
    preloadModels: boolean;
    enableFallbacks: boolean;
  };
  
  // User experience settings
  userExperience: {
    defaultResponseStyle: 'formal' | 'casual' | 'adaptive';
    enableEmoticons: boolean;
    maxResponseLength: number;
    enableInteractiveAssessments: boolean;
  };
  
  // AI enhancement settings
  aiSettings: {
    sentimentAnalysisEnabled: boolean;
    intentRefinementEnabled: boolean;
    qualityAssessmentEnabled: boolean;
    responseEnhancementEnabled: boolean;
    confidenceThreshold: number;
  };
  
  // Cultural and language settings
  cultural: {
    primaryLanguage: 'indonesian';
    enableRegionalDialects: boolean;
    formalityLevel: 'auto' | 'formal' | 'casual';
    addressPreference: 'auto' | 'kak' | 'kakak' | 'bapak_ibu';
  };
}

export interface UserPreferences {
  userId: string;
  preferences: {
    enhancementMode: 'standard' | 'enhanced' | 'auto';
    responseStyle: 'formal' | 'casual' | 'detailed' | 'concise' | 'adaptive';
    communicationTone: 'professional' | 'friendly' | 'empathetic' | 'adaptive';
    informationDepth: 'basic' | 'intermediate' | 'detailed' | 'adaptive';
    enableVariations: boolean;
    enablePersonalization: boolean;
    enableCulturalAdaptation: boolean;
  };
  learningData: {
    interactionCount: number;
    preferredTopics: string[];
    successfulInteractions: string[];
    feedbackScores: number[];
    lastInteraction: Date;
  };
}

export class EnhancedSellyConfig {
  private static instance: EnhancedSellyConfig;
  private settings: EnhancedSellySettings;
  private userPreferences: Map<string, UserPreferences> = new Map();
  
  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadUserPreferences();
  }
  
  public static getInstance(): EnhancedSellyConfig {
    if (!EnhancedSellyConfig.instance) {
      EnhancedSellyConfig.instance = new EnhancedSellyConfig();
    }
    return EnhancedSellyConfig.instance;
  }
  
  /**
   * Get current system settings
   */
  public getSettings(): EnhancedSellySettings {
    return { ...this.settings };
  }
  
  /**
   * Update system settings
   */
  public updateSettings(newSettings: Partial<EnhancedSellySettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
      features: { ...this.settings.features, ...newSettings.features },
      performance: { ...this.settings.performance, ...newSettings.performance },
      userExperience: { ...this.settings.userExperience, ...newSettings.userExperience },
      aiSettings: { ...this.settings.aiSettings, ...newSettings.aiSettings },
      cultural: { ...this.settings.cultural, ...newSettings.cultural }
    };
    
    console.log('✅ [ENHANCED_CONFIG] Settings updated:', newSettings);
  }
  
  /**
   * Get user preferences
   */
  public getUserPreferences(userId: string): UserPreferences {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, this.createDefaultUserPreferences(userId));
    }
    return this.userPreferences.get(userId)!;
  }
  
  /**
   * Update user preferences
   */
  public updateUserPreferences(userId: string, preferences: Partial<UserPreferences['preferences']>): void {
    const userPrefs = this.getUserPreferences(userId);
    userPrefs.preferences = { ...userPrefs.preferences, ...preferences };
    userPrefs.learningData.lastInteraction = new Date();
    
    this.userPreferences.set(userId, userPrefs);
    console.log(`✅ [ENHANCED_CONFIG] User preferences updated for ${userId}:`, preferences);
  }
  
  /**
   * Record user interaction for learning
   */
  public recordUserInteraction(
    userId: string, 
    topic: string, 
    successful: boolean, 
    feedbackScore?: number
  ): void {
    const userPrefs = this.getUserPreferences(userId);
    
    userPrefs.learningData.interactionCount++;
    userPrefs.learningData.lastInteraction = new Date();
    
    if (successful) {
      userPrefs.learningData.successfulInteractions.push(topic);
    }
    
    if (!userPrefs.learningData.preferredTopics.includes(topic)) {
      userPrefs.learningData.preferredTopics.push(topic);
    }
    
    if (feedbackScore !== undefined) {
      userPrefs.learningData.feedbackScores.push(feedbackScore);
      
      // Keep only last 20 feedback scores
      if (userPrefs.learningData.feedbackScores.length > 20) {
        userPrefs.learningData.feedbackScores = userPrefs.learningData.feedbackScores.slice(-20);
      }
    }
    
    this.userPreferences.set(userId, userPrefs);
  }
  
  /**
   * Get enhancement configuration for a specific user and context
   */
  public getEnhancementConfig(
    userId?: string, 
    context?: any
  ): {
    enableContextIntelligence: boolean;
    enableDynamicResponses: boolean;
    enablePersonaAdaptation: boolean;
    enableKnowledgeSynthesis: boolean;
    enableLocalAI: boolean;
    generateVariations: boolean;
    maxVariations: number;
    performanceMode: 'fast' | 'balanced' | 'comprehensive';
  } {
    
    const userPrefs = userId ? this.getUserPreferences(userId) : null;
    
    // Determine if user wants enhanced mode
    let useEnhanced = false;
    if (userPrefs) {
      switch (userPrefs.preferences.enhancementMode) {
        case 'enhanced':
          useEnhanced = true;
          break;
        case 'auto':
          // Auto mode: use enhanced for returning users or complex queries
          useEnhanced = (userPrefs.learningData?.interactionCount || 0) > 2 ||
                       context?.complexQuery ||
                       context?.enableAI;
          break;
        default:
          useEnhanced = false;
      }
    } else {
      // Default for new users based on global settings
      useEnhanced = this.settings.globalEnhancementMode === 'enhanced' ||
                   (this.settings.globalEnhancementMode === 'adaptive' && context?.complexQuery);
    }
    
    if (!useEnhanced) {
      // Return minimal configuration for standard mode
      return {
        enableContextIntelligence: false,
        enableDynamicResponses: false,
        enablePersonaAdaptation: false,
        enableKnowledgeSynthesis: false,
        enableLocalAI: false,
        generateVariations: false,
        maxVariations: 0,
        performanceMode: 'fast'
      };
    }
    
    // Enhanced mode configuration
    return {
      enableContextIntelligence: this.settings.features.contextIntelligence,
      enableDynamicResponses: this.settings.features.dynamicResponses,
      enablePersonaAdaptation: this.settings.features.personaAdaptation && 
                              (userPrefs?.preferences.enablePersonalization !== false),
      enableKnowledgeSynthesis: this.settings.features.knowledgeSynthesis &&
                               (context?.complexQuery || (userPrefs?.learningData?.interactionCount ?? 0) > 5),
      enableLocalAI: this.settings.features.localAI && 
                    this.settings.aiSettings.sentimentAnalysisEnabled,
      generateVariations: this.settings.features.responseVariations && 
                         (userPrefs?.preferences.enableVariations !== false),
      maxVariations: userPrefs?.preferences.enableVariations ? 3 : 0,
      performanceMode: this.determinePerformanceMode(userPrefs, context)
    };
  }
  
  /**
   * Check if a specific feature is enabled
   */
  public isFeatureEnabled(feature: keyof EnhancedSellySettings['features']): boolean {
    return this.settings.features[feature];
  }
  
  /**
   * Get performance settings
   */
  public getPerformanceSettings(): EnhancedSellySettings['performance'] {
    return { ...this.settings.performance };
  }
  
  /**
   * Get cultural settings for a user
   */
  public getCulturalSettings(userId?: string): EnhancedSellySettings['cultural'] & {
    userAddressPreference?: string;
    userFormalityLevel?: string;
  } {
    const userPrefs = userId ? this.getUserPreferences(userId) : null;
    
    return {
      ...this.settings.cultural,
      userAddressPreference: userPrefs?.preferences.responseStyle,
      userFormalityLevel: userPrefs?.preferences.communicationTone
    };
  }
  
  // Private helper methods
  private getDefaultSettings(): EnhancedSellySettings {
    return {
      globalEnhancementMode: 'adaptive',
      defaultPerformanceMode: 'balanced',
      
      features: {
        contextIntelligence: true,
        dynamicResponses: true,
        personaAdaptation: true,
        knowledgeSynthesis: false, // Enable for complex queries only
        localAI: true,
        responseVariations: false, // Enable on user request
        userLearning: true,
        culturalAdaptation: true
      },
      
      performance: {
        maxProcessingTime: 300, // 300ms max
        cacheEnabled: true,
        preloadModels: false, // Load on demand
        enableFallbacks: true
      },
      
      userExperience: {
        defaultResponseStyle: 'adaptive',
        enableEmoticons: true,
        maxResponseLength: 1000,
        enableInteractiveAssessments: true
      },
      
      aiSettings: {
        sentimentAnalysisEnabled: true,
        intentRefinementEnabled: true,
        qualityAssessmentEnabled: false, // Enable for power users
        responseEnhancementEnabled: true,
        confidenceThreshold: 0.7
      },
      
      cultural: {
        primaryLanguage: 'indonesian',
        enableRegionalDialects: true,
        formalityLevel: 'auto',
        addressPreference: 'auto'
      }
    };
  }
  
  private createDefaultUserPreferences(userId: string): UserPreferences {
    return {
      userId,
      preferences: {
        enhancementMode: 'auto',
        responseStyle: 'adaptive',
        communicationTone: 'adaptive',
        informationDepth: 'adaptive',
        enableVariations: false,
        enablePersonalization: true,
        enableCulturalAdaptation: true
      },
      learningData: {
        interactionCount: 0,
        preferredTopics: [],
        successfulInteractions: [],
        feedbackScores: [],
        lastInteraction: new Date()
      }
    };
  }
  
  private determinePerformanceMode(
    userPrefs: UserPreferences | null, 
    context: any
  ): 'fast' | 'balanced' | 'comprehensive' {
    
    // Fast mode for new users or simple queries
    if (!userPrefs || userPrefs.learningData.interactionCount < 3) {
      return 'fast';
    }
    
    // Comprehensive mode for power users or complex queries
    if (userPrefs.learningData.interactionCount > 10 || context?.complexQuery) {
      return 'comprehensive';
    }
    
    // Balanced mode for regular users
    return 'balanced';
  }
  
  private loadUserPreferences(): void {
    // In a real implementation, this would load from database
    // For now, we'll use in-memory storage
    console.log('📋 [ENHANCED_CONFIG] User preferences loaded from memory');
  }
}
