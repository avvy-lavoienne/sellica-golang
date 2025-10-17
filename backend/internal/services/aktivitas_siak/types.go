package aktivitas_siak

import (
	"time"
)

// AktivitasSiakData represents the complete database record for aktivitas_siak
type AktivitasSiakData struct {
	ID                    int       `json:"id" db:"id"`
	UserID                string    `json:"user_id" db:"user_id"`
	BulanRekapitulasi     int       `json:"bulan_rekapitulasi" db:"bulan_rekapitulasi"` // 1-12, month number
	TahunRekapitulasi     int       `json:"tahun_rekapitulasi" db:"tahun_rekapitulasi"` // YYYY year
	CatatanKegiatan       string    `json:"catatan_kegiatan" db:"catatan_kegiatan"`
	LaporanKegiatan       string    `json:"laporan_kegiatan" db:"laporan_kegiatan"`
	SuratMasuk            int       `json:"surat_masuk" db:"surat_masuk"`              // number of incoming letters
	SuratKeluar           int       `json:"surat_keluar" db:"surat_keluar"`            // number of outgoing letters
	SuratCatat            int       `json:"surat_catat" db:"surat_catat"`              // number of registered letters
	AktePerkawinan        int       `json:"akte_perkawinan" db:"akte_perkawinan"`      // marriage certificates
	AktePenceraian        int       `json:"akte_perceraian" db:"akte_perceraian"`      // divorce certificates
	AkteKelahiran         int       `json:"akte_kelahiran" db:"akte_kelahiran"`        // birth certificates
	AkteCatatanPinggiran  int       `json:"akte_catatan_pinggiran" db:"akte_catatan_pinggiran"` // marginal note certificates
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
	UpdatedAt             *time.Time `json:"updated_at,omitempty" db:"updated_at"` // null if never updated
}

// AktivitasSiakCreateRequest represents the input for creating a new aktivitas_siak record
type AktivitasSiakCreateRequest struct {
	BulanRekapitulasi    int     `json:"bulan_rekapitulasi" binding:"required,min=1,max=12"`
	TahunRekapitulasi    int     `json:"tahun_rekapitulasi" binding:"required,min=2000"`
	CatatanKegiatan      string  `json:"catatan_kegiatan" binding:"required,max=1000"`
	LaporanKegiatan      string  `json:"laporan_kegiatan" binding:"required,max=1000"`
	SuratMasuk           *int    `json:"surat_masuk,omitempty" binding:"min=0"`
	SuratKeluar          *int    `json:"surat_keluar,omitempty" binding:"min=0"`
	SuratCatat           *int    `json:"surat_catat,omitempty" binding:"min=0"`
	AktePerkawinan       *int    `json:"akte_perkawinan,omitempty" binding:"min=0"`
	AktePenceraian       *int    `json:"akte_perceraian,omitempty" binding:"min=0"`
	AkteKelahiran        *int    `json:"akte_kelahiran,omitempty" binding:"min=0"`
	AkteCatatanPinggiran *int    `json:"akte_catatan_pinggiran,omitempty" binding:"min=0"`
}

// AktivitasSiakUpdateRequest represents the input for updating an aktivitas_siak record
type AktivitasSiakUpdateRequest struct {
	CatatanKegiatan      string  `json:"catatan_kegiatan,omitempty" binding:"max=1000"`
	LaporanKegiatan      string  `json:"laporan_kegiatan,omitempty" binding:"max=1000"`
	SuratMasuk           *int    `json:"surat_masuk,omitempty" binding:"min=0"`
	SuratKeluar          *int    `json:"surat_keluar,omitempty" binding:"min=0"`
	SuratCatat           *int    `json:"surat_catat,omitempty" binding:"min=0"`
	AktePerkawinan       *int    `json:"akte_perkawinan,omitempty" binding:"min=0"`
	AktePenceraian       *int    `json:"akte_perceraian,omitempty" binding:"min=0"`
	AkteKelahiran        *int    `json:"akte_kelahiran,omitempty" binding:"min=0"`
	AkteCatatanPinggiran *int    `json:"akte_catatan_pinggiran,omitempty" binding:"min=0"`
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
type DuplicateCheckRequest struct {
	BulanRekapitulasi int `json:"bulan_rekapitulasi" binding:"required,min=1,max=12"`
	TahunRekapitulasi int `json:"tahun_rekapitulasi" binding:"required,min=2000"`
}

// DuplicateCheckResponse indicates if a duplicate record exists
type DuplicateCheckResponse struct {
	Exists bool `json:"exists"`
	ID     *int `json:"id,omitempty"` // ID of existing record if it exists
}

// ValidationResult holds validation errors
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors map[string]string `json:"errors,omitempty"`
}

// Statistics represents summary statistics for aktivitas records
type Statistics struct {
	TotalRecords           int       `json:"total_records"`
	AverageSuratMasuk      float64   `json:"average_surat_masuk"`
	AverageSuratKeluar     float64   `json:"average_surat_keluar"`
	AverageSuratCatat      float64   `json:"average_surat_catat"`
	AverageAktePerkawinan  float64   `json:"average_akte_perkawinan"`
	AverageAktePenceraian  float64   `json:"average_akte_perceraian"`
	AverageAkteKelahiran   float64   `json:"average_akte_kelahiran"`
	HighestSuratMasuk      int       `json:"highest_surat_masuk"`
	HighestAkteKelahiran   int       `json:"highest_akte_kelahiran"`
	LastUpdateTime         time.Time `json:"last_update_time"`
}
