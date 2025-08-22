import { NextRequest, NextResponse } from 'next/server';
import { getTrainingDataCollector } from '@/services/chatbot/trainingDataCollector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const service = searchParams.get('service');
    const priority = searchParams.get('priority');

    const trainingDataCollector = await getTrainingDataCollector();

    switch (action) {
      case 'stats':
        const stats = await trainingDataCollector.getTrainingStats();
        return NextResponse.json({ success: true, data: stats });

      case 'queries':
        let queries = await trainingDataCollector.getUnansweredQueries();

        // Filter by service if specified
        if (service && service !== 'all') {
          queries = queries.filter(q => q.detectedServiceType === service);
        }

        // Filter by priority if specified
        if (priority && priority !== 'all') {
          queries = queries.filter(q => q.priority === priority);
        }

        return NextResponse.json({ success: true, data: queries });

      case 'high-priority':
        const highPriorityQueries = trainingDataCollector.getHighPriorityQueries();
        return NextResponse.json({ success: true, data: highPriorityQueries });

      case 'suggestions':
        const trainingSuggestions = trainingDataCollector.generateTrainingSuggestions();
        return NextResponse.json({ success: true, data: trainingSuggestions });

      default:
        // Return all data by default
        const allData = {
          stats: await trainingDataCollector.getTrainingStats(),
          queries: await trainingDataCollector.getUnansweredQueries(),
          suggestions: trainingDataCollector.generateTrainingSuggestions()
        };
        return NextResponse.json({ success: true, data: allData });
    }
  } catch (error) {
    console.error('❌ [TRAINING_API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queryId } = body;

    const trainingDataCollector = await getTrainingDataCollector();

    switch (action) {
      case 'mark-in-training':
        const inTrainingResult = trainingDataCollector.markAsInTraining(queryId);
        return NextResponse.json({
          success: inTrainingResult,
          message: inTrainingResult ? 'Query marked as in training' : 'Query not found'
        });

      case 'mark-resolved':
        const resolvedResult = trainingDataCollector.markAsResolved(queryId);
        return NextResponse.json({
          success: resolvedResult,
          message: resolvedResult ? 'Query marked as resolved' : 'Query not found'
        });

      case 'undo-resolved':
        const undoResult = trainingDataCollector.undoResolved(queryId);
        return NextResponse.json({
          success: undoResult,
          message: undoResult ? 'Query status reverted to pending' : 'Query not found or not resolved'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [TRAINING_API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update training data' },
      { status: 500 }
    );
  }
}
