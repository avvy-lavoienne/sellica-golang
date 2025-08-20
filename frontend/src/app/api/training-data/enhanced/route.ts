/**
 * Enhanced Training Data API Endpoint
 * Phase 1 Priority 1: Real User Data Collection System
 * 
 * Provides API endpoints for managing enhanced training data collection,
 * real-time analysis, and conversation tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrainingDataCollector } from '../../../../services/chatbot/trainingDataCollector';
import { RealTimeQueryAnalyzer } from '../../../../services/chatbot/realTimeQueryAnalyzer';
import {
  EnhancedUnansweredQuery,
  QueryClassification,
  SemanticMetadata
} from '../../../../types/enhancedTrainingData';

const trainingCollector = TrainingDataCollector.getInstance();
const queryAnalyzer = RealTimeQueryAnalyzer.getInstance();

/**
 * POST /api/training-data/enhanced
 * Log an enhanced query with real-time analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { query, serviceType, responseGiven, context } = body;
    
    if (!query || !serviceType || !responseGiven || !context || !context.sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: query, serviceType, responseGiven, context.sessionId' 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [ENHANCED_TRAINING_API] Processing enhanced query for service: ${serviceType}`);

    // Initialize services if needed
    await trainingCollector.initialize();
    await queryAnalyzer.initialize();

    // Log enhanced query with real-time analysis
    const queryId = await trainingCollector.logEnhancedQuery(
      query,
      serviceType,
      responseGiven,
      {
        userId: context.userId,
        sessionId: context.sessionId,
        previousMessages: context.previousMessages,
        confidence: context.confidence,
        responseType: context.responseType,
        processingTime: context.processingTime,
        enhancementMode: context.enhancementMode,
        enhancementLayers: context.enhancementLayers,
        userAgent: request.headers.get('user-agent') || undefined,
        deviceInfo: context.deviceInfo
      }
    );

    console.log(`✅ [ENHANCED_TRAINING_API] Enhanced query logged successfully: ${queryId}`);

    return NextResponse.json({
      success: true,
      queryId,
      message: 'Enhanced query logged successfully'
    });

  } catch (error) {
    console.error('❌ [ENHANCED_TRAINING_API] Failed to log enhanced query:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while logging enhanced query' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training-data/enhanced
 * Get enhanced training data and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const queryId = searchParams.get('queryId');
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const serviceType = searchParams.get('serviceType');

    // Initialize services if needed
    await trainingCollector.initialize();
    await queryAnalyzer.initialize();

    switch (action) {
      case 'analyze':
        // Analyze a query in real-time without logging
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'query parameter required for analyze action' },
            { status: 400 }
          );
        }

        const analysisResult = await queryAnalyzer.analyzeQuery(query, {
          sessionId: sessionId || 'temp_session',
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || undefined
        });

        return NextResponse.json({
          success: true,
          analysis: analysisResult
        });

      case 'performance':
        // Get performance metrics from the analyzer
        const performanceMetrics = queryAnalyzer.getPerformanceMetrics();
        
        return NextResponse.json({
          success: true,
          metrics: performanceMetrics
        });

      case 'queries':
        // Get enhanced queries (placeholder - would need implementation in TrainingDataCollector)
        return NextResponse.json({
          success: true,
          message: 'Enhanced queries retrieval not yet implemented',
          queries: []
        });

      case 'session':
        // Get conversation data for a specific session
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'sessionId parameter required for session action' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Session data retrieval not yet implemented',
          sessionData: null
        });

      case 'analytics':
        // Get enhanced training data analytics
        return NextResponse.json({
          success: true,
          message: 'Enhanced analytics not yet implemented',
          analytics: {
            totalEnhancedQueries: 0,
            averageAnalysisTime: 0,
            topServiceTypes: [],
            complexityDistribution: {},
            enhancementModeUsage: 0
          }
        });

      default:
        // Default: return system status
        return NextResponse.json({
          success: true,
          status: {
            trainingCollectorInitialized: true,
            queryAnalyzerInitialized: true,
            enhancedModeAvailable: true,
            realTimeAnalysisAvailable: true
          }
        });
    }

  } catch (error) {
    console.error('❌ [ENHANCED_TRAINING_API] Failed to get enhanced data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while retrieving enhanced data' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training-data/enhanced
 * Update enhanced query data or configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queryId, updates } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing action field' },
        { status: 400 }
      );
    }

    // Initialize services if needed
    await trainingCollector.initialize();

    switch (action) {
      case 'update_query':
        // Update an enhanced query (placeholder)
        if (!queryId || !updates) {
          return NextResponse.json(
            { success: false, error: 'queryId and updates required for update_query action' },
            { status: 400 }
          );
        }

        console.log(`📝 [ENHANCED_TRAINING_API] Updating query ${queryId}`);

        return NextResponse.json({
          success: true,
          message: 'Query update not yet implemented',
          queryId
        });

      case 'add_feedback':
        // Add feedback to an enhanced query
        if (!queryId || !updates.feedback) {
          return NextResponse.json(
            { success: false, error: 'queryId and updates.feedback required for add_feedback action' },
            { status: 400 }
          );
        }

        console.log(`💬 [ENHANCED_TRAINING_API] Adding feedback to query ${queryId}`);

        return NextResponse.json({
          success: true,
          message: 'Feedback addition not yet implemented',
          queryId
        });

      case 'update_status':
        // Update query status (pending, in_training, trained, resolved)
        if (!queryId || !updates.status) {
          return NextResponse.json(
            { success: false, error: 'queryId and updates.status required for update_status action' },
            { status: 400 }
          );
        }

        console.log(`🔄 [ENHANCED_TRAINING_API] Updating status for query ${queryId} to ${updates.status}`);

        return NextResponse.json({
          success: true,
          message: 'Status update not yet implemented',
          queryId,
          newStatus: updates.status
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [ENHANCED_TRAINING_API] Failed to update enhanced data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while updating enhanced data' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training-data/enhanced
 * Delete enhanced training data (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');
    const sessionId = searchParams.get('sessionId');
    const confirm = searchParams.get('confirm');
    
    if (confirm !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Confirmation required. Add ?confirm=true to the request' 
        },
        { status: 400 }
      );
    }

    if (queryId) {
      console.log(`🗑️ [ENHANCED_TRAINING_API] Deleting enhanced query: ${queryId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Query deletion not yet implemented',
        queryId
      });
    } else if (sessionId) {
      console.log(`🗑️ [ENHANCED_TRAINING_API] Deleting session data: ${sessionId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Session deletion not yet implemented',
        sessionId
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Either queryId or sessionId parameter required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [ENHANCED_TRAINING_API] Failed to delete enhanced data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while deleting enhanced data' 
      },
      { status: 500 }
    );
  }
}
