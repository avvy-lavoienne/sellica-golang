#!/usr/bin/env tsx

/**
 * Specific SELLY Query Testing
 * Test specific queries to understand current behavior
 */

async function testSpecificQueries() {
  const baseUrl = 'http://localhost:3000';
  
  const queries = [
    "Halo SELLY",
    "aku mau mengajukan akta kelahiran",
    "kalau anak luar nikah bagaimana?",
    "syarat KTP hilang",
    "biaya buat akta kelahiran",
    "berapa lama proses KTP?"
  ];

  console.log('🔍 Testing Specific SELLY Queries');
  console.log('================================');

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n${i + 1}. Query: "${query}"`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: {
            userId: 'test-specific',
            sessionId: `test-${Date.now()}`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`📝 Response Length: ${data.response?.length || 0} chars`);
      console.log(`🤖 AI Provider: ${data.metadata?.aiProvider || 'unknown'}`);
      console.log(`📊 Metadata:`, JSON.stringify(data.metadata, null, 2));
      
      // Show response preview
      const responseText = data.response || data.content || 'No response';
      const preview = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
      console.log(`💬 Response: "${preview}"`);
      
      // Check for training data indicators
      const hasPersona = /sahabat|kak|halo kak/i.test(responseText);
      const hasTrainingData = /gratis|UU No\. 24|surat keterangan lahir|KTP-el/i.test(responseText);
      const hasScenario = /scenario|skenario|A, B, C|pilihan/i.test(responseText);
      
      console.log(`👤 Has Persona: ${hasPersona ? '✅' : '❌'}`);
      console.log(`📚 Has Training Data: ${hasTrainingData ? '✅' : '❌'}`);
      console.log(`🎭 Has Scenario: ${hasScenario ? '✅' : '❌'}`);

    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

testSpecificQueries().catch(console.error);
