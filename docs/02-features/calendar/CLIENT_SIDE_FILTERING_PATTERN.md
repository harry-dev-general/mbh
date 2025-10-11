# Client-Side Filtering Pattern

**Date Discovered**: October 11, 2025  
**Critical Production Pattern**: Always use client-side filtering for date ranges  

## Overview

Airtable's `filterByFormula` has known reliability issues with date field comparisons. The production MBH Staff Portal switched to client-side filtering in January 2025 to resolve these issues.

## The Pattern

### ❌ Don't Use filterByFormula for Dates
```javascript
// This approach is unreliable
const filter = encodeURIComponent(
    `AND(IS_AFTER({Shift Date}, '${startDate}'),` +
    `IS_BEFORE({Shift Date}, '${endDate}'))`
);
```

### ✅ Use Client-Side Filtering
```javascript
// Fetch all records
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`,
    { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);

const allRecords = response.data.records;

// Filter client-side
const filteredRecords = allRecords.filter(record => {
    const date = new Date(record.fields['Date Field'] + 'T00:00:00');
    const dateStr = formatLocalDate(date);
    return dateStr >= startDateStr && dateStr <= endDateStr;
});
```

## Why This Matters

1. **Reliability**: Airtable's date filtering is inconsistent
2. **Consistency**: Bookings already use this approach
3. **Simplicity**: Easier to debug and maintain
4. **Performance**: One API call vs multiple retries

## Implementation Status

- ✅ Bookings: Using client-side filtering (January 2025)
- ✅ Allocations: Fixed to use client-side filtering (October 2025)
- ⚠️ Other date filters: Should be reviewed and updated

## Key Lesson

When development and production behave differently, always check if production is using client-side filtering instead of Airtable's filterByFormula. This pattern has proven more reliable across the entire system.
