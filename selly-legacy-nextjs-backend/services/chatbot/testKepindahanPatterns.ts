/**
 * Test Kepindahan Automated Pattern Generation
 * Validates the comprehensive casual language support for Kepindahan service
 */

import { casualPatternGenerator } from './casualPatternGenerator';
import { documentConfigurations } from './documentConfigurations';

/**
 * Test queries to validate Kepindahan pattern recognition
 */
const testQueries = [
  // Intention Templates
  'aku mau ngurus kepindahan',
  'pengen bikin surat pindah',
  'butuh buat skpwni',
  'saya mau mengurus pindah domisili',
  'perlu perpindahan',
  
  // Question Templates
  'eh, cara urus pindah domisili gimana?',
  'syarat kepindahan apa aja, bro?',
  'gimana ngurus perpindahan?',
  'kalo bikin surat pindah perlu apa?',
  'eh, ajukan migrasi butuh apa?',
  
  // Requirement Templates
  'butuh apa aja untuk migrasi?',
  'harus disiapin apa untuk pindah domisili?',
  'dokumen kepindahan apa yang diperlukan?',
  'apa yang kudu aku siapin untuk skpwni?',
  'syarat buat perpindahan apa aja?',
  
  // Institution Templates
  'di disdukcapil bisa urus kepindahan?',
  'kantor mana yang ngurus surat pindah?',
  'buat skpwni di disdukcapil dibutuhin apa?',
  'ngurus migrasi di disdukcapil butuh apa?',
  
  // Process Templates
  'kalo mau pindah domisili caranya gimana?',
  'cara daftar kepindahan di garut',
  'mau urus surat pindah apa yang dibawa?',
  'prosedur ajukan perpindahan gimana?',
  
  // Casual Templates
  'bro, ngurus skpwni dimana?',
  'eh, bikin surat pindah syaratnya apa?',
  'aku pengen urus kepindahan kudu apa?',
  'mau daftar migrasi syaratnya sih apa?',
  
  // Marriage-specific edge cases
  'beda domisili suami istri',
  'pindah setelah nikah',
  'pindah setelah menikah',
  'beda domisili pasangan',
  'suami istri beda kota',
  'pasangan beda daerah',
  
  // Official document references
  'surat keterangan pindah',
  'dokumen pindah',
  'berkas kepindahan',
  'formulir pindah',
  'f 1.03',
  
  // Process-related queries
  'cara pindah domisili',
  'prosedur kepindahan',
  'langkah pindah',
  'syarat pindah domisili',
  'persyaratan kepindahan',
  
  // Common variations
  'pindah tempat tinggal',
  'ganti domisili',
  'ubah domisili',
  'mutasi tempat tinggal',
  'relokasi',
  'pindah kota',
  'pindah daerah'
];

/**
 * Test the automated pattern generation for Kepindahan
 */
export function testKepindahanPatterns(): void {
  console.log('🧪 Testing Kepindahan Automated Pattern Generation\n');
  
  // Get Kepindahan configuration
  const kepindahanConfig = documentConfigurations.kepindahan;
  
  if (!kepindahanConfig) {
    console.error('❌ Kepindahan configuration not found!');
    return;
  }
  
  // Generate patterns automatically
  const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(kepindahanConfig);
  
  console.log(`📊 Generated ${generatedPatterns.length} patterns automatically\n`);
  
  // Test each query
  let successCount = 0;
  let totalQueries = testQueries.length;
  
  console.log('🔍 Testing Query Recognition:\n');
  
  testQueries.forEach((query, index) => {
    const matched = generatedPatterns.some(pattern => pattern.test(query));
    const status = matched ? '✅' : '❌';
    const category = getCategoryFromIndex(index);
    
    console.log(`${status} [${category}] "${query}"`);
    
    if (matched) {
      successCount++;
    }
  });
  
  // Calculate success rate
  const successRate = (successCount / totalQueries * 100).toFixed(1);
  const successRateNumber = parseFloat(successRate);

  console.log('\n📈 Test Results:');
  console.log(`✅ Successful matches: ${successCount}/${totalQueries}`);
  console.log(`📊 Success rate: ${successRate}%`);
  console.log(`🎯 Target: 95%+ (${successRateNumber >= 95 ? 'PASSED' : 'NEEDS IMPROVEMENT'})`);
  
  // Show pattern categories
  console.log('\n📋 Pattern Categories Generated:');
  console.log('• Intention Templates (aku mau, pengen, butuh)');
  console.log('• Question Templates (eh, gimana, syaratnya apa)');
  console.log('• Requirement Templates (butuh apa aja, harus disiapin)');
  console.log('• Institution Templates (disdukcapil, kantor)');
  console.log('• Process Templates (kalo mau, cara)');
  console.log('• Casual Templates (bro, informal expressions)');
  
  console.log('\n🎉 Kepindahan automated pattern generation test complete!');
}

/**
 * Get category name from test query index
 */
function getCategoryFromIndex(index: number): string {
  if (index < 5) return 'INTENTION';
  if (index < 10) return 'QUESTIONS';
  if (index < 15) return 'REQUIREMENTS';
  if (index < 19) return 'INSTITUTION';
  if (index < 23) return 'PROCESS';
  if (index < 27) return 'CASUAL';
  if (index < 33) return 'MARRIAGE';
  if (index < 38) return 'DOCUMENTS';
  if (index < 43) return 'PROCEDURES';
  return 'VARIATIONS';
}

/**
 * Run the test if this file is executed directly
 */
if (require.main === module) {
  testKepindahanPatterns();
}
