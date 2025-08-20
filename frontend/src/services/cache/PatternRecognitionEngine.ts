/**
 * Pattern Recognition Engine
 * Phase 3: Enhanced Cache Warming Strategy
 * 
 * Implements intelligent pattern recognition for Indonesian administrative queries
 * with priority-based classification and frequency analysis.
 */

import { EnhancedSingletonBase } from '../core/EnhancedSingletonBase';

export interface QueryPattern {
  id: string;
  pattern: string;
  regex: RegExp;
  priority: 'high' | 'medium' | 'low';
  category: 'document' | 'procedure' | 'requirement' | 'status' | 'general';
  serviceType: string;
  frequency: number;
  averageResponseTime: number;
  confidence: number;
  keywords: string[];
  variations: string[];
  lastUpdated: Date;
}

export interface PatternAnalysis {
  matchedPatterns: QueryPattern[];
  primaryPattern: QueryPattern | null;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestedCacheKey: string;
  processingTime: number;
}

export interface PatternStatistics {
  totalPatterns: number;
  highPriorityPatterns: number;
  mediumPriorityPatterns: number;
  lowPriorityPatterns: number;
  averageConfidence: number;
  mostFrequentPatterns: QueryPattern[];
  recentlyUpdatedPatterns: QueryPattern[];
}

export class PatternRecognitionEngine {
  private patterns = new Map<string, QueryPattern>();
  private categoryWeights = new Map<string, number>();
  private keywordIndex = new Map<string, Set<string>>(); // keyword -> pattern IDs

  // Indonesian administrative patterns
  private readonly ADMINISTRATIVE_PATTERNS = [
    // High Priority - Common document requests
    {
      pattern: 'cara (membuat|mengurus|mendapatkan) (ktp|kartu tanda penduduk)',
      category: 'document',
      serviceType: 'ktp',
      priority: 'high' as const,
      keywords: ['cara', 'membuat', 'mengurus', 'ktp', 'kartu', 'tanda', 'penduduk']
    },
    {
      pattern: '(syarat|persyaratan|dokumen) (pembuatan|pengurusan) (akta|akte) (kelahiran|lahir)',
      category: 'requirement',
      serviceType: 'akta_kelahiran',
      priority: 'high' as const,
      keywords: ['syarat', 'persyaratan', 'dokumen', 'akta', 'kelahiran', 'lahir']
    },
    {
      pattern: '(prosedur|cara|langkah) (pernikahan|menikah|nikah)',
      category: 'procedure',
      serviceType: 'pernikahan',
      priority: 'high' as const,
      keywords: ['prosedur', 'cara', 'langkah', 'pernikahan', 'menikah', 'nikah']
    },

    // Medium Priority - Status and information
    {
      pattern: '(status|cek|periksa) (pengajuan|permohonan|aplikasi)',
      category: 'status',
      serviceType: 'status_check',
      priority: 'medium' as const,
      keywords: ['status', 'cek', 'periksa', 'pengajuan', 'permohonan', 'aplikasi']
    },
    {
      pattern: '(jam|waktu) (operasional|buka|tutup|kerja) (kantor|dinas)',
      category: 'general',
      serviceType: 'information',
      priority: 'medium' as const,
      keywords: ['jam', 'waktu', 'operasional', 'buka', 'tutup', 'kantor', 'dinas']
    },
    {
      pattern: '(biaya|tarif|ongkos) (administrasi|admin|pengurusan)',
      category: 'general',
      serviceType: 'information',
      priority: 'medium' as const,
      keywords: ['biaya', 'tarif', 'ongkos', 'administrasi', 'admin', 'pengurusan']
    },

    // Low Priority - General inquiries
    {
      pattern: '(lokasi|alamat|tempat) (kantor|dinas)',
      category: 'general',
      serviceType: 'information',
      priority: 'low' as const,
      keywords: ['lokasi', 'alamat', 'tempat', 'kantor', 'dinas']
    },
    {
      pattern: '(kontak|telepon|nomor) (kantor|dinas)',
      category: 'general',
      serviceType: 'information',
      priority: 'low' as const,
      keywords: ['kontak', 'telepon', 'nomor', 'kantor', 'dinas']
    }
  ];

  private static instance: PatternRecognitionEngine;
  private initialized = false;

  private constructor() {
    this.initializeCategoryWeights();
  }

  public static getInstance(): PatternRecognitionEngine {
    if (!PatternRecognitionEngine.instance) {
      PatternRecognitionEngine.instance = new PatternRecognitionEngine();
    }
    return PatternRecognitionEngine.instance;
  }

  public static async getInstanceAsync(): Promise<PatternRecognitionEngine> {
    const instance = PatternRecognitionEngine.getInstance();

    if (!instance.initialized) {
      await instance.initialize();
      instance.initialized = true;
    }

    return instance;
  }

  /**
   * Initialize pattern recognition engine
   */
  protected async initialize(): Promise<void> {
    try {
      console.log('🧠 [PATTERN_ENGINE] Initializing pattern recognition engine...');

      // Load administrative patterns
      await this.loadAdministrativePatterns();
      
      // Build keyword index
      this.buildKeywordIndex();
      
      console.log(`✅ [PATTERN_ENGINE] Loaded ${this.patterns.size} patterns with intelligent recognition`);
    } catch (error) {
      console.error('❌ [PATTERN_ENGINE] Failed to initialize pattern recognition engine:', error);
      throw error;
    }
  }

  /**
   * Analyze query and identify matching patterns
   */
  public async analyzeQuery(query: string): Promise<PatternAnalysis> {
    const startTime = performance.now();

    try {
      const normalizedQuery = this.normalizeQuery(query);
      const matchedPatterns: QueryPattern[] = [];
      
      // Find matching patterns
      for (const pattern of this.patterns.values()) {
        const match = pattern.regex.test(normalizedQuery);
        if (match) {
          // Calculate confidence based on keyword overlap
          const confidence = this.calculateConfidence(normalizedQuery, pattern);
          if (confidence > 0.3) { // Minimum confidence threshold
            matchedPatterns.push({ ...pattern, confidence });
          }
        }
      }

      // Sort by confidence and priority
      matchedPatterns.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const scoreA = a.confidence * priorityWeight[a.priority];
        const scoreB = b.confidence * priorityWeight[b.priority];
        return scoreB - scoreA;
      });

      const primaryPattern = matchedPatterns[0] || null;
      const overallConfidence = primaryPattern ? primaryPattern.confidence : 0;
      const priority = this.determinePriority(matchedPatterns);
      const category = primaryPattern ? primaryPattern.category : 'general';
      const suggestedCacheKey = this.generateCacheKey(query, primaryPattern);

      const analysis: PatternAnalysis = {
        matchedPatterns,
        primaryPattern,
        confidence: overallConfidence,
        priority,
        category,
        suggestedCacheKey,
        processingTime: performance.now() - startTime
      };

      // Update pattern statistics
      if (primaryPattern) {
        this.updatePatternStatistics(primaryPattern.id, analysis.processingTime);
      }

      console.log(`🧠 [PATTERN_ENGINE] Analyzed query: "${query.slice(0, 50)}..." (${matchedPatterns.length} matches, ${overallConfidence.toFixed(2)} confidence)`);

      return analysis;
    } catch (error) {
      console.error('❌ [PATTERN_ENGINE] Error analyzing query:', error);
      
      return {
        matchedPatterns: [],
        primaryPattern: null,
        confidence: 0,
        priority: 'low',
        category: 'general',
        suggestedCacheKey: this.generateCacheKey(query, null),
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Get patterns by priority
   */
  public getPatternsByPriority(priority: 'high' | 'medium' | 'low'): QueryPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.priority === priority)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get pattern statistics
   */
  public getStatistics(): PatternStatistics {
    const patterns = Array.from(this.patterns.values());
    
    return {
      totalPatterns: patterns.length,
      highPriorityPatterns: patterns.filter(p => p.priority === 'high').length,
      mediumPriorityPatterns: patterns.filter(p => p.priority === 'medium').length,
      lowPriorityPatterns: patterns.filter(p => p.priority === 'low').length,
      averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
      mostFrequentPatterns: patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      recentlyUpdatedPatterns: patterns
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, 5)
    };
  }

  /**
   * Add or update a pattern
   */
  public addPattern(patternData: Omit<QueryPattern, 'id' | 'regex' | 'lastUpdated'>): string {
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const regex = new RegExp(patternData.pattern, 'i');
    
    const pattern: QueryPattern = {
      ...patternData,
      id,
      regex,
      lastUpdated: new Date()
    };

    this.patterns.set(id, pattern);
    this.updateKeywordIndex(pattern);
    
    console.log(`📝 [PATTERN_ENGINE] Added pattern: ${pattern.pattern} (priority: ${pattern.priority})`);
    
    return id;
  }

  /**
   * Enhanced singleton health check implementation
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      // Test pattern recognition with a simple query
      const testQuery = 'cara membuat ktp';
      const analysis = await this.analyzeQuery(testQuery);
      
      return analysis.matchedPatterns.length > 0 && analysis.confidence > 0;
    } catch (error) {
      console.error('❌ [PATTERN_ENGINE] Health check failed:', error);
      return false;
    }
  }

  /**
   * Enhanced singleton shutdown implementation
   */
  protected async performShutdown(): Promise<void> {
    try {
      console.log('🔄 [PATTERN_ENGINE] Shutting down pattern recognition engine...');
      
      this.patterns.clear();
      this.keywordIndex.clear();
      this.categoryWeights.clear();
      
      console.log('✅ [PATTERN_ENGINE] Shutdown completed');
    } catch (error) {
      console.error('❌ [PATTERN_ENGINE] Error during shutdown:', error);
      throw error;
    }
  }

  // Private helper methods

  private initializeCategoryWeights(): void {
    this.categoryWeights.set('document', 3);
    this.categoryWeights.set('procedure', 3);
    this.categoryWeights.set('requirement', 2.5);
    this.categoryWeights.set('status', 2);
    this.categoryWeights.set('general', 1);
  }

  private async loadAdministrativePatterns(): Promise<void> {
    for (const patternData of this.ADMINISTRATIVE_PATTERNS) {
      this.addPattern({
        pattern: patternData.pattern,
        priority: patternData.priority,
        category: patternData.category as any,
        serviceType: patternData.serviceType,
        frequency: 0,
        averageResponseTime: 0,
        confidence: 0.8,
        keywords: patternData.keywords,
        variations: []
      });
    }
  }

  private buildKeywordIndex(): void {
    for (const pattern of this.patterns.values()) {
      this.updateKeywordIndex(pattern);
    }
  }

  private updateKeywordIndex(pattern: QueryPattern): void {
    for (const keyword of pattern.keywords) {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(pattern.id);
    }
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateConfidence(query: string, pattern: QueryPattern): number {
    const queryWords = query.split(' ');
    const matchedKeywords = pattern.keywords.filter(keyword => 
      queryWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    
    const keywordScore = matchedKeywords.length / pattern.keywords.length;
    const categoryWeight = this.categoryWeights.get(pattern.category) || 1;
    const priorityWeight = { high: 1.2, medium: 1.0, low: 0.8 }[pattern.priority];
    
    return Math.min(keywordScore * categoryWeight * priorityWeight, 1.0);
  }

  private determinePriority(patterns: QueryPattern[]): 'high' | 'medium' | 'low' {
    if (patterns.length === 0) return 'low';
    
    const highPriorityCount = patterns.filter(p => p.priority === 'high').length;
    const mediumPriorityCount = patterns.filter(p => p.priority === 'medium').length;
    
    if (highPriorityCount > 0) return 'high';
    if (mediumPriorityCount > 0) return 'medium';
    return 'low';
  }

  private generateCacheKey(query: string, pattern: QueryPattern | null): string {
    const normalizedQuery = this.normalizeQuery(query);
    const patternId = pattern ? pattern.id : 'unknown';
    const hash = this.simpleHash(normalizedQuery);
    
    return `pattern_${patternId}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private updatePatternStatistics(patternId: string, processingTime: number): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      pattern.frequency++;
      pattern.averageResponseTime = (pattern.averageResponseTime + processingTime) / 2;
      pattern.lastUpdated = new Date();
    }
  }
}
