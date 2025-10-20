package duplicate_operator

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestValidateCreateRequest tests complete CreateRequest validation
func TestValidateCreateRequest(t *testing.T) {
	validRequest := &CreateRequest{
		NikDuplicate:             "1234567890123456",
		NamaDuplicate:            "Ahmad Maulana",
		NikOperator:              "6543210987654321",
		NamaOperator:             "Budi Santoso",
		TanggalPerekaman:         "2025-01-15",
		TanggalPengajuan:         "2025-01-14",
		EstimasiTanggalPerekaman: "2025-01-20",
		IsReadyToRecord:          true,
	}

	tests := []struct {
		name      string
		req       *CreateRequest
		wantError bool
		errorCode int
	}{
		{
			name:      "valid complete request",
			req:       validRequest,
			wantError: false,
		},
		{
			name: "nil request",
			req:  nil,
			wantError: true,
			errorCode: 400,
		},
		{
			name: "missing NIK duplicate",
			req: &CreateRequest{
				NamaDuplicate:            "Ahmad Maulana",
				NikOperator:              "6543210987654321",
				NamaOperator:             "Budi Santoso",
				TanggalPerekaman:         "2025-01-15",
				TanggalPengajuan:         "2025-01-14",
				EstimasiTanggalPerekaman: "2025-01-20",
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "invalid NIK (too short)",
			req: &CreateRequest{
				NikDuplicate:             "123",
				NamaDuplicate:            "Ahmad Maulana",
				NikOperator:              "6543210987654321",
				NamaOperator:             "Budi Santoso",
				TanggalPerekaman:         "2025-01-15",
				TanggalPengajuan:         "2025-01-14",
				EstimasiTanggalPerekaman: "2025-01-20",
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "invalid date format",
			req: &CreateRequest{
				NikDuplicate:             "1234567890123456",
				NamaDuplicate:            "Ahmad Maulana",
				NikOperator:              "6543210987654321",
				NamaOperator:             "Budi Santoso",
				TanggalPerekaman:         "01/15/2025",
				TanggalPengajuan:         "2025-01-14",
				EstimasiTanggalPerekaman: "2025-01-20",
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "empty nama_duplicate",
			req: &CreateRequest{
				NikDuplicate:             "1234567890123456",
				NamaDuplicate:            "",
				NikOperator:              "6543210987654321",
				NamaOperator:             "Budi Santoso",
				TanggalPerekaman:         "2025-01-15",
				TanggalPengajuan:         "2025-01-14",
				EstimasiTanggalPerekaman: "2025-01-20",
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "name exceeding 255 characters",
			req: &CreateRequest{
				NikDuplicate:             "1234567890123456",
				NamaDuplicate:            "A string that exceeds two hundred and fifty five characters, which is the maximum allowed length for person names in the duplicate operator database system that we are testing right now in this unit test to ensure proper validation of input data for person names and this is longer",
				NikOperator:              "6543210987654321",
				NamaOperator:             "Budi Santoso",
				TanggalPerekaman:         "2025-01-15",
				TanggalPengajuan:         "2025-01-14",
				EstimasiTanggalPerekaman: "2025-01-20",
			},
			wantError: true,
			errorCode: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateCreateRequest(tt.req)
			if tt.wantError {
				require.NotNil(t, result)
				assert.Equal(t, tt.errorCode, result.Code)
				assert.Equal(t, "error", result.Status)
			} else {
				require.Nil(t, result)
			}
		})
	}
}

// TestValidateUpdateRequest tests UpdateRequest validation (more permissive)
func TestValidateUpdateRequest(t *testing.T) {
	tests := []struct {
		name      string
		req       *UpdateRequest
		wantError bool
		errorCode int
	}{
		{
			name:      "empty update request (allowed)",
			req:       &UpdateRequest{},
			wantError: false,
		},
		{
			name: "nil request",
			req:  nil,
			wantError: true,
			errorCode: 400,
		},
		{
			name: "single field update - name",
			req: &UpdateRequest{
				NamaDuplicate: ptrString("Ahmad Updated"),
			},
			wantError: false,
		},
		{
			name: "single field update - ready flag",
			req: &UpdateRequest{
				IsReadyToRecord: ptrBool(false),
			},
			wantError: false,
		},
		{
			name: "invalid NIK in update",
			req: &UpdateRequest{
				NikDuplicate: ptrString("123"),
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "invalid date in update",
			req: &UpdateRequest{
				TanggalPerekaman: ptrString("invalid-date"),
			},
			wantError: true,
			errorCode: 400,
		},
		{
			name: "multiple field update",
			req: &UpdateRequest{
				NamaDuplicate:   ptrString("New Name"),
				IsReadyToRecord: ptrBool(false),
			},
			wantError: false,
		},
		{
			name: "name exceeding 255 chars",
			req: &UpdateRequest{
				NamaDuplicate: ptrString("A string that exceeds two hundred and fifty five characters, which is the maximum allowed length for person names in the duplicate operator database system that we are testing right now in this unit test to ensure proper validation of input data for person names and this is longer"),
			},
			wantError: true,
			errorCode: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateUpdateRequest(tt.req)
			if tt.wantError {
				require.NotNil(t, result)
				assert.Equal(t, tt.errorCode, result.Code)
				assert.Equal(t, "error", result.Status)
			} else {
				require.Nil(t, result)
			}
		})
	}
}

// Helper functions for pointer creation in tests
func ptrString(s string) *string {
	return &s
}

func ptrBool(b bool) *bool {
	return &b
}
