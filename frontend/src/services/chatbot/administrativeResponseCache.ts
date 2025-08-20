/**
 * Administrative Response Cache Service
 * Phase 1 Priority 1 Performance Optimization
 * 
 * Provides intelligent caching for administrative queries to reduce
 * fallback generation time from 2.1s to <500ms
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export interface CachedResponse {
  id: string;
  query: string;
  normalizedQuery: string;
  response: string;
  responseType: 'administrative' | 'procedural' | 'requirement' | 'general';
  serviceType: string;
  confidence: number;
  createdAt: string;
  lastUsed: string;
  useCount: number;
  tags: string[];
  metadata: {
    processingTime: number;
    originalSource: 'knowledge_base' | 'fallback' | 'template';
    validationStatus: 'verified' | 'pending' | 'needs_review';
  };
}

export interface CacheStatistics {
  totalCachedResponses: number;
  hitRate: number;
  averageResponseTime: number;
  mostUsedQueries: Array<{ query: string; count: number }>;
  cacheEfficiency: number;
  memoryUsage: number;
}

export class AdministrativeResponseCache {
  private static instance: AdministrativeResponseCache;
  private cache: Map<string, CachedResponse> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private initialized = false;
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SIMILARITY_THRESHOLD = 0.85;

  // Pre-computed administrative responses
  private readonly ADMINISTRATIVE_TEMPLATES = {
    'persyaratan_dokumen': {
      pattern: /^(?!.*(ktp|ktp-el|kartu\s+tanda\s+penduduk|kia|kartu\s+identitas\s+anak|kartu\s+keluarga|kk\s+|akta\s+kelahiran|akta\s+perkawinan|akta\s+perceraian|akta\s+kematian|akta\s+pengakuan\s+anak|akta\s+pengesahan\s+anak|pengakuan\s+anak|pengesahan\s+anak|biodata\s+penduduk|kepindahan|pindah\s+domisili|skpwni|skdwni|skpln|surat\s+keterangan\s+pindah|surat\s+kedatangan|perubahan\s+elemen\s+data|perubahan\s+data|koreksi\s+data|pembatalan\s+perkawinan|pembatalan\s+perceraian|kutipan\s+akta|salinan\s+akta|duplikat\s+akta|legalisir|legalisasi|keabsahan\s+dokumen|verifikasi\s+dokumen|validasi\s+dokumen|skdln|perubahan\s+status\s+wna|itas|itap|surat\s+pindah\s+datang|surat\s+domisili|surat\s+keterangan\s+tidak\s+mampu|surat\s+keterangan\s+belum\s+menikah|surat\s+keterangan\s+beda\s+nama|surat\s+keterangan\s+kelahiran|surat\s+keterangan\s+kematian|surat\s+keterangan\s+usaha|surat\s+keterangan\s+penghasilan|surat\s+keterangan\s+ahli\s+waris)).*(persyaratan|syarat|dokumen|berkas|kelengkapan).*$/i,
      response: `📋 **Persyaratan Dokumen Kependudukan**

Untuk pengajuan dokumen kependudukan, Anda memerlukan:

**📄 Dokumen Umum:**
• Fotokopi KTP yang masih berlaku
• Fotokopi Kartu Keluarga (KK)
• Pas foto terbaru sesuai ketentuan
• Surat pengantar dari RT/RW

**📋 Dokumen Khusus:**
• Akta kelahiran (untuk KTP pertama)
• Surat nikah/cerai (jika ada perubahan status)
• Surat pindah (untuk mutasi penduduk)

**⏰ Waktu Pelayanan:**
• Senin - Jumat: 08.00 - 15.00 WIB
• Sabtu: 08.00 - 12.00 WIB

**📍 Lokasi:** Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut

Apakah ada dokumen khusus yang ingin Anda tanyakan? 😊`,
      serviceType: 'administrasi_kependudukan',
      confidence: 0.9
    },
    'prosedur_pengajuan': {
      pattern: /^(?!.*(ktp|ktp-el|kartu\s+tanda\s+penduduk|kia|kartu\s+identitas\s+anak|kartu\s+keluarga|kk\s+|akta\s+kelahiran|akta\s+perkawinan|akta\s+perceraian|akta\s+kematian|akta\s+pengakuan\s+anak|akta\s+pengesahan\s+anak|pengakuan\s+anak|pengesahan\s+anak|biodata\s+penduduk|kepindahan|pindah\s+domisili|skpwni|skdwni|skpln|surat\s+keterangan\s+pindah|surat\s+kedatangan|perubahan\s+elemen\s+data|perubahan\s+data|koreksi\s+data|pembatalan\s+perkawinan|pembatalan\s+perceraian|kutipan\s+akta|salinan\s+akta|duplikat\s+akta|legalisir|legalisasi|keabsahan\s+dokumen|verifikasi\s+dokumen|validasi\s+dokumen|skdln|perubahan\s+status\s+wna|itas|itap|surat\s+pindah\s+datang|surat\s+domisili|surat\s+keterangan\s+tidak\s+mampu|surat\s+keterangan\s+belum\s+menikah|surat\s+keterangan\s+beda\s+nama|surat\s+keterangan\s+kelahiran|surat\s+keterangan\s+kematian|surat\s+keterangan\s+usaha|surat\s+keterangan\s+penghasilan|surat\s+keterangan\s+ahli\s+waris)).*(prosedur|cara|langkah|proses|pengajuan).*$/i,
      response: `🔄 **Prosedur Pengajuan Dokumen**

**Langkah-langkah pengajuan:**

**1️⃣ Persiapan Dokumen**
• Siapkan semua berkas yang diperlukan
• Pastikan dokumen asli dan fotokopi tersedia
• Cek kelengkapan sesuai persyaratan

**2️⃣ Pendaftaran**
• Datang ke loket pendaftaran
• Ambil nomor antrian
• Serahkan berkas ke petugas

**3️⃣ Verifikasi**
• Petugas akan memeriksa kelengkapan
• Jika ada kekurangan, akan diberitahu
• Proses verifikasi biasanya 15-30 menit

**4️⃣ Pembayaran**
• Bayar biaya administrasi (jika ada)
• Simpan bukti pembayaran

**5️⃣ Pengambilan**
• Dokumen selesai sesuai jadwal
• Bawa bukti pembayaran saat pengambilan

Butuh bantuan untuk langkah tertentu? 🤝`,
      serviceType: 'administrasi_kependudukan',
      confidence: 0.85
    },
    'waktu_pelayanan': {
      pattern: /waktu|jam|buka|tutup|pelayanan|operasional/i,
      response: `⏰ **Waktu Pelayanan Dinas Kependudukan**

**📅 Hari Kerja:**
• **Senin - Kamis:** 08.00 - 15.00 WIB
• **Jumat:** 08.00 - 11.30 WIB & 13.00 - 15.00 WIB
• **Sabtu:** 08.00 - 12.00 WIB

**🚫 Hari Libur:**
• Minggu dan hari libur nasional TUTUP

**⚡ Layanan Prioritas:**
• Lansia (60+ tahun): 08.00 - 10.00 WIB
• Ibu hamil & disabilitas: Prioritas khusus

**📞 Informasi Lebih Lanjut:**
• Telepon: (0262) 123-4567
• WhatsApp: 0812-3456-7890

**💡 Tips:** Datang pagi hari untuk menghindari antrian panjang!

Ada yang ingin ditanyakan tentang jadwal pelayanan? 😊`,
      serviceType: 'informasi_pelayanan',
      confidence: 0.9
    },
    'biaya_administrasi': {
      pattern: /biaya|tarif|ongkos|bayar|gratis|uang/i,
      response: `💰 **Informasi Biaya Administrasi**

**🆓 Layanan GRATIS:**
• Penerbitan KTP elektronik
• Penerbitan Kartu Keluarga (KK)
• Akta kelahiran
• Akta kematian
• Surat keterangan pindah

**💵 Layanan Berbayar:**
• Legalisir dokumen: Rp 5.000/lembar
• Surat keterangan khusus: Rp 10.000
• Penggantian dokumen hilang: Rp 25.000

**📋 Ketentuan:**
• Pembayaran hanya di loket kasir
• Terima bukti pembayaran
• Simpan untuk pengambilan dokumen

**⚠️ Penting:**
• Waspada pungli (pungutan liar)
• Laporkan jika diminta bayar di luar ketentuan
• Hotline pengaduan: 0800-1234-567

**💡 Catatan:** Sebagian besar layanan kependudukan GRATIS sesuai peraturan pemerintah.

Butuh info biaya untuk layanan tertentu? 🤔`,
      serviceType: 'informasi_biaya',
      confidence: 0.85
    }
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public static getInstance(): AdministrativeResponseCache {
    if (!AdministrativeResponseCache.instance) {
      AdministrativeResponseCache.instance = new AdministrativeResponseCache();
    }
    return AdministrativeResponseCache.instance;
  }

  /**
   * Initialize the cache system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 [ADMIN_CACHE] Initializing administrative response cache...');
      
      // Load existing cache data
      await this.loadCacheData();
      
      // Pre-populate with administrative templates
      this.prePopulateCache();
      
      // Start cache maintenance
      this.startCacheMaintenance();
      
      this.initialized = true;
      // console.log(
    } catch (error) {
      // console.error( [ADMIN_CACHE] Failed to initialize cache:', error);
      throw error;
    }
  }

  /**
   * Get cached response for a query
   */
  public async getCachedResponse(query: string, serviceType?: string): Promise<CachedResponse | null> {
    const startTime = performance.now();
    
    try {
      const normalizedQuery = this.normalizeQuery(query);
      
      // Direct cache hit
      const directHit = this.cache.get(normalizedQuery);
      if (directHit) {
        directHit.lastUsed = new Date().toISOString();
        directHit.useCount++;
        
        const responseTime = performance.now() - startTime;
        this.recordCacheMetrics('hit', responseTime);
        
        // console.log(
        return directHit;
      }

      // Template matching
      const templateMatch = this.findTemplateMatch(query);
      if (templateMatch) {
        const cachedResponse = this.createCachedResponseFromTemplate(query, templateMatch);
        this.cache.set(normalizedQuery, cachedResponse);
        
        const responseTime = performance.now() - startTime;
        this.recordCacheMetrics('template_hit', responseTime);
        
        console.log(`🎯 [ADMIN_CACHE] Template MATCH for query: "${query}" (${responseTime.toFixed(2)}ms)`);
        return cachedResponse;
      }

      // Similarity search
      const similarResponse = this.findSimilarResponse(normalizedQuery);
      if (similarResponse) {
        similarResponse.lastUsed = new Date().toISOString();
        similarResponse.useCount++;
        
        const responseTime = performance.now() - startTime;
        this.recordCacheMetrics('similarity_hit', responseTime);
        
        console.log(`🔍 [ADMIN_CACHE] Similarity HIT for query: "${query}" (${responseTime.toFixed(2)}ms)`);
        return similarResponse;
      }

      const responseTime = performance.now() - startTime;
      this.recordCacheMetrics('miss', responseTime);
      
      // console.log(
      return null;

    } catch (error) {
      // console.error( [ADMIN_CACHE] Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache a new response
   */
  public async cacheResponse(
    query: string,
    response: string,
    responseType: CachedResponse['responseType'],
    serviceType: string,
    confidence: number,
    metadata: CachedResponse['metadata']
  ): Promise<void> {
    try {
      const normalizedQuery = this.normalizeQuery(query);
      
      const cachedResponse: CachedResponse = {
        id: `cache_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        query,
        normalizedQuery,
        response,
        responseType,
        serviceType,
        confidence,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        useCount: 1,
        tags: this.extractTags(query),
        metadata
      };

      this.cache.set(normalizedQuery, cachedResponse);
      
      // Maintain cache size
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        this.evictOldestEntries();
      }

      console.log(`💾 [ADMIN_CACHE] Cached response for: "${query}"`);

    } catch (error) {
      // console.error( [ADMIN_CACHE] Error caching response:', error);
    }
  }

  /**
   * Clear all cache entries (for testing)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🧹 [ADMIN_CACHE] All cache entries cleared');
  }

  /**
   * Disable cache temporarily (for testing)
   */
  public disableCache(): void {
    this.cache.clear();
    this.initialized = false;
    console.log('⚠️ [ADMIN_CACHE] Cache disabled for testing');
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): CacheStatistics {
    const responses = Array.from(this.cache.values());
    const totalHits = responses.reduce((sum, r) => sum + r.useCount, 0);
    const totalQueries = totalHits + this.getCacheMisses();
    
    return {
      totalCachedResponses: this.cache.size,
      hitRate: totalQueries > 0 ? (totalHits / totalQueries) * 100 : 0,
      averageResponseTime: this.getAverageResponseTime(),
      mostUsedQueries: this.getMostUsedQueries(),
      cacheEfficiency: this.calculateCacheEfficiency(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Normalize query for consistent caching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Find template match for query
   */
  private findTemplateMatch(query: string): any {
    for (const [key, template] of Object.entries(this.ADMINISTRATIVE_TEMPLATES)) {
      if (template.pattern.test(query)) {
        return { key, ...template };
      }
    }
    return null;
  }

  /**
   * Create cached response from template
   */
  private createCachedResponseFromTemplate(query: string, template: any): CachedResponse {
    return {
      id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      query,
      normalizedQuery: this.normalizeQuery(query),
      response: template.response,
      responseType: 'administrative',
      serviceType: template.serviceType,
      confidence: template.confidence,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1,
      tags: this.extractTags(query),
      metadata: {
        processingTime: 0,
        originalSource: 'template',
        validationStatus: 'verified'
      }
    };
  }

  /**
   * Find similar cached response
   */
  private findSimilarResponse(normalizedQuery: string): CachedResponse | null {
    let bestMatch: CachedResponse | null = null;
    let bestSimilarity = 0;

    for (const response of this.cache.values()) {
      const similarity = this.calculateSimilarity(normalizedQuery, response.normalizedQuery);
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = response;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return (commonWords.length * 2) / (words1.length + words2.length);
  }

  /**
   * Extract tags from query
   */
  private extractTags(query: string): string[] {
    const tags: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Administrative keywords
    if (/ktp|kartu tanda penduduk/i.test(query)) tags.push('ktp');
    if (/kk|kartu keluarga/i.test(query)) tags.push('kartu_keluarga');
    if (/akta|kelahiran/i.test(query)) tags.push('akta_kelahiran');
    if (/persyaratan|syarat/i.test(query)) tags.push('persyaratan');
    if (/prosedur|cara/i.test(query)) tags.push('prosedur');
    if (/waktu|jam/i.test(query)) tags.push('waktu_pelayanan');
    if (/biaya|tarif/i.test(query)) tags.push('biaya');

    return tags;
  }

  /**
   * Pre-populate cache with templates
   */
  private prePopulateCache(): void {
    for (const [key, template] of Object.entries(this.ADMINISTRATIVE_TEMPLATES)) {
      const sampleQuery = this.generateSampleQuery(key);
      const cachedResponse = this.createCachedResponseFromTemplate(sampleQuery, template);
      this.cache.set(cachedResponse.normalizedQuery, cachedResponse);
    }
    
    console.log(`📚 [ADMIN_CACHE] Pre-populated cache with ${Object.keys(this.ADMINISTRATIVE_TEMPLATES).length} templates`);
  }

  /**
   * Generate sample query for template
   */
  private generateSampleQuery(templateKey: string): string {
    const sampleQueries = {
      'persyaratan_dokumen': 'Persyaratan dokumen kependudukan',
      'prosedur_pengajuan': 'Prosedur pengajuan dokumen',
      'waktu_pelayanan': 'Waktu pelayanan dinas',
      'biaya_administrasi': 'Biaya administrasi dokumen'
    };
    
    return sampleQueries[templateKey as keyof typeof sampleQueries] || templateKey;
  }

  /**
   * Record cache performance metrics
   */
  private recordCacheMetrics(type: 'hit' | 'miss' | 'template_hit' | 'similarity_hit', responseTime: number): void {
    this.performanceMonitor.recordMetric(
      'response_time',
      'training_collector',
      responseTime,
      'ms',
      {
        cacheType: type,
        cacheSize: this.cache.size,
        source: 'administrative_cache'
      }
    );
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestEntries(): void {
    const responses = Array.from(this.cache.entries());
    responses.sort((a, b) => new Date(a[1].lastUsed).getTime() - new Date(b[1].lastUsed).getTime());
    
    const toEvict = responses.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.1)); // Evict 10%
    toEvict.forEach(([key]) => this.cache.delete(key));
    
    console.log(`🗑️ [ADMIN_CACHE] Evicted ${toEvict.length} old cache entries`);
  }

  /**
   * Start cache maintenance
   */
  private startCacheMaintenance(): void {
    // Clean expired entries every hour
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, response] of this.cache.entries()) {
      const age = now - new Date(response.lastUsed).getTime();
      if (age > this.CACHE_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [ADMIN_CACHE] Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Load existing cache data
   */
  private async loadCacheData(): Promise<void> {
    try {
      // In a real implementation, this would load from persistent storage
      console.log('📚 [ADMIN_CACHE] Loading existing cache data...');
    } catch (error) {
      // console.warn(️ [ADMIN_CACHE] Could not load existing cache data:', error);
    }
  }

  /**
   * Helper methods for statistics
   */
  private getCacheMisses(): number {
    // This would be tracked in a real implementation
    return 0;
  }

  private getAverageResponseTime(): number {
    // This would be calculated from recorded metrics
    return 50; // Placeholder
  }

  private getMostUsedQueries(): Array<{ query: string; count: number }> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 10)
      .map(r => ({ query: r.query, count: r.useCount }));
  }

  private calculateCacheEfficiency(): number {
    const stats = this.getCacheStatistics();
    return stats.hitRate > 0 ? Math.min(100, stats.hitRate * 1.2) : 0;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in MB
    const avgResponseSize = 1000; // bytes
    return (this.cache.size * avgResponseSize) / (1024 * 1024);
  }
}
