/**
 * Entity Recognition Processor - Day 16-17: IntelligenceEngine Design
 * Consolidates contextual entity recognition functionality
 * Provides advanced Indonesian entity extraction and contextual understanding
 */

import { BaseProcessor, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceResult, IntelligenceContext } from '../IntelligenceEngine';

export interface EntityMatch {
  text: string;
  type: string;
  confidence: number;
  position: number;
  context?: string;
  metadata?: any;
}

export interface ContextualEntity {
  entity: EntityMatch;
  context: {
    administrative: boolean;
    temporal: boolean;
    business: boolean;
    personal: boolean;
  };
  relationships: string[];
  suggestions: string[];
}

/**
 * Entity Recognition Processor
 * Consolidates functionality from contextualEntityRecognition.ts
 * Provides advanced Indonesian entity extraction with contextual understanding
 */
export class EntityRecognitionProcessor extends BaseProcessor {
  public readonly id = 'entity';
  public readonly name = 'Contextual Entity Recognition';
  public readonly priority = 60; // High priority for entity-heavy queries

  private entityPatterns: Map<string, any> = new Map();
  private contextualRules: Map<string, any> = new Map();
  private administrativeTerms: Set<string> = new Set();
  private businessTerms: Set<string> = new Set();

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: true,
      schemaIntelligence: false,
      entityRecognition: true, // Primary capability
      dataRetrieval: true,
      businessLogic: true,
      temporalAnalysis: true,
      visualizations: false,
      proactiveInsights: true
    };
  }

  /**
   * Initialize processor
   */
  protected async onInitialize(): Promise<void> {
    this.debug('Initializing Entity Recognition Processor...');
    
    try {
      // Initialize entity patterns
      this.initializeEntityPatterns();
      
      // Initialize contextual rules
      this.initializeContextualRules();
      
      // Initialize administrative terms
      this.initializeAdministrativeTerms();
      
      // Initialize business terms
      this.initializeBusinessTerms();
      
      this.debug('Entity Recognition Processor initialized successfully');
    } catch (error) {
      console.error('❌ [ENTITY] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Entity-rich indicators
    const entityIndicators = [
      'nik', 'nama', 'id', 'nomor', 'kode',
      'pengajuan', 'pengaduan', 'dokumentasi',
      'pengguna', 'user', 'operator'
    ];
    
    // Administrative context indicators
    const adminIndicators = [
      'ktp', 'akta', 'surat', 'dokumen', 'berkas',
      'permohonan', 'aplikasi', 'formulir'
    ];
    
    // Personal data indicators
    const personalIndicators = [
      'alamat', 'telepon', 'email', 'tanggal lahir',
      'tempat lahir', 'pekerjaan', 'status'
    ];
    
    const hasEntityIndicators = entityIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    const hasAdminIndicators = adminIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    const hasPersonalIndicators = personalIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Handle if query contains entities or administrative context
    return hasEntityIndicators || hasAdminIndicators || hasPersonalIndicators;
  }

  /**
   * Process query with entity recognition
   */
  protected async processQuery(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    this.debug('Processing query with entity recognition', { query: query.substring(0, 100) });
    
    try {
      // Extract entities from query
      const entities = await this.extractEntities(query);
      
      // Apply contextual understanding
      const contextualEntities = await this.applyContextualUnderstanding(entities, query, context);
      
      // Analyze entity relationships
      const relationships = this.analyzeEntityRelationships(contextualEntities);
      
      // Generate entity-based insights
      const insights = this.generateEntityInsights(contextualEntities, relationships);
      
      // Create suggestions based on entities
      const suggestions = this.generateEntitySuggestions(contextualEntities);
      
      // Build comprehensive result
      const result = this.createSuccessResult(
        contextualEntities,
        this.generateEntitySummary(contextualEntities),
        0.85,
        'enhanced'
      );
      
      // Add entity-specific metadata
      result.proactiveInsights = insights;
      result.suggestions = suggestions;
      result.followUpQuestions = this.generateEntityFollowUpQuestions(contextualEntities);
      
      this.debug('Entity recognition processing completed', { 
        entitiesFound: entities.length,
        contextualEntities: contextualEntities.length,
        confidence: result.confidence 
      });
      
      return result;
      
    } catch (error) {
      this.debug('Entity recognition processing failed', error);
      throw error;
    }
  }

  /**
   * Extract entities from query
   */
  private async extractEntities(query: string): Promise<EntityMatch[]> {
    const entities: EntityMatch[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Extract NIK (16-digit Indonesian ID)
    const nikPattern = /\b\d{16}\b/g;
    let match;
    while ((match = nikPattern.exec(query)) !== null) {
      entities.push({
        text: match[0],
        type: 'nik',
        confidence: 0.95,
        position: match.index,
        metadata: { format: 'indonesian_id', length: 16 }
      });
    }
    
    // Extract phone numbers
    const phonePattern = /\b(?:\+62|62|0)\d{8,12}\b/g;
    while ((match = phonePattern.exec(query)) !== null) {
      entities.push({
        text: match[0],
        type: 'phone',
        confidence: 0.9,
        position: match.index,
        metadata: { format: 'indonesian_phone' }
      });
    }
    
    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    while ((match = emailPattern.exec(query)) !== null) {
      entities.push({
        text: match[0],
        type: 'email',
        confidence: 0.9,
        position: match.index,
        metadata: { format: 'email' }
      });
    }
    
    // Extract dates
    const datePattern = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g;
    while ((match = datePattern.exec(query)) !== null) {
      entities.push({
        text: match[0],
        type: 'date',
        confidence: 0.8,
        position: match.index,
        metadata: { format: 'date' }
      });
    }
    
    // Extract IDs
    const idPattern = /\bid\s*:?\s*(\d+)/gi;
    while ((match = idPattern.exec(query)) !== null) {
      entities.push({
        text: match[1],
        type: 'id',
        confidence: 0.85,
        position: match.index,
        metadata: { format: 'numeric_id' }
      });
    }
    
    // Extract administrative entities
    entities.push(...this.extractAdministrativeEntities(query));
    
    // Extract business entities
    entities.push(...this.extractBusinessEntities(query));
    
    // Extract personal entities
    entities.push(...this.extractPersonalEntities(query));
    
    // Sort by confidence and position
    return entities.sort((a, b) => b.confidence - a.confidence || a.position - b.position);
  }

  /**
   * Extract administrative entities
   */
  private extractAdministrativeEntities(query: string): EntityMatch[] {
    const entities: EntityMatch[] = [];
    const lowerQuery = query.toLowerCase();
    
    const adminPatterns = {
      'ktp': { type: 'document_type', confidence: 0.9 },
      'akta kelahiran': { type: 'document_type', confidence: 0.9 },
      'surat keterangan': { type: 'document_type', confidence: 0.8 },
      'kartu keluarga': { type: 'document_type', confidence: 0.9 },
      'pengajuan': { type: 'process_type', confidence: 0.8 },
      'pengaduan': { type: 'process_type', confidence: 0.8 },
      'permohonan': { type: 'process_type', confidence: 0.8 }
    };
    
    Object.entries(adminPatterns).forEach(([pattern, info]) => {
      const index = lowerQuery.indexOf(pattern);
      if (index !== -1) {
        entities.push({
          text: pattern,
          type: info.type,
          confidence: info.confidence,
          position: index,
          context: 'administrative',
          metadata: { category: 'administrative' }
        });
      }
    });
    
    return entities;
  }

  /**
   * Extract business entities
   */
  private extractBusinessEntities(query: string): EntityMatch[] {
    const entities: EntityMatch[] = [];
    const lowerQuery = query.toLowerCase();
    
    const businessPatterns = {
      'operator': { type: 'role', confidence: 0.8 },
      'admin': { type: 'role', confidence: 0.8 },
      'supervisor': { type: 'role', confidence: 0.8 },
      'duplicate': { type: 'process_status', confidence: 0.8 },
      'adjudicate': { type: 'process_status', confidence: 0.8 },
      'approved': { type: 'status', confidence: 0.8 },
      'rejected': { type: 'status', confidence: 0.8 },
      'pending': { type: 'status', confidence: 0.8 }
    };
    
    Object.entries(businessPatterns).forEach(([pattern, info]) => {
      const index = lowerQuery.indexOf(pattern);
      if (index !== -1) {
        entities.push({
          text: pattern,
          type: info.type,
          confidence: info.confidence,
          position: index,
          context: 'business',
          metadata: { category: 'business' }
        });
      }
    });
    
    return entities;
  }

  /**
   * Extract personal entities
   */
  private extractPersonalEntities(query: string): EntityMatch[] {
    const entities: EntityMatch[] = [];
    
    // Extract names (simple pattern for Indonesian names)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    let match;
    while ((match = namePattern.exec(query)) !== null) {
      // Filter out common non-name words
      const commonWords = ['ID', 'NIK', 'KTP', 'Data', 'Status', 'Pengajuan'];
      if (!commonWords.includes(match[0])) {
        entities.push({
          text: match[0],
          type: 'person_name',
          confidence: 0.6, // Lower confidence for name detection
          position: match.index,
          context: 'personal',
          metadata: { category: 'personal' }
        });
      }
    }
    
    return entities;
  }

  /**
   * Apply contextual understanding
   */
  private async applyContextualUnderstanding(
    entities: EntityMatch[], 
    query: string, 
    context?: IntelligenceContext
  ): Promise<ContextualEntity[]> {
    const contextualEntities: ContextualEntity[] = [];
    
    for (const entity of entities) {
      const entityContext = this.analyzeEntityContext(entity, query, context);
      const relationships = this.findEntityRelationships(entity, entities);
      const suggestions = this.generateEntitySpecificSuggestions(entity, entityContext);
      
      contextualEntities.push({
        entity,
        context: entityContext,
        relationships,
        suggestions
      });
    }
    
    return contextualEntities;
  }

  /**
   * Analyze entity context
   */
  private analyzeEntityContext(
    entity: EntityMatch, 
    query: string, 
    context?: IntelligenceContext
  ): any {
    const lowerQuery = query.toLowerCase();
    
    return {
      administrative: this.isAdministrativeContext(entity, lowerQuery),
      temporal: this.isTemporalContext(entity, lowerQuery),
      business: this.isBusinessContext(entity, lowerQuery),
      personal: this.isPersonalContext(entity, lowerQuery)
    };
  }

  /**
   * Context analysis helpers
   */
  private isAdministrativeContext(entity: EntityMatch, query: string): boolean {
    const adminKeywords = ['pengajuan', 'permohonan', 'dokumen', 'berkas', 'surat'];
    return adminKeywords.some(keyword => query.includes(keyword)) || 
           entity.context === 'administrative';
  }

  private isTemporalContext(entity: EntityMatch, query: string): boolean {
    const temporalKeywords = ['hari ini', 'kemarin', 'bulan ini', 'tahun ini', 'tanggal'];
    return temporalKeywords.some(keyword => query.includes(keyword)) || 
           entity.type === 'date';
  }

  private isBusinessContext(entity: EntityMatch, query: string): boolean {
    const businessKeywords = ['status', 'proses', 'workflow', 'approval'];
    return businessKeywords.some(keyword => query.includes(keyword)) || 
           entity.context === 'business';
  }

  private isPersonalContext(entity: EntityMatch, query: string): boolean {
    const personalKeywords = ['nama', 'alamat', 'telepon', 'email'];
    return personalKeywords.some(keyword => query.includes(keyword)) || 
           entity.context === 'personal';
  }

  /**
   * Find entity relationships
   */
  private findEntityRelationships(entity: EntityMatch, allEntities: EntityMatch[]): string[] {
    const relationships: string[] = [];
    
    // Find related entities based on proximity and type
    allEntities.forEach(otherEntity => {
      if (otherEntity !== entity) {
        const distance = Math.abs(entity.position - otherEntity.position);
        if (distance < 50) { // Within 50 characters
          relationships.push(`related_to_${otherEntity.type}`);
        }
      }
    });
    
    return relationships;
  }

  /**
   * Analyze entity relationships
   */
  private analyzeEntityRelationships(entities: ContextualEntity[]): any[] {
    const relationships: any[] = [];
    
    entities.forEach((entity, index) => {
      entities.slice(index + 1).forEach(otherEntity => {
        const relationship = this.determineRelationshipType(entity, otherEntity);
        if (relationship) {
          relationships.push({
            entity1: entity.entity.text,
            entity2: otherEntity.entity.text,
            type: relationship,
            confidence: 0.7
          });
        }
      });
    });
    
    return relationships;
  }

  /**
   * Determine relationship type
   */
  private determineRelationshipType(entity1: ContextualEntity, entity2: ContextualEntity): string | null {
    const type1 = entity1.entity.type;
    const type2 = entity2.entity.type;
    
    if (type1 === 'nik' && type2 === 'person_name') {
      return 'identity_link';
    }
    
    if (type1 === 'id' && type2 === 'document_type') {
      return 'document_reference';
    }
    
    if (type1 === 'person_name' && type2 === 'process_type') {
      return 'person_process';
    }
    
    return null;
  }

  /**
   * Generate entity insights
   */
  private generateEntityInsights(entities: ContextualEntity[], relationships: any[]): any[] {
    const insights: any[] = [];
    
    const nikEntities = entities.filter(e => e.entity.type === 'nik');
    if (nikEntities.length > 0) {
      insights.push({
        title: 'Identitas Terdeteksi',
        description: `Ditemukan ${nikEntities.length} NIK dalam query`,
        action: 'Verifikasi data identitas',
        confidence: 0.9
      });
    }
    
    const adminEntities = entities.filter(e => e.context.administrative);
    if (adminEntities.length > 0) {
      insights.push({
        title: 'Konteks Administratif',
        description: 'Query berkaitan dengan proses administratif',
        action: 'Lihat workflow administratif',
        confidence: 0.8
      });
    }
    
    return insights;
  }

  /**
   * Generate entity suggestions
   */
  private generateEntitySuggestions(entities: ContextualEntity[]): string[] {
    const suggestions: string[] = [];
    
    if (entities.length === 0) {
      suggestions.push('Coba sertakan informasi spesifik seperti NIK, nama, atau ID');
    }
    
    const hasNik = entities.some(e => e.entity.type === 'nik');
    if (!hasNik) {
      suggestions.push('Sertakan NIK untuk pencarian yang lebih akurat');
    }
    
    const hasDate = entities.some(e => e.entity.type === 'date');
    if (!hasDate) {
      suggestions.push('Tambahkan rentang tanggal untuk filter temporal');
    }
    
    return suggestions;
  }

  /**
   * Generate entity-specific suggestions
   */
  private generateEntitySpecificSuggestions(entity: EntityMatch, context: any): string[] {
    const suggestions: string[] = [];
    
    switch (entity.type) {
      case 'nik':
        suggestions.push('Verifikasi data pemilik NIK');
        suggestions.push('Lihat riwayat pengajuan');
        break;
      case 'document_type':
        suggestions.push('Cek status dokumen');
        suggestions.push('Lihat persyaratan dokumen');
        break;
      case 'person_name':
        suggestions.push('Cari berdasarkan nama lengkap');
        suggestions.push('Verifikasi identitas');
        break;
    }
    
    return suggestions;
  }

  /**
   * Generate entity follow-up questions
   */
  private generateEntityFollowUpQuestions(entities: ContextualEntity[]): string[] {
    const questions: string[] = [];
    
    const nikEntities = entities.filter(e => e.entity.type === 'nik');
    if (nikEntities.length > 0) {
      questions.push('Apakah Anda ingin melihat detail lengkap untuk NIK ini?');
    }
    
    const docEntities = entities.filter(e => e.entity.type === 'document_type');
    if (docEntities.length > 0) {
      questions.push('Apakah Anda ingin melihat status dokumen ini?');
    }
    
    questions.push('Apakah Anda memerlukan informasi tambahan tentang entitas yang ditemukan?');
    
    return questions;
  }

  /**
   * Generate entity summary
   */
  private generateEntitySummary(entities: ContextualEntity[]): string {
    if (entities.length === 0) {
      return 'Tidak ditemukan entitas yang dapat dikenali dalam query.';
    }
    
    const entityTypes = [...new Set(entities.map(e => e.entity.type))];
    const typeCount = entityTypes.length;
    const totalCount = entities.length;
    
    if (typeCount === 1) {
      return `Ditemukan ${totalCount} entitas bertipe ${entityTypes[0]}.`;
    } else {
      return `Ditemukan ${totalCount} entitas dengan ${typeCount} tipe berbeda: ${entityTypes.join(', ')}.`;
    }
  }

  /**
   * Initialize entity patterns
   */
  private initializeEntityPatterns(): void {
    // Initialize patterns for entity recognition
    this.entityPatterns.set('nik', /\b\d{16}\b/g);
    this.entityPatterns.set('phone', /\b(?:\+62|62|0)\d{8,12}\b/g);
    this.entityPatterns.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    this.entityPatterns.set('date', /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g);
    this.entityPatterns.set('id', /\bid\s*:?\s*(\d+)/gi);
    
    this.debug('Entity patterns initialized');
  }

  /**
   * Initialize contextual rules
   */
  private initializeContextualRules(): void {
    this.contextualRules.set('administrative', {
      keywords: ['pengajuan', 'permohonan', 'dokumen', 'berkas', 'surat'],
      weight: 0.8
    });
    
    this.contextualRules.set('business', {
      keywords: ['status', 'proses', 'workflow', 'approval', 'operator'],
      weight: 0.7
    });
    
    this.contextualRules.set('personal', {
      keywords: ['nama', 'alamat', 'telepon', 'email', 'identitas'],
      weight: 0.6
    });
    
    this.debug('Contextual rules initialized');
  }

  /**
   * Initialize administrative terms
   */
  private initializeAdministrativeTerms(): void {
    const terms = [
      'ktp', 'akta kelahiran', 'kartu keluarga', 'surat keterangan',
      'pengajuan', 'permohonan', 'aplikasi', 'formulir',
      'berkas', 'dokumen', 'surat', 'izin'
    ];
    
    terms.forEach(term => this.administrativeTerms.add(term));
    this.debug('Administrative terms initialized', { count: terms.length });
  }

  /**
   * Initialize business terms
   */
  private initializeBusinessTerms(): void {
    const terms = [
      'operator', 'admin', 'supervisor', 'manager',
      'duplicate', 'adjudicate', 'workflow', 'process',
      'approved', 'rejected', 'pending', 'status'
    ];
    
    terms.forEach(term => this.businessTerms.add(term));
    this.debug('Business terms initialized', { count: terms.length });
  }
}
