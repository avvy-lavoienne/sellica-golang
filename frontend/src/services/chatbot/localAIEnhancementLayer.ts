/**
 * Local AI Enhancement Layer for SELLY
 * Client-side TensorFlow.js models for sentiment analysis, intent refinement,
 * and response quality enhancement without external dependencies
 */

import * as tf from '@tensorflow/tfjs';

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotional_indicators: string[];
  intensity: 'low' | 'medium' | 'high';
}

export interface IntentRefinementResult {
  refined_intent: string;
  confidence: number;
  intent_hierarchy: string[];
  context_clues: string[];
  suggested_clarifications: string[];
}

export interface ResponseQualityMetrics {
  clarity_score: number;
  completeness_score: number;
  relevance_score: number;
  tone_appropriateness: number;
  overall_quality: number;
  improvement_suggestions: string[];
}

export interface LocalModelConfig {
  model_name: string;
  model_path: string;
  input_shape: number[];
  output_classes: string[];
  confidence_threshold: number;
  preprocessing_steps: string[];
}

export class LocalAIEnhancementLayer {
  private models: Map<string, tf.LayersModel> = new Map();
  private modelConfigs: Map<string, LocalModelConfig> = new Map();
  private vocabularyMaps: Map<string, Map<string, number>> = new Map();
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializeModelConfigs();
  }

  /**
   * Initialize all local AI models
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Analyze sentiment using local TensorFlow.js model
   */
  public async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    await this.ensureInitialized();
    
    try {
      // Preprocess text for sentiment analysis
      const processedText = this.preprocessTextForSentiment(text);
      const inputTensor = this.textToTensor(processedText, 'sentiment');
      
      // Run sentiment model (fallback to rule-based if model not available)
      const sentimentModel = this.models.get('sentiment');
      let prediction;
      
      if (sentimentModel) {
        prediction = sentimentModel.predict(inputTensor) as tf.Tensor;
        const scores = await prediction.data();
        prediction.dispose();
        inputTensor.dispose();
        
        // Interpret results
        const sentimentLabels = ['negative', 'neutral', 'positive'];
        const maxIndex = scores.indexOf(Math.max(...Array.from(scores)));
        const confidence = scores[maxIndex];
        
        return {
          sentiment: sentimentLabels[maxIndex] as 'positive' | 'negative' | 'neutral',
          confidence,
          emotional_indicators: this.extractEmotionalIndicators(text),
          intensity: this.calculateEmotionalIntensity(text, confidence)
        };
      } else {
        // Fallback to rule-based sentiment analysis
        return this.ruleBasedSentimentAnalysis(text);
      }
    } catch (error) {
      console.warn('Sentiment analysis failed, using fallback:', error);
      return this.ruleBasedSentimentAnalysis(text);
    }
  }

  /**
   * Refine intent classification using local models
   */
  public async refineIntent(
    text: string, 
    initialIntent: string,
    context?: any
  ): Promise<IntentRefinementResult> {
    await this.ensureInitialized();
    
    try {
      // Preprocess text for intent classification
      const processedText = this.preprocessTextForIntent(text);
      const inputTensor = this.textToTensor(processedText, 'intent');
      
      // Run intent refinement model
      const intentModel = this.models.get('intent');
      let refinedIntent = initialIntent;
      let confidence = 0.7; // Default confidence
      
      if (intentModel) {
        const prediction = intentModel.predict(inputTensor) as tf.Tensor;
        const scores = await prediction.data();
        prediction.dispose();
        inputTensor.dispose();
        
        // Get intent hierarchy
        const intentLabels = this.modelConfigs.get('intent')?.output_classes || [];
        const sortedIndices = Array.from(scores)
          .map((score, index) => ({ score, index }))
          .sort((a, b) => b.score - a.score);
        
        refinedIntent = intentLabels[sortedIndices[0].index] || initialIntent;
        confidence = sortedIndices[0].score;
        
        return {
          refined_intent: refinedIntent,
          confidence,
          intent_hierarchy: sortedIndices.slice(0, 3).map(item => intentLabels[item.index]),
          context_clues: this.extractContextClues(text),
          suggested_clarifications: this.generateClarificationSuggestions(text, refinedIntent)
        };
      } else {
        // Fallback to rule-based intent refinement
        return this.ruleBasedIntentRefinement(text, initialIntent, context);
      }
    } catch (error) {
      console.warn('Intent refinement failed, using fallback:', error);
      return this.ruleBasedIntentRefinement(text, initialIntent, context);
    }
  }

  /**
   * Assess and improve response quality using local AI
   */
  public async assessResponseQuality(
    originalResponse: string,
    userQuery: string,
    context?: any
  ): Promise<ResponseQualityMetrics> {
    await this.ensureInitialized();
    
    try {
      // Calculate quality metrics
      const clarityScore = this.calculateClarityScore(originalResponse);
      const completenessScore = this.calculateCompletenessScore(originalResponse, userQuery);
      const relevanceScore = this.calculateRelevanceScore(originalResponse, userQuery);
      const toneScore = this.calculateToneAppropriatenesss(originalResponse, context);
      
      const overallQuality = (clarityScore + completenessScore + relevanceScore + toneScore) / 4;
      
      return {
        clarity_score: clarityScore,
        completeness_score: completenessScore,
        relevance_score: relevanceScore,
        tone_appropriateness: toneScore,
        overall_quality: overallQuality,
        improvement_suggestions: this.generateImprovementSuggestions(
          originalResponse, 
          { clarityScore, completenessScore, relevanceScore, toneScore }
        )
      };
    } catch (error) {
      console.warn('Quality assessment failed:', error);
      return this.fallbackQualityAssessment(originalResponse, userQuery);
    }
  }

  /**
   * Enhance response using local AI insights
   */
  public async enhanceResponse(
    originalResponse: string,
    qualityMetrics: ResponseQualityMetrics,
    userQuery: string,
    context?: any
  ): Promise<string> {
    await this.ensureInitialized();
    
    let enhancedResponse = originalResponse;
    
    // Apply enhancements based on quality metrics
    if (qualityMetrics.clarity_score < 0.7) {
      enhancedResponse = this.improveClarity(enhancedResponse);
    }
    
    if (qualityMetrics.completeness_score < 0.7) {
      enhancedResponse = this.improveCompleteness(enhancedResponse, userQuery);
    }
    
    if (qualityMetrics.tone_appropriateness < 0.7) {
      enhancedResponse = this.improveTone(enhancedResponse, context);
    }
    
    // Apply local AI enhancements
    enhancedResponse = this.applyLocalAIEnhancements(enhancedResponse, context);
    
    return enhancedResponse;
  }

  /**
   * Generate response variations using local models
   */
  public async generateResponseVariations(
    baseResponse: string,
    count: number = 3,
    context?: any
  ): Promise<Array<{variation: string; style: string; confidence: number}>> {
    await this.ensureInitialized();
    
    const variations: Array<{variation: string; style: string; confidence: number}> = [];
    
    // Generate different style variations
    const styles = ['formal', 'casual', 'detailed', 'concise'];
    
    for (let i = 0; i < Math.min(count, styles.length); i++) {
      const style = styles[i];
      const variation = this.generateStyleVariation(baseResponse, style, context);
      const confidence = this.calculateVariationConfidence(variation, style, context);
      
      variations.push({
        variation,
        style,
        confidence
      });
    }
    
    return variations.sort((a, b) => b.confidence - a.confidence);
  }

  // Private initialization methods
  private async performInitialization(): Promise<void> {
    try {
      console.log('🤖 [LOCAL_AI] Initializing local AI enhancement layer...');
      
      // Initialize vocabulary maps
      this.initializeVocabularyMaps();
      
      // Try to load pre-trained models (graceful fallback if not available)
      await this.loadModels();
      
      this.isInitialized = true;
      console.log('✅ [LOCAL_AI] Local AI enhancement layer initialized successfully');
    } catch (error) {
      console.warn('⚠️ [LOCAL_AI] Failed to initialize some models, using fallbacks:', error);
      this.isInitialized = true; // Still mark as initialized to use fallbacks
    }
  }

  private initializeModelConfigs(): void {
    // Sentiment analysis model config
    this.modelConfigs.set('sentiment', {
      model_name: 'indonesian_sentiment',
      model_path: '/models/sentiment/model.json',
      input_shape: [1, 100], // Max 100 tokens
      output_classes: ['negative', 'neutral', 'positive'],
      confidence_threshold: 0.6,
      preprocessing_steps: ['tokenize', 'pad', 'normalize']
    });

    // Intent classification model config
    this.modelConfigs.set('intent', {
      model_name: 'indonesian_intent',
      model_path: '/models/intent/model.json',
      input_shape: [1, 50], // Max 50 tokens
      output_classes: ['greeting', 'ktp_inquiry', 'kk_inquiry', 'data_request', 'general'],
      confidence_threshold: 0.5,
      preprocessing_steps: ['tokenize', 'pad', 'normalize']
    });
  }

  private initializeVocabularyMaps(): void {
    // Indonesian vocabulary for sentiment analysis
    const sentimentVocab = new Map<string, number>();
    const commonWords = [
      'saya', 'anda', 'ini', 'itu', 'dan', 'atau', 'dengan', 'untuk', 'dari', 'ke',
      'ktp', 'kartu', 'tanda', 'penduduk', 'kk', 'keluarga', 'akta', 'kelahiran',
      'baik', 'bagus', 'senang', 'terima', 'kasih', 'tolong', 'bantu', 'bingung',
      'susah', 'sulit', 'mudah', 'cepat', 'lambat', 'penting', 'urgent', 'segera'
    ];
    
    commonWords.forEach((word, index) => {
      sentimentVocab.set(word, index + 1); // Start from 1, 0 is reserved for padding
    });
    
    this.vocabularyMaps.set('sentiment', sentimentVocab);
    this.vocabularyMaps.set('intent', sentimentVocab); // Reuse for intent
  }

  private async loadModels(): Promise<void> {
    // Try to load models, but don't fail if they're not available
    for (const [modelName, config] of this.modelConfigs) {
      try {
        const model = await tf.loadLayersModel(config.model_path);
        this.models.set(modelName, model);
        console.log(`✅ [LOCAL_AI] Loaded ${modelName} model`);
      } catch (error) {
        console.log(`ℹ️ [LOCAL_AI] ${modelName} model not available, using rule-based fallback`);
      }
    }
  }

  // Text preprocessing methods
  private preprocessTextForSentiment(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private preprocessTextForIntent(text: string): string {
    return this.preprocessTextForSentiment(text);
  }

  private textToTensor(text: string, modelType: string): tf.Tensor {
    const vocab = this.vocabularyMaps.get(modelType);
    const config = this.modelConfigs.get(modelType);
    
    if (!vocab || !config) {
      throw new Error(`Vocabulary or config not found for ${modelType}`);
    }
    
    // Tokenize text
    const tokens = text.split(' ').slice(0, config.input_shape[1]); // Limit to max length
    const indices = tokens.map(token => vocab.get(token) || 0); // 0 for unknown words
    
    // Pad to required length
    while (indices.length < config.input_shape[1]) {
      indices.push(0);
    }
    
    return tf.tensor2d([indices], [1, config.input_shape[1]]);
  }

  // Fallback methods (rule-based)
  private ruleBasedSentimentAnalysis(text: string): SentimentAnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Positive indicators
    const positiveWords = ['senang', 'bagus', 'terima kasih', 'mantap', 'keren', 'suka'];
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    
    // Negative indicators
    const negativeWords = ['susah', 'sulit', 'bingung', 'kesal', 'ribet', 'capek'];
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.6;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.8, 0.6 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.8, 0.6 + (negativeCount * 0.1));
    }
    
    return {
      sentiment,
      confidence,
      emotional_indicators: this.extractEmotionalIndicators(text),
      intensity: this.calculateEmotionalIntensity(text, confidence)
    };
  }

  private ruleBasedIntentRefinement(
    text: string, 
    initialIntent: string, 
    context?: any
  ): IntentRefinementResult {
    const lowerText = text.toLowerCase();
    let refinedIntent = initialIntent;
    let confidence = 0.7;
    
    // Intent refinement rules
    if (lowerText.includes('ktp') && lowerText.includes('cara')) {
      refinedIntent = 'ktp_procedure_inquiry';
      confidence = 0.8;
    } else if (lowerText.includes('data') || lowerText.includes('berapa')) {
      refinedIntent = 'data_request';
      confidence = 0.75;
    } else if (lowerText.includes('halo') || lowerText.includes('hai')) {
      refinedIntent = 'greeting';
      confidence = 0.9;
    }
    
    return {
      refined_intent: refinedIntent,
      confidence,
      intent_hierarchy: [refinedIntent, initialIntent],
      context_clues: this.extractContextClues(text),
      suggested_clarifications: this.generateClarificationSuggestions(text, refinedIntent)
    };
  }

  // Quality assessment methods
  private calculateClarityScore(response: string): number {
    // Simple clarity metrics
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = response.length / sentences.length;
    const complexWords = response.split(' ').filter(word => word.length > 12).length;
    
    let score = 1.0;
    
    // Penalize very long sentences
    if (avgSentenceLength > 100) score -= 0.2;
    
    // Penalize too many complex words
    if (complexWords > 5) score -= 0.1;
    
    return Math.max(0, score);
  }

  private calculateCompletenessScore(response: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const responseWords = response.toLowerCase().split(' ');
    
    // Check if key query terms are addressed in response
    const addressedTerms = queryWords.filter(word => 
      word.length > 3 && responseWords.includes(word)
    ).length;
    
    return Math.min(1.0, addressedTerms / Math.max(1, queryWords.length));
  }

  private calculateRelevanceScore(response: string, query: string): number {
    // Simple relevance based on keyword overlap
    const queryKeywords = this.extractKeywords(query);
    const responseKeywords = this.extractKeywords(response);
    
    const overlap = queryKeywords.filter(keyword => 
      responseKeywords.includes(keyword)
    ).length;
    
    return Math.min(1.0, overlap / Math.max(1, queryKeywords.length));
  }

  private calculateToneAppropriatenesss(response: string, context?: any): number {
    // Check for appropriate tone based on context
    let score = 0.8; // Default good score
    
    const lowerResponse = response.toLowerCase();
    
    // Check for politeness
    if (lowerResponse.includes('terima kasih') || lowerResponse.includes('semoga membantu')) {
      score += 0.1;
    }
    
    // Check for appropriate address
    if (lowerResponse.includes('kak') || lowerResponse.includes('kakak')) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  // Helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private extractEmotionalIndicators(text: string): string[] {
    const indicators: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('!')) indicators.push('exclamation');
    if (lowerText.includes('?')) indicators.push('questioning');
    if (lowerText.includes('banget')) indicators.push('intensity');
    if (lowerText.includes('sekali')) indicators.push('emphasis');
    
    return indicators;
  }

  private calculateEmotionalIntensity(text: string, confidence: number): 'low' | 'medium' | 'high' {
    const intensityMarkers = ['banget', 'sekali', '!!!', 'sangat'];
    const hasIntensity = intensityMarkers.some(marker => text.toLowerCase().includes(marker));
    
    if (hasIntensity && confidence > 0.7) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  }

  private extractContextClues(text: string): string[] {
    const clues: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('segera')) clues.push('urgency');
    if (lowerText.includes('bingung') || lowerText.includes('tidak tahu')) clues.push('confusion');
    if (lowerText.includes('pertama kali')) clues.push('first_time');
    
    return clues;
  }

  private generateClarificationSuggestions(text: string, intent: string): string[] {
    const suggestions: string[] = [];
    
    if (intent === 'ktp_inquiry') {
      suggestions.push('Apakah Anda ingin tahu tentang persyaratan KTP?');
      suggestions.push('Atau Anda ingin tahu tentang proses pembuatan KTP?');
    }
    
    return suggestions;
  }

  private generateImprovementSuggestions(response: string, metrics: any): string[] {
    const suggestions: string[] = [];
    
    if (metrics.clarityScore < 0.7) {
      suggestions.push('Sederhanakan kalimat yang terlalu panjang');
    }
    
    if (metrics.completenessScore < 0.7) {
      suggestions.push('Tambahkan informasi yang lebih lengkap');
    }
    
    if (metrics.toneScore < 0.7) {
      suggestions.push('Gunakan bahasa yang lebih ramah dan sopan');
    }
    
    return suggestions;
  }

  private fallbackQualityAssessment(response: string, query: string): ResponseQualityMetrics {
    return {
      clarity_score: 0.8,
      completeness_score: 0.7,
      relevance_score: 0.8,
      tone_appropriateness: 0.9,
      overall_quality: 0.8,
      improvement_suggestions: ['Response quality assessed using fallback method']
    };
  }

  private improveClarity(response: string): string {
    // Simple clarity improvements
    return response
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Fix spacing
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
  }

  private improveCompleteness(response: string, query: string): string {
    // Add completeness improvements
    if (!response.includes('Semoga membantu')) {
      response += ' Semoga informasi ini membantu!';
    }
    return response;
  }

  private improveTone(response: string, context?: any): string {
    // Improve tone appropriateness
    if (!response.includes('kak') && !response.includes('kakak')) {
      response = response.replace(/Anda/g, 'kakak');
    }
    return response;
  }

  private applyLocalAIEnhancements(response: string, context?: any): string {
    // Apply various local AI enhancements
    let enhanced = response;
    
    // Add contextual elements
    if (context?.timeOfDay === 'morning') {
      enhanced = enhanced.replace(/^/, 'Selamat pagi! ');
    }
    
    return enhanced;
  }

  private generateStyleVariation(response: string, style: string, context?: any): string {
    switch (style) {
      case 'formal':
        return response
          .replace(/kak/g, 'Bapak/Ibu')
          .replace(/gimana/g, 'bagaimana');
      case 'casual':
        return response
          .replace(/Bapak\/Ibu/g, 'kak')
          .replace(/bagaimana/g, 'gimana');
      case 'detailed':
        return `${response}\n\nInformasi tambahan: Proses ini biasanya memakan waktu 1-2 hari kerja.`;
      case 'concise':
        return response.split('.')[0] + '.'; // Take first sentence only
      default:
        return response;
    }
  }

  private calculateVariationConfidence(variation: string, style: string, context?: any): number {
    // Calculate confidence based on style appropriateness
    let confidence = 0.7;
    
    if (context?.userProfile?.preferences?.communicationStyle === style) {
      confidence += 0.2;
    }
    
    return Math.min(1.0, confidence);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['yang', 'untuk', 'dengan', 'dari', 'pada'].includes(word));
  }
}
