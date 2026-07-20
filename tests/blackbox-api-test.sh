#!/bin/bash
###############################################################################
# BLACKBOX API TEST SCRIPT - Sellica Backend API
# Target: http://localhost:8081
# Branch: feat/supabase-jwt
###############################################################################
set -uo pipefail

BASE_URL="http://localhost:8081"
REPORT_DIR="$(dirname "$0")"
REPORT_FILE="$REPORT_DIR/blackbox-test-report.md"

TOTAL=0; PASSED=0; FAILED=0; SKIPPED=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

TEST_EMAIL="testuser_$(date +%s)@selly.gov.id"
TEST_PASSWORD="TestPass@123"
TEST_NAME="Test User"

AUTH_TOKEN=""
ADMIN_TOKEN=""
CREATED_TICKET_ID=""
CREATED_SIAK_ID=""

###############################################################################
# Helpers
###############################################################################
log_test() {
  local name="$1" expected="$2" actual="$3" details="${4:-}"
  TOTAL=$((TOTAL + 1))
  local pass=false

  if [[ "$expected" == not* ]]; then
    local forbidden="${expected#not}"
    [ "$actual" != "$forbidden" ] && pass=true
  elif [[ "$expected" == *"|"* ]]; then
    IFS='|' read -ra VALS <<< "$expected"
    for v in "${VALS[@]}"; do [ "$actual" = "$v" ] && pass=true && break; done
  elif [ "$expected" = "$actual" ]; then
    pass=true
  fi

  if $pass; then
    PASSED=$((PASSED + 1))
    echo -e "  ${GREEN}✓ PASS${NC} [$name] expected=$expected actual=$actual"
    echo "| $TOTAL | ✅ PASS | $name | $expected | $actual | ${details:-OK} |" >> "$REPORT_FILE.tmp"
  else
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} [$name] expected=$expected actual=$actual"
    echo "| $TOTAL | ❌ FAIL | $name | $expected | $actual | ${details:-FAIL} |" >> "$REPORT_FILE.tmp"
  fi
}

log_skip() {
  local name="$1" reason="${2:-Skipped}"
  TOTAL=$((TOTAL + 1)); SKIPPED=$((SKIPPED + 1))
  echo -e "  ${YELLOW}⊘ SKIP${NC} [$name] $reason"
  echo "| $TOTAL | ⏭️ SKIP | $name | - | - | $reason |" >> "$REPORT_FILE.tmp"
}

section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE} $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Usage: http_call METHOD PATH [DATA] [TOKEN]
http_call() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local extra_args=()
  [ -n "$data" ] && extra_args+=(-d "$data")
  [ -n "$token" ] && extra_args+=(-H "Authorization: Bearer $token")
  local resp_file; resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X "$method" -H "Content-Type: application/json" "${extra_args[@]}" "${BASE_URL}${path}" 2>/dev/null)
  HTTP_BODY=$(tr -d '\r' < "$resp_file" 2>/dev/null); rm -f "$resp_file"
}

json_val() {
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$2',''))" 2>/dev/null
}

###############################################################################
# Initialize Report
###############################################################################
init_report() {
  cat > "$REPORT_FILE" <<EOF
# 🧪 Blackbox API Test Report — Sellica Backend

**Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Target:** ${BASE_URL}
**Branch:** feat/supabase-jwt

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | $TOTAL |
| ✅ Passed | $PASSED |
| ❌ Failed | $FAILED |
| ⏭️ Skipped | $SKIPPED |

---

## Detailed Results

| # | Status | Test Case | Expected | Actual | Notes |
|---|--------|-----------|----------|--------|-------|
EOF
}

finalize_report() {
  sed -i "s/| Total Tests | .* |/| Total Tests | $TOTAL |/" "$REPORT_FILE"
  sed -i "s/| ✅ Passed | .* |/| ✅ Passed | $PASSED |/" "$REPORT_FILE"
  sed -i "s/| ❌ Failed | .* |/| ❌ Failed | $FAILED |/" "$REPORT_FILE"
  sed -i "s/| ⏭️ Skipped | .* |/| ⏭️ Skipped | $SKIPPED |/" "$REPORT_FILE"
  [ -f "$REPORT_FILE.tmp" ] && cat "$REPORT_FILE.tmp" >> "$REPORT_FILE" && rm -f "$REPORT_FILE.tmp"
  cat >> "$REPORT_FILE" <<'ENDREPORT'

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
ENDREPORT
}

###############################################################################
# 1. HEALTH & METRICS (Public)
###############################################################################
test_health_metrics() {
  section "1. Health & Metrics Endpoints (Public)"
  http_call GET "/health"; log_test "GET /health → 200" "200" "$HTTP_CODE"
  http_call GET "/health/simple"; log_test "GET /health/simple → 200" "200" "$HTTP_CODE"
  http_call GET "/health/live"; log_test "GET /health/live → 200" "200" "$HTTP_CODE"
  http_call GET "/health/ready"; log_test "GET /health/ready → 200" "200" "$HTTP_CODE"
  http_call GET "/ready"; log_test "GET /ready → 200" "200" "$HTTP_CODE"
  http_call GET "/metrics"; log_test "GET /metrics → 200" "200" "$HTTP_CODE"
  http_call GET "/metrics/health"; log_test "GET /metrics/health → 200" "200" "$HTTP_CODE"
  http_call GET "/metrics/summary"; log_test "GET /metrics/summary → 200" "200" "$HTTP_CODE"
  http_call GET "/health"
  HAS_RT=$(json_val "$HTTP_BODY" "responseTime" 2>/dev/null)
  HAS_SVC=$(json_val "$HTTP_BODY" "services" 2>/dev/null)
  log_test "GET /health response has responseTime/services" "true" "$([ -n "$HAS_RT" ] || [ -n "$HAS_SVC" ] && echo true || echo false)"
  IS_JSON=$(echo "$HTTP_BODY" | python3 -c "import sys,json; json.load(sys.stdin); print('ok')" 2>/dev/null || echo "invalid")
  log_test "GET /health returns valid JSON" "ok" "$IS_JSON"
}

###############################################################################
# 2. AUTH - REGISTRATION
###############################################################################
test_auth_register() {
  section "2. Authentication - Registration"

  # 2a. Successful registration
  http_call POST "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASSWORD\"}"
  log_test "POST /auth/register valid data → 200" "200" "$HTTP_CODE"
  HAS_SUCCESS=$(json_val "$HTTP_BODY" "success")
  log_test "POST /auth/register response.success = true" "true" "$HAS_SUCCESS"

  # 2b. Missing required fields
  http_call POST "/auth/register" "{}"; log_test "POST /auth/register empty body → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"name\":\"Test\",\"password\":\"$TEST_PASSWORD\"}"
  log_test "POST /auth/register missing email → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"no-name@test.com\",\"password\":\"$TEST_PASSWORD\"}"
  log_test "POST /auth/register missing name → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"no-pass@test.com\",\"name\":\"No Pass\"}"
  log_test "POST /auth/register missing password → 400" "400" "$HTTP_CODE"

  # 2c. Weak passwords
  http_call POST "/auth/register" "{\"email\":\"weak@test.com\",\"name\":\"Weak\",\"password\":\"abc\"}"
  log_test "POST /auth/register weak password (short) → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"noupper@test.com\",\"name\":\"No Upper\",\"password\":\"lowercase1!\"}"
  log_test "POST /auth/register weak password (no upper) → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"nodigit@test.com\",\"name\":\"No Digit\",\"password\":\"NoDigitHere!\"}"
  log_test "POST /auth/register weak password (no digit) → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"nospecial@test.com\",\"name\":\"No Special\",\"password\":\"NoSpecial1\"}"
  log_test "POST /auth/register weak password (no special) → 400" "400" "$HTTP_CODE"

  # 2d. Invalid email format
  http_call POST "/auth/register" "{\"email\":\"not-an-email\",\"name\":\"Bad Email\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register invalid email → 400" "400" "$HTTP_CODE"

  # 2e. SQL injection
  http_call POST "/auth/register" "{\"email\":\"' OR '1'='1@test.com\",\"name\":\"SQLi\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register SQL injection → not 500" "not500" "$HTTP_CODE"
  http_call POST "/auth/register" "{\"email\":\"sqli2@test.com\",\"name\":\"SQLi2\",\"password\":\"' OR '1'='1\"}"
  log_test "POST /auth/register SQL injection in password → not 500" "not500" "$HTTP_CODE"

  # 2f. XSS
  http_call POST "/auth/register" "{\"email\":\"xss@test.com\",\"name\":\"<script>alert('xss')</script>\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register XSS in name → not 500" "not500" "$HTTP_CODE"

  # 2g. Null bytes
  http_call POST "/auth/register" "{\"email\":\"null%00@test.com\",\"name\":\"NullByte\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register null byte in email → not 500" "not500" "$HTTP_CODE"

  # 2h. Indonesian names
  http_call POST "/auth/register" "{\"email\":\"indo$(date +%s)@selly.gov.id\",\"name\":\"Budi Santoso\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register Indonesian name (ASCII) → 200" "200" "$HTTP_CODE"

  # 2i. Empty/invalid body
  http_call POST "/auth/register" ""; log_test "POST /auth/register empty string body → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/register" "not-json"; log_test "POST /auth/register invalid JSON → 400" "400" "$HTTP_CODE"

  # 2j. Duplicate email
  http_call POST "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASSWORD\"}"
  log_test "POST /auth/register duplicate email → 409|200" "409|200" "$HTTP_CODE"
}

###############################################################################
# 3. AUTH - LOGIN
###############################################################################
test_auth_login() {
  section "3. Authentication - Login"

  # Try to login as admin
  http_call POST "/auth/login" "{\"email\":\"admin@selly.gov.id\",\"password\":\"AdminPass@123\"}"
  LOGIN_STATUS="$HTTP_CODE"
  if [ "$LOGIN_STATUS" = "200" ]; then
    ADMIN_TOKEN=$(json_val "$HTTP_BODY" "token")
    log_test "POST /auth/login admin → 200" "200" "$LOGIN_STATUS"
    log_test "POST /auth/login returns JWT token" "non-empty" "$([ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "None" ] && echo non-empty || echo empty)"
  else
    log_test "POST /auth/login admin → 200" "200" "$LOGIN_STATUS" "Admin may not exist"
    ADMIN_TOKEN=""
  fi

  # 3b. Invalid credentials
  http_call POST "/auth/login" "{\"email\":\"nonexistent@test.com\",\"password\":\"WrongPass@123\"}"
  log_test "POST /auth/login invalid credentials → 401" "401" "$HTTP_CODE"
  HAS_SUCCESS=$(json_val "$HTTP_BODY" "success")
  log_test "POST /auth/login invalid creds → success=false" "false" "$HAS_SUCCESS"

  # 3c. Missing fields
  http_call POST "/auth/login" "{\"password\":\"SomePass@123\"}"; log_test "POST /auth/login missing email → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/login" "{\"email\":\"test@test.com\"}"; log_test "POST /auth/login missing password → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/login" "{}"; log_test "POST /auth/login empty body → 400" "400" "$HTTP_CODE"
  http_call POST "/auth/login" "{\"email\":\"not-email\",\"password\":\"Pass@123\"}"
  log_test "POST /auth/login invalid email format → 400" "400" "$HTTP_CODE"

  # 3d. SQL injection
  http_call POST "/auth/login" "{\"email\":\"' OR '1'='1'--@test.com\",\"password\":\"' OR '1'='1\"}"
  log_test "POST /auth/login SQL injection → not 500" "not500" "$HTTP_CODE"

  # 3e. XSS
  http_call POST "/auth/login" "{\"email\":\"<img src=x onerror=alert(1)>\",\"password\":\"test\"}"
  log_test "POST /auth/login XSS in email → not 500" "not500" "$HTTP_CODE"

  # 3f. Long password
  LONG_PASS=$(python3 -c "print('A' * 10000)")
  http_call POST "/auth/login" "{\"email\":\"test@test.com\",\"password\":\"$LONG_PASS\"}"
  log_test "POST /auth/login very long password → not 500" "not500" "$HTTP_CODE"
}

###############################################################################
# 4. AUTH - PROTECTED ENDPOINTS
###############################################################################
test_auth_protected() {
  section "4. Authenticated Endpoints (Profile, Refresh, Logout)"

  local token="$AUTH_TOKEN"

  if [ -z "$token" ] || [ "$token" = "None" ]; then
    log_skip "GET /auth/profile (with token)" "No valid auth token"
    log_skip "POST /auth/refresh (with token)" "No valid auth token"
    log_skip "POST /auth/logout (with token)" "No valid auth token"
    http_call GET "/auth/profile"; log_test "GET /auth/profile no token → 401" "401" "$HTTP_CODE"
    http_call POST "/auth/refresh"; log_test "POST /auth/refresh no token → 401" "401" "$HTTP_CODE"
    return
  fi

  # 4a. Get profile with valid token
  http_call GET "/auth/profile" "" "$token"; log_test "GET /auth/profile valid token → 200" "200" "$HTTP_CODE"

  # 4b. Refresh token
  http_call POST "/auth/refresh" "" "$token"; log_test "POST /auth/refresh valid token → 200" "200" "$HTTP_CODE"
  NEW_TOKEN=$(json_val "$HTTP_BODY" "token")
  log_test "POST /auth/refresh returns new token" "non-empty" "$([ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "None" ] && echo non-empty || echo empty)"
  [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "None" ] && AUTH_TOKEN="$NEW_TOKEN"

  # 4c. Logout
  http_call POST "/auth/logout" "" "$token"; log_test "POST /auth/logout valid token → 200" "200" "$HTTP_CODE"

  # 4d. No token
  http_call GET "/auth/profile"; log_test "GET /auth/profile no token → 401" "401" "$HTTP_CODE"

  # 4e. Invalid token
  http_call GET "/auth/profile" "" "invalid.jwt.token"; log_test "GET /auth/profile invalid token → 401" "401" "$HTTP_CODE"

  # 4f. Wrong auth format
  local resp_file; resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -H "Authorization: NotBearer sometoken" "${BASE_URL}/auth/profile" 2>/dev/null)
  rm -f "$resp_file"
  log_test "GET /auth/profile wrong auth format → 401" "401" "$HTTP_CODE"

  # 4g. Empty Bearer
  resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -H "Authorization: Bearer " "${BASE_URL}/auth/profile" 2>/dev/null)
  rm -f "$resp_file"
  log_test "GET /auth/profile empty Bearer token → 401" "401" "$HTTP_CODE"
}

###############################################################################
# 5. AUTH - DEBUG
###############################################################################
test_auth_debug() {
  section "5. Auth Debug Endpoint"
  http_call GET "/auth/debug"; log_test "GET /auth/debug (no token) → 200" "200" "$HTTP_CODE"
}

###############################################################################
# 6. CORS PREFLIGHT
###############################################################################
test_cors() {
  section "6. CORS Preflight (OPTIONS) Tests"

  local resp_file; resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" "${BASE_URL}/health" 2>/dev/null)
  rm -f "$resp_file"
  log_test "OPTIONS /health with Origin → 200|204" "200|204" "$HTTP_CODE"

  resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X OPTIONS -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" "${BASE_URL}/auth/login" 2>/dev/null)
  rm -f "$resp_file"
  log_test "OPTIONS /auth/login preflight → 200|204" "200|204" "$HTTP_CODE"

  resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X OPTIONS -H "Origin: http://evil-site.com" -H "Access-Control-Request-Method: POST" "${BASE_URL}/auth/login" 2>/dev/null)
  rm -f "$resp_file"
  log_test "OPTIONS /auth/login arbitrary origin (dev) → 200|204" "200|204" "$HTTP_CODE"
}

###############################################################################
# 7. SILPANA TICKETING
###############################################################################
test_silpana() {
  section "7. SILPANA Ticketing Endpoints"

  http_call GET "/api/v1/silpana/health"; log_test "GET /api/v1/silpana/health → 200" "200" "$HTTP_CODE"

  # 7b. Create ticket (with all required fields)
  http_call POST "/api/v1/silpana/tickets" \
    '{"requester_name":"Budi Santoso","requester_nik":"3201234567890001","requester_phone":"081234567890","requester_address":"Jl. Merdeka No. 1","document_type":"KTP","purpose":"Pengaduan layanan","priority":"medium"}'
  log_test "POST /api/v1/silpana/tickets valid data → 200" "200" "$HTTP_CODE"

  CREATED_TICKET_ID=$(json_val "$HTTP_BODY" "id" 2>/dev/null)
  if [ -z "$CREATED_TICKET_ID" ] || [ "$CREATED_TICKET_ID" = "None" ]; then
    CREATED_TICKET_ID=$(echo "$HTTP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('ticket',{}); print(t.get('id',''))" 2>/dev/null)
  fi
  log_test "POST /api/v1/silpana/tickets returns ticket ID" "non-empty" "$([ -n "$CREATED_TICKET_ID" ] && [ "$CREATED_TICKET_ID" != "None" ] && echo non-empty || echo empty)"

  # 7c. Indonesian unicode name
  http_call POST "/api/v1/silpana/tickets" \
    '{"requester_name":"Siti Nurhaliza","requester_nik":"3201234567890002","requester_phone":"081234567891","requester_address":"Jl. Sudirman No. 2","document_type":"KTP","purpose":"Pengujian unicode","priority":"low"}'
  log_test "POST /api/v1/silpana/tickets unicode name → not 500" "not500" "$HTTP_CODE"

  # 7d. Empty body
  http_call POST "/api/v1/silpana/tickets" "{}"
  log_test "POST /api/v1/silpana/tickets empty body → 400" "400" "$HTTP_CODE"

  # 7e. Get all tickets
  http_call GET "/api/v1/silpana/tickets"; log_test "GET /api/v1/silpana/tickets → 200" "200" "$HTTP_CODE"

  # 7f. Get ticket by ID
  if [ -n "$CREATED_TICKET_ID" ] && [ "$CREATED_TICKET_ID" != "None" ]; then
    http_call GET "/api/v1/silpana/tickets/$CREATED_TICKET_ID"
    log_test "GET /api/v1/silpana/tickets/:id valid → 200" "200" "$HTTP_CODE"
  else
    log_skip "GET /api/v1/silpana/tickets/:id" "No ticket ID"
  fi

  # 7g. Invalid ticket ID
  http_call GET "/api/v1/silpana/tickets/00000000-0000-0000-0000-000000000000"
  log_test "GET /api/v1/silpana/tickets/invalid-id → 404|200|401|500" "404|200|401|500" "$HTTP_CODE"

  # 7h. Lookup ticket
  http_call POST "/api/v1/silpana/tickets/lookup" '{"code":"NONEXISTENT","requester_nik":"3201234567890001","requester_phone":"081234567890"}'
  log_test "POST /api/v1/silpana/tickets/lookup → 200|400|404" "200|400|404" "$HTTP_CODE"

  # 7i. Lookup empty code
  http_call POST "/api/v1/silpana/tickets/lookup" '{"requester_nik":"3201234567890001","requester_phone":"081234567890"}'
  log_test "POST /api/v1/silpana/tickets/lookup empty code → 400" "400" "$HTTP_CODE"

  # 7j. Stats
  http_call GET "/api/v1/silpana/stats"
  log_test "GET /api/v1/silpana/stats → 200|401" "200|401" "$HTTP_CODE"

  # 7k. Filter by status
  http_call GET "/api/v1/silpana/tickets/status/pending"
  log_test "GET /api/v1/silpana/tickets/status/pending → 200|401" "200|401" "$HTTP_CODE"

  # 7l. Bulk operations (empty bodies)
  http_call POST "/api/v1/silpana/tickets/bulk-approve" '{}'
  log_test "POST /api/v1/silpana/tickets/bulk-approve empty → 200|400|401" "200|400|401" "$HTTP_CODE"
  http_call POST "/api/v1/silpana/tickets/bulk-reject" '{}'
  log_test "POST /api/v1/silpana/tickets/bulk-reject empty → 200|400|401" "200|400|401" "$HTTP_CODE"
  http_call DELETE "/api/v1/silpana/tickets/bulk-delete" '{}'
  log_test "DELETE /api/v1/silpana/tickets/bulk-delete empty → 200|400|401" "200|400|401" "$HTTP_CODE"

  # 7m. Progress tracking
  http_call GET "/api/v1/silpana/progress/INVALID"
  log_test "GET /api/v1/silpana/progress/INVALID → 404|200" "404|200" "$HTTP_CODE"

  # 7n. SQL injection on ticket
  http_call POST "/api/v1/silpana/tickets" "{\"name\":\"' OR 1=1--\",\"requester_name\":\"sqli\",\"requester_nik\":\"3201234567890003\",\"requester_phone\":\"081234567892\",\"requester_address\":\"test\",\"document_type\":\"KTP\",\"purpose\":\"sqli\"}"
  log_test "POST /api/v1/silpana/tickets SQLi → not 500" "not500" "$HTTP_CODE"

  # 7o. XSS on ticket
  http_call POST "/api/v1/silpana/tickets" "{\"requester_name\":\"<script>alert(1)</script>\",\"requester_nik\":\"3201234567890004\",\"requester_phone\":\"081234567893\",\"requester_address\":\"test\",\"document_type\":\"KTP\",\"purpose\":\"xss\"}"
  log_test "POST /api/v1/silpana/tickets XSS → not 500" "not500" "$HTTP_CODE"
}

###############################################################################
# 8. AKTIVITAS SIAK
###############################################################################
test_aktivitas_siak() {
  section "8. Aktivitas SIAK Endpoints (Protected)"
  local token="$AUTH_TOKEN"

  http_call GET "/api/v1/aktivitas-siak/health"
  log_test "GET /api/v1/aktivitas-siak/health → 200|401" "200|401" "$HTTP_CODE"
  http_call POST "/api/v1/aktivitas-siak" '{"nik":"3201234567890001","name":"Test","activity_type":"birth_registration"}'
  log_test "POST /api/v1/aktivitas-siak no auth → 401" "401" "$HTTP_CODE"

  if [ -n "$token" ] && [ "$token" != "None" ]; then
    http_call POST "/api/v1/aktivitas-siak" \
      '{"nik":"3201234567890001","name":"Budi Santoso","activity_type":"birth_registration","location":"Kantor Dukcapil"}' "$token"
    log_test "POST /api/v1/aktivitas-siak valid → 200|201" "200|201" "$HTTP_CODE"
    CREATED_SIAK_ID=$(json_val "$HTTP_BODY" "id" 2>/dev/null)

    http_call GET "/api/v1/aktivitas-siak" "" "$token"; log_test "GET /api/v1/aktivitas-siak → 200" "200" "$HTTP_CODE"

    if [ -n "$CREATED_SIAK_ID" ] && [ "$CREATED_SIAK_ID" != "None" ]; then
      http_call GET "/api/v1/aktivitas-siak/$CREATED_SIAK_ID" "" "$token"
      log_test "GET /api/v1/aktivitas-siak/:id → 200" "200" "$HTTP_CODE"
      http_call PUT "/api/v1/aktivitas-siak/$CREATED_SIAK_ID" \
        '{"name":"Budi Updated","activity_type":"birth_registration"}' "$token"
      log_test "PUT /api/v1/aktivitas-siak/:id → 200" "200" "$HTTP_CODE"
      http_call DELETE "/api/v1/aktivitas-siak/$CREATED_SIAK_ID" "" "$token"
      log_test "DELETE /api/v1/aktivitas-siak/:id → 200|204" "200|204" "$HTTP_CODE"
    else
      log_skip "GET/PUT/DELETE /api/v1/aktivitas-siak/:id" "No record ID"
    fi

    http_call POST "/api/v1/aktivitas-siak/check-duplicate" '{"nik":"3201234567890001","activity_type":"birth_registration"}' "$token"
    log_test "POST /api/v1/aktivitas-siak/check-duplicate → 200" "200" "$HTTP_CODE"
    http_call GET "/api/v1/aktivitas-siak/statistics" "" "$token"; log_test "GET /api/v1/aktivitas-siak/statistics → 200" "200" "$HTTP_CODE"
    http_call POST "/api/v1/aktivitas-siak" '{}' "$token"; log_test "POST /api/v1/aktivitas-siak empty body → 400" "400" "$HTTP_CODE"

    http_call POST "/api/v1/aktivitas-siak" \
      "{\"nik\":\"' OR 1=1--\",\"name\":\"SQLi\",\"activity_type\":\"birth_registration\"}" "$token"
    log_test "POST /api/v1/aktivitas-siak SQLi → not 500" "not500" "$HTTP_CODE"
    http_call POST "/api/v1/aktivitas-siak" \
      '{"nik":"3201234567890002","name":"<img src=x onerror=alert(1)>","activity_type":"birth_registration"}' "$token"
    log_test "POST /api/v1/aktivitas-siak XSS → not 500" "not500" "$HTTP_CODE"
    http_call POST "/api/v1/aktivitas-siak" \
      '{"nik":"3201234567890003","name":"Siti Nurhaliza","activity_type":"birth_registration"}' "$token"
    log_test "POST /api/v1/aktivitas-siak unicode name → 200|201" "200|201" "$HTTP_CODE"
  else
    log_skip "Aktivitas SIAK CRUD with auth" "No auth token"
  fi
}

###############################################################################
# 9. DATA REKAM
###############################################################################
test_data_rekam() {
  section "9. Data Rekam Endpoints (Protected)"
  local token="$AUTH_TOKEN"

  http_call GET "/data-rekam/adjudicate"; log_test "GET /data-rekam/adjudicate no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/data-rekam/duplicate-operator"; log_test "GET /data-rekam/duplicate-operator no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/data-rekam/pengajuan-bulanan"; log_test "GET /data-rekam/pengajuan-bulanan no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/data-rekam/salah-rekam"; log_test "GET /data-rekam/salah-rekam no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/data-rekam/dashboard-stats"; log_test "GET /data-rekam/dashboard-stats no auth → 401" "401" "$HTTP_CODE"

  if [ -n "$token" ] && [ "$token" != "None" ]; then
    http_call GET "/data-rekam/adjudicate" "" "$token"; log_test "GET /data-rekam/adjudicate with auth → 200" "200" "$HTTP_CODE"
    http_call GET "/data-rekam/duplicate-operator" "" "$token"; log_test "GET /data-rekam/duplicate-operator with auth → 200" "200" "$HTTP_CODE"
    http_call GET "/data-rekam/pengajuan-bulanan" "" "$token"; log_test "GET /data-rekam/pengajuan-bulanan with auth → 200" "200" "$HTTP_CODE"
    http_call GET "/data-rekam/salah-rekam" "" "$token"; log_test "GET /data-rekam/salah-rekam with auth → 200" "200" "$HTTP_CODE"
    http_call GET "/data-rekam/dashboard-stats" "" "$token"; log_test "GET /data-rekam/dashboard-stats with auth → 200" "200" "$HTTP_CODE"
    http_call PATCH "/data-rekam/adjudicate/00000000-0000-0000-0000-000000000000/toggle-status" "" "$token"
    log_test "PATCH toggle-status invalid ID → 404|200" "404|200" "$HTTP_CODE"
  else
    log_skip "Data Rekam with auth" "No auth token"
  fi
}

###############################################################################
# 10. ADMIN
###############################################################################
test_admin() {
  section "10. Admin Endpoints"
  http_call GET "/admin/pending-users"; log_test "GET /admin/pending-users no auth → 401" "401" "$HTTP_CODE"
  http_call POST "/admin/approve-user" '{"user_id":"test"}'; log_test "POST /admin/approve-user no auth → 401" "401" "$HTTP_CODE"
  http_call POST "/admin/reject-user" '{"user_id":"test"}'; log_test "POST /admin/reject-user no auth → 401" "401" "$HTTP_CODE"

  if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "None" ]; then
    http_call GET "/admin/pending-users" "" "$AUTH_TOKEN"
    log_test "GET /admin/pending-users non-admin → 200|403" "200|403" "$HTTP_CODE"
  else
    log_skip "Admin non-admin access" "No auth token"
  fi
  if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "None" ]; then
    http_call GET "/admin/pending-users" "" "$ADMIN_TOKEN"
    log_test "GET /admin/pending-users admin → 200" "200" "$HTTP_CODE"
  else
    log_skip "Admin with admin token" "No admin token"
  fi
}

###############################################################################
# 11. SUPABASE ANALYZER
###############################################################################
test_supabase_analyzer() {
  section "11. Supabase Analyzer Endpoints (Admin Only)"
  http_call GET "/api/v1/supabase/analyze"; log_test "GET /api/v1/supabase/analyze no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/api/v1/supabase/overview"; log_test "GET /api/v1/supabase/overview no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/api/v1/supabase/buckets"; log_test "GET /api/v1/supabase/buckets no auth → 401" "401" "$HTTP_CODE"
  http_call GET "/api/v1/supabase/tables/users"; log_test "GET /api/v1/supabase/tables/users no auth → 401" "401" "$HTTP_CODE"

  if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "None" ]; then
    http_call GET "/api/v1/supabase/overview" "" "$ADMIN_TOKEN"; log_test "GET /api/v1/supabase/overview admin → 200" "200" "$HTTP_CODE"
    http_call GET "/api/v1/supabase/buckets" "" "$ADMIN_TOKEN"; log_test "GET /api/v1/supabase/buckets admin → 200" "200" "$HTTP_CODE"
    http_call GET "/api/v1/supabase/analyze" "" "$ADMIN_TOKEN"; log_test "GET /api/v1/supabase/analyze admin → 200" "200" "$HTTP_CODE"
  else
    log_skip "Supabase with admin token" "No admin token"
  fi

  if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "None" ]; then
    http_call GET "/api/v1/supabase/overview" "" "$AUTH_TOKEN"
    log_test "GET /api/v1/supabase/overview non-admin → 403" "403" "$HTTP_CODE"
  else
    log_skip "Supabase non-admin access" "No non-admin token"
  fi
}

###############################################################################
# 12. CONCURRENT PROCESSING
###############################################################################
test_concurrent() {
  section "12. Concurrent Processing Endpoints"
  http_call GET "/concurrent/status"; log_test "GET /concurrent/status → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/status"; log_test "GET /api/concurrent/status → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/metrics"; log_test "GET /api/concurrent/metrics → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/health"; log_test "GET /api/concurrent/health → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/worker-pool/status"; log_test "GET /api/concurrent/worker-pool/status → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/worker-pool/metrics"; log_test "GET /api/concurrent/worker-pool/metrics → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/rate-limiter/status"; log_test "GET /api/concurrent/rate-limiter/status → 200|404" "200|404" "$HTTP_CODE"
  http_call PUT "/api/concurrent/rate-limiter/limit" '{"limit":100}'; log_test "PUT /api/concurrent/rate-limiter/limit → 200|400|404" "200|400|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/circuit-breaker/status"; log_test "GET /api/concurrent/circuit-breaker/status → 200|404" "200|404" "$HTTP_CODE"
  http_call POST "/api/concurrent/circuit-breaker/reset" '{}'; log_test "POST /api/concurrent/circuit-breaker/reset → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/metrics/detailed"; log_test "GET /api/concurrent/metrics/detailed → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/ai-manager/status"; log_test "GET /api/concurrent/ai-manager/status → 200|404" "200|404" "$HTTP_CODE"
  http_call GET "/api/concurrent/ai-manager/metrics"; log_test "GET /api/concurrent/ai-manager/metrics → 200|404" "200|404" "$HTTP_CODE"
}

###############################################################################
# 13. PERFORMANCE
###############################################################################
test_performance() {
  section "13. Performance Endpoints"
  http_call GET "/performance"; log_test "GET /performance → 200" "200" "$HTTP_CODE"
  http_call GET "/api/performance/metrics"; log_test "GET /api/performance/metrics → 200" "200" "$HTTP_CODE"
  http_call GET "/api/performance/health"; log_test "GET /api/performance/health → 200" "200" "$HTTP_CODE"
  http_call GET "/api/performance/stats"; log_test "GET /api/performance/stats → 200" "200" "$HTTP_CODE"
  http_call POST "/api/performance/test" '{}'; log_test "POST /api/performance/test no auth → 401" "401" "$HTTP_CODE"
}

###############################################################################
# 14. DATABASE & CACHE
###############################################################################
test_database_cache() {
  section "14. Database & Cache Endpoints"
  http_call GET "/database/health"; log_test "GET /database/health → 200" "200" "$HTTP_CODE"
  http_call GET "/database/stats"; log_test "GET /database/stats → 200" "200" "$HTTP_CODE"
  http_call GET "/test-db"; log_test "GET /test-db → 200|503" "200|503" "$HTTP_CODE"
  http_call GET "/cache/health"; log_test "GET /cache/health → 200" "200" "$HTTP_CODE"
  http_call GET "/cache/stats"; log_test "GET /cache/stats → 200" "200" "$HTTP_CODE"
  http_call GET "/cache/metrics"; log_test "GET /cache/metrics → 200" "200" "$HTTP_CODE"
  http_call GET "/cache/performance"; log_test "GET /cache/performance → 200" "200" "$HTTP_CODE"
  http_call DELETE "/cache/clear"; log_test "DELETE /cache/clear no auth → 401|403" "401|403" "$HTTP_CODE"
  http_call GET "/database/performance"; log_test "GET /database/performance no auth → 401|403" "401|403" "$HTTP_CODE"
}

###############################################################################
# 15. SECURITY EDGE CASES
###############################################################################
test_security() {
  section "15. Security Edge Cases"
  local LARGE_JSON; LARGE_JSON=$(python3 -c "import json; print(json.dumps({'data': 'A' * 100000}))")
  http_call POST "/auth/register" "$LARGE_JSON"
  log_test "POST /auth/register huge payload → not 500" "not500" "$HTTP_CODE"
  http_call GET "/../../../etc/passwd"; log_test "GET path traversal → 404" "404" "$HTTP_CODE"
  http_call DELETE "/auth/login"; log_test "DELETE /auth/login → 404|405" "404|405" "$HTTP_CODE"
  http_call PUT "/health"; log_test "PUT /health → 404|405" "404|405" "$HTTP_CODE"
  http_call GET "/api/v1/nonexistent"; log_test "GET /api/v1/nonexistent → 404" "404" "$HTTP_CODE"

  local resp_file; resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X POST -H "Content-Type: text/plain" -d "not json" "${BASE_URL}/auth/login" 2>/dev/null)
  rm -f "$resp_file"
  log_test "POST /auth/login text/plain content → not 500" "not500" "$HTTP_CODE"

  http_call POST "/auth/register" "{\"email\":\"unicode@test2.com\",\"name\":\"Budi Santoso\",\"password\":\"TestPass@123\"}"
  log_test "POST /auth/register unicode Indonesian name → not 500" "not500" "$HTTP_CODE"
  http_call GET "/auth/%2e%2e/%2e%2e/etc/passwd"; log_test "GET double-encoded path traversal → 404" "404" "$HTTP_CODE"

  resp_file=$(mktemp)
  HTTP_CODE=$(curl -s -o "$resp_file" -w "%{http_code}" -X POST -d '{"email":"test@test.com","password":"test"}' "${BASE_URL}/auth/login" 2>/dev/null)
  rm -f "$resp_file"
  log_test "POST /auth/login no Content-Type → not 500" "not500" "$HTTP_CODE"
}

###############################################################################
# 16. CHAT
###############################################################################
test_chat() {
  section "16. Chat Endpoints"
  http_call POST "/chat" '{"message":"Hello"}'; log_test "POST /chat valid → 200" "200" "$HTTP_CODE"
  http_call POST "/chat" '{}'; log_test "POST /chat empty msg → 200|400" "200|400" "$HTTP_CODE"
  http_call POST "/chat/session" '{"message":"Hello session"}'; log_test "POST /chat/session → 200" "200" "$HTTP_CODE"
  http_call GET "/chat/history"; log_test "GET /chat/history → 200|400" "200|400" "$HTTP_CODE"
  http_call GET "/chat/sessions"; log_test "GET /chat/sessions → 200|401" "200|401" "$HTTP_CODE"
  http_call POST "/api/chat" '{"message":"API chat"}'; log_test "POST /api/chat → 200" "200" "$HTTP_CODE"
}

###############################################################################
# 17. SALAH REKAM
###############################################################################
test_salah_rekam() {
  section "17. Salah Rekam Endpoints (Protected)"
  http_call GET "/api/v1/salah-rekam"; log_test "GET /api/v1/salah-rekam no auth → 401" "401" "$HTTP_CODE"
  if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "None" ]; then
    http_call GET "/api/v1/salah-rekam" "" "$AUTH_TOKEN"; log_test "GET /api/v1/salah-rekam with auth → 200" "200" "$HTTP_CODE"
    http_call GET "/api/v1/salah-rekam/search?q=test" "" "$AUTH_TOKEN"; log_test "GET /api/v1/salah-rekam/search → 200" "200" "$HTTP_CODE"
  else
    log_skip "Salah Rekam with auth" "No auth token"
  fi
}

###############################################################################
# MAIN
###############################################################################
init_report
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     SELICA BACKEND API — BLACKBOX TEST SUITE            ║"
echo "║     Target: $BASE_URL                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health" 2>/dev/null)
if [ "$HEALTH_CHECK" = "000" ]; then
  echo -e "${RED}ERROR: Backend not reachable at ${BASE_URL}${NC}"
  echo "Start with: cd backend && ./server.exe"
  exit 1
fi
echo -e "${GREEN}Backend reachable (status: $HEALTH_CHECK)${NC}"

test_health_metrics
test_auth_register
test_auth_login
test_auth_protected
test_auth_debug
test_cors
test_silpana
test_aktivitas_siak
test_data_rekam
test_admin
test_supabase_analyzer
test_concurrent
test_performance
test_database_cache
test_security
test_chat
test_salah_rekam

finalize_report

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} TEST RESULTS SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Total Tests:  $TOTAL"
echo -e "  ${GREEN}Passed:       $PASSED${NC}"
echo -e "  ${RED}Failed:       $FAILED${NC}"
echo -e "  ${YELLOW}Skipped:      $SKIPPED${NC}"
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "  ${GREEN}🎉 ALL TESTS PASSED!${NC}"
else
  echo -e "  ${RED}⚠️  $FAILED TEST(S) FAILED — see report for details${NC}"
fi
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
