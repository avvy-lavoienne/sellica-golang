package database

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// Data-Rekam Query Models

type AdjudicateRecordRow struct {
	ID                       string    `json:"id" db:"id"`
	NikAdjudicate            string    `json:"nik_adjudicate" db:"nik_adjudicate"`
	NamaAdjudicate           string    `json:"nama_adjudicate" db:"nama_adjudicate"`
	NikPengaju               string    `json:"nik_pengaju" db:"nik_pengaju"`
	NamaPengaju              string    `json:"nama_pengaju" db:"nama_pengaju"`
	JenisEksepsi             string    `json:"jenis_eksepsi" db:"jenis_eksepsi"`
	TanggalPengajuan         string    `json:"tanggal_pengajuan" db:"tanggal_pengajuan"`
	EstimasiTanggalPerekaman string    `json:"estimasi_tanggal_perekaman" db:"estimasi_tanggal_perekaman"`
	IsReadyToRecord          bool      `json:"is_ready_to_record" db:"is_ready_to_record"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
}

type DuplicateOperatorRow struct {
	ID               string    `json:"id" db:"id"`
	NikDuplicate     string    `json:"nik_duplicate" db:"nik_duplicate"`
	NamaDuplicate    string    `json:"nama_duplicate" db:"nama_duplicate"`
	NikOperator      string    `json:"nik_operator" db:"nik_operator"`
	NamaOperator     string    `json:"nama_operator" db:"nama_operator"`
	NikPengaju       string    `json:"nik_pengaju" db:"nik_pengaju"`
	NamaPengaju      string    `json:"nama_pengaju" db:"nama_pengaju"`
	TanggalPerekaman string    `json:"tanggal_perekaman" db:"tanggal_perekaman"`
	IsReadyToRecord  bool      `json:"is_ready_to_record" db:"is_ready_to_record"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

type PengajuanBulananRow struct {
	ID                       string    `json:"id" db:"id"`
	NikPengajuanHapus        string    `json:"nik_pengajuan_hapus" db:"nik_pengajuan_hapus"`
	NamaPengajuan            string    `json:"nama_pengajuan" db:"nama_pengajuan"`
	AlasanPengajuan          string    `json:"alasan_pengajuan" db:"alasan_pengajuan"`
	NikPengaju               string    `json:"nik_pengaju" db:"nik_pengaju"`
	NamaPengaju              string    `json:"nama_pengaju" db:"nama_pengaju"`
	TanggalPengajuan         string    `json:"tanggal_pengajuan" db:"tanggal_pengajuan"`
	EstimasiTanggalPerekaman string    `json:"estimasi_tanggal_perekaman" db:"estimasi_tanggal_perekaman"`
	IsReadyToRecord          bool      `json:"is_ready_to_record" db:"is_ready_to_record"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
}

type SalahRekamRow struct {
	ID                   string    `json:"id" db:"id"`
	NikSalahRekam        string    `json:"nik_salah_rekam" db:"nik_salah_rekam"`
	NamaSalahRekam       string    `json:"nama_salah_rekam" db:"nama_salah_rekam"`
	NikPemilikBiometric  string    `json:"nik_pemilik_biometric" db:"nik_pemilik_biometric"`
	NamaPemilikBiometric string    `json:"nama_pemilik_biometric" db:"nama_pemilik_biometric"`
	NikPemilikFoto       string    `json:"nik_pemilik_foto" db:"nik_pemilik_foto"`
	NamaPemilikFoto      string    `json:"nama_pemilik_foto" db:"nama_pemilik_foto"`
	NikPetugasRekam      string    `json:"nik_petugas_rekam" db:"nik_petugas_rekam"`
	NamaPetugasRekam     string    `json:"nama_petugas_rekam" db:"nama_petugas_rekam"`
	NikPengaju           string    `json:"nik_pengaju" db:"nik_pengaju"`
	NamaPengaju          string    `json:"nama_pengaju" db:"nama_pengaju"`
	IsReadyToRecord      bool      `json:"is_ready_to_record" db:"is_ready_to_record"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
}

// DataRekamFilter for queries with authorization and filtering
type DataRekamFilter struct {
	Page         int
	PageSize     int
	StatusFilter string  // "all", "completed", "pending"
	SearchQuery  string  // text search
	StartDate    *string // optional date filter
	EndDate      *string
	UserNik      string // for user-owned data filtering
	IsAdmin      bool   // if true, show all; if false, show only user records
}

// QueryResult for paginated query responses
type QueryResult struct {
	Data       interface{} `json:"data"`
	TotalCount int         `json:"total_count"`
}

// GetAdjudicateRecordList retrieves adjudicate record list with authorization
func (s *Service) GetAdjudicateRecordList(ctx context.Context, filter DataRekamFilter) (QueryResult, error) {
	if !s.isHealthy {
		return QueryResult{}, ErrDatabaseNotHealthy
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Build base query with explicit field selection (exclude sensitive fields)
	queryBuilder := s.client.From("adjudicate_record").
		Select(
			"id,nik_adjudicate,nama_adjudicate,nik_pengaju,nama_pengaju,"+
				"jenis_eksepsi,tanggal_pengajuan,estimasi_tanggal_perekaman,"+
				"is_ready_to_record,created_at",
			"",
			false,
		)

	// Apply authorization filter (user-owned data only, unless admin)
	if !filter.IsAdmin {
		queryBuilder = queryBuilder.Eq("nik_pengaju", filter.UserNik)
	}

	// Apply status filter
	if filter.StatusFilter == "completed" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "true")
	} else if filter.StatusFilter == "pending" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "false")
	}

	// Apply search filter (only alphanumeric + spaces)
	if filter.SearchQuery != "" && isValidSearchString(filter.SearchQuery) {
		queryBuilder = queryBuilder.Or(
			fmt.Sprintf(
				"nik_adjudicate.ilike.%%%s%%,nama_adjudicate.ilike.%%%s%%",
				filter.SearchQuery,
				filter.SearchQuery,
			),
			"",
		)
	}

	// Apply date filters
	if filter.StartDate != nil {
		queryBuilder = queryBuilder.Gte("created_at", *filter.StartDate)
	}
	if filter.EndDate != nil {
		queryBuilder = queryBuilder.Lte("created_at", *filter.EndDate)
	}

	// Order and paginate
	queryBuilder = queryBuilder.Order("created_at", nil).Range(offset, offset+filter.PageSize-1, "")

	data, count, err := queryBuilder.Execute()
	if err != nil {
		logrus.WithError(err).Error("Failed to get adjudicate record list")
		return QueryResult{}, err
	}

	var records []AdjudicateRecordRow
	if err := json.Unmarshal(data, &records); err != nil {
		logrus.WithError(err).Error("Failed to unmarshal adjudicate record data")
		return QueryResult{}, err
	}

	logrus.WithFields(logrus.Fields{
		"count":    len(records),
		"total":    count,
		"page":     filter.Page,
		"is_admin": filter.IsAdmin,
	}).Debug("Retrieved adjudicate record list")

	return QueryResult{
		Data:       records,
		TotalCount: int(count),
	}, nil
}

// GetDuplicateOperatorList retrieves duplicate operator list with authorization
func (s *Service) GetDuplicateOperatorList(ctx context.Context, filter DataRekamFilter) (QueryResult, error) {
	if !s.isHealthy {
		return QueryResult{}, ErrDatabaseNotHealthy
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Build base query with explicit field selection
	queryBuilder := s.client.From("duplicate_operator").
		Select(
			"id,nik_duplicate,nama_duplicate,nik_operator,nama_operator,"+
				"nik_pengaju,nama_pengaju,tanggal_perekaman,"+
				"is_ready_to_record,created_at",
			"",
			false,
		)

	// Apply authorization filter
	if !filter.IsAdmin {
		queryBuilder = queryBuilder.Eq("nik_pengaju", filter.UserNik)
	}

	// Apply status filter
	if filter.StatusFilter == "completed" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "true")
	} else if filter.StatusFilter == "pending" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "false")
	}

	// Apply search filter
	if filter.SearchQuery != "" && isValidSearchString(filter.SearchQuery) {
		queryBuilder = queryBuilder.Or(
			fmt.Sprintf(
				"nik_duplicate.ilike.%%%s%%,nama_duplicate.ilike.%%%s%%,"+
					"nik_operator.ilike.%%%s%%,nama_operator.ilike.%%%s%%",
				filter.SearchQuery,
				filter.SearchQuery,
				filter.SearchQuery,
				filter.SearchQuery,
			),
			"",
		)
	}

	// Apply date filters
	if filter.StartDate != nil {
		queryBuilder = queryBuilder.Gte("created_at", *filter.StartDate)
	}
	if filter.EndDate != nil {
		queryBuilder = queryBuilder.Lte("created_at", *filter.EndDate)
	}

	// Order and paginate
	queryBuilder = queryBuilder.Order("created_at", nil).Range(offset, offset+filter.PageSize-1, "")

	data, count, err := queryBuilder.Execute()
	if err != nil {
		logrus.WithError(err).Error("Failed to get duplicate operator list")
		return QueryResult{}, err
	}

	var records []DuplicateOperatorRow
	if err := json.Unmarshal(data, &records); err != nil {
		logrus.WithError(err).Error("Failed to unmarshal duplicate operator data")
		return QueryResult{}, err
	}

	logrus.WithFields(logrus.Fields{
		"count":    len(records),
		"total":    count,
		"is_admin": filter.IsAdmin,
	}).Debug("Retrieved duplicate operator list")

	return QueryResult{
		Data:       records,
		TotalCount: int(count),
	}, nil
}

// GetPengajuanBulananList retrieves pengajuan bulanan list with authorization
func (s *Service) GetPengajuanBulananList(ctx context.Context, filter DataRekamFilter) (QueryResult, error) {
	if !s.isHealthy {
		return QueryResult{}, ErrDatabaseNotHealthy
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Build base query with explicit field selection
	queryBuilder := s.client.From("pengajuan_bulanan").
		Select(
			"id,nik_pengajuan_hapus,nama_pengajuan,alasan_pengajuan,"+
				"nik_pengaju,nama_pengaju,tanggal_pengajuan,estimasi_tanggal_perekaman,"+
				"is_ready_to_record,created_at",
			"",
			false,
		)

	// Apply authorization filter
	if !filter.IsAdmin {
		queryBuilder = queryBuilder.Eq("nik_pengaju", filter.UserNik)
	}

	// Apply status filter
	if filter.StatusFilter == "completed" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "true")
	} else if filter.StatusFilter == "pending" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "false")
	}

	// Apply search filter
	if filter.SearchQuery != "" && isValidSearchString(filter.SearchQuery) {
		queryBuilder = queryBuilder.Or(
			fmt.Sprintf(
				"nik_pengajuan_hapus.ilike.%%%s%%,nama_pengajuan.ilike.%%%s%%",
				filter.SearchQuery,
				filter.SearchQuery,
			),
			"",
		)
	}

	// Apply date filters
	if filter.StartDate != nil {
		queryBuilder = queryBuilder.Gte("created_at", *filter.StartDate)
	}
	if filter.EndDate != nil {
		queryBuilder = queryBuilder.Lte("created_at", *filter.EndDate)
	}

	// Order and paginate
	queryBuilder = queryBuilder.Order("created_at", nil).Range(offset, offset+filter.PageSize-1, "")

	data, count, err := queryBuilder.Execute()
	if err != nil {
		logrus.WithError(err).Error("Failed to get pengajuan bulanan list")
		return QueryResult{}, err
	}

	var records []PengajuanBulananRow
	if err := json.Unmarshal(data, &records); err != nil {
		logrus.WithError(err).Error("Failed to unmarshal pengajuan bulanan data")
		return QueryResult{}, err
	}

	logrus.WithFields(logrus.Fields{
		"count":    len(records),
		"total":    count,
		"is_admin": filter.IsAdmin,
	}).Debug("Retrieved pengajuan bulanan list")

	return QueryResult{
		Data:       records,
		TotalCount: int(count),
	}, nil
}

// GetSalahRekamList retrieves salah rekam list with authorization
func (s *Service) GetSalahRekamList(ctx context.Context, filter DataRekamFilter) (QueryResult, error) {
	if !s.isHealthy {
		return QueryResult{}, ErrDatabaseNotHealthy
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Build base query with explicit field selection
	queryBuilder := s.client.From("salah_rekam").
		Select(
			"id,nik_salah_rekam,nama_salah_rekam,"+
				"nik_pemilik_biometric,nama_pemilik_biometric,"+
				"nik_pemilik_foto,nama_pemilik_foto,"+
				"nik_petugas_rekam,nama_petugas_rekam,"+
				"nik_pengaju,nama_pengaju,"+
				"is_ready_to_record,created_at",
			"",
			false,
		)

	// Apply authorization filter
	if !filter.IsAdmin {
		queryBuilder = queryBuilder.Eq("nik_pengaju", filter.UserNik)
	}

	// Apply status filter
	if filter.StatusFilter == "completed" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "true")
	} else if filter.StatusFilter == "pending" {
		queryBuilder = queryBuilder.Eq("is_ready_to_record", "false")
	}

	// Apply search filter
	if filter.SearchQuery != "" && isValidSearchString(filter.SearchQuery) {
		queryBuilder = queryBuilder.Or(
			fmt.Sprintf(
				"nik_salah_rekam.ilike.%%%s%%,nama_salah_rekam.ilike.%%%s%%,"+
					"nik_pemilik_biometric.ilike.%%%s%%,nama_pemilik_biometric.ilike.%%%s%%",
				filter.SearchQuery,
				filter.SearchQuery,
				filter.SearchQuery,
				filter.SearchQuery,
			),
			"",
		)
	}

	// Apply date filters
	if filter.StartDate != nil {
		queryBuilder = queryBuilder.Gte("created_at", *filter.StartDate)
	}
	if filter.EndDate != nil {
		queryBuilder = queryBuilder.Lte("created_at", *filter.EndDate)
	}

	// Order and paginate
	queryBuilder = queryBuilder.Order("created_at", nil).Range(offset, offset+filter.PageSize-1, "")

	data, count, err := queryBuilder.Execute()
	if err != nil {
		logrus.WithError(err).Error("Failed to get salah rekam list")
		return QueryResult{}, err
	}

	var records []SalahRekamRow
	if err := json.Unmarshal(data, &records); err != nil {
		logrus.WithError(err).Error("Failed to unmarshal salah rekam data")
		return QueryResult{}, err
	}

	logrus.WithFields(logrus.Fields{
		"count":    len(records),
		"total":    count,
		"is_admin": filter.IsAdmin,
	}).Debug("Retrieved salah rekam list")

	return QueryResult{
		Data:       records,
		TotalCount: int(count),
	}, nil
}

// GetMonthlyBreakdown returns monthly aggregated count across all data-rekam tables combined
func (s *Service) GetMonthlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Define which date column to use for each table
	tables := []struct {
		name    string // Table name
		dateCol string // Date column to query
	}{
		{"adjudicate_record", "tanggal_pengajuan"},
		{"duplicate_operator", "tanggal_pengajuan"},
		{"salah_rekam", "created_at"},
		{"pengajuan_bulanan", "tanggal_pengajuan"},
	}

	monthlyStats := make(map[string]int) // Key: "YYYY-MM", Value: count

	for _, tableInfo := range tables {
		// SELECT the correct date column for each table
		query := s.client.From(tableInfo.name).Select(tableInfo.dateCol, "exact", false)

		if startDate != nil {
			query = query.Gte(tableInfo.dateCol, *startDate)
		}
		if endDate != nil {
			query = query.Lte(tableInfo.dateCol, *endDate)
		}

		data, _, err := query.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to get monthly breakdown")
			continue
		}

		// Unmarshal raw JSON data
		var records []map[string]interface{}
		if err := json.Unmarshal(data, &records); err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to unmarshal monthly breakdown data")
			continue
		}

		// Process records to extract dates using the appropriate column for this table
		for _, record := range records {
			if dateStr, ok := record[tableInfo.dateCol].(string); ok {
				// Parse date with multiple fallback formats to handle both:
				// - DATE columns: "2024-03-15"
				// - TIMESTAMP columns: "2024-03-15T10:30:45+07:00" or "2024-03-15T10:30:45.123456Z"
				var parsedTime time.Time
				var err error
				
				// Format 1: Try RFC3339Nano first (timestamps with nanoseconds)
				parsedTime, err = time.Parse(time.RFC3339Nano, dateStr)
				if err != nil {
					// Format 2: RFC3339 format (timestamps without nanoseconds)
					parsedTime, err = time.Parse(time.RFC3339, dateStr)
					if err != nil {
						// Format 3: ISO8601 with timezone offset
						parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", dateStr)
						if err != nil {
							// Format 4: Simple date format (DATE columns like tanggal_pengajuan)
							parsedTime, err = time.Parse("2006-01-02", dateStr)
							if err != nil {
								logrus.WithError(err).WithField("table", tableInfo.name).WithField("dateCol", tableInfo.dateCol).WithField("dateValue", dateStr).Debug("Failed to parse date in any format, skipping record")
								continue
							}
						}
					}
				}
				
				// Extract year-month using time.Time methods (YYYY-MM format)
				yearMonth := parsedTime.Format("2006-01")
				monthlyStats[yearMonth]++
			}
		}
	}

	// Convert map to sorted slice
	var result []map[string]interface{}
	var keys []string
	for k := range monthlyStats {
		keys = append(keys, k)
	}
	
	// Sort keys (naturally sorted as YYYY-MM format)
	for i := 0; i < len(keys)-1; i++ {
		for j := i + 1; j < len(keys); j++ {
			if keys[j] < keys[i] {
				keys[i], keys[j] = keys[j], keys[i]
			}
		}
	}

	for _, yearMonth := range keys {
		// Parse YYYY-MM format using strings.Split (more reliable than manual parsing)
		parts := strings.Split(yearMonth, "-")
		year := 0
		month := 0
		if len(parts) >= 2 {
			fmt.Sscanf(parts[0], "%d", &year)
			fmt.Sscanf(parts[1], "%d", &month)
		}

		result = append(result, map[string]interface{}{
			"year":  year,
			"month": month,
			"count": monthlyStats[yearMonth],
		})
	}

	return result, nil
}

// GetYearlyBreakdown returns yearly aggregated count across all data-rekam tables combined
func (s *Service) GetYearlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Define which date column to use for each table
	tables := []struct {
		name    string // Table name
		dateCol string // Date column to query
	}{
		{"adjudicate_record", "tanggal_pengajuan"},
		{"duplicate_operator", "tanggal_pengajuan"},
		{"salah_rekam", "created_at"},
		{"pengajuan_bulanan", "tanggal_pengajuan"},
	}

	// Track yearly stats per table: map[year]map[tableName]count
	yearlyStatsByTable := make(map[int]map[string]int)

	for _, tableInfo := range tables {
		// SELECT the correct date column for each table
		query := s.client.From(tableInfo.name).Select(tableInfo.dateCol, "exact", false)

		if startDate != nil {
			query = query.Gte(tableInfo.dateCol, *startDate)
		}
		if endDate != nil {
			query = query.Lte(tableInfo.dateCol, *endDate)
		}

		data, _, err := query.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to get yearly breakdown")
			continue
		}

		// Unmarshal raw JSON data
		var records []map[string]interface{}
		if err := json.Unmarshal(data, &records); err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to unmarshal yearly breakdown data")
			continue
		}

		// Process records to extract dates using the appropriate column for this table
		for _, record := range records {
			if dateStr, ok := record[tableInfo.dateCol].(string); ok {
				// Parse date with multiple fallback formats to handle both:
				// - DATE columns: "2024-03-15"
				// - TIMESTAMP columns: "2024-03-15T10:30:45+07:00" or "2024-03-15T10:30:45.123456Z"
				var parsedTime time.Time
				var err error
				
				// Format 1: Try RFC3339Nano first (timestamps with nanoseconds)
				parsedTime, err = time.Parse(time.RFC3339Nano, dateStr)
				if err != nil {
					// Format 2: RFC3339 format (timestamps without nanoseconds)
					parsedTime, err = time.Parse(time.RFC3339, dateStr)
					if err != nil {
						// Format 3: ISO8601 with timezone offset
						parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", dateStr)
						if err != nil {
							// Format 4: Simple date format (DATE columns like tanggal_pengajuan)
							parsedTime, err = time.Parse("2006-01-02", dateStr)
							if err != nil {
								logrus.WithError(err).WithField("table", tableInfo.name).WithField("dateCol", tableInfo.dateCol).WithField("dateValue", dateStr).Debug("Failed to parse date in any format, skipping record")
								continue
							}
						}
					}
				}
				
				// Extract year using time.Time method
				year := parsedTime.Year()
				
				// Initialize year map if needed
				if yearlyStatsByTable[year] == nil {
					yearlyStatsByTable[year] = make(map[string]int)
				}
				
				// Increment count for this table in this year
				yearlyStatsByTable[year][tableInfo.name]++
			}
		}
	}

	// Convert map to sorted slice with per-table breakdown
	var result []map[string]interface{}
	var years []int
	for y := range yearlyStatsByTable {
		years = append(years, y)
	}

	// Sort years numerically
	for i := 0; i < len(years)-1; i++ {
		for j := i + 1; j < len(years); j++ {
			if years[j] < years[i] {
				years[i], years[j] = years[j], years[i]
			}
		}
	}

	for _, year := range years {
		result = append(result, map[string]interface{}{
			"year":               year,
			"adjudicate_record":  yearlyStatsByTable[year]["adjudicate_record"],
			"duplicate_operator": yearlyStatsByTable[year]["duplicate_operator"],
			"salah_rekam":        yearlyStatsByTable[year]["salah_rekam"],
			"pengajuan_bulanan":  yearlyStatsByTable[year]["pengajuan_bulanan"],
		})
	}

	return result, nil
}// GetDashboardStats retrieves aggregated statistics for all data-rekam tables
func (s *Service) GetDashboardStats(ctx context.Context, startDate, endDate *string) (map[string]interface{}, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	tables := []struct {
		tableName    string
		countKey     string
		completedKey string
	}{
		{"adjudicate_record", "adjudicate_count", "adjudicate_completed"},
		{"duplicate_operator", "duplicate_operator_count", "duplicate_operator_completed"},
		{"salah_rekam", "salah_rekam_count", "salah_rekam_completed"},
		{"pengajuan_bulanan", "pengajuan_bulanan_count", "pengajuan_bulanan_completed"},
	}

	stats := make(map[string]interface{})

	for _, tableInfo := range tables {
		logrus.WithField("table", tableInfo.tableName).Debug("Querying dashboard stats")

		// Get total count - use Select with count=exact to get accurate count
		totalQuery := s.client.From(tableInfo.tableName).Select("id", "exact", true)

		if startDate != nil {
			totalQuery = totalQuery.Gte("created_at", *startDate)
		}
		if endDate != nil {
			totalQuery = totalQuery.Lte("created_at", *endDate)
		}

		_, totalCount, err := totalQuery.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.tableName).Error("Failed to get total count")
			totalCount = 0
		}
		logrus.WithFields(logrus.Fields{
			"table": tableInfo.tableName,
			"total": totalCount,
		}).Debug("Retrieved total count")

		// Get completed count - filter by is_ready_to_record = true
		completedQuery := s.client.From(tableInfo.tableName).
			Select("id", "exact", true).
			Eq("is_ready_to_record", "true")

		if startDate != nil {
			completedQuery = completedQuery.Gte("created_at", *startDate)
		}
		if endDate != nil {
			completedQuery = completedQuery.Lte("created_at", *endDate)
		}

		_, completedCount, err := completedQuery.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.tableName).Error("Failed to get completed count")
			completedCount = 0
		}
		logrus.WithFields(logrus.Fields{
			"table":     tableInfo.tableName,
			"completed": completedCount,
		}).Debug("Retrieved completed count")

		// Set stats with the expected key names for frontend
		stats[tableInfo.countKey] = int(totalCount)
		stats[tableInfo.completedKey] = int(completedCount)
	}

	// Get time-series aggregation data for chart
	monthlyData, err := s.GetMonthlyBreakdown(ctx, startDate, endDate)
	if err != nil {
		logrus.WithError(err).Warn("Failed to get monthly breakdown, continuing without it")
		monthlyData = []map[string]interface{}{}
	}

	yearlyData, err := s.GetYearlyBreakdown(ctx, startDate, endDate)
	if err != nil {
		logrus.WithError(err).Warn("Failed to get yearly breakdown, continuing without it")
		yearlyData = []map[string]interface{}{}
	}

	// Add time-series data to response
	stats["MonthlyData"] = monthlyData
	stats["YearlyData"] = yearlyData

	logrus.WithField("stats", stats).Debug("Retrieved dashboard statistics")
	return stats, nil
}

// Helper function to validate search strings
func isValidSearchString(s string) bool {
	if len(s) == 0 || len(s) > 255 {
		return false
	}

	// Allow only alphanumeric, spaces, hyphens, and underscores
	for _, r := range s {
		if !((r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == ' ' || r == '-' || r == '_') {
			return false
		}
	}
	return true
}
