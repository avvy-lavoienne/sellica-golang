# Implementation Plan: Indexing Performance Optimization

**Document**: 3-Phase Implementation Plan for Backend Startup Performance
**Project Date**: 2025-11-05
**Created**: 2025-11-05
**Version**: 1.0
**Status**: 🚀 Ready - Implementation Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Plan

## Overview

Three-phase implementation plan to reduce backend startup time from **26 seconds to <5 seconds** by fixing JSON parsing errors, implementing async indexing, and adjusting performance thresholds.

### Phase Priorities

1. **Phase 1 (IMMEDIATE)**: Fix JSON parsing errors - Restores training data, eliminates 4 error logs
2. **Phase 2 (CONCURRENT)**: Implement async indexing - Moves indexing to background after server starts
3. **Phase 3 (POLISH)**: Optimize thresholds and monitoring - Contextual performance checks

**Total Implementation Time**: ~6 hours
**Risk Level**: Low (changes isolated to initialization code)
**Rollback Plan**: Simple code revert, no data migrations

---

## Phase 1: Fix JSON Training Data Parsing Errors

**Estimated Time**: 1.5 hours
**Impact**: Restores ~18 KTP training pairs, eliminates 4 error logs
**Risk**: Low - no production impact, isolated to startup code

### 1.1 Problem Statement

Two JSON file structures are incompatible with the current Go struct definition:

**Current decoder** (line 806-807 in `document_loader.go`):
```go
var jsonData []JSONTrainingData  // Expects array
decoder := json.NewDecoder(file)
if err := decoder.Decode(&jsonData); err != nil {
    return nil, fmt.Errorf("failed to decode JSON: %w", err)
}
```

**JSON files have two different structures**:

Structure 1 - `index.json`: Object with metadata
```json
{
  "service": "ktp",
  "research_material": "ktp_dr.md",
  "training_categories": [
    { "file": "...", "category": "...", "priority": "high" }
  ]
}
```

Structure 2 - `ktp-training-pairs.json`: Object with wrapper
```json
{
  "metadata": { "source": "...", "created": "...", "total_pairs": 18 },
  "training_pairs": [
    { "query": "...", "expectedResponse": "...", "category": "..." }
  ]
}
```

**Solution**: Create wrapper structs and flexible decoder that handles both formats.

### 1.2 Code Changes

**File**: `backend/internal/services/knowledge/document_loader.go`

**Change 1: Add wrapper structs** (after line 82, JSONTrainingData definition)

```go
// JSONTrainingDataIndex represents the index.json structure
type JSONTrainingDataIndex struct {
    Service              string                      `json:"service"`
    ResearchMaterial     string                      `json:"research_material"`
    TrainingCategories   []map[string]interface{}   `json:"training_categories"`
    TotalTrainingPairs   int                         `json:"total_training_pairs"`
    LastUpdated          string                      `json:"last_updated"`
}

// JSONTrainingDataWrapper represents the ktp-training-pairs.json structure
type JSONTrainingDataWrapper struct {
    Metadata        map[string]interface{} `json:"metadata"`
    TrainingPairs   []JSONTrainingData     `json:"training_pairs"`
}
```

**Change 2: Replace readJSONTrainingFile function** (replace lines 796-823)

```go
// readJSONTrainingFile reads and parses JSON training data files
// Handles multiple JSON structures (index.json, training-pairs.json, etc.)
func (dls *DocumentLoaderService) readJSONTrainingFile(filePath string) (*JSONTrainingDataFile, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    // Read raw JSON data to detect structure
    var rawData map[string]interface{}
    decoder := json.NewDecoder(file)
    if err := decoder.Decode(&rawData); err != nil {
        return nil, fmt.Errorf("failed to decode JSON: %w", err)
    }

    var jsonData []JSONTrainingData

    // Detect JSON structure based on top-level keys
    if _, hasTrainingPairs := rawData["training_pairs"]; hasTrainingPairs {
        // Structure 2: Object with training_pairs array (ktp-training-pairs.json)
        jsonBytes, _ := json.Marshal(rawData)
        var wrapper JSONTrainingDataWrapper
        if err := json.Unmarshal(jsonBytes, &wrapper); err != nil {
            return nil, fmt.Errorf("failed to unmarshal training_pairs structure: %w", err)
        }
        jsonData = wrapper.TrainingPairs
        logrus.WithFields(logrus.Fields{
            "file_path": filePath,
            "structure": "training_pairs_wrapper",
            "pairs_count": len(jsonData),
        }).Debug("📖 Parsed training_pairs JSON structure")
    } else if _, hasTrainingCategories := rawData["training_categories"]; hasTrainingCategories {
        // Structure 1: Index object (index.json) - extract categories
        // Note: index.json references other files, so we log but don't extract data here
        logrus.WithFields(logrus.Fields{
            "file_path": filePath,
            "structure": "index_metadata",
            "categories": len(rawData["training_categories"].([]interface{})),
        }).Debug("📖 Parsed index metadata structure (training files referenced separately)")
        jsonData = []JSONTrainingData{} // Empty for index files
    } else if _, hasData := rawData["data"]; hasData {
        // Structure 3: Direct data array wrapped in object (fallback)
        jsonBytes, _ := json.Marshal(rawData["data"])
        if err := json.Unmarshal(jsonBytes, &jsonData); err != nil {
            return nil, fmt.Errorf("failed to unmarshal data array structure: %w", err)
        }
        logrus.WithFields(logrus.Fields{
            "file_path": filePath,
            "structure": "data_array",
            "items_count": len(jsonData),
        }).Debug("📖 Parsed data array JSON structure")
    } else {
        // Try to unmarshal as direct array of JSONTrainingData (Structure 4)
        jsonBytes, _ := json.Marshal(rawData)
        if err := json.Unmarshal(jsonBytes, &jsonData); err != nil {
            logrus.WithFields(logrus.Fields{
                "file_path": filePath,
                "available_keys": getMapKeys(rawData),
                "error": err.Error(),
            }).Warn("⚠️ Could not determine JSON structure - skipping file")
            return nil, fmt.Errorf("unknown JSON structure in file: %s", filePath)
        }
    }

    serviceType := dls.extractServiceTypeFromJSONPath(filePath)

    return &JSONTrainingDataFile{
        FilePath:    filePath,
        ServiceType: serviceType,
        Data:        jsonData,
        LastUpdated: time.Now(),
    }, nil
}

// Helper function to get map keys for debugging
func getMapKeys(m map[string]interface{}) []string {
    keys := make([]string, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```

**Change 3: Update JSON loading call** (line 738)

Current:
```go
jsonData, err := dls.readJSONTrainingFile(filePath)
if err != nil {
    logrus.WithError(err).WithField("file_path", filePath).Error("❌ Failed to read JSON training file")
    return fmt.Errorf("failed to read JSON training file: %w", err)
}
```

New:
```go
jsonData, err := dls.readJSONTrainingFile(filePath)
if err != nil {
    logrus.WithError(err).WithField("file_path", filePath).Warn("⚠️ Could not parse JSON training file (may be index file, continuing)")
    // Don't return error - some JSON files are just indices that reference other files
    return nil  // Skip this file, not a fatal error
}

// Skip index files that have no training data
if len(jsonData.Data) == 0 {
    logrus.WithField("file_path", filePath).Debug("ℹ️ Skipping JSON file with no training data (likely index metadata)")
    return nil
}
```

### 1.3 Testing (Phase 1)

**Test 1: Verify KTP training pairs parse**
```bash
# After changes, backend should start without KTP parse errors
go run cmd/server/main.go 2>&1 | grep -i "ktp.*error"
# Expected: No error lines
```

**Test 2: Verify training data loads**
```bash
curl http://localhost:8080/health | jq '.components.knowledge_service'
# Expected: documents_loaded should include KTP data
```

### 1.4 Success Criteria (Phase 1)

- [ ] Zero JSON parse errors in logs (was 4)
- [ ] KTP training pairs successfully indexed
- [ ] Backend startup time reduced by ~3-4 seconds (estimated)
- [ ] No functional regressions in other services

---

## Phase 2: Implement Async Document Indexing

**Estimated Time**: 2 hours
**Impact**: Reduces startup time from 20s to <5s, server responds immediately
**Risk**: Low - uses standard Go patterns, isolated to doc loading

### 2.1 Problem Statement

Current issue: All document indexing happens synchronously during `InitializeServices()`, blocking server startup.

```
InitializeServices()
  └─ DocumentLoader.LoadTrainingDocuments()
      └─ for 52 documents
          └─ generateEmbeddings() [BLOCKS 10-15 seconds here]
      └─ return
  └─ return
StartServer() [happens now, after documents indexed]
```

Goal: Start server immediately, index documents in background.

```
InitializeServices()
  └─ DocumentLoader.LoadTrainingDocuments()  [triggers background job]
      └─ return immediately
      └─ spawn goroutine for actual indexing
StartServer() [happens immediately]
  └─ Ready to serve requests while docs still indexing in background
```

### 2.2 Code Changes

**File**: `backend/internal/services/knowledge/document_loader.go`

**Change 1: Add background indexing state** (after DocumentLoaderService struct definition, line ~100)

```go
// BackgroundIndexingJob tracks background indexing progress
type BackgroundIndexingJob struct {
    Status          string    // "pending", "running", "completed", "failed"
    TotalDocuments  int
    IndexedDocuments int
    FailedDocuments int
    StartTime       time.Time
    EndTime         time.Time
    Error           error
    mu              sync.Mutex
}

// Add to DocumentLoaderService struct:
// backgroundJob *BackgroundIndexingJob
```

**Change 2: Update InitializeDocumentLoading** (new function, call from main initialization)

```go
// InitializeDocumentLoadingAsync triggers document loading in background
// Returns immediately after starting background job, doesn't block startup
func (dls *DocumentLoaderService) InitializeDocumentLoadingAsync() {
    dls.backgroundJob = &BackgroundIndexingJob{
        Status:    "pending",
        StartTime: time.Now(),
    }

    // Count documents first
    documentPaths := dls.getDocumentPaths()
    dls.backgroundJob.TotalDocuments = len(documentPaths)

    logrus.WithFields(logrus.Fields{
        "total_documents": dls.backgroundJob.TotalDocuments,
    }).Info("🚀 Starting background document indexing...")

    // Start indexing in goroutine - doesn't block
    go dls.backgroundIndexingWorker(documentPaths)
}

// backgroundIndexingWorker performs document indexing in background
func (dls *DocumentLoaderService) backgroundIndexingWorker(documentPaths []string) {
    dls.backgroundJob.mu.Lock()
    dls.backgroundJob.Status = "running"
    dls.backgroundJob.mu.Unlock()

    for i, docPath := range documentPaths {
        // Load each document with timeout
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        err := dls.loadDocumentWithContext(ctx, docPath)
        cancel()

        dls.backgroundJob.mu.Lock()
        if err != nil {
            dls.backgroundJob.FailedDocuments++
            logrus.WithError(err).WithFields(logrus.Fields{
                "file_path": docPath,
                "progress": fmt.Sprintf("%d/%d", i+1, len(documentPaths)),
            }).Warn("⚠️ Failed to load document in background")
        } else {
            dls.backgroundJob.IndexedDocuments++
        }
        dls.backgroundJob.mu.Unlock()

        // Log progress every 10 documents
        if (i+1)%10 == 0 {
            dls.backgroundJob.mu.Lock()
            logrus.WithFields(logrus.Fields{
                "indexed": dls.backgroundJob.IndexedDocuments,
                "failed": dls.backgroundJob.FailedDocuments,
                "total": dls.backgroundJob.TotalDocuments,
                "progress": fmt.Sprintf("%d%%", (i+1)*100/len(documentPaths)),
            }).Info("📊 Background indexing progress")
            dls.backgroundJob.mu.Unlock()
        }
    }

    dls.backgroundJob.mu.Lock()
    dls.backgroundJob.Status = "completed"
    dls.backgroundJob.EndTime = time.Now()
    duration := dls.backgroundJob.EndTime.Sub(dls.backgroundJob.StartTime)
    dls.backgroundJob.mu.Unlock()

    logrus.WithFields(logrus.Fields{
        "total": dls.backgroundJob.TotalDocuments,
        "indexed": dls.backgroundJob.IndexedDocuments,
        "failed": dls.backgroundJob.FailedDocuments,
        "duration": duration,
    }).Info("✅ Background document indexing completed")
}

// GetBackgroundIndexingStatus returns current status of background indexing
func (dls *DocumentLoaderService) GetBackgroundIndexingStatus() BackgroundIndexingJob {
    dls.backgroundJob.mu.Lock()
    defer dls.backgroundJob.mu.Unlock()
    return *dls.backgroundJob
}
```

**Change 3: Update main.go initialization** (in `cmd/server/main.go`)

Old code:
```go
// Load training documents synchronously (blocking)
documentLoaderService.LoadTrainingDocuments()
```

New code:
```go
// Load training documents asynchronously (non-blocking)
documentLoaderService.InitializeDocumentLoadingAsync()
logrus.Info("📚 Document indexing started in background, server ready immediately")
```

**Change 4: Add health check endpoint** (in `api/routes/routes.go`)

```go
// GET /health/indexing - Returns background indexing status
func HandleIndexingStatus(c *gin.Context) {
    if documentLoaderService == nil {
        c.JSON(http.StatusOK, gin.H{
            "status": "unknown",
            "message": "Document loader service not initialized",
        })
        return
    }

    status := documentLoaderService.GetBackgroundIndexingStatus()
    c.JSON(http.StatusOK, gin.H{
        "status": status.Status,
        "total_documents": status.TotalDocuments,
        "indexed_documents": status.IndexedDocuments,
        "failed_documents": status.FailedDocuments,
        "duration_seconds": status.EndTime.Sub(status.StartTime).Seconds(),
        "started_at": status.StartTime,
        "completed_at": status.EndTime,
    })
}

// Register the route
router.GET("/health/indexing", HandleIndexingStatus)
```

### 2.3 Testing (Phase 2)

**Test 1: Verify non-blocking startup**
```bash
# Start server and measure time to first response
time curl http://localhost:8080/health

# Expected: <1 second response (was 26 seconds)
```

**Test 2: Verify background indexing continues**
```bash
# Start server
go run cmd/server/main.go &

# Immediately check indexing status
sleep 1
curl http://localhost:8080/health/indexing | jq '.'

# Expected: status="running", indexed_documents increasing
```

**Test 3: Wait for completion**
```bash
# Poll until indexing completes
while true; do
  status=$(curl -s http://localhost:8080/health/indexing | jq -r '.status')
  if [ "$status" = "completed" ]; then
    echo "Indexing complete"
    break
  fi
  echo "Status: $status"
  sleep 2
done
```

### 2.4 Success Criteria (Phase 2)

- [ ] Server starts and responds in <1 second
- [ ] Background indexing begins immediately after server startup
- [ ] All 52 documents indexed within 30 seconds
- [ ] `/health/indexing` endpoint provides progress information
- [ ] Zero data loss - all documents eventually indexed
- [ ] Graceful handling if server stops during indexing

---

## Phase 3: Optimize Performance Thresholds and Monitoring

**Estimated Time**: 1.5 hours
**Impact**: Eliminates false alarm warnings, provides contextual performance monitoring
**Risk**: Low - monitoring only, no functional changes

### 3.1 Problem Statement

Current threshold too aggressive for startup phase:
- All indexing operations logged as warnings (13 warnings in one startup)
- No context about operation type (startup vs. runtime)
- Threshold of 100ms unrealistic for HNSW bulk operations
- Creates noise in logs, obscures real performance issues

### 3.2 Code Changes

**File**: `backend/internal/services/rag/rag_performance_monitor.go`

**Change 1: Add context-aware thresholds** (modify RAGPerformanceMonitor struct, around line 20)

```go
type RAGPerformanceMonitor struct {
    // ... existing fields ...
    
    // Add context mode and thresholds
    contextMode         string           // "startup", "runtime", "bulk_indexing"
    startupThreshold    time.Duration    // Relaxed for startup
    runtimeThreshold    time.Duration    // Strict for normal operations
    bulkIndexThreshold  time.Duration    // Medium for bulk operations
    
    // Add statistics by context
    contextStats        map[string]*ContextStats
}

// ContextStats tracks performance by context type
type ContextStats struct {
    OperationCount    int64
    WarningCount      int64
    TotalDuration     time.Duration
    MaxDuration       time.Duration
    AvgDuration       time.Duration
}
```

**Change 2: Update NewRAGPerformanceMonitor** (replace constructor, around line 65)

```go
func NewRAGPerformanceMonitor() *RAGPerformanceMonitor {
    return &RAGPerformanceMonitor{
        embeddingTimes:    make([]time.Duration, 0),
        searchTimes:       make([]time.Duration, 0),
        indexingTimes:     make([]time.Duration, 0),
        errorCounts:       make(map[string]int64),
        contextMode:       "startup",  // Start in startup mode
        startupThreshold:  2000 * time.Millisecond,    // Relaxed for startup (was 100ms)
        runtimeThreshold: 100 * time.Millisecond,      // Strict for runtime
        bulkIndexThreshold: 500 * time.Millisecond,    // Medium for bulk ops
        maxEmbeddingTime:  10 * time.Millisecond,
        maxSearchTime:     20 * time.Millisecond,
        maxIndexingTime:   100 * time.Millisecond,  // Will be overridden by context
        contextStats:      make(map[string]*ContextStats),
    }
}
```

**Change 3: Add SetContextMode function** (new function, around line 140)

```go
// SetContextMode changes the performance monitoring context
// Contexts: "startup" (bulk load), "runtime" (production), "bulk_indexing" (batch ops)
func (rpm *RAGPerformanceMonitor) SetContextMode(mode string) {
    rpm.mu.Lock()
    defer rpm.mu.Unlock()
    
    oldMode := rpm.contextMode
    rpm.contextMode = mode
    
    logrus.WithFields(logrus.Fields{
        "old_mode": oldMode,
        "new_mode": mode,
        "threshold_ms": rpm.getThresholdForContext(mode).Milliseconds(),
    }).Info("📊 Performance monitor context changed")
}

// getThresholdForContext returns the appropriate threshold for current context
func (rpm *RAGPerformanceMonitor) getThresholdForContext(mode string) time.Duration {
    switch mode {
    case "startup":
        return rpm.startupThreshold
    case "bulk_indexing":
        return rpm.bulkIndexThreshold
    case "runtime":
        fallthrough
    default:
        return rpm.runtimeThreshold
    }
}
```

**Change 4: Update RecordIndexingTime** (replace function, around line 160)

```go
// RecordIndexingTime records indexing time with context awareness
func (rpm *RAGPerformanceMonitor) RecordIndexingTime(duration time.Duration) {
    rpm.mu.Lock()
    defer rpm.mu.Unlock()

    rpm.indexingTimes = append(rpm.indexingTimes, duration)
    rpm.totalIndexings++

    // Keep only recent measurements
    if len(rpm.indexingTimes) > 1000 {
        rpm.indexingTimes = rpm.indexingTimes[len(rpm.indexingTimes)-1000:]
    }

    // Initialize context stats if needed
    if _, exists := rpm.contextStats[rpm.contextMode]; !exists {
        rpm.contextStats[rpm.contextMode] = &ContextStats{}
    }
    stats := rpm.contextStats[rpm.contextMode]
    stats.OperationCount++

    // Check performance threshold based on context
    threshold := rpm.getThresholdForContext(rpm.contextMode)
    if duration > threshold {
        stats.WarningCount++
        
        // Only warn if significantly over threshold (50%+) or in runtime mode
        if duration > threshold*time.Duration(float64(1.5)) || rpm.contextMode == "runtime" {
            logrus.WithFields(logrus.Fields{
                "duration":  duration,
                "threshold": threshold,
                "context":   rpm.contextMode,
                "margin":    fmt.Sprintf("%.1fx", float64(duration)/float64(threshold)),
                "operation": fmt.Sprintf("#%d", stats.OperationCount),
            }).Warn("⚠️ Indexing time exceeded threshold for context")
        }
    }

    // Track statistics
    stats.TotalDuration += duration
    if duration > stats.MaxDuration {
        stats.MaxDuration = duration
    }
    if stats.OperationCount > 0 {
        stats.AvgDuration = stats.TotalDuration / time.Duration(stats.OperationCount)
    }
}
```

**Change 5: Update main.go to switch context** (in `cmd/server/main.go`)

```go
// During initialization
ragService.performanceMonitor.SetContextMode("startup")

// ... initialize and load documents ...

// After document loading completes
ragService.performanceMonitor.SetContextMode("runtime")
logrus.Info("✅ Performance monitor switched to runtime mode")
```

**Change 6: Add monitoring endpoint** (in `api/routes/routes.go`)

```go
// GET /metrics/performance - Returns performance statistics by context
func HandlePerformanceMetrics(c *gin.Context) {
    if ragService == nil {
        c.JSON(http.StatusOK, gin.H{"status": "service_unavailable"})
        return
    }

    stats := ragService.performanceMonitor.GetContextStatistics()
    c.JSON(http.StatusOK, gin.H{
        "current_context": ragService.performanceMonitor.GetContext(),
        "statistics_by_context": stats,
        "thresholds": gin.H{
            "startup_ms": ragService.performanceMonitor.startupThreshold.Milliseconds(),
            "runtime_ms": ragService.performanceMonitor.runtimeThreshold.Milliseconds(),
            "bulk_index_ms": ragService.performanceMonitor.bulkIndexThreshold.Milliseconds(),
        },
    })
}

router.GET("/metrics/performance", HandlePerformanceMetrics)
```

### 3.3 Testing (Phase 3)

**Test 1: Verify startup threshold applied**
```bash
# Start server, check logs during indexing
go run cmd/server/main.go 2>&1 | grep -i "context.*startup"
# Expected: "Performance monitor context changed old_mode=startup new_mode=runtime"
```

**Test 2: Verify warnings reduced**
```bash
# Count warnings before context switch
go run cmd/server/main.go 2>&1 | grep "Indexing time exceeded" | wc -l
# Expected: <5 warnings (was 13)
```

**Test 3: Check performance metrics endpoint**
```bash
curl http://localhost:8080/metrics/performance | jq '.'
# Expected: Shows context stats and thresholds
```

### 3.4 Success Criteria (Phase 3)

- [ ] Startup threshold is 2000ms (20x more relaxed)
- [ ] Runtime threshold remains 100ms (strict)
- [ ] Indexing warnings reduced from 13 to <5
- [ ] Performance metrics endpoint provides context statistics
- [ ] Context switches from "startup" to "runtime" after doc loading
- [ ] No functional impact on performance monitoring

---

## Implementation Checklist

### Phase 1: JSON Parsing Fixes
- [ ] **Task 1.1**: Create wrapper structs (JSONTrainingDataIndex, JSONTrainingDataWrapper)
- [ ] **Task 1.2**: Implement flexible JSON decoder with structure detection
- [ ] **Task 1.3**: Add helper function `getMapKeys()` for debugging
- [ ] **Task 1.4**: Update `LoadJSONTrainingData` to skip index files
- [ ] **Task 1.5**: Test KTP file parsing - no errors expected
- [ ] **Task 1.6**: Verify training data loaded in health check
- [ ] **Task 1.7**: Review other training data files for similar issues

### Phase 2: Async Document Indexing
- [ ] **Task 2.1**: Add BackgroundIndexingJob struct with status tracking
- [ ] **Task 2.2**: Implement `InitializeDocumentLoadingAsync()` function
- [ ] **Task 2.3**: Implement `backgroundIndexingWorker()` with progress logging
- [ ] **Task 2.4**: Add `GetBackgroundIndexingStatus()` method
- [ ] **Task 2.5**: Add context support to `loadDocumentWithContext()`
- [ ] **Task 2.6**: Update main.go to call async initialization
- [ ] **Task 2.7**: Add `/health/indexing` endpoint
- [ ] **Task 2.8**: Test immediate server startup (target: <1s)
- [ ] **Task 2.9**: Test background indexing completion (target: <30s)
- [ ] **Task 2.10**: Test graceful shutdown during indexing

### Phase 3: Performance Threshold Optimization
- [ ] **Task 3.1**: Add context-aware threshold fields to RAGPerformanceMonitor
- [ ] **Task 3.2**: Implement ContextStats struct for per-context statistics
- [ ] **Task 3.3**: Update NewRAGPerformanceMonitor with context thresholds
- [ ] **Task 3.4**: Implement `SetContextMode()` function
- [ ] **Task 3.5**: Implement `getThresholdForContext()` helper
- [ ] **Task 3.6**: Update `RecordIndexingTime()` with context awareness
- [ ] **Task 3.7**: Add context switching in main.go after doc loading
- [ ] **Task 3.8**: Add `/metrics/performance` endpoint
- [ ] **Task 3.9**: Test context switching (startup → runtime)
- [ ] **Task 3.10**: Verify warnings reduced from 13 to <5

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| JSON parsing breaks other files | Low | Medium | Comprehensive testing of all JSON types, fallback handling |
| Async indexing loses data | Very Low | High | Atomic operations, validation after completion |
| Performance regression | Low | Medium | Baseline performance testing before/after each phase |
| Background job crashes silently | Low | Medium | Comprehensive error logging, health check endpoint |

---

## Success Metrics (Target)

| Metric | Before | Target | Phase |
|--------|--------|--------|-------|
| Backend startup time | 26s | <5s | 1, 2 |
| JSON parse errors | 4 | 0 | 1 |
| Indexing warnings | 13 | <5 | 3 |
| Server response latency | N/A | <100ms | 2 |
| Documentation index completeness | ~65% | 100% | 1 |

---

## Rollback Plan

**Simple rollback** (revert all changes):
```bash
# If critical issues discovered during implementation
git revert <commit-sha>

# Or individual rollbacks per phase:
# Phase 1: Revert document_loader.go to previous version
# Phase 2: Remove async initialization, restore synchronous loading
# Phase 3: Revert performance monitor context changes
```

**Expected rollback time**: <5 minutes
**Data safety**: No data modifications, only code changes to initialization

---

## Deployment Strategy

1. **Deploy Phase 1** (JSON fixes) independently - lowest risk
2. **Deploy Phase 2** (async indexing) after Phase 1 validated
3. **Deploy Phase 3** (thresholds) as polish phase
4. **Staging validation** before production deployment
5. **Monitor metrics** for 24-48 hours after each phase

---

**Plan Prepared**: 2025-11-05 20:58:00 +07
**Next Step**: Execute Phase 1 implementation tasks
**Critical Path**: Phase 1 (1.5h) → Phase 2 (2h) → Phase 3 (1.5h) = ~5 hours total
**Estimated Completion**: 2025-11-06 02:00:00 +07 (next working day)
