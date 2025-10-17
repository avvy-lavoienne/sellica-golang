package aktivitas_siak

import (
	"time"
)

// AktivitasSiakData represents the complete database record for aktivitas_siak table
// Schema matches actual Supabase table: id (uuid), user_id (uuid), 9 TEXT fields, bulan_rekapitulasi (text), created_at
type AktivitasSiakData struct {
	ID                           string     `json:"id" db:"id"`                                         // UUID primary key
	UserID                       string     `json:"user_id" db:"user_id"`                               // UUID foreign key to profiles
	TotalAktivitasIndividu       string     `json:"total_aktivitas_individu" db:"total_aktivitas_individu"`
	TotalAktivitasKeseluruhan    string     `json:"total_aktivitas_keseluruhan" db:"total_aktivitas_keseluruhan"`
	FixAномaliData               string     `json:"fix_anomali_data" db:"fix_anomali_data"`
	RestoreDataMaintenance       string     `json:"restore_data_maintenance" db:"restore_data_maintenance"`
	RestoreDataKTP               string     `json:"restore_data_ktp" db:"restore_data_ktp"`
	DaftarDuplikasi              string     `json:"daftar_duplikasi" db:"daftar_duplikasi"`
	LoginUser                    string     `json:"login_user" db:"login_user"`
	LogoutUser                   string     `json:"logout_user" db:"logout_user"`
	MutasiElemenData             string     `json:"mutasi_elemen_data" db:"mutasi_elemen_data"`
	BulanRekapitulasi            string     `json:"bulan_rekapitulasi" db:"bulan_rekapitulasi"`         // TEXT field (e.g., "Oktober 2025")
	CreatedAt                    time.Time  `json:"created_at" db:"created_at"`
}

// AktivitasSiakCreateRequest represents the input for creating a new aktivitas_siak record
// All fields match the actual database TEXT columns
type AktivitasSiakCreateRequest struct {
	TotalAktivitasIndividu       string  `json:"total_aktivitas_individu" binding:"omitempty,max=500"`
	TotalAktivitasKeseluruhan    string  `json:"total_aktivitas_keseluruhan" binding:"omitempty,max=500"`
	FixAномaliData               string  `json:"fix_anomali_data" binding:"omitempty,max=500"`
	RestoreDataMaintenance       string  `json:"restore_data_maintenance" binding:"omitempty,max=500"`
	RestoreDataKTP               string  `json:"restore_data_ktp" binding:"omitempty,max=500"`
	DaftarDuplikasi              string  `json:"daftar_duplikasi" binding:"omitempty,max=500"`
	LoginUser                    string  `json:"login_user" binding:"omitempty,max=500"`
	LogoutUser                   string  `json:"logout_user" binding:"omitempty,max=500"`
	MutasiElemenData             string  `json:"mutasi_elemen_data" binding:"omitempty,max=500"`
	BulanRekapitulasi            string  `json:"bulan_rekapitulasi" binding:"required,max=100"` // Required: e.g., "Oktober 2025"
}

// AktivitasSiakUpdateRequest represents the input for updating an aktivitas_siak record
// All fields are optional for partial updates
type AktivitasSiakUpdateRequest struct {
	TotalAktivitasIndividu       *string `json:"total_aktivitas_individu,omitempty" binding:"omitempty,max=500"`
	TotalAktivitasKeseluruhan    *string `json:"total_aktivitas_keseluruhan,omitempty" binding:"omitempty,max=500"`
	FixAномaliData               *string `json:"fix_anomali_data,omitempty" binding:"omitempty,max=500"`
	RestoreDataMaintenance       *string `json:"restore_data_maintenance,omitempty" binding:"omitempty,max=500"`
	RestoreDataKTP               *string `json:"restore_data_ktp,omitempty" binding:"omitempty,max=500"`
	DaftarDuplikasi              *string `json:"daftar_duplikasi,omitempty" binding:"omitempty,max=500"`
	LoginUser                    *string `json:"login_user,omitempty" binding:"omitempty,max=500"`
	LogoutUser                   *string `json:"logout_user,omitempty" binding:"omitempty,max=500"`
	MutasiElemenData             *string `json:"mutasi_elemen_data,omitempty" binding:"omitempty,max=500"`
	BulanRekapitulasi            *string `json:"bulan_rekapitulasi,omitempty" binding:"omitempty,max=100"`
}

// AktivitasSiakListResponse represents paginated list response
type AktivitasSiakListResponse struct {
	Data       []AktivitasSiakData `json:"data"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
}

// DuplicateCheckRequest represents a request to check for duplicate monthly records
// Uses string-based month identifier instead of integer month/year
type DuplicateCheckRequest struct {
	BulanRekapitulasi string `json:"bulan_rekapitulasi" binding:"required,max=100"` // e.g., "Oktober 2025"
}

// DuplicateCheckResponse indicates if a duplicate record exists
type DuplicateCheckResponse struct {
	Exists bool    `json:"exists"`
	ID     *string `json:"id,omitempty"` // UUID of existing record if it exists
}

// ValidationResult holds validation errors
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors map[string]string `json:"errors,omitempty"`
}

// Statistics represents summary statistics for aktivitas records
// Simplified for TEXT-based fields (no numeric aggregation)
type Statistics struct {
	TotalRecords     int       `json:"total_records"`
	UniqueMonths     int       `json:"unique_months"`      // Number of unique month entries
	LastEntryTime    time.Time `json:"last_entry_time"`    // Most recent created_at
	OldestEntryTime  time.Time `json:"oldest_entry_time"`  // Oldest created_at
	RecordsThisMonth int       `json:"records_this_month"` // Records for current month
}
