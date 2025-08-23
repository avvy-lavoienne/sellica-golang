/**
 * Akta Kelahiran Scenario Pattern Configurations
 * Comprehensive casual Indonesian patterns for Akta Kelahiran scenario responses
 * Supports the conversational A, B, C, D, E flow implemented in knowledgeService
 */

import { DocumentConfig } from './casualPatternGenerator';

export interface AktaKelahiranScenarioConfig {
  scenarioId: string;
  scenarioName: string;
  letterResponses: string[];
  casualPatterns: string[];
  descriptivePatterns: string[];
  aliases: string[];
}

/**
 * Akta Kelahiran Scenario Configurations for Pattern Generation
 */
export const aktaKelahiranScenarioConfigurations: Record<string, AktaKelahiranScenarioConfig> = {
  // Scenario A - Bayi Baru Lahir (Kurang dari 60 Hari)
  scenario_a: {
    scenarioId: 'A',
    scenarioName: 'Bayi Baru Lahir (Kurang dari 60 Hari)',
    letterResponses: [
      'a', 'A', 'yang a', 'pilih a', 'a dong', 'opsi a', 'huruf a'
    ],
    casualPatterns: [
      'bayi.*baru.*lahir', 'anak.*baru.*lahir', 'kelahiran.*baru',
      'lahir.*kurang.*60.*hari', 'lahir.*belum.*60.*hari', 'baru.*melahirkan',
      'habis.*melahirkan', 'kelahiran.*normal', 'lahir.*di.*rumah.*sakit',
      'lahir.*di.*bidan', 'lahir.*di.*klinik', 'bayi.*sehat'
    ],
    descriptivePatterns: [
      'bayi saya baru lahir', 'anak baru lahir kurang dari 60 hari',
      'kelahiran normal di rumah sakit', 'melahirkan di bidan',
      'bayi lahir sehat', 'kelahiran baru-baru ini'
    ],
    aliases: ['kelahiran normal', 'bayi sehat', 'lahir di RS', 'lahir di bidan']
  },

  // Scenario B - Anak Sudah Lahir Lama (Terlambat Daftar)
  scenario_b: {
    scenarioId: 'B',
    scenarioName: 'Anak Sudah Lahir Lama (Terlambat Daftar)',
    letterResponses: [
      'b', 'B', 'yang b', 'pilih b', 'b dong', 'opsi b', 'huruf b'
    ],
    casualPatterns: [
      'anak.*sudah.*lahir.*lama', 'terlambat.*daftar', 'belum.*punya.*akta',
      'lahir.*lebih.*60.*hari', 'lahir.*sudah.*lama', 'anak.*belum.*ada.*akta',
      'kelahiran.*terlambat', 'daftar.*terlambat', 'anak.*umur.*tahun.*belum.*akta',
      'sudah.*besar.*belum.*akta', 'lupa.*bikin.*akta', 'telat.*urus.*akta'
    ],
    descriptivePatterns: [
      'anak sudah lahir lama tapi belum punya akta kelahiran',
      'terlambat mendaftarkan kelahiran anak',
      'anak sudah berumur beberapa tahun belum ada akta',
      'lupa mengurus akta kelahiran sejak lahir'
    ],
    aliases: ['terlambat daftar', 'belum ada akta', 'anak sudah besar', 'lupa urus']
  },

  // Scenario C - Akta Kelahiran Hilang/Rusak
  scenario_c: {
    scenarioId: 'C',
    scenarioName: 'Akta Kelahiran Hilang/Rusak',
    letterResponses: [
      'c', 'C', 'yang c', 'pilih c', 'c dong', 'opsi c', 'huruf c'
    ],
    casualPatterns: [
      'akta.*hilang', 'akta.*ilang', 'akta.*rusak', 'akta.*sobek',
      'akta.*pecah', 'akta.*patah', 'kehilangan.*akta', 'akta.*gue.*hilang',
      'akta.*aku.*hilang', 'akta.*saya.*hilang', 'akta.*rusak.*nih',
      'akta.*ilang.*nih', 'akta.*gak.*ada', 'akta.*ga.*ada', 'akta.*kelahiran.*hilang'
    ],
    descriptivePatterns: [
      'akta kelahiran hilang', 'akta kelahiran rusak',
      'kehilangan akta kelahiran', 'akta kelahiran sobek',
      'perlu penggantian akta kelahiran'
    ],
    aliases: ['akta hilang', 'akta rusak', 'penggantian akta', 'akta sobek']
  },

  // Scenario D - Ada Kesalahan Data di Akta Kelahiran
  scenario_d: {
    scenarioId: 'D',
    scenarioName: 'Ada Kesalahan Data di Akta Kelahiran',
    letterResponses: [
      'd', 'D', 'yang d', 'pilih d', 'd dong', 'opsi d', 'huruf d'
    ],
    casualPatterns: [
      'data.*akta.*salah', 'akta.*data.*salah', 'nama.*di.*akta.*salah',
      'tanggal.*lahir.*salah', 'tempat.*lahir.*salah', 'nama.*orang.*tua.*salah',
      'kesalahan.*data.*akta', 'akta.*perlu.*dikoreksi', 'koreksi.*akta',
      'ubah.*data.*akta', 'perbaiki.*akta', 'revisi.*akta.*kelahiran'
    ],
    descriptivePatterns: [
      'ada kesalahan data di akta kelahiran',
      'nama di akta kelahiran salah',
      'tanggal lahir di akta tidak benar',
      'perlu koreksi data akta kelahiran'
    ],
    aliases: ['data salah', 'koreksi akta', 'revisi akta', 'perbaikan data']
  },

  // Scenario E - Kelahiran di Luar Negeri (WNI di Luar Negeri)
  scenario_e: {
    scenarioId: 'E',
    scenarioName: 'Kelahiran di Luar Negeri (WNI di Luar Negeri)',
    letterResponses: [
      'e', 'E', 'yang e', 'pilih e', 'e dong', 'opsi e', 'huruf e'
    ],
    casualPatterns: [
      'lahir.*luar.*negeri', 'kelahiran.*luar.*negeri', 'wni.*luar.*negeri',
      'lahir.*di.*luar.*negeri', 'anak.*lahir.*luar.*negeri', 'kelahiran.*overseas',
      'lahir.*di.*amerika', 'lahir.*di.*eropa', 'lahir.*di.*asia',
      'lahir.*di.*australia', 'lahir.*di.*jepang', 'lahir.*di.*singapura',
      'konsulat.*indonesia', 'kjri', 'kedutaan.*indonesia'
    ],
    descriptivePatterns: [
      'anak lahir di luar negeri',
      'kelahiran WNI di luar negeri',
      'lahir di luar negeri perlu akta Indonesia',
      'urus akta kelahiran dari luar negeri'
    ],
    aliases: ['lahir overseas', 'WNI luar negeri', 'konsulat', 'KJRI']
  }
};

/**
 * Extended DocumentConfig for Akta Kelahiran with scenario support
 */
export const aktaKelahiranScenarioDocumentConfig: DocumentConfig = {
  documentType: 'akta_kelahiran_scenario',
  documentNames: [
    'akta kelahiran', 'akta lahir', 'surat kelahiran', 'dokumen kelahiran',
    'birth certificate', 'akta', 'surat lahir'
  ],
  actions: [
    'bikin', 'buat', 'membuat', 'ngurus', 'urus', 'mengurus',
    'cetak', 'pencetakan', 'daftar', 'mendaftar', 'ganti',
    // Scenario-specific actions
    'hilang', 'rusak', 'koreksi', 'terlambat', 'luar negeri'
  ],
  aliases: ['birth certificate', 'surat lahir', 'dokumen lahir']
};

/**
 * Generate all Akta Kelahiran scenario patterns
 */
export function generateAllAktaKelahiranScenarioPatterns(): RegExp[] {
  const patterns: RegExp[] = [];
  
  Object.values(aktaKelahiranScenarioConfigurations).forEach(config => {
    // Letter response patterns
    config.letterResponses.forEach(letter => {
      patterns.push(new RegExp(`^${letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    });
    
    // Casual patterns
    config.casualPatterns.forEach(pattern => {
      patterns.push(new RegExp(pattern, 'i'));
    });
    
    // Descriptive patterns
    config.descriptivePatterns.forEach(pattern => {
      patterns.push(new RegExp(pattern, 'i'));
    });
    
    // Alias patterns
    config.aliases.forEach(alias => {
      patterns.push(new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
    });
  });
  
  return patterns;
}

/**
 * Get scenario from query
 */
export function getAktaKelahiranScenarioFromQuery(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [scenarioKey, config] of Object.entries(aktaKelahiranScenarioConfigurations)) {
    // Check letter responses
    if (config.letterResponses.some(letter => letter.toLowerCase() === lowerQuery)) {
      return config.scenarioId;
    }
    
    // Check casual patterns
    if (config.casualPatterns.some(pattern => new RegExp(pattern, 'i').test(query))) {
      return config.scenarioId;
    }
    
    // Check descriptive patterns
    if (config.descriptivePatterns.some(pattern => new RegExp(pattern, 'i').test(query))) {
      return config.scenarioId;
    }
    
    // Check aliases
    if (config.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(query))) {
      return config.scenarioId;
    }
  }
  
  return null;
}

/**
 * Generate test queries for Akta Kelahiran scenarios
 */
export function generateAktaKelahiranScenarioTestQueries(): string[] {
  const testQueries: string[] = [];
  
  Object.values(aktaKelahiranScenarioConfigurations).forEach(config => {
    // Add sample queries for each scenario
    testQueries.push(
      ...config.casualPatterns.slice(0, 2),
      ...config.descriptivePatterns.slice(0, 1),
      ...config.letterResponses.slice(0, 1)
    );
  });
  
  return testQueries;
}
