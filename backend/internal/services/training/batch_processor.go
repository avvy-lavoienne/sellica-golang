package training

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"selly-backend/internal/services/database"
)

// BatchProcessor handles optimized batch processing for Supabase
// Implements Phase 1 specifications for 1000-5000 records per batch
type BatchProcessor struct {
	supabase         *database.Service
	batchSize        int           // Optimal batch size for Supabase (1000-5000)
	maxConcurrentBatches int       // Maximum concurrent batch operations
	retryAttempts    int           // Retry attempts for failed operations
	batchTimeout     time.Duration // Timeout for batch processing
	
	// Batch management
	pendingBatch     []TrainingData
	batchMutex       sync.Mutex
	flushTimer       *time.Timer
	
	// Performance metrics
	processedBatches int64
	failedBatches    int64
	totalRecords     int64
	avgProcessingTime time.Duration
	mu               sync.RWMutex
}

// BatchProcessorConfig holds configuration for batch processor
type BatchProcessorConfig struct {
	BatchSize            int
	MaxConcurrentBatches int
	RetryAttempts        int
	BatchTimeout         time.Duration
}

// NewBatchProcessor creates a new batch processor with Supabase optimization
func NewBatchProcessor(supabase *database.Service, config *BatchProcessorConfig) *BatchProcessor {
	if config == nil {
		config = &BatchProcessorConfig{
			BatchSize:            1000, // Optimal for Supabase REST API
			MaxConcurrentBatches: 10,   // Concurrent batch operations
			RetryAttempts:        3,    // Retry failed operations
			BatchTimeout:         30 * time.Second,
		}
	}

	return &BatchProcessor{
		supabase:             supabase,
		batchSize:            config.BatchSize,
		maxConcurrentBatches: config.MaxConcurrentBatches,
		retryAttempts:        config.RetryAttempts,
		batchTimeout:         config.BatchTimeout,
		pendingBatch:         make([]TrainingData, 0, config.BatchSize),
	}
}

// AddToBatch adds training data to the pending batch
func (bp *BatchProcessor) AddToBatch(data TrainingData) error {
	bp.batchMutex.Lock()
	defer bp.batchMutex.Unlock()

	bp.pendingBatch = append(bp.pendingBatch, data)

	// If batch is full, trigger immediate processing
	if len(bp.pendingBatch) >= bp.batchSize {
		go bp.processBatch()
		return nil
	}

	// Start timer for batch timeout if not already running
	if bp.flushTimer == nil {
		bp.flushTimer = time.AfterFunc(bp.batchTimeout, func() {
			bp.processBatch()
		})
	}

	return nil
}

// ProcessBatch processes the current batch of training data
func (bp *BatchProcessor) processBatch() {
	bp.batchMutex.Lock()
	
	if len(bp.pendingBatch) == 0 {
		bp.batchMutex.Unlock()
		return
	}

	// Copy batch and reset
	batch := make([]TrainingData, len(bp.pendingBatch))
	copy(batch, bp.pendingBatch)
	bp.pendingBatch = bp.pendingBatch[:0] // Reset slice
	
	// Reset timer
	if bp.flushTimer != nil {
		bp.flushTimer.Stop()
		bp.flushTimer = nil
	}
	
	bp.batchMutex.Unlock()

	// Process batch with retry logic
	startTime := time.Now()
	err := bp.processBatchWithRetry(context.Background(), batch)
	processingTime := time.Since(startTime)

	// Update metrics
	bp.updateMetrics(len(batch), processingTime, err == nil)

	if err != nil {
		logrus.WithError(err).Errorf("Failed to process batch of %d training records", len(batch))
	} else {
		logrus.Infof("Successfully processed batch of %d training records in %v", len(batch), processingTime)
	}
}

// processBatchWithRetry processes a batch with retry logic
func (bp *BatchProcessor) processBatchWithRetry(ctx context.Context, batch []TrainingData) error {
	var lastErr error

	for attempt := 0; attempt < bp.retryAttempts; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			backoff := time.Duration(attempt*attempt) * time.Second
			time.Sleep(backoff)
			logrus.Warnf("Retrying batch processing, attempt %d/%d", attempt+1, bp.retryAttempts)
		}

		err := bp.processBatchToSupabase(ctx, batch)
		if err == nil {
			return nil
		}

		lastErr = err
		logrus.WithError(err).Warnf("Batch processing attempt %d failed", attempt+1)
	}

	return fmt.Errorf("batch processing failed after %d attempts: %w", bp.retryAttempts, lastErr)
}

// processBatchToSupabase sends the batch to Supabase
func (bp *BatchProcessor) processBatchToSupabase(ctx context.Context, batch []TrainingData) error {
	// Convert batch to Supabase format
	supabaseBatch := make([]map[string]interface{}, len(batch))
	for i, data := range batch {
		supabaseBatch[i] = map[string]interface{}{
			"id":             data.ID,
			"query":          data.Query,
			"response":       data.Response,
			"user_id":        data.UserID,
			"session_id":     data.SessionID,
			"timestamp":      data.Timestamp,
			"classification": data.Classification,
			"metadata":       data.Metadata,
			"quality":        data.Quality,
			"status":         string(data.Status),
			"created_at":     data.CreatedAt,
			"updated_at":     data.UpdatedAt,
		}
	}

	// Use Supabase batch insert
	for _, record := range supabaseBatch {
		if err := bp.supabase.InsertTrainingData(ctx, record); err != nil {
			return fmt.Errorf("failed to insert training data record: %w", err)
		}
	}

	return nil
}

// updateMetrics updates batch processing metrics
func (bp *BatchProcessor) updateMetrics(recordCount int, processingTime time.Duration, success bool) {
	bp.mu.Lock()
	defer bp.mu.Unlock()

	bp.totalRecords += int64(recordCount)
	
	if success {
		bp.processedBatches++
	} else {
		bp.failedBatches++
	}

	// Update average processing time
	totalBatches := bp.processedBatches + bp.failedBatches
	if totalBatches > 0 {
		bp.avgProcessingTime = time.Duration(
			(int64(bp.avgProcessingTime)*totalBatches + int64(processingTime)) / (totalBatches + 1),
		)
	}
}

// GetMetrics returns current batch processing metrics
func (bp *BatchProcessor) GetMetrics() BatchProcessorMetrics {
	bp.mu.RLock()
	defer bp.mu.RUnlock()

	return BatchProcessorMetrics{
		ProcessedBatches:     bp.processedBatches,
		FailedBatches:        bp.failedBatches,
		TotalRecords:         bp.totalRecords,
		AvgProcessingTime:    bp.avgProcessingTime,
		CurrentBatchSize:     len(bp.pendingBatch),
		SuccessRate:          bp.calculateSuccessRate(),
	}
}

// calculateSuccessRate calculates the batch processing success rate
func (bp *BatchProcessor) calculateSuccessRate() float64 {
	totalBatches := bp.processedBatches + bp.failedBatches
	if totalBatches == 0 {
		return 0.0
	}
	return float64(bp.processedBatches) / float64(totalBatches) * 100.0
}

// Flush forces processing of any pending batch
func (bp *BatchProcessor) Flush() error {
	bp.batchMutex.Lock()
	hasPending := len(bp.pendingBatch) > 0
	bp.batchMutex.Unlock()

	if hasPending {
		bp.processBatch()
	}

	return nil
}

// BatchProcessorMetrics holds metrics for batch processing performance
type BatchProcessorMetrics struct {
	ProcessedBatches     int64         `json:"processed_batches"`
	FailedBatches        int64         `json:"failed_batches"`
	TotalRecords         int64         `json:"total_records"`
	AvgProcessingTime    time.Duration `json:"avg_processing_time"`
	CurrentBatchSize     int           `json:"current_batch_size"`
	SuccessRate          float64       `json:"success_rate"`
}
