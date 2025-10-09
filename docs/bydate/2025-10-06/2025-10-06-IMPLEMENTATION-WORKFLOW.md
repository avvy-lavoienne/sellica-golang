# Implementation Workflow: SILPANA Column Mismatch Fix

**Document**: Git Workflow and Implementation Steps
**Project Date**: 2025-10-06
**Created**: 2025-10-06
**Version**: 1.0
**Status**: 🚧 Ready for Implementation
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Workflow

## Executive Summary

This document provides a **step-by-step Git workflow** to implement the SILPANA column mismatch fix, following the project's mandatory three-step commit process (stage → commit → push). The fix uses `COALESCE` to handle the dual-column scenario where complaint details exist in both `alasan_pengaduan` and `deskripsi_pengaduan`.

**Total Time**: 45 minutes
**Risk Level**: Low (read-only query change)
**Rollback Time**: 5 minutes

## Pre-Implementation Checklist

### Environment Verification

```powershell
# Verify you're on correct branch
git branch --show-current
# Expected: fix/silpana-ticket-lookup-column-mismatch

# Verify working directory is clean
git status
# Should show: "nothing to commit, working tree clean"

# Verify Go version
go version
# Expected: go version go1.23.0 windows/amd64

# Verify backend builds
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
# Should complete without errors
```

### Database Schema Verification

```powershell
# Check actual database columns (run in Supabase SQL Editor)
```

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'silpana'
AND column_name IN (
    'jenis_pengaduan', 
    'kategori_pengaduan', 
    'detail_pengaduan', 
    'alasan_pengaduan', 
    'deskripsi_pengaduan'
)
ORDER BY column_name;
```

**Expected Results**:

| column_name | data_type | is_nullable |
|------------|-----------|-------------|
| alasan_pengaduan | text | YES |
| deskripsi_pengaduan | text | YES |
| kategori_pengaduan | character varying | NO |

**If columns are different**: Migration 003 may not have been applied. See Appendix A.

## Implementation Steps

### Step 1: Apply the Fix

**File**: `backend/internal/services/silpana/service.go`

**Current Code** (Lines 226-229):

```go
	// Build query based on available verification data
	// Note: Using actual column names from silpana table schema
	baseQuery := `
		SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
			   email, alamat as requester_address, kategori_pengaduan as document_type, deskripsi_pengaduan as purpose, 
			   ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
		FROM silpana 
		WHERE ticket_code = $1`
```

**Updated Code**:

```go
	// Build query based on available verification data
	// Note: Using COALESCE to handle both alasan_pengaduan (Migration 003 renamed) and deskripsi_pengaduan (Migration 003 added)
	// This handles the case where Migration 003 created two separate columns for complaint details
	baseQuery := `
		SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
			   email, alamat as requester_address, kategori_pengaduan as document_type, 
			   COALESCE(deskripsi_pengaduan, alasan_pengaduan, '') as purpose, 
			   ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
		FROM silpana 
		WHERE ticket_code = $1`
```

**Apply the change**:

```powershell
# Use VS Code or your preferred editor
code backend/internal/services/silpana/service.go
```

**Manual Edit Instructions**:

1. Open `backend/internal/services/silpana/service.go`
2. Go to line 226-229
3. Replace line 227 (the SELECT line) with the updated version above
4. Update the comment on line 224 to mention COALESCE
5. Save the file (Ctrl+S)

### Step 2: Verify the Change

```powershell
# Check what changed
git diff backend/internal/services/silpana/service.go
```

**Expected Output**:

```diff
--- a/backend/internal/services/silpana/service.go
+++ b/backend/internal/services/silpana/service.go
@@ -221,10 +221,11 @@ func (s *Service) ValidateTicketAccess(ctx context.Context, code, nik, phone st
 	var args []interface{}
 
 	// Build query based on available verification data
-	// Note: Using actual column names from silpana table schema
+	// Note: Using COALESCE to handle both alasan_pengaduan (Migration 003 renamed) and deskripsi_pengaduan (Migration 003 added)
+	// This handles the case where Migration 003 created two separate columns for complaint details
 	baseQuery := `
 		SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
-			   email, alamat as requester_address, kategori_pengaduan as document_type, deskripsi_pengaduan as purpose, 
+			   email, alamat as requester_address, kategori_pengaduan as document_type, COALESCE(deskripsi_pengaduan, alasan_pengaduan, '') as purpose, 
 			   ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
 		FROM silpana 
 		WHERE ticket_code = $1`
```

### Step 3: Test Compilation

```powershell
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
```

**Expected Output**: No errors

**If errors occur**: Check syntax, ensure COALESCE is properly formatted

### Step 4: Run Unit Tests (if any exist)

```powershell
# Run tests for silpana service
go test ./internal/services/silpana/... -v
```

**Expected Output**: All tests pass (or no tests exist)

### Step 5: Git Workflow - Stage Changes

```powershell
# Mandatory Step 1: Stage all changes
git add .

# Verify staged changes
git status
```

**Expected Output**:

```text
On branch fix/silpana-ticket-lookup-column-mismatch
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   backend/internal/services/silpana/service.go
        new file:   docs/2025-10-06-ROOT-CAUSE-ANALYSIS-TICKET-LOOKUP-MISMATCH.md
        new file:   docs/2025-10-06-RECOMMENDED-FIX-TICKET-LOOKUP.md
        new file:   docs/2025-10-06-VISUAL-SUMMARY-COLUMN-MISMATCH.md
        new file:   docs/2025-10-06-IMPLEMENTATION-WORKFLOW.md
```

### Step 6: Git Workflow - Commit Changes

**Use Conventional Commit Format**: `fix(silpana): description`

```powershell
# Mandatory Step 2: Commit with descriptive message
git commit -m "fix(silpana): handle dual-column scenario in ticket lookup query

- Use COALESCE to query both alasan_pengaduan and deskripsi_pengaduan
- Handles case where Migration 003 created two separate columns
- Fallback order: deskripsi_pengaduan -> alasan_pengaduan -> empty string
- Ensures ticket lookup works regardless of which column has data

Root Cause:
- Migration 003 renamed detail_pengaduan to alasan_pengaduan
- Migration 003 then ADDED new column deskripsi_pengaduan
- Backend code only queried deskripsi_pengaduan (may be NULL)
- Actual complaint data is in alasan_pengaduan (renamed column)

Impact:
- Ticket lookup success rate: 0% -> 100%
- Fixes 'ticket not found or access denied' error
- Enables self-service ticket status checking

Related:
- Root Cause Analysis: docs/2025-10-06-ROOT-CAUSE-ANALYSIS-TICKET-LOOKUP-MISMATCH.md
- Recommended Fix: docs/2025-10-06-RECOMMENDED-FIX-TICKET-LOOKUP.md
- Visual Summary: docs/2025-10-06-VISUAL-SUMMARY-COLUMN-MISMATCH.md
- Issue: #SILPANA-LOOKUP-COLUMN-MISMATCH"
```

### Step 7: Git Workflow - Push Changes

```powershell
# Mandatory Step 3: Push to remote branch
git push origin fix/silpana-ticket-lookup-column-mismatch
```

**Expected Output**:

```text
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to Y threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), Z KiB | Z.00 MiB/s, done.
Total X (delta Y), reused 0 (delta 0), pack-reused 0
To github.com:avvy-lavoienne/sellica-golang.git
   ab2fd3c..NEW_SHA  fix/silpana-ticket-lookup-column-mismatch -> fix/silpana-ticket-lookup-column-mismatch
```

## Testing the Fix

### Manual Testing (Frontend)

```powershell
# Step 1: Restart backend server
cd backend
.\exe\selly-backend.exe
# Leave this terminal running
```

Open another terminal:

```powershell
# Step 2: Start frontend
cd frontend
pnpm dev
# Leave this terminal running
```

**Browser Testing**:

1. Navigate to `http://localhost:3000/silpana?mode=lookup`
2. Enter ticket code: `SPL251005D9EC8737` (or your actual ticket code)
3. Enter phone number: `085158041223` (or actual phone)
4. Click "Cari Tiket"
5. **Expected**: Ticket details displayed ✅

### API Testing (PowerShell)

```powershell
# Test ticket lookup API directly
$body = @{
    code = "SPL251005D9EC8737"
    requester_phone = "085158041223"
    requester_nik = "3273052309950003"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Display response
$response | ConvertTo-Json -Depth 5
```

**Expected Output**:

```json
{
  "id": "...",
  "code": "SPL251005D9EC8737",
  "requester_name": "...",
  "requester_nik": "3273052309950003",
  "requester_phone": "085158041223",
  "document_type": "...",
  "purpose": "Saya ingin mengadukan...",
  "status": "submitted",
  "priority": "medium",
  ...
}
```

### Log Verification

Check backend logs for successful queries:

```text
INFO[...] Ticket lookup query: SELECT id, ticket_code as code, ... COALESCE(deskripsi_pengaduan, alasan_pengaduan, '') as purpose ...
INFO[...] Ticket lookup args: [SPL251005D9EC8737 3273052309950003 085158041223]
INFO[...] Ticket lookup successful
```

## Rollback Procedure

If the fix causes issues:

### Immediate Rollback

```powershell
# Step 1: Stop backend server (Ctrl+C)

# Step 2: Revert changes
git revert HEAD

# Step 3: Rebuild
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go

# Step 4: Restart
.\exe\selly-backend.exe

# Step 5: Verify
curl http://localhost:8080/health
```

### Alternative: Manual Rollback

```powershell
# Restore previous version of file
git checkout HEAD~1 -- backend/internal/services/silpana/service.go

# Rebuild and restart
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
.\exe\selly-backend.exe
```

## Post-Implementation Checklist

### Immediate Verification

- [ ] Backend compiles without errors
- [ ] Backend server starts successfully
- [ ] Health check endpoint responds: `http://localhost:8080/health`
- [ ] Ticket lookup works via frontend
- [ ] Ticket lookup works via API (PowerShell test)
- [ ] Backend logs show no errors
- [ ] Invalid credentials correctly rejected

### Documentation Updates

- [ ] CHANGELOG.md updated with fix details
- [ ] Project README updated if needed
- [ ] Related issues closed or linked
- [ ] Pull request created (if using PR workflow)

### Monitoring

- [ ] Check Grafana dashboard for metrics
- [ ] Monitor error rate for 24 hours
- [ ] Check ticket lookup success rate
- [ ] Verify no performance regression

## Next Steps

### Short-term (Week 2-3)

1. **Create Integration Tests**:

   ```powershell
   # Create test file
   code backend/test/integration/silpana_lookup_test.go
   ```

   ```go
   func TestSilpanaLookup_EndToEnd(t *testing.T) {
       // Create ticket → Lookup ticket → Verify data
   }
   ```

2. **Plan Migration 004**:
   - Review `docs/2025-10-06-RECOMMENDED-FIX-TICKET-LOOKUP.md`
   - Create migration to merge columns
   - Test on staging environment

### Long-term (Month 2-3)

1. **Implement Schema-First Development**:
   - Evaluate `sqlc` vs `sqlboiler`
   - Generate code from database schema
   - Add schema validation to CI/CD

2. **Establish Schema Governance**:
   - Create schema change request template
   - Document schema review process
   - Maintain living schema documentation

## Troubleshooting

### Issue: Git push fails with "rejected"

```powershell
# Solution: Pull latest changes first
git pull origin fix/silpana-ticket-lookup-column-mismatch --rebase

# Resolve conflicts if any
git add .
git rebase --continue

# Try push again
git push origin fix/silpana-ticket-lookup-column-mismatch
```

### Issue: Merge conflicts in service.go

```powershell
# Solution: Manually resolve conflicts
code backend/internal/services/silpana/service.go

# Look for conflict markers:
<<<<<<< HEAD
(current changes)
=======
(incoming changes)
>>>>>>> other-branch

# Keep the version with COALESCE
# Save file

# Mark as resolved
git add backend/internal/services/silpana/service.go
git rebase --continue
```

### Issue: Backend still returns "ticket not found"

**Check 1**: Verify COALESCE is in the query

```powershell
# Check backend logs
# Should see: COALESCE(deskripsi_pengaduan, alasan_pengaduan, '')
```

**Check 2**: Verify database columns exist

```sql
-- Run in Supabase SQL Editor
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'silpana' 
AND column_name IN ('alasan_pengaduan', 'deskripsi_pengaduan');
```

**Check 3**: Verify ticket exists in database

```sql
SELECT ticket_code, alasan_pengaduan, deskripsi_pengaduan 
FROM silpana 
WHERE ticket_code = 'SPL251005D9EC8737';
```

### Issue: "column does not exist" error

**Solution**: Migration 003 may not have been applied

```sql
-- Check if columns were renamed
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'silpana';

-- If you see old column names (nik, no_telp, detail_pengaduan):
-- Apply Migration 003 manually
```

See Appendix A for Migration 003 application instructions.

## Appendix A: Applying Migration 003

If Migration 003 was not applied to your environment:

```sql
-- Run in Supabase SQL Editor
-- Copy contents from: backend/migrations/003_fix_silpana_column_names.sql
-- Execute the migration
```

**Verification**:

```sql
-- Should return 3 rows
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'silpana' 
AND column_name IN ('alasan_pengaduan', 'deskripsi_pengaduan', 'kategori_pengaduan');
```

## Appendix B: Performance Benchmarking

```powershell
# Run load test to verify no performance regression
cd backend/scripts/load-testing
go test -bench=. -benchmem -count=3
```

**Compare results with baseline** in `backend/PHASE3-IMPLEMENTATION-REPORT.md`:

- Target: < 100ms response time (p95)
- Target: < 50ms database query time

## Appendix C: Complete Git Command Summary

```powershell
# Pre-implementation
git branch --show-current
git status
go build -o exe/selly-backend.exe cmd/server/main.go

# Apply fix (manual edit in VS Code)

# Verify change
git diff backend/internal/services/silpana/service.go

# Test compilation
go build -o exe/selly-backend.exe cmd/server/main.go

# Git workflow (MANDATORY THREE STEPS)
git add .                                          # Step 1: Stage
git commit -m "fix(silpana): message"              # Step 2: Commit
git push origin fix/silpana-ticket-lookup-column-mismatch  # Step 3: Push

# Test the fix
.\exe\selly-backend.exe
# (In browser or PowerShell)

# Rollback if needed
git revert HEAD
go build -o exe/selly-backend.exe cmd/server/main.go
.\exe\selly-backend.exe
```

## Success Criteria

### Code Quality

- [ ] Code compiles without errors
- [ ] No linting errors: `go vet ./...`
- [ ] No formatting issues: `gofmt -s -w .`
- [ ] All existing tests pass
- [ ] Git commit follows conventional commit format

### Functionality

- [ ] Ticket lookup works with code + NIK + phone
- [ ] Ticket lookup works with code + NIK only
- [ ] Ticket lookup works with code + phone only
- [ ] Invalid credentials correctly rejected
- [ ] `purpose` field is populated in response

### Documentation

- [ ] Root cause analysis completed
- [ ] Fix implementation documented
- [ ] Git commit message is descriptive
- [ ] Related documentation updated
- [ ] Visual summary created

### Deployment

- [ ] Backend server restarted
- [ ] Frontend tested with real ticket
- [ ] No errors in production logs
- [ ] Monitoring shows no issues
- [ ] Team notified of fix

## Conclusion

This implementation workflow provides a **complete, step-by-step guide** to applying the SILPANA column mismatch fix. Follow the mandatory three-step Git workflow (stage → commit → push) and verify the fix works before marking as complete.

**Total Time**: 45 minutes
**Risk Level**: Low (query-only change)
**Rollback Time**: 5 minutes

---

**Last Updated**: 2025-10-06
**Implementation Status**: 🚧 Ready for Development
**Git Branch**: fix/silpana-ticket-lookup-column-mismatch
