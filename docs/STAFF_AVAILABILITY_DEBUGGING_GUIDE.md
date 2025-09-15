# Staff Availability Debugging Guide

## Issue: Available Staff Display Discrepancy

### Problem Description
The Available Staff panel in `/management-allocations.html` sometimes shows incorrect availability counts compared to what's in the Airtable Roster table.

### Common Causes

1. **Data Sync Issues**: The page loads roster data once on initial load. If records are added/modified in Airtable after the page loads, the display will be out of sync.

2. **Pagination**: If there are more than 100 roster records, the original code wasn't handling pagination properly.

3. **Week Calculation**: The week start/end dates must match exactly between the UI and Airtable records.

### Debugging Steps

1. **Check Console Logs**: Open browser developer tools and look for:
   ```
   Staff availability summary for week: YYYY-MM-DD
   - Staff Name: X days (Day1, Day2, ...)
   ```

2. **Use Refresh Button**: Click the ↻ button in the Available Staff panel header to reload roster data.

3. **Verify Week Dates**: Ensure the week shown in the UI matches the `Week Starting` field in Airtable roster records.

### Recent Improvements

1. **Added Refresh Button**: Users can now manually refresh staff availability data without reloading the page.

2. **Improved Pagination**: The system now properly handles Airtable's pagination to fetch all roster records.

3. **Enhanced Logging**: More detailed console output shows exactly which records are being loaded and filtered.

### Code Locations

- **Data Loading**: `loadStaffAvailability()` function fetches roster data from Airtable
- **Rendering**: `renderStaffList()` function displays the staff availability counts
- **Filtering**: Client-side filtering happens based on `Week Starting` field and date ranges

### Airtable Structure

**Roster Table** (`tblwwK1jWGxnfuzAN`):
- `Employee`: Linked record to Employee Details
- `Week Starting`: Monday date in YYYY-MM-DD format
- `Date`: Specific date for this availability
- `Day`: Day name (Monday, Tuesday, etc.)
- `Available From`/`Available Until`: DateTime fields for shift times
- `Availability Status`: Usually "Active"

### Troubleshooting Tips

1. **If counts are wrong**: Click refresh button and check console logs
2. **If no staff show as available**: Verify roster records exist for the current week
3. **If specific staff missing**: Check their Employee ID matches between tables
4. **If dates seem off**: Remember the system uses Monday as week start
