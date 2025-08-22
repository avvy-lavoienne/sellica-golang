/**
 * Centralized Logging Service
 * Controls log levels and filters verbose AI/ML logs in production
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enabledComponents: Set<string>;
  private disabledComponents: Set<string>;

  private constructor() {
    // Set log level based on environment
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.logLevel = this.parseLogLevel(envLogLevel) ?? (
      process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG
    );

    // Parse enabled/disabled components
    this.enabledComponents = new Set(
      process.env.LOG_ENABLED_COMPONENTS?.split(',').map(c => c.trim()) ?? []
    );
    this.disabledComponents = new Set(
      process.env.LOG_DISABLED_COMPONENTS?.split(',').map(c => c.trim()) ??
      (process.env.NODE_ENV === 'production' ? ['INDOBERT', 'TENSORFLOW', 'TRAINING_COLLECTOR', 'ANALYTICS', 'PERFORMANCE_MONITOR', 'CUSTOM_TRAINER', 'PREDICTIVE', 'PERSONALIZATION_AI', 'REAL_TIME_ANALYZER', 'CONTINUOUS_LEARNING', 'ADVANCED_NLP', 'RESPONSE_FORMATTER', 'ENHANCED_QUERY', 'HUGGINGFACE_SERVICE', 'BACKEND'] : [])
    );
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level?: string): LogLevel | null {
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'TRACE': return LogLevel.TRACE;
      default: return null;
    }
  }

  private shouldLog(level: LogLevel, component?: string): boolean {
    // Check log level
    if (level > this.logLevel) return false;

    // Check component filters
    if (component) {
      if (this.disabledComponents.has(component)) return false;
      if (this.enabledComponents.size > 0 && !this.enabledComponents.has(component)) return false;
    }

    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const component = context?.component ? `[${context.component}]` : '';
    const operation = context?.operation ? `(${context.operation})` : '';
    
    return `${timestamp} ${levelStr} ${component}${operation} ${message}`;
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR, context?.component)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(formattedMessage, error || '');
    
    if (context?.metadata) {
      console.error('Context:', context.metadata);
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN, context?.component)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formattedMessage);
    
    if (context?.metadata) {
      console.warn('Context:', context.metadata);
    }
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO, context?.component)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.log(formattedMessage);
    
    if (context?.metadata) {
      console.log('Context:', context.metadata);
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG, context?.component)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, context);
    console.log(formattedMessage);
    
    if (context?.metadata) {
      console.log('Context:', context.metadata);
    }
  }

  public trace(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.TRACE, context?.component)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.TRACE, message, context);
    console.log(formattedMessage);
    
    if (context?.metadata) {
      console.log('Context:', context.metadata);
    }
  }

  // Convenience methods for AI/ML components
  public aiLog(component: 'INDOBERT' | 'TENSORFLOW' | 'TRAINING_COLLECTOR' | 'ANALYTICS' | 'PERFORMANCE_MONITOR' | 'CUSTOM_TRAINER' | 'PREDICTIVE' | 'PERSONALIZATION_AI' | 'REAL_TIME_ANALYZER' | 'CONTINUOUS_LEARNING' | 'ADVANCED_NLP' | 'RESPONSE_FORMATTER' | 'ENHANCED_QUERY' | 'HUGGINGFACE_SERVICE' | 'BACKEND',
               level: 'info' | 'warn' | 'error' | 'debug',
               message: string,
               metadata?: Record<string, any>): void {
    const context: LogContext = { component, metadata };

    switch (level) {
      case 'error': this.error(message, context); break;
      case 'warn': this.warn(message, context); break;
      case 'info': this.info(message, context); break;
      case 'debug': this.debug(message, context); break;
    }
  }

  // Update configuration at runtime
  public updateConfig(config: {
    logLevel?: LogLevel;
    enabledComponents?: string[];
    disabledComponents?: string[];
  }): void {
    if (config.logLevel !== undefined) {
      this.logLevel = config.logLevel;
    }
    if (config.enabledComponents) {
      this.enabledComponents = new Set(config.enabledComponents);
    }
    if (config.disabledComponents) {
      this.disabledComponents = new Set(config.disabledComponents);
    }
  }

  public getConfig(): {
    logLevel: LogLevel;
    enabledComponents: string[];
    disabledComponents: string[];
  } {
    return {
      logLevel: this.logLevel,
      enabledComponents: Array.from(this.enabledComponents),
      disabledComponents: Array.from(this.disabledComponents)
    };
  }
}

// Export singleton instance for convenience
export const logger = Logger.getInstance();

// Legacy compatibility - gradually replace direct console usage with these
export const aiLogger = {
  indobert: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('INDOBERT', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('INDOBERT', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('INDOBERT', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('INDOBERT', 'debug', message, metadata),
  },
  tensorflow: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('TENSORFLOW', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('TENSORFLOW', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('TENSORFLOW', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('TENSORFLOW', 'debug', message, metadata),
  },
  training: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('TRAINING_COLLECTOR', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('TRAINING_COLLECTOR', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('TRAINING_COLLECTOR', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('TRAINING_COLLECTOR', 'debug', message, metadata),
  },
  analytics: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('ANALYTICS', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('ANALYTICS', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('ANALYTICS', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('ANALYTICS', 'debug', message, metadata),
  },
  performance: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERFORMANCE_MONITOR', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERFORMANCE_MONITOR', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERFORMANCE_MONITOR', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERFORMANCE_MONITOR', 'debug', message, metadata),
  },
  customTrainer: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('CUSTOM_TRAINER', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('CUSTOM_TRAINER', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('CUSTOM_TRAINER', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('CUSTOM_TRAINER', 'debug', message, metadata),
  },
  predictive: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('PREDICTIVE', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('PREDICTIVE', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('PREDICTIVE', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('PREDICTIVE', 'debug', message, metadata),
  },
  personalization: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERSONALIZATION_AI', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERSONALIZATION_AI', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERSONALIZATION_AI', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('PERSONALIZATION_AI', 'debug', message, metadata),
  },
  realTimeAnalyzer: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('REAL_TIME_ANALYZER', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('REAL_TIME_ANALYZER', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('REAL_TIME_ANALYZER', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('REAL_TIME_ANALYZER', 'debug', message, metadata),
  },
  continuousLearning: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('CONTINUOUS_LEARNING', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('CONTINUOUS_LEARNING', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('CONTINUOUS_LEARNING', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('CONTINUOUS_LEARNING', 'debug', message, metadata),
  },
  advancedNlp: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('ADVANCED_NLP', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('ADVANCED_NLP', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('ADVANCED_NLP', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('ADVANCED_NLP', 'debug', message, metadata),
  },
  responseFormatter: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('RESPONSE_FORMATTER', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('RESPONSE_FORMATTER', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('RESPONSE_FORMATTER', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('RESPONSE_FORMATTER', 'debug', message, metadata),
  },
  enhancedQuery: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('ENHANCED_QUERY', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('ENHANCED_QUERY', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('ENHANCED_QUERY', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('ENHANCED_QUERY', 'debug', message, metadata),
  },
  huggingface: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('HUGGINGFACE_SERVICE', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('HUGGINGFACE_SERVICE', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('HUGGINGFACE_SERVICE', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('HUGGINGFACE_SERVICE', 'debug', message, metadata),
  },
  backend: {
    info: (message: string, metadata?: Record<string, any>) => logger.aiLog('BACKEND', 'info', message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.aiLog('BACKEND', 'warn', message, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.aiLog('BACKEND', 'error', message, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.aiLog('BACKEND', 'debug', message, metadata),
  }
};
