# Quick Troubleshooting: Token Expired 401 Error

## Problem
Still getting `401 Unauthorized: token is expired` even after logout/login.

## Quick Fixes (Try These First)

### 1. Hard Refresh Frontend
```powershell
# Press Ctrl+Shift+R in browser (hard refresh without cache)
# Or restart the dev server:
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev  # Stop with Ctrl+C first if running
```

### 2. Clear Browser Storage & Re-login
```javascript
// Open DevTools Console (F12) and paste:
localStorage.clear();
sessionStorage.clear();
location.reload();
// Then login again
```

### 3. Verify Backend is Running
```powershell
# In a new PowerShell window:
curl http://localhost:8080/health
# Should return: {"status":"healthy"}
```

### 4. Check Token Exists
```javascript
// Open DevTools Console and paste:
const key = Object.keys(localStorage).find(k => k.includes("auth-token"));
console.log("Token found:", !!key);
console.log("Token key:", key);
if (key) {
  const data = JSON.parse(localStorage.getItem(key));
  console.log("Has access_token:", !!data.access_token);
  console.log("Token length:", data.access_token?.length);
}
```

## Step-by-Step Diagnosis

### Step 1: Is Interceptor Initialized?
```javascript
// In DevTools Console, you should see:
"✅ [Interceptor] Axios token refresh interceptor setup complete"

// If NOT present, check:
// - Frontend: Is ApiInterceptorProvider in layout.tsx?
// - Frontend: Did you run `pnpm build` or `pnpm dev`?
```

### Step 2: Is Token Being Refreshed?
```javascript
// In DevTools Console, watch for:
"✅ [Token Refresh] Current token is still valid"
// or
"✅ [Token Refresh] Successfully refreshed session token"

// If NOT present:
// - Token refresh utility not running
// - Supabase connection issue
```

### Step 3: Is Token Being Sent?
```
// DevTools Network tab:
1. Open Network tab
2. Make an API call (edit, delete, create)
3. Click the request
4. Go to "Headers" → "Request Headers"
5. Look for: Authorization: Bearer eyJhbGc...

// If NOT present:
// - API client not using interceptor headers
// - Check if using correct axios instance
```

### Step 4: What Does Backend Say?
```powershell
# Check backend logs for error details
# Should see something like:
# "token validation passed"
# or error message showing WHY token failed

# If backend not showing logs, restart:
# cd backend
# go run cmd/server/main.go
# Then test again and watch output
```

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Interceptor not initialized** | Console shows no `✅ [Interceptor]` messages | Verify `ApiInterceptorProvider` wraps app in layout.tsx |
| **Token not in storage** | Console shows no token key found | Logout and login again to generate new token |
| **Token expired immediately** | `isExpired: true` in diagnostic output | Supabase session corrupted, clear storage and re-login |
| **Backend not running** | Network request hangs or 503 error | Start backend: `cd backend; go run cmd/server/main.go` |
| **Wrong Authorization header format** | Backend says "invalid Authorization header" | Verify format is: `Bearer {token}` not `Token {token}` |
| **CORS error** | Browser shows CORS policy error | Backend CORS middleware issue, check `internal/api/middleware/cors.go` |

## Nuclear Option: Reset Everything

If nothing works, start fresh:

```powershell
# 1. Clear all storage
# In DevTools Console:
localStorage.clear()
sessionStorage.clear()
location.reload()

# 2. Stop all servers
# Ctrl+C in each terminal running:
# - pnpm dev (frontend)
# - go run cmd/server/main.go (backend)

# 3. Restart backend
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
# Wait for: "✅ Server listening on :8080"

# 4. Restart frontend
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev
# Wait for: "▲ Ready in XYZms"

# 5. Open fresh browser instance
# http://localhost:3000
# Login with test credentials
# Open DevTools Console
# Try edit/delete
```

## Diagnostic Commands

### Check Token Status
```javascript
import { getTokenWithDiagnostics } from "@/lib/api/token-refresh";
const diag = await getTokenWithDiagnostics();
console.table(diag);
```

### Monitor Network Requests
```javascript
// In DevTools Console:
fetch('http://localhost:8080/api/v1/duplicate-operators', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem(
      Object.keys(localStorage).find(k => k.includes("auth-token"))
    ).split(',')[1].split(':')[1].replaceAll('"', '')
  }
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

### Check Supabase Session
```javascript
import { supabase } from "@/lib/conn/supabaseClient";
const { data } = await supabase.auth.getSession();
console.log("Session:", data);
console.log("Token expires at:", new Date(data.session.expires_at * 1000));
console.log("Is expired:", data.session.expires_at < Math.floor(Date.now() / 1000));
```

## Getting Help

**Provide this info when reporting issues**:

1. **Console output** (Screenshot or paste):
   - Do you see `✅ [Interceptor]` messages?
   - Do you see `✅ [Token Refresh]` messages?
   - Any `❌` or `⚠️` error messages?

2. **Network request** (Screenshot from DevTools Network tab):
   - Which endpoint was called? (/api/v1/duplicate-operators/...)
   - What status? (401, 400, 500, etc)
   - Does Authorization header exist?

3. **Diagnostic output** (Paste from console):
   ```javascript
   const key = Object.keys(localStorage).find(k => k.includes("auth-token"));
   const data = JSON.parse(localStorage.getItem(key));
   console.log(JSON.stringify({
     hasToken: !!data.access_token,
     tokenLength: data.access_token?.length,
     expiresAt: new Date(data.expires_at * 1000).toISOString(),
     now: new Date().toISOString(),
     isExpired: data.expires_at < Math.floor(Date.now() / 1000)
   }, null, 2));
   ```

4. **Backend logs**: Last 20 lines from `go run cmd/server/main.go`

---

**Remember**: The token refresh system logs EVERYTHING. If it's not working, the logs will show you why!
