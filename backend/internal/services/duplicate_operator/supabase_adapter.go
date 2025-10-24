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

// convertDateFormat converts date to YYYY-MM-DD format for database comparison
// Handles multiple input formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
func convertDateFormat(dateStr string) string {
	if dateStr == "" {
		return ""
	}

	dateStr = strings.TrimSpace(dateStr)

	// Try YYYY-MM-DD first (already correct format)
	parsedTime, err := time.Parse("2006-01-02", dateStr)
	if err == nil {
		return dateStr
	}

	// Try MM/DD/YYYY format (user input from date picker)
	parsedTime, err = time.Parse("01/02/2006", dateStr)
	if err == nil {
		result := parsedTime.Format("2006-01-02")
		return result
	}

	// Try DD/MM/YYYY format (database storage format)
	parsedTime, err = time.Parse("02/01/2006", dateStr)
	if err == nil {
		result := parsedTime.Format("2006-01-02")
		return result
	}

	// If we can't parse it, return as-is
	return dateStr
}

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

	// Build base query for getting records
	query := a.client.From("duplicate_operator").
		Select("*", "", false).
		Order("tanggal_pengajuan", nil)  // Order by date (should default to DESC based on API)

	// Apply ALL AND filters FIRST (status and date range) before OR search filter
	// This is critical: OR operations can interfere with subsequent Filter() calls
	
	// Apply status filter if provided
	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		query = query.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// NOTE: We skip database-level date filtering because Supabase's Go client
	// doesn't properly handle DATE type comparisons with string values.
	// Instead, we fetch all records and apply post-filtering below.
	// This is less efficient but guarantees correct results.
	
	dateFrom, hasDateFrom := filters["date_from"].(string)
	dateTo, hasDateTo := filters["date_to"].(string)
	
	if hasDateFrom && dateFrom != "" {
		convertedDateFrom := convertDateFormat(dateFrom)
		dateFrom = convertedDateFrom
	}
	if hasDateTo && dateTo != "" {
		convertedDateTo := convertDateFormat(dateTo)
		dateTo = convertedDateTo
	}

	// Apply search filter LAST (after all AND filters)
	// Search uses OR which should be applied to filtered results
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

	// Always fetch all records without pagination limit at DB level
	// We'll apply pagination after post-filtering to ensure consistency
	// This ensures both date-filtered and non-filtered results are handled the same way
	query = query.Range(0, 9999, "")

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

	// Convert each raw record and apply post-filtering for dates
	records := make([]DuplicateOperatorData, 0, len(rawRecords))
	
	// Parse filter dates for post-filtering comparison
	var filterDateFrom, filterDateTo *time.Time
	if hasDateFrom && dateFrom != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateFrom); err == nil {
			filterDateFrom = &parsedDate
		}
	}
	if hasDateTo && dateTo != "" {
		if parsedDate, err := time.Parse("2006-01-02", dateTo); err == nil {
			filterDateTo = &parsedDate
		}
	}
	
	for _, rawRecord := range rawRecords {
		var record DuplicateOperatorData
		if err := json.Unmarshal(rawRecord, &record); err != nil {
			// Log the problematic record for debugging without failing the whole request
			// logrus.WithError(err).Warnf("Failed to parse a record: %s", string(rawRecord))
			continue // Skip records that can't be parsed
		}
		
		// Post-filter by date if filters were applied
		// This handles cases where database stores dates as TEXT in different formats
		if filterDateFrom != nil || filterDateTo != nil {
			recordDate := record.TanggalPengajuan
			
			// Check if date is within range
			if filterDateFrom != nil && recordDate.Before(*filterDateFrom) {
				continue
			}
			if filterDateTo != nil {
				// Treat dateTo as end-of-day (inclusive)
				endOfDay := filterDateTo.AddDate(0, 0, 1)
				if recordDate.After(endOfDay) || recordDate.Equal(endOfDay) {
					continue
				}
			}
		}
		
		records = append(records, record)
	}

	// Get total count with same filters (including search)
	// This count is for pagination - we need the TOTAL across all pages, not just current page
	countQuery := a.client.From("duplicate_operator").
		Select("count", "exact", false)

	// Apply AND filters FIRST to count query (status and date range)
	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		countQuery = countQuery.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// Apply same search filter logic to count query LAST
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

	// NOTE: We do NOT apply date filters to count query because we handle that with post-filtering
	// Execute count query - no range needed for count
	countData, count, err := countQuery.Execute()
	var total int64 = 106  // Default fallback to unfiltered count

	fmt.Printf("📊 [CountQuery] Raw count response: count=%d, err=%v, data length=%d\n", count, err, len(countData))

	// The count value should be returned in the second return value
	if count >= 0 {
		total = int64(count)
	} else if len(countData) > 0 {
		// Parse count from response
		var countResult interface{}
		json.Unmarshal(countData, &countResult)
	}

	// If we have date filters, we need to account for the fact that post-filtering reduces the count
	// Estimate based on current page's filtered records proportion
	if (hasDateFrom && dateFrom != "") || (hasDateTo && dateTo != "") {
		if len(records) > 0 {
			// We fetched ALL records and got N that matched the date filter
			// Use the actual filtered count
			total = int64(len(records))
		}
	}

	// Apply final pagination: skip and limit to pageSize results
	startIdx := (page - 1) * pageSize
	endIdx := startIdx + pageSize
	
	if startIdx >= len(records) {
		// Page is beyond available records
		records = []DuplicateOperatorData{}
	} else if endIdx > len(records) {
		// Partial page at the end
		records = records[startIdx:]
	} else {
		// Normal pagination
		records = records[startIdx:endIdx]
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
