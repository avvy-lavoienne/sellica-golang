/**
 * Indonesian Language Cache for SELLY AI
 * Phase 3: Indonesian Civil Registration Services Optimization
 * 
 * Specialized caching for Indonesian administrative queries with
 * language pattern matching, misspelling correction, and service-specific optimization
 */

import { UpstashCacheService } from './upstashCacheService';
import { UpstashCacheServiceSingleton } from './UpstashCacheServiceFactory';
import { getServiceCacheConfig } from '@/config/cache';

export interface IndonesianQueryPattern {
  pattern: string;
  variations: string[];
  serviceType: string;
  confidence: number;
  commonMisspellings: string[];
  informalVariations: string[];
  keywords: string[];
}

export interface IndonesianCacheEntry {
  content: string;
  serviceType: string;
  confidence: number;
  language: 'formal' | 'informal';
  region: 'garut' | 'general';
  timestamp: string;
  useCount: number;
}

export class IndonesianLanguageCache {
  private upstashCache: UpstashCacheService;
  private languagePatterns: Map<string, IndonesianQueryPattern> = new Map();
  private static instance: IndonesianLanguageCache;

  private constructor() {
    this.upstashCache = UpstashCacheServiceSingleton.getInstance('indonesian-lang');
    this.initializeLanguagePatterns();
    // console.log(
  }

  public static getInstance(): IndonesianLanguageCache {
    if (!IndonesianLanguageCache.instance) {
      IndonesianLanguageCache.instance = new IndonesianLanguageCache();
    }
    return IndonesianLanguageCache.instance;
  }

  /**
   * Initialize Indonesian language patterns for common administrative queries
   */
  private initializeLanguagePatterns(): void {
    const patterns: IndonesianQueryPattern[] = [
      {
        pattern: 'persyaratan_ktp',
        variations: [
          'persyaratan membuat KTP',
          'syarat bikin KTP',
          'cara buat KTP baru',
          'dokumen untuk KTP',
          'persyaratan KTP baru',
          'syarat membuat KTP'
        ],
        serviceType: 'ktp',
        confidence: 0.95,
        commonMisspellings: ['persyartan', 'persyaratan', 'syarat2', 'KTP'],
        informalVariations: ['gimana bikin KTP', 'mau buat KTP', 'KTP hilang', 'bikin KTP dong'],
        keywords: ['ktp', 'kartu', 'tanda', 'penduduk', 'identitas']
      },
      {
        pattern: 'akta_kelahiran',
        variations: [
          'cara mengurus akta kelahiran',
          'bikin akta lahir',
          'syarat akta kelahiran',
          'dokumen akta bayi',
          'persyaratan akta kelahiran',
          'cara buat akta kelahiran'
        ],
        serviceType: 'akta_kelahiran',
        confidence: 0.92,
        commonMisspellings: ['akte', 'akta kelahiran', 'akte lahir', 'akta lahir'],
        informalVariations: ['akta bayi', 'surat lahir', 'dokumen bayi', 'akte anak'],
        keywords: ['akta', 'kelahiran', 'lahir', 'bayi', 'anak']
      },
      {
        pattern: 'kartu_keluarga',
        variations: [
          'cara buat kartu keluarga',
          'syarat KK baru',
          'perpanjang KK',
          'tambah anggota keluarga',
          'persyaratan kartu keluarga',
          'dokumen KK'
        ],
        serviceType: 'kartu_keluarga',
        confidence: 0.90,
        commonMisspellings: ['KK', 'kartu keluarga', 'kk baru', 'kartu kel'],
        informalVariations: ['KK hilang', 'ganti KK', 'update KK', 'tambah KK'],
        keywords: ['kartu', 'keluarga', 'kk', 'anggota', 'keluarga']
      },
      {
        pattern: 'pindah_domisili',
        variations: [
          'cara pindah domisili',
          'syarat pindah alamat',
          'perpindahan penduduk',
          'mutasi kependudukan',
          'pindah tempat tinggal'
        ],
        serviceType: 'pindah_domisili',
        confidence: 0.88,
        commonMisspellings: ['pindah domisili', 'pindah alamat', 'mutasi'],
        informalVariations: ['mau pindah', 'pindah rumah', 'ganti alamat'],
        keywords: ['pindah', 'domisili', 'alamat', 'mutasi', 'perpindahan']
      },
      {
        pattern: 'legalisir_dokumen',
        variations: [
          'cara legalisir dokumen',
          'syarat legalisir',
          'pengesahan dokumen',
          'legalisasi berkas',
          'dokumen yang perlu dilegalisir'
        ],
        serviceType: 'legalisir',
        confidence: 0.85,
        commonMisspellings: ['legalisasi', 'legalisir', 'pengesahan'],
        informalVariations: ['gesah dokumen', 'sahkan berkas', 'cap dokumen'],
        keywords: ['legalisir', 'legalisasi', 'pengesahan', 'dokumen', 'berkas']
      }
    ];

    patterns.forEach(pattern => {
      this.languagePatterns.set(pattern.pattern, pattern);
    });

    console.log(`📋 [INDONESIAN_CACHE] Loaded ${patterns.length} Indonesian language patterns`);
  }

  /**
   * Get cached Indonesian response with pattern matching
   */
  async getCachedIndonesianResponse(query: string): Promise<IndonesianCacheEntry | null> {
    try {
      // Normalize Indonesian query
      const normalizedQuery = this.normalizeIndonesianQuery(query);
      
      // Try exact match first
      const exactMatch = await this.upstashCache.get<IndonesianCacheEntry>(`id-exact:${normalizedQuery}`);
      if (exactMatch) {
        console.log(`🎯 [INDONESIAN_CACHE] Exact match found for: ${query}`);
        await this.incrementUseCount(exactMatch, `id-exact:${normalizedQuery}`);
        return exactMatch;
      }

      // Try pattern matching
      for (const [patternKey, pattern] of this.languagePatterns.entries()) {
        if (this.matchesPattern(normalizedQuery, pattern)) {
          const cachedResponse = await this.upstashCache.get<IndonesianCacheEntry>(`id-pattern:${patternKey}`);
          if (cachedResponse) {
            console.log(`🎯 [INDONESIAN_CACHE] Pattern match found: ${patternKey} for query: ${query}`);
            
            // Cache the specific query for faster future access
            await this.upstashCache.set(`id-exact:${normalizedQuery}`, cachedResponse, 12 * 60 * 60);
            await this.incrementUseCount(cachedResponse, `id-pattern:${patternKey}`);
            
            return cachedResponse;
          }
        }
      }

      // console.log(
      return null;

    } catch (error) {
      // console.error( [INDONESIAN_CACHE] Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache Indonesian response with service-specific optimization
   */
  async cacheIndonesianResponse(
    query: string,
    response: string,
    serviceType: string,
    confidence: number = 0.8,
    language: 'formal' | 'informal' = 'formal'
  ): Promise<void> {
    try {
      const normalizedQuery = this.normalizeIndonesianQuery(query);
      const ttl = this.calculateIndonesianTTL(serviceType, confidence);

      const cacheEntry: IndonesianCacheEntry = {
        content: response,
        serviceType,
        confidence,
        language,
        region: 'garut',
        timestamp: new Date().toISOString(),
        useCount: 1
      };

      // Cache exact query
      await this.upstashCache.set(`id-exact:${normalizedQuery}`, cacheEntry, ttl);

      // Cache by service type pattern
      const pattern = this.findMatchingPattern(serviceType);
      if (pattern) {
        await this.upstashCache.set(`id-pattern:${pattern}`, cacheEntry, ttl * 2); // Longer TTL for patterns
      }

      console.log(`💾 [INDONESIAN_CACHE] Cached response for service: ${serviceType}, TTL: ${ttl}s`);

    } catch (error) {
      // console.error( [INDONESIAN_CACHE] Error caching response:', error);
    }
  }

  /**
   * Normalize Indonesian query for consistent caching
   */
  private normalizeIndonesianQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim()
      // Common misspelling corrections
      .replace(/akte/g, 'akta')
      .replace(/persyartan/g, 'persyaratan')
      .replace(/syarat2/g, 'syarat')
      // Informal to formal conversions
      .replace(/gimana/g, 'bagaimana')
      .replace(/bikin/g, 'membuat')
      .replace(/dong/g, '')
      .replace(/nih/g, '')
      .replace(/sih/g, '')
      // Regional variations
      .replace(/gesah/g, 'legalisir')
      .replace(/sahkan/g, 'legalisir');
  }

  /**
   * Check if query matches Indonesian pattern
   */
  private matchesPattern(query: string, pattern: IndonesianQueryPattern): boolean {
    // Check keywords first (most efficient)
    const hasKeyword = pattern.keywords.some(keyword => query.includes(keyword));
    if (!hasKeyword) return false;

    // Check variations
    for (const variation of pattern.variations) {
      if (query.includes(variation.toLowerCase())) return true;
    }

    // Check informal variations
    for (const informal of pattern.informalVariations) {
      if (query.includes(informal.toLowerCase())) return true;
    }

    // Check misspellings
    for (const misspelling of pattern.commonMisspellings) {
      if (query.includes(misspelling.toLowerCase())) return true;
    }

    return false;
  }

  /**
   * Calculate TTL based on Indonesian service type and confidence
   */
  private calculateIndonesianTTL(serviceType: string, confidence: number): number {
    const serviceConfig = getServiceCacheConfig(serviceType);
    const baseTTL = serviceConfig.ttl;
    
    // Adjust TTL based on confidence
    return Math.floor(baseTTL * (0.5 + confidence));
  }

  /**
   * Find matching pattern for service type
   */
  private findMatchingPattern(serviceType: string): string | null {
    for (const [patternKey, pattern] of this.languagePatterns.entries()) {
      if (pattern.serviceType === serviceType) {
        return patternKey;
      }
    }
    return null;
  }

  /**
   * Increment use count for cached entry
   */
  private async incrementUseCount(entry: IndonesianCacheEntry, cacheKey: string): Promise<void> {
    try {
      entry.useCount = (entry.useCount || 0) + 1;
      const ttl = this.calculateIndonesianTTL(entry.serviceType, entry.confidence);
      await this.upstashCache.set(cacheKey, entry, ttl);
    } catch (error) {
      // console.warn(️ [INDONESIAN_CACHE] Failed to increment use count:', error);
    }
  }

  /**
   * Get cache statistics for Indonesian queries
   */
  async getIndonesianCacheStats(): Promise<{
    totalPatterns: number;
    serviceTypes: string[];
    mostUsedPatterns: Array<{ pattern: string; serviceType: string }>;
  }> {
    return {
      totalPatterns: this.languagePatterns.size,
      serviceTypes: Array.from(new Set(Array.from(this.languagePatterns.values()).map(p => p.serviceType))),
      mostUsedPatterns: Array.from(this.languagePatterns.entries()).map(([pattern, data]) => ({
        pattern,
        serviceType: data.serviceType
      }))
    };
  }
}
