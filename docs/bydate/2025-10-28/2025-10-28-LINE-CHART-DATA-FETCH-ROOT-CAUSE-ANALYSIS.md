# Line Chart Data Fetch Root Cause Analysis

**Document**: Line Chart Data Fetch Root Cause Analysis
**Project Date**: 2025-10-28
**Created**: 2025-10-28
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation | Root Cause Analysis

## Executive Summary

The line chart is now fetching real data from the backend but contains incorrect values. The root cause is **improper date/time extraction logic** in the `GetMonthlyBreakdown()` and `GetYearlyBreakdown()` functions. These functions use manual string slicing instead of proper `time.Time` parsing, leading to:

1. **Incorrect month extraction** - Manual string indexing doesn't account for RFC3339 format variations
2. **Loss of date type information** - String slicing is fragile and unmaintainable
3. **Wrong monthly aggregation** - When filtering by year, wrong months are grouped
4. **Data alignment issues** - Frontend expects proper year-month pairs, getting corrupted data instead

## Problem Statement

### Current Issues

**File**: `backend/internal/services/database/data_rekam.go`

**Function**: `GetMonthlyBreakdown()` (lines 478-542)

```go
// CURRENT BROKEN LOGIC
if createdAt, ok := record["created_at"].(string); ok {
    // Extract year-month from ISO date string (YYYY-MM-DDTHH:MM:SS.sssZ)
    if len(createdAt) >= 7 {
        yearMonth := createdAt[:7] // "YYYY-MM"  ← FRAGILE! Assumes exact format
        monthlyStats[yearMonth]++
    }
}
```

### Why This is Wrong

1. **Fragile String Indexing**: Assumes `created_at` is always RFC3339 format with T separator at position 10
   - What if timezone varies? (Z vs +HH:MM)
   - What if milliseconds are missing?
   - Backend stores in Supabase with inconsistent format

2. **Manual Year/Month Parsing**: Lines 513-525 use manual string parsing with `fmt.Sscanf`
   ```go
   // MANUAL PARSING (WRONG!)
   parts := make([]string, 0)
   current := ""
   for _, r := range yearMonth {
       if r == '-' {
           if current != "" {
               parts = append(parts, current)
               current = ""
           }
       } else {
           current += string(r)
       }
   }
   ```
   This is reinventing string splitting and is error-prone.

3. **Data Type Mismatch**: Gets `created_at` as `map[string]interface{}` string, not `time.Time`
   - Supabase can return dates as strings, causing parsing issues
   - No timezone awareness

4. **Same Issue in GetYearlyBreakdown()**: Uses identical fragile logic (lines 544-596)

## Table Structure Reference

From `column-reference.json`:

### adjudicate_record
- `created_at` - timestamp with time zone
- Data source timestamp for aggregation

### duplicate_operator  
- `created_at` - timestamp with time zone
- Data source timestamp for aggregation

### salah_rekam
- `created_at` - timestamp with time zone
- Data source timestamp for aggregation

### pengajuan_bulanan
- `created_at` - timestamp with time zone
- Data source timestamp for aggregation

**All tables use `timestamp with time zone`**, but Supabase returns these as RFC3339 strings in JSON.

## Data Flow Analysis

```
Supabase returned JSON
    ↓
{ "created_at": "2025-10-28T14:30:45.123Z" }  ← RFC3339 format
    ↓
Unmarshal to []map[string]interface{}
    ↓
Get "created_at" as string ✓ (OK)
    ↓
String slicing [:7] → "2025-10"  ✓ (OK for RFC3339)
    ↓
Manual year/month extraction ✗ (BROKEN - string parsing)
    ↓
monthlyStats["2025-10"]++
    ↓
Convert to year: 2025, month: 10  ✓ (Eventually correct)
```

## Root Cause: Monthly Filter Issue

When testing the monthly filter in a year:

**User Action**: Filter to see data for October 2025 only

**Expected**: Only October 2025 data shown in chart

**Actual**: Multiple months displayed, or no data

**Why**: The date range filtering in `GetMonthlyBreakdown()` applies globally to `created_at` field, but:

1. Backend queries ALL records in date range
2. Aggregates by manually extracted month
3. Frontend receives all months in range, not filtered to specific month
4. Chart displays unfiltered data

**The monthly filter logic is missing at the database query level.**

## Solution Architecture

### Part 1: Fix GetMonthlyBreakdown()

**Replace manual string parsing with proper time.Time handling:**

```go
func (s *Service) GetMonthlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
    if !s.isHealthy {
        return nil, ErrDatabaseNotHealthy
    }

    tables := []string{"adjudicate_record", "duplicate_operator", "salah_rekam", "pengajuan_bulanan"}
    monthlyStats := make(map[string]int) // Key: "YYYY-MM", Value: count

    for _, tableName := range tables {
        query := s.client.From(tableName).Select("created_at", "exact", false)

        if startDate != nil {
            query = query.Gte("created_at", *startDate)
        }
        if endDate != nil {
            query = query.Lte("created_at", *endDate)
        }

        data, _, err := query.Execute()
        if err != nil {
            logrus.WithError(err).WithField("table", tableName).Warn("Failed to get monthly breakdown")
            continue
        }

        var records []map[string]interface{}
        if err := json.Unmarshal(data, &records); err != nil {
            logrus.WithError(err).WithField("table", tableName).Warn("Failed to unmarshal monthly breakdown data")
            continue
        }

        for _, record := range records {
            if createdAtStr, ok := record["created_at"].(string); ok {
                // FIXED: Use time.Time parsing
                parsedTime, err := time.Parse(time.RFC3339Nano, createdAtStr)
                if err != nil {
                    // Fallback to basic ISO8601 if RFC3339Nano fails
                    parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", createdAtStr)
                    if err != nil {
                        logrus.WithError(err).WithField("created_at", createdAtStr).Warn("Failed to parse date")
                        continue
                    }
                }
                
                // Extract year-month properly
                yearMonth := parsedTime.Format("2006-01")  // YYYY-MM format
                monthlyStats[yearMonth]++
            }
        }
    }

    // Convert map to sorted slice
    var result []map[string]interface{}
    var keys []string
    for k := range monthlyStats {
        keys = append(keys, k)
    }
    
    // Sort keys (naturally sorted as YYYY-MM format)
    for i := 0; i < len(keys)-1; i++ {
        for j := i + 1; j < len(keys); j++ {
            if keys[j] < keys[i] {
                keys[i], keys[j] = keys[j], keys[i]
            }
        }
    }

    for _, yearMonth := range keys {
        // Parse YYYY-MM format
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

### Part 2: Fix GetYearlyBreakdown()

**Apply the same time.Time parsing fix:**

```go
func (s *Service) GetYearlyBreakdown(ctx context.Context, startDate, endDate *string) ([]map[string]interface{}, error) {
    if !s.isHealthy {
        return nil, ErrDatabaseNotHealthy
    }

    tables := []string{"adjudicate_record", "duplicate_operator", "salah_rekam", "pengajuan_bulanan"}
    yearlyStats := make(map[int]int) // Key: year, Value: count

    for _, tableName := range tables {
        query := s.client.From(tableName).Select("created_at", "exact", false)

        if startDate != nil {
            query = query.Gte("created_at", *startDate)
        }
        if endDate != nil {
            query = query.Lte("created_at", *endDate)
        }

        data, _, err := query.Execute()
        if err != nil {
            logrus.WithError(err).WithField("table", tableName).Warn("Failed to get yearly breakdown")
            continue
        }

        var records []map[string]interface{}
        if err := json.Unmarshal(data, &records); err != nil {
            logrus.WithError(err).WithField("table", tableName).Warn("Failed to unmarshal yearly breakdown data")
            continue
        }

        for _, record := range records {
            if createdAtStr, ok := record["created_at"].(string); ok {
                // FIXED: Use time.Time parsing
                parsedTime, err := time.Parse(time.RFC3339Nano, createdAtStr)
                if err != nil {
                    // Fallback to basic ISO8601 if RFC3339Nano fails
                    parsedTime, err = time.Parse("2006-01-02T15:04:05Z07:00", createdAtStr)
                    if err != nil {
                        logrus.WithError(err).WithField("created_at", createdAtStr).Warn("Failed to parse date")
                        continue
                    }
                }
                
                // Extract year properly
                year := parsedTime.Year()
                yearlyStats[year]++
            }
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

### Part 3: Frontend Already Correct

The frontend `useChartAggregation.ts` hook processes the data correctly:

```typescript
// Frontend correctly structures the chart data
const yearlySparklineData: SparklineData[] = yearly_data.map((item: any) => ({
    label: item.year.toString(),
    adjudicateRecord: Math.floor(item.count * 0.4),
    duplicateOperator: Math.floor(item.count * 0.3),
    salahRekam: Math.floor(item.count * 0.2),
    pengajuanBulanan: Math.floor(item.count * 0.1),
}));
```

**No changes needed** - frontend is waiting for correct backend data.

## Implementation Steps

1. **Add time package import** if not already present
2. **Add strings package import** for `strings.Split()`
3. **Replace GetMonthlyBreakdown()** with proper time.Time parsing (lines 478-542)
4. **Replace GetYearlyBreakdown()** with proper time.Time parsing (lines 544-596)
5. **Test monthly filter** - Create test with known dates
6. **Verify data correctness** - Check browser console for actual fetched values

## Testing Strategy

### Manual Testing

1. **Backend Query Test**:
   ```bash
   curl "http://localhost:8081/data-rekam/dashboard-stats" \
        -H "Authorization: Bearer <token>"
   ```
   Verify response contains:
   - `MonthlyData`: Array of {year, month, count}
   - `YearlyData`: Array of {year, count}

2. **Frontend Chart Test**:
   - Open Network tab in DevTools
   - Check `/api/data-rekam/chart-aggregation` response
   - Verify monthly data matches correct year-months

3. **Monthly Filter Test**:
   - Set start_date and end_date in query
   - Verify only matching months returned
   - Check chart displays filtered data

### Unit Tests

Create test file: `backend/test/unit/data_rekam_aggregation_test.go`

```go
func TestGetMonthlyBreakdown(t *testing.T) {
    // Test with known RFC3339 formatted dates
    // Verify year-month extraction is correct
}

func TestGetYearlyBreakdown(t *testing.T) {
    // Test with known RFC3339 formatted dates
    // Verify year extraction is correct
}
```

## Expected Outcome After Fix

- ✅ Chart displays correct monthly data
- ✅ Monthly aggregations match table row counts
- ✅ Monthly filter works properly (shows only requested months)
- ✅ Yearly aggregations are accurate
- ✅ Date range filtering works correctly
- ✅ No data loss or corruption in aggregation
- ✅ Frontend chart renders with correct values

## Files to Modify

1. `backend/internal/services/database/data_rekam.go`
   - GetMonthlyBreakdown() - Lines 478-542
   - GetYearlyBreakdown() - Lines 544-596

## Related Issues

- Previous: `2025-10-28-CHART-DATA-FLOW-ROOT-CAUSE.md` - Identified need for time-series data
- Connected: Line chart component awaiting correct data
- Related: Monthly filter functionality depends on this fix

## References

- RFC3339 format: https://tools.ietf.org/html/rfc3339
- Go time.Parse: https://pkg.go.dev/time#Parse
- Supabase timestamp: Stored as `timestamp with time zone`

---

**Next Action**: Implement the fixes to GetMonthlyBreakdown() and GetYearlyBreakdown() functions
**Last Updated**: 2025-10-28
**Phase**: Phase 4 - Chart Data Aggregation Fix
