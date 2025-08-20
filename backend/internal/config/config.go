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
			RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
			RedisDB:     getEnvAsInt("REDIS_DB", 0),
			TTLSeconds:  getEnvAsInt("CACHE_TTL_SECONDS", 300),
			MemoryMaxMB: getEnvAsInt("CACHE_MEMORY_MAX_MB", 100),
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
