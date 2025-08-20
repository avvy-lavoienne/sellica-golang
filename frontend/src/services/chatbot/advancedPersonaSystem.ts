/**
 * Advanced Persona Adaptation System for SELLY
 * Enhanced PersonaService with mood detection, cultural context awareness,
 * and dynamic personality adjustment based on conversation flow
 */

import { EnhancedConversationContext } from './enhancedContextIntelligence';

export interface PersonalityProfile {
  basePersonality: {
    warmth: number; // 0-1 scale
    formality: number; // 0-1 scale
    enthusiasm: number; // 0-1 scale
    patience: number; // 0-1 scale
    helpfulness: number; // 0-1 scale
  };
  adaptiveTraits: {
    empathy: number;
    assertiveness: number;
    playfulness: number;
    professionalism: number;
    cultural_sensitivity: number;
  };
  communicationStyle: {
    verbosity: 'concise' | 'moderate' | 'detailed';
    tone: 'formal' | 'semi-formal' | 'casual' | 'friendly';
    address_preference: 'kak' | 'kakak' | 'bapak_ibu' | 'adaptive';
    emoji_usage: 'none' | 'minimal' | 'moderate' | 'expressive';
  };
}

export interface MoodDetectionResult {
  primary_mood: 'happy' | 'neutral' | 'confused' | 'frustrated' | 'anxious' | 'excited' | 'tired';
  confidence: number;
  indicators: string[];
  emotional_intensity: 'low' | 'medium' | 'high';
  suggested_response_style: string;
}

export interface CulturalContext {
  region: 'jakarta' | 'jawa_barat' | 'sunda' | 'general_indonesia';
  formality_level: 'very_formal' | 'formal' | 'semi_formal' | 'casual';
  religious_context: 'islamic' | 'christian' | 'general' | 'secular';
  age_group: 'young' | 'adult' | 'senior';
  social_context: 'government_service' | 'casual_inquiry' | 'urgent_need' | 'learning';
}

export interface PersonaAdaptation {
  personality_adjustments: Partial<PersonalityProfile>;
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

export class AdvancedPersonaSystem {
  private basePersonality: PersonalityProfile;
  private moodDetectionPatterns: Map<string, RegExp[]> = new Map();
  private culturalPatterns: Map<string, RegExp[]> = new Map();
  private adaptationRules: Map<string, Function> = new Map();
  private conversationMemory: Map<string, any[]> = new Map();

  constructor() {
    this.basePersonality = this.initializeBasePersonality();
    this.initializeMoodDetectionPatterns();
    this.initializeCulturalPatterns();
    this.initializeAdaptationRules();
  }

  /**
   * Analyze user mood from query and context
   */
  public detectUserMood(
    query: string, 
    context: EnhancedConversationContext,
    conversationHistory?: string[]
  ): MoodDetectionResult {
    
    const lowerQuery = query.toLowerCase();
    const indicators: string[] = [];
    let primaryMood: 'happy' | 'neutral' | 'confused' | 'frustrated' | 'anxious' | 'excited' | 'tired' = 'neutral';
    let confidence = 0.5;
    let emotionalIntensity: 'low' | 'medium' | 'high' = 'medium';

    // Analyze linguistic patterns
    const moodScores = {
      happy: this.calculateMoodScore(lowerQuery, 'happy'),
      confused: this.calculateMoodScore(lowerQuery, 'confused'),
      frustrated: this.calculateMoodScore(lowerQuery, 'frustrated'),
      anxious: this.calculateMoodScore(lowerQuery, 'anxious'),
      excited: this.calculateMoodScore(lowerQuery, 'excited'),
      tired: this.calculateMoodScore(lowerQuery, 'tired')
    };

    // Find dominant mood
    const maxScore = Math.max(...Object.values(moodScores));
    if (maxScore > 0.3) {
      primaryMood = Object.keys(moodScores).find(
        mood => moodScores[mood as keyof typeof moodScores] === maxScore
      ) as typeof primaryMood;
      confidence = maxScore;
    }

    // Analyze emotional intensity
    if (lowerQuery.includes('banget') || lowerQuery.includes('sekali') || lowerQuery.includes('!!!')) {
      emotionalIntensity = 'high';
    } else if (lowerQuery.includes('agak') || lowerQuery.includes('sedikit')) {
      emotionalIntensity = 'low';
    }

    // Consider conversation context
    if (context.urgencyLevel === 'urgent') {
      if (primaryMood === 'neutral') primaryMood = 'anxious';
      emotionalIntensity = 'high';
    }

    // Generate suggested response style
    const suggestedStyle = this.generateResponseStyle(primaryMood, emotionalIntensity, context);

    return {
      primary_mood: primaryMood,
      confidence,
      indicators,
      emotional_intensity: emotionalIntensity,
      suggested_response_style: suggestedStyle
    };
  }

  /**
   * Analyze cultural context from user interaction
   */
  public analyzeCulturalContext(
    query: string,
    context: EnhancedConversationContext
  ): CulturalContext {
    
    const lowerQuery = query.toLowerCase();
    
    // Detect regional patterns
    let region: 'jakarta' | 'jawa_barat' | 'sunda' | 'general_indonesia' = 'general_indonesia';
    if (this.matchesPattern(lowerQuery, 'jakarta')) region = 'jakarta';
    if (this.matchesPattern(lowerQuery, 'sunda')) region = 'sunda';
    if (this.matchesPattern(lowerQuery, 'jawa_barat')) region = 'jawa_barat';

    // Detect formality level
    let formalityLevel: 'very_formal' | 'formal' | 'semi_formal' | 'casual' = 'semi_formal';
    if (lowerQuery.includes('mohon') || lowerQuery.includes('perkenankan')) {
      formalityLevel = 'very_formal';
    } else if (lowerQuery.includes('tolong') || lowerQuery.includes('bisa')) {
      formalityLevel = 'formal';
    } else if (lowerQuery.includes('gimana') || lowerQuery.includes('dong')) {
      formalityLevel = 'casual';
    }

    // Detect religious context
    let religiousContext: 'islamic' | 'christian' | 'general' | 'secular' = 'general';
    if (lowerQuery.includes('assalamualaikum') || lowerQuery.includes('insyaallah')) {
      religiousContext = 'islamic';
    } else if (lowerQuery.includes('tuhan memberkati') || lowerQuery.includes('syalom')) {
      religiousContext = 'christian';
    }

    // Estimate age group from language patterns
    let ageGroup: 'young' | 'adult' | 'senior' = 'adult';
    if (lowerQuery.includes('gue') || lowerQuery.includes('lu') || lowerQuery.includes('bro')) {
      ageGroup = 'young';
    } else if (lowerQuery.includes('saya') && formalityLevel === 'very_formal') {
      ageGroup = 'senior';
    }

    // Determine social context
    let socialContext: 'government_service' | 'casual_inquiry' | 'urgent_need' | 'learning' = 'government_service';
    if (context.urgencyLevel === 'urgent') socialContext = 'urgent_need';
    if (lowerQuery.includes('belajar') || lowerQuery.includes('tahu')) socialContext = 'learning';
    if (formalityLevel === 'casual') socialContext = 'casual_inquiry';

    return {
      region,
      formality_level: formalityLevel,
      religious_context: religiousContext,
      age_group: ageGroup,
      social_context: socialContext
    };
  }

  /**
   * Generate persona adaptation based on mood and cultural context
   */
  public generatePersonaAdaptation(
    moodResult: MoodDetectionResult,
    culturalContext: CulturalContext,
    context: EnhancedConversationContext
  ): PersonaAdaptation {
    
    // Base personality adjustments
    const personalityAdjustments: Partial<PersonalityProfile> = {
      basePersonality: { ...this.basePersonality.basePersonality }
    };

    // Adjust based on mood
    switch (moodResult.primary_mood) {
      case 'frustrated':
        personalityAdjustments.basePersonality!.patience += 0.3;
        personalityAdjustments.basePersonality!.warmth += 0.2;
        break;
      case 'confused':
        personalityAdjustments.basePersonality!.helpfulness += 0.3;
        personalityAdjustments.basePersonality!.patience += 0.2;
        break;
      case 'excited':
        personalityAdjustments.basePersonality!.enthusiasm += 0.2;
        personalityAdjustments.basePersonality!.warmth += 0.1;
        break;
      case 'anxious':
        personalityAdjustments.basePersonality!.warmth += 0.3;
        personalityAdjustments.basePersonality!.patience += 0.2;
        break;
    }

    // Adjust based on cultural context
    if (culturalContext.formality_level === 'very_formal') {
      personalityAdjustments.basePersonality!.formality = 0.9;
    } else if (culturalContext.formality_level === 'casual') {
      personalityAdjustments.basePersonality!.formality = 0.3;
      personalityAdjustments.basePersonality!.warmth += 0.2;
    }

    // Generate response modifications
    const responseModifications = {
      greeting_style: this.generateGreetingStyle(moodResult, culturalContext),
      explanation_approach: this.generateExplanationApproach(moodResult, culturalContext),
      encouragement_level: this.generateEncouragementLevel(moodResult, context),
      closing_style: this.generateClosingStyle(culturalContext, context)
    };

    // Generate linguistic adaptations
    const linguisticAdaptations = {
      vocabulary_level: this.determineVocabularyLevel(culturalContext, context),
      sentence_structure: this.determineSentenceStructure(moodResult, culturalContext),
      cultural_references: this.generateCulturalReferences(culturalContext),
      address_forms: this.generateAddressForms(culturalContext, context)
    };

    return {
      personality_adjustments: personalityAdjustments,
      response_modifications: responseModifications,
      linguistic_adaptations: linguisticAdaptations
    };
  }

  /**
   * Apply persona adaptation to response content
   */
  public applyPersonaAdaptation(
    baseResponse: string,
    adaptation: PersonaAdaptation,
    context: EnhancedConversationContext
  ): string {
    
    let adaptedResponse = baseResponse;

    // Apply greeting style
    if (context.conversationStage === 'greeting') {
      adaptedResponse = `${adaptation.response_modifications.greeting_style} ${adaptedResponse}`;
    }

    // Apply explanation approach
    if (adaptation.response_modifications.explanation_approach === 'step_by_step') {
      adaptedResponse = this.convertToStepByStep(adaptedResponse);
    } else if (adaptation.response_modifications.explanation_approach === 'simplified') {
      adaptedResponse = this.simplifyExplanation(adaptedResponse);
    }

    // Apply encouragement
    if (adaptation.response_modifications.encouragement_level === 'high') {
      adaptedResponse += ' Jangan khawatir, pasti bisa kok kak!';
    } else if (adaptation.response_modifications.encouragement_level === 'moderate') {
      adaptedResponse += ' Semoga membantu ya!';
    }

    // Apply linguistic adaptations
    adaptedResponse = this.applyLinguisticAdaptations(adaptedResponse, adaptation.linguistic_adaptations);

    // Apply closing style
    adaptedResponse += ` ${adaptation.response_modifications.closing_style}`;

    return adaptedResponse.trim();
  }

  /**
   * Learn from user feedback to improve persona adaptation
   */
  public learnFromFeedback(
    userId: string,
    adaptation: PersonaAdaptation,
    userFeedback: {
      tone_satisfaction: number; // 1-5
      helpfulness: number; // 1-5
      clarity: number; // 1-5
      cultural_appropriateness: number; // 1-5
    }
  ): void {
    
    // Store feedback for learning
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, []);
    }
    
    this.conversationMemory.get(userId)!.push({
      adaptation,
      feedback: userFeedback,
      timestamp: new Date()
    });

    // Adjust adaptation rules based on feedback
    if (userFeedback.tone_satisfaction < 3) {
      // User didn't like the tone, adjust for future
      this.adjustAdaptationRules(userId, 'tone', userFeedback);
    }

    if (userFeedback.cultural_appropriateness < 3) {
      // Cultural adaptation needs improvement
      this.adjustAdaptationRules(userId, 'cultural', userFeedback);
    }
  }

  // Private helper methods
  private initializeBasePersonality(): PersonalityProfile {
    return {
      basePersonality: {
        warmth: 0.8,
        formality: 0.6,
        enthusiasm: 0.7,
        patience: 0.9,
        helpfulness: 0.95
      },
      adaptiveTraits: {
        empathy: 0.8,
        assertiveness: 0.6,
        playfulness: 0.4,
        professionalism: 0.9,
        cultural_sensitivity: 0.9
      },
      communicationStyle: {
        verbosity: 'moderate',
        tone: 'friendly',
        address_preference: 'adaptive',
        emoji_usage: 'minimal'
      }
    };
  }

  private initializeMoodDetectionPatterns(): void {
    this.moodDetectionPatterns.set('happy', [
      /senang|gembira|bahagia|suka|mantap|keren|bagus/i,
      /terima kasih|makasih|thanks/i
    ]);

    this.moodDetectionPatterns.set('confused', [
      /bingung|tidak tahu|gak tau|gimana|bagaimana|maksudnya/i,
      /\?.*\?/i, // Multiple question marks
      /apa itu|apa sih|jelaskan/i
    ]);

    this.moodDetectionPatterns.set('frustrated', [
      /susah|sulit|ribet|repot|capek|kesel|bete/i,
      /kenapa|mengapa.*tidak|gak bisa|tidak bisa/i,
      /!!!|!!!/i // Multiple exclamation marks
    ]);

    this.moodDetectionPatterns.set('anxious', [
      /khawatir|cemas|takut|was-was|deg-degan/i,
      /urgent|mendesak|segera|cepat|penting banget/i
    ]);

    this.moodDetectionPatterns.set('excited', [
      /wah|wow|keren|mantap|asik|seru/i,
      /pengen banget|mau banget|excited/i
    ]);

    this.moodDetectionPatterns.set('tired', [
      /capek|lelah|pusing|males|malas/i,
      /udah lama|dari tadi|berkali-kali/i
    ]);
  }

  private initializeCulturalPatterns(): void {
    this.culturalPatterns.set('jakarta', [
      /gue|lu|elo|gua/i,
      /dong|sih|deh/i,
      /kepo|baper|gabut/i
    ]);

    this.culturalPatterns.set('sunda', [
      /atuh|mah|teh|da/i,
      /kumaha|naon|dimana/i
    ]);

    this.culturalPatterns.set('jawa_barat', [
      /nuhun|hatur|punten/i,
      /abdi|sim kuring/i
    ]);
  }

  private initializeAdaptationRules(): void {
    // Initialize rules for different adaptation scenarios
    this.adaptationRules.set('frustrated_user', (context: any) => ({
      patience: 1.0,
      warmth: 0.9,
      explanation_approach: 'step_by_step',
      encouragement_level: 'high'
    }));
  }

  private calculateMoodScore(query: string, mood: string): number {
    const patterns = this.moodDetectionPatterns.get(mood) || [];
    let score = 0;
    
    patterns.forEach(pattern => {
      if (pattern.test(query)) {
        score += 0.3;
      }
    });
    
    return Math.min(score, 1.0);
  }

  private matchesPattern(query: string, patternKey: string): boolean {
    const patterns = this.culturalPatterns.get(patternKey) || [];
    return patterns.some(pattern => pattern.test(query));
  }

  private generateResponseStyle(
    mood: string, 
    intensity: string, 
    context: EnhancedConversationContext
  ): string {
    if (mood === 'frustrated' && intensity === 'high') return 'empathetic_detailed';
    if (mood === 'confused') return 'patient_explanatory';
    if (mood === 'excited') return 'enthusiastic_supportive';
    return 'balanced_helpful';
  }

  private generateGreetingStyle(mood: MoodDetectionResult, cultural: CulturalContext): string {
    if (cultural.religious_context === 'islamic') return 'Assalamualaikum kak!';
    if (cultural.formality_level === 'very_formal') return 'Selamat pagi/siang/sore, Bapak/Ibu.';
    if (mood.primary_mood === 'frustrated') return 'Halo kak, saya di sini untuk membantu.';
    return 'Halo kak! Apa kabar?';
  }

  private generateExplanationApproach(mood: MoodDetectionResult, cultural: CulturalContext): string {
    if (mood.primary_mood === 'confused') return 'simplified';
    if (mood.primary_mood === 'frustrated') return 'step_by_step';
    if (cultural.formality_level === 'very_formal') return 'detailed_formal';
    return 'conversational';
  }

  private generateEncouragementLevel(mood: MoodDetectionResult, context: EnhancedConversationContext): string {
    if (mood.primary_mood === 'frustrated' || mood.primary_mood === 'anxious') return 'high';
    if (mood.primary_mood === 'confused') return 'moderate';
    return 'low';
  }

  private generateClosingStyle(cultural: CulturalContext, context: EnhancedConversationContext): string {
    if (cultural.formality_level === 'very_formal') return 'Terima kasih atas perhatiannya.';
    if (cultural.age_group === 'young') return 'Semoga membantu ya! 😊';
    return 'Ada yang mau ditanyakan lagi, kak?';
  }

  private determineVocabularyLevel(cultural: CulturalContext, context: EnhancedConversationContext): 'simple' | 'standard' | 'advanced' {
    if (context.userProfile.learningProfile.understandingLevel === 'beginner') return 'simple';
    if (cultural.formality_level === 'very_formal') return 'advanced';
    return 'standard';
  }

  private determineSentenceStructure(mood: MoodDetectionResult, cultural: CulturalContext): 'simple' | 'compound' | 'complex' {
    if (mood.primary_mood === 'confused') return 'simple';
    if (cultural.formality_level === 'very_formal') return 'complex';
    return 'compound';
  }

  private generateCulturalReferences(cultural: CulturalContext): string[] {
    const references: string[] = [];
    
    if (cultural.region === 'jakarta') {
      references.push('seperti di Jakarta pada umumnya');
    }
    
    if (cultural.religious_context === 'islamic') {
      references.push('insyaallah prosesnya lancar');
    }
    
    return references;
  }

  private generateAddressForms(cultural: CulturalContext, context: EnhancedConversationContext): string[] {
    if (cultural.formality_level === 'very_formal') return ['Bapak', 'Ibu'];
    if (cultural.age_group === 'young') return ['kak'];
    if (context.userProfile.preferences.preferredAddress === 'kakak') return ['kakak'];
    return ['kak', 'kakak'];
  }

  private convertToStepByStep(response: string): string {
    const sentences = response.split(/[.!?]\s+/);
    return sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
  }

  private simplifyExplanation(response: string): string {
    return response
      .replace(/\b(administrasi|administratif)\b/gi, 'urusan')
      .replace(/\b(prosedur|tata cara)\b/gi, 'cara')
      .replace(/\b(persyaratan|requirement)\b/gi, 'syarat');
  }

  private applyLinguisticAdaptations(response: string, adaptations: any): string {
    let adapted = response;
    
    if (adaptations.vocabulary_level === 'simple') {
      adapted = this.simplifyVocabulary(adapted);
    }
    
    if (adaptations.sentence_structure === 'simple') {
      adapted = this.simplifySentences(adapted);
    }
    
    return adapted;
  }

  private simplifyVocabulary(text: string): string {
    return text
      .replace(/\bmemerlukan\b/gi, 'butuh')
      .replace(/\bmenggunakan\b/gi, 'pakai')
      .replace(/\bmelakukan\b/gi, 'lakukan');
  }

  private simplifySentences(text: string): string {
    // Break complex sentences into simpler ones
    return text.replace(/,\s*yang\s+/gi, '. Yang ');
  }

  private adjustAdaptationRules(userId: string, aspect: string, feedback: any): void {
    // Implement learning mechanism to improve future adaptations
    // This would typically involve machine learning or rule adjustment
    console.log(`Learning from feedback for user ${userId} on ${aspect}:`, feedback);
  }
}
