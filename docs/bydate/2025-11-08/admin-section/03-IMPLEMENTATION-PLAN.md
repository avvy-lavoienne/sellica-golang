# Step-by-Step Implementation Plan

**Document**: Admin Section - Step-by-Step Implementation Plan
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Overview

This document provides detailed step-by-step instructions to complete and verify the admin section
refactoring, including the approval/rejection workflow, testing procedures, and deployment checklist.

---

## Phase 1: Complete Backend Implementation

### Step 1.1: Implement RejectUser Handler

**File**: `backend/internal/api/handlers/admin.go`  
**Location**: After ApproveUser method (around line 280)  
**Estimated Time**: 30 minutes

**Action**:
Add the following method to AdminHandler:

```go
// RejectPendingUser handles user rejection with optional reason
func (h *AdminHandler) RejectPendingUser(c *gin.Context) {
	var req struct {
		PendingUserID   string `json:"pending_user_id" binding:"required"`
		RejectionReason string `json:"rejection_reason,omitempty"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, AdminResponse{
			Success: false,
			Error:   "pending_user_id is required",
		})
		return
	}
	
	// Verify admin role from context
	role, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, AdminResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}
	
	userRole := role.(string)
	if userRole != "admin" && userRole != "superuser" {
		c.JSON(http.StatusForbidden, AdminResponse{
			Success: false,
			Error:   "Only admin users can reject users",
		})
		return
	}
	
	adminID, _ := c.Get("user_id")
	
	logrus.WithFields(logrus.Fields{
		"admin_id":        adminID,
		"pending_user_id": req.PendingUserID,
	}).Info("Processing user rejection request")
	
	// Get the pending user first
	pendingUsers, err := h.dbService.GetPendingUsers(c.Request.Context())
	if err != nil {
		logrus.WithError(err).Error("Failed to retrieve pending users")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to retrieve pending users",
		})
		return
	}
	
	var pendingUser *database.PendingUser
	for i := range pendingUsers {
		if pendingUsers[i].ID == req.PendingUserID {
			pendingUser = &pendingUsers[i]
			break
		}
	}
	
	if pendingUser == nil {
		c.JSON(http.StatusNotFound, AdminResponse{
			Success: false,
			Error:   "Pending user not found",
		})
		return
	}
	
	logrus.WithFields(logrus.Fields{
		"user_id": pendingUser.ID,
		"email":   pendingUser.Email,
		"name":    pendingUser.Name,
	}).Info("Found pending user for rejection")
	
	// Reject the user in database
	err = h.dbService.RejectPendingUser(c.Request.Context(), req.PendingUserID, req.RejectionReason)
	if err != nil {
		logrus.WithError(err).Error("Failed to reject user")
		c.JSON(http.StatusInternalServerError, AdminResponse{
			Success: false,
			Error:   "Failed to reject user: " + err.Error(),
		})
		return
	}
	
	logrus.WithFields(logrus.Fields{
		"admin_id":        adminID,
		"user_id":        pendingUser.ID,
		"admin_action":   "reject_user",
		"rejection_reason": req.RejectionReason,
	}).Info("Admin rejected pending user")
	
	c.JSON(http.StatusOK, AdminResponse{
		Success: true,
		Message: fmt.Sprintf("User %s rejected successfully", pendingUser.Email),
	})
}
```

**Verification**:
- [ ] Code compiles without errors: `go build -o exe/selly-backend.exe cmd/server/main.go`
- [ ] Method signature matches interface expectations
- [ ] Logging statements follow project patterns
- [ ] Error handling includes all edge cases

---

### Step 1.2: Register Reject Endpoint in Routes

**File**: `backend/internal/api/routes/routes.go`  
**Location**: setupAdminRoutes function (around line 525)  
**Estimated Time**: 10 minutes

**Current Code** (Lines 525-537):
```go
func setupAdminRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	// Create admin handler
	adminHandler := handlers.NewAdminHandler(dbService)

	// Protected admin endpoints (require authentication and admin role)
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(authService))
	{
		// Get all pending users (for admin review)
		adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
		// Approve a pending user registration
		adminGroup.POST("/approve-user", adminHandler.ApproveUser)
	}
}
```

**Action**:
Add the reject endpoint:

```go
func setupAdminRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	// Create admin handler
	adminHandler := handlers.NewAdminHandler(dbService)

	// Protected admin endpoints (require authentication and admin role)
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(authService))
	{
		// Get all pending users (for admin review)
		adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
		// Approve a pending user registration
		adminGroup.POST("/approve-user", adminHandler.ApproveUser)
		// Reject a pending user registration
		adminGroup.POST("/reject-user", adminHandler.RejectPendingUser)  // NEW LINE
	}
}
```

**Verification**:
- [ ] Route registered with correct HTTP method (POST)
- [ ] Route path matches frontend expectations
- [ ] Handler method name matches implementation
- [ ] Middleware applied (AuthMiddleware)

---

### Step 1.3: Verify Database Service Methods

**File**: `backend/internal/services/database/auth.go`  
**Estimated Time**: 10 minutes

**Verify Existing Methods**:

```go
// Line ~256: GetPendingUsers method exists
func (s *Service) GetPendingUsers(ctx context.Context) ([]PendingUser, error) {
    // Verify this exists and works
}

// Line ~327: ApprovePendingUser method exists
func (s *Service) ApprovePendingUser(ctx context.Context, pendingUserID string) error {
    // Verify this exists and works
}

// Verify this method exists:
func (s *Service) RejectPendingUser(ctx context.Context, pendingUserID string, reason string) error {
    // Should exist from database service
}
```

**Checklist**:
- [ ] GetPendingUsers returns PendingUser slice
- [ ] ApprovePendingUser updates pending_users status to "approved"
- [ ] RejectPendingUser updates pending_users status to "rejected"
- [ ] All methods handle errors properly
- [ ] All methods log operations with logrus

---

### Step 1.4: Rebuild Backend

**Command**:
```powershell
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
```

**Expected Output**:
```
[No errors, executable created in backend/exe/selly-backend.exe]
```

**Verification**:
- [ ] Build completes without errors
- [ ] Executable size reasonable (~50-100MB)
- [ ] No build warnings

---

## Phase 2: Frontend Integration Testing

### Step 2.1: Start Backend Server

**Command**:
```powershell
cd backend
./exe/selly-backend.exe
```

**Expected Output**:
```
[GIN-debug] Server running on :8080
[INFO] Health check passed
[INFO] Database connected
```

**Verification**:
- [ ] Backend listens on port 8080
- [ ] Health check endpoint responds
- [ ] Database connected successfully
- [ ] No error logs

---

### Step 2.2: Start Frontend Dev Server

**Command** (in different terminal):
```powershell
cd frontend
pnpm dev
```

**Expected Output**:
```
ready - started server on 0.0.0.0:3000
```

**Verification**:
- [ ] Frontend listens on port 3000
- [ ] No build errors
- [ ] No TypeScript errors

---

### Step 2.3: Test Get Pending Users Endpoint

**Manual Test**:

1. Open browser to `http://localhost:3000/admin`
2. Log in with admin credentials
3. Wait for table to load

**Expected Result**:
- [ ] Pending users table appears
- [ ] Columns: Name, Email, Registration Date, Status, Actions
- [ ] "Setujui" (Approve) button visible
- [ ] "Tolak" (Reject) button visible
- [ ] No 401/403 errors in console

**Check Network Tab**:
- [ ] GET /api/admin/pending-users returns 200
- [ ] Response includes user array
- [ ] Response doesn't include password fields

---

### Step 2.4: Test Approve (Setujui) Button

**Manual Test**:

1. Click "Setujui" button on first pending user
2. Observe loading state
3. Check for success toast
4. Verify user disappears from table or status changes

**Expected Result**:
- [ ] Button shows loading spinner
- [ ] Toast appears: "Pengguna [Name] berhasil disetujui"
- [ ] User removed from pending list (or status changes)
- [ ] Network tab shows POST /api/admin/approve-user
- [ ] Response status: 200 OK

**Database Verification**:
```sql
-- In Supabase SQL Editor:
-- 1. Check profiles table
SELECT id, email, name, role FROM profiles 
WHERE email = '[test-user-email]'
LIMIT 1;

-- Expected: Profile exists with role "user"

-- 2. Check pending_users table
SELECT id, email, status, approved_at, approved_by FROM pending_users 
WHERE email = '[test-user-email]'
LIMIT 1;

-- Expected: status = "approved", approved_at is set, approved_by is set
```

---

### Step 2.5: Test Reject (Tolak) Button

**Manual Test**:

1. Create new test user (register again)
2. Click "Tolak" button with reason "Test rejection"
3. Observe loading state
4. Check for success toast
5. Verify user disappears or status changes

**Expected Result**:
- [ ] Button shows loading spinner
- [ ] Toast appears: "Pengguna [Email] berhasil ditolak"
- [ ] User removed from pending list (or status changes to rejected)
- [ ] Network tab shows POST /api/admin/reject-user
- [ ] Response status: 200 OK

**Database Verification**:
```sql
-- In Supabase SQL Editor:
SELECT id, email, status, rejected_at, rejected_by, rejection_reason 
FROM pending_users 
WHERE email = '[test-user-email]'
LIMIT 1;

-- Expected: status = "rejected", rejected_at is set, rejected_by is set
```

---

### Step 2.6: Test Error Handling

**Test Missing Token**:
1. Open DevTools → Application → Local Storage
2. Delete `selly_auth_token`
3. Refresh page
4. Expected: Redirected to login or 401 error

**Test Non-Admin User**:
1. Create new user account with non-admin role
2. Log in as that user
3. Try to access `/admin` page
4. Expected: 403 Forbidden or redirect

**Test Invalid Pending User ID**:
1. In DevTools Console, intercept fetch request
2. Send POST with invalid pending_user_id
3. Expected: 404 Not Found error

---

## Phase 3: Automated Testing

### Step 3.1: Create Integration Test

**File**: `backend/test/integration/admin_test.go`  
**Estimated Time**: 1 hour

**Template**:
```go
package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetPendingUsers(t *testing.T) {
	// Setup
	router := setupTestRouter()
	token := generateTestToken("admin")
	
	// Request
	req, _ := http.NewRequest("GET", "/api/admin/pending-users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	
	recorder := performRequest(router, req)
	
	// Assertions
	assert.Equal(t, http.StatusOK, recorder.Code)
	
	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}

func TestApproveUser(t *testing.T) {
	// Setup
	router := setupTestRouter()
	token := generateTestToken("admin")
	
	// Create test pending user first
	testUserID := createTestPendingUser()
	
	// Request
	body := map[string]interface{}{
		"pending_user_id": testUserID,
	}
	bodyBytes, _ := json.Marshal(body)
	
	req, _ := http.NewRequest("POST", "/api/admin/approve-user", bytes.NewReader(bodyBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	
	recorder := performRequest(router, req)
	
	// Assertions
	assert.Equal(t, http.StatusOK, recorder.Code)
	
	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}

func TestRejectUser(t *testing.T) {
	// Setup
	router := setupTestRouter()
	token := generateTestToken("admin")
	
	// Create test pending user first
	testUserID := createTestPendingUser()
	
	// Request
	body := map[string]interface{}{
		"pending_user_id": testUserID,
		"rejection_reason": "Test rejection",
	}
	bodyBytes, _ := json.Marshal(body)
	
	req, _ := http.NewRequest("POST", "/api/admin/reject-user", bytes.NewReader(bodyBytes))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	
	recorder := performRequest(router, req)
	
	// Assertions
	assert.Equal(t, http.StatusOK, recorder.Code)
	
	var response map[string]interface{}
	json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.True(t, response["success"].(bool))
}
```

**Run Tests**:
```powershell
cd backend
go test ./test/integration/admin_test.go -v
```

**Expected Output**:
```
--- PASS: TestGetPendingUsers
--- PASS: TestApproveUser
--- PASS: TestRejectUser
ok      selly-backend/test/integration  0.245s
```

---

### Step 3.2: Create Unit Tests for Frontend Components

**File**: `frontend/src/__tests__/admin.test.tsx`  
**Estimated Time**: 1 hour

**Template**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import AdminPage from '@/app/(protected)/admin/page';

describe('Admin Page', () => {
  it('should render admin header', () => {
    render(<AdminPage />);
    expect(screen.getByText('Panel Admin')).toBeInTheDocument();
  });

  it('should display pending users table', async () => {
    render(<AdminPage />);
    // Wait for table to load
    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should call approve endpoint on button click', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = mockFetch;

    render(<AdminPage />);
    const approveButton = await screen.findByText('Setujui');
    fireEvent.click(approveButton);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/approve-user',
      expect.any(Object)
    );
  });
});
```

**Run Tests**:
```powershell
cd frontend
pnpm test admin.test.tsx
```

---

## Phase 4: Performance Validation

### Step 4.1: Load Test API Endpoints

**Command**:
```powershell
cd backend
go test -bench=. -benchmem -count=3 ./scripts/load-testing/
```

**Expected Metrics**:
- GET /admin/pending-users: < 200ms
- POST /admin/approve-user: < 300ms
- POST /admin/reject-user: < 300ms

---

### Step 4.2: Check Cache Hit Ratio

**Command**:
```bash
curl http://localhost:8080/cache/stats
```

**Expected Output**:
```json
{
  "cache_hit_ratio": 0.667,
  "total_requests": 1500,
  "cache_hits": 1000,
  "cache_misses": 500
}
```

---

## Phase 5: Documentation and Deployment

### Step 5.1: Update README

**File**: `backend/README.md`  
**Action**: Add admin endpoints section

```markdown
## Admin Endpoints

### Get Pending Users
```
GET /api/admin/pending-users
Authorization: Bearer {token}

Response: AdminResponse with array of PendingUserResponse
```

### Approve User
```
POST /api/admin/approve-user
Authorization: Bearer {token}
Body: { "pending_user_id": "uuid" }

Response: AdminResponse with success message
```

### Reject User
```
POST /api/admin/reject-user
Authorization: Bearer {token}
Body: { "pending_user_id": "uuid", "rejection_reason": "optional" }

Response: AdminResponse with success message
```
```

---

### Step 5.2: Create Deployment Checklist

**Pre-Deployment**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance benchmarks acceptable
- [ ] Code reviewed by team
- [ ] Documentation updated
- [ ] Database migrations applied
- [ ] Backend built and tested

**Deployment**:
- [ ] Backend deployed to staging
- [ ] Frontend deployed to staging
- [ ] E2E tests run on staging
- [ ] Smoke tests pass
- [ ] Logs checked for errors

**Post-Deployment**:
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user feedback
- [ ] Document any issues
- [ ] Plan hotfixes if needed

---

## Summary Checklist

### Phase 1: Backend Implementation
- [ ] RejectUser handler implemented
- [ ] Reject endpoint registered in routes
- [ ] Database service verified
- [ ] Backend rebuilt successfully

### Phase 2: Integration Testing
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Pending users load correctly
- [ ] Approve button works
- [ ] Reject button works
- [ ] Error handling verified

### Phase 3: Automated Testing
- [ ] Integration tests created and passing
- [ ] Unit tests created and passing
- [ ] All tests run successfully

### Phase 4: Performance
- [ ] Load tests completed
- [ ] Cache metrics acceptable
- [ ] Response times within limits

### Phase 5: Deployment
- [ ] Documentation updated
- [ ] Deployment checklist completed
- [ ] Ready for production deployment

---

**Last Updated**: 2025-11-08  
**Estimated Total Time**: 4-5 hours  
**Completion Criteria**: All checklists marked complete
