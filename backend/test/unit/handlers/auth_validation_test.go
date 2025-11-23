package handlers

import (
	"net/http"
	"testing"
)

// TestValidatePasswordStrength tests password strength validation
func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name          string
		password      string
		shouldFail    bool
		expectedError string
	}{
		// Valid passwords
		{
			name:       "Valid strong password",
			password:   "MyPassword123!",
			shouldFail: false,
		},
		{
			name:       "Valid password with special chars",
			password:   "Secure@Pass2024",
			shouldFail: false,
		},
		{
			name:       "Valid password with numbers",
			password:   "Test@1234Pass",
			shouldFail: false,
		},

		// Invalid passwords - too short
		{
			name:          "Password too short (7 chars)",
			password:      "Pass12!",
			shouldFail:    true,
			expectedError: "Kata sandi harus minimal 8 karakter",
		},

		// Invalid passwords - missing uppercase
		{
			name:          "Missing uppercase letter",
			password:      "password123!",
			shouldFail:    true,
			expectedError: "Kata sandi harus mengandung huruf besar (A-Z)",
		},

		// Invalid passwords - missing lowercase
		{
			name:          "Missing lowercase letter",
			password:      "PASSWORD123!",
			shouldFail:    true,
			expectedError: "Kata sandi harus mengandung huruf kecil (a-z)",
		},

		// Invalid passwords - missing digit
		{
			name:          "Missing digit",
			password:      "Password!",
			shouldFail:    true,
			expectedError: "Kata sandi harus mengandung angka (0-9)",
		},

		// Invalid passwords - missing special character
		{
			name:          "Missing special character",
			password:      "Password123",
			shouldFail:    true,
			expectedError: "Kata sandi harus mengandung karakter khusus (!@#$%^&*)",
		},

		// Edge cases
		{
			name:       "Exactly 8 characters with all requirements",
			password:   "Pass12!a",
			shouldFail: false,
		},
		{
			name:          "Empty password",
			password:      "",
			shouldFail:    true,
			expectedError: "Kata sandi harus minimal 8 karakter",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := handlers.ValidatePasswordStrength(tt.password)

			if tt.shouldFail {
				if err == nil {
					t.Errorf("Expected error but got nil")
				} else if valErr, ok := err.(*handlers.ValidationError); ok {
					if valErr.Message != tt.expectedError {
						t.Errorf("Expected error '%s', got '%s'", tt.expectedError, valErr.Message)
					}
					if valErr.HTTPCode != http.StatusBadRequest {
						t.Errorf("Expected HTTP 400, got %d", valErr.HTTPCode)
					}
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

// TestValidateNIK tests NIK format validation
func TestValidateNIK(t *testing.T) {
	tests := []struct {
		name          string
		nik           string
		shouldFail    bool
		expectedError string
	}{
		// Valid NIK
		{
			name:       "Valid 16-digit NIK",
			nik:        "1234567890123456",
			shouldFail: false,
		},
		{
			name:       "Empty NIK (optional field)",
			nik:        "",
			shouldFail: false,
		},

		// Invalid NIK - wrong length
		{
			name:          "Too short (15 digits)",
			nik:           "123456789012345",
			shouldFail:    true,
			expectedError: "NIK harus terdiri dari 16 angka",
		},
		{
			name:          "Too long (17 digits)",
			nik:           "12345678901234567",
			shouldFail:    true,
			expectedError: "NIK harus terdiri dari 16 angka",
		},

		// Invalid NIK - contains non-digits
		{
			name:          "Contains letters",
			nik:           "123456789012345a",
			shouldFail:    true,
			expectedError: "NIK hanya boleh mengandung angka",
		},
		{
			name:          "Contains special characters",
			nik:           "1234567890123-56",
			shouldFail:    true,
			expectedError: "NIK hanya boleh mengandung angka",
		},
		{
			name:          "Contains spaces",
			nik:           "12345678 90123456",
			shouldFail:    true,
			expectedError: "NIK hanya boleh mengandung angka",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := handlers.ValidateNIK(tt.nik)

			if tt.shouldFail {
				if err == nil {
					t.Errorf("Expected error but got nil")
				} else if valErr, ok := err.(*handlers.ValidationError); ok {
					if valErr.Message != tt.expectedError {
						t.Errorf("Expected error '%s', got '%s'", tt.expectedError, valErr.Message)
					}
					if valErr.HTTPCode != http.StatusBadRequest {
						t.Errorf("Expected HTTP 400, got %d", valErr.HTTPCode)
					}
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

// TestValidateNIP tests NIP format validation
func TestValidateNIP(t *testing.T) {
	tests := []struct {
		name          string
		nip           string
		shouldFail    bool
		expectedError string
	}{
		// Valid NIP
		{
			name:       "Valid 18-digit NIP",
			nip:        "198306092025211007",
			shouldFail: false,
		},
		{
			name:       "Empty NIP (optional field)",
			nip:        "",
			shouldFail: false,
		},

		// Invalid NIP - wrong length
		{
			name:          "Too short (17 digits)",
			nip:           "19830609202521100",
			shouldFail:    true,
			expectedError: "NIP harus terdiri dari 18 angka jika disediakan",
		},
		{
			name:          "Too long (19 digits)",
			nip:           "1983060920252110071",
			shouldFail:    true,
			expectedError: "NIP harus terdiri dari 18 angka jika disediakan",
		},

		// Invalid NIP - contains non-digits
		{
			name:          "Contains letters",
			nip:           "19830609202521100a",
			shouldFail:    true,
			expectedError: "NIP hanya boleh mengandung angka",
		},
		{
			name:          "Contains special characters",
			nip:           "198306092025211-07",
			shouldFail:    true,
			expectedError: "NIP hanya boleh mengandung angka",
		},
		{
			name:          "Contains spaces",
			nip:           "19830609 2025211007",
			shouldFail:    true,
			expectedError: "NIP hanya boleh mengandung angka",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := handlers.ValidateNIP(tt.nip)

			if tt.shouldFail {
				if err == nil {
					t.Errorf("Expected error but got nil")
				} else if valErr, ok := err.(*handlers.ValidationError); ok {
					if valErr.Message != tt.expectedError {
						t.Errorf("Expected error '%s', got '%s'", tt.expectedError, valErr.Message)
					}
					if valErr.HTTPCode != http.StatusBadRequest {
						t.Errorf("Expected HTTP 400, got %d", valErr.HTTPCode)
					}
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

// TestValidatePosition tests position length validation
func TestValidatePosition(t *testing.T) {
	tests := []struct {
		name          string
		position      string
		shouldFail    bool
		expectedError string
	}{
		// Valid positions
		{
			name:       "Empty position (optional)",
			position:   "",
			shouldFail: false,
		},
		{
			name:       "Valid short position",
			position:   "Manager",
			shouldFail: false,
		},
		{
			name:       "Valid position with spaces",
			position:   "Senior Software Engineer",
			shouldFail: false,
		},
		{
			name:       "Position at max length (100 chars)",
			position:   "A", // Will generate 100-char string dynamically in test
			shouldFail: false,
		},

		// Invalid position - too long
		{
			name:          "Position exceeds 100 characters",
			position:      "VeryLongPositionNameThatExceedsTheMaximumAllowedLengthOfOneHundredCharactersForThePositionFieldInTheDatabase",
			shouldFail:    true,
			expectedError: "Posisi tidak boleh lebih dari 100 karakter",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Special case: test position at exactly 100 characters
			testPosition := tt.position
			if tt.name == "Position at max length (100 chars)" {
				testPosition = string(make([]byte, 100))
				for i := range testPosition {
					testPosition = testPosition[:i] + "A" + testPosition[i+1:]
				}
			}

			err := handlers.ValidatePosition(testPosition)

			if tt.shouldFail {
				if err == nil {
					t.Errorf("Expected error but got nil")
				} else if valErr, ok := err.(*handlers.ValidationError); ok {
					if valErr.Message != tt.expectedError {
						t.Errorf("Expected error '%s', got '%s'", tt.expectedError, valErr.Message)
					}
					if valErr.HTTPCode != http.StatusBadRequest {
						t.Errorf("Expected HTTP 400, got %d", valErr.HTTPCode)
					}
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

// BenchmarkValidatePasswordStrength benchmarks password validation
func BenchmarkValidatePasswordStrength(b *testing.B) {
	password := "SecurePass123!"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handlers.ValidatePasswordStrength(password)
	}
}

// BenchmarkValidateNIK benchmarks NIK validation
func BenchmarkValidateNIK(b *testing.B) {
	nik := "1234567890123456"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handlers.ValidateNIK(nik)
	}
}

// BenchmarkValidateNIP benchmarks NIP validation
func BenchmarkValidateNIP(b *testing.B) {
	nip := "198306092025211007"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handlers.ValidateNIP(nip)
	}
}

// BenchmarkValidatePosition benchmarks position validation
func BenchmarkValidatePosition(b *testing.B) {
	position := "Senior Manager"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		handlers.ValidatePosition(position)
	}
}
