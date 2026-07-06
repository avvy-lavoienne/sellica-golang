# CHANGES-NONAI-AUDIT.md — AI Endpoint Deprecation & Security Fixes

**Date:** 2026-07-06
**Scope:** Non-AI security audit findings + AI endpoint deprecation
**Build Status:** ✅ `go build ./cmd/server/` passes cleanly

---

## TASK A: AI Endpoint Deprecation (HTTP 410 Gone)

### A-1. Chat Endpoints → 410
**File:** `internal/api/routes/routes.go` (function `setupChatRoutes`)

| Endpoint | Before | After |
|---|---|---|
| `POST /chat` | `chatHandler.ProcessChat` | 410 Gone — "AI chat endpoints are not in scope" |
| `POST /chat/session` | `chatHandler.ProcessSessionChat` | 410 Gone |
| `POST /api/chat` | `chatHandler.ProcessChat` | 410 Gone |
| `GET /chat/history` | `chatHandler.GetChatHistory` | 410 Gone |
| `GET /chat/sessions` | `chatHandler.GetChatSessions` | 410 Gone |

### A-2. Training Data Endpoints → 410
**File:** `internal/api/routes/routes.go` (function `setupTrainingRoutes`)

| Endpoint | Before | After |
|---|---|---|
| `POST /api/training-data` | `trainingHandler.SubmitTrainingData` | 410 Gone — "Training data endpoints are not in scope" |
| `GET /api/training-data` | `trainingHandler.GetTrainingData` | 410 Gone |
| `POST /api/training-data/enhanced` | `trainingHandler.SubmitEnhancedData` | 410 Gone |
| `GET /api/training-data/enhanced` | `trainingHandler.GetEnhancedData` | 410 Gone |
| `GET /api/training-data/stats` | `trainingHandler.GetTrainingStats` | 410 Gone |
| `GET /api/training-data/suggestions` | `trainingHandler.GetTrainingSuggestions` | 410 Gone |

### A-3. Concurrent AI Endpoints → 410
**File:** `internal/api/routes/concurrent.go`

| Endpoint | Before | After |
|---|---|---|
| `POST /api/concurrent/ai/process-batch` | `handler.ProcessConcurrentAIRequests` | 410 Gone — "AI processing endpoints are not in scope" |
| `POST /api/concurrent/ai/process` | (did not exist) | 410 Gone (newly added) |
| `GET /api/concurrent/ai-manager/status` | `handler.GetAIManagerStatus` | 410 Gone — "AI manager endpoints are not in scope" |
| `GET /api/concurrent/ai-manager/metrics` | `handler.GetAIManagerMetrics` | 410 Gone |

**Preserved:** Worker pool, rate-limiter status, circuit-breaker status endpoints.

### A-4. Performance AI Endpoints → 410
**File:** `internal/api/routes/routes.go` (function `setupPerformanceRoutes`)

| Endpoint | Before | After |
|---|---|---|
| `GET /api/performance/metrics` | `handler.GetHighPerformanceMetrics` | 410 Gone — "AI performance metrics are not in scope" |
| `POST /api/performance/test` | `handler.PostPerformanceTest` | 410 Gone — "Performance test endpoints are not in scope" |

**Preserved:** `GET /performance`, `GET /api/performance/health`, `GET /api/performance/stats`.

### A-5. Supabase Analyzer Endpoints → 410
**File:** `internal/api/routes/supabase_analyzer_routes.go` (full rewrite)

| Endpoint | Before | After |
|---|---|---|
| `GET /api/v1/supabase/analyze` | `handler.AnalyzeProject` | 410 Gone — "Supabase analyzer endpoints are not in scope" |
| `GET /api/v1/supabase/overview` | `handler.GetProjectOverview` | 410 Gone |
| `GET /api/v1/supabase/tables/:name` | `handler.GetTableStats` | 410 Gone |
| `GET /api/v1/supabase/buckets` | `handler.ListBuckets` | 410 Gone |

---

## TASK B: Critical Security Fixes

### B-1. CORS: Restricted Origins
**File:** `internal/api/routes/routes.go` (line ~63)

| Before | After |
|---|---|
| `router.Use(middleware.DevelopmentCORSMiddleware())` | `router.Use(middleware.CORSMiddleware())` |

**Impact:** CORS now restricted to `localhost:3000`, `localhost:5678`, `sellica.vercel.app`, `*.vercel.app` instead of allowing ALL origins.

### B-2. Rate Limiting: Real Implementation
**File:** `internal/api/middleware/auth.go` (function `AuthRateLimitMiddleware`)

**Before:** Cosmetic only — set headers `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: 9` but never blocked requests. Also NOT applied to any route group.

**After:** Real in-memory rate limiter using `sync.Mutex`-protected `map[string]*rateLimitEntry`. Tracks requests per IP within a 1-minute sliding window. Returns `429 Too Many Requests` when limit exceeded.

**Applied to:** Both public and protected `/auth/*` route groups in `setupAuthRoutes`.

### B-3. Endpoint Protection

#### B-3a. `/auth/debug` — Now Requires Authentication
**File:** `internal/api/middleware/auth.go` + `internal/api/routes/routes.go`

| Before | After |
|---|---|
| Listed in `isPublicEndpoint()` whitelist | Removed from whitelist |
| Registered in public `/auth` group | Moved to protected `/auth` group with `AuthMiddleware` |

#### B-3b. `DELETE /cache/clear` — Now Requires Authentication
**File:** `internal/api/routes/routes.go` (function `setupCacheRoutes`)

| Before | After |
|---|---|
| `cache.DELETE("/clear", handler.ClearCache)` in public group | Moved to separate `cacheProtected` group with `AuthMiddleware` |

GET endpoints (`/cache/health`, `/cache/stats`, `/cache/performance`) remain public.

#### B-3c. Concurrent Admin Endpoints — Now Require Authentication
**File:** `internal/api/routes/concurrent.go`

| Endpoint | Before | After |
|---|---|---|
| `PUT /api/concurrent/rate-limiter/limit` | No auth | `AuthMiddleware` required |
| `POST /api/concurrent/circuit-breaker/reset` | No auth | `AuthMiddleware` required |

Read-only status endpoints remain public.

#### B-3d. WebSocket `/ws/tickets` — Now Requires JWT Validation
**File:** `internal/api/routes/routes.go` (function `setupWebSocketRoutes` + `WebSocketTicketHandler`)

| Before | After |
|---|---|
| Anonymous connections allowed (`userID = "anonymous"` fallback) | JWT validation required before WebSocket upgrade |
| No token check | Checks `Authorization: Bearer <token>` header, falls back to `?token=` query param |
| | Returns 401 if no token, invalid token, or expired token |
| | Sets `user_id`, `user_role`, `auth_context` from validated JWT claims |

### B-4. Hardcoded Redis URL Removed
**File:** `internal/config/config.go` (line ~150)

| Before | After |
|---|---|
| `getEnv("REDIS_URL", "rediss://default:AZt2AAIjcDE4MzM3YTAy...@creative-stingray-39798.upstash.io:6379")` | `getEnv("REDIS_URL", "")` |

**Impact:** Redis URL must now be provided via `REDIS_URL` environment variable. No more hardcoded credentials in source code.

---

## Files Modified

| File | Changes |
|---|---|
| `internal/api/routes/routes.go` | CORS fix, chat/training/performance/supabase deprecation, cache auth, auth rate limiting, WebSocket JWT validation |
| `internal/api/routes/concurrent.go` | AI endpoint deprecation, auth middleware on admin endpoints |
| `internal/api/routes/supabase_analyzer_routes.go` | Full rewrite — all endpoints return 410 |
| `internal/api/middleware/auth.go` | Real rate limiter, `/auth/debug` removed from public whitelist |
| `internal/config/config.go` | Hardcoded Redis URL removed |

## Verification

```
$ go build ./cmd/server/
(exit code 0, no errors)

$ go vet ./internal/api/routes/ ./internal/api/middleware/ ./internal/config/
(exit code 0, no warnings)
```
