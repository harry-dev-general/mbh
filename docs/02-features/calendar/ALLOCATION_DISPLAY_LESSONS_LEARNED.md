# Allocation Display Issue - Lessons Learned

**Date**: October 11, 2025  
**Issue Type**: Development/Production Inconsistency  
**Resolution**: Aligned development with production patterns  

## Executive Summary

A newly created allocation wasn't displaying in the development environment's calendar. After extensive debugging, we discovered that production had already migrated away from Airtable's unreliable `filterByFormula` to client-side filtering, but development was using outdated patterns.

## Key Discoveries

### 1. Production Uses Different Patterns
**Finding**: Production had migrated to client-side filtering in January 2025  
**Impact**: Development environment was using outdated, unreliable methods  
**Lesson**: Always check production implementation when issues arise  

### 2. Airtable filterByFormula is Unreliable
**Finding**: Date comparisons in filterByFormula have known issues  
**Evidence**: Bookings (using client-side) worked; Allocations (using filterByFormula) failed  
**Resolution**: Migrate all date filtering to client-side  

### 3. Invalid Data Can Break Display
**Finding**: Allocation had end time (11:12) before start time (21:00)  
**Impact**: Negative duration (-9.8 hours) may cause FullCalendar to reject event  
**Lesson**: Always validate time entries before saving  

### 4. CORS Restrictions
**Finding**: Airtable blocks custom cache control headers  
**Error**: "Request header field cache-control is not allowed"  
**Solution**: Use URL parameters for cache busting: `&_t=${Date.now()}`  

### 5. Pagination is Critical
**Finding**: Airtable returns max 100 records per page  
**Risk**: Records beyond first page are missed without pagination  
**Solution**: Implement pagination loop for all data fetches  

## What Actually Fixed It

### Step 1: Client-Side Filtering
```javascript
// Remove filterByFormula completely
// Fetch all records and filter in JavaScript
const filteredRecords = allRecords.filter(record => {
    const dateStr = formatLocalDate(new Date(record.fields['Shift Date'] + 'T00:00:00'));
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
});
```

### Step 2: Implement Pagination
```javascript
let allRecords = [];
let offset = null;
do {
    const url = `${baseUrl}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
} while (offset);
```

### Step 3: Fix Invalid Data
- Changed end time from "11:12" to "23:00"
- Duration changed from -9.8 to 2 hours

## Action Items for Codebase

### Immediate
1. ✅ Migrate allocations to client-side filtering (COMPLETED)
2. ✅ Add pagination to allocation loading (COMPLETED)
3. ✅ Document the pattern for future reference (COMPLETED)

### Future
1. ⚠️ Audit all Airtable queries for filterByFormula usage
2. ⚠️ Migrate remaining components to client-side filtering
3. ⚠️ Add time validation to allocation creation form
4. ⚠️ Create shared utilities for consistent date filtering

## Red Flags to Watch For

1. **Console shows fewer records than expected**
   - Check: Is filterByFormula being used?
   - Check: Is pagination implemented?

2. **Works in production but not development**
   - Check: Different filtering patterns?
   - Check: Outdated code in development?

3. **Date boundary issues (first/last day missing)**
   - Symptom of filterByFormula date problems
   - Switch to client-side filtering

4. **CORS errors with Airtable**
   - Don't add custom headers like Cache-Control
   - Use URL parameters instead

5. **Negative duration in allocations**
   - Validate times before saving
   - End time must be after start time

## Documentation Trail

1. **Investigation Details**: `/docs/05-troubleshooting/ALLOCATION_NOT_DISPLAYING_INVESTIGATION.md`
2. **Technical Pattern**: `/docs/04-technical/AIRTABLE_FILTERING_PATTERNS.md`
3. **Client-Side Pattern**: `/docs/02-features/calendar/CLIENT_SIDE_FILTERING_PATTERN.md`
4. **Original Issue**: `/docs/02-features/calendar/WEEKLY_SCHEDULE_REFRESH_FIX.md`

## For Future LLMs/Developers

When debugging display issues:
1. First, check if the data exists in Airtable
2. Then, check if it's being fetched (pagination?)
3. Then, check if it's being filtered correctly (client-side)
4. Finally, check if the data is valid (times, dates)

Remember: **Production patterns trump development patterns.** If they differ, production is probably right.
