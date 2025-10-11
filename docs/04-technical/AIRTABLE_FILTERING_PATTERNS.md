# Airtable Filtering Patterns

**Last Updated**: October 11, 2025  
**Critical Decision**: Use client-side filtering for date ranges, NOT filterByFormula  

## Overview

This document captures a critical architectural pattern discovered during troubleshooting: Airtable's `filterByFormula` has reliability issues with date field comparisons. The production MBH Staff Portal has migrated to client-side filtering for all date-based queries.

## The Problem with filterByFormula

### Symptoms
- Inconsistent results when filtering by date ranges
- Records at date boundaries (start/end of range) sometimes excluded
- Different results between development and production environments
- Complex date formulas fail silently or return unexpected results

### Example of Problematic Code
```javascript
// This approach is UNRELIABLE
const filter = encodeURIComponent(
    `AND(IS_AFTER({Shift Date}, '${startDate}'),` +
    `IS_BEFORE({Shift Date}, '${endDate}'))`
);

// Even this "improved" version has issues
const filter = encodeURIComponent(
    `AND(NOT({Shift Date} < '${startStr}'),` +
    `NOT({Shift Date} > '${endStr}'))`
);
```

## The Solution: Client-Side Filtering

### Pattern
1. Fetch ALL records without date filtering
2. Filter in JavaScript after receiving data
3. Handle pagination to ensure complete dataset

### Implementation
```javascript
async function loadAllocations() {
    // 1. Fetch ALL records (with pagination)
    let allRecords = [];
    let offset = null;
    
    do {
        let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`;
        if (offset) {
            url += `&offset=${offset}`;
        }
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        const data = await response.json();
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset; // undefined when no more pages
        
    } while (offset);
    
    // 2. Filter client-side
    const filteredRecords = allRecords.filter(record => {
        const date = new Date(record.fields['Date Field'] + 'T00:00:00');
        const dateStr = formatLocalDate(date);
        
        // Simple string comparison works reliably
        return dateStr >= startDateStr && dateStr <= endDateStr;
    });
    
    return filteredRecords;
}
```

## Migration History

### January 2025: Bookings Migration
- First component to switch to client-side filtering
- Issue discovered when bookings weren't showing for current week
- Solution documented in `/docs/02-features/allocations/BOOKING_ALLOCATION_FIX.md`

### October 2025: Allocations Migration  
- Development environment still using filterByFormula
- Production had already migrated but wasn't documented
- Issue discovered when new allocations weren't displaying

## Current Status by Component

| Component | Filtering Method | Status |
|-----------|-----------------|---------|
| Bookings | Client-side | ✅ Migrated (Jan 2025) |
| Allocations | Client-side | ✅ Migrated (Oct 2025) |
| Roster | Server-side | ⚠️ Consider migrating |
| Staff | Server-side | ⚠️ Consider migrating |

## Performance Considerations

### Pros of Client-Side Filtering
- Reliable and predictable results
- No complex Airtable formulas to debug
- Can filter by multiple criteria easily
- Works consistently across environments

### Cons of Client-Side Filtering
- Larger initial data transfer
- More memory usage on client
- Requires pagination implementation
- All filtering logic must be maintained in JavaScript

### Mitigation Strategies
1. **Implement proper pagination** - Don't load thousands of records at once
2. **Cache when appropriate** - Roster data doesn't change frequently
3. **Use field selection** - Only request needed fields: `fields[]=Name&fields[]=Date`
4. **Consider archiving** - Move old records to archive table

## Implementation Guidelines

### DO ✅
- Use client-side filtering for any date comparisons
- Implement pagination for all table queries
- Use consistent date formatting (YYYY-MM-DD)
- Add timezone suffix when parsing dates: `new Date(dateStr + 'T00:00:00')`
- Log the number of records before and after filtering

### DON'T ❌
- Use filterByFormula for date ranges
- Assume all records fit in one API response
- Parse dates without timezone consideration
- Mix server-side and client-side filtering in same component

## Helper Functions

### Date Formatting
```javascript
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### Week Range Calculation
```javascript
function getWeekRange(startDate) {
    const weekEnd = new Date(startDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return {
        start: formatLocalDate(startDate),
        end: formatLocalDate(weekEnd)
    };
}
```

## Debugging Tips

### When Records Don't Appear
1. Log total records fetched before filtering
2. Log records that are filtered out with reasons
3. Check for pagination (might be on page 2+)
4. Verify date formats match (YYYY-MM-DD)
5. Check for invalid data (negative durations, invalid times)

### Console Logging Pattern
```javascript
console.log('Total records fetched:', allRecords.length);
console.log('Records after filtering:', filteredRecords.length);
console.log('Week range:', weekStart, 'to', weekEnd);

// Log what was filtered out
const filtered = allRecords.filter(r => !filteredRecords.includes(r));
filtered.forEach(record => {
    console.log(`Filtered out: ${record.fields.Name} on ${record.fields.Date}`);
});
```

## Future Considerations

1. **Migrate all components** to client-side filtering for consistency
2. **Create shared filtering utilities** to avoid code duplication  
3. **Consider caching layer** for frequently accessed data
4. **Document in code** when using client-side filtering pattern
5. **Monitor performance** as data grows

## Key Takeaway

**Airtable's filterByFormula is unreliable for date comparisons.** Always use client-side filtering when working with date ranges. This pattern has been battle-tested in production and provides consistent, reliable results.
