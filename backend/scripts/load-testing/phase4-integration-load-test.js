/**
 * Phase 4 Integration Testing - Load Testing Suite
 * 
 * This K6 script executes comprehensive load testing for Phase 4 Integration Testing (Week 7)
 * 
 * Timeline: September 4-8, 2025 (5 days)
 * 
 * Success Criteria:
 * - Maintain 95% RAG retrieval accuracy under load
 * - Achieve response times consistently under 100ms
 * - Attain 98% service type detection accuracy
 * - Ensure 99.9% system uptime during testing
 * 
 * Usage:
 * k6 run --vus 100 --duration 10m backend/scripts/load-testing/phase4-integration-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics for Phase 4 success criteria
const ragRetrievalSuccessRate = new Rate('rag_retrieval_success_rate');
const serviceTypeAccuracyRate = new Rate('service_type_accuracy_rate');
const responseTime = new Trend('response_time');
const systemUptimeRate = new Rate('system_uptime_rate');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');
const concurrentUsers = new Gauge('concurrent_users');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TARGET_RESPONSE_TIME_MS = 100;
const TARGET_RAG_ACCURACY = 0.95;
const TARGET_SERVICE_TYPE_ACCURACY = 0.98;
const TARGET_UPTIME = 0.999;

// Real birth certificate test queries for end-to-end testing
const birthCertificateQueries = [
    {
        message: "Bagaimana cara mengurus akta kelahiran untuk bayi yang baru lahir?",
        expectedType: "akta_kelahiran",
        expectedContext: "new_birth_registration",
        description: "New birth certificate registration process"
    },
    {
        message: "Dokumen apa saja yang diperlukan untuk membuat akta kelahiran?",
        expectedType: "akta_kelahiran",
        expectedContext: "document_requirements",
        description: "Birth certificate document requirements"
    },
    {
        message: "Berapa biaya untuk mengurus akta kelahiran?",
        expectedType: "akta_kelahiran",
        expectedContext: "cost_information",
        description: "Birth certificate cost inquiry"
    },
    {
        message: "Bagaimana mengurus akta kelahiran untuk anak yang sudah dewasa tapi belum punya akta?",
        expectedType: "akta_kelahiran",
        expectedContext: "late_registration",
        description: "Late birth certificate registration"
    },
    {
        message: "Apakah bisa mengurus akta kelahiran di luar kota kelahiran?",
        expectedType: "akta_kelahiran",
        expectedContext: "cross_city_registration",
        description: "Cross-city birth certificate registration"
    },
    {
        message: "Bagaimana cara memperbaiki kesalahan nama di akta kelahiran?",
        expectedType: "akta_kelahiran",
        expectedContext: "document_correction",
        description: "Birth certificate correction"
    },
    {
        message: "Berapa lama proses pembuatan akta kelahiran?",
        expectedType: "akta_kelahiran",
        expectedContext: "processing_time",
        description: "Birth certificate processing time"
    },
    {
        message: "Apakah bisa mengurus akta kelahiran secara online?",
        expectedType: "akta_kelahiran",
        expectedContext: "online_services",
        description: "Online birth certificate services"
    },
    {
        message: "Syarat khusus untuk akta kelahiran anak adopsi?",
        expectedType: "akta_kelahiran",
        expectedContext: "adoption_special_case",
        description: "Adoption birth certificate special requirements"
    },
    {
        message: "Bagaimana mengurus akta kelahiran untuk bayi prematur?",
        expectedType: "akta_kelahiran",
        expectedContext: "premature_birth_case",
        description: "Premature birth certificate special case"
    }
];

// Test scenarios for Phase 4
export const options = {
    scenarios: {
        // Baseline Load Testing - Validate basic performance
        baseline_load: {
            executor: 'constant-vus',
            vus: 10,
            duration: '2m',
            tags: { test_type: 'baseline_load' },
        },
        
        // RAG Accuracy Testing Under Load
        rag_accuracy_load: {
            executor: 'ramping-vus',
            startVUs: 20,
            stages: [
                { duration: '1m', target: 50 },
                { duration: '3m', target: 100 },
                { duration: '1m', target: 50 },
            ],
            tags: { test_type: 'rag_accuracy_load' },
        },
        
        // Response Time Validation - Ensure <100ms
        response_time_validation: {
            executor: 'constant-arrival-rate',
            rate: 50, // 50 requests per second
            timeUnit: '1s',
            duration: '3m',
            preAllocatedVUs: 30,
            maxVUs: 100,
            tags: { test_type: 'response_time_validation' },
        },
        
        // System Uptime Testing - 99.9% availability
        uptime_validation: {
            executor: 'constant-vus',
            vus: 5,
            duration: '10m',
            tags: { test_type: 'uptime_validation' },
        },
        
        // Service Type Detection Accuracy
        service_type_accuracy: {
            executor: 'per-vu-iterations',
            vus: 27, // One VU per service type
            iterations: 10,
            tags: { test_type: 'service_type_accuracy' },
        }
    },
    
    thresholds: {
        // Phase 4 Success Criteria Thresholds
        'rag_retrieval_success_rate': ['rate>=0.95'], // 95% RAG accuracy
        'service_type_accuracy_rate': ['rate>=0.98'], // 98% service type accuracy
        'response_time': ['p(95)<100'], // 95th percentile under 100ms
        'system_uptime_rate': ['rate>=0.999'], // 99.9% uptime
        'http_req_failed': ['rate<0.01'], // Less than 1% failed requests
        'http_req_duration': ['p(95)<100'], // 95th percentile under 100ms
    }
};

export default function () {
    concurrentUsers.add(1);
    totalRequests.add(1);
    
    const testScenario = __ENV.K6_SCENARIO || 'baseline_load';
    
    switch (testScenario) {
        case 'rag_accuracy_load':
            testRAGAccuracyUnderLoad();
            break;
        case 'response_time_validation':
            testResponseTimeValidation();
            break;
        case 'uptime_validation':
            testSystemUptime();
            break;
        case 'service_type_accuracy':
            testServiceTypeAccuracy();
            break;
        default:
            testBaselineLoad();
    }
    
    sleep(randomIntBetween(1, 3));
}

function testRAGAccuracyUnderLoad() {
    const query = randomItem(birthCertificateQueries);
    const payload = {
        message: query.message,
        userId: `load-test-user-${__VU}-${__ITER}`,
        enhancementMode: "standard",
        context: {
            administrativeContext: query.expectedContext,
            deviceId: `load-test-device-${__VU}`,
            testScenario: "rag_accuracy_validation"
        }
    };
    
    const startTime = Date.now();
    const response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { endpoint: 'chat', test_phase: 'rag_accuracy' }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    responseTime.add(duration);
    
    const ragSuccess = check(response, {
        'RAG retrieval successful': (r) => {
            if (r.status !== 200) return false;
            try {
                const body = JSON.parse(r.body);
                // Check if response contains relevant information (indicating successful RAG retrieval)
                return body.response && 
                       body.response.length > 50 && 
                       body.response.toLowerCase().includes('akta kelahiran');
            } catch (e) {
                return false;
            }
        },
        'Response time under 100ms': (r) => duration < TARGET_RESPONSE_TIME_MS,
        'Status is 200': (r) => r.status === 200,
    });
    
    ragRetrievalSuccessRate.add(ragSuccess ? 1 : 0);
    systemUptimeRate.add(response.status === 200 ? 1 : 0);
    
    if (response.status !== 200) {
        failedRequests.add(1);
    }
}

function testResponseTimeValidation() {
    const query = randomItem(birthCertificateQueries);
    const payload = {
        message: query.message,
        userId: `response-time-test-${__VU}-${__ITER}`,
        enhancementMode: "standard",
        context: {
            administrativeContext: query.expectedContext,
            deviceId: `response-time-device-${__VU}`,
            testScenario: "response_time_validation"
        }
    };
    
    const startTime = Date.now();
    const response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { endpoint: 'chat', test_phase: 'response_time' }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    responseTime.add(duration);
    
    check(response, {
        'Response time consistently under 100ms': (r) => duration < TARGET_RESPONSE_TIME_MS,
        'Status is 200': (r) => r.status === 200,
    });
    
    systemUptimeRate.add(response.status === 200 ? 1 : 0);
    
    if (response.status !== 200) {
        failedRequests.add(1);
    }
}

function testSystemUptime() {
    // Test system uptime by checking health endpoint
    const healthResponse = http.get(`${BASE_URL}/health`, {
        tags: { endpoint: 'health', test_phase: 'uptime' }
    });
    
    const systemUp = check(healthResponse, {
        'System is up (health check)': (r) => r.status === 200,
    });
    
    systemUptimeRate.add(systemUp ? 1 : 0);
    
    if (!systemUp) {
        failedRequests.add(1);
    }
    
    // Also test main chat endpoint for comprehensive uptime check
    const query = randomItem(birthCertificateQueries);
    const payload = {
        message: query.message,
        userId: `uptime-test-${__VU}-${__ITER}`,
        enhancementMode: "standard",
        context: {
            administrativeContext: query.expectedContext,
            deviceId: `uptime-device-${__VU}`,
            testScenario: "system_uptime_validation"
        }
    };
    
    const chatResponse = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { endpoint: 'chat', test_phase: 'uptime' }
    });
    
    const chatUp = check(chatResponse, {
        'Chat endpoint is up': (r) => r.status === 200,
    });
    
    systemUptimeRate.add(chatUp ? 1 : 0);
    
    if (!chatUp) {
        failedRequests.add(1);
    }
}

function testServiceTypeAccuracy() {
    const query = birthCertificateQueries[__VU % birthCertificateQueries.length];
    const payload = {
        message: query.message,
        userId: `service-type-test-${__VU}-${__ITER}`,
        enhancementMode: "standard",
        context: {
            administrativeContext: query.expectedContext,
            deviceId: `service-type-device-${__VU}`,
            testScenario: "service_type_accuracy_validation"
        }
    };
    
    const response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { endpoint: 'chat', test_phase: 'service_type_accuracy' }
    });
    
    const serviceTypeAccurate = check(response, {
        'Service type detected accurately': (r) => {
            if (r.status !== 200) return false;
            try {
                const body = JSON.parse(r.body);
                // Check if the detected service type matches expected
                return body.serviceType === query.expectedType;
            } catch (e) {
                return false;
            }
        },
        'Status is 200': (r) => r.status === 200,
    });
    
    serviceTypeAccuracyRate.add(serviceTypeAccurate ? 1 : 0);
    systemUptimeRate.add(response.status === 200 ? 1 : 0);
    
    if (response.status !== 200) {
        failedRequests.add(1);
    }
}

function testBaselineLoad() {
    const query = randomItem(birthCertificateQueries);
    const payload = {
        message: query.message,
        userId: `baseline-test-${__VU}-${__ITER}`,
        enhancementMode: "standard",
        context: {
            administrativeContext: query.expectedContext,
            deviceId: `baseline-device-${__VU}`,
            testScenario: "baseline_load_validation"
        }
    };
    
    const startTime = Date.now();
    const response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: { endpoint: 'chat', test_phase: 'baseline' }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    responseTime.add(duration);
    
    check(response, {
        'Baseline response successful': (r) => r.status === 200,
        'Baseline response time acceptable': (r) => duration < TARGET_RESPONSE_TIME_MS * 2, // Allow 2x for baseline
    });
    
    systemUptimeRate.add(response.status === 200 ? 1 : 0);
    
    if (response.status !== 200) {
        failedRequests.add(1);
    }
}

export function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Calculate success criteria results
    const ragAccuracy = data.metrics.rag_retrieval_success_rate?.values?.rate || 0;
    const serviceTypeAccuracy = data.metrics.service_type_accuracy_rate?.values?.rate || 0;
    const avgResponseTime = data.metrics.response_time?.values?.avg || 0;
    const p95ResponseTime = data.metrics.response_time?.values?.['p(95)'] || 0;
    const systemUptime = data.metrics.system_uptime_rate?.values?.rate || 0;
    
    const successCriteria = {
        'rag_accuracy_95_percent': ragAccuracy >= TARGET_RAG_ACCURACY,
        'service_type_accuracy_98_percent': serviceTypeAccuracy >= TARGET_SERVICE_TYPE_ACCURACY,
        'response_time_under_100ms': p95ResponseTime <= TARGET_RESPONSE_TIME_MS,
        'system_uptime_99_9_percent': systemUptime >= TARGET_UPTIME
    };
    
    const allCriteriaMet = Object.values(successCriteria).every(met => met);
    
    const results = {
        test_suite: "Phase 4 Integration Testing - Load Testing Suite",
        timestamp: timestamp,
        timeline: "September 4-8, 2025 (Week 7)",
        success_criteria: successCriteria,
        all_criteria_met: allCriteriaMet,
        metrics: {
            rag_accuracy_percentage: (ragAccuracy * 100).toFixed(2),
            service_type_accuracy_percentage: (serviceTypeAccuracy * 100).toFixed(2),
            avg_response_time_ms: avgResponseTime.toFixed(2),
            p95_response_time_ms: p95ResponseTime.toFixed(2),
            system_uptime_percentage: (systemUptime * 100).toFixed(3),
            total_requests: data.metrics.total_requests?.values?.count || 0,
            failed_requests: data.metrics.failed_requests?.values?.count || 0
        },
        detailed_metrics: data.metrics
    };
    
    return {
        'stdout': JSON.stringify(results, null, 2),
        [`backend/scripts/load-testing/results/phase4-load-test-results-${timestamp}.json`]: JSON.stringify(results, null, 2)
    };
}
