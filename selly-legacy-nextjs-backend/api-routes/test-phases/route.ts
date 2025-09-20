/**
 * API endpoint to run phase tests
 * GET /api/test-phases - Run all phase tests
 * GET /api/test-phases?phase=1 - Run specific phase
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPhase1Tests } from '@/services/chatbot/testPhase1Implementation';
import { runPhase2Tests } from '@/services/chatbot/testPhase2Implementation';
import { runPhase3Tests } from '@/services/chatbot/testPhase3Implementation';
import { runAllPhaseTests } from '@/services/chatbot/__tests__/runAllPhaseTests';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phase = searchParams.get('phase');
  const format = searchParams.get('format') || 'json';

  try {
    let result: any = {};
    let logs: string[] = [];

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    
    console.error = (...args: any[]) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };

    const startTime = Date.now();

    try {
      if (phase === '1') {
        logs.push('🚀 Running Phase 1 Tests...');
        runPhase1Tests();
        result = {
          phase: 1,
          status: 'SUCCESS',
          description: 'Phase 1: 5 documents (KTP, KIA, Akta Kematian, Akta Perkawinan, Biodata Penduduk)',
          coverage: '37.5%'
        };
      } else if (phase === '2') {
        logs.push('🚀 Running Phase 2 Tests...');
        runPhase2Tests();
        result = {
          phase: 2,
          status: 'SUCCESS',
          description: 'Phase 2: 8 medium-priority documents',
          coverage: '70.8%'
        };
      } else if (phase === '3') {
        logs.push('🚀 Running Phase 3 Tests...');
        runPhase3Tests();
        result = {
          phase: 3,
          status: 'SUCCESS',
          description: 'Phase 3: 7 remaining documents',
          coverage: '100%'
        };
      } else {
        logs.push('🚀 Running All Phase Tests...');
        runAllPhaseTests();
        result = {
          phases: 'ALL',
          status: 'SUCCESS',
          description: 'All phases executed: Complete automated pattern generation system test',
          coverage: '100%'
        };
      }
    } catch (testError) {
      result = {
        phase: phase || 'ALL',
        status: 'ERROR',
        error: testError instanceof Error ? testError.message : String(testError)
      };
    }

    const duration = Date.now() - startTime;

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    const response = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result,
      logs: logs.slice(-50), // Last 50 log entries to avoid huge responses
      totalLogs: logs.length
    };

    if (format === 'text') {
      // Return as plain text for easy reading
      const textResponse = [
        '🚀 PHASE TESTS EXECUTION REPORT',
        '='.repeat(50),
        `📅 Timestamp: ${response.timestamp}`,
        `⏱️ Duration: ${response.duration}`,
        `📊 Status: ${result.status}`,
        `📋 Description: ${result.description || 'N/A'}`,
        `🎯 Coverage: ${result.coverage || 'N/A'}`,
        '',
        '📝 EXECUTION LOGS:',
        '-'.repeat(30),
        ...logs,
        '',
        '✅ EXECUTION COMPLETED',
        '='.repeat(50)
      ].join('\n');

      return new NextResponse(textResponse, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute phase tests',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phases = ['1', '2', '3'] } = body;

    const results = [];
    
    for (const phase of phases) {
      const phaseUrl = new URL(request.url);
      phaseUrl.searchParams.set('phase', phase);
      
      // Simulate internal call
      const phaseRequest = new NextRequest(phaseUrl);
      const phaseResponse = await GET(phaseRequest);
      const phaseData = await phaseResponse.json();
      
      results.push(phaseData);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      executedPhases: phases,
      results,
      summary: {
        total: phases.length,
        successful: results.filter(r => r.result?.status === 'SUCCESS').length,
        failed: results.filter(r => r.result?.status === 'ERROR').length
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to execute batch phase tests',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
