/**
 * Upstash Redis Connection Test Script
 * Comprehensive testing of Upstash Redis integration for SELLY AI
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { UpstashClient } from '../src/services/cache/upstashClient';
import { UpstashCacheService } from '../src/services/cache/upstashCacheService';
import { UpstashCacheServiceSingleton } from '../src/services/cache/UpstashCacheServiceFactory';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details?: string;
  error?: string;
}

class UpstashConnectionTester {
  private client: UpstashClient;
  private cacheService: UpstashCacheService;
  private results: TestResult[] = [];

  constructor() {
    try {
      this.client = UpstashClient.getInstance();
      this.cacheService = UpstashCacheServiceSingleton.getInstance('test');
    } catch (error) {
      console.error('❌ Failed to initialize Upstash client:', error);
      process.exit(1);
    }
  }

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting Upstash Redis Connection Tests for SELLY AI');
    console.log('=' .repeat(60));

    const tests = [
      () => this.testHealthCheck(),
      () => this.testBasicOperations(),
      () => this.testIndonesianTextSupport(),
      () => this.testTTLSupport(),
      () => this.testJSONDataSupport(),
      () => this.testCacheServiceOperations(),
      () => this.testIndonesianKeyGeneration(),
      () => this.testPerformanceMetrics(),
      () => this.testErrorHandling(),
      () => this.testCleanup()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Test execution failed:', error);
      }
    }

    this.printSummary();
    return this.results.every(result => result.success);
  }

  private async testHealthCheck(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('1. 🔍 Testing Health Check...');
      const isHealthy = await this.client.healthCheck();
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Health Check',
        success: isHealthy,
        duration,
        details: isHealthy ? 'Connection established successfully' : 'Health check failed'
      });
      
      console.log(`   ${isHealthy ? '✅' : '❌'} Health Status: ${isHealthy ? 'Healthy' : 'Unhealthy'} (${duration.toFixed(2)}ms)`);
      
      if (!isHealthy) {
        throw new Error('Health check failed - cannot proceed with other tests');
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Health Check',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Health Check Failed: ${error.message}`);
      throw error;
    }
  }

  private async testBasicOperations(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('2. 🔧 Testing Basic Operations...');
      
      // Test SET
      await this.client.set('test-basic', 'Hello SELLY!');
      
      // Test GET
      const result = await this.client.get('test-basic');
      const success = result === 'Hello SELLY!';
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Basic Operations',
        success,
        duration,
        details: success ? 'SET and GET operations successful' : `Expected 'Hello SELLY!', got '${result}'`
      });
      
      console.log(`   ${success ? '✅' : '❌'} Basic Operations: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Basic Operations',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Basic Operations Failed: ${error.message}`);
    }
  }

  private async testIndonesianTextSupport(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('3. 🇮🇩 Testing Indonesian Text Support...');
      
      const indonesianText = 'Selamat datang di SELLY AI untuk Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut! Persyaratan KTP: fotocopy KK, akta kelahiran, dan pas foto 3x4.';
      
      await this.client.set('test-indonesian', indonesianText);
      const result = await this.client.get('test-indonesian');
      const success = result === indonesianText;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Indonesian Text Support',
        success,
        duration,
        details: success ? 'Indonesian text stored and retrieved correctly' : 'Indonesian text corruption detected'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Indonesian Text: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
      if (success) {
        console.log(`   📝 Text length: ${indonesianText.length} characters`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Indonesian Text Support',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Indonesian Text Failed: ${error.message}`);
    }
  }

  private async testTTLSupport(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('4. ⏰ Testing TTL Support...');
      
      // Set with 2 second TTL
      await this.client.set('test-ttl', 'This will expire', 2);
      
      // Immediate check
      const immediateResult = await this.client.get('test-ttl');
      const immediateSuccess = immediateResult === 'This will expire';
      
      console.log(`   📝 TTL Set: ${immediateSuccess ? 'Success' : 'Failed'}`);
      
      // Wait for expiration
      console.log('   ⏳ Waiting 3 seconds for expiration...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check expiration
      const expiredResult = await this.client.get('test-ttl');
      const expirationSuccess = expiredResult === null;
      const duration = performance.now() - startTime;
      
      const overallSuccess = immediateSuccess && expirationSuccess;
      
      this.results.push({
        testName: 'TTL Support',
        success: overallSuccess,
        duration,
        details: overallSuccess ? 'TTL set and expiration working correctly' : 'TTL functionality failed'
      });
      
      console.log(`   ${overallSuccess ? '✅' : '❌'} TTL Expiration: ${expirationSuccess ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'TTL Support',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ TTL Support Failed: ${error.message}`);
    }
  }

  private async testJSONDataSupport(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('5. 📊 Testing JSON Data Support...');
      
      const jsonData = {
        query: 'persyaratan KTP baru',
        response: 'Untuk membuat KTP baru, Anda memerlukan: 1) Surat pengantar RT/RW, 2) Fotocopy KK, 3) Fotocopy akta kelahiran, 4) Pas foto 3x4 sebanyak 2 lembar',
        serviceType: 'ktp',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        metadata: {
          region: 'garut',
          language: 'indonesian'
        }
      };
      
      await this.client.set('test-json', jsonData);
      const result = await this.client.get('test-json');
      
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      const success = JSON.stringify(parsedResult) === JSON.stringify(jsonData);
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'JSON Data Support',
        success,
        duration,
        details: success ? 'Complex JSON data stored and retrieved correctly' : 'JSON data corruption or parsing error'
      });
      
      console.log(`   ${success ? '✅' : '❌'} JSON Data: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
      if (success) {
        console.log(`   📊 JSON size: ${JSON.stringify(jsonData).length} bytes`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'JSON Data Support',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ JSON Data Failed: ${error.message}`);
    }
  }

  private async testCacheServiceOperations(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('6. 🛠️ Testing Cache Service Operations...');
      
      const testData = {
        content: 'Informasi persyaratan KTP untuk warga Kabupaten Garut',
        serviceType: 'ktp',
        confidence: 0.9
      };
      
      // Test high-level cache service
      await this.cacheService.set('service-test', testData, 300, {
        version: '1.0',
        source: 'test-suite',
        serviceType: 'ktp'
      });
      
      const result = await this.cacheService.get('service-test');
      const success = result && result.content === testData.content;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Cache Service Operations',
        success,
        duration,
        details: success ? 'High-level cache service working correctly' : 'Cache service operations failed'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Cache Service: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Cache Service Operations',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Cache Service Failed: ${error.message}`);
    }
  }

  private async testIndonesianKeyGeneration(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('7. 🔑 Testing Indonesian Key Generation...');
      
      const queries = [
        'Bagaimana cara membuat KTP baru?',
        'persyaratan akta kelahiran',
        'Gimana ngurus kartu keluarga?'
      ];
      
      const keys = queries.map(query => this.cacheService.generateIndonesianKey(query, 'ktp'));
      const success = keys.every(key => key.startsWith('id:ktp:') && key.length > 10);
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Indonesian Key Generation',
        success,
        duration,
        details: success ? 'Indonesian query keys generated correctly' : 'Key generation failed'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Key Generation: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
      if (success) {
        console.log(`   🔑 Sample keys: ${keys.slice(0, 2).join(', ')}`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Indonesian Key Generation',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Key Generation Failed: ${error.message}`);
    }
  }

  private async testPerformanceMetrics(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('8. 📈 Testing Performance Metrics...');
      
      const metrics = this.client.getMetrics();
      const cacheStats = this.cacheService.getStats();
      
      const success = metrics.operations > 0 && typeof metrics.avgResponseTime === 'number';
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Performance Metrics',
        success,
        duration,
        details: success ? 'Metrics collection working correctly' : 'Metrics collection failed'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Metrics: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
      if (success) {
        console.log(`   📊 Operations: ${metrics.operations}, Avg Response: ${metrics.avgResponseTime.toFixed(2)}ms`);
        console.log(`   📈 Cache Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Performance Metrics',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Performance Metrics Failed: ${error.message}`);
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('9. 🛡️ Testing Error Handling...');
      
      // Test graceful handling of non-existent key
      const nonExistentResult = await this.cacheService.get('non-existent-key');
      const success = nonExistentResult === null;
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Error Handling',
        success,
        duration,
        details: success ? 'Error handling working correctly' : 'Error handling failed'
      });
      
      console.log(`   ${success ? '✅' : '❌'} Error Handling: ${success ? 'Success' : 'Failed'} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Error Handling',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Error Handling Failed: ${error.message}`);
    }
  }

  private async testCleanup(): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('10. 🧹 Testing Cleanup...');
      
      const keysToClean = [
        'test-basic',
        'test-indonesian', 
        'test-json',
        'service-test'
      ];
      
      for (const key of keysToClean) {
        await this.client.del(key);
      }
      
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName: 'Cleanup',
        success: true,
        duration,
        details: 'Test data cleaned up successfully'
      });
      
      console.log(`   ✅ Cleanup: Success (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.push({
        testName: 'Cleanup',
        success: false,
        duration,
        error: error.message
      });
      console.log(`   ❌ Cleanup Failed: ${error.message}`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️ Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.testName}: ${r.error || r.details}`);
        });
    }
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Upstash Redis is ready for SELLY AI integration.');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Run: pnpm dev');
      console.log('   2. Visit: http://localhost:3000/api/cache/health');
      console.log('   3. Begin Phase 1 implementation');
    } else {
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('   1. Verify UPSTASH_REDIS_REST_URL is correct');
      console.log('   2. Verify UPSTASH_REDIS_REST_TOKEN is correct');
      console.log('   3. Check network connectivity');
      console.log('   4. Ensure Upstash database is active');
    }
  }
}

// Run the test if this file is executed directly
async function main() {
  const tester = new UpstashConnectionTester();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { UpstashConnectionTester };
