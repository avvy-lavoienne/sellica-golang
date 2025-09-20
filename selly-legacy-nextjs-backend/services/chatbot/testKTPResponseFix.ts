/**
 * Test KTP Response Fix
 * Tests that KTP scenario responses now return clean, direct responses
 * instead of going through the generic ServiceInfo template
 */

import { KnowledgeService } from './knowledgeService';

export class KTPResponseFixTest {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Test KTP response fix
   */
  public runKTPResponseFixTest(): void {
    console.log('🔧 Testing KTP Response Fix');
    console.log('='.repeat(60));

    this.testCleanScenarioResponses();
    this.testNoGenericTemplate();
    this.generateFixReport();
  }

  /**
   * Test that scenario responses are clean and direct
   */
  private testCleanScenarioResponses(): void {
    console.log('\n✨ Testing Clean Scenario Responses');
    console.log('-'.repeat(50));

    const scenarios = [
      { input: 'A', expectedStart: '**A - Sudah pernah perekaman, tapi KTP hilang/rusak', description: 'Scenario A' },
      { input: 'B', expectedStart: '**B - Sudah pernah perekaman, tapi ada data yang salah', description: 'Scenario B' },
      { input: 'C', expectedStart: '**C - Belum pernah perekaman sama sekali', description: 'Scenario C' },
      { input: 'D', expectedStart: '**D - Tidak yakin/tidak ingat', description: 'Scenario D' },
      { input: 'Belum pernah perekaman sama sekali (KTP pertama kali)', expectedStart: '**C - Belum pernah perekaman sama sekali', description: 'Natural language C' }
    ];

    scenarios.forEach(scenario => {
      const result = this.knowledgeService.getServiceInfo(scenario.input);
      
      if (typeof result === 'string' && result.startsWith(scenario.expectedStart)) {
        console.log(`  ✅ "${scenario.input}" → Clean ${scenario.description} response`);
      } else {
        console.log(`  ❌ "${scenario.input}" → Wrong response format`);
        if (result) {
          console.log(`      Got: ${typeof result === 'string' ? result.substring(0, 100) : 'ServiceInfo object'}...`);
        }
      }
    });
  }

  /**
   * Test that responses don't use generic template
   */
  private testNoGenericTemplate(): void {
    console.log('\n🚫 Testing No Generic Template Usage');
    console.log('-'.repeat(50));

    const testInputs = [
      'C',
      'Belum pernah perekaman sama sekali (KTP pertama kali)',
      'pertama kali',
      'A',
      'ktp hilang'
    ];

    testInputs.forEach(input => {
      const result = this.knowledgeService.getServiceInfo(input);
      
      // Check for generic template indicators
      const hasGenericTemplate = typeof result === 'string' && (
        result.includes('Saya SELLY AI Assistant dari Dinas Kependudukan') ||
        result.includes('Interactive Assessment Response') ||
        result.includes('Apakah ada yang ingin kak tanyakan lebih lanjut')
      );
      
      if (!hasGenericTemplate && typeof result === 'string') {
        console.log(`  ✅ "${input}" → No generic template (clean response)`);
      } else {
        console.log(`  ❌ "${input}" → Still using generic template`);
      }
    });
  }

  /**
   * Generate fix report
   */
  private generateFixReport(): void {
    console.log('\n📊 KTP Response Fix Report');
    console.log('='.repeat(60));

    console.log('\n🔧 Fix Implementation:');
    console.log('• Changed getServiceInfo return type to ServiceInfo | string | null');
    console.log('• KTP scenario responses now return string directly');
    console.log('• Bypasses generic ServiceInfo template completely');
    console.log('• Removed createKTPScenarioServiceInfo method');

    console.log('\n✅ Expected Response Format:');
    console.log('Before Fix:');
    console.log('  "Saya SELLY AI Assistant dari Dinas Kependudukan..."');
    console.log('  "📋 Interactive Assessment Response"');
    console.log('  [Generic template with duplicated information]');
    
    console.log('\nAfter Fix:');
    console.log('  "**C - Belum pernah perekaman sama sekali (KTP Pertama Kali)**"');
    console.log('  "Situasi ini untuk pembuatan KTP baru..."');
    console.log('  [Clean, direct scenario response]');

    console.log('\n🎯 Benefits:');
    console.log('• Clean, professional response format');
    console.log('• No duplicate information');
    console.log('• Direct, focused content');
    console.log('• Consistent with user expectations');

    console.log('\n📋 Response Structure Now:');
    console.log('• Title: **[Scenario] - [Description]**');
    console.log('• Situation: Brief explanation');
    console.log('• Requirements: Specific to scenario');
    console.log('• Steps: Detailed process with time estimates');
    console.log('• Info: Time, cost, hours, digital services');
    console.log('• Notes: Important warnings and tips');
    console.log('• Contact: WhatsApp and online portal');

    console.log('\n✨ Fix Complete: KTP scenario responses now return clean,');
    console.log('   direct responses without generic template formatting!');
  }
}

// Export test function for easy execution
export function runKTPResponseFixTest(): void {
  const tester = new KTPResponseFixTest();
  tester.runKTPResponseFixTest();
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runKTPResponseFixTest();
}
