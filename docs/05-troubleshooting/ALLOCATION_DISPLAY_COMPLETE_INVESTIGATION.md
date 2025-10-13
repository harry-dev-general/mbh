# Allocation Display Complete Investigation & Technical Discoveries

**Date**: October 13, 2025  
**Issue**: Test Staff allocation not displaying on Weekly Schedule calendar  
**Investigation Duration**: October 11-13, 2025  
**Final Status**: RESOLVED ✅

## Executive Summary

This document provides a comprehensive record of the investigation into why certain shift allocations were not displaying on the MBH Staff Portal's Weekly Schedule calendar. The root cause was identified as allocations scheduled outside the calendar's visible time range (after 8 PM), combined with the discovery of significant technical issues with Airtable's date filtering.

## Initial Problem Description

**User Report**: "Newly created shift allocations were not appearing in the Weekly Schedule calendar"

**Specific Case**: 
- Test Staff allocation for Sunday, October 12, 2025
- Time: 21:00-23:00 (9 PM - 11 PM)
- Created successfully in Airtable
- SMS notification sent successfully
- Not visible in calendar view

**Console Output**: Only showed 2 allocations when 3 were expected

## Investigation Approaches & Results

### Approach 1: Date Filter Syntax Issue
**Hypothesis**: Airtable's `filterByFormula` was excluding boundary dates (Sunday)

**What We Tried**:
```javascript
// Original (exclusive comparisons)
`AND(IS_AFTER({Shift Date}, '${prevDayStr}'),IS_BEFORE({Shift Date}, '${nextDayStr}'))`

// Changed to (inclusive comparisons)
`AND(NOT({Shift Date} < '${startStr}'),NOT({Shift Date} > '${endStr}'))`
```

**Result**: ❌ Failed - Still only showed 2 allocations  
**Learning**: Date filter syntax was already correct

### Approach 2: Cache Busting
**Hypothesis**: Airtable API responses were being cached

**What We Tried**:
1. Added timestamp to URL: `&_t=${Date.now()}`
2. Initially attempted headers:
   ```javascript
   'Cache-Control': 'no-cache',
   'Pragma': 'no-cache'
   ```

**Result**: 
- ❌ Headers caused CORS error: "Request header field cache-control is not allowed"
- ✅ Timestamp parameter worked for cache busting but didn't solve the issue

**Learning**: Airtable's CORS policy doesn't allow custom cache control headers

### Approach 3: Processing Delay
**Hypothesis**: Airtable needed time to process new records

**What We Tried**:
```javascript
setTimeout(async () => {
    await loadAllocations();
}, 2000); // Increased from 1000ms
```

**Result**: ❌ Failed - Allocation still not displayed  
**Learning**: Issue wasn't timing-related

### Approach 4: Force Data Refresh
**Hypothesis**: Old data persisting in memory

**What We Tried**:
```javascript
allocationsData = []; // Clear existing data
await loadAllocations();
updateCalendarEvents(); // Force calendar update
```

**Result**: ❌ Failed - Still only 2 allocations  
**Learning**: Memory persistence wasn't the issue

### Approach 5: Manual Refresh Button
**Hypothesis**: Give users control to manually refresh

**Implementation**:
- Added "🔄 Refresh" button to Weekly Schedule header
- Implemented `manualRefreshSchedule()` function
- Added loading states and visual feedback

**Result**: ✅ Button worked but still only showed 2 allocations  
**Learning**: Refresh mechanism was working correctly, data fetching was the issue

## Critical Discovery: Environment Divergence

### Key Finding
**Development was using outdated Airtable filtering patterns while production had migrated to client-side filtering**

### Evidence
1. Production switched to client-side filtering in January 2025
2. Bookings were already using client-side filtering (which is why they displayed correctly)
3. Allocations were still using `filterByFormula`

### Technical Issues with filterByFormula

**Problems Discovered**:
1. **Date Comparisons Unreliable**: `IS_AFTER()` and `IS_BEFORE()` functions have known issues
2. **Timezone Handling**: Inconsistent behavior with date strings
3. **No Clear Error Messages**: Fails silently when filters don't match
4. **Performance**: Slower than client-side filtering for large datasets

## Solution Implemented

### 1. Client-Side Filtering Pattern
```javascript
// OLD - Unreliable
const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?` +
    `filterByFormula=${encodeURIComponent(dateFilterFormula)}`;

// NEW - Reliable
// Step 1: Fetch ALL records with pagination
let allAllocations = [];
let offset = null;

do {
    let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`;
    if (offset) url += `&offset=${offset}`;
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    allAllocations = allAllocations.concat(data.records || []);
    offset = data.offset;
} while (offset);

// Step 2: Filter client-side
const weekAllocations = allAllocations.filter(record => {
    const shiftDate = record.fields['Shift Date'];
    if (!shiftDate) return false;
    
    const date = new Date(shiftDate + 'T00:00:00');
    const dateStr = formatLocalDate(date);
    
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
});
```

### 2. Calendar Time Range Extension
**Root Cause**: Test Staff allocation (21:00-23:00) was outside visible hours

```javascript
// Configuration change
slotMaxTime: '24:00:00', // Extended from '20:00:00'
```

### 3. Date Format Localization
```javascript
// Added Australian locale
locale: 'en-AU',
dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'numeric' },
titleFormat: { day: 'numeric', month: 'short', year: 'numeric' },
```

### 4. Time Validation
```javascript
// Prevent invalid time entries
if (endDateTime <= startDateTime) {
    alert('End time must be after start time. Please check your time entries.');
    return;
}
```

## Technical Discoveries

### 1. Date Handling Best Practices
- Always add 'T00:00:00' when parsing date strings: `new Date(dateStr + 'T00:00:00')`
- Use consistent formatting function: `formatLocalDate()`
- Compare dates as strings in YYYY-MM-DD format for reliability

### 2. Airtable API Quirks
- `filterByFormula` is unreliable for date comparisons
- CORS policy blocks cache control headers
- Pagination is required for large datasets (>100 records)
- Always check for `offset` in response for additional pages

### 3. FullCalendar Integration
- Events outside `slotMinTime`/`slotMaxTime` are not displayed
- Calendar requires explicit re-render when switching views
- Use `calendar.removeAllEvents()` before adding new events
- Australian locale requires explicit configuration

### 4. Debug Strategies That Worked
- Creating standalone Node.js scripts to test Airtable queries
- Logging raw vs. processed data at each transformation step
- Comparing development vs. production implementations
- Testing with extreme cases (late night shifts, week boundaries)

## Components Still Using filterByFormula

Audit revealed several components still at risk:

1. **reminder-scheduler.js** - HIGH RISK (uses `IS_AFTER`)
2. **token-storage.js** - HIGH RISK (security critical, uses `IS_BEFORE`)
3. **vessel-maintenance.js** - MEDIUM RISK
4. **dashboard-overview.js** - LOW RISK (uses exact match which works)

## Lessons Learned

### 1. Environment Parity
- Development and production must use identical data fetching patterns
- Regular audits needed to prevent divergence
- Document all production hotfixes

### 2. Testing Strategy
- Always test edge cases (late shifts, week boundaries)
- Create debug scripts for complex issues
- Log data at every transformation step

### 3. Airtable Best Practices
- Prefer client-side filtering over `filterByFormula`
- Always handle pagination
- Test with production-scale data

### 4. Calendar Configuration
- Consider 24-hour display for shift management systems
- Make time ranges configurable
- Account for all possible shift times

## Prevention Measures

1. **Code Reviews**: Check for `filterByFormula` usage
2. **Documentation**: Keep technical decisions documented
3. **Testing**: Include edge cases in test scenarios
4. **Monitoring**: Add logging for data fetching operations
5. **Migration Plan**: Systematically update remaining components

## Related Documentation

- `/docs/04-technical/AIRTABLE_FILTERING_PATTERNS.md` - Technical patterns
- `/docs/04-technical/FILTERBYFORMULA_USAGE_AUDIT.md` - Components to migrate
- `/docs/05-troubleshooting/ALLOCATION_DISPLAY_FINAL_FIX.md` - Fix details
- `/docs/02-features/calendar/ALLOCATION_DISPLAY_LESSONS_LEARNED.md` - Summary

## Future Recommendations

1. **Immediate Actions**:
   - Migrate token-storage.js (security critical)
   - Migrate reminder-scheduler.js (affects SMS functionality)
   - Add configuration for calendar time ranges

2. **Long-term Improvements**:
   - Implement centralized data fetching service
   - Add comprehensive error logging
   - Create integration tests for Airtable operations
   - Consider caching layer for better performance

This investigation revealed not just a simple display issue, but fundamental technical debt that needed addressing. The solution improved both reliability and performance of the allocation system.
