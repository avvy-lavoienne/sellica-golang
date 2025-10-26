# Frontend Logging System Implementation

**Date**: 2025-10-26  
**Status**: ✅ Complete  
**Purpose**: Capture authentication flow and troubleshoot redirect issue

## What Was Set Up

### 1. Logger Utility (`frontend/src/lib/logger.ts`)

A comprehensive TypeScript logging module with:

- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Features**:
  - Formatted timestamps (YYYY-MM-DD HH:MM:SS.mmm)
  - Console output for immediate visibility
  - Server API calls to persist logs to files
  - Context data support for structured logging
  - Error stack trace capture
  - Graceful error handling (logging won't break the app)

**Usage in code**:
```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.warn('Cache miss', { key: 'dashboard_data' });
logger.error('Auth failed', error, { attempt: 1 });
logger.debug('Processing request', { method: 'GET', path: '/api/users' });
```

### 2. Logging API Route (`frontend/src/app/api/logs/route.ts`)

Next.js API route that:

- **Accepts POST requests** from the logger client
- **Creates session-specific directories** with timestamp
- **Validates request body** (timestamp, level, message required)
- **Writes to organized files within session**:
  - By level: `INFO.txt`, `ERROR.txt`, `WARN.txt`, `DEBUG.txt`
  - Combined log: `COMBINED.txt` (all logs from session)
- **Handles errors gracefully** - logging failures won't affect app functionality

**Directory structure**:
```
frontend/logs/
  session_2025-10-26_15-30-45_ABC123/
    INFO.txt
    ERROR.txt
    WARN.txt
    DEBUG.txt
    COMBINED.txt
  
  session_2025-10-26_15-45-20_XYZ789/
    INFO.txt
    ERROR.txt
    WARN.txt
    DEBUG.txt
    COMBINED.txt
```

**Benefits of session-based organization**:
- ✅ Each session completely isolated
- ✅ No log mixing between user sessions
- ✅ Easy to debug specific user flow
- ✅ Can compare multiple sessions side-by-side
- ✅ Precise timestamp down to second level

### 3. Layout Authentication Logging (`frontend/src/app/(protected)/layout.tsx`)

Updated to log all authentication checks:

```
🔍 Layout: Starting auth check, shouldUseGoAuth: [true/false]
🚀 Checking Go backend authentication
  - Go auth valid: [true/false]
  - Go user retrieved: [email]
✅ Go backend authentication valid, setting user: [email]
❌ Go backend authentication invalid (fallback enabled: [true/false])
🔄 Attempting Supabase fallback...
📱 Checking Supabase session
✅ Supabase session valid, setting user: [email]
❌ No active Supabase session, redirecting to login
📤 Auth listener: SIGNED_OUT
📥 Auth listener: SIGNED_IN
```

### 4. Dashboard Data Fetch Logging (`frontend/src/app/(protected)/dashboard/page.tsx`)

Updated to log data fetching:

```
Dashboard: Using cached data (age: [ms])
Dashboard: Fetching profile for user [userId]
Dashboard: Data fetched successfully (userName, userRole)
Dashboard: Error fetching data [error message]
```

### 5. Git Configuration (`frontend/.gitignore`)

Added `logs/` directory to `.gitignore` to prevent committing runtime logs.

## How to View Logs

### While Running (Browser Console)

Open browser DevTools → Console tab. All logs appear immediately:

```
[2025-10-26 15:30:45.123] [INFO] Dashboard loaded
[2025-10-26 15:30:46.456] [ERROR] Auth check failed
```

### After Running (Text Files - Session Organized)

Each session is in its own directory. To view logs:

```bash
# Navigate to session directory
cd "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_15-30-45_ABC123"

# View all logs from this session
cat COMBINED.txt

# View only errors
cat ERROR.txt

# View only info
cat INFO.txt

# View only warnings
cat WARN.txt
```

## Troubleshooting Auth Issue

With this logging system, you can now:

1. **Start dev server**: `pnpm dev`
2. **Open browser DevTools** (F12)
3. **Try login** and watch console for:
   - Which auth method is being checked (Go vs Supabase)
   - When user object is set
   - Why redirect to "/" happens
4. **Check log files** in session-specific directory at `frontend/logs/session_YYYY-MM-DD_HH-MM-SS_XXXX/COMBINED.txt` for full history

### Key Log Points to Watch

Each session gets its own directory, making it easy to isolate issues:

1. **Go Backend Check**:
   ```
   [INFO] 🚀 Checking Go backend authentication
   [DEBUG] Go auth check result
   ```

2. **User Setting**:
   ```
   [INFO] ✅ Go backend authentication valid, setting user: [email]
   ```

3. **Redirect**:
   ```
   [WARN] ❌ No active Supabase session, redirecting to login
   ```

4. **Auth Listener**:
   ```
   [INFO] 📤 Auth listener: SIGNED_OUT
   ```

## Log Format

Each log entry in files is formatted as:

```
[2025-10-26 15:30:45.123] [INFO] Message here
Context: { "key": "value", "userId": "123" }
(separator line)
```

For errors:
```
[2025-10-26 15:30:46.456] [ERROR] Auth check failed
Context: { "errorType": "TypeError" }
Error: TypeError: Cannot read property 'id' of null
Stack: 
  at checkAuth (layout.tsx:50)
  at Object.<anonymous> (useEffect.ts:123)
```

## Next Steps

1. **Test login flow** with logging enabled
2. **Check frontend/logs/frontend_combined.txt** after login attempt
3. **Identify exact point** where redirect happens
4. **Compare logs** with expected behavior
5. **Update fix** based on findings

## Backend Logs Reference

Similar logging exists in `backend/logs/` for comparison:
- `backend_debug_*.txt` - Backend debug logs
- Same timestamp format and structure
- Shows how backend logging is organized
