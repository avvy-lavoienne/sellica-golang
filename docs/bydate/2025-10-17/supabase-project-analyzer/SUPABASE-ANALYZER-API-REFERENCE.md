# Supabase Analyzer - API Reference

## Base URL
```
http://localhost:8080/api/v1/supabase
```

## Authentication
Currently public (no authentication required). Add middleware in production.

---

## Endpoints

### 1. GET /analyze
Comprehensive analysis of Supabase project

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tables` | boolean | true | Include table analysis |
| `buckets` | boolean | true | Include bucket analysis |
| `columns` | boolean | true | Include column details |

#### Examples
```bash
# Full analysis
curl "http://localhost:8080/api/v1/supabase/analyze"

# Fast (no columns)
curl "http://localhost:8080/api/v1/supabase/analyze?columns=false"

# Tables only
curl "http://localhost:8080/api/v1/supabase/analyze?buckets=false"

# Buckets only
curl "http://localhost:8080/api/v1/supabase/analyze?tables=false"
```

#### Response Schema
```json
{
  "project_url": "string (URL of Supabase project)",
  "timestamp": "string (ISO 8601 timestamp)",
  "schema": "string (database schema, typically 'public')",
  "table_count": "integer",
  "bucket_count": "integer",
  "total_records": "integer (sum of all table rows)",
  "total_size_gb": "number (total storage in GB)",
  "tables": [
    {
      "name": "string",
      "schema": "string",
      "row_count": "integer",
      "size_bytes": "integer",
      "columns": [
        {
          "name": "string",
          "data_type": "string (e.g., 'uuid', 'text', 'bigint')",
          "is_nullable": "boolean",
          "default_value": "string | null",
          "is_primary_key": "boolean",
          "is_foreign_key": "boolean",
          "foreign_key_ref": "string | null (table.column)",
          "character_maximum_length": "integer | null",
          "numeric_precision": "integer | null"
        }
      ],
      "constraints": ["string (constraint descriptions)"]
    }
  ],
  "buckets": [
    {
      "id": "string",
      "name": "string",
      "is_public": "boolean",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)",
      "size_bytes": "integer",
      "file_count": "integer"
    }
  ]
}
```

#### Response Codes
- `200 OK` - Analysis successful
- `500 Internal Server Error` - Database connection failure

---

### 2. GET /overview
Quick project overview (without column details)

#### Query Parameters
None

#### Examples
```bash
curl "http://localhost:8080/api/v1/supabase/overview"
```

#### Response
Same as `/analyze` but without column details in tables array

#### Performance
Typically 50% faster than `/analyze` (excludes column metadata)

---

### 3. GET /tables/:name
Get statistics for a specific table

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Table name (URL encoded) |

#### Examples
```bash
# Specific table
curl "http://localhost:8080/api/v1/supabase/tables/silpana_tickets"

# URL encoded special characters
curl "http://localhost:8080/api/v1/supabase/tables/user%20data"
```

#### Response Schema
```json
{
  "name": "string",
  "schema": "string",
  "row_count": "integer",
  "size_bytes": "integer",
  "columns": [
    {
      "name": "string",
      "data_type": "string",
      "is_nullable": "boolean",
      "default_value": "string | null",
      "is_primary_key": "boolean",
      "is_foreign_key": "boolean",
      "foreign_key_ref": "string | null",
      "character_maximum_length": "integer | null",
      "numeric_precision": "integer | null"
    }
  ],
  "constraints": ["string"]
}
```

#### Response Codes
- `200 OK` - Table found and analyzed
- `400 Bad Request` - Table name not provided
- `500 Internal Server Error` - Database error

---

### 4. GET /buckets
List all storage buckets

#### Query Parameters
None

#### Examples
```bash
curl "http://localhost:8080/api/v1/supabase/buckets"
```

#### Response Schema
```json
{
  "buckets": [
    {
      "id": "string",
      "name": "string",
      "is_public": "boolean",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)",
      "size_bytes": "integer",
      "file_count": "integer"
    }
  ],
  "count": "integer"
}
```

#### Response Codes
- `200 OK` - Buckets retrieved
- `500 Internal Server Error` - Storage access error

---

## Data Types

### Column Data Types
Common PostgreSQL types returned in `data_type`:
- `uuid` - Universal unique identifier
- `text` - Variable-length text
- `varchar(n)` - Fixed-length text
- `bigint` - Large integer (-9223372036854775808 to 9223372036854775807)
- `integer` - 32-bit integer
- `smallint` - 16-bit integer
- `decimal(p,s)` - Fixed-point decimal
- `numeric(p,s)` - Numeric with precision
- `boolean` - True/false
- `timestamp` - Date and time
- `date` - Date only
- `json` - JSON object/array
- `jsonb` - Binary JSON
- `bytea` - Binary data
- `interval` - Time interval

### Size Units
- `size_bytes` - In bytes (1 KB = 1024 bytes)
- `total_size_gb` - In gigabytes (1 GB = 1073741824 bytes)

### Timestamp Format
All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`

---

## Usage Patterns

### PowerShell/Windows

```powershell
# Get full analysis
$response = Invoke-RestMethod "http://localhost:8080/api/v1/supabase/analyze"

# Display summary
Write-Host "Project has $($response.table_count) tables and $($response.bucket_count) buckets"
Write-Host "Total size: $($response.total_size_gb) GB with $($response.total_records) records"

# List all tables
$response.tables | ForEach-Object {
    $size_mb = [Math]::Round($_.size_bytes / 1mb, 2)
    Write-Host "$($_.name): $($_.row_count) rows, $size_mb MB"
}

# List buckets
$response.buckets | ForEach-Object {
    $size_gb = [Math]::Round($_.size_bytes / 1gb, 2)
    Write-Host "$($_.name): $($_.file_count) files, $size_gb GB"
}
```

### JavaScript/TypeScript

```typescript
// Fetch analysis
const analysis = await fetch('http://localhost:8080/api/v1/supabase/analyze')
    .then(r => r.json());

// Display table info
analysis.tables.forEach(table => {
    console.log(`${table.name}: ${table.row_count} rows, ${(table.size_bytes / 1024 / 1024).toFixed(2)} MB`);
});

// Find largest tables
const largestTables = analysis.tables
    .sort((a, b) => b.size_bytes - a.size_bytes)
    .slice(0, 5)
    .map(t => ({
        name: t.name,
        size_mb: (t.size_bytes / 1024 / 1024).toFixed(2)
    }));

console.log(largestTables);
```

### Python

```python
import requests
import json

# Fetch analysis
response = requests.get('http://localhost:8080/api/v1/supabase/analyze')
analysis = response.json()

# Summary
print(f"Tables: {analysis['table_count']}")
print(f"Buckets: {analysis['bucket_count']}")
print(f"Total Size: {analysis['total_size_gb']} GB")

# Tables by size
tables_by_size = sorted(
    analysis['tables'],
    key=lambda t: t['size_bytes'],
    reverse=True
)

for table in tables_by_size[:5]:
    size_mb = table['size_bytes'] / 1024 / 1024
    print(f"{table['name']}: {table['row_count']} rows ({size_mb:.2f} MB)")
```

---

## Error Responses

### Connection Error
```json
{
  "error": "Failed to analyze Supabase project",
  "details": "database connection not available"
}
```
**Status**: 500  
**Cause**: Database/Supabase connection failed

### Invalid Table Name
```json
{
  "error": "Table name is required"
}
```
**Status**: 400  
**Cause**: Missing `:name` parameter

### Access Denied
```json
{
  "error": "Failed to analyze Supabase project",
  "details": "permission denied for schema public"
}
```
**Status**: 500  
**Cause**: Service role key has insufficient permissions

---

## Performance Tips

### 1. Use Appropriate Endpoint
```bash
# Slow: Full analysis with columns
GET /analyze

# Fast: Overview without columns (50% faster)
GET /overview

# Fastest: Single table
GET /tables/my_table
```

### 2. Query Selectively
```bash
# Instead of full analysis
GET /analyze

# Query only what you need
GET /analyze?tables=true&buckets=false&columns=false
```

### 3. Cache Results
```typescript
// Add caching in your client
const cacheKey = 'supabase_analysis';
const cached = localStorage.getItem(cacheKey);
if (cached && Date.now() - JSON.parse(cached).timestamp < 5 * 60 * 1000) {
    // Use cached data
    return JSON.parse(cached).data;
}

// Fetch fresh data
const fresh = await fetch('...').then(r => r.json());
localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    data: fresh
}));
```

---

## Rate Limiting
Currently no rate limiting. In production, consider:
- 10 requests/minute for full `/analyze`
- 100 requests/minute for specific table queries
- 1000 requests/minute for `/overview`

---

## Versioning
Current API version: **v1**

All endpoints under `/api/v1/supabase`

---

## Support

For issues or questions:
1. Check `SUPABASE-ANALYZER-QUICKSTART.md` for common solutions
2. Review `2025-10-17-SUPABASE-ANALYZER-SERVICE.md` for detailed docs
3. Check backend logs: `go run cmd/server/main.go 2>&1 | grep -i analyzer`

---

**Last Updated**: 2025-10-17  
**API Version**: 1.0  
**Status**: Stable
