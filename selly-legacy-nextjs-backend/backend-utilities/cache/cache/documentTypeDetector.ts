/**
 * Document Type Detector with Confidence Scoring
 * Phase 2 Implementation: Advanced document type detection for Indonesian civil registration
 * Uses pattern matching, keyword analysis, and confidence scoring
 */

import { DocumentPattern } from './documentPatternCache';
import { IndonesianPatternNormalizer } from './indonesianPatternNormalizer';

export interface DocumentDetectionResult {
  documentType: string;
  documentId: string;
  confidence: number;
  matchedPatterns: string[];
  matchedKeywords: string[];
  matchStrength: number;
  category: 'kartu' | 'akta' | 'surat';
  priority: 'P0' | 'P1' | 'P2';
}

export interface DetectionConfig {
  minConfidence: number;
  keywordWeight: number;
  patternWeight: number;
  categoryBonus: number;
  priorityBonus: number;
}

export class DocumentTypeDetector {
  private normalizer: IndonesianPatternNormalizer;
  private documentPatterns: Map<string, DocumentPattern> = new Map();
  private config: DetectionConfig;
  private static instance: DocumentTypeDetector;

  constructor() {
    this.normalizer = IndonesianPatternNormalizer.getInstance();
    this.config = this.getDefaultConfig();
    this.initializeDocumentPatterns();
    
    console.log('✅ [DOCUMENT_DETECTOR] Document type detector initialized with confidence scoring');
  }

  public static getInstance(): DocumentTypeDetector {
    if (!DocumentTypeDetector.instance) {
      DocumentTypeDetector.instance = new DocumentTypeDetector();
    }
    return DocumentTypeDetector.instance;
  }

  /**
   * Detect document type with confidence scoring
   */
  async detectDocumentType(query: string): Promise<DocumentDetectionResult> {
    const startTime = performance.now();

    try {
      // Normalize the query
      const normalizationResult = await this.normalizer.normalize(query);
      const normalizedQuery = normalizationResult.normalized;

      // Get all potential matches
      const detectionResults: DocumentDetectionResult[] = [];

      for (const [documentId, pattern] of this.documentPatterns.entries()) {
        const result = await this.analyzePatternMatch(normalizedQuery, pattern, normalizationResult.confidence);
        if (result.confidence >= this.config.minConfidence) {
          detectionResults.push(result);
        }
      }

      // Sort by confidence and return best match
      detectionResults.sort((a, b) => b.confidence - a.confidence);

      const processingTime = performance.now() - startTime;
      
      if (detectionResults.length > 0) {
        const bestMatch = detectionResults[0];
        console.log(`🎯 [DOCUMENT_DETECTOR] Detected "${bestMatch.documentType}" with ${(bestMatch.confidence * 100).toFixed(1)}% confidence (${processingTime.toFixed(2)}ms)`);
        return bestMatch;
      } else {
        console.log(`❌ [DOCUMENT_DETECTOR] No document type detected for: "${query}" (${processingTime.toFixed(2)}ms)`);
        return this.createUnknownResult();
      }

    } catch (error) {
      console.error('❌ [DOCUMENT_DETECTOR] Detection error:', error);
      return this.createUnknownResult();
    }
  }

  /**
   * Analyze pattern match with confidence scoring
   */
  private async analyzePatternMatch(
    normalizedQuery: string, 
    pattern: DocumentPattern, 
    normalizationConfidence: number
  ): Promise<DocumentDetectionResult> {
    let confidence = 0;
    let matchStrength = 0;
    const matchedPatterns: string[] = [];
    const matchedKeywords: string[] = [];

    // 1. Pattern matching analysis
    const patternScore = this.calculatePatternScore(normalizedQuery, pattern, matchedPatterns);
    confidence += patternScore * this.config.patternWeight;
    matchStrength += patternScore;

    // 2. Keyword matching analysis
    const keywordScore = this.calculateKeywordScore(normalizedQuery, pattern, matchedKeywords);
    confidence += keywordScore * this.config.keywordWeight;
    matchStrength += keywordScore;

    // 3. Category bonus
    const categoryBonus = this.calculateCategoryBonus(normalizedQuery, pattern.category);
    confidence += categoryBonus * this.config.categoryBonus;

    // 4. Priority bonus
    const priorityBonus = this.calculatePriorityBonus(pattern.priority);
    confidence += priorityBonus * this.config.priorityBonus;

    // 5. Apply normalization confidence
    confidence *= normalizationConfidence;

    // 6. Apply pattern accuracy
    confidence *= (pattern.accuracy / 100);

    // Ensure confidence is between 0 and 1
    confidence = Math.min(1, Math.max(0, confidence));

    return {
      documentType: pattern.documentType,
      documentId: pattern.id,
      confidence,
      matchedPatterns,
      matchedKeywords,
      matchStrength,
      category: pattern.category,
      priority: pattern.priority
    };
  }

  /**
   * Calculate pattern matching score
   */
  private calculatePatternScore(query: string, pattern: DocumentPattern, matchedPatterns: string[]): number {
    let score = 0;
    let totalPatterns = 0;

    // Check main patterns
    for (const patternText of pattern.patterns) {
      totalPatterns++;
      if (this.fuzzyMatch(query, patternText)) {
        score += 1;
        matchedPatterns.push(patternText);
      }
    }

    // Check variations
    for (const variation of pattern.variations) {
      totalPatterns++;
      if (this.fuzzyMatch(query, variation)) {
        score += 0.8; // Slightly lower weight for variations
        matchedPatterns.push(variation);
      }
    }

    // Check informal variations
    for (const informal of pattern.informalVariations) {
      totalPatterns++;
      if (this.fuzzyMatch(query, informal)) {
        score += 0.6; // Lower weight for informal variations
        matchedPatterns.push(informal);
      }
    }

    return totalPatterns > 0 ? score / totalPatterns : 0;
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(query: string, pattern: DocumentPattern, matchedKeywords: string[]): number {
    let score = 0;
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const keyword of pattern.keywords) {
      if (queryWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    return pattern.keywords.length > 0 ? score / pattern.keywords.length : 0;
  }

  /**
   * Calculate category bonus
   */
  private calculateCategoryBonus(query: string, category: 'kartu' | 'akta' | 'surat'): number {
    const categoryKeywords = {
      kartu: ['kartu', 'ktp', 'kk', 'kia'],
      akta: ['akta', 'akte', 'surat'],
      surat: ['surat', 'keterangan', 'dokumen']
    };

    const keywords = categoryKeywords[category];
    const queryLower = query.toLowerCase();

    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        return 0.1; // Small bonus for category match
      }
    }

    return 0;
  }

  /**
   * Calculate priority bonus
   */
  private calculatePriorityBonus(priority: 'P0' | 'P1' | 'P2'): number {
    const priorityScores = {
      'P0': 0.1, // High priority documents get small bonus
      'P1': 0.05,
      'P2': 0.02
    };

    return priorityScores[priority];
  }

  /**
   * Fuzzy string matching
   */
  private fuzzyMatch(text: string, pattern: string, threshold: number = 0.7): boolean {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // Exact match
    if (textLower.includes(patternLower) || patternLower.includes(textLower)) {
      return true;
    }

    // Word-based matching
    const textWords = textLower.split(/\s+/);
    const patternWords = patternLower.split(/\s+/);

    let matchedWords = 0;
    for (const patternWord of patternWords) {
      if (textWords.some(textWord => 
        textWord.includes(patternWord) || 
        patternWord.includes(textWord) ||
        this.levenshteinSimilarity(textWord, patternWord) >= threshold
      )) {
        matchedWords++;
      }
    }

    return (matchedWords / patternWords.length) >= threshold;
  }

  /**
   * Calculate Levenshtein similarity
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Create unknown result
   */
  private createUnknownResult(): DocumentDetectionResult {
    return {
      documentType: 'unknown',
      documentId: 'unknown',
      confidence: 0,
      matchedPatterns: [],
      matchedKeywords: [],
      matchStrength: 0,
      category: 'surat',
      priority: 'P2'
    };
  }

  /**
   * Initialize document patterns (simplified version for detector)
   */
  private initializeDocumentPatterns(): void {
    // This would typically load from the DocumentPatternCache
    // For now, we'll create a simplified version
    const patterns = [
      {
        id: 'ktp_elektronik',
        documentType: 'KTP (Kartu Tanda Penduduk elektronik)',
        category: 'kartu' as const,
        patterns: ['persyaratan membuat KTP', 'syarat bikin KTP', 'cara buat KTP baru'],
        variations: ['ktp hilang', 'perpanjang ktp', 'ganti ktp'],
        informalVariations: ['gimana bikin KTP', 'mau buat KTP'],
        keywords: ['ktp', 'kartu', 'tanda', 'penduduk', 'elektronik'],
        accuracy: 95.2,
        priority: 'P0' as const
      }
      // Additional patterns would be loaded here
    ];

    patterns.forEach(pattern => {
      this.documentPatterns.set(pattern.id, pattern as DocumentPattern);
    });
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): DetectionConfig {
    return {
      minConfidence: 0.3,
      keywordWeight: 0.4,
      patternWeight: 0.5,
      categoryBonus: 0.05,
      priorityBonus: 0.05
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [DOCUMENT_DETECTOR] Configuration updated');
  }

  /**
   * Get detection statistics
   */
  getStatistics(): {
    totalPatterns: number;
    averageAccuracy: number;
    categoryDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
  } {
    const patterns = Array.from(this.documentPatterns.values());
    const totalPatterns = patterns.length;
    const averageAccuracy = patterns.reduce((sum, p) => sum + p.accuracy, 0) / totalPatterns;

    const categoryDistribution: Record<string, number> = {};
    const priorityDistribution: Record<string, number> = {};

    patterns.forEach(pattern => {
      categoryDistribution[pattern.category] = (categoryDistribution[pattern.category] || 0) + 1;
      priorityDistribution[pattern.priority] = (priorityDistribution[pattern.priority] || 0) + 1;
    });

    return {
      totalPatterns,
      averageAccuracy,
      categoryDistribution,
      priorityDistribution
    };
  }
}
