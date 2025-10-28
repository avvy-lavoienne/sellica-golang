import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Frontend Logging
 * 
 * Writes log entries from browser to files organized by session
 * Each session gets its own timestamped directory:
 * frontend/logs/session_YYYY-MM-DD_HH-MM-SS_[random]/
 */

const LOGS_BASE_DIR = join(process.cwd(), 'logs');

// Store session ID in memory for the lifetime of the process
let currentSessionId: string | null = null;

/**
 * Generate session ID with timestamp
 * Format: session_YYYY-MM-DD_HH-MM-SS_[6-char-random]
 */
function generateSessionId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  // Generate 6-character random string
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `session_${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${random}`;
}

/**
 * Get or create current session directory
 */
function getSessionDir(): string {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  
  const sessionDir = join(LOGS_BASE_DIR, currentSessionId);
  
  if (!existsSync(sessionDir)) {
    mkdirSync(sessionDir, { recursive: true });
  }
  
  return sessionDir;
}

/**
 * Get filename for current level within session
 * Format: [LEVEL].txt (e.g., INFO.txt, ERROR.txt, COMBINED.txt)
 */
function getLogFilePath(level: string): string {
  const sessionDir = getSessionDir();
  const filename = level.toUpperCase() === 'COMBINED' ? 'COMBINED.txt' : `${level.toUpperCase()}.txt`;
  return join(sessionDir, filename);
}

/**
 * Append log entry to file
 */
function appendToLog(filePath: string, content: string): void {
  try {
    const separator = '─'.repeat(100);
    const logContent = content + '\n' + separator + '\n\n';
    
    writeFileSync(filePath, logContent, { flag: 'a', encoding: 'utf-8' });
  } catch (error) {
    console.error('Failed to write log file:', error);
  }
}

/**
 * POST /api/logs
 * 
 * Accepts log entries from frontend and writes to session-specific files
 * 
 * Request body:
 * ```json
 * {
 *   "timestamp": "2025-10-26 15:30:45.123",
 *   "level": "INFO",
 *   "message": "Dashboard loaded",
 *   "context": { "userId": "123" }
 * }
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { timestamp, level, message, context, error } = body;

    // Validate required fields
    if (!timestamp || !level || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build formatted log message
    let logContent = `${timestamp} [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      logContent += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
      logContent += `\nError: ${error.name}: ${error.message}`;
      if (error.stack) {
        logContent += `\nStack:\n${error.stack}`;
      }
    }

    // Write to level-specific log file in session directory
    const logFilePath = getLogFilePath(level);
    appendToLog(logFilePath, logContent);

    // Also write to combined log file in session directory
    const combinedPath = getLogFilePath('COMBINED');
    appendToLog(combinedPath, logContent);

    return NextResponse.json({ 
      success: true,
      sessionId: currentSessionId 
    });
  } catch (error) {
    console.error('Logging API error:', error);
    return NextResponse.json(
      { error: 'Failed to process log' },
      { status: 500 }
    );
  }
}
