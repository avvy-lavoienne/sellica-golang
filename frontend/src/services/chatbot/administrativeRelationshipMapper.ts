/**
 * Administrative Relationship Mapper for SELLY
 * Advanced relationship intelligence for administrative queries
 * Implements Week 2 of the RAG optimization plan
 */

export interface AdministrativeRelationship {
  tables: string[];
  joinKey: string;
  businessLogic: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  priority: number;
  indonesianContext: string[];
}

export interface JoinSuggestion {
  table: string;
  joinKey: string;
  joinType: string;
  purpose: string;
  confidence: number;
}

export interface RelationshipAnalysis {
  primaryRelationships: AdministrativeRelationship[];
  suggestedJoins: JoinSuggestion[];
  businessContext: string;
  complexityScore: number;
}

export class AdministrativeRelationshipMapper {
  private relationships: Map<string, AdministrativeRelationship> = new Map();

  constructor() {
    this.initializeRelationships();
  }

  /**
   * Initialize administrative relationships based on SELLICA schema
   */
  private initializeRelationships(): void {
    this.relationships = new Map([
      ['userToApplications', {
        tables: ['profiles', 'pengajuan_bulanan'],
        joinKey: 'user_id',
        businessLogic: 'Track user application history and submission patterns',
        joinType: 'LEFT',
        priority: 8,
        indonesianContext: ['pengguna', 'pengajuan', 'riwayat', 'aplikasi']
      }],
      
      ['applicationToValidation', {
        tables: ['pengajuan_bulanan', 'adjudicate_record'],
        joinKey: 'nik_pengaju',
        businessLogic: 'Application validation workflow and adjudication process',
        joinType: 'LEFT',
        priority: 9,
        indonesianContext: ['pengajuan', 'validasi', 'adjudicate', 'verifikasi']
      }],
      
      ['validationToCorrection', {
        tables: ['adjudicate_record', 'salah_rekam'],
        joinKey: 'nik_adjudicate',
        businessLogic: 'Error correction process following validation',
        joinType: 'LEFT',
        priority: 7,
        indonesianContext: ['validasi', 'koreksi', 'perbaikan', 'kesalahan']
      }],
      
      ['userToActivity', {
        tables: ['profiles', 'aktivitas_user', 'aktivitas_siak'],
        joinKey: 'user_id',
        businessLogic: 'Comprehensive activity tracking across user and system levels',
        joinType: 'LEFT',
        priority: 6,
        indonesianContext: ['pengguna', 'aktivitas', 'kegiatan', 'monitoring']
      }],
      
      ['applicationToComplaint', {
        tables: ['pengajuan_bulanan', 'pengaduan_bulanan'],
        joinKey: 'user_id',
        businessLogic: 'Correlation between applications and complaints',
        joinType: 'FULL',
        priority: 5,
        indonesianContext: ['pengajuan', 'pengaduan', 'keluhan', 'masalah']
      }],
      
      ['duplicateDetection', {
        tables: ['duplicate_operator', 'pengajuan_bulanan'],
        joinKey: 'nik_pengaju',
        businessLogic: 'Duplicate detection in application processing',
        joinType: 'INNER',
        priority: 8,
        indonesianContext: ['duplikasi', 'ganda', 'operator', 'deteksi']
      }],
      
      ['userApprovalWorkflow', {
        tables: ['pending_users', 'profiles'],
        joinKey: 'email',
        businessLogic: 'User registration and approval workflow',
        joinType: 'LEFT',
        priority: 7,
        indonesianContext: ['persetujuan', 'registrasi', 'pending', 'aktivasi']
      }],
      
      ['documentationTracking', {
        tables: ['dokumentasi', 'profiles'],
        joinKey: 'created_by',
        businessLogic: 'Document creation and user attribution',
        joinType: 'INNER',
        priority: 4,
        indonesianContext: ['dokumentasi', 'dokumen', 'arsip', 'laporan']
      }]
    ]);
  }

  /**
   * Analyze relationships for a given query context
   */
  public analyzeRelationships(
    tables: string[], 
    queryContext: string
  ): RelationshipAnalysis {
    const contextLower = queryContext.toLowerCase();
    const relevantRelationships: AdministrativeRelationship[] = [];
    const suggestedJoins: JoinSuggestion[] = [];

    // Find relationships that involve the queried tables
    for (const [relationshipName, relationship] of this.relationships.entries()) {
      const hasRelevantTables = tables.some(table => 
        relationship.tables.includes(table)
      );

      if (hasRelevantTables) {
        // Check if Indonesian context matches
        const hasContextMatch = relationship.indonesianContext.some(term =>
          contextLower.includes(term)
        );

        if (hasContextMatch || tables.length > 1) {
          relevantRelationships.push(relationship);

          // Generate join suggestions
          for (const table of relationship.tables) {
            if (!tables.includes(table)) {
              suggestedJoins.push({
                table,
                joinKey: relationship.joinKey,
                joinType: relationship.joinType + ' JOIN',
                purpose: relationship.businessLogic,
                confidence: this.calculateJoinConfidence(
                  relationship, 
                  contextLower, 
                  tables
                )
              });
            }
          }
        }
      }
    }

    // Sort by priority and confidence
    relevantRelationships.sort((a, b) => b.priority - a.priority);
    suggestedJoins.sort((a, b) => b.confidence - a.confidence);

    return {
      primaryRelationships: relevantRelationships.slice(0, 5),
      suggestedJoins: suggestedJoins.slice(0, 8),
      businessContext: this.generateBusinessContext(relevantRelationships),
      complexityScore: this.calculateComplexityScore(relevantRelationships, tables)
    };
  }

  /**
   * Calculate confidence score for join suggestions
   */
  private calculateJoinConfidence(
    relationship: AdministrativeRelationship,
    context: string,
    tables: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for context matches
    const contextMatches = relationship.indonesianContext.filter(term =>
      context.includes(term)
    ).length;
    confidence += (contextMatches * 0.15);

    // Boost confidence for priority
    confidence += (relationship.priority / 10) * 0.2;

    // Boost confidence for table relevance
    const tableRelevance = relationship.tables.filter(table =>
      tables.includes(table)
    ).length / relationship.tables.length;
    confidence += tableRelevance * 0.25;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate business context description
   */
  private generateBusinessContext(relationships: AdministrativeRelationship[]): string {
    if (relationships.length === 0) {
      return 'Analisis data tunggal tanpa relasi kompleks';
    }

    const contexts = relationships.map(rel => rel.businessLogic);
    const uniqueContexts = [...new Set(contexts)];

    if (uniqueContexts.length === 1) {
      return uniqueContexts[0];
    }

    return `Analisis multi-domain: ${uniqueContexts.slice(0, 2).join(' dan ')}`;
  }

  /**
   * Calculate query complexity score
   */
  private calculateComplexityScore(
    relationships: AdministrativeRelationship[],
    tables: string[]
  ): number {
    let complexity = tables.length * 2; // Base complexity from table count
    
    // Add complexity for relationships
    complexity += relationships.length * 3;
    
    // Add complexity for join types
    const complexJoins = relationships.filter(rel => 
      rel.joinType === 'FULL' || rel.joinType === 'RIGHT'
    ).length;
    complexity += complexJoins * 2;

    // Normalize to 1-10 scale
    return Math.min(Math.max(Math.round(complexity / 2), 1), 10);
  }

  /**
   * Get optimal join sequence for multiple tables
   */
  public getOptimalJoinSequence(tables: string[]): JoinSuggestion[] {
    if (tables.length < 2) return [];

    const joinSequence: JoinSuggestion[] = [];
    const processedTables = new Set([tables[0]]); // Start with first table

    for (let i = 1; i < tables.length; i++) {
      const targetTable = tables[i];
      let bestJoin: JoinSuggestion | null = null;
      let bestScore = 0;

      // Find best relationship to connect this table
      for (const [_, relationship] of this.relationships.entries()) {
        if (relationship.tables.includes(targetTable)) {
          const hasProcessedTable = relationship.tables.some(table =>
            processedTables.has(table)
          );

          if (hasProcessedTable) {
            const score = relationship.priority + 
              (relationship.joinType === 'INNER' ? 2 : 1);

            if (score > bestScore) {
              bestScore = score;
              bestJoin = {
                table: targetTable,
                joinKey: relationship.joinKey,
                joinType: relationship.joinType + ' JOIN',
                purpose: relationship.businessLogic,
                confidence: 0.9
              };
            }
          }
        }
      }

      if (bestJoin) {
        joinSequence.push(bestJoin);
        processedTables.add(targetTable);
      }
    }

    return joinSequence;
  }

  /**
   * Get relationship by name
   */
  public getRelationship(name: string): AdministrativeRelationship | null {
    return this.relationships.get(name) || null;
  }

  /**
   * Get all available relationships
   */
  public getAllRelationships(): Map<string, AdministrativeRelationship> {
    return new Map(this.relationships);
  }
}

// Export singleton instance
export const administrativeRelationshipMapper = new AdministrativeRelationshipMapper();
