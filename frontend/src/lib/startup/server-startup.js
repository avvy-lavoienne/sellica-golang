/**
 * Server Startup Hook for Phase 3 Cache Warming Optimization
 * This file runs during Next.js server startup to initialize Phase 3 components
 */

const { ApplicationStartupManager } = require('../services/core/ApplicationStartupManager');
const { IntelligentCacheWarmer } = require('../services/cache/IntelligentCacheWarmer');
const { CacheWarmingScheduler } = require('../services/cache/CacheWarmingScheduler');
const { PredictiveCacheAnalyzer } = require('../services/cache/PredictiveCacheAnalyzer');

/**
 * Initialize Phase 3 Cache Warming Optimization during server startup
 */
async function initializePhase3Components() {
  console.log('🚀 [SERVER_STARTUP] Initializing Phase 3 Cache Warming Optimization...');
  
  try {
    // Check if ApplicationStartupManager is enabled
    if (process.env.ENABLE_STARTUP_MANAGER !== 'true') {
      console.log('ℹ️ [SERVER_STARTUP] ApplicationStartupManager disabled (ENABLE_STARTUP_MANAGER=false)');
      return;
    }

    // Initialize ApplicationStartupManager
    console.log('🔧 [SERVER_STARTUP] Starting ApplicationStartupManager...');
    const startupManager = await ApplicationStartupManager.getInstance();
    
    // Get startup metrics
    const metrics = await startupManager.getStartupMetrics();
    if (metrics) {
      console.log(`📊 [SERVER_STARTUP] Startup completed in ${metrics.totalStartupTime.toFixed(2)}ms`);
      console.log(`📊 [SERVER_STARTUP] Services initialized: ${metrics.servicesInitialized}`);
      console.log(`📊 [SERVER_STARTUP] Failed services: ${metrics.failedServices.length}`);
      
      // Check Phase 3 component status
      const initializedServices = startupManager.getInitializedServices();
      const phase3Components = [
        'IntelligentCacheWarmer',
        'CacheWarmingScheduler',
        'PredictiveCacheAnalyzer'
      ];
      
      console.log('🔍 [SERVER_STARTUP] Phase 3 component status:');
      let activeComponents = 0;
      
      phase3Components.forEach(component => {
        const isActive = initializedServices.includes(component);
        const status = isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        console.log(`   ${status} ${component}`);
        if (isActive) activeComponents++;
      });
      
      if (activeComponents === 3) {
        console.log('🎉 [SERVER_STARTUP] Phase 3 Cache Warming Optimization fully activated! (3/3 components)');
      } else if (activeComponents > 0) {
        console.log(`⚠️ [SERVER_STARTUP] Phase 3 partially activated (${activeComponents}/3 components)`);
      } else {
        console.log('❌ [SERVER_STARTUP] Phase 3 components not activated - check feature flags');
      }
    }
    
    console.log('✅ [SERVER_STARTUP] Phase 3 initialization completed');
    
  } catch (error) {
    console.error('❌ [SERVER_STARTUP] Phase 3 initialization failed:', error);
  }
}

// Run initialization immediately when this module is loaded
initializePhase3Components().catch(error => {
  console.error('❌ [SERVER_STARTUP] Critical error during Phase 3 initialization:', error);
});

module.exports = {
  initializePhase3Components
};
