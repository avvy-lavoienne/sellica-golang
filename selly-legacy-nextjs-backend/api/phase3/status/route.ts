/**
 * Phase 3 Status API Route
 * Provides status information about Phase 3 Cache Warming Optimization components
 * and can trigger initialization if needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeServerForNextJS, validatePhase3Activation } from '@/lib/startup/ServerInitializer';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PHASE3_API] Checking Phase 3 status...');
    
    // Ensure server initialization has run
    await initializeServerForNextJS();
    
    // Validate Phase 3 activation
    const validation = await validatePhase3Activation();
    
    const response = {
      timestamp: new Date().toISOString(),
      phase3Status: {
        isActive: validation.isActive,
        activeComponents: validation.activeComponents,
        inactiveComponents: validation.inactiveComponents,
        totalComponents: validation.totalComponents,
        activationRate: `${validation.activeComponents.length}/${validation.totalComponents}`
      },
      featureFlags: {
        ENABLE_INTELLIGENT_CACHE_WARMING: process.env.ENABLE_INTELLIGENT_CACHE_WARMING === 'true',
        ENABLE_CACHE_WARMING_SCHEDULER: process.env.ENABLE_CACHE_WARMING_SCHEDULER === 'true',
        ENABLE_PREDICTIVE_CACHE_ANALYZER: process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER === 'true',
        ENABLE_UNIFIED_CACHE_KEYS: process.env.ENABLE_UNIFIED_CACHE_KEYS === 'true',
        ENABLE_STARTUP_MANAGER: process.env.ENABLE_STARTUP_MANAGER === 'true'
      },
      message: validation.isActive 
        ? `Phase 3 Cache Warming Optimization is active with ${validation.activeComponents.length} components`
        : 'Phase 3 Cache Warming Optimization is not active'
    };
    
    console.log('✅ [PHASE3_API] Status check completed:', {
      active: validation.isActive,
      components: `${validation.activeComponents.length}/${validation.totalComponents}`
    });
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ [PHASE3_API] Status check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Failed to check Phase 3 status',
      details: error instanceof Error ? error.message : 'Unknown error',
      phase3Status: {
        isActive: false,
        activeComponents: [],
        inactiveComponents: ['Status check failed'],
        totalComponents: 3,
        activationRate: '0/3'
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [PHASE3_API] Triggering Phase 3 initialization...');
    
    // Force server initialization
    await initializeServerForNextJS();
    
    // Validate activation
    const validation = await validatePhase3Activation();
    
    const response = {
      timestamp: new Date().toISOString(),
      action: 'initialization_triggered',
      phase3Status: {
        isActive: validation.isActive,
        activeComponents: validation.activeComponents,
        inactiveComponents: validation.inactiveComponents,
        totalComponents: validation.totalComponents,
        activationRate: `${validation.activeComponents.length}/${validation.totalComponents}`
      },
      message: validation.isActive 
        ? `Phase 3 initialization successful - ${validation.activeComponents.length} components active`
        : 'Phase 3 initialization completed but components not active'
    };
    
    console.log('✅ [PHASE3_API] Initialization completed:', {
      active: validation.isActive,
      components: `${validation.activeComponents.length}/${validation.totalComponents}`
    });
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('❌ [PHASE3_API] Initialization failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      action: 'initialization_failed',
      error: 'Failed to initialize Phase 3',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
