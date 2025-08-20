import { NextRequest, NextResponse } from 'next/server';
import { trainingDataCollector } from '@/services/chatbot/trainingDataCollector';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Starting training data debug...');
    
    // Get data from collector
    const queries = await trainingDataCollector.getUnansweredQueries();
    const stats = await trainingDataCollector.getTrainingStats();
    
    console.log('🔍 [DEBUG] Queries found:', queries.length);
    console.log('🔍 [DEBUG] Stats:', stats);
    
    // Also check file directly
    let fileData = null;
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'training', 'unanswered-queries.json');
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        fileData = JSON.parse(fileContent);
        console.log('🔍 [DEBUG] File data length:', fileData.length);
      } else {
        console.log('🔍 [DEBUG] File does not exist at:', filePath);
      }
    } catch (fileError) {
      console.error('🔍 [DEBUG] File read error:', fileError);
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        collectorQueries: queries.length,
        collectorStats: stats,
        fileData: fileData ? fileData.length : 'No file data',
        queries: queries,
        fileContent: fileData
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
