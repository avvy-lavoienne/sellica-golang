package supabase_analyzer

// TableInfo contains metadata about a database table
type TableInfo struct {
	Name       string        `json:"name"`
	Schema     string        `json:"schema"`
	RowCount   int64         `json:"row_count"`
	SizeBytes  int64         `json:"size_bytes"`
	Columns    []ColumnInfo  `json:"columns"`
	Constraints []string     `json:"constraints"`
}

// ColumnInfo contains metadata about a database column
type ColumnInfo struct {
	Name           string      `json:"name"`
	DataType       string      `json:"data_type"`
	IsNullable     bool        `json:"is_nullable"`
	DefaultValue   *string     `json:"default_value,omitempty"`
	IsPrimaryKey   bool        `json:"is_primary_key"`
	IsForeignKey   bool        `json:"is_foreign_key"`
	ForeignKeyRef  *string     `json:"foreign_key_ref,omitempty"`
	CharMaxLength  *int        `json:"character_maximum_length,omitempty"`
	NumericPrecision *int      `json:"numeric_precision,omitempty"`
}

// BucketInfo contains metadata about a storage bucket
type BucketInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	IsPublic    bool   `json:"is_public"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
	SizeBytes   int64  `json:"size_bytes"`
	FileCount   int    `json:"file_count"`
}

// ProjectAnalysis contains the complete analysis of a Supabase project
type ProjectAnalysis struct {
	ProjectURL    string         `json:"project_url"`
	Timestamp     string         `json:"timestamp"`
	Tables        []TableInfo    `json:"tables"`
	Buckets       []BucketInfo   `json:"buckets"`
	TotalSizeGB   float64        `json:"total_size_gb"`
	TotalRecords  int64          `json:"total_records"`
	TableCount    int            `json:"table_count"`
	BucketCount   int            `json:"bucket_count"`
	Schema        string         `json:"schema"`
}

// AnalysisFilter allows filtering the analysis
type AnalysisFilter struct {
	IncludeTables   bool
	IncludeBuckets  bool
	IncludeColumns  bool
	SchemaName      string // empty means all schemas except pg_* and information_schema
	MaxTableResults int    // 0 means no limit
}

// StorageObject represents a file in a bucket
type StorageObject struct {
	Name      string `json:"name"`
	Id        string `json:"id"`
	UpdatedAt string `json:"updated_at"`
	CreatedAt string `json:"created_at"`
	LastModifiedTime string `json:"last_modified_time,omitempty"`
	Metadata  interface{} `json:"metadata,omitempty"`
	Buckets   string `json:"buckets,omitempty"`
}
