# Sellica Golang Backend — Blackbox Testing Audit Report

**Date:** 2026-07-06
**Auditor:** Hermes Agent (Automated Static Analysis)
**Scope:** API Surface, Security, Input Validation, Error Handling
**Project:** Sellica — Chatbot Layanan Administrasi Disdukcapil
**Backend:** Go 1.23, Gin v1.x, Supabase (PostgreSQL), Redis (Upstash)
**Module:** `selly-backend`

> **Purpose:** This report documents the complete API surface and security posture
> of the Sellica backend for blackbox testing preparation (skripsi/thesis).
> Code was read statically — no runtime testing was performed.

---

## Table of Contents

1. [Complete API Endpoint Map](#1-complete-api-endpoint-map)
2. [Authentication & Authorization Analysis](#2-authentication--authorization-analysis)
3. [CORS Configuration](#3-cors-configuration)
4. [Security Headers & Middleware Chain](#4-security-headers--middleware-chain)
5. [Input Validation Analysis](#5-input-validation-analysis)
6. [Rate Limiting Analysis](#6-rate-limiting-analysis)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Security Findings](#8-security-findings)
9. [WebSocket Security](#9-websocket-security)
10. [Recommended Blackbox Test Cases](#10-recommended-blackbox-test-cases)
11. [Risk Assessment Summary](#11-risk-assessment-summary)

---

## 1. Complete API Endpoint Map

### 1.1 Health & Monitoring (Public)

| # | Method | Path | Auth | Request | Response |
|---|--------|------|------|---------|----------|
| 1 | GET | `/health` | None | — | `{status, timestamp, responseTime, version, services, summary}` |
| 2 | GET | `/ready` | None | — | `{status: {ready: bool}, issues: [], timestamp}` |
| 3 | GET | `/health/simple` | None | — | `{status, timestamp, service}` |
| 4 | GET | `/health/live` | None | — | `{status: "alive", timestamp}` |
| 5 | GET | `/health/ready` | None | — | `{status: {ready: bool}, issues, timestamp}` |
| 6 | GET | `/metrics` | None | — | Monitoring metrics (Prometheus-compatible) |
| 7 | GET | `/metrics/health` | None | — | Metrics service health |
| 8 | GET | `/metrics/summary` | None | — | Key metrics summary |

### 1.2 Database & Cache (Public)

| # | Method | Path | Auth | Request | Response |
|---|--------|------|------|---------|----------|
| 9 | GET | `/database/health` | None | — | Database health status |
| 10 | GET | `/database/stats` | None | — | Database statistics |
| 11 | GET | `/database/performance` | None | — | Database performance metrics |
| 12 | GET | `/test-db` | None | — | Database connectivity test |
| 13 | GET | `/cache/health` | None | — | Cache health status |
| 14 | GET | `/cache/stats` | None | — | Cache statistics |
| 15 | GET | `/cache/performance` | None | — | Cache performance metrics |
| 16 | **DELETE** | `/cache/clear` | **None** | — | Cache clear result |

### 1.3 Authentication (Mixed)

| # | Method | Path | Auth | Request Body | Response |
|---|--------|------|------|-------------|----------|
| 17 | POST | `/auth/register` | None | `{email, name, password, position?, nip?, nik?}` | `{success, message}` |
| 18 | POST | `/auth/login` | None | `{email, password}` | `{success, token, user: {id, email, name, role}}` |
| 19 | POST | `/auth/logout` | None | — | `{success, message}` |
| 20 | GET | `/auth/debug` | **None** | — | Debug info (token introspection) |
| 21 | POST | `/auth/refresh` | **JWT** | — | `{success, token}` |
| 22 | GET | `/auth/profile` | **JWT** | — | `{success, user: {id, email, name, role, nip, position, avatar_url}}` |

### 1.4 Chat (Mixed)

| # | Method | Path | Auth | Request Body | Response |
|---|--------|------|------|-------------|----------|
| 23 | POST | `/chat` | Optional | `{message, session_id?, service_type?}` | `{response, metadata, data}` |
| 24 | POST | `/chat/session` | Optional | `{message, session_id, ...}` | Session-aware chat response |
| 25 | POST | `/api/chat` | Optional | `{message, ...}` | Same as `/chat` (alias) |
| 26 | GET | `/chat/history` | **None** | `?sessionId=&limit=&offset=` | `{success, data: {conversationHistory, pagination}}` |
| 27 | GET | `/chat/sessions` | **JWT** | — | `{success, data: {sessions, total}}` |

### 1.5 Training Data (JWT Protected)

| # | Method | Path | Auth | Request Body/Params | Response |
|---|--------|------|------|---------------------|----------|
| 28 | POST | `/api/training-data` | **JWT** | Training data JSON | `{success, message, data}` |
| 29 | GET | `/api/training-data` | **JWT** | `?session_id=&service_type=&status=&start_date=&end_date=&limit=&offset=&min_quality=` | `{success, data, pagination}` |
| 30 | POST | `/api/training-data/enhanced` | **JWT** | Enhanced training data JSON | `{success, message, data}` |
| 31 | GET | `/api/training-data/enhanced` | **JWT** | Similar to #29 | `{success, data, pagination}` |
| 32 | GET | `/api/training-data/stats` | **JWT** | — | `{success, data, service_performance}` |
| 33 | GET | `/api/training-data/suggestions` | **JWT** | — | `{success, data, meta}` |

### 1.6 Performance (Public)

| # | Method | Path | Auth | Request Body | Response |
|---|--------|------|------|-------------|----------|
| 34 | GET | `/performance` | None | — | Performance metrics with grade |
| 35 | GET | `/api/performance/metrics` | None | — | High-performance AI metrics |
| 36 | GET | `/api/performance/health` | None | — | Performance health status |
| 37 | GET | `/api/performance/stats` | None | — | Performance statistics |
| 38 | POST | `/api/performance/test` | None | `{test_type, query_count?, concurrent?, test_query?, user_id?, session_id?}` | Performance test results |

### 1.7 Concurrent Processing (Public)

| # | Method | Path | Auth | Request Body | Response |
|---|--------|------|------|-------------|----------|
| 39 | GET | `/concurrent/status` | None | — | Concurrent service status |
| 40 | GET | `/api/concurrent/status` | None | — | Same (alias) |
| 41 | GET | `/api/concurrent/metrics` | None | — | Concurrent metrics |
| 42 | GET | `/api/concurrent/health` | None | — | Concurrent health |
| 43 | GET | `/api/concurrent/metrics/detailed` | None | `?component=&format=` | Detailed component metrics |
| 44 | GET | `/api/concurrent/worker-pool/status` | None | — | Worker pool status |
| 45 | GET | `/api/concurrent/worker-pool/metrics` | None | — | Worker pool metrics |
| 46 | GET | `/api/concurrent/rate-limiter/status` | None | — | Rate limiter status |
| 47 | **PUT** | `/api/concurrent/rate-limiter/limit` | **None** | `{requestsPerSecond, burstCapacity?}` | Updated rate limit |
| 48 | GET | `/api/concurrent/circuit-breaker/status` | None | — | Circuit breaker status |
| 49 | POST | `/api/concurrent/circuit-breaker/reset` | **None** | — | Reset confirmation |
| 50 | GET | `/api/concurrent/ai-manager/status` | None | — | AI manager status |
| 51 | GET | `/api/concurrent/ai-manager/metrics` | None | — | AI manager metrics |
| 52 | POST | `/api/concurrent/ai/process-batch` | **None** | `{requests: [{prompt, ...}], timeout?}` | Concurrent AI responses |

### 1.8 Data Rekam (JWT Protected)

| # | Method | Path | Auth | Request Params | Response |
|---|--------|------|------|---------------|----------|
| 53 | GET | `/data-rekam/adjudicate` | **JWT** | `?page=&page_size=&status=&search=&start_date=&end_date=` | `{success, data, total_count, page, page_size}` |
| 54 | GET | `/data-rekam/duplicate-operator` | **JWT** | Same pagination params | Same structure |
| 55 | GET | `/data-rekam/pengajuan-bulanan` | **JWT** | Same pagination params | Same structure |
| 56 | GET | `/data-rekam/salah-rekam` | **JWT** | Same pagination params | Same structure |
| 57 | GET | `/data-rekam/dashboard-stats` | **JWT** | `?start_date=&end_date=` | `{success, data}` |

### 1.9 Admin (JWT Protected)

| # | Method | Path | Auth | Request | Response |
|---|--------|------|------|---------|----------|
| 58 | GET | `/admin/pending-users` | **JWT** | — | `{success, data: [{id, email, name, ...}], message}` |

> **⚠️ Note:** The `/admin` group at `setupAdminRoutes` applies `AuthMiddleware` only.
> Role check (`admin`/`superuser`) is performed inside the handler, NOT at middleware level.
> The separately defined `admin` group at routes.go:133-139 has `RequireRole("admin")` but
> **no routes are registered** under it.

### 1.10 SILPANA Ticketing (Session Management — Mixed Auth)

| # | Method | Path | Auth | Request Body/Params | Response |
|---|--------|------|------|---------------------|----------|
| 59 | POST | `/api/v1/silpana/tickets` | Optional Session | Ticket creation JSON | Ticket object |
| 60 | GET | `/api/v1/silpana/tickets` | Optional Session | Pagination params | Ticket list |
| 61 | POST | `/api/v1/silpana/tickets/lookup` | Optional Session | `{ticket_code}` | Ticket lookup result |
| 62 | GET | `/api/v1/silpana/tickets/:id` | **Session Required** | — | Ticket detail |
| 63 | GET | `/api/v1/silpana/tickets/:id/history` | **Session Required** | — | Ticket history |
| 64 | **PUT** | `/api/v1/silpana/tickets/:id/status` | **Session Required** | Status update JSON | Updated ticket |
| 65 | GET | `/api/v1/silpana/tickets/status/:status` | **Session Required** | — | Filtered tickets |
| 66 | POST | `/api/v1/silpana/tickets/bulk-approve` | **Session Required** | Bulk IDs | Bulk result |
| 67 | POST | `/api/v1/silpana/tickets/bulk-reject` | **Session Required** | Bulk IDs | Bulk result |
| 68 | DELETE | `/api/v1/silpana/tickets/bulk-delete` | **Session Required** | Bulk IDs | Bulk result |
| 69 | GET | `/api/v1/silpana/progress/:code` | Optional Session | — | Ticket progress |
| 70 | POST | `/api/v1/silpana/tickets/:id/communications` | **Session Required** | Communication JSON | New message |
| 71 | GET | `/api/v1/silpana/tickets/:id/communications` | Optional Session | — | Message list |
| 72 | GET | `/api/v1/silpana/stats` | **Session Required** | — | Ticket statistics |
| 73 | GET | `/api/v1/silpana/health` | Optional Session | — | SILPANA health |

### 1.11 Aktivitas SIAK (JWT Protected)

| # | Method | Path | Auth | Request Body/Params | Response |
|---|--------|------|------|---------------------|----------|
| 74 | GET | `/api/v1/aktivitas-siak/health` | **JWT** | — | Health status |
| 75 | POST | `/api/v1/aktivitas-siak` | **JWT** | Record JSON | Created record |
| 76 | GET | `/api/v1/aktivitas-siak` | **JWT** | Pagination/filter | Record list |
| 77 | GET | `/api/v1/aktivitas-siak/:id` | **JWT** | — | Single record |
| 78 | PUT | `/api/v1/aktivitas-siak/:id` | **JWT** | Update JSON | Updated record |
| 79 | DELETE | `/api/v1/aktivitas-siak/:id` | **JWT** | — | Deletion confirmation |
| 80 | POST | `/api/v1/aktivitas-siak/check-duplicate` | **JWT** | Duplicate check JSON | Duplicate result |
| 81 | GET | `/api/v1/aktivitas-siak/statistics` | **JWT** | — | Statistics |

### 1.12 Supabase Analyzer (Public)

| # | Method | Path | Auth | Request Params | Response |
|---|--------|------|------|---------------|----------|
| 82 | GET | `/api/v1/supabase/analyze` | **None** | `?tables=&buckets=&columns=` | Full project analysis |
| 83 | GET | `/api/v1/supabase/overview` | **None** | — | Project overview |
| 84 | GET | `/api/v1/supabase/tables/:name` | **None** | — | Table statistics |
| 85 | GET | `/api/v1/supabase/buckets` | **None** | — | Storage buckets list |

### 1.13 WebSocket (Public)

| # | Method | Path | Auth | Notes |
|---|--------|------|------|-------|
| 86 | GET/WS | `/ws/tickets` | **None** | WebSocket upgrade; allows anonymous connections |

### 1.14 Summary: Registered but NOT routed

| Handler | Registered? | Notes |
|---------|------------|-------|
| `DuplicateOperatorHandler` (ListRecords, GetRecord, CreateRecord, UpdateRecord, DeleteRecord, SearchRecords) | **NO** | Handler exists but no routes registered in any route file |

**Total unique endpoints: ~86** (including aliases)

---

## 2. Authentication & Authorization Analysis

### 2.1 Middleware Architecture

```
Request → RequestIDMiddleware → ResponseTimeMiddleware → SecurityHeadersMiddleware
       → LoggingMiddleware → DevelopmentCORSMiddleware → OptionalAuthMiddleware
       → [Route-specific middleware] → Handler
```

- **OptionalAuthMiddleware** is applied globally — it attempts JWT validation but does NOT block unauthenticated requests. It silently passes through.
- **AuthMiddleware** is applied per-route-group for protected endpoints.
- **Session middleware** (SILPANA-specific) provides session validation for ticketing operations.

### 2.2 Public vs Protected Endpoints

| Category | Count | Auth Requirement |
|----------|-------|-----------------|
| Health/Monitoring | 8 | Public |
| Database/Cache | 8 | Public (⚠️ includes DELETE /cache/clear) |
| Authentication | 4 public, 2 protected | Mixed |
| Chat | 3 public (optional auth), 1 protected | Mixed |
| Training | 6 | JWT Required |
| Performance | 5 | Public |
| Concurrent | 14 | **Public** (⚠️ includes write operations) |
| Data Rekam | 5 | JWT Required |
| Admin | 1 | JWT + handler-level role check |
| SILPANA | 15 | Mixed (Optional/Session Required) |
| Aktivitas SIAK | 8 | JWT Required |
| Supabase Analyzer | 4 | **Public** (⚠️ exposes DB schema) |
| WebSocket | 1 | **Public** |

### 2.3 Auth Token Format

- **Type:** JWT (Bearer token)
- **Header:** `Authorization: Bearer <token>`
- **Secret Source:** `SUPABASE_JWT_SECRET` environment variable
- **Expiry:** Configurable via `TOKEN_EXPIRY_HOURS` (default: 24h)
- **Refresh:** Via `POST /auth/refresh` (requires valid JWT)

### 2.4 Public Endpoint Whitelist (in middleware/auth.go)

The `isPublicEndpoint()` function explicitly allows these paths:
```
/health, /health/simple, /health/live, /health/ready
/metrics, /metrics/health, /metrics/summary
/test-db, /database/health, /cache/health
/auth/register, /auth/debug
```

> **⚠️ Finding:** `/auth/debug` is explicitly whitelisted as public, exposing internal auth debug information.

---

## 3. CORS Configuration

### 3.1 Current Configuration (CRITICAL)

```go
// ACTIVE in production via routes.go line 63:
router.Use(middleware.DevelopmentCORSMiddleware())
```

**DevelopmentCORSMiddleware:**
```go
AllowAllOrigins:  true          // ← ACCEPTS ANY ORIGIN
AllowMethods:     GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
AllowHeaders:     ["*"]         // ← ACCEPTS ANY HEADER
ExposeHeaders:    ["*"]         // ← EXPOSES ALL HEADERS
AllowCredentials: true          // ← SENDS COOKIES TO ANY ORIGIN
MaxAge:           12 hours
```

**Severity: CRITICAL** — This configuration allows any website to make authenticated requests to the API. Combined with `AllowCredentials: true`, this enables cross-site request forgery (CSRF) attacks.

### 3.2 Production CORS (Defined but NOT used)

A stricter `CORSMiddleware()` exists in `middleware/cors.go` that limits origins to:
- `http://localhost:3000`
- `http://localhost:5678`
- `https://sellica.vercel.app`
- `https://*.vercel.app`

This is **not active** — the development middleware is used instead.

---

## 4. Security Headers & Middleware Chain

### 4.1 Security Headers (Present ✅)

Applied globally via `SecurityHeadersMiddleware`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer leakage |
| `Content-Security-Policy` | `default-src 'self'` | Restricts resource loading |

### 4.2 Missing Security Headers

| Header | Status | Recommendation |
|--------|--------|----------------|
| `Strict-Transport-Security` | **Missing** | Add HSTS for HTTPS enforcement |
| `Permissions-Policy` | **Missing** | Restrict browser features |
| `X-Request-ID` | Present (via middleware) | ✅ |
| `X-Response-Time` | Present (via middleware) | ✅ |

### 4.3 Server Configuration

```go
ReadTimeout:  30s (configurable)
WriteTimeout: 30s (configurable)
IdleTimeout:  120s (configurable)
```

---

## 5. Input Validation Analysis

### 5.1 Registration (`POST /auth/register`) — GOOD

| Field | Validation | Quality |
|-------|-----------|---------|
| `email` | `binding:"required,email"` | ✅ |
| `name` | `binding:"required"` | ⚠️ No length limit |
| `password` | `binding:"required,min=6"` + custom validation (8+ chars, uppercase, lowercase, digit, special) | ✅ Strong |
| `nik` | Optional; 16 digits, numeric only | ✅ |
| `nip` | Optional; 18 digits, numeric only | ✅ |
| `position` | Optional; max 100 chars | ✅ |

### 5.2 Login (`POST /auth/login`) — ADEQUATE

| Field | Validation |
|-------|-----------|
| `email` | `binding:"required,email"` |
| `password` | `binding:"required"` (no strength check at login — correct) |

### 5.3 Chat (`POST /chat`) — WEAK

| Field | Validation | Gap |
|-------|-----------|-----|
| `message` | Checked for empty string | **No max length limit** |
| `session_id` | Not validated | **No format validation** |
| `service_type` | Not validated at handler level | Relies on downstream validation |

### 5.4 Training Data (`POST /api/training-data`) — MINIMAL

- Uses `ShouldBindJSON` for structure validation only
- No visible content/size limits at handler level
- User ID extracted from JWT context (correct)

### 5.5 Data Rekam Handlers — ADEQUATE

| Parameter | Validation |
|-----------|-----------|
| `page` | Parsed as int, must be > 0 |
| `page_size` | Parsed as int, must be > 0 and ≤ 100 |
| `search` | **No sanitization** (passed directly to service) |
| `start_date`, `end_date` | **No format validation** (passed as raw strings) |

### 5.6 Duplicate Operator Handler — GOOD

| Validation | Quality |
|-----------|---------|
| ID parameter: length ≤ 255, alphanumeric + hyphens + underscores only | ✅ Injection prevention |
| Create/Update requests: validated via `ValidateCreateRequest`/`ValidateUpdateRequest` | ✅ |
| Admin role check for Update/Delete | ✅ (handler-level) |

### 5.7 Concurrent AI Batch (`POST /api/concurrent/ai/process-batch`) — MODERATE

| Field | Validation |
|-------|-----------|
| `requests` | `binding:"required,min=1,max=50"` — limits batch size |
| `timeout` | Optional; used as context timeout in seconds |

### 5.8 Supabase Analyzer — NO VALIDATION

| Field | Validation |
|-------|-----------|
| `:name` (table name) | Checked for empty, **no character validation** |
| Query params | No sanitization |

---

## 6. Rate Limiting Analysis

### 6.1 Current State: **NO EFFECTIVE RATE LIMITING**

**`AuthRateLimitMiddleware` (middleware/auth.go:291-304):**
```go
func AuthRateLimitMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Only adds headers — does NOT block any requests
        if strings.HasPrefix(c.Request.URL.Path, "/auth/") {
            c.Header("X-RateLimit-Limit", "10")
            c.Header("X-RateLimit-Remaining", "9") // Always "9" — fake
            c.Header("X-RateLimit-Reset", "60")
        }
        c.Next()
    }
}
```

> **⚠️ CRITICAL:** The auth rate limit middleware is **cosmetic only** — it sets response headers but does NOT track or limit requests. Every request passes through.

**Note:** This middleware is defined but **not applied** to any route group in `routes.go`. The global middleware chain does not include it.

### 6.2 Concurrent Service Rate Limiter

The concurrent service has its own internal rate limiter (`services/concurrent/rate_limiter.go`) using `golang.org/x/time/rate`. This is:
- Applied internally to AI processing within the concurrent service
- **NOT applied as HTTP middleware** to any endpoint
- Configurable via `PUT /api/concurrent/rate-limiter/limit` (which is itself unauthenticated)

### 6.3 Aktivitas SIAK Rate Limiter

The Aktivitas SIAK service accepts a `RateLimitChecker` interface, but it is initialized as `nil`:
```go
nil, // rateLimiter - not implemented yet
```

### 6.4 Impact

- **Login brute-force:** No protection against credential stuffing
- **Registration spam:** No protection against mass registration
- **Chat abuse:** No per-user or per-IP chat rate limiting
- **API abuse:** No global rate limiting on any endpoint

---

## 7. Error Handling Patterns

### 7.1 Standardized Error Response (pkg/errors)

The `pkg/errors` package provides a well-structured error system:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": "Optional technical details"
  }
}
```

HTTP status code mapping:
| Error Code | HTTP Status |
|-----------|-------------|
| `INTERNAL_ERROR` | 500 |
| `VALIDATION_ERROR` | 400 |
| `NOT_FOUND` | 404 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `CONFLICT` | 409 |
| `DATABASE_ERROR` | 500 |
| `CACHE_ERROR` | 500 |
| `AUTH_ERROR` | 401 |
| `SERVICE_UNAVAILABLE` | 503 |

### 7.2 Error Handling Quality by Handler

| Handler | Uses AppError? | Proper Status Codes? | Leaks Internal Details? |
|---------|---------------|---------------------|------------------------|
| Auth | ❌ (custom AuthResponse) | ✅ | ⚠️ Logs email in warnings |
| Chat | ✅ | ✅ | ⚠️ `err.Error()` in response |
| Training | ❌ (gin.H) | ✅ | ⚠️ `err.Error()` in `details` field |
| Data Rekam | ❌ (custom DataRekamResponse) | ✅ | ❌ Generic messages |
| Duplicate Operator | ❌ (gin.H) | ✅ | ⚠️ `err.Error()` in message |
| Admin | ❌ (custom AdminResponse) | ✅ | ❌ Generic messages |
| Supabase Analyzer | ❌ (gin.H) | ✅ | ⚠️ `err.Error()` in `details` |
| Concurrent | ❌ (gin.H) | ✅ | ⚠️ `err.Error()` in message |
| Health | N/A | ✅ | ⚠️ Exposes service internals |

### 7.3 Error Detail Leakage Concern

Multiple handlers expose raw Go error messages to clients:
```go
c.JSON(http.StatusInternalServerError, gin.H{
    "error":   "gagal mengambil data: " + err.Error(),  // Raw error
})
```

This can leak:
- Database table/column names
- Connection strings
- Stack trace fragments
- Internal service architecture details

---

## 8. Security Findings

### CRITICAL

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| C-01 | **Development CORS in production** — `AllowAllOrigins: true` with `AllowCredentials: true` | `routes.go:63` | Any website can make authenticated API requests; enables CSRF |
| C-02 | **Hardcoded Redis URL with credentials** in default config | `config.go:150` | Upstash Redis URL with auth token in source code default |
| C-03 | **No rate limiting** on any endpoint (login, register, chat) | Global | Brute-force attacks, credential stuffing, resource exhaustion |

### HIGH

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| H-01 | **`/auth/debug` is public** — exposes token introspection without authentication | `middleware/auth.go:153`, `routes.go:207` | Information disclosure; attackers can probe token validity |
| H-02 | **`/cache/clear` has no auth** — DELETE endpoint publicly accessible | `routes.go:190` | Cache poisoning, DoS via cache clearing |
| H-03 | **Concurrent service admin endpoints unauthenticated** — rate limiter config, circuit breaker reset, batch AI processing | `concurrent.go` routes | Service disruption, configuration tampering |
| H-04 | **Supabase analyzer endpoints unauthenticated** — exposes full database schema, table stats, bucket info | `supabase_analyzer_routes.go` | Schema reconnaissance for SQL injection planning |
| H-05 | **Admin routes missing middleware-level role enforcement** — only `AuthMiddleware` applied; role check is in handler | `routes.go:467-473` | Defense-in-depth violation; handler bypass possible |
| H-06 | **WebSocket allows anonymous connections** with no authentication | `routes.go:380-388` | Unauthorized real-time data access |

### MEDIUM

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| M-01 | **Error messages leak internal details** (`err.Error()` in responses) | Multiple handlers | Information disclosure |
| M-02 | **Chat endpoints have no message length limit** | `handlers/chat.go` | Resource exhaustion via extremely long messages |
| M-03 | **`/chat/history` is public** — any user can read chat history by session ID | `routes.go:241` | Data leakage if session IDs are guessable |
| M-04 | **No CSRF protection** for state-changing endpoints | Global | Cross-site request forgery |
| M-05 | **SILPANA ticket creation is optional-auth** — anonymous users can create tickets | `routes_silpana_with_session.go:55` | Spam tickets, accountability gaps |
| M-06 | **No input sanitization on search query parameters** (Data Rekam, Duplicate Operator) | `data_rekam_handler.go`, `duplicate_operator_handler.go` | Potential injection if queries reach SQL layer unsanitized |
| M-07 | **Missing HSTS header** | `logging.go` SecurityHeaders | Man-in-the-middle susceptibility |
| M-08 | **`/auth/logout` is public** — no token blacklisting implemented | `handlers/auth.go:407` | Logout is effectively a no-op |

### LOW

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| L-01 | **Duplicate operator routes not registered** — handler exists but no routes | `routes.go` | Dead code; functionality inaccessible |
| L-02 | **`/health` endpoint exposes detailed service status** (database pool, cache stats) | `handlers/health.go` | Minor information disclosure |
| L-03 | **Gin debug mode possible in production** if `GIN_MODE` not set | `config.go:136` (default: "debug") | Verbose error pages |
| L-04 | **No request body size limit** explicitly configured | `main.go` | Potential memory exhaustion |
| L-05 | **Date parameters not validated** for format (YYYY-MM-DD) | Data Rekam handlers | Unexpected behavior |

---

## 9. WebSocket Security

### 9.1 Endpoint: `GET /ws/tickets`

**Authentication:** None required. The handler checks for `user_id` in context but falls back to `"anonymous"`:

```go
userID, exists := c.Get("user_id")
if !exists {
    userID = "anonymous"
}
```

**Origin Check:** Disabled (allows all origins):
```go
CheckOrigin: func(r *http.Request) bool {
    return true  // ← Accepts any origin
}
```

**Buffer Size:** 1024 bytes read/write

**Risk:** Unauthorized users can connect and receive real-time ticket updates. Combined with permissive CORS, this allows cross-origin WebSocket connections.

---

## 10. Recommended Blackbox Test Cases

### Authentication Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-01 | Register with valid credentials | `POST /auth/register` | 200, success message | P0 |
| TC-02 | Register with weak password (e.g., "123") | `POST /auth/register` | 400, password validation error | P0 |
| TC-03 | Register with invalid email format | `POST /auth/register` | 400, email validation error | P0 |
| TC-04 | Register with duplicate email | `POST /auth/register` | 409, "Email sudah terdaftar" | P0 |
| TC-05 | Register with NIK != 16 digits | `POST /auth/register` | 400, NIK validation error | P1 |
| TC-06 | Login with valid credentials | `POST /auth/login` | 200, returns JWT token | P0 |
| TC-07 | Login with invalid credentials | `POST /auth/login` | 401, "Invalid credentials" | P0 |
| TC-08 | Login with empty body | `POST /auth/login` | 400, "Email and password required" | P0 |
| TC-09 | Access protected endpoint without token | `GET /auth/profile` | 401, "Authorization header required" | P0 |
| TC-10 | Access protected endpoint with expired token | `GET /auth/profile` | 401, "Token expired" | P0 |
| TC-11 | Access protected endpoint with malformed token | `GET /auth/profile` | 401, "Invalid token" | P0 |
| TC-12 | Refresh token with valid JWT | `POST /auth/refresh` | 200, new token | P1 |
| TC-13 | Access `/auth/debug` without auth | `GET /auth/debug` | 200 (should be 401 — vulnerability) | P0 |
| TC-14 | Brute-force login (100 rapid attempts) | `POST /auth/login` | Should be rate limited (currently isn't) | P0 |

### Authorization Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-15 | Access admin endpoint with regular user token | `GET /admin/pending-users` | 403, "Only admin users" | P0 |
| TC-16 | Access admin endpoint with admin token | `GET /admin/pending-users` | 200, pending users list | P0 |
| TC-17 | Access training data without auth | `GET /api/training-data` | 401 | P0 |
| TC-18 | Access data-rekam without auth | `GET /data-rekam/adjudicate` | 401 | P0 |
| TC-19 | Access Aktivitas SIAK without auth | `GET /api/v1/aktivitas-siak` | 401 | P0 |

### Chat Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-20 | Send empty message | `POST /chat` | 400, "Message is required" | P0 |
| TC-21 | Send valid message without auth | `POST /chat` | 200, guest context created | P0 |
| TC-22 | Send valid message with auth | `POST /chat` | 200, user context used | P0 |
| TC-23 | Send extremely long message (1MB+) | `POST /chat` | Should be rejected (currently no limit) | P1 |
| TC-24 | Send message with SQL injection payload | `POST /chat` | 200, no injection | P0 |
| TC-25 | Send message with XSS payload | `POST /chat` | 200, no XSS in response | P0 |
| TC-26 | Access chat history with valid session ID | `GET /chat/history?sessionId=xxx` | 200 or 404 | P1 |
| TC-27 | Access chat history without session ID | `GET /chat/history` | 400, "Session ID required" | P1 |

### CORS Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-28 | Send request with `Origin: https://evil.com` | Any | Currently: 200 with `Access-Control-Allow-Origin: https://evil.com` (vulnerability) | P0 |
| TC-29 | Send preflight OPTIONS with arbitrary origin | Any | Currently: 200, all origins allowed | P0 |
| TC-30 | Verify `Access-Control-Allow-Credentials` header | Any | Currently: `true` for all origins | P0 |

### Input Validation & Injection Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-31 | Register with name containing `<script>` tags | `POST /auth/register` | 200, no XSS | P1 |
| TC-32 | SQL injection in search parameter | `GET /data-rekam/adjudicate?search='; DROP TABLE--` | No SQL error, safe handling | P0 |
| TC-33 | Path traversal in Supabase table name | `GET /api/v1/supabase/tables/../../../etc/passwd` | 400 or 404, no file access | P1 |
| TC-34 | Send null bytes in request body | `POST /auth/register` | Handled gracefully | P1 |
| TC-35 | Very large page_size parameter | `GET /data-rekam/adjudicate?page_size=999999` | Capped at 100 | P1 |

### Infrastructure & Configuration Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-36 | Clear cache without authentication | `DELETE /cache/clear` | Currently: succeeds (vulnerability) | P0 |
| TC-37 | Reset circuit breaker without auth | `POST /api/concurrent/circuit-breaker/reset` | Currently: succeeds (vulnerability) | P0 |
| TC-38 | Update rate limiter config without auth | `PUT /api/concurrent/rate-limiter/limit` | Currently: succeeds (vulnerability) | P0 |
| TC-39 | Get Supabase schema without auth | `GET /api/v1/supabase/analyze` | Currently: returns full schema (vulnerability) | P0 |
| TC-40 | Get table stats for sensitive table | `GET /api/v1/supabase/tables/users` | Currently: returns table info (vulnerability) | P0 |

### WebSocket Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-41 | Connect to WebSocket without auth | `GET /ws/tickets` (Upgrade) | Currently: connects as "anonymous" (vulnerability) | P0 |
| TC-42 | Connect from cross-origin | `GET /ws/tickets` from evil.com | Currently: allowed (vulnerability) | P0 |
| TC-43 | Send malformed WebSocket frames | `WS /ws/tickets` | Connection closed gracefully | P1 |

### Error Handling Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-44 | Send request with invalid JSON body | `POST /auth/login` | 400, proper error message | P0 |
| TC-45 | Send request with wrong Content-Type | `POST /auth/login` | 400 or 415 | P1 |
| TC-46 | Verify no stack traces in error responses | All endpoints | No Go stack traces exposed | P0 |
| TC-47 | Verify error responses don't leak DB details | All endpoints | Generic error messages | P1 |

### SILPANA Ticketing Tests

| # | Test Case | Endpoint | Expected | Priority |
|---|-----------|----------|----------|----------|
| TC-48 | Create ticket as anonymous user | `POST /api/v1/silpana/tickets` | 200, ticket created (allowed by design) | P1 |
| TC-49 | Lookup ticket with valid code | `POST /api/v1/silpana/tickets/lookup` | 200, ticket found | P0 |
| TC-50 | Bulk approve tickets without session | `POST /api/v1/silpana/tickets/bulk-approve` | Should require auth | P0 |
| TC-51 | Access ticket details with valid session | `GET /api/v1/silpana/tickets/:id` | 200, ticket details | P0 |
| TC-52 | Access ticket details without session | `GET /api/v1/silpana/tickets/:id` | 401 (session required) | P0 |

### Security Header Tests

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| TC-53 | Verify `X-Content-Type-Options: nosniff` | Present | P1 |
| TC-54 | Verify `X-Frame-Options: DENY` | Present | P1 |
| TC-55 | Verify `Content-Security-Policy` | Present | P1 |
| TC-56 | Verify `Strict-Transport-Security` | **Missing** (should be added) | P1 |
| TC-57 | Verify no `X-Powered-By` header | Should not be present | P2 |

---

## 11. Risk Assessment Summary

### Overall Risk Rating: **HIGH**

### Risk Breakdown

| Severity | Count | Key Issues |
|----------|-------|-----------|
| **CRITICAL** | 3 | Permissive CORS, hardcoded credentials, no rate limiting |
| **HIGH** | 6 | Public debug/cache/admin endpoints, unauthenticated schema exposure, anonymous WebSocket |
| **MEDIUM** | 8 | Error leakage, missing CSRF, no message length limits, no HSTS |
| **LOW** | 5 | Dead code, info disclosure in health, missing body size limits |
| **Total** | **22** | |

### Attack Surface Summary

```
                    PUBLIC ENDPOINTS (no auth required)
                    ┌─────────────────────────────────┐
                    │  Health (8)                      │
                    │  Database/Cache (8) ← incl. DELETE│
                    │  Auth Register/Login/Debug (3)    │
                    │  Chat (3)                         │
                    │  Performance (5)                  │
                    │  Concurrent (14) ← admin ops!     │
                    │  Supabase Analyzer (4) ← schema!  │
                    │  WebSocket (1)                    │
                    │  SILPANA optional-auth (5)        │
                    │  ─────────────────────────────    │
                    │  TOTAL: ~55 public endpoints      │
                    └─────────────────────────────────┘

                    PROTECTED ENDPOINTS (JWT required)
                    ┌─────────────────────────────────┐
                    │  Auth Profile/Refresh (2)         │
                    │  Chat Sessions (1)                │
                    │  Training Data (6)                │
                    │  Data Rekam (5)                   │
                    │  Admin (1)                        │
                    │  Aktivitas SIAK (8)               │
                    │  SILPANA session-required (8)     │
                    │  ─────────────────────────────    │
                    │  TOTAL: ~31 protected endpoints   │
                    └─────────────────────────────────┘
```

### Priority Recommendations for Thesis Testing

1. **CRITICAL — Fix CORS before deployment** — Switch from `DevelopmentCORSMiddleware()` to `CORSMiddleware()` with restricted origins
2. **CRITICAL — Add rate limiting** — At minimum on `/auth/login`, `/auth/register`, and `/chat`
3. **CRITICAL — Remove hardcoded Redis URL** from config defaults
4. **HIGH — Protect admin/infrastructure endpoints** — Add `AuthMiddleware` + `RequireRole` to concurrent, cache-clear, supabase-analyzer endpoints
5. **HIGH — Add auth to WebSocket** — Validate JWT token in WebSocket upgrade request
6. **HIGH — Disable or protect `/auth/debug`** — Remove from public whitelist or remove entirely
7. **MEDIUM — Sanitize error responses** — Replace `err.Error()` with generic messages in production
8. **MEDIUM — Add message length limits** to chat endpoints
9. **MEDIUM — Implement CSRF protection** for state-changing endpoints
10. **LOW — Add HSTS header** for HTTPS environments

### Positive Findings

- ✅ JWT authentication is properly implemented with bcrypt password hashing
- ✅ Password strength validation is thorough (8+ chars, upper, lower, digit, special)
- ✅ NIK/NIP format validation follows Indonesian standards
- ✅ Security headers (X-Frame-Options, CSP, nosniff) are present
- ✅ Structured error handling framework exists (`pkg/errors`)
- ✅ Request ID tracking for observability
- ✅ Duplicate Operator handler has good input validation (character whitelist, length limits)
- ✅ Graceful shutdown with 30-second timeout
- ✅ Admin role check exists (though at handler level, not middleware)
- ✅ SILPANA session management with audit logging is well-designed

---

*End of Report — Generated by automated static analysis of source code*
*For blackbox testing, use the test cases in Section 10 as a starting point*
