# Quick Start: Supabase Project Analyzer

## Starting the Backend

```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```

You'll see:
```
🔍 Supabase analyzer service initialized successfully
```

## Testing the Analyzer

### 1. Quick Overview (Fastest)
```bash
curl "http://localhost:8080/api/v1/supabase/overview"
```

### 2. Full Analysis (With Column Details)
```bash
curl "http://localhost:8080/api/v1/supabase/analyze?tables=true&buckets=true&columns=true"
```

### 3. Tables Only (No Buckets)
```bash
curl "http://localhost:8080/api/v1/supabase/analyze?tables=true&buckets=false"
```

### 4. Specific Table Stats
```bash
curl "http://localhost:8080/api/v1/supabase/tables/silpana_tickets"
```

### 5. List All Buckets
```bash
curl "http://localhost:8080/api/v1/supabase/buckets"
```

## PowerShell Examples

```powershell
# Full analysis
$analysis = Invoke-RestMethod "http://localhost:8080/api/v1/supabase/analyze"
$analysis | ConvertTo-Json -Depth 10 | Out-File analysis.json

# Get all tables
$tables = $analysis.tables | Select-Object name, row_count, @{n="size_mb";e={[Math]::Round($_.size_bytes/1mb,2)}}
$tables | Format-Table

# Bucket summary
$buckets = $analysis.buckets | Select-Object name, file_count, @{n="size_gb";e={[Math]::Round($_.size_bytes/1gb,2)}}
$buckets | Format-Table
```

## What It Returns

### Tables
- **name**: Table name
- **row_count**: Number of rows
- **size_bytes**: Storage used
- **columns**: Array of column definitions
- **constraints**: List of constraints

### Buckets
- **name**: Bucket name
- **file_count**: Number of files
- **size_bytes**: Total storage used
- **is_public**: Public/private access
- **created_at**: Creation timestamp

## Common Queries

### Find Largest Tables
```bash
curl "http://localhost:8080/api/v1/supabase/analyze" | \
  jq '.tables | sort_by(.size_bytes) | reverse | .[0:5] | .[] | "\(.name): \(.size_bytes) bytes, \(.row_count) rows"'
```

### Count Total Data
```bash
curl "http://localhost:8080/api/v1/supabase/analyze" | \
  jq '.total_records, .total_size_gb'
```

### Check Bucket Usage
```bash
curl "http://localhost:8080/api/v1/supabase/buckets" | \
  jq '.buckets | map({name, size_gb: (.size_bytes/1073741824 | round)}) | .[] | "\(.name): \(.size_gb) GB"'
```

## Troubleshooting

### Service not initialized
Check if `.env` has Supabase credentials:
```bash
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-key"
```

### Empty results
- Verify database connection: `GET /health`
- Check RLS policies: `SELECT * FROM information_schema.tables LIMIT 1`
- Ensure service role key has proper permissions

### Slow responses
- Use `/overview` endpoint instead of `/analyze`
- Query specific table instead of full project
- Add `?columns=false` to skip column details

---

For complete documentation, see `2025-10-17-SUPABASE-ANALYZER-SERVICE.md`
