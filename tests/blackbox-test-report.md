# 🧪 Blackbox API Test Report — Sellica Backend

**Date:** 2026-07-17 05:08:36 UTC
**Target:** http://localhost:8081
**Branch:** feat/supabase-jwt

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 130 |
| ✅ Passed | 109 |
| ❌ Failed | 10 |
| ⏭️ Skipped | 11 |

---

## Detailed Results

| # | Status | Test Case | Expected | Actual | Notes |
|---|--------|-----------|----------|--------|-------|
| 1 | ✅ PASS | GET /health → 200 | 200 | 200 | OK |
| 2 | ✅ PASS | GET /health/simple → 200 | 200 | 200 | OK |
| 3 | ✅ PASS | GET /health/live → 200 | 200 | 200 | OK |
| 4 | ✅ PASS | GET /health/ready → 200 | 200 | 200 | OK |
| 5 | ✅ PASS | GET /ready → 200 | 200 | 200 | OK |
| 6 | ✅ PASS | GET /metrics → 200 | 200 | 200 | OK |
| 7 | ✅ PASS | GET /metrics/health → 200 | 200 | 200 | OK |
| 8 | ✅ PASS | GET /metrics/summary → 200 | 200 | 200 | OK |
| 9 | ❌ FAIL | GET /health response has responseTime/services | true | false | FAIL |
| 10 | ❌ FAIL | GET /health returns valid JSON | ok | invalid | FAIL |
| 11 | ✅ PASS | POST /auth/register valid data → 200 | 200 | 200 | OK |
| 12 | ❌ FAIL | POST /auth/register response.success = true | true |  | FAIL |
| 13 | ✅ PASS | POST /auth/register empty body → 400 | 400 | 400 | OK |
| 14 | ✅ PASS | POST /auth/register missing email → 400 | 400 | 400 | OK |
| 15 | ✅ PASS | POST /auth/register missing name → 400 | 400 | 400 | OK |
| 16 | ✅ PASS | POST /auth/register missing password → 400 | 400 | 400 | OK |
| 17 | ✅ PASS | POST /auth/register weak password (short) → 400 | 400 | 400 | OK |
| 18 | ✅ PASS | POST /auth/register weak password (no upper) → 400 | 400 | 400 | OK |
| 19 | ✅ PASS | POST /auth/register weak password (no digit) → 400 | 400 | 400 | OK |
| 20 | ✅ PASS | POST /auth/register weak password (no special) → 400 | 400 | 400 | OK |
| 21 | ✅ PASS | POST /auth/register invalid email → 400 | 400 | 400 | OK |
| 22 | ✅ PASS | POST /auth/register SQL injection → not 500 | not500 | 400 | OK |
| 23 | ✅ PASS | POST /auth/register SQL injection in password → not 500 | not500 | 400 | OK |
| 24 | ✅ PASS | POST /auth/register XSS in name → not 500 | not500 | 409 | OK |
| 25 | ✅ PASS | POST /auth/register null byte in email → not 500 | not500 | 409 | OK |
| 26 | ✅ PASS | POST /auth/register Indonesian name (ASCII) → 200 | 200 | 200 | OK |
| 27 | ✅ PASS | POST /auth/register empty string body → 400 | 400 | 400 | OK |
| 28 | ✅ PASS | POST /auth/register invalid JSON → 400 | 400 | 400 | OK |
| 29 | ✅ PASS | POST /auth/register duplicate email → 409|200 | 409|200 | 409 | OK |
| 30 | ❌ FAIL | POST /auth/login admin → 200 | 200 | 401 | Admin may not exist |
| 31 | ✅ PASS | POST /auth/login invalid credentials → 401 | 401 | 401 | OK |
| 32 | ❌ FAIL | POST /auth/login invalid creds → success=false | false |  | FAIL |
| 33 | ✅ PASS | POST /auth/login missing email → 400 | 400 | 400 | OK |
| 34 | ✅ PASS | POST /auth/login missing password → 400 | 400 | 400 | OK |
| 35 | ✅ PASS | POST /auth/login empty body → 400 | 400 | 400 | OK |
| 36 | ✅ PASS | POST /auth/login invalid email format → 400 | 400 | 400 | OK |
| 37 | ✅ PASS | POST /auth/login SQL injection → not 500 | not500 | 400 | OK |
| 38 | ✅ PASS | POST /auth/login XSS in email → not 500 | not500 | 400 | OK |
| 39 | ✅ PASS | POST /auth/login very long password → not 500 | not500 | 401 | OK |
| 40 | ⏭️ SKIP | GET /auth/profile (with token) | - | - | No valid auth token |
| 41 | ⏭️ SKIP | POST /auth/refresh (with token) | - | - | No valid auth token |
| 42 | ⏭️ SKIP | POST /auth/logout (with token) | - | - | No valid auth token |
| 43 | ✅ PASS | GET /auth/profile no token → 401 | 401 | 401 | OK |
| 44 | ✅ PASS | POST /auth/refresh no token → 401 | 401 | 401 | OK |
| 45 | ✅ PASS | GET /auth/debug (no token) → 200 | 200 | 200 | OK |
| 46 | ✅ PASS | OPTIONS /health with Origin → 200|204 | 200|204 | 204 | OK |
| 47 | ✅ PASS | OPTIONS /auth/login preflight → 200|204 | 200|204 | 204 | OK |
| 48 | ✅ PASS | OPTIONS /auth/login arbitrary origin (dev) → 200|204 | 200|204 | 204 | OK |
| 49 | ✅ PASS | GET /api/v1/silpana/health → 200 | 200 | 200 | OK |
| 50 | ❌ FAIL | POST /api/v1/silpana/tickets valid data → 200 | 200 | 500 | FAIL |
| 51 | ❌ FAIL | POST /api/v1/silpana/tickets returns ticket ID | non-empty | empty | FAIL |
| 52 | ❌ FAIL | POST /api/v1/silpana/tickets unicode name → not 500 | not500 | 500 | FAIL |
| 53 | ✅ PASS | POST /api/v1/silpana/tickets empty body → 400 | 400 | 400 | OK |
| 54 | ✅ PASS | GET /api/v1/silpana/tickets → 200 | 200 | 200 | OK |
| 55 | ⏭️ SKIP | GET /api/v1/silpana/tickets/:id | - | - | No ticket ID |
| 56 | ✅ PASS | GET /api/v1/silpana/tickets/invalid-id → 404|200|401|500 | 404|200|401|500 | 401 | OK |
| 57 | ✅ PASS | POST /api/v1/silpana/tickets/lookup → 200|400|404 | 200|400|404 | 404 | OK |
| 58 | ✅ PASS | POST /api/v1/silpana/tickets/lookup empty code → 400 | 400 | 400 | OK |
| 59 | ✅ PASS | GET /api/v1/silpana/stats → 200|401 | 200|401 | 401 | OK |
| 60 | ✅ PASS | GET /api/v1/silpana/tickets/status/pending → 200|401 | 200|401 | 401 | OK |
| 61 | ✅ PASS | POST /api/v1/silpana/tickets/bulk-approve empty → 200|400|401 | 200|400|401 | 401 | OK |
| 62 | ✅ PASS | POST /api/v1/silpana/tickets/bulk-reject empty → 200|400|401 | 200|400|401 | 401 | OK |
| 63 | ✅ PASS | DELETE /api/v1/silpana/tickets/bulk-delete empty → 200|400|401 | 200|400|401 | 401 | OK |
| 64 | ✅ PASS | GET /api/v1/silpana/progress/INVALID → 404|200 | 404|200 | 404 | OK |
| 65 | ❌ FAIL | POST /api/v1/silpana/tickets SQLi → not 500 | not500 | 500 | FAIL |
| 66 | ❌ FAIL | POST /api/v1/silpana/tickets XSS → not 500 | not500 | 500 | FAIL |
| 67 | ✅ PASS | GET /api/v1/aktivitas-siak/health → 200|401 | 200|401 | 401 | OK |
| 68 | ✅ PASS | POST /api/v1/aktivitas-siak no auth → 401 | 401 | 401 | OK |
| 69 | ⏭️ SKIP | Aktivitas SIAK CRUD with auth | - | - | No auth token |
| 70 | ✅ PASS | GET /data-rekam/adjudicate no auth → 401 | 401 | 401 | OK |
| 71 | ✅ PASS | GET /data-rekam/duplicate-operator no auth → 401 | 401 | 401 | OK |
| 72 | ✅ PASS | GET /data-rekam/pengajuan-bulanan no auth → 401 | 401 | 401 | OK |
| 73 | ✅ PASS | GET /data-rekam/salah-rekam no auth → 401 | 401 | 401 | OK |
| 74 | ✅ PASS | GET /data-rekam/dashboard-stats no auth → 401 | 401 | 401 | OK |
| 75 | ⏭️ SKIP | Data Rekam with auth | - | - | No auth token |
| 76 | ✅ PASS | GET /admin/pending-users no auth → 401 | 401 | 401 | OK |
| 77 | ✅ PASS | POST /admin/approve-user no auth → 401 | 401 | 401 | OK |
| 78 | ✅ PASS | POST /admin/reject-user no auth → 401 | 401 | 401 | OK |
| 79 | ⏭️ SKIP | Admin non-admin access | - | - | No auth token |
| 80 | ⏭️ SKIP | Admin with admin token | - | - | No admin token |
| 81 | ✅ PASS | GET /api/v1/supabase/analyze no auth → 401 | 401 | 401 | OK |
| 82 | ✅ PASS | GET /api/v1/supabase/overview no auth → 401 | 401 | 401 | OK |
| 83 | ✅ PASS | GET /api/v1/supabase/buckets no auth → 401 | 401 | 401 | OK |
| 84 | ✅ PASS | GET /api/v1/supabase/tables/users no auth → 401 | 401 | 401 | OK |
| 85 | ⏭️ SKIP | Supabase with admin token | - | - | No admin token |
| 86 | ⏭️ SKIP | Supabase non-admin access | - | - | No non-admin token |
| 87 | ✅ PASS | GET /concurrent/status → 200|404 | 200|404 | 200 | OK |
| 88 | ✅ PASS | GET /api/concurrent/status → 200|404 | 200|404 | 200 | OK |
| 89 | ✅ PASS | GET /api/concurrent/metrics → 200|404 | 200|404 | 200 | OK |
| 90 | ✅ PASS | GET /api/concurrent/health → 200|404 | 200|404 | 200 | OK |
| 91 | ✅ PASS | GET /api/concurrent/worker-pool/status → 200|404 | 200|404 | 200 | OK |
| 92 | ✅ PASS | GET /api/concurrent/worker-pool/metrics → 200|404 | 200|404 | 200 | OK |
| 93 | ✅ PASS | GET /api/concurrent/rate-limiter/status → 200|404 | 200|404 | 200 | OK |
| 94 | ✅ PASS | PUT /api/concurrent/rate-limiter/limit → 200|400|404 | 200|400|404 | 400 | OK |
| 95 | ✅ PASS | GET /api/concurrent/circuit-breaker/status → 200|404 | 200|404 | 200 | OK |
| 96 | ✅ PASS | POST /api/concurrent/circuit-breaker/reset → 200|404 | 200|404 | 200 | OK |
| 97 | ✅ PASS | GET /api/concurrent/metrics/detailed → 200|404 | 200|404 | 200 | OK |
| 98 | ✅ PASS | GET /api/concurrent/ai-manager/status → 200|404 | 200|404 | 404 | OK |
| 99 | ✅ PASS | GET /api/concurrent/ai-manager/metrics → 200|404 | 200|404 | 404 | OK |
| 100 | ✅ PASS | GET /performance → 200 | 200 | 200 | OK |
| 101 | ✅ PASS | GET /api/performance/metrics → 200 | 200 | 200 | OK |
| 102 | ✅ PASS | GET /api/performance/health → 200 | 200 | 200 | OK |
| 103 | ✅ PASS | GET /api/performance/stats → 200 | 200 | 200 | OK |
| 104 | ✅ PASS | POST /api/performance/test no auth → 401 | 401 | 401 | OK |
| 105 | ✅ PASS | GET /database/health → 200 | 200 | 200 | OK |
| 106 | ✅ PASS | GET /database/stats → 200 | 200 | 200 | OK |
| 107 | ✅ PASS | GET /test-db → 200|503 | 200|503 | 503 | OK |
| 108 | ✅ PASS | GET /cache/health → 200 | 200 | 200 | OK |
| 109 | ✅ PASS | GET /cache/stats → 200 | 200 | 200 | OK |
| 110 | ✅ PASS | GET /cache/metrics → 200 | 200 | 200 | OK |
| 111 | ✅ PASS | GET /cache/performance → 200 | 200 | 200 | OK |
| 112 | ✅ PASS | DELETE /cache/clear no auth → 401|403 | 401|403 | 401 | OK |
| 113 | ✅ PASS | GET /database/performance no auth → 401|403 | 401|403 | 401 | OK |
| 114 | ✅ PASS | POST /auth/register huge payload → not 500 | not500 |  | OK |
| 115 | ✅ PASS | GET path traversal → 404 | 404 | 404 | OK |
| 116 | ✅ PASS | DELETE /auth/login → 404|405 | 404|405 | 404 | OK |
| 117 | ✅ PASS | PUT /health → 404|405 | 404|405 | 404 | OK |
| 118 | ✅ PASS | GET /api/v1/nonexistent → 404 | 404 | 404 | OK |
| 119 | ✅ PASS | POST /auth/login text/plain content → not 500 | not500 | 400 | OK |
| 120 | ✅ PASS | POST /auth/register unicode Indonesian name → not 500 | not500 | 409 | OK |
| 121 | ✅ PASS | GET double-encoded path traversal → 404 | 404 | 404 | OK |
| 122 | ✅ PASS | POST /auth/login no Content-Type → not 500 | not500 | 401 | OK |
| 123 | ✅ PASS | POST /chat valid → 200 | 200 | 200 | OK |
| 124 | ✅ PASS | POST /chat empty msg → 200|400 | 200|400 | 400 | OK |
| 125 | ✅ PASS | POST /chat/session → 200 | 200 | 200 | OK |
| 126 | ✅ PASS | GET /chat/history → 200|400 | 200|400 | 400 | OK |
| 127 | ✅ PASS | GET /chat/sessions → 200|401 | 200|401 | 401 | OK |
| 128 | ✅ PASS | POST /api/chat → 200 | 200 | 200 | OK |
| 129 | ✅ PASS | GET /api/v1/salah-rekam no auth → 401 | 401 | 401 | OK |
| 130 | ⏭️ SKIP | Salah Rekam with auth | - | - | No auth token |

---

## Test Environment

- **Backend:** http://localhost:8081
- **Platform:** Windows (Git Bash / MSYS2)
- **Test script:** `blackbox-api-test.sh`

## Endpoints Tested

### Health & Metrics (Public)
`GET /health`, `/health/simple`, `/health/live`, `/health/ready`, `/ready`, `/metrics`, `/metrics/health`, `/metrics/summary`

### Authentication
- `POST /auth/register` (Public)
- `POST /auth/login` (Public)
- `POST /auth/logout` (Optional)
- `POST /auth/refresh` (Protected)
- `GET /auth/profile` (Protected)
- `GET /auth/debug` (Public)

### SILPANA Ticketing
`POST/GET /api/v1/silpana/tickets`, `POST /api/v1/silpana/tickets/lookup`, `POST /api/v1/silpana/tickets/bulk-approve`, `POST /api/v1/silpana/tickets/bulk-reject`, `DELETE /api/v1/silpana/tickets/bulk-delete`, `GET /api/v1/silpana/stats`, `GET /api/v1/silpana/health`, `GET /api/v1/silpana/progress/:code`

### Aktivitas SIAK (Protected)
`POST/GET/PUT/DELETE /api/v1/aktivitas-siak`, `POST /api/v1/aktivitas-siak/check-duplicate`, `GET /api/v1/aktivitas-siak/statistics`, `GET /api/v1/aktivitas-siak/health`

### Data Rekam (Protected)
`GET /data-rekam/adjudicate`, `GET /data-rekam/duplicate-operator`, `GET /data-rekam/pengajuan-bulanan`, `GET /data-rekam/salah-rekam`, `GET /data-rekam/dashboard-stats`

### Admin (Admin Only)
`GET /admin/pending-users`, `POST /admin/approve-user`, `POST /admin/reject-user`

### Supabase Analyzer (Admin Only)
`GET /api/v1/supabase/analyze`, `/overview`, `/tables/:name`, `/buckets`

### Concurrent Processing (Public)
`GET /concurrent/status`, `/api/concurrent/status`, `/metrics`, `/health`, `/worker-pool/*`, `/rate-limiter/*`, `/circuit-breaker/*`, `/ai-manager/*`

### Performance
`GET /performance`, `/api/performance/metrics`, `/health`, `/stats` (Public); `POST /api/performance/test` (Admin)

### Database & Cache
`GET /database/health`, `/stats`, `/test-db`, `/cache/health`, `/stats`, `/metrics`, `/performance` (Public); `DELETE /cache/clear`, `GET /database/performance` (Admin)

### Chat
`POST /chat`, `/chat/session`, `/api/chat` (Public); `GET /chat/history`, `/chat/sessions`

### Salah Rekam (Protected)
`GET /api/v1/salah-rekam`, `GET /api/v1/salah-rekam/search`

### CORS
`OPTIONS /health`, `/auth/login`

### Security
SQL injection, XSS, path traversal, large payloads, unicode, invalid methods
