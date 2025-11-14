package salah_rekam

import (
	"fmt"
	"regexp"
	"time"
)

// ValidateCreateRequest validates the create request payload
// Returns error message if validation fails, nil if successful
func ValidateCreateRequest(req *CreateRequest) error {
	if req == nil {
		return fmt.Errorf("permintaan tidak boleh kosong")
	}

	// Validate NIK fields (all 16 digits)
	nikFields := map[string]string{
		"nik_salah_rekam":       req.NikSalahRekam,
		"nik_pemilik_biometric": req.NikPemilikBiometric,
		"nik_pemilik_foto":      req.NikPemilikFoto,
		"nik_petugas_rekam":     req.NikPetugasRekam,
		"nik_pengaju":           req.NikPengaju,
	}

	for fieldName, nik := range nikFields {
		if err := validateNIK(fieldName, nik); err != nil {
			return err
		}
	}

	// Validate name fields (not empty, max 255)
	nameFields := map[string]string{
		"nama_salah_rekam":       req.NamaSalahRekam,
		"nama_pemilik_biometric": req.NamaPemilikBiometric,
		"nama_pemilik_foto":      req.NamaPemilikFoto,
		"nama_petugas_rekam":     req.NamaPetugasRekam,
		"nama_pengaju":           req.NamaPengaju,
	}

	for fieldName, name := range nameFields {
		if err := validateName(fieldName, name); err != nil {
			return err
		}
	}

	// Validate tanggal_perekaman (required, valid date)
	if req.TanggalPerekaman == "" {
		return fmt.Errorf("tanggal_perekaman tidak boleh kosong")
	}
	if _, err := time.Parse("2006-01-02", req.TanggalPerekaman); err != nil {
		return fmt.Errorf("format tanggal_perekaman tidak valid (gunakan YYYY-MM-DD)")
	}

	// Validate estimasi_tanggal_perekaman (optional, but if provided must be valid date)
	if req.EstimasiTanggalPerekaman != "" {
		if _, err := time.Parse("2006-01-02", req.EstimasiTanggalPerekaman); err != nil {
			return fmt.Errorf("format estimasi_tanggal_perekaman tidak valid (gunakan YYYY-MM-DD)")
		}
	}

	return nil
}

// ValidateUpdateRequest validates the update request payload
// Returns error message if validation fails, nil if successful
func ValidateUpdateRequest(req *UpdateRequest) error {
	if req == nil {
		return fmt.Errorf("permintaan tidak boleh kosong")
	}

	// Validate NIK fields if provided
	nikFields := map[string]*string{
		"nik_salah_rekam":       req.NikSalahRekam,
		"nik_pemilik_biometric": req.NikPemilikBiometric,
		"nik_pemilik_foto":      req.NikPemilikFoto,
		"nik_petugas_rekam":     req.NikPetugasRekam,
		"nik_pengaju":           req.NikPengaju,
	}

	for fieldName, nik := range nikFields {
		if nik != nil && *nik != "" {
			if err := validateNIK(fieldName, *nik); err != nil {
				return err
			}
		}
	}

	// Validate name fields if provided
	nameFields := map[string]*string{
		"nama_salah_rekam":       req.NamaSalahRekam,
		"nama_pemilik_biometric": req.NamaPemilikBiometric,
		"nama_pemilik_foto":      req.NamaPemilikFoto,
		"nama_petugas_rekam":     req.NamaPetugasRekam,
		"nama_pengaju":           req.NamaPengaju,
	}

	for fieldName, name := range nameFields {
		if name != nil && *name != "" {
			if err := validateName(fieldName, *name); err != nil {
				return err
			}
		}
	}

	// Validate tanggal_perekaman if provided
	if req.TanggalPerekaman != nil && *req.TanggalPerekaman != "" {
		if _, err := time.Parse("2006-01-02", *req.TanggalPerekaman); err != nil {
			return fmt.Errorf("format tanggal_perekaman tidak valid (gunakan YYYY-MM-DD)")
		}
	}

	// Validate estimasi_tanggal_perekaman if provided
	if req.EstimasiTanggalPerekaman != nil && *req.EstimasiTanggalPerekaman != "" {
		if _, err := time.Parse("2006-01-02", *req.EstimasiTanggalPerekaman); err != nil {
			return fmt.Errorf("format estimasi_tanggal_perekaman tidak valid (gunakan YYYY-MM-DD)")
		}
	}

	return nil
}

// validateNIK validates NIK format (16 digits)
func validateNIK(fieldName, nik string) error {
	if nik == "" {
		return fmt.Errorf("%s tidak boleh kosong", fieldName)
	}

	if len(nik) != 16 {
		return fmt.Errorf("%s harus 16 karakter, diterima %d karakter", fieldName, len(nik))
	}

	// Check if all characters are digits
	matched, err := regexp.MatchString("^[0-9]{16}$", nik)
	if err != nil || !matched {
		return fmt.Errorf("%s harus berisi 16 digit angka", fieldName)
	}

	return nil
}

// validateName validates name field (not empty, max 255)
func validateName(fieldName, name string) error {
	if name == "" {
		return fmt.Errorf("%s tidak boleh kosong", fieldName)
	}

	if len(name) > 255 {
		return fmt.Errorf("%s tidak boleh lebih dari 255 karakter", fieldName)
	}

	return nil
}

// ValidateID validates record ID format (UUID)
func ValidateID(id string) error {
	if id == "" {
		return fmt.Errorf("ID tidak boleh kosong")
	}

	// Basic UUID v4 format check (36 characters with hyphens)
	if len(id) != 36 {
		return fmt.Errorf("format ID tidak valid")
	}

	matched, err := regexp.MatchString("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", id)
	if err != nil || !matched {
		return fmt.Errorf("format ID tidak valid (harus UUID)")
	}

	return nil
}

// ValidateListQueryParams validates list query parameters
func ValidateListQueryParams(params *ListQueryParams) error {
	if params == nil {
		return fmt.Errorf("parameter query tidak boleh kosong")
	}

	// Validate page
	if params.Page < 1 {
		params.Page = 1
	}

	// Validate page size
	if params.PageSize < 1 {
		params.PageSize = 10
	} else if params.PageSize > 100 {
		params.PageSize = 100
	}

	// Validate sort order
	if params.SortOrder != "asc" && params.SortOrder != "desc" {
		params.SortOrder = "desc"
	}

	// Validate dates if provided
	if params.DateFrom != "" {
		if _, err := time.Parse("2006-01-02", params.DateFrom); err != nil {
			return fmt.Errorf("format date_from tidak valid (gunakan YYYY-MM-DD)")
		}
	}

	if params.DateTo != "" {
		if _, err := time.Parse("2006-01-02", params.DateTo); err != nil {
			return fmt.Errorf("format date_to tidak valid (gunakan YYYY-MM-DD)")
		}
	}

	return nil
}
