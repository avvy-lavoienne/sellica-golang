package aktivitas_siak

import "context"

// DatabaseAdapter defines the interface for database operations
type DatabaseAdapter interface {
	// Create inserts a new aktivitas_siak record and returns the created record
	Create(ctx context.Context, userID string, req *AktivitasSiakCreateRequest) (*AktivitasSiakData, error)

	// GetByID retrieves a single aktivitas_siak record by UUID
	GetByID(ctx context.Context, id string) (*AktivitasSiakData, error)

	// GetByUserAndMonth retrieves a record for a specific user and month string
	GetByUserAndMonth(ctx context.Context, userID string, bulanRekapitulasi string) (*AktivitasSiakData, error)

	// ListByUser retrieves all aktivitas_siak records for a specific user with pagination
	ListByUser(ctx context.Context, userID string, page, pageSize int) (*AktivitasSiakListResponse, error)

	// ListAll retrieves all aktivitas_siak records (admin only) with pagination
	ListAll(ctx context.Context, page, pageSize int) (*AktivitasSiakListResponse, error)

	// Update modifies an existing aktivitas_siak record
	Update(ctx context.Context, id string, userID string, req *AktivitasSiakUpdateRequest) (*AktivitasSiakData, error)

	// Delete removes an aktivitas_siak record
	Delete(ctx context.Context, id string, userID string) error

	// CheckDuplicate checks if a record exists for the given user and month string
	CheckDuplicate(ctx context.Context, userID string, bulanRekapitulasi string) (exists bool, id *string, err error)

	// GetStatistics retrieves summary statistics for user's aktivitas records
	GetStatistics(ctx context.Context, userID string) (*Statistics, error)

	// GetAdminStatistics retrieves summary statistics for all aktivitas records (admin only)
	GetAdminStatistics(ctx context.Context) (*Statistics, error)
}

// CacheAdapter defines the interface for caching operations
type CacheAdapter interface {
	// Get retrieves a value from cache
	Get(ctx context.Context, key string, dest interface{}) error

	// Set stores a value in cache with optional TTL
	Set(ctx context.Context, key string, value interface{}, ttlSeconds int) error

	// Delete removes a value from cache
	Delete(ctx context.Context, key string) error

	// InvalidateUserCache clears all cache entries for a specific user
	InvalidateUserCache(ctx context.Context, userID string) error

	// InvalidateAllCache clears all aktivitas_siak cache entries
	InvalidateAllCache(ctx context.Context) error

	// GetWithFallback attempts to get from cache, falls back to function if not found
	GetWithFallback(ctx context.Context, key string, fallbackFn func() (interface{}, error)) (interface{}, error)
}

// MonitoringAdapter defines the interface for monitoring and metrics
type MonitoringAdapter interface {
	// RecordOperation records metrics for a specific operation
	RecordOperation(operation string, durationMs int, success bool, err error)

	// RecordCacheHit increments cache hit counter
	RecordCacheHit()

	// RecordCacheMiss increments cache miss counter
	RecordCacheMiss()

	// GetMetrics returns current metrics
	GetMetrics() map[string]interface{}
}

// AuditLogger defines the interface for audit logging
type AuditLogger interface {
	// LogCreate logs a record creation
	LogCreate(ctx context.Context, userID string, record *AktivitasSiakData) error

	// LogUpdate logs a record modification
	LogUpdate(ctx context.Context, userID string, recordID string, changes map[string]interface{}) error

	// LogDelete logs a record deletion
	LogDelete(ctx context.Context, userID string, recordID string) error

	// LogView logs a record access (for audit trail)
	LogView(ctx context.Context, userID string, recordID string) error

	// GetAuditTrail retrieves audit log entries for a record
	GetAuditTrail(ctx context.Context, recordID string) ([]map[string]interface{}, error)
}

// RateLimitChecker defines the interface for rate limiting
type RateLimitChecker interface {
	// CheckRateLimit checks if user has exceeded rate limit for operation
	CheckRateLimit(ctx context.Context, userID string, operation string) (allowed bool, remaining int, resetAfter int)

	// RecordOperation increments operation counter
	RecordOperation(ctx context.Context, userID string, operation string) error

	// Reset clears rate limit counters for user
	Reset(ctx context.Context, userID string, operation string) error
}

// Service is the main service interface for aktivitas_siak operations
type Service interface {
	// Create creates a new aktivitas_siak record with validation
	Create(ctx context.Context, userID string, req *AktivitasSiakCreateRequest) (*AktivitasSiakData, error)

	// GetByID retrieves a single record with authorization check (UUID-based)
	GetByID(ctx context.Context, userID string, id string, isAdmin bool) (*AktivitasSiakData, error)

	// List retrieves records for user or all records if admin
	List(ctx context.Context, userID string, isAdmin bool, page, pageSize int) (*AktivitasSiakListResponse, error)

	// Update modifies a record with validation (UUID-based)
	Update(ctx context.Context, userID string, id string, req *AktivitasSiakUpdateRequest, isAdmin bool) (*AktivitasSiakData, error)

	// Delete removes a record with authorization check (UUID-based)
	Delete(ctx context.Context, userID string, id string, isAdmin bool) error

	// CheckDuplicate checks if record exists for user and month string
	CheckDuplicate(ctx context.Context, userID string, bulanRekapitulasi string) (*DuplicateCheckResponse, error)

	// GetStatistics returns user statistics (or admin statistics if isAdmin=true)
	GetStatistics(ctx context.Context, userID string, isAdmin bool) (*Statistics, error)

	// Validate validates request data
	Validate(req *AktivitasSiakCreateRequest) *ValidationResult

	// Health returns service health status
	Health(ctx context.Context) map[string]interface{}
}
