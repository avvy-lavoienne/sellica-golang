# Separate Chart Data Route Implementation

**Document**: Separate Chart API Route Integration Guide
**Project Date**: 2025-10-28
**Created**: 2025-10-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Overview

Created a **separate API route** for chart data to prevent affecting the dashboard card functionality. This follows the separation of concerns principle.

---

## What Was Created

### 1. New Chart API Route

**File**: `frontend/src/app/api/data-rekam/chart-aggregation/route.ts`

**Purpose**: Dedicated endpoint for chart time-series data

**Endpoint**: `GET /api/data-rekam/chart-aggregation`

**Response**:
```json
{
  "success": true,
  "data": {
    "monthly_data": [
      { "year": 2024, "month": 10, "count": 5 },
      { "year": 2024, "month": 9, "count": 8 },
      ...
    ],
    "yearly_data": [
      { "year": 2024, "count": 100 },
      { "year": 2023, "count": 85 },
      ...
    ]
  }
}
```

**Key Points**:
- Only returns time-series aggregation data
- Does NOT return Summary counts (card data untouched)
- Same authentication as dashboard-stats route
- Calls same Go backend endpoint but extracts only chart data

---

### 2. Custom Hook for Chart

**File**: `frontend/src/hooks/useChartAggregation.ts`

**Purpose**: Encapsulates all chart data fetching and processing logic

**Usage**:
```typescript
const { chartData, loading, error, fetchChartData } = useChartAggregation();

// Fetch data
await fetchChartData(startDate, endDate);

// Use in ChartSection component
<ChartSection
  chartData={chartData}
  isLoading={loading}
  error={error}
  ...
/>
```

**Features**:
- Handles API calls with authentication
- Converts aggregated data to SparklineData format
- Transforms to ChartData format for ChartSection
- Built-in error handling and loading states
- Completely isolated from card logic

---

## How to Integrate

### Step 1: Update Data-Rekam Page

**File**: `frontend/src/app/(protected)/data-rekam/page.tsx`

Replace the `fetchUserAndStats` chart processing with the hook:

```typescript
import { useChartAggregation } from '@/hooks/useChartAggregation';

export default function DataRekam() {
  // ... existing card data states ...
  
  // NEW: Use separate chart hook
  const { chartData, loading: chartLoading, error: chartError, fetchChartData } = useChartAggregation();
  
  // Keep existing card states for dashboard-stats
  const [totalPengajuanAdjudicate, setTotalPengajuanAdjudicate] = useState<number>(0);
  const [totalSelesaiAdjudicate, setTotalSelesaiAdjudicate] = useState<number>(0);
  // ... rest of card states ...

  // Fetch card data (dashboard-stats) - UNCHANGED
  const fetchUserAndStats = useCallback(async () => {
    // ... existing card data fetching ...
  }, [/* existing deps */]);

  // Fetch chart data - NEW
  useEffect(() => {
    fetchChartData(startDate, endDate);
  }, [startDate, endDate, fetchChartData]);

  // ... rest of component ...
}
```

---

## Data Flow

```
┌─────────────────────────────────────────┐
│        Go Backend (/data-rekam/dashboard-stats)
│  Returns: { Summary, MonthlyData, YearlyData }
└───────────┬─────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────────┐  ┌──────────────────────┐
│ dashboard-  │  │ chart-aggregation    │
│ stats route │  │ route                │
├─────────────┤  ├──────────────────────┤
│ Extract:    │  │ Extract:             │
│ - Summary   │  │ - MonthlyData        │
│   counts    │  │ - YearlyData         │
│             │  │                      │
│ Return: {   │  │ Return: {            │
│  success,   │  │  success,            │
│  data: {    │  │  data: {             │
│   count...  │  │   monthly_data...,   │
│  }          │  │   yearly_data...     │
│ }           │  │  }                   │
└──────┬──────┘  │ }                    │
       │         └──────────┬───────────┘
       │                    │
    ┌──▼────────┐       ┌───▼──────────────┐
    │ Card      │       │ useChartAgg      │
    │ Component │       │ Hook             │
    ├───────────┤       ├──────────────────┤
    │ Displays: │       │ Processes:       │
    │ - Total   │       │ - Aggregates to  │
    │ - Complet │       │   SparklineData  │
    │           │       │ - Converts to    │
    │ ✅ WORKS  │       │   ChartData      │
    └───────────┘       │ - Returns ready  │
                        │   for rendering  │
                        │ ⏳ Testing...    │
                        └──────────────────┘
```

---

## Why This Approach

### ✅ Advantages

1. **Isolation**: Chart data fetching completely separate from card
2. **No Side Effects**: Changing chart logic won't affect card
3. **Reusability**: Hook can be used in other pages
4. **Single Responsibility**: Each API route does one thing
5. **Testability**: Hook can be tested independently
6. **Error Handling**: Separate error states for chart vs card

### ❌ Avoids

- Breaking card when updating chart
- Mixing concerns in single endpoint
- Complex data transformations
- Hard to debug issues with multiple data flows

---

## Integration Checklist

- [ ] Create `frontend/src/app/api/data-rekam/chart-aggregation/route.ts`
- [ ] Create `frontend/src/hooks/useChartAggregation.ts`
- [ ] Import hook in `data-rekam/page.tsx`
- [ ] Replace chart data fetching with hook
- [ ] Test card still displays data ✅
- [ ] Test chart displays with aggregated data
- [ ] Test date filters work for both
- [ ] Test error handling

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `frontend/src/app/api/data-rekam/chart-aggregation/route.ts` | Chart data API route | ✅ Created |
| `frontend/src/hooks/useChartAggregation.ts` | Chart data hook | ✅ Created |
| `frontend/src/app/(protected)/data-rekam/page.tsx` | Main page (needs integration) | ⏳ Needs update |
| `frontend/src/app/api/data-rekam/dashboard-stats/route.ts` | Card data API route | ✅ Unchanged |

---

## Next Steps

1. Update `data-rekam/page.tsx` to use `useChartAggregation` hook
2. Test that card displays statistics correctly
3. Test that chart displays aggregated data
4. Verify date filters work for both
5. Test error scenarios

---

**Last Updated**: 2025-10-28
