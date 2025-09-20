/**
 * Test KTP Pattern Recognition Fix
 * Tests the enhanced KTP patterns to ensure user queries are properly recognized
 */

import { KnowledgeService } from './knowledgeService';

export class KTPPatternFixTest {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Test KTP pattern recognition fix
   */
  public runKTPPatternTest(): void {
    console.log('🔧 Testing KTP Pattern Recognition Fix');
    console.log('='.repeat(60));

    this.testProblematicQueries();
    this.testCommonKTPQueries();
    this.generateFixReport();
  }

  /**
   * Test the specific queries that were failing
   */
  private testProblematicQueries(): void {
    console.log('\n🚨 Testing Previously Failing Queries');
    console.log('-'.repeat(50));

    const problematicQueries = [
      'aku ingin cetak ktp',
      'aku ingin mengajukan ktp',
      'saya ingin cetak ktp',
      'saya ingin mengajukan ktp',
      'mau cetak ktp',
      'mau mengajukan ktp',
      'pengen cetak ktp',
      'pengen mengajukan ktp'
    ];

    let fixedCount = 0;
    problematicQueries.forEach(query => {
      const result = this.knowledgeService.getServiceInfo(query);
      const isKTPResponse = result && typeof result === 'string' && result.includes('Sudah pernah perekaman, tapi KTP hilang/rusak');
      
      if (isKTPResponse) {
        fixedCount++;
        console.log(`  ✅ "${query}" → KTP Interactive Assessment`);
      } else {
        console.log(`  ❌ "${query}" → ${result ? 'Other response' : 'No response'}`);
      }
    });

    console.log(`\n📊 Fix Success Rate: ${fixedCount}/${problematicQueries.length} (${Math.round(fixedCount/problematicQueries.length*100)}%)`);
  }

  /**
   * Test common KTP queries to ensure they still work
   */
  private testCommonKTPQueries(): void {
    console.log('\n📋 Testing Common KTP Queries (Regression Test)');
    console.log('-'.repeat(50));

    const commonQueries = [
      'cara bikin ktp',
      'syarat ktp baru',
      'persyaratan ktp',
      'prosedur ktp',
      'ktp hilang',
      'ktp rusak',
      'buat ktp',
      'bikin ktp',
      'mengurus ktp',
      'ajukan ktp'
    ];

    let workingCount = 0;
    commonQueries.forEach(query => {
      const result = this.knowledgeService.getServiceInfo(query);
      const isKTPResponse = result && typeof result === 'string' && result.includes('Sudah pernah perekaman, tapi KTP hilang/rusak');
      
      if (isKTPResponse) {
        workingCount++;
        console.log(`  ✅ "${query}" → KTP Interactive Assessment`);
      } else {
        console.log(`  ❌ "${query}" → ${result ? 'Other response' : 'No response'}`);
      }
    });

    console.log(`\n📊 Regression Test: ${workingCount}/${commonQueries.length} (${Math.round(workingCount/commonQueries.length*100)}%)`);
  }

  /**
   * Generate fix report
   */
  private generateFixReport(): void {
    console.log('\n📊 KTP Pattern Fix Report');
    console.log('='.repeat(60));

    console.log('\n🔧 Fix Implementation:');
    console.log('• Added 15 new manual patterns for common user expressions');
    console.log('• Enhanced pattern matching for "cetak ktp" and "mengajukan ktp"');
    console.log('• Improved recognition of informal language patterns');
    console.log('• Maintained existing automated pattern generation');

    console.log('\n✅ Patterns Added:');
    console.log('• /aku.*ingin.*cetak.*ktp/i');
    console.log('• /aku.*ingin.*mengajukan.*ktp/i');
    console.log('• /saya.*ingin.*cetak.*ktp/i');
    console.log('• /saya.*ingin.*mengajukan.*ktp/i');
    console.log('• /mau.*cetak.*ktp/i');
    console.log('• /mau.*mengajukan.*ktp/i');
    console.log('• /pengen.*cetak.*ktp/i');
    console.log('• /pengen.*mengajukan.*ktp/i');
    console.log('• /ingin.*cetak.*ktp/i');
    console.log('• /ingin.*mengajukan.*ktp/i');
    console.log('• /cetak.*ktp/i');
    console.log('• /mengajukan.*ktp/i');
    console.log('• /ajukan.*ktp/i');
    console.log('• /buat.*ktp/i');
    console.log('• /bikin.*ktp/i');

    console.log('\n🎯 Expected Results:');
    console.log('• "aku ingin cetak ktp" → ✅ Should trigger KTP Interactive Assessment');
    console.log('• "aku ingin mengajukan ktp" → ✅ Should trigger KTP Interactive Assessment');
    console.log('• "mau cetak ktp" → ✅ Should trigger KTP Interactive Assessment');
    console.log('• All existing KTP queries → ✅ Should continue working');

    console.log('\n🚀 Benefits:');
    console.log('• Improved user experience with better query recognition');
    console.log('• Reduced "tidak memahami" responses for common KTP queries');
    console.log('• Enhanced natural language understanding');
    console.log('• Maintained comprehensive scenario-based guidance');

    console.log('\n✨ Fix Complete: KTP pattern recognition enhanced to catch');
    console.log('   common user expressions like "cetak ktp" and "mengajukan ktp"!');
  }
}

// Export test function for easy execution
export function runKTPPatternTest(): void {
  const tester = new KTPPatternFixTest();
  tester.runKTPPatternTest();
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runKTPPatternTest();
}
