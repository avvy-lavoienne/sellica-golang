/**
 * Document Configurations for Automated Casual Pattern Generation
 * Based on 24 official civil registration documents from Direktorat Jenderal Kependudukan
 * dan Pencatatan Sipil (Dukcapil) Kementerian Dalam Negeri Indonesia
 *
 * Reference: Undang-Undang Nomor 24 Tahun 2013
 *
 * Categories:
 * 1. Dokumen Kependudukan dalam Bentuk Kartu (3 documents):
 *    - Kartu Tanda Penduduk elektronik (KTP-el)
 *    - Kartu Identitas Anak (KIA)
 *    - Kartu Keluarga (KK)
 *
 * 2. Dokumen Kependudukan dalam Bentuk Surat (15 documents):
 *    - Biodata Penduduk, Surat Keterangan Pindah, Surat Keterangan Pindah Datang,
 *    - Surat Keterangan Pindah Keluar Negeri, Surat Keterangan Datang dari Luar Negeri,
 *    - Surat Keterangan Tempat Tinggal, Surat Keterangan Kelahiran, Surat Keterangan Lahir Mati,
 *    - Surat Keterangan Pembatalan Perkawinan, Surat Keterangan Pembatalan Perceraian,
 *    - Surat Keterangan Kematian, Surat Keterangan Pengangkatan Anak,
 *    - Surat Keterangan Pelepasan Kewarganegaraan Indonesia, Surat Keterangan Pengganti Tanda Identitas,
 *    - Surat Keterangan Pencatatan Sipil
 *
 * 3. Dokumen Kependudukan dalam Bentuk Akta (6 documents):
 *    - Akta Kelahiran, Akta Kematian, Akta Perkawinan, Akta Perceraian,
 *    - Akta Pengakuan Anak, Akta Pengesahan Anak
 *
 * Each configuration defines the document type, names, actions, and aliases
 * used to generate comprehensive casual language patterns for Indonesian users
 */

import { DocumentConfig } from './casualPatternGenerator';

export const documentConfigurations: Record<string, DocumentConfig> = {
  // KTP-el (Kartu Tanda Penduduk elektronik) - 2025 Updated
  ktp: {
    documentType: 'ktp',
    documentNames: [
      'ktp',
      'ktp-el',
      'ktp elektronik',
      'kartu tanda penduduk',
      'kartu tanda penduduk elektronik',
      'ikd',
      'identitas kependudukan digital'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'cetak',
      'pencetakan',
      'aktivasi',
      'perpanjang',
      'ganti'
    ],
    aliases: ['e-ktp', 'ektp', 'ktp digital']
  },

  // KK (Kartu Keluarga) - NEW IMPLEMENTATION
  kk: {
    documentType: 'kk',
    documentNames: [
      'kk',
      'kartu keluarga',
      'kartu keluarga baru'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat', 
      'ngurus',
      'urus',
      'mengurus',
      'cetak',
      'pencetakan',
      'daftar',
      'mendaftar'
    ],
    aliases: ['karkel']
  },

  // Akta Kelahiran - AUTOMATED GENERATION IMPLEMENTATION
  akta_kelahiran: {
    documentType: 'akta_kelahiran',
    documentNames: [
      'akta kelahiran',
      'akte kelahiran',
      'akteu kelahiran',
      'akta lahir',
      'akte lahir',
      'akteu lahir',
      'surat kelahiran',
      'akta kelahiran anak',
      'akte kelahiran anak',
      'akteu kelahiran anak',
      'akta kelahiran bayi',
      'akte kelahiran bayi',
      'akteu kelahiran bayi',
      'surat lahir'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'daftar',
      'mendaftar',
      'cetak',
      'pencetakan'
    ],
    aliases: ['birth certificate', 'akta birth', 'surat birth']
  },

  // KIA (Kartu Identitas Anak)
  kia: {
    documentType: 'kia',
    documentNames: [
      'kia',
      'kartu identitas anak',
      'kartu identitas anak baru'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus', 
      'mengurus',
      'cetak',
      'pencetakan',
      'daftar',
      'mendaftar'
    ],
    aliases: ['kartu id anak']
  },

  // Akta Perkawinan
  akta_perkawinan: {
    documentType: 'akta_perkawinan',
    documentNames: [
      'akta perkawinan',
      'akte perkawinan',
      'akteu perkawinan',
      'akta nikah',
      'akte nikah',
      'akteu nikah',
      'surat nikah',
      'akta perkawinan resmi',
      'akte perkawinan resmi',
      'akteu perkawinan resmi'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'daftar',
      'mendaftar'
    ],
    aliases: ['akta marriage certificate']
  },

  // Akta Kematian
  akta_kematian: {
    documentType: 'akta_kematian',
    documentNames: [
      'akta kematian',
      'akte kematian',
      'akteu kematian',
      'akta meninggal',
      'akte meninggal',
      'akteu meninggal',
      'surat kematian',
      'akta kematian resmi',
      'akte kematian resmi',
      'akteu kematian resmi'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'daftar',
      'mendaftar'
    ],
    aliases: ['akta death certificate']
  },

  // Akta Pengakuan Anak - NEW TRAINING INTEGRATION
  akta_pengakuan_anak: {
    documentType: 'akta_pengakuan_anak',
    documentNames: [
      'akta pengakuan anak',
      'pengakuan anak',
      'akta legitimasi',
      'legitimasi anak',
      'pengakuan ayah',
      'akta pengakuan biologis'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar',
      'mengakui'
    ],
    aliases: ['anak luar nikah', 'anak tidak sah', 'pengakuan biologis', 'legitimasi']
  },

  // Kepindahan (Migration/Moving Service) - AUTOMATED GENERATION IMPLEMENTATION
  kepindahan: {
    documentType: 'kepindahan',
    documentNames: [
      'kepindahan',
      'pindah domisili',
      'pindah alamat',
      'alamat domisili',
      'surat pindah',
      'skpwni',
      'perpindahan',
      'migrasi',
      'perpindahan alamat',
      'ganti alamat',
      'ubah alamat'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar',
      'ingin',
      'mau',
      'pengen',
      'kepingin'
    ],
    aliases: ['pindah kota', 'pindah daerah', 'beda domisili', 'ganti domisili', 'ubah domisili']
  },

  // === DOKUMEN KEPENDUDUKAN DALAM BENTUK SURAT (15 documents) ===

  // Biodata Penduduk
  biodata_penduduk: {
    documentType: 'biodata_penduduk',
    documentNames: [
      'biodata penduduk',
      'biodata',
      'data penduduk',
      'biodata kependudukan'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'cetak',
      'minta'
    ],
    aliases: ['data diri', 'profil penduduk']
  },

  // Surat Keterangan Pindah Datang
  surat_pindah_datang: {
    documentType: 'surat_pindah_datang',
    documentNames: [
      'surat keterangan pindah datang',
      'surat pindah datang',
      'skpd',
      'surat datang'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat kedatangan', 'dokumen pindah datang']
  },

  // Surat Keterangan Pindah Keluar Negeri
  surat_pindah_luar_negeri: {
    documentType: 'surat_pindah_luar_negeri',
    documentNames: [
      'surat keterangan pindah keluar negeri',
      'surat pindah keluar negeri',
      'skpln',
      'surat pindah luar negeri'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat emigrasi', 'dokumen pindah luar negeri']
  },

  // Surat Keterangan Datang dari Luar Negeri
  surat_datang_luar_negeri: {
    documentType: 'surat_datang_luar_negeri',
    documentNames: [
      'surat keterangan datang dari luar negeri',
      'surat datang dari luar negeri',
      'surat kedatangan luar negeri',
      'skdln'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat imigrasi', 'dokumen kedatangan luar negeri']
  },

  // Surat Keterangan Tempat Tinggal
  surat_tempat_tinggal: {
    documentType: 'surat_tempat_tinggal',
    documentNames: [
      'surat keterangan tempat tinggal',
      'surat tempat tinggal',
      'sktt',
      'surat domisili'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'minta'
    ],
    aliases: ['surat domisili', 'keterangan alamat']
  },

  // Surat Keterangan Kelahiran
  surat_keterangan_kelahiran: {
    documentType: 'surat_keterangan_kelahiran',
    documentNames: [
      'surat keterangan kelahiran',
      'surat kelahiran',
      'skk',
      'keterangan lahir'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat lahir', 'keterangan kelahiran']
  },

  // Surat Keterangan Lahir Mati
  surat_lahir_mati: {
    documentType: 'surat_lahir_mati',
    documentNames: [
      'surat keterangan lahir mati',
      'surat lahir mati',
      'keterangan lahir mati',
      'sklm'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat stillbirth', 'keterangan bayi meninggal']
  },

  // Surat Keterangan Pembatalan Perkawinan
  surat_batal_kawin: {
    documentType: 'surat_batal_kawin',
    documentNames: [
      'surat keterangan pembatalan perkawinan',
      'surat pembatalan perkawinan',
      'surat batal kawin',
      'skbp'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat annulment', 'pembatalan nikah']
  },

  // Surat Keterangan Pembatalan Perceraian
  surat_batal_cerai: {
    documentType: 'surat_batal_cerai',
    documentNames: [
      'surat keterangan pembatalan perceraian',
      'surat pembatalan perceraian',
      'surat batal cerai',
      'skbc'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['pembatalan divorce', 'batal perceraian']
  },

  // Surat Keterangan Kematian
  surat_keterangan_kematian: {
    documentType: 'surat_keterangan_kematian',
    documentNames: [
      'surat keterangan kematian',
      'surat kematian',
      'keterangan meninggal',
      'skm'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat meninggal', 'keterangan kematian']
  },

  // Surat Keterangan Pengangkatan Anak
  surat_angkat_anak: {
    documentType: 'surat_angkat_anak',
    documentNames: [
      'surat keterangan pengangkatan anak',
      'surat pengangkatan anak',
      'surat angkat anak',
      'skpa'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['surat adopsi', 'pengangkatan anak']
  },

  // Surat Keterangan Pelepasan Kewarganegaraan Indonesia
  surat_lepas_wni: {
    documentType: 'surat_lepas_wni',
    documentNames: [
      'surat keterangan pelepasan kewarganegaraan indonesia',
      'surat pelepasan kewarganegaraan',
      'surat lepas wni',
      'skpki'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['pelepasan citizenship', 'lepas kewarganegaraan']
  },

  // Surat Keterangan Pengganti Tanda Identitas
  surat_pengganti_identitas: {
    documentType: 'surat_pengganti_identitas',
    documentNames: [
      'surat keterangan pengganti tanda identitas',
      'surat pengganti identitas',
      'surat pengganti id',
      'skpti'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'minta'
    ],
    aliases: ['pengganti identitas', 'surat ganti id']
  },

  // Surat Keterangan Pencatatan Sipil
  surat_catatan_sipil: {
    documentType: 'surat_catatan_sipil',
    documentNames: [
      'surat keterangan pencatatan sipil',
      'surat pencatatan sipil',
      'surat catatan sipil',
      'skcs'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'ajukan',
      'daftar'
    ],
    aliases: ['pencatatan sipil', 'catatan sipil']
  },

  // === DOKUMEN KEPENDUDUKAN DALAM BENTUK AKTA (Additional 3 documents) ===

  // Akta Perceraian
  akta_perceraian: {
    documentType: 'akta_perceraian',
    documentNames: [
      'akta perceraian',
      'akta cerai',
      'surat cerai',
      'akta perceraian resmi'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'daftar',
      'mendaftar'
    ],
    aliases: ['akta divorce certificate', 'surat talak']
  },

  // Akta Pengesahan Anak
  akta_pengesahan_anak: {
    documentType: 'akta_pengesahan_anak',
    documentNames: [
      'akta pengesahan anak',
      'akta pengesahan',
      'surat pengesahan anak',
      'akta pengesahan anak resmi'
    ],
    actions: [
      'bikin',
      'buat',
      'membuat',
      'ngurus',
      'urus',
      'mengurus',
      'daftar',
      'mendaftar'
    ],
    aliases: ['akta legitimation', 'pengesahan anak']
  }
};

/**
 * Get document configuration by type
 */
export function getDocumentConfig(documentType: string): DocumentConfig | null {
  return documentConfigurations[documentType] || null;
}

/**
 * Get all available document types
 */
export function getAllDocumentTypes(): string[] {
  return Object.keys(documentConfigurations);
}

/**
 * Check if a document type is supported
 */
export function isDocumentTypeSupported(documentType: string): boolean {
  return documentType in documentConfigurations;
}
