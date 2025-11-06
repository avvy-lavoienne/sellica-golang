package rag

import (
	"context"
	"runtime"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// MemoryMonitor provides comprehensive memory monitoring and leak detection
type MemoryMonitor struct {
	ticker          *time.Ticker
	stats           []runtime.MemStats
	mutex           sync.RWMutex
	alertThreshold  int64 // Memory usage threshold in bytes
	leakThreshold   float64 // Percentage increase threshold for leak detection
	monitoringActive bool
	ctx             context.Context
	cancel          context.CancelFunc
}

// MemoryStats represents memory usage statistics
type MemoryStats struct {
	Timestamp    time.Time `json:"timestamp"`
	AllocMB      float64   `json:"alloc_mb"`
	TotalAllocMB float64   `json:"total_alloc_mb"`
	SysMB        float64   `json:"sys_mb"`
	NumGC        uint32    `json:"num_gc"`
	Goroutines   int       `json:"goroutines"`
	HeapObjects  uint64    `json:"heap_objects"`
}

// MemoryAlert represents a memory-related alert
type MemoryAlert struct {
	Type        string    `json:"type"`
	Severity    string    `json:"severity"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
	MemoryStats MemoryStats `json:"memory_stats"`
}

// NewMemoryMonitor creates a new memory monitor instance
func NewMemoryMonitor() *MemoryMonitor {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &MemoryMonitor{
		stats:          make([]runtime.MemStats, 0),
		alertThreshold: 1200 * 1024 * 1024, // 1200MB threshold
		leakThreshold:  0.2, // 20% increase threshold
		ctx:            ctx,
		cancel:         cancel,
	}
}

// StartMonitoring begins memory monitoring with specified interval
func (mm *MemoryMonitor) StartMonitoring(interval time.Duration) {
	mm.mutex.Lock()
	if mm.monitoringActive {
		mm.mutex.Unlock()
		return
	}
	
	mm.monitoringActive = true
	mm.ticker = time.NewTicker(interval)
	mm.mutex.Unlock()

	// TEMPORARILY DISABLED: Memory monitoring logs for focus on auth workflow
	// logrus.WithField("interval", interval).Info("Starting memory monitoring")

	go func() {
		defer mm.ticker.Stop()
		
		for {
			select {
			case <-mm.ticker.C:
				mm.collectMemoryStats()
			case <-mm.ctx.Done():
				logrus.Info("Memory monitoring stopped")
				return
			}
		}
	}()
}

// StopMonitoring stops the memory monitoring
func (mm *MemoryMonitor) StopMonitoring() {
	mm.mutex.Lock()
	defer mm.mutex.Unlock()
	
	if !mm.monitoringActive {
		return
	}
	
	mm.monitoringActive = false
	mm.cancel()
	
	if mm.ticker != nil {
		mm.ticker.Stop()
	}
	
	logrus.Info("Memory monitoring stopped")
}

// collectMemoryStats collects current memory statistics
func (mm *MemoryMonitor) collectMemoryStats() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	mm.mutex.Lock()
	mm.stats = append(mm.stats, m)
	
	// Keep only last 100 measurements to prevent memory growth
	if len(mm.stats) > 100 {
		mm.stats = mm.stats[1:]
	}
	mm.mutex.Unlock()
	
	// Create current stats
	currentStats := MemoryStats{
		Timestamp:    time.Now(),
		AllocMB:      float64(m.Alloc) / 1024 / 1024,
		TotalAllocMB: float64(m.TotalAlloc) / 1024 / 1024,
		SysMB:        float64(m.Sys) / 1024 / 1024,
		NumGC:        m.NumGC,
		Goroutines:   runtime.NumGoroutine(),
		HeapObjects:  m.HeapObjects,
	}
	
	// Log memory usage
	logrus.WithFields(logrus.Fields{
		"alloc_mb":      currentStats.AllocMB,
		"total_alloc_mb": currentStats.TotalAllocMB,
		"sys_mb":        currentStats.SysMB,
		"num_gc":        currentStats.NumGC,
		"goroutines":    currentStats.Goroutines,
		"heap_objects":  currentStats.HeapObjects,
	}).Debug("Memory usage stats")
	
	// Check for alerts
	mm.checkMemoryAlerts(currentStats, m)
}

// checkMemoryAlerts checks for memory-related alerts
func (mm *MemoryMonitor) checkMemoryAlerts(stats MemoryStats, memStats runtime.MemStats) {
	// Check memory usage threshold
	if int64(memStats.Alloc) > mm.alertThreshold {
		alert := MemoryAlert{
			Type:        "HIGH_MEMORY_USAGE",
			Severity:    "WARNING",
			Message:     "Memory usage exceeded threshold",
			Timestamp:   time.Now(),
			MemoryStats: stats,
		}
		mm.handleAlert(alert)
	}
	
	// Check for potential memory leak
	if mm.detectMemoryLeak() {
		alert := MemoryAlert{
			Type:        "MEMORY_LEAK_DETECTED",
			Severity:    "CRITICAL",
			Message:     "Potential memory leak detected",
			Timestamp:   time.Now(),
			MemoryStats: stats,
		}
		mm.handleAlert(alert)
		
		// Force garbage collection
		runtime.GC()
		logrus.Warn("Forced garbage collection due to potential memory leak")
	}
	
	// Check for excessive goroutines
	if stats.Goroutines > 10000 {
		alert := MemoryAlert{
			Type:        "HIGH_GOROUTINE_COUNT",
			Severity:    "WARNING",
			Message:     "Excessive number of goroutines detected",
			Timestamp:   time.Now(),
			MemoryStats: stats,
		}
		mm.handleAlert(alert)
	}
}

// detectMemoryLeak detects potential memory leaks
func (mm *MemoryMonitor) detectMemoryLeak() bool {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	if len(mm.stats) < 10 {
		return false
	}
	
	// Compare recent memory usage with older usage
	recentStats := mm.stats[len(mm.stats)-5:]
	olderStats := mm.stats[len(mm.stats)-10 : len(mm.stats)-5]
	
	recentAvg := mm.calculateAverageAlloc(recentStats)
	olderAvg := mm.calculateAverageAlloc(olderStats)
	
	if olderAvg == 0 {
		return false
	}
	
	// Check if recent average is significantly higher
	increase := (recentAvg - olderAvg) / olderAvg
	return increase > mm.leakThreshold
}

// calculateAverageAlloc calculates average allocated memory
func (mm *MemoryMonitor) calculateAverageAlloc(stats []runtime.MemStats) float64 {
	if len(stats) == 0 {
		return 0
	}
	
	var total uint64
	for _, stat := range stats {
		total += stat.Alloc
	}
	
	return float64(total) / float64(len(stats))
}

// handleAlert handles memory alerts
func (mm *MemoryMonitor) handleAlert(alert MemoryAlert) {
	logrus.WithFields(logrus.Fields{
		"type":      alert.Type,
		"severity":  alert.Severity,
		"message":   alert.Message,
		"alloc_mb":  alert.MemoryStats.AllocMB,
		"goroutines": alert.MemoryStats.Goroutines,
	}).Warn("Memory alert triggered")
	
	// TODO: Integrate with alerting system (Prometheus, etc.)
	// This is where you would send alerts to your monitoring system
}

// GetCurrentStats returns current memory statistics
func (mm *MemoryMonitor) GetCurrentStats() MemoryStats {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	return MemoryStats{
		Timestamp:    time.Now(),
		AllocMB:      float64(m.Alloc) / 1024 / 1024,
		TotalAllocMB: float64(m.TotalAlloc) / 1024 / 1024,
		SysMB:        float64(m.Sys) / 1024 / 1024,
		NumGC:        m.NumGC,
		Goroutines:   runtime.NumGoroutine(),
		HeapObjects:  m.HeapObjects,
	}
}

// GetMemoryHistory returns historical memory statistics
func (mm *MemoryMonitor) GetMemoryHistory() []MemoryStats {
	mm.mutex.RLock()
	defer mm.mutex.RUnlock()
	
	history := make([]MemoryStats, len(mm.stats))
	for i, stat := range mm.stats {
		history[i] = MemoryStats{
			AllocMB:      float64(stat.Alloc) / 1024 / 1024,
			TotalAllocMB: float64(stat.TotalAlloc) / 1024 / 1024,
			SysMB:        float64(stat.Sys) / 1024 / 1024,
			NumGC:        stat.NumGC,
			HeapObjects:  stat.HeapObjects,
		}
	}
	
	return history
}

// ForceGarbageCollection forces garbage collection and logs the impact
func (mm *MemoryMonitor) ForceGarbageCollection() {
	beforeStats := mm.GetCurrentStats()
	
	runtime.GC()
	
	// Wait a moment for GC to complete
	time.Sleep(100 * time.Millisecond)
	
	afterStats := mm.GetCurrentStats()
	
	memoryFreed := beforeStats.AllocMB - afterStats.AllocMB
	
	logrus.WithFields(logrus.Fields{
		"before_alloc_mb": beforeStats.AllocMB,
		"after_alloc_mb":  afterStats.AllocMB,
		"memory_freed_mb": memoryFreed,
		"gc_count_increase": afterStats.NumGC - beforeStats.NumGC,
	}).Info("Forced garbage collection completed")
}
