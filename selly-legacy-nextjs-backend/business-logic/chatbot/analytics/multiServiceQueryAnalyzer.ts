/**
 * Multi-Service Query Analyzer for SELLY
 * Analyzes user queries to identify when multiple Disdukcapil services are involved
 * Integrates with existing KnowledgeService architecture
 */

import { CrossServiceDependencyMapper, CrossServiceScenario, MultiServiceResponse, MultiServiceStep } from './crossServiceDependencyMapper';
import { ServiceInfo } from './knowledgeService';

export interface QueryAnalysisResult {
  isMultiService: boolean;
  confidence: number;
  detectedServices: string[];
  scenario?: CrossServiceScenario | null;
  analysisMetadata: {
    processingTime: number;
    patternMatches: string[];
    complexityScore: number;
    recommendedApproach: 'single_service' | 'multi_service' | 'interactive_assessment';
  };
}

export interface ServiceContext {
  serviceId: string;
  serviceName: string;
  relevanceScore: number;
  triggerKeywords: string[];
  contextualFactors: string[];
}

export class MultiServiceQueryAnalyzer {
  private dependencyMapper: CrossServiceDependencyMapper;
  private serviceKeywords: Map<string, string[]> = new Map();
  private multiServicePatterns: RegExp[] = [];

  constructor() {
    this.dependencyMapper = new CrossServiceDependencyMapper();
    this.initializeServiceKeywords();
    this.initializeMultiServicePatterns();
  }

  /**
   * Initialize service-specific keywords for detection
   */
  private initializeServiceKeywords(): void {
    this.serviceKeywords.set('ktp_baru', [
      'ktp', 'kartu tanda penduduk', 'ktp-el', 'identitas', 'ektp'
    ]);
    
    this.serviceKeywords.set('kk_baru', [
      'kk', 'kartu keluarga', 'keluarga', 'anggota keluarga'
    ]);
    
    this.serviceKeywords.set('kia', [
      'kia', 'kartu identitas anak', 'identitas anak', 'anak'
    ]);
    
    this.serviceKeywords.set('kepindahan', [
      'pindah', 'domisili', 'alamat', 'kepindahan', 'relokasi', 'mutasi'
    ]);
    
    this.serviceKeywords.set('akta_kelahiran', [
      'akta kelahiran', 'kelahiran', 'lahir', 'bayi', 'anak lahir'
    ]);
    
    this.serviceKeywords.set('akta_perkawinan', [
      'akta perkawinan', 'akta nikah', 'pernikahan', 'menikah', 'nikah'
    ]);
    
    this.serviceKeywords.set('akta_perceraian', [
      'akta perceraian', 'perceraian', 'cerai', 'bercerai'
    ]);
    
    this.serviceKeywords.set('akta_kematian', [
      'akta kematian', 'kematian', 'meninggal', 'wafat'
    ]);
    
    this.serviceKeywords.set('biodata_penduduk', [
      'biodata', 'biodata penduduk', 'data penduduk'
    ]);
  }

  /**
   * Initialize patterns that indicate multi-service queries
   */
  private initializeMultiServicePatterns(): void {
    this.multiServicePatterns = [
      // General multi-document patterns
      /dokumen.*apa.*saja.*perlu/i,
      /semua.*dokumen.*yang.*dibutuhkan/i,
      /dokumen.*lengkap.*untuk/i,
      /apa.*aja.*yang.*harus.*diurus/i,
      
      // Specific multi-service scenarios
      /pindah.*domisili.*dokumen.*apa/i,
      /setelah.*nikah.*dokumen.*apa/i,
      /bayi.*lahir.*dokumen.*apa/i,
      /dokumen.*hilang.*semua/i,
      
      // Update/change scenarios
      /perlu.*update.*dokumen/i,
      /perlu.*diperbarui.*dokumen/i,
      /ganti.*alamat.*dokumen/i,
      /ubah.*data.*dokumen/i,
      
      // Conjunction patterns (multiple services mentioned)
      /(ktp|kartu tanda penduduk).*(dan|sama|juga).*(kk|kartu keluarga)/i,
      /(kk|kartu keluarga).*(dan|sama|juga).*(kia|kartu identitas anak)/i,
      /(akta|surat).*(dan|sama|juga).*(ktp|kk)/i,
      
      // Process completion patterns
      /selesai.*semua.*dokumen/i,
      /lengkap.*semua.*persyaratan/i,
      /tuntas.*semua.*urusan/i
    ];
  }

  /**
   * Main analysis method - determines if query involves multiple services
   */
  public analyzeQuery(query: string): QueryAnalysisResult {
    const startTime = performance.now();
    const lowerQuery = query.toLowerCase();
    
    // Step 1: Check for explicit multi-service patterns
    const multiServicePatternMatches = this.multiServicePatterns
      .filter(pattern => pattern.test(lowerQuery))
      .map(pattern => pattern.source);
    
    // Step 2: Detect mentioned services
    const detectedServices = this.detectMentionedServices(lowerQuery);
    
    // Step 3: Check for cross-service scenarios
    const scenario = this.dependencyMapper.analyzeQuery(query);
    
    // Step 4: Calculate confidence and complexity
    const confidence = this.calculateConfidence(
      multiServicePatternMatches.length,
      detectedServices.length,
      scenario !== null
    );
    
    const complexityScore = this.calculateComplexityScore(
      detectedServices.length,
      multiServicePatternMatches.length,
      scenario?.complexity || 'simple'
    );
    
    // Step 5: Determine if this is truly a multi-service query
    const isMultiService = this.determineMultiService(
      detectedServices.length,
      multiServicePatternMatches.length,
      scenario !== null,
      confidence
    );
    
    const processingTime = performance.now() - startTime;
    
    // Step 6: Recommend approach
    const recommendedApproach = this.recommendApproach(
      isMultiService,
      complexityScore,
      detectedServices.length
    );
    
    console.log(`🔍 [MULTI_SERVICE_ANALYZER] Query analysis completed in ${processingTime.toFixed(2)}ms`);
    console.log(`🎯 [MULTI_SERVICE_ANALYZER] Multi-service: ${isMultiService}, Confidence: ${confidence}, Services: ${detectedServices.length}`);
    
    return {
      isMultiService,
      confidence,
      detectedServices: detectedServices.map(s => s.serviceId),
      scenario,
      analysisMetadata: {
        processingTime,
        patternMatches: multiServicePatternMatches,
        complexityScore,
        recommendedApproach
      }
    };
  }

  /**
   * Detect which services are mentioned in the query
   */
  private detectMentionedServices(query: string): ServiceContext[] {
    const detectedServices: ServiceContext[] = [];
    
    for (const [serviceId, keywords] of this.serviceKeywords) {
      const matchedKeywords = keywords.filter(keyword => 
        query.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        const relevanceScore = this.calculateRelevanceScore(matchedKeywords, keywords);
        
        detectedServices.push({
          serviceId,
          serviceName: this.getServiceDisplayName(serviceId),
          relevanceScore,
          triggerKeywords: matchedKeywords,
          contextualFactors: this.extractContextualFactors(query, matchedKeywords)
        });
      }
    }
    
    // Sort by relevance score
    return detectedServices.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate confidence score for multi-service detection
   */
  private calculateConfidence(
    patternMatches: number,
    servicesDetected: number,
    hasScenario: boolean
  ): number {
    let confidence = 0;
    
    // Base confidence from pattern matches
    confidence += Math.min(patternMatches * 0.3, 0.6);
    
    // Confidence from multiple services detected
    if (servicesDetected >= 2) {
      confidence += Math.min(servicesDetected * 0.2, 0.4);
    }
    
    // Bonus for recognized scenario
    if (hasScenario) {
      confidence += 0.3;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(
    servicesCount: number,
    patternMatches: number,
    scenarioComplexity: string
  ): number {
    let score = servicesCount * 2; // Base complexity from service count
    score += patternMatches; // Additional complexity from pattern matches
    
    // Scenario complexity multiplier
    const complexityMultiplier = {
      'simple': 1,
      'moderate': 1.5,
      'complex': 2
    };
    
    score *= complexityMultiplier[scenarioComplexity as keyof typeof complexityMultiplier] || 1;
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Determine if query is truly multi-service
   */
  private determineMultiService(
    servicesCount: number,
    patternMatches: number,
    hasScenario: boolean,
    confidence: number
  ): boolean {
    // High confidence threshold
    if (confidence >= 0.7) return true;
    
    // Multiple services with patterns
    if (servicesCount >= 2 && patternMatches >= 1) return true;
    
    // Recognized scenario
    if (hasScenario) return true;
    
    // Conservative approach - prefer single service unless clear indicators
    return false;
  }

  /**
   * Recommend processing approach
   */
  private recommendApproach(
    isMultiService: boolean,
    complexityScore: number,
    servicesCount: number
  ): 'single_service' | 'multi_service' | 'interactive_assessment' {
    if (!isMultiService) {
      return 'single_service';
    }
    
    // High complexity or many services - use interactive assessment
    if (complexityScore >= 7 || servicesCount >= 4) {
      return 'interactive_assessment';
    }
    
    // Moderate complexity - direct multi-service response
    return 'multi_service';
  }

  /**
   * Calculate relevance score for detected service
   */
  private calculateRelevanceScore(matchedKeywords: string[], allKeywords: string[]): number {
    const matchRatio = matchedKeywords.length / allKeywords.length;
    const keywordQuality = matchedKeywords.reduce((score, keyword) => {
      // Longer, more specific keywords get higher scores
      return score + (keyword.length / 10);
    }, 0);
    
    return (matchRatio * 0.6) + (keywordQuality * 0.4);
  }

  /**
   * Extract contextual factors from query
   */
  private extractContextualFactors(query: string, keywords: string[]): string[] {
    const factors: string[] = [];
    
    // Time-related factors
    if (/baru|setelah|habis|sudah/i.test(query)) {
      factors.push('recent_event');
    }
    
    // Urgency factors
    if (/segera|cepat|urgent|penting/i.test(query)) {
      factors.push('urgent');
    }
    
    // Completeness factors
    if (/lengkap|semua|seluruh/i.test(query)) {
      factors.push('comprehensive');
    }
    
    return factors;
  }

  /**
   * Get display name for service
   */
  private getServiceDisplayName(serviceId: string): string {
    const displayNames: Record<string, string> = {
      'ktp_baru': 'KTP-el',
      'kk_baru': 'Kartu Keluarga',
      'kia': 'Kartu Identitas Anak',
      'kepindahan': 'Kepindahan',
      'akta_kelahiran': 'Akta Kelahiran',
      'akta_perkawinan': 'Akta Perkawinan',
      'akta_perceraian': 'Akta Perceraian',
      'akta_kematian': 'Akta Kematian',
      'biodata_penduduk': 'Biodata Penduduk'
    };
    
    return displayNames[serviceId] || serviceId;
  }

  /**
   * Get dependency mapper instance for external use
   */
  public getDependencyMapper(): CrossServiceDependencyMapper {
    return this.dependencyMapper;
  }
}
