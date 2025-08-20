/**
 * ServerInitializer
 * Phase 3: Server-side initialization for Next.js application startup
 * 
 * Integrates ApplicationStartupManager into Next.js lifecycle to activate
 * Phase 3 Cache Warming Optimization components during server startup.
 */

import { ApplicationStartupManager } from '@/services/core/ApplicationStartupManager';

/**
 * Server initialization state
 */
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize server-side services during Next.js startup
 * This function is called once during server startup and ensures
 * Phase 3 Cache Warming Optimization components are activated.
 */
export async function initializeServer(): Promise<void> {
  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = performServerInitialization();
  
  try {
    await initializationPromise;
    isInitialized = true;
    console.log('✅ [SERVER_INIT] Server initialization completed successfully');
  } catch (error) {
    console.error('❌ [SERVER_INIT] Server initialization failed:', error);
    // Reset state to allow retry
    initializationPromise = null;
    throw error;
  }
}

/**
 * Perform the actual server initialization
 */
async function performServerInitialization(): Promise<void> {
  console.log('🚀 [SERVER_INIT] Starting Next.js server initialization...');
  
  try {
    // Initialize ApplicationStartupManager to activate Phase 3 components
    if (ApplicationStartupManager.isEnabled()) {
      console.log('🔧 [SERVER_INIT] ApplicationStartupManager enabled, initializing...');
      
      const startupManager = await ApplicationStartupManager.getInstance();
      const startupResult = await startupManager.getStartupMetrics();
      
      if (startupResult) {
        console.log(`📊 [SERVER_INIT] Startup metrics:`, {
          totalTime: `${startupResult.totalStartupTime.toFixed(2)}ms`,
          servicesInitialized: startupResult.servicesInitialized,
          failedServices: startupResult.failedServices.length,
          phases: startupResult.startupPhases?.length || 0
        });
        
        // Log Phase 3 component status
        const initializedServices = startupManager.getInitializedServices();
        const phase3Components = [
          'IntelligentCacheWarmer',
          'CacheWarmingScheduler', 
          'PredictiveCacheAnalyzer'
        ];
        
        console.log('🔍 [SERVER_INIT] Phase 3 component status:');
        phase3Components.forEach(component => {
          const isInitialized = initializedServices.includes(component);
          const status = isInitialized ? '✅ ACTIVE' : '❌ INACTIVE';
          console.log(`   ${status} ${component}`);
        });
        
        // Validate Phase 3 activation
        const activePhase3Components = phase3Components.filter(component => 
          initializedServices.includes(component)
        );
        
        if (activePhase3Components.length > 0) {
          console.log(`🎉 [SERVER_INIT] Phase 3 Cache Warming Optimization activated! (${activePhase3Components.length}/3 components)`);
        } else {
          console.warn('⚠️ [SERVER_INIT] Phase 3 components not activated - check feature flags');
        }
      } else {
        console.warn('⚠️ [SERVER_INIT] ApplicationStartupManager initialized but no metrics available');
      }
    } else {
      console.log('ℹ️ [SERVER_INIT] ApplicationStartupManager disabled (ENABLE_STARTUP_MANAGER=false)');
    }
    
    console.log('✅ [SERVER_INIT] Server initialization sequence completed');
    
  } catch (error) {
    console.error('❌ [SERVER_INIT] Server initialization failed:', error);
    throw error;
  }
}

/**
 * Get initialization status
 */
export function getInitializationStatus(): {
  isInitialized: boolean;
  isInProgress: boolean;
} {
  return {
    isInitialized,
    isInProgress: initializationPromise !== null && !isInitialized
  };
}

/**
 * Force re-initialization (for testing/development)
 */
export async function reinitializeServer(): Promise<void> {
  console.log('🔄 [SERVER_INIT] Forcing server re-initialization...');
  
  isInitialized = false;
  initializationPromise = null;
  
  await initializeServer();
}

/**
 * Server initialization function for Next.js
 * This function should be called during Next.js server startup
 */
export async function initializeServerForNextJS(): Promise<void> {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    await initializeServer();
  } catch (error) {
    console.error('❌ [SERVER_INIT] Server initialization failed:', error);
    // Don't throw to prevent breaking the application
  }
}

/**
 * Validate Phase 3 components are active
 */
export async function validatePhase3Activation(): Promise<{
  isActive: boolean;
  activeComponents: string[];
  inactiveComponents: string[];
  totalComponents: number;
}> {
  try {
    if (!ApplicationStartupManager.isEnabled()) {
      return {
        isActive: false,
        activeComponents: [],
        inactiveComponents: ['ApplicationStartupManager disabled'],
        totalComponents: 0
      };
    }
    
    const startupManager = await ApplicationStartupManager.getInstance();
    const initializedServices = startupManager.getInitializedServices();
    
    const phase3Components = [
      'IntelligentCacheWarmer',
      'CacheWarmingScheduler',
      'PredictiveCacheAnalyzer'
    ];
    
    const activeComponents = phase3Components.filter(component => 
      initializedServices.includes(component)
    );
    
    const inactiveComponents = phase3Components.filter(component => 
      !initializedServices.includes(component)
    );
    
    return {
      isActive: activeComponents.length > 0,
      activeComponents,
      inactiveComponents,
      totalComponents: phase3Components.length
    };
    
  } catch (error) {
    console.error('❌ [SERVER_INIT] Phase 3 validation failed:', error);
    return {
      isActive: false,
      activeComponents: [],
      inactiveComponents: ['Validation failed'],
      totalComponents: 3
    };
  }
}
