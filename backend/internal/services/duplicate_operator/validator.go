package duplicate_operator

import (
	"fmt"
	"regexp"
	"time"
)

// ValidateCreateRequest validates input for creating a new record
func ValidateCreateRequest(req *CreateRequest) *ErrorResponse {
	if req == nil {
		return &ErrorResponse{
			Status:  "error",
			Code:    400,
			Message: "request body tidak boleh kosong",
		}
	}

	errors := []ErrorDetail{}

	// Validate NikDuplicate (16 digits numeric)
	if err := validateNIK(req.NikDuplicate); err != nil {
		errors = append(errors, ErrorDetail{
			Field:   "nik_duplicate",
			Message: err.Error(),
		})
	}

	// Validate NamaDuplicate (required, max 255)
	if req.NamaDuplicate == "" {
		errors = append(errors, ErrorDetail{
			Field:   "nama_duplicate",
			Message: "nama_duplicate tidak boleh kosong",
		})
	} else if len(req.NamaDuplicate) > 255 {
		errors = append(errors, ErrorDetail{
			Field:   "nama_duplicate",
			Message: "nama_duplicate harus tidak melebihi 255 karakter",
		})
	}

	// Validate NikOperator (16 digits numeric)
	if err := validateNIK(req.NikOperator); err != nil {
		errors = append(errors, ErrorDetail{
			Field:   "nik_operator",
			Message: err.Error(),
		})
	}

	// Validate NamaOperator (required, max 255)
	if req.NamaOperator == "" {
		errors = append(errors, ErrorDetail{
			Field:   "nama_operator",
			Message: "nama_operator tidak boleh kosong",
		})
	} else if len(req.NamaOperator) > 255 {
		errors = append(errors, ErrorDetail{
			Field:   "nama_operator",
			Message: "nama_operator harus tidak melebihi 255 karakter",
		})
	}

	// Validate TanggalPerekaman (YYYY-MM-DD format)
	if err := validateDateFormat(req.TanggalPerekaman); err != nil {
		errors = append(errors, ErrorDetail{
			Field:   "tanggal_perekaman",
			Message: err.Error(),
		})
	}

	// Validate TanggalPengajuan (YYYY-MM-DD format)
	if err := validateDateFormat(req.TanggalPengajuan); err != nil {
		errors = append(errors, ErrorDetail{
			Field:   "tanggal_pengajuan",
			Message: err.Error(),
		})
	}

	// Validate EstimasiTanggalPerekaman if provided (YYYY-MM-DD format)
	if req.EstimasiTanggalPerekaman != "" {
		if err := validateDateFormat(req.EstimasiTanggalPerekaman); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "estimasi_tanggal_perekaman",
				Message: err.Error(),
			})
		}
	}

	if len(errors) > 0 {
		return &ErrorResponse{
			Status:       "error",
			Code:         400,
			Message:      "validasi gagal",
			ErrorDetails: errors,
		}
	}

	return nil
}

// ValidateUpdateRequest validates input for updating a record
func ValidateUpdateRequest(req *UpdateRequest) *ErrorResponse {
	if req == nil {
		return &ErrorResponse{
			Status:  "error",
			Code:    400,
			Message: "request body cannot be empty",
		}
	}

	errors := []ErrorDetail{}

	// Validate NikDuplicate if provided (not empty string)
	if req.NikDuplicate != nil && *req.NikDuplicate != "" {
		if err := validateNIK(*req.NikDuplicate); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "nik_duplicate",
				Message: err.Error(),
			})
		}
	}

	// Validate NamaDuplicate if provided (not empty string)
	if req.NamaDuplicate != nil && *req.NamaDuplicate != "" {
		if len(*req.NamaDuplicate) > 255 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_duplicate",
				Message: "nama_duplicate harus tidak melebihi 255 karakter",
			})
		}
		if len(*req.NamaDuplicate) == 0 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_duplicate",
				Message: "nama_duplicate tidak boleh kosong",
			})
		}
	}

	// Validate NikOperator if provided (not empty string)
	if req.NikOperator != nil && *req.NikOperator != "" {
		if err := validateNIK(*req.NikOperator); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "nik_operator",
				Message: err.Error(),
			})
		}
	}

	// Validate NamaOperator if provided (not empty string)
	if req.NamaOperator != nil && *req.NamaOperator != "" {
		if len(*req.NamaOperator) > 255 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_operator",
				Message: "nama_operator harus tidak melebihi 255 karakter",
			})
		}
		if len(*req.NamaOperator) == 0 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_operator",
				Message: "nama_operator tidak boleh kosong",
			})
		}
	}

	// Validate TanggalPerekaman if provided (not empty string)
	if req.TanggalPerekaman != nil && *req.TanggalPerekaman != "" {
		if err := validateDateFormat(*req.TanggalPerekaman); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "tanggal_perekaman",
				Message: err.Error(),
			})
		}
	}

	// Validate TanggalPengajuan if provided (not empty string)
	if req.TanggalPengajuan != nil && *req.TanggalPengajuan != "" {
		if err := validateDateFormat(*req.TanggalPengajuan); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "tanggal_pengajuan",
				Message: err.Error(),
			})
		}
	}

	// Validate EstimasiTanggalPerekaman if provided (not empty string)
	if req.EstimasiTanggalPerekaman != nil && *req.EstimasiTanggalPerekaman != "" {
		if err := validateDateFormat(*req.EstimasiTanggalPerekaman); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "estimasi_tanggal_perekaman",
				Message: err.Error(),
			})
		}
	}

	if len(errors) > 0 {
		return &ErrorResponse{
			Status:       "error",
			Code:         400,
			Message:      "validasi gagal",
			ErrorDetails: errors,
		}
	}

	return nil
}

// validateNIK validates NIK format (16 digits, numeric only)
func validateNIK(nik string) error {
	if nik == "" {
		return fmt.Errorf("NIK tidak boleh kosong")
	}

	// Check length
	if len(nik) != 16 {
		return fmt.Errorf("NIK harus tepat 16 karakter")
	}

	// Check if numeric
	matched, err := regexp.MatchString(`^\d+$`, nik)
	if err != nil || !matched {
		return fmt.Errorf("NIK harus berisi hanya karakter numerik")
	}

	return nil
}

// validateDateFormat validates date format (YYYY-MM-DD)
func validateDateFormat(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("tanggal tidak boleh kosong")
	}

	// Check format
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("format tanggal tidak valid, gunakan YYYY-MM-DD")
	}

	return nil
}
