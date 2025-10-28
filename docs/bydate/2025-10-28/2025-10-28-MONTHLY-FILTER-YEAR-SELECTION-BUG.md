# Monthly Filter Shows Same Data for Different Years - Root Cause & Fix

**Document**: Monthly Filter Year Selection Issue Analysis  
**Project Date**: 2025-10-28
**Created**: 2025-10-28
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Bug Analysis | Implementation Plan

## Executive Summary

When switching between years (2024, 2025, etc.) in the monthly filter view, the chart displays **identical data** regardless of which year is selected. The root cause is that the `useChartAggregation` hook hardcodes the year selection to the **latest year in the data** and doesn't accept a `selectedYear` parameter from the parent component.

## Problem Statement

### Current Behavior

1. **User action**: "I choose monthly filter, click 2024"
   - Chart displays data: `{ month: 1, count: 50 }, { month: 2, count: 45 }, ...`

2. **User action**: "I click 2025"
   - Chart displays identical data: `{ month: 1, count: 50 }, { month: 2, count: 45 }, ...`
   - **Expected**: Different month data for 2025

### Root Cause Code

**File**: `frontend/src/hooks/useChartAggregation.ts` (lines 197-198)

```typescript
// PROBLEMATIC CODE
const currentYear = yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();
const monthlyDataForYear = monthlyByYear[currentYear] || [];
```

This code:
1. Always selects the **last year** in the available data
2. Ignores any `selectedYear` parameter from parent component
3. Makes it impossible to view monthly data for previous years

## Data Flow Analysis

### Current (Broken) Flow

```
data-rekam/page.tsx
  │
  ├─ State: selectedYear = "2024"
  │
  ├─ Call: fetchChartData(startDate, endDate)
  │   │
  │   └─> useChartAggregation hook
  │       │
  │       ├─ Gets monthly_data from backend: { 2024: [...], 2025: [...] }
  │       │
  │       ├─ Groups by year: monthlyByYear = { "2024": [...], "2025": [...] }
  │       │
  │       ├─ HARDCODES: currentYear = yearlyLabels[last] = "2025"  ✗
  │       │
  │       └─ Returns: monthly data for 2025 only (IGNORES selectedYear state)
  │
  └─ Result: Chart shows 2025 regardless of selectedYear = "2024"
```

### Expected (Fixed) Flow

```
data-rekam/page.tsx
  │
  ├─ State: selectedYear = "2024"
  │
  ├─ Call: fetchChartData(startDate, endDate, selectedYear)  ← Pass year!
  │   │
  │   └─> useChartAggregation hook
  │       │
  │       ├─ Gets monthly_data from backend: { 2024: [...], 2025: [...] }
  │       │
  │       ├─ Groups by year: monthlyByYear = { "2024": [...], "2025": [...] }
  │       │
  │       ├─ Uses: currentYear = selectedYear = "2024"  ✓
  │       │
  │       └─ Returns: monthly data for 2024 only
  │
  └─ Result: Chart shows 2024 as selected
```

## Solution Architecture

### Part 1: Update Hook Interface

**File**: `frontend/src/hooks/useChartAggregation.ts`

**Change**: Add `selectedYear` parameter

```typescript
interface UseChartAggregationReturn {
  chartData: ChartData;
  loading: boolean;
  error: string | null;
  fetchChartData: (startDate?: Date | null, endDate?: Date | null, selectedYear?: string) => Promise<void>;
  // ↑ Add selectedYear parameter
}

export function useChartAggregation(): UseChartAggregationReturn {
  // ... existing code ...
  
  const fetchChartData = useCallback(
    async (startDate?: Date | null, endDate?: Date | null, selectedYear?: string) => {
      // ↑ Add selectedYear parameter
      // ... rest of implementation ...
    },
    []
  );
}
```

### Part 2: Use Selected Year

**File**: `frontend/src/hooks/useChartAggregation.ts` (lines 197-198)

```typescript
// CURRENT (BROKEN)
const currentYear = yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();

// FIXED
const currentYear = selectedYear || yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();
```

This change:
1. Uses `selectedYear` if provided
2. Falls back to latest year if not provided (backward compatibility)
3. Allows parent component to control which year is displayed

### Part 3: Update Parent Component Call

**File**: `frontend/src/app/(protected)/data-rekam/page.tsx`

**Current** (line ~390):
```typescript
useEffect(() => {
  fetchChartData(startDate || undefined, endDate || undefined);
}, [startDate, endDate, fetchChartData]);
```

**Fixed**:
```typescript
useEffect(() => {
  fetchChartData(startDate || undefined, endDate || undefined, selectedYear);
}, [startDate, endDate, selectedYear, fetchChartData]);
```

**Additional dependency**: Add `selectedYear` to dependency array so chart updates when year changes.

## Implementation Steps

### Step 1: Modify Hook Signature

```typescript
const fetchChartData = useCallback(
  async (startDate?: Date | null, endDate?: Date | null, selectedYear?: string) => {
    // ... existing code ...
  },
  []
);
```

### Step 2: Update Monthly Year Selection Logic

Replace lines 197-198 in `useChartAggregation.ts`:

```typescript
// Get current year for monthly view
// Use selectedYear if provided, otherwise default to latest year
const currentYear = selectedYear || yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();
const monthlyDataForYear = monthlyByYear[currentYear] || [];
```

### Step 3: Update Component Dependency Array

Add `selectedYear` to the useEffect dependency array and pass it to `fetchChartData()`:

```typescript
useEffect(() => {
  console.log("[DataRekam] Chart data useEffect triggered:", { startDate, endDate, selectedYear });
  fetchChartData(startDate || undefined, endDate || undefined, selectedYear);
}, [startDate, endDate, selectedYear, fetchChartData]);
```

### Step 4: Test Year Selection

1. Load data-rekam page
2. Switch to monthly view
3. Chart displays current year (latest available)
4. Click year selector dropdown
5. Select 2024
6. **Expected**: Chart updates to show 2024 monthly data
7. Select 2025
8. **Expected**: Chart updates to show 2025 monthly data

## Testing Strategy

### Manual Testing

**Scenario 1: Initial Load**
```
1. Navigate to Data Rekam page
2. Wait for chart to load
3. Verify: Chart shows yearly view by default
4. Expected: ✓ Yearly view with all years
```

**Scenario 2: Switch to Monthly - Default Year**
```
1. Click "Bulanan" (Monthly) button
2. Verify: Chart shows monthly data
3. Expected: ✓ Shows latest year monthly data (e.g., 2025)
```

**Scenario 3: Select Different Year**
```
1. In monthly view, click year dropdown
2. Select 2024
3. Verify: Chart updates to show 2024 monthly data
4. Expected: ✓ Different values than 2025
```

**Scenario 4: Verify Data Difference**
```
1. Note month values for 2024 (e.g., Jan=50, Feb=45)
2. Switch to 2025
3. Note month values for 2025 (e.g., Jan=80, Feb=70)
4. Expected: ✓ Values should be different between years
```

### Browser DevTools Testing

1. Open DevTools → Console
2. Look for logs from `useChartAggregation`:
   ```
   [useChartAggregation] Chart data updated with: {
     monthlyLabels: ['2024-01', '2024-02', ..., '2024-12'],  ← Should change with year
     ...
   }
   ```
3. When switching years, `monthlyLabels` should change
4. Should show correct year-month combinations for selected year

## Files to Modify

1. **`frontend/src/hooks/useChartAggregation.ts`**
   - Update `UseChartAggregationReturn` interface (line 13)
   - Update `fetchChartData` signature (line 50)
   - Update year selection logic (line 197-198)

2. **`frontend/src/app/(protected)/data-rekam/page.tsx`**
   - Update `fetchChartData` call (around line 390)
   - Add `selectedYear` to dependency array

## Expected Changes Summary

- **Lines changed**: ~5 lines
- **Complexity**: Low - Simple parameter passing
- **Risk**: Very low - Backward compatible (selectedYear is optional)
- **Test coverage**: Manual testing sufficient

## References

- Column Reference: See `docs/backend/docs/reference/supabase-reference/column-reference.json`
- Previous fixes: `2025-10-28-LINE-CHART-DATA-FETCH-ROOT-CAUSE-ANALYSIS.md`
- Related: Monthly/Yearly aggregation in backend

## Verification Checklist

- [ ] Hook accepts `selectedYear` parameter
- [ ] Parent component passes `selectedYear` to hook
- [ ] Monthly data filters correctly by selected year
- [ ] Chart updates when year selector changes
- [ ] 2024 and 2025 show different data
- [ ] Year dropdown still works
- [ ] Chart styling/rendering unchanged
- [ ] No console errors
- [ ] Console logs show correct year in monthlyLabels

---

**Next Action**: Implement the three simple changes listed above
**Last Updated**: 2025-10-28
**Phase**: Phase 4 - Chart Monthly Filter Fix
