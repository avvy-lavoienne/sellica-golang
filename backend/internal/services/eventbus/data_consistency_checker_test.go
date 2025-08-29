package eventbus

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDataConsistencyChecker_NewDataConsistencyChecker tests the creation of a new consistency checker
func TestDataConsistencyChecker_NewDataConsistencyChecker(t *testing.T) {
	checker, err := NewDataConsistencyChecker()

	assert.NoError(t, err)
	assert.NotNil(t, checker)
	assert.NotNil(t, checker.config)
	assert.NotNil(t, checker.checks)
	assert.NotNil(t, checker.serviceClients)
	assert.NotNil(t, checker.metrics)
}

// TestDataConsistencyChecker_DefaultChecks tests default check initialization
func TestDataConsistencyChecker_DefaultChecks(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	// Check that default checks are loaded
	userCheck, err := checker.GetCheck("user_data_consistency")
	assert.NoError(t, err)
	assert.NotNil(t, userCheck)
	assert.Equal(t, CrossServiceCheck, userCheck.Type)

	documentCheck, err := checker.GetCheck("document_processing_consistency")
	assert.NoError(t, err)
	assert.NotNil(t, documentCheck)
	assert.Equal(t, DataIntegrityCheck, documentCheck.Type)

	chatCheck, err := checker.GetCheck("chat_data_consistency")
	assert.NoError(t, err)
	assert.NotNil(t, chatCheck)
	assert.Equal(t, TemporalConsistencyCheck, chatCheck.Type)

	businessCheck, err := checker.GetCheck("business_rule_consistency")
	assert.NoError(t, err)
	assert.NotNil(t, businessCheck)
	assert.Equal(t, BusinessRuleCheck, businessCheck.Type)
}

// TestDataConsistencyChecker_CheckConsistency tests comprehensive consistency checking
func TestDataConsistencyChecker_CheckConsistency(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	ctx := context.Background()
	report, err := checker.CheckConsistency(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, report)
	assert.NotEmpty(t, report.ID)
	assert.True(t, report.OverallScore >= 0.0)
	assert.True(t, report.OverallScore <= 1.0)
	assert.NotEmpty(t, report.Status)
	assert.True(t, report.Duration > 0)
	assert.NotNil(t, report.Summary)
	assert.NotNil(t, report.Recommendations)
}

// TestDataConsistencyChecker_AddCheck tests adding new consistency checks
func TestDataConsistencyChecker_AddCheck(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	// Create a new check
	newCheck := &ConsistencyCheck{
		ID:          "test_check",
		Name:        "Test Consistency Check",
		Description: "Test check for unit testing",
		Type:        DataIntegrityCheck,
		Priority:    5,
		Services:    []string{"test_service"},
		DataTypes:   []string{"test_data"},
		Rules: []ConsistencyRule{
			{
				ID:            "test_rule",
				Name:          "Test Rule",
				Field:         "test_field",
				Operator:      "exists",
				Service:       "test_service",
				Weight:        1.0,
				Severity:      "medium",
			},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Add the check
	err = checker.AddCheck(newCheck)
	assert.NoError(t, err)

	// Verify the check was added
	retrievedCheck, err := checker.GetCheck("test_check")
	assert.NoError(t, err)
	assert.NotNil(t, retrievedCheck)
	assert.Equal(t, "test_check", retrievedCheck.ID)
	assert.Equal(t, "Test Consistency Check", retrievedCheck.Name)
}

// TestDataConsistencyChecker_RemoveCheck tests removing consistency checks
func TestDataConsistencyChecker_RemoveCheck(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	// Add a check first
	newCheck := &ConsistencyCheck{
		ID:          "test_check_to_remove",
		Name:        "Test Check to Remove",
		Description: "Test check for removal testing",
		Type:        DataIntegrityCheck,
		Priority:    5,
		Services:    []string{"test_service"},
		DataTypes:   []string{"test_data"},
		Rules:       []ConsistencyRule{},
		Enabled:     true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	err = checker.AddCheck(newCheck)
	require.NoError(t, err)

	// Verify check exists
	_, err = checker.GetCheck("test_check_to_remove")
	assert.NoError(t, err)

	// Remove the check
	err = checker.RemoveCheck("test_check_to_remove")
	assert.NoError(t, err)

	// Verify check was removed
	_, err = checker.GetCheck("test_check_to_remove")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// TestDataConsistencyChecker_ExecuteCheck tests individual check execution
func TestDataConsistencyChecker_ExecuteCheck(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	// Get a default check
	userCheck, err := checker.GetCheck("user_data_consistency")
	require.NoError(t, err)

	ctx := context.Background()
	results := checker.executeCheck(ctx, userCheck)

	// Should have results for each rule in the check
	assert.NotEmpty(t, results)
	assert.Len(t, results, len(userCheck.Rules))

	// Each result should have proper structure
	for _, result := range results {
		assert.NotEmpty(t, result.RuleID)
		assert.NotEmpty(t, result.RuleName)
		assert.NotEmpty(t, result.Service)
		assert.NotEmpty(t, result.Field)
		assert.NotEmpty(t, result.Status)
		assert.True(t, result.Score >= 0.0)
		assert.True(t, result.Score <= 1.0)
		assert.NotEmpty(t, result.Severity)
	}
}

// TestDataConsistencyChecker_EvaluateRule tests rule evaluation
func TestDataConsistencyChecker_EvaluateRule(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	tests := []struct {
		name        string
		rule        ConsistencyRule
		actualValue interface{}
		expected    bool
	}{
		{
			name: "equals match",
			rule: ConsistencyRule{
				Field:       "status",
				Operator:    "equals",
				ExpectedValue: "completed",
			},
			actualValue: "completed",
			expected:    true,
		},
		{
			name: "equals no match",
			rule: ConsistencyRule{
				Field:       "status",
				Operator:    "equals",
				ExpectedValue: "completed",
			},
			actualValue: "pending",
			expected:    false,
		},
		{
			name: "exists with value",
			rule: ConsistencyRule{
				Field:    "user_id",
				Operator: "exists",
			},
			actualValue: "user123",
			expected:    true,
		},
		{
			name: "exists with nil",
			rule: ConsistencyRule{
				Field:    "user_id",
				Operator: "exists",
			},
			actualValue: nil,
			expected:    false,
		},
		{
			name: "not_exists with value",
			rule: ConsistencyRule{
				Field:    "error",
				Operator: "not_exists",
			},
			actualValue: "some error",
			expected:    false,
		},
		{
			name: "not_exists with nil",
			rule: ConsistencyRule{
				Field:    "error",
				Operator: "not_exists",
			},
			actualValue: nil,
			expected:    true,
		},
		{
			name: "in_list match",
			rule: ConsistencyRule{
				Field:        "document_type",
				Operator:     "in_list",
				ExpectedValue: []string{"akta_kelahiran", "ktp", "akta_kematian"},
			},
			actualValue: "ktp",
			expected:    true,
		},
		{
			name: "in_list no match",
			rule: ConsistencyRule{
				Field:        "document_type",
				Operator:     "in_list",
				ExpectedValue: []string{"akta_kelahiran", "ktp", "akta_kematian"},
			},
			actualValue: "unknown_type",
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := checker.evaluateRule(&tt.rule, tt.actualValue)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestDataConsistencyChecker_DetermineStatus tests status determination
func TestDataConsistencyChecker_DetermineStatus(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	tests := []struct {
		name     string
		score    float64
		expected string
	}{
		{
			name:     "passed - high score",
			score:    0.98,
			expected: "passed",
		},
		{
			name:     "passed - threshold score",
			score:    0.95,
			expected: "passed",
		},
		{
			name:     "warning - medium score",
			score:    0.85,
			expected: "warning",
		},
		{
			name:     "warning - critical threshold",
			score:    0.80,
			expected: "warning",
		},
		{
			name:     "failed - low score",
			score:    0.70,
			expected: "failed",
		},
		{
			name:     "failed - zero score",
			score:    0.0,
			expected: "failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := checker.determineStatus(tt.score)
			assert.Equal(t, tt.expected, status)
		})
	}
}

// TestDataConsistencyChecker_CountCriticalIssues tests critical issue counting
func TestDataConsistencyChecker_CountCriticalIssues(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	results := []CheckResult{
		{RuleID: "rule1", Severity: "low", Status: "failed"},
		{RuleID: "rule2", Severity: "medium", Status: "failed"},
		{RuleID: "rule3", Severity: "high", Status: "failed"},
		{RuleID: "rule4", Severity: "critical", Status: "failed"},
		{RuleID: "rule5", Severity: "critical", Status: "passed"},
		{RuleID: "rule6", Severity: "critical", Status: "failed"},
	}

	criticalCount := checker.countCriticalIssues(results)
	assert.Equal(t, 2, criticalCount) // Only failed critical severity rules count
}

// TestDataConsistencyChecker_GenerateRecommendations tests recommendation generation
func TestDataConsistencyChecker_GenerateRecommendations(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	tests := []struct {
		name         string
		report       *ConsistencyReport
		expectCritical bool
	}{
		{
			name: "high consistency - no critical issues",
			report: &ConsistencyReport{
				OverallScore: 0.98,
				Results: []CheckResult{
					{Severity: "medium", Status: "passed"},
					{Severity: "high", Status: "passed"},
				},
			},
			expectCritical: false,
		},
		{
			name: "medium consistency - some issues",
			report: &ConsistencyReport{
				OverallScore: 0.85,
				Results: []CheckResult{
					{Severity: "critical", Status: "failed"},
					{Severity: "high", Status: "failed"},
				},
			},
			expectCritical: true,
		},
		{
			name: "low consistency - critical issues",
			report: &ConsistencyReport{
				OverallScore: 0.70,
				Results: []CheckResult{
					{Severity: "critical", Status: "failed"},
					{Severity: "critical", Status: "failed"},
					{Severity: "critical", Status: "failed"},
				},
			},
			expectCritical: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recommendations := checker.generateRecommendations(tt.report)

			assert.NotEmpty(t, recommendations)

			if tt.expectCritical {
				found := false
				for _, rec := range recommendations {
					if len(rec) > 0 && (containsString(rec, "critical") || containsString(rec, "attention")) {
						found = true
						break
					}
				}
				assert.True(t, found, "Should contain critical issue recommendation")
			}
		})
	}
}

// TestDataConsistencyChecker_GetAllChecks tests retrieving all checks
func TestDataConsistencyChecker_GetAllChecks(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	allChecks := checker.GetAllChecks()
	assert.NotNil(t, allChecks)

	// Should have default checks
	assert.Contains(t, allChecks, "user_data_consistency")
	assert.Contains(t, allChecks, "document_processing_consistency")
	assert.Contains(t, allChecks, "chat_data_consistency")
	assert.Contains(t, allChecks, "business_rule_consistency")

	// Each check should have proper structure
	for id, check := range allChecks {
		assert.NotEmpty(t, id)
		assert.NotEmpty(t, check.Name)
		assert.NotEmpty(t, check.Services)
		assert.NotEmpty(t, check.Rules)
		assert.True(t, check.CreatedAt.Before(time.Now()) || check.CreatedAt.Equal(time.Now()))
	}
}

// TestDataConsistencyChecker_GetMetrics tests metrics collection
func TestDataConsistencyChecker_GetMetrics(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	metrics := checker.GetMetrics()
	assert.NotNil(t, &metrics) // Use pointer to avoid copying lock
	assert.True(t, metrics.ChecksPerformed >= 0)
	assert.True(t, metrics.ChecksPassed >= 0)
	assert.True(t, metrics.ChecksFailed >= 0)
	assert.True(t, metrics.ConsistencyScore >= 0.0)
	assert.True(t, metrics.ConsistencyScore <= 1.0)
}

// TestDataConsistencyChecker_MockServiceClient tests the mock service client
func TestDataConsistencyChecker_MockServiceClient(t *testing.T) {
	client := NewMockServiceClient("test_service", "http://localhost:8080")

	ctx := context.Background()

	// Test GetData
	data, err := client.GetData(ctx, "user_profile", "user_id")
	assert.NoError(t, err)
	assert.Equal(t, "user123", data)

	// Test ValidateData
	err = client.ValidateData(ctx, "user_profile", map[string]interface{}{"user_id": "test"})
	assert.NoError(t, err)

	// Test HealthCheck
	err = client.HealthCheck(ctx)
	assert.NoError(t, err)
}

// TestDataConsistencyChecker_Concurrency tests concurrent operations
func TestDataConsistencyChecker_Concurrency(t *testing.T) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(t, err)

	ctx := context.Background()
	var wg sync.WaitGroup
	numGoroutines := 5
	results := make([]*ConsistencyReport, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()
			report, err := checker.CheckConsistency(ctx)
			if err == nil {
				results[index] = report
			}
		}(i)
	}

	wg.Wait()

	// Verify all goroutines completed
	for i, result := range results {
		assert.NotNil(t, result, "Goroutine %d should have received a report", i)
		assert.NotEmpty(t, result.ID)
		assert.True(t, result.OverallScore >= 0.0)
		assert.True(t, result.OverallScore <= 1.0)
	}
}

// BenchmarkDataConsistencyChecker_CheckConsistency benchmarks consistency checking
func BenchmarkDataConsistencyChecker_CheckConsistency(b *testing.B) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(b, err)

	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := checker.CheckConsistency(ctx)
		if err != nil {
			b.Errorf("Failed to check consistency: %v", err)
		}
	}
}

// BenchmarkDataConsistencyChecker_EvaluateRule benchmarks rule evaluation
func BenchmarkDataConsistencyChecker_EvaluateRule(b *testing.B) {
	checker, err := NewDataConsistencyChecker()
	require.NoError(b, err)

	rule := ConsistencyRule{
		Field:        "status",
		Operator:     "equals",
		ExpectedValue: "completed",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		result := checker.evaluateRule(&rule, "completed")
		if !result {
			b.Errorf("Rule evaluation should have passed")
		}
	}
}
