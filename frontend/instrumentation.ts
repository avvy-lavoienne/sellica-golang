/**
 * Next.js Instrumentation Hook
 * This file runs during Next.js server startup to initialize Phase 3 components
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [INSTRUMENTATION] Next.js server startup detected - initializing Phase 3...');
    
    try {
      // Import and initialize Phase 3 components
      const { initializeServerForNextJS } = await import('./src/lib/startup/ServerInitializer');
      await initializeServerForNextJS();
      
      console.log('✅ [INSTRUMENTATION] Phase 3 Cache Warming Optimization initialization completed');
    } catch (error) {
      console.error('❌ [INSTRUMENTATION] Phase 3 initialization failed:', error);
    }
  }
}
