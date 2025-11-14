package salah_rekam

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// CreateRequest represents the payload for creating a new salah rekam record
type CreateRequest struct {
	NikSalahRekam            string `json:"nik_salah_rekam" binding:"required,len=16" validate:"required"`
	NamaSalahRekam           string `json:"nama_salah_rekam" binding:"required,max=255" validate:"required"`
	NikPemilikBiometric      string `json:"nik_pemilik_biometric" binding:"required,len=16" validate:"required"`
	NamaPemilikBiometric     string `json:"nama_pemilik_biometric" binding:"required,max=255" validate:"required"`
	NikPemilikFoto           string `json:"nik_pemilik_foto" binding:"required,len=16" validate:"required"`
	NamaPemilikFoto          string `json:"nama_pemilik_foto" binding:"required,max=255" validate:"required"`
	NikPetugasRekam          string `json:"nik_petugas_rekam" binding:"required,len=16" validate:"required"`
	NamaPetugasRekam         string `json:"nama_petugas_rekam" binding:"required,max=255" validate:"required"`
	TanggalPerekaman         string `json:"tanggal_perekaman" binding:"required" validate:"required"`
	EstimasiTanggalPerekaman string `json:"estimasi_tanggal_perekaman" binding:"omitempty"`
	NikPengaju               string `json:"nik_pengaju" binding:"required,len=16" validate:"required"`
	NamaPengaju              string `json:"nama_pengaju" binding:"required,max=255" validate:"required"`
	IsReadyToRecord          bool   `json:"is_ready_to_record" binding:"omitempty"`
}

// UpdateRequest represents the payload for updating a salah rekam record
// NOTE: No Gin binding tags on pointer types - validation handled by ValidateUpdateRequest()
type UpdateRequest struct {
	NikSalahRekam            *string `json:"nik_salah_rekam,omitempty"`
	NamaSalahRekam           *string `json:"nama_salah_rekam,omitempty"`
	NikPemilikBiometric      *string `json:"nik_pemilik_biometric,omitempty"`
	NamaPemilikBiometric     *string `json:"nama_pemilik_biometric,omitempty"`
	NikPemilikFoto           *string `json:"nik_pemilik_foto,omitempty"`
	NamaPemilikFoto          *string `json:"nama_pemilik_foto,omitempty"`
	NikPetugasRekam          *string `json:"nik_petugas_rekam,omitempty"`
	NamaPetugasRekam         *string `json:"nama_petugas_rekam,omitempty"`
	TanggalPerekaman         *string `json:"tanggal_perekaman,omitempty"`
	EstimasiTanggalPerekaman *string `json:"estimasi_tanggal_perekaman,omitempty"`
	NikPengaju               *string `json:"nik_pengaju,omitempty"`
	NamaPengaju              *string `json:"nama_pengaju,omitempty"`
	IsReadyToRecord          *bool   `json:"is_ready_to_record,omitempty"`
}

// ListQueryParams represents query parameters for listing records
type ListQueryParams struct {
	Page      int    `form:"page" binding:"omitempty" default:"1"`
	PageSize  int    `form:"page_size" binding:"omitempty" default:"10"`
	Search    string `form:"search" binding:"omitempty,max=255"`
	Status    string `form:"status" binding:"omitempty" default:"all"`
	SortBy    string `form:"sort_by" binding:"omitempty" default:"created_at"`
	SortOrder string `form:"sort_order" binding:"omitempty" default:"desc"`
	DateFrom  string `form:"date_from" binding:"omitempty"`
	DateTo    string `form:"date_to" binding:"omitempty"`
}

// SalahRekamData represents a salah rekam record from database
// Schema from: docs/backend/docs/reference/supabase-reference/column-reference.json (lines 975-1120)
type SalahRekamData struct {
	ID                       uuid.UUID  `db:"id" json:"id"`
	UserID                   uuid.UUID  `db:"user_id" json:"user_id"`
	NikSalahRekam            string     `db:"nik_salah_rekam" json:"nik_salah_rekam"`
	NamaSalahRekam           string     `db:"nama_salah_rekam" json:"nama_salah_rekam"`
	NikPemilikBiometric      string     `db:"nik_pemilik_biometric" json:"nik_pemilik_biometric"`
	NamaPemilikBiometric     string     `db:"nama_pemilik_biometric" json:"nama_pemilik_biometric"`
	NikPemilikFoto           string     `db:"nik_pemilik_foto" json:"nik_pemilik_foto"`
	NamaPemilikFoto          string     `db:"nama_pemilik_foto" json:"nama_pemilik_foto"`
	NikPetugasRekam          string     `db:"nik_petugas_rekam" json:"nik_petugas_rekam"`
	NamaPetugasRekam         string     `db:"nama_petugas_rekam" json:"nama_petugas_rekam"`
	TanggalPerekaman         time.Time  `db:"tanggal_perekaman" json:"tanggal_perekaman"`
	EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman" json:"estimasi_tanggal_perekaman"`
	NikPengaju               string     `db:"nik_pengaju" json:"nik_pengaju"`
	NamaPengaju              string     `db:"nama_pengaju" json:"nama_pengaju"`
	CreatedAt                *time.Time `db:"created_at" json:"created_at"`
	IsReadyToRecord          *bool      `db:"is_ready_to_record" json:"is_ready_to_record"`
}

// UnmarshalJSON handles custom JSON unmarshaling to support multiple date formats
func (s *SalahRekamData) UnmarshalJSON(data []byte) error {
	type Alias SalahRekamData
	aux := &struct {
		ID                       string  `json:"id"`
		UserID                   string  `json:"user_id"`
		TanggalPerekaman         string  `json:"tanggal_perekaman"`
		EstimasiTanggalPerekaman *string `json:"estimasi_tanggal_perekaman"`
		CreatedAt                *string `json:"created_at"`
		*Alias
	}{
		Alias: (*Alias)(s),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parse ID
	if aux.ID != "" {
		id, err := uuid.Parse(aux.ID)
		if err == nil {
			s.ID = id
		}
	}

	// Parse UserID
	if aux.UserID != "" {
		id, err := uuid.Parse(aux.UserID)
		if err == nil {
			s.UserID = id
		}
	}

	// Parse TanggalPerekaman
	if aux.TanggalPerekaman != "" {
		parsedTime, err := parseDate(aux.TanggalPerekaman)
		if err == nil {
			s.TanggalPerekaman = parsedTime
		}
	}

	// Parse EstimasiTanggalPerekaman
	if aux.EstimasiTanggalPerekaman != nil && *aux.EstimasiTanggalPerekaman != "" {
		parsedTime, err := parseDate(*aux.EstimasiTanggalPerekaman)
		if err == nil {
			s.EstimasiTanggalPerekaman = &parsedTime
		}
	}

	// Parse CreatedAt
	if aux.CreatedAt != nil && *aux.CreatedAt != "" {
		parsedTime, err := parseTimestamp(*aux.CreatedAt)
		if err == nil {
			s.CreatedAt = &parsedTime
		}
	}

	return nil
}

// parseDate parses date string in YYYY-MM-DD format
func parseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// parseTimestamp parses timestamp string with or without timezone
func parseTimestamp(tsStr string) (time.Time, error) {
	// Try parsing with timezone
	if t, err := time.Parse(time.RFC3339, tsStr); err == nil {
		return t, nil
	}
	// Try parsing without timezone
	return time.Parse("2006-01-02 15:04:05", tsStr)
}

// ListResponse represents paginated list response
type ListResponse struct {
	Data       []SalahRekamData `json:"data"`
	Pagination PaginationMeta   `json:"pagination"`
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	Page        int   `json:"page"`
	PageSize    int   `json:"page_size"`
	Total       int64 `json:"total"`
	TotalPages  int   `json:"total_pages"`
	HasNext     bool  `json:"has_next"`
	HasPrevious bool  `json:"has_previous"`
}

// ValidationErrors represents validation error details
type ValidationErrors struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorResponse represents error response structure
type ErrorResponse struct {
	Code    string               `json:"code"`
	Message string               `json:"message"`
	Details []ValidationErrors   `json:"details,omitempty"`
}

// NewErrorResponse creates a new error response
func NewErrorResponse(code, message string, details ...ValidationErrors) *ErrorResponse {
	return &ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// SuccessResponse represents success response structure
type SuccessResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// NewSuccessResponse creates a new success response
func NewSuccessResponse(code, message string, data interface{}) *SuccessResponse {
	return &SuccessResponse{
		Code:    code,
		Message: message,
		Data:    data,
	}
}
