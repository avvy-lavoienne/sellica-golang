#!/usr/bin/env node

/**
 * Validation script for Multi-Model IndoBERT Enhancement
 * Tests the complete integration from frontend to backend
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

class EnhancementValidator {
  constructor() {
    this.serviceUrl = process.env.INDOBERT_SERVICE_URL || 'http://localhost:8000';
    this.frontendUrl = 'http://localhost:3000';
    this.testResults = [];
  }

  logTest(testName, success, details = {}) {
    const result = { test: testName, success, details, timestamp: Date.now() };
    this.testResults.push(result);
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}`);
    
    Object.entries(details).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }

  async validateBackendService() {
    console.log('\n🔧 Validating Backend Service');
    
    // Test service health
    try {
      const response = await fetch(`${this.serviceUrl}/`);
      if (response.ok) {
        const data = await response.json();
        this.logTest('Backend Service Health', true, {
          status: data.status,
          models_loaded: data.models_loaded,
          pipelines_available: data.pipelines_available
        });
      } else {
        this.logTest('Backend Service Health', false, { error: `HTTP ${response.status}` });
        return false;
      }
    } catch (error) {
      this.logTest('Backend Service Health', false, { error: error.message });
      return false;
    }

    // Test enhanced endpoints
    const endpoints = [
      '/models',
      '/memory-status', 
      '/cache-stats',
      '/performance-stats'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.serviceUrl}${endpoint}`);
        const success = response.ok;
        this.logTest(`Endpoint ${endpoint}`, success, {
          status: response.status,
          response_time: `${Date.now() - Date.now()}ms`
        });
      } catch (error) {
        this.logTest(`Endpoint ${endpoint}`, false, { error: error.message });
      }
    }

    return true;
  }

  async validateModelSelection() {
    console.log('\n🧠 Validating Model Selection');
    
    const testCases = [
      { text: "Halo SELLY", expected: "indobert-lite", type: "greeting" },
      { text: "Saya sangat senang dengan fitur baru ini", expected: "indobert-sentiment", type: "sentiment" },
      { text: "Siapa nama CEO perusahaan?", expected: "indobert-ner", type: "entity" },
      { text: "Tolong jelaskan secara detail bagaimana sistem keamanan database dapat ditingkatkan untuk mencegah serangan cyber", expected: "indobert-large", type: "complex" }
    ];

    let correctSelections = 0;

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${this.serviceUrl}/test-model-selection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: testCase.text, optimization: 'balanced' })
        });

        if (response.ok) {
          const result = await response.json();
          const isCorrect = result.selected_model === testCase.expected;
          
          if (isCorrect) correctSelections++;

          this.logTest(`Model Selection - ${testCase.type}`, isCorrect, {
            text: testCase.text.substring(0, 40) + '...',
            expected: testCase.expected,
            selected: result.selected_model,
            tasks: result.determined_tasks.join(', ')
          });
        } else {
          this.logTest(`Model Selection - ${testCase.type}`, false, { error: `HTTP ${response.status}` });
        }
      } catch (error) {
        this.logTest(`Model Selection - ${testCase.type}`, false, { error: error.message });
      }
    }

    const accuracy = (correctSelections / testCases.length) * 100;
    this.logTest('Model Selection Accuracy', accuracy >= 75, { accuracy: `${accuracy.toFixed(1)}%` });

    return accuracy >= 75;
  }

  async validateAdvancedProcessing() {
    console.log('\n🔬 Validating Advanced Processing');
    
    const testQueries = [
      {
        text: "Saya sangat kecewa dengan pelayanan yang lambat dan tidak responsif",
        expectedTasks: ["feature-extraction", "sentiment-analysis"],
        expectedSentiment: "NEGATIVE"
      },
      {
        text: "Siapa direktur utama PT Bank Mandiri dan dimana kantor pusatnya?",
        expectedTasks: ["feature-extraction", "token-classification"],
        expectedEntities: ["PT Bank Mandiri"]
      },
      {
        text: "Halo, selamat pagi!",
        expectedTasks: ["feature-extraction"],
        expectedModel: "indobert-lite"
      }
    ];

    let successfulProcessing = 0;

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.serviceUrl}/process-advanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: query.text,
            optimization: 'balanced'
          })
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          
          if (result.success) {
            successfulProcessing++;
            
            const details = {
              response_time: `${responseTime}ms`,
              server_time: `${(result.processing_time * 1000).toFixed(0)}ms`,
              models_used: result.models_used.join(', '),
              tasks_performed: result.tasks_performed.join(', ')
            };

            // Validate sentiment if expected
            if (query.expectedSentiment && result.results['sentiment-analysis']) {
              const sentiment = result.results['sentiment-analysis'][0];
              details.sentiment = `${sentiment.label} (${(sentiment.score * 100).toFixed(1)}%)`;
            }

            // Validate entities if expected
            if (query.expectedEntities && result.results['token-classification']) {
              const entities = result.results['token-classification'];
              details.entities_found = entities.length;
              if (entities.length > 0) {
                details.entities = entities.map(e => `${e.word} (${e.entity})`).join(', ');
              }
            }

            this.logTest(`Advanced Processing ${i + 1}`, true, details);
          } else {
            this.logTest(`Advanced Processing ${i + 1}`, false, { error: result.error });
          }
        } else {
          this.logTest(`Advanced Processing ${i + 1}`, false, { error: `HTTP ${response.status}` });
        }
      } catch (error) {
        this.logTest(`Advanced Processing ${i + 1}`, false, { error: error.message });
      }
    }

    const successRate = (successfulProcessing / testQueries.length) * 100;
    this.logTest('Advanced Processing Success Rate', successRate >= 80, { 
      success_rate: `${successRate.toFixed(1)}%` 
    });

    return successRate >= 80;
  }

  async validateFrontendIntegration() {
    console.log('\n🌐 Validating Frontend Integration');
    
    const testMessages = [
      "Halo SELLY, apa kabar hari ini?",
      "Saya sangat senang dengan fitur IndoBERT yang baru",
      "Siapa nama presiden Indonesia saat ini?",
      "Tolong analisis performa sistem database"
    ];

    let successfulIntegrations = 0;

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.frontendUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            context: { test: true, useAdvancedIndoBERT: true }
          })
        });
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          
          if (result.response) {
            successfulIntegrations++;
            
            this.logTest(`Frontend Integration ${i + 1}`, true, {
              message: message.substring(0, 30) + '...',
              response_time: `${responseTime}ms`,
              ai_provider: result.metadata?.aiProvider || 'unknown',
              processing_time: `${result.metadata?.processingTime || 0}ms`,
              confidence: `${((result.metadata?.confidence || 0) * 100).toFixed(1)}%`,
              ai_enhanced: result.metadata?.aiEnhanced ? 'Yes' : 'No'
            });
          } else {
            this.logTest(`Frontend Integration ${i + 1}`, false, { error: 'No response content' });
          }
        } else {
          this.logTest(`Frontend Integration ${i + 1}`, false, { error: `HTTP ${response.status}` });
        }
      } catch (error) {
        this.logTest(`Frontend Integration ${i + 1}`, false, { error: error.message });
      }
    }

    const integrationRate = (successfulIntegrations / testMessages.length) * 100;
    this.logTest('Frontend Integration Success Rate', integrationRate >= 75, {
      success_rate: `${integrationRate.toFixed(1)}%`
    });

    return integrationRate >= 75;
  }

  async validatePerformance() {
    console.log('\n⚡ Validating Performance');
    
    const testQuery = "Halo SELLY, bagaimana cara menggunakan fitur analisis sentiment?";
    const iterations = 5;
    
    // Test response times
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.serviceUrl}/process-advanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: testQuery,
            optimization: 'speed'
          })
        });
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            responseTimes.push(responseTime);
          }
        }
      } catch (error) {
        console.log(`   Performance test ${i + 1} failed: ${error.message}`);
      }
    }

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      this.logTest('Performance Benchmarks', avgResponseTime < 3000, {
        average_time: `${avgResponseTime.toFixed(0)}ms`,
        min_time: `${minResponseTime}ms`,
        max_time: `${maxResponseTime}ms`,
        iterations: responseTimes.length
      });

      return avgResponseTime < 3000;
    } else {
      this.logTest('Performance Benchmarks', false, { error: 'No successful performance tests' });
      return false;
    }
  }

  async runValidation() {
    console.log('🔍 Multi-Model IndoBERT Enhancement Validation');
    console.log('=' * 60);
    
    const validationSteps = [
      { name: 'Backend Service', fn: () => this.validateBackendService() },
      { name: 'Model Selection', fn: () => this.validateModelSelection() },
      { name: 'Advanced Processing', fn: () => this.validateAdvancedProcessing() },
      { name: 'Frontend Integration', fn: () => this.validateFrontendIntegration() },
      { name: 'Performance', fn: () => this.validatePerformance() }
    ];

    const results = [];
    
    for (const step of validationSteps) {
      try {
        const success = await step.fn();
        results.push({ name: step.name, success });
      } catch (error) {
        console.log(`❌ ${step.name} validation failed: ${error.message}`);
        results.push({ name: step.name, success: false, error: error.message });
      }
    }

    // Generate summary
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.success).length;
    const failedSteps = totalSteps - passedSteps;

    console.log('\n' + '=' * 60);
    console.log('🎯 Validation Summary');
    console.log(`Total Steps: ${totalSteps}`);
    console.log(`✅ Passed: ${passedSteps}`);
    console.log(`❌ Failed: ${failedSteps}`);
    console.log(`Success Rate: ${((passedSteps / totalSteps) * 100).toFixed(1)}%`);

    if (failedSteps > 0) {
      console.log('\n❌ Failed Validations:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.name}: ${result.error || 'Validation failed'}`);
      });
    }

    const overallSuccess = passedSteps === totalSteps;
    
    if (overallSuccess) {
      console.log('\n🎉 All validations passed! Multi-Model IndoBERT Enhancement is ready for production.');
    } else {
      console.log('\n⚠️ Some validations failed. Please address the issues before deployment.');
    }

    return overallSuccess;
  }
}

async function main() {
  const validator = new EnhancementValidator();
  const success = await validator.runValidation();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnhancementValidator };
