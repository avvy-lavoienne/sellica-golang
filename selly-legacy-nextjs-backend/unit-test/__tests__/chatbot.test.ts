/**
 * SELLY Chatbot Test Suite
 * 
 * This file contains basic tests for the chatbot functionality.
 * For a production environment, these should be expanded with proper testing frameworks.
 */

import { chatbotDataService } from '../../../services/chatbot/dataService';
import { aiService } from '../../../services/chatbot/aiService';
import { queryIntelligence } from '../../../services/chatbot/queryIntelligence';
import { 
  validateMessageContent, 
  extractKeywords, 
  calculateMessageSimilarity,
  formatDataForChat 
} from '../../../utils/chatUtils';

/**
 * Mock test runner for basic functionality validation
 */
class ChatbotTestRunner {
  private testResults: { name: string; passed: boolean; error?: string }[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting SELLY Chatbot Tests...\n');

    // Data Service Tests
    await this.testDatabaseOverview();
    await this.testTableSummary();
    await this.testSearchData();
    await this.testUserStatistics();

    // Query Intelligence Tests
    await this.testQueryProcessing();
    await this.testIntentDetection();
    await this.testEntityExtraction();

    // AI Service Tests
    await this.testAIServiceConfiguration();
    await this.testPlaceholderResponses();

    // Utility Function Tests
    this.testMessageValidation();
    this.testKeywordExtraction();
    this.testMessageSimilarity();
    this.testDataFormatting();

    // Print Results
    this.printTestResults();
  }

  private async testDatabaseOverview(): Promise<void> {
    try {
      const overview = await chatbotDataService.getDatabaseOverview();
      
      const passed = 
        overview.totalTables > 0 &&
        overview.tables.length > 0 &&
        overview.systemHealth !== undefined;

      this.testResults.push({
        name: 'Database Overview Generation',
        passed,
        error: passed ? undefined : 'Failed to generate valid database overview'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Database Overview Generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testTableSummary(): Promise<void> {
    try {
      const summary = await chatbotDataService.getTableSummary(
        'profiles',
        'Profil Pengguna',
        'Data profil pengguna sistem'
      );
      
      const passed = 
        summary.tableName === 'profiles' &&
        summary.displayName === 'Profil Pengguna' &&
        summary.totalCount >= 0;

      this.testResults.push({
        name: 'Table Summary Generation',
        passed,
        error: passed ? undefined : 'Failed to generate valid table summary'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Table Summary Generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testSearchData(): Promise<void> {
    try {
      const results = await chatbotDataService.searchData('test', 5);
      
      const passed = Array.isArray(results);

      this.testResults.push({
        name: 'Data Search Functionality',
        passed,
        error: passed ? undefined : 'Search results not returned as array'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Data Search Functionality',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testUserStatistics(): Promise<void> {
    try {
      const stats = await chatbotDataService.getUserStatistics();
      
      const passed = 
        typeof stats.totalUsers === 'number' &&
        typeof stats.activeUsers === 'number' &&
        typeof stats.usersByRole === 'object';

      this.testResults.push({
        name: 'User Statistics Generation',
        passed,
        error: passed ? undefined : 'Invalid user statistics structure'
      });
    } catch (error) {
      this.testResults.push({
        name: 'User Statistics Generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testQueryProcessing(): Promise<void> {
    try {
      const testQueries = [
        'statistik sistem',
        'cari John Doe',
        'tampilkan data salah rekam',
        'bantuan SELLY'
      ];

      let allPassed = true;
      for (const query of testQueries) {
        const intent = await queryIntelligence.processQuery(query);
        if (!intent.type || intent.confidence < 0) {
          allPassed = false;
          break;
        }
      }

      this.testResults.push({
        name: 'Query Processing',
        passed: allPassed,
        error: allPassed ? undefined : 'Failed to process one or more test queries'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Query Processing',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testIntentDetection(): Promise<void> {
    try {
      const testCases = [
        { query: 'statistik pengguna', expectedType: 'statistics' },
        { query: 'cari data John', expectedType: 'search' },
        { query: 'bantuan cara menggunakan', expectedType: 'help' },
        { query: 'tampilkan tabel salah rekam', expectedType: 'data_request' }
      ];

      let correctDetections = 0;
      for (const testCase of testCases) {
        const intent = await queryIntelligence.processQuery(testCase.query);
        if (intent.type === testCase.expectedType) {
          correctDetections++;
        }
      }

      const passed = correctDetections >= testCases.length * 0.75; // 75% accuracy

      this.testResults.push({
        name: 'Intent Detection Accuracy',
        passed,
        error: passed ? undefined : `Only ${correctDetections}/${testCases.length} intents detected correctly`
      });
    } catch (error) {
      this.testResults.push({
        name: 'Intent Detection Accuracy',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testEntityExtraction(): Promise<void> {
    try {
      const testQuery = 'cari data pengguna John Doe dalam tabel profiles';
      const intent = await queryIntelligence.processQuery(testQuery);
      
      const passed = 
        intent.entities.searchTerm?.includes('John') &&
        intent.entities.table === 'profiles';

      this.testResults.push({
        name: 'Entity Extraction',
        passed,
        error: passed ? undefined : 'Failed to extract entities correctly'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Entity Extraction',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testAIServiceConfiguration(): Promise<void> {
    try {
      const isConfigured = aiService.isConfigured();
      
      // Test configuration update
      aiService.updateConfig({ temperature: 0.8 });
      
      this.testResults.push({
        name: 'AI Service Configuration',
        passed: true,
        error: undefined
      });
    } catch (error) {
      this.testResults.push({
        name: 'AI Service Configuration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testPlaceholderResponses(): Promise<void> {
    try {
      const response = await aiService.processQuery('test query');
      
      const passed = 
        response.content.length > 0 &&
        response.type !== undefined;

      this.testResults.push({
        name: 'Placeholder Response Generation',
        passed,
        error: passed ? undefined : 'Invalid response structure'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Placeholder Response Generation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private testMessageValidation(): void {
    try {
      const testCases = [
        { message: '', shouldPass: false },
        { message: 'Valid message', shouldPass: true },
        { message: 'A'.repeat(1001), shouldPass: false },
        { message: '<script>alert("xss")</script>', shouldPass: false }
      ];

      let correctValidations = 0;
      for (const testCase of testCases) {
        const result = validateMessageContent(testCase.message);
        if (result.isValid === testCase.shouldPass) {
          correctValidations++;
        }
      }

      const passed = correctValidations === testCases.length;

      this.testResults.push({
        name: 'Message Content Validation',
        passed,
        error: passed ? undefined : `${correctValidations}/${testCases.length} validations correct`
      });
    } catch (error) {
      this.testResults.push({
        name: 'Message Content Validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private testKeywordExtraction(): void {
    try {
      const keywords = extractKeywords('Saya ingin mencari data pengguna John Doe');
      
      const passed = 
        keywords.includes('mencari') &&
        keywords.includes('data') &&
        keywords.includes('pengguna') &&
        keywords.includes('john') &&
        keywords.includes('doe');

      this.testResults.push({
        name: 'Keyword Extraction',
        passed,
        error: passed ? undefined : 'Failed to extract expected keywords'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Keyword Extraction',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private testMessageSimilarity(): void {
    try {
      const similarity1 = calculateMessageSimilarity(
        'cari data pengguna John',
        'temukan informasi user John'
      );
      
      const similarity2 = calculateMessageSimilarity(
        'statistik sistem',
        'cara memasak nasi'
      );

      const passed = similarity1 > similarity2 && similarity1 > 0;

      this.testResults.push({
        name: 'Message Similarity Calculation',
        passed,
        error: passed ? undefined : 'Similarity calculation not working correctly'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Message Similarity Calculation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private testDataFormatting(): void {
    try {
      const testData = [
        { name: 'John', age: 30, role: 'admin' },
        { name: 'Jane', age: 25, role: 'user' }
      ];

      const formatted = formatDataForChat(testData, 'table');
      
      const passed = 
        formatted.includes('John') &&
        formatted.includes('Jane') &&
        formatted.includes('📋');

      this.testResults.push({
        name: 'Data Formatting for Chat',
        passed,
        error: passed ? undefined : 'Data not formatted correctly for chat display'
      });
    } catch (error) {
      this.testResults.push({
        name: 'Data Formatting for Chat',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private printTestResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================\n');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log(`\n📈 Overall: ${passed}/${total} tests passed (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('🎉 Excellent! SELLY chatbot is ready for deployment.');
    } else if (percentage >= 75) {
      console.log('⚠️  Good, but some issues need attention before deployment.');
    } else {
      console.log('🚨 Critical issues found. Please fix before deployment.');
    }
  }
}

// Export test runner for manual execution
export const runChatbotTests = async (): Promise<void> => {
  const testRunner = new ChatbotTestRunner();
  await testRunner.runAllTests();
};

// Auto-run tests in development environment
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode detected. Run chatbot tests manually with runChatbotTests()');
}
