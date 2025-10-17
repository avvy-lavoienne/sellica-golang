package aktivitas_siak

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// ServiceImpl is the concrete implementation of the Service interface
type ServiceImpl struct {
	db        DatabaseAdapter
	cache     CacheAdapter
	monitor   MonitoringAdapter
	auditLog  AuditLogger
	rateLimiter RateLimitChecker
	logger    *logrus.Logger
}

// NewService creates a new instance of the aktivitas_siak service
func NewService(
	db DatabaseAdapter,
	cache CacheAdapter,
	monitor MonitoringAdapter,
	auditLog AuditLogger,
	rateLimiter RateLimitChecker,
	logger *logrus.Logger,
) (Service, error) {
	if db == nil {
		return nil, fmt.Errorf("database adapter is required")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger is required")
	}

	// Cache, monitor, auditLog, and rateLimiter can be nil (optional adapters)

	return &ServiceImpl{
		db:          db,
		cache:       cache,
		monitor:     monitor,
		auditLog:    auditLog,
		rateLimiter: rateLimiter,
		logger:      logger,
	}, nil
}

// Create creates a new aktivitas_siak record with validation and duplicate checking
func (s *ServiceImpl) Create(ctx context.Context, userID string, req *AktivitasSiakCreateRequest) (*AktivitasSiakData, error) {
	start := time.Now()
	operation := "create"

	defer func() {
		if s.monitor != nil {
			s.monitor.RecordOperation(operation, int(time.Since(start).Milliseconds()), true, nil)
		}
	}()

	// Validate request
	validationResult := s.Validate(req)
	if !validationResult.Valid {
		s.logger.WithFields(logrus.Fields{
			"user_id": userID,
			"errors":  validationResult.Errors,
		}).Warn("Validation failed for aktivitas_siak creation")
		return nil, fmt.Errorf("validasi gagal: data tidak lengkap atau tidak valid")
	}

	// Check rate limiting
	if s.rateLimiter != nil {
		allowed, _, _ := s.rateLimiter.CheckRateLimit(ctx, userID, operation)
		if !allowed {
			return nil, fmt.Errorf("terlalu banyak permintaan, coba lagi dalam beberapa menit")
		}
	}

	// Check for duplicates
	exists, existingID, err := s.db.CheckDuplicate(ctx, userID, req.BulanRekapitulasi)
	if err != nil {
		s.logger.WithError(err).Error("Error checking for duplicate aktivitas_siak record")
		return nil, fmt.Errorf("gagal memeriksa data duplikat")
	}
	if exists {
		s.logger.WithFields(logrus.Fields{
			"user_id":            userID,
			"bulan_rekapitulasi": req.BulanRekapitulasi,
			"existing_id":        existingID,
		}).Info("Duplicate aktivitas_siak record attempted")
		return nil, fmt.Errorf("sudah ada data untuk bulan ini: %s", req.BulanRekapitulasi)
	}

	// Create record in database
	record, err := s.db.Create(ctx, userID, req)
	if err != nil {
		s.logger.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
		}).Error("Failed to create aktivitas_siak record")
		return nil, fmt.Errorf("gagal menyimpan data aktivitas")
	}

	// Log creation in audit log
	if s.auditLog != nil {
		if auditErr := s.auditLog.LogCreate(ctx, userID, record); auditErr != nil {
			s.logger.WithError(auditErr).Warn("Failed to log aktivitas_siak creation in audit trail")
			// Don't return error, continue execution
		}
	}

	// Invalidate user cache
	if s.cache != nil {
		if cacheErr := s.cache.InvalidateUserCache(ctx, userID); cacheErr != nil {
			s.logger.WithError(cacheErr).Warn("Failed to invalidate cache after aktivitas_siak creation")
		}
	}

	s.logger.WithFields(logrus.Fields{
		"user_id":   userID,
		"record_id": record.ID,
	}).Info("Aktivitas_siak record created successfully")

	return record, nil
}

// GetByID retrieves a single aktivitas_siak record with authorization check
func (s *ServiceImpl) GetByID(ctx context.Context, userID string, id string, isAdmin bool) (*AktivitasSiakData, error) {
	start := time.Now()
	operation := "get_by_id"
	defer func() {
		if s.monitor != nil {
			s.monitor.RecordOperation(operation, int(time.Since(start).Milliseconds()), true, nil)
		}
	}()

	// Check cache first
	if s.cache != nil {
		cacheKey := fmt.Sprintf("aktivitas_siak:id:%s", id)
		var cached AktivitasSiakData
		if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
			s.monitor.RecordCacheHit()
			return &cached, nil
		}
		s.monitor.RecordCacheMiss()
	}

	// Get from database
	record, err := s.db.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data aktivitas")
	}

	// Authorization check: user can only see their own records
	if !isAdmin && record.UserID != userID {
		s.logger.WithFields(logrus.Fields{
			"user_id":        userID,
			"record_id":      id,
			"record_user_id": record.UserID,
		}).Warn("Unauthorized access attempt to aktivitas_siak record")
		return nil, fmt.Errorf("anda tidak memiliki akses ke data ini")
	}

	// Cache the result
	if s.cache != nil {
		cacheKey := fmt.Sprintf("aktivitas_siak:id:%s", id)
		if cacheErr := s.cache.Set(ctx, cacheKey, record, 3600); cacheErr != nil {
			s.logger.WithError(cacheErr).Debug("Failed to cache aktivitas_siak record")
		}
	}

	// Log access in audit log
	if s.auditLog != nil {
		if auditErr := s.auditLog.LogView(ctx, userID, id); auditErr != nil {
			s.logger.WithError(auditErr).Debug("Failed to log aktivitas_siak access in audit trail")
		}
	}

	return record, nil
}

// List retrieves aktivitas_siak records with pagination
func (s *ServiceImpl) List(ctx context.Context, userID string, isAdmin bool, page, pageSize int) (*AktivitasSiakListResponse, error) {
	start := time.Now()
	operation := "list"
	defer func() {
		if s.monitor != nil {
			s.monitor.RecordOperation(operation, int(time.Since(start).Milliseconds()), true, nil)
		}
	}()

	// Pagination validation
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var response *AktivitasSiakListResponse
	var err error

	if isAdmin {
		response, err = s.db.ListAll(ctx, page, pageSize)
	} else {
		response, err = s.db.ListByUser(ctx, userID, page, pageSize)
	}

	if err != nil {
		s.logger.WithError(err).WithFields(logrus.Fields{
			"user_id": userID,
			"isAdmin": isAdmin,
		}).Error("Failed to list aktivitas_siak records")
		return nil, fmt.Errorf("gagal mengambil daftar data aktivitas")
	}

	return response, nil
}

// Update modifies an aktivitas_siak record
func (s *ServiceImpl) Update(ctx context.Context, userID string, id string, req *AktivitasSiakUpdateRequest, isAdmin bool) (*AktivitasSiakData, error) {
	start := time.Now()
	operation := "update"
	defer func() {
		if s.monitor != nil {
			s.monitor.RecordOperation(operation, int(time.Since(start).Milliseconds()), true, nil)
		}
	}()

	// Get existing record to verify ownership
	existing, err := s.db.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("data tidak ditemukan")
	}

	// Authorization check
	if !isAdmin && existing.UserID != userID {
		return nil, fmt.Errorf("anda tidak memiliki akses untuk mengubah data ini")
	}

	// Update record
	updated, err := s.db.Update(ctx, id, userID, req)
	if err != nil {
		s.logger.WithError(err).Error("Failed to update aktivitas_siak record")
		return nil, fmt.Errorf("gagal memperbarui data aktivitas")
	}

	// Log update in audit log
	if s.auditLog != nil {
		changes := map[string]interface{}{
			"total_aktivitas_individu":    req.TotalAktivitasIndividu,
			"total_aktivitas_keseluruhan": req.TotalAktivitasKeseluruhan,
			"fix_anomali_data":            req.FixAномaliData,
			"restore_data_maintenance":    req.RestoreDataMaintenance,
			"restore_data_ktp":            req.RestoreDataKTP,
			"daftar_duplikasi":            req.DaftarDuplikasi,
			"login_user":                  req.LoginUser,
			"logout_user":                 req.LogoutUser,
			"mutasi_elemen_data":          req.MutasiElemenData,
		}
		if auditErr := s.auditLog.LogUpdate(ctx, userID, id, changes); auditErr != nil {
			s.logger.WithError(auditErr).Warn("Failed to log aktivitas_siak update in audit trail")
		}
	}

	// Invalidate cache
	if s.cache != nil {
		cacheKey := fmt.Sprintf("aktivitas_siak:id:%s", id)
		if cacheErr := s.cache.Delete(ctx, cacheKey); cacheErr != nil {
			s.logger.WithError(cacheErr).Debug("Failed to invalidate cache after aktivitas_siak update")
		}
		if cacheErr := s.cache.InvalidateUserCache(ctx, userID); cacheErr != nil {
			s.logger.WithError(cacheErr).Debug("Failed to invalidate user cache after aktivitas_siak update")
		}
	}

	s.logger.WithFields(logrus.Fields{
		"user_id":   userID,
		"record_id": id,
	}).Info("Aktivitas_siak record updated successfully")

	return updated, nil
}

// Delete removes an aktivitas_siak record
func (s *ServiceImpl) Delete(ctx context.Context, userID string, id string, isAdmin bool) error {
	start := time.Now()
	operation := "delete"
	defer func() {
		if s.monitor != nil {
			s.monitor.RecordOperation(operation, int(time.Since(start).Milliseconds()), true, nil)
		}
	}()

	// Get existing record to verify ownership
	existing, err := s.db.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("data tidak ditemukan")
	}

	// Authorization check
	if !isAdmin && existing.UserID != userID {
		return fmt.Errorf("anda tidak memiliki akses untuk menghapus data ini")
	}

	// Delete record
	if err := s.db.Delete(ctx, id, userID); err != nil {
		s.logger.WithError(err).Error("Failed to delete aktivitas_siak record")
		return fmt.Errorf("gagal menghapus data aktivitas")
	}

	// Log deletion in audit log
	if s.auditLog != nil {
		if auditErr := s.auditLog.LogDelete(ctx, userID, id); auditErr != nil {
			s.logger.WithError(auditErr).Warn("Failed to log aktivitas_siak deletion in audit trail")
		}
	}

	// Invalidate cache
	if s.cache != nil {
		cacheKey := fmt.Sprintf("aktivitas_siak:id:%s", id)
		if cacheErr := s.cache.Delete(ctx, cacheKey); cacheErr != nil {
			s.logger.WithError(cacheErr).Debug("Failed to invalidate cache after aktivitas_siak deletion")
		}
		if cacheErr := s.cache.InvalidateUserCache(ctx, userID); cacheErr != nil {
			s.logger.WithError(cacheErr).Debug("Failed to invalidate user cache after aktivitas_siak deletion")
		}
	}

	s.logger.WithFields(logrus.Fields{
		"user_id":   userID,
		"record_id": id,
	}).Info("Aktivitas_siak record deleted successfully")

	return nil
}

// CheckDuplicate checks if a record exists for the given month (as string, e.g., "Oktober 2025")
func (s *ServiceImpl) CheckDuplicate(ctx context.Context, userID string, bulanRekapitulasi string) (*DuplicateCheckResponse, error) {
	exists, id, err := s.db.CheckDuplicate(ctx, userID, bulanRekapitulasi)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa data duplikat")
	}

	return &DuplicateCheckResponse{
		Exists: exists,
		ID:     id,
	}, nil
}

// GetStatistics returns aktivitas statistics for user or all users if admin
func (s *ServiceImpl) GetStatistics(ctx context.Context, userID string, isAdmin bool) (*Statistics, error) {
	var stats *Statistics
	var err error

	if isAdmin {
		stats, err = s.db.GetAdminStatistics(ctx)
	} else {
		stats, err = s.db.GetStatistics(ctx, userID)
	}

	if err != nil {
		return nil, fmt.Errorf("gagal mengambil statistik aktivitas")
	}

	return stats, nil
}

// Validate validates AktivitasSiakCreateRequest
func (s *ServiceImpl) Validate(req *AktivitasSiakCreateRequest) *ValidationResult {
	errors := make(map[string]string)

	// Validate bulan_rekapitulasi (should be non-empty string like "Oktober 2025")
	if req.BulanRekapitulasi == "" {
		errors["bulan_rekapitulasi"] = "Bulan rekapitulasi wajib diisi (contoh: 'Oktober 2025')"
	}
	if len(req.BulanRekapitulasi) > 100 {
		errors["bulan_rekapitulasi"] = "Bulan rekapitulasi tidak boleh lebih dari 100 karakter"
	}

	// Validate TEXT fields - all are optional, just check length if provided
	if len(req.TotalAktivitasIndividu) > 500 {
		errors["total_aktivitas_individu"] = "Total aktivitas individu tidak boleh lebih dari 500 karakter"
	}
	if len(req.TotalAktivitasKeseluruhan) > 500 {
		errors["total_aktivitas_keseluruhan"] = "Total aktivitas keseluruhan tidak boleh lebih dari 500 karakter"
	}
	if len(req.FixAномaliData) > 500 {
		errors["fix_anomali_data"] = "Fix anomali data tidak boleh lebih dari 500 karakter"
	}
	if len(req.RestoreDataMaintenance) > 500 {
		errors["restore_data_maintenance"] = "Restore data maintenance tidak boleh lebih dari 500 karakter"
	}
	if len(req.RestoreDataKTP) > 500 {
		errors["restore_data_ktp"] = "Restore data KTP tidak boleh lebih dari 500 karakter"
	}
	if len(req.DaftarDuplikasi) > 500 {
		errors["daftar_duplikasi"] = "Daftar duplikasi tidak boleh lebih dari 500 karakter"
	}
	if len(req.LoginUser) > 500 {
		errors["login_user"] = "Login user tidak boleh lebih dari 500 karakter"
	}
	if len(req.LogoutUser) > 500 {
		errors["logout_user"] = "Logout user tidak boleh lebih dari 500 karakter"
	}
	if len(req.MutasiElemenData) > 500 {
		errors["mutasi_elemen_data"] = "Mutasi elemen data tidak boleh lebih dari 500 karakter"
	}

	return &ValidationResult{
		Valid:  len(errors) == 0,
		Errors: errors,
	}
}

// Health returns the health status of the service
func (s *ServiceImpl) Health(ctx context.Context) map[string]interface{} {
	health := map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"database":     "unknown",
			"cache":        "unknown",
			"audit_logger": "unknown",
			"rate_limiter": "unknown",
		},
	}

	// Check each component's availability
	if s.db != nil {
		health["components"].(map[string]interface{})["database"] = "available"
	}
	if s.cache != nil {
		health["components"].(map[string]interface{})["cache"] = "available"
	}
	if s.auditLog != nil {
		health["components"].(map[string]interface{})["audit_logger"] = "available"
	}
	if s.rateLimiter != nil {
		health["components"].(map[string]interface{})["rate_limiter"] = "available"
	}

	if s.monitor != nil {
		health["metrics"] = s.monitor.GetMetrics()
	}

	return health
}
