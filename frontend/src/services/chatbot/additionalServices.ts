/**
 * Additional Services for SELLY Knowledge Base
 * Contains comprehensive service definitions for all Disdukcapil services
 */

import { ServiceInfo } from './knowledgeService';

export const additionalServices: Map<string, ServiceInfo> = new Map([
  // Akta Pengakuan Anak
  ['akta_pengakuan_anak', {
    serviceName: 'Akta Pengakuan Anak',
    serviceCode: 'APA-001',
    serviceType: 'Pembuatan Akta Pengakuan Anak',
    requirements: [
      { name: 'Fotokopi KTP ayah yang mengakui', required: true },
      { name: 'Fotokopi akta kelahiran anak', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Surat pernyataan pengakuan anak', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi dokumen dan pernyataan', estimatedTime: '20 menit' },
      { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
    ],
    duration: '14 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Ayah yang mengakui harus hadir', 'Diperlukan pernyataan tertulis pengakuan anak']
  }],

  // Akta Pengesahan Anak
  ['akta_pengesahan_anak', {
    serviceName: 'Akta Pengesahan Anak',
    serviceCode: 'APS-001',
    serviceType: 'Pembuatan Akta Pengesahan Anak',
    requirements: [
      { name: 'Fotokopi KTP kedua orang tua', required: true },
      { name: 'Fotokopi akta kelahiran anak', required: true },
      { name: 'Fotokopi akta perkawinan orang tua', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi dokumen perkawinan dan kelahiran', estimatedTime: '20 menit' },
      { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
    ],
    duration: '14 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Kedua orang tua harus hadir', 'Anak lahir sebelum perkawinan orang tua']
  }],

  // Surat Keterangan Pindah WNI (SKPWNI)
  ['skpwni', {
    serviceName: 'Surat Keterangan Pindah WNI (SKPWNI)',
    serviceCode: 'SKPWNI-001',
    serviceType: 'Penerbitan Surat Keterangan Pindah WNI',
    requirements: [
      { name: 'Fotokopi KTP seluruh anggota keluarga yang pindah', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Surat pengantar dari RT/RW', required: true },
      { name: 'Surat keterangan pindah dari kelurahan asal', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi dokumen dan alamat', estimatedTime: '15 menit' },
      { step: 4, description: 'Mendapat surat keterangan pindah', estimatedTime: '10 menit' }
    ],
    duration: '1 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Kepala keluarga harus hadir', 'Berlaku untuk pindah dalam wilayah Indonesia']
  }],

  // Surat Kedatangan Pindah WNI (SKDWNI)
  ['skdwni', {
    serviceName: 'Surat Kedatangan Pindah WNI (SKDWNI)',
    serviceCode: 'SKDWNI-001',
    serviceType: 'Penerbitan Surat Kedatangan Pindah WNI',
    requirements: [
      { name: 'Surat keterangan pindah dari daerah asal', required: true },
      { name: 'Fotokopi KTP seluruh anggota keluarga', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Surat pengantar dari RT/RW setempat', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi surat pindah dan alamat baru', estimatedTime: '15 menit' },
      { step: 4, description: 'Mendapat surat kedatangan pindah', estimatedTime: '10 menit' }
    ],
    duration: '1 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Kepala keluarga harus hadir', 'Untuk pendatang dari luar daerah']
  }],

  // Biodata Penduduk
  ['biodata_penduduk', {
    serviceName: 'Biodata Penduduk',
    serviceCode: 'BP-001',
    serviceType: 'Penerbitan Biodata Penduduk',
    requirements: [
      { name: 'Fotokopi KTP yang bersangkutan', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Surat pengantar dari RT/RW', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '10 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '5 menit' },
      { step: 3, description: 'Verifikasi data penduduk', estimatedTime: '10 menit' },
      { step: 4, description: 'Mendapat biodata penduduk', estimatedTime: '5 menit' }
    ],
    duration: '1 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Yang bersangkutan harus hadir', 'Berisi data lengkap penduduk']
  }],

  // Kutipan Akta (Duplikat)
  ['kutipan_akta', {
    serviceName: 'Kutipan Akta Pencatatan Sipil (Duplikat)',
    serviceCode: 'KA-001',
    serviceType: 'Penerbitan Kutipan Akta (Duplikat)',
    requirements: [
      { name: 'Fotokopi KTP pemohon', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Surat kehilangan dari kepolisian (jika akta hilang)', required: false },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi data akta asli', estimatedTime: '15 menit' },
      { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
    ],
    duration: '7 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Pemohon harus hadir', 'Untuk mengganti akta yang hilang atau rusak']
  }],

  // Salinan Lengkap Akta
  ['salinan_akta', {
    serviceName: 'Salinan Lengkap Akta Pencatatan Sipil',
    serviceCode: 'SA-001',
    serviceType: 'Penerbitan Salinan Lengkap Akta',
    requirements: [
      { name: 'Fotokopi KTP pemohon', required: true },
      { name: 'Fotokopi Kartu Keluarga', required: true },
      { name: 'Fotokopi akta asli', required: true },
      { name: 'Formulir permohonan', required: true }
    ],
    processSteps: [
      { step: 1, description: 'Datang ke kantor Disdukcapil dengan persyaratan lengkap', estimatedTime: '15 menit' },
      { step: 2, description: 'Mengisi formulir permohonan', estimatedTime: '10 menit' },
      { step: 3, description: 'Verifikasi akta asli', estimatedTime: '15 menit' },
      { step: 4, description: 'Mendapat tanda terima', estimatedTime: '5 menit' }
    ],
    duration: '7 hari kerja',
    cost: 'Gratis',
    officeHours: '08:00-15:00 WIB (Senin-Jumat)',
    notes: ['Pemohon harus hadir', 'Berisi informasi lengkap dari register akta']
  }]
]);

export const servicePatterns = {
  // Akta patterns
  'akta_pengakuan_anak': /akta pengakuan anak|pengakuan anak/i,
  'akta_pengesahan_anak': /akta pengesahan anak|pengesahan anak/i,
  
  // Surat patterns
  'skpwni': /skpwni|surat keterangan pindah wni|surat pindah wni/i,
  'skdwni': /skdwni|surat kedatangan pindah wni|kedatangan pindah/i,
  
  // Data patterns
  'biodata_penduduk': /biodata penduduk|biodata/i,
  'kutipan_akta': /kutipan akta|duplikat akta|akta duplikat/i,
  'salinan_akta': /salinan lengkap akta|salinan akta|salinan lengkap/i
};
