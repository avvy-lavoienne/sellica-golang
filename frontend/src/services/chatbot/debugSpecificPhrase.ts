/**
 * Debug specific phrase that's not working correctly
 */

import { KnowledgeService } from './knowledgeService';

const knowledgeService = KnowledgeService.getInstance();
const knowledgeServiceAny = knowledgeService as any;

console.log('🔍 DEBUGGING SPECIFIC PHRASE');
console.log('='.repeat(50));

const problematicPhrase = 'Ada kesalahan data di akta kelahiran yang perlu dikoreksi';

console.log(`\nTesting: "${problematicPhrase}"`);

// Test 1: Check if it's recognized as Akta Kelahiran scenario response
const isAktaScenario = knowledgeServiceAny.isAktaKelahiranScenarioResponse(problematicPhrase);
console.log(`1. isAktaKelahiranScenarioResponse: ${isAktaScenario}`);

// Test 2: Check if it's recognized as KTP scenario response  
const isKTPScenario = knowledgeServiceAny.isKTPScenarioResponse(problematicPhrase);
console.log(`2. isKTPScenarioResponse: ${isKTPScenario}`);

// Test 3: Check what getServiceInfo returns
const result = knowledgeService.getServiceInfo(problematicPhrase);
console.log(`3. getServiceInfo result type: ${typeof result}`);

if (result) {
  if (typeof result === 'string') {
    const isKTPResponse = result.includes('KTP');
    const isAktaResponse = result.includes('Akta Kelahiran') && result.includes('koreksi');
    console.log(`   Contains KTP: ${isKTPResponse}`);
    console.log(`   Contains Akta Kelahiran koreksi: ${isAktaResponse}`);
    console.log(`   Preview: "${result.substring(0, 100)}..."`);
  } else {
    console.log(`   ServiceInfo object - serviceCode: ${result.serviceCode}`);
  }
}

// Test 4: Test the individual patterns
console.log(`\n4. Testing individual patterns:`);
const patterns = [
  /kesalahan.*data/i,
  /data.*salah/i,
  /ada.*yang.*salah.*di.*akta/i,
  /koreksi.*akta/i,
  /ada.*kesalahan.*data.*di.*akta.*kelahiran/i
];

patterns.forEach((pattern, index) => {
  const matches = pattern.test(problematicPhrase);
  console.log(`   Pattern ${index + 1}: ${matches ? '✅ MATCHES' : '❌ No match'} - ${pattern}`);
});

// Test 5: Test getAktaKelahiranScenarioResponse directly
const directResponse = knowledgeService.getAktaKelahiranScenarioResponse(problematicPhrase);
console.log(`\n5. getAktaKelahiranScenarioResponse direct: ${directResponse ? 'HAS RESULT' : 'NULL'}`);

console.log('\n✅ Debug completed!');
