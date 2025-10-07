# SILPANA Progress Tracking - Integration Testing Guide

**Document**: Integration Testing Guide for Progress Tracking System
**Project Date**: 2025-10-06
**Created**: 2025-10-06
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: Bilingual (English/Indonesian)
**Audience**: Technical Team
**Type**: Test Documentation

## Executive Summary

Comprehensive integration testing guide for SILPANA progress tracking system, covering database triggers, backend API, frontend components, and end-to-end user flows with detailed test scenarios and validation criteria.

## Prerequisites

### Required Services

- ✅ Supabase database with migrations 008-011 applied
- ✅ Go backend server running on port 8080
- ✅ Next.js frontend running on port 3000
- ✅ Redis cache (optional, will fallback to memory)

### Test Environment Setup

```powershell
# 1. Start backend server
cd backend
go run cmd/server/main.go

# 2. Start frontend (in new terminal)
cd frontend
pnpm dev

# 3. Verify services
curl http://localhost:8080/health        # Backend health check
curl http://localhost:3000               # Frontend health check
```

## Test Scenarios

### Scenario 1: Database Trigger - Auto-Create Progress

**Objective**: Verify that ticket_progress is automatically created when a new ticket is inserted

**Test Steps**:

1. **Insert Test Ticket** (via Supabase SQL Editor):

```sql
-- Insert a test ticket
INSERT INTO silpana (
  ticket_code,
  category,
  nama_lengkap,
  email,
  no_hp,
  alamat_lengkap,
  status
) VALUES (
  'SILPANA-2025-TEST-001',
  'Akta Kelahiran',
  'Test User',
  'test@example.com',
  '08123456789',
  'Jl. Test No. 123',
  'pending'
) RETURNING id, ticket_code;
```

2. **Verify Auto-Created Progress**:

```sql
-- Check if ticket_progress was auto-created
SELECT 
  tp.id,
  tp.ticket_id,
  tp.current_step,
  tp.step_order,
  tp.total_steps,
  tp.completion_percentage,
  tp.created_at
FROM ticket_progress tp
JOIN silpana s ON s.id = tp.ticket_id
WHERE s.ticket_code = 'SILPANA-2025-TEST-001';
```

3. **Verify Status History**:

```sql
-- Check if status_history entry was created
SELECT 
  sh.id,
  sh.new_status,
  sh.step_name,
  sh.step_order,
  sh.guest_visible_message,
  sh.occurred_at
FROM status_history sh
JOIN silpana s ON s.id = sh.ticket_id
WHERE s.ticket_code = 'SILPANA-2025-TEST-001'
ORDER BY sh.occurred_at DESC;
```

**Expected Results**:
- ✅ `ticket_progress` record created with step_order = 1
- ✅ `completion_percentage` = 20 (assuming 5 steps)
- ✅ `status_history` entry created with step_name = 'submission'
- ✅ `guest_visible_message` is meaningful in Indonesian

### Scenario 2: Backend API - GET Progress

**Objective**: Verify backend API returns correct progress data

**Test Steps**:

1. **Test with Valid Ticket Code**:

```powershell
# PowerShell command
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/SILPANA-2025-TEST-001/progress" -Method GET
$response | ConvertTo-Json -Depth 10
```

2. **Test with Invalid Ticket Code**:

```powershell
# Should return 404
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/INVALID-CODE/progress" -Method GET
```

3. **Test Caching** (call twice within 5 minutes):

```powershell
# First call - hits database
Measure-Command { Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/SILPANA-2025-TEST-001/progress" }

# Second call - hits cache (should be faster)
Measure-Command { Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/SILPANA-2025-TEST-001/progress" }
```

**Expected Results**:
- ✅ Valid ticket returns 200 with complete JSON
- ✅ Invalid ticket returns 404 with Indonesian error message
- ✅ Cached response is significantly faster (< 10ms)
- ✅ Response matches `TicketProgressResponse` type

**Sample Expected Response**:

```json
{
  "ticket_id": "uuid-here",
  "ticket_code": "SILPANA-2025-TEST-001",
  "category": "Akta Kelahiran",
  "current_step": "submission",
  "step_order": 1,
  "total_steps": 5,
  "completion_percentage": 20,
  "status_description": "Pengajuan diterima",
  "guest_visible_notes": "...",
  "required_documents": [...],
  "uploaded_documents": [],
  "verified_documents": [],
  "steps": [...],
  "history": [...],
  "created_at": "2025-10-06T...",
  "updated_at": "2025-10-06T..."
}
```

### Scenario 3: Frontend Component - Rendering

**Objective**: Verify frontend components render correctly with real data

**Test Steps**:

1. **Navigate to Progress Page**:
   - Open browser: `http://localhost:3000/silpana/progress/SILPANA-2025-TEST-001`

2. **Verify Visual Elements**:
   - ✅ Header shows "Progress Tiket" with ticket code badge
   - ✅ Auto-refresh info card is visible
   - ✅ Progress bar displays with correct percentage (20%)
   - ✅ Progress bar color is appropriate (gray for low progress)
   - ✅ Step timeline shows 5 steps
   - ✅ First step is marked as current/completed
   - ✅ Other steps are marked as pending
   - ✅ Status history shows initial entry
   - ✅ Document tracker shows required documents
   - ✅ Help card is visible at bottom

3. **Verify Loading State**:
   - Hard refresh (Ctrl+Shift+R)
   - Should see loading skeleton briefly

4. **Verify Error State**:
   - Navigate to: `http://localhost:3000/silpana/progress/INVALID-CODE`
   - Should see error message in Indonesian with retry button

**Expected Behavior**:
- ✅ All components render without console errors
- ✅ Data matches backend API response
- ✅ Indonesian text throughout
- ✅ Responsive design (test on mobile viewport)

### Scenario 4: Auto-Refresh Polling

**Objective**: Verify auto-refresh polling works correctly

**Test Steps**:

1. **Open Progress Page** in browser
2. **Update Ticket in Database**:

```sql
-- Advance the ticket to next step
UPDATE ticket_progress
SET 
  current_step = 'document_verification',
  step_order = 2,
  completion_percentage = 40,
  updated_at = NOW()
WHERE ticket_id IN (
  SELECT id FROM silpana WHERE ticket_code = 'SILPANA-2025-TEST-001'
);

-- Add status history entry
INSERT INTO status_history (
  ticket_id,
  old_status,
  new_status,
  step_name,
  step_order,
  changed_by_name,
  guest_visible_message,
  occurred_at
)
SELECT 
  id,
  'pending',
  'in_progress',
  'document_verification',
  2,
  'Test Staff',
  'Dokumen Anda sedang diverifikasi',
  NOW()
FROM silpana 
WHERE ticket_code = 'SILPANA-2025-TEST-001';
```

3. **Wait 30 Seconds** (polling interval)
4. **Observe Page Update**:
   - Progress bar should update to 40%
   - Step 2 should become current
   - New history entry should appear

**Expected Results**:
- ✅ Page updates automatically without manual refresh
- ✅ No console errors during polling
- ✅ Smooth transitions (no flickering)
- ✅ Cache is invalidated on server side

### Scenario 5: Performance Testing

**Objective**: Verify system performance under load

**Test Steps**:

1. **Backend Load Test** (using Go benchmark):

```powershell
cd backend
go test -bench=BenchmarkGetTicketProgress -benchmem ./scripts/load-testing/
```

2. **Frontend Performance**:
   - Open Chrome DevTools > Lighthouse
   - Run audit on progress page
   - Check metrics:
     - First Contentful Paint < 1.5s
     - Time to Interactive < 3s
     - Cumulative Layout Shift < 0.1

3. **Cache Performance**:

```powershell
# Test cache hit ratio
$cacheStats = Invoke-RestMethod -Uri "http://localhost:8080/cache/stats"
$cacheStats
# Should show hit ratio > 80% after multiple requests
```

**Expected Results**:
- ✅ Backend response time < 50ms (cached)
- ✅ Frontend lighthouse score > 90
- ✅ Cache hit ratio > 80%
- ✅ No memory leaks during polling

### Scenario 6: Error Handling

**Objective**: Verify proper error handling in all scenarios

**Test Cases**:

1. **Backend Down**:
   - Stop backend server
   - Navigate to progress page
   - Should show: "Gagal mengambil data. Klik untuk mencoba lagi"
   - Click retry button
   - Should attempt to reload

2. **Database Connection Lost**:
   - Kill database connection temporarily
   - API should return 500 with graceful error

3. **Invalid Data**:
   - Corrupt ticket_progress data
   - Frontend should handle gracefully

4. **Network Timeout**:
   - Throttle network in DevTools
   - Verify loading states and timeouts

**Expected Results**:
- ✅ All errors show Indonesian user messages
- ✅ Technical errors logged to console
- ✅ Retry mechanisms work
- ✅ No crashes or white screens

## Integration Checklist

### Database Layer

- [ ] Migrations 008-011 applied successfully
- [ ] Auto-create trigger fires on ticket INSERT
- [ ] 20 default steps populated
- [ ] RLS policies allow anon SELECT
- [ ] Indexes optimize query performance

### Backend Layer

- [ ] `/api/v1/silpana/tickets/:code/progress` endpoint functional
- [ ] Returns 200 with valid data
- [ ] Returns 404 for invalid codes
- [ ] 5-minute caching works correctly
- [ ] Error messages in Indonesian
- [ ] Metrics recorded properly

### Frontend Layer

- [ ] Progress page accessible at `/silpana/progress/[code]`
- [ ] All 5 components render correctly
- [ ] Auto-polling works (30s interval)
- [ ] Loading states display properly
- [ ] Error states with retry work
- [ ] Responsive design on mobile
- [ ] Indonesian localization complete

### End-to-End

- [ ] Create ticket → Progress auto-generated
- [ ] View progress → Data displays correctly
- [ ] Update progress → Changes reflect in UI
- [ ] Poll for updates → Auto-refresh works
- [ ] Error scenarios → Graceful degradation

## Manual Testing Script

```powershell
# ========================================
# SILPANA Progress Tracking - Manual Test
# ========================================

Write-Host "`n🧪 Starting Manual Integration Test..." -ForegroundColor Cyan

# Test 1: Create test ticket
Write-Host "`n1️⃣  Creating test ticket..." -ForegroundColor Yellow
$ticketCode = "SILPANA-2025-TEST-$(Get-Date -Format 'HHmmss')"
Write-Host "   Ticket code: $ticketCode" -ForegroundColor Gray
Write-Host "   TODO: Insert ticket in Supabase SQL Editor" -ForegroundColor Gray

# Test 2: Check backend API
Write-Host "`n2️⃣  Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$ticketCode/progress"
    Write-Host "   ✅ API returned 200" -ForegroundColor Green
    Write-Host "   Completion: $($response.completion_percentage)%" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Open frontend
Write-Host "`n3️⃣  Opening frontend..." -ForegroundColor Yellow
$url = "http://localhost:3000/silpana/progress/$ticketCode"
Write-Host "   URL: $url" -ForegroundColor Cyan
Start-Process $url

# Test 4: Performance
Write-Host "`n4️⃣  Testing performance..." -ForegroundColor Yellow
$time1 = Measure-Command { Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$ticketCode/progress" }
Write-Host "   First call: $($time1.TotalMilliseconds)ms" -ForegroundColor Gray
$time2 = Measure-Command { Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$ticketCode/progress" }
Write-Host "   Cached call: $($time2.TotalMilliseconds)ms" -ForegroundColor Gray

Write-Host "`n✅ Manual test complete!" -ForegroundColor Green
Write-Host "Please verify frontend display manually.`n" -ForegroundColor Gray
```

## Troubleshooting

### Issue: Progress Not Auto-Created

**Symptoms**: New ticket inserted but no ticket_progress record

**Solution**:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_ticket_progress';

-- Manually trigger for existing ticket
SELECT auto_create_ticket_progress('ticket-id-here');
```

### Issue: API Returns 404

**Symptoms**: Frontend shows "Data tidak ditemukan"

**Checks**:
1. Verify ticket exists: `SELECT * FROM silpana WHERE ticket_code = '...'`
2. Verify progress exists: `SELECT * FROM ticket_progress WHERE ticket_id = '...'`
3. Check backend logs for errors

### Issue: Polling Not Working

**Symptoms**: Page doesn't auto-update after 30s

**Checks**:
1. Open DevTools Network tab
2. Look for repeated requests every 30s
3. Check console for errors
4. Verify `enablePolling={true}` prop

### Issue: Cache Not Invalidating

**Symptoms**: Old data persists after database update

**Solution**:
```powershell
# Clear Redis cache
redis-cli FLUSHDB

# Or restart backend to clear memory cache
```

## Performance Targets

### Backend

- Response time (cached): < 10ms
- Response time (uncached): < 50ms
- Cache hit ratio: > 85%
- Error rate: 0%

### Frontend

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse score: > 90
- Bundle size: < 500KB

### Database

- Query time: < 30ms
- Trigger execution: < 5ms
- Index usage: 100%

## Next Steps

1. ✅ Complete Scenario 1-6 tests
2. ✅ Document any bugs found
3. ✅ Fix critical issues
4. ⏳ Prepare for Day 5 deployment
5. ⏳ User acceptance testing (UAT)

## References

- [Backend API Documentation](../../backend/README.md)
- [Frontend Component Docs](../../frontend/docs/)
- [Database Schema](../../backend/migrations/)
- [Test Utils](../../frontend/src/lib/test-utils/silpana-progress-mocks.ts)

---

**Last Updated**: 2025-10-06
**Phase**: Day 4 - Integration & Testing
**Status**: Ready for Testing ✅
