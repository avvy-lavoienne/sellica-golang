# Sellica-Golang Backend — Comprehensive API Inventory

> Generated: 2026-07-17 | Branch: feat/supabase-jwt | Server: Go 1.23 / Gin on :8081

---

## 1. Architecture Overview

```
Client → Global Middleware → Route Groups → Handlers → Services → DB/Cache/AI
```

### Global Middleware Stack (applied to ALL requests)

| # | Middleware | File | Purpose |
|---|-----------|------|---------|
| 1 | `RequestIDMiddleware()` | `middleware/logging.go` | Adds `X-Request-ID` header (UUID). Sets `request_id` in gin.Context |
| 2 | `ResponseTimeMiddleware()` | `middleware/logging.go` | Adds `X-Response-Time` header |
| 3 | `SecurityHeadersMiddleware()` | `middleware/logging.go` | X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection, Referrer-Policy, CSP |
| 4 | `LoggingMiddleware()` | `middleware/logging.go` | Structured logrus logging with method, path, status, latency, client IP, user-agent |
| 5 | `DevelopmentCORSMiddleware()` | `middleware/cors.go` | AllowAllOrigins=true (dev mode). Production CORS whitelists localhost:3000, sellica.vercel.app |
| 6 | `OptionalAuthMiddleware()` | `middleware/auth.go` | Extracts JWT from `Authorization: Bearer <token>`. If valid → sets `auth_context`, `user_id`, `user_email`, `user_role` in context. If invalid/missing → continues without auth (non-blocking) |

### Auth Flow

1. **JWT Token** issued by Supabase Auth or custom auth service
2. Token validated via `authService.ValidateToken()` → returns claims
3. Token expiry checked via `authService.IsTokenExpired()`
4. `AuthContext` created with `UserID`, `Email`, `Role`
5. Context keys set: `auth_context`, `user_id`, `user_email`, `user_role`

### Auth Middleware Variants

| Middleware | Behavior |
|------------|----------|
| `OptionalAuthMiddleware` | Non-blocking. Sets auth context if valid token present, continues if not |
| `AuthMiddleware` | **Blocking**. Returns 401 if no/invalid token |
| `RequireRole("admin")` | Checks `auth_context.Role == "admin"`. Returns 403 if not |
| `RequireAnyRole(...)` | Checks if role matches any in allowed list |
| `AdminMiddleware` | Combines `AuthMiddleware` + `RequireRole("admin")` |
| `SuperAdminMiddleware` | Combines `AuthMiddleware` + `RequireRole("super_admin")` |

### Public Endpoints (bypass auth check)

```go
/health, /health/simple, /health/live, /health/ready
/metrics, /metrics/health, /metrics/summary
/test-db, /database/health, /cache/health
/auth/register, /auth/debug
```

### Error Handling Pattern

```go
// Standard error response format (pkg/errors/errors.go)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": "Optional technical details"
  }
}

// Error codes: INTERNAL_ERROR, VALIDATION_ERROR, NOT_FOUND,
// UNAUTHORIZED, FORBIDDEN, CONFLICT, DATABASE_ERROR,
// CACHE_ERROR, AUTH_ERROR, SERVICE_UNAVAILABLE
```

---

## 2. Complete API Endpoint Inventory

### ━━━ HEALTH & MONITORING (Public) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/health` | ❌ | `HealthHandler.GetHealth` | Comprehensive health check (DB, cache, system, app). Parallel goroutine checks. Returns 200/503 |
| GET | `/ready` | ❌ | `HealthHandler.GetHealthReady` | Readiness probe (same as /health/ready) |
| GET | `/health/simple` | ❌ | `HealthHandler.GetHealthSimple` | Simple "ok" for load balancers |
| GET | `/health/live` | ❌ | `HealthHandler.GetHealthLive` | Kubernetes liveness probe |
| GET | `/health/ready` | ❌ | `HealthHandler.GetHealthReady` | Kubernetes readiness probe. Checks DB ping |
| GET | `/health/indexing` | ❌ | inline | Background indexing status |
| GET | `/health/ready-with-indexing` | ❌ | inline | Readiness + indexing status |

**Health Response Schema:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "ISO8601",
  "responseTime": 123,
  "version": "go-1.0",
  "services": {
    "database": { "status": "healthy", "details": { "available": true, "poolStatus": {...} } },
    "cache": { "status": "healthy", "details": { "available": true, ... } },
    "system": { "status": "healthy", ... },
    "application": { "name": "selly-backend", "version": "1.0.0" }
  },
  "summary": { "totalServices": 4, "healthyServices": 4, "degradedServices": 0 }
}
```

### ━━━ METRICS (Public) ━━━

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/metrics` | ❌ | `MetricsHandler.GetMetrics` |
| GET | `/metrics/health` | ❌ | `MetricsHandler.GetMetricsHealth` |
| GET | `/metrics/summary` | ❌ | `MetricsHandler.GetMetricsSummary` |

### ━━━ DATABASE (Public + Admin) ━━━

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/database/health` | ❌ | `DatabaseHandler.GetDatabaseHealth` |
| GET | `/database/stats` | ❌ | `DatabaseHandler.GetDatabaseStats` |
| GET | `/database/performance` | 🔒 Admin | `DatabaseHandler.TestDatabasePerformance` |
| GET | `/test-db` | ❌ | `DatabaseHandler.TestDatabase` |

### ━━━ CACHE (Public Read + Admin Delete) ━━━

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/cache/health` | ❌ | `CacheHandler.GetCacheHealth` |
| GET | `/cache/stats` | ❌ | `CacheHandler.GetCacheStats` |
| GET | `/cache/metrics` | ❌ | `CacheHandler.GetCacheMetrics` |
| GET | `/cache/performance` | ❌ | `CacheHandler.TestCachePerformance` |
| DELETE | `/cache/clear` | 🔒 Admin | `CacheHandler.ClearCache` |

### ━━━ AUTHENTICATION ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/auth/register` | ❌ | `AuthHandler.Register` | User registration → pending_users table |
| POST | `/auth/login` | ❌ | `AuthHandler.Login` | Email/password → JWT token |
| POST | `/auth/logout` | ❌ | `AuthHandler.Logout` | Logout acknowledgment |
| GET | `/auth/debug` | ❌ | inline | Debug auth token |
| POST | `/auth/refresh` | 🔒 Auth | `AuthHandler.RefreshToken` | Refresh JWT token |
| GET | `/auth/profile` | 🔒 Auth | `AuthHandler.GetProfile` | Get user profile from JWT |

**Register Request:**
```json
{
  "email": "user@example.com",     // required, email format
  "name": "Full Name",              // required
  "password": "SecurePass1!",       // required, min 6 chars (validated: min 8, uppercase, lowercase, digit, special)
  "position": "Staff",              // optional, max 100 chars
  "nip": "123456789012345678",     // optional, exactly 18 digits
  "nik": "1234567890123456"        // optional, exactly 16 digits
}
```

**Login Request:**
```json
{ "email": "user@example.com", "password": "SecurePass1!" }
```

**Auth Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "Full Name", "role": "user" }
}
```

**Validation Rules:**
- Password: min 8 chars, must have uppercase (A-Z), lowercase (a-z), digit (0-9), special char (!@#$%^&*)
- NIK: exactly 16 digits (optional)
- NIP: exactly 18 digits (optional)
- Position: max 100 chars (optional)

### ━━━ CHAT (Public with Optional Auth) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/chat` | ⚡ Optional | `ChatHandler.ProcessChat` | Core chat processing |
| POST | `/chat/session` | ⚡ Optional | `ChatHandler.ProcessSessionChat` | Session-aware chat |
| POST | `/api/chat` | ⚡ Optional | `ChatHandler.ProcessChat` | API compat alias |
| GET | `/chat/history` | ❌* | `ChatHandler.GetChatHistory` | Chat history by sessionId |
| GET | `/chat/sessions` | 🔒 Auth | `ChatHandler.GetChatSessions` | User session management |

*⚠️ Note: `/chat/history` relies on handler-level permission, not middleware auth.

**Chat Request (`POST /chat`):**
```json
{
  "message": "What is KTP?",               // required
  "sessionId": "session-uuid",              // optional
  "userId": "user-id",                      // optional (overridden by auth context)
  "context": { "key": "value" },            // optional
  "enhancementMode": "advanced"              // optional
}
```

**Chat Response:**
```json
{
  "success": true,
  "response": "KTP adalah Kartu Tanda Penduduk...",
  "type": "text",
  "metadata": {
    "aiProvider": "groq",
    "processingTime": 1234.5,
    "sessionId": "session-uuid",
    "confidence": 0.85,
    "model": "llama-3",
    "requestId": "req-uuid",
    "isAuthenticated": true,
    "features": { ... }
  },
  "data": {
    "feature_flags": { "phase1_enabled": true, ... },
    "regional_metadata": { "region_detected": "id_jakarta", ... }
  }
}
```

**Chat History Query Params:**
- `sessionId` (required)
- `limit` (default: 50)
- `offset` (default: 0)

**Chat History Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "sessionInfo": { "type": "...", "userId": "...", ... },
    "conversationHistory": [
      { "id": "...", "query": "...", "response": "...", "timestamp": "...", "metadata": {...} }
    ],
    "pagination": { "total": 10, "limit": 50, "offset": 0, "hasMore": false },
    "analytics": { "totalQueries": 10, "averageResponseTime": 1234, ... }
  }
}
```

### ━━━ TRAINING DATA (🔒 Auth Required) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/api/training-data` | 🔒 Auth | `TrainingHandler.SubmitTrainingData` | Submit training data |
| GET | `/api/training-data` | 🔒 Auth | `TrainingHandler.GetTrainingData` | Get training data |
| POST | `/api/training-data/enhanced` | 🔒 Auth | `TrainingHandler.SubmitEnhancedData` | Submit enhanced training data |
| GET | `/api/training-data/enhanced` | 🔒 Auth | `TrainingHandler.GetEnhancedData` | Get enhanced training data |
| GET | `/api/training-data/stats` | 🔒 Auth | `TrainingHandler.GetTrainingStats` | Training statistics |
| GET | `/api/training-data/suggestions` | 🔒 Auth | `TrainingHandler.GetTrainingSuggestions` | Training suggestions |

**Training Data GET Query Params:**
- `session_id`, `service_type`, `status`, `start_date`, `end_date`
- `limit` (default: 50), `offset` (default: 0), `min_quality`

### ━━━ PERFORMANCE MONITORING ━━━

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/performance` | ❌ | `PerformanceHandler.GetPerformanceMetrics` |
| GET | `/api/performance/metrics` | ❌ | `PerformanceHandler.GetHighPerformanceMetrics` |
| GET | `/api/performance/health` | ❌ | `PerformanceHandler.GetPerformanceHealth` |
| GET | `/api/performance/stats` | ❌ | `PerformanceHandler.GetPerformanceStats` |
| POST | `/api/performance/test` | 🔒 Admin | `PerformanceHandler.PostPerformanceTest` |

### ━━━ CONCURRENT PROCESSING ━━━

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/concurrent/status` | ❌ | `ConcurrentHandler.GetStatus` |
| GET | `/api/concurrent/status` | ❌ | `ConcurrentHandler.GetStatus` |
| GET | `/api/concurrent/metrics` | ❌ | `ConcurrentHandler.GetMetrics` |
| GET | `/api/concurrent/health` | ❌ | `ConcurrentHandler.GetHealth` |
| GET | `/api/concurrent/metrics/detailed` | ❌ | `ConcurrentHandler.GetDetailedMetrics` |
| GET | `/api/concurrent/worker-pool/status` | ❌ | `ConcurrentHandler.GetWorkerPoolStatus` |
| GET | `/api/concurrent/worker-pool/metrics` | ❌ | `ConcurrentHandler.GetWorkerPoolMetrics` |
| GET | `/api/concurrent/rate-limiter/status` | ❌ | `ConcurrentHandler.GetRateLimiterStatus` |
| PUT | `/api/concurrent/rate-limiter/limit` | ❌ | `ConcurrentHandler.UpdateRateLimit` |
| GET | `/api/concurrent/circuit-breaker/status` | ❌ | `ConcurrentHandler.GetCircuitBreakerStatus` |
| POST | `/api/concurrent/circuit-breaker/reset` | ❌ | `ConcurrentHandler.ResetCircuitBreaker` |
| GET | `/api/concurrent/ai-manager/status` | ❌ | `ConcurrentHandler.GetAIManagerStatus` |
| GET | `/api/concurrent/ai-manager/metrics` | ❌ | `ConcurrentHandler.GetAIManagerMetrics` |
| POST | `/api/concurrent/ai/process-batch` | ❌ | `ConcurrentHandler.ProcessConcurrentAIRequests` |

### ━━━ DATA-REKAM (🔒 Auth Required — Protected) ━━━

All routes under `/data-rekam` require `AuthMiddleware`.

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/data-rekam/adjudicate` | 🔒 Auth | `DataRekamHandler.GetAdjudicateRecords` | List adjudicate records |
| PATCH | `/data-rekam/adjudicate/:id/toggle-status` | 🔒 Auth (Admin) | `DataRekamHandler.ToggleAdjudicateRecordStatus` | Toggle ready status |
| PATCH | `/data-rekam/adjudicate/:id/update-date` | 🔒 Auth (Admin) | `DataRekamHandler.UpdateAdjudicateRecordDate` | Update date |
| GET | `/data-rekam/duplicate-operator` | 🔒 Auth | `DataRekamHandler.GetDuplicateOperatorRecords` | List duplicate operator records |
| PATCH | `/data-rekam/duplicate-operator/:id/toggle-status` | 🔒 Auth (Admin) | `DataRekamHandler.ToggleDuplicateOperatorStatus` | Toggle ready status |
| PATCH | `/data-rekam/duplicate-operator/:id/update-date` | 🔒 Auth (Admin) | `DataRekamHandler.UpdateDuplicateOperatorDate` | Update date |
| GET | `/data-rekam/pengajuan-bulanan` | 🔒 Auth | `DataRekamHandler.GetPengajuanBulananRecords` | List pengajuan bulanan |
| PATCH | `/data-rekam/pengajuan-bulanan/:id/toggle-status` | 🔒 Auth (Admin) | `DataRekamHandler.TogglePengajuanBulananStatus` | Toggle ready status |
| PATCH | `/data-rekam/pengajuan-bulanan/:id/update-date` | 🔒 Auth (Admin) | `DataRekamHandler.UpdatePengajuanBulananDate` | Update date |
| GET | `/data-rekam/salah-rekam` | 🔒 Auth | `DataRekamHandler.GetSalahRekamRecords` | List salah rekam records |
| PATCH | `/data-rekam/salah-rekam/:id/toggle-status` | 🔒 Auth (Admin) | `DataRekamHandler.ToggleSalahRekamStatus` | Toggle ready status |
| PATCH | `/data-rekam/salah-rekam/:id/update-date` | 🔒 Auth (Admin) | `DataRekamHandler.UpdateSalahRekamDate` | Update date |
| GET | `/data-rekam/dashboard-stats` | 🔒 Auth | `DataRekamHandler.GetDashboardStats` | Aggregated dashboard stats |

**Data-Rekam List Query Params (all list endpoints):**
- `page` (default: 1), `page_size` (default: 10, max: 100)
- `status` (all|completed|pending), `search`
- `start_date`, `end_date`

**Update Request Body (PATCH toggle-status):**
```json
{
  "id": "record-uuid",
  "is_ready_to_record": true,
  "estimasi_tanggal_perekaman": "2026-07-20"
}
```

**Data-Rekam Response:**
```json
{
  "success": true,
  "data": [...],
  "total_count": 100,
  "page": 1,
  "page_size": 10
}
```

### ━━━ ADMIN (🔒 Auth + Admin Role Required) ━━━

All routes under `/admin` require `AuthMiddleware` + `RequireRole("admin")`.

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/admin/pending-users` | 🔒 Admin | `AdminHandler.GetPendingUsers` | List pending user registrations |
| POST | `/admin/approve-user` | 🔒 Admin | `AdminHandler.ApproveUser` | Approve user → creates profile |
| POST | `/admin/reject-user` | 🔒 Admin | `AdminHandler.RejectPendingUser` | Reject user with reason |

**Approve User Request:**
```json
{ "pending_user_id": "uuid" }
```

**Reject User Request:**
```json
{ "pending_user_id": "uuid", "rejection_reason": "Invalid NIP" }
```

**Pending User Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Full Name",
      "position": "Staff",
      "nip": "123456789012345678",
      "nik": "1234567890123456",
      "status": "pending",
      "requested_at": "2026-07-17T10:00:00Z"
    }
  ]
}
```

### ━━━ SILPANA TICKETING (⚡ Optional Auth — Public with Session Mgmt) ━━━

Routes under `/api/v1/silpana` use session-aware middleware.

**Session Middleware Layers:**
1. `OptionalSession()` — Works for both auth and anonymous users
2. `ValidateSession()` — Requires valid session (blocking)
3. `EnrichSessionWithTicket("id")` — Adds ticket context to session
4. `RecordAudit(action)` — Audit logging

| Method | Path | Auth | Middleware | Handler | Description |
|--------|------|------|-----------|---------|-------------|
| POST | `/api/v1/silpana/tickets` | ⚡ Optional | `OptionalSession + Audit` | `SilpanaHandler.CreateTicket` | Create new ticket |
| GET | `/api/v1/silpana/tickets` | ⚡ Optional | `OptionalSession + Audit` | `SilpanaHandler.GetAllTickets` | List tickets (paginated) |
| POST | `/api/v1/silpana/tickets/lookup` | ⚡ Optional | `OptionalSession + Audit` | `SilpanaHandler.LookupTicket` | Lookup by code + NIK/phone |
| GET | `/api/v1/silpana/tickets/:id` | 🔒 Auth | `ValidateSession + Enrich + Audit` | `SilpanaHandler.GetTicket` | Get ticket by ID |
| GET | `/api/v1/silpana/tickets/:id/history` | 🔒 Auth | `ValidateSession + Enrich + Audit` | `SilpanaHandler.GetTicketHistory` | Get ticket history |
| PUT | `/api/v1/silpana/tickets/:id/status` | 🔒 Auth | `ValidateSession + Enrich + Audit` | `SilpanaHandler.UpdateTicketStatus` | Update status |
| GET | `/api/v1/silpana/tickets/status/:status` | 🔒 Auth | `ValidateSession + Audit` | `SilpanaHandler.GetTicketsByStatus` | Filter by status |
| POST | `/api/v1/silpana/tickets/bulk-approve` | 🔒 Auth | `ValidateSession + Audit` | `SilpanaHandler.BulkApproveTickets` | Bulk approve |
| POST | `/api/v1/silpana/tickets/bulk-reject` | 🔒 Auth | `ValidateSession + Audit` | `SilpanaHandler.BulkRejectTickets` | Bulk reject |
| DELETE | `/api/v1/silpana/tickets/bulk-delete` | 🔒 Auth | `ValidateSession + Audit` | `SilpanaHandler.BulkDeleteTickets` | Bulk delete |
| GET | `/api/v1/silpana/progress/:code` | ⚡ Optional | `OptionalSession + Audit` | `SilpanaHandler.GetTicketProgress` | Get progress by code |
| POST | `/api/v1/silpana/tickets/:id/communications` | 🔒 Auth | `ValidateSession + Enrich + Audit` | `SilpanaHandler.AddCommunication` | Add message |
| GET | `/api/v1/silpana/tickets/:id/communications` | ⚡ Optional | `OptionalSession + Enrich + Audit` | `SilpanaHandler.GetCommunications` | Get messages |
| GET | `/api/v1/silpana/stats` | 🔒 Auth | `ValidateSession + Audit` | `SilpanaHandler.GetTicketStats` | Statistics |
| GET | `/api/v1/silpana/health` | ⚡ Optional | `OptionalSession` | `SilpanaHandler.HealthCheck` | Health check |

**Create Ticket Request:**
```json
{
  "requester_name": "John Doe",           // required
  "requester_nik": "1234567890123456",     // required (16 digits)
  "requester_phone": "08123456789",        // required
  "requester_email": "john@example.com",   // optional (email)
  "requester_address": "Jl. Sudirman 1",   // required
  "document_type": "KTP",                   // required
  "purpose": "Perubahan data",             // required
  "priority": "medium",                    // optional (low|medium|high|urgent)
  "notes": "Additional notes",            // optional
  "metadata": {}                           // optional
}
```

**Ticket Lookup Request:**
```json
{
  "code": "TICKET-001",                     // required
  "requester_nik": "1234567890123456",      // at least one of NIK/phone required
  "requester_phone": "08123456789"
}
```

**Update Status Request:**
```json
{
  "status": "in_progress",      // required (pending|in_progress|completed|cancelled|on_hold)
  "notes": "Processing started", // optional
  "changed_by": "admin-001"     // optional (defaults to "system")
}
```

**Add Communication Request:**
```json
{
  "message": "Your document is being processed",  // required
  "sender_type": "admin",                          // required (admin|submitter)
  "sender_name": "Admin Sella",                    // required
  "attachments": ["file.pdf"],                     // optional
  "is_internal": false                             // optional
}
```

**Ticket Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "code": "TICKET-001",
    "requester_name": "John Doe",
    "requester_nik": "1234567890123456",
    "status": "pending",
    "priority": "medium",
    "created_at": "2026-07-17T10:00:00Z",
    ...
  },
  "history": [ { "old_status": "...", "new_status": "...", "changed_at": "..." } ],
  "message": "optional message"
}
```

**Ticket Stats Response:**
```json
{
  "total_tickets": 150,
  "status_counts": { "pending": 30, "in_progress": 50, "completed": 70 },
  "priority_counts": { "low": 20, "medium": 80, "high": 40, "urgent": 10 },
  "average_wait_time_hours": 4.5,
  "completion_rate": 0.85
}
```

**Get All Tickets Query Params:**
- `page` (default: 1), `page_size` (default: 20)

**Get Tickets By Status Query Params:**
- `limit` (default: 10), `offset` (default: 0)

### ━━━ WEBSOCKET ━━━

| Protocol | Path | Auth | Description |
|----------|------|------|-------------|
| WSS | `/ws/tickets` | 🔒 Auth | Real-time ticket updates. Requires JWT. Sends events: ticket_created, status_update, comment_added |

### ━━━ PROFILE (🔒 Auth Required) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/profile` | 🔒 Auth | `ProfileRoutes.getProfile` | Get user profile |
| PATCH | `/api/v1/profile` | 🔒 Auth | `ProfileRoutes.updateProfile` | Update profile |
| POST | `/api/v1/profile/avatar` | 🔒 Auth | `ProfileRoutes.uploadAvatar` | Upload avatar (multipart) |
| DELETE | `/api/v1/profile/avatar` | 🔒 Auth | `ProfileRoutes.deleteAvatar` | Delete avatar |
| GET | `/api/v1/profile/avatar` | 🔒 Auth | `ProfileRoutes.getAvatarURL` | Get avatar URL |

**Update Profile Request:**
```json
{
  "name": "Updated Name",
  "position": "New Position"
}
```

**Upload Avatar:** `multipart/form-data` with `avatar` field. Max 2MB, JPG/PNG.

### ━━━ SALAH REKAM (🔒 Auth Required) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/salah-rekam` | 🔒 Auth | `SalahRekamHandler.ListRecords` | List records |
| GET | `/api/v1/salah-rekam/search` | 🔒 Auth | `SalahRekamHandler.SearchRecords` | Search records |
| GET | `/api/v1/salah-rekam/:id` | 🔒 Auth | `SalahRekamHandler.GetRecord` | Get record by ID |
| POST | `/api/v1/salah-rekam` | 🔒 Auth | `SalahRekamHandler.CreateRecord` | Create record |
| PUT | `/api/v1/salah-rekam/:id` | 🔒 Auth | `SalahRekamHandler.UpdateRecord` | Update record |
| DELETE | `/api/v1/salah-rekam/:id` | 🔒 Auth | `SalahRekamHandler.DeleteRecord` | Delete record |

**Salah Rekam List Query Params:**
- `page` (default: 1), `page_size` (default: 10, max: 100)
- `search`, `status` (all|completed|pending), `date_from`, `date_to`

**Create Salah Rekam Request:**
```json
{
  "nik_salah_rekam": "1234567890123456",           // required, 16 digits
  "nama_salah_rekam": "John Doe",                   // required, max 255
  "nik_pemilik_biometric": "1234567890123456",      // required, 16 digits
  "nama_pemilik_biometric": "Jane Doe",             // required
  "nik_pemilik_foto": "1234567890123456",           // required, 16 digits
  "nama_pemilik_foto": "Bob Smith",                 // required
  "nik_petugas_rekam": "1234567890123456",          // required, 16 digits
  "nama_petugas_rekam": "Officer Name",             // required
  "tanggal_perekaman": "2026-07-17",                // required
  "estimasi_tanggal_perekaman": "2026-07-20",       // optional
  "nik_pengaju": "1234567890123456",                // required, 16 digits
  "nama_pengaju": "Applicant Name",                 // required
  "is_ready_to_record": false                        // optional
}
```

**Salah Rekam Response:**
```json
{
  "status": "success",
  "code": 200,
  "message": "data berhasil diambil",
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 100,
    "total_pages": 10,
    "has_next": true,
    "has_previous": false
  }
}
```

### ━━━ DUPLICATE OPERATOR (🔒 Auth Required) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/duplicate-operators` | 🔒 Auth | `DuplicateOperatorHandler.ListRecords` | List records |
| GET | `/api/v1/duplicate-operators/search` | 🔒 Auth | `DuplicateOperatorHandler.SearchRecords` | Search records |
| GET | `/api/v1/duplicate-operators/:id` | 🔒 Auth | `DuplicateOperatorHandler.GetRecord` | Get record by ID |
| POST | `/api/v1/duplicate-operators` | 🔒 Auth | `DuplicateOperatorHandler.CreateRecord` | Create record |
| PUT | `/api/v1/duplicate-operators/:id` | 🔒 Auth (Admin) | `DuplicateOperatorHandler.UpdateRecord` | Update record (admin only) |
| DELETE | `/api/v1/duplicate-operators/:id` | 🔒 Auth (Admin) | `DuplicateOperatorHandler.DeleteRecord` | Delete record (admin only) |

**Duplicate Operator List Query Params:**
- `page` (default: 1), `page_size` (default: 10, max: 100)
- `search`, `status` (all|ready|not_ready), `date_from`, `date_to`

### ━━━ AKTIVITAS SIAK (🔒 Auth Required) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/aktivitas-siak/health` | 🔒 Auth | `AktivitasSiakHandler.Health` | Health check |
| POST | `/api/v1/aktivitas-siak` | 🔒 Auth | `AktivitasSiakHandler.CreateRecord` | Create record |
| GET | `/api/v1/aktivitas-siak` | 🔒 Auth | `AktivitasSiakHandler.ListRecords` | List records (paginated) |
| GET | `/api/v1/aktivitas-siak/:id` | 🔒 Auth | `AktivitasSiakHandler.GetRecord` | Get record by ID |
| PUT | `/api/v1/aktivitas-siak/:id` | 🔒 Auth | `AktivitasSiakHandler.UpdateRecord` | Update record |
| DELETE | `/api/v1/aktivitas-siak/:id` | 🔒 Auth | `AktivitasSiakHandler.DeleteRecord` | Delete record |
| POST | `/api/v1/aktivitas-siak/check-duplicate` | 🔒 Auth | `AktivitasSiakHandler.CheckDuplicate` | Check for duplicates |
| GET | `/api/v1/aktivitas-siak/statistics` | 🔒 Auth | `AktivitasSiakHandler.GetStatistics` | Get statistics |

### ━━━ SUPABASE ANALYZER (🔒 Admin Only) ━━━

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/api/v1/supabase/analyze` | 🔒 Admin | `SupabaseAnalyzerHandler.AnalyzeProject` | Full analysis |
| GET | `/api/v1/supabase/overview` | 🔒 Admin | `SupabaseAnalyzerHandler.GetProjectOverview` | Quick overview |
| GET | `/api/v1/supabase/tables/:name` | 🔒 Admin | `SupabaseAnalyzerHandler.GetTableStats` | Table statistics |
| GET | `/api/v1/supabase/buckets` | 🔒 Admin | `SupabaseAnalyzerHandler.ListBuckets` | List storage buckets |

**Analyze Query Params:**
- `tables` (default: true), `buckets` (default: true), `columns` (default: true)

---

## 3. Summary Statistics

| Category | Endpoints | Auth Level |
|----------|-----------|------------|
| Health & Monitoring | 9 | Public |
| Metrics | 3 | Public |
| Database | 4 | Public + Admin |
| Cache | 5 | Public + Admin |
| Authentication | 6 | Public + Auth |
| Chat | 5 | Optional Auth |
| Training Data | 6 | Auth Required |
| Performance | 5 | Public + Admin |
| Concurrent | 14 | Public |
| Data-Rekam | 13 | Auth + Admin |
| Admin | 3 | Admin |
| SILPANA | 15 | Optional + Auth |
| WebSocket | 1 | Auth |
| Profile | 5 | Auth |
| Salah Rekam | 6 | Auth |
| Duplicate Operator | 6 | Auth |
| Aktivitas SIAK | 8 | Auth |
| Supabase Analyzer | 4 | Admin |
| **TOTAL** | **~114** | |

---

## 4. Key Observations

### Security Architecture
- **Three-tier auth model**: Public → Optional Auth → Required Auth → Admin
- JWT validation uses Supabase JWT tokens via `authService.ValidateToken()`
- `OptionalAuthMiddleware` runs globally on ALL routes (sets context if token valid)
- `AuthMiddleware` runs on protected routes (blocks if no/invalid token)
- `RequireRole("admin")` chains after auth middleware for admin endpoints
- WebSocket connections require authentication

### Response Format Inconsistencies
- **Auth handlers** use `AuthResponse{ success, token, user, error, message }`
- **Admin/Data-Rekam handlers** use `DataRekamResponse{ success, data, total_count, page, page_size }`
- **Salah Rekam/Duplicate Operator** use `{ status, code, message, data, pagination }`
- **SILPANA handlers** return service-layer types directly
- **Chat handler** uses `ChatResponse{ success, response, type, metadata, data }`
- **Profile handler** uses `ErrorResponse{ error, message }` format

### Potential Issues Found
1. `/chat/history` does NOT use auth middleware — relies on handler-level checks only
2. Global `OptionalAuthMiddleware` applies to ALL routes including health checks
3. Concurrent processing endpoints have NO authentication (security risk for production)
4. Rate limiting middleware exists but only adds headers, no actual enforcement
5. `DevelopmentCORSMiddleware` allows all origins — needs production toggle
6. Some DELETE endpoints use `DELETE /tickets/bulk-delete` (body in DELETE — some clients may not support)
7. Profile routes registered separately via `RegisterRoutes()` — not wired in `SetupRoutes()` directly
8. Duplicate operator handler has debug `fmt.Printf` statements in production code

---

*This inventory covers all routes defined in `internal/api/routes/` files and all handlers in `internal/api/handlers/`. Routes not yet registered (e.g., some profile routes) may be registered elsewhere or in main.go initialization.*
