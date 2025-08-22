import { NextRequest, NextResponse } from 'next/server';
// Phase 1: Use ServiceContainer for dependency injection
import { getSimpleResponseService } from '@/services/core/ServiceRegistration';
// Phase 1 Priority 2: EnhancedSellyIntegration replaced by IntelligenceLayer via ServiceContainer
import { performanceOptimizer } from '@/services/chatbot/performanceOptimizer';
import { TrainingDataCollector } from '@/services/chatbot/trainingDataCollector';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
// Removed deprecated PerformanceOptimizer - using PerformanceMonitor instead
import { getEnhancedFallbackService } from '@/services/ai/enhancedFallbackService';
import { isFeatureEnabled } from '@/config/featureFlags';
import { getTensorFlowRemovalMonitor } from '@/services/monitoring/tensorFlowRemovalMonitor';
import { EnhancedAuthMiddleware } from '@/services/auth/EnhancedAuthMiddleware';
// MEDIUM-1: Import authentication consistent chat storage and session management
import { authenticationConsistentChatStorage } from '@/services/chatbot/AuthenticationConsistentChatStorage';
import { sessionAnalyticsService } from '@/services/session/SessionAnalyticsService';
import { crossDeviceSessionSync } from '@/services/session/CrossDeviceSessionSync';

export async function POST(request: NextRequest) {
  console.log('🚨 [API] ROUTE ENTRY - Using MODIFIED route with direct backend integration');
  const requestStartTime = performance.now();

  try {
    // Initialize enhanced authentication middleware
    const authMiddleware = EnhancedAuthMiddleware.getInstance();

    // Get enhanced authentication context with UUID mapping
    const authContext = await authMiddleware.createRequestContext(request);
    console.log('🔐 [AUTH] Enhanced context:', {
      userId: authContext.userId.slice(0, 8) + '...',
      sessionId: authContext.sessionId.slice(0, 8) + '...',
      isAuthenticated: authContext.isAuthenticated,
      processingTime: authContext.metadata.processingTime
    });

    // Parse the request body first
    const { message, context, enhancementMode } = await request.json();

    // MEDIUM-1: Create authentication consistent session
    let consistentSessionId: string;
    try {
      // Extract user from auth context if authenticated
      const user = authContext.isAuthenticated ? {
        id: authContext.userId,
        email: authContext.metadata.email || 'unknown@example.com'
      } : undefined;

      consistentSessionId = await authenticationConsistentChatStorage.createOrGetAuthenticationConsistentSession(
        user,
        request,
        {
          guestUuid: authContext.isAuthenticated ? undefined : authContext.userId,
          metadata: {
            originalSessionId: authContext.sessionId,
            authMiddlewareUsed: true,
            enhancementMode: enhancementMode || 'standard'
          }
        }
      );

      // Track session analytics
      await sessionAnalyticsService.trackSessionStart(
        consistentSessionId,
        authContext.isAuthenticated ? authContext.userId : undefined,
        authContext.isAuthenticated ? undefined : authContext.userId,
        {
          apiEndpoint: '/api/chat',
          enhancementMode: context?.enhancementMode || 'standard',
          authMiddleware: 'enhanced'
        }
      );

      console.log(`✅ [MEDIUM-1] Authentication consistent session: ${consistentSessionId.slice(0, 8)}... (original: ${authContext.sessionId.slice(0, 8)}...)`);

    } catch (error) {
      console.error('❌ [MEDIUM-1] Failed to create authentication consistent session:', error);
      // Fallback to original session ID
      consistentSessionId = authContext.sessionId;
    }

    // Initialize performance monitoring with modern PerformanceMonitor
    const performanceMonitor = PerformanceMonitor.getInstance();
    const performanceReport = performanceMonitor.generateConsolidatedReport();

    // Initialize legacy performance optimizer for compatibility
    await performanceOptimizer.initialize();

    // Request body already parsed above

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    console.log('🔍 [API] Processing message:', message);
    console.log('🔍 [API] Context:', context);
    console.log('🔍 [API] Enhancement mode:', enhancementMode || 'standard');

    // Get optimization recommendations using modern PerformanceMonitor
    const optimization = {
      useCache: performanceReport.cacheEfficiency > 0.8,
      skipRedundantProcessing: message.length < 50,
      estimatedResponseTime: Math.max(100, performanceReport.averageResponseTime)
    };
    console.log(`🚀 [OPTIMIZATION] Estimated response time: ${optimization.estimatedResponseTime}ms`);

    // Check cache first for immediate response (legacy compatibility)
    const cachedResponse = performanceOptimizer.getCachedResponse(message, context);
    if (cachedResponse && optimization.useCache) {
      console.log('⚡ [PERFORMANCE] Returning cached response');
      return NextResponse.json({
        success: true,
        response: cachedResponse.content,
        type: cachedResponse.type,
        metadata: {
          ...cachedResponse.metadata,
          processingTime: performance.now() - requestStartTime,
          cached: true,
          optimized: true
        }
      });
    }

    // Check TensorFlow/IndoBERT bypass flags
    const tensorFlowDisabled = isFeatureEnabled('disable_tensorflow');
    const indoBERTDisabled = isFeatureEnabled('disable_indobert');
    const enhancedFallbackEnabled = isFeatureEnabled('enable_enhanced_fallback');

    // Determine processing mode
    const useEnhancedMode = enhancementMode === 'enhanced' ||
                           context?.enhancedMode === true ||
                           process.env.SELLY_ENHANCED_MODE === 'true';

    const shouldUseEnhancedFallback = tensorFlowDisabled && indoBERTDisabled && enhancedFallbackEnabled;

    let response;

    // OPTIMIZATION: Enable backend integration for 100% Golang backend routing
    // This ensures optimal performance and proper backend integration for all users
    const forceSimpleResponseService = false;

    // FORCE 100% BACKEND INTEGRATION - Direct Go Backend Call
    // ALWAYS use backend - bypass all conditions
    const useBackendIntegration = true; // Force to true

    console.log('🔍 [API] Backend integration check:', {
      useBackendIntegration,
      forceSimpleResponseService,
      featureFlag: isFeatureEnabled('enableBackendIntegration'),
      envVar: process.env.NEXT_PUBLIC_FORCE_BACKEND_INTEGRATION
    });

    if (useBackendIntegration && !forceSimpleResponseService) {
      console.log('✅ [API] Condition met - proceeding with backend integration');
      try {
        console.log('🚀 [API] FORCING direct Go backend call');

        // Direct call to Go backend (bypass complex routing)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const backendEndpoint = `${backendUrl}/chat`;

        console.log('🎯 [API] Calling Go backend directly:', backendEndpoint);

        const backendResponse = await fetch(backendEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SELLY-Frontend-API/1.0',
            'X-Request-Source': 'main-api-route'
          },
          body: JSON.stringify({
            message,
            context,
            sessionId: consistentSessionId,
            enhancementMode: enhancementMode || 'standard'
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!backendResponse.ok) {
          throw new Error(`Backend responded with status: ${backendResponse.status}`);
        }

        const backendResult = await backendResponse.json();
        const totalProcessingTime = performance.now() - requestStartTime;

        console.log('✅ [API] Direct Go backend response received:', {
          status: backendResponse.status,
          processingTime: totalProcessingTime,
          hasContent: !!backendResult.content || !!backendResult.response
        });

        // IMMEDIATELY RETURN Go backend response
        return NextResponse.json({
          success: true,
          response: backendResult.content || backendResult.response || backendResult.message,
          type: backendResult.type || 'text',
          metadata: {
            source: 'golang-backend-direct',
            totalProcessingTime,
            backendProcessingTime: backendResult.processingTime,
            apiVersion: 'direct-backend-v1.0',
            timestamp: new Date().toISOString(),
            sessionId: consistentSessionId,
            userId: authContext.isAuthenticated ? authContext.userId : undefined,
            isAuthenticated: authContext.isAuthenticated,
            backendUrl: backendEndpoint
          }
        });

      } catch (backendError) {
        console.warn('⚠️ [API] Direct backend call failed, using fallback:', {
          error: backendError instanceof Error ? backendError.message : 'Unknown error',
          backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL
        });
        response = null; // Will trigger fallback logic below
      }
    } else {
      console.log('❌ [API] Backend integration condition NOT met:', {
        useBackendIntegration,
        forceSimpleResponseService,
        condition: useBackendIntegration && !forceSimpleResponseService
      });
    }

    // If no backend response, continue with existing fallback logic
    if (!response && shouldUseEnhancedFallback) {
      // Use Enhanced Fallback Service when TensorFlow/IndoBERT are disabled
      console.log('🚀 [TENSORFLOW_REMOVAL] Using Enhanced Fallback Service (TensorFlow/IndoBERT bypassed)...');
      const enhancedFallbackService = getEnhancedFallbackService();
      await enhancedFallbackService.initialize();

      // Initialize removal monitor
      const removalMonitor = getTensorFlowRemovalMonitor();
      await removalMonitor.initialize();

      const fallbackStartTime = performance.now();
      const fallbackResult = await enhancedFallbackService.processQuery(
        message,
        {
          userId: authContext.userId, // Use UUID-mapped user ID
          sessionId: authContext.sessionId, // Use UUID-mapped session ID
          previousQueries: context?.previousQueries,
          currentTopic: context?.currentTopic,
          conversationStage: context?.conversationStage,
          requiresRealTime: context?.requiresRealTime,
          complexity: context?.complexity,
          language: context?.language
        },
        authContext.userId // Use UUID-mapped user ID
      );

      const fallbackProcessingTime = performance.now() - fallbackStartTime;
      response = fallbackResult.response;

      // Record metrics for removal monitoring
      removalMonitor.recordQuery({
        timestamp: new Date(),
        query: message.substring(0, 100), // Truncate for privacy
        responseTime: fallbackProcessingTime,
        serviceUsed: fallbackResult.serviceUsed,
        success: true,
        tensorFlowBypassed: tensorFlowDisabled,
        indoBERTBypassed: indoBERTDisabled,
        fallbackReason: fallbackResult.fallbackReason,
        confidence: fallbackResult.confidence,
        retryCount: fallbackResult.retryCount
      });

      // Add fallback metadata
      response.metadata = {
        ...response.metadata,
        enhancedMode: true,
        fallbackUsed: true,
        fallbackReason: fallbackResult.fallbackReason,
        serviceUsed: fallbackResult.serviceUsed,
        retryCount: fallbackResult.retryCount,
        bypassedServices: ['tensorflow', 'indobert'],
        removalMonitoring: true
      } as any;

    } else if (useEnhancedMode && !forceSimpleResponseService) {
      // Phase 1 Priority 2: Use IntelligenceLayer through ServiceContainer (replaces EnhancedSellyIntegration)
      console.log('🚀 Using IntelligenceLayer via ServiceContainer (Advanced, Adaptive, Personalized)...');
      const simpleResponseService = getSimpleResponseService();

      // Configure enhancement based on context or defaults - IntelligenceLayer handles this internally
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

      // Create enhanced context with UUID-mapped identifiers and enhancement config
      const enhancedContext = {
        ...context,
        userId: authContext.userId, // Use UUID-mapped user ID
        sessionId: authContext.sessionId, // Use UUID-mapped session ID
        isAuthenticated: authContext.isAuthenticated,
        userEmail: authContext.userEmail,
        authMetadata: authContext.metadata,
        enhancementConfig // Pass enhancement config to IntelligenceLayer
      };

      const enhancedResponse = await simpleResponseService.processQuery(message, enhancedContext);

      // IntelligenceLayer provides enhanced response format - maintain compatibility
      response = {
        content: enhancedResponse.content,
        type: enhancedResponse.type,
        metadata: {
          ...enhancedResponse.metadata,
          // Maintain compatibility with existing metadata structure
          suggestions: enhancedResponse.metadata.suggestions || [],
          enhancedMode: true,
          enhancementMetadata: {
            ...enhancedResponse.metadata.enhancementMetadata,
            intelligenceLayerApplied: true,
            enhancementLayers: enhancedResponse.metadata.enhancementMetadata?.enhancementLayers || ['IntelligenceLayer'],
            enhancedMode: true
          }
        }
      };
    } else {
      // OPTIMIZATION: Force all queries through SimpleResponseService for consistent quality
      // This ensures proper training material routing and Groq API integration
      console.log('🚀 [OPTIMIZATION] Using Simple Response Service (Optimized, Consistent, Reliable)...');
      // Phase 1: Use ServiceContainer for dependency injection
      const simpleResponseService = getSimpleResponseService();

      // Create enhanced context with UUID-mapped identifiers
      const enhancedContext = {
        ...context,
        userId: authContext.userId, // Use UUID-mapped user ID
        sessionId: authContext.sessionId, // Use UUID-mapped session ID
        isAuthenticated: authContext.isAuthenticated,
        userEmail: authContext.userEmail,
        authMetadata: authContext.metadata
      };

      response = await simpleResponseService.processQuery(message, enhancedContext);

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
      const trainingCollector = await TrainingDataCollector.getInstance();
      const sessionId = context?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Log enhanced query for training data collection with UUID-mapped identifiers
      await trainingCollector.logEnhancedQuery(
        message,
        context?.detectedServiceType || 'general_service',
        response.content,
        {
          userId: authContext.userId, // Use UUID-mapped user ID
          sessionId: authContext.sessionId, // Use UUID-mapped session ID
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
    // Handle type conversion for IntelligenceLayer enhanced types
    let responseType: "text" | "data" | "chart" | "table" | "administrative" = 'administrative';
    if (response.type === 'text' || response.type === 'data' || response.type === 'chart' || response.type === 'table' || response.type === 'administrative') {
      responseType = response.type;
    } else if (response.type === 'enhanced' || response.type === 'interactive') {
      responseType = 'administrative';
    }

    const aiResponse = {
      content: response.content,
      type: responseType,
      metadata: response.metadata
    } as any;

    performanceOptimizer.cacheResponse(message, aiResponse, context, totalProcessingTime);

    // MEDIUM-1: Store messages with authentication consistency
    try {
      // Store user message
      await authenticationConsistentChatStorage.storeAuthenticationConsistentMessage(
        consistentSessionId,
        'user',
        message,
        {
          userContext: authContext.isAuthenticated ? {
            userId: authContext.userId,
            email: authContext.metadata.email || 'unknown@example.com',
            isAuthenticated: true,
            profileExists: true,
            sessionSecurityLevel: 'basic'
          } : {
            guestUuid: authContext.userId,
            isAuthenticated: false,
            sessionSecurityLevel: 'basic',
            temporarySession: true
          },
          metadata: {
            originalSessionId: authContext.sessionId,
            processingTime: totalProcessingTime,
            enhancementMode: enhancementMode || 'standard'
          }
        }
      );

      // Store assistant response
      await authenticationConsistentChatStorage.storeAuthenticationConsistentMessage(
        consistentSessionId,
        'assistant',
        response.content,
        {
          userContext: authContext.isAuthenticated ? {
            userId: authContext.userId,
            email: authContext.metadata.email || 'unknown@example.com',
            isAuthenticated: true,
            profileExists: true,
            sessionSecurityLevel: 'basic'
          } : {
            guestUuid: authContext.userId,
            isAuthenticated: false,
            sessionSecurityLevel: 'basic',
            temporarySession: true
          },
          metadata: {
            responseType: response.type,
            aiProvider: (response.metadata as any).enhancedMode ? 'enhanced-selly-integration' : 'simple-response-service',
            processingTime: totalProcessingTime,
            qualityScore: (response.metadata as any).qualityScore,
            enhancementMode: enhancementMode || 'standard'
          }
        }
      );

      // Track message analytics
      await sessionAnalyticsService.trackMessageInteraction(
        consistentSessionId,
        'sent',
        authContext.isAuthenticated ? authContext.userId : undefined,
        authContext.isAuthenticated ? undefined : authContext.userId,
        totalProcessingTime,
        (response.metadata as any).qualityScore
      );

      await sessionAnalyticsService.trackMessageInteraction(
        consistentSessionId,
        'received',
        authContext.isAuthenticated ? authContext.userId : undefined,
        authContext.isAuthenticated ? undefined : authContext.userId,
        totalProcessingTime,
        (response.metadata as any).qualityScore
      );

      console.log(`✅ [MEDIUM-1] Messages stored with authentication consistency: ${consistentSessionId.slice(0, 8)}...`);

    } catch (error) {
      console.error('❌ [MEDIUM-1] Failed to store authentication consistent messages:', error);
      // Continue with response even if storage fails
    }

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
        // MEDIUM-1: Include authentication consistent session information
        sessionId: consistentSessionId,
        originalSessionId: authContext.sessionId,
        authenticationConsistent: true,
        userId: authContext.isAuthenticated ? authContext.userId : undefined,
        guestUuid: authContext.isAuthenticated ? undefined : authContext.userId,
        isAuthenticated: authContext.isAuthenticated,
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
