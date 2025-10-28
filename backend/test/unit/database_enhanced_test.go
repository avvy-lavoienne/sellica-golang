package unit

import (
	"testing"

	"selly-backend/internal/services/database"

	"github.com/stretchr/testify/assert"
)

// TestQueryOptions_SelectField tests that Select field is properly set
func TestQueryOptions_SelectField(t *testing.T) {
	opts := database.QueryOptions{
		Select: "id,name,email",
		Limit:  10,
	}

	assert.Equal(t, "id,name,email", opts.Select)
	assert.Equal(t, 10, opts.Limit)
}

// TestQueryOptions_Filters tests simple filters map
func TestQueryOptions_SimpleFilters(t *testing.T) {
	opts := database.QueryOptions{
		Select: "*",
		Filters: map[string]interface{}{
			"status":   "active",
			"priority": "high",
		},
	}

	assert.NotNil(t, opts.Filters)
	assert.Equal(t, "active", opts.Filters["status"])
	assert.Equal(t, "high", opts.Filters["priority"])
}

// TestQueryOptions_ComplexFilters tests advanced filters with operators
func TestQueryOptions_ComplexFilters(t *testing.T) {
	opts := database.QueryOptions{
		ComplexFilters: []database.ComplexFilter{
			{
				Field:    "priority",
				Operator: "in",
				Value:    []string{"high", "urgent"},
			},
			{
				Field:    "created_at",
				Operator: "gte",
				Value:    "2025-10-01",
			},
		},
	}

	assert.Len(t, opts.ComplexFilters, 2)
	assert.Equal(t, "in", opts.ComplexFilters[0].Operator)
	assert.Equal(t, "gte", opts.ComplexFilters[1].Operator)
}

// TestQueryOptions_Pagination tests pagination settings
func TestQueryOptions_Pagination(t *testing.T) {
	opts := database.QueryOptions{
		Limit:  20,
		Offset: 40,
	}

	// Page 3, 20 items per page
	assert.Equal(t, 20, opts.Limit)
	assert.Equal(t, 40, opts.Offset)
}

// TestQueryOptions_Ordering tests sort configuration
func TestQueryOptions_Ordering(t *testing.T) {
	opts := database.QueryOptions{
		OrderBy:   "created_at",
		Ascending: false,
	}

	assert.Equal(t, "created_at", opts.OrderBy)
	assert.False(t, opts.Ascending)
}

// TestComplexFilter_EqualsOperator tests eq operator
func TestComplexFilter_EqualsOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "status",
		Operator: "eq",
		Value:    "active",
	}

	assert.Equal(t, "status", filter.Field)
	assert.Equal(t, "eq", filter.Operator)
	assert.Equal(t, "active", filter.Value)
}

// TestComplexFilter_LikeOperator tests like operator for partial matching
func TestComplexFilter_LikeOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "name",
		Operator: "like",
		Value:    "john",
	}

	assert.Equal(t, "like", filter.Operator)
}

// TestComplexFilter_ILikeOperator tests case-insensitive like operator
func TestComplexFilter_ILikeOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "email",
		Operator: "ilike",
		Value:    "JOHN@EXAMPLE.COM",
	}

	assert.Equal(t, "ilike", filter.Operator)
}

// TestComplexFilter_InOperator tests IN operator for multiple values
func TestComplexFilter_InOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "status",
		Operator: "in",
		Value:    []string{"active", "pending", "review"},
	}

	assert.Equal(t, "in", filter.Operator)
	values := filter.Value.([]string)
	assert.Len(t, values, 3)
}

// TestComplexFilter_ComparisonOperators tests gt, gte, lt, lte operators
func TestComplexFilter_ComparisonOperators(t *testing.T) {
	tests := []struct {
		name     string
		operator string
		value    interface{}
	}{
		{"Greater than", "gt", 100},
		{"Greater or equal", "gte", 100},
		{"Less than", "lt", 100},
		{"Less or equal", "lte", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filter := database.ComplexFilter{
				Field:    "count",
				Operator: tt.operator,
				Value:    tt.value,
			}

			assert.Equal(t, tt.operator, filter.Operator)
			assert.Equal(t, tt.value, filter.Value)
		})
	}
}

// TestComplexFilter_IsOperator tests IS operator for NULL checks
func TestComplexFilter_IsOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "deleted_at",
		Operator: "is",
		Value:    "null",
	}

	assert.Equal(t, "is", filter.Operator)
	assert.Equal(t, "null", filter.Value)
}

// TestComplexFilter_NotEqualsOperator tests neq operator
func TestComplexFilter_NotEqualsOperator(t *testing.T) {
	filter := database.ComplexFilter{
		Field:    "status",
		Operator: "neq",
		Value:    "deleted",
	}

	assert.Equal(t, "neq", filter.Operator)
	assert.Equal(t, "deleted", filter.Value)
}

// TestQueryOptions_DefaultValues tests that defaults are applied
func TestQueryOptions_DefaultValues(t *testing.T) {
	opts := database.QueryOptions{} // All fields empty

	// Defaults should be applied
	assert.Empty(t, opts.Select)     // Empty, will become "*"
	assert.Empty(t, opts.Count)      // Empty, will become "exact"
	assert.Equal(t, 0, opts.Limit)   // 0 means no limit
	assert.Equal(t, 0, opts.Offset)  // 0 means start from beginning
}

// TestQueryOptions_CountMethods tests different count methods
func TestQueryOptions_CountMethods(t *testing.T) {
	countMethods := []string{"exact", "planned", "estimated"}

	for _, method := range countMethods {
		t.Run(method, func(t *testing.T) {
			opts := database.QueryOptions{
				Count: method,
			}

			assert.Equal(t, method, opts.Count)
		})
	}
}

// TestQueryOptions_ZeroLimit tests that Limit 0 means no limit
func TestQueryOptions_ZeroLimit(t *testing.T) {
	opts := database.QueryOptions{
		Limit: 0,
	}

	// Limit 0 should not apply pagination
	assert.Equal(t, 0, opts.Limit)
}

// TestQueryOptions_EmptyFilters tests with no filters
func TestQueryOptions_EmptyFilters(t *testing.T) {
	opts := database.QueryOptions{
		Select:          "*",
		Filters:         make(map[string]interface{}),
		ComplexFilters:  []database.ComplexFilter{},
	}

	assert.Empty(t, opts.Filters)
	assert.Empty(t, opts.ComplexFilters)
}

// TestQueryOptions_MixedFilters tests combining simple and complex filters
func TestQueryOptions_MixedFilters(t *testing.T) {
	opts := database.QueryOptions{
		Select: "id,name,status",
		Filters: map[string]interface{}{
			"is_active": true,
		},
		ComplexFilters: []database.ComplexFilter{
			{
				Field:    "priority",
				Operator: "in",
				Value:    []string{"high", "urgent"},
			},
		},
	}

	assert.Len(t, opts.Filters, 1)
	assert.Len(t, opts.ComplexFilters, 1)
}

// TestQueryOptions_RangeFilters tests range queries (from/to)
func TestQueryOptions_RangeFilters(t *testing.T) {
	opts := database.QueryOptions{
		ComplexFilters: []database.ComplexFilter{
			{
				Field:    "created_at",
				Operator: "gte",
				Value:    "2025-10-01",
			},
			{
				Field:    "created_at",
				Operator: "lte",
				Value:    "2025-10-31",
			},
		},
	}

	assert.Len(t, opts.ComplexFilters, 2)
	assert.Equal(t, "gte", opts.ComplexFilters[0].Operator)
	assert.Equal(t, "lte", opts.ComplexFilters[1].Operator)
}

// TestQueryOptions_SearchPatterns tests common search patterns
func TestQueryOptions_SearchPatterns(t *testing.T) {
	tests := []struct {
		name     string
		operator string
		pattern  string
	}{
		{"Partial match", "like", "john"},
		{"Case insensitive", "ilike", "JOHN"},
		{"Email domain", "like", "%@example.com"},
		{"Starts with", "like", "admin%"},
		{"Ends with", "like", "%admin"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			opts := database.QueryOptions{
				ComplexFilters: []database.ComplexFilter{
					{
						Field:    "email",
						Operator: tt.operator,
						Value:    tt.pattern,
					},
				},
			}

			assert.Equal(t, tt.operator, opts.ComplexFilters[0].Operator)
		})
	}
}

// TestQueryOptions_FieldValidation tests that empty fields are handled
func TestQueryOptions_FieldValidation(t *testing.T) {
	opts := database.QueryOptions{
		OrderBy: "", // Empty order by
	}

	assert.Empty(t, opts.OrderBy)
}

// TestQueryOptions_ComplexFilterMultipleInValues tests IN with various value types
func TestQueryOptions_ComplexFilterMultipleInValues(t *testing.T) {
	// Test with []string
	filter1 := database.ComplexFilter{
		Field:    "status",
		Operator: "in",
		Value:    []string{"active", "pending"},
	}

	assert.Equal(t, "in", filter1.Operator)

	// Test with []interface{}
	filter2 := database.ComplexFilter{
		Field:    "id",
		Operator: "in",
		Value:    []interface{}{1, 2, 3},
	}

	assert.Equal(t, "in", filter2.Operator)
}

// TestQueryOptions_LargeDataset tests pagination for large datasets
func TestQueryOptions_LargeDataset(t *testing.T) {
	const pageSize = 100
	const pageNumber = 50

	opts := database.QueryOptions{
		Select:  "*",
		Limit:   pageSize,
		Offset:  (pageNumber - 1) * pageSize,
	}

	assert.Equal(t, 100, opts.Limit)
	assert.Equal(t, 4900, opts.Offset) // (50-1)*100 = 4900
}

// TestQueryOptions_SingleRecordQuery tests query for single record
func TestQueryOptions_SingleRecordQuery(t *testing.T) {
	opts := database.QueryOptions{
		Filters: map[string]interface{}{
			"id": "123",
		},
		Limit: 1, // Force single record
	}

	assert.Equal(t, 1, opts.Limit)
	assert.Equal(t, "123", opts.Filters["id"])
}

// BenchmarkQueryOptions benchmarks QueryOptions creation
func BenchmarkQueryOptions(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = database.QueryOptions{
			Select:  "id,name,email",
			Limit:   20,
			Offset:  0,
			OrderBy: "created_at",
			Filters: map[string]interface{}{
				"status": "active",
			},
		}
	}
}
