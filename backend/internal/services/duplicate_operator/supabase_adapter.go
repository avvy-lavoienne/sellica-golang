package duplicate_operator

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/supabase-community/supabase-go"
)

// SupabaseAdapter implements DatabaseAdapter using Supabase
type SupabaseAdapter struct {
	client *supabase.Client
}

// NewSupabaseAdapter creates a new Supabase adapter
func NewSupabaseAdapter(client *supabase.Client) *SupabaseAdapter {
	return &SupabaseAdapter{
		client: client,
	}
}

// GetRecordByID fetches a single record by ID
func (a *SupabaseAdapter) GetRecordByID(ctx context.Context, id string) (*DuplicateOperatorData, error) {
	_ = ctx // unused parameter

	// Validate ID is not empty
	if id == "" {
		return nil, fmt.Errorf("ID cannot be empty")
	}

	// Note: ID format validation is done at handler level
	// Adapter accepts any non-empty string ID for flexibility

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	// Query from duplicate_operator table
	data, _, err := a.client.From("duplicate_operator").
		Select("*", "", false).
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		if err.Error() == "no rows" {
			return nil, fmt.Errorf("record not found")
		}
		return nil, fmt.Errorf("database query failed: %w", err)
	}

	// Unmarshal response into DuplicateOperatorData
	var record DuplicateOperatorData
	if err := json.Unmarshal(data, &record); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &record, nil
}

// ListRecords fetches paginated records with optional filters
func (a *SupabaseAdapter) ListRecords(
	ctx context.Context,
	filters map[string]interface{},
	page, pageSize int,
) ([]DuplicateOperatorData, int64, error) {
	_ = ctx // unused parameter

	if a.client == nil {
		return nil, 0, fmt.Errorf("database client not initialized")
	}

	// Set defaults
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize

	// Build base query for getting records
	query := a.client.From("duplicate_operator").
		Select("*", "", false)

	// Apply status filter if provided
	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		query = query.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// Apply search filter BEFORE pagination
	if searchQuery, ok := filters["search"].(string); ok && searchQuery != "" {
		// Simple text search across multiple fields
		var orConditions []string
		encodedQuery := url.QueryEscape(strings.TrimSpace(searchQuery))
		
		orConditions = append(orConditions, fmt.Sprintf("nik_duplicate.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_operator.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_duplicate.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_operator.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_pengaju.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_pengaju.ilike.*%s*", encodedQuery))
		
		query = query.Or(strings.Join(orConditions, ","), "")
	}

	// Apply date range filters
	if dateFrom, ok := filters["date_from"].(string); ok && dateFrom != "" {
		query = query.Gte("created_at", dateFrom)
	}
	if dateTo, ok := filters["date_to"].(string); ok && dateTo != "" {
		// Add end of day to include the entire day
		query = query.Lte("created_at", dateTo+"T23:59:59.999Z")
	}

	// Apply pagination using Range AFTER filters
	query = query.Range(offset, offset+pageSize-1, "")

	// Execute query
	data, _, err := query.Execute()
	if err != nil {
		return nil, 0, fmt.Errorf("database query failed: %w", err)
	}

	// Unmarshal response - first parse as raw data, then convert with custom parsing
	var rawRecords []json.RawMessage
	if err := json.Unmarshal(data, &rawRecords); err != nil {
		return nil, 0, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert each raw record
	records := make([]DuplicateOperatorData, 0, len(rawRecords))
	for _, rawRecord := range rawRecords {
		var record DuplicateOperatorData
		if err := json.Unmarshal(rawRecord, &record); err != nil {
			// Log the problematic record for debugging without failing the whole request
			// logrus.WithError(err).Warnf("Failed to parse a record: %s", string(rawRecord))
			continue // Skip records that can't be parsed
		}
		records = append(records, record)
	}

	// Get total count with same filters (including search)
	countQuery := a.client.From("duplicate_operator").
		Select("*", "exact", false)

	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		countQuery = countQuery.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// Apply same search filter logic to count query
	if searchQuery, ok := filters["search"].(string); ok && searchQuery != "" {
		var orConditions []string
		encodedQuery := url.QueryEscape(strings.TrimSpace(searchQuery))
		
		orConditions = append(orConditions, fmt.Sprintf("nik_duplicate.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_operator.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_duplicate.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_operator.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_pengaju.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_pengaju.ilike.*%s*", encodedQuery))
		
		countQuery = countQuery.Or(strings.Join(orConditions, ","), "")
	}

	// Apply same date range filters to count query
	if dateFrom, ok := filters["date_from"].(string); ok && dateFrom != "" {
		countQuery = countQuery.Gte("created_at", dateFrom)
	}
	if dateTo, ok := filters["date_to"].(string); ok && dateTo != "" {
		countQuery = countQuery.Lte("created_at", dateTo+"T23:59:59.999Z")
	}

	// Apply range with empty string to get the count header
	countQuery = countQuery.Range(0, 0, "")

	countData, count, err := countQuery.Execute()
	var total int64 = int64(len(records)) // Fallback to current count

	// The count value should be returned in the second return value
	if count >= 0 {
		total = int64(count)
	} else if err == nil && len(countData) > 0 {
		// Try to parse count from response as fallback
		var countResult []map[string]interface{}
		if err := json.Unmarshal(countData, &countResult); err == nil && len(countResult) > 0 {
			if cnt, ok := countResult[0]["count"].(float64); ok {
				total = int64(cnt)
			}
		}
	}

	return records, total, nil
}

// CreateRecord inserts a new record
func (a *SupabaseAdapter) CreateRecord(
	ctx context.Context,
	userID string,
	req *CreateRequest,
) (*DuplicateOperatorData, error) {
	_ = ctx // unused parameter

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	id := uuid.New()
	now := time.Now().UTC()

	// Build the record to insert
	record := map[string]interface{}{
		"id":                         id.String(),
		"user_id":                    userID,
		"nik_duplicate":              req.NikDuplicate,
		"nama_duplicate":             req.NamaDuplicate,
		"nik_operator":               req.NikOperator,
		"nama_operator":              req.NamaOperator,
		"nik_pengaju":                req.NikPengaju,
		"nama_pengaju":               req.NamaPengaju,
		"tanggal_perekaman":          req.TanggalPerekaman,
		"tanggal_pengajuan":          req.TanggalPengajuan,
		"estimasi_tanggal_perekaman": req.EstimasiTanggalPerekaman,
		"is_ready_to_record":         req.IsReadyToRecord,
		"created_at":                 now,
	}

	// Convert record to JSON bytes for insertion
	data, err := json.Marshal([]map[string]interface{}{record})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal record: %w", err)
	}

	// Insert into database
	resultData, _, err := a.client.From("duplicate_operator").
		Insert(data, true, "", "", "").
		Execute()

	if err != nil {
		return nil, fmt.Errorf("failed to create record: %w", err)
	}

	// Unmarshal the response
	var createdRecords []DuplicateOperatorData
	if err := json.Unmarshal(resultData, &createdRecords); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(createdRecords) == 0 {
		return nil, fmt.Errorf("no record returned from creation")
	}

	return &createdRecords[0], nil
}

// UpdateRecord updates an existing record
func (a *SupabaseAdapter) UpdateRecord(
	ctx context.Context,
	id string,
	req *UpdateRequest,
) (*DuplicateOperatorData, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	// Verify record exists first
	if _, err := a.GetRecordByID(ctx, id); err != nil {
		return nil, err
	}

	// Build update map with only provided fields
	updates := map[string]interface{}{}

	if req.NikDuplicate != nil {
		updates["nik_duplicate"] = *req.NikDuplicate
	}
	if req.NamaDuplicate != nil {
		updates["nama_duplicate"] = *req.NamaDuplicate
	}
	if req.NikOperator != nil {
		updates["nik_operator"] = *req.NikOperator
	}
	if req.NamaOperator != nil {
		updates["nama_operator"] = *req.NamaOperator
	}
	if req.NikPengaju != nil {
		updates["nik_pengaju"] = *req.NikPengaju
	}
	if req.NamaPengaju != nil {
		updates["nama_pengaju"] = *req.NamaPengaju
	}
	if req.TanggalPerekaman != nil {
		updates["tanggal_perekaman"] = *req.TanggalPerekaman
	}
	if req.TanggalPengajuan != nil {
		updates["tanggal_pengajuan"] = *req.TanggalPengajuan
	}
	if req.EstimasiTanggalPerekaman != nil {
		updates["estimasi_tanggal_perekaman"] = *req.EstimasiTanggalPerekaman
	}
	if req.IsReadyToRecord != nil {
		updates["is_ready_to_record"] = *req.IsReadyToRecord
	}

	// Convert to JSON for update
	data, err := json.Marshal(updates)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updates: %w", err)
	}

	// Update record
	resultData, _, err := a.client.From("duplicate_operator").
		Update(data, "", "").
		Eq("id", id).
		Execute()

	if err != nil {
		return nil, fmt.Errorf("failed to update record: %w", err)
	}

	// Unmarshal the response
	var updatedRecords []DuplicateOperatorData
	if err := json.Unmarshal(resultData, &updatedRecords); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(updatedRecords) == 0 {
		// Fallback to returning the updated version from database
		return a.GetRecordByID(ctx, id)
	}

	return &updatedRecords[0], nil
}

// DeleteRecord deletes a record
func (a *SupabaseAdapter) DeleteRecord(ctx context.Context, id string) error {
	if a.client == nil {
		return fmt.Errorf("database client not initialized")
	}

	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		return fmt.Errorf("invalid record ID format: %w", err)
	}

	// Verify record exists first
	if _, err := a.GetRecordByID(ctx, id); err != nil {
		return err
	}

	// Execute delete
	_, _, err := a.client.From("duplicate_operator").Delete("", "").Eq("id", id).Execute()
	if err != nil {
		return fmt.Errorf("failed to delete record: %w", err)
	}

	return nil
}

// SearchRecords is deprecated and should not be used.
// All search logic is now consolidated in ListRecords.
func (a *SupabaseAdapter) SearchRecords(
	ctx context.Context,
	query string,
	filters map[string]interface{},
) ([]DuplicateOperatorData, error) {
	// This function is deprecated.
	// For new implementations, use ListRecords which has unified search.
	// To maintain backward compatibility for any potential old calls,
	// it now redirects to ListRecords.

	// Combine query into filters
	if filters == nil {
		filters = make(map[string]interface{})
	}
	filters["search"] = query

	// Extract page and pageSize for ListRecords
	page := 1
	if p, ok := filters["page"].(int); ok {
		page = p
	}
	pageSize := 50 // A reasonable default
	if ps, ok := filters["page_size"].(int); ok {
		pageSize = ps
	}

	records, _, err := a.ListRecords(ctx, filters, page, pageSize)
	return records, err
}
