# Vessel Maintenance Timezone Display Fix - October 2025

## Issue Summary
The "Last Check" times displayed on the `/vessel-maintenance.html` page were showing incorrect times for vessel maintenance checks. The displayed times were showing in UTC rather than Sydney local time, causing confusion for staff.

### Specific Example
- **Vessel**: Polycraft Yam
- **Displayed Time**: 12:10 am
- **Expected Time**: 11:10 am
- **Checklist ID**: MGMT-UPDATE-2025-10-24-1761264617441
- **Airtable Created Time**: 2025-10-24T00:10:18.000Z (UTC)

## Technical Discovery

### Root Cause
The issue was in the `api/vessel-status.js` file where the `toLocaleString()` method was formatting dates without explicitly specifying the timezone. This caused inconsistent behavior where times were displayed in UTC rather than Sydney time.

### Airtable Time Storage
- Airtable stores all timestamps in UTC format
- Example: `2025-10-24T00:10:18.000Z` represents 12:10 AM UTC
- Sydney is UTC+11 during daylight saving time (October)
- This UTC time should display as 11:10 AM Sydney time

## Attempted Solutions

### Solution 1: Initial Field Mapping Fix
**Status**: Partially successful

First, we addressed the "N/A" display issue by fixing field mapping:
- Updated frontend to use `vessel.lastCheck?.timeFormatted` instead of `vessel.lastCheckType`
- Added `completedBy` field to the API response
- Changed from "Days Since Check" to "Last completed by" field

**Result**: Fields were displaying data, but times were still incorrect.

### Solution 2: Timezone Specification (SUCCESSFUL)
**Status**: Fixed the issue

Added explicit timezone to the date formatting in `vessel-status.js`:

```javascript
timeFormatted: lastCheckTime ? lastCheckTime.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Australia/Sydney'  // Added this line
}) : null,
```

**Result**: Times now correctly display in Sydney timezone.

## Technical Implementation Details

### Files Modified
1. **`api/vessel-status.js`** (Line 365-372)
   - Added `timeZone: 'Australia/Sydney'` to toLocaleString options
   - This ensures consistent timezone conversion regardless of server timezone

### Testing Verification
```javascript
// Test command used to verify timezone conversion
const d = new Date('2025-10-24T00:10:18.000Z');
console.log('UTC:', d.toISOString());
// Output: 2025-10-24T00:10:18.000Z

console.log('AU Format:', d.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney'
}));
// Output: 24 Oct 2025, 11:10 am
```

## Related Components

### Airtable Tables Involved
- **Post-Departure Checklist** (tblYkbSQGP6zveYNi)
  - Uses "Created time" field for last check time
  - Contains "Completed by" field
  
- **Pre-Departure Checklist** (tbl9igu5g1bPG4Ahu)
  - Uses "Created time" field for last check time
  - Contains "Completed by" field

### API Endpoints
- `/api/vessels/maintenance-status` - Returns vessel status with formatted times

### Frontend Pages
- `/vessel-maintenance.html` - Main vessel maintenance dashboard
- `/management-dashboard.html` - Fleet section displays same information

## Lessons Learned

1. **Always specify timezone explicitly** when formatting dates for display, especially in applications serving a specific geographic region.

2. **UTC storage is correct** - Airtable's practice of storing times in UTC is standard. The issue was in the display layer, not the data layer.

3. **Server timezone can vary** - Railway deployments may run in different timezones, so relying on server timezone for date formatting is unreliable.

4. **Testing timezone issues** - Always test with actual UTC timestamps to verify correct conversion to local time.

## Future Considerations

1. Consider creating a centralized date formatting utility that always uses Sydney timezone
2. Add timezone display to the UI (e.g., "11:10 am AEDT") for clarity
3. Document timezone handling in the codebase for future developers
4. Consider user preference for timezone display if the system expands beyond Sydney

## Deployment Status
- Fix committed: October 24, 2025
- Pushed to main branch
- Live on Railway production environment
