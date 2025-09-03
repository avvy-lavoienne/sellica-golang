package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"selly-backend/pkg/types"
	"selly-backend/pkg/validation"
)

// ServiceTypeMigrator helps migrate from string-based service types to centralized enum
type ServiceTypeMigrator struct {
	validator           *validation.ServiceTypeValidator
	basePath            string
	dryRun              bool
	migrationStatistics MigrationStatistics
}

// MigrationStatistics tracks migration progress
type MigrationStatistics struct {
	TotalFiles       int `json:"total_files"`
	ModifiedFiles    int `json:"modified_files"`
	TotalReplacements int `json:"total_replacements"`
	IssuesFound      int `json:"issues_found"`
}

// MigrationReplacement defines a replacement pattern
type MigrationReplacement struct {
	Pattern     *regexp.Regexp
	Replacement func(string) string
	Description string
}

// NewServiceTypeMigrator creates a new service type migrator
func NewServiceTypeMigrator(basePath string, dryRun bool) *ServiceTypeMigrator {
	return &ServiceTypeMigrator{
		validator: validation.NewServiceTypeValidator(false),
		basePath:  basePath,
		dryRun:    dryRun,
	}
}

// MigrateServiceTypes performs the migration from string-based to enum-based service types
func (migrator *ServiceTypeMigrator) MigrateServiceTypes() error {
	fmt.Printf("🚀 Service Type Migration Tool (Dry Run: %v)\n", migrator.dryRun)
	fmt.Println("===============================================")

	// Define migration patterns
	replacements := migrator.createReplacementPatterns()

	// Walk through all Go files
	err := filepath.Walk(migrator.basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip non-Go files and certain directories
		if !strings.HasSuffix(path, ".go") ||
			strings.Contains(path, "vendor/") ||
			strings.Contains(path, ".git/") ||
			strings.Contains(path, "node_modules/") ||
			strings.Contains(path, "pkg/types/") { // Skip our types package
			return nil
		}

		return migrator.migrateFile(path, replacements)
	})

	if err != nil {
		return fmt.Errorf("error during migration: %v", err)
	}

	migrator.printMigrationReport()
	return nil
}

// createReplacementPatterns creates all the replacement patterns for migration
func (migrator *ServiceTypeMigrator) createReplacementPatterns() []*MigrationReplacement {
	return []*MigrationReplacement{
		// ServiceType struct field assignments
		{
			Pattern: regexp.MustCompile(`ServiceType:\s*"([^"]+)"`),
			Replacement: func(match string) string {
				parts := strings.Split(match, `"`)
				if len(parts) >= 2 {
					serviceType := parts[1]
					parsed := types.ParseServiceType(serviceType)
					return fmt.Sprintf(`ServiceType: string(types.%s)`, migrator.getEnumName(parsed))
				}
				return match
			},
			Description: "Migrate ServiceType struct field assignments",
		},
		
		// Service type variable assignments
		{
			Pattern: regexp.MustCompile(`(\w+\.ServiceType\s*=\s*)"([^"]+)"`),
			Replacement: func(match string) string {
				re := regexp.MustCompile(`(\w+\.ServiceType\s*=\s*)"([^"]+)"`)
				matches := re.FindStringSubmatch(match)
				if len(matches) >= 3 {
					prefix := matches[1]
					serviceType := matches[2]
					parsed := types.ParseServiceType(serviceType)
					return fmt.Sprintf(`%sstring(types.%s)`, prefix, migrator.getEnumName(parsed))
				}
				return match
			},
			Description: "Migrate service type variable assignments",
		},
		
		// JSON service type field values in tests and configurations
		{
			Pattern: regexp.MustCompile(`"service_type":\s*"([^"]+)"`),
			Replacement: func(match string) string {
				parts := strings.Split(match, `"`)
				if len(parts) >= 4 {
					serviceType := parts[3]
					parsed := types.ParseServiceType(serviceType)
					// For JSON, we keep the string but ensure it's a valid enum value
					return fmt.Sprintf(`"service_type": "%s"`, parsed.String())
				}
				return match
			},
			Description: "Normalize JSON service_type field values",
		},
		
		// Administrative context values
		{
			Pattern: regexp.MustCompile(`"administrativeContext":\s*"([^"]+)"`),
			Replacement: func(match string) string {
				parts := strings.Split(match, `"`)
				if len(parts) >= 4 {
					serviceType := parts[3]
					parsed := types.ParseServiceType(serviceType)
					return fmt.Sprintf(`"administrativeContext": "%s"`, parsed.String())
				}
				return match
			},
			Description: "Normalize administrative context values",
		},
		
		// Constants definition migration
		{
			Pattern: regexp.MustCompile(`const\s+(\w+)\s*=\s*"([^"]+)"`),
			Replacement: func(match string) string {
				re := regexp.MustCompile(`const\s+(\w+)\s*=\s*"([^"]+)"`)
				matches := re.FindStringSubmatch(match)
				if len(matches) >= 3 {
					constName := matches[1]
					value := matches[2]
					
					// Only migrate if it looks like a service type constant
					if strings.Contains(strings.ToLower(constName), "service") ||
						migrator.looksLikeServiceType(value) {
						parsed := types.ParseServiceType(value)
						return fmt.Sprintf(`const %s = string(types.%s)`, constName, migrator.getEnumName(parsed))
					}
				}
				return match
			},
			Description: "Migrate service type constants",
		},
	}
}

// getEnumName returns the enum name for a service type
func (migrator *ServiceTypeMigrator) getEnumName(serviceType types.ServiceType) string {
	enumNames := map[types.ServiceType]string{
		types.ServiceTypeKTPElektronik:        "ServiceTypeKTPElektronik",
		types.ServiceTypeKTPBaru:              "ServiceTypeKTPBaru",
		types.ServiceTypeKTPPenggantian:       "ServiceTypeKTPPenggantian",
		types.ServiceTypeKTPPerbaikan:         "ServiceTypeKTPPerbaikan",
		types.ServiceTypeKTPInquiry:           "ServiceTypeKTPInquiry",
		types.ServiceTypeKKBaru:               "ServiceTypeKKBaru",
		types.ServiceTypeKKPerubahan:          "ServiceTypeKKPerubahan",
		types.ServiceTypeKKPindah:             "ServiceTypeKKPindah",
		types.ServiceTypeKKPenggantian:        "ServiceTypeKKPenggantian",
		types.ServiceTypeKartuKeluarga:        "ServiceTypeKartuKeluarga",
		types.ServiceTypeAktaKelahiran:        "ServiceTypeAktaKelahiran",
		types.ServiceTypeAktaKelahiranBayi:    "ServiceTypeAktaKelahiranBayi",
		types.ServiceTypeAktaKelahiranTerlambat: "ServiceTypeAktaKelahiranTerlambat",
		types.ServiceTypeAktaKelahiranUmum:     "ServiceTypeAktaKelahiranUmum",
		types.ServiceTypeAktaKelahiranTepatWaktu: "ServiceTypeAktaKelahiranTepatWaktu",
		types.ServiceTypeAktaPerkawinan:       "ServiceTypeAktaPerkawinan",
		types.ServiceTypeAktaNikah:            "ServiceTypeAktaNikah",
		types.ServiceTypeSuratNikah:           "ServiceTypeSuratNikah",
		types.ServiceTypeAktaKematian:         "ServiceTypeAktaKematian",
		types.ServiceTypePassport:             "ServiceTypePassport",
		types.ServiceTypePassportInquiry:      "ServiceTypePassportInquiry",
		types.ServiceTypeGeneral:              "ServiceTypeGeneral",
		types.ServiceTypeGovernment:           "ServiceTypeGovernment",
		types.ServiceTypeDocumentInquiry:      "ServiceTypeDocumentInquiry",
		types.ServiceTypeKTPNewApplication:    "ServiceTypeKTPNewApplication",
		types.ServiceTypeElectionInquiry:      "ServiceTypeElectionInquiry",
		types.ServiceTypeUnknown:              "ServiceTypeUnknown",
	}
	
	if enumName, exists := enumNames[serviceType]; exists {
		return enumName
	}
	
	return "ServiceTypeUnknown"
}

// looksLikeServiceType checks if a string looks like a service type
func (migrator *ServiceTypeMigrator) looksLikeServiceType(s string) bool {
	serviceIndicators := []string{
		"ktp", "akta", "kk", "kartu", "passport", "general", "government",
		"inquiry", "application", "kelahiran", "perkawinan", "kematian",
	}
	
	lower := strings.ToLower(s)
	for _, indicator := range serviceIndicators {
		if strings.Contains(lower, indicator) {
			return true
		}
	}
	
	return false
}

// migrateFile migrates a single file
func (migrator *ServiceTypeMigrator) migrateFile(filePath string, replacements []*MigrationReplacement) error {
	// Read file content
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	migrator.migrationStatistics.TotalFiles++
	originalContent := string(content)
	modifiedContent := originalContent
	fileModified := false

	// Apply all replacement patterns
	for _, replacement := range replacements {
		newContent := replacement.Pattern.ReplaceAllStringFunc(modifiedContent, replacement.Replacement)
		if newContent != modifiedContent {
			fmt.Printf("📝 %s: %s\n", filePath, replacement.Description)
			modifiedContent = newContent
			fileModified = true
			migrator.migrationStatistics.TotalReplacements++
		}
	}

	// Check if we need to add import for types package
	if fileModified && !strings.Contains(modifiedContent, `"selly-backend/pkg/types"`) {
		if strings.Contains(modifiedContent, "types.Service") {
			modifiedContent = migrator.addTypesImport(modifiedContent)
			fmt.Printf("📦 %s: Added types import\n", filePath)
		}
	}

	// Write back if modified and not dry run
	if fileModified {
		migrator.migrationStatistics.ModifiedFiles++
		
		if !migrator.dryRun {
			err = os.WriteFile(filePath, []byte(modifiedContent), 0644)
			if err != nil {
				return fmt.Errorf("error writing file %s: %v", filePath, err)
			}
		}
	}

	return nil
}

// addTypesImport adds the types package import to a Go file
func (migrator *ServiceTypeMigrator) addTypesImport(content string) string {
	// Find the import section
	importRegex := regexp.MustCompile(`(?s)(import\s*\(\s*)(.*?)(\s*\))`)
	matches := importRegex.FindStringSubmatch(content)
	
	if len(matches) >= 4 {
		importStart := matches[1]
		importContent := matches[2]
		importEnd := matches[3]
		
		// Check if types import already exists
		if !strings.Contains(importContent, `"selly-backend/pkg/types"`) {
			// Add the import
			newImportContent := importContent + "\n\t\"selly-backend/pkg/types\""
			return strings.Replace(content, matches[0], importStart+newImportContent+importEnd, 1)
		}
	}
	
	return content
}

// printMigrationReport prints the migration report
func (migrator *ServiceTypeMigrator) printMigrationReport() {
	fmt.Println("\n📊 MIGRATION REPORT")
	fmt.Println("===================")
	fmt.Printf("📁 Total Files Processed: %d\n", migrator.migrationStatistics.TotalFiles)
	fmt.Printf("✏️  Files Modified: %d\n", migrator.migrationStatistics.ModifiedFiles)
	fmt.Printf("🔄 Total Replacements: %d\n", migrator.migrationStatistics.TotalReplacements)
	
	if migrator.dryRun {
		fmt.Println("\n💡 This was a DRY RUN - no files were actually modified")
		fmt.Println("   Run without --dry-run flag to apply changes")
	} else {
		fmt.Println("\n✅ Migration completed successfully!")
		fmt.Println("   Remember to:")
		fmt.Println("   1. Run tests to ensure everything works")
		fmt.Println("   2. Update any remaining manual service type usage")
		fmt.Println("   3. Add validation middleware")
	}
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run service_type_migrator.go <path_to_backend> [--dry-run]")
	}

	basePath := os.Args[1]
	dryRun := len(os.Args) > 2 && os.Args[2] == "--dry-run"

	migrator := NewServiceTypeMigrator(basePath, dryRun)

	err := migrator.MigrateServiceTypes()
	if err != nil {
		log.Fatalf("Error during migration: %v", err)
	}
}
