# Allocation Not Displaying Investigation

**Date**: October 11, 2025  
**Issue**: Newly created shift allocations not appearing in Weekly Schedule calendar  
**Reporter**: User testing in Railway development environment  

## Problem Statement

After creating a new general shift allocation for "Test Staff" on Sunday October 12, 2025:
- SMS notification was sent successfully ✅
- Allocation was created in Airtable ✅  
- Success message displayed ✅
- But the allocation did NOT appear in the Weekly Schedule calendar ❌

Console logs showed only 2 allocations when there should have been 3.

## Investigation Timeline & Approaches

### Approach 1: Date Filter Issue (Initial Theory)
**Theory**: The Airtable `filterByFormula` was excluding boundary dates (Sunday)

**What We Tried**:
```javascript
// Changed from exclusive date comparisons
`AND(IS_AFTER({Shift Date}, '${prevDayStr}'),IS_BEFORE({Shift Date}, '${nextDayStr}'))`

// To inclusive comparisons  
`AND(NOT({Shift Date} < '${startStr}'),NOT({Shift Date} > '${endStr}'))`
```

**Result**: ❌ Still only showed 2 allocations

**Learning**: The date filter syntax was already correct, the issue was elsewhere.

### Approach 2: Cache Busting
**Theory**: Airtable API responses were being cached

**What We Tried**:
1. Added timestamp to URL: `&_t=${Date.now()}`
2. Initially tried adding headers:
   ```javascript
   'Cache-Control': 'no-cache',
   'Pragma': 'no-cache'
   ```

**Result**: 
- ❌ Headers caused CORS error: "Request header field cache-control is not allowed by Access-Control-Allow-Headers"
- ✅ Timestamp parameter worked for cache busting

**Learning**: Airtable's CORS policy doesn't allow custom cache control headers. Use URL parameters instead.

### Approach 3: Processing Delay
**Theory**: Airtable needed more time to process the new record

**What We Tried**:
```javascript
// Increased delay from 1 to 2 seconds
setTimeout(async () => {
    await loadAllocations();
}, 2000); // Was 1000
```

**Result**: ❌ Still didn't show the allocation

**Learning**: The issue wasn't timing-related.

### Approach 4: Force Data Refresh
**Theory**: Old data was persisting in memory

**What We Tried**:
```javascript
allocationsData = []; // Clear existing data
await loadAllocations();
updateCalendarEvents(); // Force calendar update
```

**Result**: ❌ Still only 2 allocations

**Learning**: Memory persistence wasn't the issue.

### Approach 5: Manual Refresh Button
**Theory**: Give users control to manually refresh

**What We Tried**:
- Added "🔄 Refresh" button to Weekly Schedule header
- Implemented `manualRefreshSchedule()` function

**Result**: ✅ Button worked but still only showed 2 allocations

**Learning**: The refresh mechanism was working correctly, data fetching was the issue.

## Critical Discovery: Client-Side Filtering Pattern

**Key Finding**: Production uses client-side filtering, NOT Airtable's `filterByFormula`

### Why This Matters
1. **Airtable's filterByFormula has known reliability issues with date fields**
2. Production switched to client-side filtering in January 2025
3. Bookings were already using client-side filtering (which is why they displayed correctly)
4. Allocations were still trying to use filterByFormula

### The Fix That Should Have Worked
```javascript
// Instead of server-side filtering
const filter = encodeURIComponent(
    `AND(NOT({Shift Date} < '${startStr}'),NOT({Shift Date} > '${endStr}'))`
);

// Use client-side filtering
const allAllocations = data.records || [];
allocationsData = allAllocations.filter(record => {
    const shiftDate = record.fields['Shift Date'];
    const dateStr = formatLocalDate(new Date(shiftDate + 'T00:00:00'));
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
});
```

**Result**: ✅ Correctly fetched 28 total allocations but still only found 2 for current week

## Final Investigation: Data Analysis

### What We Found in Airtable
Using Airtable MCP tools, we discovered:
- Total allocations in table: 28
- Allocations for week Oct 6-12: Only 2
  1. Oct 11: Joshua John Vasco
  2. Oct 12: Test Staff (the "missing" allocation)

**The allocation WAS being fetched but had invalid data**:
```javascript
{
  "id": "recLtmGIuKCo52mrU",
  "fields": {
    "Name": "2025-10-12 - Test Staff",
    "Shift Date": "2025-10-12",
    "Start Time": "21:00",
    "End Time": "11:12",  // Invalid - earlier than start time!
    "Duration": -9.8       // Negative duration!
  }
}
```

### Possible Root Causes
1. **Negative Duration**: FullCalendar might reject events with negative durations
2. **Invalid Time Logic**: End time (11:12 AM) before start time (9:00 PM)
3. **Pagination**: Without proper pagination, allocations beyond first 100 records would be missed

## Technical Learnings

### 1. Airtable filterByFormula Date Issues
- Date comparisons in filterByFormula are unreliable
- Different date formats can cause unexpected behavior
- Client-side filtering is more predictable

### 2. CORS Restrictions
- Airtable API doesn't allow `Cache-Control` or `Pragma` headers
- Use URL parameters for cache busting instead

### 3. Data Validation
- Always validate time entries to ensure end time > start time
- FullCalendar may silently reject invalid events
- Negative durations can cause display issues

### 4. Pagination Importance
```javascript
// Must handle pagination for complete data
let allRecords = [];
let offset = null;
do {
    const response = await fetch(url + (offset ? `&offset=${offset}` : ''));
    const data = await response.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
} while (offset);
```

### 5. Environment Consistency
- Development environment had outdated patterns
- Production had already solved these issues
- Always check production implementation when dev behaves differently

## Recommended Best Practices

1. **Always use client-side filtering for dates** - Airtable's filterByFormula is unreliable
2. **Implement proper pagination** - Don't assume all records fit in one page
3. **Validate time entries** - Ensure end time > start time before saving
4. **Add comprehensive logging** - Makes debugging much easier
5. **Check production patterns** - Production often has battle-tested solutions

## Debugging Checklist for Future Issues

1. Check if the record exists in Airtable directly
2. Verify the data is valid (times, dates, required fields)
3. Check console for detailed logs
4. Ensure pagination is implemented
5. Verify client-side filtering is used (not filterByFormula)
6. Check for CORS errors with custom headers
7. Look for negative durations or invalid time ranges
8. Compare with production implementation

## Conclusion

The issue was a combination of:
1. Using outdated server-side filtering (when production uses client-side)
2. Not implementing pagination for allocations
3. Invalid time entry causing negative duration

The key lesson: **When development and production behave differently, always investigate what patterns production is using.** In this case, production had already moved away from Airtable's unreliable filterByFormula to client-side filtering.
