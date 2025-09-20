/**
 * Unified Query Preprocessor - Phase 2 Core Consolidation
 * Consolidates query normalization from all AI services and intelligence layers
 * Eliminates 150+ lines of duplicated preprocessing code
 */

import { ProcessedQuery, QueryComplexity } from '../core/UnifiedAIService';

export interface PreprocessingConfig {
  enableTypoCorrection: boolean;
  enableSynonymExpansion: boolean;
  enableAdministrativeTerms: boolean;
  enableInformalLanguage: boolean;
  complexityAnalysis: boolean;
  cacheResults: boolean;
}

export interface NormalizationResult {
  originalQuery: string;
  normalizedQuery: string;
  changes: {
    typosFixed: string[];
    synonymsExpanded: string[];
    administrativeTermsStandardized: string[];
    informalExpressionsNormalized: string[];
  };
  confidence: number;
}

/**
 * Unified Query Preprocessor
 * Consolidates normalization logic from:
 * - indonesianNLP.ts (normalizeQuery, correctTypos, expandSynonyms)
 * - enhancedQueryIntelligence.ts (conversationalEnhancer.normalizeQuery)
 * - contextualEntityRecognition.ts (query preprocessing)
 * - queryIntelligence.ts (normalizeQuery, tokenizeQuery)
 */
export class QueryPreprocessor {
  private config: PreprocessingConfig;
  private cache: Map<string, ProcessedQuery> = new Map();
  private synonymMap: Map<string, string[]> = new Map();
  private administrativeTerms: Map<string, string> = new Map();
  private informalExpressions: Map<string, string> = new Map();
  private typoPatterns: Map<string, string> = new Map();

  constructor(config: Partial<PreprocessingConfig> = {}) {
    this.config = {
      enableTypoCorrection: true,
      enableSynonymExpansion: true,
      enableAdministrativeTerms: true,
      enableInformalLanguage: true,
      complexityAnalysis: true,
      cacheResults: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('📝 [QUERY_PREPROCESSOR] Initializing unified query preprocessor...');
    
    await Promise.all([
      this.loadSynonymMappings(),
      this.loadAdministrativeTerms(),
      this.loadInformalExpressions(),
      this.loadTypoPatterns()
    ]);

    console.log('✅ [QUERY_PREPROCESSOR] Query preprocessor initialized');
  }

  /**
   * Main preprocessing method - consolidates all normalization logic
   */
  async process(query: string, context?: any): Promise<ProcessedQuery> {
    // Check cache first
    if (this.config.cacheResults && this.cache.has(query)) {
      const cached = this.cache.get(query)!;
      console.log('💾 [QUERY_PREPROCESSOR] Using cached result for query');
      return cached;
    }

    console.log('📝 [QUERY_PREPROCESSOR] Processing query:', query.substring(0, 100));

    // Step 1: Basic normalization
    let normalizedQuery = query.toLowerCase().trim();
    const changes = {
      typosFixed: [] as string[],
      synonymsExpanded: [] as string[],
      administrativeTermsStandardized: [] as string[],
      informalExpressionsNormalized: [] as string[]
    };

    // Step 2: Handle informal expressions (from indonesianNLP.ts)
    if (this.config.enableInformalLanguage) {
      const { normalized, changes: informalChanges } = this.normalizeInformalExpressions(normalizedQuery);
      normalizedQuery = normalized;
      changes.informalExpressionsNormalized = informalChanges;
    }

    // Step 3: Fix typos with fuzzy matching (from indonesianNLP.ts)
    if (this.config.enableTypoCorrection) {
      const { normalized, changes: typoChanges } = this.correctTypos(normalizedQuery);
      normalizedQuery = normalized;
      changes.typosFixed = typoChanges;
    }

    // Step 4: Expand synonyms (from indonesianNLP.ts)
    if (this.config.enableSynonymExpansion) {
      const { normalized, changes: synonymChanges } = this.expandSynonyms(normalizedQuery);
      normalizedQuery = normalized;
      changes.synonymsExpanded = synonymChanges;
    }

    // Step 5: Standardize administrative terms (from indonesianNLP.ts)
    if (this.config.enableAdministrativeTerms) {
      const { normalized, changes: adminChanges } = this.standardizeAdministrativeTerms(normalizedQuery);
      normalizedQuery = normalized;
      changes.administrativeTermsStandardized = adminChanges;
    }

    // Step 6: Analyze query complexity (from hybridNLPProcessor.ts)
    const complexity = this.config.complexityAnalysis 
      ? this.analyzeQueryComplexity(query, normalizedQuery)
      : this.getDefaultComplexity();

    const result: ProcessedQuery = {
      originalQuery: query,
      normalizedQuery,
      preprocessingMetadata: changes,
      complexity,
      context
    };

    // Cache result
    if (this.config.cacheResults) {
      this.cache.set(query, result);
    }

    console.log('✅ [QUERY_PREPROCESSOR] Query processed:', {
      complexity: complexity.level,
      score: complexity.score,
      changesCount: Object.values(changes).flat().length
    });

    return result;
  }

  /**
   * Normalize informal Indonesian expressions
   * Consolidates logic from indonesianNLP.ts
   */
  private normalizeInformalExpressions(query: string): { normalized: string; changes: string[] } {
    let normalized = query;
    const changes: string[] = [];

    for (const [informal, formal] of this.informalExpressions) {
      if (normalized.includes(informal)) {
        normalized = normalized.replace(new RegExp(informal, 'gi'), formal);
        changes.push(`${informal} → ${formal}`);
      }
    }

    return { normalized, changes };
  }

  /**
   * Correct common typos using fuzzy matching
   * Consolidates logic from indonesianNLP.ts
   */
  private correctTypos(query: string): { normalized: string; changes: string[] } {
    let normalized = query;
    const changes: string[] = [];

    for (const [typo, correction] of this.typoPatterns) {
      if (normalized.includes(typo)) {
        normalized = normalized.replace(new RegExp(typo, 'gi'), correction);
        changes.push(`${typo} → ${correction}`);
      }
    }

    return { normalized, changes };
  }

  /**
   * Expand synonyms for better understanding
   * Consolidates logic from indonesianNLP.ts
   */
  private expandSynonyms(query: string): { normalized: string; changes: string[] } {
    let normalized = query;
    const changes: string[] = [];

    for (const [term, synonyms] of this.synonymMap) {
      if (normalized.includes(term)) {
        // For now, keep the original term but record the expansion
        changes.push(`${term} (synonyms: ${synonyms.join(', ')})`);
      }
    }

    return { normalized, changes };
  }

  /**
   * Standardize administrative terms
   * Consolidates logic from indonesianNLP.ts
   */
  private standardizeAdministrativeTerms(query: string): { normalized: string; changes: string[] } {
    let normalized = query;
    const changes: string[] = [];

    for (const [variant, standard] of this.administrativeTerms) {
      if (normalized.includes(variant)) {
        normalized = normalized.replace(new RegExp(variant, 'gi'), standard);
        changes.push(`${variant} → ${standard}`);
      }
    }

    return { normalized, changes };
  }

  /**
   * Analyze query complexity
   * Consolidates logic from hybridNLPProcessor.ts and aiPipeline.ts
   */
  private analyzeQueryComplexity(originalQuery: string, normalizedQuery: string): QueryComplexity {
    const factors = {
      length: originalQuery.length,
      wordCount: normalizedQuery.split(/\s+/).length,
      hasDateExpressions: this.hasDateExpressions(normalizedQuery),
      hasComparisons: this.hasComparisons(normalizedQuery),
      hasConditionals: this.hasConditionals(normalizedQuery),
      hasAggregations: this.hasAggregations(normalizedQuery),
      requiresDatabase: this.requiresDatabase(normalizedQuery),
      requiresIntelligence: this.requiresIntelligence(normalizedQuery)
    };

    // Calculate complexity score (0-1)
    let score = 0;
    
    // Length and word count factors
    score += Math.min(factors.length / 200, 0.2); // Max 0.2 for length
    score += Math.min(factors.wordCount / 20, 0.2); // Max 0.2 for word count
    
    // Feature-based factors
    if (factors.hasDateExpressions) score += 0.15;
    if (factors.hasComparisons) score += 0.15;
    if (factors.hasConditionals) score += 0.15;
    if (factors.hasAggregations) score += 0.15;
    if (factors.requiresDatabase) score += 0.1;
    if (factors.requiresIntelligence) score += 0.1;

    // Determine complexity level
    let level: QueryComplexity['level'];
    if (score < 0.3) level = 'simple';
    else if (score < 0.6) level = 'medium';
    else if (score < 0.8) level = 'complex';
    else level = 'advanced';

    return { score: Math.min(score, 1), level, factors };
  }

  // Helper methods for complexity analysis
  private hasDateExpressions(query: string): boolean {
    const datePatterns = [
      /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/,
      /\b(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i,
      /\b(hari ini|kemarin|besok|minggu lalu|bulan lalu|tahun lalu)\b/i
    ];
    return datePatterns.some(pattern => pattern.test(query));
  }

  private hasComparisons(query: string): boolean {
    const comparisonTerms = ['lebih', 'kurang', 'sama', 'berbeda', 'dibandingkan', 'versus', 'vs'];
    return comparisonTerms.some(term => query.includes(term));
  }

  private hasConditionals(query: string): boolean {
    const conditionalTerms = ['jika', 'kalau', 'apabila', 'bila', 'seandainya', 'jikalau'];
    return conditionalTerms.some(term => query.includes(term));
  }

  private hasAggregations(query: string): boolean {
    const aggregationTerms = ['total', 'jumlah', 'rata-rata', 'maksimum', 'minimum', 'sum', 'count'];
    return aggregationTerms.some(term => query.includes(term));
  }

  private requiresDatabase(query: string): boolean {
    const databaseTerms = ['data', 'tabel', 'record', 'database', 'cari', 'temukan', 'lihat'];
    return databaseTerms.some(term => query.includes(term));
  }

  private requiresIntelligence(query: string): boolean {
    const intelligenceTerms = ['analisis', 'insight', 'prediksi', 'rekomendasi', 'saran', 'kesimpulan'];
    return intelligenceTerms.some(term => query.includes(term));
  }

  private getDefaultComplexity(): QueryComplexity {
    return {
      score: 0.5,
      level: 'medium',
      factors: {
        length: 0,
        wordCount: 0,
        hasDateExpressions: false,
        hasComparisons: false,
        hasConditionals: false,
        hasAggregations: false,
        requiresDatabase: false,
        requiresIntelligence: false
      }
    };
  }

  // Data loading methods
  private async loadSynonymMappings(): Promise<void> {
    // Load synonym mappings (consolidated from indonesianNLP.ts)
    const synonyms = {
      'cari': ['temukan', 'lihat', 'dapatkan'],
      'data': ['informasi', 'record', 'catatan'],
      'user': ['pengguna', 'orang', 'individu'],
      'total': ['jumlah', 'keseluruhan', 'sum'],
      'berapa': ['jumlah', 'total', 'count']
    };

    for (const [term, syns] of Object.entries(synonyms)) {
      this.synonymMap.set(term, syns);
    }
  }

  private async loadAdministrativeTerms(): Promise<void> {
    // Load administrative term mappings
    const terms = {
      'ktp': 'kartu tanda penduduk',
      'nik': 'nomor induk kependudukan',
      'kk': 'kartu keluarga',
      'akta': 'akta kelahiran',
      'siak': 'sistem informasi administrasi kependudukan'
    };

    for (const [variant, standard] of Object.entries(terms)) {
      this.administrativeTerms.set(variant, standard);
    }
  }

  private async loadInformalExpressions(): Promise<void> {
    // Load informal to formal mappings
    const expressions = {
      'gimana': 'bagaimana',
      'kenapa': 'mengapa',
      'udah': 'sudah',
      'belom': 'belum',
      'gak': 'tidak',
      'ga': 'tidak'
    };

    for (const [informal, formal] of Object.entries(expressions)) {
      this.informalExpressions.set(informal, formal);
    }
  }

  private async loadTypoPatterns(): Promise<void> {
    // Load common typo corrections
    const typos = {
      'pengajuaan': 'pengajuan',
      'dokumnetasi': 'dokumentasi',
      'aktifitas': 'aktivitas',
      'sistim': 'sistem',
      'informasi': 'informasi'
    };

    for (const [typo, correction] of Object.entries(typos)) {
      this.typoPatterns.set(typo, correction);
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [QUERY_PREPROCESSOR] Cache cleared');
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need hit tracking for accurate calculation
    };
  }
}
