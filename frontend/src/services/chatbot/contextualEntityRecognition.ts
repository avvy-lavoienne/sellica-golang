/**
 * Contextual Entity Recognition for SELLY
 * 
 * Intelligent entity recognition that considers full query context
 * instead of defaulting to single entity matches like "pengajuan" → "pengajuan_bulanan"
 */

export interface EntityContext {
  entity: string;
  confidence: number;
  contextClues: string[];
  businessMeaning: string;
  suggestedTable: string;
  alternativeEntities: AlternativeEntity[];
}

export interface AlternativeEntity {
  entity: string;
  table: string;
  confidence: number;
  reason: string;
}

export interface ContextualQuery {
  originalQuery: string;
  primaryEntity: EntityContext;
  secondaryEntities: EntityContext[];
  queryIntent: string;
  recommendedAction: string;
  ambiguityResolution?: string;
}

export class ContextualEntityRecognition {
  
  /**
   * Enhanced entity patterns with contextual awareness
   */
  private static readonly CONTEXTUAL_ENTITIES = {
    // Pengajuan-related entities with context differentiation
    pengajuan: {
      baseEntity: 'pengajuan',
      contexts: {
        'pengajuan_bulanan': {
          triggers: ['bulanan', 'monthly', 'per bulan', 'setiap bulan'],
          antiTriggers: ['salah rekam', 'error', 'kesalahan', 'duplikat'],
          confidence: 0.9,
          businessMeaning: 'Pengajuan penghapusan data bulanan dari masyarakat',
          recordCount: 2530
        },
        'pengaduan_bulanan': {
          triggers: ['pengaduan', 'complaint', 'keluhan', 'laporan masalah'],
          antiTriggers: ['penghapusan', 'hapus', 'delete'],
          confidence: 0.8,
          businessMeaning: 'Pengaduan atau keluhan bulanan dari masyarakat',
          recordCount: 2
        },
        'general_pengajuan': {
          triggers: ['umum', 'general', 'semua jenis', 'all types'],
          antiTriggers: [],
          confidence: 0.6,
          businessMeaning: 'Pengajuan dalam konteks umum (perlu klarifikasi)',
          recordCount: 0
        }
      }
    },
    
    // Rekam-related entities
    rekam: {
      baseEntity: 'rekam',
      contexts: {
        'salah_rekam': {
          triggers: ['salah', 'error', 'kesalahan', 'wrong', 'incorrect', 'koreksi'],
          antiTriggers: ['pengajuan', 'bulanan'],
          confidence: 0.9,
          businessMeaning: 'Data yang salah rekam dan perlu koreksi',
          recordCount: 112
        },
        'adjudicate_record': {
          triggers: ['adjudicate', 'validasi', 'verification', 'review', 'check'],
          antiTriggers: ['salah', 'error'],
          confidence: 0.8,
          businessMeaning: 'Record yang perlu adjudikasi atau validasi',
          recordCount: 7
        },
        'general_rekam': {
          triggers: ['data', 'record', 'informasi'],
          antiTriggers: [],
          confidence: 0.5,
          businessMeaning: 'Data rekam dalam konteks umum (perlu klarifikasi)',
          recordCount: 0
        }
      }
    },
    
    // Operator-related entities
    operator: {
      baseEntity: 'operator',
      contexts: {
        'duplicate_operator': {
          triggers: ['duplicate', 'duplikat', 'ganda', 'kembar', 'sama'],
          antiTriggers: ['user', 'pengguna'],
          confidence: 0.9,
          businessMeaning: 'Operator yang terduplikasi dalam sistem',
          recordCount: 96
        },
        'general_operator': {
          triggers: ['petugas', 'staff', 'karyawan'],
          antiTriggers: ['duplicate', 'duplikat'],
          confidence: 0.6,
          businessMeaning: 'Operator atau petugas dalam konteks umum',
          recordCount: 0
        }
      }
    },
    
    // User-related entities
    user: {
      baseEntity: 'user',
      contexts: {
        'pending_users': {
          triggers: ['pending', 'menunggu', 'waiting', 'approval', 'belum disetujui'],
          antiTriggers: ['active', 'aktif'],
          confidence: 0.9,
          businessMeaning: 'User yang menunggu persetujuan atau aktivasi',
          recordCount: 8
        },
        'profiles': {
          triggers: ['profile', 'profil', 'biodata', 'informasi user'],
          antiTriggers: ['pending', 'menunggu'],
          confidence: 0.8,
          businessMeaning: 'Profil dan informasi user',
          recordCount: 10
        },
        'aktivitas_user': {
          triggers: ['aktivitas', 'activity', 'log', 'history', 'riwayat'],
          antiTriggers: ['profile', 'profil'],
          confidence: 0.8,
          businessMeaning: 'Log aktivitas user dalam sistem',
          recordCount: 0
        }
      }
    },
    
    // Documentation-related entities
    dokumentasi: {
      baseEntity: 'dokumentasi',
      contexts: {
        'dokumentasi': {
          triggers: ['dokumen', 'document', 'file', 'berkas', 'lampiran'],
          antiTriggers: [],
          confidence: 0.9,
          businessMeaning: 'Dokumentasi dan berkas dalam sistem',
          recordCount: 9
        }
      }
    },
    
    // Activity-related entities
    aktivitas: {
      baseEntity: 'aktivitas',
      contexts: {
        'aktivitas_siak': {
          triggers: ['siak', 'sistem', 'system', 'integration'],
          antiTriggers: ['user', 'pengguna'],
          confidence: 0.9,
          businessMeaning: 'Aktivitas integrasi dengan sistem SIAK',
          recordCount: 7
        },
        'aktivitas_user': {
          triggers: ['user', 'pengguna', 'personal', 'individual'],
          antiTriggers: ['siak', 'sistem'],
          confidence: 0.8,
          businessMeaning: 'Aktivitas personal user dalam sistem',
          recordCount: 0
        }
      }
    }
  };

  /**
   * Analyze query for contextual entity recognition
   */
  public static analyzeContextualQuery(query: string): ContextualQuery {
    console.log('🔍 [CONTEXTUAL_ENTITY] Analyzing query for contextual entities:', query);
    
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);
    
    // Find potential entities
    const potentialEntities: EntityContext[] = [];
    
    Object.entries(this.CONTEXTUAL_ENTITIES).forEach(([baseEntity, entityConfig]) => {
      if (this.queryContainsEntity(lowerQuery, baseEntity)) {
        const contextAnalysis = this.analyzeEntityContext(lowerQuery, queryWords, entityConfig);
        if (contextAnalysis) {
          potentialEntities.push(contextAnalysis);
        }
      }
    });
    
    // Sort by confidence and select primary entity
    potentialEntities.sort((a, b) => b.confidence - a.confidence);
    
    const primaryEntity = potentialEntities[0];
    const secondaryEntities = potentialEntities.slice(1, 3); // Top 2 alternatives
    
    // Determine query intent
    const queryIntent = this.determineQueryIntent(lowerQuery, primaryEntity);
    
    // Generate recommendation
    const recommendedAction = this.generateRecommendedAction(primaryEntity, queryIntent);
    
    // Check for ambiguity
    const ambiguityResolution = this.checkAmbiguity(potentialEntities, query);
    
    const result: ContextualQuery = {
      originalQuery: query,
      primaryEntity,
      secondaryEntities,
      queryIntent,
      recommendedAction,
      ambiguityResolution
    };
    
    console.log('✅ [CONTEXTUAL_ENTITY] Analysis complete:', {
      primaryEntity: primaryEntity?.entity,
      confidence: primaryEntity?.confidence,
      suggestedTable: primaryEntity?.suggestedTable,
      hasAmbiguity: !!ambiguityResolution
    });
    
    return result;
  }

  /**
   * Check if query contains entity
   */
  private static queryContainsEntity(query: string, entity: string): boolean {
    // Direct match
    if (query.includes(entity)) return true;
    
    // Partial matches for compound entities
    const entityParts = entity.split('_');
    return entityParts.some(part => query.includes(part));
  }

  /**
   * Analyze entity context within query
   */
  private static analyzeEntityContext(
    query: string, 
    queryWords: string[], 
    entityConfig: any
  ): EntityContext | null {
    
    let bestContext: any = null;
    let bestScore = 0;
    let contextClues: string[] = [];
    
    // Analyze each context for this entity
    Object.entries(entityConfig.contexts).forEach(([contextName, contextConfig]: [string, any]) => {
      let score = contextConfig.confidence;
      const clues: string[] = [];
      
      // Check for positive triggers
      contextConfig.triggers.forEach((trigger: string) => {
        if (query.includes(trigger)) {
          score += 0.2;
          clues.push(`+${trigger}`);
        }
      });
      
      // Check for negative triggers (anti-triggers)
      contextConfig.antiTriggers.forEach((antiTrigger: string) => {
        if (query.includes(antiTrigger)) {
          score -= 0.3;
          clues.push(`-${antiTrigger}`);
        }
      });
      
      // Bonus for exact context match
      if (query.includes(contextName.replace('_', ' '))) {
        score += 0.3;
        clues.push(`exact:${contextName}`);
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestContext = { name: contextName, config: contextConfig };
        contextClues = clues;
      }
    });
    
    if (!bestContext || bestScore < 0.4) {
      return null;
    }
    
    // Generate alternative entities
    const alternatives: AlternativeEntity[] = [];
    Object.entries(entityConfig.contexts).forEach(([contextName, contextConfig]: [string, any]) => {
      if (contextName !== bestContext.name) {
        alternatives.push({
          entity: `${entityConfig.baseEntity}_${contextName}`,
          table: contextName,
          confidence: contextConfig.confidence * 0.8,
          reason: `Alternative context for ${entityConfig.baseEntity}`
        });
      }
    });
    
    return {
      entity: `${entityConfig.baseEntity}_${bestContext.name}`,
      confidence: Math.min(bestScore, 1.0),
      contextClues,
      businessMeaning: bestContext.config.businessMeaning,
      suggestedTable: bestContext.name,
      alternativeEntities: alternatives.slice(0, 2)
    };
  }

  /**
   * Determine query intent
   */
  private static determineQueryIntent(query: string, primaryEntity?: EntityContext): string {
    if (!primaryEntity) return 'unknown';
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('berapa') || lowerQuery.includes('jumlah') || lowerQuery.includes('count')) {
      return 'volume_query';
    } else if (lowerQuery.includes('siapa') || lowerQuery.includes('who') || lowerQuery.includes('nama')) {
      return 'identity_query';
    } else if (lowerQuery.includes('apa') || lowerQuery.includes('what') || lowerQuery.includes('jenis')) {
      return 'information_query';
    } else if (lowerQuery.includes('bagaimana') || lowerQuery.includes('how') || lowerQuery.includes('cara')) {
      return 'process_query';
    } else if (lowerQuery.includes('kapan') || lowerQuery.includes('when') || lowerQuery.includes('tanggal')) {
      return 'temporal_query';
    } else if (lowerQuery.includes('dimana') || lowerQuery.includes('where') || lowerQuery.includes('lokasi')) {
      return 'location_query';
    } else if (lowerQuery.includes('analisis') || lowerQuery.includes('laporan') || lowerQuery.includes('dashboard')) {
      return 'analysis_query';
    } else if (lowerQuery.includes('masalah') || lowerQuery.includes('error') || lowerQuery.includes('issue')) {
      return 'troubleshooting_query';
    }
    
    return 'general_query';
  }

  /**
   * Generate recommended action
   */
  private static generateRecommendedAction(primaryEntity?: EntityContext, queryIntent?: string): string {
    if (!primaryEntity) {
      return 'Klarifikasi diperlukan - entity tidak dapat diidentifikasi';
    }
    
    const table = primaryEntity.suggestedTable;
    const intent = queryIntent || 'general_query';
    
    const actions: Record<string, string> = {
      'volume_query': `Query COUNT pada tabel ${table}`,
      'identity_query': `Query identitas/nama pada tabel ${table}`,
      'information_query': `Query informasi detail dari tabel ${table}`,
      'analysis_query': `Analisis komprehensif data ${table}`,
      'troubleshooting_query': `Identifikasi masalah pada data ${table}`,
      'general_query': `Query umum pada tabel ${table}`
    };
    
    return actions[intent] || `Query pada tabel ${table}`;
  }

  /**
   * Check for query ambiguity
   */
  private static checkAmbiguity(entities: EntityContext[], originalQuery: string): string | undefined {
    if (entities.length <= 1) return undefined;
    
    const topEntities = entities.slice(0, 2);
    const confidenceDiff = topEntities[0].confidence - topEntities[1].confidence;
    
    // If confidence difference is small, there's ambiguity
    if (confidenceDiff < 0.3) {
      const alternatives = topEntities.map(e => 
        `"${e.entity}" (${e.suggestedTable}) - ${e.businessMeaning}`
      ).join(' ATAU ');
      
      return `Query "${originalQuery}" dapat merujuk ke: ${alternatives}. Mohon spesifikasi lebih detail.`;
    }
    
    return undefined;
  }

  /**
   * Get entity suggestions for ambiguous queries
   */
  public static getEntitySuggestions(query: string): string[] {
    const analysis = this.analyzeContextualQuery(query);
    
    if (!analysis.ambiguityResolution) {
      return [];
    }
    
    const suggestions: string[] = [];
    
    // Add primary entity suggestion
    if (analysis.primaryEntity) {
      suggestions.push(`Untuk ${analysis.primaryEntity.suggestedTable}: "${query} ${analysis.primaryEntity.suggestedTable}"`);
    }
    
    // Add alternative suggestions
    analysis.secondaryEntities.forEach(entity => {
      suggestions.push(`Untuk ${entity.suggestedTable}: "${query} ${entity.suggestedTable}"`);
    });
    
    return suggestions;
  }

  /**
   * Validate entity recognition accuracy
   */
  public static validateEntityRecognition(testCases: Array<{query: string; expectedTable: string}>): {
    accuracy: number;
    results: Array<{query: string; expected: string; actual: string; correct: boolean}>;
  } {
    const results = testCases.map(testCase => {
      const analysis = this.analyzeContextualQuery(testCase.query);
      const actualTable = analysis.primaryEntity?.suggestedTable || 'unknown';
      
      return {
        query: testCase.query,
        expected: testCase.expectedTable,
        actual: actualTable,
        correct: actualTable === testCase.expectedTable
      };
    });
    
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = (correctCount / results.length) * 100;
    
    return { accuracy, results };
  }
}

export default ContextualEntityRecognition;
