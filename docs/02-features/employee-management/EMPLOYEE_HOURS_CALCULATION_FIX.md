# Employee Hours Calculation Fix

## Issue
When navigating to previous weeks in the Employee Directory, the system was throwing an error:
```
TypeError: duration.includes is not a function
```

This was preventing employee hours from being calculated and displayed correctly.

## Root Cause
The `calculateHoursForWeek` function was relying on the `Duration` field from the Shift Allocations table, which:
1. May not always be a string (could be number, null, or undefined)
2. May not exist for all records
3. May be in different formats (e.g., "6:30", "6.5", or missing)

## Solution
Aligned the hours calculation with the proven implementation from the "My Schedule" page:
- Calculate duration from `Start Time` and `End Time` fields instead of relying on `Duration`
- Added proper error handling for missing or invalid time data
- Handle overnight shifts where end time is before start time

## Implementation Details

### Previous Code (Error-prone):
```javascript
const duration = allocation.fields['Duration'];
if (duration) {
    if (duration.includes(':')) { // Error if duration is not a string
        const [hours, minutes] = duration.split(':').map(Number);
        totalMinutes += hours * 60 + (minutes || 0);
    }
}
```

### New Code (Reliable):
```javascript
const startTime = allocation.fields['Start Time'];
const endTime = allocation.fields['End Time'];

if (startTime && endTime) {
    try {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startTotalMinutes = startHour * 60 + (startMin || 0);
        const endTotalMinutes = endHour * 60 + (endMin || 0);
        let durationMinutes = endTotalMinutes - startTotalMinutes;
        
        // Handle overnight shifts
        if (durationMinutes < 0) {
            durationMinutes += 24 * 60;
        }
        
        totalMinutes += durationMinutes;
    } catch (error) {
        console.error('Error calculating duration for allocation:', {...});
    }
}
```

## Benefits
1. **Consistency**: Uses same calculation method as employee's "My Schedule" page
2. **Reliability**: Not dependent on potentially missing or inconsistent Duration field
3. **Error Handling**: Gracefully handles missing or invalid data
4. **Debug Logging**: Added logging to help troubleshoot issues
5. **Overnight Shifts**: Properly handles shifts that span midnight

## Verification
The system now correctly:
- Loads employee data for any week
- Calculates hours from Start/End times
- Displays "0h" when no allocations exist
- Logs warnings for allocations missing time data

## Related Files
- `/training/employee-directory.html` - Updated implementation
- `/training/my-schedule.html` - Reference implementation

---

*Fixed: Sep 2, 2025*  
*Issue: Employee hours calculation error when viewing past weeks*
