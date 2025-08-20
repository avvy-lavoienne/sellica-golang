/**
 * Custom Jest Test Sequencer for SELLY AI Assistant
 * Optimizes test execution order for better performance
 */

const Sequencer = require('@jest/test-sequencer').default;

class SELLYTestSequencer extends Sequencer {
  /**
   * Sort tests to optimize execution order
   * 1. Unit tests first (fastest)
   * 2. Integration tests second
   * 3. End-to-end tests last (slowest)
   */
  sort(tests) {
    // Define test priorities (lower number = higher priority)
    const testPriorities = {
      'temporalIntelligence.test.ts': 1,
      'indonesianNLP.test.ts': 2,
      'databaseIntelligence.test.ts': 3,
      'aiService.integration.test.ts': 4,
      'endToEnd.test.ts': 5
    };
    
    // Sort tests by priority, then by file size (smaller first)
    return tests.sort((testA, testB) => {
      const fileNameA = testA.path.split('/').pop() || '';
      const fileNameB = testB.path.split('/').pop() || '';
      
      const priorityA = testPriorities[fileNameA] || 999;
      const priorityB = testPriorities[fileNameB] || 999;
      
      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then sort by file size (smaller files typically run faster)
      const sizeA = testA.context?.config?.testPathIgnorePatterns?.length || 0;
      const sizeB = testB.context?.config?.testPathIgnorePatterns?.length || 0;
      
      return sizeA - sizeB;
    });
  }
  
  /**
   * Determine if tests should run in parallel
   * Disable parallel execution for performance-sensitive tests
   */
  allFailedTests(tests) {
    // Run failed tests first in subsequent runs
    return tests.filter(test => {
      const fileName = test.path.split('/').pop() || '';
      
      // Always run end-to-end tests last, even if they failed
      if (fileName === 'endToEnd.test.ts') {
        return false;
      }
      
      return true;
    });
  }
}

module.exports = SELLYTestSequencer;
