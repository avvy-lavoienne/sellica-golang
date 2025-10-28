# Line Chart Data: Critical Bug - Wrong Date Columns Being Queried

**Document**: Line Chart Critical Bug - Wrong Date Columns
**Project Date**: 2025-10-28
**Created**: 2025-10-28
**Version**: 1.0
**Status**: 🚨 CRITICAL BUG FOUND
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Bug Report

## Executive Summary

**CRITICAL BUG FOUND**: The backend is querying the **wrong date column** for three out of four data-rekam tables, causing all monthly/yearly aggregations to be completely inaccurate.

## The Bug

### Current (Wrong) Implementation

File: `backend/internal/services/database/data_rekam.go`

**GetMonthlyBreakdown() - Lines 415-418**:
```go
for _, tableName := range tables {
    query := s.client.From(tableName).Select("created_at", "exact", false)
    // ❌ WRONG: Uses "created_at" for ALL tables
```

**GetYearlyBreakdown() - Lines 554-557**:
```go
for _, tableName := range tables {
    query := s.client.From(tableName).Select("created_at", "exact", false)
    // ❌ WRONG: Uses "created_at" for ALL tables
```

### The Problem

Each table has a **different date column** that should be used:

| Table | Correct Column | Current Query | Status |
|-------|----------------|---------------|--------|
| `pengajuan_bulanan` | `tanggal_pengajuan` | `created_at` | ❌ **WRONG** |
| `duplicate_operator` | `tanggal_pengajuan` | `created_at` | ❌ **WRONG** |
| `adjudicate_record` | `tanggal_pengajuan` | `created_at` | ❌ **WRONG** |
| `salah_rekam` | `created_at` | `created_at` | ✅ Correct |

### Why This Causes Wrong Data

**Example Scenario**:

```
pengajuan_bulanan table records:
- Record 1: tanggal_pengajuan = "2024-01-15", created_at = "2025-10-28" (submitted Jan 2024, recorded Oct 2025)
- Record 2: tanggal_pengajuan = "2024-02-20", created_at = "2025-10-28"
- Record 3: tanggal_pengajuan = "2024-03-10", created_at = "2025-10-28"

What the chart shows now (WRONG):
- October 2025: 3 submissions ❌
- January 2024: 0 submissions ❌
- February 2024: 0 submissions ❌
- March 2024: 0 submissions ❌

What the chart should show (CORRECT):
- October 2025: 0 submissions ✅
- January 2024: 1 submission ✅
- February 2024: 1 submission ✅
- March 2024: 1 submission ✅
```

## Impact

### What's Broken

- ❌ Monthly chart shows data from wrong time periods
- ❌ Yearly aggregations are wrong (all 3 tables aggregated by creation date, not submission date)
- ❌ Date range filtering doesn't work correctly
- ❌ Monthly filter shows wrong data for 2024 vs 2025
- ❌ User sees "October 2025" having data that was actually submitted in Jan-Mar 2024

### Why 2024 and 2025 Show Same Amount

When you select different years:
1. All records from `pengajuan_bulanan`, `duplicate_operator`, `adjudicate_record` were **created on the same day** (when batch loaded)
2. They all fall into the same month/year in the aggregation
3. Different years show the same total because they're all aggregated by `created_at`, not by their actual submission dates
4. So 2024 and 2025 both show the same records

## The Fix

### Backend: GetMonthlyBreakdown()

Replace the hardcoded `created_at` query with table-specific date columns:

```go
// GetMonthlyBreakdown returns monthly aggregated count across all data-rekam tables combined
func (s *Service) GetMonthlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Define which date column to use for each table
	tables := []struct {
		name      string // Table name
		dateCol   string // Date column to query
	}{
		{"adjudicate_record", "tanggal_pengajuan"},
		{"duplicate_operator", "tanggal_pengajuan"},
		{"salah_rekam", "created_at"},
		{"pengajuan_bulanan", "tanggal_pengajuan"},
	}

	monthlyStats := make(map[string]int) // Key: "YYYY-MM", Value: count

	for _, tableInfo := range tables {
		// SELECT the correct date column for each table
		query := s.client.From(tableInfo.name).Select(tableInfo.dateCol, "exact", false)

		if startDate != nil {
			query = query.Gte(tableInfo.dateCol, *startDate)  // Filter by correct column
		}
		if endDate != nil {
			query = query.Lte(tableInfo.dateCol, *endDate)    // Filter by correct column
		}

		data, _, err := query.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to get monthly breakdown")
			continue
		}

		// Unmarshal raw JSON data
		var records []map[string]interface{}
		if err := json.Unmarshal(data, &records); err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to unmarshal monthly breakdown data")
			continue
		}

		// Process records to extract date from the correct column
		for _, record := range records {
			var dateStr string
			
			// Get date from the appropriate column
			if dateStrValue, ok := record[tableInfo.dateCol].(string); ok {
				dateStr = dateStrValue
			} else {
				continue // Skip if column not found
			}

			// Parse date with time.Time (with fallbacks)
			var parsedTime time.Time
			var err error
			
			// Try RFC3339Nano format first
			parsedTime, err = time.Parse(time.RFC3339Nano, dateStr)
			if err != nil {
				// Fallback to RFC3339
				parsedTime, err = time.Parse(time.RFC3339, dateStr)
				if err != nil {
					// Fallback to ISO8601
					parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", dateStr)
					if err != nil {
						// Last resort: try date-only format (YYYY-MM-DD)
						parsedTime, err = time.Parse("2006-01-02", dateStr)
						if err != nil {
							logrus.WithError(err).WithFields(logrus.Fields{
								"table":  tableInfo.name,
								"column": tableInfo.dateCol,
								"value":  dateStr,
							}).Debug("Failed to parse date")
							continue
						}
					}
				}
			}
			
			// Extract year-month
			yearMonth := parsedTime.Format("2006-01")
			monthlyStats[yearMonth]++
		}
	}

	// Convert map to sorted slice
	var result []map[string]interface{}
	var keys []string
	for k := range monthlyStats {
		keys = append(keys, k)
	}
	
	// Sort keys
	for i := 0; i < len(keys)-1; i++ {
		for j := i + 1; j < len(keys); j++ {
			if keys[j] < keys[i] {
				keys[i], keys[j] = keys[j], keys[i]
			}
		}
	}

	for _, yearMonth := range keys {
		parts := strings.Split(yearMonth, "-")
		year := 0
		month := 0
		if len(parts) >= 2 {
			fmt.Sscanf(parts[0], "%d", &year)
			fmt.Sscanf(parts[1], "%d", &month)
		}

		result = append(result, map[string]interface{}{
			"year":  year,
			"month": month,
			"count": monthlyStats[yearMonth],
		})
	}

	return result, nil
}
```

### Backend: GetYearlyBreakdown()

Apply the same fix for yearly aggregation:

```go
// GetYearlyBreakdown returns yearly aggregated count across all data-rekam tables combined
func (s *Service) GetYearlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
	if !s.isHealthy {
		return nil, ErrDatabaseNotHealthy
	}

	// Define which date column to use for each table
	tables := []struct {
		name      string // Table name
		dateCol   string // Date column to query
	}{
		{"adjudicate_record", "tanggal_pengajuan"},
		{"duplicate_operator", "tanggal_pengajuan"},
		{"salah_rekam", "created_at"},
		{"pengajuan_bulanan", "tanggal_pengajuan"},
	}

	yearlyStats := make(map[int]int) // Key: year, Value: count

	for _, tableInfo := range tables {
		// SELECT the correct date column for each table
		query := s.client.From(tableInfo.name).Select(tableInfo.dateCol, "exact", false)

		if startDate != nil {
			query = query.Gte(tableInfo.dateCol, *startDate)
		}
		if endDate != nil {
			query = query.Lte(tableInfo.dateCol, *endDate)
		}

		data, _, err := query.Execute()
		if err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to get yearly breakdown")
			continue
		}

		// Unmarshal raw JSON data
		var records []map[string]interface{}
		if err := json.Unmarshal(data, &records); err != nil {
			logrus.WithError(err).WithField("table", tableInfo.name).Warn("Failed to unmarshal yearly breakdown data")
			continue
		}

		// Process records to extract date from the correct column
		for _, record := range records {
			var dateStr string
			
			// Get date from the appropriate column
			if dateStrValue, ok := record[tableInfo.dateCol].(string); ok {
				dateStr = dateStrValue
			} else {
				continue // Skip if column not found
			}

			// Parse date with time.Time
			var parsedTime time.Time
			var err error
			
			parsedTime, err = time.Parse(time.RFC3339Nano, dateStr)
			if err != nil {
				parsedTime, err = time.Parse(time.RFC3339, dateStr)
				if err != nil {
					parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", dateStr)
					if err != nil {
						parsedTime, err = time.Parse("2006-01-02", dateStr)
						if err != nil {
							logrus.WithError(err).WithFields(logrus.Fields{
								"table":  tableInfo.name,
								"column": tableInfo.dateCol,
								"value":  dateStr,
							}).Debug("Failed to parse date")
							continue
						}
					}
				}
			}
			
			// Extract year
			year := parsedTime.Year()
			yearlyStats[year]++
		}
	}

	// Convert map to sorted slice
	var result []map[string]interface{}
	var years []int
	for y := range yearlyStats {
		years = append(years, y)
	}

	// Sort years numerically
	for i := 0; i < len(years)-1; i++ {
		for j := i + 1; j < len(years); j++ {
			if years[j] < years[i] {
				years[i], years[j] = years[j], years[i]
			}
		}
	}

	for _, year := range years {
		result = append(result, map[string]interface{}{
			"year":  year,
			"count": yearlyStats[year],
		})
	}

	return result, nil
}
```

## Expected Result After Fix

**Before (Wrong)**:
```
2024: 3 records (all from Oct 2025 created_at)
2025: 3 records (all from Oct 2025 created_at)
October 2025: 6 records
```

**After (Correct)**:
```
2024: 3 records (from tanggal_pengajuan in Jan-Mar 2024)
2025: 0 records (no submissions in 2025 yet)
January 2024: 1 record
February 2024: 1 record
March 2024: 1 record
```

## Files to Modify

1. `backend/internal/services/database/data_rekam.go`
   - GetMonthlyBreakdown() function (lines 405-502)
   - GetYearlyBreakdown() function (lines 509-615)

## Testing After Fix

After applying the fix, verify:

1. ✅ Chart displays data from correct time periods
2. ✅ 2024 shows January-March records
3. ✅ 2025 shows October-current records
4. ✅ Different years show different aggregations
5. ✅ Monthly filter works per year
6. ✅ Date range filtering is accurate

## Root Cause Analysis

Why was this bug introduced?

The original implementation was written with the assumption that all tables have a `created_at` column, but the actual business logic requires using the **submission/application dates** (`tanggal_pengajuan`) rather than when records were created in the system.

This is a **data semantics issue**: We want to show when data was submitted, not when it was recorded.

---

**Status**: 🚨 CRITICAL BUG - Ready for Fix Implementation
**Severity**: Critical (affects all chart data accuracy)
**Impact**: All monthly/yearly aggregations are wrong
**Fix Complexity**: Medium (need to refactor table-specific logic)
**Testing Required**: High (need to verify with real data)

**Last Updated**: 2025-10-28
**Phase**: Phase 4 - Chart Data Critical Bug Fix
