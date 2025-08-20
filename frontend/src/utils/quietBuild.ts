/**
 * Quiet Build Console Override
 * Suppresses verbose logging during build time while preserving critical information
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Patterns to suppress during build
const suppressPatterns = [
  '✅',
  '📋',
  '📊',
  '🚀',
  '🔍',
  '🖥️',
  '📦',
  '🔄',
  '⚡',
  '🔑',
  '🛤️',
  'UpstashClient initialized',
  'Session manager initialized',
  'Real-time sync manager initialized',
  'Enhanced Session Analytics',
  'User Journey Tracker',
  'Conversion Analytics Service',
  'Indonesian language patterns',
  'Redundant AI integrations disabled',
  'Indonesian pattern normalizer',
  'Document type detector initialized',
  'Document cache initialized',
  'Session monitoring service',
  'Session security service',
  'Performance optimization',
  'Session performance optimizer',
  'Session-aware persona service',
  'Session-aware knowledge service',
  'Enhanced SimpleResponseService',
  'Registered model:',
  'Registered AI pipeline:',
  'AI Pipelines initialized:',
  'Enhanced Knowledge Service',
  'Pattern Recognition Engine',
  'Administrative Context Engine',
  'Smart Query Router',
  'Model initialization complete',
  'Checking TensorFlow availability:',
  'Loading TensorFlow.js model',
  'TensorFlow.js not available',
  'TensorFlow.js stub:',
  'Model load attempt',
  'Loading important models',
  'Loading enhancement models',
  'Hybrid NLP Processor',
  'Starting background model',
  'Starting model optimization',
  'Starting batch optimization',
  'Optimizing',
  'Compressing model:',
  'Server-side: Skipping model compression',
  'Batch optimization complete',
  'Model optimization complete:',
  'Schema loader initialized',
  'Total tables available:',
  'Core foundation:',
  'Expansion ready:',
  'Processed deep knowledge',
  'Deep knowledge initialized',
  'Encryption keys initialized',
  'Security monitoring started',
  'Performance optimization started'
];

// Critical errors that should still be shown
const criticalPatterns = [
  'Error:',
  'Failed to compile',
  'Build failed',
  'Cannot resolve',
  'Module not found',
  'Syntax error',
  'Type error',
  'Reference error'
];

function shouldSuppress(message: string): boolean {
  // Never suppress critical errors
  if (criticalPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()))) {
    return false;
  }

  // Suppress known verbose patterns
  return suppressPatterns.some(pattern => message.includes(pattern));
}

function createQuietLogger(originalMethod: Function) {
  return function(...args: any[]) {
    const message = args.join(' ');
    
    // During build time, suppress verbose logs
    if (process.env.DISABLE_RUNTIME_LOGS === 'true' && shouldSuppress(message)) {
      return;
    }

    // Call original method
    originalMethod.apply(console, args);
  };
}

// Override console methods during build
if (process.env.DISABLE_RUNTIME_LOGS === 'true') {
  console.log = createQuietLogger(originalConsole.log);
  console.info = createQuietLogger(originalConsole.info);
  console.warn = createQuietLogger(originalConsole.warn);
  console.debug = createQuietLogger(originalConsole.debug);
  
  // Keep error logging but filter non-critical errors
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    
    // Filter out non-critical errors during build
    const nonCriticalErrors = [
      'Failed to load TensorFlow',
      'Failed to load model',
      'Failed to preload',
      'ECONNREFUSED',
      'fetch failed',
      'TypeError: fetch failed'
    ];
    
    if (nonCriticalErrors.some(pattern => message.includes(pattern))) {
      return;
    }
    
    originalConsole.error.apply(console, args);
  };
}

// Export function to restore original console (for testing)
export function restoreConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}

// Auto-initialize when imported
const quietBuildUtils = {};
export default quietBuildUtils;
