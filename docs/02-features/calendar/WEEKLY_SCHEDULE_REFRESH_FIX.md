# Weekly Schedule Refresh Fix

**Date**: October 11, 2025  
**Issue**: New allocations not appearing in Weekly Schedule after creation  
**Status**: Fixed  
**Key Finding**: Production uses client-side filtering, not Airtable's filterByFormula

## The Problem

When creating a new shift allocation:
1. SMS was sent successfully ✅
2. Success message was shown ✅
3. Record was created in Airtable ✅
4. But the allocation didn't appear in the Weekly Schedule ❌

Console showed only 2 allocations when there should have been 3.

## Root Causes

### 1. Airtable filterByFormula Date Issues
Airtable's filterByFormula has known reliability issues with date fields. The production system switched to client-side filtering for this reason.

**Development was using**:
```javascript
// Problematic server-side date filtering
`AND(NOT({Shift Date} < '${startStr}'),NOT({Shift Date} > '${endStr}'))`
```

**Production approach (now implemented)**:
```javascript
// Fetch all allocations
const allAllocations = data.records || [];

// Filter client-side
allocationsData = allAllocations.filter(record => {
    const shiftDate = record.fields['Shift Date'];
    const isInRange = dateStr >= weekStartStr && dateStr <= weekEndStr;
    return isInRange;
});
```

### 2. Caching Issues
Airtable API responses might have been cached, preventing fresh data from loading.

### 3. Timing Issues
The 1-second delay might not have been enough for Airtable to fully process the new record.

## Solutions Implemented

### 1. Switched to Client-Side Filtering (Final Fix)
Matched the production approach by fetching all allocations and filtering client-side. This avoids Airtable's unreliable filterByFormula date handling.

### 2. Cache Busting via Timestamp
Added timestamp parameter to URL instead of headers due to CORS restrictions:
```javascript
`&_t=${Date.now()}`
```
**Note**: Don't use `Cache-Control` or `Pragma` headers with Airtable API - they cause CORS errors!

### 3. Increased Processing Delay
Increased from 1 to 2 seconds to ensure Airtable has processed the record:
```javascript
setTimeout(async () => {
    // Reload allocations
}, 2000); // Was 1000
```

### 4. Force Data Refresh
Clear existing data before reloading:
```javascript
allocationsData = []; // Force fresh fetch
await loadAllocations();
```

### 5. Added Manual Refresh Button
Added a 🔄 Refresh button to the Weekly Schedule header for immediate updates.

### 6. Enhanced Logging
Added detailed logging of allocation dates to help debug issues:
```javascript
console.log('Allocation dates:', allocationsData.map(a => ({
    name: a.fields['Name'],
    date: a.fields['Shift Date'],
    employee: a.fields['Employee']?.[0]
})));
```

## Testing

1. Create a new allocation
2. Check console for:
   - "Reloading data after allocation creation..."
   - "Forcing calendar refresh with X allocations"
   - "Allocation dates:" showing all allocations

3. If allocation doesn't appear:
   - Click the 🔄 Refresh button
   - Check console for the allocation dates
   - Verify the date format matches YYYY-MM-DD

## Manual Refresh Function

If automatic refresh fails, users can click the refresh button which calls:
```javascript
window.manualRefreshSchedule()
```

This function:
1. Clears existing allocation data
2. Reloads from Airtable with no-cache headers
3. Forces calendar update
4. Logs the process for debugging

## Common Pitfalls

### CORS Headers with Airtable API
**Problem**: Adding cache-control headers causes CORS errors:
```
Request header field cache-control is not allowed by Access-Control-Allow-Headers
```

**Solution**: Use URL parameters for cache busting, not headers:
```javascript
// ❌ DON'T DO THIS
headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
}

// ✅ DO THIS INSTEAD
`?_t=${Date.now()}`
```

## Future Improvements

1. **WebSocket/Real-time Updates**: Use Airtable webhooks for instant updates
2. **Optimistic Updates**: Show allocation immediately, then sync with server
3. **Better Error Handling**: Show specific errors if refresh fails
4. **Loading State**: Show spinner during refresh
5. **Retry Logic**: Automatically retry if initial refresh fails
