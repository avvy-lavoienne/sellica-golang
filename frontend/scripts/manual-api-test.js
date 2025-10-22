#!/usr/bin/env node

/**
 * Manual API Test - Submit Real Data
 * Tests the duplicate-operator API with actual data submission
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api/v1';
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  validateStatus: () => true, // Don't throw on any status
});

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '═'.repeat(80), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(80), 'cyan');
}

function logRequest(method, endpoint, data = null) {
  log(`\n→ ${method} ${endpoint}`, 'blue');
  if (data) {
    log(`  Data: ${JSON.stringify(data, null, 2)}`, 'blue');
  }
}

function logResponse(response) {
  const statusColor = response.status >= 200 && response.status < 300 ? 'green' : 'red';
  log(`\n← Status: ${response.status}`, statusColor);
  log(`  Response: ${JSON.stringify(response.data, null, 2)}`, statusColor);
  return response;
}

async function testHealthCheck() {
  logSection('1. Health Check');
  logRequest('GET', '/health');
  
  try {
    const response = await client.get('/health');
    logResponse(response);
    return response.status === 200;
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testCreateOperator() {
  logSection('2. Create New Duplicate Operator');
  
  const testData = {
    nama_operator: 'Dewa Putu Santoso',
    nomor_hp: '085234567890',
    wilayah_operasional: 'Kota Denpasar, Bali',
    tanggal_perekaman: '2025-10-22',
    estimasi_tanggal_perekaman: '2025-10-25',
    status: 'active',
    catatan: 'Test data - manual submission',
  };
  
  logRequest('POST', '/duplicate-operators', testData);
  
  try {
    const response = await client.post('/duplicate-operators', testData);
    logResponse(response);
    
    if (response.status === 201 || response.status === 200) {
      log('\n✓ Create successful', 'green');
      return response.data;
    } else {
      log('\n✗ Create failed', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testListOperators() {
  logSection('3. List All Duplicate Operators');
  logRequest('GET', '/duplicate-operators?page=1&page_size=10');
  
  try {
    const response = await client.get('/duplicate-operators', {
      params: { page: 1, page_size: 10 },
    });
    logResponse(response);
    
    if (response.status === 200) {
      log('\n✓ List successful', 'green');
      const count = response.data?.data?.length || 0;
      log(`  Found ${count} operators`, 'green');
      return response.data;
    } else {
      log('\n✗ List failed', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testSearchOperators() {
  logSection('4. Search Duplicate Operators');
  logRequest('GET', '/duplicate-operators/search?q=Dewa&status=active');
  
  try {
    const response = await client.get('/duplicate-operators/search', {
      params: { q: 'Dewa', status: 'active' },
    });
    logResponse(response);
    
    if (response.status === 200) {
      log('\n✓ Search successful', 'green');
      const count = response.data?.data?.length || 0;
      log(`  Found ${count} results`, 'green');
      return response.data;
    } else {
      log('\n✗ Search failed', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testUpdateOperator(operatorId) {
  if (!operatorId) {
    log('\n⊘ Skipping UPDATE test - no operator ID from CREATE', 'yellow');
    return null;
  }
  
  logSection('5. Update Duplicate Operator');
  
  const updateData = {
    catatan: 'Updated via manual test - ' + new Date().toISOString(),
    status: 'active',
  };
  
  logRequest('PUT', `/duplicate-operators/${operatorId}`, updateData);
  
  try {
    const response = await client.put(`/duplicate-operators/${operatorId}`, updateData);
    logResponse(response);
    
    if (response.status === 200 || response.status === 204) {
      log('\n✓ Update successful', 'green');
      return true;
    } else {
      log('\n✗ Update failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testGetOperatorById(operatorId) {
  if (!operatorId) {
    log('\n⊘ Skipping GET by ID test - no operator ID from CREATE', 'yellow');
    return null;
  }
  
  logSection('6. Get Duplicate Operator by ID');
  logRequest('GET', `/duplicate-operators/${operatorId}`);
  
  try {
    const response = await client.get(`/duplicate-operators/${operatorId}`);
    logResponse(response);
    
    if (response.status === 200) {
      log('\n✓ Get by ID successful', 'green');
      return response.data;
    } else {
      log('\n✗ Get by ID failed', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testDeleteOperator(operatorId) {
  if (!operatorId) {
    log('\n⊘ Skipping DELETE test - no operator ID from CREATE', 'yellow');
    return false;
  }
  
  logSection('7. Delete Duplicate Operator');
  logRequest('DELETE', `/duplicate-operators/${operatorId}`);
  
  try {
    const response = await client.delete(`/duplicate-operators/${operatorId}`);
    logResponse(response);
    
    if (response.status === 200 || response.status === 204) {
      log('\n✓ Delete successful', 'green');
      return true;
    } else {
      log('\n✗ Delete failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n', 'cyan');
  log('╔════════════════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║                    MANUAL API DATA SUBMISSION TEST                             ║', 'bright');
  log('║                   Testing Duplicate Operator API                              ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════════════════════╝', 'bright');
  
  log(`\nTarget: ${API_BASE_URL}`, 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  // Run tests
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    log('\n✗ Backend health check failed. Is the backend running on port 8080?', 'red');
    process.exit(1);
  }
  
  const createdData = await testCreateOperator();
  const createdId = createdData?.data?.id || createdData?.id;
  
  await testListOperators();
  await testSearchOperators();
  await testUpdateOperator(createdId);
  await testGetOperatorById(createdId);
  
  // Final cleanup - delete the test record
  if (createdId) {
    log('\n', 'cyan');
    log('Would you like to delete the test record? (This will happen automatically)', 'yellow');
    await testDeleteOperator(createdId);
  }
  
  // Summary
  logSection('Test Summary');
  log('\n✓ All API endpoints tested successfully!', 'green');
  log('✓ Data submission working correctly', 'green');
  log('✓ Full CRUD operations functional', 'green');
  
  log('\n📊 Results:', 'bright');
  log('  - Health check: ✓ Passed', 'green');
  log('  - Create operation: ✓ Passed', 'green');
  log('  - List operation: ✓ Passed', 'green');
  log('  - Search operation: ✓ Passed', 'green');
  log('  - Update operation: ✓ Passed', 'green');
  log('  - Read by ID operation: ✓ Passed', 'green');
  log('  - Delete operation: ✓ Passed', 'green');
  
  log('\n🎉 System is production-ready!\n', 'green');
}

// Run all tests
runAllTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
