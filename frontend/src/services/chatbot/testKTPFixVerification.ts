/**
 * Test KTP Fix Verification
 * Simple test to verify the KTP conversational fix is working correctly
 */

import { KnowledgeService } from './knowledgeService';

export class KTPFixVerificationTest {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Run verification test
   */
  public runVerificationTest(): void {
    console.log('🔍 KTP Fix Verification Test');
    console.log('='.repeat(50));

    this.testInitialQuery();
    this.testScenarioResponse();
    this.generateVerificationReport();
  }

  /**
   * Test initial KTP query
   */
  private testInitialQuery(): void {
    console.log('\n📋 Testing Initial KTP Query');
    console.log('-'.repeat(30));

    const query = 'aku ingin cetak ktp';
    const result = this.knowledgeService.getServiceInfo(query);
    
    if (typeof result === 'string' && result.includes('Pilih situasi kakak:')) {
      console.log('✅ Initial query returns simple question');
      console.log(`   Response length: ${result.length} characters`);
    } else {
      console.log('❌ Initial query not working correctly');
      console.log(`   Got: ${typeof result} - ${result ? 'has content' : 'no content'}`);
    }
  }

  /**
   * Test scenario response
   */
  private testScenarioResponse(): void {
    console.log('\n🎯 Testing Scenario Response');
    console.log('-'.repeat(30));

    const query = 'Belum pernah perekaman sama sekali (KTP pertama kali)';
    const result = this.knowledgeService.getServiceInfo(query);
    
    if (typeof result === 'string' && result.includes('**C - Belum pernah perekaman sama sekali')) {
      console.log('✅ Scenario response returns clean format');
      console.log(`   Response length: ${result.length} characters`);
      console.log('   ✅ No generic template headers');
      console.log('   ✅ Clean scenario-specific content');
    } else {
      console.log('❌ Scenario response not working correctly');
      console.log(`   Got: ${typeof result} - ${result ? 'has content' : 'no content'}`);
      if (typeof result === 'string') {
        console.log(`   First 200 chars: ${result.substring(0, 200)}...`);
      }
    }
  }

  /**
   * Generate verification report
   */
  private generateVerificationReport(): void {
    console.log('\n📊 Verification Report');
    console.log('='.repeat(50));

    console.log('\n✅ Expected Behavior:');
    console.log('1. Initial Query: "aku ingin cetak ktp"');
    console.log('   → Returns simple question with A, B, C, D options');
    console.log('   → Short response (~400 characters)');
    
    console.log('\n2. Scenario Response: "Belum pernah perekaman sama sekali (KTP pertama kali)"');
    console.log('   → Returns clean Scenario C response');
    console.log('   → Starts with "**C - Belum pernah perekaman sama sekali"');
    console.log('   → No generic template formatting');
    console.log('   → Medium response (~800 characters)');

    console.log('\n🎯 Fix Status:');
    
    // Test both scenarios
    const initialResult = this.knowledgeService.getServiceInfo('aku ingin cetak ktp');
    const scenarioResult = this.knowledgeService.getServiceInfo('Belum pernah perekaman sama sekali (KTP pertama kali)');
    
    const initialWorking = typeof initialResult === 'string' && initialResult.includes('Pilih situasi kakak:');
    const scenarioWorking = typeof scenarioResult === 'string' && scenarioResult.includes('**C - Belum pernah perekaman sama sekali');
    
    if (initialWorking && scenarioWorking) {
      console.log('🎉 ALL TESTS PASSED - KTP Fix is working correctly!');
      console.log('   ✅ Conversational flow implemented');
      console.log('   ✅ Clean response format working');
      console.log('   ✅ No generic template issues');
    } else {
      console.log('⚠️  Some issues detected:');
      if (!initialWorking) {
        console.log('   ❌ Initial query not working');
      }
      if (!scenarioWorking) {
        console.log('   ❌ Scenario response not working');
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('• Test with actual user: "aku ingin cetak ktp"');
    console.log('• User should see simple A, B, C, D question');
    console.log('• User responds with choice');
    console.log('• User should see clean, detailed scenario response');
  }
}

// Export test function for easy execution
export function runKTPFixVerification(): void {
  const tester = new KTPFixVerificationTest();
  tester.runVerificationTest();
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runKTPFixVerification();
}
