/**
 * Cultural Context Processor - Indonesian Cultural Understanding
 * Analyzes Indonesian cultural context, formality levels, and social nuances
 */

export interface CulturalContext {
  formalityLevel: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
  politenessScore: number;
  socialDistance: 'close' | 'neutral' | 'distant';
  culturalMarkers: {
    respectTerms: string[];
    hierarchyIndicators: string[];
    regionalMarkers: string[];
    generationalMarkers: string[];
  };
  communicationStyle: {
    directness: number; // 0-1, where 1 is very direct
    emotionalExpression: number; // 0-1, where 1 is very expressive
    urgency: number; // 0-1, where 1 is very urgent
  };
  contextualMeaning: {
    implicitRequests: string[];
    culturalReferences: string[];
    businessContext: boolean;
    governmentContext: boolean;
  };
}

export interface ResponseAdaptation {
  recommendedTone: 'formal' | 'friendly' | 'professional' | 'casual';
  suggestedPhrases: string[];
  culturalConsiderations: string[];
  communicationTips: string[];
}

export class CulturalProcessor {
  private formalityMarkers: Map<string, number>;
  private politenessMarkers: Map<string, number>;
  private hierarchyTerms: Set<string>;
  private regionalMarkers: Map<string, string>;
  private businessTerms: Set<string>;
  private governmentTerms: Set<string>;

  constructor() {
    this.formalityMarkers = this.initializeFormalityMarkers();
    this.politenessMarkers = this.initializePolitenessMarkers();
    this.hierarchyTerms = this.initializeHierarchyTerms();
    this.regionalMarkers = this.initializeRegionalMarkers();
    this.businessTerms = this.initializeBusinessTerms();
    this.governmentTerms = this.initializeGovernmentTerms();
  }

  /**
   * Initialize formality markers with scores
   */
  private initializeFormalityMarkers(): Map<string, number> {
    const markers = new Map<string, number>();

    // Very formal (score: 2)
    markers.set('dengan hormat', 2);
    markers.set('yang terhormat', 2);
    markers.set('mohon dengan sangat', 2);
    markers.set('demikian atas perhatiannya', 2);
    markers.set('atas perhatian dan kerjasamanya', 2);

    // Formal (score: 1)
    markers.set('mohon', 1);
    markers.set('silakan', 1);
    markers.set('terima kasih', 1);
    markers.set('selamat', 1);
    markers.set('dengan ini', 1);
    markers.set('bersama ini', 1);
    markers.set('sehubungan dengan', 1);
    markers.set('berkenaan dengan', 1);

    // Neutral (score: 0)
    markers.set('tolong', 0);
    markers.set('bisa', 0);
    markers.set('minta', 0);

    // Informal (score: -1)
    markers.set('gimana', -1);
    markers.set('kayak', -1);
    markers.set('soalnya', -1);
    markers.set('makanya', -1);
    markers.set('jadinya', -1);

    // Very informal (score: -2)
    markers.set('gue', -2);
    markers.set('lu', -2);
    markers.set('gak', -2);
    markers.set('nyari', -2);
    markers.set('ngapain', -2);

    return markers;
  }

  /**
   * Initialize politeness markers
   */
  private initializePolitenessMarkers(): Map<string, number> {
    const markers = new Map<string, number>();

    // High politeness
    markers.set('mohon maaf', 2);
    markers.set('permisi', 2);
    markers.set('terima kasih banyak', 2);
    markers.set('dengan senang hati', 2);
    markers.set('jika berkenan', 2);

    // Medium politeness
    markers.set('terima kasih', 1);
    markers.set('maaf', 1);
    markers.set('silakan', 1);
    markers.set('mohon', 1);
    markers.set('tolong', 1);

    // Low politeness indicators
    markers.set('harus', -1);
    markers.set('wajib', -1);
    markers.set('segera', -1);

    return markers;
  }

  /**
   * Initialize hierarchy terms
   */
  private initializeHierarchyTerms(): Set<string> {
    return new Set([
      // Formal titles
      'bapak', 'ibu', 'pak', 'bu', 'beliau',
      'yang mulia', 'yang terhormat', 'yang berbahagia',
      
      // Professional titles
      'direktur', 'manager', 'supervisor', 'koordinator',
      'kepala', 'wakil', 'sekretaris', 'bendahara',
      
      // Government titles
      'menteri', 'gubernur', 'bupati', 'walikota', 'camat',
      'lurah', 'ketua rt', 'ketua rw',
      
      // Academic titles
      'profesor', 'doktor', 'master', 'sarjana',
      
      // Age-based respect
      'kakak', 'adik', 'mas', 'mbak', 'om', 'tante'
    ]);
  }

  /**
   * Initialize regional markers
   */
  private initializeRegionalMarkers(): Map<string, string> {
    const markers = new Map<string, string>();

    // Jakarta
    markers.set('nih', 'jakarta');
    markers.set('sih', 'jakarta');
    markers.set('dong', 'jakarta');
    markers.set('deh', 'jakarta');

    // Javanese influence
    markers.set('nggih', 'javanese');
    markers.set('monggo', 'javanese');
    markers.set('sampun', 'javanese');

    // Sundanese influence
    markers.set('atuh', 'sundanese');
    markers.set('mah', 'sundanese');
    markers.set('teh', 'sundanese');

    // Batak influence
    markers.set('horas', 'batak');
    markers.set('boasa', 'batak');

    return markers;
  }

  /**
   * Initialize business terms
   */
  private initializeBusinessTerms(): Set<string> {
    return new Set([
      'meeting', 'rapat', 'presentasi', 'proposal', 'kontrak',
      'klien', 'customer', 'pelanggan', 'vendor', 'supplier',
      'target', 'deadline', 'timeline', 'budget', 'anggaran',
      'profit', 'revenue', 'omzet', 'penjualan', 'marketing',
      'branding', 'strategi', 'analisis', 'laporan', 'report'
    ]);
  }

  /**
   * Initialize government terms
   */
  private initializeGovernmentTerms(): Set<string> {
    return new Set([
      'ktp', 'nik', 'siak', 'dukcapil', 'disdukcapil',
      'kelurahan', 'kecamatan', 'kabupaten', 'provinsi',
      'rt', 'rw', 'desa', 'nagari', 'kampung',
      'pemerintah', 'dinas', 'instansi', 'lembaga',
      'peraturan', 'undang-undang', 'kebijakan', 'program',
      'pelayanan', 'administrasi', 'birokrasi', 'aparatur'
    ]);
  }

  /**
   * Analyze cultural context of Indonesian text
   */
  analyzeCulturalContext(text: string): CulturalContext {
    const lowerText = text.toLowerCase();
    
    // Analyze formality level
    const formalityLevel = this.analyzeFormalityLevel(lowerText);
    
    // Calculate politeness score
    const politenessScore = this.calculatePolitenessScore(lowerText);
    
    // Determine social distance
    const socialDistance = this.determineSocialDistance(lowerText);
    
    // Extract cultural markers
    const culturalMarkers = this.extractCulturalMarkers(lowerText);
    
    // Analyze communication style
    const communicationStyle = this.analyzeCommunicationStyle(lowerText);
    
    // Extract contextual meaning
    const contextualMeaning = this.extractContextualMeaning(lowerText);

    return {
      formalityLevel,
      politenessScore,
      socialDistance,
      culturalMarkers,
      communicationStyle,
      contextualMeaning
    };
  }

  /**
   * Analyze formality level
   */
  private analyzeFormalityLevel(text: string): CulturalContext['formalityLevel'] {
    let formalityScore = 0;
    let markerCount = 0;

    this.formalityMarkers.forEach((score, marker) => {
      if (text.includes(marker)) {
        formalityScore += score;
        markerCount++;
      }
    });

    // Normalize score
    const avgScore = markerCount > 0 ? formalityScore / markerCount : 0;

    if (avgScore >= 1.5) return 'very_formal';
    if (avgScore >= 0.5) return 'formal';
    if (avgScore <= -1.5) return 'very_informal';
    if (avgScore <= -0.5) return 'informal';
    return 'neutral';
  }

  /**
   * Calculate politeness score
   */
  private calculatePolitenessScore(text: string): number {
    let totalScore = 0;
    let markerCount = 0;

    this.politenessMarkers.forEach((score, marker) => {
      if (text.includes(marker)) {
        totalScore += score;
        markerCount++;
      }
    });

    // Base politeness from formality markers
    this.formalityMarkers.forEach((score, marker) => {
      if (text.includes(marker) && score > 0) {
        totalScore += score * 0.5; // Weight formal markers for politeness
        markerCount++;
      }
    });

    // Normalize to 0-1 scale
    const avgScore = markerCount > 0 ? totalScore / markerCount : 0;
    return Math.max(0, Math.min(1, (avgScore + 2) / 4)); // Convert -2 to 2 range to 0-1
  }

  /**
   * Determine social distance
   */
  private determineSocialDistance(text: string): CulturalContext['socialDistance'] {
    // Check for close relationship indicators
    const closeIndicators = ['kamu', 'lu', 'gue', 'aku', 'dong', 'sih', 'nih'];
    const distantIndicators = ['anda', 'bapak', 'ibu', 'beliau', 'yang terhormat'];

    const closeCount = closeIndicators.filter(indicator => text.includes(indicator)).length;
    const distantCount = distantIndicators.filter(indicator => text.includes(indicator)).length;

    if (distantCount > closeCount) return 'distant';
    if (closeCount > distantCount) return 'close';
    return 'neutral';
  }

  /**
   * Extract cultural markers
   */
  private extractCulturalMarkers(text: string): CulturalContext['culturalMarkers'] {
    const respectTerms: string[] = [];
    const hierarchyIndicators: string[] = [];
    const regionalMarkers: string[] = [];
    const generationalMarkers: string[] = [];

    // Find respect terms
    const respectWords = ['mohon', 'silakan', 'terima kasih', 'maaf', 'permisi'];
    respectWords.forEach(word => {
      if (text.includes(word)) respectTerms.push(word);
    });

    // Find hierarchy indicators
    this.hierarchyTerms.forEach(term => {
      if (text.includes(term)) hierarchyIndicators.push(term);
    });

    // Find regional markers
    this.regionalMarkers.forEach((region, marker) => {
      if (text.includes(marker)) regionalMarkers.push(`${marker} (${region})`);
    });

    // Find generational markers
    const genMarkers = ['boomer', 'milenial', 'gen z', 'zaman now', 'jaman dulu'];
    genMarkers.forEach(marker => {
      if (text.includes(marker)) generationalMarkers.push(marker);
    });

    return {
      respectTerms,
      hierarchyIndicators,
      regionalMarkers,
      generationalMarkers
    };
  }

  /**
   * Analyze communication style
   */
  private analyzeCommunicationStyle(text: string): CulturalContext['communicationStyle'] {
    // Analyze directness
    const directIndicators = ['harus', 'wajib', 'segera', 'langsung', 'jelas'];
    const indirectIndicators = ['mungkin', 'barangkali', 'sepertinya', 'kira-kira', 'agak'];
    
    const directCount = directIndicators.filter(indicator => text.includes(indicator)).length;
    const indirectCount = indirectIndicators.filter(indicator => text.includes(indicator)).length;
    
    const directness = directCount > indirectCount ? 
      Math.min(1, directCount / 3) : 
      Math.max(0, 0.5 - indirectCount / 6);

    // Analyze emotional expression
    const emotionalIndicators = ['!', '?', 'banget', 'sekali', 'sangat', 'wow', 'wah'];
    const emotionalCount = emotionalIndicators.filter(indicator => text.includes(indicator)).length;
    const emotionalExpression = Math.min(1, emotionalCount / 3);

    // Analyze urgency
    const urgencyIndicators = ['segera', 'cepat', 'urgent', 'penting', 'darurat', 'asap'];
    const urgencyCount = urgencyIndicators.filter(indicator => text.includes(indicator)).length;
    const urgency = Math.min(1, urgencyCount / 2);

    return {
      directness,
      emotionalExpression,
      urgency
    };
  }

  /**
   * Extract contextual meaning
   */
  private extractContextualMeaning(text: string): CulturalContext['contextualMeaning'] {
    // Detect implicit requests
    const implicitRequests: string[] = [];
    if (text.includes('bisa') && text.includes('?')) {
      implicitRequests.push('polite_request');
    }
    if (text.includes('gimana kalau')) {
      implicitRequests.push('suggestion');
    }
    if (text.includes('mungkin')) {
      implicitRequests.push('tentative_request');
    }

    // Detect cultural references
    const culturalReferences: string[] = [];
    if (text.includes('gotong royong')) culturalReferences.push('community_cooperation');
    if (text.includes('bapakisme')) culturalReferences.push('paternalistic_culture');
    if (text.includes('adat')) culturalReferences.push('traditional_customs');
    if (text.includes('pancasila')) culturalReferences.push('national_ideology');

    // Detect business context
    const businessContext = Array.from(this.businessTerms).some(term => text.includes(term));

    // Detect government context
    const governmentContext = Array.from(this.governmentTerms).some(term => text.includes(term));

    return {
      implicitRequests,
      culturalReferences,
      businessContext,
      governmentContext
    };
  }

  /**
   * Generate response adaptation recommendations
   */
  generateResponseAdaptation(context: CulturalContext): ResponseAdaptation {
    let recommendedTone: ResponseAdaptation['recommendedTone'];
    const suggestedPhrases: string[] = [];
    const culturalConsiderations: string[] = [];
    const communicationTips: string[] = [];

    // Determine recommended tone
    if (context.formalityLevel === 'very_formal' || context.formalityLevel === 'formal') {
      recommendedTone = 'formal';
      suggestedPhrases.push('Terima kasih atas pertanyaan Anda');
      suggestedPhrases.push('Dengan senang hati saya akan membantu');
      suggestedPhrases.push('Mohon maaf jika ada ketidaknyamanan');
    } else if (context.formalityLevel === 'very_informal' || context.formalityLevel === 'informal') {
      recommendedTone = 'casual';
      suggestedPhrases.push('Oke, siap bantu!');
      suggestedPhrases.push('Gampang kok');
      suggestedPhrases.push('Ada yang bisa dibantu lagi?');
    } else if (context.contextualMeaning.businessContext) {
      recommendedTone = 'professional';
      suggestedPhrases.push('Berdasarkan data yang tersedia');
      suggestedPhrases.push('Untuk informasi lebih lanjut');
      suggestedPhrases.push('Semoga informasi ini membantu');
    } else {
      recommendedTone = 'friendly';
      suggestedPhrases.push('Baik, saya akan bantu');
      suggestedPhrases.push('Semoga bermanfaat');
      suggestedPhrases.push('Jangan ragu untuk bertanya lagi');
    }

    // Add cultural considerations
    if (context.socialDistance === 'distant') {
      culturalConsiderations.push('Maintain formal distance and respect');
      culturalConsiderations.push('Use appropriate honorifics');
    }

    if (context.culturalMarkers.hierarchyIndicators.length > 0) {
      culturalConsiderations.push('Acknowledge hierarchical relationship');
      culturalConsiderations.push('Show appropriate deference');
    }

    if (context.contextualMeaning.governmentContext) {
      culturalConsiderations.push('Use official terminology');
      culturalConsiderations.push('Maintain professional government service tone');
    }

    // Add communication tips
    if (context.communicationStyle.directness < 0.3) {
      communicationTips.push('Use indirect communication style');
      communicationTips.push('Provide context and explanation');
    }

    if (context.communicationStyle.urgency > 0.7) {
      communicationTips.push('Prioritize quick, clear responses');
      communicationTips.push('Acknowledge the urgency');
    }

    if (context.politenessScore > 0.7) {
      communicationTips.push('Match the high level of politeness');
      communicationTips.push('Use respectful language throughout');
    }

    return {
      recommendedTone,
      suggestedPhrases,
      culturalConsiderations,
      communicationTips
    };
  }

  /**
   * Check if text requires cultural sensitivity
   */
  requiresCulturalSensitivity(text: string): boolean {
    const context = this.analyzeCulturalContext(text);
    
    return (
      context.formalityLevel === 'very_formal' ||
      context.socialDistance === 'distant' ||
      context.culturalMarkers.hierarchyIndicators.length > 0 ||
      context.contextualMeaning.governmentContext ||
      context.politenessScore > 0.8
    );
  }

  /**
   * Get cultural processor statistics
   */
  getStatistics(): {
    formalityMarkersCount: number;
    politenessMarkersCount: number;
    hierarchyTermsCount: number;
    regionalMarkersCount: number;
    businessTermsCount: number;
    governmentTermsCount: number;
  } {
    return {
      formalityMarkersCount: this.formalityMarkers.size,
      politenessMarkersCount: this.politenessMarkers.size,
      hierarchyTermsCount: this.hierarchyTerms.size,
      regionalMarkersCount: this.regionalMarkers.size,
      businessTermsCount: this.businessTerms.size,
      governmentTermsCount: this.governmentTerms.size
    };
  }
}

// Export singleton instance
export const culturalProcessor = new CulturalProcessor();
