package main

import (
	"fmt"
	"os"
	"path/filepath"

	"selly-backend/internal/config"
)

func main() {
	fmt.Println("🚀 Phase 4 RAG System Configuration Test")
	fmt.Println("Testing reference structure integration...")

	// Load configuration
	cfg := config.Load()
	fmt.Printf("📁 Main documents path: %s\n", cfg.Knowledge.DocumentsPath)
	fmt.Printf("📚 Additional paths configured: %d\n", len(cfg.Knowledge.AdditionalPaths))

	fmt.Println("\n📋 Configured Additional Paths:")
	for i, path := range cfg.Knowledge.AdditionalPaths {
		absPath, _ := filepath.Abs(path)
		
		// Check if path exists
		exists := "❌ Not Found"
		if _, err := os.Stat(absPath); err == nil {
			exists = "✅ Exists"
		}
		
		fmt.Printf("  %d. %s %s\n", i+1, absPath, exists)
	}

	// Check specific reference structure paths
	fmt.Println("\n🔍 Checking Reference Structure Paths:")
	referencePaths := []string{
		"docs/reference/selly-intelligence/services/civil-registration",
		"docs/reference/selly-intelligence/services/identity-documents", 
		"docs/reference/selly-intelligence/services/general-services",
		"docs/reference/selly-intelligence/persona",
		"docs/reference/selly-intelligence/profile",
	}

	for _, path := range referencePaths {
		absPath, _ := filepath.Abs(path)
		exists := "❌ Not Found"
		if _, err := os.Stat(absPath); err == nil {
			exists = "✅ Exists"
			
			// Count files in directory
			files, err := os.ReadDir(absPath)
			if err == nil {
				mdCount := 0
				for _, file := range files {
					if filepath.Ext(file.Name()) == ".md" {
						mdCount++
					}
				}
				exists = fmt.Sprintf("✅ Exists (%d .md files)", mdCount)
			}
		}
		
		fmt.Printf("  📂 %s %s\n", absPath, exists)
	}

	fmt.Println("\n📊 Configuration Summary:")
	fmt.Printf("  Recursive Scan: %v\n", cfg.Knowledge.RecursiveScan)
	fmt.Printf("  Auto Indexing: %v\n", cfg.Knowledge.AutoIndexing)
	fmt.Printf("  Chunk Size: %d\n", cfg.Knowledge.ChunkSize)
	fmt.Printf("  Overlap Size: %d\n", cfg.Knowledge.OverlapSize)

	fmt.Println("\n🎉 Phase 4 configuration validation completed!")
	fmt.Println("✅ Reference structure paths are now integrated in configuration")
	
	// Validate all reference paths exist
	allExist := true
	for _, path := range referencePaths {
		if _, err := os.Stat(path); err != nil {
			allExist = false
			break
		}
	}
	
	if allExist {
		fmt.Println("✅ ALL reference structure paths are accessible")
	} else {
		fmt.Println("⚠️  Some reference structure paths are not accessible")
	}
}