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
			Status: "error",
			Code:   400,
			Message: "request body cannot be empty",
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
			Message: "nama_duplicate is required",
		})
	} else if len(req.NamaDuplicate) > 255 {
		errors = append(errors, ErrorDetail{
			Field:   "nama_duplicate",
			Message: "nama_duplicate must not exceed 255 characters",
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
			Message: "nama_operator is required",
		})
	} else if len(req.NamaOperator) > 255 {
		errors = append(errors, ErrorDetail{
			Field:   "nama_operator",
			Message: "nama_operator must not exceed 255 characters",
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
			Message:      "validation failed",
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

	// Validate NikDuplicate if provided
	if req.NikDuplicate != nil {
		if err := validateNIK(*req.NikDuplicate); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "nik_duplicate",
				Message: err.Error(),
			})
		}
	}

	// Validate NamaDuplicate if provided
	if req.NamaDuplicate != nil {
		if len(*req.NamaDuplicate) > 255 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_duplicate",
				Message: "nama_duplicate must not exceed 255 characters",
			})
		}
	}

	// Validate NikOperator if provided
	if req.NikOperator != nil {
		if err := validateNIK(*req.NikOperator); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "nik_operator",
				Message: err.Error(),
			})
		}
	}

	// Validate NamaOperator if provided
	if req.NamaOperator != nil {
		if len(*req.NamaOperator) > 255 {
			errors = append(errors, ErrorDetail{
				Field:   "nama_operator",
				Message: "nama_operator must not exceed 255 characters",
			})
		}
	}

	// Validate TanggalPerekaman if provided
	if req.TanggalPerekaman != nil {
		if err := validateDateFormat(*req.TanggalPerekaman); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "tanggal_perekaman",
				Message: err.Error(),
			})
		}
	}

	// Validate TanggalPengajuan if provided
	if req.TanggalPengajuan != nil {
		if err := validateDateFormat(*req.TanggalPengajuan); err != nil {
			errors = append(errors, ErrorDetail{
				Field:   "tanggal_pengajuan",
				Message: err.Error(),
			})
		}
	}

	// Validate EstimasiTanggalPerekaman if provided
	if req.EstimasiTanggalPerekaman != nil {
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
			Message:      "validation failed",
			ErrorDetails: errors,
		}
	}

	return nil
}

// validateNIK validates NIK format (16 digits, numeric only)
func validateNIK(nik string) error {
	if nik == "" {
		return fmt.Errorf("NIK is required")
	}

	// Check length
	if len(nik) != 16 {
		return fmt.Errorf("NIK must be exactly 16 characters")
	}

	// Check if numeric
	matched, err := regexp.MatchString(`^\d+$`, nik)
	if err != nil || !matched {
		return fmt.Errorf("NIK must contain only numeric characters")
	}

	return nil
}

// validateDateFormat validates date format (YYYY-MM-DD)
func validateDateFormat(dateStr string) error {
	if dateStr == "" {
		return fmt.Errorf("date is required")
	}

	// Check format
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}

	return nil
}
