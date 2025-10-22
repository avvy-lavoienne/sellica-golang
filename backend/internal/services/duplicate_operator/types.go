package duplicate_operator

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// CreateRequest represents the payload for creating a new duplicate operator record
type CreateRequest struct {
	NikDuplicate             string `json:"nik_duplicate" binding:"required,len=16" validate:"required"`
	NamaDuplicate            string `json:"nama_duplicate" binding:"required,max=255" validate:"required"`
	NikOperator              string `json:"nik_operator" binding:"required,len=16" validate:"required"`
	NamaOperator             string `json:"nama_operator" binding:"required,max=255" validate:"required"`
	TanggalPerekaman         string `json:"tanggal_perekaman" binding:"required" validate:"required"`
	TanggalPengajuan         string `json:"tanggal_pengajuan" binding:"required" validate:"required"`
	EstimasiTanggalPerekaman string `json:"estimasi_tanggal_perekaman" binding:"omitempty"`
	IsReadyToRecord          bool   `json:"is_ready_to_record" binding:"omitempty"`
}

// UpdateRequest represents the payload for updating a duplicate operator record
type UpdateRequest struct {
	NikDuplicate             *string `json:"nik_duplicate,omitempty" binding:"omitempty,len=16"`
	NamaDuplicate            *string `json:"nama_duplicate,omitempty" binding:"omitempty,max=255"`
	NikOperator              *string `json:"nik_operator,omitempty" binding:"omitempty,len=16"`
	NamaOperator             *string `json:"nama_operator,omitempty" binding:"omitempty,max=255"`
	TanggalPerekaman         *string `json:"tanggal_perekaman,omitempty"`
	TanggalPengajuan         *string `json:"tanggal_pengajuan,omitempty"`
	EstimasiTanggalPerekaman *string `json:"estimasi_tanggal_perekaman,omitempty"`
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

// DuplicateOperatorData represents a duplicate operator record from database
type DuplicateOperatorData struct {
	ID                       uuid.UUID  `db:"id" json:"id"`
	UserID                   uuid.UUID  `db:"user_id" json:"user_id"`
	NikDuplicate             string     `db:"nik_duplicate" json:"nik_duplicate"`
	NamaDuplicate            string     `db:"nama_duplicate" json:"nama_duplicate"`
	NikOperator              string     `db:"nik_operator" json:"nik_operator"`
	NamaOperator             string     `db:"nama_operator" json:"nama_operator"`
	NikPengaju               string     `db:"nik_pengaju" json:"nik_pengaju"`
	NamaPengaju              string     `db:"nama_pengaju" json:"nama_pengaju"`
	TanggalPerekaman         *time.Time `db:"tanggal_perekaman" json:"tanggal_perekaman"`
	TanggalPengajuan         time.Time  `db:"tanggal_pengajuan" json:"tanggal_pengajuan"`
	EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman" json:"estimasi_tanggal_perekaman"`
	IsReadyToRecord          bool       `db:"is_ready_to_record" json:"is_ready_to_record"`
	CreatedAt                time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt                time.Time  `db:"updated_at" json:"updated_at"`
}

// UnmarshalJSON handles custom JSON unmarshaling to support multiple date formats
func (d *DuplicateOperatorData) UnmarshalJSON(data []byte) error {
	type Alias DuplicateOperatorData
	aux := &struct {
		ID                       string `json:"id"`
		UserID                   string `json:"user_id"`
		TanggalPerekaman         *string `json:"tanggal_perekaman"`
		TanggalPengajuan         string `json:"tanggal_pengajuan"`
		EstimasiTanggalPerekaman *string `json:"estimasi_tanggal_perekaman"`
		CreatedAt                string `json:"created_at"`
		UpdatedAt                string `json:"updated_at"`
		*Alias
	}{
		Alias: (*Alias)(d),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parse ID
	if aux.ID != "" {
		id, err := uuid.Parse(aux.ID)
		if err == nil {
			d.ID = id
		}
	}

	// Parse UserID
	if aux.UserID != "" {
		id, err := uuid.Parse(aux.UserID)
		if err == nil {
			d.UserID = id
		}
	}

	// Helper function to parse dates with multiple formats
	parseDate := func(dateStr string) (*time.Time, error) {
		if dateStr == "" {
			return nil, nil
		}

		// Try different date formats
		formats := []string{
			"2006-01-02T15:04:05Z07:00", // ISO 8601 with timezone
			"2006-01-02T15:04:05Z",      // ISO 8601 UTC
			"2006-01-02T15:04:05",       // ISO 8601 without timezone
			"2006-01-02",                // Date only (YYYY-MM-DD)
		}

		for _, format := range formats {
			if t, err := time.Parse(format, dateStr); err == nil {
				return &t, nil
			}
		}

		return nil, nil // Return nil for unparseable dates
	}

	// Parse date fields
	if aux.TanggalPerekaman != nil {
		if t, _ := parseDate(*aux.TanggalPerekaman); t != nil {
			d.TanggalPerekaman = t
		}
	}

	if aux.TanggalPengajuan != "" {
		if t, _ := parseDate(aux.TanggalPengajuan); t != nil {
			d.TanggalPengajuan = *t
		}
	}

	if aux.EstimasiTanggalPerekaman != nil {
		if t, _ := parseDate(*aux.EstimasiTanggalPerekaman); t != nil {
			d.EstimasiTanggalPerekaman = t
		}
	}

	if aux.CreatedAt != "" {
		if t, _ := parseDate(aux.CreatedAt); t != nil {
			d.CreatedAt = *t
		}
	}

	if aux.UpdatedAt != "" {
		if t, _ := parseDate(aux.UpdatedAt); t != nil {
			d.UpdatedAt = *t
		}
	}

	return nil
}

// PaginationMeta contains pagination information
type PaginationMeta struct {
	Page        int   `json:"page"`
	PageSize    int   `json:"page_size"`
	Total       int64 `json:"total"`
	TotalPages  int   `json:"total_pages"`
	HasNext     bool  `json:"has_next"`
	HasPrevious bool  `json:"has_previous"`
}

// ListResponse represents paginated list response
type ListResponse struct {
	Status     string            `json:"status"`
	Code       int               `json:"code"`
	Message    string            `json:"message"`
	Data       []DuplicateOperatorData `json:"data"`
	Pagination PaginationMeta    `json:"pagination"`
	Timestamp  time.Time         `json:"timestamp"`
}

// SingleResponse represents single record response
type SingleResponse struct {
	Status    string                `json:"status"`
	Code      int                   `json:"code"`
	Message   string                `json:"message"`
	Data      DuplicateOperatorData `json:"data"`
	Timestamp time.Time             `json:"timestamp"`
}

// ErrorDetail contains field-specific error information
type ErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Status       string       `json:"status"`
	Code         int          `json:"code"`
	Message      string       `json:"message"`
	ErrorDetails []ErrorDetail `json:"error_details,omitempty"`
	Timestamp    time.Time    `json:"timestamp"`
}
