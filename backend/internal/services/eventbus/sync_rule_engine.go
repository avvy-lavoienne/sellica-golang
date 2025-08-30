package eventbus

import (
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// SyncRuleEngine provides rules-based engine for determining sync strategies
type SyncRuleEngine struct {
	// Configuration
	config *RuleEngineConfig

	// Rules storage
	rules         map[EventType][]SyncRule
	rulesMutex    sync.RWMutex

	// Strategy templates
	strategyTemplates map[string]*SyncStrategy

	// Metrics and monitoring
	metrics *RuleEngineMetrics
}

// RuleEngineConfig holds configuration for the rule engine
type RuleEngineConfig struct {
	// Rule evaluation
	MaxRulesPerEvent     int           `yaml:"max_rules_per_event"`
	RuleEvaluationTimeout time.Duration `yaml:"rule_evaluation_timeout"`

	// Strategy configuration
	DefaultStrategyTimeout time.Duration `yaml:"default_strategy_timeout"`
	MaxConcurrentStrategies int          `yaml:"max_concurrent_strategies"`

	// Monitoring
	EnableMetrics         bool          `yaml:"enable_metrics"`
	MetricsInterval       time.Duration `yaml:"metrics_interval"`
}

// SyncRule represents a synchronization rule
type SyncRule struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	EventType   EventType         `json:"event_type"`
	Priority    int               `json:"priority"`
	Conditions  []RuleCondition   `json:"conditions"`
	Strategy    *SyncStrategy     `json:"strategy"`
	Enabled     bool              `json:"enabled"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// RuleCondition represents a condition for rule evaluation
type RuleCondition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"` // equals, contains, greater_than, less_than, etc.
	Value    interface{} `json:"value"`
	Weight   float64     `json:"weight"`
}

// SyncStrategy represents a synchronization strategy
type SyncStrategy struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Type        StrategyType  `json:"type"`
	Description string        `json:"description"`
	Priority    Priority      `json:"priority"`
	Timeout     time.Duration `json:"timeout"`
	Steps       []StrategyStep `json:"steps"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// StrategyType defines the type of synchronization strategy
type StrategyType int

const (
	ImmediateSync StrategyType = iota
	BatchedSync
	DelayedSync
	ConditionalSync
	CustomSyncStrategy
)

// StrategyStep represents a step in a sync strategy
type StrategyStep struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       int                    `json:"type"` // Maps to SyncStepType
	Priority   int                    `json:"priority"`
	Config     map[string]interface{} `json:"config"`
	DependsOn  []string               `json:"depends_on"`
	Timeout    time.Duration          `json:"timeout"`
}

// RuleEngineMetrics tracks rule engine performance
type RuleEngineMetrics struct {
	RulesEvaluated     int64
	RulesMatched       int64
	StrategiesCreated  int64
	EvaluationErrors   int64
	AverageEvalTime    time.Duration
	mu                 sync.RWMutex
}

// NewSyncRuleEngine creates a new sync rule engine
func NewSyncRuleEngine() (*SyncRuleEngine, error) {
	config := DefaultRuleEngineConfig()

	engine := &SyncRuleEngine{
		config:            config,
		rules:             make(map[EventType][]SyncRule),
		strategyTemplates: make(map[string]*SyncStrategy),
		metrics:           &RuleEngineMetrics{},
	}

	// Initialize default rules
	err := engine.initializeDefaultRules()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize default rules: %w", err)
	}

	// Initialize strategy templates
	err = engine.initializeStrategyTemplates()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize strategy templates: %w", err)
	}

	logrus.Info("✅ Sync rule engine initialized")
	return engine, nil
}

// initializeDefaultRules sets up default synchronization rules
func (sre *SyncRuleEngine) initializeDefaultRules() error {
	defaultRules := []SyncRule{
		// User data sync rules
		{
			ID:        "user_profile_sync",
			Name:      "User Profile Synchronization",
			EventType: EventTypeUserProfileUpdated,
			Priority:  1,
			Conditions: []RuleCondition{
				{Field: "source", Operator: "equals", Value: "frontend", Weight: 1.0},
			},
			Strategy: &SyncStrategy{
				ID:          "immediate_user_sync",
				Name:        "Immediate User Data Sync",
				Type:        ImmediateSync,
				Description: "Immediately sync user profile changes",
				Priority:    PriorityHigh,
				Timeout:     30 * time.Second,
				Steps: []StrategyStep{
					{ID: "validate", Name: "Validate Data", Type: int(ValidateStep), Priority: 1},
					{ID: "sync_cache", Name: "Sync Cache", Type: int(ApplyStep), Priority: 2},
					{ID: "verify", Name: "Verify Sync", Type: int(VerifyStep), Priority: 3},
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Document sync rules
		{
			ID:        "document_upload_sync",
			Name:      "Document Upload Synchronization",
			EventType: EventTypeDocumentUploaded,
			Priority:  2,
			Conditions: []RuleCondition{
				{Field: "document_type", Operator: "contains", Value: "akta", Weight: 1.0},
			},
			Strategy: &SyncStrategy{
				ID:          "batched_document_sync",
				Name:        "Batched Document Sync",
				Type:        BatchedSync,
				Description: "Batch document processing for efficiency",
				Priority:    PriorityNormal,
				Timeout:     5 * time.Minute,
				Steps: []StrategyStep{
					{ID: "validate", Name: "Validate Document", Type: int(ValidateStep), Priority: 1},
					{ID: "process", Name: "Process Document", Type: int(TransformStep), Priority: 2},
					{ID: "sync_search", Name: "Sync Search Index", Type: int(ApplyStep), Priority: 3},
					{ID: "verify", Name: "Verify Processing", Type: int(VerifyStep), Priority: 4},
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Chat sync rules
		{
			ID:        "chat_message_sync",
			Name:      "Chat Message Synchronization",
			EventType: EventTypeChatMessageSent,
			Priority:  3,
			Conditions: []RuleCondition{
				{Field: "message_length", Operator: "greater_than", Value: 10, Weight: 1.0},
			},
			Strategy: &SyncStrategy{
				ID:          "immediate_chat_sync",
				Name:        "Immediate Chat Sync",
				Type:        ImmediateSync,
				Description: "Immediately sync chat messages for real-time experience",
				Priority:    PriorityHigh,
				Timeout:     10 * time.Second,
				Steps: []StrategyStep{
					{ID: "validate", Name: "Validate Message", Type: int(ValidateStep), Priority: 1},
					{ID: "sync_cache", Name: "Sync Cache", Type: int(ApplyStep), Priority: 2},
					{ID: "update_analytics", Name: "Update Analytics", Type: int(ApplyStep), Priority: 3},
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Cache invalidation rules
		{
			ID:        "cache_invalidation_sync",
			Name:      "Cache Invalidation Synchronization",
			EventType: EventTypeCacheInvalidate,
			Priority:  1,
			Conditions: []RuleCondition{
				{Field: "pattern", Operator: "contains", Value: "*", Weight: 1.0},
			},
			Strategy: &SyncStrategy{
				ID:          "immediate_cache_sync",
				Name:        "Immediate Cache Sync",
				Type:        ImmediateSync,
				Description: "Immediately invalidate cache patterns",
				Priority:    PriorityCritical,
				Timeout:     5 * time.Second,
				Steps: []StrategyStep{
					{ID: "invalidate", Name: "Invalidate Cache", Type: int(ApplyStep), Priority: 1},
					{ID: "verify", Name: "Verify Invalidation", Type: int(VerifyStep), Priority: 2},
				},
			},
			Enabled:   true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Add rules to engine
	for _, rule := range defaultRules {
		sre.rules[rule.EventType] = append(sre.rules[rule.EventType], rule)
	}

	logrus.WithField("rules_count", len(defaultRules)).Info("📋 Default sync rules initialized")
	return nil
}

// initializeStrategyTemplates sets up reusable strategy templates
func (sre *SyncRuleEngine) initializeStrategyTemplates() error {
	templates := map[string]*SyncStrategy{
		"immediate_sync": {
			ID:          "immediate_sync_template",
			Name:        "Immediate Synchronization",
			Type:        ImmediateSync,
			Description: "Execute synchronization immediately",
			Priority:    PriorityHigh,
			Timeout:     30 * time.Second,
			Steps: []StrategyStep{
				{ID: "validate", Name: "Validate", Type: int(ValidateStep), Priority: 1},
				{ID: "check_conflicts", Name: "Check Conflicts", Type: int(ConflictCheckStep), Priority: 2},
				{ID: "apply", Name: "Apply Changes", Type: int(ApplyStep), Priority: 3},
				{ID: "verify", Name: "Verify", Type: int(VerifyStep), Priority: 4},
			},
		},

		"batched_sync": {
			ID:          "batched_sync_template",
			Name:        "Batched Synchronization",
			Type:        BatchedSync,
			Description: "Batch multiple operations for efficiency",
			Priority:    PriorityNormal,
			Timeout:     5 * time.Minute,
			Steps: []StrategyStep{
				{ID: "validate", Name: "Validate Batch", Type: int(ValidateStep), Priority: 1},
				{ID: "batch", Name: "Process Batch", Type: int(TransformStep), Priority: 2},
				{ID: "apply", Name: "Apply Batch", Type: int(ApplyStep), Priority: 3},
				{ID: "verify", Name: "Verify Batch", Type: int(VerifyStep), Priority: 4},
			},
		},

		"conditional_sync": {
			ID:          "conditional_sync_template",
			Name:        "Conditional Synchronization",
			Type:        ConditionalSync,
			Description: "Execute sync based on conditions",
			Priority:    PriorityLow,
			Timeout:     10 * time.Minute,
			Steps: []StrategyStep{
				{ID: "evaluate", Name: "Evaluate Conditions", Type: int(ValidateStep), Priority: 1},
				{ID: "check_conflicts", Name: "Check Conflicts", Type: int(ConflictCheckStep), Priority: 2},
				{ID: "apply", Name: "Apply if Safe", Type: int(ApplyStep), Priority: 3},
				{ID: "verify", Name: "Verify", Type: int(VerifyStep), Priority: 4},
			},
		},
	}

	sre.strategyTemplates = templates
	logrus.WithField("templates_count", len(templates)).Info("📋 Strategy templates initialized")
	return nil
}

// DetermineStrategy determines the appropriate sync strategy for an event
func (sre *SyncRuleEngine) DetermineStrategy(event *Event) (*SyncStrategy, error) {
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		sre.metrics.mu.Lock()
		sre.metrics.RulesEvaluated++
		if sre.metrics.AverageEvalTime == 0 {
			sre.metrics.AverageEvalTime = duration
		} else {
			sre.metrics.AverageEvalTime = time.Duration(
				0.9*float64(sre.metrics.AverageEvalTime) + 0.1*float64(duration),
			)
		}
		sre.metrics.mu.Unlock()
	}()

	logrus.WithFields(logrus.Fields{
		"event_id":   event.ID,
		"event_type": event.Type,
		"source":     event.Source,
	}).Debug("🔍 Determining sync strategy")

	// Get rules for this event type
	sre.rulesMutex.RLock()
	rules, exists := sre.rules[event.Type]
	sre.rulesMutex.RUnlock()

	if !exists || len(rules) == 0 {
		// Use default strategy
		return sre.getDefaultStrategy(event), nil
	}

	// Evaluate rules
	var bestRule *SyncRule
	var bestScore float64

	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}

		score := sre.evaluateRule(&rule, event)
		if score > bestScore {
			bestScore = score
			bestRule = &rule
		}
	}

	if bestRule != nil {
		sre.metrics.mu.Lock()
		sre.metrics.RulesMatched++
		sre.metrics.mu.Unlock()

		logrus.WithFields(logrus.Fields{
			"rule_id":   bestRule.ID,
			"rule_name": bestRule.Name,
			"score":     bestScore,
		}).Debug("📋 Rule matched for event")

		return bestRule.Strategy, nil
	}

	// No rule matched, use default strategy
	return sre.getDefaultStrategy(event), nil
}

// evaluateRule evaluates a rule against an event
func (sre *SyncRuleEngine) evaluateRule(rule *SyncRule, event *Event) float64 {
	score := 0.0
	totalWeight := 0.0

	for _, condition := range rule.Conditions {
		totalWeight += condition.Weight

		if sre.evaluateCondition(&condition, event) {
			score += condition.Weight
		}
	}

	if totalWeight > 0 {
		return score / totalWeight
	}

	return 0.0
}

// evaluateCondition evaluates a single condition
func (sre *SyncRuleEngine) evaluateCondition(condition *RuleCondition, event *Event) bool {
	// Extract field value from event
	var fieldValue interface{}

	switch condition.Field {
	case "source":
		fieldValue = event.Source
	case "priority":
		fieldValue = event.Priority
	case "event_type":
		fieldValue = event.Type
	default:
		// Try to get from payload
		if event.Payload != nil {
			if payloadMap, ok := event.Payload.(map[string]interface{}); ok {
				fieldValue = payloadMap[condition.Field]
			}
		}
	}

	// Evaluate based on operator
	switch condition.Operator {
	case "equals":
		return fieldValue == condition.Value
	case "contains":
		if str, ok := fieldValue.(string); ok {
			if valStr, ok := condition.Value.(string); ok {
				return len(str) > 0 && len(valStr) > 0 && containsString(str, valStr)
			}
		}
	case "greater_than":
		if num, ok := fieldValue.(float64); ok {
			if valNum, ok := condition.Value.(float64); ok {
				return num > valNum
			}
		}
	case "less_than":
		if num, ok := fieldValue.(float64); ok {
			if valNum, ok := condition.Value.(float64); ok {
				return num < valNum
			}
		}
	}

	return false
}

// getDefaultStrategy returns a default strategy for an event
func (sre *SyncRuleEngine) getDefaultStrategy(event *Event) *SyncStrategy {
	// Log the event type for debugging purposes
	logrus.WithField("event_type", event.Type).Debug("Using default sync strategy")
	// Use immediate sync as default
	template, exists := sre.strategyTemplates["immediate_sync"]
	if exists {
		strategy := *template // Copy template
		strategy.ID = "default_" + time.Now().Format("20060102150405")
		return &strategy
	}

	// Fallback to basic strategy
	return &SyncStrategy{
		ID:          "fallback_strategy",
		Name:        "Fallback Strategy",
		Type:        ImmediateSync,
		Description: "Basic fallback synchronization strategy",
		Priority:    PriorityNormal,
		Timeout:     60 * time.Second,
		Steps: []StrategyStep{
			{ID: "validate", Name: "Validate", Type: int(ValidateStep), Priority: 1},
			{ID: "check_conflicts", Name: "Check Conflicts", Type: int(ConflictCheckStep), Priority: 2},
			{ID: "apply", Name: "Apply", Type: int(ApplyStep), Priority: 3},
		},
	}
}

// AddRule adds a new synchronization rule
func (sre *SyncRuleEngine) AddRule(rule SyncRule) error {
	sre.rulesMutex.Lock()
	defer sre.rulesMutex.Unlock()

	rule.CreatedAt = time.Now()
	rule.UpdatedAt = time.Now()

	sre.rules[rule.EventType] = append(sre.rules[rule.EventType], rule)

	logrus.WithFields(logrus.Fields{
		"rule_id":    rule.ID,
		"rule_name":  rule.Name,
		"event_type": rule.EventType,
	}).Info("📋 Sync rule added")

	return nil
}

// RemoveRule removes a synchronization rule
func (sre *SyncRuleEngine) RemoveRule(ruleID string) error {
	sre.rulesMutex.Lock()
	defer sre.rulesMutex.Unlock()

	for eventType, rules := range sre.rules {
		for i, rule := range rules {
			if rule.ID == ruleID {
				// Remove rule from slice
				sre.rules[eventType] = append(rules[:i], rules[i+1:]...)
				logrus.WithField("rule_id", ruleID).Info("📋 Sync rule removed")
				return nil
			}
		}
	}

	return fmt.Errorf("rule not found: %s", ruleID)
}

// GetRules returns all rules for an event type
func (sre *SyncRuleEngine) GetRules(eventType EventType) []SyncRule {
	sre.rulesMutex.RLock()
	defer sre.rulesMutex.RUnlock()

	rules, exists := sre.rules[eventType]
	if !exists {
		return []SyncRule{}
	}

	// Return a copy to prevent external modification
	result := make([]SyncRule, len(rules))
	copy(result, rules)
	return result
}

// GetAllRules returns all rules
func (sre *SyncRuleEngine) GetAllRules() map[EventType][]SyncRule {
	sre.rulesMutex.RLock()
	defer sre.rulesMutex.RUnlock()

	result := make(map[EventType][]SyncRule)
	for eventType, rules := range sre.rules {
		result[eventType] = make([]SyncRule, len(rules))
		copy(result[eventType], rules)
	}

	return result
}

// GetMetrics returns rule engine metrics
func (sre *SyncRuleEngine) GetMetrics() RuleEngineMetrics {
	sre.metrics.mu.RLock()
	defer sre.metrics.mu.RUnlock()

	return RuleEngineMetrics{
		RulesEvaluated:    sre.metrics.RulesEvaluated,
		RulesMatched:      sre.metrics.RulesMatched,
		StrategiesCreated: sre.metrics.StrategiesCreated,
		EvaluationErrors:  sre.metrics.EvaluationErrors,
		AverageEvalTime:   sre.metrics.AverageEvalTime,
	}
}

// DefaultRuleEngineConfig returns default configuration
func DefaultRuleEngineConfig() *RuleEngineConfig {
	return &RuleEngineConfig{
		MaxRulesPerEvent:       10,
		RuleEvaluationTimeout:  5 * time.Second,
		DefaultStrategyTimeout: 60 * time.Second,
		MaxConcurrentStrategies: 100,
		EnableMetrics:          true,
		MetricsInterval:        30 * time.Second,
	}
}

// containsString checks if a string contains a substring (case-insensitive)
func containsString(str, substr string) bool {
	return len(str) >= len(substr) &&
		   (str == substr ||
		    len(substr) == 0 ||
		    (len(str) > len(substr) &&
		     (str[:len(substr)] == substr ||
		      str[len(str)-len(substr):] == substr ||
		      containsSubstring(str, substr))))
}

// containsSubstring checks if string contains substring
func containsSubstring(str, substr string) bool {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}