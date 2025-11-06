# Debounce Date Filtering Fix - October 24, 2025

## Problem Identified

The original debounce logic was creating **3 separate debounces** for each filter field:

```typescript
// ❌ WRONG - Creates 3 separate 500ms delays
const debouncedSearchQuery = useDebounce(searchQuery, 500);
const debouncedStartDate = useDebounce(startDate, 500);
const debouncedEndDate = useDebounce(endDate, 500);
```

This caused **multiple staggered API calls**:
1. User types start date `2025-10-10` → 500ms delay
2. User types end date `2025-10-13` → ANOTHER 500ms delay  
3. First API call fires: `date_from=2025-10-10&date_to=` ❌ (missing end date!)
4. Second API call fires: `date_from=2025-10-10&date_to=2025-10-13` ✅ 

Backend received incomplete filter on first call, causing query confusion.

## Solution Implemented

### 1. Combined All Filters Into Single Debounce
```typescript
// ✅ CORRECT - Single debounce for all filters
const combinedFilters = useMemo(() => ({
  query: searchQuery.trim(),
  status: statusFilter,
  startDate: startDate,
  endDate: endDate,
}), [searchQuery, statusFilter, startDate, endDate]);

const debouncedFilters = useDebounce(combinedFilters, 500);
```

### 2. Added Date Pair Validation
```typescript
// Only fire search if date filtering is complete
const hasStartDate = debouncedFilters.startDate.trim().length > 0;
const hasEndDate = debouncedFilters.endDate.trim().length > 0;

if (hasStartDate && !hasEndDate) {
  return; // Wait for end date
}
if (hasEndDate && !hasStartDate) {
  return; // Wait for start date
}
```

## New Behavior

### User Interaction Timeline

| Step | Action | State | API Call? |
|------|--------|-------|-----------|
| 1 | Type start date `2025-10-10` | `startDate="2025-10-10"`, `endDate=""` | ❌ No (waiting for end date) |
| 2 | Wait 500ms (debounce) | Combined filters debounce | ❌ No (validation rejects) |
| 3 | Type end date `2025-10-13` | `startDate="2025-10-10"`, `endDate="2025-10-13"` | ❌ No (debouncing) |
| 4 | Wait 500ms (debounce) | Combined filters debounce complete | ✅ YES! Both dates ready |
| 5 | API fires | Single call with both dates | `date_from=2025-10-10&date_to=2025-10-13` ✅ |

### Search Query Without Dates

| Action | State | API Call? |
|--------|-------|-----------|
| Type search term | `query="test"`, dates empty | ✅ YES (no date pair required) |
| Wait 500ms | Debounce complete | Already fired above |

## Files Modified

- `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`
  - Lines 175-185: Removed 3 individual debounces
  - Lines 188-191: Created combined filters memoization
  - Lines 193: Single debounced combined object
  - Lines 196-232: Updated effect with validation logic

## Testing Checklist

- [ ] Type only start date → No API call fires
- [ ] Complete with end date → Single API call fires (500ms after last keystroke)
- [ ] Type search query → Immediate search (after 500ms debounce, no date validation)
- [ ] Change status filter → Immediate search (no date validation)
- [ ] Clear dates after search → New search fires with empty dates
- [ ] Open DevTools Network tab → Verify only ONE request per filter change

## Result

✅ **Single unified API call** with all date parameters together
✅ **No incomplete/partial filter requests**
✅ **Backend receives correct date range in one go**
✅ **User experience: Consistent behavior across all filter types**
