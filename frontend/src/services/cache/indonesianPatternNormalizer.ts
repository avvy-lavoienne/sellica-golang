/**
 * Indonesian Pattern Normalizer for Document Pattern Caching
 * Phase 2 Implementation: Advanced Indonesian language normalization
 * Handles regional variations, informal language, and administrative terminology
 */

export interface NormalizationResult {
  normalized: string;
  confidence: number;
  transformations: string[];
  detectedVariant: 'formal' | 'informal' | 'regional' | 'mixed';
  originalLength: number;
  normalizedLength: number;
}

export interface RegionalVariation {
  region: string;
  patterns: Map<string, string>;
  commonPhrases: string[];
}

export class IndonesianPatternNormalizer {
  private formalTerms: Map<string, string> = new Map();
  private informalTerms: Map<string, string> = new Map();
  private regionalVariations: Map<string, RegionalVariation> = new Map();
  private administrativeTerms: Map<string, string> = new Map();
  private commonMisspellings: Map<string, string> = new Map();
  private static instance: IndonesianPatternNormalizer;

  constructor() {
    this.initializeFormalTerms();
    this.initializeInformalTerms();
    this.initializeRegionalVariations();
    this.initializeAdministrativeTerms();
    this.initializeCommonMisspellings();
    
    console.log('✅ [INDONESIAN_NORMALIZER] Indonesian pattern normalizer initialized');
  }

  public static getInstance(): IndonesianPatternNormalizer {
    if (!IndonesianPatternNormalizer.instance) {
      IndonesianPatternNormalizer.instance = new IndonesianPatternNormalizer();
    }
    return IndonesianPatternNormalizer.instance;
  }

  /**
   * Normalize Indonesian query with comprehensive transformations
   */
  async normalize(query: string): Promise<NormalizationResult> {
    const startTime = performance.now();
    const originalLength = query.length;
    const transformations: string[] = [];
    let normalized = query.toLowerCase().trim();
    let confidence = 1.0;

    try {
      // Step 1: Basic cleaning
      normalized = this.basicCleaning(normalized);
      if (normalized !== query.toLowerCase().trim()) {
        transformations.push('basic_cleaning');
      }

      // Step 2: Fix common misspellings
      const spellingResult = this.fixCommonMisspellings(normalized);
      normalized = spellingResult.text;
      confidence *= spellingResult.confidence;
      if (spellingResult.changed) {
        transformations.push('spelling_correction');
      }

      // Step 3: Normalize informal terms
      const informalResult = this.normalizeInformalTerms(normalized);
      normalized = informalResult.text;
      confidence *= informalResult.confidence;
      if (informalResult.changed) {
        transformations.push('informal_normalization');
      }

      // Step 4: Handle regional variations
      const regionalResult = this.normalizeRegionalVariations(normalized);
      normalized = regionalResult.text;
      confidence *= regionalResult.confidence;
      if (regionalResult.changed) {
        transformations.push('regional_normalization');
      }

      // Step 5: Normalize administrative terms
      const adminResult = this.normalizeAdministrativeTerms(normalized);
      normalized = adminResult.text;
      confidence *= adminResult.confidence;
      if (adminResult.changed) {
        transformations.push('administrative_normalization');
      }

      // Step 6: Final standardization
      normalized = this.finalStandardization(normalized);
      transformations.push('final_standardization');

      // Detect language variant
      const detectedVariant = this.detectLanguageVariant(query);

      const processingTime = performance.now() - startTime;
      
      if (processingTime > 10) { // Log slow normalizations
        console.log(`⚠️ [INDONESIAN_NORMALIZER] Slow normalization: ${processingTime.toFixed(2)}ms for "${query}"`);
      }

      return {
        normalized,
        confidence,
        transformations,
        detectedVariant,
        originalLength,
        normalizedLength: normalized.length
      };

    } catch (error) {
      console.error('❌ [INDONESIAN_NORMALIZER] Normalization error:', error);
      return {
        normalized: query.toLowerCase().trim(),
        confidence: 0.5,
        transformations: ['error_fallback'],
        detectedVariant: 'mixed',
        originalLength,
        normalizedLength: query.length
      };
    }
  }

  /**
   * Basic text cleaning
   */
  private basicCleaning(text: string): string {
    return text
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Fix common Indonesian misspellings
   */
  private fixCommonMisspellings(text: string): { text: string; confidence: number; changed: boolean } {
    let result = text;
    let changed = false;
    let confidence = 1.0;

    for (const [misspelling, correction] of this.commonMisspellings.entries()) {
      const regex = new RegExp(`\\b${misspelling}\\b`, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, correction);
        changed = true;
        confidence *= 0.95; // Slight confidence reduction for corrections
      }
    }

    return { text: result, confidence, changed };
  }

  /**
   * Normalize informal Indonesian terms
   */
  private normalizeInformalTerms(text: string): { text: string; confidence: number; changed: boolean } {
    let result = text;
    let changed = false;
    let confidence = 1.0;

    for (const [informal, formal] of this.informalTerms.entries()) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, formal);
        changed = true;
        confidence *= 0.9; // Confidence reduction for informal language
      }
    }

    return { text: result, confidence, changed };
  }

  /**
   * Normalize regional variations
   */
  private normalizeRegionalVariations(text: string): { text: string; confidence: number; changed: boolean } {
    let result = text;
    let changed = false;
    let confidence = 1.0;

    // Check each regional variation
    for (const [region, variation] of this.regionalVariations.entries()) {
      for (const [regional, standard] of variation.patterns.entries()) {
        const regex = new RegExp(`\\b${regional}\\b`, 'gi');
        if (regex.test(result)) {
          result = result.replace(regex, standard);
          changed = true;
          confidence *= 0.92; // Slight confidence reduction for regional variations
        }
      }
    }

    return { text: result, confidence, changed };
  }

  /**
   * Normalize administrative terms
   */
  private normalizeAdministrativeTerms(text: string): { text: string; confidence: number; changed: boolean } {
    let result = text;
    let changed = false;
    let confidence = 1.0;

    for (const [term, normalized] of this.administrativeTerms.entries()) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, normalized);
        changed = true;
        // No confidence reduction for administrative term normalization
      }
    }

    return { text: result, confidence, changed };
  }

  /**
   * Final standardization
   */
  private finalStandardization(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Final whitespace normalization
      .trim();
  }

  /**
   * Detect language variant
   */
  private detectLanguageVariant(text: string): 'formal' | 'informal' | 'regional' | 'mixed' {
    const lowerText = text.toLowerCase();
    let formalScore = 0;
    let informalScore = 0;
    let regionalScore = 0;

    // Check for formal terms
    for (const formal of this.formalTerms.keys()) {
      if (lowerText.includes(formal)) formalScore++;
    }

    // Check for informal terms
    for (const informal of this.informalTerms.keys()) {
      if (lowerText.includes(informal)) informalScore++;
    }

    // Check for regional terms
    for (const variation of this.regionalVariations.values()) {
      for (const regional of variation.patterns.keys()) {
        if (lowerText.includes(regional)) regionalScore++;
      }
    }

    const total = formalScore + informalScore + regionalScore;
    if (total === 0) return 'formal'; // Default to formal

    if (formalScore > informalScore && formalScore > regionalScore) return 'formal';
    if (informalScore > formalScore && informalScore > regionalScore) return 'informal';
    if (regionalScore > formalScore && regionalScore > informalScore) return 'regional';
    
    return 'mixed';
  }

  /**
   * Initialize formal terms mapping
   */
  private initializeFormalTerms(): void {
    const formalTerms = [
      'persyaratan', 'dokumen', 'keterangan', 'permohonan', 'pengajuan',
      'pengurusan', 'administrasi', 'pelayanan', 'prosedur', 'ketentuan'
    ];

    formalTerms.forEach(term => {
      this.formalTerms.set(term, term);
    });
  }

  /**
   * Initialize informal terms mapping
   */
  private initializeInformalTerms(): void {
    this.informalTerms.set('gimana', 'bagaimana');
    this.informalTerms.set('gimane', 'bagaimana');
    this.informalTerms.set('bikin', 'membuat');
    this.informalTerms.set('ngurus', 'mengurus');
    this.informalTerms.set('mau', 'ingin');
    this.informalTerms.set('pengen', 'ingin');
    this.informalTerms.set('butuh', 'membutuhkan');
    this.informalTerms.set('perlu', 'memerlukan');
    this.informalTerms.set('bisa', 'dapat');
    this.informalTerms.set('gak', 'tidak');
    this.informalTerms.set('ga', 'tidak');
    this.informalTerms.set('nggak', 'tidak');
    this.informalTerms.set('udah', 'sudah');
    this.informalTerms.set('belom', 'belum');
    this.informalTerms.set('belum', 'belum');
    this.informalTerms.set('aja', 'saja');
    this.informalTerms.set('doang', 'saja');
    this.informalTerms.set('banget', 'sangat');
  }

  /**
   * Initialize regional variations
   */
  private initializeRegionalVariations(): void {
    // Sundanese variations (common in West Java/Garut)
    const sundaneseVariation: RegionalVariation = {
      region: 'sundanese',
      patterns: new Map([
        ['kumaha', 'bagaimana'],
        ['naon', 'apa'],
        ['dimana', 'di mana'],
        ['iraha', 'kapan'],
        ['saha', 'siapa']
      ]),
      commonPhrases: ['kumaha cara', 'naon wae', 'dimana tempat']
    };

    this.regionalVariations.set('sundanese', sundaneseVariation);

    // Jakarta slang variations
    const jakartaVariation: RegionalVariation = {
      region: 'jakarta',
      patterns: new Map([
        ['ape', 'apa'],
        ['kenape', 'kenapa'],
        ['dimane', 'di mana'],
        ['kapan', 'kapan'],
        ['siape', 'siapa']
      ]),
      commonPhrases: ['ape aja', 'gimane cara', 'dimane tempat']
    };

    this.regionalVariations.set('jakarta', jakartaVariation);
  }

  /**
   * Initialize administrative terms
   */
  private initializeAdministrativeTerms(): void {
    // Document type abbreviations
    this.administrativeTerms.set('ktp', 'kartu tanda penduduk');
    this.administrativeTerms.set('kk', 'kartu keluarga');
    this.administrativeTerms.set('kia', 'kartu identitas anak');
    this.administrativeTerms.set('akte', 'akta');
    this.administrativeTerms.set('surat ket', 'surat keterangan');
    this.administrativeTerms.set('disdukcapil', 'dinas kependudukan dan pencatatan sipil');
    this.administrativeTerms.set('dukcapil', 'kependudukan dan pencatatan sipil');
    this.administrativeTerms.set('capil', 'pencatatan sipil');
  }

  /**
   * Initialize common misspellings
   */
  private initializeCommonMisspellings(): void {
    this.commonMisspellings.set('akte', 'akta');
    this.commonMisspellings.set('sertifikat', 'sertifikat');
    this.commonMisspellings.set('persyaratan', 'persyaratan');
    this.commonMisspellings.set('keterangan', 'keterangan');
    this.commonMisspellings.set('perkawinan', 'perkawinan');
    this.commonMisspellings.set('kelahiran', 'kelahiran');
    this.commonMisspellings.set('kematian', 'kematian');
    this.commonMisspellings.set('perceraian', 'perceraian');
    this.commonMisspellings.set('pengangkatan', 'pengangkatan');
    this.commonMisspellings.set('pengakuan', 'pengakuan');
    this.commonMisspellings.set('pengesahan', 'pengesahan');
    this.commonMisspellings.set('kewarganegaraan', 'kewarganegaraan');
  }

  /**
   * Get normalization statistics
   */
  getStatistics(): {
    formalTermsCount: number;
    informalTermsCount: number;
    regionalVariationsCount: number;
    administrativeTermsCount: number;
    misspellingsCount: number;
  } {
    return {
      formalTermsCount: this.formalTerms.size,
      informalTermsCount: this.informalTerms.size,
      regionalVariationsCount: Array.from(this.regionalVariations.values())
        .reduce((total, variation) => total + variation.patterns.size, 0),
      administrativeTermsCount: this.administrativeTerms.size,
      misspellingsCount: this.commonMisspellings.size
    };
  }
}
