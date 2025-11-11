package salah_rekam

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
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
func (a *SupabaseAdapter) GetRecordByID(ctx context.Context, id string) (*SalahRekamData, error) {
	_ = ctx // unused parameter

	// Validate ID is not empty
	if id == "" {
		return nil, fmt.Errorf("ID cannot be empty")
	}

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	// Query from salah_rekam table
	data, _, err := a.client.From("salah_rekam").
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

	// Unmarshal response into SalahRekamData
	var record SalahRekamData
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
) ([]SalahRekamData, int64, error) {
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
	query := a.client.From("salah_rekam").
		Select("*", "", false).
		Order("created_at", nil)

	// Apply status filter if provided
	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		query = query.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// Convert and store date filters
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
	if searchQuery, ok := filters["search"].(string); ok && searchQuery != "" {
		// Simple text search across multiple fields
		var orConditions []string
		encodedQuery := url.QueryEscape(strings.TrimSpace(searchQuery))

		orConditions = append(orConditions, fmt.Sprintf("nik_salah_rekam.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_pengaju.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_salah_rekam.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_pengaju.ilike.*%s*", encodedQuery))

		query = query.Or(strings.Join(orConditions, ","), "")
	}

	// Always fetch all records without pagination limit at DB level
	query = query.Range(0, 9999, "")

	// Execute query
	data, _, err := query.Execute()
	if err != nil {
		return nil, 0, fmt.Errorf("database query failed: %w", err)
	}

	// Unmarshal response
	var rawRecords []json.RawMessage
	if err := json.Unmarshal(data, &rawRecords); err != nil {
		return nil, 0, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert each raw record and apply post-filtering for dates
	records := make([]SalahRekamData, 0, len(rawRecords))

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
		var record SalahRekamData
		if err := json.Unmarshal(rawRecord, &record); err != nil {
			logrus.WithError(err).Warnf("[salah_rekam] Failed to parse a record")
			continue
		}

		// Post-filter by date if filters were applied
		if filterDateFrom != nil || filterDateTo != nil {
			recordDate := record.TanggalPerekaman

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

	// Get total count with same filters
	countQuery := a.client.From("salah_rekam").
		Select("count", "exact", false)

	// Apply AND filters FIRST to count query
	if isReady, ok := filters["is_ready_to_record"].(bool); ok {
		countQuery = countQuery.Eq("is_ready_to_record", strconv.FormatBool(isReady))
	}

	// Apply same search filter logic to count query LAST
	if searchQuery, ok := filters["search"].(string); ok && searchQuery != "" {
		var orConditions []string
		encodedQuery := url.QueryEscape(strings.TrimSpace(searchQuery))

		orConditions = append(orConditions, fmt.Sprintf("nik_salah_rekam.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nik_pengaju.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_salah_rekam.ilike.*%s*", encodedQuery))
		orConditions = append(orConditions, fmt.Sprintf("nama_pengaju.ilike.*%s*", encodedQuery))

		countQuery = countQuery.Or(strings.Join(orConditions, ","), "")
	}

	// Execute count query
	_, count, err := countQuery.Execute()
	var total int64 = 100

	if count >= 0 {
		total = int64(count)
	}

	// If we have date filters, update count based on filtered results
	if (hasDateFrom && dateFrom != "") || (hasDateTo && dateTo != "") {
		if len(records) > 0 {
			total = int64(len(records))
		}
	}

	// Apply final pagination
	startIdx := (page - 1) * pageSize
	endIdx := startIdx + pageSize

	if startIdx >= len(records) {
		records = []SalahRekamData{}
	} else if endIdx > len(records) {
		records = records[startIdx:]
	} else {
		records = records[startIdx:endIdx]
	}

	return records, total, nil
}

// CreateRecord inserts a new record
func (a *SupabaseAdapter) CreateRecord(
	ctx context.Context,
	userID string,
	req *CreateRequest,
) (*SalahRekamData, error) {
	_ = ctx // unused parameter

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	if userID == "" {
		return nil, fmt.Errorf("user_id cannot be empty")
	}

	// Parse dates
	tanggalPerekaman, err := time.Parse("2006-01-02", req.TanggalPerekaman)
	if err != nil {
		return nil, fmt.Errorf("invalid tanggal_perekaman format: %w", err)
	}

	// Create the record data
	recordData := map[string]interface{}{
		"user_id":                    userID,
		"nik_salah_rekam":            req.NikSalahRekam,
		"nama_salah_rekam":           req.NamaSalahRekam,
		"nik_pemilik_biometric":      req.NikPemilikBiometric,
		"nama_pemilik_biometric":     req.NamaPemilikBiometric,
		"nik_pemilik_foto":           req.NikPemilikFoto,
		"nama_pemilik_foto":          req.NamaPemilikFoto,
		"nik_petugas_rekam":          req.NikPetugasRekam,
		"nama_petugas_rekam":         req.NamaPetugasRekam,
		"tanggal_perekaman":          tanggalPerekaman.Format("2006-01-02"),
		"nik_pengaju":                req.NikPengaju,
		"nama_pengaju":               req.NamaPengaju,
		"is_ready_to_record":         req.IsReadyToRecord,
	}

	// Add optional fields
	if req.EstimasiTanggalPerekaman != "" {
		recordData["estimasi_tanggal_perekaman"] = req.EstimasiTanggalPerekaman
	}

	// Insert record
	data, _, err := a.client.From("salah_rekam").
		Insert(recordData, false, "", "", "").
		Single().
		Execute()

	if err != nil {
		logrus.WithError(err).Error("[salah_rekam] Failed to create record")
		return nil, fmt.Errorf("failed to create record: %w", err)
	}

	// Parse response
	var record SalahRekamData
	if err := json.Unmarshal(data, &record); err != nil {
		return nil, fmt.Errorf("failed to parse created record: %w", err)
	}

	return &record, nil
}

// UpdateRecord updates an existing record
func (a *SupabaseAdapter) UpdateRecord(
	ctx context.Context,
	id string,
	req *UpdateRequest,
) (*SalahRekamData, error) {
	_ = ctx // unused parameter

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	if id == "" {
		return nil, fmt.Errorf("ID cannot be empty")
	}

	// Build update data - only include provided fields
	updateData := make(map[string]interface{})

	if req.NikSalahRekam != nil && *req.NikSalahRekam != "" {
		updateData["nik_salah_rekam"] = *req.NikSalahRekam
	}
	if req.NamaSalahRekam != nil && *req.NamaSalahRekam != "" {
		updateData["nama_salah_rekam"] = *req.NamaSalahRekam
	}
	if req.NikPemilikBiometric != nil && *req.NikPemilikBiometric != "" {
		updateData["nik_pemilik_biometric"] = *req.NikPemilikBiometric
	}
	if req.NamaPemilikBiometric != nil && *req.NamaPemilikBiometric != "" {
		updateData["nama_pemilik_biometric"] = *req.NamaPemilikBiometric
	}
	if req.NikPemilikFoto != nil && *req.NikPemilikFoto != "" {
		updateData["nik_pemilik_foto"] = *req.NikPemilikFoto
	}
	if req.NamaPemilikFoto != nil && *req.NamaPemilikFoto != "" {
		updateData["nama_pemilik_foto"] = *req.NamaPemilikFoto
	}
	if req.NikPetugasRekam != nil && *req.NikPetugasRekam != "" {
		updateData["nik_petugas_rekam"] = *req.NikPetugasRekam
	}
	if req.NamaPetugasRekam != nil && *req.NamaPetugasRekam != "" {
		updateData["nama_petugas_rekam"] = *req.NamaPetugasRekam
	}
	if req.TanggalPerekaman != nil && *req.TanggalPerekaman != "" {
		updateData["tanggal_perekaman"] = *req.TanggalPerekaman
	}
	if req.EstimasiTanggalPerekaman != nil && *req.EstimasiTanggalPerekaman != "" {
		updateData["estimasi_tanggal_perekaman"] = *req.EstimasiTanggalPerekaman
	}
	if req.NikPengaju != nil && *req.NikPengaju != "" {
		updateData["nik_pengaju"] = *req.NikPengaju
	}
	if req.NamaPengaju != nil && *req.NamaPengaju != "" {
		updateData["nama_pengaju"] = *req.NamaPengaju
	}
	if req.IsReadyToRecord != nil {
		updateData["is_ready_to_record"] = *req.IsReadyToRecord
	}

	// If no fields to update, return error
	if len(updateData) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Update record
	data, _, err := a.client.From("salah_rekam").
		Update(updateData, "", "").
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		if err.Error() == "no rows" {
			return nil, fmt.Errorf("record not found")
		}
		logrus.WithError(err).Errorf("[salah_rekam] Failed to update record %s", id)
		return nil, fmt.Errorf("failed to update record: %w", err)
	}

	// Parse response
	var record SalahRekamData
	if err := json.Unmarshal(data, &record); err != nil {
		return nil, fmt.Errorf("failed to parse updated record: %w", err)
	}

	return &record, nil
}

// DeleteRecord deletes a record
func (a *SupabaseAdapter) DeleteRecord(ctx context.Context, id string) error {
	_ = ctx // unused parameter

	if a.client == nil {
		return fmt.Errorf("database client not initialized")
	}

	if id == "" {
		return fmt.Errorf("ID cannot be empty")
	}

	// Delete record
	_, _, err := a.client.From("salah_rekam").
		Delete("", "").
		Eq("id", id).
		Execute()

	if err != nil {
		logrus.WithError(err).Errorf("[salah_rekam] Failed to delete record %s", id)
		return fmt.Errorf("failed to delete record: %w", err)
	}

	return nil
}

// SearchRecords performs full-text search
func (a *SupabaseAdapter) SearchRecords(
	ctx context.Context,
	query string,
	filters map[string]interface{},
) ([]SalahRekamData, error) {
	_ = ctx // unused parameter

	if a.client == nil {
		return nil, fmt.Errorf("database client not initialized")
	}

	if query == "" {
		return nil, fmt.Errorf("search query cannot be empty")
	}

	// Build search query
	searchQuery := a.client.From("salah_rekam").
		Select("*", "", false)

	// Build OR conditions for search across multiple fields
	var orConditions []string
	encodedQuery := url.QueryEscape(strings.TrimSpace(query))

	orConditions = append(orConditions, fmt.Sprintf("nik_salah_rekam.ilike.*%s*", encodedQuery))
	orConditions = append(orConditions, fmt.Sprintf("nik_pengaju.ilike.*%s*", encodedQuery))
	orConditions = append(orConditions, fmt.Sprintf("nama_salah_rekam.ilike.*%s*", encodedQuery))
	orConditions = append(orConditions, fmt.Sprintf("nama_pengaju.ilike.*%s*", encodedQuery))

	searchQuery = searchQuery.Or(strings.Join(orConditions, ","), "")

	// Execute search
	data, _, err := searchQuery.Execute()
	if err != nil {
		logrus.WithError(err).Errorf("[salah_rekam] Search failed for query: %s", query)
		return nil, fmt.Errorf("search failed: %w", err)
	}

	// Parse results
	var records []SalahRekamData
	if err := json.Unmarshal(data, &records); err != nil {
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}

	return records, nil
}
