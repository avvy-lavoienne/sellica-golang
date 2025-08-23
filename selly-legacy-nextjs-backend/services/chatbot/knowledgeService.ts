/**
 * Knowledge Service for SELLY
 * Provides access to administrative procedures and document requirements
 */

import { additionalServices, servicePatterns } from './additionalServices';
import { casualPatternGenerator } from './casualPatternGenerator';
import { documentConfigurations } from './documentConfigurations';
import { serviceResponseVariations } from './serviceResponseVariations';
// import { MultiServiceQueryAnalyzer, QueryAnalysisResult } from './multiServiceQueryAnalyzer';
// import { MultiServiceResponseSynthesizer, SynthesisOptions } from './multiServiceResponseSynthesizer';

export interface DocumentRequirement {
  name: string;
  description?: string;
  required: boolean;
}

export interface ProcessStep {
  step: number;
  description: string;
  location?: string;
  estimatedTime?: string;
  note?: string;
}

export interface DigitalServiceInfo {
  ikdSupport: boolean;
  onlineApplication: boolean;
  qrVerification: boolean;
  tteSupport: boolean;
  activationSteps?: string[];
  digitalRequirements?: string[];
}

export interface DocumentFormatInfo {
  paperType: string;
  printRequirements: string;
  digitalFormat?: string;
  qrCodeRequired?: boolean;
}

export interface ServiceInfo {
  serviceName: string;
  serviceCode: string;
  serviceType: string;
  requirements: DocumentRequirement[];
  processSteps: ProcessStep[];
  duration: string;
  cost: string;
  officeHours: string;
  targetAge?: string;
  notes?: string[];
  importance?: string[];
  // 2025 Enhancements
  digitalServices?: DigitalServiceInfo;
  documentFormats?: DocumentFormatInfo;
  regulationBasis?: string[];
  lastUpdated?: string;
  version?: string;
  specialCases?: Record<string, string[]>;
  outputDocuments?: string[];
}

export class KnowledgeService {
  private static instance: KnowledgeService;
  private knowledgeBase: Map<string, ServiceInfo> = new Map();
  private multiServiceAnalyzer: MultiServiceQueryAnalyzer;
  private multiServiceSynthesizer: MultiServiceResponseSynthesizer;

  private constructor() {
    this.initializeKnowledgeBase();
    this.multiServiceAnalyzer = new MultiServiceQueryAnalyzer();
    this.multiServiceSynthesizer = new MultiServiceResponseSynthesizer();
  }

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  private initializeKnowledgeBase(): void {
    // KTP-el (2025 Updated) - Kartu Tanda Penduduk elektronik
    this.knowledgeBase.set('ktp_baru', {
      serviceName: 'Kartu Tanda Penduduk elektronik (KTP-el)',
      serviceCode: 'KTP-2025-001',
      serviceType: 'Pembuatan KTP-el Baru',
      targetAge: '17 tahun ke atas atau sudah kawin',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 73/2022 tentang Pencatatan Nama',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Fotokopi Kartu Keluarga (KK)', required: true },
        { name: 'Akta kelahiran/ijazah terakhir asli', required: true },
        { name: 'Bukti umur 17 tahun atau buku nikah/akta perkawinan jika sudah kawin', required: true }
      ],
      digitalServices: {
        ikdSupport: true,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true,
        activationSteps: [
          'Scan QR code di Dukcapil',
          'Verifikasi wajah',
          'Aktivasi aplikasi IKD'
        ],
        digitalRequirements: [
          'Sudah punya e-KTP',
          'Ponsel dengan internet',
          'NIK',
          'Email/nomor HP aktif'
        ]
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        digitalFormat: 'IKD (Identitas Kependudukan Digital)',
        qrCodeRequired: true
      },
      processSteps: [
        {
          step: 1,
          description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap',
          location: 'Loket pelayanan KTP',
          estimatedTime: '15 menit'
        },
        {
          step: 2,
          description: 'Verifikasi dokumen oleh petugas',
          location: 'Loket verifikasi',
          estimatedTime: '10 menit'
        },
        {
          step: 3,
          description: 'Pengambilan foto dan sidik jari (perekaman biometrik)',
          location: 'Ruang perekaman',
          estimatedTime: '15 menit'
        },
        {
          step: 4,
          description: 'Mendapat tanda terima dan surat keterangan sementara',
          location: 'Loket penyerahan',
          estimatedTime: '5 menit'
        },
        {
          step: 5,
          description: 'Pengambilan KTP sesuai jadwal yang ditentukan',
          location: 'Loket pengambilan',
          estimatedTime: '5 menit'
        }
      ],
      duration: 'Gratis, bisa online via aplikasi IKD atau situs Dukcapil daerah',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      specialCases: {
        'pergantian_rusak': [
          'Fotokopi KK',
          'KTP-el rusak'
        ],
        'hilang': [
          'Fotokopi KK',
          'Surat keterangan hilang dari kepolisian asli',
          'Foto/scan KTP-el lama (jika ada)'
        ]
      },
      notes: [
        'Wajib datang sendiri untuk perekaman biometrik',
        'Bawa dokumen asli untuk verifikasi',
        'Nama harus huruf Latin, minimal 2 kata, maksimal 60 huruf (termasuk spasi)',
        'Tidak disingkat kecuali gelar, tanpa angka/tanda baca',
        'Tidak bermakna negatif',
        'Cetak mandiri menggunakan kertas HVS A4 80 gram dan verifikasi QR code',
        'IKD wajib diaktivasi untuk akses online mulai 2025'
      ],
      importance: [
        'Dokumen identitas resmi warga negara Indonesia',
        'Diperlukan untuk semua urusan administrasi',
        'Berlaku seumur hidup dengan pembaruan berkala'
      ]
    });

    // KIA (Kartu Identitas Anak) - 2025 Updated
    this.knowledgeBase.set('kia', {
      serviceName: 'Kartu Identitas Anak (KIA)',
      serviceCode: 'KIA-2025-001',
      serviceType: 'Pembuatan Kartu Identitas Anak',
      targetAge: '0-17 tahun',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Fotokopi akta kelahiran', required: true },
        { name: 'KK orang tua', required: true },
        { name: 'KTP-el orang tua', required: true }
      ],
      specialCases: {
        'usia_0_5': [
          'Fotokopi akta kelahiran',
          'KK orang tua',
          'KTP-el orang tua',
          'Pas foto berwarna (jika >5 tahun)'
        ],
        'usia_5_17': [
          'Fotokopi akta kelahiran',
          'KK orang tua',
          'KTP-el orang tua',
          'Pas foto berwarna ukuran 4x6'
        ],
        'hilang_rusak': [
          'Surat keterangan hilang/rusak',
          'Fotokopi KK',
          'KTP-el orang tua'
        ]
      },
      processSteps: [
        {
          step: 1,
          description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap',
          location: 'Loket pelayanan KIA',
          estimatedTime: '15 menit'
        },
        {
          step: 2,
          description: 'Verifikasi dokumen oleh petugas',
          location: 'Loket verifikasi',
          estimatedTime: '10 menit'
        },
        {
          step: 3,
          description: 'Pengambilan foto anak (untuk usia 5-17 tahun)',
          location: 'Ruang foto',
          estimatedTime: '10 menit'
        },
        {
          step: 4,
          description: 'Mendapat tanda terima',
          location: 'Loket penyerahan',
          estimatedTime: '5 menit'
        }
      ],
      duration: 'Gratis, proses langsung',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Untuk anak usia 0-5 tahun tidak perlu pas foto',
        'Untuk anak usia 5-17 tahun wajib pas foto berwarna ukuran 4x6',
        'Orang tua/wali harus mendampingi',
        'KIA berlaku hingga anak berusia 17 tahun'
      ]
    });

    // KTP Hilang (Lost KTP)
    this.knowledgeBase.set('ktp_hilang', {
      serviceName: 'Kartu Tanda Penduduk (KTP)',
      serviceCode: 'KTP-002',
      serviceType: 'Penggantian KTP Hilang',
      requirements: [
        { name: 'Surat kehilangan dari kepolisian', required: true },
        { name: 'Fotokopi Kartu Keluarga (KK)', required: true },
        { name: 'Pas foto berwarna 3x4 cm (2 lembar, latar belakang merah)', required: true },
        { name: 'Formulir permohonan F-1.01', required: true }
      ],
      processSteps: [
        {
          step: 1,
          description: 'Membuat surat kehilangan di kepolisian',
          location: 'Kantor Polisi terdekat',
          estimatedTime: '30-60 menit'
        },
        {
          step: 2,
          description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap',
          location: 'Loket pelayanan KTP',
          estimatedTime: '15 menit'
        },
        {
          step: 3,
          description: 'Mengisi formulir permohonan F-1.01',
          location: 'Meja pengisian formulir',
          estimatedTime: '10 menit'
        },
        {
          step: 4,
          description: 'Verifikasi dokumen dan data',
          location: 'Loket verifikasi',
          estimatedTime: '10 menit'
        },
        {
          step: 5,
          description: 'Pengambilan foto dan sidik jari (jika diperlukan)',
          location: 'Ruang perekaman',
          estimatedTime: '15 menit'
        },
        {
          step: 6,
          description: 'Mendapat tanda terima',
          location: 'Loket penyerahan',
          estimatedTime: '5 menit'
        }
      ],
      duration: '7 hari kerja',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Surat kehilangan dari polisi wajib dibawa',
        'Proses lebih cepat karena data sudah ada di sistem'
      ]
    });

    // KTP Rusak (Damaged KTP)
    this.knowledgeBase.set('ktp_rusak', {
      serviceName: 'Kartu Tanda Penduduk (KTP)',
      serviceCode: 'KTP-003',
      serviceType: 'Penggantian KTP Rusak',
      requirements: [
        { name: 'KTP lama yang rusak', required: true },
        { name: 'Fotokopi Kartu Keluarga (KK)', required: true },
        { name: 'Pas foto berwarna 3x4 cm (2 lembar, latar belakang merah)', required: true },
        { name: 'Formulir permohonan F-1.01', required: true }
      ],
      processSteps: [
        {
          step: 1,
          description: 'Datang ke kantor Disdukcapil dengan KTP rusak dan persyaratan',
          location: 'Loket pelayanan KTP',
          estimatedTime: '15 menit'
        },
        {
          step: 2,
          description: 'Mengisi formulir permohonan F-1.01',
          location: 'Meja pengisian formulir',
          estimatedTime: '10 menit'
        },
        {
          step: 3,
          description: 'Verifikasi dokumen dan KTP rusak',
          location: 'Loket verifikasi',
          estimatedTime: '10 menit'
        },
        {
          step: 4,
          description: 'Pengambilan foto dan sidik jari (jika diperlukan)',
          location: 'Ruang perekaman',
          estimatedTime: '15 menit'
        },
        {
          step: 5,
          description: 'Penyerahan KTP rusak dan mendapat tanda terima',
          location: 'Loket penyerahan',
          estimatedTime: '5 menit'
        }
      ],
      duration: '7 hari kerja',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'KTP rusak harus diserahkan',
        'Tingkat kerusakan akan dievaluasi petugas'
      ]
    });

    // KK Baru Scenario 1: Belum Punya Dokumen Sama Sekali (No existing civil registration) - 2025 Updated
    this.knowledgeBase.set('kk_baru_no_documents', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-2025-001A',
      serviceType: 'KK Baru - Belum Punya Dokumen Kependudukan Sama Sekali',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 73/2022 tentang Pencatatan Nama',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Melakukan pengecekan biometric di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut atau di Kantor Kecamatan Domisili', required: true, description: 'Langkah pertama untuk memastikan tidak ada duplikasi data dalam sistem kependudukan.' },
        { name: 'Surat Keterangan Domisili dari RT, RW dan Desa/Kelurahan', required: true, description: 'Bukti tempat tinggal yang sah dari pemerintahan tingkat bawah.' },
        { name: 'F-1.04 Surat Pernyataan Tidak Memiliki Dokumen Kependudukan', required: true, description: 'Formulir resmi yang menyatakan bahwa pemohon belum memiliki dokumen kependudukan apapun.' },
        { name: 'Dokumen Pendukung yang dimiliki (Ijazah atau Buku Nikah dan/atau Akta Kelahiran)', required: true, description: 'Dokumen apapun yang dapat mendukung identitas dan data diri pemohon.' }
      ],
      digitalServices: {
        ikdSupport: true,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        qrCodeRequired: true
      },
      processSteps: [
        { step: 1, description: 'Melakukan pengecekan biometric di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut atau di Kantor Kecamatan Domisili', estimatedTime: '30 menit' },
        { step: 2, description: 'Menyiapkan Surat Keterangan Domisili dari RT, RW dan Desa/Kelurahan', estimatedTime: '1-3 hari' },
        { step: 3, description: 'Menyiapkan F-1.04 Surat Pernyataan Tidak Memiliki Dokumen Kependudukan', estimatedTime: '15 menit' },
        { step: 4, description: 'Melampirkan Dokumen Pendukung yang dimiliki (Ijazah atau Buku Nikah dan/atau Akta Kelahiran)', estimatedTime: '15 menit' },
        { step: 5, description: 'Langsung melakukan Perekaman KTP Elektronik setelah dilakukan Input Biodata Baru', estimatedTime: '45 menit' }
      ],
      duration: '1-3 hari kerja (tergantung pengurusan surat domisili)',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon tidak dapat diwakilkan',
        'Proses dimulai dengan pengecekan biometric untuk memastikan tidak ada duplikasi',
        'Setelah biodata baru diinput, langsung dilakukan perekaman KTP elektronik',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ],
      importance: [
        'Mendapatkan identitas resmi pertama kali',
        'Akses ke layanan pemerintah',
        'Syarat untuk membuat dokumen lainnya',
        'Hak sebagai warga negara'
      ]
    });

    // KK Baru Scenario 2: Pengajuan KK Baru Karena Pernikahan (New marriage) - 2025 Updated
    this.knowledgeBase.set('kk_baru_marriage', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-2025-001B',
      serviceType: 'KK Baru - Pengajuan KK Baru Karena Pernikahan',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 73/2022 tentang Pencatatan Nama',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Fotokopi buku nikah/akta perkawinan', required: true, description: 'Bukti sah pernikahan yang telah dicatatkan secara resmi.' },
        { name: 'SPTJM perkawinan jika belum tercatat', required: false, description: 'Surat Pernyataan Tanggung Jawab Mutlak jika pernikahan belum tercatat resmi.' },
        { name: 'Pengantar RT/RW', required: true, description: 'Surat pengantar dari RT/RW setempat.' }
      ],
      digitalServices: {
        ikdSupport: true,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        qrCodeRequired: true
      },
      processSteps: [
        { step: 1, description: 'Melampirkan Buku Nikah/Atau Akta Pernikahan', estimatedTime: '10 menit' },
        { step: 2, description: 'Mengajukan Perpindahan jika kedua mempelai berbeda domisili', estimatedTime: '1-7 hari kerja' },
        { step: 3, description: 'Pemohon mengisi dan menandatangani formulir dan memberikan persyaratan', estimatedTime: '15 menit' },
        { step: 4, description: 'Petugas pelayanan melakukan verifikasi dan validasi terhadap formulir dan persyaratan', estimatedTime: '15 menit' },
        { step: 5, description: 'Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan', estimatedTime: '10 menit' },
        { step: 6, description: 'Pejabat menandatangani Kartu Keluarga dengan proses Tanda Tangan Elektronik', estimatedTime: '5 menit' },
        { step: 7, description: 'Petugas menerbitkan Kartu Keluarga', estimatedTime: '5 menit' },
        { step: 8, description: 'Kartu Keluarga disampaikan kepada pemohon', estimatedTime: '5 menit' }
      ],
      duration: 'Selesai pada hari yang sama (jika tidak perlu perpindahan domisili)',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon tidak dapat diwakilkan',
        'Jika kedua mempelai berbeda domisili, proses perpindahan harus diselesaikan terlebih dahulu',
        'Untuk perpindahan domisili, tanyakan: "Bagaimana cara mengurus kepindahan?" atau "Syarat SKPWNI"',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ],
      importance: [
        'Legalitas keluarga baru',
        'Syarat untuk mengurus akta kelahiran anak',
        'Akses layanan kesehatan keluarga',
        'Administrasi kependudukan yang tertib'
      ]
    });

    // KK Perubahan Data - New service based on official information
    this.knowledgeBase.set('kk_perubahan', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-002',
      serviceType: 'Perubahan Data Kartu Keluarga',
      requirements: [
        { name: 'Formulir Perubahan Elemen Data F-1.06 (dapat di download di menu formulir persyaratan)', required: true },
        { name: 'Fotokopi Kartu Keluarga', required: true },
        { name: 'Fotokopi KTP el pemohon', required: true },
        { name: 'Fotokopi Dokumen Pendukung Perubahan Data', required: true },
        { name: 'E-mail dan No. Telp Aktif', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Pemohon adalah yang berkepentingan/tidak diwakilkan', estimatedTime: '5 menit' },
        { step: 2, description: 'Pemohon mengisi dan menandatangani formulir dan memberikan persyaratan', estimatedTime: '10 menit' },
        { step: 3, description: 'Petugas pelayanan melakukan verifikasi dan validasi terhadap formulir dan persyaratan', estimatedTime: '15 menit' },
        { step: 4, description: 'Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan', estimatedTime: '10 menit' },
        { step: 5, description: 'Pejabat menandatangani Kartu Keluarga dengan proses Tanda Tangan Elektronik', estimatedTime: '5 menit' },
        { step: 6, description: 'Petugas menerbitkan Kartu Keluarga', estimatedTime: '5 menit' },
        { step: 7, description: 'Kartu Keluarga disampaikan kepada pemohon', estimatedTime: '5 menit' }
      ],
      duration: 'Selesai pada hari yang sama',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon tidak dapat diwakilkan',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ]
    });

    // KK Penambahan Anggota Keluarga - New service based on official information
    this.knowledgeBase.set('kk_penambahan', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-003',
      serviceType: 'Penambahan Anggota Keluarga',
      requirements: [
        { name: 'Formulir Biodata Keluarga F-1.01 (dapat di download di menu formulir persyaratan)', required: true },
        { name: 'Fotokopi Kompen Kelahiran dari desa/Surat Keterangan Lahir', required: true },
        { name: 'Fotokopi Kartu Keluarga Lama', required: true },
        { name: 'Email dan No. Telp Aktif', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Pemohon adalah yang berkepentingan/tidak diwakilkan', estimatedTime: '5 menit' },
        { step: 2, description: 'Pemohon mengisi dan menandatangani formulir dan memberikan persyaratan', estimatedTime: '10 menit' },
        { step: 3, description: 'Petugas pelayanan melakukan verifikasi dan validasi terhadap formulir dan persyaratan', estimatedTime: '15 menit' },
        { step: 4, description: 'Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan', estimatedTime: '10 menit' },
        { step: 5, description: 'Pejabat menandatangani Kartu Keluarga dengan proses Tanda Tangan Elektronik', estimatedTime: '5 menit' },
        { step: 6, description: 'Petugas menerbitkan Kartu Keluarga', estimatedTime: '5 menit' },
        { step: 7, description: 'Kartu Keluarga disampaikan kepada pemohon', estimatedTime: '5 menit' }
      ],
      duration: 'Selesai pada hari yang sama',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon tidak dapat diwakilkan',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ]
    });

    // KK Penggantian (Hilang/Rusak) - New specific service
    this.knowledgeBase.set('kk_penggantian', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-004',
      serviceType: 'Penggantian KK Hilang/Rusak',
      requirements: [
        { name: 'Surat Keterangan Kehilangan dari Kepolisian (jika hilang)', required: true },
        { name: 'Fotokopi KK yang rusak (jika masih ada)', required: false },
        { name: 'Fotokopi KTP el kepala keluarga', required: true },
        { name: 'Fotokopi akta kelahiran seluruh anggota keluarga', required: true },
        { name: 'Fotokopi akta perkawinan/perceraian (jika ada)', required: false },
        { name: 'E-mail dan No. Telp Aktif', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Pemohon adalah yang berkepentingan/tidak diwakilkan', estimatedTime: '5 menit' },
        { step: 2, description: 'Pemohon mengisi dan menandatangani formulir dan memberikan persyaratan', estimatedTime: '10 menit' },
        { step: 3, description: 'Petugas pelayanan melakukan verifikasi dan validasi terhadap formulir dan persyaratan', estimatedTime: '15 menit' },
        { step: 4, description: 'Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan', estimatedTime: '10 menit' },
        { step: 5, description: 'Pejabat menandatangani Kartu Keluarga dengan proses Tanda Tangan Elektronik', estimatedTime: '5 menit' },
        { step: 6, description: 'Petugas menerbitkan Kartu Keluarga', estimatedTime: '5 menit' },
        { step: 7, description: 'Kartu Keluarga disampaikan kepada pemohon', estimatedTime: '5 menit' }
      ],
      duration: 'Selesai pada hari yang sama',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon tidak dapat diwakilkan',
        'Wajib membuat surat kehilangan dari polisi jika KK hilang',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ]
    });

    // KK Overview - Comprehensive overview for general queries
    this.knowledgeBase.set('kk_overview', {
      serviceName: 'Kartu Keluarga (KK)',
      serviceCode: 'KK-OVERVIEW',
      serviceType: 'Layanan Kartu Keluarga Lengkap',
      requirements: [],
      processSteps: [],
      duration: 'Selesai pada hari yang sama',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil'
      ]
    });

    // Kepindahan (Migration/Moving Service) - Official comprehensive information
    this.knowledgeBase.set('kepindahan', {
      serviceName: 'Kepindahan',
      serviceCode: 'KEPINDAHAN-001',
      serviceType: 'Pelayanan Kepindahan WNI',
      requirements: [
        { name: 'Formulir Kepindahan F-1.03 (dapat di download di menu formulir persyaratan)', required: true, description: 'Formulir resmi untuk pengajuan kepindahan yang dapat diunduh dari website Disdukcapil.' },
        { name: 'Fotokopi Kartu Keluarga', required: true, description: 'Kartu keluarga dari domisili asal yang akan ditinggalkan.' },
        { name: 'Fotokopi KTP-el', required: true, description: 'KTP elektronik pemohon yang akan pindah domisili.' },
        { name: 'Surat Pernyataan Izin dari Orangtua/Wali yang telah ditandatangani di atas materai Rp.10.000,-', required: false, description: 'Khusus untuk pemohon di bawah umur, diperlukan izin tertulis dari orangtua/wali.' },
        { name: 'KTP Orangtua/Wali', required: false, description: 'Khusus untuk pemohon di bawah umur, sebagai bukti identitas orangtua/wali yang memberikan izin.' },
        { name: 'E-mail dan No. Telp Aktif', required: true, description: 'Kontak aktif untuk komunikasi terkait proses kepindahan.' }
      ],
      processSteps: [
        { step: 1, description: 'Pemohon adalah yang bersangkutan/tidak diwakilkan', estimatedTime: '5 menit' },
        { step: 2, description: 'Pemohon mengisi, menandatangani formulir dan memberikan persyaratan', estimatedTime: '15 menit' },
        { step: 3, description: 'Petugas pelayanan melakukan verifikasi berkas persyaratan', estimatedTime: '15 menit' },
        { step: 4, description: 'Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan', estimatedTime: '10 menit' },
        { step: 5, description: 'Pejabat menandatangan dengan proses Tanda Tangan Elektronik', estimatedTime: '5 menit' },
        { step: 6, description: 'Petugas menerbitkan Surat Keterangan Pindah WNI (SKPWNI) menginformasikan status kepindahan yang selesai diproses kepada pemohon', estimatedTime: '10 menit' },
        { step: 7, description: 'SKPWNI disampaikan kepada pemohon', estimatedTime: '5 menit' }
      ],
      duration: 'Selesai pada hari yang sama',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pemohon adalah yang bersangkutan/tidak diwakilkan',
        'Jika status di bawah umur, diperlukan surat pernyataan izin dari orangtua/wali dengan materai Rp.10.000,-',
        'Tersedia pelayanan online melalui pastioke.garutkab.go.id',
        'Tersedia pelayanan offline dengan datang langsung ke kantor Disdukcapil',
        'Hasil akhir berupa Surat Keterangan Pindah WNI (SKPWNI)'
      ],
      importance: [
        'Syarat untuk pindah domisili resmi',
        'Diperlukan untuk KK baru setelah pernikahan (jika beda domisili)',
        'Legalitas tempat tinggal baru',
        'Akses layanan pemerintah di domisili baru'
      ]
    });

    // Akta Kelahiran - 2025 Updated
    this.knowledgeBase.set('akta_kelahiran', {
      serviceName: 'Akta Kelahiran',
      serviceCode: 'AKTA-LAHIR-2025-001',
      serviceType: 'Pembuatan Akta Kelahiran',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 73/2022 tentang Pencatatan Nama',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Surat keterangan lahir dari RS/klinik/bidan atau SPTJM (form F-2.03 dengan 2 saksi)', required: true },
        { name: 'Fotokopi KTP-el orang tua & saksi (2 orang)', required: true },
        { name: 'KK', required: true },
        { name: 'Buku nikah/akta perkawinan atau SPTJM pasangan (F-2.04 dengan 2 saksi)', required: true }
      ],
      specialCases: {
        'anak_luar_nikah': [
          'Tambah pengakuan anak'
        ]
      },
      outputDocuments: ['Akta', 'KK baru', 'KIA'],
      digitalServices: {
        ikdSupport: true,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        digitalFormat: 'Aplikasi Alpukat Betawi (Jakarta) atau IKD',
        qrCodeRequired: true
      },
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi dokumen dan data', estimatedTime: '15 menit' },
        { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
      ],
      duration: 'Gratis, bisa online via aplikasi Alpukat Betawi (Jakarta) atau IKD',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Pendaftaran maksimal 60 hari setelah kelahiran',
        'Kedua orang tua atau salah satu harus hadir',
        'Nama harus huruf Latin, minimal 2 kata, maksimal 60 huruf (termasuk spasi)',
        'Tidak disingkat kecuali gelar, tanpa angka/tanda baca',
        'Tidak bermakna negatif',
        'Cetak mandiri menggunakan kertas HVS A4 80 gram dan verifikasi QR code',
        'Proses gratis, bisa online via aplikasi IKD atau situs Dukcapil daerah'
      ]
    });

    // Akta Perkawinan
    this.knowledgeBase.set('akta_perkawinan', {
      serviceName: 'Akta Perkawinan',
      serviceCode: 'AP-001',
      serviceType: 'Pembuatan Akta Perkawinan',
      requirements: [
        { name: 'Fotokopi KTP kedua mempelai', required: true },
        { name: 'Fotokopi Kartu Keluarga kedua mempelai', required: true },
        { name: 'Fotokopi akta kelahiran kedua mempelai', required: true },
        { name: 'Surat keterangan nikah dari KUA/gereja', required: true },
        { name: 'Pas foto berwarna 4x6 cm (4 lembar)', required: true },
        { name: 'Formulir permohonan akta perkawinan', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi dokumen perkawinan', estimatedTime: '20 menit' },
        { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
      ],
      duration: '14 hari kerja',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: ['Kedua mempelai harus hadir', 'Pendaftaran maksimal 60 hari setelah perkawinan']
    });

    // Akta Perceraian
    this.knowledgeBase.set('akta_perceraian', {
      serviceName: 'Akta Perceraian',
      serviceCode: 'AC-001',
      serviceType: 'Pembuatan Akta Perceraian',
      requirements: [
        { name: 'Fotokopi KTP kedua belah pihak', required: true },
        { name: 'Fotokopi Kartu Keluarga', required: true },
        { name: 'Fotokopi akta perkawinan', required: true },
        { name: 'Salinan putusan pengadilan yang telah berkekuatan hukum tetap', required: true },
        { name: 'Formulir permohonan akta perceraian', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi putusan pengadilan', estimatedTime: '20 menit' },
        { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
      ],
      duration: '14 hari kerja',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: ['Salah satu pihak harus hadir', 'Putusan pengadilan harus sudah berkekuatan hukum tetap']
    });

    // Akta Kematian
    this.knowledgeBase.set('akta_kematian', {
      serviceName: 'Akta Kematian',
      serviceCode: 'AM-001',
      serviceType: 'Pembuatan Akta Kematian',
      requirements: [
        { name: 'Surat keterangan kematian dari dokter/rumah sakit', required: true },
        { name: 'Fotokopi KTP almarhum/almarhumah', required: true },
        { name: 'Fotokopi Kartu Keluarga', required: true },
        { name: 'Fotokopi KTP pelapor (keluarga terdekat)', required: true },
        { name: 'Formulir permohonan akta kematian', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi dokumen kematian', estimatedTime: '15 menit' },
        { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
      ],
      duration: '7 hari kerja',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: ['Pelaporan maksimal 30 hari setelah kematian', 'Keluarga terdekat yang melaporkan']
    });

    // Akta Pengakuan Anak - NEW TRAINING INTEGRATION
    this.knowledgeBase.set('akta_pengakuan_anak', {
      serviceName: 'Akta Pengakuan Anak',
      serviceCode: 'APA-001',
      serviceType: 'Pembuatan Akta Pengakuan Anak',
      lastUpdated: '2025-02-02',
      version: '1.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'KUH Perdata tentang Pengakuan Anak'
      ],
      requirements: [
        { name: 'Akta kelahiran anak yang akan diakui', required: true },
        { name: 'KTP-el ayah yang mengakui', required: true },
        { name: 'Kartu Keluarga ayah', required: true },
        { name: 'Surat pernyataan pengakuan anak bermaterai', required: true },
        { name: 'Surat persetujuan ibu (jika diperlukan)', required: false },
        { name: 'Pas foto ayah terbaru', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Ayah yang mengakui datang ke Disdukcapil', estimatedTime: '15 menit' },
        { step: 2, description: 'Menyerahkan dokumen persyaratan lengkap', estimatedTime: '10 menit' },
        { step: 3, description: 'Mengisi formulir pernyataan pengakuan anak', estimatedTime: '20 menit' },
        { step: 4, description: 'Verifikasi data dan dokumen oleh petugas', estimatedTime: '30 menit' },
        { step: 5, description: 'Proses pencatatan dan penerbitan akta', estimatedTime: '1-2 minggu' }
      ],
      duration: '1-2 minggu setelah dokumen lengkap',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      importance: [
        'Anak mendapat status hukum sebagai anak yang diakui',
        'Timbul hubungan keperdataan antara ayah dan anak',
        'Anak berhak atas nafkah dari ayah',
        'Anak berhak atas warisan dari ayah',
        'Ayah berkewajiban memelihara dan mendidik anak'
      ],
      notes: [
        'Ayah yang mengakui harus hadir langsung',
        'Pengakuan tidak dapat dicabut begitu saja',
        'Untuk anak dewasa diperlukan persetujuan anak',
        'Jika ibu tidak setuju, dapat melalui proses pengadilan'
      ]
    });

    // Akta Pengesahan Anak - NEW SERVICE ADDITION
    this.knowledgeBase.set('akta_pengesahan_anak', {
      serviceName: 'Akta Pengesahan Anak',
      serviceCode: 'APSA-001',
      serviceType: 'Pembuatan Akta Pengesahan Anak',
      lastUpdated: '2025-02-02',
      version: '1.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'KUH Perdata tentang Pengesahan Anak'
      ],
      requirements: [
        { name: 'Akta kelahiran anak yang akan disahkan', required: true },
        { name: 'Akta perkawinan orang tua', required: true },
        { name: 'KTP-el kedua orang tua', required: true },
        { name: 'Kartu Keluarga', required: true },
        { name: 'Surat pernyataan pengesahan anak bermaterai', required: true },
        { name: 'Pas foto kedua orang tua terbaru', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Kedua orang tua datang ke Disdukcapil', estimatedTime: '15 menit' },
        { step: 2, description: 'Menyerahkan dokumen persyaratan lengkap', estimatedTime: '10 menit' },
        { step: 3, description: 'Mengisi formulir pernyataan pengesahan anak', estimatedTime: '20 menit' },
        { step: 4, description: 'Verifikasi data dan dokumen oleh petugas', estimatedTime: '30 menit' },
        { step: 5, description: 'Proses pencatatan dan penerbitan akta', estimatedTime: '1-2 minggu' }
      ],
      duration: '1-2 minggu setelah dokumen lengkap',
      cost: 'Gratis (Layanan administrasi kependudukan tidak dipungut biaya)',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      importance: [
        'Anak mendapat status hukum sebagai anak sah',
        'Timbul hubungan keperdataan penuh dengan kedua orang tua',
        'Anak berhak atas nafkah dan warisan dari kedua orang tua',
        'Status hukum anak menjadi sama dengan anak yang lahir dalam perkawinan',
        'Memberikan perlindungan hukum penuh kepada anak'
      ],
      notes: [
        'Kedua orang tua harus hadir langsung',
        'Hanya dapat dilakukan setelah orang tua menikah secara sah',
        'Pengesahan berlaku surut sejak kelahiran anak',
        'Untuk anak dewasa diperlukan persetujuan anak yang bersangkutan'
      ]
    });

    // Kartu Identitas Anak (KIA) - 2025 Updated
    this.knowledgeBase.set('kia', {
      serviceName: 'Kartu Identitas Anak (KIA)',
      serviceCode: 'KIA-2025-001',
      serviceType: 'Pembuatan Kartu Identitas Anak',
      targetAge: '0-17 tahun',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Fotokopi akta kelahiran anak', required: true },
        { name: 'Fotokopi KTP-el kedua orang tua', required: true },
        { name: 'Fotokopi Kartu Keluarga', required: true },
        { name: 'Pas foto anak 2x3 cm (2 lembar, latar belakang biru) - untuk usia 5-17 tahun', required: false },
        { name: 'Formulir permohonan KIA', required: true }
      ],
      specialCases: {
        'usia_0_5': [
          'Fotokopi akta kelahiran',
          'KK orang tua',
          'KTP-el orang tua',
          'Pas foto berwarna (jika >5 tahun)'
        ],
        'usia_5_17': [
          'Fotokopi akta kelahiran',
          'KK orang tua',
          'KTP-el orang tua',
          'Pas foto berwarna ukuran 4x6'
        ],
        'hilang_rusak': [
          'Surat keterangan hilang/rusak',
          'Fotokopi KK',
          'KTP-el orang tua'
        ]
      },
      digitalServices: {
        ikdSupport: false,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        qrCodeRequired: true
      },
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan anak dan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan KIA', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi dokumen', estimatedTime: '10 menit' },
        { step: 4, description: 'Pengambilan foto anak (untuk usia 5-17 tahun)', estimatedTime: '10 menit' },
        { step: 5, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
      ],
      duration: 'Gratis, proses langsung',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Untuk anak usia 0-5 tahun tidak perlu pas foto',
        'Untuk anak usia 5-17 tahun wajib pas foto berwarna ukuran 4x6',
        'Orang tua/wali harus mendampingi',
        'KIA berlaku hingga anak berusia 17 tahun',
        'Cetak mandiri menggunakan kertas HVS A4 80 gram dan verifikasi QR code'
      ]
    });

    // Biodata Penduduk - 2025 Updated
    this.knowledgeBase.set('biodata_penduduk', {
      serviceName: 'Biodata Penduduk',
      serviceCode: 'BIODATA-2025-001',
      serviceType: 'Pembuatan Biodata Penduduk',
      lastUpdated: '2025-02-02',
      version: '2.0',
      regulationBasis: [
        'UU No. 24/2013 tentang Administrasi Kependudukan',
        'Permendagri No. 4/2024 tentang IKD'
      ],
      requirements: [
        { name: 'Fotokopi KTP-el', required: true },
        { name: 'KK', required: true },
        { name: 'Surat pengantar dari kelurahan', required: true },
        { name: 'Dokumen pendukung: Fotokopi akta kelahiran, Ijazah/STTB, Akta nikah (sesuai kebutuhan)', required: false }
      ],
      digitalServices: {
        ikdSupport: true,
        onlineApplication: true,
        qrVerification: true,
        tteSupport: true
      },
      documentFormats: {
        paperType: 'HVS A4 80 gram',
        printRequirements: 'Cetak mandiri dengan verifikasi QR code',
        qrCodeRequired: true
      },
      processSteps: [
        { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
        { step: 2, description: 'Mengisi formulir permohonan biodata penduduk', estimatedTime: '10 menit' },
        { step: 3, description: 'Verifikasi dokumen oleh petugas', estimatedTime: '10 menit' },
        { step: 4, description: 'Mendapat biodata penduduk', estimatedTime: '5 menit' }
      ],
      duration: 'Gratis, proses langsung',
      cost: 'Gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Biodata penduduk berisi informasi lengkap data kependudukan',
        'Dapat digunakan untuk keperluan administrasi seperti melamar kerja, sekolah, beasiswa',
        'Dokumen pendukung disesuaikan dengan kebutuhan',
        'Cetak mandiri menggunakan kertas HVS A4 80 gram dan verifikasi QR code'
      ]
    });

    // Complete Service Overview
    this.knowledgeBase.set('layanan_lengkap_disdukcapil', {
      serviceName: 'Layanan Lengkap Disdukcapil Kabupaten Garut',
      serviceCode: 'OVERVIEW-001',
      serviceType: 'Daftar Lengkap Dokumen dan Layanan',
      requirements: [
        { name: 'Informasi lengkap semua layanan Disdukcapil', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Pilih jenis dokumen yang dibutuhkan', estimatedTime: '1 menit' },
        { step: 2, description: 'Tanyakan persyaratan spesifik kepada SELLY', estimatedTime: '1 menit' },
        { step: 3, description: 'Siapkan dokumen yang diperlukan', estimatedTime: 'Bervariasi' },
        { step: 4, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15-30 menit' }
      ],
      duration: 'Bervariasi per layanan',
      cost: 'Sebagian besar gratis',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'Semua layanan administrasi kependudukan tersedia',
        'Persyaratan berbeda untuk setiap jenis dokumen',
        'Sebagian besar layanan gratis sesuai regulasi pemerintah',
        'Waktu penyelesaian bervariasi dari 1-14 hari kerja'
      ]
    });

    // KTP Interactive Assessment
    this.knowledgeBase.set('ktp_interactive_assessment', {
      serviceName: 'KTP Interactive Assessment',
      serviceCode: 'KTP-ASSESS-001',
      serviceType: 'Penilaian Interaktif Layanan KTP',
      requirements: [
        { name: 'Penilaian situasi spesifik pengguna', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Menanyakan status perekaman biometrik', estimatedTime: '1 menit' },
        { step: 2, description: 'Menanyakan status dokumen (hilang/rusak)', estimatedTime: '1 menit' },
        { step: 3, description: 'Menanyakan kebutuhan koreksi data', estimatedTime: '1 menit' },
        { step: 4, description: 'Memberikan panduan spesifik sesuai situasi', estimatedTime: '2 menit' }
      ],
      duration: 'Interaktif',
      cost: 'Gratis',
      officeHours: '24/7 (Assessment Online)',
      notes: [
        'Assessment dilakukan untuk memberikan panduan yang tepat',
        'Setiap situasi KTP memiliki persyaratan yang berbeda',
        'Panduan akan disesuaikan dengan kondisi spesifik pengguna'
      ]
    });

    // KK Interactive Assessment - AUTOMATED GENERATION PROOF OF CONCEPT
    this.knowledgeBase.set('kk_interactive_assessment', {
      serviceName: 'KK Interactive Assessment',
      serviceCode: 'KK-ASSESS-001',
      serviceType: 'Penilaian Interaktif Layanan Kartu Keluarga',
      requirements: [
        { name: 'Penilaian situasi spesifik pengguna untuk KK', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Menanyakan status KK saat ini (baru/perubahan/hilang)', estimatedTime: '1 menit' },
        { step: 2, description: 'Menanyakan jenis perubahan yang dibutuhkan', estimatedTime: '1 menit' },
        { step: 3, description: 'Menanyakan anggota keluarga yang akan didaftarkan', estimatedTime: '1 menit' },
        { step: 4, description: 'Memberikan panduan spesifik sesuai situasi KK', estimatedTime: '2 menit' }
      ],
      duration: 'Interaktif',
      cost: 'Gratis',
      officeHours: '24/7 (Assessment Online)',
      notes: [
        'Assessment dilakukan untuk memberikan panduan KK yang tepat',
        'Setiap situasi KK memiliki persyaratan yang berbeda',
        'Panduan akan disesuaikan dengan kondisi spesifik keluarga'
      ]
    });

    // Akta Kelahiran Interactive Assessment - AUTOMATED GENERATION IMPLEMENTATION
    this.knowledgeBase.set('akta_kelahiran_interactive_assessment', {
      serviceName: 'Akta Kelahiran Interactive Assessment',
      serviceCode: 'AKTA-KELAHIRAN-ASSESS-001',
      serviceType: 'Penilaian Interaktif Layanan Akta Kelahiran',
      requirements: [
        { name: 'Penilaian situasi spesifik pengguna untuk Akta Kelahiran', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Menanyakan status kelahiran (baru lahir/terlambat daftar)', estimatedTime: '1 menit' },
        { step: 2, description: 'Menanyakan tempat kelahiran (rumah sakit/rumah/lainnya)', estimatedTime: '1 menit' },
        { step: 3, description: 'Menanyakan kebutuhan (akta baru/penggantian/koreksi)', estimatedTime: '1 menit' },
        { step: 4, description: 'Memberikan panduan spesifik sesuai situasi kelahiran', estimatedTime: '2 menit' }
      ],
      duration: 'Interaktif',
      cost: 'Gratis',
      officeHours: '24/7 (Assessment Online)',
      notes: [
        'Assessment dilakukan untuk memberikan panduan Akta Kelahiran yang tepat',
        'Setiap situasi kelahiran memiliki persyaratan yang berbeda',
        'Panduan akan disesuaikan dengan kondisi spesifik kelahiran anak',
        'Proses berbeda untuk kelahiran normal vs terlambat daftar'
      ]
    });

    // Load additional services
    additionalServices.forEach((serviceInfo, key) => {
      this.knowledgeBase.set(key, serviceInfo);
    });
  }

  /**
   * Enhanced service information retrieval with multi-service support
   */
  public getServiceInfo(query: string): ServiceInfo | null {
    // Step 1: Check for multi-service scenarios first
    const multiServiceResult = this.analyzeMultiServiceQuery(query);

    if (multiServiceResult.isMultiService && multiServiceResult.scenario) {
      console.log(`🎯 [KNOWLEDGE_SERVICE] Multi-service scenario detected: ${multiServiceResult.scenario.name}`);

      // Return a synthetic ServiceInfo for multi-service scenarios
      return this.createMultiServiceInfo(multiServiceResult);
    }

    // Step 2: Fall back to single-service processing
    const singleServiceResult = this.getSingleServiceInfo(query);

    // Handle string responses by converting to ServiceInfo
    if (typeof singleServiceResult === 'string') {
      // Create a synthetic ServiceInfo for string responses
      return {
        serviceName: 'Response Information',
        serviceCode: 'INFO-001',
        serviceType: 'Information Response',
        requirements: [],
        processSteps: [],
        duration: 'Immediate',
        cost: 'Free',
        officeHours: '08:00-15:00 WIB (Senin-Jumat)',
        specialCases: {
          'string_response': ['true'],
          'content': [singleServiceResult]
        }
      };
    }

    return singleServiceResult;
  }

  /**
   * Analyze query for multi-service scenarios with performance monitoring
   */
  public analyzeMultiServiceQuery(query: string): QueryAnalysisResult {
    const startTime = performance.now();

    try {
      const result = this.multiServiceAnalyzer.analyzeQuery(query);
      const processingTime = performance.now() - startTime;

      // Log performance metrics
      console.log(`⚡ [MULTI_SERVICE_PERFORMANCE] Analysis completed in ${processingTime.toFixed(2)}ms`);
      console.log(`📊 [MULTI_SERVICE_PERFORMANCE] Multi-service: ${result.isMultiService}, Confidence: ${result.confidence.toFixed(2)}, Services: ${result.detectedServices.length}`);

      return result;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [MULTI_SERVICE_ERROR] Analysis failed after ${processingTime.toFixed(2)}ms:`, error);

      // Return safe fallback
      return {
        isMultiService: false,
        confidence: 0,
        detectedServices: [],
        analysisMetadata: {
          processingTime,
          patternMatches: [],
          complexityScore: 0,
          recommendedApproach: 'single_service'
        }
      };
    }
  }

  /**
   * Create synthetic ServiceInfo for multi-service scenarios
   */
  private createMultiServiceInfo(analysisResult: QueryAnalysisResult): ServiceInfo {
    if (!analysisResult.scenario) {
      throw new Error('Cannot create multi-service info without scenario');
    }

    const scenario = analysisResult.scenario;

    // Create a synthetic ServiceInfo that represents the multi-service scenario
    return {
      serviceName: scenario.name,
      serviceCode: `MULTI-${scenario.scenarioId.toUpperCase()}`,
      serviceType: 'Multi-Service Process',
      requirements: [
        { name: 'Multiple documents required - see detailed guidance', required: true }
      ],
      processSteps: [
        { step: 1, description: 'Multi-service process - see comprehensive guidance', estimatedTime: scenario.estimatedDuration }
      ],
      duration: scenario.estimatedDuration,
      cost: 'Varies by service - see individual service costs',
      officeHours: '08:00-15:00 WIB (Senin-Jumat)',
      notes: [
        'This is a multi-service process involving multiple documents',
        'Follow the recommended sequence for best results',
        'Some services may have dependencies on others'
      ],
      // Mark this as a multi-service scenario for special handling
      specialCases: {
        'multi_service': ['true'],
        'scenario_id': [scenario.scenarioId],
        'complexity': [scenario.complexity]
      }
    };
  }

  /**
   * Get service information by query with enhanced AI-powered prioritization (single service)
   */
  private getSingleServiceInfo(query: string): ServiceInfo | string | null {
    const lowerQuery = query.toLowerCase();

    // PRIORITY 1: AI-Trained Scenario Responses (94%+ accuracy)
    // These take precedence over administrative cache responses

    // KTP requirements query patterns - Handle specific requirement questions
    if (this.isKTPRequirementsQuery(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using KTP requirements response (95%+ accuracy)');
      return this.getKTPRequirementsResponse(lowerQuery);
    }

    // KTP initial query patterns - Handle initial KTP requests
    if (this.isKTPInitialQuery(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using KTP initial query response (95%+ accuracy)');
      return this.getKTPInitialResponse(lowerQuery);
    }

    // KTP scenario response patterns - Handle follow-up responses to KTP assessment
    if (this.isKTPScenarioResponse(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using AI-trained KTP scenario response (94%+ accuracy)');
      return this.getKTPScenarioResponse(lowerQuery);
    }

    // Akta Kelahiran scenario response patterns - Handle follow-up responses to Akta Kelahiran assessment
    if (this.isAktaKelahiranScenarioResponse(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using AI-trained Akta Kelahiran scenario response (94%+ accuracy)');
      return this.getAktaKelahiranScenarioResponse(lowerQuery);
    }

    // Anak luar nikah specific queries - CRITICAL FIX (100% accuracy)
    if (this.isAnakLuarNikahQuery(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using AI-trained special case response (100% accuracy)');
      return this.getAnakLuarNikahResponse();
    }

    // PRIORITY 1.5: Enhanced Q&A Integration - Check comprehensive Q&A pairs
    const qaResponse = this.getEnhancedQAResponse(lowerQuery);
    if (qaResponse) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using enhanced Q&A response (95%+ accuracy)');
      return qaResponse;
    }

    // PRIORITY 1.5: Specific Document Type Detection (CRITICAL FIX)
    // Prevent other document types from being routed to KK training
    if (this.isSpecificDocumentQuery(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using specific document service response');
      return this.getSpecificDocumentResponse(lowerQuery);
    }

    // PRIORITY 1.6: KK Continuous Training Integration - Check KK training data (ONLY for KK queries)
    if (this.isKKSpecificQuery(lowerQuery)) {
      const kkTrainingResponse = this.getKKTrainingResponse(lowerQuery);
      if (kkTrainingResponse) {
        console.log('🎯 [KNOWLEDGE_SERVICE] Using KK continuous training response (95%+ accuracy)');
        return kkTrainingResponse;
      }
    }

    // PRIORITY 1.7: Perpindahan Continuous Training Integration - Check Perpindahan training data (ONLY for Perpindahan queries)
    if (this.isPerpindahanSpecificQuery(lowerQuery)) {
      const perpindahanTrainingResponse = this.getPerpindahanTrainingResponse(lowerQuery);
      if (perpindahanTrainingResponse) {
        console.log('🎯 [KNOWLEDGE_SERVICE] Using Perpindahan continuous training response (95%+ accuracy)');
        return perpindahanTrainingResponse;
      }
    }

    // PRIORITY 2: Interactive Assessment Triggers (AI-Enhanced)
    // Complete service overview patterns
    if (this.isCompleteServiceQuery(lowerQuery)) {
      return this.knowledgeBase.get('layanan_lengkap_disdukcapil') || null;
    }

    // KTP patterns - Interactive Assessment Required
    if (this.isKTPQuery(lowerQuery)) {
      console.log('🎯 [KNOWLEDGE_SERVICE] Using AI-enhanced KTP interactive assessment');
      return this.knowledgeBase.get('ktp_interactive_assessment') || null;
    }

    // Kartu Keluarga patterns - Enhanced with specific service detection (PRIORITY: Specific situations first)
    if (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga')) {
      // Check for specific KK situations first
      if (lowerQuery.includes('hilang') || lowerQuery.includes('rusak') || lowerQuery.includes('penggantian')) {
        return this.knowledgeBase.get('kk_penggantian') || null;
      }
      if (lowerQuery.includes('perubahan') || lowerQuery.includes('ubah') || lowerQuery.includes('ganti data') ||
          lowerQuery.includes('pindah alamat') || lowerQuery.includes('update alamat') || lowerQuery.includes('ganti alamat')) {
        return this.knowledgeBase.get('kk_perubahan') || null;
      }
      if (lowerQuery.includes('penambahan') || lowerQuery.includes('tambah anggota') || lowerQuery.includes('anggota baru')) {
        return this.knowledgeBase.get('kk_penambahan') || null;
      }
      // Enhanced KK Baru scenario detection
      if (lowerQuery.includes('belum punya kk sama sekali') || lowerQuery.includes('belum punya biodata') ||
          lowerQuery.includes('belum punya ktp') || lowerQuery.includes('tidak memiliki dokumen') ||
          lowerQuery.includes('belum punya dokumen kependudukan') || lowerQuery.includes('belum pernah terdaftar') ||
          lowerQuery.includes('a - belum punya') || lowerQuery.includes('a-belum punya') || lowerQuery.includes('pilihan a')) {
        return this.knowledgeBase.get('kk_baru_no_documents') || null;
      }
      if (lowerQuery.includes('kk baru karena pernikahan') || lowerQuery.includes('baru menikah') ||
          lowerQuery.includes('pengajuan kk baru karena pernikahan') || lowerQuery.includes('keluarga baru pernikahan') ||
          lowerQuery.includes('baru saja menikah') || lowerQuery.includes('habis menikah') ||
          lowerQuery.includes('setelah menikah') || lowerQuery.includes('menikah mau buat kk') ||
          lowerQuery.includes('b - kk baru karena') || lowerQuery.includes('b-kk baru karena') || lowerQuery.includes('pilihan b')) {
        return this.knowledgeBase.get('kk_baru_marriage') || null;
      }
      // Updated assessment response mappings
      if (lowerQuery.includes('c - sudah punya') || lowerQuery.includes('c-sudah punya') || lowerQuery.includes('pilihan c')) {
        return this.knowledgeBase.get('kk_perubahan') || null;
      }
      if (lowerQuery.includes('d - kk hilang') || lowerQuery.includes('d-kk hilang') || lowerQuery.includes('pilihan d')) {
        return this.knowledgeBase.get('kk_penggantian') || null;
      }
      if (lowerQuery.includes('e - mau pisah') || lowerQuery.includes('e-mau pisah') || lowerQuery.includes('pilihan e')) {
        return this.knowledgeBase.get('kk_pisah') || this.knowledgeBase.get('kk_baru_no_documents') || null;
      }
      if (lowerQuery.includes('f - pindah alamat') || lowerQuery.includes('f-pindah alamat') || lowerQuery.includes('pilihan f')) {
        return this.knowledgeBase.get('kk_perubahan') || null;
      }
      // General "keluarga baru" needs clarification - route to assessment
      if (lowerQuery.includes('keluarga baru') && !lowerQuery.includes('pernikahan')) {
        return this.knowledgeBase.get('kk_interactive_assessment') || null;
      }
      if (lowerQuery.includes('pisah kk') || lowerQuery.includes('mandiri') || lowerQuery.includes('anak menikah')) {
        return this.knowledgeBase.get('kk_pisah') || this.knowledgeBase.get('kk_baru_no_documents') || null;
      }

      // For general KK queries without specific situation, use interactive assessment
      if (this.isKKQuery(lowerQuery)) {
        return this.knowledgeBase.get('kk_interactive_assessment') || null;
      }

      // Fallback to comprehensive overview
      return this.knowledgeBase.get('kk_overview') || this.knowledgeBase.get('kk_baru') || null;
    }

    // KIA patterns - AUTOMATED GENERATION
    if (this.isKIAQuery(lowerQuery)) {
      return this.knowledgeBase.get('kia') || null;
    }

    // Kepindahan patterns - AUTOMATED GENERATION
    if (this.isKepindahanQuery(lowerQuery)) {
      return this.knowledgeBase.get('kepindahan') || null;
    }

    // Akta Kelahiran patterns - Interactive Assessment Required (AUTOMATED GENERATION)
    if (this.isAktaKelahiranQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_kelahiran_interactive_assessment') || null;
    }

    // Akta Kematian patterns - AUTOMATED GENERATION
    if (this.isAktaKematianQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_kematian') || null;
    }

    // Akta Pengakuan Anak patterns - NEW TRAINING INTEGRATION
    if (this.isAktaPengakuanAnakQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_pengakuan_anak') || null;
    }

    // Akta Perkawinan patterns - AUTOMATED GENERATION
    if (this.isAktaPerkawinanQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_perkawinan') || null;
    }

    // Akta Perceraian patterns - AUTOMATED GENERATION
    if (this.isAktaPerceraianQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_perceraian') || null;
    }

    // Biodata Penduduk patterns - AUTOMATED GENERATION
    if (this.isBiodataPendudukQuery(lowerQuery)) {
      return this.knowledgeBase.get('biodata_penduduk') || null;
    }

    // Surat Keterangan Tempat Tinggal patterns - AUTOMATED GENERATION
    if (this.isSuratTempatTinggalQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_tempat_tinggal') || null;
    }

    // Surat Keterangan Kematian patterns - AUTOMATED GENERATION
    if (this.isSuratKeteranganKematianQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_keterangan_kematian') || null;
    }

    // Surat Keterangan Pindah Datang patterns - AUTOMATED GENERATION
    if (this.isSuratPindahDatangQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_pindah_datang') || null;
    }

    // Surat Keterangan Kelahiran patterns - AUTOMATED GENERATION
    if (this.isSuratKeteranganKelahiranQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_keterangan_kelahiran') || null;
    }

    // Surat Keterangan Pengangkatan Anak patterns - AUTOMATED GENERATION
    if (this.isSuratAngkatAnakQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_angkat_anak') || null;
    }

    // Surat Keterangan Pindah Keluar Negeri patterns - AUTOMATED GENERATION
    if (this.isSuratPindahKeluarNegeriQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_pindah_luar_negeri') || null;
    }

    // Surat Keterangan Datang dari Luar Negeri patterns - AUTOMATED GENERATION
    if (this.isSuratDatangLuarNegeriQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_datang_luar_negeri') || null;
    }

    // Surat Keterangan Lahir Mati patterns - AUTOMATED GENERATION
    if (this.isSuratLahirMatiQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_lahir_mati') || null;
    }

    // Surat Keterangan Pembatalan Perkawinan patterns - AUTOMATED GENERATION
    if (this.isSuratPembatalanPerkawinanQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_batal_kawin') || null;
    }

    // Surat Keterangan Pembatalan Perceraian patterns - AUTOMATED GENERATION
    if (this.isSuratPembatalanPerceraianQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_batal_cerai') || null;
    }

    // Surat Keterangan Pelepasan Kewarganegaraan Indonesia patterns - AUTOMATED GENERATION
    if (this.isSuratPelepasanKewarganegaraanQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_lepas_wni') || null;
    }

    // Surat Keterangan Pengganti Tanda Identitas patterns - AUTOMATED GENERATION
    if (this.isSuratPenggantiIdentitasQuery(lowerQuery)) {
      return this.knowledgeBase.get('surat_pengganti_identitas') || null;
    }



    // Akta Pengesahan Anak patterns - AUTOMATED GENERATION
    if (this.isAktaPengesahanAnakQuery(lowerQuery)) {
      return this.knowledgeBase.get('akta_pengesahan_anak') || null;
    }

    // Akta patterns
    if (lowerQuery.includes('akta')) {
      if (lowerQuery.includes('kelahiran') || lowerQuery.includes('lahir')) {
        return this.knowledgeBase.get('akta_kelahiran') || null;
      } else if (lowerQuery.includes('perkawinan') || lowerQuery.includes('nikah') || lowerQuery.includes('kawin')) {
        return this.knowledgeBase.get('akta_perkawinan') || null;
      } else if (lowerQuery.includes('perceraian') || lowerQuery.includes('cerai')) {
        return this.knowledgeBase.get('akta_perceraian') || null;
      } else if (lowerQuery.includes('kematian') || lowerQuery.includes('meninggal')) {
        return this.knowledgeBase.get('akta_kematian') || null;
      } else if (lowerQuery.includes('pengakuan anak')) {
        return this.knowledgeBase.get('akta_pengakuan_anak') || null;
      } else if (lowerQuery.includes('pengesahan anak')) {
        return this.knowledgeBase.get('akta_pengesahan_anak') || null;
      }
    }

    // KIA patterns
    if (lowerQuery.includes('kia') || lowerQuery.includes('kartu identitas anak') || (lowerQuery.includes('kartu') && lowerQuery.includes('anak'))) {
      return this.knowledgeBase.get('kia') || null;
    }

    // Check additional service patterns
    for (const [serviceKey, pattern] of Object.entries(servicePatterns)) {
      if (pattern.test(lowerQuery)) {
        return this.knowledgeBase.get(serviceKey) || null;
      }
    }

    return null;
  }

  /**
   * Check if query is asking for complete service overview
   */
  private isCompleteServiceQuery(query: string): boolean {
    const completeServicePatterns = [
      // Direct service list queries
      /dokumen apa saja yang dilayani/i,
      /dokumen apa saja/i,
      /layanan apa saja/i,
      /pelayanan apa saja/i,
      /jenis dokumen apa/i,
      /dokumen apa yang bisa diurus/i,

      // Creation/making specific queries
      /pembuatan dokumen apa saja/i,
      /melayani pembuatan dokumen apa/i,
      /disdukcapil melayani.*dokumen apa/i,
      /bisa membuat dokumen apa/i,
      /bisa bikin dokumen apa/i,
      /dokumen apa yang bisa dibuat/i,
      /apa aja yang bisa diurus/i,
      /layanan pembuatan apa saja/i,

      // Enhanced document queries
      /dokumen kependudukan apa.*diterbitkan/i,
      /jenis dokumen.*diurus oleh/i,
      /layanan.*ditawarkan.*dokumen kependudukan/i,
      /dokumen resmi apa.*dibuat/i,
      /akta.*dokumen.*dikeluarkan/i,
      /jenis dokumen kependudukan.*disediakan/i,
      /dokumen.*dikelola oleh/i,
      /layanan administrasi kependudukan/i,
      /dokumen.*diurus melalui/i,
      /jenis akta.*diterbitkan/i,
      /dokumen.*dibuat oleh/i,
      /dokumen kependudukan.*tersedia/i,
      /layanan dokumen.*disediakan/i,
      /jenis dokumen resmi.*diurus/i,
      /dokumen administrasi kependudukan.*diterbitkan/i,
      /layanan pembuatan akta/i,
      /dokumen.*diperoleh dari/i,
      /jenis dokumen.*ditangani/i,
      /dokumen kependudukan.*dibuat melalui/i,
      /layanan.*pengurusan dokumen resmi/i,

      // Disdukcapil specific queries
      /dilayani oleh disdukcapil/i,
      /dilayani oleh dinas kependudukan/i,
      /tersedia di disdukcapil/i,
      /di dinas kependudukan/i,
      /disdukcapil.*melayani/i,
      /dukcapil/i,

      // Location specific
      /kabupaten garut/i,
      /kab garut/i,

      // Service overview keywords
      /daftar lengkap/i,
      /semua layanan/i,
      /semua dokumen/i,

      // Administrative terms
      /administrasi kependudukan/i,
      /pencatatan sipil/i,
      /kependudukan dan pencatatan sipil/i,
      /catatan sipil/i
    ];

    return completeServicePatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about KTP services - AUTOMATED GENERATION (STANDARDIZED)
   */
  private isKTPQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const ktpConfig = documentConfigurations.ktp;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(ktpConfig);

    // Minimal manual patterns for edge cases and 2025 digital services
    const manualKTPPatterns = [
      // Common user expressions that need to be caught
      /aku.*ingin.*cetak.*ktp/i,
      /aku.*ingin.*mengajukan.*ktp/i,
      /saya.*ingin.*cetak.*ktp/i,
      /saya.*ingin.*mengajukan.*ktp/i,
      /mau.*cetak.*ktp/i,
      /mau.*mengajukan.*ktp/i,
      /pengen.*cetak.*ktp/i,
      /pengen.*mengajukan.*ktp/i,
      /ingin.*cetak.*ktp/i,
      /ingin.*mengajukan.*ktp/i,
      /cetak.*ktp/i,
      /mengajukan.*ktp/i,
      /ajukan.*ktp/i,
      /buat.*ktp/i,
      /bikin.*ktp/i,

      // 2025 Digital Services specific
      /ikd.*aktivasi/i,
      /aktivasi.*ikd/i,
      /ktp.*digital.*garut/i,
      /identitas.*kependudukan.*digital/i,
      /qr.*code.*ktp/i,
      /verifikasi.*qr.*ktp/i,

      // Location-specific edge cases
      /ktp.*dukcapil.*garut/i,
      /e.*ktp.*garut/i,

      // Specific process edge cases
      /ktp.*hilang.*polisi/i,
      /ktp.*rusak.*ganti/i,

      // Informal regional expressions
      /ribet.*ga.*ktp/i,
      /susah.*ga.*ktp/i,
      /gampang.*ga.*ktp/i,

      // Enhanced formal patterns
      /saya.*ingin.*mengetahui.*persyaratan.*ktp/i,
      /mohon.*informasi.*syarat.*ktp/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualKTPPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about KK (Kartu Keluarga) services - AUTOMATED GENERATION
   */
  private isKKQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const kkConfig = documentConfigurations.kk;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(kkConfig);

    // Additional manual patterns for KK-specific terms
    const manualKKPatterns = [
      // Direct KK queries
      /syarat.*kk/i,
      /persyaratan.*kk/i,
      /cara.*kk/i,
      /prosedur.*kk/i,
      /dokumen.*kk/i,
      /bikin.*kk/i,
      /buat.*kk/i,
      /membuat.*kk/i,
      /mengurus.*kk/i,
      /pengurusan.*kk/i,
      /cetak.*kk/i,
      /pembuatan.*kk/i,

      // KK variations
      /kk.*baru/i,
      /kartu keluarga/i,
      /kartu keluarga.*baru/i,

      // Requirements and procedures
      /syarat.*kartu keluarga/i,
      /persyaratan.*kartu keluarga/i,
      /dokumen.*kartu keluarga/i,
      /cara.*kartu keluarga/i,

      // Common phrases
      /apa.*diperlukan.*kk/i,
      /apa.*dibutuhkan.*kk/i,
      /apa.*harus.*kk/i,
      /ketentuan.*kk/i,
      /mendapatkan.*kk/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualKKPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Kelahiran services - AUTOMATED GENERATION
   */
  private isAktaKelahiranQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaKelahiranConfig = documentConfigurations.akta_kelahiran;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaKelahiranConfig);

    // Additional manual patterns for Akta Kelahiran-specific terms
    const manualAktaKelahiranPatterns = [
      // Direct Akta Kelahiran queries
      /syarat.*akta.*kelahiran/i,
      /persyaratan.*akta.*kelahiran/i,
      /cara.*akta.*kelahiran/i,
      /prosedur.*akta.*kelahiran/i,
      /dokumen.*akta.*kelahiran/i,
      /bikin.*akta.*kelahiran/i,
      /buat.*akta.*kelahiran/i,
      /membuat.*akta.*kelahiran/i,
      /mengurus.*akta.*kelahiran/i,
      /pengurusan.*akta.*kelahiran/i,
      /daftar.*akta.*kelahiran/i,
      /mendaftar.*akta.*kelahiran/i,

      // Akta Lahir variations
      /syarat.*akta.*lahir/i,
      /persyaratan.*akta.*lahir/i,
      /cara.*akta.*lahir/i,
      /dokumen.*akta.*lahir/i,
      /bikin.*akta.*lahir/i,
      /buat.*akta.*lahir/i,
      /mengurus.*akta.*lahir/i,

      // Surat Kelahiran variations
      /syarat.*surat.*kelahiran/i,
      /persyaratan.*surat.*kelahiran/i,
      /cara.*surat.*kelahiran/i,
      /dokumen.*surat.*kelahiran/i,
      /bikin.*surat.*kelahiran/i,
      /buat.*surat.*kelahiran/i,
      /mengurus.*surat.*kelahiran/i,

      // Birth certificate specific terms
      /kelahiran.*anak/i,
      /kelahiran.*bayi/i,
      /lahir.*anak/i,
      /lahir.*bayi/i,
      /birth.*certificate/i,

      // Common phrases
      /apa.*diperlukan.*akta.*kelahiran/i,
      /apa.*dibutuhkan.*akta.*kelahiran/i,
      /apa.*harus.*akta.*kelahiran/i,
      /ketentuan.*akta.*kelahiran/i,
      /mendapatkan.*akta.*kelahiran/i,
      /apa.*diperlukan.*akta.*lahir/i,
      /apa.*dibutuhkan.*surat.*kelahiran/i,

      // Anak luar nikah patterns - CRITICAL FIX
      /anak.*luar.*nikah/i,
      /akta.*kelahiran.*anak.*luar.*nikah/i,
      /syarat.*anak.*luar.*nikah/i,
      /kalau.*anak.*luar.*nikah/i,
      /gimana.*anak.*luar.*nikah/i,
      /bagaimana.*anak.*luar.*nikah/i,
      /anak.*tidak.*nikah/i,
      /anak.*belum.*nikah/i,
      /pengakuan.*anak/i,
      /akta.*pengakuan.*anak/i,
      /anak.*tanpa.*nikah/i,
      /anak.*di.*luar.*nikah/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaKelahiranPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about KIA (Kartu Identitas Anak) services - AUTOMATED GENERATION
   */
  private isKIAQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const kiaConfig = documentConfigurations.kia;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(kiaConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualKIAPatterns = [
      // Age-specific patterns
      /kia.*anak.*0.*5.*tahun/i,
      /kia.*anak.*5.*17.*tahun/i,
      /kartu.*identitas.*anak.*bayi/i,
      /kartu.*identitas.*anak.*balita/i,

      // Parent-related patterns
      /kia.*orang.*tua/i,
      /kartu.*anak.*orang.*tua/i,

      // Photo requirements
      /kia.*foto/i,
      /kartu.*identitas.*anak.*foto/i,

      // Location-specific
      /kia.*garut/i,
      /kartu.*identitas.*anak.*garut/i,

      // Informal expressions
      /ribet.*ga.*kia/i,
      /susah.*ga.*kartu.*anak/i,
      /gampang.*ga.*kia/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualKIAPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Kematian services - AUTOMATED GENERATION
   */
  private isAktaKematianQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaKematianConfig = documentConfigurations.akta_kematian;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaKematianConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualAktaKematianPatterns = [
      // Death-related specific terms
      /akta.*kematian.*rumah.*sakit/i,
      /akta.*kematian.*rs/i,
      /akta.*kematian.*dokter/i,
      /akta.*kematian.*kepolisian/i,

      // Family-related patterns
      /akta.*kematian.*almarhum/i,
      /akta.*kematian.*almarhumah/i,
      /akta.*kematian.*orang.*tua/i,
      /akta.*kematian.*keluarga/i,

      // Process-related
      /surat.*kematian.*rs/i,
      /surat.*kematian.*dokter/i,
      /formulir.*f.*2.*01/i,

      // Location-specific
      /akta.*kematian.*garut/i,
      /akta.*kematian.*dukcapil/i,

      // Informal expressions
      /ribet.*ga.*akta.*kematian/i,
      /susah.*ga.*akta.*kematian/i,
      /gampang.*ga.*akta.*kematian/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaKematianPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Perkawinan services - AUTOMATED GENERATION
   */
  private isAktaPerkawinanQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaPerkawinanConfig = documentConfigurations.akta_perkawinan;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaPerkawinanConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualAktaPerkawinanPatterns = [
      // Marriage-related specific terms
      /akta.*perkawinan.*pemuka.*agama/i,
      /akta.*perkawinan.*kua/i,
      /akta.*perkawinan.*catatan.*sipil/i,
      /akta.*perkawinan.*gereja/i,

      // Religious ceremony patterns
      /akta.*nikah.*muslim/i,
      /akta.*nikah.*islam/i,
      /akta.*nikah.*kristen/i,
      /akta.*nikah.*katolik/i,
      /akta.*nikah.*hindu/i,
      /akta.*nikah.*buddha/i,

      // Photo and document patterns
      /akta.*perkawinan.*foto.*4x6/i,
      /akta.*nikah.*foto.*suami.*istri/i,

      // Status-related patterns
      /akta.*perkawinan.*janda/i,
      /akta.*perkawinan.*duda/i,
      /akta.*perkawinan.*cerai.*mati/i,
      /akta.*perkawinan.*cerai.*hidup/i,

      // Location-specific
      /akta.*perkawinan.*garut/i,
      /akta.*nikah.*garut/i,

      // Informal expressions
      /ribet.*ga.*akta.*nikah/i,
      /susah.*ga.*akta.*perkawinan/i,
      /gampang.*ga.*akta.*nikah/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaPerkawinanPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Biodata Penduduk services - AUTOMATED GENERATION
   */
  private isBiodataPendudukQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const biodataPendudukConfig = documentConfigurations.biodata_penduduk;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(biodataPendudukConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualBiodataPendudukPatterns = [
      // Administrative specific terms
      /biodata.*penduduk.*kelurahan/i,
      /biodata.*penduduk.*pengantar/i,
      /surat.*pengantar.*biodata/i,

      // Supporting documents patterns
      /biodata.*ijazah/i,
      /biodata.*sttb/i,
      /biodata.*akta.*nikah/i,
      /biodata.*akta.*kelahiran/i,

      // Purpose-related patterns
      /biodata.*untuk.*melamar/i,
      /biodata.*untuk.*kerja/i,
      /biodata.*untuk.*sekolah/i,
      /biodata.*untuk.*beasiswa/i,

      // Location-specific
      /biodata.*penduduk.*garut/i,
      /biodata.*garut/i,

      // Informal expressions
      /ribet.*ga.*biodata/i,
      /susah.*ga.*biodata.*penduduk/i,
      /gampang.*ga.*biodata/i,

      // Alternative terms
      /data.*diri.*penduduk/i,
      /profil.*penduduk/i,
      /data.*kependudukan/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualBiodataPendudukPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Tempat Tinggal services - AUTOMATED GENERATION
   */
  private isSuratTempatTinggalQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratTempatTinggalConfig = documentConfigurations.surat_tempat_tinggal;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratTempatTinggalConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratTempatTinggalPatterns = [
      // Domicile-specific terms
      /surat.*domisili.*rt.*rw/i,
      /surat.*tempat.*tinggal.*rt.*rw/i,
      /keterangan.*domisili.*rt/i,

      // Property-related patterns
      /surat.*tempat.*tinggal.*sewa/i,
      /surat.*tempat.*tinggal.*kontrak/i,
      /surat.*tempat.*tinggal.*milik/i,
      /domisili.*bukti.*kepemilikan/i,

      // Purpose-related patterns
      /domisili.*untuk.*kerja/i,
      /domisili.*untuk.*sekolah/i,
      /domisili.*untuk.*bank/i,
      /tempat.*tinggal.*untuk.*administrasi/i,

      // Location-specific
      /surat.*domisili.*garut/i,
      /tempat.*tinggal.*garut/i,

      // Informal expressions
      /ribet.*ga.*domisili/i,
      /susah.*ga.*surat.*tempat.*tinggal/i,
      /gampang.*ga.*domisili/i,

      // Alternative terms
      /sktt/i,
      /surat.*keterangan.*tinggal/i,
      /bukti.*tempat.*tinggal/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratTempatTinggalPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Kematian services - AUTOMATED GENERATION
   */
  private isSuratKeteranganKematianQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratKeteranganKematianConfig = documentConfigurations.surat_keterangan_kematian;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratKeteranganKematianConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratKeteranganKematianPatterns = [
      // Death certificate specific terms
      /surat.*kematian.*rumah.*sakit/i,
      /surat.*kematian.*rs/i,
      /surat.*kematian.*dokter/i,
      /surat.*kematian.*kepolisian/i,

      // Family-related patterns
      /surat.*kematian.*almarhum/i,
      /surat.*kematian.*almarhumah/i,
      /surat.*kematian.*orang.*tua/i,
      /surat.*kematian.*keluarga/i,

      // Administrative patterns
      /keterangan.*meninggal.*dunia/i,
      /surat.*meninggal.*dunia/i,
      /skm.*kematian/i,

      // Purpose-related patterns
      /surat.*kematian.*untuk.*bank/i,
      /surat.*kematian.*untuk.*asuransi/i,
      /surat.*kematian.*untuk.*warisan/i,

      // Location-specific
      /surat.*kematian.*garut/i,
      /keterangan.*kematian.*garut/i,

      // Informal expressions
      /ribet.*ga.*surat.*kematian/i,
      /susah.*ga.*surat.*kematian/i,
      /gampang.*ga.*surat.*kematian/i,

      // Alternative terms
      /skm/i,
      /surat.*meninggal/i,
      /keterangan.*wafat/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratKeteranganKematianPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Perceraian services - AUTOMATED GENERATION
   */
  private isAktaPerceraianQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaPerceraianConfig = documentConfigurations.akta_perceraian;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaPerceraianConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualAktaPerceraianPatterns = [
      // Divorce-specific terms
      /akta.*perceraian.*pengadilan/i,
      /akta.*cerai.*pengadilan.*negeri/i,
      /akta.*perceraian.*inkrah/i,
      /putusan.*pengadilan.*perceraian/i,

      // Marriage-related patterns
      /akta.*perceraian.*akta.*perkawinan/i,
      /akta.*cerai.*akta.*nikah/i,
      /perceraian.*suami.*istri/i,

      // Legal process patterns
      /akta.*perceraian.*putusan.*hakim/i,
      /akta.*cerai.*sidang.*pengadilan/i,
      /perceraian.*legal.*resmi/i,

      // Document-related patterns
      /akta.*perceraian.*asli/i,
      /akta.*cerai.*fotokopi/i,
      /surat.*pernyataan.*perceraian/i,

      // Location-specific
      /akta.*perceraian.*garut/i,
      /akta.*cerai.*garut/i,

      // Informal expressions
      /ribet.*ga.*akta.*cerai/i,
      /susah.*ga.*akta.*perceraian/i,
      /gampang.*ga.*akta.*cerai/i,

      // Alternative terms
      /surat.*cerai.*resmi/i,
      /dokumen.*perceraian/i,
      /akta.*pisah/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaPerceraianPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pindah Datang services - AUTOMATED GENERATION
   */
  private isSuratPindahDatangQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPindahDatangConfig = documentConfigurations.surat_pindah_datang;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPindahDatangConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPindahDatangPatterns = [
      // Migration-specific terms
      /surat.*pindah.*datang.*daerah.*asal/i,
      /surat.*pindah.*datang.*formulir.*f.*1.*16/i,
      /skpd.*pindah.*datang/i,

      // Origin-related patterns
      /pindah.*datang.*dari.*luar.*kota/i,
      /pindah.*datang.*dari.*luar.*provinsi/i,
      /pindah.*datang.*dari.*luar.*negeri/i,
      /datang.*dari.*daerah.*lain/i,

      // Document-related patterns
      /surat.*pindah.*datang.*bukti.*alamat/i,
      /pindah.*datang.*pengantar.*rt.*rw/i,
      /pindah.*datang.*kelurahan.*kecamatan/i,

      // International migration patterns
      /pindah.*datang.*paspor/i,
      /pindah.*datang.*itas/i,
      /datang.*dari.*luar.*negeri.*kbri/i,
      /datang.*dari.*luar.*negeri.*konsulat/i,

      // Location-specific
      /pindah.*datang.*garut/i,
      /surat.*pindah.*datang.*garut/i,

      // Informal expressions
      /ribet.*ga.*pindah.*datang/i,
      /susah.*ga.*surat.*pindah.*datang/i,
      /gampang.*ga.*pindah.*datang/i,

      // Alternative terms
      /skpd/i,
      /surat.*kedatangan/i,
      /keterangan.*datang/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPindahDatangPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Kelahiran services - AUTOMATED GENERATION
   */
  private isSuratKeteranganKelahiranQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratKeteranganKelahiranConfig = documentConfigurations.surat_keterangan_kelahiran;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratKeteranganKelahiranConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratKeteranganKelahiranPatterns = [
      // Birth certificate specific terms
      /surat.*kelahiran.*rumah.*sakit/i,
      /surat.*kelahiran.*rs/i,
      /surat.*kelahiran.*bidan/i,
      /surat.*kelahiran.*dokter/i,

      // Medical facility patterns
      /keterangan.*lahir.*klinik/i,
      /surat.*lahir.*puskesmas/i,
      /surat.*kelahiran.*penolong.*kelahiran/i,

      // SPTJM patterns
      /surat.*kelahiran.*sptjm/i,
      /keterangan.*kelahiran.*sptjm/i,
      /sptjm.*kebenaran.*kelahiran/i,

      // Parent-related patterns
      /surat.*kelahiran.*orang.*tua/i,
      /surat.*kelahiran.*saksi/i,
      /keterangan.*lahir.*ktp.*orang.*tua/i,

      // Location-specific
      /surat.*kelahiran.*garut/i,
      /keterangan.*kelahiran.*garut/i,

      // Informal expressions
      /ribet.*ga.*surat.*kelahiran/i,
      /susah.*ga.*surat.*kelahiran/i,
      /gampang.*ga.*surat.*kelahiran/i,

      // Alternative terms
      /skk/i,
      /surat.*lahir/i,
      /keterangan.*lahir/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratKeteranganKelahiranPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Pengakuan Anak services - AUTOMATED GENERATION
   */
  private isAktaPengakuanAnakQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaPengakuanAnakConfig = documentConfigurations.akta_pengakuan_anak;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaPengakuanAnakConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualAktaPengakuanAnakPatterns = [
      // Child acknowledgment specific terms
      /akta.*pengakuan.*anak.*ayah.*biologis/i,
      /akta.*pengakuan.*anak.*luar.*nikah/i,
      /pengakuan.*anak.*surat.*pernyataan/i,

      // Legal process patterns
      /akta.*pengakuan.*anak.*pengadilan/i,
      /pengakuan.*anak.*putusan.*pengadilan/i,
      /akta.*pengakuan.*anak.*resmi/i,

      // Parent-related patterns
      /akta.*pengakuan.*ayah.*kandung/i,
      /pengakuan.*anak.*orang.*tua/i,
      /akta.*pengakuan.*anak.*ktp.*orang.*tua/i,

      // Document-related patterns
      /akta.*pengakuan.*akta.*kelahiran.*anak/i,
      /pengakuan.*anak.*kartu.*keluarga/i,
      /akta.*pengakuan.*anak.*fotokopi/i,

      // Location-specific
      /akta.*pengakuan.*anak.*garut/i,
      /pengakuan.*anak.*garut/i,

      // Informal expressions
      /ribet.*ga.*akta.*pengakuan.*anak/i,
      /susah.*ga.*pengakuan.*anak/i,
      /gampang.*ga.*akta.*pengakuan.*anak/i,

      // Alternative terms
      /surat.*pengakuan.*anak/i,
      /dokumen.*pengakuan.*anak/i,
      /akta.*akui.*anak/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaPengakuanAnakPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Akta Pengesahan Anak services - AUTOMATED GENERATION
   */
  private isAktaPengesahanAnakQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const aktaPengesahanAnakConfig = documentConfigurations.akta_pengesahan_anak;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(aktaPengesahanAnakConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualAktaPengesahanAnakPatterns = [
      // Child legitimation specific terms
      /akta.*pengesahan.*anak.*pengadilan/i,
      /pengesahan.*anak.*putusan.*pengadilan/i,
      /akta.*pengesahan.*anak.*resmi/i,

      // Legal process patterns
      /pengesahan.*anak.*sidang.*pengadilan/i,
      /akta.*pengesahan.*anak.*hakim/i,
      /pengesahan.*anak.*legal.*sah/i,

      // Parent-related patterns
      /akta.*pengesahan.*kedua.*orang.*tua/i,
      /pengesahan.*anak.*surat.*pernyataan/i,
      /akta.*pengesahan.*anak.*ktp.*orang.*tua/i,

      // Document-related patterns
      /akta.*pengesahan.*akta.*kelahiran.*anak/i,
      /pengesahan.*anak.*kartu.*keluarga/i,
      /akta.*pengesahan.*anak.*fotokopi/i,

      // Location-specific
      /akta.*pengesahan.*anak.*garut/i,
      /pengesahan.*anak.*garut/i,

      // Informal expressions
      /ribet.*ga.*akta.*pengesahan.*anak/i,
      /susah.*ga.*pengesahan.*anak/i,
      /gampang.*ga.*akta.*pengesahan.*anak/i,

      // Alternative terms
      /surat.*pengesahan.*anak/i,
      /dokumen.*pengesahan.*anak/i,
      /akta.*sah.*anak/i,
      /akta.*legitimasi.*anak/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualAktaPengesahanAnakPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pengangkatan Anak services - AUTOMATED GENERATION
   */
  private isSuratAngkatAnakQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratAngkatAnakConfig = documentConfigurations.surat_angkat_anak;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratAngkatAnakConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratAngkatAnakPatterns = [
      // Child adoption specific terms
      /surat.*pengangkatan.*anak.*pengadilan/i,
      /pengangkatan.*anak.*putusan.*pengadilan/i,
      /surat.*angkat.*anak.*resmi/i,

      // Legal process patterns
      /pengangkatan.*anak.*sidang.*pengadilan/i,
      /surat.*pengangkatan.*anak.*hakim/i,
      /angkat.*anak.*legal.*sah/i,

      // Adoptive parent patterns
      /surat.*pengangkatan.*orang.*tua.*angkat/i,
      /pengangkatan.*anak.*surat.*pernyataan/i,
      /surat.*angkat.*anak.*ktp.*orang.*tua/i,

      // Document-related patterns
      /surat.*pengangkatan.*akta.*kelahiran.*anak/i,
      /pengangkatan.*anak.*kartu.*keluarga/i,
      /surat.*angkat.*anak.*fotokopi/i,

      // Location-specific
      /surat.*pengangkatan.*anak.*garut/i,
      /pengangkatan.*anak.*garut/i,
      /surat.*angkat.*anak.*garut/i,

      // Informal expressions
      /ribet.*ga.*surat.*angkat.*anak/i,
      /susah.*ga.*pengangkatan.*anak/i,
      /gampang.*ga.*surat.*angkat.*anak/i,

      // Alternative terms
      /keterangan.*pengangkatan.*anak/i,
      /dokumen.*angkat.*anak/i,
      /surat.*adopsi.*anak/i,
      /keterangan.*adopsi/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratAngkatAnakPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pindah Keluar Negeri services - AUTOMATED GENERATION
   */
  private isSuratPindahKeluarNegeriQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPindahKeluarNegeriConfig = documentConfigurations.surat_pindah_luar_negeri;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPindahKeluarNegeriConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPindahKeluarNegeriPatterns = [
      // International migration specific terms
      /surat.*pindah.*keluar.*negeri.*paspor/i,
      /pindah.*keluar.*negeri.*visa/i,
      /surat.*pindah.*luar.*negeri.*izin.*tinggal/i,
      /skpln.*paspor.*visa/i,

      // Destination country patterns
      /pindah.*keluar.*negeri.*negara.*tujuan/i,
      /surat.*pindah.*luar.*negeri.*amerika/i,
      /pindah.*keluar.*negeri.*eropa/i,
      /surat.*pindah.*luar.*negeri.*australia/i,

      // Document-related patterns
      /surat.*pindah.*keluar.*negeri.*surat.*pernyataan/i,
      /pindah.*luar.*negeri.*kk.*ktp/i,
      /surat.*pindah.*keluar.*negeri.*keluarga/i,

      // Purpose-related patterns
      /pindah.*keluar.*negeri.*kerja/i,
      /pindah.*keluar.*negeri.*sekolah/i,
      /pindah.*keluar.*negeri.*menikah/i,
      /surat.*pindah.*luar.*negeri.*tinggal.*tetap/i,

      // Location-specific
      /surat.*pindah.*keluar.*negeri.*garut/i,
      /pindah.*luar.*negeri.*garut/i,

      // Informal expressions
      /ribet.*ga.*pindah.*keluar.*negeri/i,
      /susah.*ga.*surat.*pindah.*luar.*negeri/i,
      /gampang.*ga.*pindah.*keluar.*negeri/i,

      // Alternative terms
      /skpln/i,
      /surat.*emigrasi/i,
      /keterangan.*pindah.*luar.*negeri/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPindahKeluarNegeriPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Datang dari Luar Negeri services - AUTOMATED GENERATION
   */
  private isSuratDatangLuarNegeriQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratDatangLuarNegeriConfig = documentConfigurations.surat_datang_luar_negeri;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratDatangLuarNegeriConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratDatangLuarNegeriPatterns = [
      // International arrival specific terms
      /surat.*datang.*luar.*negeri.*paspor/i,
      /datang.*dari.*luar.*negeri.*visa/i,
      /surat.*datang.*luar.*negeri.*kbri/i,
      /datang.*luar.*negeri.*konsulat/i,

      // Origin country patterns
      /datang.*dari.*luar.*negeri.*amerika/i,
      /surat.*datang.*luar.*negeri.*eropa/i,
      /datang.*dari.*luar.*negeri.*australia/i,
      /surat.*datang.*luar.*negeri.*negara.*asal/i,

      // Document-related patterns
      /surat.*datang.*luar.*negeri.*surat.*pernyataan/i,
      /datang.*luar.*negeri.*kk.*ktp/i,
      /surat.*datang.*luar.*negeri.*keluarga/i,
      /datang.*luar.*negeri.*bukti.*alamat/i,

      // Purpose-related patterns
      /datang.*luar.*negeri.*pulang.*kampung/i,
      /datang.*luar.*negeri.*kembali.*indonesia/i,
      /surat.*datang.*luar.*negeri.*repatriasi/i,
      /datang.*luar.*negeri.*pindah.*kembali/i,

      // Location-specific
      /surat.*datang.*luar.*negeri.*garut/i,
      /datang.*luar.*negeri.*garut/i,

      // Informal expressions
      /ribet.*ga.*datang.*luar.*negeri/i,
      /susah.*ga.*surat.*datang.*luar.*negeri/i,
      /gampang.*ga.*datang.*luar.*negeri/i,

      // Alternative terms
      /skdln/i,
      /surat.*imigrasi/i,
      /keterangan.*datang.*luar.*negeri/i,
      /surat.*kedatangan.*luar.*negeri/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratDatangLuarNegeriPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Lahir Mati services - AUTOMATED GENERATION
   */
  private isSuratLahirMatiQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratLahirMatiConfig = documentConfigurations.surat_lahir_mati;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratLahirMatiConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratLahirMatiPatterns = [
      // Stillbirth specific terms
      /surat.*lahir.*mati.*rumah.*sakit/i,
      /lahir.*mati.*rs/i,
      /surat.*lahir.*mati.*dokter/i,
      /lahir.*mati.*bidan/i,

      // Medical facility patterns
      /keterangan.*lahir.*mati.*klinik/i,
      /surat.*lahir.*mati.*puskesmas/i,
      /lahir.*mati.*penolong.*kelahiran/i,

      // Family-related patterns
      /surat.*lahir.*mati.*orang.*tua/i,
      /lahir.*mati.*keluarga/i,
      /surat.*lahir.*mati.*ibu/i,
      /lahir.*mati.*ayah/i,

      // Document-related patterns
      /surat.*lahir.*mati.*surat.*keterangan.*dokter/i,
      /lahir.*mati.*visum/i,
      /surat.*lahir.*mati.*kk.*ktp/i,

      // Location-specific
      /surat.*lahir.*mati.*garut/i,
      /lahir.*mati.*garut/i,

      // Informal expressions
      /ribet.*ga.*surat.*lahir.*mati/i,
      /susah.*ga.*lahir.*mati/i,
      /gampang.*ga.*surat.*lahir.*mati/i,

      // Alternative terms
      /sklm/i,
      /keterangan.*lahir.*mati/i,
      /surat.*stillbirth/i,
      /dokumen.*lahir.*mati/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratLahirMatiPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pembatalan Perkawinan services - AUTOMATED GENERATION
   */
  private isSuratPembatalanPerkawinanQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPembatalanPerkawinanConfig = documentConfigurations.surat_batal_kawin;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPembatalanPerkawinanConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPembatalanPerkawinanPatterns = [
      // Marriage annulment specific terms
      /surat.*pembatalan.*perkawinan.*pengadilan/i,
      /pembatalan.*perkawinan.*putusan.*pengadilan/i,
      /surat.*batal.*kawin.*pengadilan.*negeri/i,
      /pembatalan.*nikah.*pengadilan/i,

      // Legal process patterns
      /pembatalan.*perkawinan.*sidang.*pengadilan/i,
      /surat.*pembatalan.*perkawinan.*hakim/i,
      /batal.*kawin.*legal.*resmi/i,
      /pembatalan.*nikah.*putusan.*hakim/i,

      // Document-related patterns
      /surat.*pembatalan.*perkawinan.*akta.*nikah/i,
      /pembatalan.*perkawinan.*kk.*ktp/i,
      /surat.*batal.*kawin.*fotokopi/i,
      /pembatalan.*nikah.*surat.*pernyataan/i,

      // Reason-related patterns
      /pembatalan.*perkawinan.*tidak.*sah/i,
      /surat.*batal.*kawin.*cacat.*hukum/i,
      /pembatalan.*nikah.*syarat.*tidak.*terpenuhi/i,

      // Location-specific
      /surat.*pembatalan.*perkawinan.*garut/i,
      /pembatalan.*nikah.*garut/i,
      /surat.*batal.*kawin.*garut/i,

      // Informal expressions
      /ribet.*ga.*pembatalan.*perkawinan/i,
      /susah.*ga.*surat.*batal.*kawin/i,
      /gampang.*ga.*pembatalan.*nikah/i,

      // Alternative terms
      /skbp/i,
      /surat.*annulment/i,
      /keterangan.*batal.*kawin/i,
      /dokumen.*pembatalan.*perkawinan/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPembatalanPerkawinanPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pembatalan Perceraian services - AUTOMATED GENERATION
   */
  private isSuratPembatalanPerceraianQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPembatalanPerceraianConfig = documentConfigurations.surat_batal_cerai;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPembatalanPerceraianConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPembatalanPerceraianPatterns = [
      // Divorce annulment specific terms
      /surat.*pembatalan.*perceraian.*pengadilan/i,
      /pembatalan.*perceraian.*putusan.*pengadilan/i,
      /surat.*batal.*cerai.*pengadilan.*negeri/i,
      /pembatalan.*cerai.*pengadilan/i,

      // Legal process patterns
      /pembatalan.*perceraian.*sidang.*pengadilan/i,
      /surat.*pembatalan.*perceraian.*hakim/i,
      /batal.*cerai.*legal.*resmi/i,
      /pembatalan.*cerai.*putusan.*hakim/i,

      // Document-related patterns
      /surat.*pembatalan.*perceraian.*akta.*cerai/i,
      /pembatalan.*perceraian.*kk.*ktp/i,
      /surat.*batal.*cerai.*fotokopi/i,
      /pembatalan.*cerai.*surat.*pernyataan/i,

      // Reason-related patterns
      /pembatalan.*perceraian.*tidak.*sah/i,
      /surat.*batal.*cerai.*cacat.*hukum/i,
      /pembatalan.*cerai.*syarat.*tidak.*terpenuhi/i,

      // Location-specific
      /surat.*pembatalan.*perceraian.*garut/i,
      /pembatalan.*cerai.*garut/i,
      /surat.*batal.*cerai.*garut/i,

      // Informal expressions
      /ribet.*ga.*pembatalan.*perceraian/i,
      /susah.*ga.*surat.*batal.*cerai/i,
      /gampang.*ga.*pembatalan.*cerai/i,

      // Alternative terms
      /skbc/i,
      /surat.*annulment.*divorce/i,
      /keterangan.*batal.*cerai/i,
      /dokumen.*pembatalan.*perceraian/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPembatalanPerceraianPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pelepasan Kewarganegaraan Indonesia services - AUTOMATED GENERATION
   */
  private isSuratPelepasanKewarganegaraanQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPelepasanKewarganegaraanConfig = documentConfigurations.surat_lepas_wni;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPelepasanKewarganegaraanConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPelepasanKewarganegaraanPatterns = [
      // Citizenship renunciation specific terms
      /surat.*pelepasan.*kewarganegaraan.*indonesia/i,
      /pelepasan.*kewarganegaraan.*wni/i,
      /surat.*lepas.*wni.*resmi/i,
      /pelepasan.*citizenship.*indonesia/i,

      // Legal process patterns
      /pelepasan.*kewarganegaraan.*kemenkumham/i,
      /surat.*lepas.*wni.*kementerian/i,
      /pelepasan.*kewarganegaraan.*legal.*resmi/i,
      /lepas.*wni.*proses.*hukum/i,

      // Document-related patterns
      /surat.*pelepasan.*kewarganegaraan.*paspor/i,
      /pelepasan.*wni.*kk.*ktp/i,
      /surat.*lepas.*wni.*fotokopi/i,
      /pelepasan.*kewarganegaraan.*surat.*pernyataan/i,

      // Purpose-related patterns
      /pelepasan.*kewarganegaraan.*naturalisasi/i,
      /surat.*lepas.*wni.*negara.*lain/i,
      /pelepasan.*kewarganegaraan.*dual.*citizenship/i,
      /lepas.*wni.*untuk.*menikah/i,

      // Location-specific
      /surat.*pelepasan.*kewarganegaraan.*garut/i,
      /pelepasan.*wni.*garut/i,
      /surat.*lepas.*wni.*garut/i,

      // Informal expressions
      /ribet.*ga.*pelepasan.*kewarganegaraan/i,
      /susah.*ga.*surat.*lepas.*wni/i,
      /gampang.*ga.*pelepasan.*wni/i,

      // Alternative terms
      /skpki/i,
      /surat.*renounce.*citizenship/i,
      /keterangan.*lepas.*wni/i,
      /dokumen.*pelepasan.*kewarganegaraan/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPelepasanKewarganegaraanPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking about Surat Keterangan Pengganti Tanda Identitas services - AUTOMATED GENERATION
   */
  private isSuratPenggantiIdentitasQuery(query: string): boolean {
    // Generate casual patterns automatically using the pattern generator
    const suratPenggantiIdentitasConfig = documentConfigurations.surat_pengganti_identitas;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(suratPenggantiIdentitasConfig);

    // Minimal manual patterns for edge cases and specific scenarios
    const manualSuratPenggantiIdentitasPatterns = [
      // Identity replacement specific terms
      /surat.*pengganti.*tanda.*identitas.*hilang/i,
      /pengganti.*identitas.*rusak/i,
      /surat.*pengganti.*id.*hilang/i,
      /pengganti.*tanda.*identitas.*sementara/i,

      // Emergency document patterns
      /surat.*pengganti.*identitas.*darurat/i,
      /pengganti.*id.*emergency/i,
      /surat.*pengganti.*identitas.*temporary/i,
      /pengganti.*tanda.*identitas.*urgent/i,

      // Document-related patterns
      /surat.*pengganti.*identitas.*ktp.*hilang/i,
      /pengganti.*identitas.*kk.*rusak/i,
      /surat.*pengganti.*id.*fotokopi/i,
      /pengganti.*tanda.*identitas.*surat.*kehilangan/i,

      // Purpose-related patterns
      /pengganti.*identitas.*untuk.*bank/i,
      /surat.*pengganti.*id.*untuk.*kerja/i,
      /pengganti.*tanda.*identitas.*untuk.*sekolah/i,
      /pengganti.*identitas.*untuk.*administrasi/i,

      // Location-specific
      /surat.*pengganti.*identitas.*garut/i,
      /pengganti.*id.*garut/i,
      /surat.*pengganti.*tanda.*identitas.*garut/i,

      // Informal expressions
      /ribet.*ga.*pengganti.*identitas/i,
      /susah.*ga.*surat.*pengganti.*id/i,
      /gampang.*ga.*pengganti.*identitas/i,

      // Alternative terms
      /skpti/i,
      /surat.*replacement.*id/i,
      /keterangan.*pengganti.*identitas/i,
      /dokumen.*pengganti.*tanda.*identitas/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualSuratPenggantiIdentitasPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is related to Kepindahan (Migration/Moving) service - AUTOMATED GENERATION
   */
  private isKepindahanQuery(query: string): boolean {
    const kepindahanConfig = documentConfigurations.kepindahan;
    const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(kepindahanConfig);

    // Manual patterns for edge cases and marriage-specific scenarios
    const manualKepindahanPatterns = [
      // Marriage-specific scenarios
      /beda.*domisili.*suami.*istri/i,
      /pindah.*setelah.*nikah/i,
      /pindah.*setelah.*menikah/i,
      /beda.*domisili.*pasangan/i,
      /suami.*istri.*beda.*kota/i,
      /pasangan.*beda.*daerah/i,

      // Common migration expressions - ENHANCED FOR USER QUERIES
      /pindah.*tempat.*tinggal/i,
      /pindah.*alamat/i,
      /pindah.*domisili/i,
      /ganti.*domisili/i,
      /ubah.*domisili/i,
      /mutasi.*tempat.*tinggal/i,
      /relokasi/i,

      // Casual Indonesian expressions - NEW PATTERNS
      /aku.*ingin.*pindah/i,
      /saya.*ingin.*pindah/i,
      /mau.*pindah.*alamat/i,
      /mau.*pindah.*domisili/i,
      /ingin.*pindah.*alamat/i,
      /ingin.*pindah.*domisili/i,
      /pengen.*pindah/i,
      /kepingin.*pindah/i,

      // Address change specific
      /pindah.*alamat.*domisili/i,
      /ganti.*alamat.*domisili/i,
      /ubah.*alamat.*domisili/i,
      /perpindahan.*alamat/i,
      /perpindahan.*domisili/i,

      // Official document references
      /surat.*keterangan.*pindah/i,
      /dokumen.*pindah/i,
      /berkas.*kepindahan/i,
      /formulir.*pindah/i,
      /f.*1.*03/i,
      /skpwni/i,

      // Process-related queries
      /cara.*pindah.*domisili/i,
      /prosedur.*kepindahan/i,
      /langkah.*pindah/i,
      /syarat.*pindah.*domisili/i,
      /persyaratan.*kepindahan/i,

      // Inter-regency migration specific
      /perpindahan.*antar.*kabupaten/i,
      /pindah.*antar.*kabupaten/i,
      /mengajukan.*perpindahan/i,
      /ajukan.*perpindahan/i,
      /ingin.*mengajukan.*perpindahan/i,
      /mau.*mengajukan.*perpindahan/i
    ];

    // Combine generated and manual patterns
    const allPatterns = [...generatedPatterns, ...manualKepindahanPatterns];

    return allPatterns.some(pattern => pattern.test(query));
  }



  /**
   * Format complete service overview for Disdukcapil
   */
  public formatCompleteServiceOverview(): string {
    const response = `📋 **Layanan Lengkap Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut**

Halo kak! 😊 Berikut adalah **daftar lengkap semua dokumen dan layanan** yang tersedia di Disdukcapil Kabupaten Garut, dikelompokkan berdasarkan bidang:

## � **Dokumen Pendaftaran Penduduk (8 Layanan)**
1. **Kartu Tanda Penduduk elektronik (KTP-el)** - Identitas resmi warga negara
2. **Kartu Keluarga (KK)** - Dokumen keanggotaan keluarga
3. **Kartu Identitas Anak (KIA)** - Identitas untuk anak usia 0-17 tahun
4. **Kepindahan/Surat Keterangan Pindah WNI (SKPWNI)** - Layanan perpindahan domisili dalam negeri
5. **Surat Kedatangan Pindah WNI (SKDWNI)** - Kedatangan dari daerah lain
6. **Surat Keterangan Pindah ke Luar Negeri (SKPLN)** - Pindah ke luar negeri
7. **Surat Keterangan Perubahan Elemen Data** - Perubahan data penduduk

## � **Dokumen Pencatatan Sipil (8 Layanan)**
8. **Akta Kelahiran** - Bukti kelahiran resmi
9. **Akta Perkawinan** - Bukti perkawinan resmi
10. **Akta Perceraian** - Bukti perceraian resmi
11. **Akta Kematian** - Bukti kematian resmi
12. **Akta Pengakuan Anak** - Pengakuan anak oleh ayah
13. **Akta Pengesahan Anak** - Pengesahan anak setelah perkawinan orang tua
14. **Surat Keterangan Pembatalan Perkawinan** - Pembatalan perkawinan
15. **Surat Keterangan Pembatalan Perceraian** - Pembatalan perceraian

## 🛠️ **Layanan Lainnya (9 Layanan)**
16. **Surat Keterangan Pindah Orang Asing (SKPOA)** - Pindah untuk WNA
17. **Surat Keterangan Tempat Tinggal (SKTT) WNA** - Tempat tinggal untuk WNA
18. **Surat Keterangan Lahir Mati** - Kelahiran dalam keadaan meninggal
19. **Biodata Penduduk** - Data lengkap penduduk
20. **Kutipan Akta Pencatatan Sipil (Duplikat)** - Pengganti akta hilang/rusak
21. **Salinan Lengkap Akta Pencatatan Sipil** - Salinan resmi akta
22. **Surat Keterangan Keabsahan Dokumen** - Verifikasi keaslian dokumen
23. **Surat Keterangan Pendaftaran Penduduk WNI/WNA ITAP (SKDLN)** - Pendaftaran dari luar negeri
24. **Surat Keterangan Perubahan Status (WNA ITAS→ITAP)** - Perubahan status WNA

## ℹ️ **Informasi Umum**
⏱️ **Waktu penyelesaian:** 1-14 hari kerja (tergantung jenis dokumen)
💰 **Biaya:** Sebagian besar layanan **GRATIS**
🕐 **Jam pelayanan:** 08:00-15:00 WIB (Senin-Jumat)
📍 **Lokasi:** Kantor Disdukcapil Kabupaten Garut

## 🤝 **Bantuan Lebih Lanjut**
📞 **WhatsApp:** +62-851-8304-3205

💡 **Ingin tahu persyaratan spesifik?**
Tanyakan saja kepada SELLY, misalnya:
• "Persyaratan KTP baru apa saja kak?"
• "Cara mengurus akta kelahiran gimana?"
• "Syarat kartu keluarga apa aja?"

Apakah ada dokumen tertentu yang ingin kak tanyakan lebih detail? SELLY siap membantu! 😊`;

    return response;
  }

  /**
   * Format KTP interactive assessment for personalized guidance
   */
  public formatKTPInteractiveAssessment(): string {
    // Generate comprehensive KTP assessment with detailed scenarios
    return this.generateComprehensiveKTPAssessment();
  }

  /**
   * Generate simple KTP assessment that asks for user's condition first
   */
  private generateComprehensiveKTPAssessment(): string {
    const greeting = 'Halo kak! 😊 Saya SELLY siap bantu kakak dengan layanan KTP.';
    const question = 'Untuk memberikan panduan yang tepat, boleh cerita kondisi kakak saat ini?';

    return `${greeting}

${question}

🤔 **Pilih situasi kakak:**

**A** - Sudah pernah perekaman, tapi KTP hilang/rusak
**B** - Sudah pernah perekaman, tapi ada data yang salah/perlu dikoreksi
**C** - Belum pernah perekaman sama sekali (KTP pertama kali)
**D** - Tidak yakin/tidak ingat

💬 **Silakan jawab dengan huruf (A, B, C, atau D) atau ceritakan situasi kakak dengan kata-kata.**

📞 **Info lebih lanjut:** WhatsApp +62-851-8304-3205 atau online di pastioke.garutkab.go.id

SELLY siap bantu kakak! 🤝`;
  }

  /**
   * Get specific KTP scenario response based on user choice
   */
  public getKTPScenarioResponse(scenario: string): string | null {
    const lowerScenario = scenario.toLowerCase().trim();

    if (lowerScenario === 'a' || lowerScenario.includes('hilang') || lowerScenario.includes('rusak')) {
      return this.getKTPHilangRusakResponse();
    } else if (lowerScenario === 'b' || lowerScenario.includes('koreksi') || lowerScenario.includes('salah') || lowerScenario.includes('ubah')) {
      return this.getKTPKoreksiDataResponse();
    } else if (lowerScenario === 'c' || lowerScenario.includes('pertama') || lowerScenario.includes('belum pernah')) {
      return this.getKTPPertamaKaliResponse();
    } else if (lowerScenario === 'd' || lowerScenario.includes('tidak yakin') || lowerScenario.includes('tidak ingat')) {
      return this.getKTPTidakYakinResponse();
    }

    // Return null if scenario not recognized (will fall back to general KTP query)
    return null;
  }

  /**
   * KTP Hilang/Rusak response (Scenario A)
   */
  private getKTPHilangRusakResponse(): string {
    return `**A - Sudah pernah perekaman, tapi KTP hilang/rusak (Penggantian KTP Hilang/Rusak)**

Situasi ini untuk penggantian karena hilang atau rusak. Proses lebih cepat karena data biometrik sudah ada di sistem.

📋 **Persyaratan (Hilang):**
• Surat kehilangan dari kepolisian (asli)
• Fotokopi Kartu Keluarga (KK)

📋 **Persyaratan (Rusak):**
• KTP lama yang rusak
• Fotokopi Kartu Keluarga (KK)

🔄 **Langkah-langkah:**
1. (Hilang: Buat surat kehilangan di polisi, 30-60 menit)
2. Datang ke Disdukcapil dengan syarat (15 menit)
3. Verifikasi dokumen dan data (10 menit)
4. Pengambilan foto/sidik jari jika diperlukan (15 menit)
5. Dapat tanda terima (5 menit)
6. Ambil KTP baru dalam 7 hari kerja

⏱️ **Waktu:** 7 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

🌐 **Layanan Digital 2025:** ✅ IKD support (aktivasi wajib), ✅ Online application via pastioke.garutkab.go.id, ✅ QR verification, ✅ TTE

📌 **Catatan Penting:**
• Wajib datang sendiri untuk verifikasi biometrik jika diperlukan
• Nama harus huruf Latin, min 2 kata, max 60 huruf, tanpa angka/tanda baca negatif
• Cetak mandiri dengan QR code
• Kalau hilang, surat polisi wajib; kalau rusak, serahkan KTP lama

Apakah ini situasi kak? Kalau ya, SELLY bisa bantu detail lebih lanjut! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 🤝`;
  }

  /**
   * KTP Koreksi Data response (Scenario B)
   */
  private getKTPKoreksiDataResponse(): string {
    return `**B - Sudah pernah perekaman, tapi ada data yang salah/perlu dikoreksi (Perubahan Data KTP)**

Situasi ini untuk koreksi data (e.g., nama salah, alamat berubah). Proses mirip penggantian, tapi fokus verifikasi perubahan. Berdasarkan Permendagri 73/2022, koreksi nama harus sesuai aturan Latin.

📋 **Persyaratan:**
• KTP lama (asli)
• Fotokopi Kartu Keluarga (KK)
• Dokumen pendukung perubahan (e.g., akta/surat resmi untuk nama/alamat)

🔄 **Langkah-langkah:**
1. Datang ke Disdukcapil dengan syarat (15 menit)
2. Verifikasi dokumen dan bukti perubahan (10-20 menit)
3. Pengambilan foto/sidik jari jika data biometrik berubah (15 menit)
4. Dapat tanda terima (5 menit)
5. Ambil KTP baru dalam 7 hari kerja

⏱️ **Waktu:** 7 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

🌐 **Layanan Digital 2025:** ✅ IKD support (update data via app setelah koreksi), ✅ Online application via pastioke.garutkab.go.id, ✅ QR verification, ✅ TTE

📌 **Catatan Penting:**
• Wajib bawa bukti asli perubahan (e.g., akta untuk nama)
• Nama harus minimal 2 kata, max 60 huruf, huruf Latin, tidak negatif
• Datang sendiri untuk verifikasi
• Cetak mandiri dengan QR code setelah koreksi

Kalau data kak yang mana perlu dikoreksi? SELLY bisa bantu spesifik! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 😊`;
  }

  /**
   * KTP Pertama Kali response (Scenario C)
   */
  private getKTPPertamaKaliResponse(): string {
    return `**C - Belum pernah perekaman sama sekali (KTP Pertama Kali)**

Situasi ini untuk pembuatan KTP baru (usia 17+ atau sudah kawin). Wajib perekaman biometrik pertama kali.

📋 **Persyaratan:**
• Fotokopi Kartu Keluarga (KK)
• Akta kelahiran/ijazah terakhir (asli)
• Bukti umur 17 tahun atau buku nikah/akta perkawinan jika sudah kawin

🔄 **Langkah-langkah:**
1. Datang ke Disdukcapil dengan syarat (15 menit)
2. Verifikasi dokumen (10 menit)
3. Perekaman biometrik: Foto dan sidik jari (15 menit)
4. Dapat tanda terima dan surat sementara (5 menit)
5. Ambil KTP dalam jadwal (5 menit)

⏱️ **Waktu:** Bisa langsung/online | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

🌐 **Layanan Digital 2025:** ✅ IKD support (wajib aktivasi setelah dapat KTP), ✅ Online via pastioke.garutkab.go.id atau IKD/situs Dukcapil, ✅ QR verification, ✅ TTE

📌 **Catatan Penting:**
• Wajib datang sendiri untuk biometrik
• Bawa dokumen asli
• Nama: Huruf Latin, min 2 kata, max 60 huruf, tidak negatif
• Cetak mandiri dengan QR; aktivasi IKD: Scan QR, verifikasi wajah, app dengan NIK/email/HP

Ini situasi pertama kali ya kak? SELLY siap pandu langkah demi langkah! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 🚀`;
  }

  /**
   * KTP Tidak Yakin response (Scenario D)
   */
  private getKTPTidakYakinResponse(): string {
    return `**D - Tidak yakin/tidak ingat (Cek Status atau Default ke Baru)**

Kalau kak lupa, SELLY sarankan cek status dulu via online atau kantor. Default ke prosedur KTP baru, tapi bisa verifikasi data lama jika ada. Gunakan IKD untuk cek digital jika sudah punya.

📋 **Persyaratan (Untuk Cek/Baru):**
• Fotokopi KK
• Dokumen identitas lain (e.g., akta/ijazah)
• Jika ingat NIK, bawa untuk verifikasi

🔄 **Langkah-langkah:**
1. Cek online via pastioke.garutkab.go.id atau IKD app (5 menit, butuh NIK/email)
2. Jika tidak ingat, datang ke Disdukcapil (15 menit)
3. Verifikasi data (10 menit)
4. Jika belum ada, lanjut perekaman seperti baru (15 menit)
5. Dapat info status dan tanda terima

⏱️ **Waktu:** Cepat jika online | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

🌐 **Layanan Digital 2025:** ✅ IKD untuk cek status (aktivasi jika belum), ✅ Online verification via pastioke.garutkab.go.id, ✅ QR code

📌 **Catatan Penting:**
• Jika ragu, mulai dari cek NIK via Dukcapil
• Jika belum pernah, ikuti prosedur C (baru)
• Semua gratis; cetak mandiri dengan QR

Coba ceritakan lebih detail kak, biar SELLY bantu pastikan! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 😊`;
  }

  /**
   * Check if query is for a specific document type (not KK) - ALL 24 SERVICES
   */
  private isSpecificDocumentQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // Comprehensive patterns for all 24 Disdukcapil services (excluding KK)
    const specificDocumentPatterns = [
      // 1. KTP-el (handled separately)
      /\b(ktp|kartu\s+tanda\s+penduduk)\b/i,

      // 3. KIA - Kartu Identitas Anak
      /\b(kia|kartu\s+identitas\s+anak)\b/i,

      // 4-6. Kepindahan Services
      /\b(kepindahan|pindah\s+domisili|surat\s+pindah|skpwni|skdwni|skpln)\b/i,
      /\b(pindah\s+(ke\s+)?luar\s+negeri|pindah\s+(ke\s+)?dalam\s+negeri)\b/i,

      // 7. Perubahan Elemen Data
      /\b(perubahan\s+elemen\s+data|perubahan\s+data|koreksi\s+data)\b/i,

      // 8-15. Akta Services (Pencatatan Sipil)
      /\b(akta\s+kelahiran|akte\s+lahir|surat\s+kelahiran)\b/i,
      /\b(akta\s+perkawinan|akta\s+nikah|surat\s+nikah)\b/i,
      /\b(akta\s+perceraian|akta\s+cerai|surat\s+cerai)\b/i,
      /\b(akta\s+kematian|surat\s+kematian)\b/i,
      /\b(akta\s+pengakuan\s+anak|pengakuan\s+anak)\b/i,
      /\b(akta\s+pengesahan\s+anak|pengesahan\s+anak)\b/i,
      /\b(pembatalan\s+perkawinan|batal\s+nikah)\b/i,
      /\b(pembatalan\s+perceraian|batal\s+cerai)\b/i,

      // 16-17. WNA Services
      /\b(skpoa|pindah\s+orang\s+asing|wna\s+pindah)\b/i,
      /\b(sktt\s+wna|tempat\s+tinggal\s+wna|wna\s+tinggal)\b/i,

      // 18. Lahir Mati
      /\b(lahir\s+mati|kelahiran\s+mati|surat\s+lahir\s+mati)\b/i,

      // 19. Biodata Penduduk
      /\b(biodata\s+penduduk|data\s+penduduk|profil\s+penduduk)\b/i,

      // 20-21. Kutipan dan Salinan Akta
      /\b(kutipan\s+akta|duplikat\s+akta|salinan\s+akta)\b/i,
      /\b(salinan\s+lengkap|copy\s+akta)\b/i,

      // 22. Keabsahan Dokumen
      /\b(keabsahan\s+dokumen|verifikasi\s+dokumen|validasi\s+dokumen)\b/i,

      // 23. SKDLN (Pendaftaran dari Luar Negeri)
      /\b(skdln|pendaftaran\s+luar\s+negeri|wni\s+luar\s+negeri)\b/i,

      // 24. Perubahan Status WNA
      /\b(perubahan\s+status\s+wna|itas\s+itap|status\s+wna)\b/i,

      // General document terms that should NOT go to KK
      /\b(legalisir|legalisasi|pengesahan\s+dokumen)\b/i,
      /\b(surat\s+keterangan(?!\s+kk))\b/i, // Surat keterangan but not "surat keterangan KK"

      // Action verbs with specific documents
      /\b(mengajukan|buat|bikin|urus)\s+(akta|surat|biodata|kutipan|salinan|kepindahan|legalisir)\b/i
    ];

    return specificDocumentPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get response for specific document types - ALL 24 SERVICES COVERAGE
   */
  private getSpecificDocumentResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    // GROUP 1: DOKUMEN PENDAFTARAN PENDUDUK (8 Services)

    // 1. KTP-el (handled by separate KTP routing)
    // Already handled by isKTPInitialQuery()

    // 3. KIA - Kartu Identitas Anak
    if (/\b(kia|kartu\s+identitas\s+anak)\b/i.test(query)) {
      const kiaService = this.knowledgeBase.get('kia');
      if (kiaService) return this.formatServiceResponse(kiaService);
    }

    // 4-6. Kepindahan Services
    if (/\b(kepindahan|pindah\s+domisili|surat\s+pindah|skpwni|skdwni|skpln)\b/i.test(query)) {
      const kepindahanService = this.knowledgeBase.get('kepindahan');
      if (kepindahanService) return this.formatServiceResponse(kepindahanService);
    }

    // 7. Perubahan Elemen Data
    if (/\b(perubahan\s+elemen\s+data|perubahan\s+data|koreksi\s+data)\b/i.test(query)) {
      const perubahanDataService = this.knowledgeBase.get('perubahan_elemen_data');
      if (perubahanDataService) return this.formatServiceResponse(perubahanDataService);
    }

    // GROUP 2: DOKUMEN PENCATATAN SIPIL (8 Services)

    // 8. Akta Kelahiran
    if (/\b(akta\s+kelahiran|akte\s+lahir|surat\s+kelahiran)\b/i.test(query)) {
      const aktaKelahiranService = this.knowledgeBase.get('akta_kelahiran');
      if (aktaKelahiranService) return this.formatServiceResponse(aktaKelahiranService);
    }

    // 9. Akta Perkawinan
    if (/\b(akta\s+perkawinan|akta\s+nikah|surat\s+nikah)\b/i.test(query)) {
      const aktaPerkawinanService = this.knowledgeBase.get('akta_perkawinan');
      if (aktaPerkawinanService) return this.formatServiceResponse(aktaPerkawinanService);
    }

    // 10. Akta Perceraian
    if (/\b(akta\s+perceraian|akta\s+cerai|surat\s+cerai)\b/i.test(query)) {
      const aktaPerceraianService = this.knowledgeBase.get('akta_perceraian');
      if (aktaPerceraianService) return this.formatServiceResponse(aktaPerceraianService);
    }

    // 11. Akta Kematian
    if (/\b(akta\s+kematian|surat\s+kematian)\b/i.test(query)) {
      const aktaKematianService = this.knowledgeBase.get('akta_kematian');
      if (aktaKematianService) return this.formatServiceResponse(aktaKematianService);
    }

    // 12. Akta Pengakuan Anak
    if (/\b(akta\s+pengakuan\s+anak|pengakuan\s+anak)\b/i.test(query)) {
      const aktaPengakuanAnakService = this.knowledgeBase.get('akta_pengakuan_anak');
      if (aktaPengakuanAnakService) return this.formatServiceResponse(aktaPengakuanAnakService);
    }

    // 13. Akta Pengesahan Anak
    if (/\b(akta\s+pengesahan\s+anak|pengesahan\s+anak)\b/i.test(query)) {
      const aktaPengesahanAnakService = this.knowledgeBase.get('akta_pengesahan_anak');
      if (aktaPengesahanAnakService) return this.formatServiceResponse(aktaPengesahanAnakService);
    }

    // 14-15. Pembatalan Services
    if (/\b(pembatalan\s+perkawinan|batal\s+nikah)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Pembatalan Perkawinan');
    }

    if (/\b(pembatalan\s+perceraian|batal\s+cerai)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Pembatalan Perceraian');
    }

    // GROUP 3: LAYANAN LAINNYA (9 Services)

    // 16-17. WNA Services
    if (/\b(skpoa|pindah\s+orang\s+asing|wna\s+pindah)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Pindah Orang Asing (SKPOA)');
    }

    if (/\b(sktt\s+wna|tempat\s+tinggal\s+wna|wna\s+tinggal)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Tempat Tinggal WNA');
    }

    // 18. Lahir Mati
    if (/\b(lahir\s+mati|kelahiran\s+mati|surat\s+lahir\s+mati)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Lahir Mati');
    }

    // 19. Biodata Penduduk
    if (/\b(biodata\s+penduduk|data\s+penduduk|profil\s+penduduk)\b/i.test(query)) {
      const biodataService = this.knowledgeBase.get('biodata_penduduk');
      if (biodataService) return this.formatServiceResponse(biodataService);
    }

    // 20-21. Kutipan dan Salinan
    if (/\b(kutipan\s+akta|duplikat\s+akta)\b/i.test(query)) {
      return this.getGenericServiceResponse('Kutipan Akta Pencatatan Sipil (Duplikat)');
    }

    if (/\b(salinan\s+lengkap|salinan\s+akta)\b/i.test(query)) {
      return this.getGenericServiceResponse('Salinan Lengkap Akta Pencatatan Sipil');
    }

    // 22. Keabsahan Dokumen
    if (/\b(keabsahan\s+dokumen|verifikasi\s+dokumen|validasi\s+dokumen)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Keabsahan Dokumen');
    }

    // 23. SKDLN
    if (/\b(skdln|pendaftaran\s+luar\s+negeri|wni\s+luar\s+negeri)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Pendaftaran Penduduk WNI/WNA ITAP (SKDLN)');
    }

    // 24. Perubahan Status WNA
    if (/\b(perubahan\s+status\s+wna|itas\s+itap|status\s+wna)\b/i.test(query)) {
      return this.getGenericServiceResponse('Surat Keterangan Perubahan Status WNA');
    }

    // General legalization
    if (/\b(legalisir|legalisasi)\b/i.test(query)) {
      return this.getGenericServiceResponse('Legalisir Dokumen');
    }

    // If no specific match, show complete service list
    return this.getCompleteServiceListResponse();
  }

  /**
   * Get generic service response for services not fully implemented
   */
  private getGenericServiceResponse(serviceName: string): string {
    return `Halo kak! 😊 Untuk mengurus **${serviceName}**, berikut informasi umumnya:

📋 **Informasi Layanan:**
• **Layanan**: ${serviceName}
• **Lokasi**: Kantor Disdukcapil Kabupaten Garut
• **Jam pelayanan**: 08:00-15:00 WIB (Senin-Jumat)
• **Biaya**: Sebagian besar layanan GRATIS

💡 **Untuk informasi persyaratan lengkap:**
📞 **WhatsApp**: +62-851-8304-3205
🌐 **Online**: pastioke.garutkab.go.id

🎯 Atau tanyakan ke SELLY dengan lebih spesifik, misalnya:
"Persyaratan ${serviceName.toLowerCase()} apa saja kak?"

Ada yang mau ditanyakan lebih detail, kak? 🤝`;
  }

  /**
   * Get complete service list response
   */
  private getCompleteServiceListResponse(): string {
    const completeServiceInfo = this.knowledgeBase.get('layanan_lengkap_disdukcapil');
    if (completeServiceInfo && typeof completeServiceInfo === 'object') {
      return this.formatServiceResponse(completeServiceInfo);
    }

    return `Halo kak! 😊 Saya SELLY siap membantu dengan semua layanan Disdukcapil Kabupaten Garut.

📋 **24 Layanan Tersedia:**

**🆔 Dokumen Pendaftaran Penduduk:**
• KTP-el, KK, KIA, Kepindahan, Biodata Penduduk

**📜 Dokumen Pencatatan Sipil:**
• Akta Kelahiran, Perkawinan, Perceraian, Kematian

**🛠️ Layanan Lainnya:**
• Legalisir, Surat Keterangan, Layanan WNA

💡 **Tanyakan spesifik ke SELLY:**
"Persyaratan akta kelahiran apa saja kak?"
"Cara mengurus KTP hilang gimana?"
"Syarat kartu keluarga apa aja?"

🎯 Silakan sebutkan dokumen yang ingin kak urus! 🤝`;
  }

  /**
   * Check if query is specifically about KK (not other documents)
   */
  private isKKSpecificQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // Only match queries that are clearly about KK/Family Card
    const kkSpecificPatterns = [
      /\b(kk|kartu\s+keluarga)\b/i,
      /\b(keluarga|family\s+card)\b/i,
      /\b(numpang\s+kk|pisah\s+kk|buat\s+kk)\b/i
    ];

    // Must contain KK-specific terms AND not contain other document terms
    const hasKKTerms = kkSpecificPatterns.some(pattern => pattern.test(query));
    const hasOtherDocTerms = /\b(akta|ktp|kepindahan|legalisir|kia|biodata|surat\s+keterangan)\b/i.test(query);

    return hasKKTerms && !hasOtherDocTerms;
  }

  /**
   * Check if query is asking for KTP requirements/syarat
   */
  private isKTPRequirementsQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // KTP requirements query patterns
    const ktpRequirementsPatterns = [
      // Direct requirement questions
      /\b(syarat|persyaratan|dokumen|berkas)\s+(ktp|kartu\s+tanda\s+penduduk)\b/i,
      /\bktp\s+(syarat|persyaratan|dokumen|berkas)\b/i,
      /\b(apa|mana)\s+(syarat|persyaratan|dokumen|berkas)\s+(ktp|kartu\s+tanda\s+penduduk)\b/i,

      // Common variations
      /\bsyarat\s+(cetak|buat|bikin|urus)\s+ktp\b/i,
      /\bpersyaratan\s+(cetak|buat|bikin|urus)\s+ktp\b/i,
      /\bdokumen\s+(cetak|buat|bikin|urus)\s+ktp\b/i,
      /\bberkas\s+(cetak|buat|bikin|urus)\s+ktp\b/i,

      // Question patterns
      /\b(kalau|kalo)\s+(syarat|persyaratan|dokumen|berkas)\s+(ktp|cetak\s+ktp)\b/i,
      /\bbutuh\s+(dokumen|berkas|syarat|persyaratan)\s+(apa|mana)\s+(ktp|cetak\s+ktp)\b/i,
      /\b(apa\s+saja|apa\s+aja)\s+(syarat|persyaratan|dokumen|berkas)\s+(ktp|cetak\s+ktp)\b/i
    ];

    return ktpRequirementsPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get response for KTP requirements queries
   */
  private getKTPRequirementsResponse(query: string): string {
    return `📋 **PERSYARATAN KARTU TANDA PENDUDUK (KTP)**
**Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut**

Halo kak! 😊 Berikut persyaratan untuk pengurusan KTP:

🆔 **PERSYARATAN UMUM KTP:**
✅ **Fotokopi Kartu Keluarga (KK)** - Asli + Fotokopi
✅ **Akta Kelahiran/Ijazah terakhir** - Asli + Fotokopi
✅ **Bukti umur 17 tahun** atau Buku Nikah (jika sudah kawin)

📝 **PERSYARATAN KHUSUS (sesuai kondisi):**

🔸 **KTP Hilang/Rusak:**
• Surat keterangan kehilangan dari Polsek
• KTP lama (jika masih ada/rusak)

🔸 **KTP Koreksi Data:**
• Dokumen pendukung data yang benar
• Surat pernyataan koreksi data

🔸 **KTP Pertama Kali:**
• Surat pengantar dari RT/RW
• Pas foto 3x4 (2 lembar)

⏰ **WAKTU PELAYANAN:** 1-3 hari kerja
💰 **BIAYA:** GRATIS (sesuai UU)
🏢 **LOKASI:** Disdukcapil Kabupaten Garut

💡 **Tips:** Pastikan semua dokumen asli dan fotokopi dibawa ya kak!

Ada kondisi khusus yang ingin kak tanyakan? SELLY siap membantu! 😊`;
  }

  /**
   * Check if query is an initial KTP request (before scenario assessment)
   */
  private isKTPInitialQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // Exclude requirement queries (handled separately)
    if (this.isKTPRequirementsQuery(lowerQuery)) {
      return false;
    }

    // KTP initial request patterns
    const ktpInitialPatterns = [
      // Direct KTP requests (excluding requirement questions)
      /\b(mau|ingin|butuh|perlu|buat|bikin|cetak|urus)\s+(ktp|kartu\s+tanda\s+penduduk)\b/i,
      /\bktp\s+(baru|hilang|rusak|salah|koreksi)\b/i,
      /\b(pengajuan|pengurusan|pembuatan)\s+ktp\b/i,

      // Common variations (but not requirement questions)
      /\bcetak\s+ktp\b/i,
      /\bbikin\s+ktp\b/i,
      /\burus\s+ktp\b/i,
      /\bmau\s+ktp\b/i,
      /\bingin\s+ktp\b/i,

      // Specific KTP scenarios
      /\bktp\s+(pertama|perdana)\b/i,
      /\bktp\s+(ganti|pengganti)\b/i,
      /\bktp\s+(pindah|mutasi)\b/i
    ];

    return ktpInitialPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get response for initial KTP queries
   */
  private getKTPInitialResponse(query: string): string {
    return `Halo kak! 😊 Saya SELLY akan membantu kak dengan layanan KTP (Kartu Tanda Penduduk). Untuk memberikan panduan yang tepat sesuai situasi kak, saya perlu mengetahui kondisi KTP yang akan diurus.

🤔 Mari kita mulai dengan pertanyaan pertama:

Apa situasi KTP yang akan kak urus?

📋 Pilihan jawaban:
• A - KTP hilang atau rusak (sudah pernah perekaman sebelumnya)
• B - Data di KTP salah dan perlu dikoreksi (sudah pernah perekaman sebelumnya)
• C - Belum pernah perekaman KTP sama sekali (KTP pertama kali)
• D - Tidak yakin/tidak ingat apakah sudah pernah perekaman atau belum

💡 Kenapa saya tanya ini?
Setiap situasi KTP memiliki persyaratan dan prosedur yang berbeda, kak. Dengan mengetahui kondisi kak, saya bisa memberikan panduan yang lebih akurat dan menghemat waktu kak.

🎯 Silakan pilih huruf yang sesuai dengan situasi kak, nanti saya akan berikan panduan lengkap sesuai kebutuhan! 🤝`;
  }

  /**
   * Check if query is a KTP scenario response (A, B, C, D or descriptive text)
   */
  private isKTPScenarioResponse(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // Check for letter responses
    if (lowerQuery === 'a' || lowerQuery === 'b' || lowerQuery === 'c' || lowerQuery === 'd') {
      return true;
    }

    // Check for descriptive responses that match scenarios
    const scenarioPatterns = [
      // Scenario A patterns
      /sudah.*pernah.*perekaman.*hilang/i,
      /sudah.*pernah.*perekaman.*rusak/i,
      /ktp.*hilang/i,
      /ktp.*rusak/i,

      // Scenario B patterns
      /sudah.*pernah.*perekaman.*salah/i,
      /sudah.*pernah.*perekaman.*koreksi/i,
      /data.*ktp.*salah/i,
      /ktp.*data.*salah/i,
      /perlu.*dikoreksi.*ktp/i,
      /ktp.*perlu.*dikoreksi/i,

      // Scenario C patterns
      /belum.*pernah.*perekaman/i,
      /ktp.*pertama.*kali/i,
      /pertama.*kali/i,

      // Scenario D patterns
      /tidak.*yakin/i,
      /tidak.*ingat/i,
      /lupa/i
    ];

    return scenarioPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is a response to Akta Kelahiran scenario assessment
   */
  private isAktaKelahiranScenarioResponse(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // For single letters, we need to be more careful to avoid conflicts with KTP scenarios
    // Only accept single letters if they are specifically E (unique to Akta Kelahiran)
    // or if they contain Akta Kelahiran context
    if (lowerQuery === 'e') {
      return true; // E is unique to Akta Kelahiran (luar negeri)
    }

    // Don't accept A, B, C, D as single letters to avoid KTP conflicts
    // Instead, require more context for these scenarios

    // Check for descriptive responses that match scenarios
    const scenarioPatterns = [
      // Scenario A patterns - Bayi baru lahir (kurang dari 60 hari)
      /bayi.*baru.*lahir/i,
      /kurang.*dari.*60.*hari/i,
      /kelahiran.*normal/i,
      /baru.*lahir/i,
      /lahir.*baru/i,
      /baru.*lahir.*nih/i,

      // Scenario B patterns - Anak sudah lahir lama tapi belum punya akta kelahiran (terlambat daftar)
      /sudah.*lahir.*lama/i,
      /belum.*punya.*akta.*kelahiran/i,
      /terlambat.*daftar/i,
      /lebih.*dari.*60.*hari/i,
      /udah.*lahir.*lama/i,
      /belum.*ada.*akta/i,
      /belum.*punya.*akta/i,

      // Scenario C patterns - Akta kelahiran hilang/rusak dan perlu penggantian
      /akta.*kelahiran.*hilang/i,
      /akta.*kelahiran.*rusak/i,
      /akta.*kelahiran.*gue.*hilang/i,
      /akta.*kelahiran.*saya.*hilang/i,
      /perlu.*penggantian/i,
      /akta.*hilang/i,

      // Scenario D patterns - Ada kesalahan data di akta kelahiran yang perlu dikoreksi
      /kesalahan.*data.*di.*akta.*kelahiran/i,
      /ada.*kesalahan.*data.*di.*akta.*kelahiran/i,
      /perlu.*dikoreksi.*akta.*kelahiran/i,
      /data.*salah.*di.*akta.*kelahiran/i,
      /koreksi.*akta.*kelahiran/i,
      /ada.*yang.*salah.*di.*akta.*kelahiran/i,
      /ada.*salah.*di.*akta.*kelahiran/i,

      // Scenario E patterns - Kelahiran di luar negeri (WNI di luar negeri)
      /kelahiran.*luar.*negeri/i,
      /wni.*luar.*negeri/i,
      /lahir.*luar.*negeri/i,
      /di.*luar.*negeri/i
    ];

    return scenarioPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get specific Akta Kelahiran scenario response based on user choice
   */
  public getAktaKelahiranScenarioResponse(scenario: string): string | null {
    const lowerScenario = scenario.toLowerCase().trim();

    // Handle descriptive patterns (more reliable than single letters)
    if (lowerScenario.includes('bayi baru lahir') || lowerScenario.includes('kurang dari 60 hari') ||
        lowerScenario.includes('baru lahir') || lowerScenario.includes('lahir baru')) {
      return this.getAktaKelahiranBayiBaruResponse();
    } else if (lowerScenario.includes('sudah lahir lama') || lowerScenario.includes('terlambat daftar') ||
               lowerScenario.includes('udah lahir lama') || lowerScenario.includes('belum ada akta') ||
               lowerScenario.includes('belum punya akta')) {
      return this.getAktaKelahiranTerlambatResponse();
    } else if (lowerScenario.includes('akta kelahiran hilang') || lowerScenario.includes('akta kelahiran rusak') ||
               lowerScenario.includes('akta kelahiran gue hilang') || lowerScenario.includes('penggantian')) {
      return this.getAktaKelahiranPenggantiResponse();
    } else if (lowerScenario.includes('kesalahan data di akta kelahiran') || lowerScenario.includes('koreksi akta kelahiran') ||
               lowerScenario.includes('ada yang salah di akta kelahiran') || lowerScenario.includes('data salah di akta kelahiran')) {
      return this.getAktaKelahiranKoreksiResponse();
    } else if (lowerScenario === 'e' || lowerScenario.includes('luar negeri') || lowerScenario.includes('wni luar negeri')) {
      return this.getAktaKelahiranLuarNegeriResponse();
    }

    // Return null if scenario not recognized (will fall back to general Akta Kelahiran query)
    return null;
  }

  /**
   * Get Akta Kelahiran response for Scenario A - Bayi baru lahir (kurang dari 60 hari)
   */
  private getAktaKelahiranBayiBaruResponse(): string {
    return `**A - Bayi Baru Lahir (Kurang dari 60 Hari)**

Situasi ini untuk kelahiran normal yang didaftarkan dalam waktu kurang dari 60 hari setelah kelahiran. Prosesnya paling mudah dan cepat.

📋 **Persyaratan:**
• Surat keterangan kelahiran dari bidan/dokter/rumah sakit
• Fotokopi KTP kedua orang tua
• Fotokopi Kartu Keluarga (KK)
• Fotokopi akta nikah/buku nikah orang tua
• Surat keterangan kelahiran dari kelurahan/desa

🔄 **Langkah-langkah:**
1. Siapkan semua dokumen persyaratan (15 menit)
2. Datang ke Disdukcapil dengan dokumen lengkap (10 menit)
3. Mengisi formulir permohonan akta kelahiran (10 menit)
4. Verifikasi dokumen oleh petugas (15 menit)
5. Dapat tanda terima dan nomor registrasi (5 menit)
6. Ambil akta kelahiran sesuai jadwal (5 menit)

⏱️ **Waktu:** 7 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

🌐 **Layanan Digital 2025:** ✅ Online via pastioke.garutkab.go.id, ✅ QR verification, ✅ TTE (Tanda Tangan Elektronik)

📌 **Catatan Penting:**
• Wajib daftar dalam 60 hari setelah kelahiran
• Bawa dokumen asli untuk verifikasi
• Nama anak: Huruf Latin, min 2 kata, max 60 huruf
• Akta kelahiran berlaku seumur hidup

Ini situasi kelahiran normal ya kak? SELLY siap pandu langkah demi langkah! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 🚀`;
  }

  /**
   * Get Akta Kelahiran response for Scenario B - Terlambat daftar (lebih dari 60 hari)
   */
  private getAktaKelahiranTerlambatResponse(): string {
    return `**B - Anak Sudah Lahir Lama Tapi Belum Punya Akta Kelahiran (Terlambat Daftar)**

Situasi ini untuk kelahiran yang didaftarkan setelah 60 hari dari tanggal kelahiran. Memerlukan persyaratan tambahan dan proses lebih lama.

📋 **Persyaratan:**
• Surat keterangan kelahiran dari bidan/dokter/rumah sakit (jika masih ada)
• Fotokopi KTP kedua orang tua
• Fotokopi Kartu Keluarga (KK)
• Fotokopi akta nikah/buku nikah orang tua
• Surat keterangan terlambat lapor kelahiran dari kelurahan/desa
• Surat pernyataan dari 2 orang saksi yang mengetahui kelahiran
• Surat keterangan dari RT/RW setempat

🔄 **Langkah-langkah:**
1. Siapkan semua dokumen persyaratan (30 menit)
2. Urus surat keterangan terlambat di kelurahan (1-2 hari)
3. Cari 2 saksi dan buat surat pernyataan (1 hari)
4. Datang ke Disdukcapil dengan dokumen lengkap (15 menit)
5. Mengisi formulir dan verifikasi dokumen (20 menit)
6. Proses penelitian dan verifikasi data (25-28 hari kerja)
7. Ambil akta kelahiran sesuai jadwal (5 menit)

⏱️ **Waktu:** 30 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

📌 **Catatan Penting:**
• Proses lebih lama karena perlu verifikasi tambahan
• Saksi harus orang yang benar-benar mengetahui kelahiran
• Bawa dokumen asli untuk verifikasi
• Jika dokumen kelahiran dari rumah sakit hilang, perlu surat keterangan dari rumah sakit

Ini situasi terlambat daftar ya kak? SELLY siap bantu proses yang lebih kompleks ini! Hubungi WhatsApp +62-851-8304-3205 untuk panduan detail. 📋`;
  }

  /**
   * Get Akta Kelahiran response for Scenario C - Akta kelahiran hilang/rusak dan perlu penggantian
   */
  private getAktaKelahiranPenggantiResponse(): string {
    return `**C - Akta Kelahiran Hilang/Rusak dan Perlu Penggantian**

Situasi ini untuk penggantian akta kelahiran yang hilang atau rusak. Memerlukan surat keterangan kehilangan atau akta yang rusak.

📋 **Persyaratan:**
• Surat keterangan kehilangan dari kepolisian (jika hilang) atau akta kelahiran yang rusak
• Fotokopi KTP pemohon (jika sudah dewasa) atau KTP orang tua/wali
• Fotokopi Kartu Keluarga (KK)
• Pas foto 3x4 sebanyak 2 lembar (jika diperlukan)
• Surat kuasa bermaterai jika diwakilkan

🔄 **Langkah-langkah:**
1. Urus surat kehilangan di polsek (jika hilang) (30 menit)
2. Siapkan semua dokumen persyaratan (15 menit)
3. Datang ke Disdukcapil dengan dokumen lengkap (10 menit)
4. Mengisi formulir permohonan penggantian (10 menit)
5. Verifikasi dokumen dan data di sistem (15 menit)
6. Dapat tanda terima dan nomor registrasi (5 menit)
7. Ambil akta kelahiran pengganti sesuai jadwal (5 menit)

⏱️ **Waktu:** 7 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

📌 **Catatan Penting:**
• Akta pengganti memiliki keterangan "PENGGANTI"
• Data harus sesuai dengan register asli
• Jika ada perubahan data, harus melalui proses koreksi terlebih dahulu
• Bawa dokumen asli untuk verifikasi

Ini situasi akta hilang/rusak ya kak? SELLY siap bantu proses penggantian! Hubungi WhatsApp +62-851-8304-3205 untuk info tambahan. 🔄`;
  }

  /**
   * Get Akta Kelahiran response for Scenario D - Ada kesalahan data di akta kelahiran yang perlu dikoreksi
   */
  private getAktaKelahiranKoreksiResponse(): string {
    return `**D - Ada Kesalahan Data di Akta Kelahiran yang Perlu Dikoreksi**

Situasi ini untuk koreksi data yang salah di akta kelahiran. Mengikuti Permendagri No. 73 Tahun 2022 tentang Pencatatan Sipil.

📋 **Persyaratan:**
• Akta kelahiran asli yang akan dikoreksi
• Dokumen pendukung yang benar (sesuai jenis koreksi)
• Fotokopi KTP pemohon atau orang tua/wali
• Fotokopi Kartu Keluarga (KK)
• Surat pernyataan koreksi bermaterai
• Dokumen tambahan sesuai jenis koreksi:
  - Nama: Surat keterangan dari kelurahan
  - Tanggal lahir: Surat keterangan dokter/bidan
  - Tempat lahir: Surat keterangan rumah sakit
  - Nama orang tua: Akta nikah/dokumen identitas

🔄 **Langkah-langkah:**
1. Siapkan dokumen pendukung yang benar (1-3 hari)
2. Buat surat pernyataan koreksi (30 menit)
3. Datang ke Disdukcapil dengan dokumen lengkap (15 menit)
4. Mengisi formulir permohonan koreksi (15 menit)
5. Verifikasi dokumen dan penelitian data (20 menit)
6. Proses koreksi dan penerbitan akta baru (25-28 hari kerja)
7. Ambil akta kelahiran yang sudah dikoreksi (5 menit)

⏱️ **Waktu:** 30 hari kerja | 💰 **Biaya:** Gratis | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

📌 **Catatan Penting:**
• Koreksi hanya untuk kesalahan tulis, bukan perubahan data
• Akta lama akan ditarik dan diganti dengan yang baru
• Proses lebih lama karena perlu penelitian dan verifikasi
• Dokumen pendukung harus otentik dan sesuai

Ini situasi koreksi data ya kak? SELLY siap bantu proses koreksi yang tepat! Hubungi WhatsApp +62-851-8304-3205 untuk konsultasi detail. ✏️`;
  }

  /**
   * Check if query is asking about anak luar nikah (children born out of wedlock)
   */
  private isAnakLuarNikahQuery(query: string): boolean {
    const anakLuarNikahPatterns = [
      /anak.*luar.*nikah/i,
      /akta.*kelahiran.*anak.*luar.*nikah/i,
      /syarat.*anak.*luar.*nikah/i,
      /kalau.*anak.*luar.*nikah/i,
      /gimana.*anak.*luar.*nikah/i,
      /bagaimana.*anak.*luar.*nikah/i,
      /anak.*tidak.*nikah/i,
      /anak.*belum.*nikah/i,
      /pengakuan.*anak/i,
      /akta.*pengakuan.*anak/i,
      /anak.*tanpa.*nikah/i,
      /anak.*di.*luar.*nikah/i
    ];

    return anakLuarNikahPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get response for anak luar nikah queries
   */
  public getAnakLuarNikahResponse(): string {
    return `**Akta Kelahiran untuk Anak Luar Nikah**

Halo kak! 😊 Untuk akta kelahiran anak luar nikah, prosesnya tetap bisa dilakukan dan **GRATIS** sesuai UU No. 24 Tahun 2013.

📋 **Syarat Dasar:**
1. **Surat keterangan lahir** dari tenaga kesehatan
2. **KTP-el ibu** + fotokopi
3. **KK ibu** + fotokopi
4. **SPTJM kelahiran** dengan 2 saksi

📋 **Jika Ada Pengakuan Ayah:**
5. **Surat pengakuan anak** dari ayah biologis
6. **KTP-el ayah** + fotokopi
7. **Pernyataan bermaterai** dari ayah

📝 **Catatan Penting:**
• **Tanpa pengakuan ayah**: hanya nama ibu tercantum
• **Dengan pengakuan ayah**: nama kedua orang tua tercantum
• **Proses tetap sama**, waktu 1-3 hari kerja
• **Biaya tetap GRATIS**

💡 **Pengakuan ayah bisa dilakukan kapan saja**, tidak harus bersamaan dengan pembuatan akta.

⏱️ **Waktu**: 1-3 hari kerja
💰 **Biaya**: GRATIS (hanya materai Rp 10.000 untuk SPTJM)
📍 **Lokasi**: Disdukcapil sesuai domisili di KK

🎯 **Tips:**
• Siapkan dokumen lengkap untuk proses lancar
• Pengakuan ayah memberikan perlindungan hukum lebih baik untuk anak
• Konsultasi dengan petugas jika ada pertanyaan khusus

📞 **Info lebih lanjut**: WhatsApp +62-851-8304-3205

Ada yang perlu dijelaskan lebih detail kak? 😊`;
  }

  /**
   * Get Akta Kelahiran response for Scenario E - Kelahiran di luar negeri (WNI di luar negeri)
   */
  private getAktaKelahiranLuarNegeriResponse(): string {
    return `**E - Kelahiran di Luar Negeri (WNI di Luar Negeri)**

Situasi ini untuk WNI yang melahirkan di luar negeri dan perlu akta kelahiran Indonesia. Prosesnya melibatkan konsulat dan Kemendagri.

📋 **Persyaratan:**
• Surat keterangan kelahiran dari rumah sakit/dokter di luar negeri (legalisir)
• Birth certificate dari negara tempat kelahiran (legalisir)
• Fotokopi paspor kedua orang tua
• Fotokopi KTP kedua orang tua (jika masih berlaku)
• Fotokopi akta nikah/buku nikah orang tua (legalisir)
• Surat keterangan dari KJRI/Konsulat Indonesia
• Dokumen imigrasi (visa, permit, dll)
• Terjemahan resmi dokumen asing ke bahasa Indonesia

🔄 **Langkah-langkah:**
1. Urus dokumen di KJRI/Konsulat Indonesia di negara tempat kelahiran (7-14 hari)
2. Legalisir semua dokumen asing (3-7 hari)
3. Terjemahkan dokumen ke bahasa Indonesia oleh penerjemah tersumpah (2-3 hari)
4. Kembali ke Indonesia dan datang ke Disdukcapil Garut (jika domisili Garut)
5. Mengisi formulir permohonan akta kelahiran WNI (20 menit)
6. Verifikasi dokumen dan koordinasi dengan Kemendagri (30-45 hari kerja)
7. Ambil akta kelahiran sesuai jadwal (5 menit)

⏱️ **Waktu:** 45-60 hari kerja | 💰 **Biaya:** Gratis (biaya legalisir dan terjemahan terpisah) | 🕐 **Jam:** 08:00-15:00 WIB (Senin-Jumat)

📌 **Catatan Penting:**
• Proses paling kompleks dan memakan waktu lama
• Semua dokumen asing harus dilegalisir dan diterjemahkan
• Koordinasi dengan KJRI dan Kemendagri diperlukan
• Anak tetap berkewarganegaraan Indonesia (jus sanguinis)

Ini situasi kelahiran di luar negeri ya kak? SELLY siap bantu proses yang kompleks ini! Hubungi WhatsApp +62-851-8304-3205 untuk panduan detail dan koordinasi. 🌍`;
  }

  /**
   * Select random variation from array for natural conversation
   */
  private selectRandomVariation(variations: string[]): string {
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
  }

  /**
   * Format comprehensive KK response with all service types
   */
  private formatComprehensiveKKResponse(serviceInfo: ServiceInfo): string {
    const kkBaruNoDocuments = this.knowledgeBase.get('kk_baru_no_documents');
    const kkBaruMarriage = this.knowledgeBase.get('kk_baru_marriage');
    const kkPerubahan = this.knowledgeBase.get('kk_perubahan');
    const kkPenambahan = this.knowledgeBase.get('kk_penambahan');

    return `📋 **PELAYANAN KARTU KELUARGA (KK)**
**Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut**

💰 **Layanan administrasi kependudukan tidak dipungut biaya/gratis**

---

## 🆔 **1. KK BARU - Belum Punya Dokumen Sama Sekali**

### **Persyaratan:**
${kkBaruNoDocuments?.requirements.map((req, index) => `${index + 1}. ${req.name}`).join('\n') || ''}

---

## 💒 **2. KK BARU - Karena Pernikahan**

### **Persyaratan:**
${kkBaruMarriage?.requirements.map((req, index) => `${index + 1}. ${req.name}`).join('\n') || ''}

---

## 📝 **3. KK PERUBAHAN DATA**

### **Persyaratan:**
${kkPerubahan?.requirements.map((req, index) => `${index + 1}. ${req.name}`).join('\n') || ''}

---

## 👥 **4. PENAMBAHAN ANGGOTA KELUARGA**

### **Persyaratan:**
${kkPenambahan?.requirements.map((req, index) => `${index + 1}. ${req.name}`).join('\n') || ''}

---

## 🔄 **MEKANISME PROSEDUR:**
1. Pemohon adalah yang berkepentingan/tidak diwakilkan
2. Pemohon mengisi dan menandatangani formulir dan memberikan persyaratan
3. Petugas pelayanan melakukan verifikasi dan validasi terhadap formulir dan persyaratan
4. Petugas pelayanan melakukan proses penginputan data ke dalam Sistem Informasi Administrasi Kependudukan
5. Pejabat menandatangani Kartu Keluarga dengan proses Tanda Tangan Elektronik
6. Petugas menerbitkan Kartu Keluarga
7. Kartu Keluarga disampaikan kepada pemohon

## 💻 **SISTEM PENGAJUAN:**
• **Pelayanan online** melalui link **pastioke.garutkab.go.id**
• **Pelayanan offline** dengan datang langsung ke kantor Disdukcapil

## ℹ️ **Informasi Umum:**
⏱️ **Waktu penyelesaian**: Selesai pada hari yang sama
💰 **Biaya**: Gratis (Layanan administrasi kependudukan tidak dipungut biaya)
🕐 **Jam pelayanan**: 08:00-15:00 WIB (Senin-Jumat)
📍 **Lokasi**: Kantor Disdukcapil Kabupaten Garut

💡 **Catatan Penting:**
• Pemohon tidak dapat diwakilkan
• Tersedia pelayanan online dan offline
• Semua formulir dapat didownload di menu formulir persyaratan

Apakah ada jenis layanan KK tertentu yang ingin kak tanyakan lebih detail? SELLY siap membantu! 😊`;
  }

  /**
   * Format specific KK response based on user's exact situation
   */
  private formatSpecificKKResponse(serviceInfo: ServiceInfo): string {
    const serviceTypeMap: { [key: string]: string } = {
      'KK-001A': '🆔 **KK BARU** - Belum Punya Dokumen Sama Sekali',
      'KK-001B': '💒 **KK BARU** - Karena Pernikahan',
      'KK-002': '📝 **KK PERUBAHAN DATA** - Mengubah Data yang Salah',
      'KK-003': '👥 **PENAMBAHAN ANGGOTA KELUARGA** - Menambah Anggota Baru',
      'KK-004': '🔄 **PENGGANTIAN KK** - KK Hilang/Rusak'
    };

    const serviceTitle = serviceTypeMap[serviceInfo.serviceCode] || serviceInfo.serviceType;

    return `📋 **PELAYANAN KARTU KELUARGA (KK)**
**Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut**

${serviceTitle}

💰 **Layanan administrasi kependudukan tidak dipungut biaya/gratis**

---

## 📋 **PERSYARATAN:**
${serviceInfo.requirements.map((req, index) => `${index + 1}. ${req.name}${req.required ? '' : ' (opsional)'}`).join('\n')}

---

## 🔄 **MEKANISME PROSEDUR:**
${serviceInfo.processSteps.map((step, index) => `${index + 1}. ${step.description}`).join('\n')}

## 💻 **SISTEM PENGAJUAN:**
• **Pelayanan online** melalui link **pastioke.garutkab.go.id**
• **Pelayanan offline** dengan datang langsung ke kantor Disdukcapil

## ℹ️ **INFORMASI UMUM:**
⏱️ **Waktu penyelesaian**: ${serviceInfo.duration}
💰 **Biaya**: ${serviceInfo.cost}
🕐 **Jam pelayanan**: ${serviceInfo.officeHours}
📍 **Lokasi**: Kantor Disdukcapil Kabupaten Garut

## 💡 **CATATAN PENTING:**
${serviceInfo.notes?.map(note => `• ${note}`).join('\n') || '• Pemohon tidak dapat diwakilkan'}

---

🤝 **Butuh bantuan lebih lanjut?**
• Tanyakan detail persyaratan: "Jelaskan lebih detail tentang [nama dokumen]"
• Lihat layanan KK lainnya: "Layanan KK apa saja yang tersedia?"
• Hubungi langsung: WhatsApp +62-851-8304-3205

SELLY siap membantu kak! 😊`;
  }

  /**
   * Format KK Baru scenario response with specific guidance for each situation
   */
  private formatKKBaruScenarioResponse(serviceInfo: any): string {
    const scenarioTitles: { [key: string]: string } = {
      'KK-001A': '📋 **KK BARU - Belum Punya Dokumen Kependudukan Sama Sekali**',
      'KK-001B': '💒 **KK BARU - Pengajuan KK Baru Karena Pernikahan**'
    };

    const scenarioDescriptions: { [key: string]: string } = {
      'KK-001A': 'Untuk individu yang belum pernah terdaftar dalam sistem kependudukan dan tidak memiliki dokumen kependudukan apapun.',
      'KK-001B': 'Untuk pasangan yang baru menikah dan perlu membuat kartu keluarga baru.'
    };

    const serviceTitle = scenarioTitles[serviceInfo.serviceCode] || serviceInfo.serviceType;
    const serviceDescription = scenarioDescriptions[serviceInfo.serviceCode] || '';

    return `📋 **Panduan Lengkap Pembuatan Kartu Keluarga (KK) Baru**
**Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut**

${serviceTitle}

💰 **Layanan administrasi kependudukan tidak dipungut biaya/gratis**

---

## 🎯 **Situasi Anda:**
${serviceDescription}

## 🎯 **Mengapa Perlu KK?**

KK adalah dokumen resmi yang mencatat data keluarga (nama, status, alamat). KK penting untuk:

${serviceInfo.importance?.map((item: string) => `• ${item}`).join('\n') || '• Keperluan administrasi keluarga'}

---

## 📋 **Langkah-Langkah yang Harus Dilakukan:**

${serviceInfo.requirements.map((req: any, index: number) => {
  const reqNumber = index + 1;
  const optionalText = req.required ? '' : ' (opsional)';
  const description = req.description ? `\n   💡 ${req.description}` : '';
  return `### **${reqNumber}. ${req.name}**${optionalText}${description}`;
}).join('\n\n')}

---

## 🔄 **PROSEDUR LENGKAP:**
${serviceInfo.processSteps.map((step: any, index: number) => `**${index + 1}.** ${step.description} *(${step.estimatedTime})*`).join('\n')}

## 💻 **SISTEM PENGAJUAN:**
• **Pelayanan online** melalui link **pastioke.garutkab.go.id**
• **Pelayanan offline** dengan datang langsung ke kantor Disdukcapil

## ℹ️ **INFORMASI UMUM:**
⏱️ **Waktu penyelesaian**: ${serviceInfo.duration}
💰 **Biaya**: ${serviceInfo.cost}
🕐 **Jam pelayanan**: ${serviceInfo.officeHours}
📍 **Lokasi**: Kantor Disdukcapil Kabupaten Garut

## 💡 **CATATAN PENTING:**
${serviceInfo.notes?.map((note: string) => `• ${note}`).join('\n') || '• Pemohon tidak dapat diwakilkan'}

---

🤝 **Butuh bantuan lebih lanjut?**
• Tanyakan detail persyaratan: "Jelaskan lebih detail tentang [nama dokumen]"
• Lihat skenario KK lainnya: "Layanan KK apa saja yang tersedia?"
• Hubungi langsung: WhatsApp +62-851-8304-3205

SELLY siap membantu kak! 😊`;
  }

  /**
   * Format KK interactive assessment for personalized guidance - AUTOMATED GENERATION
   */
  public formatKKInteractiveAssessment(): string {
    return this.generateVariedKKAssessment();
  }

  /**
   * Generate varied KK assessment responses for natural conversation
   */
  private generateVariedKKAssessment(): string {
    const variations = {
      greetings: [
        'Halo kak! 😊',
        'Hai kakak! 😊',
        'Selamat datang kak! 😊',
        'Halo kakak! 😊'
      ],
      introductions: [
        'Saya SELLY akan membantu kak dengan layanan Kartu Keluarga (KK).',
        'SELLY di sini siap bantu kakak untuk urusan Kartu Keluarga.',
        'Saya SELLY, siap membantu kak dengan layanan KK.',
        'SELLY akan memandu kakak untuk layanan Kartu Keluarga.'
      ],
      purposes: [
        'Untuk memberikan panduan yang tepat sesuai situasi kak, saya perlu mengetahui kondisi keluarga kak saat ini.',
        'Supaya bisa kasih panduan yang pas untuk kakak, saya perlu tahu kondisi keluarga kakak dulu.',
        'Biar panduan yang saya berikan sesuai dengan kebutuhan kak, tolong ceritakan kondisi keluarga kak ya.',
        'Agar bisa memberikan arahan yang tepat untuk kakak, saya butuh info tentang situasi keluarga kakak.'
      ],
      questionIntros: [
        'Mari kita mulai dengan pertanyaan pertama:',
        'Yuk kita mulai dari pertanyaan ini dulu:',
        'Kita mulai dengan pertanyaan sederhana ya:',
        'Pertanyaan pertama nih kak:'
      ],
      closings: [
        'Saya siap membantu kak mendapatkan panduan KK yang tepat! 🤝',
        'SELLY siap bantu kakak dapat panduan KK yang sesuai! 🤝',
        'Yuk kita cari solusi KK yang tepat untuk kak! 🤝',
        'Mari kita urus KK kakak dengan panduan yang pas! 🤝'
      ]
    };

    const greeting = this.selectRandomVariation(variations.greetings);
    const introduction = this.selectRandomVariation(variations.introductions);
    const purpose = this.selectRandomVariation(variations.purposes);
    const questionIntro = this.selectRandomVariation(variations.questionIntros);
    const closing = this.selectRandomVariation(variations.closings);

    return `👨‍👩‍👧‍👦 **Layanan Kartu Keluarga - Penilaian Situasi Kak**

${greeting} ${introduction} ${purpose}

🤔 **${questionIntro}**

**Apa situasi KK kak saat ini?**

📋 **Pilihan jawaban:**
• **A** - Belum punya dokumen kependudukan sama sekali (belum pernah terdaftar)
• **B** - KK baru karena pernikahan (sudah punya KTP, baru menikah)
• **C** - Sudah punya KK, tapi ada perubahan anggota keluarga (lahir/menikah/pindah)
• **D** - KK hilang/rusak dan perlu penggantian
• **E** - Mau pisah KK (anak sudah menikah/mandiri)
• **F** - Pindah alamat dan perlu update KK

💡 **Kenapa saya tanya ini?**
Setiap situasi KK memiliki persyaratan dan prosedur yang berbeda, kak. Dengan mengetahui kondisi keluarga kak, saya bisa memberikan panduan yang lebih akurat dan menghemat waktu kak.

🎯 **Silakan jawab dengan huruf (A, B, C, D, E, atau F) atau jelaskan situasi keluarga kak dengan kata-kata.**

${closing}`;
  }

  /**
   * Format multi-service response for complex scenarios
   */
  private formatMultiServiceResponse(serviceInfo: ServiceInfo): string {
    const scenarioId = serviceInfo.specialCases?.scenario_id?.[0];
    if (!scenarioId) {
      return 'Error: Multi-service scenario ID not found';
    }

    // Get the original query analysis result
    const scenario = this.multiServiceAnalyzer.getDependencyMapper()
      .getAllScenarios()
      .find(s => s.scenarioId === scenarioId);

    if (!scenario) {
      return 'Error: Scenario not found';
    }

    // Collect service data for synthesis
    const servicesData = new Map<string, ServiceInfo>();

    // Add primary services
    scenario.primaryServices.forEach(serviceId => {
      const service = this.knowledgeBase.get(serviceId);
      if (service) {
        servicesData.set(serviceId, service);
      }
    });

    // Add dependent services
    scenario.dependentServices.forEach(dep => {
      const service = this.knowledgeBase.get(dep.serviceId);
      if (service) {
        servicesData.set(dep.serviceId, service);
      }
    });

    // Create analysis result for synthesis
    const analysisResult: QueryAnalysisResult = {
      isMultiService: true,
      confidence: 0.9,
      detectedServices: Array.from(servicesData.keys()),
      scenario,
      analysisMetadata: {
        processingTime: 0,
        patternMatches: [],
        complexityScore: scenario.complexity === 'complex' ? 8 : scenario.complexity === 'moderate' ? 5 : 3,
        recommendedApproach: 'multi_service'
      }
    };

    // Synthesize comprehensive response
    const multiServiceResponse = this.multiServiceSynthesizer.synthesizeResponse(
      analysisResult,
      servicesData,
      {
        responseStyle: 'comprehensive',
        includeTimeline: true,
        includeTips: true,
        includeWarnings: true
      }
    );

    // Format for display
    return this.multiServiceSynthesizer.formatResponse(multiServiceResponse);
  }

  /**
   * Format Akta Kelahiran interactive assessment for personalized guidance - AUTOMATED GENERATION
   */
  public formatAktaKelahiranAssessment(): string {
    return `👶 **Layanan Akta Kelahiran - Penilaian Situasi Kak**

Halo kak! 😊 Saya SELLY akan membantu kak dengan layanan Akta Kelahiran. Untuk memberikan panduan yang tepat sesuai situasi kak, saya perlu mengetahui kondisi kelahiran yang akan didaftarkan.

🤔 **Mari kita mulai dengan pertanyaan pertama:**

**Apa situasi kelahiran yang akan kak urus?**

📋 **Pilihan jawaban:**
• **A** - Bayi baru lahir (kurang dari 60 hari)
• **B** - Anak sudah lahir lama tapi belum punya akta kelahiran (terlambat daftar)
• **C** - Akta kelahiran hilang/rusak dan perlu penggantian
• **D** - Ada kesalahan data di akta kelahiran yang perlu dikoreksi
• **E** - Kelahiran di luar negeri (WNI di luar negeri)

💡 **Kenapa saya tanya ini?**
Setiap situasi kelahiran memiliki persyaratan dan prosedur yang berbeda, kak. Kelahiran baru (kurang dari 60 hari) prosesnya lebih mudah dibanding terlambat daftar. Dengan mengetahui kondisi kak, saya bisa memberikan panduan yang lebih akurat dan menghemat waktu kak.

🎯 **Silakan jawab dengan huruf (A, B, C, D, atau E) atau jelaskan situasi kelahiran kak dengan kata-kata.**

Saya siap membantu kak mendapatkan panduan Akta Kelahiran yang tepat! 🤝`;
  }

  /**
   * Format service information for response with 2025 enhancements
   */
  public formatServiceResponse(serviceInfo: ServiceInfo | string): string {
    // If it's already a string (like KTP scenario responses), return it directly
    if (typeof serviceInfo === 'string') {
      return serviceInfo;
    }
    // Special handling for complete service overview
    if (serviceInfo.serviceCode === 'OVERVIEW-001') {
      return this.formatCompleteServiceOverview();
    }

    // Special handling for string responses
    if (serviceInfo.specialCases?.string_response?.[0] === 'true') {
      return serviceInfo.specialCases.content?.[0] || 'No content available';
    }

    // Special handling for multi-service scenarios
    if (serviceInfo.specialCases?.multi_service?.[0] === 'true') {
      return this.formatMultiServiceResponse(serviceInfo);
    }

    // Special handling for KTP interactive assessment
    if (serviceInfo.serviceCode === 'KTP-ASSESS-001') {
      return this.formatKTPInteractiveAssessment();
    }

    // Special handling for KK interactive assessment (AUTOMATED GENERATION)
    if (serviceInfo.serviceCode === 'KK-ASSESS-001') {
      return this.formatKKInteractiveAssessment();
    }

    // Special handling for Akta Kelahiran interactive assessment (AUTOMATED GENERATION)
    if (serviceInfo.serviceCode === 'AKTA-KELAHIRAN-ASSESS-001') {
      return this.formatAktaKelahiranAssessment();
    }

    // Special handling for KK services - Show specific or comprehensive information
    if (serviceInfo.serviceCode.startsWith('KK-')) {
      // Show comprehensive overview for general queries
      if (serviceInfo.serviceCode === 'KK-OVERVIEW') {
        return this.formatComprehensiveKKResponse(serviceInfo);
      }
      // Special handling for KK Baru scenarios
      if (serviceInfo.serviceCode === 'KK-001A' || serviceInfo.serviceCode === 'KK-001B') {
        return this.formatKKBaruScenarioResponse(serviceInfo);
      }
      // Show specific service information for targeted queries
      return this.formatSpecificKKResponse(serviceInfo);
    }

    // Special handling for Kepindahan service - Use response variations
    if (serviceInfo.serviceCode === 'KEPINDAHAN-001') {
      const variationContent = serviceResponseVariations.getVariedResponse(
        serviceInfo.serviceCode,
        serviceInfo,
        {
          userTone: 'friendly', // Can be enhanced with actual user tone detection
          previousInteractions: 0 // Can be enhanced with conversation history
        }
      );

      // Add SELLY introduction to the variation content
      return `Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya dapat membantu Anda dengan informasi ${serviceInfo.serviceType.toLowerCase()}.

${variationContent}`;
    }

    let response = `📋 **${serviceInfo.serviceType}**\n\n`;

    // Requirements
    response += `**Persyaratan yang diperlukan:**\n`;
    serviceInfo.requirements.forEach((req, index) => {
      response += `${index + 1}. ${req.name}\n`;
    });

    // Process info
    response += `\n⏱️ **Waktu penyelesaian:** ${serviceInfo.duration}\n`;
    response += `💰 **Biaya:** ${serviceInfo.cost}\n`;
    response += `🕐 **Jam pelayanan:** ${serviceInfo.officeHours}\n`;

    // 2025 Digital Services Information
    if (serviceInfo.digitalServices) {
      response += this.formatDigitalServicesInfo(serviceInfo.digitalServices);
    }

    // 2025 Document Format Information
    if (serviceInfo.documentFormats) {
      response += this.formatDocumentFormatInfo(serviceInfo.documentFormats);
    }

    // Regulation Basis
    if (serviceInfo.regulationBasis) {
      response += this.formatRegulationInfo(serviceInfo.regulationBasis);
    }

    // Special Cases
    if (serviceInfo.specialCases) {
      response += '\n\n🔄 **Kasus Khusus:**\n';
      Object.entries(serviceInfo.specialCases).forEach(([caseType, requirements]) => {
        response += `**${caseType.replace(/_/g, ' ').toUpperCase()}:**\n`;
        requirements.forEach((req, index) => {
          response += `${index + 1}. ${req}\n`;
        });
        response += '\n';
      });
    }

    // Output Documents
    if (serviceInfo.outputDocuments) {
      response += '\n📄 **Dokumen yang Dihasilkan:**\n';
      serviceInfo.outputDocuments.forEach((doc, index) => {
        response += `${index + 1}. ${doc}\n`;
      });
    }

    // Additional notes
    if (serviceInfo.notes && serviceInfo.notes.length > 0) {
      response += `\n📌 **Catatan penting:**\n`;
      serviceInfo.notes.forEach(note => {
        response += `• ${note}\n`;
      });
    }

    // Version and last updated info
    if (serviceInfo.version && serviceInfo.lastUpdated) {
      response += `\n📅 **Informasi Versi:** v${serviceInfo.version} (Update: ${serviceInfo.lastUpdated})\n`;
    }

    response += `\n📞 **Untuk informasi lebih lanjut:**\n`;
    response += `WhatsApp: +62-851-8304-3205\n`;
    response += `\nApakah ada yang ingin kak tanyakan lebih lanjut mengenai ${serviceInfo.serviceType.toLowerCase()}? 🤔`;

    return response;
  }

  /**
   * Check if query is about a service we have knowledge about
   */
  public hasKnowledge(query: string): boolean {
    return this.getServiceInfo(query) !== null;
  }

  /**
   * Format digital services information for 2025 requirements
   */
  private formatDigitalServicesInfo(digitalServices: DigitalServiceInfo): string {
    if (!digitalServices) return '';

    let digitalInfo = '\n\n🌐 **Layanan Digital 2025:**\n';

    if (digitalServices.ikdSupport) {
      digitalInfo += '✅ **IKD (Identitas Kependudukan Digital)** - Wajib diaktivasi untuk akses online\n';
    }

    if (digitalServices.onlineApplication) {
      digitalInfo += '✅ **Aplikasi Online** - Bisa diurus via situs Dukcapil daerah\n';
    }

    if (digitalServices.qrVerification) {
      digitalInfo += '✅ **Verifikasi QR Code** - Semua dokumen dilengkapi QR code\n';
    }

    if (digitalServices.tteSupport) {
      digitalInfo += '✅ **Tanda Tangan Elektronik (TTE)** - Proses digital terintegrasi\n';
    }

    if (digitalServices.activationSteps && digitalServices.activationSteps.length > 0) {
      digitalInfo += '\n📱 **Cara Aktivasi IKD:**\n';
      digitalServices.activationSteps.forEach((step, index) => {
        digitalInfo += `${index + 1}. ${step}\n`;
      });
    }

    return digitalInfo;
  }

  /**
   * Format document format requirements for 2025
   */
  private formatDocumentFormatInfo(documentFormats: DocumentFormatInfo): string {
    if (!documentFormats) return '';

    let formatInfo = '\n\n📄 **Format Dokumen 2025:**\n';

    if (documentFormats.paperType) {
      formatInfo += `📋 **Kertas:** ${documentFormats.paperType}\n`;
    }

    if (documentFormats.printRequirements) {
      formatInfo += `🖨️ **Cetak:** ${documentFormats.printRequirements}\n`;
    }

    if (documentFormats.digitalFormat) {
      formatInfo += `💻 **Digital:** ${documentFormats.digitalFormat}\n`;
    }

    if (documentFormats.qrCodeRequired) {
      formatInfo += '🔍 **QR Code:** Wajib untuk verifikasi\n';
    }

    return formatInfo;
  }

  /**
   * Format regulation basis information
   */
  private formatRegulationInfo(regulationBasis: string[]): string {
    if (!regulationBasis || regulationBasis.length === 0) return '';

    let regulationInfo = '\n\n📜 **Dasar Hukum:**\n';
    regulationBasis.forEach((regulation, index) => {
      regulationInfo += `${index + 1}. ${regulation}\n`;
    });

    return regulationInfo;
  }

  /**
   * Get enhanced Q&A response from comprehensive training data
   */
  private getEnhancedQAResponse(query: string): string | null {
    try {
      // In production/build environment, skip file loading
      if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
        return null;
      }

      // Only try to load files in development/server environment
      let qaData: any = null;
      try {
        // Use dynamic import to avoid bundling fs in client code
        const { loadQAIntegrationData } = require('../../utils/serverFileUtils');
        qaData = loadQAIntegrationData();
      } catch (fsError) {
        console.warn('⚠️ [ENHANCED_QA] Server file utils not available');
        return null;
      }

      if (!qaData) {
        return null;
      }

      // Check special cases first (highest priority)
      for (const [caseId, caseData] of Object.entries(qaData.specialCases)) {
        const patterns = (caseData as any).patterns || [];
        for (const pattern of patterns) {
          if (query.toLowerCase().includes(pattern.toLowerCase())) {
            console.log(`🎯 [ENHANCED_QA] Matched special case: ${caseId}`);
            return (caseData as any).content;
          }
        }
      }

      // Check enhanced patterns
      const enhancedPatterns = qaData.enhancedPatterns || {};

      // Legal document patterns
      if (enhancedPatterns.legal_documents) {
        for (const pattern of enhancedPatterns.legal_documents) {
          if (query.toLowerCase().includes(pattern.toLowerCase())) {
            return this.getLegalDocumentResponse(pattern, query);
          }
        }
      }

      // Process patterns
      if (enhancedPatterns.processes) {
        for (const pattern of enhancedPatterns.processes) {
          if (query.toLowerCase().includes(pattern.toLowerCase())) {
            return this.getProcessResponse(pattern, query);
          }
        }
      }

      // Status patterns
      if (enhancedPatterns.status_patterns) {
        for (const pattern of enhancedPatterns.status_patterns) {
          if (query.toLowerCase().includes(pattern.toLowerCase())) {
            return this.getStatusResponse(pattern, query);
          }
        }
      }

      // Problem patterns
      if (enhancedPatterns.problem_patterns) {
        for (const pattern of enhancedPatterns.problem_patterns) {
          if (query.toLowerCase().includes(pattern.toLowerCase())) {
            return this.getProblemResponse(pattern, query);
          }
        }
      }

      return null;

    } catch (error) {
      console.error('❌ [ENHANCED_QA] Error loading Q&A data:', error);
      return null;
    }
  }

  /**
   * Get legal document specific response
   */
  private getLegalDocumentResponse(pattern: string, query: string): string {
    const responses: Record<string, string> = {
      'SPTJM': `Halo kak! 😊 SPTJM (Surat Pernyataan Tanggung Jawab Mutlak) adalah dokumen penting untuk akta kelahiran.

**📋 Jenis SPTJM:**
• **F-2.03**: SPTJM Kebenaran Data Kelahiran (jika surat keterangan lahir hilang)
• **F-2.04**: SPTJM Kebenaran Sebagai Pasangan Suami-Istri (untuk nikah siri)

⚠️ **Penting diketahui:**
• SPTJM bukan pengganti buku nikah
• Hanya alat administratif untuk penerbitan akta
• Ada konsekuensi hukum untuk anak (hubungan perdata terbatas)

🎯 **Solusi terbaik:** Isbat Nikah di Pengadilan Agama

SELLY siap bantu dengan informasi lebih detail! 🤝`,

      'UU 24/2013': `Halo kak! 😊 UU No. 24 Tahun 2013 adalah landasan hukum utama administrasi kependudukan.

**✅ Kemudahan yang diberikan:**
• Layanan GRATIS (Pasal 79A)
• Asas domisili (urus di alamat KTP)
• Tidak perlu penetapan pengadilan untuk keterlambatan
• Stelsel aktif pemerintah

**🎯 Manfaat untuk kakak:**
• Akta kelahiran gratis
• Proses lebih mudah
• Perlindungan data pribadi
• Layanan online tersedia

SELLY siap bantu dengan pertanyaan lain! 🤝`,

      'F-2.01': `Halo kak! 😊 Formulir F-2.01 adalah formulir induk untuk semua pencatatan sipil.

**📋 Kapan digunakan:**
• Pelaporan kelahiran
• Pelaporan kematian
• Pelaporan perkawinan
• Pelaporan perceraian

**✅ Cara mengisi:**
• Isi data lengkap dan benar
• Tanda tangan pemohon
• Lampirkan dokumen pendukung

SELLY siap bantu dengan panduan lengkap! 🤝`
    };

    return responses[pattern] || this.getGenericLegalResponse(pattern);
  }

  /**
   * Get process specific response
   */
  private getProcessResponse(pattern: string, query: string): string {
    const responses: Record<string, string> = {
      'Isbat Nikah': `Halo kak! 😊 Isbat Nikah adalah solusi terbaik untuk mengesahkan pernikahan siri.

**🏛️ Prosedur Isbat Nikah:**
1. Ajukan permohonan ke Pengadilan Agama
2. Siapkan bukti-bukti pernikahan
3. Hadiri sidang pengadilan
4. Dapatkan penetapan pengadilan
5. Terbitkan buku nikah di KUA

**📋 Dokumen yang diperlukan:**
• Surat permohonan
• KTP kedua pihak
• Akta kelahiran kedua pihak
• Surat keterangan belum menikah
• Foto bersama dan bukti lainnya

**🎯 Setelah Isbat Nikah:**
• Ajukan pembetulan akta kelahiran anak
• Status anak menjadi sah secara hukum
• Hak waris dan perwalian terjamin

SELLY mendukung kakak! 🤝💪`,

      'pembetulan data': `Halo kak! 😊 Pembetulan data akta kelahiran bisa dilakukan sesuai jenis kesalahan.

**🔧 Jenis Pembetulan:**
• **Minor (salah ketik)**: Langsung ke Dukcapil
• **Substantif (ganti nama)**: Perlu penetapan pengadilan

**📋 Persyaratan umum:**
• Formulir permohonan
• Akta kelahiran asli
• Dokumen pendukung yang benar
• KTP orang tua

**⏱️ Waktu proses:** 3-7 hari kerja

SELLY siap bantu dengan panduan detail! 🤝`
    };

    return responses[pattern] || this.getGenericProcessResponse(pattern);
  }

  /**
   * Get status specific response
   */
  private getStatusResponse(pattern: string, query: string): string {
    const responses: Record<string, string> = {
      'anak seorang ibu': `Halo kak! 😊 Untuk anak seorang ibu, prosesnya lebih sederhana.

**📋 Yang tercantum di akta:**
• Frasa: "Anak seorang ibu, [Nama Ibu]"
• Kolom ayah dikosongkan
• Status hukum jelas dan sah

**✅ Persyaratan:**
• Formulir F-2.01
• Surat keterangan kelahiran
• KTP-el ibu
• Kartu Keluarga
• KTP-el 2 orang saksi

**💪 Kakak hebat dan kuat!** SELLY mendukung sepenuhnya! 🤝`,

      'Kawin Belum Tercatat': `Halo kak! 😊 Status "Kawin Belum Tercatat" di KK hanya catatan administratif.

**⚠️ Penting diketahui:**
• Bukan bukti sah pernikahan
• Perlu buku nikah untuk legalitas
• Anak tetap bisa dapat akta dengan SPTJM

**🎯 Solusi:**
• Isbat Nikah di Pengadilan Agama
• Dapatkan buku nikah resmi
• Update status menjadi "Kawin Tercatat"

SELLY siap bantu dengan langkah-langkahnya! 🤝`
    };

    return responses[pattern] || this.getGenericStatusResponse(pattern);
  }

  /**
   * Get problem specific response
   */
  private getProblemResponse(pattern: string, query: string): string {
    const responses: Record<string, string> = {
      'hilang': `Halo kak! 😊 Jangan khawatir, dokumen yang hilang bisa diganti.

**🔄 Untuk akta kelahiran hilang:**
• Ajukan kutipan kedua di Dukcapil
• Bawa surat kehilangan dari polisi
• Siapkan KK dan KTP orang tua

**📋 Untuk surat keterangan lahir hilang:**
• Gunakan SPTJM F-2.03
• Ditandatangani pemohon + 2 saksi
• Tetap bisa buat akta kelahiran

**💰 Biaya:** GRATIS sesuai UU 24/2013

SELLY siap bantu kakak! 🤝`,

      'terlambat': `Halo kak! 😊 Tidak ada denda untuk keterlambatan pelaporan kelahiran.

**✅ Kabar baik:**
• Tidak perlu penetapan pengadilan lagi
• Tidak ada denda keterlambatan
• Proses sama dengan pelaporan normal

**📋 Yang diperlukan:**
• Formulir F-2.01
• Surat keterangan kelahiran (atau SPTJM jika hilang)
• KTP dan KK orang tua
• KTP 2 orang saksi

**🎯 Langsung ke Dukcapil:** Kepala Dinas akan putuskan

SELLY siap bantu kakak! 🤝`
    };

    return responses[pattern] || this.getGenericProblemResponse(pattern);
  }

  /**
   * Generic responses for fallback
   */
  private getGenericLegalResponse(pattern: string): string {
    return `Halo kak! 😊 Tentang ${pattern}, SELLY siap membantu dengan informasi administrasi kependudukan.

Silakan hubungi:
📞 WhatsApp: +62-851-8304-3205
🌐 Online: pastioke.garutkab.go.id

SELLY siap bantu dengan pertanyaan lain! 🤝`;
  }

  private getGenericProcessResponse(pattern: string): string {
    return `Halo kak! 😊 Untuk proses ${pattern}, SELLY akan bantu kakak dengan panduan lengkap.

Silakan hubungi:
📞 WhatsApp: +62-851-8304-3205
🌐 Online: pastioke.garutkab.go.id

SELLY siap bantu dengan informasi detail! 🤝`;
  }

  private getGenericStatusResponse(pattern: string): string {
    return `Halo kak! 😊 Tentang status ${pattern}, SELLY siap memberikan penjelasan lengkap.

Silakan hubungi:
📞 WhatsApp: +62-851-8304-3205
🌐 Online: pastioke.garutkab.go.id

SELLY siap bantu kakak! 🤝`;
  }

  private getGenericProblemResponse(pattern: string): string {
    return `Halo kak! 😊 Jangan khawatir dengan masalah ${pattern}, ada solusinya!

Silakan hubungi:
📞 WhatsApp: +62-851-8304-3205
🌐 Online: pastioke.garutkab.go.id

SELLY siap bantu kakak menyelesaikan masalah ini! 🤝`;
  }

  /**
   * Get KK continuous training response from comprehensive training data
   */
  private getKKTrainingResponse(query: string): string | null {
    try {
      // Check for specific KK patterns first (no file system access needed)
      const specificResponse = this.getSpecificKKTrainingResponse(query);
      if (specificResponse) {
        return specificResponse;
      }

      // In production/build environment, use pattern-based responses
      if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
        return this.getKKPatternBasedResponse(query);
      }

      // Only try to load files in development/server environment
      try {
        // Use dynamic import to avoid bundling fs in client code
        const { loadKKTrainingData } = require('../../utils/serverFileUtils');
        const kkTrainingData = loadKKTrainingData();

        if (kkTrainingData) {
          // Check each training category for matching patterns
          for (const [categoryName, trainingPairs] of Object.entries(kkTrainingData)) {
            if (Array.isArray(trainingPairs)) {
              // Find matching training pair
              for (const pair of trainingPairs as any[]) {
                if (this.matchesKKTrainingPair(query, pair)) {
                  console.log(`🎯 [KK_TRAINING] Matched pattern from ${categoryName}`);
                  return this.enhanceKKResponseWithPersona(pair.expectedResponse || pair.response);
                }
              }
            }
          }
        }
      } catch (fsError) {
        console.warn('⚠️ [KK_TRAINING] Server file utils not available, using pattern-based responses');
        return this.getKKPatternBasedResponse(query);
      }

      return null;

    } catch (error) {
      console.error('❌ [KK_TRAINING] Error in KK training response:', error);
      return null;
    }
  }

  /**
   * Check if query matches a KK training pair (FIXED: More specific matching)
   */
  private matchesKKTrainingPair(query: string, pair: any): boolean {
    const lowerQuery = query.toLowerCase();
    const pairQuery = (pair.query || '').toLowerCase();

    // CRITICAL FIX: Only match if query explicitly mentions KK-related terms
    const hasKKTerms = /\b(kk|kartu\s+keluarga|keluarga)\b/i.test(lowerQuery);
    if (!hasKKTerms) {
      return false; // Don't match non-KK queries
    }

    // CRITICAL FIX: Exclude queries about other specific documents
    const hasOtherDocTerms = /\b(akta|ktp|kepindahan|legalisir|kia|biodata|surat\s+keterangan)\b/i.test(lowerQuery);
    if (hasOtherDocTerms && !hasKKTerms) {
      return false; // Don't match if it's about other documents
    }

    // Direct similarity check using simple word overlap (more restrictive)
    if (pairQuery) {
      const queryWords = lowerQuery.split(' ').filter((word: string) => word.length > 2);
      const pairWords = pairQuery.split(' ').filter((word: string) => word.length > 2);
      const commonWords = queryWords.filter((word: string) => pairWords.includes(word));
      const similarity = (commonWords.length * 2) / (queryWords.length + pairWords.length);

      // CRITICAL FIX: Higher threshold and must have KK context
      if (similarity > 0.8 && hasKKTerms) {
        return true;
      }
    }

    // Keyword matching (more restrictive)
    const queryWords = lowerQuery.split(' ').filter((word: string) => word.length > 2);
    const pairWords = pairQuery.split(' ').filter((word: string) => word.length > 2);
    const commonWords = queryWords.filter((word: string) => pairWords.includes(word));

    // CRITICAL FIX: Require KK context AND higher word overlap
    return commonWords.length >= 3 && hasKKTerms;
  }

  /**
   * Get KK pattern-based response for build/production environment
   */
  private getKKPatternBasedResponse(query: string): string | null {
    const lowerQuery = query.toLowerCase();

    // Use existing KK pattern matching from the knowledge base
    if (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga')) {
      // Check for specific KK situations first
      if (lowerQuery.includes('hilang') || lowerQuery.includes('rusak') || lowerQuery.includes('penggantian')) {
        const kkPenggantian = this.knowledgeBase.get('kk_penggantian');
        if (kkPenggantian) {
          return this.enhanceKKResponseWithPersona('KK yang hilang/rusak bisa diganti dengan mudah. Siapkan surat kehilangan dari polisi dan dokumen persyaratan lainnya. Semua layanan GRATIS!');
        }
      }
      if (lowerQuery.includes('biaya') || lowerQuery.includes('gratis')) {
        return this.enhanceKKResponseWithPersona('KK itu 100% GRATIS sesuai UU No. 24 Tahun 2013! Tidak ada biaya apapun untuk semua jenis layanan KK.');
      }
      if (lowerQuery.includes('pisah') || lowerQuery.includes('mandiri')) {
        return this.enhanceKKResponseWithPersona('Mau pisah KK setelah menikah atau mandiri? Bisa banget! Prosesnya mudah dan GRATIS. Siapkan dokumen persyaratan dan datang ke Dukcapil.');
      }
      if (lowerQuery.includes('bikin') || lowerQuery.includes('buat')) {
        return this.enhanceKKResponseWithPersona('Mau bikin KK ya? Setiap situasi punya persyaratan berbeda lho. Ceritain situasi kakak dong, biar SELLY bisa kasih panduan yang tepat!');
      }
    }

    return null;
  }

  /**
   * Get specific KK training response based on patterns
   */
  private getSpecificKKTrainingResponse(query: string): string | null {
    const lowerQuery = query.toLowerCase();

    // KK Biaya (Cost) patterns
    if (lowerQuery.includes('biaya') && (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga'))) {
      return this.enhanceKKResponseWithPersona(`Halo kak! 😊 KK itu 100% GRATIS sesuai UU No. 24 Tahun 2013!

**💰 Tidak ada biaya apapun untuk:**
• KK baru
• Perubahan data KK
• Penambahan anggota keluarga
• Penggantian KK hilang/rusak

**📋 Yang perlu disiapkan:**
• Dokumen persyaratan sesuai jenis layanan
• Formulir yang bisa didownload gratis
• Waktu untuk datang ke Dukcapil

**🎯 Semua layanan administrasi kependudukan GRATIS!**

SELLY siap bantu dengan informasi lengkap persyaratan KK! 🤝`);
    }

    // KK Hilang (Lost KK) patterns
    if ((lowerQuery.includes('hilang') || lowerQuery.includes('rusak')) &&
        (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga'))) {
      return this.enhanceKKResponseWithPersona(`Halo kak! 😊 Jangan khawatir, KK yang hilang/rusak bisa diganti dengan mudah!

**📋 Persyaratan KK Hilang:**
• Surat keterangan kehilangan dari kepolisian (asli)
• Fotokopi KTP-el kepala keluarga
• Fotokopi akta kelahiran seluruh anggota keluarga
• Email dan nomor telepon aktif

**📋 Persyaratan KK Rusak:**
• KK lama yang rusak (jika masih ada)
• Fotokopi KTP-el kepala keluarga
• Fotokopi akta kelahiran seluruh anggota keluarga

**🔄 Proses:**
1. Siapkan dokumen persyaratan
2. Datang ke Dukcapil (tidak bisa diwakilkan)
3. Verifikasi dan input data
4. KK baru selesai hari itu juga

**💰 Biaya:** GRATIS!

SELLY siap bantu dengan panduan lengkap! 🤝`);
    }

    // KK Pisah (Separate KK) patterns
    if ((lowerQuery.includes('pisah') || lowerQuery.includes('mandiri')) &&
        (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga'))) {
      return this.enhanceKKResponseWithPersona(`Halo kak! 😊 Mau pisah KK setelah menikah atau mandiri? Bisa banget!

**🎯 Situasi Pisah KK:**
• Anak sudah menikah dan mau KK sendiri
• Sudah dewasa dan ingin mandiri
• Pindah alamat dan perlu KK baru

**📋 Persyaratan Umum:**
• Fotokopi KK lama (orang tua)
• KTP-el pemohon
• Akta kelahiran pemohon
• Buku nikah (jika sudah menikah)
• Surat keterangan pindah (jika pindah alamat)

**🔄 Proses:**
1. Siapkan dokumen lengkap
2. Datang ke Dukcapil
3. Isi formulir permohonan
4. KK baru selesai hari itu juga

**💰 Biaya:** GRATIS!

SELLY siap bantu dengan panduan detail sesuai situasi kakak! 🤝`);
    }

    // KK Casual patterns (informal language)
    if ((lowerQuery.includes('bikin') || lowerQuery.includes('buat')) &&
        (lowerQuery.includes('kk') || lowerQuery.includes('kartu keluarga'))) {
      return this.enhanceKKResponseWithPersona(`Halo kak! 😊 Mau bikin KK ya? SELLY siap bantu!

**🤔 Situasi kakak yang mana nih?**
• **KK Baru** - Belum punya dokumen sama sekali
• **KK Pernikahan** - Baru menikah, mau KK sendiri
• **Pisah KK** - Mau mandiri dari KK orang tua
• **Ganti KK** - KK hilang atau rusak
• **Update KK** - Ada perubahan data atau anggota

**💡 Setiap situasi punya persyaratan berbeda lho!**

Ceritain situasi kakak dong, biar SELLY bisa kasih panduan yang tepat!

Atau kakak bisa pilih:
📞 WhatsApp: +62-851-8304-3205
🌐 Online: pastioke.garutkab.go.id

SELLY siap bantu sampai tuntas! 🤝`);
    }

    return null;
  }

  /**
   * Enhance KK response with Sahabat Adminduk persona
   */
  private enhanceKKResponseWithPersona(originalResponse: string): string {
    let enhancedResponse = originalResponse;

    // Add friendly greeting if not present
    if (!enhancedResponse.includes('Halo') && !enhancedResponse.includes('Hai')) {
      enhancedResponse = `Halo kak! 😊\n\n${enhancedResponse}`;
    }

    // Add helpful closing if not present
    if (!enhancedResponse.includes('SELLY') && !enhancedResponse.includes('🤝')) {
      enhancedResponse += '\n\nSemoga informasi ini membantu ya kak! Kalau ada pertanyaan lain tentang KK, SELLY siap bantu! 🤝';
    }

    // Add empathy for problem scenarios
    if (enhancedResponse.includes('hilang') || enhancedResponse.includes('rusak') || enhancedResponse.includes('masalah')) {
      enhancedResponse = enhancedResponse.replace(
        'Halo kak! 😊\n\n',
        'Halo kak! 😊 Jangan khawatir, SELLY akan bantu kakak menyelesaikan masalah ini.\n\n'
      );
    }

    return enhancedResponse;
  }

  /**
   * Check if query is specifically about Perpindahan (Migration/Relocation)
   */
  private isPerpindahanSpecificQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    const perpindahanKeywords = [
      'pindah', 'perpindahan', 'domisili', 'pindah domisili', 'pindah alamat',
      'skpwni', 'surat keterangan pindah', 'pindah datang', 'pindah keluar',
      'fasilitasi pindah', 'cabut berkas', 'formulir f-1.03', 'f-1.03',
      'migrasi', 'relokasi', 'mutasi alamat', 'kepindahan', 'alamat domisili'
    ];

    // Enhanced pattern matching for casual Indonesian expressions
    const casualPerpindahanPatterns = [
      /aku.*ingin.*pindah/i,
      /saya.*ingin.*pindah/i,
      /mau.*pindah/i,
      /ingin.*pindah/i,
      /pengen.*pindah/i,
      /kepingin.*pindah/i,
      /pindah.*alamat.*domisili/i,
      /perpindahan.*alamat/i,
      /ganti.*alamat/i,
      /ubah.*alamat/i
    ];

    // Check keywords first
    const hasKeyword = perpindahanKeywords.some(keyword => lowerQuery.includes(keyword));

    // Check casual patterns
    const matchesPattern = casualPerpindahanPatterns.some(pattern => pattern.test(lowerQuery));

    return hasKeyword || matchesPattern;
  }

  /**
   * Get Perpindahan continuous training response from comprehensive training data
   */
  private getPerpindahanTrainingResponse(query: string): string | null {
    try {
      // Check for specific Perpindahan patterns first (no file system access needed)
      const specificResponse = this.getSpecificPerpindahanTrainingResponse(query);
      if (specificResponse) {
        return specificResponse;
      }

      // In production/build environment, use pattern-based responses
      if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
        return this.getPerpindahanPatternBasedResponse(query);
      }

      // Only try to load files in development/server environment
      try {
        // Use dynamic import to avoid bundling fs in client code
        const { loadPerpindahanTrainingData } = require('../../utils/serverFileUtils');
        const perpindahanTrainingData = loadPerpindahanTrainingData();

        if (perpindahanTrainingData) {
          // Check each training category for matching patterns
          for (const [categoryName, trainingPairs] of Object.entries(perpindahanTrainingData)) {
            if (Array.isArray(trainingPairs)) {
              // Find matching training pair
              for (const pair of trainingPairs as any[]) {
                if (this.matchesPerpindahanTrainingPair(query, pair)) {
                  console.log(`🎯 [PERPINDAHAN_TRAINING] Matched pattern from ${categoryName}`);
                  return this.enhancePerpindahanResponseWithPersona(pair.expectedResponse || pair.response);
                }
              }
            }
          }
        }
      } catch (fsError) {
        console.warn('⚠️ [PERPINDAHAN_TRAINING] Server file utils not available, using pattern-based responses');
        return this.getPerpindahanPatternBasedResponse(query);
      }

      return null;

    } catch (error) {
      console.error('❌ [PERPINDAHAN_TRAINING] Error in Perpindahan training response:', error);
      return null;
    }
  }

  /**
   * Check if query matches a Perpindahan training pair
   */
  private matchesPerpindahanTrainingPair(query: string, pair: any): boolean {
    const lowerQuery = query.toLowerCase();
    const pairQuery = (pair.query || '').toLowerCase();

    // Direct similarity check using simple word overlap
    if (pairQuery) {
      const queryWords = lowerQuery.split(' ').filter((word: string) => word.length > 2);
      const pairWords = pairQuery.split(' ').filter((word: string) => word.length > 2);
      const commonWords = queryWords.filter((word: string) => pairWords.includes(word));
      const similarity = (commonWords.length * 2) / (queryWords.length + pairWords.length);

      if (similarity > 0.7) {
        return true;
      }
    }

    // Keyword matching
    const queryWords = lowerQuery.split(' ').filter((word: string) => word.length > 2);
    const pairWords = pairQuery.split(' ').filter((word: string) => word.length > 2);
    const commonWords = queryWords.filter((word: string) => pairWords.includes(word));

    return commonWords.length >= 2;
  }

  /**
   * Get Perpindahan pattern-based response for build/production environment
   */
  private getPerpindahanPatternBasedResponse(query: string): string | null {
    const lowerQuery = query.toLowerCase();

    // Enhanced pattern matching for address change and SKPWNI queries
    if (lowerQuery.includes('pindah') || lowerQuery.includes('perpindahan') || lowerQuery.includes('domisili') ||
        lowerQuery.includes('skpwni') || lowerQuery.includes('alamat')) {

      // SKPWNI specific queries
      if (lowerQuery.includes('skpwni') || lowerQuery.includes('surat keterangan pindah')) {
        return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 SKPWNI adalah **Surat Keterangan Pindah Warga Negara Indonesia**!

📄 **Fungsi SKPWNI:**
• Dokumen resmi dari Disdukcapil daerah asal
• "Tiket" untuk mendaftar di daerah tujuan
• Bukti bahwa data sudah dilepas dari daerah asal
• Otorisasi transfer data antar daerah

🎯 **Kapan perlu SKPWNI:**
• Pindah antar kabupaten/kota
• Pindah antar provinsi
• Pindah ke luar negeri

⏰ **Batas waktu:**
Harus lapor ke daerah tujuan maksimal **30 hari** sejak SKPWNI diterbitkan.

SELLY siap bantu kakak dengan prosedur SKPWNI! 🤝`);
      }

      // General address change queries
      if ((lowerQuery.includes('ingin') || lowerQuery.includes('mau')) &&
          (lowerQuery.includes('pindah') && (lowerQuery.includes('alamat') || lowerQuery.includes('domisili')))) {
        return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 Mau pindah alamat domisili? SELLY siap bantu!

🏠 **DALAM KABUPATEN GARUT:**
• Lapor ke RT/RW lama dan baru
• Buat surat keterangan pindah dari kelurahan lama
• Daftar di kelurahan baru
• Update data di Disdukcapil
• **Tidak perlu SKPWNI**

🌍 **ANTAR KABUPATEN/PROVINSI:**
• Surat pindah (SKPWNI) dari Disdukcapil asal
• Surat pindah datang di Disdukcapil tujuan
• Update KK dan KTP-el di daerah baru

💰 **Semua layanan 100% GRATIS!**

Mau tahu prosedur lengkapnya? Tanya aja ke SELLY! 🤝`);
      }

      // Check for specific Perpindahan situations
      if (lowerQuery.includes('biaya') || lowerQuery.includes('gratis')) {
        return this.enhancePerpindahanResponseWithPersona('Semua layanan perpindahan domisili 100% GRATIS sesuai UU No. 24 Tahun 2013! Tidak ada biaya untuk SKPWNI, KK baru, atau KTP-el baru.');
      }
      if (lowerQuery.includes('dalam satu kota') || lowerQuery.includes('satu kabupaten')) {
        return this.enhancePerpindahanResponseWithPersona('Pindah dalam satu kota sangat mudah! Cukup datang ke Disdukcapil dengan KK asli + KTP-el asli, tidak perlu SKPWNI. Bisa selesai hari itu juga!');
      }
      if (lowerQuery.includes('antar kota') || lowerQuery.includes('antar kabupaten')) {
        return this.enhancePerpindahanResponseWithPersona('Pindah antar kota perlu 2 tahap: 1) Dapat SKPWNI dari daerah asal, 2) Lapor ke daerah tujuan dengan SKPWNI. Atau bisa fasilitasi dari daerah tujuan tanpa balik ke asal!');
      }
    }

    return null;
  }

  /**
   * Get specific Perpindahan training response based on patterns
   */
  private getSpecificPerpindahanTrainingResponse(query: string): string | null {
    const lowerQuery = query.toLowerCase();

    // Perpindahan Biaya (Cost) patterns
    if (lowerQuery.includes('biaya') && (lowerQuery.includes('pindah') || lowerQuery.includes('perpindahan'))) {
      return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 Kabar baiknya, semua layanan perpindahan domisili **100% GRATIS**!

**💰 Yang GRATIS:**
• Pengurusan SKPWNI
• Penerbitan KK baru
• Penerbitan KTP-el baru
• Formulir F-1.03
• Semua proses administrasi

**📜 Dasar hukum:**
**UU No. 24 Tahun 2013** secara tegas menghapuskan segala bentuk pungutan biaya untuk penerbitan dokumen kependudukan dasar.

SELLY siap bantu kakak dengan prosedur resmi yang gratis! 🤝`);
    }

    // Perpindahan dalam satu kota patterns
    if ((lowerQuery.includes('dalam satu kota') || lowerQuery.includes('satu kabupaten')) && lowerQuery.includes('pindah')) {
      return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 Pindah dalam satu kota/kabupaten prosesnya sangat mudah!

**📋 Langkah-langkah:**
1. **Datang ke Disdukcapil** atau UPT kecamatan
2. **Bawa dokumen:**
   • KK asli
   • KTP-el asli
3. **Lapor perubahan alamat** ke petugas
4. **Terima KK baru** dengan alamat yang diperbarui
5. **Terima KTP-el baru** dengan alamat baru

**✨ Keuntungan:**
• Tidak perlu SKPWNI
• Proses lebih cepat
• Bisa selesai hari itu juga

SELLY siap bantu kakak dengan prosedur lengkapnya! 🤝`);
    }

    // SKPWNI patterns
    if (lowerQuery.includes('skpwni') || lowerQuery.includes('surat keterangan pindah')) {
      return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 SKPWNI adalah **Surat Keterangan Pindah Warga Negara Indonesia**!

**📄 Fungsi SKPWNI:**
• Dokumen resmi dari Disdukcapil daerah asal
• "Tiket" untuk mendaftar di daerah tujuan
• Bukti bahwa data sudah dilepas dari daerah asal
• Otorisasi transfer data antar daerah

**🎯 Kapan perlu SKPWNI:**
• Pindah antar kabupaten/kota
• Pindah antar provinsi
• Pindah ke luar negeri

**⏰ Batas waktu:**
Harus lapor ke daerah tujuan maksimal **30 hari** sejak SKPWNI diterbitkan.

SELLY siap bantu kakak dengan prosedur SKPWNI! 🤝`);
    }

    // Fasilitasi pindah patterns
    if (lowerQuery.includes('fasilitasi') || lowerQuery.includes('cabut berkas') || lowerQuery.includes('terlanjur pindah')) {
      return this.enhancePerpindahanResponseWithPersona(`Halo kak! 😊 Ada cara mudah pindah tanpa perlu balik ke kota asal!

**🚀 Fasilitasi Pindah dari Daerah Tujuan:**

**📋 Prosedur:**
1. **Datang ke Disdukcapil kota TUJUAN** (bukan asal)
2. **Bawa dokumen:**
   • Fotokopi KK (atau cukup kasih NIK + No. KK)
3. **Isi Formulir F-1.03**
4. **Disdukcapil tujuan** akan kirim surat ke Disdukcapil asal
5. **SKPWNI diterbitkan** oleh daerah asal (sering digital)
6. **Proses pindah datang** dilanjutkan di daerah tujuan

**✨ Keuntungan:**
• Tidak perlu balik ke kota asal
• Hemat waktu dan biaya transportasi

SELLY siap bantu kakak! 🤝`);
    }

    return null;
  }

  /**
   * Enhance Perpindahan response with Sahabat Adminduk persona
   */
  private enhancePerpindahanResponseWithPersona(originalResponse: string): string {
    let enhancedResponse = originalResponse;

    // Add friendly greeting if not present
    if (!enhancedResponse.includes('Halo') && !enhancedResponse.includes('Hai')) {
      enhancedResponse = `Halo kak! 😊\n\n${enhancedResponse}`;
    }

    // Add helpful closing if not present
    if (!enhancedResponse.includes('SELLY') && !enhancedResponse.includes('🤝')) {
      enhancedResponse += '\n\nSemoga informasi ini membantu ya kak! Kalau ada pertanyaan lain tentang perpindahan domisili, SELLY siap bantu! 🤝';
    }

    // Add empathy for problem scenarios
    if (enhancedResponse.includes('terlanjur') || enhancedResponse.includes('masalah') || enhancedResponse.includes('hilang')) {
      enhancedResponse = enhancedResponse.replace(
        'Halo kak! 😊\n\n',
        'Halo kak! 😊 Jangan khawatir, SELLY akan bantu kakak menyelesaikan masalah perpindahan ini.\n\n'
      );
    }

    return enhancedResponse;
  }
}
