# FilterByFormula Usage Audit

**Date**: October 11, 2025  
**Purpose**: Document remaining uses of Airtable's filterByFormula in the codebase

## Summary

Following the discovery that Airtable's `filterByFormula` is unreliable for date range comparisons, we audited the codebase to find remaining uses. The calendar allocation display has been migrated to client-side filtering.

## Components Still Using FilterByFormula

### 1. dashboard-overview.js
- **Usage**: Exact date matching for bookings and allocations
- **Risk**: LOW - Using exact match (`{Date}='2025-10-11'`) which works reliably
- **Migration needed**: Optional - could migrate for consistency

### 2. reminder-scheduler.js [[memory:9759577]]
- **Usage**: `IS_AFTER({Created}, '${cutoffDate}')` for finding pending allocations
- **Risk**: HIGH - Date range comparison known to be unreliable
- **Migration needed**: YES - Should use client-side filtering

### 3. token-storage.js [[memory:9748290]]
- **Usage**: `IS_BEFORE({Expires At}, '${now}')` for expired tokens
- **Risk**: HIGH - Date comparison could miss expired tokens
- **Migration needed**: YES - Critical for security

### 4. vessel-maintenance.js & vessel-status.js
- **Usage**: `IS_AFTER({Created time}, '${dateFilter}')` for recent records
- **Risk**: MEDIUM - Could miss recent maintenance records
- **Migration needed**: Recommended

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
