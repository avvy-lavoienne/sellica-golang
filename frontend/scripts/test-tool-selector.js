#!/usr/bin/env node

/**
 * Test Tool Selector Logic
 * Quick test to verify tool selection works correctly
 */

// Mock the schema metadata
const schemaMetadata = {
  tables: {
    profiles: {
      displayName: "Profil Pengguna",
      description: "Data profil pengguna sistem SELLICA"
    }
  }
};

// Mock chatbot data service
const chatbotDataService = {
  getUserStatistics: async () => ({
    totalUsers: 18,
    activeUsers: 0,
    pendingUsers: 8,
    approvedUsers: 10,
    usersByRole: { user: 7, admin: 3 }
  })
};

// Simplified tool selector logic
class TestToolSelector {
  static selectTool(query) {
    const lowerQuery = query.toLowerCase();
    console.log('🔍 Testing query:', lowerQuery);
    
    // User statistics patterns
    const userPatterns = [
      'berapa user', 'jumlah user', 'total user', 'statistik user',
      'berapa pengguna', 'jumlah pengguna', 'total pengguna', 'statistik pengguna',
      'user sellica', 'pengguna sellica'
    ];
    
    const hasUserKeyword = userPatterns.some(pattern => lowerQuery.includes(pattern));
    const hasCountKeyword = ['berapa', 'jumlah', 'total', 'statistik'].some(word => lowerQuery.includes(word));
    
    console.log('Pattern analysis:', {
      hasUserKeyword,
      hasCountKeyword,
      matchedPatterns: userPatterns.filter(pattern => lowerQuery.includes(pattern))
    });
    
    if (hasUserKeyword || (hasCountKeyword && (lowerQuery.includes('user') || lowerQuery.includes('pengguna')))) {
      console.log('✅ Would select getUserStatisticsTool');
      return 'getUserStatisticsTool';
    }
    
    console.log('❌ No tool selected');
    return null;
  }
}

// Test queries
const testQueries = [
  'berapa jumlah user sellica?',
  'berapa user?',
  'jumlah pengguna',
  'total user sistem',
  'statistik pengguna sellica',
  'berapa jumlah pengajuan?',
  'hello selly'
];

console.log('🧪 Testing Tool Selector Logic\n');

testQueries.forEach((query, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  console.log(`Query: "${query}"`);
  const result = TestToolSelector.selectTool(query);
  console.log(`Result: ${result || 'No tool selected'}`);
  console.log('---');
});

console.log('\n✅ Tool selector test completed!');
console.log('\n💡 Expected: "berapa jumlah user sellica?" should select getUserStatisticsTool');
