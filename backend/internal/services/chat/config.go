package chat

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
)

// AIServiceConfig holds comprehensive configuration for AI services
type AIServiceConfig struct {
	// Core Settings
	EnableVariation         bool   `json:"enable_variation" yaml:"enable_variation"`
	EnableEnhancedSelection bool   `json:"enable_enhanced_selection" yaml:"enable_enhanced_selection"`
	FallbackProvider        string `json:"fallback_provider" yaml:"fallback_provider"`

	// Performance Settings
	ProviderTimeout     time.Duration `json:"provider_timeout" yaml:"provider_timeout"`
	MaxRetries          int           `json:"max_retries" yaml:"max_retries"`
	HealthCheckInterval time.Duration `json:"health_check_interval" yaml:"health_check_interval"`

	// Provider-specific Settings
	ProviderConfigs map[string]*ProviderConfig `json:"provider_configs" yaml:"provider_configs"`

	// Advanced Features
	EnableConcurrentProcessing bool `json:"enable_concurrent_processing" yaml:"enable_concurrent_processing"`
	EnablePerformanceTracking  bool `json:"enable_performance_tracking" yaml:"enable_performance_tracking"`
	EnableUserHistoryTracking  bool `json:"enable_user_history_tracking" yaml:"enable_user_history_tracking"`
}

// ProviderConfig holds configuration for individual providers
type ProviderConfig struct {
	Enabled    bool          `json:"enabled" yaml:"enabled"`
	Timeout    time.Duration `json:"timeout" yaml:"timeout"`
	RetryCount int           `json:"retry_count" yaml:"retry_count"`
	Weight     float64       `json:"weight" yaml:"weight"`
	APIKey     string        `json:"api_key" yaml:"api_key"`
	BaseURL    string        `json:"base_url" yaml:"base_url"`
	Model      string        `json:"model" yaml:"model"`
}

// NewDefaultAIServiceConfig creates a default configuration
func NewDefaultAIServiceConfig() *AIServiceConfig {
	return &AIServiceConfig{
		EnableVariation:         getEnvBool("AI_ENABLE_VARIATION", true),
		EnableEnhancedSelection: getEnvBool("AI_ENHANCED_SELECTION", true),
		FallbackProvider:        getEnvString("AI_FALLBACK_PROVIDER", "simple"),

		ProviderTimeout:     getEnvDuration("AI_PROVIDER_TIMEOUT", 30*time.Second),
		MaxRetries:          getEnvInt("AI_MAX_RETRIES", 3),
		HealthCheckInterval: getEnvDuration("AI_HEALTH_CHECK_INTERVAL", 30*time.Second),

		ProviderConfigs: map[string]*ProviderConfig{
			"simple": {
				Enabled:    true,
				Timeout:    5 * time.Second,
				RetryCount: 2,
				Weight:     0.3,
			},
			"enhanced": {
				Enabled:    true,
				Timeout:    10 * time.Second,
				RetryCount: 3,
				Weight:     0.7,
			},
			"groq": {
				Enabled:    getEnvString("GROQ_API_KEY", "") != "",
				Timeout:    15 * time.Second,
				RetryCount: 3,
				Weight:     0.8,
				APIKey:     getEnvString("GROQ_API_KEY", ""),
			},
			"groq-selly": {
				Enabled:    getEnvString("GROQ_API_KEY", "") != "",
				Timeout:    15 * time.Second,
				RetryCount: 3,
				Weight:     0.9,
				APIKey:     getEnvString("GROQ_API_KEY", ""),
			},
			"huggingface": {
				Enabled:    getEnvBool("ENABLE_HUGGINGFACE", false) && getEnvString("HUGGINGFACE_API_KEY", "") != "",
				Timeout:    20 * time.Second,
				RetryCount: 2,
				Weight:     0.6,
				APIKey:     getEnvString("HUGGINGFACE_API_KEY", ""),
			},
		},

		EnableConcurrentProcessing: getEnvBool("AI_ENABLE_CONCURRENT_PROCESSING", true),
		EnablePerformanceTracking:  getEnvBool("AI_ENABLE_PERFORMANCE_TRACKING", true),
		EnableUserHistoryTracking:  getEnvBool("AI_ENABLE_USER_HISTORY_TRACKING", true),
	}
}

// Validate validates the configuration
func (config *AIServiceConfig) Validate() error {
	if config.FallbackProvider == "" {
		return fmt.Errorf("fallback_provider cannot be empty")
	}

	if config.ProviderTimeout <= 0 {
		return fmt.Errorf("provider_timeout must be positive")
	}

	if config.MaxRetries < 0 {
		return fmt.Errorf("max_retries cannot be negative")
	}

	if config.HealthCheckInterval <= 0 {
		return fmt.Errorf("health_check_interval must be positive")
	}

	// Validate provider configurations
	for name, providerConfig := range config.ProviderConfigs {
		if providerConfig.Timeout <= 0 {
			return fmt.Errorf("provider %s timeout must be positive", name)
		}
		if providerConfig.Weight < 0 || providerConfig.Weight > 1 {
			return fmt.Errorf("provider %s weight must be between 0 and 1", name)
		}
		if providerConfig.RetryCount < 0 {
			return fmt.Errorf("provider %s retry_count cannot be negative", name)
		}
	}

	return nil
}

// GetEnabledProviders returns a list of enabled provider names
func (config *AIServiceConfig) GetEnabledProviders() []string {
	var providers []string
	for name, providerConfig := range config.ProviderConfigs {
		if providerConfig.Enabled {
			providers = append(providers, name)
		}
	}
	return providers
}

// GetProviderConfig returns configuration for a specific provider
func (config *AIServiceConfig) GetProviderConfig(providerName string) (*ProviderConfig, bool) {
	providerConfig, exists := config.ProviderConfigs[providerName]
	return providerConfig, exists
}

// IsProviderEnabled checks if a provider is enabled
func (config *AIServiceConfig) IsProviderEnabled(providerName string) bool {
	if providerConfig, exists := config.ProviderConfigs[providerName]; exists {
		return providerConfig.Enabled
	}
	return false
}

// UpdateProviderConfig updates configuration for a specific provider
func (config *AIServiceConfig) UpdateProviderConfig(providerName string, updates *ProviderConfig) error {
	if existing, exists := config.ProviderConfigs[providerName]; exists {
		// Merge updates with existing configuration
		if updates.Enabled != existing.Enabled {
			existing.Enabled = updates.Enabled
		}
		if updates.Timeout > 0 {
			existing.Timeout = updates.Timeout
		}
		if updates.RetryCount >= 0 {
			existing.RetryCount = updates.RetryCount
		}
		if updates.Weight >= 0 && updates.Weight <= 1 {
			existing.Weight = updates.Weight
		}
		if updates.APIKey != "" {
			existing.APIKey = updates.APIKey
		}
		if updates.BaseURL != "" {
			existing.BaseURL = updates.BaseURL
		}
		if updates.Model != "" {
			existing.Model = updates.Model
		}

		logrus.WithFields(logrus.Fields{
			"provider": providerName,
			"enabled":  existing.Enabled,
			"timeout":  existing.Timeout,
		}).Info("Provider configuration updated")

		return nil
	}

	return fmt.Errorf("provider %s not found in configuration", providerName)
}

// Helper functions for environment variable parsing

func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

// LoadFromEnvironment loads configuration from environment variables (for backward compatibility)
func (config *AIServiceConfig) LoadFromEnvironment() error {
	// Update core settings from environment
	config.EnableVariation = getEnvBool("AI_ENABLE_VARIATION", config.EnableVariation)
	config.EnableEnhancedSelection = getEnvBool("AI_ENHANCED_SELECTION", config.EnableEnhancedSelection)
	config.FallbackProvider = getEnvString("AI_FALLBACK_PROVIDER", config.FallbackProvider)

	// Update performance settings
	config.ProviderTimeout = getEnvDuration("AI_PROVIDER_TIMEOUT", config.ProviderTimeout)
	config.MaxRetries = getEnvInt("AI_MAX_RETRIES", config.MaxRetries)
	config.HealthCheckInterval = getEnvDuration("AI_HEALTH_CHECK_INTERVAL", config.HealthCheckInterval)

	// Update advanced features
	config.EnableConcurrentProcessing = getEnvBool("AI_ENABLE_CONCURRENT_PROCESSING", config.EnableConcurrentProcessing)
	config.EnablePerformanceTracking = getEnvBool("AI_ENABLE_PERFORMANCE_TRACKING", config.EnablePerformanceTracking)
	config.EnableUserHistoryTracking = getEnvBool("AI_ENABLE_USER_HISTORY_TRACKING", config.EnableUserHistoryTracking)

	// Update provider-specific settings
	if groqAPIKey := getEnvString("GROQ_API_KEY", ""); groqAPIKey != "" {
		if groqConfig, exists := config.ProviderConfigs["groq"]; exists {
			groqConfig.Enabled = true
			groqConfig.APIKey = groqAPIKey
		}
		if groqSELLYConfig, exists := config.ProviderConfigs["groq-selly"]; exists {
			groqSELLYConfig.Enabled = true
			groqSELLYConfig.APIKey = groqAPIKey
		}
	}

	if hfAPIKey := getEnvString("HUGGINGFACE_API_KEY", ""); hfAPIKey != "" {
		if hfConfig, exists := config.ProviderConfigs["huggingface"]; exists {
			hfConfig.Enabled = getEnvBool("ENABLE_HUGGINGFACE", false)
			hfConfig.APIKey = hfAPIKey
		}
	}

	logrus.Info("✅ Configuration loaded from environment variables")
	return nil
}

// ToEnvironmentVariables converts configuration to environment variable format
func (config *AIServiceConfig) ToEnvironmentVariables() map[string]string {
	envVars := make(map[string]string)

	// Core settings
	envVars["AI_ENABLE_VARIATION"] = strconv.FormatBool(config.EnableVariation)
	envVars["AI_ENHANCED_SELECTION"] = strconv.FormatBool(config.EnableEnhancedSelection)
	envVars["AI_FALLBACK_PROVIDER"] = config.FallbackProvider

	// Performance settings
	envVars["AI_PROVIDER_TIMEOUT"] = config.ProviderTimeout.String()
	envVars["AI_MAX_RETRIES"] = strconv.Itoa(config.MaxRetries)
	envVars["AI_HEALTH_CHECK_INTERVAL"] = config.HealthCheckInterval.String()

	// Advanced features
	envVars["AI_ENABLE_CONCURRENT_PROCESSING"] = strconv.FormatBool(config.EnableConcurrentProcessing)
	envVars["AI_ENABLE_PERFORMANCE_TRACKING"] = strconv.FormatBool(config.EnablePerformanceTracking)
	envVars["AI_ENABLE_USER_HISTORY_TRACKING"] = strconv.FormatBool(config.EnableUserHistoryTracking)

	// Provider API keys
	for name, providerConfig := range config.ProviderConfigs {
		if providerConfig.APIKey != "" {
			switch name {
			case "groq", "groq-selly":
				envVars["GROQ_API_KEY"] = providerConfig.APIKey
			case "huggingface":
				envVars["HUGGINGFACE_API_KEY"] = providerConfig.APIKey
				envVars["ENABLE_HUGGINGFACE"] = strconv.FormatBool(providerConfig.Enabled)
			}
		}
	}

	return envVars
}

// Clone creates a deep copy of the configuration
func (config *AIServiceConfig) Clone() *AIServiceConfig {
	clone := &AIServiceConfig{
		EnableVariation:            config.EnableVariation,
		EnableEnhancedSelection:    config.EnableEnhancedSelection,
		FallbackProvider:           config.FallbackProvider,
		ProviderTimeout:            config.ProviderTimeout,
		MaxRetries:                 config.MaxRetries,
		HealthCheckInterval:        config.HealthCheckInterval,
		ProviderConfigs:            make(map[string]*ProviderConfig),
		EnableConcurrentProcessing: config.EnableConcurrentProcessing,
		EnablePerformanceTracking:  config.EnablePerformanceTracking,
		EnableUserHistoryTracking:  config.EnableUserHistoryTracking,
	}

	// Deep copy provider configs
	for name, providerConfig := range config.ProviderConfigs {
		clone.ProviderConfigs[name] = &ProviderConfig{
			Enabled:    providerConfig.Enabled,
			Timeout:    providerConfig.Timeout,
			RetryCount: providerConfig.RetryCount,
			Weight:     providerConfig.Weight,
			APIKey:     providerConfig.APIKey,
			BaseURL:    providerConfig.BaseURL,
			Model:      providerConfig.Model,
		}
	}

	return clone
}
