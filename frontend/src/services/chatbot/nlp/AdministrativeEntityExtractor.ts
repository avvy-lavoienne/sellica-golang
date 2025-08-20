/**
 * Administrative Entity Extractor - Day 21-22: Phase 3 Advanced Features
 * Advanced entity extraction for Indonesian administrative terms and documents
 * Specialized for government services and bureaucratic processes
 */

import { AdministrativeEntity } from './EnhancedIndonesianNLP';

export interface EntityPattern {
  type: string;
  subtype?: string;
  pattern: RegExp;
  confidence: number;
  validator?: (match: string) => boolean;
  metadata?: any;
}

export interface DocumentType {
  name: string;
  aliases: string[];
  category: string;
  requirements?: string[];
  issuingAuthority?: string;
}

export interface GovernmentInstitution {
  name: string;
  aliases: string[];
  level: 'national' | 'provincial' | 'city' | 'district' | 'village';
  services: string[];
}

export interface AdministrativeProcess {
  name: string;
  aliases: string[];
  category: string;
  requiredDocuments: string[];
  estimatedTime?: string;
}

/**
 * Administrative Entity Extractor
 * Specialized entity extraction for Indonesian administrative context
 */
export class AdministrativeEntityExtractor {
  private entityPatterns: EntityPattern[] = [];
  private documentTypes: Map<string, DocumentType> = new Map();
  private governmentInstitutions: Map<string, GovernmentInstitution> = new Map();
  private administrativeProcesses: Map<string, AdministrativeProcess> = new Map();
  private isInitialized = false;

  /**
   * Initialize Administrative Entity Extractor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📋 [ENTITY_EXTRACTOR] Initializing Administrative Entity Extractor...');
    
    try {
      // Initialize entity patterns
      this.initializeEntityPatterns();
      
      // Initialize document types
      this.initializeDocumentTypes();
      
      // Initialize government institutions
      this.initializeGovernmentInstitutions();
      
      // Initialize administrative processes
      this.initializeAdministrativeProcesses();
      
      this.isInitialized = true;
      
      console.log('✅ [ENTITY_EXTRACTOR] Administrative Entity Extractor initialized successfully');
    } catch (error) {
      console.error('❌ [ENTITY_EXTRACTOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Extract administrative entities from text
   */
  async extractAdministrativeEntities(text: string): Promise<AdministrativeEntity[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const entities: AdministrativeEntity[] = [];
    
    try {
      // Extract using patterns
      const patternEntities = await this.extractWithPatterns(text);
      entities.push(...patternEntities);
      
      // Extract document types
      const documentEntities = await this.extractDocumentTypes(text);
      entities.push(...documentEntities);
      
      // Extract government institutions
      const institutionEntities = await this.extractGovernmentInstitutions(text);
      entities.push(...institutionEntities);
      
      // Extract administrative processes
      const processEntities = await this.extractAdministrativeProcesses(text);
      entities.push(...processEntities);
      
      // Remove duplicates and sort by confidence
      const uniqueEntities = this.removeDuplicateEntities(entities);
      const sortedEntities = uniqueEntities.sort((a, b) => b.confidence - a.confidence);
      
      console.log(`📋 [ENTITY_EXTRACTOR] Extracted ${sortedEntities.length} administrative entities`);
      
      return sortedEntities;
    } catch (error) {
      console.error('❌ [ENTITY_EXTRACTOR] Failed to extract entities:', error);
      return [];
    }
  }

  /**
   * Extract entities using patterns
   */
  private async extractWithPatterns(text: string): Promise<AdministrativeEntity[]> {
    const entities: AdministrativeEntity[] = [];
    
    for (const pattern of this.entityPatterns) {
      const matches = text.matchAll(pattern.pattern);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          const value = match[0];
          
          // Validate if validator exists
          if (pattern.validator && !pattern.validator(value)) {
            continue;
          }
          
          entities.push({
            type: pattern.type,
            subtype: pattern.subtype,
            value,
            confidence: pattern.confidence,
            metadata: pattern.metadata || {},
            position: {
              start: match.index,
              end: match.index + value.length
            }
          });
        }
      }
    }
    
    return entities;
  }

  /**
   * Extract document types
   */
  private async extractDocumentTypes(text: string): Promise<AdministrativeEntity[]> {
    const entities: AdministrativeEntity[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [docKey, docType] of this.documentTypes) {
      // Check main name
      const nameRegex = new RegExp(`\\b${docType.name.toLowerCase()}\\b`, 'g');
      let match;
      
      while ((match = nameRegex.exec(lowerText)) !== null) {
        entities.push({
          type: 'DOCUMENT_TYPE',
          subtype: docKey,
          value: docType.name,
          confidence: 0.9,
          metadata: {
            category: docType.category,
            issuingAuthority: docType.issuingAuthority,
            requirements: docType.requirements
          },
          position: {
            start: match.index,
            end: match.index + docType.name.length
          }
        });
      }
      
      // Check aliases
      for (const alias of docType.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'g');
        let aliasMatch;
        
        while ((aliasMatch = aliasRegex.exec(lowerText)) !== null) {
          entities.push({
            type: 'DOCUMENT_TYPE',
            subtype: docKey,
            value: alias,
            confidence: 0.85,
            metadata: {
              category: docType.category,
              issuingAuthority: docType.issuingAuthority,
              canonicalName: docType.name
            },
            position: {
              start: aliasMatch.index,
              end: aliasMatch.index + alias.length
            }
          });
        }
      }
    }
    
    return entities;
  }

  /**
   * Extract government institutions
   */
  private async extractGovernmentInstitutions(text: string): Promise<AdministrativeEntity[]> {
    const entities: AdministrativeEntity[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [instKey, institution] of this.governmentInstitutions) {
      // Check main name
      const nameRegex = new RegExp(`\\b${institution.name.toLowerCase()}\\b`, 'g');
      let match;
      
      while ((match = nameRegex.exec(lowerText)) !== null) {
        entities.push({
          type: 'GOVERNMENT_INSTITUTION',
          subtype: institution.level,
          value: institution.name,
          confidence: 0.9,
          metadata: {
            level: institution.level,
            services: institution.services
          },
          position: {
            start: match.index,
            end: match.index + institution.name.length
          }
        });
      }
      
      // Check aliases
      for (const alias of institution.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'g');
        let aliasMatch;
        
        while ((aliasMatch = aliasRegex.exec(lowerText)) !== null) {
          entities.push({
            type: 'GOVERNMENT_INSTITUTION',
            subtype: institution.level,
            value: alias,
            confidence: 0.85,
            metadata: {
              level: institution.level,
              canonicalName: institution.name,
              services: institution.services
            },
            position: {
              start: aliasMatch.index,
              end: aliasMatch.index + alias.length
            }
          });
        }
      }
    }
    
    return entities;
  }

  /**
   * Extract administrative processes
   */
  private async extractAdministrativeProcesses(text: string): Promise<AdministrativeEntity[]> {
    const entities: AdministrativeEntity[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [processKey, process] of this.administrativeProcesses) {
      // Check main name
      const nameRegex = new RegExp(`\\b${process.name.toLowerCase()}\\b`, 'g');
      let match;
      
      while ((match = nameRegex.exec(lowerText)) !== null) {
        entities.push({
          type: 'ADMINISTRATIVE_PROCESS',
          subtype: process.category,
          value: process.name,
          confidence: 0.8,
          metadata: {
            category: process.category,
            requiredDocuments: process.requiredDocuments,
            estimatedTime: process.estimatedTime
          },
          position: {
            start: match.index,
            end: match.index + process.name.length
          }
        });
      }
      
      // Check aliases
      for (const alias of process.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'g');
        let aliasMatch;
        
        while ((aliasMatch = aliasRegex.exec(lowerText)) !== null) {
          entities.push({
            type: 'ADMINISTRATIVE_PROCESS',
            subtype: process.category,
            value: alias,
            confidence: 0.75,
            metadata: {
              category: process.category,
              canonicalName: process.name,
              requiredDocuments: process.requiredDocuments
            },
            position: {
              start: aliasMatch.index,
              end: aliasMatch.index + alias.length
            }
          });
        }
      }
    }
    
    return entities;
  }

  /**
   * Initialize entity patterns
   */
  private initializeEntityPatterns(): void {
    this.entityPatterns = [
      // NIK (Indonesian ID Number) - 16 digits
      {
        type: 'PERSONAL_ID',
        subtype: 'NIK',
        pattern: /\b\d{16}\b/g,
        confidence: 0.95,
        validator: (nik: string) => this.validateNIK(nik),
        metadata: { description: 'Nomor Induk Kependudukan' }
      },
      
      // Phone numbers (Indonesian format)
      {
        type: 'CONTACT',
        subtype: 'PHONE',
        pattern: /\b(?:\+62|62|0)\d{8,12}\b/g,
        confidence: 0.9,
        validator: (phone: string) => this.validatePhoneNumber(phone),
        metadata: { description: 'Indonesian phone number' }
      },
      
      // Email addresses
      {
        type: 'CONTACT',
        subtype: 'EMAIL',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        confidence: 0.95,
        metadata: { description: 'Email address' }
      },
      
      // NPWP (Tax ID) - 15 digits with dots
      {
        type: 'TAX_ID',
        subtype: 'NPWP',
        pattern: /\b\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}\b/g,
        confidence: 0.95,
        metadata: { description: 'Nomor Pokok Wajib Pajak' }
      },
      
      // Postal codes (Indonesian format) - 5 digits
      {
        type: 'ADDRESS',
        subtype: 'POSTAL_CODE',
        pattern: /\b\d{5}\b/g,
        confidence: 0.7,
        validator: (code: string) => this.validatePostalCode(code),
        metadata: { description: 'Indonesian postal code' }
      },
      
      // Dates (various Indonesian formats)
      {
        type: 'DATE',
        subtype: 'GENERAL',
        pattern: /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b|\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/gi,
        confidence: 0.8,
        metadata: { description: 'Date in Indonesian format' }
      },
      
      // Currency (Indonesian Rupiah)
      {
        type: 'CURRENCY',
        subtype: 'IDR',
        pattern: /\bRp\.?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b|\b\d{1,3}(?:\.\d{3})*\s*rupiah\b/gi,
        confidence: 0.9,
        metadata: { description: 'Indonesian Rupiah currency' }
      }
    ];
    
    console.log('✅ [ENTITY_EXTRACTOR] Entity patterns initialized');
  }

  /**
   * Initialize document types
   */
  private initializeDocumentTypes(): void {
    const documentTypes = [
      {
        key: 'ktp',
        name: 'Kartu Tanda Penduduk',
        aliases: ['KTP', 'e-KTP', 'kartu identitas', 'kartu penduduk'],
        category: 'identity',
        issuingAuthority: 'Dinas Kependudukan dan Pencatatan Sipil',
        requirements: ['Foto 3x4', 'Surat Pengantar RT/RW', 'Kartu Keluarga']
      },
      {
        key: 'kk',
        name: 'Kartu Keluarga',
        aliases: ['KK', 'kartu keluarga'],
        category: 'family',
        issuingAuthority: 'Dinas Kependudukan dan Pencatatan Sipil',
        requirements: ['Surat Nikah/Cerai', 'KTP', 'Surat Pengantar RT/RW']
      },
      {
        key: 'akta_kelahiran',
        name: 'Akta Kelahiran',
        aliases: ['akta kelahiran', 'akta lahir', 'surat kelahiran'],
        category: 'civil_registration',
        issuingAuthority: 'Dinas Kependudukan dan Pencatatan Sipil',
        requirements: ['Surat Keterangan Lahir dari RS/Bidan', 'KTP Orang Tua', 'KK', 'Surat Nikah Orang Tua']
      },
      {
        key: 'sim',
        name: 'Surat Izin Mengemudi',
        aliases: ['SIM', 'surat izin mengemudi', 'surat izin berkendara', 'sim a', 'sim b', 'sim c'],
        category: 'license',
        issuingAuthority: 'Kepolisian Republik Indonesia',
        requirements: ['KTP', 'Surat Sehat', 'Pas Foto', 'Tes Praktik dan Teori']
      },
      {
        key: 'paspor',
        name: 'Paspor',
        aliases: ['paspor', 'passport', 'dokumen perjalanan'],
        category: 'travel',
        issuingAuthority: 'Kantor Imigrasi',
        requirements: ['KTP', 'KK', 'Akta Kelahiran', 'Pas Foto', 'Surat Sponsor']
      },
      {
        key: 'npwp',
        name: 'Nomor Pokok Wajib Pajak',
        aliases: ['NPWP', 'nomor pokok wajib pajak', 'kartu pajak'],
        category: 'tax',
        issuingAuthority: 'Direktorat Jenderal Pajak',
        requirements: ['KTP', 'Surat Keterangan Kerja/Usaha']
      }
    ];
    
    documentTypes.forEach(doc => {
      this.documentTypes.set(doc.key, doc);
    });
    
    console.log('✅ [ENTITY_EXTRACTOR] Document types initialized');
  }

  /**
   * Initialize government institutions
   */
  private initializeGovernmentInstitutions(): void {
    const institutions = [
      {
        key: 'disdukcapil',
        name: 'Dinas Kependudukan dan Pencatatan Sipil',
        aliases: ['Disdukcapil', 'Dinas Dukcapil', 'Catatan Sipil'],
        level: 'city' as const,
        services: ['KTP', 'KK', 'Akta Kelahiran', 'Akta Kematian', 'Akta Nikah']
      },
      {
        key: 'polri',
        name: 'Kepolisian Republik Indonesia',
        aliases: ['Polri', 'Polisi', 'Kepolisian'],
        level: 'national' as const,
        services: ['SIM', 'SKCK', 'Laporan Kehilangan']
      },
      {
        key: 'imigrasi',
        name: 'Kantor Imigrasi',
        aliases: ['Imigrasi', 'Kantor Imigrasi'],
        level: 'city' as const,
        services: ['Paspor', 'Visa', 'Izin Tinggal']
      },
      {
        key: 'pajak',
        name: 'Kantor Pelayanan Pajak',
        aliases: ['KPP', 'Kantor Pajak', 'Dirjen Pajak'],
        level: 'city' as const,
        services: ['NPWP', 'SPT', 'Pembayaran Pajak']
      },
      {
        key: 'kelurahan',
        name: 'Kelurahan',
        aliases: ['Kelurahan', 'Lurah'],
        level: 'village' as const,
        services: ['Surat Pengantar', 'Surat Keterangan', 'Surat Domisili']
      },
      {
        key: 'kecamatan',
        name: 'Kecamatan',
        aliases: ['Kecamatan', 'Camat'],
        level: 'district' as const,
        services: ['Legalisir', 'Surat Keterangan', 'Perizinan']
      }
    ];
    
    institutions.forEach(inst => {
      this.governmentInstitutions.set(inst.key, inst);
    });
    
    console.log('✅ [ENTITY_EXTRACTOR] Government institutions initialized');
  }

  /**
   * Initialize administrative processes
   */
  private initializeAdministrativeProcesses(): void {
    const processes = [
      {
        key: 'pembuatan_ktp',
        name: 'Pembuatan KTP',
        aliases: ['bikin KTP', 'buat KTP', 'mengurus KTP', 'daftar KTP'],
        category: 'document_creation',
        requiredDocuments: ['Kartu Keluarga', 'Surat Pengantar RT/RW', 'Pas Foto'],
        estimatedTime: '1-2 minggu'
      },
      {
        key: 'perpanjangan_sim',
        name: 'Perpanjangan SIM',
        aliases: ['perpanjang SIM', 'extend SIM', 'renewal SIM'],
        category: 'document_renewal',
        requiredDocuments: ['SIM Lama', 'KTP', 'Surat Sehat', 'Pas Foto'],
        estimatedTime: '1 hari'
      },
      {
        key: 'pengajuan_paspor',
        name: 'Pengajuan Paspor',
        aliases: ['ajukan paspor', 'buat paspor', 'apply paspor'],
        category: 'document_application',
        requiredDocuments: ['KTP', 'KK', 'Akta Kelahiran', 'Pas Foto'],
        estimatedTime: '3-5 hari kerja'
      },
      {
        key: 'pendaftaran_npwp',
        name: 'Pendaftaran NPWP',
        aliases: ['daftar NPWP', 'buat NPWP', 'register NPWP'],
        category: 'tax_registration',
        requiredDocuments: ['KTP', 'Surat Keterangan Kerja'],
        estimatedTime: '1 hari'
      }
    ];
    
    processes.forEach(proc => {
      this.administrativeProcesses.set(proc.key, proc);
    });
    
    console.log('✅ [ENTITY_EXTRACTOR] Administrative processes initialized');
  }

  /**
   * Validation methods
   */
  private validateNIK(nik: string): boolean {
    // Basic NIK validation - 16 digits
    if (nik.length !== 16) return false;
    
    // Check if all digits
    if (!/^\d{16}$/.test(nik)) return false;
    
    // Additional validation could include:
    // - Province code validation (first 2 digits)
    // - City/Regency code validation (digits 3-4)
    // - District code validation (digits 5-6)
    // - Birth date validation (digits 7-12)
    // - Gender validation (digit 13-14)
    // - Sequence validation (digits 15-16)
    
    return true;
  }

  private validatePhoneNumber(phone: string): boolean {
    // Remove country code and check length
    const cleaned = phone.replace(/^(\+62|62|0)/, '');
    return cleaned.length >= 8 && cleaned.length <= 12;
  }

  private validatePostalCode(code: string): boolean {
    // Indonesian postal codes are 5 digits
    return /^\d{5}$/.test(code);
  }

  /**
   * Remove duplicate entities
   */
  private removeDuplicateEntities(entities: AdministrativeEntity[]): AdministrativeEntity[] {
    const seen = new Set<string>();
    const unique: AdministrativeEntity[] = [];
    
    for (const entity of entities) {
      const key = `${entity.type}_${entity.value}_${entity.position.start}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entity);
      }
    }
    
    return unique;
  }

  /**
   * Get extraction statistics
   */
  getExtractionStatistics(): any {
    return {
      entityPatternsLoaded: this.entityPatterns.length,
      documentTypesLoaded: this.documentTypes.size,
      governmentInstitutionsLoaded: this.governmentInstitutions.size,
      administrativeProcessesLoaded: this.administrativeProcesses.size,
      isInitialized: this.isInitialized
    };
  }
}
