/**
 * Dynamic Response Variation Engine for SELLY
 * Advanced response generation with contextual intelligence,
 * emotional awareness, and adaptive formatting
 */

import { EnhancedConversationContext } from './enhancedContextIntelligence';

export interface ResponseTemplate {
  id: string;
  category: 'greeting' | 'information' | 'instruction' | 'clarification' | 'closing';
  emotionalTone: 'empathetic' | 'professional' | 'friendly' | 'encouraging' | 'reassuring';
  complexity: 'simple' | 'moderate' | 'detailed';
  format: 'narrative' | 'bullet-points' | 'step-by-step' | 'conversational' | 'formal';
  template: string;
  variables: string[];
  conditions?: string[];
}

export interface ResponseVariationConfig {
  serviceType: string;
  baseTemplates: ResponseTemplate[];
  contextualModifiers: {
    emotional: Record<string, string[]>;
    temporal: Record<string, string[]>;
    user_level: Record<string, string[]>;
    urgency: Record<string, string[]>;
  };
  personalizationElements: {
    greetings: string[];
    transitions: string[];
    closings: string[];
    encouragements: string[];
    clarifications: string[];
  };
}

export class DynamicResponseEngine {
  private responseConfigs: Map<string, ResponseVariationConfig> = new Map();
  private templateLibrary: Map<string, ResponseTemplate> = new Map();
  private emotionalPatterns: Map<string, Function> = new Map();

  constructor() {
    this.initializeTemplateLibrary();
    this.initializeResponseConfigs();
    this.initializeEmotionalPatterns();
  }

  /**
   * Generate dynamic response based on context and content
   */
  public generateDynamicResponse(
    baseContent: string,
    serviceType: string,
    context: EnhancedConversationContext,
    options?: {
      forceFormat?: string;
      includePersonalization?: boolean;
      emotionalOverride?: string;
    }
  ): string {
    
    // Get response configuration for service type
    const config = this.responseConfigs.get(serviceType) || this.getDefaultConfig();
    
    // Select optimal template based on context
    const selectedTemplate = this.selectOptimalTemplate(config, context, options);
    
    // Apply contextual modifications
    const contextualContent = this.applyContextualModifications(
      baseContent, 
      selectedTemplate, 
      context, 
      config
    );
    
    // Add personalization elements
    const personalizedContent = this.addPersonalizationElements(
      contextualContent,
      context,
      config,
      options?.includePersonalization !== false
    );
    
    // Apply emotional intelligence
    const emotionallyAwareContent = this.applyEmotionalIntelligence(
      personalizedContent,
      context,
      options?.emotionalOverride
    );
    
    // Final formatting and polish
    const finalResponse = this.applyFinalFormatting(
      emotionallyAwareContent,
      selectedTemplate,
      context
    );

    return finalResponse;
  }

  /**
   * Generate multiple response variations for A/B testing
   */
  public generateResponseVariations(
    baseContent: string,
    serviceType: string,
    context: EnhancedConversationContext,
    count: number = 3
  ): Array<{variation: string; style: string; confidence: number}> {
    
    const variations: Array<{variation: string; style: string; confidence: number}> = [];
    const config = this.responseConfigs.get(serviceType) || this.getDefaultConfig();
    
    // Generate different style variations
    const styles = ['conversational', 'professional', 'friendly', 'detailed'];
    
    for (let i = 0; i < Math.min(count, styles.length); i++) {
      const style = styles[i];
      const variation = this.generateDynamicResponse(
        baseContent,
        serviceType,
        context,
        { forceFormat: style }
      );
      
      const confidence = this.calculateVariationConfidence(variation, context, style);
      
      variations.push({
        variation,
        style,
        confidence
      });
    }
    
    // Sort by confidence score
    return variations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Select optimal template based on context analysis
   */
  private selectOptimalTemplate(
    config: ResponseVariationConfig,
    context: EnhancedConversationContext,
    options?: any
  ): ResponseTemplate {
    
    let candidates = config.baseTemplates;
    
    // Filter by forced format if specified
    if (options?.forceFormat) {
      candidates = candidates.filter(t => t.format === options.forceFormat);
    }
    
    // Filter by complexity based on user profile
    const preferredComplexity = this.determinePreferredComplexity(context);
    candidates = candidates.filter(t => t.complexity === preferredComplexity);
    
    // Filter by emotional tone
    const preferredTone = this.determinePreferredTone(context);
    candidates = candidates.filter(t => t.emotionalTone === preferredTone);
    
    // If no candidates match all criteria, relax constraints
    if (candidates.length === 0) {
      candidates = config.baseTemplates.filter(t => t.complexity === preferredComplexity);
    }
    
    if (candidates.length === 0) {
      candidates = config.baseTemplates;
    }
    
    // Select best match or random if multiple good options
    return candidates[0] || this.getDefaultTemplate();
  }

  /**
   * Apply contextual modifications to content
   */
  private applyContextualModifications(
    content: string,
    template: ResponseTemplate,
    context: EnhancedConversationContext,
    config: ResponseVariationConfig
  ): string {
    
    let modifiedContent = content;
    
    // Apply emotional modifications
    if (context.emotionalTone in config.contextualModifiers.emotional) {
      const emotionalMods = config.contextualModifiers.emotional[context.emotionalTone];
      modifiedContent = this.applyModifications(modifiedContent, emotionalMods);
    }
    
    // Apply temporal modifications
    const timeKey = `${context.timeOfDay}_${context.isBusinessHours ? 'business' : 'after_hours'}`;
    if (timeKey in config.contextualModifiers.temporal) {
      const temporalMods = config.contextualModifiers.temporal[timeKey];
      modifiedContent = this.applyModifications(modifiedContent, temporalMods);
    }
    
    // Apply user level modifications
    const userLevel = context.userProfile.learningProfile.understandingLevel;
    if (userLevel in config.contextualModifiers.user_level) {
      const userMods = config.contextualModifiers.user_level[userLevel];
      modifiedContent = this.applyModifications(modifiedContent, userMods);
    }
    
    // Apply urgency modifications
    if (context.urgencyLevel in config.contextualModifiers.urgency) {
      const urgencyMods = config.contextualModifiers.urgency[context.urgencyLevel];
      modifiedContent = this.applyModifications(modifiedContent, urgencyMods);
    }
    
    return modifiedContent;
  }

  /**
   * Add personalization elements to response
   */
  private addPersonalizationElements(
    content: string,
    context: EnhancedConversationContext,
    config: ResponseVariationConfig,
    includePersonalization: boolean
  ): string {
    
    if (!includePersonalization) return content;
    
    let personalizedContent = content;
    
    // Add contextual greeting
    if (context.conversationStage === 'greeting' || context.isReturningUser) {
      const greeting = this.selectPersonalizationElement(
        config.personalizationElements.greetings,
        context
      );
      personalizedContent = `${greeting} ${personalizedContent}`;
    }
    
    // Add transitions for better flow
    if (context.sessionLength > 1) {
      const transition = this.selectPersonalizationElement(
        config.personalizationElements.transitions,
        context
      );
      personalizedContent = personalizedContent.replace(
        /^([^.!?]*[.!?])\s*/,
        `$1 ${transition} `
      );
    }
    
    // Add encouragement for confused users
    if (context.emotionalTone === 'confused' || context.needsElaboration) {
      const encouragement = this.selectPersonalizationElement(
        config.personalizationElements.encouragements,
        context
      );
      personalizedContent += ` ${encouragement}`;
    }
    
    // Add appropriate closing
    const closing = this.selectPersonalizationElement(
      config.personalizationElements.closings,
      context
    );
    personalizedContent += ` ${closing}`;
    
    return personalizedContent;
  }

  /**
   * Apply emotional intelligence to response
   */
  private applyEmotionalIntelligence(
    content: string,
    context: EnhancedConversationContext,
    emotionalOverride?: string
  ): string {
    
    const targetEmotion = emotionalOverride || context.emotionalTone;
    const emotionalPattern = this.emotionalPatterns.get(targetEmotion);
    
    if (emotionalPattern) {
      return emotionalPattern(content, context);
    }
    
    return content;
  }

  /**
   * Apply final formatting and polish
   */
  private applyFinalFormatting(
    content: string,
    template: ResponseTemplate,
    context: EnhancedConversationContext
  ): string {
    
    let formattedContent = content;
    
    // Apply template-specific formatting
    switch (template.format) {
      case 'bullet-points':
        formattedContent = this.formatAsBulletPoints(formattedContent);
        break;
      case 'step-by-step':
        formattedContent = this.formatAsSteps(formattedContent);
        break;
      case 'conversational':
        formattedContent = this.formatAsConversational(formattedContent, context);
        break;
      case 'formal':
        formattedContent = this.formatAsFormal(formattedContent);
        break;
    }
    
    // Apply final polish
    formattedContent = this.applyFinalPolish(formattedContent, context);
    
    return formattedContent;
  }

  /**
   * Initialize template library with various response templates
   */
  private initializeTemplateLibrary(): void {
    
    // Greeting templates
    this.templateLibrary.set('friendly_greeting', {
      id: 'friendly_greeting',
      category: 'greeting',
      emotionalTone: 'friendly',
      complexity: 'simple',
      format: 'conversational',
      template: 'Halo {address}! Saya SELLY dari Disdukcapil Garut. {content}',
      variables: ['address', 'content']
    });
    
    // Information templates
    this.templateLibrary.set('detailed_info', {
      id: 'detailed_info',
      category: 'information',
      emotionalTone: 'professional',
      complexity: 'detailed',
      format: 'formal',
      template: 'Berdasarkan informasi yang tersedia, {content}. Untuk informasi lebih lanjut, {additional_info}.',
      variables: ['content', 'additional_info']
    });
    
    // Instruction templates
    this.templateLibrary.set('step_by_step', {
      id: 'step_by_step',
      category: 'instruction',
      emotionalTone: 'encouraging',
      complexity: 'moderate',
      format: 'step-by-step',
      template: 'Baik {address}, berikut langkah-langkahnya:\n{content}',
      variables: ['address', 'content']
    });
    
    // Add more templates...
  }

  /**
   * Initialize response configurations for different service types
   */
  private initializeResponseConfigs(): void {
    
    // KTP service configuration
    this.responseConfigs.set('ktp', {
      serviceType: 'ktp',
      baseTemplates: [
        this.templateLibrary.get('friendly_greeting')!,
        this.templateLibrary.get('detailed_info')!,
        this.templateLibrary.get('step_by_step')!
      ],
      contextualModifiers: {
        emotional: {
          'confused': ['Mari saya jelaskan dengan lebih sederhana', 'Jangan khawatir, ini mudah kok'],
          'frustrated': ['Saya mengerti ini mungkin membingungkan', 'Mari kita selesaikan bersama-sama'],
          'positive': ['Senang bisa membantu!', 'Semangat untuk mengurusnya!']
        },
        temporal: {
          'morning_business': ['Selamat pagi!', 'Pagi yang produktif untuk mengurus dokumen'],
          'afternoon_business': ['Selamat siang!', 'Masih ada waktu untuk ke kantor hari ini'],
          'evening_after_hours': ['Selamat sore!', 'Kantor sudah tutup, tapi bisa dipersiapkan dulu']
        },
        user_level: {
          'beginner': ['Saya akan jelaskan dari awal ya', 'Tenang, kita mulai dari dasar'],
          'intermediate': ['Seperti yang mungkin sudah tahu', 'Prosesnya cukup straightforward'],
          'advanced': ['Langsung ke intinya', 'Seperti biasa, prosedurnya adalah']
        },
        urgency: {
          'urgent': ['Untuk kasus mendesak ini', 'Segera lakukan langkah berikut'],
          'high': ['Karena ini penting', 'Sebaiknya segera diurus'],
          'medium': ['Bisa diurus dalam waktu dekat', 'Tidak terlalu mendesak'],
          'low': ['Bisa dipersiapkan pelan-pelan', 'Tidak ada deadline khusus']
        }
      },
      personalizationElements: {
        greetings: [
          'Halo kak!', 'Hai kakak!', 'Selamat datang kembali!', 
          'Senang bertemu lagi!', 'Apa kabar kak?'
        ],
        transitions: [
          'Nah', 'Jadi begini', 'Oh iya', 'Btw', 'Selanjutnya'
        ],
        closings: [
          'Semoga membantu ya kak!', 'Ada yang mau ditanyakan lagi?',
          'Jangan ragu tanya kalau ada yang kurang jelas!', 'Semoga lancar prosesnya!'
        ],
        encouragements: [
          'Tenang aja, prosesnya mudah kok!', 'Jangan khawatir, saya bantu sampai selesai!',
          'Pasti bisa, kak!', 'Satu langkah lagi!'
        ],
        clarifications: [
          'Maksudnya begini', 'Biar lebih jelas', 'Dengan kata lain',
          'Sederhananya', 'Intinya'
        ]
      }
    });
    
    // Add configurations for other service types...
  }

  /**
   * Initialize emotional patterns for different emotional states
   */
  private initializeEmotionalPatterns(): void {
    
    this.emotionalPatterns.set('frustrated', (content: string, context: EnhancedConversationContext) => {
      // Add empathetic language and reassurance
      const empathyPhrases = [
        'Saya mengerti ini mungkin membingungkan',
        'Wajar kalau merasa bingung',
        'Mari kita selesaikan bersama-sama'
      ];
      
      const selectedPhrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
      return `${selectedPhrase}. ${content}`;
    });
    
    this.emotionalPatterns.set('confused', (content: string, context: EnhancedConversationContext) => {
      // Add clarification and simplification
      return `Mari saya jelaskan dengan lebih sederhana ya kak. ${content}`;
    });
    
    this.emotionalPatterns.set('positive', (content: string, context: EnhancedConversationContext) => {
      // Add enthusiasm and encouragement
      return `${content} Senang bisa membantu kakak!`;
    });
  }

  // Helper methods
  private determinePreferredComplexity(context: EnhancedConversationContext): 'simple' | 'moderate' | 'detailed' {
    if (context.userProfile.learningProfile.understandingLevel === 'beginner') return 'simple';
    if (context.userProfile.preferences.informationDepth === 'detailed') return 'detailed';
    return 'moderate';
  }

  private determinePreferredTone(context: EnhancedConversationContext): 'empathetic' | 'professional' | 'friendly' | 'encouraging' | 'reassuring' {
    if (context.emotionalTone === 'frustrated') return 'empathetic';
    if (context.emotionalTone === 'confused') return 'reassuring';
    if (context.userProfile.preferences.communicationStyle === 'formal') return 'professional';
    return 'friendly';
  }

  private applyModifications(content: string, modifications: string[]): string {
    // Apply contextual modifications to content
    const selectedMod = modifications[Math.floor(Math.random() * modifications.length)];
    return `${selectedMod}. ${content}`;
  }

  private selectPersonalizationElement(elements: string[], context: EnhancedConversationContext): string {
    // Select appropriate personalization element based on context
    return elements[Math.floor(Math.random() * elements.length)];
  }

  private calculateVariationConfidence(variation: string, context: EnhancedConversationContext, style: string): number {
    // Calculate confidence score for variation based on context match
    let confidence = 0.5; // Base confidence
    
    // Adjust based on user preferences
    if (context.userProfile.preferences.communicationStyle === style) {
      confidence += 0.3;
    }
    
    // Adjust based on emotional appropriateness
    if (context.emotionalTone === 'confused' && style === 'step-by-step') {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private getDefaultConfig(): ResponseVariationConfig {
    return this.responseConfigs.get('ktp')!; // Use KTP as default
  }

  private getDefaultTemplate(): ResponseTemplate {
    return this.templateLibrary.get('friendly_greeting')!;
  }

  // Formatting methods
  private formatAsBulletPoints(content: string): string {
    const sentences = content.split(/[.!?]\s+/);
    return sentences.map(s => `• ${s.trim()}`).join('\n');
  }

  private formatAsSteps(content: string): string {
    const sentences = content.split(/[.!?]\s+/);
    return sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
  }

  private formatAsConversational(content: string, context: EnhancedConversationContext): string {
    // Add conversational elements
    const address = context.userProfile.preferences.preferredAddress === 'kakak' ? 'kakak' : 'kak';
    return content.replace(/\b(jadi|nah|oya)\b/gi, (match) => `${match} ${address}`);
  }

  private formatAsFormal(content: string): string {
    // Apply formal language patterns
    return content
      .replace(/\bkak\b/gi, 'Bapak/Ibu')
      .replace(/\bgimana\b/gi, 'bagaimana')
      .replace(/\bbikin\b/gi, 'membuat');
  }

  private applyFinalPolish(content: string, context: EnhancedConversationContext): string {
    // Final polish and cleanup
    return content
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/([.!?])\s*([.!?])/g, '$1 $2') // Fix punctuation
      .trim();
  }
}
