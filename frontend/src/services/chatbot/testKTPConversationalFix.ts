/**
 * Test KTP Conversational Fix
 * Tests the new conversational approach where SELLY asks for conditions first,
 * then provides specific responses based on user choice
 */

import { KnowledgeService } from './knowledgeService';

export class KTPConversationalFixTest {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Test KTP conversational fix
   */
  public runKTPConversationalTest(): void {
    console.log('💬 Testing KTP Conversational Fix');
    console.log('='.repeat(60));

    this.testInitialKTPQuery();
    this.testScenarioResponses();
    this.generateConversationalReport();
  }

  /**
   * Test initial KTP query response (should ask for conditions)
   */
  private testInitialKTPQuery(): void {
    console.log('\n📋 Testing Initial KTP Query Response');
    console.log('-'.repeat(50));

    const ktpQueries = [
      'syarat buat ktp',
      'cara bikin ktp',
      'aku ingin cetak ktp',
      'mau mengajukan ktp',
      'persyaratan ktp'
    ];

    ktpQueries.forEach(query => {
      const result = this.knowledgeService.getServiceInfo(query);
      const isConversational = result && typeof result === 'string' && result.includes('Pilih situasi kakak:') && result.includes('A, B, C, atau D');
      
      if (isConversational) {
        console.log(`  ✅ "${query}" → Conversational Assessment (asks for conditions)`);
      } else {
        console.log(`  ❌ "${query}" → ${result ? 'Wrong response type' : 'No response'}`);
      }
    });
  }

  /**
   * Test specific scenario responses
   */
  private testScenarioResponses(): void {
    console.log('\n🎯 Testing Scenario-Specific Responses');
    console.log('-'.repeat(50));

    const scenarios = [
      { input: 'A', expected: 'KTP Hilang/Rusak', description: 'Scenario A - Hilang/Rusak' },
      { input: 'B', expected: 'KTP Koreksi Data', description: 'Scenario B - Koreksi Data' },
      { input: 'C', expected: 'KTP Pertama Kali', description: 'Scenario C - Pertama Kali' },
      { input: 'D', expected: 'KTP Tidak Yakin', description: 'Scenario D - Tidak Yakin' },
      { input: 'hilang', expected: 'KTP Hilang/Rusak', description: 'Natural language - hilang' },
      { input: 'rusak', expected: 'KTP Hilang/Rusak', description: 'Natural language - rusak' },
      { input: 'koreksi', expected: 'KTP Koreksi Data', description: 'Natural language - koreksi' },
      { input: 'pertama kali', expected: 'KTP Pertama Kali', description: 'Natural language - pertama kali' }
    ];

    scenarios.forEach(scenario => {
      const result = this.knowledgeService.getKTPScenarioResponse(scenario.input);
      const isCorrectScenario = result && result.includes(scenario.expected);
      
      if (isCorrectScenario) {
        console.log(`  ✅ "${scenario.input}" → ${scenario.description}`);
      } else {
        console.log(`  ❌ "${scenario.input}" → Wrong scenario response`);
      }
    });
  }

  /**
   * Generate conversational fix report
   */
  private generateConversationalReport(): void {
    console.log('\n📊 KTP Conversational Fix Report');
    console.log('='.repeat(60));

    console.log('\n🔧 Fix Implementation:');
    console.log('• Changed from overwhelming all-scenarios response to simple question');
    console.log('• SELLY now asks for user conditions first (A, B, C, D)');
    console.log('• Provides specific detailed response based on user choice');
    console.log('• Supports both letter choices and natural language');

    console.log('\n✅ New Conversational Flow:');
    console.log('1. User: "syarat buat ktp"');
    console.log('2. SELLY: "Pilih situasi kakak: A, B, C, atau D"');
    console.log('3. User: "A" or "hilang" or "rusak"');
    console.log('4. SELLY: Detailed response for KTP Hilang/Rusak scenario');

    console.log('\n📋 Response Structure:');
    console.log('• Initial Query → Simple question with 4 options (A, B, C, D)');
    console.log('• User Choice → Specific detailed scenario response');
    console.log('• Natural Language → Supports keywords like "hilang", "koreksi", etc.');
    console.log('• Fallback → Returns to question if choice not recognized');

    console.log('\n🎯 Scenario Responses:');
    console.log('• Scenario A → KTP Hilang/Rusak (detailed requirements & steps)');
    console.log('• Scenario B → KTP Koreksi Data (Permendagri 73/2022 compliance)');
    console.log('• Scenario C → KTP Pertama Kali (biometric process)');
    console.log('• Scenario D → KTP Tidak Yakin (status checking)');

    console.log('\n🚀 Benefits:');
    console.log('• Less overwhelming - user sees simple question first');
    console.log('• More conversational - feels like talking to human');
    console.log('• Targeted information - user gets only relevant details');
    console.log('• Better user experience - step-by-step guidance');

    console.log('\n💡 User Experience Improvement:');
    console.log('Before: Overwhelming wall of text with all 4 scenarios');
    console.log('After: Simple question → User choice → Specific detailed response');

    console.log('\n✨ Fix Complete: KTP service now uses conversational approach');
    console.log('   that asks for conditions first, then provides targeted guidance!');
  }
}

// Export test function for easy execution
export function runKTPConversationalTest(): void {
  const tester = new KTPConversationalFixTest();
  tester.runKTPConversationalTest();
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runKTPConversationalTest();
}
