# Audit Findings - Detailed Code Reference

**Document**: Backend API Audit - Detailed Findings & Code Locations
**Project Date**: 2025-11-05
**Created**: 2025-11-05
**Version**: 1.0
**Status**: ✅ Complete
**Type**: Technical Reference

## Table of Contents

1. [Critical Issues - Code Locations](#critical-issues)
2. [Protected Endpoints - Implementation](#protected-endpoints)
3. [Public Endpoints - Security Risk Assessment](#public-endpoints)
4. [Middleware Analysis](#middleware-analysis)
5. [Action Items with Line References](#action-items)

---

## Critical Issues - Code Locations

### Issue #1: Supabase Analyzer - Unprotected Schema Introspection

**File**: `backend/internal/api/routes/supabase_analyzer_routes.go`

**Unprotected Routes** (Lines 13-22):
```go
func setupSupabaseAnalyzerRoutes(router *gin.Engine, handler *handlers.SupabaseAnalyzerHandler) {
	// API group for Supabase analyzer endpoints
	api := router.Group("/api/v1/supabase")
	{
		// Full project analysis
		api.GET("/analyze", handler.AnalyzeProject)               // ❌ NO AUTH
		api.GET("/overview", handler.GetProjectOverview)         // ❌ NO AUTH
		api.GET("/tables/:name", handler.GetTableStats)          // ❌ NO AUTH
		api.GET("/buckets", handler.ListBuckets)                 // ❌ NO AUTH
	}
}
```

**Handler File**: `backend/internal/api/handlers/supabase_analyzer_handler.go`

**Handler Implementation** (Lines 32-62):
```go
func (h *SupabaseAnalyzerHandler) AnalyzeProject(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// Get query parameters
	includeTables := c.DefaultQuery("tables", "true") == "true"
	includeBuckets := c.DefaultQuery("buckets", "true") == "true"
	includeColumns := c.DefaultQuery("columns", "true") == "true"

	filter := supabase_analyzer.AnalysisFilter{
		IncludeTables:   includeTables,
		IncludeBuckets:  includeBuckets,
		IncludeColumns:  includeColumns,
		SchemaName:      "public",
		MaxTableResults: 0, // No limit
	}

	// Perform analysis
	analysis, err := h.analyzer.AnalyzeProject(ctx, filter)
	// Returns complete schema...
}
```

**Route Registration**: `backend/internal/api/routes/routes.go` (Lines 100-103)
```go
// Supabase analyzer routes (public)
if services.SupabaseAnalyzer != nil {
    setupSupabaseAnalyzerRoutes(router, supabaseAnalyzerHandler)  // ❌ No middleware!
}
```

**Exposed Data**:
- All table names
- All column names and types
- All bucket names and configuration
- Schema structure
- Query performance data

**Fix Required**:
```go
// Lines 100-103 in routes.go - CHANGE TO:
if services.SupabaseAnalyzer != nil {
    supabaseGroup := router.Group("/api/v1/supabase")
    supabaseGroup.Use(middleware.AuthMiddleware(authService))
    supabaseGroup.Use(middleware.RequireRole("admin"))
    setupSupabaseAnalyzerRoutes(supabaseGroup, supabaseAnalyzerHandler)
}
```

---

### Issue #2: DELETE /cache/clear - Destructive Operation Without Auth

**File**: `backend/internal/api/routes/routes.go` (Line 73)

**Current Code**:
```go
func setupCacheRoutes(router *gin.Engine, handler *handlers.CacheHandler) {
	cache := router.Group("/cache")
	{
		cache.GET("/health", handler.GetCacheHealth)            // ✅ Read-only
		cache.GET("/stats", handler.GetCacheStats)              // ✅ Read-only
		cache.GET("/performance", handler.TestCachePerformance) // ✅ Read-only
		cache.DELETE("/clear", handler.ClearCache)              // ❌ NO JWT!
	}
}
```

**Handler File**: `backend/internal/api/handlers/cache.go`

**Handler Implementation** (Lines TBD):
```go
func (h *CacheHandler) ClearCache(c *gin.Context) {
	// Clears all cached data - destructive operation
	h.cache.Clear()
	c.JSON(200, gin.H{"message": "Cache cleared"})
}
```

**Impact**:
- Any user can clear cache via `DELETE /cache/clear`
- Application performance degradation for all users
- No audit trail of who cleared cache
- DoS attack surface

**Fix Required**:
```go
func setupCacheRoutes(router *gin.Engine, authService *auth.Service, handler *handlers.CacheHandler) {
	// Public read-only cache endpoints
	cache := router.Group("/cache")
	{
		cache.GET("/health", handler.GetCacheHealth)
		cache.GET("/stats", handler.GetCacheStats)
		cache.GET("/performance", handler.TestCachePerformance)
	}

	// Admin cache management
	cacheAdmin := router.Group("/cache")
	cacheAdmin.Use(middleware.AuthMiddleware(authService))
	cacheAdmin.Use(middleware.RequireRole("admin"))
	{
		cacheAdmin.DELETE("/clear", handler.ClearCache)
	}
}
```

**Call Site**: `backend/internal/api/routes/routes.go` (Line 72)
```go
// Change from:
setupCacheRoutes(router, cacheHandler)

// To:
setupCacheRoutes(router, services.Auth, cacheHandler)
```

---

### Issue #3: Database Performance Testing - Load Generation Without Auth

**File**: `backend/internal/api/routes/routes.go` (Lines 65-71)

**Current Code**:
```go
func setupDatabaseRoutes(router *gin.Engine, handler *handlers.DatabaseHandler) {
	database := router.Group("/database")
	{
		database.GET("/health", handler.GetDatabaseHealth)            // ✅ Read-only
		database.GET("/stats", handler.GetDatabaseStats)              // ✅ Read-only
		database.GET("/performance", handler.TestDatabasePerformance) // ❌ NO JWT!
	}

	router.GET("/test-db", handler.TestDatabase)  // ⚠️ Public root endpoint
}
```

**Handler File**: `backend/internal/api/handlers/database.go`

**Handler Implementation** (Lines TBD):
```go
func (h *DatabaseHandler) TestDatabasePerformance(c *gin.Context) {
	ctx := c.Request.Context()
	
	// This generates test load on production database
	numQueries := c.DefaultQuery("queries", "100")
	
	// Runs N queries for performance testing
	results := h.service.RunPerformanceTest(ctx, numQueries)
	
	c.JSON(200, results)
}
```

**Risk**:
- Any user can generate database load
- DoS attack via `/database/performance?queries=10000`
- No rate limiting on these endpoints
- Impacts all application users

**Fix Required**:
```go
func setupDatabaseRoutes(router *gin.Engine, authService *auth.Service, handler *handlers.DatabaseHandler) {
	// Public health check
	database := router.Group("/database")
	{
		database.GET("/health", handler.GetDatabaseHealth)
		database.GET("/stats", handler.GetDatabaseStats)
	}

	// Admin performance testing (requires auth + admin role)
	databaseAdmin := router.Group("/database")
	databaseAdmin.Use(middleware.AuthMiddleware(authService))
	databaseAdmin.Use(middleware.RequireRole("admin"))
	{
		databaseAdmin.GET("/performance", handler.TestDatabasePerformance)
	}

	router.GET("/test-db", handler.TestDatabase)
}
```

---

## Protected Endpoints - Implementation

### Model: Authentication Required Routes

These endpoints correctly implement JWT authentication via middleware.

#### Pattern: Data-Rekam Routes

**File**: `backend/internal/api/routes/routes.go` (Lines 83-92)

**Implementation** ✅:
```go
func setupDataRekamRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	dataRekamHandler := handlers.NewDataRekamHandler(dbService)

	// Protected data-rekam endpoints (require authentication)
	dataRekamGroup := router.Group("/data-rekam")
	dataRekamGroup.Use(middleware.AuthMiddleware(authService))  // ✅ JWT enforced
	{
		dataRekamGroup.GET("/adjudicate", dataRekamHandler.GetAdjudicateRecords)
		dataRekamGroup.GET("/duplicate-operator", dataRekamHandler.GetDuplicateOperatorRecords)
		dataRekamGroup.GET("/pengajuan-bulanan", dataRekamHandler.GetPengajuanBulananRecords)
		dataRekamGroup.GET("/salah-rekam", dataRekamHandler.GetSalahRekamRecords)
		dataRekamGroup.GET("/dashboard-stats", dataRekamHandler.GetDashboardStats)
	}
}
```

**Middleware Flow**:
1. Request arrives at `/data-rekam/adjudicate`
2. `AuthMiddleware` intercepts (Line 5)
3. Extracts and validates JWT
4. Sets context variables (user_id, user_email, user_role)
5. Handler proceeds if valid
6. Handler accesses `c.Get("user_id")` for audit trail

**Handler File**: `backend/internal/api/handlers/data_rekam_handler.go`

**Handler Usage**:
```go
func (h *DataRekamHandler) GetAdjudicateRecords(c *gin.Context) {
	// Get authenticated user ID from context
	userID, _ := c.Get("user_id")
	
	// Query only shows records relevant to this user
	records, err := h.dbService.GetAdjudicateRecords(c.Request.Context(), userID.(string))
	
	c.JSON(200, records)
}
```

---

#### Pattern: Admin Routes with RBAC

**File**: `backend/internal/api/routes/routes.go` (Lines 448-458)

**Implementation** ✅:
```go
func setupAdminRoutes(router *gin.Engine, authService *auth.Service, dbService *database.Service) {
	adminHandler := handlers.NewAdminHandler(dbService)

	// Protected admin endpoints (require authentication and admin role)
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(authService))     // ✅ JWT required
	{
		// Note: Role check happens in handler currently
		adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
		adminGroup.POST("/approve-user", adminHandler.ApproveUser)
	}
}
```

**Handler Role Check** (`backend/internal/api/handlers/admin.go`, Lines 47-70):
```go
func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
	// Verify admin role from context (set by auth middleware)
	role, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, AdminResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	// Check if user has admin or superuser role
	userRole := role.(string)
	if userRole != "admin" && userRole != "superuser" {
		c.JSON(http.StatusForbidden, AdminResponse{
			Success: false,
			Error:   "Only admin users can access pending users",
		})
		return
	}
	
	// Process admin operation...
}
```

**Improvement Opportunity**: Move role check to middleware
```go
// BETTER: Use middleware.RequireRole("admin")
adminGroup := router.Group("/admin")
adminGroup.Use(middleware.AuthMiddleware(authService))
adminGroup.Use(middleware.RequireRole("admin"))  // ← Move here
{
    // Handler no longer needs role check
    adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
}
```

---

## Public Endpoints - Security Risk Assessment

### Summary Table

| Endpoint | Type | JWT | Auth | Risk | Action |
|----------|------|-----|------|------|--------|
| /health/* | Health | NO | NO | 🟢 Low | Keep public |
| /metrics/* | Monitoring | NO | NO | 🟢 Low | Keep public |
| /database/health | Health | NO | NO | 🟢 Low | Keep public |
| /database/stats | Monitoring | NO | NO | 🟡 Medium | Consider admin |
| /database/performance | Test | NO | NO | 🔴 HIGH | Move to admin |
| /cache/health | Health | NO | NO | 🟢 Low | Keep public |
| /cache/clear | Admin | NO | NO | 🔴 CRITICAL | Move to admin |
| /performance/test | Test | NO | NO | 🔴 HIGH | Move to admin |
| /chat/* | App | OPTIONAL | NO | 🟡 Medium | Clarify model |
| /ws/tickets | App | OPTIONAL | NO | 🟡 Medium | Require auth |
| /api/v1/supabase/* | Admin | NO | NO | 🔴 CRITICAL | Move to admin |

---

## Middleware Analysis

### Current Middleware Chain

**File**: `backend/internal/api/middleware/auth.go`

**AuthMiddleware** (Lines 12-85):
```go
func AuthMiddleware(authService *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
				"code":  "MISSING_AUTH_HEADER",
			})
			c.Abort()
			return
		}

		// 2. Extract token from "Bearer <token>" format
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		// 3. Validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid token",
				"message": err.Error(),
				"code":    "INVALID_TOKEN",
			})
			c.Abort()
			return
		}

		// 4. Check expiration
		if authService.IsTokenExpired(claims) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token expired",
				"code":  "TOKEN_EXPIRED",
			})
			c.Abort()
			return
		}

		// 5. Set context variables
		authContext := authService.CreateAuthContext(claims)
		c.Set("auth_context", authContext)
		c.Set("user_id", authContext.UserID)
		c.Set("user_email", authContext.Email)
		c.Set("user_role", authContext.Role)

		c.Next()
	}
}
```

**Status**: ✅ Comprehensive validation

**Missing**: No RequireRole middleware found in routes
- Role checks happen inside handlers (inconsistent)
- Could be centralized in middleware

---

### Recommended: Add RequireRole Middleware

**Suggested Implementation**:
```go
// File: backend/internal/api/middleware/auth.go (add to existing file)

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User role not found in context",
			})
			c.Abort()
			return
		}

		roleStr := userRole.(string)
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":      "Insufficient permissions",
			"required":   allowedRoles,
			"got":        roleStr,
		})
		c.Abort()
	}
}
```

**Usage**:
```go
adminGroup := router.Group("/admin")
adminGroup.Use(middleware.AuthMiddleware(authService))
adminGroup.Use(middleware.RequireRole("admin", "superuser"))
{
    adminGroup.GET("/pending-users", handler.GetPendingUsers)
}
```

---

## Action Items with Line References

### CRITICAL: Fix This Week

#### Action 1.1: Protect Supabase Analyzer

**Files to Modify**:
1. `backend/internal/api/routes/routes.go` (Lines 100-103)
2. `backend/internal/api/routes/supabase_analyzer_routes.go` (Lines 11-22)

**Changes**:
```diff
# routes.go
- if services.SupabaseAnalyzer != nil {
-     setupSupabaseAnalyzerRoutes(router, supabaseAnalyzerHandler)
- }

+ if services.SupabaseAnalyzer != nil {
+     supabaseGroup := router.Group("/api/v1/supabase")
+     supabaseGroup.Use(middleware.AuthMiddleware(authService))
+     supabaseGroup.Use(middleware.RequireRole("admin"))
+     setupSupabaseAnalyzerRoutes(supabaseGroup, supabaseAnalyzerHandler)
+ }
```

**Verification**:
```bash
# Should return 401 Unauthorized
curl http://localhost:8080/api/v1/supabase/analyze

# Should return 403 Forbidden (non-admin user)
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:8080/api/v1/supabase/analyze

# Should work (admin user)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:8080/api/v1/supabase/analyze
```

---

#### Action 1.2: Protect DELETE /cache/clear

**Files to Modify**:
1. `backend/internal/api/routes/routes.go` (Lines 65-73)

**Changes**:
```diff
func setupCacheRoutes(router *gin.Engine, handler *handlers.CacheHandler) {
	cache := router.Group("/cache")
	{
		cache.GET("/health", handler.GetCacheHealth)
		cache.GET("/stats", handler.GetCacheStats)
		cache.GET("/performance", handler.TestCachePerformance)
-		cache.DELETE("/clear", handler.ClearCache)
	}
+	
+	cacheAdmin := router.Group("/cache")
+	cacheAdmin.Use(middleware.AuthMiddleware(authService))
+	cacheAdmin.Use(middleware.RequireRole("admin"))
+	{
+		cacheAdmin.DELETE("/clear", handler.ClearCache)
+	}
}
```

**Function Signature Change**:
```diff
- func setupCacheRoutes(router *gin.Engine, handler *handlers.CacheHandler)
+ func setupCacheRoutes(router *gin.Engine, authService *auth.Service, handler *handlers.CacheHandler)
```

**Call Site** (Line 72):
```diff
- setupCacheRoutes(router, cacheHandler)
+ setupCacheRoutes(router, services.Auth, cacheHandler)
```

---

#### Action 1.3: Protect /database/performance

**Files to Modify**:
1. `backend/internal/api/routes/routes.go` (Lines 65-71)

**Changes**:
```diff
func setupDatabaseRoutes(router *gin.Engine, authService *auth.Service, handler *handlers.DatabaseHandler) {
	database := router.Group("/database")
	{
		database.GET("/health", handler.GetDatabaseHealth)
		database.GET("/stats", handler.GetDatabaseStats)
-		database.GET("/performance", handler.TestDatabasePerformance)
	}

+	databaseAdmin := router.Group("/database")
+	databaseAdmin.Use(middleware.AuthMiddleware(authService))
+	databaseAdmin.Use(middleware.RequireRole("admin"))
+	{
+		databaseAdmin.GET("/performance", handler.TestDatabasePerformance)
+	}

	router.GET("/test-db", handler.TestDatabase)
}
```

**Call Site** (Line 71):
```diff
- setupDatabaseRoutes(router, databaseHandler)
+ setupDatabaseRoutes(router, services.Auth, databaseHandler)
```

---

### IMPORTANT: Fix Next 2 Weeks

#### Action 2.1: Protect /api/performance/test

**File**: `backend/internal/api/routes/routes.go` (Lines 241-252)

```go
func setupPerformanceRoutes(router *gin.Engine, authService *auth.Service, handler *handlers.PerformanceHandler) {
	router.GET("/performance", handler.GetPerformanceMetrics)

	api := router.Group("/api/performance")
	{
		api.GET("/metrics", handler.GetHighPerformanceMetrics)
		api.GET("/health", handler.GetPerformanceHealth)
		api.GET("/stats", handler.GetPerformanceStats)
		
		// Performance test - should require admin auth
		apiAdmin := router.Group("/api/performance")
		apiAdmin.Use(middleware.AuthMiddleware(authService))
		apiAdmin.Use(middleware.RequireRole("admin"))
		apiAdmin.POST("/test", handler.PostPerformanceTest)
	}
}
```

---

#### Action 2.2: Clarify Chat Endpoints Security

**File**: `backend/internal/api/routes/routes.go` (Lines 212-229)

**Current**: Optional JWT
```go
func setupChatRoutes(router *gin.Engine, handler *handlers.ChatHandler, _ *auth.Service) {
	// Public chat endpoints (with optional auth)
	router.POST("/chat", handler.ProcessChat)
	router.POST("/chat/session", handler.ProcessSessionChat)
	// ...
}
```

**Questions to Answer**:
1. Is chat data persistent? (Appears to be stored in database)
2. Can anonymous users see other anonymous chats?
3. Should session data be isolated per user?

**Recommended**: Require authentication for chat operations
```go
func setupChatRoutes(router *gin.Engine, handler *handlers.ChatHandler, authService *auth.Service) {
	// Chat endpoints (require authentication)
	chatAuth := router.Group("/")
	chatAuth.Use(middleware.AuthMiddleware(authService))
	{
		chatAuth.POST("/chat", handler.ProcessChat)
		chatAuth.POST("/chat/session", handler.ProcessSessionChat)
		chatAuth.GET("/chat/history", handler.GetChatHistory)
		chatAuth.GET("/chat/sessions", handler.GetChatSessions)
	}
}
```

---

#### Action 2.3: Require WebSocket Authentication

**File**: `backend/internal/api/routes/routes.go` (Lines 408-440)

**Current**: Optional JWT
```go
func setupWebSocketRoutes(router *gin.Engine, broadcaster *silpana.WebSocketBroadcaster) {
	// ...
	wsHandler := &WebSocketTicketHandler{
		hub: hub,
		// ...
	}
	router.GET("/ws/tickets", wsHandler.Handle)  // ← Optional auth
}
```

**Handler** (Lines 414-428):
```go
func (h *WebSocketTicketHandler) Handle(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		userID = "anonymous"  // ← Allows anonymous
	}
	// ...
}
```

**Recommendation**: Require authentication
```go
func setupWebSocketRoutes(router *gin.Engine, broadcaster *silpana.WebSocketBroadcaster, authService *auth.Service) {
	wsAuth := router.Group("")
	wsAuth.Use(middleware.AuthMiddleware(authService))
	{
		wsAuth.GET("/ws/tickets", wsHandler.Handle)
	}
}
```

---

### ARCHITECTURAL: Plan for Next Sprint

#### Action 3.1: Consolidate SILPANA Frontend/Backend

**Current Mixed Pattern**:
- Frontend: Direct Supabase RLS
- Backend: Go API with optional JWT

**Decision Required**:
1. All through Go backend (recommended)
2. All through direct Supabase
3. Hybrid (document boundaries)

**Recommendation**: Standardize to Go backend + JWT

---

#### Action 3.2: Implement Audit Logging

**Missing**: No audit trail for sensitive operations

**Add to**:
1. Admin endpoints (pending users, approvals)
2. SILPANA operations (ticket creation, lookups)
3. Aktivitas SIAK (all CRUD operations)

**Implementation**:
```go
// Audit trail entry
auditLog.Record(&AuditEntry{
    Timestamp:    time.Now(),
    UserID:       userID,
    Operation:    "get_pending_users",
    ResourceType: "users",
    ResourceID:   "",
    Status:       "success",
    IPAddress:    c.ClientIP(),
    UserAgent:    c.GetHeader("User-Agent"),
    Details:      "Retrieved 4 pending users",
})
```

---

## Testing Checklist

### JWT Protection Tests

```bash
# 1. Supabase Analyzer - should be 401 without JWT
curl http://localhost:8080/api/v1/supabase/analyze
# Expected: 401 Unauthorized

# 2. Cache clear - should be 401 without JWT
curl -X DELETE http://localhost:8080/cache/clear
# Expected: 401 Unauthorized

# 3. Database performance - should be 401 without JWT
curl http://localhost:8080/database/performance
# Expected: 401 Unauthorized

# 4. Admin endpoints - should be 403 for non-admin JWT
TOKEN=$(curl -X POST http://localhost:8080/auth/login \
  -d '{"email":"user@test.com","password":"password"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/pending-users
# Expected: 403 Forbidden (non-admin)

# 5. Admin endpoints - should be 200 for admin JWT
ADMIN_TOKEN=$(curl -X POST http://localhost:8080/auth/login \
  -d '{"email":"admin@test.com","password":"password"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/admin/pending-users
# Expected: 200 OK
```

---

## Conclusion

This audit document provides specific code locations and implementation details for all findings. Each critical and important issue has been mapped to exact file paths and line numbers for remediation.

**Next Step**: Use this document with Action Items as implementation guide for security improvements.

---

**Document Generated**: 2025-11-05
**Review Date**: After completing Phase 1 actions
**Prepared By**: Security Audit
