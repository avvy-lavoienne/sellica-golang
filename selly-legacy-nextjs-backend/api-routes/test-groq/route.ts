/**
 * Test Groq API Integration
 * Direct test endpoint to verify Groq API functionality
 */

import { NextRequest, NextResponse } from 'next/server';
// import { GroqResponseEnhancer } from '@/services/chatbot/groqResponseEnhancer';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST_GROQ] Starting Groq API test...');
    
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize Groq enhancer
    const groqEnhancer = new GroqResponseEnhancer();
    
    // Check if Groq is enabled
    if (!groqEnhancer.isEnabled()) {
      return NextResponse.json({
        success: false,
        error: 'Groq API is not enabled or configured',
        config: {
          enabled: process.env.NEXT_PUBLIC_ENABLE_GROQ_ENHANCEMENT,
          hasApiKey: !!process.env.GROQ_API_KEY,
          apiKeyLength: process.env.GROQ_API_KEY?.length || 0
        }
      });
    }

    console.log('✅ [TEST_GROQ] Groq is enabled, testing enhancement...');

    // Test response object
    const testResponse = {
      content: message,
      metadata: { confidence: 0.8 }
    };

    // Try to enhance the response
    const startTime = Date.now();
    const result = await groqEnhancer.enhanceResponse(testResponse);
    const processingTime = Date.now() - startTime;

    console.log(`🎯 [TEST_GROQ] Enhancement completed in ${processingTime}ms`);

    return NextResponse.json({
      success: result.success,
      originalMessage: message,
      enhancedResponse: result.success ? result.enhancedResponse : null,
      originalResponse: result.originalResponse,
      processingTime,
      metadata: result.enhancementMetadata,
      config: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_GROQ_ENHANCEMENT,
        model: process.env.GROQ_MODEL,
        timeout: process.env.GROQ_TIMEOUT,
        temperature: process.env.GROQ_TEMPERATURE,
        maxTokens: process.env.GROQ_MAX_TOKENS
      }
    });

  } catch (error) {
    console.error('❌ [TEST_GROQ] Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Groq API Test Endpoint',
    usage: 'POST with { "message": "your test message" }',
    config: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_GROQ_ENHANCEMENT,
      hasApiKey: !!process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL,
      timeout: process.env.GROQ_TIMEOUT
    }
  });
}
