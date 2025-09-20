package monitoring

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// StructuredLogger provides production-grade structured logging for SELLY AI
// Phase 3 Week 2: JSON logging with correlation IDs and distributed tracing
type StructuredLogger struct {
	logger     *logrus.Logger
	serviceName string
	version    string
	environment string
	
	// Correlation tracking
	correlationIDKey string
	traceIDKey       string
	spanIDKey        string
}

// LogLevel represents different log levels
type LogLevel string

const (
	LogLevelTrace LogLevel = "trace"
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
	LogLevelFatal LogLevel = "fatal"
	LogLevelPanic LogLevel = "panic"
)

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp     time.Time              `json:"timestamp"`
	Level         string                 `json:"level"`
	Message       string                 `json:"message"`
	ServiceName   string                 `json:"service_name"`
	Version       string                 `json:"version"`
	Environment   string                 `json:"environment"`
	CorrelationID string                 `json:"correlation_id,omitempty"`
	TraceID       string                 `json:"trace_id,omitempty"`
	SpanID        string                 `json:"span_id,omitempty"`
	UserID        string                 `json:"user_id,omitempty"`
	SessionID     string                 `json:"session_id,omitempty"`
	RequestID     string                 `json:"request_id,omitempty"`
	Component     string                 `json:"component,omitempty"`
	Operation     string                 `json:"operation,omitempty"`
	Duration      *time.Duration         `json:"duration,omitempty"`
	Error         *ErrorDetails          `json:"error,omitempty"`
	Metrics       map[string]interface{} `json:"metrics,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	
	// Performance metrics
	MemoryUsage   *int64                 `json:"memory_usage,omitempty"`
	CPUUsage      *float64               `json:"cpu_usage,omitempty"`
	
	// Business context
	DocumentType  string                 `json:"document_type,omitempty"`
	ServiceType   string                 `json:"service_type,omitempty"`
	AIProvider    string                 `json:"ai_provider,omitempty"`
	ModelID       string                 `json:"model_id,omitempty"`
	
	// Source information
	File          string                 `json:"file,omitempty"`
	Function      string                 `json:"function,omitempty"`
	Line          int                    `json:"line,omitempty"`
}

// ErrorDetails provides structured error information
type ErrorDetails struct {
	Type       string                 `json:"type"`
	Message    string                 `json:"message"`
	Code       string                 `json:"code,omitempty"`
	Stack      string                 `json:"stack,omitempty"`
	Cause      *ErrorDetails          `json:"cause,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Retryable  bool                   `json:"retryable"`
	Severity   string                 `json:"severity"`
}

// LoggerConfig holds configuration for the structured logger
type LoggerConfig struct {
	ServiceName   string
	Version       string
	Environment   string
	Level         LogLevel
	OutputFormat  string // "json" or "text"
	EnableCaller  bool
	EnableColors  bool
	
	// Correlation tracking
	CorrelationIDKey string
	TraceIDKey       string
	SpanIDKey        string
}

// NewStructuredLogger creates a new structured logger instance
func NewStructuredLogger(config *LoggerConfig) *StructuredLogger {
	logger := logrus.New()
	
	// Set log level
	level, err := logrus.ParseLevel(string(config.Level))
	if err != nil {
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)
	
	// Set output format
	if config.OutputFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339Nano,
			FieldMap: logrus.FieldMap{
				logrus.FieldKeyTime:  "timestamp",
				logrus.FieldKeyLevel: "level",
				logrus.FieldKeyMsg:   "message",
			},
		})
	} else {
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
			DisableColors:   !config.EnableColors,
		})
	}
	
	// Enable caller information if requested
	logger.SetReportCaller(config.EnableCaller)
	
	// Set default correlation keys
	correlationIDKey := config.CorrelationIDKey
	if correlationIDKey == "" {
		correlationIDKey = "correlation_id"
	}
	
	traceIDKey := config.TraceIDKey
	if traceIDKey == "" {
		traceIDKey = "trace_id"
	}
	
	spanIDKey := config.SpanIDKey
	if spanIDKey == "" {
		spanIDKey = "span_id"
	}
	
	return &StructuredLogger{
		logger:           logger,
		serviceName:      config.ServiceName,
		version:          config.Version,
		environment:      config.Environment,
		correlationIDKey: correlationIDKey,
		traceIDKey:       traceIDKey,
		spanIDKey:        spanIDKey,
	}
}

// WithContext creates a logger with context information
func (sl *StructuredLogger) WithContext(ctx context.Context) *ContextLogger {
	return &ContextLogger{
		logger: sl,
		ctx:    ctx,
		fields: make(map[string]interface{}),
	}
}

// WithFields creates a logger with additional fields
func (sl *StructuredLogger) WithFields(fields map[string]interface{}) *FieldLogger {
	return &FieldLogger{
		logger: sl,
		fields: fields,
	}
}

// Info logs an info message
func (sl *StructuredLogger) Info(message string, fields ...map[string]interface{}) {
	sl.log(LogLevelInfo, message, nil, fields...)
}

// Warn logs a warning message
func (sl *StructuredLogger) Warn(message string, fields ...map[string]interface{}) {
	sl.log(LogLevelWarn, message, nil, fields...)
}

// Error logs an error message
func (sl *StructuredLogger) Error(message string, err error, fields ...map[string]interface{}) {
	sl.log(LogLevelError, message, err, fields...)
}

// Debug logs a debug message
func (sl *StructuredLogger) Debug(message string, fields ...map[string]interface{}) {
	sl.log(LogLevelDebug, message, nil, fields...)
}

// Fatal logs a fatal message and exits
func (sl *StructuredLogger) Fatal(message string, err error, fields ...map[string]interface{}) {
	sl.log(LogLevelFatal, message, err, fields...)
	os.Exit(1)
}

// log is the internal logging method
func (sl *StructuredLogger) log(level LogLevel, message string, err error, fields ...map[string]interface{}) {
	entry := sl.createLogEntry(level, message, err)
	
	// Add additional fields
	for _, fieldMap := range fields {
		for key, value := range fieldMap {
			entry.Metadata[key] = value
		}
	}
	
	// Add caller information
	if pc, file, line, ok := runtime.Caller(2); ok {
		entry.File = file
		entry.Line = line
		if fn := runtime.FuncForPC(pc); fn != nil {
			entry.Function = fn.Name()
		}
	}
	
	// Convert to logrus fields and log
	logrusFields := sl.entryToLogrusFields(entry)
	
	switch level {
	case LogLevelTrace:
		sl.logger.WithFields(logrusFields).Trace(message)
	case LogLevelDebug:
		sl.logger.WithFields(logrusFields).Debug(message)
	case LogLevelInfo:
		sl.logger.WithFields(logrusFields).Info(message)
	case LogLevelWarn:
		sl.logger.WithFields(logrusFields).Warn(message)
	case LogLevelError:
		sl.logger.WithFields(logrusFields).Error(message)
	case LogLevelFatal:
		sl.logger.WithFields(logrusFields).Fatal(message)
	case LogLevelPanic:
		sl.logger.WithFields(logrusFields).Panic(message)
	}
}

// createLogEntry creates a base log entry
func (sl *StructuredLogger) createLogEntry(level LogLevel, message string, err error) *LogEntry {
	entry := &LogEntry{
		Timestamp:   time.Now(),
		Level:       string(level),
		Message:     message,
		ServiceName: sl.serviceName,
		Version:     sl.version,
		Environment: sl.environment,
		Metadata:    make(map[string]interface{}),
	}
	
	// Add error details if present
	if err != nil {
		entry.Error = sl.createErrorDetails(err)
	}
	
	return entry
}

// createErrorDetails creates structured error details
func (sl *StructuredLogger) createErrorDetails(err error) *ErrorDetails {
	errorDetails := &ErrorDetails{
		Type:      fmt.Sprintf("%T", err),
		Message:   err.Error(),
		Retryable: sl.isRetryableError(err),
		Severity:  sl.getErrorSeverity(err),
		Context:   make(map[string]interface{}),
	}
	
	// Add stack trace for debugging
	if sl.logger.Level <= logrus.DebugLevel {
		errorDetails.Stack = sl.getStackTrace()
	}
	
	return errorDetails
}

// isRetryableError determines if an error is retryable
func (sl *StructuredLogger) isRetryableError(err error) bool {
	// Simple heuristic - in production, this would be more sophisticated
	errorMsg := strings.ToLower(err.Error())
	retryableKeywords := []string{"timeout", "connection", "network", "temporary", "unavailable"}
	
	for _, keyword := range retryableKeywords {
		if strings.Contains(errorMsg, keyword) {
			return true
		}
	}
	
	return false
}

// getErrorSeverity determines error severity
func (sl *StructuredLogger) getErrorSeverity(err error) string {
	errorMsg := strings.ToLower(err.Error())
	
	if strings.Contains(errorMsg, "critical") || strings.Contains(errorMsg, "fatal") {
		return "critical"
	} else if strings.Contains(errorMsg, "security") || strings.Contains(errorMsg, "unauthorized") {
		return "high"
	} else if strings.Contains(errorMsg, "timeout") || strings.Contains(errorMsg, "connection") {
		return "medium"
	}
	
	return "low"
}

// getStackTrace gets the current stack trace
func (sl *StructuredLogger) getStackTrace() string {
	buf := make([]byte, 1024*4)
	n := runtime.Stack(buf, false)
	return string(buf[:n])
}

// entryToLogrusFields converts LogEntry to logrus.Fields
func (sl *StructuredLogger) entryToLogrusFields(entry *LogEntry) logrus.Fields {
	fields := logrus.Fields{
		"service_name": entry.ServiceName,
		"version":      entry.Version,
		"environment":  entry.Environment,
	}
	
	// Add optional fields
	if entry.CorrelationID != "" {
		fields["correlation_id"] = entry.CorrelationID
	}
	if entry.TraceID != "" {
		fields["trace_id"] = entry.TraceID
	}
	if entry.SpanID != "" {
		fields["span_id"] = entry.SpanID
	}
	if entry.UserID != "" {
		fields["user_id"] = entry.UserID
	}
	if entry.SessionID != "" {
		fields["session_id"] = entry.SessionID
	}
	if entry.RequestID != "" {
		fields["request_id"] = entry.RequestID
	}
	if entry.Component != "" {
		fields["component"] = entry.Component
	}
	if entry.Operation != "" {
		fields["operation"] = entry.Operation
	}
	if entry.Duration != nil {
		fields["duration_ms"] = entry.Duration.Milliseconds()
	}
	if entry.DocumentType != "" {
		fields["document_type"] = entry.DocumentType
	}
	if entry.ServiceType != "" {
		fields["service_type"] = entry.ServiceType
	}
	if entry.AIProvider != "" {
		fields["ai_provider"] = entry.AIProvider
	}
	if entry.ModelID != "" {
		fields["model_id"] = entry.ModelID
	}
	
	// Add error details
	if entry.Error != nil {
		fields["error_type"] = entry.Error.Type
		fields["error_code"] = entry.Error.Code
		fields["error_retryable"] = entry.Error.Retryable
		fields["error_severity"] = entry.Error.Severity
		if entry.Error.Stack != "" {
			fields["error_stack"] = entry.Error.Stack
		}
	}
	
	// Add metadata
	for key, value := range entry.Metadata {
		fields[key] = value
	}
	
	return fields
}

// ContextLogger provides logging with context information
type ContextLogger struct {
	logger *StructuredLogger
	ctx    context.Context
	fields map[string]interface{}
}

// WithField adds a field to the context logger
func (cl *ContextLogger) WithField(key string, value interface{}) *ContextLogger {
	newFields := make(map[string]interface{})
	for k, v := range cl.fields {
		newFields[k] = v
	}
	newFields[key] = value

	return &ContextLogger{
		logger: cl.logger,
		ctx:    cl.ctx,
		fields: newFields,
	}
}

// WithFields adds multiple fields to the context logger
func (cl *ContextLogger) WithFields(fields map[string]interface{}) *ContextLogger {
	newFields := make(map[string]interface{})
	for k, v := range cl.fields {
		newFields[k] = v
	}
	for k, v := range fields {
		newFields[k] = v
	}

	return &ContextLogger{
		logger: cl.logger,
		ctx:    cl.ctx,
		fields: newFields,
	}
}

// Info logs an info message with context
func (cl *ContextLogger) Info(message string) {
	cl.log(LogLevelInfo, message, nil)
}

// Warn logs a warning message with context
func (cl *ContextLogger) Warn(message string) {
	cl.log(LogLevelWarn, message, nil)
}

// Error logs an error message with context
func (cl *ContextLogger) Error(message string, err error) {
	cl.log(LogLevelError, message, err)
}

// Debug logs a debug message with context
func (cl *ContextLogger) Debug(message string) {
	cl.log(LogLevelDebug, message, nil)
}

// log logs with context information
func (cl *ContextLogger) log(level LogLevel, message string, err error) {
	entry := cl.logger.createLogEntry(level, message, err)

	// Extract context information
	if correlationID := cl.ctx.Value(cl.logger.correlationIDKey); correlationID != nil {
		if id, ok := correlationID.(string); ok {
			entry.CorrelationID = id
		}
	}

	if traceID := cl.ctx.Value(cl.logger.traceIDKey); traceID != nil {
		if id, ok := traceID.(string); ok {
			entry.TraceID = id
		}
	}

	if spanID := cl.ctx.Value(cl.logger.spanIDKey); spanID != nil {
		if id, ok := spanID.(string); ok {
			entry.SpanID = id
		}
	}

	// Add context fields
	for key, value := range cl.fields {
		entry.Metadata[key] = value
	}

	// Add caller information
	if pc, file, line, ok := runtime.Caller(2); ok {
		entry.File = file
		entry.Line = line
		if fn := runtime.FuncForPC(pc); fn != nil {
			entry.Function = fn.Name()
		}
	}

	// Convert to logrus fields and log
	logrusFields := cl.logger.entryToLogrusFields(entry)

	switch level {
	case LogLevelDebug:
		cl.logger.logger.WithFields(logrusFields).Debug(message)
	case LogLevelInfo:
		cl.logger.logger.WithFields(logrusFields).Info(message)
	case LogLevelWarn:
		cl.logger.logger.WithFields(logrusFields).Warn(message)
	case LogLevelError:
		cl.logger.logger.WithFields(logrusFields).Error(message)
	}
}

// FieldLogger provides logging with predefined fields
type FieldLogger struct {
	logger *StructuredLogger
	fields map[string]interface{}
}

// WithField adds a field to the field logger
func (fl *FieldLogger) WithField(key string, value interface{}) *FieldLogger {
	newFields := make(map[string]interface{})
	for k, v := range fl.fields {
		newFields[k] = v
	}
	newFields[key] = value

	return &FieldLogger{
		logger: fl.logger,
		fields: newFields,
	}
}

// Info logs an info message with fields
func (fl *FieldLogger) Info(message string) {
	fl.logger.log(LogLevelInfo, message, nil, fl.fields)
}

// Warn logs a warning message with fields
func (fl *FieldLogger) Warn(message string) {
	fl.logger.log(LogLevelWarn, message, nil, fl.fields)
}

// Error logs an error message with fields
func (fl *FieldLogger) Error(message string, err error) {
	fl.logger.log(LogLevelError, message, err, fl.fields)
}

// Debug logs a debug message with fields
func (fl *FieldLogger) Debug(message string) {
	fl.logger.log(LogLevelDebug, message, nil, fl.fields)
}

// LogAIInference logs AI inference operations with structured data
func (sl *StructuredLogger) LogAIInference(ctx context.Context, provider, model, task string, duration time.Duration, success bool, confidence float64) {
	fields := map[string]interface{}{
		"component":     "ai_service",
		"operation":     "inference",
		"ai_provider":   provider,
		"model_id":      model,
		"task":          task,
		"duration_ms":   duration.Milliseconds(),
		"success":       success,
		"confidence":    confidence,
	}

	message := fmt.Sprintf("AI inference completed: %s/%s", provider, model)
	if success {
		sl.WithContext(ctx).WithFields(fields).Info(message)
	} else {
		sl.WithContext(ctx).WithFields(fields).Warn(message)
	}
}

// LogTrainingOperation logs training operations with structured data
func (sl *StructuredLogger) LogTrainingOperation(ctx context.Context, serviceType, operation string, duration time.Duration, success bool, accuracy float64) {
	fields := map[string]interface{}{
		"component":     "training_service",
		"operation":     operation,
		"service_type":  serviceType,
		"duration_ms":   duration.Milliseconds(),
		"success":       success,
		"accuracy":      accuracy,
	}

	message := fmt.Sprintf("Training operation completed: %s/%s", serviceType, operation)
	if success {
		sl.WithContext(ctx).WithFields(fields).Info(message)
	} else {
		sl.WithContext(ctx).WithFields(fields).Error(message, fmt.Errorf("training operation failed"))
	}
}

// LogCacheOperation logs cache operations with performance metrics
func (sl *StructuredLogger) LogCacheOperation(ctx context.Context, cacheType, operation string, duration time.Duration, hit bool) {
	fields := map[string]interface{}{
		"component":     "cache_service",
		"operation":     operation,
		"cache_type":    cacheType,
		"duration_ns":   duration.Nanoseconds(),
		"cache_hit":     hit,
		"performance":   "ultra_fast",
	}

	message := fmt.Sprintf("Cache operation: %s %s", operation, cacheType)
	sl.WithContext(ctx).WithFields(fields).Debug(message)
}

// LogHTTPRequest logs HTTP requests with performance metrics
func (sl *StructuredLogger) LogHTTPRequest(ctx context.Context, method, endpoint string, statusCode int, duration time.Duration, userID string) {
	fields := map[string]interface{}{
		"component":     "http_server",
		"operation":     "request",
		"method":        method,
		"endpoint":      endpoint,
		"status_code":   statusCode,
		"duration_ms":   duration.Milliseconds(),
		"user_id":       userID,
	}

	message := fmt.Sprintf("%s %s - %d", method, endpoint, statusCode)
	if statusCode >= 200 && statusCode < 400 {
		sl.WithContext(ctx).WithFields(fields).Info(message)
	} else if statusCode >= 400 && statusCode < 500 {
		sl.WithContext(ctx).WithFields(fields).Warn(message)
	} else {
		sl.WithContext(ctx).WithFields(fields).Error(message, fmt.Errorf("HTTP error %d", statusCode))
	}
}

// LogBusinessEvent logs business events with context
func (sl *StructuredLogger) LogBusinessEvent(ctx context.Context, eventType, documentType string, userID, sessionID string, metadata map[string]interface{}) {
	fields := map[string]interface{}{
		"component":     "business_logic",
		"operation":     "event",
		"event_type":    eventType,
		"document_type": documentType,
		"user_id":       userID,
		"session_id":    sessionID,
	}

	// Add metadata
	for key, value := range metadata {
		fields[key] = value
	}

	message := fmt.Sprintf("Business event: %s for %s", eventType, documentType)
	sl.WithContext(ctx).WithFields(fields).Info(message)
}
