package duplicate_operator

import (
	"context"
	"encoding/json"
	"fmt"
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
	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		return nil, fmt.Errorf("invalid ID format: %w", err)
	}

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

	// Apply pagination using Range
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
			return nil, 0, fmt.Errorf("failed to parse record: %w", err)
		}
		records = append(records, record)
	}

	// Get total count with same filters
	countQuery := a.client.From("duplicate_operator").
		Select("*", "exact", false)

	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		countQuery = countQuery.Eq("is_ready_to_record", strconv.FormatBool(isReady))
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
	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	id := uuid.New()
	now := time.Now().UTC()

	// Build the record to insert
	record := map[string]interface{}{
		"id":                            id.String(),
		"user_id":                       userID,
		"nik_duplicate":                 req.NikDuplicate,
		"nama_duplicate":                req.NamaDuplicate,
		"nik_operator":                  req.NikOperator,
		"nama_operator":                 req.NamaOperator,
		"tanggal_perekaman":             req.TanggalPerekaman,
		"tanggal_pengajuan":             req.TanggalPengajuan,
		"estimasi_tanggal_perekaman":    req.EstimasiTanggalPerekaman,
		"is_ready_to_record":            req.IsReadyToRecord,
		"created_at":                    now,
		"updated_at":                    now,
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
	updates := map[string]interface{}{
		"updated_at": time.Now().UTC(),
	}

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

// SearchRecords performs full-text search
func (a *SupabaseAdapter) SearchRecords(
	ctx context.Context,
	query string,
	filters map[string]interface{},
) ([]DuplicateOperatorData, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	// Build base query - fetch all records, then filter in memory for search
	dbQuery := a.client.From("duplicate_operator").Select("*", "", false)

	// Apply only filter conditions to database query
	// Search will be done in-memory for better control
	if filters != nil {
		if status, ok := filters["is_ready_to_record"].(bool); ok {
			dbQuery = dbQuery.Eq("is_ready_to_record", strconv.FormatBool(status))
		}
		if userID, ok := filters["user_id"].(string); ok {
			dbQuery = dbQuery.Eq("user_id", userID)
		}
	}

	// Execute query
	resultData, _, err := dbQuery.Execute()
	if err != nil {
		return nil, fmt.Errorf("search query failed: %w", err)
	}

	// Parse results
	var records []DuplicateOperatorData
	if err := json.Unmarshal(resultData, &records); err != nil {
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}

	// Apply search filter in-memory if query provided
	if query != "" {
		trimmedQuery := strings.ToLower(strings.TrimSpace(query))
		filteredRecords := make([]DuplicateOperatorData, 0)
		
		for _, record := range records {
			// Check if search term matches any searchable field (case-insensitive)
			if strings.Contains(strings.ToLower(record.NikDuplicate), trimmedQuery) ||
				strings.Contains(strings.ToLower(record.NikOperator), trimmedQuery) ||
				strings.Contains(strings.ToLower(record.NamaDuplicate), trimmedQuery) ||
				strings.Contains(strings.ToLower(record.NamaOperator), trimmedQuery) ||
				strings.Contains(strings.ToLower(record.NikPengaju), trimmedQuery) ||
				strings.Contains(strings.ToLower(record.NamaPengaju), trimmedQuery) {
				filteredRecords = append(filteredRecords, record)
			}
		}
		records = filteredRecords
	}

	return records, nil
}
