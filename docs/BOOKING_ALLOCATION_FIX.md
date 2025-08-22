# Booking Staff Allocation Fix

## Date: January 2025

## Issues Fixed

### 1. Duplicate Visual Elements
When allocating staff to bookings in the management allocations dashboard, the system was creating duplicate visual elements instead of updating the booking's color from red (unstaffed) to green (staffed).

### 2. CORS Error Preventing Bookings from Loading
The addition of `Cache-Control: 'no-cache'` header was causing CORS errors with Airtable's API, preventing bookings from loading entirely. This caused:
- No customer bookings displayed
- "Today's Bookings" container stuck in loading state
- Only staff allocations visible

## Root Cause
The allocation form submission was only creating a new record in the Shift Allocations table without updating the booking's `Onboarding Employee` or `Deloading Employee` fields in the Bookings Dashboard table.

## The Fix

### What Changed
Modified the form submission handler in `management-allocations.html` to:

1. **First**: Update the booking record's employee fields when allocating staff to a booking
2. **Then**: Create the shift allocation record for time tracking

### Technical Details

#### Before (Incorrect Behavior)
```javascript
// Only created allocation record
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}`,
    { method: 'POST', ... }
);
```

#### After (Fixed Behavior)
```javascript
// 1. Update booking's employee field
if (roleValue === 'Onboarding') {
    updateFields['Onboarding Employee'] = [employeeId];
} else if (roleValue === 'Deloading') {
    updateFields['Deloading Employee'] = [employeeId];
}

const updateResponse = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
    { method: 'PATCH', ... }
);

// 2. Then create allocation record for tracking
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}`,
    { method: 'POST', ... }
);
```

## How It Works Now

### Visual Flow
1. **Red Booking** appears on calendar (no staff allocated)
2. Manager clicks booking → Allocation modal opens
3. Manager selects employee and role (Onboarding/Deloading)
4. System updates booking's employee field
5. **Booking turns green** (staff allocated)
6. Allocation record created for time tracking

### Data Flow
```
User Action → Update Booking Record → Create Allocation Record → Refresh Calendar
                     ↓                           ↓
           [Onboarding Employee]      [Shift Allocations Table]
           [Deloading Employee]       (for time tracking)
```

## Field References

### Bookings Dashboard Table (`tblcBoyuVsbB1dt1I`)
- `Onboarding Employee` (fld2sMrEDDPat22Nv) - Linked to Employee Details
- `Deloading Employee` (fldJ7reYmNeO8eT7Q) - Linked to Employee Details

### Shift Allocations Table (`tbl22YKtQXZtDFtEX`)
- `Employee` - Linked to Employee Details
- `Booking` - Linked to Bookings Dashboard
- `Role` - Single select (Onboarding/Deloading/etc.)
- `Shift Type` - Single select (Boat Hire/General Operations/etc.)

## Visual Indicators

### Booking Colors on Calendar
- **Red booking block** = No staff allocated for this role
- **Green booking block** = Staff allocated for this role
- **Opacity 0.7** = This specific role needs staff
- **Opacity 1.0** = This specific role has staff

### Icons
- 🚢 ON = Onboarding time slot
- 🏁 OFF = Deloading time slot
- ✓ = Staff assigned
- ✗ = Staff needed

## CORS Error Fix

### Problem
The `Cache-Control: 'no-cache'` header was blocked by Airtable's CORS policy, causing:
```
Access to fetch at 'https://api.airtable.com/...' has been blocked by CORS policy: 
Request header field cache-control is not allowed by Access-Control-Allow-Headers
```

### Solution
- Removed the `Cache-Control` header from fetch requests
- Kept the timestamp parameter (`&_t=${Date.now()}`) for cache busting
- Added proper error handling to update UI when bookings fail to load

## Testing Verification
1. Navigate to week with bookings (e.g., August 25, 2025)
2. Click on red booking block
3. Allocate staff member with appropriate role
4. Confirm booking turns green
5. Verify no duplicate blocks appear
6. Check Airtable that booking record has employee assigned

## Benefits
1. **Clear Visual Feedback**: Managers instantly see which bookings are staffed
2. **No Duplicates**: Clean calendar view without overlapping elements
3. **Proper Data Structure**: Booking records maintain staff assignments
4. **Time Tracking**: Allocation records still created for payroll/reporting

## Related Documentation
- [Allocation System Optimization](./ALLOCATION_SYSTEM_OPTIMIZATION.md)
- [Staff Allocation Setup](./STAFF_ALLOCATION_SETUP.md)
- [Technical Implementation Guide](./TECHNICAL_IMPLEMENTATION_GUIDE.md)

## API Optimizations (Based on Airtable Documentation)

### Implemented Best Practices

1. **Retry Logic with Exponential Backoff**
   - Handles rate limiting (429 errors) automatically
   - Retries up to 3 times with increasing delays
   - Maximum delay of 5 seconds between retries

2. **Simplified FilterByFormula**
   - Uses cleaner `IS_AFTER` and `IS_BEFORE` with boundary dates
   - Properly URL encodes all filter formulas
   - Removed complex `OR/DATESTR` comparisons

3. **Field Selection for Performance**
   - Only requests necessary fields to reduce payload size
   - Improves response time and reduces bandwidth usage
   - Prevents timeout issues on large datasets

4. **Proper Linked Record Format**
   - Ensures employee IDs are always passed as arrays `[employeeId]`
   - Compatible with Airtable's linked record field requirements

### Performance Benefits
- Faster loading times due to smaller payloads
- More reliable with automatic retry on failures
- Better compatibility with Airtable's API requirements
- Reduced chance of CORS and timeout errors

## Issue 3: Bookings Not Loading (Fixed January 2025)

### Problem
Customer bookings stopped showing on the calendar with 422 errors after API optimizations.

### Root Causes
1. **Wrong Table ID**: Code was using `tblRe0cDmK3bG2kPf` instead of correct ID `tblcBoyuVsbB1dt1I`
2. **Malformed Filter Formula**: Missing closing parenthesis after `IS_BEFORE` function

### Solution
```javascript
// Before (broken):
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';
`IS_BEFORE({Booking Date}, '${nextDayStr}')` +

// After (fixed):
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I'; // Correct table ID
`IS_BEFORE({Booking Date}, '${nextDayStr}'))` // Added missing parenthesis
```

## Issue 4: Alternative Approach - Client-Side Filtering (January 2025)

### Approach
Since Airtable filterByFormula continues to have issues with date field names, switched to:
1. Fetch all PAID bookings without date filter
2. Filter by date range client-side
3. Add debugging to understand field structure

### Features Added
- **Test Booking Creation**: Button to create test bookings for debugging
- **Enhanced Logging**: Shows booking field names and structure
- **Client-Side Filtering**: More reliable than complex filterByFormula

### How to Test
1. Check console for "Sample booking fields" to see actual field names
2. Use "Create Test Booking" button if no bookings exist
3. Test booking will be created for Wednesday of current week
4. Booking should appear as red blocks (onboarding/deloading) if unstaffed

## Deployment
- **Committed**: January 2025
- **Repository**: https://github.com/harry-dev-general/mbh
- **Auto-deployed**: Via Railway to https://mbh-production-f0d1.up.railway.app
