/**
 * Cultural Context Processor - Day 21-22: Phase 3 Advanced Features
 * Advanced Indonesian cultural context understanding with regional dialect detection
 * Handles formality levels, cultural nuances, and regional variations
 */

import { CulturalContext, RegionalDialect, FormalityLevel, CulturalNuance } from './EnhancedIndonesianNLP';

export interface RegionalPattern {
  name: string;
  patterns: string[];
  characteristics: string[];
  commonPhrases: string[];
  formalityTendency: 'formal' | 'informal';
  weight: number;
}

export interface FormalityIndicator {
  pattern: string;
  level: FormalityLevel['level'];
  weight: number;
  context: string;
}

export interface CulturalMarker {
  type: string;
  pattern: string;
  meaning: string;
  context: string;
  confidence: number;
}

/**
 * Cultural Context Processor
 * Analyzes Indonesian text for cultural context, regional dialects, and formality levels
 */
export class CulturalContextProcessor {
  private regionalPatterns: Map<string, RegionalPattern> = new Map();
  private formalityIndicators: FormalityIndicator[] = [];
  private culturalMarkers: Map<string, CulturalMarker[]> = new Map();
  private isInitialized = false;

  /**
   * Initialize Cultural Context Processor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🌏 [CULTURAL_PROCESSOR] Initializing Cultural Context Processor...');
    
    try {
      // Initialize regional patterns
      this.initializeRegionalPatterns();
      
      // Initialize formality indicators
      this.initializeFormalityIndicators();
      
      // Initialize cultural markers
      this.initializeCulturalMarkers();
      
      this.isInitialized = true;
      
      console.log('✅ [CULTURAL_PROCESSOR] Cultural Context Processor initialized successfully');
    } catch (error) {
      console.error('❌ [CULTURAL_PROCESSOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Process cultural context from Indonesian text
   */
  async processCulturalContext(text: string, userContext?: any): Promise<CulturalContext> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Detect regional dialect
      const region = await this.detectRegionalDialect(text);
      
      // Analyze formality level
      const formality = await this.analyzeFormalityLevel(text);
      
      // Extract cultural nuances
      const nuances = await this.extractCulturalNuances(text, region);
      
      // Generate adapted response
      const adaptedResponse = await this.generateAdaptedResponse(text, { region, formality, nuances });
      
      // Calculate overall confidence
      const confidence = this.calculateCulturalConfidence({ region, formality, nuances });

      return {
        region,
        formality,
        nuances,
        adaptedResponse,
        confidence
      };
    } catch (error) {
      console.error('❌ [CULTURAL_PROCESSOR] Failed to process cultural context:', error);
      throw error;
    }
  }

  /**
   * Detect regional dialect from text
   */
  private async detectRegionalDialect(text: string): Promise<RegionalDialect> {
    const lowerText = text.toLowerCase();
    const dialectScores: Map<string, number> = new Map();
    
    // Analyze each regional pattern
    for (const [regionName, pattern] of this.regionalPatterns) {
      let score = 0;
      
      // Check for pattern matches
      for (const patternStr of pattern.patterns) {
        const regex = new RegExp(`\\b${patternStr}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length * pattern.weight;
        }
      }
      
      // Check for characteristic phrases
      for (const phrase of pattern.commonPhrases) {
        if (lowerText.includes(phrase)) {
          score += pattern.weight * 0.5;
        }
      }
      
      if (score > 0) {
        dialectScores.set(regionName, score);
      }
    }
    
    // Find the highest scoring dialect
    let bestDialect = 'standard';
    let bestScore = 0;
    
    for (const [dialect, score] of dialectScores) {
      if (score > bestScore) {
        bestDialect = dialect;
        bestScore = score;
      }
    }
    
    const selectedPattern = this.regionalPatterns.get(bestDialect);
    const confidence = Math.min(bestScore / 10, 1.0); // Normalize confidence
    
    return {
      name: bestDialect,
      confidence,
      patterns: selectedPattern?.patterns || [],
      characteristics: selectedPattern?.characteristics || []
    };
  }

  /**
   * Analyze formality level
   */
  private async analyzeFormalityLevel(text: string): Promise<FormalityLevel> {
    const lowerText = text.toLowerCase();
    const formalityScores: Map<FormalityLevel['level'], number> = new Map();
    const indicators: string[] = [];
    
    // Initialize scores
    const levels: FormalityLevel['level'][] = ['very_formal', 'formal', 'neutral', 'informal', 'very_informal'];
    levels.forEach(level => formalityScores.set(level, 0));
    
    // Analyze formality indicators
    for (const indicator of this.formalityIndicators) {
      const regex = new RegExp(indicator.pattern, 'gi');
      const matches = lowerText.match(regex);
      
      if (matches) {
        const currentScore = formalityScores.get(indicator.level) || 0;
        formalityScores.set(indicator.level, currentScore + (matches.length * indicator.weight));
        indicators.push(indicator.pattern);
      }
    }
    
    // Find the highest scoring formality level
    let bestLevel: FormalityLevel['level'] = 'neutral';
    let bestScore = 0;
    
    for (const [level, score] of formalityScores) {
      if (score > bestScore) {
        bestLevel = level;
        bestScore = score;
      }
    }
    
    const confidence = Math.min(bestScore / 5, 1.0); // Normalize confidence
    
    return {
      level: bestLevel,
      confidence,
      indicators
    };
  }

  /**
   * Extract cultural nuances
   */
  private async extractCulturalNuances(text: string, region: RegionalDialect): Promise<CulturalNuance[]> {
    const nuances: CulturalNuance[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for cultural markers
    for (const [category, markers] of this.culturalMarkers) {
      for (const marker of markers) {
        const regex = new RegExp(marker.pattern, 'gi');
        if (regex.test(lowerText)) {
          nuances.push({
            type: category,
            description: marker.meaning,
            context: marker.context,
            confidence: marker.confidence
          });
        }
      }
    }
    
    // Add region-specific nuances
    if (region.name !== 'standard') {
      nuances.push({
        type: 'regional_dialect',
        description: `Text shows characteristics of ${region.name} dialect`,
        context: `Regional variation detected with ${(region.confidence * 100).toFixed(1)}% confidence`,
        confidence: region.confidence
      });
    }
    
    return nuances;
  }

  /**
   * Generate culturally adapted response
   */
  private async generateAdaptedResponse(text: string, context: any): Promise<string> {
    const { region, formality, nuances } = context;
    
    // Base response adaptation
    let adaptedResponse = text;
    
    // Adapt based on formality level
    switch (formality.level) {
      case 'very_formal':
        adaptedResponse = this.adaptToVeryFormal(adaptedResponse);
        break;
      case 'formal':
        adaptedResponse = this.adaptToFormal(adaptedResponse);
        break;
      case 'informal':
        adaptedResponse = this.adaptToInformal(adaptedResponse);
        break;
      case 'very_informal':
        adaptedResponse = this.adaptToVeryInformal(adaptedResponse);
        break;
      default:
        // Keep neutral
        break;
    }
    
    // Adapt based on regional dialect
    if (region.name !== 'standard') {
      adaptedResponse = this.adaptToRegionalDialect(adaptedResponse, region);
    }
    
    return adaptedResponse;
  }

  /**
   * Initialize regional patterns
   */
  private initializeRegionalPatterns(): void {
    // Jakarta/Betawi patterns
    this.regionalPatterns.set('jakarta', {
      name: 'Jakarta/Betawi',
      patterns: ['gue', 'lu', 'nih', 'tuh', 'dong', 'sih', 'deh', 'aje', 'kali'],
      characteristics: ['informal_pronouns', 'emphasis_particles', 'relaxed_grammar'],
      commonPhrases: ['gimana sih', 'udah dong', 'nih ya', 'gue mah'],
      formalityTendency: 'informal',
      weight: 1.0
    });
    
    // Javanese influence patterns
    this.regionalPatterns.set('javanese', {
      name: 'Javanese',
      patterns: ['mas', 'mbak', 'pak de', 'bu de', 'monggo', 'nggih', 'sampun'],
      characteristics: ['respectful_address', 'hierarchical_language', 'polite_particles'],
      commonPhrases: ['monggo silakan', 'nggih pak', 'sampun mas'],
      formalityTendency: 'formal',
      weight: 1.2
    });
    
    // Sundanese patterns
    this.regionalPatterns.set('sundanese', {
      name: 'Sundanese',
      patterns: ['atuh', 'mah', 'teh', 'da', 'ge', 'sia', 'urang'],
      characteristics: ['soft_particles', 'melodic_intonation', 'gentle_emphasis'],
      commonPhrases: ['kumaha atuh', 'da urang mah', 'teh sia'],
      formalityTendency: 'informal',
      weight: 1.0
    });
    
    // Batak patterns
    this.regionalPatterns.set('batak', {
      name: 'Batak',
      patterns: ['horas', 'ito', 'eda', 'dang', 'ma', 'do'],
      characteristics: ['direct_communication', 'emphatic_particles', 'strong_intonation'],
      commonPhrases: ['horas bah', 'ito do', 'dang adong'],
      formalityTendency: 'informal',
      weight: 1.0
    });
    
    // Minang patterns
    this.regionalPatterns.set('minang', {
      name: 'Minangkabau',
      patterns: ['lah', 'bah', 'kan', 'dek', 'nak', 'uni', 'uda'],
      characteristics: ['melodic_particles', 'kinship_terms', 'flowing_speech'],
      commonPhrases: ['alah bah', 'kan dek', 'uda uni'],
      formalityTendency: 'informal',
      weight: 1.0
    });
    
    console.log('✅ [CULTURAL_PROCESSOR] Regional patterns initialized');
  }

  /**
   * Initialize formality indicators
   */
  private initializeFormalityIndicators(): void {
    this.formalityIndicators = [
      // Very formal indicators
      { pattern: 'yang terhormat', level: 'very_formal', weight: 3.0, context: 'official_address' },
      { pattern: 'dengan hormat', level: 'very_formal', weight: 3.0, context: 'letter_opening' },
      { pattern: 'mohon maaf', level: 'very_formal', weight: 2.5, context: 'polite_apology' },
      { pattern: 'perkenankan saya', level: 'very_formal', weight: 2.5, context: 'formal_request' },
      { pattern: 'demikian atas perhatian', level: 'very_formal', weight: 3.0, context: 'letter_closing' },
      
      // Formal indicators
      { pattern: 'selamat pagi', level: 'formal', weight: 2.0, context: 'formal_greeting' },
      { pattern: 'terima kasih', level: 'formal', weight: 1.5, context: 'polite_thanks' },
      { pattern: 'mohon bantuan', level: 'formal', weight: 2.0, context: 'polite_request' },
      { pattern: 'bapak', level: 'formal', weight: 1.5, context: 'respectful_address' },
      { pattern: 'ibu', level: 'formal', weight: 1.5, context: 'respectful_address' },
      { pattern: 'saudara', level: 'formal', weight: 2.0, context: 'formal_address' },
      
      // Neutral indicators
      { pattern: 'bagaimana', level: 'neutral', weight: 1.0, context: 'standard_question' },
      { pattern: 'silakan', level: 'neutral', weight: 1.0, context: 'polite_invitation' },
      { pattern: 'tolong', level: 'neutral', weight: 1.0, context: 'request' },
      
      // Informal indicators
      { pattern: 'gimana', level: 'informal', weight: 2.0, context: 'casual_question' },
      { pattern: 'makasih', level: 'informal', weight: 1.5, context: 'casual_thanks' },
      { pattern: 'dong', level: 'informal', weight: 2.0, context: 'emphasis_particle' },
      { pattern: 'sih', level: 'informal', weight: 2.0, context: 'questioning_particle' },
      { pattern: 'nih', level: 'informal', weight: 1.5, context: 'pointing_particle' },
      
      // Very informal indicators
      { pattern: 'gue', level: 'very_informal', weight: 3.0, context: 'informal_pronoun' },
      { pattern: 'lu', level: 'very_informal', weight: 3.0, context: 'informal_pronoun' },
      { pattern: 'gak', level: 'very_informal', weight: 2.0, context: 'informal_negation' },
      { pattern: 'udah', level: 'very_informal', weight: 2.0, context: 'informal_completion' },
      { pattern: 'banget', level: 'very_informal', weight: 1.5, context: 'informal_intensifier' }
    ];
    
    console.log('✅ [CULTURAL_PROCESSOR] Formality indicators initialized');
  }

  /**
   * Initialize cultural markers
   */
  private initializeCulturalMarkers(): void {
    // Politeness markers
    this.culturalMarkers.set('politeness', [
      {
        type: 'politeness',
        pattern: 'maaf',
        meaning: 'Polite apology or attention-getting',
        context: 'Shows cultural politeness',
        confidence: 0.8
      },
      {
        type: 'politeness',
        pattern: 'permisi',
        meaning: 'Polite excuse me',
        context: 'Cultural politeness marker',
        confidence: 0.9
      },
      {
        type: 'politeness',
        pattern: 'mohon',
        meaning: 'Polite request form',
        context: 'Formal politeness',
        confidence: 0.9
      }
    ]);
    
    // Respect markers
    this.culturalMarkers.set('respect', [
      {
        type: 'respect',
        pattern: 'bapak|pak',
        meaning: 'Respectful address for men',
        context: 'Cultural respect hierarchy',
        confidence: 0.8
      },
      {
        type: 'respect',
        pattern: 'ibu|bu',
        meaning: 'Respectful address for women',
        context: 'Cultural respect hierarchy',
        confidence: 0.8
      },
      {
        type: 'respect',
        pattern: 'kakak|kak',
        meaning: 'Respectful address for older person',
        context: 'Age-based respect',
        confidence: 0.7
      }
    ]);
    
    // Administrative context markers
    this.culturalMarkers.set('administrative', [
      {
        type: 'administrative',
        pattern: 'mengurus|ngurus',
        meaning: 'Administrative processing',
        context: 'Government service context',
        confidence: 0.9
      },
      {
        type: 'administrative',
        pattern: 'persyaratan',
        meaning: 'Requirements or prerequisites',
        context: 'Bureaucratic process',
        confidence: 0.9
      },
      {
        type: 'administrative',
        pattern: 'berkas',
        meaning: 'Documents or files',
        context: 'Administrative documentation',
        confidence: 0.8
      }
    ]);
    
    console.log('✅ [CULTURAL_PROCESSOR] Cultural markers initialized');
  }

  /**
   * Formality adaptation methods
   */
  private adaptToVeryFormal(text: string): string {
    let adapted = text;
    
    // Replace informal with very formal
    const veryFormalReplacements = {
      'saya': 'hamba',
      'anda': 'Bapak/Ibu',
      'minta': 'mohon dengan hormat',
      'tolong': 'mohon kiranya berkenan',
      'terima kasih': 'terima kasih yang sebesar-besarnya'
    };
    
    for (const [informal, formal] of Object.entries(veryFormalReplacements)) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      adapted = adapted.replace(regex, formal);
    }
    
    return adapted;
  }

  private adaptToFormal(text: string): string {
    let adapted = text;
    
    const formalReplacements = {
      'gimana': 'bagaimana',
      'kenapa': 'mengapa',
      'dimana': 'di mana',
      'makasih': 'terima kasih',
      'gak': 'tidak'
    };
    
    for (const [informal, formal] of Object.entries(formalReplacements)) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      adapted = adapted.replace(regex, formal);
    }
    
    return adapted;
  }

  private adaptToInformal(text: string): string {
    let adapted = text;
    
    const informalReplacements = {
      'bagaimana': 'gimana',
      'mengapa': 'kenapa',
      'terima kasih': 'makasih',
      'tidak': 'gak'
    };
    
    for (const [formal, informal] of Object.entries(informalReplacements)) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      adapted = adapted.replace(regex, informal);
    }
    
    return adapted;
  }

  private adaptToVeryInformal(text: string): string {
    let adapted = this.adaptToInformal(text);
    
    const veryInformalReplacements = {
      'saya': 'gue',
      'kamu': 'lu',
      'sudah': 'udah',
      'belum': 'belom'
    };
    
    for (const [formal, veryInformal] of Object.entries(veryInformalReplacements)) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      adapted = adapted.replace(regex, veryInformal);
    }
    
    return adapted;
  }

  private adaptToRegionalDialect(text: string, region: RegionalDialect): string {
    // Add regional particles or modify based on dialect
    let adapted = text;
    
    switch (region.name) {
      case 'jakarta':
        adapted += ' nih';
        break;
      case 'javanese':
        adapted = 'Monggo, ' + adapted;
        break;
      case 'sundanese':
        adapted += ' atuh';
        break;
      case 'batak':
        adapted += ' bah';
        break;
      case 'minang':
        adapted += ' lah';
        break;
    }
    
    return adapted;
  }

  /**
   * Calculate cultural confidence
   */
  private calculateCulturalConfidence(context: any): number {
    const { region, formality, nuances } = context;
    
    let totalConfidence = 0;
    let components = 0;
    
    if (region.confidence > 0) {
      totalConfidence += region.confidence;
      components++;
    }
    
    if (formality.confidence > 0) {
      totalConfidence += formality.confidence;
      components++;
    }
    
    if (nuances.length > 0) {
      const avgNuanceConfidence = nuances.reduce((sum: number, nuance: any) => 
        sum + nuance.confidence, 0) / nuances.length;
      totalConfidence += avgNuanceConfidence;
      components++;
    }
    
    return components > 0 ? totalConfidence / components : 0.5;
  }

  /**
   * Get cultural processing statistics
   */
  getCulturalStatistics(): any {
    return {
      regionalPatternsLoaded: this.regionalPatterns.size,
      formalityIndicatorsLoaded: this.formalityIndicators.length,
      culturalMarkersLoaded: Array.from(this.culturalMarkers.values()).reduce((sum, markers) => sum + markers.length, 0),
      isInitialized: this.isInitialized
    };
  }
}
