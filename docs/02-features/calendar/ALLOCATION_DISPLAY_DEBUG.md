# Allocation Display Debugging

**Date**: October 11, 2025  
**Issue**: Test Staff allocation for Sunday Oct 12 not showing in calendar  

## Current Status

The allocation EXISTS in Airtable:
- Record ID: `recLtmGIuKCo52mrU`
- Name: "2025-10-12 - Test Staff"
- Shift Date: "2025-10-12"
- Employee: ["recU2yfUOIGFsIuZV"] (Test Staff)
- Start Time: "21:00" (9 PM)
- End Time: "11:12" (Note: This appears to be an invalid time causing negative duration)
- Duration: -9.8 hours

## Debugging Steps Taken

### 1. Switched to Client-Side Filtering
- Removed Airtable filterByFormula (known to be unreliable)
- Now fetching ALL allocations and filtering client-side
- This matches the production approach

### 2. Added Pagination Support
- Implemented pagination loop to ensure ALL records are fetched
- Previously only fetching first 100 records (page size limit)

### 3. Enhanced Debugging
- Log all allocation dates fetched
- Specific Test Staff allocation debugging
- Date parsing and comparison details
- Shows allocations filtered out and why

## Expected Console Output

After the changes, you should see:
```
Total allocations fetched: 28+
All allocation dates:
- 2025-10-12: 2025-10-12 - Test Staff
- 2025-10-11: 2025-10-11 - Joshua John Vasco
... (other dates)

Debug Test Staff allocation: {
  name: "2025-10-12 - Test Staff",
  rawShiftDate: "2025-10-12",
  parsedDate: Sun Oct 12 2025 00:00:00,
  formatted: "2025-10-12"
}

Test Staff date comparison: {
  dateStr: "2025-10-12",
  weekStartStr: "2025-10-06",
  weekEndStr: "2025-10-12",
  isInRange: true,
  comparison: "2025-10-12 >= 2025-10-06 && 2025-10-12 <= 2025-10-12"
}
```

## Potential Issues

1. **Invalid Time Entry**: The end time "11:12" with start time "21:00" creates a negative duration
   - This might cause FullCalendar to reject the event
   - Consider fixing to "23:12" or appropriate end time

2. **Date Boundary**: Sunday (Oct 12) is the last day of the week
   - Confirm week calculation includes Sunday correctly

## Next Steps

1. Check console for detailed debug output
2. If allocation is found but not displayed, check FullCalendar event creation
3. Consider fixing the invalid end time in Airtable
