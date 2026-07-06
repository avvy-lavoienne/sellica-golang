package config

import (
	"os"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
)

// Config holds all application configuration
type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	Cache      CacheConfig
	Auth       AuthConfig
	Monitoring MonitoringConfig
	Logging    LoggingConfig
	Knowledge  KnowledgeConfig
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port         int
	Mode         string
	Environment  string
	ReadTimeout  int
	WriteTimeout int
	IdleTimeout  int
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	URL            string
	AnonKey        string
	ServiceRoleKey string
	JWTSecret      string
	PoolMinSize    int
	PoolMaxSize    int
}

// CacheConfig holds cache-related configuration
type CacheConfig struct {
	RedisURL     string
	RedisDB      int
	TTLSeconds   int
	MemoryMaxMB  int

	// Smart TTL Configuration
	SmartTTL SmartTTLConfig

	// Intelligent Warming Configuration
	Warming WarmingConfig
}

// SmartTTLConfig holds intelligent TTL management configuration
type SmartTTLConfig struct {
	Enabled                    bool
	BaseTimeToLive            time.Duration
	ConfidenceMultiplier      float64
	ComplexityMultiplier      float64
	FreshnessMultiplier       float64
	AccessFrequencyMultiplier float64
	QueryPatternMultiplier    float64
	TimeOfDayMultiplier       float64
	UserBehaviorMultiplier    float64
	MinTTL                    time.Duration
	MaxTTL                    time.Duration
	DataFreshnessWeight       float64
	QueryPatternWeight        float64
	AccessFrequencyWeight     float64
	TimeOfDayWeight          float64
	UserBehaviorWeight       float64
}

// WarmingConfig holds intelligent cache warming configuration
type WarmingConfig struct {
	Enabled              bool
	WorkerCount          int
	WarmingInterval      time.Duration
	PredictionWindow     time.Duration
	MaxWarmingQueueSize  int
	PerformanceThreshold float64
	MinPredictionScore   float64
	MaxPredictions       int
	RateLimitPerMinute   int
	GovernmentServices   []string
}

// AuthConfig holds authentication-related configuration
type AuthConfig struct {
	JWTSecret           string
	TokenExpiryHours    int
	RefreshExpiryDays   int
}

// MonitoringConfig holds monitoring-related configuration
type MonitoringConfig struct {
	EnableMetrics     bool
	MetricsPort       int
	EnableHealthCheck bool
}

// LoggingConfig holds logging-related configuration
type LoggingConfig struct {
	Level  string
	Format string
}

// KnowledgeConfig holds knowledge base and document loading configuration
type KnowledgeConfig struct {
	DocumentsPath    string
	AdditionalPaths  []string // Additional document paths for specialized training data
	RecursiveScan    bool     // Enable recursive scanning of subdirectories (default: true)
	AutoIndexing     bool
	ChunkSize        int
	OverlapSize      int
	MaxConcurrency   int
	JSONProcessing   JSONProcessingConfig // Configuration for JSON training data processing
}

// JSONProcessingConfig holds configuration for JSON training data processing
type JSONProcessingConfig struct {
	Enabled           bool     // Enable JSON training data processing
	SupportedTypes    []string // Supported JSON training data types (e.g., "akta_kelahiran", "ktp")
	AutoLoadOnStartup bool     // Automatically load JSON files on server startup
	ValidationEnabled bool     // Enable JSON structure validation
}

// Load loads configuration from environment variables with sensible defaults
func Load() *Config {
	cfg := &Config{
		Server: ServerConfig{
			Port:         getEnvAsInt("PORT", 8080),
			Mode:         getEnv("GIN_MODE", "debug"),
			Environment:  getEnv("ENVIRONMENT", "development"),
			ReadTimeout:  getEnvAsInt("READ_TIMEOUT", 30),
			WriteTimeout: getEnvAsInt("WRITE_TIMEOUT", 30),
			IdleTimeout:  getEnvAsInt("IDLE_TIMEOUT", 120),
		},
		Database: DatabaseConfig{
			URL:            getEnv("SUPABASE_URL", ""),
			AnonKey:        getEnv("SUPABASE_ANON_KEY", ""),
			ServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
			JWTSecret:      getEnv("SUPABASE_JWT_SECRET", ""),
			PoolMinSize:    getEnvAsInt("DB_POOL_MIN_SIZE", 10),
			PoolMaxSize:    getEnvAsInt("DB_POOL_MAX_SIZE", 100),
		},
		Cache: CacheConfig{
			RedisURL:    getEnv("REDIS_URL", ""),
			RedisDB:     getEnvAsInt("REDIS_DB", 0),
			TTLSeconds:  getEnvAsInt("CACHE_TTL_SECONDS", 300),
			MemoryMaxMB: getEnvAsInt("CACHE_MEMORY_MAX_MB", 100),
			SmartTTL: SmartTTLConfig{
				Enabled:                    getEnvAsBool("CACHE_SMART_TTL_ENABLED", true),
				BaseTimeToLive:            getEnvAsDuration("CACHE_SMART_TTL_BASE", 5*time.Minute),
				ConfidenceMultiplier:      getEnvAsFloat("CACHE_SMART_TTL_CONFIDENCE_MULT", 2.0),
				ComplexityMultiplier:      getEnvAsFloat("CACHE_SMART_TTL_COMPLEXITY_MULT", 1.5),
				FreshnessMultiplier:       getEnvAsFloat("CACHE_SMART_TTL_FRESHNESS_MULT", 1.3),
				AccessFrequencyMultiplier: getEnvAsFloat("CACHE_SMART_TTL_ACCESS_FREQ_MULT", 1.8),
				QueryPatternMultiplier:    getEnvAsFloat("CACHE_SMART_TTL_PATTERN_MULT", 1.4),
				TimeOfDayMultiplier:       getEnvAsFloat("CACHE_SMART_TTL_TIME_MULT", 1.2),
				UserBehaviorMultiplier:    getEnvAsFloat("CACHE_SMART_TTL_USER_MULT", 1.6),
				MinTTL:                    getEnvAsDuration("CACHE_SMART_TTL_MIN", 30*time.Second),
				MaxTTL:                    getEnvAsDuration("CACHE_SMART_TTL_MAX", 2*time.Hour),
				DataFreshnessWeight:       getEnvAsFloat("CACHE_SMART_TTL_FRESHNESS_WEIGHT", 0.3),
				QueryPatternWeight:        getEnvAsFloat("CACHE_SMART_TTL_PATTERN_WEIGHT", 0.2),
				AccessFrequencyWeight:     getEnvAsFloat("CACHE_SMART_TTL_ACCESS_FREQ_WEIGHT", 0.2),
				TimeOfDayWeight:          getEnvAsFloat("CACHE_SMART_TTL_TIME_WEIGHT", 0.15),
				UserBehaviorWeight:       getEnvAsFloat("CACHE_SMART_TTL_USER_WEIGHT", 0.15),
			},
			Warming: WarmingConfig{
				Enabled:              getEnvAsBool("CACHE_WARMING_ENABLED", true),
				WorkerCount:          getEnvAsInt("CACHE_WARMING_WORKERS", 3),
				WarmingInterval:      getEnvAsDuration("CACHE_WARMING_INTERVAL", 5*time.Minute),
				PredictionWindow:     getEnvAsDuration("CACHE_WARMING_PREDICTION_WINDOW", 1*time.Hour),
				MaxWarmingQueueSize:  getEnvAsInt("CACHE_WARMING_QUEUE_SIZE", 1000),
				PerformanceThreshold: getEnvAsFloat("CACHE_WARMING_PERF_THRESHOLD", 0.8),
				MinPredictionScore:   getEnvAsFloat("CACHE_WARMING_MIN_SCORE", 0.7),
				MaxPredictions:       getEnvAsInt("CACHE_WARMING_MAX_PREDS", 50),
				RateLimitPerMinute:   getEnvAsInt("CACHE_WARMING_RATE_LIMIT", 100),
				GovernmentServices: []string{
					"akta kelahiran", "ktp", "akta kematian", "akta perkawinan",
					"kia", "kk", "perpindahan", "aku sah",
				},
			},
		},
		Auth: AuthConfig{
			JWTSecret:         getEnv("SUPABASE_JWT_SECRET", ""),
			TokenExpiryHours:  getEnvAsInt("TOKEN_EXPIRY_HOURS", 24),
			RefreshExpiryDays: getEnvAsInt("REFRESH_EXPIRY_DAYS", 30),
		},
		Monitoring: MonitoringConfig{
			EnableMetrics:     getEnvAsBool("ENABLE_METRICS", true),
			MetricsPort:       getEnvAsInt("METRICS_PORT", 9090),
			EnableHealthCheck: getEnvAsBool("ENABLE_HEALTH_CHECKS", true),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "text"),
		},
		Knowledge: KnowledgeConfig{
			DocumentsPath:  getEnv("KNOWLEDGE_DOCUMENTS_PATH", "data/training/documents"),
			AdditionalPaths: []string{
				// Legacy training document paths (maintain backward compatibility)
				"data/training/documents/akta-kelahiran",
				"data/training/documents/akta-kematian",
				"data/training/documents/ktp",
				"data/training/documents/kk",
				// New reference structure paths (Phase 4 implementation)
				"docs/reference/selly-intelligence/services/civil-registration",
				"docs/reference/selly-intelligence/services/identity-documents", 
				"docs/reference/selly-intelligence/services/general-services",
				"docs/reference/selly-intelligence/persona",
				"docs/reference/selly-intelligence/profile",
			},
			RecursiveScan:  getEnvAsBool("KNOWLEDGE_RECURSIVE_SCAN", true), // Enable recursive scanning by default
			AutoIndexing:   getEnvAsBool("KNOWLEDGE_AUTO_INDEXING", true),
			ChunkSize:      getEnvAsInt("KNOWLEDGE_CHUNK_SIZE", 800),
			OverlapSize:    getEnvAsInt("KNOWLEDGE_OVERLAP_SIZE", 100),
			MaxConcurrency: getEnvAsInt("KNOWLEDGE_MAX_CONCURRENCY", 5),
			JSONProcessing: JSONProcessingConfig{
				Enabled:           getEnvAsBool("KNOWLEDGE_JSON_ENABLED", true),
				SupportedTypes:    []string{"akta_kelahiran", "ktp", "kk", "akta_kematian", "akta_perkawinan"},
				AutoLoadOnStartup: getEnvAsBool("KNOWLEDGE_JSON_AUTO_LOAD", true),
				ValidationEnabled: getEnvAsBool("KNOWLEDGE_JSON_VALIDATION", true),
			},
		},
	}

	// Validate required configuration
	if err := cfg.Validate(); err != nil {
		logrus.Fatalf("Configuration validation failed: %v", err)
	}

	return cfg
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Database.URL == "" {
		logrus.Warn("SUPABASE_URL not set - database functionality will be limited")
	}
	if c.Database.ServiceRoleKey == "" {
		logrus.Warn("SUPABASE_SERVICE_ROLE_KEY not set - database operations will be limited")
	}
	if c.Auth.JWTSecret == "" {
		logrus.Warn("SUPABASE_JWT_SECRET not set - JWT validation will fail")
	}

	return nil
}

// Helper functions for environment variable parsing

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return defaultValue
}
