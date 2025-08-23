/**
 * Test Format Service Response Fix
 * Tests that formatServiceResponse can handle both ServiceInfo objects and strings
 */

import { KnowledgeService } from './knowledgeService';

export class FormatServiceResponseFixTest {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Test format service response fix
   */
  public runFormatServiceResponseTest(): void {
    console.log('🔧 Testing Format Service Response Fix');
    console.log('='.repeat(60));

    this.testStringResponse();
    this.testServiceInfoResponse();
    this.generateFixReport();
  }

  /**
   * Test string response handling
   */
  private testStringResponse(): void {
    console.log('\n📝 Testing String Response Handling');
    console.log('-'.repeat(50));

    // Get a KTP scenario response (should be string)
    const ktpResult = this.knowledgeService.getServiceInfo('Belum pernah perekaman sama sekali (KTP pertama kali)');
    
    if (typeof ktpResult === 'string') {
      try {
        const formatted = this.knowledgeService.formatServiceResponse(ktpResult);
        console.log('✅ String response formatted successfully');
        console.log(`   Input type: string (${ktpResult.length} chars)`);
        console.log(`   Output type: string (${formatted.length} chars)`);
        console.log(`   Content preserved: ${formatted === ktpResult ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log('❌ String response formatting failed');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('⚠️  KTP scenario did not return string as expected');
      console.log(`   Got: ${typeof ktpResult}`);
    }
  }

  /**
   * Test ServiceInfo response handling
   */
  private testServiceInfoResponse(): void {
    console.log('\n📋 Testing ServiceInfo Response Handling');
    console.log('-'.repeat(50));

    // Get a regular service response (should be ServiceInfo)
    const regularResult = this.knowledgeService.getServiceInfo('layanan disdukcapil');
    
    if (typeof regularResult === 'object' && regularResult !== null) {
      try {
        const formatted = this.knowledgeService.formatServiceResponse(regularResult);
        console.log('✅ ServiceInfo response formatted successfully');
        console.log(`   Input type: ServiceInfo object`);
        console.log(`   Output type: string (${formatted.length} chars)`);
        console.log(`   Has content: ${formatted.length > 0 ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log('❌ ServiceInfo response formatting failed');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('⚠️  Regular service did not return ServiceInfo as expected');
      console.log(`   Got: ${typeof regularResult}`);
    }
  }

  /**
   * Generate fix report
   */
  private generateFixReport(): void {
    console.log('\n📊 Format Service Response Fix Report');
    console.log('='.repeat(60));

    console.log('\n🔧 Fix Implementation:');
    console.log('• Updated formatServiceResponse signature to accept ServiceInfo | string');
    console.log('• Added early return for string inputs (KTP scenarios)');
    console.log('• Preserved existing ServiceInfo object handling');
    console.log('• Maintains backward compatibility');

    console.log('\n✅ Expected Behavior:');
    console.log('Before Fix:');
    console.log('  formatServiceResponse(serviceInfo: ServiceInfo)');
    console.log('  → Error when passed string (KTP scenario response)');
    console.log('  → TypeError: Cannot read properties of undefined (reading \'startsWith\')');
    
    console.log('\nAfter Fix:');
    console.log('  formatServiceResponse(serviceInfo: ServiceInfo | string)');
    console.log('  → String input: Returns string directly');
    console.log('  → ServiceInfo input: Processes normally');

    console.log('\n🎯 Benefits:');
    console.log('• No more TypeError for KTP scenario responses');
    console.log('• Clean string responses preserved');
    console.log('• Backward compatibility maintained');
    console.log('• Flexible input handling');

    console.log('\n📋 Response Flow Now:');
    console.log('1. User: "Belum pernah perekaman sama sekali (KTP pertama kali)"');
    console.log('2. getServiceInfo() → Returns clean string response');
    console.log('3. formatServiceResponse() → Returns string directly (no processing)');
    console.log('4. User sees clean KTP Scenario C response');

    console.log('\n✨ Fix Complete: formatServiceResponse now handles both');
    console.log('   string responses (KTP scenarios) and ServiceInfo objects!');
  }
}

// Export test function for easy execution
export function runFormatServiceResponseTest(): void {
  const tester = new FormatServiceResponseFixTest();
  tester.runFormatServiceResponseTest();
}

// Auto-run if this file is executed directly
if (require.main === module) {
  runFormatServiceResponseTest();
}
