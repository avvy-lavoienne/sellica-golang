import { NextRequest, NextResponse } from 'next/server';
import { SimpleResponseService } from '@/services/chatbot/simpleResponseService';
import { EnhancedSellyIntegration } from '@/services/chatbot/enhancedSellyIntegration';
import { performanceOptimizer } from '@/services/chatbot/performanceOptimizer';
import { TrainingDataCollector } from '@/services/chatbot/trainingDataCollector';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();

  try {
    // Initialize performance optimizer
    await performanceOptimizer.initialize();

    // Parse the request body
    const { message, context, enhancementMode } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    console.log('🔍 [API] Processing message:', message);
    console.log('🔍 [API] Context:', context);
    console.log('🔍 [API] Enhancement mode:', enhancementMode || 'standard');

    // Check cache first for immediate response
    const cachedResponse = performanceOptimizer.getCachedResponse(message, context);
    if (cachedResponse) {
      console.log('⚡ [PERFORMANCE] Returning cached response');
      return NextResponse.json({
        success: true,
        response: cachedResponse.content,
        type: cachedResponse.type,
        metadata: {
          ...cachedResponse.metadata,
          processingTime: performance.now() - requestStartTime,
          cached: true
        }
      });
    }

    // Determine processing mode
    const useEnhancedMode = enhancementMode === 'enhanced' ||
                           context?.enhancedMode === true ||
                           process.env.SELLY_ENHANCED_MODE === 'true';

    let response;

    // OPTIMIZATION: Temporarily disable EnhancedSellyIntegration to consolidate response processing
    // This ensures consistent response quality and proper Groq API integration for all users
    const forceSimpleResponseService = true;

    if (useEnhancedMode && !forceSimpleResponseService) {
      // Use Enhanced SELLY Integration for maximum flexibility and adaptability
      console.log('🚀 Using Enhanced SELLY Integration (Advanced, Adaptive, Personalized)...');
      const enhancedSelly = new EnhancedSellyIntegration();

      // Configure enhancement based on context or defaults
      const enhancementConfig = {
        enableContextIntelligence: true,
        enableDynamicResponses: true,
        enablePersonaAdaptation: true,
        enableKnowledgeSynthesis: context?.complexQuery || false,
        enableLocalAI: context?.enableAI || false,
        generateVariations: context?.generateVariations || false,
        maxVariations: 3,
        performanceMode: context?.performanceMode || 'balanced'
      };

      const enhancedResponse = await enhancedSelly.processEnhancedQuery(message, context, enhancementConfig);

      // Convert enhanced response to standard format for compatibility
      response = {
        content: enhancedResponse.content,
        type: enhancedResponse.type,
        metadata: {
          ...enhancedResponse.metadata,
          // Maintain compatibility with existing metadata structure
          suggestions: enhancedResponse.metadata.suggestions || [],
          enhancedMode: true,
          enhancementLayers: enhancedResponse.metadata.enhancementLayers,
          variations: enhancedResponse.variations
        }
      };
    } else {
      // OPTIMIZATION: Force all queries through SimpleResponseService for consistent quality
      // This ensures proper training material routing and Groq API integration
      console.log('🚀 [OPTIMIZATION] Using Simple Response Service (Optimized, Consistent, Reliable)...');
      const simpleResponseService = new SimpleResponseService();
      response = await simpleResponseService.processQuery(message, context);

      // Add standard mode indicator
      response.metadata = {
        ...response.metadata,
        enhancedMode: false
      } as any;
    }

    console.log('API: Response generated:', {
      content: response.content?.substring(0, 100) + (response.content?.length > 100 ? '...' : ''),
      type: response.type,
      metadata: {
        confidence: response.metadata?.confidence,
        processingTime: response.metadata?.processingTime,
        model: response.metadata?.model,
        knowledgeUsed: response.metadata?.knowledgeUsed,
        suggestions: response.metadata?.suggestions || 0,
        fallbackReason: (response.metadata as any)?.fallbackReason
      }
    });

    // Enhanced Training Data Collection
    try {
      const trainingCollector = TrainingDataCollector.getInstance();
      const sessionId = context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Log enhanced query for training data collection
      await trainingCollector.logEnhancedQuery(
        message,
        context?.detectedServiceType || 'general_service',
        response.content,
        {
          userId: context?.userId,
          sessionId,
          previousMessages: context?.previousMessages || [],
          confidence: response.metadata?.confidence,
          responseType: response.type === 'administrative' ? 'knowledge_base' : 'fallback',
          processingTime: response.metadata?.processingTime,
          enhancementMode: (response.metadata as any)?.enhancedMode || false,
          enhancementLayers: (response.metadata as any)?.enhancementLayers || [],
          userAgent: request.headers.get('user-agent') || undefined
        }
      );
    } catch (trainingError) {
      console.warn('⚠️ [TRAINING_COLLECTION] Failed to log enhanced query:', trainingError);
      // Don't fail the request if training data collection fails
    }

    // Record optimization performance metrics
    try {
      const performanceMonitor = PerformanceMonitor.getInstance();
      const totalApiTime = performance.now() - requestStartTime;

      // Record overall API response time for optimization validation
      performanceMonitor.recordMetric(
        'response_time',
        'api_endpoint',
        totalApiTime,
        'ms',
        {
          queryLength: message.length,
          responseType: response.type,
          cacheHit: response.metadata?.model?.includes('Cache') || false,
          fallbackGenerated: response.metadata?.model?.includes('Fallback') || false,
          optimizationPhase: 'phase1_priority1_optimized',
          processingTime: response.metadata?.processingTime
        }
      );

      // Record specific optimization metrics
      if (response.metadata?.model?.includes('Cache')) {
        performanceMonitor.recordMetric(
          'response_time',
          'training_collector',
          totalApiTime,
          'ms',
          {
            source: 'administrative_cache',
            cacheHit: true,
            optimizationSuccess: totalApiTime < 1000
          }
        );
      } else if (response.metadata?.model?.includes('Fallback')) {
        performanceMonitor.recordMetric(
          'response_time',
          'training_collector',
          totalApiTime,
          'ms',
          {
            source: 'optimized_fallback',
            fallbackOptimized: totalApiTime < 1000,
            originalFallbackTime: 2112 // Baseline from live data
          }
        );
      }

    } catch (metricsError) {
      console.warn('⚠️ [PERFORMANCE_METRICS] Failed to record optimization metrics:', metricsError);
    }

    // Cache the response for future requests
    const totalProcessingTime = performance.now() - requestStartTime;

    // Convert SimpleResponseResult to AIResponse for caching compatibility
    const aiResponse = {
      content: response.content,
      type: response.type === 'enhanced' || response.type === 'interactive' ? 'administrative' : response.type,
      metadata: response.metadata
    } as any;

    performanceOptimizer.cacheResponse(message, aiResponse, context, totalProcessingTime);

    // Log performance metrics
    const metrics = performanceOptimizer.getPerformanceMetrics();
    console.log('📊 [PERFORMANCE] Metrics:', {
      processingTime: `${totalProcessingTime.toFixed(0)}ms`,
      cacheSize: metrics.cacheSize,
      cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`
    });

    return NextResponse.json({
      success: true,
      response: response.content,
      type: response.type,
      metadata: {
        ...response.metadata,
        aiProvider: (response.metadata as any).enhancedMode ? 'enhanced-selly-integration' : 'simple-response-service',
        processingTime: totalProcessingTime,
        performanceOptimized: true,
        // Enhanced response metadata (if available)
        ...((response.metadata as any).enhancedMode && {
          enhancementLayers: (response.metadata as any).enhancementLayers,
          qualityScore: (response.metadata as any).qualityScore,
          adaptationApplied: (response.metadata as any).adaptationApplied,
          personalizationLevel: (response.metadata as any).personalizationLevel,
          variations: (response.metadata as any).variations
        })
      },
      // Include variations in response if available
      ...((response.metadata as any).variations && {
        variations: (response.metadata as any).variations
      })
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat memproses permintaan Anda',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
