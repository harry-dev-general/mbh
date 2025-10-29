# Daily Run Sheet v2 Booking Display Fix

## Issue
The Daily Run Sheet v2 calendar was not displaying bookings even though they existed in Airtable. The logs showed:
- "Total bookings fetched: 100"
- "Bookings for 2025-10-29 : 0"
- Console error: 404 for `/api/get-user-role`
- Resource plugin showing as undefined

## Root Causes

### 1. API Pagination Issue
The `/api/daily-run-sheet` endpoint was only fetching the first 100 records from Airtable. The bookings for "Peter" were likely beyond this limit.

### 2. Resource Plugin Detection
The FullCalendar resource plugin check was looking for the wrong property (`FullCalendar.ResourceTimelineView` instead of `FullCalendar.ResourceTimeline`).

### 3. Incorrect User Role Endpoint
The frontend was calling `/api/get-user-role` but the actual endpoint was `/api/user/role`.

## Solutions

### 1. Implemented Proper Pagination
```javascript
// Fetch all pages of bookings
let allBookings = [];
let offset = null;

do {
    const paginatedUrl = url + (offset ? `&offset=${offset}` : '');
    const response = await axios.get(paginatedUrl, { headers });
    
    if (response.data.records) {
        allBookings = allBookings.concat(response.data.records);
    }
    
    offset = response.data.offset;
} while (offset);
```

### 2. Added Date Filter to Airtable Query
Instead of fetching all bookings and filtering client-side, now the date filter is part of the Airtable query:
```javascript
const statusFilter = `AND(OR({Status}='PAID', {Status}='PEND', {Status}='PART'), {Booking Date}='${dateString}')`;
```

### 3. Fixed Resource Plugin Check
Changed from checking `FullCalendar.ResourceTimelineView` to `FullCalendar.ResourceTimeline`.

### 4. Fixed User Role Endpoint
Updated the frontend to call `/api/user/role` instead of `/api/get-user-role`.

## Testing
1. Navigate to Daily Run Sheet v2
2. Verify bookings for current date are displayed
3. Check console for any errors
4. Navigate between dates to ensure bookings load correctly

## Date: October 29, 2025
Fixed in commit: `6576cce`
