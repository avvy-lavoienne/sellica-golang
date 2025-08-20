/**
 * Build-aware logging utility
 * Provides clean, quiet logging during build time while maintaining full logging at runtime
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableBuildLogs: boolean;
  enableRuntimeLogs: boolean;
  logLevel: LogLevel;
  quietPatterns: string[];
}

class BuildLogger {
  private config: LoggerConfig;
  private isBuildTime: boolean;

  constructor() {
    // Detect if we're in build time - more aggressive detection
    this.isBuildTime = process.env.NODE_ENV === 'production' &&
                      typeof window === 'undefined' &&
                      (process.env.NEXT_PHASE === 'phase-production-build' ||
                       !process.env.VERCEL_URL);

    this.config = {
      enableBuildLogs: process.env.ENABLE_BUILD_LOGS === 'true',
      enableRuntimeLogs: process.env.DISABLE_RUNTIME_LOGS !== 'true',
      logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
      quietPatterns: [
        'UpstashClient initialized',
        'Session manager initialized',
        'TensorFlow',
        'Model loading',
        'Indonesian',
        'Document cache',
        'Performance optimizer',
        'Enhanced',
        'Registered model',
        'AI Pipelines initialized',
        'Schema loader',
        'Deep knowledge',
        'Optimization',
        'Cache initialized',
        'Service initialized',
        'Real-time sync',
        'Analytics Engine',
        'Journey Tracker',
        'Conversion Analytics',
        'REALTIME_SYNC',
        'INDONESIAN_NORMALIZER',
        'DOCUMENT_DETECTOR',
        'DOCUMENT_CACHE',
        'SESSION_MONITORING',
        'SESSION_SECURITY',
        'PERFORMANCE_OPTIMIZER',
        'SESSION_PERSONA',
        'SESSION_KNOWLEDGE',
        'ENHANCED_RESPONSE',
        'ENHANCED_SCHEMA',
        'Enhanced Knowledge Service',
        'Pattern Recognition Engine',
        'Administrative Context Engine',
        'Smart Query Router',
        'Loading TensorFlow.js model',
        'TensorFlow.js stub',
        'TensorFlow AI Service initialized',
        'Loading important models',
        'Loading enhancement models',
        'Hybrid NLP Processor',
        'Starting background model',
        'Starting model optimization',
        'Starting batch optimization',
        'Optimizing',
        'Compressing model',
        'Server-side: Skipping model compression',
        'Batch optimization complete',
        'Model optimization complete'
      ]
    };
  }

  private shouldLog(message: string, level: LogLevel): boolean {
    // During build time, be very selective about what we log
    if (this.isBuildTime || process.env.DISABLE_RUNTIME_LOGS === 'true') {
      // Only allow critical errors during build
      if (level === 'error') {
        // But still filter out known non-critical errors
        const nonCriticalErrors = [
          'Failed to load TensorFlow',
          'Model load attempt',
          'ECONNREFUSED',
          'fetch failed',
          'Failed to load model',
          'Failed to preload'
        ];

        if (nonCriticalErrors.some(pattern => message.includes(pattern))) {
          return false;
        }
        return true;
      }
      return false;
    }

    // During runtime, check quiet patterns
    if (!this.config.enableRuntimeLogs) {
      return false;
    }

    // Filter out noisy patterns
    if (this.config.quietPatterns.some(pattern => message.includes(pattern))) {
      return false;
    }

    return true;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(message, 'debug')) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(message, 'info')) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(message, 'warn')) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(message, 'error')) {
      console.error(message, ...args);
    }
  }

  // Special method for build-critical information
  buildInfo(message: string, ...args: any[]): void {
    if (this.isBuildTime && this.config.enableBuildLogs) {
      console.log(`[BUILD] ${message}`, ...args);
    }
  }

  // Method to check if we're in build time
  isBuild(): boolean {
    return this.isBuildTime;
  }
}

// Export singleton instance
export const buildLogger = new BuildLogger();

// Export convenience functions
export const log = {
  debug: (message: string, ...args: any[]) => buildLogger.debug(message, ...args),
  info: (message: string, ...args: any[]) => buildLogger.info(message, ...args),
  warn: (message: string, ...args: any[]) => buildLogger.warn(message, ...args),
  error: (message: string, ...args: any[]) => buildLogger.error(message, ...args),
  buildInfo: (message: string, ...args: any[]) => buildLogger.buildInfo(message, ...args),
  isBuild: () => buildLogger.isBuild()
};

// Helper to replace console.log in services
export const createServiceLogger = (serviceName: string) => ({
  debug: (message: string, ...args: any[]) => buildLogger.debug(`[${serviceName}] ${message}`, ...args),
  info: (message: string, ...args: any[]) => buildLogger.info(`[${serviceName}] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => buildLogger.warn(`[${serviceName}] ${message}`, ...args),
  error: (message: string, ...args: any[]) => buildLogger.error(`[${serviceName}] ${message}`, ...args),
  isBuild: () => buildLogger.isBuild()
});
