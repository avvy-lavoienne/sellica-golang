# SELLY AI Error Handling Patterns Reference

**Document**: Error Management, Recovery & Resilience Patterns
**Project Date**: 2025-08-28
**Created**: 2025-08-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

## Error Handling Architecture

### Comprehensive Error Management System

SELLY AI implements a **multi-layered error handling strategy** with graceful degradation, intelligent recovery, and comprehensive logging for production resilience.

```
┌─────────────────────────────────────────────────────────────┐
│                 SELLY Error Handling Layers                │
├─────────────────────────────────────────────────────────────┤
│  HTTP Layer        │ Status Codes │ User-Friendly Messages │
│  Service Layer     │ Error Wrapping│ Context Preservation  │
│  Infrastructure    │ Circuit Breaker│ Retry Mechanisms     │
│  External APIs     │ Fallback Logic│ Timeout Handling     │
├─────────────────────────────────────────────────────────────┤
│  Error Recovery    │ Graceful Degradation │ Auto-Healing   │
│  ├── Fallback Providers │ ├── Cache Fallback │ ├── Restart │
│  ├── Simple Responses   │ ├── Offline Mode   │ ├── Cleanup │
│  └── Manual Override    │ └── Partial Service │ └── Alerts  │
└─────────────────────────────────────────────────────────────┘
```

## Error Types & Classification

### Standard Error Types

```go
// Common error types across the SELLY system
var (
    // Authentication & Authorization Errors
    ErrUnauthorized        = errors.New("unauthorized access")
    ErrInvalidToken        = errors.New("invalid or expired token")
    ErrInsufficientPermissions = errors.New("insufficient permissions")
    
    // Database Errors
    ErrDatabaseNotHealthy  = errors.New("database service is not healthy")
    ErrUserNotFound        = errors.New("user not found")
    ErrUserAlreadyExists   = errors.New("user already exists")
    ErrSessionNotFound     = errors.New("session not found")
    
    // AI Service Errors
    ErrAIProviderUnavailable = errors.New("AI provider unavailable")
    ErrAIProcessingTimeout   = errors.New("AI processing timeout")
    ErrInvalidQuery          = errors.New("invalid query format")
    ErrModelNotFound         = errors.New("AI model not found")
    
    // Cache Errors
    ErrCacheUnavailable    = errors.New("cache service unavailable")
    ErrCacheKeyNotFound    = errors.New("cache key not found")
    
    // External Service Errors
    ErrExternalServiceDown = errors.New("external service unavailable")
    ErrRateLimitExceeded   = errors.New("rate limit exceeded")
    ErrCircuitBreakerOpen  = errors.New("circuit breaker is open")
    
    // Validation Errors
    ErrInvalidInput        = errors.New("invalid input parameters")
    ErrValidationFailed    = errors.New("data validation failed")
    ErrMissingRequiredField = errors.New("missing required field")
)
```

### Error Context Structure

```go
type ErrorContext struct {
    Code        string                 `json:"code"`
    Message     string                 `json:"message"`
    Details     string                 `json:"details,omitempty"`
    UserMessage string                 `json:"user_message"`
    RequestID   string                 `json:"request_id"`
    Timestamp   time.Time             `json:"timestamp"`
    Service     string                 `json:"service"`
    Operation   string                 `json:"operation"`
    UserID      string                 `json:"user_id,omitempty"`
    SessionID   string                 `json:"session_id,omitempty"`
    Metadata    map[string]interface{} `json:"metadata,omitempty"`
    StackTrace  string                 `json:"stack_trace,omitempty"`
    Recoverable bool                   `json:"recoverable"`
}

type SellyError struct {
    Context    ErrorContext `json:"context"`
    Cause      error        `json:"-"`
    HTTPStatus int          `json:"http_status"`
}

func (e *SellyError) Error() string {
    return fmt.Sprintf("[%s] %s: %s", e.Context.Code, e.Context.Service, e.Context.Message)
}

func (e *SellyError) Unwrap() error {
    return e.Cause
}
```

## Error Wrapping & Context Preservation

### Service-Level Error Wrapping

**File**: `backend/internal/services/chat/service.go`

```go
func (s *Service) ProcessChat(ctx context.Context, req *ChatRequest, authContext interface{}) (*ChatResponse, error) {
    requestID := ctx.Value("request_id").(string)
    userID := authContext.(*auth.AuthContext).UserID
    
    // Wrap errors with context throughout the processing chain
    aiRequest := &AIRequest{
        Query:           req.Message,
        UserID:          userID,
        SessionID:       s.getOrCreateSession(userID),
        Context:         req.Context,
        EnhancementMode: req.EnhancementMode,
    }
    
    aiResponse, err := s.aiService.ProcessQuery(ctx, aiRequest)
    if err != nil {
        // Wrap error with service context
        return nil, s.wrapError(err, "ProcessChat", "AI query processing failed", requestID, userID, map[string]interface{}{
            "query_length":     len(req.Message),
            "enhancement_mode": req.EnhancementMode,
            "session_id":       aiRequest.SessionID,
        })
    }
    
    // Continue processing...
    return response, nil
}

func (s *Service) wrapError(err error, operation, message, requestID, userID string, metadata map[string]interface{}) error {
    return &SellyError{
        Context: ErrorContext{
            Code:        s.generateErrorCode(err),
            Message:     message,
            Details:     err.Error(),
            UserMessage: s.generateUserFriendlyMessage(err),
            RequestID:   requestID,
            Timestamp:   time.Now(),
            Service:     "chat",
            Operation:   operation,
            UserID:      userID,
            Metadata:    metadata,
            StackTrace:  s.captureStackTrace(),
            Recoverable: s.isRecoverable(err),
        },
        Cause:      err,
        HTTPStatus: s.mapToHTTPStatus(err),
    }
}
```

### Error Code Generation

```go
func (s *Service) generateErrorCode(err error) string {
    switch {
    case errors.Is(err, ErrAIProviderUnavailable):
        return "AI_PROVIDER_UNAVAILABLE"
    case errors.Is(err, ErrAIProcessingTimeout):
        return "AI_PROCESSING_TIMEOUT"
    case errors.Is(err, ErrDatabaseNotHealthy):
        return "DATABASE_UNAVAILABLE"
    case errors.Is(err, ErrUnauthorized):
        return "UNAUTHORIZED_ACCESS"
    case errors.Is(err, ErrRateLimitExceeded):
        return "RATE_LIMIT_EXCEEDED"
    case errors.Is(err, ErrCircuitBreakerOpen):
        return "SERVICE_CIRCUIT_OPEN"
    default:
        return "INTERNAL_SERVER_ERROR"
    }
}

func (s *Service) generateUserFriendlyMessage(err error) string {
    switch {
    case errors.Is(err, ErrAIProviderUnavailable):
        return "Layanan AI sedang tidak tersedia. Silakan coba lagi dalam beberapa saat."
    case errors.Is(err, ErrAIProcessingTimeout):
        return "Pemrosesan membutuhkan waktu lebih lama dari biasanya. Silakan coba lagi."
    case errors.Is(err, ErrDatabaseNotHealthy):
        return "Terjadi gangguan pada sistem database. Tim teknis sedang menangani masalah ini."
    case errors.Is(err, ErrUnauthorized):
        return "Anda perlu masuk kembali untuk mengakses layanan ini."
    case errors.Is(err, ErrRateLimitExceeded):
        return "Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mencoba lagi."
    default:
        return "Terjadi kesalahan sistem. Silakan hubungi administrator jika masalah berlanjut."
    }
}
```

## Circuit Breaker Pattern

### Circuit Breaker Implementation

**File**: `backend/internal/services/concurrent/circuit_breaker.go`

```go
type CircuitBreaker struct {
    maxFailures     int
    resetTimeout    time.Duration
    failureCount    int64
    lastFailureTime time.Time
    state           CircuitState
    mu              sync.RWMutex
}

type CircuitState int

const (
    CircuitClosed CircuitState = iota
    CircuitOpen
    CircuitHalfOpen
)

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures:  maxFailures,
        resetTimeout: resetTimeout,
        state:        CircuitClosed,
    }
}

func (cb *CircuitBreaker) Allow() bool {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    now := time.Now()
    
    switch cb.state {
    case CircuitClosed:
        return true
        
    case CircuitOpen:
        if now.Sub(cb.lastFailureTime) > cb.resetTimeout {
            cb.state = CircuitHalfOpen
            cb.failureCount = 0
            logrus.Info("🔄 Circuit breaker transitioning to half-open state")
            return true
        }
        return false
        
    case CircuitHalfOpen:
        return true
        
    default:
        return false
    }
}

func (cb *CircuitBreaker) RecordSuccess() {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    cb.failureCount = 0
    
    if cb.state == CircuitHalfOpen {
        cb.state = CircuitClosed
        logrus.Info("✅ Circuit breaker closed - service recovered")
    }
}

func (cb *CircuitBreaker) RecordFailure() {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    cb.failureCount++
    cb.lastFailureTime = time.Now()
    
    if cb.failureCount >= int64(cb.maxFailures) && cb.state == CircuitClosed {
        cb.state = CircuitOpen
        logrus.WithField("failure_count", cb.failureCount).Warn("🔴 Circuit breaker opened - service failing")
    }
}
```

## Retry Mechanisms

### Exponential Backoff Retry

```go
type RetryConfig struct {
    MaxAttempts     int
    InitialDelay    time.Duration
    MaxDelay        time.Duration
    BackoffFactor   float64
    RetryableErrors []error
}

type RetryManager struct {
    config RetryConfig
}

func NewRetryManager(config RetryConfig) *RetryManager {
    return &RetryManager{config: config}
}

func (rm *RetryManager) ExecuteWithRetry(ctx context.Context, operation func() error) error {
    var lastErr error
    delay := rm.config.InitialDelay
    
    for attempt := 1; attempt <= rm.config.MaxAttempts; attempt++ {
        // Execute the operation
        err := operation()
        if err == nil {
            if attempt > 1 {
                logrus.WithField("attempt", attempt).Info("✅ Operation succeeded after retry")
            }
            return nil
        }
        
        lastErr = err
        
        // Check if error is retryable
        if !rm.isRetryable(err) {
            logrus.WithError(err).Warn("❌ Error is not retryable, aborting")
            return err
        }
        
        // Don't retry on last attempt
        if attempt == rm.config.MaxAttempts {
            break
        }
        
        // Log retry attempt
        logrus.WithFields(logrus.Fields{
            "attempt":    attempt,
            "max_attempts": rm.config.MaxAttempts,
            "delay":      delay,
            "error":      err.Error(),
        }).Warn("🔄 Operation failed, retrying...")
        
        // Wait with exponential backoff
        select {
        case <-ctx.Done():
            return fmt.Errorf("retry cancelled: %w", ctx.Err())
        case <-time.After(delay):
        }
        
        // Calculate next delay with exponential backoff
        delay = time.Duration(float64(delay) * rm.config.BackoffFactor)
        if delay > rm.config.MaxDelay {
            delay = rm.config.MaxDelay
        }
    }
    
    return fmt.Errorf("operation failed after %d attempts: %w", rm.config.MaxAttempts, lastErr)
}

func (rm *RetryManager) isRetryable(err error) bool {
    for _, retryableErr := range rm.config.RetryableErrors {
        if errors.Is(err, retryableErr) {
            return true
        }
    }
    
    // Check for specific error patterns
    errStr := err.Error()
    retryablePatterns := []string{
        "connection refused",
        "timeout",
        "temporary failure",
        "service unavailable",
        "rate limit",
    }
    
    for _, pattern := range retryablePatterns {
        if strings.Contains(strings.ToLower(errStr), pattern) {
            return true
        }
    }
    
    return false
}
```

## Graceful Degradation

### AI Service Fallback Chain

**File**: `backend/internal/services/chat/ai_service.go`

```go
func (s *AIService) ProcessQueryWithFallback(ctx context.Context, req *AIRequest) (*AIResponse, error) {
    // Primary processing attempt
    response, err := s.ProcessQuery(ctx, req)
    if err == nil {
        return response, nil
    }
    
    logrus.WithError(err).Warn("🔄 Primary AI processing failed, attempting fallback")
    
    // Fallback 1: Try different provider
    if fallbackProvider := s.selectFallbackProvider(err); fallbackProvider != nil {
        response, fallbackErr := fallbackProvider.ProcessQuery(ctx, req)
        if fallbackErr == nil {
            response.Model += " (Fallback)"
            response.Confidence *= 0.9 // Slightly reduce confidence for fallback
            logrus.Info("✅ Fallback provider succeeded")
            return response, nil
        }
        logrus.WithError(fallbackErr).Warn("🔄 Fallback provider also failed")
    }
    
    // Fallback 2: Use cached similar response
    if cachedResponse := s.findSimilarCachedResponse(req.Query); cachedResponse != nil {
        cachedResponse.Model = "Cached Response (Fallback)"
        cachedResponse.CacheHit = true
        cachedResponse.Confidence *= 0.8
        logrus.Info("✅ Using cached similar response as fallback")
        return cachedResponse, nil
    }
    
    // Fallback 3: Generate simple template response
    templateResponse := s.generateTemplateResponse(req.Query)
    templateResponse.Model = "Template Response (Fallback)"
    templateResponse.Confidence = 0.6
    logrus.Info("✅ Using template response as final fallback")
    
    return templateResponse, nil
}

func (s *AIService) selectFallbackProvider(originalErr error) AIProvider {
    switch {
    case errors.Is(originalErr, ErrAIProcessingTimeout):
        // Use faster, simpler provider for timeouts
        return s.providers["simple"]
    case errors.Is(originalErr, ErrAIProviderUnavailable):
        // Try alternative provider
        for name, provider := range s.providers {
            if provider.IsHealthy() && name != "enhanced" {
                return provider
            }
        }
    }
    return s.fallback
}

func (s *AIService) generateTemplateResponse(query string) *AIResponse {
    // Generate contextual template response based on query patterns
    templates := map[string]string{
        "akta":     "Untuk mengurus akta kelahiran, Anda perlu menyiapkan dokumen-dokumen berikut...",
        "ktp":      "Proses pembuatan KTP memerlukan beberapa persyaratan...",
        "kk":       "Untuk mengurus Kartu Keluarga, silakan siapkan dokumen...",
        "default":  "Maaf, sistem sedang mengalami gangguan. Silakan coba lagi atau hubungi petugas untuk bantuan lebih lanjut.",
    }
    
    queryLower := strings.ToLower(query)
    for keyword, template := range templates {
        if strings.Contains(queryLower, keyword) {
            return &AIResponse{
                Content:    template,
                Type:       "template",
                Confidence: 0.6,
                Model:      "Template Response System",
                CacheHit:   false,
            }
        }
    }
    
    return &AIResponse{
        Content:    templates["default"],
        Type:       "template",
        Confidence: 0.5,
        Model:      "Default Template Response",
        CacheHit:   false,
    }
}
```

## HTTP Error Handling

### Centralized Error Response Handler

**File**: `backend/internal/api/handlers/error_handler.go`

```go
type ErrorHandler struct {
    logger *logrus.Logger
}

func NewErrorHandler() *ErrorHandler {
    return &ErrorHandler{
        logger: logrus.New(),
    }
}

func (eh *ErrorHandler) HandleError(c *gin.Context, err error) {
    requestID := c.GetString("request_id")
    userID := c.GetString("user_id")
    
    // Extract or create SellyError
    var sellyErr *SellyError
    if errors.As(err, &sellyErr) {
        // Already wrapped error
    } else {
        // Wrap raw error
        sellyErr = &SellyError{
            Context: ErrorContext{
                Code:        "INTERNAL_SERVER_ERROR",
                Message:     "Internal server error",
                Details:     err.Error(),
                UserMessage: "Terjadi kesalahan sistem. Silakan coba lagi.",
                RequestID:   requestID,
                Timestamp:   time.Now(),
                Service:     "api",
                Operation:   c.Request.URL.Path,
                UserID:      userID,
                Recoverable: false,
            },
            Cause:      err,
            HTTPStatus: 500,
        }
    }
    
    // Log error with context
    eh.logError(sellyErr, c)
    
    // Send appropriate HTTP response
    eh.sendErrorResponse(c, sellyErr)
}

func (eh *ErrorHandler) logError(err *SellyError, c *gin.Context) {
    logEntry := eh.logger.WithFields(logrus.Fields{
        "error_code":   err.Context.Code,
        "request_id":   err.Context.RequestID,
        "user_id":      err.Context.UserID,
        "service":      err.Context.Service,
        "operation":    err.Context.Operation,
        "http_status":  err.HTTPStatus,
        "recoverable":  err.Context.Recoverable,
        "method":       c.Request.Method,
        "path":         c.Request.URL.Path,
        "client_ip":    c.ClientIP(),
        "user_agent":   c.Request.UserAgent(),
    })
    
    if err.Context.Metadata != nil {
        for k, v := range err.Context.Metadata {
            logEntry = logEntry.WithField(k, v)
        }
    }
    
    if err.HTTPStatus >= 500 {
        logEntry.WithError(err.Cause).Error("🔴 Server error occurred")
    } else if err.HTTPStatus >= 400 {
        logEntry.WithError(err.Cause).Warn("🟡 Client error occurred")
    }
}

func (eh *ErrorHandler) sendErrorResponse(c *gin.Context, err *SellyError) {
    response := gin.H{
        "error": gin.H{
            "code":         err.Context.Code,
            "message":      err.Context.UserMessage,
            "request_id":   err.Context.RequestID,
            "timestamp":    err.Context.Timestamp,
            "recoverable":  err.Context.Recoverable,
        },
    }
    
    // Add details for development environment
    if gin.Mode() == gin.DebugMode {
        response["error"].(gin.H)["details"] = err.Context.Details
        response["error"].(gin.H)["service"] = err.Context.Service
        response["error"].(gin.H)["operation"] = err.Context.Operation
    }
    
    // Add recovery suggestions for recoverable errors
    if err.Context.Recoverable {
        response["error"].(gin.H)["recovery_suggestions"] = eh.getRecoverySuggestions(err.Context.Code)
    }
    
    c.JSON(err.HTTPStatus, response)
}

func (eh *ErrorHandler) getRecoverySuggestions(errorCode string) []string {
    suggestions := map[string][]string{
        "AI_PROVIDER_UNAVAILABLE": {
            "Tunggu beberapa saat dan coba lagi",
            "Periksa koneksi internet Anda",
            "Hubungi administrator jika masalah berlanjut",
        },
        "RATE_LIMIT_EXCEEDED": {
            "Tunggu sebentar sebelum mengirim permintaan lagi",
            "Kurangi frekuensi permintaan Anda",
        },
        "DATABASE_UNAVAILABLE": {
            "Sistem sedang dalam pemeliharaan",
            "Coba lagi dalam beberapa menit",
        },
    }
    
    if suggestion, exists := suggestions[errorCode]; exists {
        return suggestion
    }
    
    return []string{"Silakan coba lagi atau hubungi dukungan teknis"}
}
```

## Error Monitoring & Alerting

### Error Metrics Collection

```go
type ErrorMetrics struct {
    TotalErrors      int64            `json:"total_errors"`
    ErrorsByCode     map[string]int64 `json:"errors_by_code"`
    ErrorsByService  map[string]int64 `json:"errors_by_service"`
    RecoverableErrors int64           `json:"recoverable_errors"`
    CriticalErrors   int64            `json:"critical_errors"`
    ErrorRate        float64          `json:"error_rate"`
    mu               sync.RWMutex
}

func (em *ErrorMetrics) RecordError(err *SellyError) {
    em.mu.Lock()
    defer em.mu.Unlock()
    
    em.TotalErrors++
    
    if em.ErrorsByCode == nil {
        em.ErrorsByCode = make(map[string]int64)
    }
    if em.ErrorsByService == nil {
        em.ErrorsByService = make(map[string]int64)
    }
    
    em.ErrorsByCode[err.Context.Code]++
    em.ErrorsByService[err.Context.Service]++
    
    if err.Context.Recoverable {
        em.RecoverableErrors++
    }
    
    if err.HTTPStatus >= 500 {
        em.CriticalErrors++
    }
}
```

This comprehensive error handling system ensures SELLY AI maintains high availability and provides excellent user experience even when facing various failure scenarios.
