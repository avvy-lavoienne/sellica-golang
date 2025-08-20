/**
 * Test Akta Kelahiran Scenario Handling
 * Tests the new scenario response system for birth certificates
 */

import { KnowledgeService } from './knowledgeService';

export class AktaKelahiranScenarioTester {
  private knowledgeService: KnowledgeService;

  constructor() {
    this.knowledgeService = KnowledgeService.getInstance();
  }

  /**
   * Run all Akta Kelahiran scenario tests
   */
  public runAllTests(): void {
    console.log('🧪 TESTING AKTA KELAHIRAN SCENARIO HANDLING');
    console.log('='.repeat(60));

    this.testInitialQuery();
    this.testScenarioResponses();
    this.testCasualPatterns();
    this.testEdgeCases();

    console.log('\n✅ All Akta Kelahiran scenario tests completed!');
  }

  /**
   * Test initial Akta Kelahiran query (should show assessment)
   */
  private testInitialQuery(): void {
    console.log('\n📋 Testing Initial Query (Step 1)');
    console.log('-'.repeat(50));

    const queries = [
      'aku ingin membuat akta kelahiran',
      'syarat buat akta lahir',
      'cara bikin akta kelahiran',
      'mau ngurus akta kelahiran'
    ];

    queries.forEach(query => {
      const result = this.knowledgeService.getServiceInfo(query);
      let isAssessment = false;

      if (result) {
        const formattedResponse = this.knowledgeService.formatServiceResponse(result);
        isAssessment = formattedResponse.includes('Penilaian Situasi');
      }

      console.log(`✓ "${query}" → ${isAssessment ? 'Assessment shown' : 'ERROR: No assessment'}`);
    });
  }

  /**
   * Test scenario responses (A, B, C, D, E)
   */
  private testScenarioResponses(): void {
    console.log('\n🎯 Testing Scenario Responses (Step 2)');
    console.log('-'.repeat(50));

    const scenarios = [
      { input: 'A', expected: 'A - Bayi Baru Lahir', description: 'Scenario A - Letter' },
      { input: 'Bayi baru lahir (kurang dari 60 hari)', expected: 'A - Bayi Baru Lahir', description: 'Scenario A - Full text' },
      { input: 'B', expected: 'B - Anak Sudah Lahir Lama', description: 'Scenario B - Letter' },
      { input: 'terlambat daftar', expected: 'B - Anak Sudah Lahir Lama', description: 'Scenario B - Keyword' },
      { input: 'C', expected: 'C - Akta Kelahiran Hilang', description: 'Scenario C - Letter' },
      { input: 'akta kelahiran hilang', expected: 'C - Akta Kelahiran Hilang', description: 'Scenario C - Keyword' },
      { input: 'D', expected: 'D - Ada Kesalahan Data', description: 'Scenario D - Letter' },
      { input: 'kesalahan data di akta kelahiran', expected: 'D - Ada Kesalahan Data', description: 'Scenario D - Keyword' },
      { input: 'E', expected: 'E - Kelahiran di Luar Negeri', description: 'Scenario E - Letter' },
      { input: 'kelahiran di luar negeri', expected: 'E - Kelahiran di Luar Negeri', description: 'Scenario E - Keyword' }
    ];

    scenarios.forEach(scenario => {
      const result = this.knowledgeService.getServiceInfo(scenario.input);
      let isCorrectScenario = false;

      if (result) {
        if (typeof result === 'string') {
          isCorrectScenario = result.includes(scenario.expected);
        } else {
          const formattedResponse = this.knowledgeService.formatServiceResponse(result);
          isCorrectScenario = formattedResponse.includes(scenario.expected);
        }
      }

      console.log(`${isCorrectScenario ? '✓' : '✗'} ${scenario.description}: "${scenario.input}" → ${isCorrectScenario ? 'Correct scenario' : 'ERROR: Wrong/No response'}`);
    });
  }

  /**
   * Test casual Indonesian patterns
   */
  private testCasualPatterns(): void {
    console.log('\n💬 Testing Casual Indonesian Patterns');
    console.log('-'.repeat(50));

    const casualPatterns = [
      { input: 'baru lahir nih', expected: 'A - Bayi Baru Lahir' },
      { input: 'udah lahir lama tapi belum ada aktanya', expected: 'B - Anak Sudah Lahir Lama' },
      { input: 'akta kelahiran gue hilang', expected: 'C - Akta Kelahiran Hilang' },
      { input: 'ada yang salah di akta kelahiran', expected: 'D - Ada Kesalahan Data' },
      { input: 'lahir di luar negeri', expected: 'E - Kelahiran di Luar Negeri' }
    ];

    casualPatterns.forEach(pattern => {
      const result = this.knowledgeService.getServiceInfo(pattern.input);
      let isCorrectScenario = false;

      if (result) {
        if (typeof result === 'string') {
          isCorrectScenario = result.includes(pattern.expected);
        } else {
          const formattedResponse = this.knowledgeService.formatServiceResponse(result);
          isCorrectScenario = formattedResponse.includes(pattern.expected);
        }
      }

      console.log(`${isCorrectScenario ? '✓' : '✗'} "${pattern.input}" → ${isCorrectScenario ? 'Recognized' : 'Not recognized'}`);
    });
  }

  /**
   * Test edge cases and error handling
   */
  private testEdgeCases(): void {
    console.log('\n🔍 Testing Edge Cases');
    console.log('-'.repeat(50));

    const edgeCases = [
      'Z', // Invalid letter
      'scenario yang tidak ada', // Invalid scenario
      '', // Empty string
      'akta kelahiran xyz' // Unrecognized pattern
    ];

    edgeCases.forEach(edgeCase => {
      const result = this.knowledgeService.getServiceInfo(edgeCase);
      const handledGracefully = result === null || (typeof result === 'string' && result.includes('Penilaian Situasi'));
      
      console.log(`${handledGracefully ? '✓' : '✗'} "${edgeCase}" → ${handledGracefully ? 'Handled gracefully' : 'ERROR: Unexpected response'}`);
    });
  }
}

// Export for testing
export const testAktaKelahiranScenarios = () => {
  const tester = new AktaKelahiranScenarioTester();
  tester.runAllTests();
};

// Run tests if this file is executed directly
if (require.main === module) {
  testAktaKelahiranScenarios();
}
