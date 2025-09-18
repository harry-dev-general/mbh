# Dashboard Overview Zeros Issue Investigation

## Issue Report
Date: September 18, 2025
Reporter: User noticed all dashboard stats showing zero despite having "Bronte" rostered for today

## Root Causes Identified

### 1. Incorrect Allocations Table ID
- **Issue**: The API was using `tblcBoyuVsbB1dt1I` for shift allocations
- **Actual ID**: Should be `tbl22YKtQXZtDFtEX` (as used in frontend)
- **Impact**: No shift allocation data was being retrieved

### 2. Potential Data Structure Issues
The system is looking for staff in two places:
1. **Shift Allocations Table** - For general shift assignments
2. **Bookings Dashboard** - For specific booking assignments (Onboarding/Deloading)

If "Bronte" is only in the Roster table (not in Allocations), they won't be counted.

### 3. Roster vs Allocations Confusion
- **Roster Table** (`tblGv7fBQoKIDU5jr`): Shows availability
- **Allocations Table** (`tbl22YKtQXZtDFtEX`): Shows actual shift assignments
- **Key Question**: Is "accepted" status required for staff to show as "on duty"?

## Debugging Enhancements Added

1. **Detailed Logging**:
   - Log booking counts
   - Log shift allocation counts
   - Log staff counts from each source
   - Log table field names for investigation

2. **Date Context Fix**:
   - Explicitly set to September 18, 2025 when no date provided
   - Ensures consistency with system context

3. **Roster Table Fallback**:
   - Added code to check Roster table if no allocations found
   - Currently just logs for investigation

## Next Steps

1. **Check Railway Logs**: Look for the new debug output to see:
   - How many bookings for Sept 18
   - How many shift allocations found
   - Field names in the allocations table

2. **Verify Data Flow**:
   - Is Bronte in the Shift Allocations table or only in Roster?
   - Do shift allocations need "Accepted" status?
   - Are dates matching correctly?

3. **Potential Solutions**:
   - May need to also check Roster table for "on duty" staff
   - May need to filter by acceptance status
   - May need to handle different date formats

## Console Logs Analysis
From the user's console:
- `Employee record found: recdInFO4p3ennWpe` - Bronte's employee ID
- `Loaded 5 bookings for week 2025-09-15 to 2025-09-21` - Bookings exist
- The calendar is working but overview stats are not

This suggests the data exists but isn't being counted properly in the overview stats.
