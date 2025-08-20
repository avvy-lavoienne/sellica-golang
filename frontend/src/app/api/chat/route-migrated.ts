/**
 * Migrated Chat API Route - Day 13-14 Provider Migration
 * Uses MigrationService for seamless transition to UnifiedAIService
 * Maintains backward compatibility while enabling gradual migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationService } from '@/services/chatbot/migration/MigrationService';
import { performanceOptimizer } from '@/services/chatbot/performanceOptimizer';

// Migration configuration based on environment
const MIGRATION_CONFIG = {
  enableUnifiedService: process.env.NEXT_PUBLIC_ENABLE_UNIFIED_SERVICE === 'true',
  enableCompatibilityLayer: true,
  migrationPhase: (process.env.NEXT_PUBLIC_MIGRATION_PHASE as any) || 'preparation',
  rollbackEnabled: true,
  performanceMonitoring: true,
  testMode: process.env.NODE_ENV !== 'production'
};

// Initialize migration service
let migrationInitialized = false;

async function initializeMigration() {
  if (!migrationInitialized) {
    try {
      // Update migration service configuration
      migrationService.updateMigrationPhase(MIGRATION_CONFIG.migrationPhase);
      await migrationService.initialize();
      migrationInitialized = true;
      console.log('✅ [API] Migration service initialized');
    } catch (error) {
      console.error('❌ [API] Migration service initialization failed:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();

  try {
    // Initialize services
    await Promise.all([
      initializeMigration(),
      performanceOptimizer.initialize()
    ]);

    // Parse the request body
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    console.log('🔍 [API] Processing message:', message);
    console.log('🔍 [API] Context:', context);
    console.log('🔄 [API] Migration phase:', MIGRATION_CONFIG.migrationPhase);

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
          cached: true,
          migrationPhase: MIGRATION_CONFIG.migrationPhase
        }
      });
    }

    // Get migrated AI service based on current migration phase
    const aiService = migrationService.getMigratedAIService();
    console.log('🤖 [API] Using migrated AI service');

    // Enhanced context with migration information
    const enhancedContext = {
      ...context,
      migrationPhase: MIGRATION_CONFIG.migrationPhase,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      apiVersion: '2.0-migrated'
    };

    // Process query with migrated service
    let response;
    const processingStartTime = performance.now();

    try {
      // Determine processing method based on legacy API compatibility
      const useHuggingFace = process.env.NEXT_PUBLIC_ENABLE_HUGGINGFACE === 'true' &&
                            process.env.HUGGINGFACE_API_KEY;
      const useDeepSeek = process.env.DEEPSEEK_API_KEY;

      console.log('🤖 AI Service Selection:', { 
        useHuggingFace, 
        useDeepSeek, 
        migrationPhase: MIGRATION_CONFIG.migrationPhase 
      });

      if (useHuggingFace || MIGRATION_CONFIG.migrationPhase === 'complete') {
        // Use enhanced query processing (preserves existing behavior)
        console.log('🤗 Using enhanced query processing...');
        response = await aiService.processEnhancedQuery(message, enhancedContext);
      } else {
        // Use standard query processing
        console.log('🧠 Using standard query processing...');
        response = await aiService.processQuery(message, enhancedContext);
      }

      const processingTime = performance.now() - processingStartTime;
      console.log(`✅ [API] Query processed in ${processingTime.toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ [API] Query processing failed:', error);
      
      // Enhanced error handling with migration context
      return NextResponse.json({
        success: false,
        error: 'Terjadi kesalahan saat memproses permintaan Anda',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          migrationPhase: MIGRATION_CONFIG.migrationPhase,
          processingTime: performance.now() - requestStartTime,
          errorType: 'processing_error'
        }
      }, { status: 500 });
    }

    // Enhanced response logging
    console.log('API: Response generated:', {
      content: response.content?.substring(0, 100) + (response.content?.length > 100 ? '...' : ''),
      type: response.type,
      metadata: {
        confidence: response.metadata?.confidence,
        processingTime: response.metadata?.processingTime,
        provider: response.metadata?.provider || response.metadata?.aiProvider,
        model: response.metadata?.model,
        dataQuery: response.metadata?.dataQuery,
        suggestions: response.metadata?.suggestions?.length || 0,
        aiEnhanced: response.metadata?.aiEnhanced,
        migrationPhase: MIGRATION_CONFIG.migrationPhase
      }
    });

    // Cache the response for future requests
    const totalProcessingTime = performance.now() - requestStartTime;
    performanceOptimizer.cacheResponse(message, response, enhancedContext, totalProcessingTime);

    // Get migration status for monitoring
    const migrationStatus = await migrationService.getMigrationStatus();

    // Log performance metrics with migration context
    const metrics = performanceOptimizer.getPerformanceMetrics();
    console.log('📊 [PERFORMANCE] Metrics:', {
      processingTime: `${totalProcessingTime.toFixed(0)}ms`,
      cacheSize: metrics.cacheSize,
      cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
      migrationPhase: MIGRATION_CONFIG.migrationPhase,
      migrationProgress: `${migrationStatus.migrationProgress}%`,
      providersAvailable: migrationStatus.providersAvailable.length
    });

    // Enhanced response with migration metadata
    return NextResponse.json({
      success: true,
      response: response.content,
      type: response.type,
      metadata: {
        ...response.metadata,
        // Preserve legacy provider information for backward compatibility
        aiProvider: response.metadata?.provider || 'unified',
        processingTime: totalProcessingTime,
        performanceOptimized: true,
        // Migration-specific metadata
        migrationPhase: MIGRATION_CONFIG.migrationPhase,
        migrationProgress: migrationStatus.migrationProgress,
        unifiedServiceUsed: MIGRATION_CONFIG.migrationPhase === 'complete',
        compatibilityLayerActive: migrationStatus.compatibilityLayerActive,
        providersAvailable: migrationStatus.providersAvailable,
        apiVersion: '2.0-migrated'
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Enhanced error response with migration context
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat memproses permintaan Anda',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          migrationPhase: MIGRATION_CONFIG.migrationPhase,
          processingTime: performance.now() - requestStartTime,
          errorType: 'api_error',
          apiVersion: '2.0-migrated'
        }
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

// Migration status endpoint for monitoring
export async function GET() {
  try {
    await initializeMigration();
    const migrationStatus = await migrationService.getMigrationStatus();
    const migrationLogs = migrationService.getMigrationLogs().slice(-10); // Last 10 events

    return NextResponse.json({
      success: true,
      migrationStatus,
      recentLogs: migrationLogs,
      configuration: MIGRATION_CONFIG,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get migration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
