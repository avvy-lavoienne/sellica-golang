package rag

import (
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// NewPoolMetrics creates a new pool metrics instance
func NewPoolMetrics() *PoolMetrics {
	return &PoolMetrics{
		responseTimes:  make([]time.Duration, 0, 1000),
		metricsHistory: make([]MetricsSnapshot, 0, 100),
		scalingEvents:  make([]ScalingEvent, 0, 100),
	}
}

// StartCollection starts metrics collection
func (pm *PoolMetrics) StartCollection(interval time.Duration) {
	pm.collectionMutex.Lock()
	defer pm.collectionMutex.Unlock()

	if pm.collecting {
		return
	}

	pm.collecting = true
	pm.collectionTicker = time.NewTicker(interval)
	pm.stopCollection = make(chan struct{})

	go pm.collectionLoop()

	logrus.WithField("interval", interval).Debug("📊 Pool metrics collection started")
}

// StopCollection stops metrics collection
func (pm *PoolMetrics) StopCollection() {
	pm.collectionMutex.Lock()
	defer pm.collectionMutex.Unlock()

	if !pm.collecting {
		return
	}

	pm.collecting = false
	close(pm.stopCollection)

	if pm.collectionTicker != nil {
		pm.collectionTicker.Stop()
	}

	logrus.Debug("🔒 Pool metrics collection stopped")
}

// collectionLoop runs the metrics collection loop
func (pm *PoolMetrics) collectionLoop() {
	for {
		select {
		case <-pm.collectionTicker.C:
			pm.collectSnapshot()
		case <-pm.stopCollection:
			return
		}
	}
}

// collectSnapshot collects a metrics snapshot
func (pm *PoolMetrics) collectSnapshot() {
	snapshot := MetricsSnapshot{
		Timestamp:        time.Now(),
		QueueUtilization: pm.GetQueueUtilization(),
		AvgResponseTime:  pm.GetAverageResponseTime(),
		TasksPerSecond:   pm.GetTasksPerSecond(),
		WorkerEfficiency: pm.GetWorkerEfficiency(),
	}

	pm.historyMu.Lock()
	pm.metricsHistory = append(pm.metricsHistory, snapshot)

	// Keep only last 100 snapshots
	if len(pm.metricsHistory) > 100 {
		pm.metricsHistory = pm.metricsHistory[1:]
	}
	pm.historyMu.Unlock()

	logrus.WithFields(logrus.Fields{
		"queue_util":    snapshot.QueueUtilization,
		"avg_resp_time": snapshot.AvgResponseTime,
		"tasks_per_sec": snapshot.TasksPerSecond,
		"worker_eff":    snapshot.WorkerEfficiency,
	}).Debug("📊 Metrics snapshot collected")
}

// UpdateQueueUtilization updates the queue utilization metric
func (pm *PoolMetrics) UpdateQueueUtilization(utilization float64) {
	pm.queueUtilizationMu.Lock()
	pm.queueUtilization = utilization
	pm.queueUtilizationMu.Unlock()
}

// RecordResponseTime records a response time measurement
func (pm *PoolMetrics) RecordResponseTime(duration time.Duration) {
	pm.responseTimeMu.Lock()
	defer pm.responseTimeMu.Unlock()

	pm.responseTimes = append(pm.responseTimes, duration)

	// Keep only last 1000 measurements
	if len(pm.responseTimes) > 1000 {
		pm.responseTimes = pm.responseTimes[1:]
	}

	// Update tasks per second calculation
	atomic.AddInt64(&pm.totalResponsesRecorded, 1)
}

// RecordScalingEvent records a scaling event
func (pm *PoolMetrics) RecordScalingEvent(event ScalingEvent) {
	pm.scalingEventsMu.Lock()
	defer pm.scalingEventsMu.Unlock()

	pm.scalingEvents = append(pm.scalingEvents, event)

	// Keep only last 100 events
	if len(pm.scalingEvents) > 100 {
		pm.scalingEvents = pm.scalingEvents[1:]
	}

	logrus.WithFields(logrus.Fields{
		"event_type":  event.EventType,
		"old_workers": event.OldWorkers,
		"new_workers": event.NewWorkers,
		"trigger":     event.Trigger,
		"success":     event.Success,
		"duration":    event.Duration,
	}).Info("📈 Scaling event recorded")
}

// GetQueueUtilization returns the current queue utilization
func (pm *PoolMetrics) GetQueueUtilization() float64 {
	pm.queueUtilizationMu.RLock()
	defer pm.queueUtilizationMu.RUnlock()
	return pm.queueUtilization
}

// GetAverageResponseTime returns the average response time
func (pm *PoolMetrics) GetAverageResponseTime() time.Duration {
	pm.responseTimeMu.RLock()
	defer pm.responseTimeMu.RUnlock()

	if len(pm.responseTimes) == 0 {
		return 0
	}

	var total time.Duration
	for _, rt := range pm.responseTimes {
		total += rt
	}

	return total / time.Duration(len(pm.responseTimes))
}

// GetTasksPerSecond calculates tasks per second based on recent activity
func (pm *PoolMetrics) GetTasksPerSecond() float64 {
	pm.throughputMu.RLock()
	defer pm.throughputMu.RUnlock()
	return pm.tasksPerSecond
}

// UpdateTasksPerSecond updates the tasks per second metric
func (pm *PoolMetrics) UpdateTasksPerSecond(tps float64) {
	pm.throughputMu.Lock()
	pm.tasksPerSecond = tps
	pm.throughputMu.Unlock()
}

// GetWorkerEfficiency calculates worker efficiency
func (pm *PoolMetrics) GetWorkerEfficiency() float64 {
	pm.efficiencyMu.RLock()
	defer pm.efficiencyMu.RUnlock()
	return pm.workerEfficiency
}

// UpdateWorkerEfficiency updates the worker efficiency metric
func (pm *PoolMetrics) UpdateWorkerEfficiency(efficiency float64) {
	pm.efficiencyMu.Lock()
	pm.workerEfficiency = efficiency
	pm.efficiencyMu.Unlock()
}

// GetMetricsHistory returns the metrics history
func (pm *PoolMetrics) GetMetricsHistory() []MetricsSnapshot {
	pm.historyMu.RLock()
	defer pm.historyMu.RUnlock()

	// Return a copy to avoid race conditions
	history := make([]MetricsSnapshot, len(pm.metricsHistory))
	copy(history, pm.metricsHistory)
	return history
}

// GetScalingEvents returns the scaling events history
func (pm *PoolMetrics) GetScalingEvents() []ScalingEvent {
	pm.scalingEventsMu.RLock()
	defer pm.scalingEventsMu.RUnlock()

	// Return a copy to avoid race conditions
	events := make([]ScalingEvent, len(pm.scalingEvents))
	copy(events, pm.scalingEvents)
	return events
}

// GetStats returns comprehensive metrics statistics
func (pm *PoolMetrics) GetStats() map[string]interface{} {
	stats := map[string]interface{}{
		"queue_utilization":        pm.GetQueueUtilization(),
		"avg_response_time_ms":     float64(pm.GetAverageResponseTime().Nanoseconds()) / 1e6,
		"tasks_per_second":         pm.GetTasksPerSecond(),
		"worker_efficiency":        pm.GetWorkerEfficiency(),
		"total_responses_recorded": atomic.LoadInt64(&pm.totalResponsesRecorded),
		"metrics_history_count":    len(pm.GetMetricsHistory()),
		"scaling_events_count":     len(pm.GetScalingEvents()),
		"collecting":               pm.collecting,
	}

	// Add recent scaling events summary
	events := pm.GetScalingEvents()
	if len(events) > 0 {
		recentEvents := events
		if len(events) > 10 {
			recentEvents = events[len(events)-10:] // Last 10 events
		}

		scaleUpCount := 0
		scaleDownCount := 0
		for _, event := range recentEvents {
			if event.EventType == "scale_up" {
				scaleUpCount++
			} else if event.EventType == "scale_down" {
				scaleDownCount++
			}
		}

		stats["recent_scale_up_count"] = scaleUpCount
		stats["recent_scale_down_count"] = scaleDownCount
		stats["last_scaling_event"] = events[len(events)-1]
	}

	return stats
}

// GetPerformanceSummary returns a performance summary for the last period
func (pm *PoolMetrics) GetPerformanceSummary(period time.Duration) map[string]interface{} {
	cutoff := time.Now().Add(-period)

	pm.historyMu.RLock()
	defer pm.historyMu.RUnlock()

	var recentSnapshots []MetricsSnapshot
	for _, snapshot := range pm.metricsHistory {
		if snapshot.Timestamp.After(cutoff) {
			recentSnapshots = append(recentSnapshots, snapshot)
		}
	}

	if len(recentSnapshots) == 0 {
		return map[string]interface{}{
			"period":            period.String(),
			"snapshots_count":   0,
			"avg_queue_util":    0.0,
			"avg_response_time": 0.0,
			"avg_tasks_per_sec": 0.0,
		}
	}

	// Calculate averages
	var totalQueueUtil, totalTasksPerSec float64
	var totalResponseTime time.Duration

	for _, snapshot := range recentSnapshots {
		totalQueueUtil += snapshot.QueueUtilization
		totalResponseTime += snapshot.AvgResponseTime
		totalTasksPerSec += snapshot.TasksPerSecond
	}

	count := float64(len(recentSnapshots))

	return map[string]interface{}{
		"period":               period.String(),
		"snapshots_count":      len(recentSnapshots),
		"avg_queue_util":       totalQueueUtil / count,
		"avg_response_time_ms": float64(totalResponseTime.Nanoseconds()) / count / 1e6,
		"avg_tasks_per_sec":    totalTasksPerSec / count,
		"min_workers":          pm.getMinWorkersInPeriod(recentSnapshots),
		"max_workers":          pm.getMaxWorkersInPeriod(recentSnapshots),
	}
}

// getMinWorkersInPeriod finds the minimum worker count in the given snapshots
func (pm *PoolMetrics) getMinWorkersInPeriod(snapshots []MetricsSnapshot) int {
	if len(snapshots) == 0 {
		return 0
	}

	min := snapshots[0].WorkerCount
	for _, snapshot := range snapshots {
		if snapshot.WorkerCount < min {
			min = snapshot.WorkerCount
		}
	}
	return min
}

// getMaxWorkersInPeriod finds the maximum worker count in the given snapshots
func (pm *PoolMetrics) getMaxWorkersInPeriod(snapshots []MetricsSnapshot) int {
	if len(snapshots) == 0 {
		return 0
	}

	max := snapshots[0].WorkerCount
	for _, snapshot := range snapshots {
		if snapshot.WorkerCount > max {
			max = snapshot.WorkerCount
		}
	}
	return max
}
