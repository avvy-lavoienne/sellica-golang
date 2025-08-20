/**
 * Debug Akta Kelahiran Query Processing
 */

import { KnowledgeService } from './knowledgeService';

const knowledgeService = KnowledgeService.getInstance();

console.log('🔍 DEBUGGING AKTA KELAHIRAN QUERY PROCESSING');
console.log('='.repeat(60));

// Test 1: Check if isAktaKelahiranQuery works
const testQuery = 'aku ingin membuat akta kelahiran';
console.log(`\n1. Testing query: "${testQuery}"`);

// Access the private method through type assertion for debugging
const knowledgeServiceAny = knowledgeService as any;
const isAktaKelahiranQuery = knowledgeServiceAny.isAktaKelahiranQuery(testQuery.toLowerCase());
console.log(`   isAktaKelahiranQuery result: ${isAktaKelahiranQuery}`);

// Test 2: Check knowledge base entry
const knowledgeBaseEntry = (knowledgeService as any).knowledgeBase.get('akta_kelahiran_interactive_assessment');
console.log(`   Knowledge base entry exists: ${knowledgeBaseEntry ? 'YES' : 'NO'}`);
if (knowledgeBaseEntry) {
  console.log(`   Service code: ${knowledgeBaseEntry.serviceCode}`);
}

// Test 3: Check getServiceInfo result
const serviceResult = knowledgeService.getServiceInfo(testQuery);
console.log(`   getServiceInfo result type: ${typeof serviceResult}`);
console.log(`   getServiceInfo result: ${serviceResult ? 'HAS RESULT' : 'NULL'}`);

// Test 4: Check formatted response
if (serviceResult) {
  const formattedResponse = knowledgeService.formatServiceResponse(serviceResult);
  console.log(`   Formatted response type: ${typeof formattedResponse}`);
  console.log(`   Contains assessment: ${formattedResponse.includes('Penilaian Situasi')}`);
  console.log(`   Contains options A-E: ${formattedResponse.includes('• **A**') && formattedResponse.includes('• **E**')}`);
}

// Test 5: Test scenario response with descriptive text
console.log(`\n2. Testing scenario response: "Bayi baru lahir (kurang dari 60 hari)"`);
const descriptiveQuery = 'Bayi baru lahir (kurang dari 60 hari)';
const scenarioResult = knowledgeService.getServiceInfo(descriptiveQuery);
console.log(`   Scenario result type: ${typeof scenarioResult}`);
console.log(`   Scenario result: ${scenarioResult ? 'HAS RESULT' : 'NULL'}`);

// Test 6: Test isAktaKelahiranScenarioResponse
const isScenarioResponse = knowledgeServiceAny.isAktaKelahiranScenarioResponse(descriptiveQuery);
console.log(`   isAktaKelahiranScenarioResponse: ${isScenarioResponse}`);

// Test 7: Test getAktaKelahiranScenarioResponse directly
const scenarioResponseResult = knowledgeService.getAktaKelahiranScenarioResponse(descriptiveQuery);
console.log(`   getAktaKelahiranScenarioResponse: ${scenarioResponseResult ? 'HAS RESULT' : 'NULL'}`);

if (scenarioResponseResult) {
  console.log(`   Contains scenario A: ${scenarioResponseResult.includes('A - Bayi Baru Lahir')}`);
}

// Test 8: Test single letter A (should go to KTP)
console.log(`\n3. Testing single letter "A" (should go to KTP):`);
const letterResult = knowledgeService.getServiceInfo('A');
const isKTPResult = letterResult && letterResult.specialCases?.string_response?.[0] === 'true' &&
                   letterResult.specialCases?.content?.[0]?.includes('KTP');
console.log(`   Single "A" goes to KTP: ${isKTPResult}`);

// Test 9: Test letter E (should go to Akta Kelahiran)
console.log(`\n4. Testing single letter "E" (should go to Akta Kelahiran):`);
const letterEResult = knowledgeService.getServiceInfo('E');
const isAktaEResult = letterEResult && letterEResult.specialCases?.string_response?.[0] === 'true' &&
                     letterEResult.specialCases?.content?.[0]?.includes('Luar Negeri');
console.log(`   Single "E" goes to Akta Kelahiran: ${isAktaEResult}`);

console.log('\n✅ Debug completed!');
