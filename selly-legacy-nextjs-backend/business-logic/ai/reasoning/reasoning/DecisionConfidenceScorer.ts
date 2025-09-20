/**
 * Decision Confidence Scorer - Phase 4 AI Intelligence Enhancement
 * 
 * Calculates confidence scores for AI reasoning decisions based on
 * contextual factors, historical patterns, and logical inferences.
 * 
 * Compliance: Code Quality Rule, Government Integration Rule
 */

import { z } from 'zod';

export const ConfidenceRequestSchema = z.object({
  recommendation: z.string(),
  contextualFactors: z.array(z.string()),
  historicalPatterns: z.array(z.string()),
  logicalInferences: z.array(z.string())
});

export const EnhancedConfidenceRequestSchema = z.object({
  query: z.string(),
  recommendation: z.string(),
  contextualFactors: z.array(z.string()),
  historicalPatterns: z.array(z.string()),
  logicalInferences: z.array(z.string()),
  culturalConsiderations: z.array(z.string()),
  reasoningSteps: z.array(z.string())
});

export type ConfidenceRequest = z.infer<typeof ConfidenceRequestSchema>;
export type EnhancedConfidenceRequest = z.infer<typeof EnhancedConfidenceRequestSchema>;

/**
 * Calculates confidence scores for AI reasoning decisions
 * Enhanced for Phase 4 with cultural and administrative context weighting
 */
export class DecisionConfidenceScorer {
  /**
   * Calculates confidence score based on multiple factors (legacy method)
   */
  async calculateConfidence(request: ConfidenceRequest): Promise<number> {
    const validatedRequest = ConfidenceRequestSchema.parse(request);

    let confidence = 0.5; // Base confidence

    // Adjust based on contextual factors
    if (validatedRequest.contextualFactors.length > 3) {
      confidence += 0.2;
    }

    // Adjust based on historical patterns
    if (validatedRequest.historicalPatterns.length > 0) {
      confidence += 0.15;
    }

    // Adjust based on logical inferences
    if (validatedRequest.logicalInferences.length > 2) {
      confidence += 0.15;
    }

    // Ensure confidence is within bounds
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Enhanced confidence calculation with cultural and administrative weighting
   * Designed for Phase 4 Indonesian administrative contexts
   */
  async calculateEnhancedConfidence(request: EnhancedConfidenceRequest): Promise<number> {
    const validatedRequest = EnhancedConfidenceRequestSchema.parse(request);

    let confidence = 0.4; // Lower base confidence for more rigorous scoring

    // Contextual factors weight (max +0.25)
    const contextWeight = Math.min(validatedRequest.contextualFactors.length * 0.05, 0.25);
    confidence += contextWeight;

    // Historical patterns weight (max +0.2)
    const historyWeight = Math.min(validatedRequest.historicalPatterns.length * 0.04, 0.2);
    confidence += historyWeight;

    // Logical inferences weight (max +0.2)
    const logicWeight = Math.min(validatedRequest.logicalInferences.length * 0.04, 0.2);
    confidence += logicWeight;

    // Cultural considerations weight (max +0.15)
    const culturalWeight = Math.min(validatedRequest.culturalConsiderations.length * 0.03, 0.15);
    confidence += culturalWeight;

    // Reasoning depth bonus (max +0.1)
    const reasoningDepth = Math.min(validatedRequest.reasoningSteps.length * 0.02, 0.1);
    confidence += reasoningDepth;

    // Query complexity bonus (max +0.1)
    const complexityBonus = this.calculateQueryComplexity(validatedRequest.query) * 0.1;
    confidence += complexityBonus;

    // Indonesian language bonus (max +0.05)
    const indonesianBonus = this.containsIndonesian(validatedRequest.query) ? 0.05 : 0;
    confidence += indonesianBonus;

    // Administrative domain bonus (max +0.05)
    const adminBonus = this.isAdministrativeDomain(validatedRequest.recommendation) ? 0.05 : 0;
    confidence += adminBonus;

    // Ensure confidence is within bounds
    return Math.min(Math.max(confidence, 0.1), 0.98); // Cap at 98% to maintain humility
  }

  /**
   * Calculates query complexity score for confidence weighting
   */
  private calculateQueryComplexity(query: string): number {
    let complexity = 0;

    // Length factor
    complexity += Math.min(query.length / 100, 0.3);

    // Multiple concepts
    const concepts = ['ktp', 'akta', 'sertifikat', 'domisili', 'pindah', 'daftar', 'ubah'];
    const conceptCount = concepts.filter(concept => query.toLowerCase().includes(concept)).length;
    complexity += Math.min(conceptCount * 0.2, 0.4);

    // Question words (indicating complexity)
    const questionWords = ['bagaimana', 'mengapa', 'kapan', 'dimana', 'berapa'];
    const questionCount = questionWords.filter(word => query.toLowerCase().includes(word)).length;
    complexity += Math.min(questionCount * 0.1, 0.3);

    return Math.min(complexity, 1.0);
  }

  /**
   * Checks if query contains Indonesian language
   */
  private containsIndonesian(query: string): boolean {
    const indonesianWords = [
      'dan', 'atau', 'dengan', 'untuk', 'dari', 'ke', 'di', 'pada', 'dalam',
      'yang', 'adalah', 'akan', 'sudah', 'belum', 'bisa', 'tidak', 'ya',
      'bagaimana', 'mengapa', 'kapan', 'dimana', 'siapa', 'apa'
    ];

    const lowerQuery = query.toLowerCase();
    return indonesianWords.some(word => lowerQuery.includes(word));
  }

  /**
   * Checks if recommendation is in administrative domain
   */
  private isAdministrativeDomain(recommendation: string): boolean {
    const adminTerms = [
      'administrasi', 'pemerintah', 'dinas', 'instansi', 'layanan',
      'dokumen', 'surat', 'sertifikat', 'akta', 'ktp'
    ];

    const lowerRec = recommendation.toLowerCase();
    return adminTerms.some(term => lowerRec.includes(term));
  }
}
