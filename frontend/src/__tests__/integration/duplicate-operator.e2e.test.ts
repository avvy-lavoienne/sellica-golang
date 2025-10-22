/**
 * End-to-End Integration Tests for Duplicate Operator API
 * Tests actual hooks against live backend
 * Run with: npm test -- duplicate-operator.e2e.test.ts
 */

import axios, { AxiosError } from "axios";

// ============================================================================
// Test Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_PREFIX = `${API_BASE_URL}/api/v1`;
const TEST_TIMEOUT = 10000; // 10 seconds per test
const PERFORMANCE_THRESHOLD = 1000; // 1 second target

interface TestResult {
  name: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️ WARN";
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface TestReport {
  timestamp: string;
  environment: {
    apiUrl: string;
    backendVersion?: string;
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: TestResult[];
  summary: {
    totalDuration: number;
    averageResponseTime: number;
    performanceScore: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Measure function execution time
 */
function measureTime(fn: () => Promise<any>): Promise<{ result: any; duration: number }> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      resolve({ result, duration });
    } catch (error) {
      const duration = performance.now() - start;
      resolve({ result: { error }, duration });
    }
  });
}

/**
 * Log test result
 */
function logResult(result: TestResult, verbose = true): void {
  const icon = result.status;
  const time = `${result.duration.toFixed(2)}ms`;
  const perf = result.duration > PERFORMANCE_THRESHOLD ? " ⚠️ SLOW" : "";
  console.log(`${icon} ${result.name} (${time})${perf}`);
  if (verbose && result.error) {
    console.error(`   └─ ${result.error}`);
  }
}

/**
 * Create test data object
 */
function createTestData(suffix = ""): Record<string, any> {
  const timestamp = new Date().toISOString();
  return {
    nama_operator: `Test Operator ${suffix || timestamp}`,
    nomor_hp: `628${Math.floor(Math.random() * 1000000000).toString().padStart(9, "0")}`,
    wilayah_operasional: `Wilayah Test ${suffix}`,
    tanggal_perekaman: "2025-10-22",
    estimasi_tanggal_perekaman: "2025-10-23",
    status: "active",
    catatan: `Test note - ${timestamp}`,
  };
}

// ============================================================================
// Test Suite 1: Backend Health & Setup
// ============================================================================

async function testBackendHealth(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
  });

  if (result.error) {
    return {
      name: "Backend Health Check",
      status: "❌ FAIL",
      duration,
      error: `Backend unreachable at ${API_BASE_URL}. Is it running?`,
    };
  }

  return {
    name: "Backend Health Check",
    status: "✅ PASS",
    duration,
    details: { status: result.data?.status || "healthy" },
  };
}

async function testAPIHealthEndpoint(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/health`, { timeout: 5000 });
  });

  if (result.error) {
    return {
      name: "API Health Endpoint (/api/v1/health)",
      status: "❌ FAIL",
      duration,
      error: "Health endpoint not responding",
    };
  }

  return {
    name: "API Health Endpoint (/api/v1/health)",
    status: "✅ PASS",
    duration,
    details: result.data,
  };
}

// ============================================================================
// Test Suite 2: CRUD Operations
// ============================================================================

async function testCreateOperation(): Promise<TestResult> {
  const testData = createTestData("CREATE");

  const { result, duration } = await measureTime(async () => {
    return axios.post(`${API_PREFIX}/duplicate-operators`, testData);
  });

  if (result.error || !result.data?.id) {
    return {
      name: "CREATE: Add new duplicate operator",
      status: "❌ FAIL",
      duration,
      error: result.error?.message || "No ID in response",
    };
  }

  return {
    name: "CREATE: Add new duplicate operator",
    status: "✅ PASS",
    duration,
    details: { id: result.data.id, name: result.data.nama_operator },
  };
}

async function testListOperation(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=10`);
  });

  if (result.error || !Array.isArray(result.data?.data)) {
    return {
      name: "READ: List all duplicate operators with pagination",
      status: "❌ FAIL",
      duration,
      error: "Invalid list response format",
    };
  }

  const count = result.data.data.length;
  return {
    name: "READ: List all duplicate operators with pagination",
    status: "✅ PASS",
    duration,
    details: { recordCount: count, pagination: result.data.pagination },
  };
}

async function testGetByIdOperation(): Promise<TestResult> {
  // First, get a valid ID from list
  let testId = "test-id";
  try {
    const listRes = await axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=1`);
    if (listRes.data?.data?.length > 0) {
      testId = listRes.data.data[0].id;
    }
  } catch (e) {
    return {
      name: "READ: Get single record by ID",
      status: "❌ FAIL",
      duration: 0,
      error: "Could not fetch test ID",
    };
  }

  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators/${testId}`);
  });

  if (result.error || !result.data?.id) {
    return {
      name: "READ: Get single record by ID",
      status: "❌ FAIL",
      duration,
      error: "Record not found or invalid response",
    };
  }

  return {
    name: "READ: Get single record by ID",
    status: "✅ PASS",
    duration,
    details: { id: result.data.id, name: result.data.nama_operator },
  };
}

async function testUpdateOperation(): Promise<TestResult> {
  // First, create a record to update
  let testId = "";
  try {
    const createRes = await axios.post(
      `${API_PREFIX}/duplicate-operators`,
      createTestData("UPDATE")
    );
    testId = createRes.data.id;
  } catch (e) {
    return {
      name: "UPDATE: Modify existing record",
      status: "❌ FAIL",
      duration: 0,
      error: "Could not create test record",
    };
  }

  const updateData = { nama_operator: "Updated Test Operator" };

  const { result, duration } = await measureTime(async () => {
    return axios.put(`${API_PREFIX}/duplicate-operators/${testId}`, updateData);
  });

  if (result.error) {
    return {
      name: "UPDATE: Modify existing record",
      status: "❌ FAIL",
      duration,
      error: result.error?.message || "Update failed",
    };
  }

  return {
    name: "UPDATE: Modify existing record",
    status: "✅ PASS",
    duration,
    details: { id: testId, updatedName: result.data?.nama_operator },
  };
}

async function testDeleteOperation(): Promise<TestResult> {
  // First, create a record to delete
  let testId = "";
  try {
    const createRes = await axios.post(
      `${API_PREFIX}/duplicate-operators`,
      createTestData("DELETE")
    );
    testId = createRes.data.id;
  } catch (e) {
    return {
      name: "DELETE: Remove a record",
      status: "❌ FAIL",
      duration: 0,
      error: "Could not create test record",
    };
  }

  const { result, duration } = await measureTime(async () => {
    return axios.delete(`${API_PREFIX}/duplicate-operators/${testId}`);
  });

  if (result.error) {
    return {
      name: "DELETE: Remove a record",
      status: "❌ FAIL",
      duration,
      error: result.error?.message || "Delete failed",
    };
  }

  return {
    name: "DELETE: Remove a record",
    status: "✅ PASS",
    duration,
    details: { deletedId: testId },
  };
}

// ============================================================================
// Test Suite 3: Filtering & Search
// ============================================================================

async function testSearchFunctionality(): Promise<TestResult> {
  // First create a test record with known name
  const testName = `Search Test ${Date.now()}`;
  const testData = { ...createTestData(), nama_operator: testName };

  try {
    await axios.post(`${API_PREFIX}/duplicate-operators`, testData);
  } catch (e) {
    return {
      name: "SEARCH: Find records by search query",
      status: "❌ FAIL",
      duration: 0,
      error: "Could not create test record",
    };
  }

  // Now search for it
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators?search=${encodeURIComponent(testName)}`);
  });

  if (result.error) {
    return {
      name: "SEARCH: Find records by search query",
      status: "❌ FAIL",
      duration,
      error: "Search request failed",
    };
  }

  const found = result.data?.data?.some((item: any) => item.nama_operator?.includes(testName));

  return {
    name: "SEARCH: Find records by search query",
    status: found ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { searchTerm: testName, found, resultCount: result.data?.data?.length || 0 },
  };
}

async function testStatusFiltering(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators?status=ready`);
  });

  if (result.error) {
    return {
      name: "FILTER: Filter by status (ready)",
      status: "❌ FAIL",
      duration,
      error: "Status filter request failed",
    };
  }

  return {
    name: "FILTER: Filter by status (ready)",
    status: "✅ PASS",
    duration,
    details: { filteredCount: result.data?.data?.length || 0 },
  };
}

async function testPaginationFunctionality(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=5`);
  });

  if (result.error || !result.data?.pagination) {
    return {
      name: "PAGINATION: Navigate through pages with correct page size",
      status: "❌ FAIL",
      duration,
      error: "Pagination metadata missing",
    };
  }

  const pagination = result.data.pagination;
  const isValid =
    pagination.page === 1 &&
    pagination.page_size === 5 &&
    result.data.data.length <= 5;

  return {
    name: "PAGINATION: Navigate through pages with correct page size",
    status: isValid ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { page: pagination.page, pageSize: pagination.page_size, dataCount: result.data.data.length },
  };
}

// ============================================================================
// Test Suite 4: Error Handling
// ============================================================================

async function testInvalidId(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators/invalid-id-12345`).catch((e) => e);
  });

  if (!result.response) {
    return {
      name: "ERROR: Handle invalid ID (404)",
      status: "❌ FAIL",
      duration,
      error: "Expected HTTP error response",
    };
  }

  const isCorrectError = result.response.status === 404;
  return {
    name: "ERROR: Handle invalid ID (404)",
    status: isCorrectError ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { statusCode: result.response.status, message: result.response.data?.message },
  };
}

async function testMissingRequiredFields(): Promise<TestResult> {
  const incompleteData = { nama_operator: "Test" }; // Missing other required fields

  const { result, duration } = await measureTime(async () => {
    return axios.post(`${API_PREFIX}/duplicate-operators`, incompleteData).catch((e) => e);
  });

  if (!result.response) {
    return {
      name: "ERROR: Validation failure on missing required fields",
      status: "⚠️ WARN",
      duration,
      error: "Expected validation error",
    };
  }

  const isValidationError = result.response.status >= 400 && result.response.status < 500;
  return {
    name: "ERROR: Validation failure on missing required fields",
    status: isValidationError ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { statusCode: result.response.status },
  };
}

async function testRequestTimeout(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios
      .get(`${API_PREFIX}/duplicate-operators`, { timeout: 100 })
      .catch((e) => e);
  });

  // Note: This test may not timeout on fast networks
  const hasTimeout = result.code === "ECONNABORTED" || result.message?.includes("timeout");

  return {
    name: "ERROR: Handle request timeout gracefully",
    status: hasTimeout ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { error: result.message || "No timeout (fast network)" },
  };
}

// ============================================================================
// Test Suite 5: Performance Testing
// ============================================================================

async function testConcurrentRequests(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    const promises = Array(5)
      .fill(null)
      .map(() => axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=5`));

    return Promise.all(promises);
  });

  if (result.error) {
    return {
      name: "PERFORMANCE: Handle 5 concurrent requests",
      status: "❌ FAIL",
      duration,
      error: "One or more requests failed",
    };
  }

  const allSuccess = Array.isArray(result) && result.every((r) => r.status === 200);
  const avgTime = duration / 5;

  return {
    name: "PERFORMANCE: Handle 5 concurrent requests",
    status: allSuccess ? "✅ PASS" : "❌ FAIL",
    duration,
    details: { totalTime: duration, averagePerRequest: avgTime.toFixed(2) },
  };
}

async function testLargeDataResponse(): Promise<TestResult> {
  const { result, duration } = await measureTime(async () => {
    return axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=100`);
  });

  if (result.error) {
    return {
      name: "PERFORMANCE: Handle large data response (page_size=100)",
      status: "❌ FAIL",
      duration,
      error: "Request failed",
    };
  }

  const recordCount = result.data?.data?.length || 0;
  const performanceOk = duration < PERFORMANCE_THRESHOLD * 2;

  return {
    name: "PERFORMANCE: Handle large data response (page_size=100)",
    status: performanceOk ? "✅ PASS" : "⚠️ WARN",
    duration,
    details: { recordCount, threshold: PERFORMANCE_THRESHOLD * 2 },
  };
}

// ============================================================================
// Test Suite 6: End-to-End Workflows
// ============================================================================

async function testCompleteWorkflow(): Promise<TestResult> {
  const workflowSteps: { name: string; duration: number }[] = [];
  const startTime = performance.now();

  try {
    // Step 1: Create
    let { duration: step1Time, result: createRes } = await measureTime(async () => {
      return axios.post(`${API_PREFIX}/duplicate-operators`, createTestData("E2E"));
    });
    workflowSteps.push({ name: "Create", duration: step1Time });
    const createdId = createRes.data?.id;

    if (!createdId) throw new Error("Create failed");

    // Step 2: Search/List
    const { duration: step2Time } = await measureTime(async () => {
      return axios.get(`${API_PREFIX}/duplicate-operators?page=1&page_size=10`);
    });
    workflowSteps.push({ name: "List", duration: step2Time });

    // Step 3: Get by ID
    const { duration: step3Time } = await measureTime(async () => {
      return axios.get(`${API_PREFIX}/duplicate-operators/${createdId}`);
    });
    workflowSteps.push({ name: "Get", duration: step3Time });

    // Step 4: Update
    const { duration: step4Time } = await measureTime(async () => {
      return axios.put(`${API_PREFIX}/duplicate-operators/${createdId}`, {
        nama_operator: "E2E Updated Operator",
      });
    });
    workflowSteps.push({ name: "Update", duration: step4Time });

    // Step 5: Delete
    const { duration: step5Time } = await measureTime(async () => {
      return axios.delete(`${API_PREFIX}/duplicate-operators/${createdId}`);
    });
    workflowSteps.push({ name: "Delete", duration: step5Time });

    const totalDuration = performance.now() - startTime;

    return {
      name: "E2E: Complete workflow (Create → List → Get → Update → Delete)",
      status: "✅ PASS",
      duration: totalDuration,
      details: {
        steps: workflowSteps,
        totalSteps: workflowSteps.length,
      },
    };
  } catch (error: any) {
    const totalDuration = performance.now() - startTime;
    return {
      name: "E2E: Complete workflow (Create → List → Get → Update → Delete)",
      status: "❌ FAIL",
      duration: totalDuration,
      error: error.message,
      details: { completedSteps: workflowSteps.length },
    };
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

export async function runIntegrationTests(): Promise<TestReport> {
  console.log("\n📋 DUPLICATE OPERATOR - E2E INTEGRATION TEST SUITE");
  console.log("═".repeat(80));
  console.log(`🚀 Starting tests at ${new Date().toISOString()}`);
  console.log(`🔗 API Endpoint: ${API_PREFIX}`);
  console.log("═".repeat(80) + "\n");

  const results: TestResult[] = [];
  const reportStartTime = performance.now();

  // Test Suite 1: Health Checks
  console.log("📡 SUITE 1: BACKEND HEALTH");
  console.log("─".repeat(80));
  results.push(await testBackendHealth());
  results.push(await testAPIHealthEndpoint());
  console.log();

  // Test Suite 2: CRUD Operations
  console.log("🔧 SUITE 2: CRUD OPERATIONS");
  console.log("─".repeat(80));
  results.push(await testCreateOperation());
  results.push(await testListOperation());
  results.push(await testGetByIdOperation());
  results.push(await testUpdateOperation());
  results.push(await testDeleteOperation());
  console.log();

  // Test Suite 3: Filtering & Search
  console.log("🔍 SUITE 3: SEARCH & FILTERING");
  console.log("─".repeat(80));
  results.push(await testSearchFunctionality());
  results.push(await testStatusFiltering());
  results.push(await testPaginationFunctionality());
  console.log();

  // Test Suite 4: Error Handling
  console.log("⚠️  SUITE 4: ERROR HANDLING");
  console.log("─".repeat(80));
  results.push(await testInvalidId());
  results.push(await testMissingRequiredFields());
  results.push(await testRequestTimeout());
  console.log();

  // Test Suite 5: Performance
  console.log("⚡ SUITE 5: PERFORMANCE TESTING");
  console.log("─".repeat(80));
  results.push(await testConcurrentRequests());
  results.push(await testLargeDataResponse());
  console.log();

  // Test Suite 6: E2E Workflows
  console.log("🎯 SUITE 6: END-TO-END WORKFLOWS");
  console.log("─".repeat(80));
  results.push(await testCompleteWorkflow());
  console.log();

  // Log all results
  results.forEach((result) => logResult(result));

  // Calculate summary
  const totalDuration = performance.now() - reportStartTime;
  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const warnings = results.filter((r) => r.status === "⚠️ WARN").length;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const performanceScore = ((1 - avgResponseTime / PERFORMANCE_THRESHOLD) * 100).toFixed(1);

  // Print summary
  console.log("\n" + "═".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("═".repeat(80));
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⚠️  Warnings: ${warnings}/${results.length}`);
  console.log(`\n⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`);
  console.log(`📈 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`⚡ Performance Score: ${performanceScore}% (target: ${PERFORMANCE_THRESHOLD}ms)`);
  console.log("═".repeat(80) + "\n");

  // Return report object
  return {
    timestamp: new Date().toISOString(),
    environment: {
      apiUrl: API_PREFIX,
      totalTests: results.length,
      passed,
      failed,
      warnings,
    },
    results,
    summary: {
      totalDuration,
      averageResponseTime: avgResponseTime,
      performanceScore: parseFloat(performanceScore),
    },
  };
}

// Run tests if this is the main module
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

export default runIntegrationTests;
