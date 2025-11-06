/**
 * Frontend Logger
 * 
 * Logs messages to both console and text files in frontend/logs/
 * Similar to backend logging structure
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Dashboard loaded', { userId: '123' });
 * logger.error('Auth failed', error);
 * logger.warn('Cache miss', { key: 'dashboard_data' });
 * ```
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Format timestamp as YYYY-MM-DD HH:MM:SS.mmm
 */
function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const ms = now.getMilliseconds().toString().padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format log entry for console output
 */
function formatConsoleMessage(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  
  if (entry.error) {
    return `${prefix} ${entry.message} - ${entry.error.name}: ${entry.error.message}${context}`;
  }
  
  return `${prefix} ${entry.message}${context}`;
}

/**
 * Format log entry for file output (similar to backend logs)
 */
function formatFileMessage(entry: LogEntry): string {
  let message = `${entry.timestamp} [${entry.level}] ${entry.message}`;
  
  if (entry.context && Object.keys(entry.context).length > 0) {
    message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
  }
  
  if (entry.error) {
    message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack) {
      message += `\n  Stack: ${entry.error.stack}`;
    }
  }
  
  return message;
}

/**
 * Send log to server for file storage
 */
async function sendToServer(entry: LogEntry): Promise<void> {
  // Only send from browser (not server-side)
  if (typeof window === 'undefined') return;

  try {
    // Use fetch with no-cors to avoid CORS issues during auth
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Silently fail - logging shouldn't break the app
    });
  } catch (err) {
    // Ignore errors - logging infrastructure should not impact app functionality
  }
}

/**
 * Main logger object
 */
export const logger = {
  debug(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level: LogLevel.DEBUG,
      message,
      context,
    };

    console.debug(formatConsoleMessage(entry));
    sendToServer(entry);
  },

  info(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level: LogLevel.INFO,
      message,
      context,
    };

    console.info(formatConsoleMessage(entry));
    sendToServer(entry);
  },

  warn(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level: LogLevel.WARN,
      message,
      context,
    };

    console.warn(formatConsoleMessage(entry));
    sendToServer(entry);
  },

  error(message: string, error?: Error | string, context?: Record<string, any>): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level: LogLevel.ERROR,
      message,
      context,
      error: errorObj ? {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      } : undefined,
    };

    console.error(formatConsoleMessage(entry));
    sendToServer(entry);
  },

  /**
   * Get current timestamp for manual use
   */
  timestamp(): string {
    return formatTimestamp();
  },
};

export default logger;
