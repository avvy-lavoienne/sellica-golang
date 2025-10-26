package database

import (
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/postgrest-go"
)

// QueryOptions provides structured query building with advanced features
type QueryOptions struct {
	// Select specifies which fields to retrieve (default: "*")
	Select string

	// Filters provides simple key-value WHERE clause filters
	// Each key is treated as an "eq" (equals) operation
	Filters map[string]interface{}

	// ComplexFilters allows advanced WHERE clause operations
	// Supports: eq, neq, gt, gte, lt, lte, like, ilike, is, in
	ComplexFilters []ComplexFilter

	// OrderBy specifies the field to sort by
	OrderBy string

	// Ascending determines sort order (true = ascending, false = descending)
	Ascending bool

	// Limit specifies the maximum number of records to return
	Limit int

	// Offset specifies the starting position for pagination
	Offset int

	// Count method: "exact" (default), "planned", or "estimated"
	// "exact" is accurate but slower for large datasets
	// "planned" is faster estimate
	// "estimated" is fastest estimate
	Count string
}

// ComplexFilter represents an advanced WHERE clause condition
type ComplexFilter struct {
	// Field name
	Field string

	// Operator: eq, neq, gt, gte, lt, lte, like, ilike, is, in
	Operator string

	// Value to compare against
	Value interface{}
}

// QueryWithOptions executes a database query with advanced filtering and pagination
// Returns: data (JSON bytes), count (total matching records), error
func (s *Service) QueryWithOptions(table string, opts QueryOptions) ([]byte, int64, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy, attempting query anyway")
	}

	// Default select
	if opts.Select == "" {
		opts.Select = "*"
	}

	// Default count method
	if opts.Count == "" {
		opts.Count = "exact"
	}

	// Validate table name (basic safety check)
	if table == "" {
		return nil, 0, fmt.Errorf("table name cannot be empty")
	}

	// Build query
	query := s.client.From(table).Select(opts.Select, opts.Count, false)

	// Apply simple filters (key-value pairs)
	for field, value := range opts.Filters {
		if field == "" {
			logrus.Warn("Skipping empty filter field")
			continue
		}
		// Convert value to string for consistency with postgrest-go
		valueStr := fmt.Sprintf("%v", value)
		query = query.Eq(field, valueStr)
	}

	// Apply complex filters with operators
	for _, filter := range opts.ComplexFilters {
		if filter.Field == "" {
			logrus.Warn("Skipping complex filter with empty field")
			continue
		}

		// Convert value to string for consistency with postgrest-go
		valueStr := fmt.Sprintf("%v", filter.Value)

		switch filter.Operator {
		case "eq":
			query = query.Eq(filter.Field, valueStr)
		case "neq":
			query = query.Neq(filter.Field, valueStr)
		case "gt":
			query = query.Gt(filter.Field, valueStr)
		case "gte":
			query = query.Gte(filter.Field, valueStr)
		case "lt":
			query = query.Lt(filter.Field, valueStr)
		case "lte":
			query = query.Lte(filter.Field, valueStr)
		case "like":
			// LIKE search with wildcards
			query = query.Like(filter.Field, fmt.Sprintf("%%%v%%", filter.Value))
		case "ilike":
			// Case-insensitive LIKE search
			query = query.Ilike(filter.Field, fmt.Sprintf("%%%v%%", filter.Value))
		case "is":
			// IS operator (for NULL checks)
			query = query.Is(filter.Field, valueStr)
		case "in":
			// IN operator (for multiple values)
			// Convert to []string if it's a slice
			if values, ok := filter.Value.([]interface{}); ok {
				strValues := make([]string, len(values))
				for i, v := range values {
					strValues[i] = fmt.Sprintf("%v", v)
				}
				query = query.In(filter.Field, strValues)
			} else if strSlice, ok := filter.Value.([]string); ok {
				query = query.In(filter.Field, strSlice)
			} else {
				// Try as single value
				query = query.In(filter.Field, []string{valueStr})
			}
		default:
			logrus.WithField("operator", filter.Operator).Warn("Unknown filter operator, skipping")
			continue
		}
	}

	// Apply ordering (if specified)
	if opts.OrderBy != "" {
		query = query.Order(opts.OrderBy, &postgrest.OrderOpts{
			Ascending:    opts.Ascending,
			NullsFirst:   false,
			ForeignTable: "",
		})
	}

	// Apply pagination (if limit is specified)
	if opts.Limit > 0 {
		end := opts.Offset + opts.Limit - 1
		query = query.Range(opts.Offset, end, "")
	}

	// Execute query
	logrus.WithFields(logrus.Fields{
		"table":  table,
		"select": opts.Select,
		"limit":  opts.Limit,
		"offset": opts.Offset,
	}).Debug("Executing query with options")

	return query.Execute()
}

// QuerySingle executes a query expecting a single record
// Automatically limits result to 1 record
func (s *Service) QuerySingle(table string, opts QueryOptions) ([]byte, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	// Force limit 1 for single record query
	opts.Limit = 1
	opts.Offset = 0

	data, _, err := s.QueryWithOptions(table, opts)
	if err != nil {
		return nil, fmt.Errorf("single record query failed: %w", err)
	}

	return data, nil
}

// InsertWithReturn inserts data and returns the inserted records
// This avoids the need for a separate SELECT query after INSERT
func (s *Service) InsertWithReturn(table string, data interface{}) ([]byte, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	if table == "" {
		return nil, fmt.Errorf("table name cannot be empty")
	}

	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	result, _, err := s.client.From(table).
		Insert(data, false, "", "representation", "").
		Execute()

	if err != nil {
		return nil, fmt.Errorf("insert with return failed: %w", err)
	}

	logrus.WithField("table", table).Debug("Insert with return successful")
	return result, nil
}

// UpdateWithReturn updates records and returns the updated records
// This avoids the need for a separate SELECT query after UPDATE
func (s *Service) UpdateWithReturn(table string, data interface{}, opts QueryOptions) ([]byte, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	if table == "" {
		return nil, fmt.Errorf("table name cannot be empty")
	}

	if data == nil {
		return nil, fmt.Errorf("data cannot be nil")
	}

	query := s.client.From(table).Update(data, "", "representation")

	// Apply filters to determine which records to update
	for field, value := range opts.Filters {
		valueStr := fmt.Sprintf("%v", value)
		query = query.Eq(field, valueStr)
	}

	// Apply complex filters
	for _, filter := range opts.ComplexFilters {
		if filter.Field == "" {
			continue
		}

		valueStr := fmt.Sprintf("%v", filter.Value)

		switch filter.Operator {
		case "eq":
			query = query.Eq(filter.Field, valueStr)
		case "neq":
			query = query.Neq(filter.Field, valueStr)
		case "gt":
			query = query.Gt(filter.Field, valueStr)
		case "gte":
			query = query.Gte(filter.Field, valueStr)
		case "lt":
			query = query.Lt(filter.Field, valueStr)
		case "lte":
			query = query.Lte(filter.Field, valueStr)
		case "is":
			query = query.Is(filter.Field, valueStr)
		case "in":
			if values, ok := filter.Value.([]interface{}); ok {
				strValues := make([]string, len(values))
				for i, v := range values {
					strValues[i] = fmt.Sprintf("%v", v)
				}
				query = query.In(filter.Field, strValues)
			} else if strSlice, ok := filter.Value.([]string); ok {
				query = query.In(filter.Field, strSlice)
			} else {
				query = query.In(filter.Field, []string{valueStr})
			}
		}
	}

	result, _, err := query.Execute()

	if err != nil {
		return nil, fmt.Errorf("update with return failed: %w", err)
	}

	logrus.WithField("table", table).Debug("Update with return successful")
	return result, nil
}

// DeleteWithReturn deletes records and returns the deleted records
// Useful for audit logs and ensuring data integrity
func (s *Service) DeleteWithReturn(table string, opts QueryOptions) ([]byte, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	if table == "" {
		return nil, fmt.Errorf("table name cannot be empty")
	}

	query := s.client.From(table).Delete("", "representation")

	// Apply filters to determine which records to delete
	for field, value := range opts.Filters {
		valueStr := fmt.Sprintf("%v", value)
		query = query.Eq(field, valueStr)
	}

	// Apply complex filters
	for _, filter := range opts.ComplexFilters {
		if filter.Field == "" {
			continue
		}

		valueStr := fmt.Sprintf("%v", filter.Value)

		switch filter.Operator {
		case "eq":
			query = query.Eq(filter.Field, valueStr)
		case "neq":
			query = query.Neq(filter.Field, valueStr)
		case "gt":
			query = query.Gt(filter.Field, valueStr)
		case "gte":
			query = query.Gte(filter.Field, valueStr)
		case "lt":
			query = query.Lt(filter.Field, valueStr)
		case "lte":
			query = query.Lte(filter.Field, valueStr)
		case "is":
			query = query.Is(filter.Field, valueStr)
		case "in":
			if values, ok := filter.Value.([]interface{}); ok {
				strValues := make([]string, len(values))
				for i, v := range values {
					strValues[i] = fmt.Sprintf("%v", v)
				}
				query = query.In(filter.Field, strValues)
			} else if strSlice, ok := filter.Value.([]string); ok {
				query = query.In(filter.Field, strSlice)
			} else {
				query = query.In(filter.Field, []string{valueStr})
			}
		}
	}

	result, _, err := query.Execute()

	if err != nil {
		return nil, fmt.Errorf("delete with return failed: %w", err)
	}

	logrus.WithField("table", table).Debug("Delete with return successful")
	return result, nil
}

// BatchInsert inserts multiple records efficiently in a single operation
// More efficient than inserting records one by one
func (s *Service) BatchInsert(table string, records []interface{}) ([]byte, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	if table == "" {
		return nil, fmt.Errorf("table name cannot be empty")
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("records slice cannot be empty")
	}

	result, _, err := s.client.From(table).
		Insert(records, false, "", "representation", "").
		Execute()

	if err != nil {
		return nil, fmt.Errorf("batch insert failed: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"table":  table,
		"count":  len(records),
	}).Debug("Batch insert successful")

	return result, nil
}

// RPC calls a database function (Remote Procedure Call)
// Useful for complex operations, reports, and business logic in the database
func (s *Service) RPC(functionName string, params interface{}) (string, error) {
	if !s.IsHealthy() {
		logrus.Warn("Database service not healthy")
	}

	if functionName == "" {
		return "", fmt.Errorf("function name cannot be empty")
	}

	result := s.client.Rpc(functionName, "exact", params)

	logrus.WithField("function", functionName).Debug("RPC call executed")

	return result, nil
}

// GetQueryBuilder returns the underlying PostgREST query builder
// For advanced use cases not covered by the above helper methods
func (s *Service) GetQueryBuilder(table string) *postgrest.QueryBuilder {
	return s.client.From(table)
}
