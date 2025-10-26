# Testing Login Flow with Logging

## Setup

Dev server is running at `http://localhost:3000`

## Steps to Test

### 1. Open Browser DevTools

```
1. Go to http://localhost:3000
2. Press F12 to open DevTools
3. Click "Console" tab
4. Keep this window visible while testing
```

### 2. Attempt Login

1. You should see login form
2. Check that it says "🚀 Go Backend" (not "📱 Next.js/Supabase")
3. Enter test credentials:
   - Email: firmanfird23@gmail.com
   - Password: [your test password]
4. Click Login button
5. **Watch console** for log messages

### 3. Expected Success Flow

```
[INFO] 🚀 Checking Go backend authentication
[DEBUG] Go auth valid: true
[DEBUG] Go user retrieved: firmanfird23@gmail.com
[INFO] ✅ Go backend authentication valid, setting user: firmanfird23@gmail.com
[DEBUG] Dashboard: Fetching profile for user [userId]
[INFO] Dashboard: Data fetched successfully
```

If this happens, you should see dashboard load without redirect.

### 4. Debugging Failed Login

If you get redirected to "/" instead of dashboard:

1. **Look for this in console**:
   ```
   [WARN] ❌ No active Supabase session, redirecting to login
   [INFO] 📤 Auth listener: SIGNED_OUT
   ```
   
   This means:
   - Go auth succeeded (token stored)
   - But layout also checked Supabase and found no session
   - Auth listener kicked you out

2. **Look for this**:
   ```
   [ERROR] Auth check failed
   ```
   
   This means auth check threw an error - check the stack trace

3. **Look for token in localStorage**:
   ```
   F12 → Application → Local Storage → http://localhost:3000
   Look for: selly_auth_token
   ```
   
   Should exist and not be empty

## Check Saved Logs

After login attempt, navigate to the session directory that was created:

```bash
# List all sessions today
ls -la "d:\Journey Code\Project\lab\sellica-golang\frontend\logs" | grep "session_2025-10-26"

# Open latest session directory and view logs
cd "d:\Journey Code\Project\lab\sellica-golang\frontend\logs\session_2025-10-26_HH-MM-SS_XXXX"

# View all logs from this session
cat COMBINED.txt

# View only errors
cat ERROR.txt

# View only info messages
cat INFO.txt

# View debug messages
cat DEBUG.txt
```

**Each session is completely isolated**, making it easy to:
- Debug one user's login flow without interference from other sessions
- Compare multiple login attempts side-by-side
- Archive logs by session for historical analysis

## Common Issues

### Issue: Token in localStorage but still redirected

**Cause**: Auth listener is detecting SIGNED_OUT from Supabase

**Check logs for**:
```
[INFO] 📤 Auth listener: SIGNED_OUT, redirecting to login
```

**Fix**: Layout should NOT listen to Supabase if Go auth succeeds

### Issue: Go auth returning false

**Cause**: Token expired or corrupted

**Check logs for**:
```
[DEBUG] Go auth check result
  - isValid: false
  - hasUser: false
```

**Check**: `selly_auth_token` in localStorage, verify it's not expired

### Issue: Supabase fallback not working

**Cause**: No Supabase session exists

**Check logs for**:
```
[WARN] ❌ No active Supabase session, redirecting to login
```

**Fix**: Go auth is enabled but Supabase session should be fallback

## Gathering Debug Info for Support

If issue persists, gather from the session directory:

1. **Browser console output** (screenshot or copy)
2. **localStorage tokens** (without sensitive data)
3. **Session-specific logs**: `frontend/logs/session_YYYY-MM-DD_HH-MM-SS_XXXX/COMBINED.txt`
4. **Error logs only**: `frontend/logs/session_YYYY-MM-DD_HH-MM-SS_XXXX/ERROR.txt`
5. **API response** - check Network tab for `/auth/login` response

Session-isolated logs make it easy to share just one session's worth of data without mixing with other sessions.
