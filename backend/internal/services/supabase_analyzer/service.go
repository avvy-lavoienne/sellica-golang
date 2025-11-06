package supabase_analyzer

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/supabase-community/supabase-go"
)

// Service provides Supabase project analysis capabilities
type Service struct {
	client *supabase.Client
	db     *sql.DB
	url    string
}

// NewService creates a new Supabase analyzer service
func NewService(client *supabase.Client, db *sql.DB, url string) *Service {
	return &Service{
		client: client,
		db:     db,
		url:    url,
	}
}

// AnalyzeProject performs a comprehensive analysis of the Supabase project
func (s *Service) AnalyzeProject(ctx context.Context, filter AnalysisFilter) (*ProjectAnalysis, error) {
	logrus.Info("Starting Supabase project analysis...")

	analysis := &ProjectAnalysis{
		ProjectURL: s.url,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		Tables:     []TableInfo{},
		Buckets:    []BucketInfo{},
		Schema:     "public",
	}

	// Analyze tables if requested
	if filter.IncludeTables {
		tables, err := s.analyzeTables(ctx, filter)
		if err != nil {
			logrus.Errorf("Error analyzing tables: %v", err)
		} else {
			analysis.Tables = tables
			analysis.TableCount = len(tables)

			// Calculate totals
			for _, table := range tables {
				analysis.TotalRecords += table.RowCount
				analysis.TotalSizeGB += float64(table.SizeBytes) / (1024 * 1024 * 1024)
			}
		}
	}

	// Analyze buckets if requested
	if filter.IncludeBuckets {
		buckets, err := s.analyzeBuckets(ctx)
		if err != nil {
			logrus.Errorf("Error analyzing buckets: %v", err)
		} else {
			analysis.Buckets = buckets
			analysis.BucketCount = len(buckets)

			// Add bucket storage to total
			for _, bucket := range buckets {
				analysis.TotalSizeGB += float64(bucket.SizeBytes) / (1024 * 1024 * 1024)
			}
		}
	}

	logrus.Infof("✅ Supabase project analysis complete: %d tables, %d buckets, %.2f GB total", 
		analysis.TableCount, analysis.BucketCount, analysis.TotalSizeGB)

	return analysis, nil
}

// analyzeTables retrieves and analyzes all database tables
func (s *Service) analyzeTables(ctx context.Context, filter AnalysisFilter) ([]TableInfo, error) {
	if s.db == nil {
		logrus.Warn("Database connection not available for table analysis - returning empty list")
		return []TableInfo{}, nil
	}

	schema := filter.SchemaName
	if schema == "" {
		schema = "public"
	}

	// Query to get table metadata
	query := `
		SELECT 
			t.table_name,
			t.table_schema,
			pg_total_relation_size(to_regclass(t.table_schema || '.' || t.table_name))::bigint as size_bytes,
			(SELECT count(*) FROM information_schema.tables 
			 WHERE table_schema = t.table_schema AND table_name = t.table_name) > 0 as exists
		FROM information_schema.tables t
		WHERE t.table_schema = $1
		ORDER BY t.table_name
	`

	rows, err := s.db.QueryContext(ctx, query, schema)
	if err != nil {
		return nil, fmt.Errorf("failed to query tables: %w", err)
	}
	defer rows.Close()

	var tables []TableInfo
	maxResults := filter.MaxTableResults
	if maxResults == 0 {
		maxResults = 1000 // default limit
	}

	for rows.Next() && (maxResults <= 0 || len(tables) < maxResults) {
		var tableName, tableSchema string
		var sizeBytes int64
		var exists bool

		if err := rows.Scan(&tableName, &tableSchema, &sizeBytes, &exists); err != nil {
			logrus.Errorf("Error scanning table row: %v", err)
			continue
		}

		tableInfo := TableInfo{
			Name:        tableName,
			Schema:      tableSchema,
			SizeBytes:   sizeBytes,
			Columns:     []ColumnInfo{},
			Constraints: []string{},
		}

		// Get columns for this table
		if filter.IncludeColumns {
			columns, err := s.getTableColumns(ctx, schema, tableName)
			if err != nil {
				logrus.Warnf("Error getting columns for table %s: %v", tableName, err)
			} else {
				tableInfo.Columns = columns
			}
		}

		// Get row count
		rowCount, err := s.getTableRowCount(ctx, schema, tableName)
		if err != nil {
			logrus.Warnf("Error getting row count for table %s: %v", tableName, err)
		} else {
			tableInfo.RowCount = rowCount
		}

		tables = append(tables, tableInfo)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading table rows: %w", err)
	}

	return tables, nil
}

// getTableColumns retrieves column metadata for a specific table
func (s *Service) getTableColumns(ctx context.Context, schema, tableName string) ([]ColumnInfo, error) {
	query := `
		SELECT 
			c.column_name,
			c.data_type,
			c.is_nullable = 'YES' as is_nullable,
			c.column_default,
			(pk.constraint_type = 'PRIMARY KEY') as is_primary_key,
			EXISTS (
				SELECT 1 FROM information_schema.table_constraints tc 
				JOIN information_schema.key_column_usage kcu 
					ON tc.constraint_name = kcu.constraint_name 
				WHERE tc.constraint_type = 'FOREIGN KEY' 
					AND kcu.column_name = c.column_name 
					AND kcu.table_schema = c.table_schema 
					AND kcu.table_name = c.table_name
			) as is_foreign_key,
			c.character_maximum_length,
			c.numeric_precision
		FROM information_schema.columns c
		LEFT JOIN information_schema.constraint_column_usage ccu 
			ON c.column_name = ccu.column_name 
			AND c.table_schema = ccu.table_schema 
			AND c.table_name = ccu.table_name
		LEFT JOIN information_schema.table_constraints pk 
			ON ccu.constraint_name = pk.constraint_name 
			AND pk.constraint_type = 'PRIMARY KEY'
		WHERE c.table_schema = $1 AND c.table_name = $2
		ORDER BY c.ordinal_position
	`

	rows, err := s.db.QueryContext(ctx, query, schema, tableName)
	if err != nil {
		return nil, fmt.Errorf("failed to query columns: %w", err)
	}
	defer rows.Close()

	var columns []ColumnInfo

	for rows.Next() {
		var (
			name           string
			dataType       string
			isNullable     bool
			defaultValue   sql.NullString
			isPrimaryKey   bool
			isForeignKey   bool
			charMaxLength  sql.NullInt64
			numericPrecision sql.NullInt64
		)

		if err := rows.Scan(
			&name, &dataType, &isNullable, &defaultValue, &isPrimaryKey,
			&isForeignKey, &charMaxLength, &numericPrecision,
		); err != nil {
			logrus.Errorf("Error scanning column row: %v", err)
			continue
		}

		col := ColumnInfo{
			Name:         name,
			DataType:     dataType,
			IsNullable:   isNullable,
			IsPrimaryKey: isPrimaryKey,
			IsForeignKey: isForeignKey,
		}

		if defaultValue.Valid {
			col.DefaultValue = &defaultValue.String
		}

		if charMaxLength.Valid {
			charMaxVal := int(charMaxLength.Int64)
			col.CharMaxLength = &charMaxVal
		}

		if numericPrecision.Valid {
			numPrecVal := int(numericPrecision.Int64)
			col.NumericPrecision = &numPrecVal
		}

		columns = append(columns, col)
	}

	return columns, rows.Err()
}

// getTableRowCount retrieves the row count for a specific table with timeout
func (s *Service) getTableRowCount(ctx context.Context, schema, tableName string) (int64, error) {
	// Add a 5-second timeout for row count queries to prevent hanging on large tables
	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.%s", schema, tableName)
	var count int64

	err := s.db.QueryRowContext(timeoutCtx, query).Scan(&count)
	if err != nil {
		// Log timeout separately for debugging
		if timeoutCtx.Err() != nil {
			logrus.Warnf("Row count query timed out for table %s.%s (likely large table)", schema, tableName)
			return 0, nil // Return 0 but don't error out
		}
		return 0, err
	}

	return count, nil
}

// analyzeBuckets retrieves and analyzes all storage buckets
func (s *Service) analyzeBuckets(ctx context.Context) ([]BucketInfo, error) {
	// Try SQL query first if we have a connection
	if s.db != nil {
		query := `
			SELECT 
				b.id,
				b.name,
				b.public,
				b.created_at,
				b.updated_at,
				COALESCE(SUM(o.size), 0)::bigint as total_size,
				COUNT(o.id) as file_count
			FROM storage.buckets b
			LEFT JOIN storage.objects o ON b.id = o.bucket_id
			GROUP BY b.id, b.name, b.public, b.created_at, b.updated_at
			ORDER BY b.name
		`

		rows, err := s.db.QueryContext(ctx, query)
		if err == nil {
			defer rows.Close()

			var bucketInfos []BucketInfo

			for rows.Next() {
				var (
					id        string
					name      string
					isPublic  bool
					createdAt string
					updatedAt string
					sizeBytes int64
					fileCount int
				)

				if err := rows.Scan(&id, &name, &isPublic, &createdAt, &updatedAt, &sizeBytes, &fileCount); err != nil {
					logrus.Errorf("Error scanning bucket row: %v", err)
					continue
				}

				bucketInfo := BucketInfo{
					ID:        id,
					Name:      name,
					IsPublic:  isPublic,
					CreatedAt: createdAt,
					UpdatedAt: updatedAt,
					SizeBytes: sizeBytes,
					FileCount: fileCount,
				}

				bucketInfos = append(bucketInfos, bucketInfo)
			}

			if rowErr := rows.Err(); rowErr == nil && len(bucketInfos) > 0 {
				return bucketInfos, nil // Success with SQL query
			}
			// Fall through to API method if no buckets found or rows error
		}
		// If SQL query failed, fall through to API method
	}
	
	// Fallback: use the Supabase client API
	return s.analyzeBucketsViaAPI(ctx)
}

// analyzeBucketsViaAPI is a fallback method using the Supabase Go client
func (s *Service) analyzeBucketsViaAPI(ctx context.Context) ([]BucketInfo, error) {
	if s.client == nil {
		return []BucketInfo{}, nil
	}

	// List all buckets using the storage client
	buckets, err := s.client.Storage.ListBuckets()
	if err != nil {
		logrus.Warnf("Failed to list buckets via API: %v", err)
		return []BucketInfo{}, nil
	}

	var bucketInfos []BucketInfo

	for _, bucket := range buckets {
		bucketInfo := BucketInfo{
			ID:        bucket.Id,
			Name:      bucket.Name,
			IsPublic:  bucket.Public,
			CreatedAt: bucket.CreatedAt,
			UpdatedAt: bucket.UpdatedAt,
		}

		bucketInfos = append(bucketInfos, bucketInfo)
	}

	return bucketInfos, nil
}

// getBucketObjects retrieves all objects in a bucket from the storage schema
func (s *Service) getBucketObjects(ctx context.Context, bucketName string) ([]StorageObject, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not available")
	}

	// Query the storage.objects table
	query := `
		SELECT 
			o.name,
			o.id,
			o.created_at,
			o.updated_at,
			o.size,
			o.metadata
		FROM storage.objects o
		JOIN storage.buckets b ON o.bucket_id = b.id
		WHERE b.name = $1
		ORDER BY o.name
		LIMIT 1000
	`

	rows, err := s.db.QueryContext(ctx, query, bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to query objects: %w", err)
	}
	defer rows.Close()

	var result []StorageObject

	for rows.Next() {
		var (
			name      string
			id        string
			createdAt string
			updatedAt string
			size      int64
			metadata  sql.NullString
		)

		if err := rows.Scan(&name, &id, &createdAt, &updatedAt, &size, &metadata); err != nil {
			logrus.Errorf("Error scanning object row: %v", err)
			continue
		}

		obj := StorageObject{
			Name:      name,
			Id:        id,
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		}

		if metadata.Valid {
			obj.Metadata = metadata.String
		}

		result = append(result, obj)
	}

	return result, rows.Err()
}

// GetTableStats returns statistics for a specific table
func (s *Service) GetTableStats(ctx context.Context, tableName string) (*TableInfo, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection not available for table statistics")
	}

	schema := "public"

	query := `
		SELECT 
			t.table_name,
			t.table_schema,
			pg_total_relation_size(to_regclass(t.table_schema || '.' || t.table_name))::bigint as size_bytes
		FROM information_schema.tables t
		WHERE t.table_schema = $1 AND t.table_name = $2
	`

	var info TableInfo
	var sizeBytes int64

	err := s.db.QueryRowContext(ctx, query, schema, tableName).
		Scan(&info.Name, &info.Schema, &sizeBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to get table stats: %w", err)
	}

	info.SizeBytes = sizeBytes

	// Get row count
	rowCount, err := s.getTableRowCount(ctx, schema, tableName)
	if err == nil {
		info.RowCount = rowCount
	}

	// Get columns
	columns, err := s.getTableColumns(ctx, schema, tableName)
	if err == nil {
		info.Columns = columns
	}

	return &info, nil
}

// ListBuckets returns a list of all storage buckets
func (s *Service) ListBuckets(ctx context.Context) ([]BucketInfo, error) {
	return s.analyzeBuckets(ctx)
}
