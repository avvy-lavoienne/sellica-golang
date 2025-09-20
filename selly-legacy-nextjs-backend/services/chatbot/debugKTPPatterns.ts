/**
 * Debug Script for KTP Pattern Recognition
 * Tests the specific failing query to identify the issue
 */

import { casualPatternGenerator } from './casualPatternGenerator';
import { documentConfigurations } from './documentConfigurations';

/**
 * Debug the specific failing query
 */
export function debugSpecificKTPQuery() {
  console.log('🔍 Debugging Specific KTP Query Pattern Recognition');
  console.log('='.repeat(60));

  const failingQuery = 'saya ingin mengetahui persyaratan cetak ktp';
  console.log(`\n🎯 Testing Query: "${failingQuery}"`);

  // Test automated pattern generation
  const ktpConfig = documentConfigurations.ktp;
  const generatedPatterns = casualPatternGenerator.generatePatternsForDocument(ktpConfig);
  
  console.log(`\n📊 Generated ${generatedPatterns.length} automated patterns`);

  // Test manual patterns that should match
  const manualPatterns = [
    /saya.*ingin.*mengetahui.*ktp/i,
    /saya.*ingin.*mengetahui.*persyaratan.*ktp/i,
    /saya.*ingin.*mengetahui.*syarat.*ktp/i,
    /saya.*ingin.*tahu.*ktp/i,
    /saya.*ingin.*tahu.*persyaratan.*ktp/i,
    /saya.*ingin.*tahu.*syarat.*ktp/i,
    /ingin.*mengetahui.*ktp/i,
    /ingin.*mengetahui.*persyaratan.*ktp/i,
    /ingin.*mengetahui.*syarat.*ktp/i,
    /ingin.*tahu.*ktp/i,
    /ingin.*tahu.*persyaratan.*ktp/i,
    /ingin.*tahu.*syarat.*ktp/i,
    /mohon.*informasi.*ktp/i,
    /mohon.*informasi.*persyaratan.*ktp/i,
    /mohon.*informasi.*syarat.*ktp/i,
    /persyaratan.*cetak.*ktp/i,
    /syarat.*cetak.*ktp/i,
    /persyaratan.*ktp/i,
    /syarat.*ktp/i,
    /cetak.*ktp/i
  ];

  console.log(`\n📋 Testing ${manualPatterns.length} manual patterns:`);
  
  let manualMatches = 0;
  manualPatterns.forEach((pattern, index) => {
    const matched = pattern.test(failingQuery);
    const status = matched ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${pattern.source}`);
    if (matched) manualMatches++;
  });

  console.log(`\n📊 Manual Pattern Results: ${manualMatches}/${manualPatterns.length} matched`);

  // Test automated patterns
  console.log(`\n🤖 Testing automated patterns:`);
  const automatedMatches = generatedPatterns.filter(pattern => pattern.test(failingQuery));
  console.log(`📊 Automated Pattern Results: ${automatedMatches.length}/${generatedPatterns.length} matched`);

  if (automatedMatches.length > 0) {
    console.log('\n✅ Matching automated patterns:');
    automatedMatches.slice(0, 5).forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.source}`);
    });
  }

  // Test combined patterns
  const allPatterns = [...generatedPatterns, ...manualPatterns];
  const totalMatches = allPatterns.filter(pattern => pattern.test(failingQuery));
  
  console.log(`\n🎯 FINAL RESULT:`);
  console.log(`Query: "${failingQuery}"`);
  console.log(`Total Patterns: ${allPatterns.length}`);
  console.log(`Matching Patterns: ${totalMatches.length}`);
  console.log(`Should Trigger KTP Assessment: ${totalMatches.length > 0 ? '✅ YES' : '❌ NO'}`);

  // Test specific pattern variations
  console.log(`\n🧪 Testing Pattern Variations:`);
  const testVariations = [
    'saya ingin mengetahui persyaratan cetak ktp',
    'saya ingin mengetahui persyaratan ktp',
    'ingin mengetahui persyaratan cetak ktp',
    'persyaratan cetak ktp',
    'syarat cetak ktp',
    'cetak ktp'
  ];

  testVariations.forEach((variation, index) => {
    const matched = allPatterns.some(pattern => pattern.test(variation));
    const status = matched ? '✅' : '❌';
    console.log(`${index + 1}. ${status} "${variation}"`);
  });

  return {
    query: failingQuery,
    totalPatterns: allPatterns.length,
    matchingPatterns: totalMatches.length,
    shouldTrigger: totalMatches.length > 0,
    manualMatches,
    automatedMatches: automatedMatches.length
  };
}

/**
 * Test the actual KnowledgeService method
 */
export function testKnowledgeServiceDirectly() {
  console.log('\n🔧 Testing KnowledgeService Directly');
  console.log('='.repeat(40));

  // We can't import KnowledgeService directly here due to circular dependencies
  // But we can test the pattern logic
  
  const query = 'saya ingin mengetahui persyaratan cetak ktp';
  const lowerQuery = query.toLowerCase();
  
  console.log(`\n🎯 Testing: "${query}"`);
  console.log(`🔍 Lowercase: "${lowerQuery}"`);

  // Test basic KTP detection patterns
  const basicKTPPatterns = [
    /ktp/i,
    /kartu tanda penduduk/i,
    /persyaratan.*ktp/i,
    /syarat.*ktp/i,
    /cetak.*ktp/i
  ];

  console.log(`\n📋 Basic KTP Pattern Tests:`);
  basicKTPPatterns.forEach((pattern, index) => {
    const matched = pattern.test(lowerQuery);
    const status = matched ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${pattern.source}`);
  });

  // Test if the query contains 'ktp'
  const containsKTP = lowerQuery.includes('ktp');
  console.log(`\n🔍 Contains 'ktp': ${containsKTP ? '✅ YES' : '❌ NO'}`);

  // Test if the query contains 'persyaratan'
  const containsPersyaratan = lowerQuery.includes('persyaratan');
  console.log(`🔍 Contains 'persyaratan': ${containsPersyaratan ? '✅ YES' : '❌ NO'}`);

  // Test if the query contains 'cetak'
  const containsCetak = lowerQuery.includes('cetak');
  console.log(`🔍 Contains 'cetak': ${containsCetak ? '✅ YES' : '❌ NO'}`);

  return {
    query,
    lowerQuery,
    containsKTP,
    containsPersyaratan,
    containsCetak
  };
}

/**
 * Run all debug tests
 */
export function runAllDebugTests() {
  console.log('🚀 KTP PATTERN RECOGNITION DEBUG');
  console.log('='.repeat(50));
  
  const patternTest = debugSpecificKTPQuery();
  const serviceTest = testKnowledgeServiceDirectly();

  console.log('\n🎉 DEBUG SUMMARY:');
  console.log(`✅ Query contains KTP: ${serviceTest.containsKTP}`);
  console.log(`✅ Query contains persyaratan: ${serviceTest.containsPersyaratan}`);
  console.log(`✅ Query contains cetak: ${serviceTest.containsCetak}`);
  console.log(`✅ Pattern matches found: ${patternTest.matchingPatterns}`);
  console.log(`✅ Should trigger assessment: ${patternTest.shouldTrigger}`);

  if (!patternTest.shouldTrigger) {
    console.log('\n❌ ISSUE IDENTIFIED:');
    console.log('The query is not matching any patterns despite containing KTP-related terms.');
    console.log('This suggests the patterns may not be properly loaded or applied.');
  } else {
    console.log('\n✅ PATTERNS WORKING:');
    console.log('The query should trigger KTP assessment. Issue may be elsewhere in the flow.');
  }

  return {
    patternTest,
    serviceTest
  };
}

// Export for use in other modules
export { casualPatternGenerator, documentConfigurations };
