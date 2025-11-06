package aktivitas_siak

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// SupabaseDatabaseAdapter implements DatabaseAdapter for Supabase PostgreSQL
// This adapter uses the Supabase Go SDK directly instead of database/sql
type SupabaseDatabaseAdapter struct {
	client *supabase.Client
	logger *logrus.Logger
}

// NewSupabaseDatabaseAdapter creates a new Supabase database adapter
func NewSupabaseDatabaseAdapter(client *supabase.Client, logger *logrus.Logger) (DatabaseAdapter, error) {
	if client == nil {
		return nil, fmt.Errorf("supabase client is required")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger is required")
	}

	return &SupabaseDatabaseAdapter{
		client: client,
		logger: logger,
	}, nil
}

// Create inserts a new aktivitas_siak record
func (s *SupabaseDatabaseAdapter) Create(ctx context.Context, userID string, req *AktivitasSiakCreateRequest) (*AktivitasSiakData, error) {
	// Prepare insert data
	insertData := map[string]interface{}{
		"user_id":                        userID,
		"total_aktivitas_individu":       req.TotalAktivitasIndividu,
		"total_aktivitas_keseluruhan":    req.TotalAktivitasKeseluruhan,
		"fix_anomali_data":               req.FixAномaliData,
		"restore_data_maintenance":       req.RestoreDataMaintenance,
		"restore_data_ktp":                req.RestoreDataKTP,
		"daftar_duplikasi":               req.DaftarDuplikasi,
		"login_user":                     req.LoginUser,
		"logout_user":                    req.LogoutUser,
		"mutasi_elemen_data":             req.MutasiElemenData,
		"bulan_rekapitulasi":             req.BulanRekapitulasi,
	}

	// Execute insert
	data, _, err := s.client.From("aktivitas_siak").
		Insert(insertData, false, "", "", "").
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to create aktivitas_siak record")
		return nil, fmt.Errorf("failed to insert record: %w", err)
	}

	// Parse response
	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse created aktivitas_siak record")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("no record returned after insert")
	}

	return &records[0], nil
}

// GetByID retrieves a single record by UUID
func (s *SupabaseDatabaseAdapter) GetByID(ctx context.Context, id string) (*AktivitasSiakData, error) {
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Eq("id", id).
		Single().
		Execute()

	if err != nil {
		s.logger.WithError(err).WithField("id", id).Error("Failed to retrieve aktivitas_siak record by ID")
		return nil, fmt.Errorf("record not found: %w", err)
	}

	var record AktivitasSiakData
	if err := json.Unmarshal(data, &record); err != nil {
		s.logger.WithError(err).Error("Failed to parse aktivitas_siak record")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &record, nil
}

// GetByUserAndMonth retrieves a record for a specific user and month string
func (s *SupabaseDatabaseAdapter) GetByUserAndMonth(ctx context.Context, userID string, bulanRekapitulasi string) (*AktivitasSiakData, error) {
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Eq("user_id", userID).
		Eq("bulan_rekapitulasi", bulanRekapitulasi).
		Single().
		Execute()

	if err != nil {
		s.logger.WithError(err).WithFields(logrus.Fields{
			"user_id":             userID,
			"bulan_rekapitulasi": bulanRekapitulasi,
		}).Debug("No record found for user and month")
		return nil, fmt.Errorf("record not found: %w", err)
	}

	var record AktivitasSiakData
	if err := json.Unmarshal(data, &record); err != nil {
		s.logger.WithError(err).Error("Failed to parse aktivitas_siak record")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &record, nil
}

// ListByUser retrieves all records for a user with pagination
func (s *SupabaseDatabaseAdapter) ListByUser(ctx context.Context, userID string, page, pageSize int) (*AktivitasSiakListResponse, error) {
	// Calculate offset
	offset := (page - 1) * pageSize

	// Get total count
	countData, _, err := s.client.From("aktivitas_siak").
		Select("id", "exact", false).
		Eq("user_id", userID).
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to count user's aktivitas_siak records")
		return nil, fmt.Errorf("failed to count records: %w", err)
	}

	var countRecords []map[string]interface{}
	if err := json.Unmarshal(countData, &countRecords); err != nil {
		s.logger.WithError(err).Error("Failed to parse count response")
		return nil, fmt.Errorf("failed to parse count: %w", err)
	}
	total := len(countRecords)

	// Get paginated data (ordered by created_at descending)
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Eq("user_id", userID).
		Range(offset, offset+pageSize-1, "").
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to list user's aktivitas_siak records")
		return nil, fmt.Errorf("failed to retrieve records: %w", err)
	}

	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse aktivitas_siak records")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &AktivitasSiakListResponse{
		Data:       records,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// ListAll retrieves all records (admin only) with pagination
func (s *SupabaseDatabaseAdapter) ListAll(ctx context.Context, page, pageSize int) (*AktivitasSiakListResponse, error) {
	// Calculate offset
	offset := (page - 1) * pageSize

	// Get total count
	countData, _, err := s.client.From("aktivitas_siak").
		Select("id", "exact", false).
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to count all aktivitas_siak records")
		return nil, fmt.Errorf("failed to count records: %w", err)
	}

	var countRecords []map[string]interface{}
	if err := json.Unmarshal(countData, &countRecords); err != nil {
		s.logger.WithError(err).Error("Failed to parse count response")
		return nil, fmt.Errorf("failed to parse count: %w", err)
	}
	total := len(countRecords)

	// Get paginated data (ordered by created_at descending)
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Range(offset, offset+pageSize-1, "").
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to list all aktivitas_siak records")
		return nil, fmt.Errorf("failed to retrieve records: %w", err)
	}

	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse aktivitas_siak records")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &AktivitasSiakListResponse{
		Data:       records,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// Update modifies an existing record
func (s *SupabaseDatabaseAdapter) Update(ctx context.Context, id string, userID string, req *AktivitasSiakUpdateRequest) (*AktivitasSiakData, error) {
	// Build update data (only include non-nil fields)
	updateData := make(map[string]interface{})

	if req.TotalAktivitasIndividu != nil {
		updateData["total_aktivitas_individu"] = *req.TotalAktivitasIndividu
	}
	if req.TotalAktivitasKeseluruhan != nil {
		updateData["total_aktivitas_keseluruhan"] = *req.TotalAktivitasKeseluruhan
	}
	if req.FixAномaliData != nil {
		updateData["fix_anomali_data"] = *req.FixAномaliData
	}
	if req.RestoreDataMaintenance != nil {
		updateData["restore_data_maintenance"] = *req.RestoreDataMaintenance
	}
	if req.RestoreDataKTP != nil {
		updateData["restore_data_ktp"] = *req.RestoreDataKTP
	}
	if req.DaftarDuplikasi != nil {
		updateData["daftar_duplikasi"] = *req.DaftarDuplikasi
	}
	if req.LoginUser != nil {
		updateData["login_user"] = *req.LoginUser
	}
	if req.LogoutUser != nil {
		updateData["logout_user"] = *req.LogoutUser
	}
	if req.MutasiElemenData != nil {
		updateData["mutasi_elemen_data"] = *req.MutasiElemenData
	}
	if req.BulanRekapitulasi != nil {
		updateData["bulan_rekapitulasi"] = *req.BulanRekapitulasi
	}

	if len(updateData) == 0 {
		// No fields to update, return current record
		return s.GetByID(ctx, id)
	}

	// Execute update
	data, _, err := s.client.From("aktivitas_siak").
		Update(updateData, "", "").
		Eq("id", id).
		Execute()

	if err != nil {
		s.logger.WithError(err).WithField("id", id).Error("Failed to update aktivitas_siak record")
		return nil, fmt.Errorf("failed to update record: %w", err)
	}

	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse updated aktivitas_siak record")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("no record returned after update")
	}

	return &records[0], nil
}

// Delete removes a record
func (s *SupabaseDatabaseAdapter) Delete(ctx context.Context, id string, userID string) error {
	_, _, err := s.client.From("aktivitas_siak").
		Delete("", "").
		Eq("id", id).
		Execute()

	if err != nil {
		s.logger.WithError(err).WithField("id", id).Error("Failed to delete aktivitas_siak record")
		return fmt.Errorf("failed to delete record: %w", err)
	}

	return nil
}

// CheckDuplicate checks if a record exists for the user and month string
func (s *SupabaseDatabaseAdapter) CheckDuplicate(ctx context.Context, userID string, bulanRekapitulasi string) (exists bool, id *string, err error) {
	data, _, err := s.client.From("aktivitas_siak").
		Select("id", "", false).
		Eq("user_id", userID).
		Eq("bulan_rekapitulasi", bulanRekapitulasi).
		Limit(1, "").
		Execute()

	if err != nil {
		// If error is "no rows", that's not an error - just means no duplicate
		s.logger.WithError(err).Debug("No duplicate found (expected for new records)")
		return false, nil, nil
	}

	var records []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse duplicate check response")
		return false, nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(records) == 0 {
		return false, nil, nil
	}

	recordID := records[0].ID
	return true, &recordID, nil
}

// GetStatistics retrieves statistics for a user
func (s *SupabaseDatabaseAdapter) GetStatistics(ctx context.Context, userID string) (*Statistics, error) {
	// Get all records for the user (ordered by created_at descending)
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Eq("user_id", userID).
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to get statistics for user")
		return nil, fmt.Errorf("failed to retrieve records: %w", err)
	}

	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse records for statistics")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Calculate statistics
	stats := &Statistics{
		TotalRecords: len(records),
	}

	if len(records) > 0 {
		stats.LastEntryTime = records[0].CreatedAt // First record (most recent due to DESC order)
		stats.OldestEntryTime = records[len(records)-1].CreatedAt

		// Count unique months
		uniqueMonths := make(map[string]bool)
		currentMonth := time.Now().Format("January 2006")
		recordsThisMonth := 0

		for _, record := range records {
			uniqueMonths[record.BulanRekapitulasi] = true
			if record.BulanRekapitulasi == currentMonth {
				recordsThisMonth++
			}
		}

		stats.UniqueMonths = len(uniqueMonths)
		stats.RecordsThisMonth = recordsThisMonth
	}

	return stats, nil
}

// GetAdminStatistics retrieves statistics for all records (admin only)
func (s *SupabaseDatabaseAdapter) GetAdminStatistics(ctx context.Context) (*Statistics, error) {
	// Get all records (ordered by created_at descending)
	data, _, err := s.client.From("aktivitas_siak").
		Select("*", "", false).
		Execute()

	if err != nil {
		s.logger.WithError(err).Error("Failed to get admin statistics")
		return nil, fmt.Errorf("failed to retrieve records: %w", err)
	}

	var records []AktivitasSiakData
	if err := json.Unmarshal(data, &records); err != nil {
		s.logger.WithError(err).Error("Failed to parse records for admin statistics")
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Calculate statistics
	stats := &Statistics{
		TotalRecords: len(records),
	}

	if len(records) > 0 {
		stats.LastEntryTime = records[0].CreatedAt
		stats.OldestEntryTime = records[len(records)-1].CreatedAt

		// Count unique months
		uniqueMonths := make(map[string]bool)
		currentMonth := time.Now().Format("January 2006")
		recordsThisMonth := 0

		for _, record := range records {
			uniqueMonths[record.BulanRekapitulasi] = true
			if record.BulanRekapitulasi == currentMonth {
				recordsThisMonth++
			}
		}

		stats.UniqueMonths = len(uniqueMonths)
		stats.RecordsThisMonth = recordsThisMonth
	}

	return stats, nil
}
