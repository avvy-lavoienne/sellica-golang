/**
 * KTP Scenario Pattern Configurations
 * Comprehensive casual Indonesian patterns for KTP scenario responses
 * Supports the conversational A, B, C, D flow implemented in knowledgeService
 */

import { DocumentConfig } from './casualPatternGenerator';

export interface KTPScenarioConfig {
  scenarioId: string;
  scenarioName: string;
  letterResponses: string[];
  casualPatterns: string[];
  descriptivePatterns: string[];
  aliases: string[];
}

/**
 * KTP Scenario Configurations for Pattern Generation
 */
export const ktpScenarioConfigurations: Record<string, KTPScenarioConfig> = {
  // Scenario A - KTP Hilang/Rusak
  scenario_a: {
    scenarioId: 'A',
    scenarioName: 'KTP Hilang/Rusak',
    letterResponses: [
      'a', 'A', 'yang a', 'pilih a', 'a dong', 'opsi a', 'huruf a'
    ],
    casualPatterns: [
      'ktp.*hilang', 'ktp.*ilang', 'ktp.*rusak', 'ktp.*pecah',
      'ktp.*sobek', 'ktp.*patah', 'kehilangan.*ktp', 'ktp.*gue.*hilang',
      'ktp.*aku.*hilang', 'ktp.*saya.*hilang', 'ktp.*rusak.*nih',
      'ktp.*ilang.*nih', 'ktp.*gak.*ada', 'ktp.*ga.*ada'
    ],
    descriptivePatterns: [
      'sudah.*pernah.*perekaman.*hilang', 'sudah.*pernah.*perekaman.*rusak',
      'pernah.*bikin.*tapi.*hilang', 'pernah.*buat.*tapi.*rusak',
      'udah.*pernah.*rekam.*tapi.*ilang', 'udah.*ada.*ktp.*tapi.*hilang',
      'pernah.*punya.*ktp.*tapi.*rusak', 'ktp.*lama.*hilang',
      'ktp.*lama.*rusak', 'ktp.*sebelumnya.*hilang'
    ],
    aliases: ['hilang', 'rusak', 'ilang', 'pecah', 'sobek', 'patah']
  },

  // Scenario B - KTP Koreksi Data
  scenario_b: {
    scenarioId: 'B',
    scenarioName: 'KTP Koreksi Data',
    letterResponses: [
      'b', 'B', 'yang b', 'pilih b', 'b aja', 'opsi b', 'huruf b'
    ],
    casualPatterns: [
      'data.*salah', 'nama.*salah', 'alamat.*salah', 'tanggal.*salah',
      'mau.*ganti.*data', 'mau.*ubah.*data', 'mau.*koreksi',
      'ada.*yang.*salah', 'data.*gak.*bener', 'data.*ga.*bener',
      'nama.*gak.*sesuai', 'alamat.*gak.*sesuai', 'mau.*perbaiki.*data'
    ],
    descriptivePatterns: [
      'sudah.*pernah.*perekaman.*salah', 'sudah.*pernah.*perekaman.*koreksi',
      'pernah.*bikin.*tapi.*salah', 'pernah.*buat.*tapi.*ada.*salah',
      'udah.*pernah.*rekam.*tapi.*salah', 'udah.*ada.*ktp.*tapi.*salah',
      'pernah.*punya.*ktp.*tapi.*data.*salah', 'ktp.*ada.*tapi.*salah',
      'perlu.*dikoreksi', 'perlu.*diperbaiki', 'mau.*betulkan.*data'
    ],
    aliases: ['koreksi', 'salah', 'ganti data', 'ubah data', 'perbaiki', 'betulkan']
  },

  // Scenario C - KTP Pertama Kali
  scenario_c: {
    scenarioId: 'C',
    scenarioName: 'KTP Pertama Kali',
    letterResponses: [
      'c', 'C', 'yang c', 'pilih c', 'c dong', 'opsi c', 'huruf c'
    ],
    casualPatterns: [
      'belum.*pernah', 'pertama.*kali', 'baru.*mau.*bikin', 'belum.*punya.*ktp',
      'belum.*ada.*ktp', 'gak.*punya.*ktp', 'ga.*punya.*ktp',
      'baru.*17.*tahun', 'baru.*nikah', 'baru.*kawin', 'baru.*dewasa',
      'belum.*pernah.*rekam', 'belum.*pernah.*bikin', 'first.*time'
    ],
    descriptivePatterns: [
      'belum.*pernah.*perekaman.*sama.*sekali', 'belum.*pernah.*perekaman',
      'ktp.*pertama.*kali', 'bikin.*ktp.*pertama.*kali',
      'buat.*ktp.*pertama.*kali', 'ngurus.*ktp.*pertama.*kali',
      'belum.*pernah.*punya.*ktp', 'belum.*pernah.*bikin.*ktp',
      'baru.*mau.*punya.*ktp', 'baru.*butuh.*ktp'
    ],
    aliases: ['pertama kali', 'belum pernah', 'baru', 'first time', 'perdana']
  },

  // Scenario D - Tidak Yakin/Tidak Ingat
  scenario_d: {
    scenarioId: 'D',
    scenarioName: 'Tidak Yakin/Tidak Ingat',
    letterResponses: [
      'd', 'D', 'yang d', 'pilih d', 'd aja', 'opsi d', 'huruf d'
    ],
    casualPatterns: [
      'gak.*tau', 'ga.*tau', 'tidak.*tahu', 'gak.*yakin', 'ga.*yakin',
      'tidak.*yakin', 'lupa', 'gak.*ingat', 'ga.*ingat', 'tidak.*ingat',
      'bingung', 'gak.*sure', 'ga.*sure', 'ragu.*ragu', 'gak.*pasti'
    ],
    descriptivePatterns: [
      'tidak.*yakin.*tidak.*ingat', 'gak.*tau.*pernah.*rekam.*apa.*belum',
      'lupa.*udah.*punya.*apa.*belum', 'gak.*ingat.*pernah.*bikin.*apa.*belum',
      'bingung.*udah.*ada.*apa.*belum', 'ragu.*pernah.*perekaman.*apa.*belum',
      'gak.*yakin.*udah.*pernah.*atau.*belum', 'lupa.*status.*ktp'
    ],
    aliases: ['tidak yakin', 'tidak ingat', 'lupa', 'bingung', 'ragu', 'gak tau']
  }
};

/**
 * Extended DocumentConfig for KTP with scenario support
 */
export const ktpScenarioDocumentConfig: DocumentConfig = {
  documentType: 'ktp_scenario',
  documentNames: [
    'ktp', 'ktp-el', 'ktp elektronik', 'kartu tanda penduduk',
    'kartu tanda penduduk elektronik', 'ikd', 'identitas kependudukan digital'
  ],
  actions: [
    'bikin', 'buat', 'membuat', 'ngurus', 'urus', 'mengurus',
    'cetak', 'pencetakan', 'aktivasi', 'perpanjang', 'ganti',
    // Scenario-specific actions
    'hilang', 'rusak', 'koreksi', 'pertama kali', 'tidak yakin'
  ],
  aliases: ['e-ktp', 'ektp', 'ktp digital']
};

/**
 * Generate all KTP scenario patterns
 */
export function generateAllKTPScenarioPatterns(): RegExp[] {
  const patterns: RegExp[] = [];
  
  Object.values(ktpScenarioConfigurations).forEach(config => {
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
 * Get scenario ID from query
 */
export function getScenarioFromQuery(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim();
  
  for (const [scenarioKey, config] of Object.entries(ktpScenarioConfigurations)) {
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
 * Generate test queries for KTP scenarios
 */
export function generateKTPScenarioTestQueries(): string[] {
  const testQueries: string[] = [];
  
  Object.values(ktpScenarioConfigurations).forEach(config => {
    // Add letter responses
    testQueries.push(...config.letterResponses.slice(0, 3));
    
    // Add sample casual patterns
    testQueries.push(
      `ktp gue ${config.aliases[0]}`,
      `mau ${config.aliases[0]} ktp`,
      `ktp ${config.aliases[0]} nih`
    );
    
    // Add sample descriptive patterns
    if (config.descriptivePatterns.length > 0) {
      testQueries.push(config.descriptivePatterns[0].replace(/\.\*/g, ' '));
    }
  });
  
  return testQueries;
}
