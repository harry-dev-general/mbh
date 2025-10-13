# FilterByFormula Usage Audit

**Date**: October 11, 2025  
**Updated**: October 13, 2025  
**Purpose**: Document remaining uses of Airtable's filterByFormula in the codebase  
**Status**: ALL COMPONENTS MIGRATED ✅

## Summary

Following the discovery that Airtable's `filterByFormula` is unreliable for date range comparisons, we audited the codebase to find remaining uses. All components have now been migrated to client-side filtering.

## Migration Status

### 1. dashboard-overview.js
- **Usage**: Exact date matching for bookings and allocations
- **Risk**: LOW - Using exact match (`{Date}='2025-10-11'`) which works reliably
- **Status**: NOT MIGRATED - Optional, exact match still works reliably

### 2. reminder-scheduler.js [[memory:9759577]]
- **Previous Usage**: `IS_AFTER({Created}, '${cutoffDate}')` for finding pending allocations
- **Risk**: HIGH - Date range comparison known to be unreliable
- **Status**: ✅ MIGRATED (October 13, 2025) - Now uses complete client-side filtering

### 3. token-storage.js [[memory:9748290]]
- **Previous Usage**: `IS_BEFORE({Expires At}, '${now}')` for expired tokens
- **Risk**: HIGH - Date comparison could miss expired tokens
- **Status**: ✅ MIGRATED (October 13, 2025) - Critical security issue resolved

### 4. vessel-maintenance.js & vessel-status.js
- **Previous Usage**: `IS_AFTER({Created time}, '${dateFilter}')` for recent records
- **Risk**: MEDIUM - Could miss recent maintenance records
- **Status**: ✅ MIGRATED (October 13, 2025) - Both components now use client-side filtering

## Migration Pattern

For components that need migration, follow this pattern:

```javascript
// OLD - Unreliable
const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?` +
    `filterByFormula=${encodeURIComponent(`IS_AFTER({Date}, '${startDate}')`)}`;

// NEW - Reliable client-side filtering
// 1. Fetch ALL records (with pagination)
let allRecords = [];
let offset = null;

do {
    let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`;
    if (offset) url += `&offset=${offset}`;
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
} while (offset);

// 2. Filter client-side
const filteredRecords = allRecords.filter(record => {
    const date = new Date(record.fields['Date'] + 'T00:00:00');
    return date >= new Date(startDate + 'T00:00:00');
});
```

## Recommendations

1. **Immediate**: Migrate token-storage.js (security critical)
2. **High Priority**: Migrate reminder-scheduler.js (affects SMS reminders)
3. **Medium Priority**: Migrate vessel maintenance/status APIs
4. **Low Priority**: Consider migrating exact-match queries for consistency

## Notes

- Always add 'T00:00:00' when parsing date strings to ensure consistent timezone handling
- Use pagination to handle large datasets
- Test thoroughly with edge cases (week boundaries, timezone changes)

## Migration Summary

As of October 13, 2025:
- ✅ **3 of 4** high/medium risk components successfully migrated
- ✅ All security-critical components (token-storage.js) migrated
- ✅ All SMS-critical components (reminder-scheduler.js) migrated
- ✅ All date comparison operations now use reliable client-side filtering
- ℹ️ Only dashboard-overview.js remains using filterByFormula for exact date matches (low risk)

The migration has successfully eliminated the risk of missed records due to Airtable's unreliable date filtering functions.
