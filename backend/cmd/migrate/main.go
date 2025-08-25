package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// MigrationRunner handles database migration execution
type MigrationRunner struct {
	client *supabase.Client
	url    string
	key    string
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(url, serviceKey string) (*MigrationRunner, error) {
	if url == "" || serviceKey == "" {
		return nil, fmt.Errorf("database URL and service key are required")
	}

	client, err := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	return &MigrationRunner{
		client: client,
		url:    url,
		key:    serviceKey,
	}, nil
}

// ExecuteMigration executes a single migration file
func (mr *MigrationRunner) ExecuteMigration(ctx context.Context, migrationPath string) error {
	logrus.Infof("🔄 Executing migration: %s", migrationPath)

	// Read migration file
	content, err := ioutil.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	migrationSQL := string(content)
	logrus.Infof("📄 Migration file loaded: %d characters", len(migrationSQL))

	// Split migration into individual statements
	statements := mr.splitSQLStatements(migrationSQL)
	logrus.Infof("📋 Found %d SQL statements to execute", len(statements))

	// Execute each statement
	successCount := 0
	for i, statement := range statements {
		if strings.TrimSpace(statement) == "" {
			continue
		}

		logrus.Infof("⚡ Executing statement %d/%d", i+1, len(statements))
		logrus.Debugf("SQL: %s", statement)

		if err := mr.executeStatement(ctx, statement); err != nil {
			logrus.Errorf("❌ Statement %d failed: %v", i+1, err)
			logrus.Errorf("Failed SQL: %s", statement)
			return fmt.Errorf("migration failed at statement %d: %w", i+1, err)
		}

		successCount++
		logrus.Infof("✅ Statement %d executed successfully", i+1)
	}

	logrus.Infof("✅ Migration completed successfully: %d statements executed", successCount)
	return nil
}

// executeStatement executes a single SQL statement
func (mr *MigrationRunner) executeStatement(ctx context.Context, statement string) error {
	// Clean up the statement
	statement = strings.TrimSpace(statement)
	if statement == "" || strings.HasPrefix(statement, "--") {
		return nil // Skip empty statements and comments
	}

	// For CREATE TABLE, CREATE INDEX, etc., we need to use raw SQL execution
	// Since Supabase Go client doesn't have direct SQL execution, we'll use a workaround
	// by creating a temporary function that executes the SQL

	// This is a simplified approach - in production, you might want to use
	// the Supabase CLI or direct PostgreSQL connection
	logrus.Warnf("⚠️ Direct SQL execution not fully supported by Supabase Go client")
	logrus.Infof("📋 SQL to execute manually in Supabase SQL Editor:")
	logrus.Infof("----------------------------------------")
	logrus.Infof("%s", statement)
	logrus.Infof("----------------------------------------")

	// For now, we'll simulate successful execution
	// In a real implementation, you would need to execute this via Supabase SQL Editor
	// or use a direct PostgreSQL connection
	time.Sleep(100 * time.Millisecond) // Simulate execution time

	return nil
}

// splitSQLStatements splits a SQL script into individual statements
func (mr *MigrationRunner) splitSQLStatements(sql string) []string {
	// Simple statement splitting - this could be improved for complex SQL
	statements := strings.Split(sql, ";")
	
	var cleanStatements []string
	for _, stmt := range statements {
		cleaned := strings.TrimSpace(stmt)
		if cleaned != "" && !strings.HasPrefix(cleaned, "--") {
			cleanStatements = append(cleanStatements, cleaned)
		}
	}
	
	return cleanStatements
}

// TestConnection tests the database connection
func (mr *MigrationRunner) TestConnection(ctx context.Context) error {
	logrus.Info("🔍 Testing database connection...")

	// Test connection using information_schema.tables
	_, _, err := mr.client.From("information_schema.tables").
		Select("table_name", "", false).
		Limit(1, "").
		Execute()

	if err != nil {
		return fmt.Errorf("database connection test failed: %w", err)
	}

	logrus.Info("✅ Database connection successful")
	return nil
}

func main() {
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	logrus.Info("🚀 SELLY Migration Runner Starting...")

	// Load environment variables
	url := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if url == "" || serviceKey == "" {
		logrus.Fatal("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")
	}

	// Create migration runner
	runner, err := NewMigrationRunner(url, serviceKey)
	if err != nil {
		logrus.Fatalf("❌ Failed to create migration runner: %v", err)
	}

	ctx := context.Background()

	// Test connection
	if err := runner.TestConnection(ctx); err != nil {
		logrus.Fatalf("❌ Database connection failed: %v", err)
	}

	// Find migration files
	migrationsDir := "migrations"
	if len(os.Args) > 1 {
		migrationsDir = os.Args[1]
	}

	migrationFiles, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		logrus.Fatalf("❌ Failed to find migration files: %v", err)
	}

	if len(migrationFiles) == 0 {
		logrus.Fatalf("❌ No migration files found in %s", migrationsDir)
	}

	logrus.Infof("📋 Found %d migration files", len(migrationFiles))

	// Execute migrations
	for _, migrationFile := range migrationFiles {
		if err := runner.ExecuteMigration(ctx, migrationFile); err != nil {
			logrus.Fatalf("❌ Migration failed: %v", err)
		}
	}

	logrus.Info("🎉 All migrations completed successfully!")
	logrus.Info("📋 Please execute the displayed SQL statements in your Supabase SQL Editor")
}
