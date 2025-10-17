package aktivitas_siak

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
)

// PostgresDatabaseAdapter implements DatabaseAdapter for PostgreSQL via Supabase
type PostgresDatabaseAdapter struct {
	db     *sql.DB
	logger *logrus.Logger
}

// NewPostgresDatabaseAdapter creates a new PostgreSQL database adapter
func NewPostgresDatabaseAdapter(db *sql.DB, logger *logrus.Logger) (DatabaseAdapter, error) {
	if db == nil {
		return nil, fmt.Errorf("database connection is required")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger is required")
	}

	return &PostgresDatabaseAdapter{
		db:     db,
		logger: logger,
	}, nil
}

// Create inserts a new aktivitas_siak record
func (p *PostgresDatabaseAdapter) Create(ctx context.Context, userID string, req *AktivitasSiakCreateRequest) (*AktivitasSiakData, error) {
	query := `
		INSERT INTO aktivitas_siak (
			user_id,
			bulan_rekapitulasi,
			tahun_rekapitulasi,
			catatan_kegiatan,
			laporan_kegiatan,
			surat_masuk,
			surat_keluar,
			surat_catat,
			akte_perkawinan,
			akte_perceraian,
			akte_kelahiran,
			akte_catatan_pinggiran,
			created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
		)
		RETURNING id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
				  laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
				  akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
	`

	var record AktivitasSiakData
	var updatedAt *time.Time

	err := p.db.QueryRowContext(ctx, query,
		userID,
		req.BulanRekapitulasi,
		req.TahunRekapitulasi,
		req.CatatanKegiatan,
		req.LaporanKegiatan,
		req.SuratMasuk,
		req.SuratKeluar,
		req.SuratCatat,
		req.AktePerkawinan,
		req.AktePenceraian,
		req.AkteKelahiran,
		req.AkteCatatanPinggiran,
	).Scan(
		&record.ID,
		&record.UserID,
		&record.BulanRekapitulasi,
		&record.TahunRekapitulasi,
		&record.CatatanKegiatan,
		&record.LaporanKegiatan,
		&record.SuratMasuk,
		&record.SuratKeluar,
		&record.SuratCatat,
		&record.AktePerkawinan,
		&record.AktePenceraian,
		&record.AkteKelahiran,
		&record.AkteCatatanPinggiran,
		&record.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		p.logger.WithError(err).Error("Failed to create aktivitas_siak record")
		return nil, err
	}

	record.UpdatedAt = updatedAt
	return &record, nil
}

// GetByID retrieves a single record by ID
func (p *PostgresDatabaseAdapter) GetByID(ctx context.Context, id int) (*AktivitasSiakData, error) {
	query := `
		SELECT id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
			   laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
			   akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
		FROM aktivitas_siak
		WHERE id = $1
	`

	var record AktivitasSiakData
	var updatedAt *time.Time

	err := p.db.QueryRowContext(ctx, query, id).Scan(
		&record.ID,
		&record.UserID,
		&record.BulanRekapitulasi,
		&record.TahunRekapitulasi,
		&record.CatatanKegiatan,
		&record.LaporanKegiatan,
		&record.SuratMasuk,
		&record.SuratKeluar,
		&record.SuratCatat,
		&record.AktePerkawinan,
		&record.AktePenceraian,
		&record.AkteKelahiran,
		&record.AkteCatatanPinggiran,
		&record.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("record not found")
		}
		p.logger.WithError(err).Error("Failed to retrieve aktivitas_siak record by ID")
		return nil, err
	}

	record.UpdatedAt = updatedAt
	return &record, nil
}

// GetByUserAndMonth retrieves a record for a specific user and month
func (p *PostgresDatabaseAdapter) GetByUserAndMonth(ctx context.Context, userID string, bulan, tahun int) (*AktivitasSiakData, error) {
	query := `
		SELECT id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
			   laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
			   akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
		FROM aktivitas_siak
		WHERE user_id = $1 AND bulan_rekapitulasi = $2 AND tahun_rekapitulasi = $3
	`

	var record AktivitasSiakData
	var updatedAt *time.Time

	err := p.db.QueryRowContext(ctx, query, userID, bulan, tahun).Scan(
		&record.ID,
		&record.UserID,
		&record.BulanRekapitulasi,
		&record.TahunRekapitulasi,
		&record.CatatanKegiatan,
		&record.LaporanKegiatan,
		&record.SuratMasuk,
		&record.SuratKeluar,
		&record.SuratCatat,
		&record.AktePerkawinan,
		&record.AktePenceraian,
		&record.AkteKelahiran,
		&record.AkteCatatanPinggiran,
		&record.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("record not found")
		}
		p.logger.WithError(err).Error("Failed to retrieve aktivitas_siak record by user and month")
		return nil, err
	}

	record.UpdatedAt = updatedAt
	return &record, nil
}

// ListByUser retrieves all records for a user with pagination
func (p *PostgresDatabaseAdapter) ListByUser(ctx context.Context, userID string, page, pageSize int) (*AktivitasSiakListResponse, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM aktivitas_siak WHERE user_id = $1`
	var total int
	if err := p.db.QueryRowContext(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, err
	}

	// Get paginated data
	offset := (page - 1) * pageSize
	dataQuery := `
		SELECT id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
			   laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
			   akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
		FROM aktivitas_siak
		WHERE user_id = $1
		ORDER BY tahun_rekapitulasi DESC, bulan_rekapitulasi DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := p.db.QueryContext(ctx, dataQuery, userID, pageSize, offset)
	if err != nil {
		p.logger.WithError(err).Error("Failed to list aktivitas_siak records by user")
		return nil, err
	}
	defer rows.Close()

	var records []AktivitasSiakData
	for rows.Next() {
		var record AktivitasSiakData
		var updatedAt *time.Time

		if err := rows.Scan(
			&record.ID,
			&record.UserID,
			&record.BulanRekapitulasi,
			&record.TahunRekapitulasi,
			&record.CatatanKegiatan,
			&record.LaporanKegiatan,
			&record.SuratMasuk,
			&record.SuratKeluar,
			&record.SuratCatat,
			&record.AktePerkawinan,
			&record.AktePenceraian,
			&record.AkteKelahiran,
			&record.AkteCatatanPinggiran,
			&record.CreatedAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}
		record.UpdatedAt = updatedAt
		records = append(records, record)
	}

	if err = rows.Err(); err != nil {
		return nil, err
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
func (p *PostgresDatabaseAdapter) ListAll(ctx context.Context, page, pageSize int) (*AktivitasSiakListResponse, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM aktivitas_siak`
	var total int
	if err := p.db.QueryRowContext(ctx, countQuery).Scan(&total); err != nil {
		return nil, err
	}

	// Get paginated data
	offset := (page - 1) * pageSize
	dataQuery := `
		SELECT id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
			   laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
			   akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
		FROM aktivitas_siak
		ORDER BY tahun_rekapitulasi DESC, bulan_rekapitulasi DESC, created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := p.db.QueryContext(ctx, dataQuery, pageSize, offset)
	if err != nil {
		p.logger.WithError(err).Error("Failed to list all aktivitas_siak records")
		return nil, err
	}
	defer rows.Close()

	var records []AktivitasSiakData
	for rows.Next() {
		var record AktivitasSiakData
		var updatedAt *time.Time

		if err := rows.Scan(
			&record.ID,
			&record.UserID,
			&record.BulanRekapitulasi,
			&record.TahunRekapitulasi,
			&record.CatatanKegiatan,
			&record.LaporanKegiatan,
			&record.SuratMasuk,
			&record.SuratKeluar,
			&record.SuratCatat,
			&record.AktePerkawinan,
			&record.AktePenceraian,
			&record.AkteKelahiran,
			&record.AkteCatatanPinggiran,
			&record.CreatedAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}
		record.UpdatedAt = updatedAt
		records = append(records, record)
	}

	if err = rows.Err(); err != nil {
		return nil, err
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
func (p *PostgresDatabaseAdapter) Update(ctx context.Context, id int, userID string, req *AktivitasSiakUpdateRequest) (*AktivitasSiakData, error) {
	query := `
		UPDATE aktivitas_siak
		SET catatan_kegiatan = COALESCE($2, catatan_kegiatan),
			laporan_kegiatan = COALESCE($3, laporan_kegiatan),
			surat_masuk = COALESCE($4, surat_masuk),
			surat_keluar = COALESCE($5, surat_keluar),
			surat_catat = COALESCE($6, surat_catat),
			akte_perkawinan = COALESCE($7, akte_perkawinan),
			akte_perceraian = COALESCE($8, akte_perceraian),
			akte_kelahiran = COALESCE($9, akte_kelahiran),
			akte_catatan_pinggiran = COALESCE($10, akte_catatan_pinggiran),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, user_id, bulan_rekapitulasi, tahun_rekapitulasi, catatan_kegiatan,
				  laporan_kegiatan, surat_masuk, surat_keluar, surat_catat, akte_perkawinan,
				  akte_perceraian, akte_kelahiran, akte_catatan_pinggiran, created_at, updated_at
	`

	var record AktivitasSiakData
	var updatedAt *time.Time

	err := p.db.QueryRowContext(ctx, query,
		id,
		req.CatatanKegiatan,
		req.LaporanKegiatan,
		req.SuratMasuk,
		req.SuratKeluar,
		req.SuratCatat,
		req.AktePerkawinan,
		req.AktePenceraian,
		req.AkteKelahiran,
		req.AkteCatatanPinggiran,
	).Scan(
		&record.ID,
		&record.UserID,
		&record.BulanRekapitulasi,
		&record.TahunRekapitulasi,
		&record.CatatanKegiatan,
		&record.LaporanKegiatan,
		&record.SuratMasuk,
		&record.SuratKeluar,
		&record.SuratCatat,
		&record.AktePerkawinan,
		&record.AktePenceraian,
		&record.AkteKelahiran,
		&record.AkteCatatanPinggiran,
		&record.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		p.logger.WithError(err).Error("Failed to update aktivitas_siak record")
		return nil, err
	}

	record.UpdatedAt = updatedAt
	return &record, nil
}

// Delete removes a record
func (p *PostgresDatabaseAdapter) Delete(ctx context.Context, id int, userID string) error {
	result, err := p.db.ExecContext(ctx, `DELETE FROM aktivitas_siak WHERE id = $1`, id)
	if err != nil {
		p.logger.WithError(err).Error("Failed to delete aktivitas_siak record")
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("record not found")
	}

	return nil
}

// CheckDuplicate checks if a record exists for the user, month, and year
func (p *PostgresDatabaseAdapter) CheckDuplicate(ctx context.Context, userID string, bulan, tahun int) (exists bool, id *int, err error) {
	query := `
		SELECT id FROM aktivitas_siak
		WHERE user_id = $1 AND bulan_rekapitulasi = $2 AND tahun_rekapitulasi = $3
		LIMIT 1
	`

	var recordID int
	err = p.db.QueryRowContext(ctx, query, userID, bulan, tahun).Scan(&recordID)

	if err == sql.ErrNoRows {
		return false, nil, nil
	}

	if err != nil {
		p.logger.WithError(err).Error("Failed to check for duplicate aktivitas_siak record")
		return false, nil, err
	}

	return true, &recordID, nil
}

// GetStatistics retrieves statistics for a user
func (p *PostgresDatabaseAdapter) GetStatistics(ctx context.Context, userID string) (*Statistics, error) {
	query := `
		SELECT
			COUNT(*) as total_records,
			AVG(COALESCE(surat_masuk, 0))::FLOAT as avg_surat_masuk,
			AVG(COALESCE(surat_keluar, 0))::FLOAT as avg_surat_keluar,
			AVG(COALESCE(surat_catat, 0))::FLOAT as avg_surat_catat,
			AVG(COALESCE(akte_perkawinan, 0))::FLOAT as avg_akte_perkawinan,
			AVG(COALESCE(akte_perceraian, 0))::FLOAT as avg_akte_perceraian,
			AVG(COALESCE(akte_kelahiran, 0))::FLOAT as avg_akte_kelahiran,
			MAX(COALESCE(surat_masuk, 0)) as highest_surat_masuk,
			MAX(COALESCE(akte_kelahiran, 0)) as highest_akte_kelahiran,
			MAX(updated_at) FILTER (WHERE updated_at IS NOT NULL) as last_update
		FROM aktivitas_siak
		WHERE user_id = $1
	`

	stats := &Statistics{}
	var lastUpdate *time.Time

	err := p.db.QueryRowContext(ctx, query, userID).Scan(
		&stats.TotalRecords,
		&stats.AverageSuratMasuk,
		&stats.AverageSuratKeluar,
		&stats.AverageSuratCatat,
		&stats.AverageAktePerkawinan,
		&stats.AverageAktePenceraian,
		&stats.AverageAkteKelahiran,
		&stats.HighestSuratMasuk,
		&stats.HighestAkteKelahiran,
		&lastUpdate,
	)

	if err != nil {
		p.logger.WithError(err).Error("Failed to get aktivitas_siak statistics")
		return nil, err
	}

	if lastUpdate != nil {
		stats.LastUpdateTime = *lastUpdate
	}

	return stats, nil
}

// GetAdminStatistics retrieves statistics for all records (admin only)
func (p *PostgresDatabaseAdapter) GetAdminStatistics(ctx context.Context) (*Statistics, error) {
	query := `
		SELECT
			COUNT(*) as total_records,
			AVG(COALESCE(surat_masuk, 0))::FLOAT as avg_surat_masuk,
			AVG(COALESCE(surat_keluar, 0))::FLOAT as avg_surat_keluar,
			AVG(COALESCE(surat_catat, 0))::FLOAT as avg_surat_catat,
			AVG(COALESCE(akte_perkawinan, 0))::FLOAT as avg_akte_perkawinan,
			AVG(COALESCE(akte_perceraian, 0))::FLOAT as avg_akte_perceraian,
			AVG(COALESCE(akte_kelahiran, 0))::FLOAT as avg_akte_kelahiran,
			MAX(COALESCE(surat_masuk, 0)) as highest_surat_masuk,
			MAX(COALESCE(akte_kelahiran, 0)) as highest_akte_kelahiran,
			MAX(updated_at) as last_update
		FROM aktivitas_siak
	`

	stats := &Statistics{}
	var lastUpdate *time.Time

	err := p.db.QueryRowContext(ctx, query).Scan(
		&stats.TotalRecords,
		&stats.AverageSuratMasuk,
		&stats.AverageSuratKeluar,
		&stats.AverageSuratCatat,
		&stats.AverageAktePerkawinan,
		&stats.AverageAktePenceraian,
		&stats.AverageAkteKelahiran,
		&stats.HighestSuratMasuk,
		&stats.HighestAkteKelahiran,
		&lastUpdate,
	)

	if err != nil {
		p.logger.WithError(err).Error("Failed to get admin aktivitas_siak statistics")
		return nil, err
	}

	if lastUpdate != nil {
		stats.LastUpdateTime = *lastUpdate
	}

	return stats, nil
}
