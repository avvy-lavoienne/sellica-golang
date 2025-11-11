# CRITICAL: Next.js Dev Server Restart Required

**Status**: 🚨 Frontend Dev Server Restart Needed  
**Issue**: Route file exists but Next.js app hasn't registered it  
**Solution**: Kill and restart frontend dev server  

---

## Why 404 is Occurring

The proxy route file exists at:
```
frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts
```

And has correct `PATCH` export:
```typescript
export async function PATCH(request: NextRequest) {
  // handler code...
}
```

**BUT** the Next.js dev server that's running hasn't registered this route yet because:
1. Route file was modified after dev server started
2. Next.js app router needs to scan and register route files on startup
3. We need to restart the dev process to trigger route registration

---

## Immediate Fix Required

### Step 1: Kill Node Process
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start Frontend Dev Server Again
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev
```

### Step 3: Wait for Server to Start
- Should see output: `▲ Next.js 15.4.6`
- Routes will be registered during startup
- Look for: `ready - started server on ...`

### Step 4: Test Again
1. Open http://localhost:3000
2. Navigate to Adjudicate Record table
3. Click "Tandai Selesai" button
4. Should see: `PATCH /api/data-rekam/adjudicate/toggle-status 200 OK`

---

## Verification Checklist

After restarting dev server, confirm:

- [ ] Frontend loads at http://localhost:3000
- [ ] No build errors in console
- [ ] Click toggle-status button
- [ ] Network shows: `PATCH /api/data-rekam/adjudicate/toggle-status` 
- [ ] Response status: **200 OK** (not 404 or 403)
- [ ] Response body contains: `{ "success": true, "message": "Status berhasil diperbarui" }`
- [ ] Toast shows: "Status berhasil diperbarui"
- [ ] Button text changes to "Tandai Belum Selesai"
- [ ] Check Supabase - `is_ready_to_record` should be updated to `true`

---

## Timeline

- Modified proxy route files: ✅ 2025-11-11 21:20 UTC
- Applied JWT fix to check both role claim names: ✅ 2025-11-11 21:20 UTC  
- Dev server restart: ⏳ **PENDING - REQUIRED**
- Button testing: ⏳ After restart

---

## Why This is Important

Without restarting the dev server:
- ❌ Route handlers won't be registered
- ❌ All requests to `/api/data-rekam/*` will return 404
- ❌ Can't test if backend handlers work
- ❌ Can't verify button functionality

After restarting:
- ✅ Next.js scans `src/app/api` directory
- ✅ Discovers new route files
- ✅ Registers handlers for `PATCH /api/data-rekam/adjudicate/toggle-status` etc.
- ✅ Proxy routes become available

---

## Files Changed (Require Restart)

New/Modified route files:
1. `frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts` - PATCH handler
2. `frontend/src/app/api/data-rekam/adjudicate/update-date/route.ts` - PATCH handler
3. Updated JWT role claim checking in both files

---

## Next Actions

1. **Immediately**: Kill and restart frontend dev server
2. **After restart**: Test toggle-status button
3. **If working**: Test update-date button
4. **If both work**: Test other tables (pengajuan-bulanan, duplicate-operator, salah-rekam)
5. **Verify**: Database updates occur correctly

---

**Critical**: Dev server MUST be restarted for routes to be registered!

This is a Next.js development server limitation - new route files added while server is running won't be automatically discovered until restart.
