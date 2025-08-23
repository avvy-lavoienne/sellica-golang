/**
 * Multi-Service Test Cases for SELLY
 * Comprehensive test scenarios for cross-service query functionality
 */

export interface TestCase {
  id: string;
  name: string;
  query: string;
  expectedScenario: string | null;
  expectedServices: string[];
  expectedComplexity: 'simple' | 'moderate' | 'complex';
  description: string;
}

export const multiServiceTestCases: TestCase[] = [
  // Address Change Scenarios
  {
    id: 'address_change_1',
    name: 'Basic Address Change',
    query: 'Saya mau pindah domisili, dokumen apa saja yang perlu diperbarui?',
    expectedScenario: 'address_change',
    expectedServices: ['kepindahan', 'ktp_baru', 'kk_perubahan'],
    expectedComplexity: 'moderate',
    description: 'User asking about documents needed when changing address'
  },
  {
    id: 'address_change_2',
    name: 'Address Change with Children',
    query: 'Pindah rumah dengan anak kecil, dokumen apa yang harus diurus?',
    expectedScenario: 'address_change',
    expectedServices: ['kepindahan', 'ktp_baru', 'kk_perubahan', 'kia'],
    expectedComplexity: 'moderate',
    description: 'Address change scenario involving children under 17'
  },
  {
    id: 'address_change_3',
    name: 'Relocation Complete Process',
    query: 'Mau relokasi ke kota lain, semua dokumen apa yang perlu diperbarui?',
    expectedScenario: 'address_change',
    expectedServices: ['kepindahan', 'ktp_baru', 'kk_perubahan'],
    expectedComplexity: 'moderate',
    description: 'Complete relocation process inquiry'
  },

  // Marriage Documentation Scenarios
  {
    id: 'marriage_docs_1',
    name: 'Post-Marriage Documentation',
    query: 'Setelah nikah dokumen apa saja yang harus diurus?',
    expectedScenario: 'marriage_documentation',
    expectedServices: ['akta_perkawinan', 'kk_baru_marriage', 'ktp_baru'],
    expectedComplexity: 'complex',
    description: 'Complete post-marriage documentation process'
  },
  {
    id: 'marriage_docs_2',
    name: 'Marriage with Address Change',
    query: 'Habis menikah dan pindah rumah, dokumen apa yang perlu diurus?',
    expectedScenario: 'marriage_documentation',
    expectedServices: ['akta_perkawinan', 'kk_baru_marriage', 'ktp_baru', 'kepindahan'],
    expectedComplexity: 'complex',
    description: 'Marriage combined with address change'
  },
  {
    id: 'marriage_docs_3',
    name: 'New Family Formation',
    query: 'Baru nikah mau bikin keluarga baru, dokumen lengkap apa saja?',
    expectedScenario: 'marriage_documentation',
    expectedServices: ['akta_perkawinan', 'kk_baru_marriage', 'ktp_baru'],
    expectedComplexity: 'complex',
    description: 'New family formation after marriage'
  },

  // Child Birth Documentation Scenarios
  {
    id: 'child_birth_1',
    name: 'New Baby Documentation',
    query: 'Bayi baru lahir, dokumen apa saja yang harus diurus?',
    expectedScenario: 'child_birth_documentation',
    expectedServices: ['akta_kelahiran', 'kk_penambahan', 'kia'],
    expectedComplexity: 'moderate',
    description: 'Complete newborn documentation process'
  },
  {
    id: 'child_birth_2',
    name: 'Child Birth Complete Process',
    query: 'Anak lahir, perlu urus dokumen lengkap apa aja?',
    expectedScenario: 'child_birth_documentation',
    expectedServices: ['akta_kelahiran', 'kk_penambahan', 'kia'],
    expectedComplexity: 'moderate',
    description: 'Complete child birth documentation'
  },

  // Document Loss Recovery Scenarios
  {
    id: 'doc_loss_1',
    name: 'Multiple Document Loss',
    query: 'KTP dan KK hilang semua, gimana cara mengurusnya?',
    expectedScenario: 'document_loss_recovery',
    expectedServices: ['ktp_hilang', 'kk_penggantian', 'biodata_penduduk'],
    expectedComplexity: 'complex',
    description: 'Recovery from multiple document loss'
  },
  {
    id: 'doc_loss_2',
    name: 'Complete Document Loss',
    query: 'Semua dokumen hilang, harus mulai dari mana?',
    expectedScenario: 'document_loss_recovery',
    expectedServices: ['ktp_hilang', 'kk_penggantian', 'biodata_penduduk'],
    expectedComplexity: 'complex',
    description: 'Complete document loss recovery'
  },

  // General Multi-Service Queries
  {
    id: 'general_multi_1',
    name: 'General Document Update',
    query: 'Perlu update semua dokumen, apa saja yang harus diurus?',
    expectedScenario: null, // Should trigger general multi-service detection
    expectedServices: ['ktp_baru', 'kk_perubahan'],
    expectedComplexity: 'moderate',
    description: 'General document update inquiry'
  },
  {
    id: 'general_multi_2',
    name: 'Complete Document Process',
    query: 'Mau lengkapi semua dokumen kependudukan, prosedurnya gimana?',
    expectedScenario: null,
    expectedServices: ['ktp_baru', 'kk_baru', 'akta_kelahiran'],
    expectedComplexity: 'moderate',
    description: 'Complete civil registration documentation'
  }
];

/**
 * Test runner for multi-service functionality
 */
export class MultiServiceTestRunner {
  private knowledgeService: any; // Will be injected
  
  constructor(knowledgeService: any) {
    this.knowledgeService = knowledgeService;
  }

  /**
   * Run all test cases
   */
  public async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 [MULTI_SERVICE_TEST] Starting comprehensive test suite...');
    
    const results: TestResult[] = [];
    
    for (const testCase of multiServiceTestCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
    }
    
    this.printTestSummary(results);
    return results;
  }

  /**
   * Run a single test case
   */
  public async runSingleTest(testCase: TestCase): Promise<TestResult> {
    console.log(`\n🔍 [TEST] Running: ${testCase.name}`);
    console.log(`📝 [TEST] Query: "${testCase.query}"`);
    
    try {
      // Analyze the query
      const analysisResult = this.knowledgeService.analyzeMultiServiceQuery(testCase.query);
      
      // Check results
      const passed = this.validateTestResult(testCase, analysisResult);
      
      const result: TestResult = {
        testCase,
        analysisResult,
        passed,
        errors: passed ? [] : this.getValidationErrors(testCase, analysisResult)
      };
      
      console.log(`${passed ? '✅' : '❌'} [TEST] ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      
      if (!passed) {
        console.log(`🚨 [TEST] Errors:`, result.errors);
      }
      
      return result;
      
    } catch (error) {
      console.error(`💥 [TEST] Error in ${testCase.name}:`, error);
      
      return {
        testCase,
        analysisResult: null,
        passed: false,
        errors: [`Test execution error: ${error}`]
      };
    }
  }

  /**
   * Validate test result against expectations
   */
  private validateTestResult(testCase: TestCase, analysisResult: any): boolean {
    if (!analysisResult) return false;
    
    // Check if multi-service detection matches expectation
    const expectedMultiService = testCase.expectedServices.length > 1;
    if (analysisResult.isMultiService !== expectedMultiService) {
      return false;
    }
    
    // Check scenario detection (if expected)
    if (testCase.expectedScenario) {
      if (!analysisResult.scenario || analysisResult.scenario.scenarioId !== testCase.expectedScenario) {
        return false;
      }
    }
    
    // Check detected services (at least some overlap)
    const detectedServices = analysisResult.detectedServices || [];
    const hasServiceOverlap = testCase.expectedServices.some(service => 
      detectedServices.includes(service)
    );
    
    if (!hasServiceOverlap && testCase.expectedServices.length > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get validation errors for failed test
   */
  private getValidationErrors(testCase: TestCase, analysisResult: any): string[] {
    const errors: string[] = [];
    
    if (!analysisResult) {
      errors.push('Analysis result is null');
      return errors;
    }
    
    const expectedMultiService = testCase.expectedServices.length > 1;
    if (analysisResult.isMultiService !== expectedMultiService) {
      errors.push(`Multi-service detection mismatch: expected ${expectedMultiService}, got ${analysisResult.isMultiService}`);
    }
    
    if (testCase.expectedScenario) {
      if (!analysisResult.scenario) {
        errors.push(`Expected scenario '${testCase.expectedScenario}' but no scenario detected`);
      } else if (analysisResult.scenario.scenarioId !== testCase.expectedScenario) {
        errors.push(`Scenario mismatch: expected '${testCase.expectedScenario}', got '${analysisResult.scenario.scenarioId}'`);
      }
    }
    
    const detectedServices = analysisResult.detectedServices || [];
    const hasServiceOverlap = testCase.expectedServices.some(service => 
      detectedServices.includes(service)
    );
    
    if (!hasServiceOverlap && testCase.expectedServices.length > 0) {
      errors.push(`No service overlap: expected ${testCase.expectedServices.join(', ')}, detected ${detectedServices.join(', ')}`);
    }
    
    return errors;
  }

  /**
   * Print test summary
   */
  private printTestSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const passRate = (passed / results.length * 100).toFixed(1);
    
    console.log('\n📊 [MULTI_SERVICE_TEST] Test Summary:');
    console.log(`✅ Passed: ${passed}/${results.length} (${passRate}%)`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    
    if (failed > 0) {
      console.log('\n🚨 Failed Tests:');
      results.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.testCase.name}: ${result.errors.join(', ')}`);
      });
    }
  }
}

export interface TestResult {
  testCase: TestCase;
  analysisResult: any;
  passed: boolean;
  errors: string[];
}
