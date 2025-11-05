package knowledge

import (
	"context"
	"sync"
	"time"
)

// BackgroundIndexer tracks the status of background document indexing
type BackgroundIndexer struct {
	mu                sync.RWMutex
	IsRunning         bool
	Progress          float64       // 0-100%
	DocsProcessed     int
	TotalDocs         int
	StartTime         time.Time
	EstimatedComplete time.Time
	LastError         error
	ErrorCount        int
	SkippedDocs       int
}

// IndexerStats represents the current state of indexing for API responses
type IndexerStats struct {
	IsRunning         bool      `json:"is_running"`
	ProgressPercent   float64   `json:"progress_percent"`
	DocsProcessed     int       `json:"docs_processed"`
	SkippedDocs       int       `json:"skipped_docs"`
	TotalDocs         int       `json:"total_docs"`
	ErrorCount        int       `json:"error_count"`
	ElapsedSeconds    float64   `json:"elapsed_seconds"`
	EstimatedSeconds  float64   `json:"estimated_seconds,omitempty"`
	EstimatedComplete *time.Time `json:"estimated_completion,omitempty"`
	LastError         *string   `json:"last_error,omitempty"`
}

// NewBackgroundIndexer creates a new background indexer
func NewBackgroundIndexer() *BackgroundIndexer {
	return &BackgroundIndexer{
		IsRunning: false,
		Progress:  0,
	}
}

// Start marks the indexer as running and records the start time
func (bi *BackgroundIndexer) Start(totalDocs int) {
	bi.mu.Lock()
	defer bi.mu.Unlock()

	bi.IsRunning = true
	bi.Progress = 0
	bi.DocsProcessed = 0
	bi.TotalDocs = totalDocs
	bi.StartTime = time.Now()
	bi.ErrorCount = 0
	bi.SkippedDocs = 0
	bi.LastError = nil
}

// UpdateProgress updates the indexing progress
func (bi *BackgroundIndexer) UpdateProgress(processed int, errCount int, skipped int) {
	bi.mu.Lock()
	defer bi.mu.Unlock()

	bi.DocsProcessed = processed
	bi.ErrorCount = errCount
	bi.SkippedDocs = skipped

	if bi.TotalDocs > 0 {
		bi.Progress = (float64(processed) / float64(bi.TotalDocs)) * 100

		// Calculate estimated completion time
		elapsed := time.Since(bi.StartTime).Seconds()
		if processed > 0 && elapsed > 0 {
			ratePerSecond := float64(processed) / elapsed
			remainingDocs := bi.TotalDocs - processed
			estimatedRemainingSeconds := float64(remainingDocs) / ratePerSecond
			estimatedComplete := time.Now().Add(time.Duration(estimatedRemainingSeconds) * time.Second)
			bi.EstimatedComplete = estimatedComplete
		}
	}
}

// SetError records an error during indexing
func (bi *BackgroundIndexer) SetError(err error) {
	bi.mu.Lock()
	defer bi.mu.Unlock()

	bi.LastError = err
}

// Complete marks the indexing as finished
func (bi *BackgroundIndexer) Complete() {
	bi.mu.Lock()
	defer bi.mu.Unlock()

	bi.IsRunning = false
	bi.Progress = 100.0
}

// GetStats returns a thread-safe snapshot of current statistics
func (bi *BackgroundIndexer) GetStats() IndexerStats {
	bi.mu.RLock()
	defer bi.mu.RUnlock()

	stats := IndexerStats{
		IsRunning:        bi.IsRunning,
		ProgressPercent:  bi.Progress,
		DocsProcessed:    bi.DocsProcessed,
		SkippedDocs:      bi.SkippedDocs,
		TotalDocs:        bi.TotalDocs,
		ErrorCount:       bi.ErrorCount,
		ElapsedSeconds:   time.Since(bi.StartTime).Seconds(),
		EstimatedComplete: nil,
	}

	if !bi.EstimatedComplete.IsZero() {
		stats.EstimatedSeconds = time.Until(bi.EstimatedComplete).Seconds()
		stats.EstimatedComplete = &bi.EstimatedComplete
	}

	if bi.LastError != nil {
		errMsg := bi.LastError.Error()
		stats.LastError = &errMsg
	}

	return stats
}

// IsReady returns true if indexing is complete
func (bi *BackgroundIndexer) IsReady(ctx context.Context) bool {
	select {
	case <-ctx.Done():
		return false
	default:
		bi.mu.RLock()
		defer bi.mu.RUnlock()
		return !bi.IsRunning
	}
}

// WaitForCompletion blocks until indexing completes or context is cancelled
func (bi *BackgroundIndexer) WaitForCompletion(ctx context.Context) error {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if bi.IsReady(ctx) {
				return nil
			}
		}
	}
}
