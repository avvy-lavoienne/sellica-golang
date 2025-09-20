// Invalidation Logger - Week 3 Implementation
package sync

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// InvalidationLogger manages audit trail for cache invalidation operations
type InvalidationLogger struct {
	logs      []InvalidationLogEntry
	mutex     sync.RWMutex
	maxLogs   int
	retention time.Duration
}

// InvalidationLogEntry represents a single invalidation log entry
type InvalidationLogEntry struct {
	ID             string                 `json:"id"`
	PlanID         string                 `json:"plan_id"`
	ProcessID      string                 `json:"process_id"`
	EventID        string                 `json:"event_id"`
	Strategy       InvalidationStrategy   `json:"strategy"`
	KeysCount      int                    `json:"keys_count"`
	Duration       time.Duration          `json:"duration"`
	Success        bool                   `json:"success"`
	ErrorMessage   string                 `json:"error_message,omitempty"`
	EstimatedImpact float64               `json:"estimated_impact"`
	ActualImpact   float64                `json:"actual_impact,omitempty"`
	Timestamp      time.Time              `json:"timestamp"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// NewInvalidationLogger creates a new invalidation logger
func NewInvalidationLogger() *InvalidationLogger {
	return &InvalidationLogger{
		logs:      make([]InvalidationLogEntry, 0),
		maxLogs:   1000, // Keep last 1000 entries
		retention: 24 * time.Hour,
	}
}

// LogInvalidation logs an invalidation operation
func (il *InvalidationLogger) LogInvalidation(
	plan *InvalidationPlan,
	process *InvalidationProcess,
) {
	il.mutex.Lock()
	defer il.mutex.Unlock()

	entry := InvalidationLogEntry{
		ID:              generateLogEntryID(),
		PlanID:          plan.ID,
		ProcessID:       process.ID,
		EventID:         plan.EventID,
		Strategy:        plan.Strategy,
		KeysCount:       len(plan.Keys),
		Duration:        plan.Duration,
		Success:         process.Status == InvalidationCompleted,
		EstimatedImpact: plan.EstimatedImpact,
		Timestamp:       time.Now(),
		Metadata: map[string]interface{}{
			"priority":      plan.Priority,
			"created_at":    plan.CreatedAt,
			"executed_at":   plan.ExecutedAt,
			"process_start": process.StartedAt,
			"process_end":   process.FinishedAt,
		},
	}

	if process.Error != nil {
		entry.ErrorMessage = process.Error.Error()
	}

	// Add to logs
	il.logs = append(il.logs, entry)

	// Cleanup old logs if necessary
	il.cleanupOldLogs()

	logrus.WithFields(logrus.Fields{
		"plan_id":    plan.ID,
		"process_id": process.ID,
		"strategy":   plan.Strategy,
		"success":    entry.Success,
		"duration":   plan.Duration,
	}).Debug("📝 Invalidation logged")
}

// GetLogs returns recent invalidation logs
func (il *InvalidationLogger) GetLogs(limit int) []InvalidationLogEntry {
	il.mutex.RLock()
	defer il.mutex.RUnlock()

	if limit <= 0 || limit > len(il.logs) {
		limit = len(il.logs)
	}

	// Return most recent logs
	start := len(il.logs) - limit
	result := make([]InvalidationLogEntry, limit)
	copy(result, il.logs[start:])

	return result
}

// GetLogsByTimeRange returns logs within a time range
func (il *InvalidationLogger) GetLogsByTimeRange(
	start, end time.Time,
) []InvalidationLogEntry {
	il.mutex.RLock()
	defer il.mutex.RUnlock()

	var result []InvalidationLogEntry
	for _, log := range il.logs {
		if log.Timestamp.After(start) && log.Timestamp.Before(end) {
			result = append(result, log)
		}
	}

	return result
}

// GetInvalidationStats returns statistics about invalidation operations
func (il *InvalidationLogger) GetInvalidationStats() InvalidationStats {
	il.mutex.RLock()
	defer il.mutex.RUnlock()

	stats := InvalidationStats{
		TotalOperations: len(il.logs),
		StrategyBreakdown: make(map[InvalidationStrategy]int),
		PriorityBreakdown: make(map[InvalidationPriority]int),
	}

	if len(il.logs) == 0 {
		return stats
	}

	var totalDuration time.Duration
	var totalKeys int
	var totalImpact float64
	successCount := 0

	for _, log := range il.logs {
		// Success rate
		if log.Success {
			successCount++
		}

		// Duration stats
		totalDuration += log.Duration
		if log.Duration < stats.MinDuration || stats.MinDuration == 0 {
			stats.MinDuration = log.Duration
		}
		if log.Duration > stats.MaxDuration {
			stats.MaxDuration = log.Duration
		}

		// Keys and impact
		totalKeys += log.KeysCount
		totalImpact += log.EstimatedImpact

		// Strategy breakdown
		stats.StrategyBreakdown[log.Strategy]++

		// Priority breakdown (extract from metadata)
		if priority, ok := log.Metadata["priority"].(InvalidationPriority); ok {
			stats.PriorityBreakdown[priority]++
		}
	}

	stats.SuccessRate = float64(successCount) / float64(len(il.logs))
	stats.AverageDuration = totalDuration / time.Duration(len(il.logs))
	stats.AverageKeysPerOperation = float64(totalKeys) / float64(len(il.logs))
	stats.AverageImpact = totalImpact / float64(len(il.logs))

	return stats
}

// cleanupOldLogs removes old logs based on retention policy
func (il *InvalidationLogger) cleanupOldLogs() {
	cutoff := time.Now().Add(-il.retention)
	
	// Remove logs older than retention period
	var newLogs []InvalidationLogEntry
	for _, log := range il.logs {
		if log.Timestamp.After(cutoff) {
			newLogs = append(newLogs, log)
		}
	}

	// Limit total number of logs
	if len(newLogs) > il.maxLogs {
		start := len(newLogs) - il.maxLogs
		newLogs = newLogs[start:]
	}

	il.logs = newLogs
}

// ExportLogs exports logs to JSON format
func (il *InvalidationLogger) ExportLogs(ctx context.Context) ([]byte, error) {
	il.mutex.RLock()
	defer il.mutex.RUnlock()

	return json.MarshalIndent(il.logs, "", "  ")
}

// InvalidationStats contains statistics about invalidation operations
type InvalidationStats struct {
	TotalOperations          int                                 `json:"total_operations"`
	SuccessRate             float64                             `json:"success_rate"`
	AverageDuration         time.Duration                       `json:"average_duration"`
	MinDuration             time.Duration                       `json:"min_duration"`
	MaxDuration             time.Duration                       `json:"max_duration"`
	AverageKeysPerOperation float64                             `json:"average_keys_per_operation"`
	AverageImpact           float64                             `json:"average_impact"`
	StrategyBreakdown       map[InvalidationStrategy]int        `json:"strategy_breakdown"`
	PriorityBreakdown       map[InvalidationPriority]int        `json:"priority_breakdown"`
}

// Helper function to generate log entry ID
func generateLogEntryID() string {
	return time.Now().Format("20060102150405") + randomString(6)
}
