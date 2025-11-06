package knowledge_test

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"selly-backend/internal/services/knowledge"
)

// TestBackgroundIndexerStart tests the indexer startup
func TestBackgroundIndexerStart(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	assert.False(t, indexer.IsRunning, "Indexer should not be running initially")

	indexer.Start(100)

	assert.True(t, indexer.IsRunning, "Indexer should be running after Start()")
	assert.Equal(t, 100, indexer.TotalDocs, "Total docs should be 100")
	assert.Equal(t, 0.0, indexer.Progress, "Progress should be 0% at start")
}

// TestBackgroundIndexerProgress tests progress tracking
func TestBackgroundIndexerProgress(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	// Simulate processing 50 documents
	indexer.UpdateProgress(50, 0, 0)

	assert.Equal(t, 50.0, indexer.Progress, "Progress should be 50%")
	assert.Equal(t, 50, indexer.DocsProcessed, "Should have 50 docs processed")
}

// TestBackgroundIndexerCompletion tests completion
func TestBackgroundIndexerCompletion(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	indexer.UpdateProgress(100, 0, 0)
	indexer.Complete()

	assert.False(t, indexer.IsRunning, "Indexer should not be running after Complete()")
	assert.Equal(t, 100.0, indexer.Progress, "Progress should be 100%")
}

// TestBackgroundIndexerGetStats tests the stats export
func TestBackgroundIndexerGetStats(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	// Simulate some processing
	indexer.UpdateProgress(25, 2, 0)

	stats := indexer.GetStats()

	assert.True(t, stats.IsRunning, "Should be running")
	assert.Equal(t, 25.0, stats.ProgressPercent, "Progress should be 25%")
	assert.Equal(t, 25, stats.DocsProcessed, "Should have 25 docs processed")
	assert.Equal(t, 100, stats.TotalDocs, "Should have 100 total docs")
	assert.Equal(t, 2, stats.ErrorCount, "Should have 2 errors")
}

// TestBackgroundIndexerErrorHandling tests error recording
func TestBackgroundIndexerErrorHandling(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	testError := fmt.Errorf("test error occurred")
	indexer.SetError(testError)

	assert.Equal(t, testError, indexer.LastError, "Error should be recorded")

	stats := indexer.GetStats()
	assert.NotNil(t, stats.LastError, "LastError should be in stats")
	assert.Equal(t, "test error occurred", *stats.LastError, "Error message should match")
}

// TestBackgroundIndexerIsReady tests readiness check
func TestBackgroundIndexerIsReady(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	ctx := context.Background()

	assert.True(t, indexer.IsReady(ctx), "Should be ready when not running")

	indexer.Start(100)
	assert.False(t, indexer.IsReady(ctx), "Should not be ready while running")

	indexer.Complete()
	assert.True(t, indexer.IsReady(ctx), "Should be ready after completion")
}

// TestBackgroundIndexerContextCancellation tests context cancellation
func TestBackgroundIndexerContextCancellation(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel immediately
	cancel()

	ready := indexer.IsReady(ctx)
	assert.False(t, ready, "Should not be ready when context is cancelled")
}

// TestBackgroundIndexerWaitForCompletion tests blocking wait
func TestBackgroundIndexerWaitForCompletion(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	// Complete in background after 100ms
	go func() {
		time.Sleep(100 * time.Millisecond)
		indexer.Complete()
	}()

	// Should wait and then complete
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := indexer.WaitForCompletion(ctx)
	assert.NoError(t, err, "Should complete without error")
	assert.False(t, indexer.IsRunning, "Should not be running after wait")
}

// TestBackgroundIndexerWaitTimeout tests wait timeout
func TestBackgroundIndexerWaitTimeout(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	// Never complete the indexer
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	err := indexer.WaitForCompletion(ctx)
	assert.Error(t, err, "Should timeout")
	assert.Equal(t, context.DeadlineExceeded, err, "Error should be context deadline exceeded")
}

// TestBackgroundIndexerThreadSafety tests thread-safe operations
func TestBackgroundIndexerThreadSafety(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(1000)

	var wg sync.WaitGroup
	var mu sync.Mutex
	updates := 0

	// Simulate concurrent updates
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				indexer.UpdateProgress(idx*100+j, 0, 0)
				mu.Lock()
				updates++
				mu.Unlock()
				time.Sleep(1 * time.Millisecond)
			}
		}(i)
	}

	wg.Wait()

	assert.Equal(t, 1000, updates, "Should have 1000 updates")
	stats := indexer.GetStats()
	assert.Equal(t, 999, stats.DocsProcessed, "Last update should be 999")
}

// TestBackgroundIndexerEstimatedCompletion tests estimated completion calculation
func TestBackgroundIndexerEstimatedCompletion(t *testing.T) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(100)

	// Simulate some processing with elapsed time
	time.Sleep(50 * time.Millisecond)
	indexer.UpdateProgress(50, 0, 0)

	stats := indexer.GetStats()
	assert.NotNil(t, stats.EstimatedComplete, "Estimated completion should be set")
	assert.Greater(t, stats.EstimatedSeconds, 0.0, "Estimated seconds should be > 0")
}

// BenchmarkBackgroundIndexer benchmarks indexer operations
func BenchmarkBackgroundIndexer(b *testing.B) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(10000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		indexer.UpdateProgress(i%10000, 0, 0)
	}
}

// BenchmarkBackgroundIndexerGetStats benchmarks stats retrieval
func BenchmarkBackgroundIndexerGetStats(b *testing.B) {
	indexer := knowledge.NewBackgroundIndexer()
	indexer.Start(10000)
	indexer.UpdateProgress(5000, 10, 5)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = indexer.GetStats()
	}
}
