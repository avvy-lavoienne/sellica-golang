# Security Fixes Implementation Tasks & Checklist

**Document**: Critical Security Fixes - Implementation Tasks & Checklist
**Project Date**: 2025-11-05
**Created**: 2025-11-05
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

This document provides step-by-step implementation tasks for three critical security fixes identified in the JWT audit. Each task includes acceptance criteria, verification procedures, and rollback procedures. All fixes add admin-only JWT protection to three dangerous endpoints currently exposed without authentication.

**Total Effort**: ~45 minutes coding + 1-2 hours testing = ~2 hours
**Branch**: `feat/supabase-jwt` (pre-created)
**Commit Strategy**: Three separate commits (one per fix) for easy review and rollback

---

## Critical Fixes Overview

| Fix # | Endpoint | Issue | Protection | Effort |
|-------|----------|-------|-----------|--------|
| C1 | GET /api/v1/supabase/* | Schema exposed to public | Add admin-only JWT | 10 min |
| C2 | DELETE /cache/clear | Cache DoS without auth | Add admin-only JWT | 15 min |
| C3 | GET /database/performance | Public load generation | Add admin-only JWT | 20 min |

---

# TASK 1: Supabase Analyzer JWT Protection

## Objective

Add admin-only JWT requirement to all Supabase analyzer endpoints:
- GET `/api/v1/supabase/analyze`
- GET `/api/v1/supabase/overview`
- GET `/api/v1/supabase/tables/:name`
- GET `/api/v1/supabase/buckets`

## Current State

```go
// backend/internal/api/routes/routes.go (lines 100-103)
supabaseAnalyzerGroup := router.Group("/api/v1/supabase")
{
    supabaseAnalyzerGroup.GET("/analyze", handlers.AnalyzeSupabaseSchema)
    supabaseAnalyzerGroup.GET("/overview", handlers.GetSupabaseOverview)
}
```

**Problem**: No middleware applied - endpoints are completely public

## Target State

```go
// Add AuthMiddleware + RequireRole("admin") before handlers
supabaseAnalyzerGroup := router.Group("/api/v1/supabase")
supabaseAnalyzerGroup.Use(middleware.AuthMiddleware())
supabaseAnalyzerGroup.Use(middleware.RequireRole("admin"))
{
    supabaseAnalyzerGroup.GET("/analyze", handlers.AnalyzeSupabaseSchema)
    supabaseAnalyzerGroup.GET("/overview", handlers.GetSupabaseOverview)
}
```

## Implementation Steps

### Step 1: Locate the Supabase Analyzer Routes

```bash
# Navigate to backend
cd backend

# Find routes.go
Get-ChildItem -Path internal/api/routes/routes.go
```

### Step 2: Add Middleware to Route Group

**File**: `backend/internal/api/routes/routes.go`
**Action**: Modify the route group for Supabase analyzer

**Current Code** (around line 100):
```go
// Supabase Analyzer Routes
supabaseAnalyzerGroup := router.Group("/api/v1/supabase")
{
    supabaseAnalyzerGroup.GET("/analyze", handlers.AnalyzeSupabaseSchema)
    supabaseAnalyzerGroup.GET("/overview", handlers.GetSupabaseOverview)
    supabaseAnalyzerGroup.GET("/tables/:name", handlers.GetSupabaseTableSchema)
    supabaseAnalyzerGroup.GET("/buckets", handlers.GetSupabaseBuckets)
}
```

**Replace With**:
```go
// Supabase Analyzer Routes - ADMIN ONLY
supabaseAnalyzerGroup := router.Group("/api/v1/supabase")
supabaseAnalyzerGroup.Use(middleware.AuthMiddleware())
supabaseAnalyzerGroup.Use(middleware.RequireRole("admin"))
{
    supabaseAnalyzerGroup.GET("/analyze", handlers.AnalyzeSupabaseSchema)
    supabaseAnalyzerGroup.GET("/overview", handlers.GetSupabaseOverview)
    supabaseAnalyzerGroup.GET("/tables/:name", handlers.GetSupabaseTableSchema)
    supabaseAnalyzerGroup.GET("/buckets", handlers.GetSupabaseBuckets)
}
```

### Step 3: Verify Middleware Exists

Check that `RequireRole` middleware is available:

```bash
# Check if RequireRole middleware exists
Select-String -Path "internal/api/middleware/auth.go" -Pattern "RequireRole"
```

Expected: Should see function definition

### Step 4: Test the Fix

#### Test 4a: Verify Unauthenticated Access Blocked

```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:8080/api/v1/supabase/analyze
```

Expected Response:
```json
{
  "error": "unauthorized: missing or invalid token"
}
```

#### Test 4b: Verify Non-Admin Access Blocked

```bash
# Use a user token (not admin)
curl -X GET http://localhost:8080/api/v1/supabase/analyze \
  -H "Authorization: Bearer eyJ0eXAi..."
```

Expected Response:
```json
{
  "error": "forbidden: insufficient permissions"
}
```

#### Test 4c: Verify Admin Access Works

```bash
# Use admin token
curl -X GET http://localhost:8080/api/v1/supabase/analyze \
  -H "Authorization: Bearer admin_token_here"
```

Expected Response: `200 OK` with schema data

## Acceptance Criteria

- [ ] All 4 Supabase analyzer endpoints have AuthMiddleware applied
- [ ] All 4 endpoints have RequireRole("admin") middleware applied
- [ ] Unauthenticated requests return 401
- [ ] Non-admin authenticated requests return 403
- [ ] Admin authenticated requests return 200 with data
- [ ] Code follows project conventions (no formatting issues)
- [ ] Middleware order is correct (Auth before RequireRole)

## Verification Checklist

- [ ] No other functionality affected
- [ ] All routes.go syntax is valid (no compilation errors)
- [ ] Backend compiles successfully
- [ ] Tests pass (if endpoint-specific tests exist)
- [ ] Monitoring still works (other endpoints unaffected)

## Rollback Procedure

If issues arise:

```bash
# Revert the changes
git checkout backend/internal/api/routes/routes.go

# Or manually remove the middleware lines:
# Remove: supabaseAnalyzerGroup.Use(middleware.AuthMiddleware())
# Remove: supabaseAnalyzerGroup.Use(middleware.RequireRole("admin"))
```

---

# TASK 2: Cache Clear Protection

## Objective

Add admin-only JWT requirement to destructive cache operation:
- DELETE `/cache/clear`

## Current State

```go
// backend/internal/api/routes/routes.go (line 73)
cacheGroup.DELETE("/clear", handlers.ClearCache)
```

**Problem**: No authentication - anyone can DoS the cache

## Target State

```go
// Add admin-only JWT requirement
cacheGroup.DELETE("/clear", middleware.AuthMiddleware(), middleware.RequireRole("admin"), handlers.ClearCache)
```

## Implementation Steps

### Step 1: Locate Cache Routes

**File**: `backend/internal/api/routes/routes.go`
**Location**: Around line 73

### Step 2: Add Middleware to DELETE /cache/clear

**Current Code**:
```go
// Cache Routes
cacheGroup := router.Group("/cache")
{
    cacheGroup.GET("/health", handlers.GetCacheHealth)
    cacheGroup.GET("/stats", handlers.GetCacheStats)
    cacheGroup.DELETE("/clear", handlers.ClearCache)
}
```

**Replace With**:
```go
// Cache Routes
cacheGroup := router.Group("/cache")
{
    cacheGroup.GET("/health", handlers.GetCacheHealth)
    cacheGroup.GET("/stats", handlers.GetCacheStats)
    // DELETE /cache/clear - ADMIN ONLY (destructive operation)
    cacheGroup.DELETE("/clear", 
        middleware.AuthMiddleware(), 
        middleware.RequireRole("admin"), 
        handlers.ClearCache)
}
```

### Step 3: Verify Compilation

```bash
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
```

Expected: Successful build with no errors

### Step 4: Test the Fix

#### Test 4a: Verify Unauthenticated Access Blocked

```bash
# Should return 401 Unauthorized
curl -X DELETE http://localhost:8080/cache/clear
```

Expected Response: `401 Unauthorized`

#### Test 4b: Verify Non-Admin Access Blocked

```bash
# Use user token (not admin)
curl -X DELETE http://localhost:8080/cache/clear \
  -H "Authorization: Bearer user_token"
```

Expected Response: `403 Forbidden`

#### Test 4c: Verify Admin Can Clear Cache

```bash
# Use admin token
curl -X DELETE http://localhost:8080/cache/clear \
  -H "Authorization: Bearer admin_token"
```

Expected Response: `200 OK` with success message

#### Test 4d: Verify GET Still Works (No Auth Required)

```bash
# Cache stats should still be public
curl -X GET http://localhost:8080/cache/stats

curl -X GET http://localhost:8080/cache/health
```

Expected Response: `200 OK` with stats

## Acceptance Criteria

- [ ] DELETE /cache/clear requires admin JWT
- [ ] Unauthenticated requests return 401
- [ ] Non-admin requests return 403
- [ ] Admin requests return 200 and clear cache
- [ ] GET /cache/health still public (unchanged)
- [ ] GET /cache/stats still public (unchanged)
- [ ] No other cache operations affected

## Verification Checklist

- [ ] Code compiles without errors
- [ ] Syntax is valid Go
- [ ] Middleware is applied in correct order
- [ ] No logging changes (cache operations still logged)
- [ ] Monitoring reflects only successful clears

## Rollback Procedure

```bash
# Revert changes
git checkout backend/internal/api/routes/routes.go

# Or manually restore:
# Change: cacheGroup.DELETE("/clear", middleware.AuthMiddleware(), middleware.RequireRole("admin"), handlers.ClearCache)
# Back to: cacheGroup.DELETE("/clear", handlers.ClearCache)
```

---

# TASK 3: Database Performance Endpoint Protection

## Objective

Add admin-only JWT requirement to performance testing endpoint:
- GET `/database/performance`

This endpoint allows public load generation and should only be accessible by administrators.

## Current State

```go
// backend/internal/api/routes/routes.go (line 70)
databaseGroup.GET("/performance", handlers.GetDatabasePerformance)
```

**Problem**: Public access allows anyone to DoS the database with load tests

## Target State

```go
// Add admin-only JWT requirement
databaseGroup.GET("/performance", middleware.AuthMiddleware(), middleware.RequireRole("admin"), handlers.GetDatabasePerformance)
```

## Implementation Steps

### Step 1: Locate Database Routes

**File**: `backend/internal/api/routes/routes.go`
**Location**: Around line 70

### Step 2: Add Middleware to GET /database/performance

**Current Code**:
```go
// Database Routes
databaseGroup := router.Group("/database")
{
    databaseGroup.GET("/health", handlers.GetDatabaseHealth)
    databaseGroup.GET("/stats", handlers.GetDatabaseStats)
    databaseGroup.GET("/performance", handlers.GetDatabasePerformance)
}
```

**Replace With**:
```go
// Database Routes
databaseGroup := router.Group("/database")
{
    databaseGroup.GET("/health", handlers.GetDatabaseHealth)
    databaseGroup.GET("/stats", handlers.GetDatabaseStats)
    // GET /database/performance - ADMIN ONLY (expensive operation)
    databaseGroup.GET("/performance",
        middleware.AuthMiddleware(),
        middleware.RequireRole("admin"),
        handlers.GetDatabasePerformance)
}
```

### Step 3: Verify Compilation

```bash
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
```

Expected: Successful build with no errors

### Step 4: Test the Fix

#### Test 4a: Verify Unauthenticated Access Blocked

```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:8080/database/performance
```

Expected Response: `401 Unauthorized`

#### Test 4b: Verify Non-Admin Access Blocked

```bash
# Use user token (not admin)
curl -X GET http://localhost:8080/database/performance \
  -H "Authorization: Bearer user_token"
```

Expected Response: `403 Forbidden`

#### Test 4c: Verify Admin Can Access Performance Endpoint

```bash
# Use admin token
curl -X GET http://localhost:8080/database/performance \
  -H "Authorization: Bearer admin_token"
```

Expected Response: `200 OK` with performance metrics

#### Test 4d: Verify Other Database Endpoints Still Public

```bash
# Database health should still be public
curl -X GET http://localhost:8080/database/health

# Database stats should still be public
curl -X GET http://localhost:8080/database/stats
```

Expected Response: `200 OK` for both

## Acceptance Criteria

- [ ] GET /database/performance requires admin JWT
- [ ] Unauthenticated requests return 401
- [ ] Non-admin requests return 403
- [ ] Admin requests return 200 with metrics
- [ ] GET /database/health still public (unchanged)
- [ ] GET /database/stats still public (unchanged)
- [ ] No other database operations affected

## Verification Checklist

- [ ] Code compiles without errors
- [ ] No syntax errors
- [ ] Middleware applied in correct order
- [ ] Health checks still work
- [ ] Monitoring endpoints still work
- [ ] Only admin access allowed

## Rollback Procedure

```bash
# Revert changes
git checkout backend/internal/api/routes/routes.go

# Or manually restore:
# Change: databaseGroup.GET("/performance", middleware.AuthMiddleware(), middleware.RequireRole("admin"), handlers.GetDatabasePerformance)
# Back to: databaseGroup.GET("/performance", handlers.GetDatabasePerformance)
```

---

# IMPLEMENTATION WORKFLOW

## Pre-Implementation Checklist

- [ ] Branch `feat/supabase-jwt` is checked out and current
- [ ] No uncommitted changes in working directory
- [ ] Backend code compiles successfully (`go build`)
- [ ] All audit documents are reviewed
- [ ] Team is notified of changes
- [ ] Testing environment is ready

## Implementation Order

**Priority**: Execute in this order to minimize risk

1. **TASK 1**: Supabase Analyzer JWT (10 min)
2. **TASK 2**: Cache Clear Protection (15 min)
3. **TASK 3**: Database Performance Protection (20 min)
4. **Testing**: Comprehensive verification (1-2 hours)
5. **Commit & Push**: All changes pushed to feature branch

## Git Workflow (PowerShell)

### Before Starting

```powershell
# Navigate to project root
cd "d:\Journey Code\Project\lab\sellica-golang"

# Verify branch is correct
git branch

# Should show: feat/supabase-jwt (with asterisk)
# If not: git checkout feat/supabase-jwt

# Fetch latest changes
git fetch origin

# Verify working directory is clean
git status
```

### After Each Task (Optional - Before Testing)

```powershell
# See what changed
git diff backend/internal/api/routes/routes.go
```

### Final Commit Workflow

```powershell
# Stage all changes
git add .

# Commit with conventional format
git commit -m "fix(security): add admin JWT requirement to 3 dangerous endpoints

BREAKING CHANGE: Supabase analyzer, cache clear, and database performance
endpoints now require admin JWT authentication.

- Supabase analyzer endpoints (/api/v1/supabase/*) - admin only
- DELETE /cache/clear endpoint - admin only
- GET /database/performance endpoint - admin only

Affected endpoints:
  - GET /api/v1/supabase/analyze
  - GET /api/v1/supabase/overview
  - GET /api/v1/supabase/tables/:name
  - GET /api/v1/supabase/buckets
  - DELETE /cache/clear
  - GET /database/performance

Fixes: Critical security audit findings C1, C2, C3
Ref: docs/bydate/2025-11-05/BACKEND-API-SUPABASE-JWT-AUDIT.md"

# Verify commit
git log --oneline -3

# Push to feature branch
git push origin feat/supabase-jwt
```

---

# TESTING CHECKLIST

## Pre-Testing Setup

- [ ] Backend is running: `go run cmd/server/main.go`
- [ ] Backend is accessible: `curl http://localhost:8080/health`
- [ ] Get admin JWT token for testing
- [ ] Get non-admin JWT token for testing
- [ ] PowerShell terminal is ready

## Critical Fix Testing

### Fix C1: Supabase Analyzer (4 tests)

```powershell
# Test 1: Unauthenticated - expect 401
curl -X GET http://localhost:8080/api/v1/supabase/analyze
# ✅ Should return 401 Unauthorized

# Test 2: Non-admin JWT - expect 403
$token = "non_admin_token_here"
curl -X GET http://localhost:8080/api/v1/supabase/analyze `
  -Headers @{"Authorization" = "Bearer $token"}
# ✅ Should return 403 Forbidden

# Test 3: Admin JWT - expect 200
$adminToken = "admin_token_here"
curl -X GET http://localhost:8080/api/v1/supabase/analyze `
  -Headers @{"Authorization" = "Bearer $adminToken"}
# ✅ Should return 200 OK

# Test 4: Other supabase endpoints - all require admin
curl -X GET http://localhost:8080/api/v1/supabase/overview
curl -X GET http://localhost:8080/api/v1/supabase/tables/users
curl -X GET http://localhost:8080/api/v1/supabase/buckets
# ✅ All should return 401 if no token
```

### Fix C2: Cache Clear (4 tests)

```powershell
# Test 1: Unauthenticated DELETE - expect 401
curl -X DELETE http://localhost:8080/cache/clear
# ✅ Should return 401 Unauthorized

# Test 2: Non-admin JWT - expect 403
$token = "non_admin_token_here"
curl -X DELETE http://localhost:8080/cache/clear `
  -Headers @{"Authorization" = "Bearer $token"}
# ✅ Should return 403 Forbidden

# Test 3: Admin JWT - expect 200
$adminToken = "admin_token_here"
curl -X DELETE http://localhost:8080/cache/clear `
  -Headers @{"Authorization" = "Bearer $adminToken"}
# ✅ Should return 200 OK

# Test 4: GET operations still public
curl -X GET http://localhost:8080/cache/health
curl -X GET http://localhost:8080/cache/stats
# ✅ Both should return 200 OK (no auth required)
```

### Fix C3: Database Performance (4 tests)

```powershell
# Test 1: Unauthenticated - expect 401
curl -X GET http://localhost:8080/database/performance
# ✅ Should return 401 Unauthorized

# Test 2: Non-admin JWT - expect 403
$token = "non_admin_token_here"
curl -X GET http://localhost:8080/database/performance `
  -Headers @{"Authorization" = "Bearer $token"}
# ✅ Should return 403 Forbidden

# Test 3: Admin JWT - expect 200
$adminToken = "admin_token_here"
curl -X GET http://localhost:8080/database/performance `
  -Headers @{"Authorization" = "Bearer $adminToken"}
# ✅ Should return 200 OK

# Test 4: GET operations still public
curl -X GET http://localhost:8080/database/health
curl -X GET http://localhost:8080/database/stats
# ✅ Both should return 200 OK (no auth required)
```

## Regression Testing

- [ ] All other endpoints still accessible
- [ ] Health checks work (no auth required)
- [ ] Metrics accessible (no auth required)
- [ ] Data-Rekam endpoints work with JWT
- [ ] Admin endpoints work with JWT
- [ ] No new error messages in logs
- [ ] Performance not degraded

## Test Results Documentation

Create a file `FIXES-TEST-RESULTS.md` in same directory with:

```markdown
# Critical Fixes - Test Results

**Date**: 2025-11-05
**Tester**: [Your Name]
**Environment**: Local Development
**Status**: ✅ All Tests Passed / ⚠️ Some Issues / ❌ Failed

## Fix C1: Supabase Analyzer

- [x] Unauthenticated returns 401
- [x] Non-admin returns 403
- [x] Admin returns 200
- [x] All 4 endpoints protected

## Fix C2: Cache Clear

- [x] Unauthenticated returns 401
- [x] Non-admin returns 403
- [x] Admin returns 200
- [x] GET operations still public

## Fix C3: Database Performance

- [x] Unauthenticated returns 401
- [x] Non-admin returns 403
- [x] Admin returns 200
- [x] GET operations still public

## Regression Testing

- [x] No functionality broken
- [x] All tests pass
- [x] Logs look normal
- [x] Performance acceptable
```

---

# SUCCESS CRITERIA

The implementation is successful when:

✅ **Code Changes**:
- All 3 endpoints have proper middleware
- Code compiles without errors
- No syntax issues
- Follows project conventions

✅ **Testing**:
- All 12 critical tests pass (4 per fix)
- Unauthenticated requests blocked
- Non-admin requests blocked
- Admin requests work
- GET operations still public
- No regressions

✅ **Git**:
- Changes committed to feat/supabase-jwt
- Commit message follows conventional format
- Push successful
- Branch is mergeable to main

✅ **Documentation**:
- Test results documented
- Checklist marked complete
- Issues resolved match audit findings

---

# TROUBLESHOOTING

## Problem: Backend won't compile after changes

**Solution**:
1. Check for syntax errors: `go build`
2. Verify middleware imports are present
3. Check RequireRole function exists in middleware package
4. Review the exact lines changed

## Problem: 401 responses but middleware should allow

**Solution**:
1. Check JWT token is valid
2. Verify token is in Authorization header
3. Check token hasn't expired
4. Verify backend is using correct JWT secret

## Problem: 403 responses for admin users

**Solution**:
1. Check user has admin role in token
2. Verify RequireRole("admin") is checking correct claim
3. Check token payload contains role information
4. Review auth service implementation

## Problem: Other endpoints now require auth (regression)

**Solution**:
1. Verify middleware added only to specific endpoints
2. Check no global middleware changes
3. Review routes.go for accidental middleware additions
4. Revert and try again more carefully

---

# SIGN-OFF

## Implementation Sign-Off

- [ ] All code changes implemented
- [ ] All tests passing
- [ ] Changes committed and pushed
- [ ] No regressions found
- [ ] Documentation updated

## Review Sign-Off

- [ ] Code reviewed by team lead
- [ ] Changes approved
- [ ] Security implications understood
- [ ] Ready for production deployment

## Deployment Sign-Off

- [ ] Changes merged to main
- [ ] Deployed to staging
- [ ] Verified in staging environment
- [ ] Ready for production release

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Next Review**: After implementation complete
**Related Documents**: BACKEND-API-SUPABASE-JWT-AUDIT.md, AUDIT-FINDINGS-CODE-REFERENCE.md
