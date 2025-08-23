# Indonesian Civil Registration Services Optimization

## Overview

This document outlines specific optimizations for Indonesian civil registration services (Dinas Kependudukan dan Pencatatan Sipil) within the Upstash Redis caching system, focusing on SELLY's role as an AI assistant for Kabupaten Garut.

## Indonesian Administrative Context

### Service Categories
1. **Kependudukan (Population Services)**
   - KTP (Kartu Tanda Penduduk) - Identity Card
   - KK (Kartu Keluarga) - Family Card
   - Pindah Domisili - Address Change

2. **Pencatatan Sipil (Civil Registration)**
   - Akta Kelahiran - Birth Certificate
   - Akta Kematian - Death Certificate
   - Akta Perkawinan - Marriage Certificate
   - Akta Perceraian - Divorce Certificate

3. **Layanan Khusus (Special Services)**
   - Legalisir Dokumen - Document Legalization
   - Surat Keterangan - Official Letters
   - Data Kependudukan - Population Data

## Cache Optimization Strategies

### 1. Indonesian Language Processing Cache
```typescript
// src/services/cache/indonesianLanguageCache.ts
export interface IndonesianQueryPattern {
  pattern: string;
  variations: string[];
  serviceType: string;
  confidence: number;
  commonMisspellings: string[];
  informalVariations: string[];
}

export class IndonesianLanguageCache {
  private upstashCache: UpstashCacheService;
  private languagePatterns: Map<string, IndonesianQueryPattern> = new Map();

  constructor() {
    this.upstashCache = new UpstashCacheService('indonesian-lang');
    this.initializeLanguagePatterns();
  }

  private initializeLanguagePatterns(): void {
    const patterns: IndonesianQueryPattern[] = [
      {
        pattern: 'persyaratan_ktp',
        variations: [
          'persyaratan membuat KTP',
          'syarat bikin KTP',
          'cara buat KTP baru',
          'dokumen untuk KTP'
        ],
        serviceType: 'ktp',
        confidence: 0.95,
        commonMisspellings: ['persyartan', 'persyaratan', 'syarat2'],
        informalVariations: ['gimana bikin KTP', 'mau buat KTP', 'KTP hilang']
      },
      {
        pattern: 'akta_kelahiran',
        variations: [
          'cara mengurus akta kelahiran',
          'bikin akta lahir',
          'syarat akta kelahiran',
          'dokumen akta bayi'
        ],
        serviceType: 'akta_kelahiran',
        confidence: 0.92,
        commonMisspellings: ['akte', 'akta kelahiran', 'akte lahir'],
        informalVariations: ['akta bayi', 'surat lahir', 'dokumen bayi']
      },
      {
        pattern: 'kartu_keluarga',
        variations: [
          'cara buat kartu keluarga',
          'syarat KK baru',
          'perpanjang KK',
          'tambah anggota keluarga'
        ],
        serviceType: 'kartu_keluarga',
        confidence: 0.90,
        commonMisspellings: ['KK', 'kartu keluarga', 'kk baru'],
        informalVariations: ['KK hilang', 'ganti KK', 'update KK']
      }
    ];

    patterns.forEach(pattern => {
      this.languagePatterns.set(pattern.pattern, pattern);
    });
  }

  async getCachedIndonesianResponse(query: string): Promise<any> {
    // Normalize Indonesian query
    const normalizedQuery = this.normalizeIndonesianQuery(query);
    
    // Try exact match first
    const exactMatch = await this.upstashCache.get(`id-exact:${normalizedQuery}`);
    if (exactMatch) return exactMatch;

    // Try pattern matching
    for (const [patternKey, pattern] of this.languagePatterns.entries()) {
      if (this.matchesPattern(normalizedQuery, pattern)) {
        const cachedResponse = await this.upstashCache.get(`id-pattern:${patternKey}`);
        if (cachedResponse) {
          // Cache the specific query for faster future access
          await this.upstashCache.set(`id-exact:${normalizedQuery}`, cachedResponse, 12 * 60 * 60);
          return cachedResponse;
        }
      }
    }

    return null;
  }

  async cacheIndonesianResponse(
    query: string,
    response: any,
    serviceType: string,
    confidence: number = 0.8
  ): Promise<void> {
    const normalizedQuery = this.normalizeIndonesianQuery(query);
    const ttl = this.calculateIndonesianTTL(serviceType, confidence);

    // Cache exact query
    await this.upstashCache.set(`id-exact:${normalizedQuery}`, response, ttl);

    // Cache by service type pattern
    const pattern = this.findMatchingPattern(serviceType);
    if (pattern) {
      await this.upstashCache.set(`id-pattern:${pattern}`, response, ttl * 2); // Longer TTL for patterns
    }
  }

  private normalizeIndonesianQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim()
      .replace(/akte/g, 'akta') // Common misspelling
      .replace(/persyartan/g, 'persyaratan') // Common misspelling
      .replace(/gimana/g, 'bagaimana') // Informal to formal
      .replace(/bikin/g, 'membuat'); // Informal to formal
  }

  private matchesPattern(query: string, pattern: IndonesianQueryPattern): boolean {
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

  private calculateIndonesianTTL(serviceType: string, confidence: number): number {
    const baseTTL = {
      'ktp': 24 * 60 * 60,           // 24 hours - frequently updated
      'kartu_keluarga': 18 * 60 * 60, // 18 hours - moderately updated
      'akta_kelahiran': 48 * 60 * 60, // 48 hours - rarely updated
      'akta_perkawinan': 48 * 60 * 60, // 48 hours - rarely updated
      'legalisir': 12 * 60 * 60,      // 12 hours - process may change
      'surat_keterangan': 6 * 60 * 60 // 6 hours - often temporary
    };

    const base = baseTTL[serviceType] || 12 * 60 * 60;
    return Math.floor(base * (0.5 + confidence)); // Adjust by confidence
  }
}
```

### 2. Administrative Response Templates
```typescript
// src/services/cache/administrativeTemplateCache.ts
export interface AdministrativeTemplate {
  id: string;
  serviceType: string;
  templateType: 'requirements' | 'procedure' | 'fees' | 'schedule';
  content: {
    title: string;
    description: string;
    requirements?: string[];
    procedures?: string[];
    fees?: { item: string; amount: string }[];
    schedule?: { day: string; hours: string }[];
    notes?: string[];
  };
  lastUpdated: string;
  validUntil: string;
  region: 'garut' | 'jabar' | 'national';
}

export class AdministrativeTemplateCache {
  private upstashCache: UpstashCacheService;
  private templates: Map<string, AdministrativeTemplate> = new Map();

  constructor() {
    this.upstashCache = new UpstashCacheService('admin-templates');
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const ktpTemplate: AdministrativeTemplate = {
      id: 'ktp-requirements-garut',
      serviceType: 'ktp',
      templateType: 'requirements',
      content: {
        title: 'Persyaratan Pembuatan KTP Baru - Kabupaten Garut',
        description: 'Dokumen yang diperlukan untuk membuat KTP baru di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
        requirements: [
          'Surat pengantar dari RT/RW',
          'Fotocopy Kartu Keluarga (KK)',
          'Fotocopy Akta Kelahiran',
          'Pas foto 3x4 sebanyak 2 lembar (latar belakang merah)',
          'Surat keterangan pindah (jika dari luar daerah)',
          'Mengisi formulir permohonan KTP'
        ],
        procedures: [
          'Datang ke kantor Dinas Dukcapil Kabupaten Garut',
          'Ambil nomor antrian',
          'Serahkan berkas persyaratan',
          'Verifikasi data dan foto',
          'Tanda tangan dan sidik jari',
          'Tunggu proses cetak (1-3 hari kerja)'
        ],
        fees: [
          { item: 'Pembuatan KTP baru', amount: 'GRATIS' },
          { item: 'Penggantian KTP rusak/hilang', amount: 'GRATIS' }
        ],
        schedule: [
          { day: 'Senin - Kamis', hours: '08:00 - 15:00 WIB' },
          { day: 'Jumat', hours: '08:00 - 11:00 WIB' },
          { day: 'Sabtu - Minggu', hours: 'TUTUP' }
        ],
        notes: [
          'Pelayanan KTP gratis sesuai Perpres No. 96 Tahun 2018',
          'Bawa dokumen asli untuk verifikasi',
          'KTP dapat diambil setelah 1-3 hari kerja'
        ]
      },
      lastUpdated: '2024-01-15',
      validUntil: '2024-12-31',
      region: 'garut'
    };

    this.templates.set(ktpTemplate.id, ktpTemplate);
  }

  async getCachedTemplate(
    serviceType: string,
    templateType: string,
    region: string = 'garut'
  ): Promise<AdministrativeTemplate | null> {
    const cacheKey = `template:${serviceType}:${templateType}:${region}`;
    
    try {
      const cached = await this.upstashCache.get<AdministrativeTemplate>(cacheKey);
      if (cached && this.isTemplateValid(cached)) {
        return cached;
      }

      // Try to get from local templates
      const templateId = `${serviceType}-${templateType}-${region}`;
      const localTemplate = this.templates.get(templateId);
      
      if (localTemplate && this.isTemplateValid(localTemplate)) {
        // Cache the local template
        await this.upstashCache.set(cacheKey, localTemplate, 24 * 60 * 60); // 24 hours
        return localTemplate;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached template:', error);
      return null;
    }
  }

  async cacheTemplate(template: AdministrativeTemplate): Promise<void> {
    const cacheKey = `template:${template.serviceType}:${template.templateType}:${template.region}`;
    const ttl = this.calculateTemplateTTL(template);
    
    await this.upstashCache.set(cacheKey, template, ttl);
    this.templates.set(template.id, template);
  }

  private isTemplateValid(template: AdministrativeTemplate): boolean {
    const validUntil = new Date(template.validUntil);
    return validUntil > new Date();
  }

  private calculateTemplateTTL(template: AdministrativeTemplate): number {
    const validUntil = new Date(template.validUntil);
    const now = new Date();
    const remainingTime = validUntil.getTime() - now.getTime();
    
    // Use remaining validity time or 24 hours, whichever is shorter
    return Math.min(remainingTime / 1000, 24 * 60 * 60);
  }
}
```

### 3. Regional Data Caching
```typescript
// src/services/cache/regionalDataCache.ts
export interface RegionalData {
  region: string;
  offices: {
    name: string;
    address: string;
    phone: string;
    services: string[];
    operatingHours: { day: string; hours: string }[];
  }[];
  requirements: {
    [serviceType: string]: {
      documents: string[];
      fees: { item: string; amount: string }[];
      processingTime: string;
      notes: string[];
    };
  };
  announcements: {
    title: string;
    content: string;
    validFrom: string;
    validUntil: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

export class RegionalDataCache {
  private upstashCache: UpstashCacheService;

  constructor() {
    this.upstashCache = new UpstashCacheService('regional-data');
  }

  async getCachedRegionalData(region: string = 'garut'): Promise<RegionalData | null> {
    const cacheKey = `regional:${region}`;
    
    try {
      const cached = await this.upstashCache.get<RegionalData>(cacheKey);
      if (cached) {
        // Filter expired announcements
        cached.announcements = cached.announcements.filter(
          announcement => new Date(announcement.validUntil) > new Date()
        );
        return cached;
      }

      // Load default data for Garut
      if (region === 'garut') {
        const garutData = await this.loadGarutData();
        await this.upstashCache.set(cacheKey, garutData, 6 * 60 * 60); // 6 hours
        return garutData;
      }

      return null;
    } catch (error) {
      console.error('Error getting regional data:', error);
      return null;
    }
  }

  private async loadGarutData(): Promise<RegionalData> {
    return {
      region: 'garut',
      offices: [
        {
          name: 'Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut',
          address: 'Jl. Pembangunan No. 64, Garut, Jawa Barat 44117',
          phone: '(0262) 232945',
          services: ['KTP', 'KK', 'Akta Kelahiran', 'Akta Kematian', 'Akta Perkawinan'],
          operatingHours: [
            { day: 'Senin - Kamis', hours: '08:00 - 15:00 WIB' },
            { day: 'Jumat', hours: '08:00 - 11:00 WIB' }
          ]
        }
      ],
      requirements: {
        ktp: {
          documents: [
            'Surat pengantar RT/RW',
            'Fotocopy KK',
            'Fotocopy Akta Kelahiran',
            'Pas foto 3x4 (2 lembar)'
          ],
          fees: [{ item: 'Pembuatan KTP', amount: 'GRATIS' }],
          processingTime: '1-3 hari kerja',
          notes: ['Bawa dokumen asli untuk verifikasi']
        }
      },
      announcements: [
        {
          title: 'Pelayanan Online Tersedia',
          content: 'Beberapa layanan kini dapat diakses secara online melalui website resmi.',
          validFrom: '2024-01-01',
          validUntil: '2024-12-31',
          priority: 'medium'
        }
      ]
    };
  }

  async updateRegionalData(region: string, data: RegionalData): Promise<void> {
    const cacheKey = `regional:${region}`;
    await this.upstashCache.set(cacheKey, data, 6 * 60 * 60); // 6 hours
  }
}
```

## Performance Optimizations for Indonesian Services

### 1. Query Pattern Recognition
```typescript
// src/services/cache/indonesianQueryOptimizer.ts
export class IndonesianQueryOptimizer {
  private commonPatterns = [
    // KTP patterns
    /\b(ktp|kartu tanda penduduk)\b/i,
    /\b(bikin|buat|mengurus) ktp\b/i,
    /\bpersyaratan ktp\b/i,
    
    // KK patterns
    /\b(kk|kartu keluarga)\b/i,
    /\btambah anggota keluarga\b/i,
    /\bperpanjang kk\b/i,
    
    // Akta patterns
    /\b(akta|akte) (kelahiran|lahir)\b/i,
    /\b(akta|akte) (perkawinan|nikah)\b/i,
    /\b(akta|akte) kematian\b/i
  ];

  optimizeQuery(query: string): {
    optimizedQuery: string;
    cacheKey: string;
    priority: number;
  } {
    const normalizedQuery = this.normalizeIndonesianText(query);
    const pattern = this.identifyPattern(normalizedQuery);
    
    return {
      optimizedQuery: normalizedQuery,
      cacheKey: this.generateOptimizedCacheKey(pattern, normalizedQuery),
      priority: this.calculatePriority(pattern)
    };
  }

  private normalizeIndonesianText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      // Common Indonesian text normalizations
      .replace(/akte/g, 'akta')
      .replace(/gimana/g, 'bagaimana')
      .replace(/bikin/g, 'membuat')
      .replace(/ngurus/g, 'mengurus');
  }

  private identifyPattern(query: string): string {
    for (let i = 0; i < this.commonPatterns.length; i++) {
      if (this.commonPatterns[i].test(query)) {
        return `pattern_${i}`;
      }
    }
    return 'general';
  }

  private generateOptimizedCacheKey(pattern: string, query: string): string {
    if (pattern !== 'general') {
      return `id-opt:${pattern}:${this.hashQuery(query)}`;
    }
    return `id-general:${this.hashQuery(query)}`;
  }

  private calculatePriority(pattern: string): number {
    // Higher priority for common administrative patterns
    if (pattern.includes('ktp') || pattern.includes('kk')) return 10;
    if (pattern.includes('akta')) return 8;
    return 5;
  }

  private hashQuery(query: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
```

### 2. Cache Warming for Common Services
```typescript
// src/services/cache/indonesianCacheWarming.ts
export class IndonesianCacheWarming {
  private upstashCache: UpstashCacheService;
  private templateCache: AdministrativeTemplateCache;
  private regionalCache: RegionalDataCache;

  constructor() {
    this.upstashCache = new UpstashCacheService('warming');
    this.templateCache = new AdministrativeTemplateCache();
    this.regionalCache = new RegionalDataCache();
  }

  async warmCommonQueries(): Promise<void> {
    console.log('🔥 Starting Indonesian service cache warming...');

    const commonQueries = [
      // KTP queries
      'persyaratan membuat KTP baru',
      'cara mengurus KTP hilang',
      'biaya pembuatan KTP',
      'jam operasional pelayanan KTP',
      
      // KK queries
      'syarat membuat kartu keluarga',
      'cara menambah anggota keluarga di KK',
      'perpanjang kartu keluarga',
      
      // Akta queries
      'persyaratan akta kelahiran',
      'cara mengurus akta kelahiran bayi',
      'biaya legalisir akta kelahiran',
      
      // General queries
      'alamat kantor dukcapil garut',
      'jam buka dinas kependudukan',
      'nomor telepon dukcapil garut'
    ];

    // Warm up query responses
    for (const query of commonQueries) {
      await this.warmQuery(query);
    }

    // Warm up templates
    await this.warmTemplates();

    // Warm up regional data
    await this.warmRegionalData();

    console.log('✅ Cache warming completed');
  }

  private async warmQuery(query: string): Promise<void> {
    try {
      // This would typically call the actual service to generate and cache the response
      const mockResponse = {
        content: `Informasi untuk: ${query}`,
        serviceType: this.detectServiceType(query),
        confidence: 0.9,
        timestamp: Date.now()
      };

      const cacheKey = `warmed:${this.hashQuery(query)}`;
      await this.upstashCache.set(cacheKey, mockResponse, 24 * 60 * 60); // 24 hours
      
      console.log(`🔥 Warmed query: ${query.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Failed to warm query: ${query}`, error);
    }
  }

  private async warmTemplates(): Promise<void> {
    const serviceTypes = ['ktp', 'kartu_keluarga', 'akta_kelahiran'];
    const templateTypes = ['requirements', 'procedure', 'fees'];

    for (const serviceType of serviceTypes) {
      for (const templateType of templateTypes) {
        await this.templateCache.getCachedTemplate(serviceType, templateType, 'garut');
      }
    }
  }

  private async warmRegionalData(): Promise<void> {
    await this.regionalCache.getCachedRegionalData('garut');
  }

  private detectServiceType(query: string): string {
    if (/ktp/i.test(query)) return 'ktp';
    if (/kartu keluarga|kk/i.test(query)) return 'kartu_keluarga';
    if (/akta kelahiran/i.test(query)) return 'akta_kelahiran';
    if (/akta perkawinan|nikah/i.test(query)) return 'akta_perkawinan';
    return 'general';
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
```

## Integration with SELLY Services

### Enhanced SimpleResponseService Integration
```typescript
// Integration example for SimpleResponseService
export class EnhancedSimpleResponseService extends SimpleResponseService {
  private indonesianCache: IndonesianLanguageCache;
  private templateCache: AdministrativeTemplateCache;
  private regionalCache: RegionalDataCache;
  private queryOptimizer: IndonesianQueryOptimizer;

  constructor() {
    super();
    this.indonesianCache = new IndonesianLanguageCache();
    this.templateCache = new AdministrativeTemplateCache();
    this.regionalCache = new RegionalDataCache();
    this.queryOptimizer = new IndonesianQueryOptimizer();
  }

  async processQuery(
    query: string,
    context?: { userId?: string; user?: { id: string } }
  ): Promise<SimpleResponseResult> {
    // Optimize query for Indonesian services
    const optimized = this.queryOptimizer.optimizeQuery(query);
    
    // Try Indonesian-specific cache first
    const indonesianResponse = await this.indonesianCache.getCachedIndonesianResponse(optimized.optimizedQuery);
    if (indonesianResponse) {
      return this.formatIndonesianResponse(indonesianResponse, 'indonesian-cache');
    }

    // Try template cache
    const serviceType = this.detectServiceType(optimized.optimizedQuery);
    if (serviceType !== 'general') {
      const template = await this.templateCache.getCachedTemplate(serviceType, 'requirements');
      if (template) {
        return this.formatTemplateResponse(template, 'template-cache');
      }
    }

    // Fall back to parent implementation
    return super.processQuery(query, context);
  }

  private formatIndonesianResponse(response: any, source: string): SimpleResponseResult {
    return {
      success: true,
      content: response.content,
      processingTime: 50, // Fast cache response
      metadata: {
        source,
        serviceType: response.serviceType,
        confidence: response.confidence,
        cached: true,
        language: 'indonesian'
      }
    };
  }

  private formatTemplateResponse(template: AdministrativeTemplate, source: string): SimpleResponseResult {
    const content = this.formatTemplateContent(template);
    
    return {
      success: true,
      content,
      processingTime: 75,
      metadata: {
        source,
        serviceType: template.serviceType,
        confidence: 0.95,
        cached: true,
        templateType: template.templateType,
        region: template.region
      }
    };
  }

  private formatTemplateContent(template: AdministrativeTemplate): string {
    let content = `**${template.content.title}**\n\n`;
    content += `${template.content.description}\n\n`;

    if (template.content.requirements) {
      content += '**Persyaratan:**\n';
      template.content.requirements.forEach((req, index) => {
        content += `${index + 1}. ${req}\n`;
      });
      content += '\n';
    }

    if (template.content.procedures) {
      content += '**Prosedur:**\n';
      template.content.procedures.forEach((proc, index) => {
        content += `${index + 1}. ${proc}\n`;
      });
      content += '\n';
    }

    if (template.content.fees) {
      content += '**Biaya:**\n';
      template.content.fees.forEach(fee => {
        content += `- ${fee.item}: ${fee.amount}\n`;
      });
      content += '\n';
    }

    if (template.content.schedule) {
      content += '**Jam Pelayanan:**\n';
      template.content.schedule.forEach(schedule => {
        content += `- ${schedule.day}: ${schedule.hours}\n`;
      });
      content += '\n';
    }

    if (template.content.notes) {
      content += '**Catatan Penting:**\n';
      template.content.notes.forEach(note => {
        content += `- ${note}\n`;
      });
    }

    return content;
  }

  private detectServiceType(query: string): string {
    if (/ktp|kartu tanda penduduk/i.test(query)) return 'ktp';
    if (/kartu keluarga|kk/i.test(query)) return 'kartu_keluarga';
    if (/akta kelahiran/i.test(query)) return 'akta_kelahiran';
    if (/akta perkawinan|nikah/i.test(query)) return 'akta_perkawinan';
    if (/akta kematian/i.test(query)) return 'akta_kematian';
    return 'general';
  }
}
```

---

**Next**: Review [Training Integration](./training-integration.md) for training data caching strategies.
