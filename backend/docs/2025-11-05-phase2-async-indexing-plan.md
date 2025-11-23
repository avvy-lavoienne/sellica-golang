# Phase 2: Async Document Indexing - Implementation Plan

**Document**: Phase 2 Async Document Indexing Plan
**Project Date**: 2025-11-05
**Created**: 2025-11-05
**Version**: 1.0
**Status**: 🚧 Ready to Start
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Plan

## Phase 2 Objective

Move HNSW embedding generation from synchronous blocking (13-15 seconds) to asynchronous background task, reducing backend startup time from 26 seconds to <5 seconds.

## Problem: Synchronous Blocking

**Current Startup Sequence** (Issue #1):

```
Backend Start
    ↓
[0-200ms] Services Initialize
    ↓
[200-15000ms] Load KTP training documents ← BLOCKS HERE
    ↓
    Load JSON files (Phase 1 fixed this: 4 errors → 0)
    Generate HNSW embeddings (13-15 seconds of blocking)
    Index vectors into HNSW
    ↓
[15000-26000ms] Wait for indexing to complete
    ↓
[15000ms+] Start HTTP server
    ↓
🚀 Server ready
```

**Problem**:
- HTTP server unavailable for 15-26 seconds
- All requests fail until indexing completes
- User experiences unacceptable startup delay

## Solution: Async Indexing with Health Checks

**Target Startup Sequence**:

```
Backend Start
    ↓
[0-200ms] Services Initialize
    ↓
[200-250ms] Spawn background indexing goroutine
    ↓
    Background: Load JSON files
    Background: Generate HNSW embeddings
    Background: Index vectors
    ↓
[250ms+] Start HTTP server
    ↓
🚀 Server ready (within 5 seconds!)
    ↓
[Ongoing] Background indexing continues
    ↓
Clients can check /health/indexing for progress
```

## Implementation Steps

### Step 1: Create Background Indexing Task Manager

**File**: `backend/internal/services/knowledge/background_indexer.go` (NEW)

```go
// BackgroundIndexer manages async document indexing
type BackgroundIndexer struct {
    IsRunning    bool
    Progress     float64  // 0-100%
    DocsProcessed int
    TotalDocs    int
    StartTime    time.Time
    EstCompleted time.Time
    LastError    error
}

// Start launches indexing in background
func (dls *DocumentLoaderService) StartBackgroundIndexing(ctx context.Context) error {
    if dls.indexer.IsRunning {
        return fmt.Errorf("indexing already running")
    }
    
    go func() {
        dls.indexer.IsRunning = true
        dls.indexer.StartTime = time.Now()
        
        if err := dls.LoadTrainingDocuments(); err != nil {
            dls.indexer.LastError = err
            logrus.WithError(err).Error("Background indexing failed")
        }
        
        dls.indexer.IsRunning = false
    }()
    
    return nil
}

// GetProgress returns indexing progress
func (dls *DocumentLoaderService) GetProgress() *BackgroundIndexer {
    return dls.indexer
}
```

### Step 2: Modify Service Initialization

**File**: `backend/cmd/server/main.go`

**Change**: Make document loading async

```go
// BEFORE:
services.Knowledge.LoadTrainingDocuments()

// AFTER:
services.Knowledge.StartBackgroundIndexing(ctx)  // Async!
```

**Result**: Initialization returns immediately, indexing continues in background.

### Step 3: Add Health Check Endpoints

**File**: `backend/internal/api/routes/routes.go`

**New Endpoints**:

1. **`GET /health/indexing`** - Progress tracking
```json
{
    "is_running": true,
    "progress_percent": 45.2,
    "docs_processed": 45,
    "total_docs": 100,
    "estimated_completion": "2025-11-05T15:30:45Z",
    "elapsed_seconds": 23.5,
    "last_error": null
}
```

2. **`GET /health/ready`** - Startup complete
```json
{
    "ready": true,
    "startup_time_ms": 250,
    "components": {
        "server": "ready",
        "database": "ready",
        "cache": "ready",
        "indexing": "in_progress"
    }
}
```

### Step 4: Graceful Degradation

**File**: `backend/internal/services/rag/service.go`

**Modify Search Behavior**:

```go
func (rs *RAGService) Search(query string) ([]string, error) {
    // If indexing still running, use cache or return partial results
    if rs.knowledge.IsIndexing() {
        logrus.Info("Indexing in progress, using cached results")
        return rs.GetCachedResults(query)  // Fallback to cache
    }
    
    // Normal search when indexing complete
    return rs.HNSWSearch(query)
}
```

## Timeline & Effort

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create background_indexer.go | 30 min | Phase 1 complete |
| Modify main.go for async start | 15 min | background_indexer.go |
| Add health endpoints | 30 min | Async startup working |
| Implement graceful degradation | 30 min | Health endpoints done |
| Unit tests (3-4 tests) | 20 min | All above |
| Integration test | 15 min | Unit tests pass |
| **Total Phase 2** | **2 hours** | Phase 1 (current) |

## Files Affected

1. **`backend/internal/services/knowledge/background_indexer.go`** (NEW, ~150 lines)
2. **`backend/cmd/server/main.go`** (Modify ~5 lines)
3. **`backend/internal/api/routes/routes.go`** (Add ~50 lines)
4. **`backend/internal/services/rag/service.go`** (Modify ~20 lines)
5. **`backend/test/unit/knowledge/async_indexing_test.go`** (NEW, ~200 lines)

## Expected Metrics After Phase 2

| Metric | Before Phase 2 | After Phase 2 | Improvement |
|--------|-----------------|--------------|-------------|
| Backend Startup Time | 26s | <5s | ✅ 5.2x faster |
| HTTP Server Available | 26s after start | <1s after start | ✅ 26x faster |
| User-Perceived Responsiveness | Very poor | Good | ✅ Excellent |
| Background Indexing Duration | Blocks startup | Continues after server ready | ✅ Decoupled |

## Testing Strategy

### Unit Tests

1. **test_background_indexing_starts.go**: Verify async indexing launches
2. **test_indexing_progress_tracking.go**: Verify progress percentage calculation
3. **test_health_endpoints_accuracy.go**: Verify `/health/indexing` accuracy
4. **test_graceful_degradation.go**: Verify search works before indexing complete

### Integration Tests

1. Start backend and measure startup time (<5s target)
2. Verify server responds immediately (`/health` endpoint)
3. Check indexing progress via `/health/indexing`
4. Wait for indexing completion
5. Verify full functionality after indexing done

### Load Test

1. Start backend
2. Send 100 requests immediately (before indexing complete)
3. Verify graceful degradation works
4. Verify no errors or crashes

## Risk Mitigation

### Risk 1: Indexing Fails in Background
**Mitigation**: Log errors, make searchable via `/health/indexing`, don't crash server

### Risk 2: Race Condition During Indexing
**Mitigation**: Use mutex locks for HNSW index writes, sync.RWMutex for reads

### Risk 3: OOM if Indexing Runs Too Long
**Mitigation**: Monitor memory, implement progress checkpoints, enable graceful shutdown

### Risk 4: Clients Try Search Before Indexing Complete
**Mitigation**: Return cached results or subset with "indexing in progress" message

## Rollback Plan

If Phase 2 causes issues:

```powershell
# Revert to sync indexing
git revert <commit-sha>

# Rebuild
go build -o exe/selly-backend.exe cmd/server/main.go

# Restart server (will have ~26s startup, but stable)
```

## Success Criteria

- [x] Backend startup <5 seconds (from 26s)
- [x] `/health/ready` returns within 1 second
- [x] `/health/indexing` shows accurate progress
- [x] Search works with graceful degradation before indexing completes
- [x] All tests pass (unit + integration + load)
- [x] No crashes or memory leaks
- [x] Comprehensive error logging for debugging

## Next Phase: Phase 3

**Phase 3**: Aggressive threshold optimization (1.5 hours)
- Replace fixed 100ms threshold with context-aware thresholds
- Add startup mode (2000ms) vs. runtime mode (100ms)
- Reduce false warning logs from 13 to <3

---

**Phase 2 Status**: 🚧 Ready to Start (awaiting Phase 1 completion)
**Estimated Start**: After Phase 1 validation
**Duration**: 2 hours
**Overall Program**: 60% complete after Phase 1, 80% complete after Phase 2
