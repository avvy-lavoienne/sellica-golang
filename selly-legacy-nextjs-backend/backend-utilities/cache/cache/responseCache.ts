/**
 * Response Cache Warming System
 * Pre-populates cache with common queries to improve response times
 */

import { UpstashCacheService } from './upstashCacheService';
import { UpstashCacheServiceSingleton } from './UpstashCacheServiceFactory';
// Phase 1: Cache Key Unification
import { UnifiedCacheKeyGenerator } from './UnifiedCacheKeyGenerator';

export class ResponseCacheWarmer {
  private static instance: ResponseCacheWarmer;
  private upstashCache: UpstashCacheService;
  private warmed: boolean = false;

  private constructor() {
    this.upstashCache = UpstashCacheServiceSingleton.getInstance('selly-cache-warmer');
  }

  public static getInstance(): ResponseCacheWarmer {
    if (!ResponseCacheWarmer.instance) {
      ResponseCacheWarmer.instance = new ResponseCacheWarmer();
    }
    return ResponseCacheWarmer.instance;
  }

  /**
   * Common greetings and queries to pre-warm cache
   */
  private readonly COMMON_QUERIES = [
    // Greetings
    { query: 'halo selly', response: 'Selamat siang! 🌞 Saya SELLY, asisten AI dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Ada yang bisa saya bantu hari ini?' },
    { query: 'hai selly', response: 'Hai juga! 👋 Saya SELLY, siap membantu Anda dengan layanan kependudukan. Silakan tanyakan apa saja!' },
    { query: 'selamat pagi', response: 'Selamat pagi! ☀️ Saya SELLY dari Disdukcapil Garut. Bagaimana saya bisa membantu Anda hari ini?' },
    { query: 'selamat siang', response: 'Selamat siang! 🌞 Saya SELLY, asisten AI untuk layanan kependudukan. Ada yang ingin ditanyakan?' },
    { query: 'selamat sore', response: 'Selamat sore! 🌅 Saya SELLY dari Dinas Kependudukan Garut. Silakan sampaikan pertanyaan Anda!' },
    
    // Common services
    { query: 'cara buat ktp', response: 'Untuk membuat KTP baru, Anda perlu menyiapkan dokumen berikut...' },
    { query: 'syarat kk baru', response: 'Syarat pembuatan Kartu Keluarga (KK) baru adalah...' },
    { query: 'akta kelahiran', response: 'Untuk mengurus akta kelahiran, berikut persyaratannya...' },
    { query: 'jam operasional', response: 'Jam operasional Disdukcapil Garut: Senin-Jumat 08:00-15:00 WIB' },
    { query: 'lokasi kantor', response: 'Kantor Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut berlokasi di...' },
    
    // Help queries
    { query: 'bantuan', response: 'Saya siap membantu! Anda bisa bertanya tentang layanan KTP, KK, Akta Kelahiran, dan layanan kependudukan lainnya.' },
    { query: 'help', response: 'Halo! Saya SELLY, asisten AI untuk layanan kependudukan. Silakan tanyakan tentang dokumen yang Anda butuhkan!' }
  ];

  /**
   * Warm up cache with common queries
   */
  public async warmCache(): Promise<void> {
    if (this.warmed) return;

    try {
      console.log('🔥 [CACHE_WARMER] Warming up response cache...');
      
      const warmPromises = this.COMMON_QUERIES.map(async ({ query, response }) => {
        try {
          // Phase 1: Use UnifiedCacheKeyGenerator for consistent cache warming
          if (UnifiedCacheKeyGenerator.isEnabled()) {
            // Generate unified cache keys for all layers
            const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, 'warming_user');

            const responseData = {
              content: response,
              type: 'administrative',
              metadata: {
                confidence: 0.98,
                processingTime: 50,
                model: 'Unified Cache Warmer',
                knowledgeUsed: true,
                cached: true,
                warmed: true
              }
            };

            // Warm all cache layers with consistent keys
            await Promise.all([
              this.upstashCache.set(keys.l2_upstash, responseData, 3600),
              this.upstashCache.set(keys.exact, responseData, 3600),
              this.upstashCache.set(keys.l0_indonesian, responseData, 3600)
            ]);
          } else {
            // Fallback to legacy cache warming for backward compatibility
            const cacheKey = `selly-responses:query:${query.replace(/\s+/g, '_').toLowerCase()}`;
            await this.upstashCache.set(cacheKey, {
              content: response,
              type: 'administrative',
              metadata: {
                confidence: 0.98,
                processingTime: 50,
                model: 'Legacy Cache Warmer',
                knowledgeUsed: true,
                cached: true,
                warmed: true
              }
            }, 3600);

            const exactKey = `exact:${query}`;
            await this.upstashCache.set(exactKey, {
              content: response,
              type: 'administrative',
              metadata: {
                confidence: 0.98,
                processingTime: 30,
                model: 'Legacy Exact Cache Warmer',
                knowledgeUsed: true,
                cached: true,
                warmed: true
              }
            }, 3600);
          }

        } catch (error) {
          // Silently continue if individual cache warming fails
        }
      });

      await Promise.all(warmPromises);
      this.warmed = true;
      
      console.log(`✅ [CACHE_WARMER] Cache warmed with ${this.COMMON_QUERIES.length} common queries`);
      
    } catch (error) {
      console.error('❌ [CACHE_WARMER] Failed to warm cache:', error);
    }
  }

  /**
   * Check if cache is warmed
   */
  public isWarmed(): boolean {
    return this.warmed;
  }

  /**
   * Add custom query to warm cache
   */
  public async addToWarmCache(query: string, response: string): Promise<void> {
    try {
      // Add to Upstash cache
      const cacheKey = `selly-responses:query:${query.replace(/\s+/g, '_').toLowerCase()}`;
      await this.upstashCache.set(cacheKey, {
        content: response,
        type: 'administrative',
        metadata: {
          confidence: 0.95,
          processingTime: 50,
          model: 'Custom Cache Warmer',
          knowledgeUsed: true,
          cached: true,
          warmed: true
        }
      }, 3600);

      // Also add exact key format
      const exactKey = `exact:${query}`;
      await this.upstashCache.set(exactKey, {
        content: response,
        type: 'administrative',
        metadata: {
          confidence: 0.95,
          processingTime: 30,
          model: 'Custom Exact Cache Warmer',
          knowledgeUsed: true,
          cached: true,
          warmed: true
        }
      }, 3600);

    } catch (error) {
      console.error('❌ [CACHE_WARMER] Failed to add custom warm cache:', error);
    }
  }

  /**
   * Clear warmed cache
   */
  public async clearWarmCache(): Promise<void> {
    try {
      // Clear specific warmed entries from Upstash cache
      for (const { query } of this.COMMON_QUERIES) {
        const cacheKey = `selly-responses:query:${query.replace(/\s+/g, '_').toLowerCase()}`;
        await this.upstashCache.delete(cacheKey);

        const exactKey = `exact:${query}`;
        await this.upstashCache.delete(exactKey);
      }

      this.warmed = false;
      console.log('🧹 [CACHE_WARMER] Warmed cache cleared');

    } catch (error) {
      console.error('❌ [CACHE_WARMER] Failed to clear warm cache:', error);
    }
  }
}

export default ResponseCacheWarmer;
