# Security Fixes #4, #5, #6 - Test Cases & Verification

**Document**: Security Fixes Test Plan
**Project Date**: 2025-11-06
**Created**: 2025-11-06
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: QA/Testing Team
**Type**: Test Plan

## Overview

This document provides comprehensive test cases for the three additional security fixes implemented on 2025-11-06:
- **Fix #4**: Performance test endpoint admin-only access
- **Fix #5**: Chat endpoints security clarification
- **Fix #6**: WebSocket authentication requirement

## Test Environment Setup

### Prerequisites
```bash
# Backend running
curl http://localhost:8080/health

# Test tokens (from auth system)
USER_TOKEN="<valid-user-jwt>"
ADMIN_TOKEN="<valid-admin-jwt>"
INVALID_TOKEN="invalid.token.here"
```

### Helper Functions
```bash
# Test authenticated request
test_auth_required() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    
    # Test without token
    echo "Testing $method $endpoint without auth..."
    curl -i -X $method http://localhost:8080$endpoint 2>/dev/null | head -1
    
    # Test with token
    echo "Testing $method $endpoint with token..."
    curl -i -X $method http://localhost:8080$endpoint \
        -H "Authorization: Bearer $USER_TOKEN" 2>/dev/null | head -1
}
```

---

## Fix #4: Performance Test Endpoint Admin-Only Access

### Issue
POST /api/performance/test was accessible to any user, allowing DoS via load generation

### Fix Applied
- Added `middleware.AuthMiddleware(authService)` requirement
- Added `middleware.RequireRole("admin")` requirement
- Separated POST endpoint into admin-only group

### Test Case 4.1: Unauthenticated Request
**Endpoint**: POST /api/performance/test
**Method**: POST
**Headers**: None
**Expected Response**: 401 Unauthorized

```bash
curl -v -X POST http://localhost:8080/api/performance/test \
    -H "Content-Type: application/json" \
    -d '{}' 2>&1 | grep -E "HTTP|401"
```

**Expected Output**:
```
HTTP/1.1 401 Unauthorized
```

**Pass Criteria**: ✓ Returns 401

---

### Test Case 4.2: Authenticated Non-Admin Request
**Endpoint**: POST /api/performance/test
**Method**: POST
**Headers**: Authorization: Bearer <user-token>
**Expected Response**: 403 Forbidden

```bash
curl -v -X POST http://localhost:8080/api/performance/test \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{}' 2>&1 | grep -E "HTTP|403"
```

**Expected Output**:
```
HTTP/1.1 403 Forbidden
```

**Pass Criteria**: ✓ Returns 403

---

### Test Case 4.3: Authenticated Admin Request
**Endpoint**: POST /api/performance/test
**Method**: POST
**Headers**: Authorization: Bearer <admin-token>
**Expected Response**: 200 OK or 500 (handler error, not auth error)

```bash
curl -v -X POST http://localhost:8080/api/performance/test \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{}' 2>&1 | grep -E "HTTP"
```

**Expected Output** (one of):
```
HTTP/1.1 200 OK
HTTP/1.1 400 Bad Request    (handler validation)
HTTP/1.1 500 Internal Server Error  (handler error)
```

**Pass Criteria**: ✓ Not 401 or 403 (auth succeeded)

---

### Test Case 4.4: GET Endpoints Remain Public
**Endpoint**: GET /api/performance/metrics
**Method**: GET
**Headers**: None
**Expected Response**: 200 OK

```bash
curl -v -X GET http://localhost:8080/api/performance/metrics 2>&1 | grep -E "HTTP|200"
```

**Expected Output**:
```
HTTP/1.1 200 OK
```

**Pass Criteria**: ✓ Returns 200 (still public)

---

### Test Case 4.5: All Performance GET Endpoints Public
**Endpoints**: 
- GET /performance
- GET /api/performance/metrics
- GET /api/performance/health
- GET /api/performance/stats

```bash
for endpoint in "/performance" "/api/performance/metrics" "/api/performance/health" "/api/performance/stats"; do
    echo "Testing GET $endpoint..."
    curl -s -w "\n%{http_code}\n" http://localhost:8080$endpoint > /dev/null
done
```

**Expected Output**: All return 200

**Pass Criteria**: ✓ All return 200 (all GET endpoints still public)

---

## Fix #5: Chat Endpoints Security

### Issue
Chat endpoints marked as public with optional auth, but no clear security policy in code

### Fix Applied
- Updated setupChatRoutes() to use authService parameter (was unused)
- Added detailed security decision comments
- Documented intentional optional auth behavior
- Added TODO for future enhancement of chat history/sessions endpoints

### Test Case 5.1: Public Chat (Anonymous)
**Endpoint**: POST /chat
**Method**: POST
**Headers**: None
**Expected Response**: 200 OK or 400 Bad Request (not 401)

```bash
curl -v -X POST http://localhost:8080/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"hello","context":"test"}' 2>&1 | grep -E "HTTP|200|400"
```

**Expected Output** (one of):
```
HTTP/1.1 200 OK
HTTP/1.1 400 Bad Request  (validation error, not auth)
```

**Pass Criteria**: ✓ Not 401 (public access works)

---

### Test Case 5.2: Public Chat (Authenticated)
**Endpoint**: POST /chat
**Method**: POST
**Headers**: Authorization: Bearer <user-token>
**Expected Response**: 200 OK or 400 Bad Request

```bash
curl -v -X POST http://localhost:8080/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"message":"hello","context":"test"}' 2>&1 | grep -E "HTTP|200|400"
```

**Expected Output** (one of):
```
HTTP/1.1 200 OK
HTTP/1.1 400 Bad Request
```

**Pass Criteria**: ✓ Auth accepted, user tracked

---

### Test Case 5.3: API Chat Endpoint (Both Routes Work)
**Endpoint**: POST /api/chat
**Method**: POST
**Headers**: None
**Expected Response**: 200 OK or 400 Bad Request

```bash
curl -v -X POST http://localhost:8080/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"hello","context":"test"}' 2>&1 | grep -E "HTTP|200|400"
```

**Expected Output** (one of):
```
HTTP/1.1 200 OK
HTTP/1.1 400 Bad Request
```

**Pass Criteria**: ✓ /api/chat route works (compatibility maintained)

---

### Test Case 5.4: Chat History (Optional Auth)
**Endpoint**: GET /chat/history
**Method**: GET
**Headers**: None (first request), then with token
**Expected Response**: 200 OK or 204 No Content or 400 Bad Request

```bash
# Without auth
curl -v -X GET http://localhost:8080/chat/history 2>&1 | grep -E "HTTP|200|400|401"

# With auth
curl -v -X GET http://localhost:8080/chat/history \
    -H "Authorization: Bearer $USER_TOKEN" 2>&1 | grep -E "HTTP|200|400|401"
```

**Expected Output**: Both succeed (200/204) or both fail with same status

**Pass Criteria**: ✓ Optional auth works (no forced auth)

---

### Test Case 5.5: Code Review - Security Decision Documented
**File**: backend/internal/api/routes/routes.go
**Function**: setupChatRoutes()
**Check**: Comments explain intentional public access with optional auth

```go
// Look for these comments in setupChatRoutes():
// "SECURITY DECISION: Chat endpoints are PUBLIC with OPTIONAL authentication"
// "Allows anonymous users to use the chat feature"
// "Intentional to support public-facing chatbot"
```

**Pass Criteria**: ✓ Security decision clearly documented

---

## Fix #6: WebSocket Authentication Requirement

### Issue
WebSocket endpoint GET /ws/tickets allowed anonymous connections

### Fix Applied
- Added `middleware.AuthMiddleware(authService)` to WebSocket route group
- Updated Handle() method to reject connections without user_id
- Added explicit 401 response for unauthenticated attempts

### Test Case 6.1: WebSocket Without Authentication
**Endpoint**: GET /ws/tickets
**Method**: WebSocket upgrade
**Headers**: None
**Expected Response**: 401 Unauthorized

```bash
# Using wscat (if installed)
wscat -c ws://localhost:8080/ws/tickets 2>&1 | grep -E "401|error|closed"

# Or using curl
curl -i -N -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    http://localhost:8080/ws/tickets 2>&1 | grep -E "401|Unauthorized"
```

**Expected Output**:
```
401 Unauthorized
```

**Pass Criteria**: ✓ Returns 401 (auth required)

---

### Test Case 6.2: WebSocket With Valid Token
**Endpoint**: GET /ws/tickets?token=<user-token> OR Authorization header
**Method**: WebSocket upgrade
**Headers**: Authorization: Bearer <user-token>
**Expected Response**: 101 Switching Protocols

```bash
# Using wscat
wscat -c ws://localhost:8080/ws/tickets \
    -H "Authorization: Bearer $USER_TOKEN" 2>&1

# Or curl
curl -i -N -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    http://localhost:8080/ws/tickets 2>&1 | grep -E "101|Switching"
```

**Expected Output**:
```
101 Switching Protocols
```

**Pass Criteria**: ✓ WebSocket upgrades successfully (auth succeeded)

---

### Test Case 6.3: WebSocket With Invalid Token
**Endpoint**: GET /ws/tickets
**Method**: WebSocket upgrade
**Headers**: Authorization: Bearer <invalid-token>
**Expected Response**: 401 Unauthorized

```bash
curl -i -N -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Authorization: Bearer invalid.token.here" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    http://localhost:8080/ws/tickets 2>&1 | grep -E "401|Unauthorized"
```

**Expected Output**:
```
401 Unauthorized
```

**Pass Criteria**: ✓ Returns 401 (invalid token rejected)

---

### Test Case 6.4: WebSocket Connection Handler Receives user_id
**Test Type**: Code inspection
**File**: backend/internal/api/routes/routes.go
**Function**: WebSocketTicketHandler.Handle()
**Check**: Handler no longer allows anonymous userID="anonymous"

```go
// BEFORE (VULNERABLE):
if !exists {
    userID = "anonymous"  // ❌ Allows anonymous
}

// AFTER (FIXED):
if !exists {
    // Reject unauthenticated connection
    c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
    return  // ✓ Rejects anonymous
}
```

**Pass Criteria**: ✓ Handler explicitly rejects unauthenticated connections

---

### Test Case 6.5: Permission Filtering Verification
**Test Type**: Functional test
**Scenario**: Two authenticated users connecting to WebSocket

```bash
# Connect User A
wscat -c ws://localhost:8080/ws/tickets \
    -H "Authorization: Bearer $USER_TOKEN_A" \
    --execute 'subscribe-ticket:123'

# Connect User B (different user)
wscat -c ws://localhost:8080/ws/tickets \
    -H "Authorization: Bearer $USER_TOKEN_B" \
    --execute 'subscribe-ticket:456'

# Broadcast ticket:123 update to User A's room
# Expected: User A receives update, User B does not
```

**Pass Criteria**: ✓ Permission filtering works (users don't see each other's tickets)

---

## Summary Test Report Template

### Build Verification
- [ ] Backend compiles successfully: `go build -o exe/selly-backend.exe cmd/server/main.go`
- [ ] No compilation errors
- [ ] No warnings related to the three fixes

### Fix #4 Tests (Performance Endpoint)
- [ ] Test 4.1: Unauthenticated returns 401 ✓
- [ ] Test 4.2: Non-admin authenticated returns 403 ✓
- [ ] Test 4.3: Admin authenticated returns 200/400/500 (not 401/403) ✓
- [ ] Test 4.4: GET /api/performance/metrics returns 200 ✓
- [ ] Test 4.5: All GET endpoints remain public ✓

### Fix #5 Tests (Chat Endpoints)
- [ ] Test 5.1: Anonymous chat works (200 or 400) ✓
- [ ] Test 5.2: Authenticated chat works ✓
- [ ] Test 5.3: /api/chat and /chat both work ✓
- [ ] Test 5.4: Chat history supports optional auth ✓
- [ ] Test 5.5: Security decision documented in code ✓

### Fix #6 Tests (WebSocket)
- [ ] Test 6.1: Unauthenticated WebSocket returns 401 ✓
- [ ] Test 6.2: Valid token WebSocket returns 101 ✓
- [ ] Test 6.3: Invalid token WebSocket returns 401 ✓
- [ ] Test 6.4: Handler rejects anonymous connections ✓
- [ ] Test 6.5: Permission filtering prevents cross-user access ✓

### Regression Tests
- [ ] All existing tests pass
- [ ] Public endpoints remain accessible
- [ ] Protected endpoints still require correct auth
- [ ] No performance degradation

### Security Review
- [ ] All three fixes address documented vulnerabilities
- [ ] No new vulnerabilities introduced
- [ ] Code follows project security patterns
- [ ] Comments clearly document security decisions

### Documentation
- [ ] Implementation plan matches actual changes
- [ ] Code comments explain security choices
- [ ] TODO comments added for future improvements
- [ ] All commits follow conventional format

---

## Execution Commands

### Run All Tests
```bash
cd backend

# Build
go build -o exe/selly-backend.exe cmd/server/main.go

# Test routes
go test ./internal/api/routes/... -v

# Test handlers
go test ./internal/api/handlers/... -v

# Test middleware
go test ./internal/api/middleware/... -v
```

### Manual Testing
```bash
# Start backend
go run cmd/server/main.go

# In another terminal
source test-security-fixes.sh  # Save test commands as script

# Run individual tests
test_perf_no_auth
test_perf_user_auth
test_perf_admin_auth
test_chat_anonymous
test_websocket_no_auth
test_websocket_with_auth
```

---

## Expected Outcomes

### All Tests Pass ✓
- Fix #4: Performance endpoint protected
- Fix #5: Chat endpoints clarified
- Fix #6: WebSocket requires authentication

### Build Status
- No compilation errors
- All tests pass
- Ready for production deployment

### Security Improvement
- 3 additional attack vectors eliminated
- Total critical vulnerabilities: 6 → 0
- Security posture: CRITICAL → EXCELLENT

---

**Last Updated**: 2025-11-06
**Status**: Ready for execution
**Next Step**: Run tests and verify all pass

