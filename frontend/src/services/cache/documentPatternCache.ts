/**
 * Document Pattern Caching Service for SELLY AI
 * Advanced caching for Indonesian civil registration document patterns
 * Integrates with Upstash Redis and Session Management
 */

import { UpstashCacheService } from './upstashCacheService';
import { UpstashCacheServiceSingleton } from './UpstashCacheServiceFactory';
import { CachePerformanceMonitor } from './cachePerformanceMonitor';
import { UnifiedSessionManager } from '../session/unifiedSessionManager';
import { IndonesianPatternNormalizer } from './indonesianPatternNormalizer';
import { DocumentTypeDetector } from './documentTypeDetector';

export interface DocumentPattern {
  id: string;
  documentType: string;
  category: 'kartu' | 'akta' | 'surat';
  patterns: string[];
  variations: string[];
  commonMisspellings: string[];
  informalVariations: string[];
  keywords: string[];
  accuracy: number;
  priority: 'P0' | 'P1' | 'P2';
  queryVolume: 'high' | 'medium' | 'low';
  ttlHours: number;
}

export interface DocumentCacheEntry {
  pattern: DocumentPattern;
  response: string;
  confidence: number;
  lastUsed: Date;
  useCount: number;
  sessionContext?: {
    sessionId: string;
    userId?: string;
    administrativeContext?: any;
  };
}

export interface DocumentCacheStats {
  totalPatterns: number;
  cacheHitRate: number;
  averageResponseTime: number;
  topDocumentTypes: Array<{
    type: string;
    hitCount: number;
    accuracy: number;
  }>;
  performanceByCategory: Record<string, {
    hitRate: number;
    avgResponseTime: number;
    accuracy: number;
  }>;
}

export class DocumentPatternCache {
  private upstashCache: UpstashCacheService;
  private performanceMonitor: CachePerformanceMonitor;
  private sessionManager: UnifiedSessionManager;
  private patterns: Map<string, DocumentPattern> = new Map();
  private normalizer: IndonesianPatternNormalizer;
  private detector: DocumentTypeDetector;
  private static instance: DocumentPatternCache;

  private constructor() {
    this.upstashCache = UpstashCacheServiceSingleton.getInstance('document-patterns');
    this.performanceMonitor = CachePerformanceMonitor.getInstance();
    this.sessionManager = UnifiedSessionManager.getInstance();
    this.normalizer = IndonesianPatternNormalizer.getInstance();
    this.detector = DocumentTypeDetector.getInstance();

    this.initializeDocumentPatterns();
    console.log('✅ [DOCUMENT_CACHE] Document pattern cache initialized with advanced Indonesian NLP');
  }

  public static getInstance(): DocumentPatternCache {
    if (!DocumentPatternCache.instance) {
      DocumentPatternCache.instance = new DocumentPatternCache();
    }
    return DocumentPatternCache.instance;
  }

  /**
   * Initialize document patterns for all 24 civil registration document types
   */
  private initializeDocumentPatterns(): void {
    const patterns: DocumentPattern[] = [
      // Category 1: Dokumen Kependudukan dalam Bentuk Kartu (3 documents)
      {
        id: 'ktp_elektronik',
        documentType: 'KTP (Kartu Tanda Penduduk elektronik)',
        category: 'kartu',
        patterns: [
          'persyaratan membuat KTP',
          'syarat bikin KTP',
          'cara buat KTP baru',
          'dokumen untuk KTP',
          'persyaratan KTP baru'
        ],
        variations: [
          'ktp hilang', 'perpanjang ktp', 'ganti ktp', 'update ktp',
          'ktp rusak', 'ktp baru', 'bikin ktp', 'ngurus ktp'
        ],
        commonMisspellings: ['KTP', 'ktp', 'kartu tanda penduduk'],
        informalVariations: ['gimana bikin KTP', 'mau buat KTP', 'KTP hilang gimana'],
        keywords: ['ktp', 'kartu', 'tanda', 'penduduk', 'identitas', 'elektronik'],
        accuracy: 94.88,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 24
      },
      {
        id: 'kia_kartu_identitas_anak',
        documentType: 'KIA (Kartu Identitas Anak)',
        category: 'kartu',
        patterns: [
          'cara mengurus KIA',
          'syarat kartu identitas anak',
          'bikin KIA anak',
          'persyaratan KIA'
        ],
        variations: [
          'kia hilang', 'perpanjang kia', 'ganti kia', 'update kia',
          'kartu anak', 'identitas anak'
        ],
        commonMisspellings: ['KIA', 'kia', 'kartu identitas anak'],
        informalVariations: ['gimana bikin KIA', 'mau buat kartu anak'],
        keywords: ['kia', 'kartu', 'identitas', 'anak', 'dibawah', '17'],
        accuracy: 89.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 12
      },
      {
        id: 'kk_kartu_keluarga',
        documentType: 'KK (Kartu Keluarga)',
        category: 'kartu',
        patterns: [
          'cara buat kartu keluarga',
          'syarat KK baru',
          'perpanjang KK',
          'tambah anggota keluarga',
          'persyaratan kartu keluarga'
        ],
        variations: [
          'kk hilang', 'ganti kk', 'update kk', 'tambah kk',
          'kartu keluarga baru', 'mutasi kk'
        ],
        commonMisspellings: ['KK', 'kk', 'kartu keluarga'],
        informalVariations: ['gimana bikin KK', 'mau tambah anggota keluarga'],
        keywords: ['kk', 'kartu', 'keluarga', 'anggota', 'kepala'],
        accuracy: 94.1,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 24
      },

      // Category 2: Dokumen Kependudukan dalam Bentuk Akta (6 documents)
      {
        id: 'akta_kelahiran',
        documentType: 'Akta Kelahiran',
        category: 'akta',
        patterns: [
          'cara mengurus akta kelahiran',
          'bikin akta lahir',
          'syarat akta kelahiran',
          'dokumen akta bayi',
          'persyaratan akta kelahiran'
        ],
        variations: [
          'akta bayi', 'surat lahir', 'dokumen bayi', 'akte anak',
          'akta kelahiran hilang', 'duplikat akta kelahiran'
        ],
        commonMisspellings: ['akte', 'akta kelahiran', 'akte lahir', 'akta lahir'],
        informalVariations: ['gimana bikin akta bayi', 'mau urus akta anak'],
        keywords: ['akta', 'kelahiran', 'lahir', 'bayi', 'anak', 'surat'],
        accuracy: 95.0,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 48
      },
      {
        id: 'akta_kematian',
        documentType: 'Akta Kematian',
        category: 'akta',
        patterns: [
          'cara mengurus akta kematian',
          'syarat akta kematian',
          'bikin akta meninggal',
          'dokumen kematian'
        ],
        variations: [
          'surat kematian', 'akta meninggal', 'dokumen meninggal',
          'akta kematian hilang'
        ],
        commonMisspellings: ['akte kematian', 'akta kematian'],
        informalVariations: ['gimana urus akta orang meninggal'],
        keywords: ['akta', 'kematian', 'meninggal', 'mati', 'surat'],
        accuracy: 92.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 72
      },
      {
        id: 'akta_perkawinan',
        documentType: 'Akta Perkawinan',
        category: 'akta',
        patterns: [
          'cara mengurus akta perkawinan',
          'syarat akta nikah',
          'bikin akta kawin',
          'dokumen perkawinan'
        ],
        variations: [
          'surat nikah', 'akta nikah', 'dokumen kawin',
          'akta perkawinan hilang', 'duplikat akta nikah'
        ],
        commonMisspellings: ['akte perkawinan', 'akta perkawinan'],
        informalVariations: ['gimana urus akta nikah', 'mau bikin surat kawin'],
        keywords: ['akta', 'perkawinan', 'nikah', 'kawin', 'menikah'],
        accuracy: 90.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 24
      },
      {
        id: 'akta_perceraian',
        documentType: 'Akta Perceraian',
        category: 'akta',
        patterns: [
          'cara mengurus akta perceraian',
          'syarat akta cerai',
          'bikin akta perceraian',
          'dokumen perceraian'
        ],
        variations: [
          'surat cerai', 'akta cerai', 'dokumen cerai',
          'akta perceraian hilang', 'duplikat akta cerai'
        ],
        commonMisspellings: ['akte perceraian', 'akta perceraian'],
        informalVariations: ['gimana urus akta cerai', 'mau bikin surat cerai'],
        keywords: ['akta', 'perceraian', 'cerai', 'bercerai', 'pisah'],
        accuracy: 88.0,
        priority: 'P1',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'akta_pengakuan_anak',
        documentType: 'Akta Pengakuan Anak',
        category: 'akta',
        patterns: [
          'cara mengurus akta pengakuan anak',
          'syarat akta pengakuan anak',
          'bikin akta pengakuan anak',
          'dokumen pengakuan anak'
        ],
        variations: [
          'surat pengakuan anak', 'akta anak', 'dokumen anak',
          'akta pengakuan anak hilang'
        ],
        commonMisspellings: ['akte pengakuan anak', 'akta pengakuan anak'],
        informalVariations: ['gimana urus akta pengakuan anak'],
        keywords: ['akta', 'pengakuan', 'anak', 'mengakui', 'ayah'],
        accuracy: 85.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'akta_pengesahan_anak',
        documentType: 'Akta Pengesahan Anak',
        category: 'akta',
        patterns: [
          'cara mengurus akta pengesahan anak',
          'syarat akta pengesahan anak',
          'bikin akta pengesahan anak',
          'dokumen pengesahan anak'
        ],
        variations: [
          'surat pengesahan anak', 'akta sah anak', 'dokumen sah anak',
          'akta pengesahan anak hilang'
        ],
        commonMisspellings: ['akte pengesahan anak', 'akta pengesahan anak'],
        informalVariations: ['gimana urus akta pengesahan anak'],
        keywords: ['akta', 'pengesahan', 'anak', 'sah', 'mengesahkan'],
        accuracy: 85.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'akta_pengangkatan_anak',
        documentType: 'Akta Pengangkatan Anak',
        category: 'akta',
        patterns: [
          'cara mengurus akta pengangkatan anak',
          'syarat akta angkat anak',
          'bikin akta adopsi',
          'dokumen pengangkatan anak'
        ],
        variations: [
          'surat angkat anak', 'akta adopsi', 'dokumen adopsi',
          'akta pengangkatan anak hilang'
        ],
        commonMisspellings: ['akte pengangkatan anak', 'akta pengangkatan anak'],
        informalVariations: ['gimana urus akta angkat anak', 'mau adopsi anak'],
        keywords: ['akta', 'pengangkatan', 'anak', 'adopsi', 'angkat'],
        accuracy: 87.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },

      // Category 3: Dokumen Kependudukan dalam Bentuk Surat (15 documents)
      {
        id: 'surat_keterangan_pindah',
        documentType: 'Surat Keterangan Pindah',
        category: 'surat',
        patterns: [
          'cara mengurus surat pindah',
          'syarat surat keterangan pindah',
          'bikin surat pindah domisili',
          'dokumen pindah alamat'
        ],
        variations: [
          'surat pindah', 'keterangan pindah', 'dokumen pindah',
          'mutasi alamat', 'pindah domisili'
        ],
        commonMisspellings: ['surat keterangan pindah', 'surat pindah'],
        informalVariations: ['gimana urus surat pindah', 'mau pindah alamat'],
        keywords: ['surat', 'keterangan', 'pindah', 'domisili', 'alamat'],
        accuracy: 92.0,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 24
      },
      {
        id: 'surat_keterangan_datang',
        documentType: 'Surat Keterangan Datang',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan datang',
          'syarat surat datang',
          'bikin surat keterangan datang',
          'dokumen pendatang'
        ],
        variations: [
          'surat datang', 'keterangan datang', 'dokumen datang',
          'surat pendatang'
        ],
        commonMisspellings: ['surat keterangan datang', 'surat datang'],
        informalVariations: ['gimana urus surat datang', 'baru datang ke daerah'],
        keywords: ['surat', 'keterangan', 'datang', 'pendatang', 'baru'],
        accuracy: 90.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 48
      },
      {
        id: 'surat_keterangan_pindah_luar_negeri',
        documentType: 'Surat Keterangan Pindah ke Luar Negeri',
        category: 'surat',
        patterns: [
          'cara mengurus surat pindah luar negeri',
          'syarat pindah ke luar negeri',
          'bikin surat pindah keluar negeri',
          'dokumen emigrasi'
        ],
        variations: [
          'surat pindah luar negeri', 'emigrasi', 'pindah keluar negeri',
          'dokumen pindah luar negeri'
        ],
        commonMisspellings: ['surat pindah luar negeri', 'emigrasi'],
        informalVariations: ['gimana pindah ke luar negeri', 'mau emigrasi'],
        keywords: ['surat', 'pindah', 'luar', 'negeri', 'emigrasi'],
        accuracy: 88.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_datang_luar_negeri',
        documentType: 'Surat Keterangan Datang dari Luar Negeri',
        category: 'surat',
        patterns: [
          'cara mengurus surat datang dari luar negeri',
          'syarat datang dari luar negeri',
          'bikin surat keterangan datang luar negeri',
          'dokumen imigrasi'
        ],
        variations: [
          'surat datang luar negeri', 'imigrasi', 'datang dari luar negeri',
          'dokumen datang luar negeri'
        ],
        commonMisspellings: ['surat datang luar negeri', 'imigrasi'],
        informalVariations: ['gimana datang dari luar negeri', 'baru dari luar negeri'],
        keywords: ['surat', 'datang', 'luar', 'negeri', 'imigrasi'],
        accuracy: 88.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_tempat_tinggal',
        documentType: 'Surat Keterangan Tempat Tinggal',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan tempat tinggal',
          'syarat surat domisili',
          'bikin surat keterangan alamat',
          'dokumen tempat tinggal'
        ],
        variations: [
          'surat domisili', 'keterangan alamat', 'surat alamat',
          'keterangan tempat tinggal'
        ],
        commonMisspellings: ['surat domisili', 'keterangan alamat'],
        informalVariations: ['gimana bikin surat domisili', 'butuh surat alamat'],
        keywords: ['surat', 'keterangan', 'tempat', 'tinggal', 'domisili'],
        accuracy: 94.0,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 24
      },
      {
        id: 'surat_keterangan_kelahiran',
        documentType: 'Surat Keterangan Kelahiran',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan kelahiran',
          'syarat surat kelahiran',
          'bikin surat keterangan lahir',
          'dokumen kelahiran'
        ],
        variations: [
          'surat kelahiran', 'keterangan lahir', 'surat lahir',
          'dokumen bayi lahir'
        ],
        commonMisspellings: ['surat kelahiran', 'keterangan lahir'],
        informalVariations: ['gimana bikin surat kelahiran', 'bayi baru lahir'],
        keywords: ['surat', 'keterangan', 'kelahiran', 'lahir', 'bayi'],
        accuracy: 93.0,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 48
      },
      {
        id: 'surat_keterangan_kematian',
        documentType: 'Surat Keterangan Kematian',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan kematian',
          'syarat surat kematian',
          'bikin surat keterangan meninggal',
          'dokumen kematian'
        ],
        variations: [
          'surat kematian', 'keterangan meninggal', 'surat meninggal',
          'dokumen orang meninggal'
        ],
        commonMisspellings: ['surat kematian', 'keterangan meninggal'],
        informalVariations: ['gimana bikin surat kematian', 'orang meninggal'],
        keywords: ['surat', 'keterangan', 'kematian', 'meninggal', 'mati'],
        accuracy: 92.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_lahir_mati',
        documentType: 'Surat Keterangan Lahir Mati',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan lahir mati',
          'syarat surat lahir mati',
          'bikin surat keterangan bayi lahir mati',
          'dokumen lahir mati'
        ],
        variations: [
          'surat lahir mati', 'keterangan lahir mati', 'bayi lahir mati',
          'dokumen bayi meninggal saat lahir'
        ],
        commonMisspellings: ['surat lahir mati', 'keterangan lahir mati'],
        informalVariations: ['bayi lahir mati', 'bayi meninggal saat lahir'],
        keywords: ['surat', 'keterangan', 'lahir', 'mati', 'bayi'],
        accuracy: 90.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_perkawinan',
        documentType: 'Surat Keterangan Perkawinan',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan perkawinan',
          'syarat surat perkawinan',
          'bikin surat keterangan nikah',
          'dokumen perkawinan'
        ],
        variations: [
          'surat perkawinan', 'keterangan nikah', 'surat nikah',
          'dokumen menikah'
        ],
        commonMisspellings: ['surat perkawinan', 'keterangan nikah'],
        informalVariations: ['gimana bikin surat nikah', 'mau menikah'],
        keywords: ['surat', 'keterangan', 'perkawinan', 'nikah', 'kawin'],
        accuracy: 91.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 48
      },
      {
        id: 'surat_keterangan_perceraian',
        documentType: 'Surat Keterangan Perceraian',
        category: 'surat',
        patterns: [
          'cara mengurus surat keterangan perceraian',
          'syarat surat perceraian',
          'bikin surat keterangan cerai',
          'dokumen perceraian'
        ],
        variations: [
          'surat perceraian', 'keterangan cerai', 'surat cerai',
          'dokumen bercerai'
        ],
        commonMisspellings: ['surat perceraian', 'keterangan cerai'],
        informalVariations: ['gimana bikin surat cerai', 'mau bercerai'],
        keywords: ['surat', 'keterangan', 'perceraian', 'cerai', 'bercerai'],
        accuracy: 89.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_pembatalan_perkawinan',
        documentType: 'Surat Keterangan Pembatalan Perkawinan',
        category: 'surat',
        patterns: [
          'cara mengurus surat pembatalan perkawinan',
          'syarat surat pembatalan nikah',
          'bikin surat keterangan batal nikah',
          'dokumen pembatalan perkawinan'
        ],
        variations: [
          'surat pembatalan nikah', 'keterangan batal nikah', 'batal kawin',
          'dokumen pembatalan kawin'
        ],
        commonMisspellings: ['surat pembatalan nikah', 'batal nikah'],
        informalVariations: ['gimana batal nikah', 'mau batalin nikah'],
        keywords: ['surat', 'keterangan', 'pembatalan', 'perkawinan', 'batal'],
        accuracy: 87.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_pengangkatan_anak',
        documentType: 'Surat Keterangan Pengangkatan Anak',
        category: 'surat',
        patterns: [
          'cara mengurus surat pengangkatan anak',
          'syarat surat angkat anak',
          'bikin surat keterangan adopsi',
          'dokumen pengangkatan anak'
        ],
        variations: [
          'surat angkat anak', 'keterangan adopsi', 'surat adopsi',
          'dokumen angkat anak'
        ],
        commonMisspellings: ['surat angkat anak', 'keterangan adopsi'],
        informalVariations: ['gimana angkat anak', 'mau adopsi anak'],
        keywords: ['surat', 'keterangan', 'pengangkatan', 'anak', 'adopsi'],
        accuracy: 88.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_pengakuan_anak',
        documentType: 'Surat Keterangan Pengakuan Anak',
        category: 'surat',
        patterns: [
          'cara mengurus surat pengakuan anak',
          'syarat surat pengakuan anak',
          'bikin surat keterangan pengakuan anak',
          'dokumen pengakuan anak'
        ],
        variations: [
          'surat pengakuan anak', 'keterangan pengakuan anak', 'mengakui anak',
          'dokumen akui anak'
        ],
        commonMisspellings: ['surat pengakuan anak', 'mengakui anak'],
        informalVariations: ['gimana akui anak', 'mau akui anak'],
        keywords: ['surat', 'keterangan', 'pengakuan', 'anak', 'mengakui'],
        accuracy: 86.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_pengesahan_anak',
        documentType: 'Surat Keterangan Pengesahan Anak',
        category: 'surat',
        patterns: [
          'cara mengurus surat pengesahan anak',
          'syarat surat pengesahan anak',
          'bikin surat keterangan pengesahan anak',
          'dokumen pengesahan anak'
        ],
        variations: [
          'surat pengesahan anak', 'keterangan pengesahan anak', 'mengesahkan anak',
          'dokumen sah anak'
        ],
        commonMisspellings: ['surat pengesahan anak', 'mengesahkan anak'],
        informalVariations: ['gimana sahkan anak', 'mau sahkan anak'],
        keywords: ['surat', 'keterangan', 'pengesahan', 'anak', 'mengesahkan'],
        accuracy: 86.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_ganti_nama',
        documentType: 'Surat Keterangan Ganti Nama',
        category: 'surat',
        patterns: [
          'cara mengurus surat ganti nama',
          'syarat ganti nama',
          'bikin surat keterangan ganti nama',
          'dokumen ganti nama'
        ],
        variations: [
          'surat ganti nama', 'keterangan ganti nama', 'ubah nama',
          'dokumen ubah nama'
        ],
        commonMisspellings: ['surat ganti nama', 'ubah nama'],
        informalVariations: ['gimana ganti nama', 'mau ubah nama'],
        keywords: ['surat', 'keterangan', 'ganti', 'nama', 'ubah'],
        accuracy: 91.0,
        priority: 'P1',
        queryVolume: 'medium',
        ttlHours: 48
      },
      {
        id: 'surat_keterangan_ganti_status_kewarganegaraan',
        documentType: 'Surat Keterangan Ganti Status Kewarganegaraan',
        category: 'surat',
        patterns: [
          'cara mengurus surat ganti kewarganegaraan',
          'syarat ganti status kewarganegaraan',
          'bikin surat keterangan naturalisasi',
          'dokumen ganti kewarganegaraan'
        ],
        variations: [
          'surat ganti kewarganegaraan', 'naturalisasi', 'ubah kewarganegaraan',
          'dokumen naturalisasi'
        ],
        commonMisspellings: ['naturalisasi', 'ganti kewarganegaraan'],
        informalVariations: ['gimana jadi WNI', 'mau naturalisasi'],
        keywords: ['surat', 'keterangan', 'ganti', 'kewarganegaraan', 'naturalisasi'],
        accuracy: 85.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },
      {
        id: 'surat_keterangan_peristiwa_kependudukan_penting',
        documentType: 'Surat Keterangan Peristiwa Kependudukan Penting',
        category: 'surat',
        patterns: [
          'cara mengurus surat peristiwa kependudukan',
          'syarat surat peristiwa penting',
          'bikin surat keterangan peristiwa kependudukan',
          'dokumen peristiwa kependudukan'
        ],
        variations: [
          'surat peristiwa kependudukan', 'keterangan peristiwa penting',
          'dokumen peristiwa penting'
        ],
        commonMisspellings: ['peristiwa kependudukan', 'peristiwa penting'],
        informalVariations: ['peristiwa penting kependudukan'],
        keywords: ['surat', 'keterangan', 'peristiwa', 'kependudukan', 'penting'],
        accuracy: 83.0,
        priority: 'P2',
        queryVolume: 'low',
        ttlHours: 72
      },

      // Additional specialized documents
      {
        id: 'kartu_identitas_anak',
        documentType: 'Kartu Identitas Anak (KIA)',
        category: 'kartu',
        patterns: [
          'cara mengurus kartu identitas anak',
          'syarat KIA',
          'bikin kartu identitas anak',
          'dokumen KIA'
        ],
        variations: [
          'KIA', 'kartu anak', 'identitas anak', 'kartu identitas anak'
        ],
        commonMisspellings: ['KIA', 'kartu identitas anak'],
        informalVariations: ['gimana bikin KIA', 'butuh kartu anak'],
        keywords: ['kartu', 'identitas', 'anak', 'KIA'],
        accuracy: 93.0,
        priority: 'P0',
        queryVolume: 'high',
        ttlHours: 24
      }
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });

    console.log(`📋 [DOCUMENT_CACHE] Loaded ${patterns.length} document patterns for all 24 civil registration document types`);
  }

  /**
   * Get cached document response with session context
   */
  async getCachedDocumentResponse(
    query: string, 
    sessionId?: string
  ): Promise<DocumentCacheEntry | null> {
    const startTime = performance.now();
    
    try {
      // Normalize query for pattern matching
      const normalizedQuery = this.normalizeQuery(query);
      
      // Find matching pattern
      const matchedPattern = await this.findMatchingPattern(normalizedQuery);
      if (!matchedPattern) {
        console.log(`❌ [DOCUMENT_CACHE] No pattern match for: ${query}`);
        return null;
      }

      // Build cache key with session context
      const cacheKey = await this.buildCacheKey(matchedPattern.id, sessionId);
      
      // Try to get cached response
      const cachedEntry = await this.upstashCache.get<DocumentCacheEntry>(cacheKey);
      
      if (cachedEntry) {
        // Update usage statistics
        cachedEntry.lastUsed = new Date();
        cachedEntry.useCount++;
        
        // Update cache with new stats
        await this.upstashCache.set(cacheKey, cachedEntry, matchedPattern.ttlHours * 3600);
        
        const responseTime = performance.now() - startTime;
        this.performanceMonitor.recordCacheHit('redis', responseTime);
        
        console.log(`🎯 [DOCUMENT_CACHE] Cache HIT for ${matchedPattern.documentType}: ${responseTime.toFixed(2)}ms`);
        return cachedEntry;
      }

      console.log(`❌ [DOCUMENT_CACHE] Cache MISS for ${matchedPattern.documentType}`);
      return null;

    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.performanceMonitor.recordError(`Document cache error: ${error}`);
      console.error('❌ [DOCUMENT_CACHE] Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Cache document response with session context
   */
  async cacheDocumentResponse(
    query: string,
    response: string,
    confidence: number,
    sessionId?: string
  ): Promise<void> {
    try {
      const normalizedQuery = this.normalizeQuery(query);
      const matchedPattern = await this.findMatchingPattern(normalizedQuery);

      if (!matchedPattern) {
        console.log(`⚠️ [DOCUMENT_CACHE] Cannot cache - no pattern match for: ${query}`);
        return;
      }

      // Get session context if available
      let sessionContext;
      if (sessionId) {
        const sessionData = await this.sessionManager.getSession(sessionId);
        if (sessionData) {
          sessionContext = {
            sessionId,
            userId: sessionData.userId,
            administrativeContext: sessionData.administrativeContext
          };
        }
      }

      const cacheEntry: DocumentCacheEntry = {
        pattern: matchedPattern,
        response,
        confidence,
        lastUsed: new Date(),
        useCount: 1,
        sessionContext
      };

      const cacheKey = await this.buildCacheKey(matchedPattern.id, sessionId);
      await this.upstashCache.set(cacheKey, cacheEntry, matchedPattern.ttlHours * 3600);
      
      console.log(`💾 [DOCUMENT_CACHE] Cached response for ${matchedPattern.documentType} (TTL: ${matchedPattern.ttlHours}h)`);

    } catch (error) {
      console.error('❌ [DOCUMENT_CACHE] Error caching response:', error);
    }
  }

  /**
   * Normalize query for consistent pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      // Common misspelling corrections
      .replace(/akte/g, 'akta')
      .replace(/persyartan/g, 'persyaratan')
      .replace(/syarat2/g, 'syarat')
      // Informal to formal conversions
      .replace(/gimana/g, 'bagaimana')
      .replace(/bikin/g, 'membuat')
      .replace(/ngurus/g, 'mengurus');
  }

  /**
   * Find matching document pattern using advanced AI-powered detection
   */
  private async findMatchingPattern(query: string): Promise<DocumentPattern | null> {
    try {
      // Use the advanced document type detector
      const detectionResult = await this.detector.detectDocumentType(query);

      if (detectionResult.confidence >= 0.3) { // Minimum confidence threshold
        const pattern = this.patterns.get(detectionResult.documentId);
        if (pattern) {
          console.log(`🎯 [DOCUMENT_CACHE] Pattern matched: ${pattern.documentType} (confidence: ${(detectionResult.confidence * 100).toFixed(1)}%)`);
          return pattern;
        }
      }

      // Fallback to simple keyword matching if AI detection fails
      return this.fallbackPatternMatching(query);
    } catch (error) {
      console.error('❌ [DOCUMENT_CACHE] Error in pattern matching:', error);
      return this.fallbackPatternMatching(query);
    }
  }

  /**
   * Fallback pattern matching using simple keyword search
   */
  private fallbackPatternMatching(query: string): DocumentPattern | null {
    const queryLower = query.toLowerCase();

    for (const pattern of this.patterns.values()) {
      // Check keywords first (most efficient)
      const hasKeyword = pattern.keywords.some(keyword => queryLower.includes(keyword.toLowerCase()));
      if (!hasKeyword) continue;

      // Check main patterns
      for (const patternText of pattern.patterns) {
        if (queryLower.includes(patternText.toLowerCase())) {
          return pattern;
        }
      }

      // Check variations
      for (const variation of pattern.variations) {
        if (queryLower.includes(variation.toLowerCase())) {
          return pattern;
        }
      }

      // Check informal variations
      for (const informal of pattern.informalVariations) {
        if (queryLower.includes(informal.toLowerCase())) {
          return pattern;
        }
      }
    }

    return null;
  }

  /**
   * Build cache key with session context
   */
  private async buildCacheKey(patternId: string, sessionId?: string): Promise<string> {
    let baseKey = `doc_pattern:${patternId}`;
    
    if (sessionId) {
      const sessionData = await this.sessionManager.getSession(sessionId);
      if (sessionData?.administrativeContext?.currentService) {
        baseKey += `:${sessionData.administrativeContext.currentService}`;
      }
      if (sessionData?.userPreferences?.language) {
        baseKey += `:${sessionData.userPreferences.language}`;
      }
    }
    
    return baseKey;
  }

  /**
   * Get document cache statistics
   */
  async getDocumentCacheStats(): Promise<DocumentCacheStats> {
    // This would be implemented with actual cache statistics
    // For now, return mock data based on patterns
    return {
      totalPatterns: this.patterns.size,
      cacheHitRate: 85.5,
      averageResponseTime: 45,
      topDocumentTypes: [
        { type: 'KTP', hitCount: 1250, accuracy: 94.88 },
        { type: 'KK', hitCount: 980, accuracy: 94.1 },
        { type: 'Akta Kelahiran', hitCount: 750, accuracy: 95.0 }
      ],
      performanceByCategory: {
        kartu: { hitRate: 92.5, avgResponseTime: 35, accuracy: 92.6 },
        akta: { hitRate: 88.2, avgResponseTime: 55, accuracy: 92.3 },
        surat: { hitRate: 78.9, avgResponseTime: 65, accuracy: 87.5 }
      }
    };
  }
}
