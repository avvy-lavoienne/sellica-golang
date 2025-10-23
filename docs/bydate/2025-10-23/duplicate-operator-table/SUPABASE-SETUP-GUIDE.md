# Supabase Credentials Setup Guide

**Created**: 2025-10-23
**Project**: SELLY Duplicate Operator System
**Supabase Project ID**: yrssspoimsxpibcbeaca

## Quick Setup (5 Minutes)

I've created the environment files with your Supabase project URL already configured:
- ✅ `frontend/.env.local` - Created
- ✅ `backend/.env` - Created

You just need to fill in 3 keys from your Supabase dashboard.

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard (1 minute)

1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Select project: **yrssspoimsxpibcbeaca**

### Step 2: Get Your API Keys (2 minutes)

1. In your Supabase project, click on the **Settings** icon (⚙️) in the left sidebar
2. Click on **API** under Project Settings
3. You'll see the **Project API keys** section

**Copy these 3 values**:

#### A. Anon/Public Key
- **Label**: `anon` `public`
- **Looks like**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...`
- **Length**: ~200-300 characters
- **Safe to use in browser**: ✅ Yes

#### B. Service Role Key
- **Label**: `service_role` `secret`
- **Looks like**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...`
- **Length**: ~200-300 characters
- **⚠️ WARNING**: This has admin privileges - keep it secret!

#### C. JWT Secret
- **Location**: Scroll down to **JWT Settings** section
- **Label**: `JWT Secret`
- **Looks like**: A long random string of letters, numbers, and symbols
- **Length**: ~60-80 characters
- **Used for**: Token validation

### Step 3: Configure Frontend (1 minute)

Open the file: `frontend/.env.local`

Replace this line:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

With your actual anon key:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

**That's it for frontend!** The URL is already configured.

### Step 4: Configure Backend (1 minute)

Open the file: `backend/.env`

Replace these 3 lines:
```env
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET_HERE
```

With your actual values:
```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
SUPABASE_JWT_SECRET=your-actual-jwt-secret-here
```

**Save both files!**

## Step 5: Verify Configuration (30 seconds)

### Check Frontend
```powershell
cd frontend
cat .env.local | Select-String "SUPABASE"
```

You should see:
```
NEXT_PUBLIC_SUPABASE_URL=https://yrssspoimsxpibcbeaca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
```

### Check Backend
```powershell
cd backend
cat .env | Select-String "SUPABASE"
```

You should see all 4 values filled in (not "YOUR_..._HERE")

## Step 6: Start the Servers

### Terminal 1: Backend
```powershell
cd backend
go run cmd/server/main.go
```

**Expected output**:
```
[GIN-debug] Listening and serving HTTP on :8080
```

### Terminal 2: Frontend
```powershell
cd frontend
pnpm dev
```

**Expected output**:
```
✓ Ready in 2.3s
○ Local:    http://localhost:3000
```

## Step 7: Test the Application

1. Open browser: http://localhost:3000
2. Login with your credentials
3. Navigate to: http://localhost:3000/data-rekam/duplicate-operator
4. You should see the table load with data!

## Troubleshooting

### Error: "Missing required Supabase environment variables"
- **Cause**: Keys not properly copied
- **Fix**: Check that you saved the files and there are no extra spaces

### Error: "Invalid API key"
- **Cause**: Copied the wrong key or incomplete key
- **Fix**: Re-copy the entire key from Supabase dashboard (they're very long!)

### Backend won't start
- **Cause**: Missing or invalid JWT secret
- **Fix**: Make sure you copied the JWT Secret from the JWT Settings section, not from API keys

### Frontend loads but API calls fail
- **Cause**: Backend not running or wrong API URL
- **Fix**: Check that backend is running on port 8080

## Security Notes

### ✅ Safe to Commit (in .gitignore):
- Both `.env.local` and `.env` are in `.gitignore`
- They will NOT be committed to the repository

### ⚠️ Keep Secret:
- **Service Role Key**: Never share or expose publicly
- **JWT Secret**: Required for token validation

### ✅ Safe for Public:
- **Anon Key**: Safe to use in browser/frontend
- **Project URL**: Public (already in your codebase)

## What's Already Configured

I've pre-configured these for you:

✅ **Frontend** (`frontend/.env.local`):
- Supabase URL: `https://yrssspoimsxpibcbeaca.supabase.co`
- Backend API URL: `http://localhost:8080`
- All SELLY AI settings with sensible defaults

✅ **Backend** (`backend/.env`):
- Supabase URL: `https://yrssspoimsxpibcbeaca.supabase.co`
- Server port: 8080
- Database connection pool: 10-100 connections
- Cache settings configured
- Redis: Optional (will use memory cache)

## Next Steps After Setup

Once both servers are running:

1. ✅ Test authentication flow
2. ✅ Create a new duplicate operator record
3. ✅ Test pagination and filtering
4. ✅ Try inline editing (toggle status)
5. ✅ Test full CRUD operations

All features are implemented and ready to use!

## Need Help?

If you encounter issues:
1. Check the E2E Verification Report: `docs/bydate/2025-10-23/duplicate-operator-table/2025-10-23-e2e-verification-report.md`
2. Review the API Reference: `docs/bydate/2025-10-23/duplicate-operator-table/backend/2025-10-23-duplicate-operator-api-reference.md`

---

**Estimated Setup Time**: 5 minutes
**Current Status**: Ready for credentials
**Next Action**: Fill in the 3 API keys from Supabase dashboard

