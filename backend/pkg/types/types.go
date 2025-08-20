package types

import "time"

// StandardResponse represents a standard API response format
type StandardResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrorInfo  `json:"error,omitempty"`
	Metadata  *Metadata   `json:"metadata"`
}

// ErrorInfo represents error information in API responses
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Metadata represents response metadata
type Metadata struct {
	ProcessingTime int64     `json:"processingTime"`
	Timestamp      time.Time `json:"timestamp"`
	Version        string    `json:"version"`
	Provider       string    `json:"provider"`
	RequestID      string    `json:"requestId,omitempty"`
}

// HealthStatus represents system health status
type HealthStatus struct {
	Status       string                 `json:"status"`
	Timestamp    time.Time              `json:"timestamp"`
	ResponseTime int64                  `json:"responseTime"`
	Version      string                 `json:"version"`
	Services     map[string]interface{} `json:"services"`
	Summary      *HealthSummary         `json:"summary,omitempty"`
}

// HealthSummary represents a summary of health check results
type HealthSummary struct {
	TotalServices    int `json:"totalServices"`
	HealthyServices  int `json:"healthyServices"`
	DegradedServices int `json:"degradedServices"`
}

// ServiceHealth represents individual service health
type ServiceHealth struct {
	Status    string                 `json:"status"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Available bool                   `json:"available"`
	Error     string                 `json:"error,omitempty"`
}

// MetricsResponse represents performance metrics response
type MetricsResponse struct {
	Application map[string]interface{} `json:"application"`
	Database    map[string]interface{} `json:"database"`
	Cache       map[string]interface{} `json:"cache"`
	System      map[string]interface{} `json:"system"`
	Health      map[string]interface{} `json:"health"`
	Meta        *Metadata              `json:"meta"`
}

// DatabaseTestResult represents database connectivity test results
type DatabaseTestResult struct {
	Timestamp    time.Time              `json:"timestamp"`
	Healthy      bool                   `json:"healthy"`
	ResponseTime int64                  `json:"responseTime"`
	Provider     string                 `json:"provider"`
	PoolStatus   map[string]interface{} `json:"poolStatus"`
	Error        string                 `json:"error,omitempty"`
}

// CacheTestResult represents cache test results
type CacheTestResult struct {
	Timestamp    time.Time              `json:"timestamp"`
	Healthy      bool                   `json:"healthy"`
	ResponseTime int64                  `json:"responseTime"`
	CacheType    string                 `json:"cacheType"`
	Stats        map[string]interface{} `json:"stats"`
	Error        string                 `json:"error,omitempty"`
}

// AuthRequest represents authentication request
type AuthRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Error   string                 `json:"error,omitempty"`
}

// UserInfo represents user information
type UserInfo struct {
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PerformanceMetrics represents performance measurement data
type PerformanceMetrics struct {
	Iterations      int     `json:"iterations"`
	SuccessCount    int     `json:"successCount"`
	SuccessRate     float64 `json:"successRate"`
	AvgResponseTime float64 `json:"avgResponseTime"`
	MinResponseTime int64   `json:"minResponseTime"`
	MaxResponseTime int64   `json:"maxResponseTime"`
	ResponseTimes   []int64 `json:"responseTimes,omitempty"`
}

// SystemInfo represents system information
type SystemInfo struct {
	Service     string    `json:"service"`
	Version     string    `json:"version"`
	Environment string    `json:"environment"`
	StartTime   time.Time `json:"startTime"`
	Uptime      float64   `json:"uptime"`
	GoVersion   string    `json:"goVersion"`
	Platform    string    `json:"platform"`
}

// CacheStats represents cache statistics
type CacheStats struct {
	MemoryHits   int64   `json:"memoryHits"`
	MemoryMisses int64   `json:"memoryMisses"`
	RedisHits    int64   `json:"redisHits"`
	RedisMisses  int64   `json:"redisMisses"`
	TotalSets    int64   `json:"totalSets"`
	HitRatio     float64 `json:"hitRatio"`
}

// DatabaseStats represents database statistics
type DatabaseStats struct {
	TotalConnections     int     `json:"totalConnections"`
	AvailableConnections int     `json:"availableConnections"`
	MaxConnections       int     `json:"maxConnections"`
	MinConnections       int     `json:"minConnections"`
	PoolUtilization      float64 `json:"poolUtilization"`
	PoolEnabled          bool    `json:"poolEnabled"`
}

// APIEndpoint represents an API endpoint definition
type APIEndpoint struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Description string `json:"description"`
	Public      bool   `json:"public"`
	AuthRequired bool  `json:"authRequired"`
}

// ConfigInfo represents configuration information
type ConfigInfo struct {
	Environment   string                 `json:"environment"`
	Port          int                    `json:"port"`
	LogLevel      string                 `json:"logLevel"`
	DatabaseURL   string                 `json:"databaseUrl,omitempty"`
	RedisURL      string                 `json:"redisUrl,omitempty"`
	Features      map[string]bool        `json:"features"`
	Limits        map[string]interface{} `json:"limits"`
}
