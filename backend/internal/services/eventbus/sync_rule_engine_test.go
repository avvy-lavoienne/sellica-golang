package eventbus

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSyncRuleEngine_NewSyncRuleEngine tests the creation of a new rule engine
func TestSyncRuleEngine_NewSyncRuleEngine(t *testing.T) {
	engine, err := NewSyncRuleEngine()

	assert.NoError(t, err)
	assert.NotNil(t, engine)
	assert.NotNil(t, engine.config)
	assert.NotNil(t, engine.rules)
	assert.NotNil(t, engine.strategyTemplates)
	assert.NotNil(t, engine.metrics)
}

// TestSyncRuleEngine_DefaultRules tests default rule initialization
func TestSyncRuleEngine_DefaultRules(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Check that default rules are loaded
	userRules := engine.GetRules(EventTypeUserProfileUpdated)
	assert.NotEmpty(t, userRules)

	documentRules := engine.GetRules(EventTypeDocumentUploaded)
	assert.NotEmpty(t, documentRules)

	chatRules := engine.GetRules(EventTypeChatMessageSent)
	assert.NotEmpty(t, chatRules)

	cacheRules := engine.GetRules(EventTypeCacheInvalidate)
	assert.NotEmpty(t, cacheRules)
}

// TestSyncRuleEngine_DetermineStrategy tests strategy determination
func TestSyncRuleEngine_DetermineStrategy(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Test user profile update event
	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"user_id": "test_user",
		"source":  "frontend",
	})

	strategy, err := engine.DetermineStrategy(event)
	assert.NoError(t, err)
	assert.NotNil(t, strategy)
	assert.Equal(t, ImmediateSync, strategy.Type)

	// Test document upload event
	docEvent := NewEvent(EventTypeDocumentUploaded, map[string]interface{}{
		"document_type": "akta_kelahiran",
	})

	docStrategy, err := engine.DetermineStrategy(docEvent)
	assert.NoError(t, err)
	assert.NotNil(t, docStrategy)
	assert.Equal(t, BatchedSync, docStrategy.Type)
}

// TestSyncRuleEngine_AddRule tests adding new rules
func TestSyncRuleEngine_AddRule(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Create a new rule
	newRule := SyncRule{
		ID:        "test_rule",
		Name:      "Test Rule",
		EventType: EventTypeServiceRequested,
		Priority:  5,
		Conditions: []RuleCondition{
			{Field: "service_type", Operator: "equals", Value: "premium", Weight: 1.0},
		},
		Strategy: &SyncStrategy{
			ID:          "test_strategy",
			Name:        "Test Strategy",
			Type:        ImmediateSync,
			Description: "Test sync strategy",
			Priority:    PriorityHigh,
			Timeout:     60 * time.Second,
			Steps: []StrategyStep{
				{ID: "test_step", Name: "Test Step", Type: int(ValidateStep), Priority: 1},
			},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Add the rule
	err = engine.AddRule(newRule)
	assert.NoError(t, err)

	// Verify the rule was added
	rules := engine.GetRules(EventTypeServiceRequested)
	assert.Len(t, rules, 1)
	assert.Equal(t, "test_rule", rules[0].ID)
}

// TestSyncRuleEngine_RemoveRule tests removing rules
func TestSyncRuleEngine_RemoveRule(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Add a rule first
	newRule := SyncRule{
		ID:        "test_rule_to_remove",
		Name:      "Test Rule to Remove",
		EventType: EventTypeServiceRequested,
		Priority:  5,
		Conditions: []RuleCondition{
			{Field: "service_type", Operator: "equals", Value: "premium", Weight: 1.0},
		},
		Strategy: &SyncStrategy{
			ID:          "test_strategy",
			Name:        "Test Strategy",
			Type:        ImmediateSync,
			Description: "Test sync strategy",
			Priority:    PriorityHigh,
			Timeout:     60 * time.Second,
			Steps:       []StrategyStep{},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = engine.AddRule(newRule)
	require.NoError(t, err)

	// Verify rule exists
	rules := engine.GetRules(EventTypeServiceRequested)
	assert.Len(t, rules, 1)

	// Remove the rule
	err = engine.RemoveRule("test_rule_to_remove")
	assert.NoError(t, err)

	// Verify rule was removed
	rules = engine.GetRules(EventTypeServiceRequested)
	assert.Len(t, rules, 0)
}

// TestSyncRuleEngine_EvaluateRule tests rule evaluation
func TestSyncRuleEngine_EvaluateRule(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Create a rule with conditions
	rule := &SyncRule{
		ID:        "test_eval_rule",
		Name:      "Test Evaluation Rule",
		EventType: EventTypeUserProfileUpdated,
		Priority:  1,
		Conditions: []RuleCondition{
			{Field: "source", Operator: "equals", Value: "frontend", Weight: 1.0},
			{Field: "user_type", Operator: "equals", Value: "premium", Weight: 0.5},
		},
		Enabled: true,
	}

	// Test matching event
	matchingEvent := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source":    "frontend",
		"user_type": "premium",
	})

	score := engine.evaluateRule(rule, matchingEvent)
	assert.Equal(t, 1.0, score) // All conditions match

	// Test partially matching event
	partialEvent := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source": "frontend",
		// user_type is missing
	})

	partialScore := engine.evaluateRule(rule, partialEvent)
	assert.Equal(t, 0.5, partialScore) // Only first condition matches

	// Test non-matching event
	nonMatchingEvent := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source": "api",
	})

	nonMatchingScore := engine.evaluateRule(rule, nonMatchingEvent)
	assert.Equal(t, 0.0, nonMatchingScore) // No conditions match
}

// TestSyncRuleEngine_EvaluateCondition tests individual condition evaluation
func TestSyncRuleEngine_EvaluateCondition(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source":      "frontend",
		"user_count":  150,
		"active":      true,
		"tags":        []string{"premium", "verified"},
	})

	tests := []struct {
		name      string
		condition RuleCondition
		expected  bool
	}{
		{
			name: "equals match",
			condition: RuleCondition{
				Field:    "source",
				Operator: "equals",
				Value:    "frontend",
			},
			expected: true,
		},
		{
			name: "equals no match",
			condition: RuleCondition{
				Field:    "source",
				Operator: "equals",
				Value:    "api",
			},
			expected: false,
		},
		{
			name: "greater_than match",
			condition: RuleCondition{
				Field:    "user_count",
				Operator: "greater_than",
				Value:    100,
			},
			expected: true,
		},
		{
			name: "greater_than no match",
			condition: RuleCondition{
				Field:    "user_count",
				Operator: "greater_than",
				Value:    200,
			},
			expected: false,
		},
		{
			name: "contains match",
			condition: RuleCondition{
				Field:    "source",
				Operator: "contains",
				Value:    "front",
			},
			expected: true,
		},
		{
			name: "contains no match",
			condition: RuleCondition{
				Field:    "source",
				Operator: "contains",
				Value:    "api",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := engine.evaluateCondition(&tt.condition, event)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestSyncRuleEngine_GetDefaultStrategy tests default strategy generation
func TestSyncRuleEngine_GetDefaultStrategy(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	event := NewEvent(EventTypeSystemError, map[string]interface{}{
		"custom_field": "custom_value",
	})

	strategy := engine.getDefaultStrategy(event)
	assert.NotNil(t, strategy)
	assert.Equal(t, ImmediateSync, strategy.Type)
	assert.Contains(t, strategy.ID, "default_")
	assert.NotEmpty(t, strategy.Steps)
}

// TestSyncRuleEngine_GetAllRules tests retrieving all rules
func TestSyncRuleEngine_GetAllRules(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	allRules := engine.GetAllRules()
	assert.NotNil(t, allRules)

	// Should have rules for default event types
	assert.Contains(t, allRules, EventTypeUserProfileUpdated)
	assert.Contains(t, allRules, EventTypeDocumentUploaded)
	assert.Contains(t, allRules, EventTypeChatMessageSent)
	assert.Contains(t, allRules, EventTypeCacheInvalidate)
}

// TestSyncRuleEngine_GetMetrics tests metrics collection
func TestSyncRuleEngine_GetMetrics(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	metrics := engine.GetMetrics()
	assert.NotNil(t, metrics)
	assert.True(t, metrics.RulesEvaluated >= 0)
	assert.True(t, metrics.RulesMatched >= 0)
}

// TestSyncRuleEngine_StrategyTemplates tests strategy template functionality
func TestSyncRuleEngine_StrategyTemplates(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Test that templates are initialized
	assert.NotNil(t, engine.strategyTemplates)
	assert.Contains(t, engine.strategyTemplates, "immediate_sync")
	assert.Contains(t, engine.strategyTemplates, "batched_sync")
	assert.Contains(t, engine.strategyTemplates, "conditional_sync")

	// Test template properties
	immediateTemplate := engine.strategyTemplates["immediate_sync"]
	assert.Equal(t, ImmediateSync, immediateTemplate.Type)
	assert.NotEmpty(t, immediateTemplate.Steps)

	batchedTemplate := engine.strategyTemplates["batched_sync"]
	assert.Equal(t, BatchedSync, batchedTemplate.Type)
	assert.NotEmpty(t, batchedTemplate.Steps)
}

// TestSyncRuleEngine_Concurrency tests concurrent operations
func TestSyncRuleEngine_Concurrency(t *testing.T) {
	engine, err := NewSyncRuleEngine()
	require.NoError(t, err)

	// Test concurrent rule evaluation
	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source": "frontend",
	})

	var wg sync.WaitGroup
	numGoroutines := 10
	results := make([]*SyncStrategy, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			strategy, err := engine.DetermineStrategy(event)
			if err == nil {
				results[index] = strategy
			}
		}(i)
	}

	wg.Wait()

	// Verify all goroutines got results
	for i, result := range results {
		assert.NotNil(t, result, "Goroutine %d should have received a strategy", i)
	}
}

// BenchmarkSyncRuleEngine_DetermineStrategy benchmarks strategy determination
func BenchmarkSyncRuleEngine_DetermineStrategy(b *testing.B) {
	engine, err := NewSyncRuleEngine()
	require.NoError(b, err)

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source": "frontend",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := engine.DetermineStrategy(event)
		if err != nil {
			b.Errorf("Failed to determine strategy: %v", err)
		}
	}
}

// BenchmarkSyncRuleEngine_EvaluateRule benchmarks rule evaluation
func BenchmarkSyncRuleEngine_EvaluateRule(b *testing.B) {
	engine, err := NewSyncRuleEngine()
	require.NoError(b, err)

	rule := &SyncRule{
		ID:        "benchmark_rule",
		Name:      "Benchmark Rule",
		EventType: EventTypeUserProfileUpdated,
		Priority:  1,
		Conditions: []RuleCondition{
			{Field: "source", Operator: "equals", Value: "frontend", Weight: 1.0},
		},
		Enabled: true,
	}

	event := NewEvent(EventTypeUserProfileUpdated, map[string]interface{}{
		"source": "frontend",
	})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		score := engine.evaluateRule(rule, event)
		if score != 1.0 {
			b.Errorf("Expected score 1.0, got %f", score)
		}
	}
}