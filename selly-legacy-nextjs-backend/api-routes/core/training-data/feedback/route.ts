/**
 * User Feedback Collection API Endpoint
 * Phase 1 Priority 1: Real User Data Collection System
 * 
 * Provides API endpoints for collecting and managing user feedback
 * for training data improvement and system optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserFeedbackCollector } from '../../../../services/chatbot/userFeedbackCollector';
import {
  UserFeedback,
  FeedbackType,
  DetailedFeedback,
  ResponseContext,
  UserContext
} from '../../../../types/enhancedTrainingData';

const feedbackCollector = UserFeedbackCollector.getInstance();

/**
 * POST /api/training-data/feedback
 * Collect user feedback for a specific query/response interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { queryId, sessionId, feedbackData, responseContext, userContext } = body;
    
    if (!queryId || !sessionId || !feedbackData || !responseContext || !userContext) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: queryId, sessionId, feedbackData, responseContext, userContext' 
        },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validFeedbackTypes: FeedbackType[] = ['rating', 'text', 'thumbs', 'detailed', 'suggestion'];
    if (!validFeedbackTypes.includes(feedbackData.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid feedback type. Must be one of: ${validFeedbackTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    console.log(`📝 [FEEDBACK_API] Collecting ${feedbackData.type} feedback for query ${queryId}`);

    // Initialize feedback collector if needed
    await feedbackCollector.initialize();

    // Collect feedback
    const feedbackId = await feedbackCollector.collectFeedback(
      queryId,
      body.userId,
      sessionId,
      feedbackData,
      responseContext,
      userContext
    );

    console.log(`✅ [FEEDBACK_API] Feedback collected successfully: ${feedbackId}`);

    return NextResponse.json({
      success: true,
      feedbackId,
      message: 'Feedback collected successfully'
    });

  } catch (error) {
    console.error('❌ [FEEDBACK_API] Failed to collect feedback:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while collecting feedback' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training-data/feedback
 * Get feedback analytics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const queryId = searchParams.get('queryId');
    const userId = searchParams.get('userId');
    const hours = searchParams.get('hours');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Initialize feedback collector if needed
    await feedbackCollector.initialize();

    switch (action) {
      case 'analytics':
        // Get overall feedback analytics
        const analytics = feedbackCollector.getFeedbackAnalytics();
        
        return NextResponse.json({
          success: true,
          analytics
        });

      case 'query':
        // Get feedback for a specific query
        if (!queryId) {
          return NextResponse.json(
            { success: false, error: 'queryId parameter required for query action' },
            { status: 400 }
          );
        }
        
        const queryFeedback = feedbackCollector.getFeedbackForQuery(queryId);
        
        return NextResponse.json({
          success: true,
          feedback: queryFeedback
        });

      case 'user':
        // Get feedback for a specific user
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId parameter required for user action' },
            { status: 400 }
          );
        }
        
        const userFeedback = feedbackCollector.getFeedbackForUser(userId);
        
        return NextResponse.json({
          success: true,
          feedback: userFeedback
        });

      case 'recent':
        // Get recent feedback
        const recentHours = hours ? parseInt(hours) : 24;
        const recentFeedback = feedbackCollector.getRecentFeedback(recentHours);
        
        return NextResponse.json({
          success: true,
          feedback: recentFeedback,
          timeRange: `${recentHours} hours`
        });

      case 'statistics':
        // Get feedback statistics for a date range
        if (!startDate || !endDate) {
          return NextResponse.json(
            { success: false, error: 'startDate and endDate parameters required for statistics action' },
            { status: 400 }
          );
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
            { status: 400 }
          );
        }
        
        const statistics = feedbackCollector.getFeedbackStatistics(start, end);
        
        return NextResponse.json({
          success: true,
          statistics,
          dateRange: { startDate, endDate }
        });

      default:
        // Default: return analytics
        const defaultAnalytics = feedbackCollector.getFeedbackAnalytics();
        
        return NextResponse.json({
          success: true,
          analytics: defaultAnalytics
        });
    }

  } catch (error) {
    console.error('❌ [FEEDBACK_API] Failed to get feedback data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while retrieving feedback data' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training-data/feedback
 * Update feedback collector configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Missing config object' },
        { status: 400 }
      );
    }

    console.log('⚙️ [FEEDBACK_API] Updating feedback collector configuration');

    // Initialize feedback collector if needed
    await feedbackCollector.initialize();

    // Update configuration
    feedbackCollector.updateConfig(config);
    
    const updatedConfig = feedbackCollector.getConfig();

    console.log('✅ [FEEDBACK_API] Configuration updated successfully');

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('❌ [FEEDBACK_API] Failed to update configuration:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while updating configuration' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training-data/feedback
 * Clear feedback data (admin only - for development/testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    console.log('🗑️ [FEEDBACK_API] Clearing feedback data (admin action)');

    // In a real implementation, this would clear the feedback storage
    // For now, we'll just log the action
    console.log('⚠️ [FEEDBACK_API] Feedback data clearing not implemented in this version');

    return NextResponse.json({
      success: true,
      message: 'Feedback data clearing requested (not implemented in this version)'
    });

  } catch (error) {
    console.error('❌ [FEEDBACK_API] Failed to clear feedback data:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while clearing feedback data' 
      },
      { status: 500 }
    );
  }
}
