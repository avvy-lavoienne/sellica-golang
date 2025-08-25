package monitoring

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// TraceContext represents a distributed trace context
type TraceContext struct {
	TraceID    string            `json:"traceId"`
	SpanID     string            `json:"spanId"`
	ParentID   string            `json:"parentId,omitempty"`
	Operation  string            `json:"operation"`
	Service    string            `json:"service"`
	StartTime  time.Time         `json:"startTime"`
	EndTime    *time.Time        `json:"endTime,omitempty"`
	Duration   *time.Duration    `json:"duration,omitempty"`
	Tags       map[string]string `json:"tags"`
	Logs       []TraceLog        `json:"logs"`
	Status     TraceStatus       `json:"status"`
	Error      string            `json:"error,omitempty"`
}

// TraceLog represents a log entry within a trace
type TraceLog struct {
	Timestamp time.Time         `json:"timestamp"`
	Level     string            `json:"level"`
	Message   string            `json:"message"`
	Fields    map[string]string `json:"fields,omitempty"`
}

// TraceStatus represents the status of a trace span
type TraceStatus string

const (
	TraceStatusOK    TraceStatus = "ok"
	TraceStatusError TraceStatus = "error"
	TraceStatusTimeout TraceStatus = "timeout"
)

// DistributedTracer manages distributed tracing for SELLY AI
type DistributedTracer struct {
	serviceName string
	traces      map[string]*TraceContext
	mutex       sync.RWMutex
	
	// Configuration
	maxTraces       int
	traceRetention  time.Duration
	samplingRate    float64
	
	// Metrics
	tracesCreated   int64
	tracesCompleted int64
	tracesErrored   int64
}

// NewDistributedTracer creates a new distributed tracer
func NewDistributedTracer(serviceName string) *DistributedTracer {
	tracer := &DistributedTracer{
		serviceName:    serviceName,
		traces:         make(map[string]*TraceContext),
		maxTraces:      10000, // Keep last 10k traces
		traceRetention: 1 * time.Hour,
		samplingRate:   1.0, // Sample all traces initially
	}
	
	// Start cleanup routine
	go tracer.cleanupRoutine()
	
	return tracer
}

// StartTrace creates a new trace context
func (dt *DistributedTracer) StartTrace(operation, service string) *TraceContext {
	traceID := uuid.New().String()
	spanID := uuid.New().String()
	
	trace := &TraceContext{
		TraceID:   traceID,
		SpanID:    spanID,
		Operation: operation,
		Service:   service,
		StartTime: time.Now(),
		Tags:      make(map[string]string),
		Logs:      make([]TraceLog, 0),
		Status:    TraceStatusOK,
	}
	
	dt.mutex.Lock()
	dt.traces[traceID] = trace
	dt.tracesCreated++
	dt.mutex.Unlock()
	
	logrus.WithFields(logrus.Fields{
		"traceId":   traceID,
		"spanId":    spanID,
		"operation": operation,
		"service":   service,
	}).Debug("Started new trace")
	
	return trace
}

// StartSpan creates a child span from an existing trace
func (dt *DistributedTracer) StartSpan(parentTrace *TraceContext, operation, service string) *TraceContext {
	spanID := uuid.New().String()
	
	span := &TraceContext{
		TraceID:   parentTrace.TraceID,
		SpanID:    spanID,
		ParentID:  parentTrace.SpanID,
		Operation: operation,
		Service:   service,
		StartTime: time.Now(),
		Tags:      make(map[string]string),
		Logs:      make([]TraceLog, 0),
		Status:    TraceStatusOK,
	}
	
	// Copy relevant tags from parent
	for key, value := range parentTrace.Tags {
		if key == "userId" || key == "sessionId" || key == "requestId" {
			span.Tags[key] = value
		}
	}
	
	logrus.WithFields(logrus.Fields{
		"traceId":   span.TraceID,
		"spanId":    spanID,
		"parentId":  parentTrace.SpanID,
		"operation": operation,
		"service":   service,
	}).Debug("Started new span")
	
	return span
}

// FinishTrace completes a trace and records its duration
func (dt *DistributedTracer) FinishTrace(trace *TraceContext) {
	if trace == nil {
		return
	}
	
	endTime := time.Now()
	duration := endTime.Sub(trace.StartTime)
	
	trace.EndTime = &endTime
	trace.Duration = &duration
	
	dt.mutex.Lock()
	if existingTrace, exists := dt.traces[trace.TraceID]; exists {
		existingTrace.EndTime = &endTime
		existingTrace.Duration = &duration
		existingTrace.Status = trace.Status
		existingTrace.Error = trace.Error
		
		if trace.Status == TraceStatusError {
			dt.tracesErrored++
		} else {
			dt.tracesCompleted++
		}
	}
	dt.mutex.Unlock()
	
	logrus.WithFields(logrus.Fields{
		"traceId":   trace.TraceID,
		"spanId":    trace.SpanID,
		"operation": trace.Operation,
		"duration":  duration,
		"status":    trace.Status,
	}).Debug("Finished trace")
}

// AddTag adds a tag to the trace context
func (dt *DistributedTracer) AddTag(trace *TraceContext, key, value string) {
	if trace == nil {
		return
	}
	
	trace.Tags[key] = value
}

// AddLog adds a log entry to the trace context
func (dt *DistributedTracer) AddLog(trace *TraceContext, level, message string, fields map[string]string) {
	if trace == nil {
		return
	}
	
	log := TraceLog{
		Timestamp: time.Now(),
		Level:     level,
		Message:   message,
		Fields:    fields,
	}
	
	trace.Logs = append(trace.Logs, log)
}

// SetError marks the trace as errored
func (dt *DistributedTracer) SetError(trace *TraceContext, err error) {
	if trace == nil {
		return
	}
	
	trace.Status = TraceStatusError
	if err != nil {
		trace.Error = err.Error()
	}
}

// GetTrace retrieves a trace by ID
func (dt *DistributedTracer) GetTrace(traceID string) (*TraceContext, bool) {
	dt.mutex.RLock()
	defer dt.mutex.RUnlock()
	
	trace, exists := dt.traces[traceID]
	return trace, exists
}

// GetTraces retrieves all traces (for debugging/monitoring)
func (dt *DistributedTracer) GetTraces() map[string]*TraceContext {
	dt.mutex.RLock()
	defer dt.mutex.RUnlock()
	
	// Return a copy to avoid race conditions
	traces := make(map[string]*TraceContext)
	for k, v := range dt.traces {
		traces[k] = v
	}
	
	return traces
}

// GetMetrics returns tracing metrics
func (dt *DistributedTracer) GetMetrics() map[string]interface{} {
	dt.mutex.RLock()
	defer dt.mutex.RUnlock()
	
	return map[string]interface{}{
		"tracesCreated":   dt.tracesCreated,
		"tracesCompleted": dt.tracesCompleted,
		"tracesErrored":   dt.tracesErrored,
		"activeTraces":    len(dt.traces),
		"serviceName":     dt.serviceName,
		"samplingRate":    dt.samplingRate,
	}
}

// cleanupRoutine periodically cleans up old traces
func (dt *DistributedTracer) cleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		dt.cleanup()
	}
}

// cleanup removes old traces to prevent memory leaks
func (dt *DistributedTracer) cleanup() {
	dt.mutex.Lock()
	defer dt.mutex.Unlock()
	
	now := time.Now()
	cutoff := now.Add(-dt.traceRetention)
	
	for traceID, trace := range dt.traces {
		if trace.StartTime.Before(cutoff) {
			delete(dt.traces, traceID)
		}
	}
	
	// If we still have too many traces, remove oldest ones
	if len(dt.traces) > dt.maxTraces {
		// Convert to slice for sorting
		type traceEntry struct {
			id    string
			trace *TraceContext
		}
		
		var entries []traceEntry
		for id, trace := range dt.traces {
			entries = append(entries, traceEntry{id: id, trace: trace})
		}
		
		// Simple sort by start time (oldest first)
		for i := 0; i < len(entries); i++ {
			for j := i + 1; j < len(entries); j++ {
				if entries[i].trace.StartTime.After(entries[j].trace.StartTime) {
					entries[i], entries[j] = entries[j], entries[i]
				}
			}
		}
		
		// Remove oldest traces
		toRemove := len(entries) - dt.maxTraces
		for i := 0; i < toRemove; i++ {
			delete(dt.traces, entries[i].id)
		}
	}
}

// TracingMiddleware creates a Gin middleware for distributed tracing
func (dt *DistributedTracer) TracingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if we should sample this request
		if dt.samplingRate < 1.0 {
			// Simple sampling logic - in production, use more sophisticated sampling
			if time.Now().UnixNano()%100 >= int64(dt.samplingRate*100) {
				c.Next()
				return
			}
		}
		
		// Create trace for this request
		operation := fmt.Sprintf("%s %s", c.Request.Method, c.FullPath())
		trace := dt.StartTrace(operation, dt.serviceName)
		
		// Add request tags
		dt.AddTag(trace, "http.method", c.Request.Method)
		dt.AddTag(trace, "http.url", c.Request.URL.String())
		dt.AddTag(trace, "http.user_agent", c.Request.UserAgent())
		dt.AddTag(trace, "http.remote_addr", c.ClientIP())
		
		// Add trace to context
		c.Set("trace", trace)
		
		// Add trace headers for downstream services
		c.Header("X-Trace-ID", trace.TraceID)
		c.Header("X-Span-ID", trace.SpanID)
		
		// Process request
		c.Next()
		
		// Record response information
		dt.AddTag(trace, "http.status_code", fmt.Sprintf("%d", c.Writer.Status()))
		dt.AddTag(trace, "http.response_size", fmt.Sprintf("%d", c.Writer.Size()))
		
		// Check for errors
		if len(c.Errors) > 0 {
			dt.SetError(trace, c.Errors.Last())
			dt.AddLog(trace, "error", "Request completed with errors", map[string]string{
				"error": c.Errors.Last().Error(),
			})
		}
		
		// Finish trace
		dt.FinishTrace(trace)
	}
}

// GetTraceFromContext extracts trace context from Gin context
func GetTraceFromContext(c *gin.Context) (*TraceContext, bool) {
	if trace, exists := c.Get("trace"); exists {
		if traceContext, ok := trace.(*TraceContext); ok {
			return traceContext, true
		}
	}
	return nil, false
}

// TraceAIRequest creates a span for AI processing requests
func (dt *DistributedTracer) TraceAIRequest(parentTrace *TraceContext, provider, model, query string) *TraceContext {
	operation := fmt.Sprintf("ai.request.%s", provider)
	span := dt.StartSpan(parentTrace, operation, "ai-service")
	
	dt.AddTag(span, "ai.provider", provider)
	dt.AddTag(span, "ai.model", model)
	dt.AddTag(span, "ai.query_length", fmt.Sprintf("%d", len(query)))
	
	return span
}

// TraceDatabaseQuery creates a span for database queries
func (dt *DistributedTracer) TraceDatabaseQuery(parentTrace *TraceContext, operation, table string) *TraceContext {
	spanOperation := fmt.Sprintf("db.%s.%s", operation, table)
	span := dt.StartSpan(parentTrace, spanOperation, "database")
	
	dt.AddTag(span, "db.operation", operation)
	dt.AddTag(span, "db.table", table)
	
	return span
}

// TraceCacheOperation creates a span for cache operations
func (dt *DistributedTracer) TraceCacheOperation(parentTrace *TraceContext, operation, cacheType string) *TraceContext {
	spanOperation := fmt.Sprintf("cache.%s.%s", operation, cacheType)
	span := dt.StartSpan(parentTrace, spanOperation, "cache")
	
	dt.AddTag(span, "cache.operation", operation)
	dt.AddTag(span, "cache.type", cacheType)
	
	return span
}

// TraceSELLYPersona creates a span for SELLY persona processing
func (dt *DistributedTracer) TraceSELLYPersona(parentTrace *TraceContext, mood, serviceType string) *TraceContext {
	operation := "selly.persona.process"
	span := dt.StartSpan(parentTrace, operation, "selly-persona")
	
	dt.AddTag(span, "selly.mood", mood)
	dt.AddTag(span, "selly.service_type", serviceType)
	dt.AddTag(span, "selly.cultural_context", "indonesian")
	
	return span
}
