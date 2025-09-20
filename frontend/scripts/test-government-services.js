#!/usr/bin/env node

/**
 * SELLY AI Government Services Integration Test
 * Tests Indonesian government service responses (KTP, KK, Akta)
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const BACKEND_URL = 'http://localhost:8080';

// Indonesian Government Service Test Cases
const GOVERNMENT_SERVICE_TESTS = [
  {
    name: 'KTP Service - New Application',
    query: 'Bagaimana cara membuat KTP baru? Dokumen apa saja yang diperlukan?',
    expectedKeywords: ['KTP', 'dokumen', 'dinas', 'kependudukan', 'persyaratan'],
    serviceType: 'KTP',
  },
  {
    name: 'KTP Service - Lost Card',
    query: 'KTP saya hilang, bagaimana prosedur pengurusan KTP pengganti?',
    expectedKeywords: ['KTP', 'hilang', 'pengganti', 'prosedur', 'surat kehilangan'],
    serviceType: 'KTP',
  },
  {
    name: 'Kartu Keluarga - New Family',
    query: 'Prosedur pembuatan Kartu Keluarga baru untuk keluarga yang baru menikah',
    expectedKeywords: ['Kartu Keluarga', 'KK', 'menikah', 'prosedur', 'dokumen'],
    serviceType: 'KK',
  },
  {
    name: 'Kartu Keluarga - Lost Card',
    query: 'Kartu Keluarga hilang, bagaimana cara mengurusnya?',
    expectedKeywords: ['Kartu Keluarga', 'KK', 'hilang', 'prosedur', 'pengganti'],
    serviceType: 'KK',
  },
  {
    name: 'Akta Kelahiran - New Birth',
    query: 'Bagaimana cara mengurus akta kelahiran untuk bayi yang baru lahir?',
    expectedKeywords: ['akta kelahiran', 'bayi', 'lahir', 'prosedur', 'dokumen'],
    serviceType: 'Akta',
  },
  {
    name: 'Akta Kelahiran - Late Registration',
    query: 'Anak saya sudah berumur 5 tahun tapi belum punya akta kelahiran, bagaimana mengurusnya?',
    expectedKeywords: ['akta kelahiran', 'terlambat', 'prosedur', 'dokumen tambahan'],
    serviceType: 'Akta',
  },
  {
    name: 'General Administrative Inquiry',
    query: 'Jam operasional Dinas Kependudukan dan Pencatatan Sipil',
    expectedKeywords: ['jam operasional', 'dinas', 'kependudukan', 'layanan'],
    serviceType: 'General',
  },
  {
    name: 'Cultural Context - Formal Greeting',
    query: 'Selamat pagi, saya ingin bertanya tentang layanan administrasi',
    expectedKeywords: ['selamat', 'administrasi', 'layanan', 'membantu'],
    serviceType: 'General',
  },
];

class GovernmentServiceTester {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      performanceMetrics: {
        responseTimes: [],
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
    };
  }

  async testBackendHealth() {
    try {
      console.log('🔍 Testing backend health...');
      const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Backend is healthy and ready for government service testing');
        return true;
      } else {
        console.log('❌ Backend health check failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Backend is not accessible:', error.message);
      return false;
    }
  }

  async testGovernmentService(testCase) {
    const startTime = performance.now();
    
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      
      const response = await axios.post(
        `${BACKEND_URL}/chat`,
        {
          message: testCase.query,
          context: {
            enhancedMode: true,
            source: 'government-service-test',
            serviceType: testCase.serviceType,
          },
          enhancementMode: 'enhanced',
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SELLY-GovernmentServiceTest',
          },
        }
      );

      const responseTime = performance.now() - startTime;
      this.results.performanceMetrics.responseTimes.push(responseTime);

      // Validate response structure
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response structure');
      }

      const responseText = response.data.response.toLowerCase();
      
      // Check for expected keywords
      const foundKeywords = testCase.expectedKeywords.filter(keyword => 
        responseText.includes(keyword.toLowerCase())
      );

      // Validate Indonesian language quality
      const hasIndonesianGreeting = /selamat|bagaimana|dapat|membantu|layanan|administrasi/.test(responseText);
      const hasFormalLanguage = /bapak|ibu|anda|silakan|terima kasih/.test(responseText);
      
      const testResult = {
        testName: testCase.name,
        serviceType: testCase.serviceType,
        query: testCase.query,
        response: response.data.response,
        responseTime: responseTime,
        success: response.data.success,
        foundKeywords: foundKeywords,
        expectedKeywords: testCase.expectedKeywords,
        keywordMatchRatio: foundKeywords.length / testCase.expectedKeywords.length,
        hasIndonesianGreeting,
        hasFormalLanguage,
        culturalAppropriate: hasIndonesianGreeting && hasFormalLanguage,
        passed: foundKeywords.length >= Math.ceil(testCase.expectedKeywords.length * 0.6) && 
                hasIndonesianGreeting && 
                response.data.success,
      };

      if (testResult.passed) {
        console.log(`   ✅ PASSED - Found ${foundKeywords.length}/${testCase.expectedKeywords.length} keywords`);
        console.log(`   ⚡ Response time: ${responseTime.toFixed(2)}ms`);
        this.results.passedTests++;
      } else {
        console.log(`   ❌ FAILED - Found ${foundKeywords.length}/${testCase.expectedKeywords.length} keywords`);
        console.log(`   ⚡ Response time: ${responseTime.toFixed(2)}ms`);
        this.results.failedTests++;
      }

      this.results.testResults.push(testResult);
      this.results.totalTests++;

      return testResult;

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      const testResult = {
        testName: testCase.name,
        serviceType: testCase.serviceType,
        query: testCase.query,
        error: error.message,
        responseTime: responseTime,
        passed: false,
      };

      console.log(`   ❌ ERROR - ${error.message}`);
      console.log(`   ⚡ Response time: ${responseTime.toFixed(2)}ms`);
      
      this.results.testResults.push(testResult);
      this.results.totalTests++;
      this.results.failedTests++;

      return testResult;
    }
  }

  async runAllTests() {
    console.log('\n🏛️ SELLY AI Government Services Integration Test');
    console.log('================================================');
    console.log(`📊 Total Test Cases: ${GOVERNMENT_SERVICE_TESTS.length}`);

    // Health check
    const isHealthy = await this.testBackendHealth();
    if (!isHealthy) {
      console.log('❌ Aborting tests due to backend health issues');
      return;
    }

    console.log('\n🧪 Running Government Service Tests...\n');

    // Run all tests sequentially to avoid overwhelming the system
    for (const testCase of GOVERNMENT_SERVICE_TESTS) {
      await this.testGovernmentService(testCase);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateReport();
  }

  generateReport() {
    // Calculate performance metrics
    const responseTimes = this.results.performanceMetrics.responseTimes;
    this.results.performanceMetrics.averageResponseTime = 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    this.results.performanceMetrics.minResponseTime = Math.min(...responseTimes);
    this.results.performanceMetrics.maxResponseTime = Math.max(...responseTimes);

    const successRate = (this.results.passedTests / this.results.totalTests) * 100;

    console.log('\n📊 GOVERNMENT SERVICES TEST RESULTS');
    console.log('===================================');
    console.log(`📈 Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed Tests: ${this.results.passedTests}`);
    console.log(`❌ Failed Tests: ${this.results.failedTests}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(2)}%`);

    console.log('\n⚡ PERFORMANCE METRICS');
    console.log('=====================');
    console.log(`📊 Average Response Time: ${this.results.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`📊 Min Response Time: ${this.results.performanceMetrics.minResponseTime.toFixed(2)}ms`);
    console.log(`📊 Max Response Time: ${this.results.performanceMetrics.maxResponseTime.toFixed(2)}ms`);

    // Service-specific results
    console.log('\n🏛️ SERVICE-SPECIFIC RESULTS');
    console.log('===========================');
    
    const serviceTypes = ['KTP', 'KK', 'Akta', 'General'];
    serviceTypes.forEach(serviceType => {
      const serviceTests = this.results.testResults.filter(result => result.serviceType === serviceType);
      const servicePassed = serviceTests.filter(result => result.passed).length;
      const serviceTotal = serviceTests.length;
      const serviceSuccessRate = serviceTotal > 0 ? (servicePassed / serviceTotal) * 100 : 0;
      
      console.log(`📋 ${serviceType} Services: ${servicePassed}/${serviceTotal} passed (${serviceSuccessRate.toFixed(1)}%)`);
    });

    // Cultural appropriateness assessment
    const culturallyAppropriate = this.results.testResults.filter(result => result.culturalAppropriate).length;
    const culturalRate = (culturallyAppropriate / this.results.totalTests) * 100;
    
    console.log('\n🇮🇩 CULTURAL APPROPRIATENESS ASSESSMENT');
    console.log('=======================================');
    console.log(`📊 Culturally Appropriate Responses: ${culturallyAppropriate}/${this.results.totalTests} (${culturalRate.toFixed(1)}%)`);

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (successRate >= 95) {
      console.log('✅ GOVERNMENT SERVICES: Excellent (≥95%)');
    } else if (successRate >= 90) {
      console.log('✅ GOVERNMENT SERVICES: Good (≥90%)');
    } else if (successRate >= 80) {
      console.log('⚠️ GOVERNMENT SERVICES: Acceptable (≥80%)');
    } else {
      console.log('❌ GOVERNMENT SERVICES: Needs Improvement (<80%)');
    }

    if (this.results.performanceMetrics.averageResponseTime <= 100) {
      console.log('✅ RESPONSE TIME: Excellent (≤100ms)');
    } else if (this.results.performanceMetrics.averageResponseTime <= 500) {
      console.log('✅ RESPONSE TIME: Good (≤500ms)');
    } else {
      console.log('⚠️ RESPONSE TIME: Needs Improvement (>500ms)');
    }

    if (culturalRate >= 95) {
      console.log('✅ CULTURAL APPROPRIATENESS: Excellent (≥95%)');
    } else if (culturalRate >= 90) {
      console.log('✅ CULTURAL APPROPRIATENESS: Good (≥90%)');
    } else {
      console.log('⚠️ CULTURAL APPROPRIATENESS: Needs Improvement (<90%)');
    }

    console.log('\n🎉 Government services integration test completed!');
    console.log('📋 Results ready for Phase 2 validation report');
  }
}

// Run the government services test
async function main() {
  const tester = new GovernmentServiceTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GovernmentServiceTester;
