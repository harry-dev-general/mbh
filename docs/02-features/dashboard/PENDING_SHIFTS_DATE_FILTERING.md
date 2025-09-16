# Pending Shifts Date Filtering

**Last Updated**: September 16, 2025  
**Version**: 1.0

## Overview

The Pending Shift Responses component on the staff dashboard now filters out past shifts and bookings, showing only current and future allocations that require a response. This improves UI relevance and prevents confusion about outdated assignments.

## Problem Statement

Previously, the Pending Shift Responses section displayed all shifts where staff had not responded, including those from past dates. This created clutter and confusion as staff cannot meaningfully respond to shifts that have already occurred.

## Solution Implementation

### Date Filtering Logic

The system now compares shift/booking dates against the current date at midnight (start of today) and only displays items that are:
- Today (current date)
- Future dates

### Technical Implementation

#### General Allocations (`loadGeneralAllocations()`)

```javascript
async function loadGeneralAllocations() {
    // Get current date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ... fetch allocations ...
    
    // Filter for this employee's allocations and exclude past dates
    return data.records
        .filter(record => {
            const employeeField = record.fields['Employee'];
            const shiftDate = record.fields['Shift Date'];
            
            // Check if assigned to this employee
            const isAssignedToEmployee = employeeField && 
                Array.isArray(employeeField) && 
                employeeField.includes(employeeRecordId);
            
            // Check if shift date is in the future (or today)
            const shiftDateObj = shiftDate ? new Date(shiftDate) : null;
            const isFutureShift = shiftDateObj && shiftDateObj >= today;
            
            return isAssignedToEmployee && isFutureShift;
        })
        .map(record => ({
            // ... map to display format ...
        }));
}
```

#### Booking Allocations (`loadBookingAllocations()`)

```javascript
async function loadBookingAllocations() {
    // Get current date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ... fetch bookings ...
    
    data.records.forEach(record => {
        const fields = record.fields;
        const bookingDate = fields['Booking Date'];
        
        // Skip if booking date is in the past
        const bookingDateObj = bookingDate ? new Date(bookingDate) : null;
        if (!bookingDateObj || bookingDateObj < today) {
            return; // Skip past bookings
        }
        
        // ... process current/future bookings ...
    });
}
```

## Key Considerations

### Timezone Handling

The implementation uses local browser time for date comparisons:
- `new Date()` creates date in user's timezone
- `setHours(0, 0, 0, 0)` sets to midnight local time
- Airtable dates are parsed as local dates

### Edge Cases

1. **Today's Shifts**: Included to allow last-minute responses
2. **No Date**: Filtered out (treated as invalid)
3. **Multiple Allocations**: Each checked independently

### Performance

- Filtering happens client-side after API fetch
- No additional API calls required
- Minimal performance impact

## User Experience

### Before
- Shows all pending shifts regardless of date
- Cluttered interface with irrelevant past shifts
- Confusion about which shifts need attention

### After
- Only shows today's and future shifts
- Cleaner, more relevant interface
- Clear focus on actionable items

## Testing

### Test Scenarios

1. **Past Shift**: Create shift for yesterday → Should not appear
2. **Today's Shift**: Create shift for today → Should appear
3. **Future Shift**: Create shift for tomorrow → Should appear
4. **No Date**: Create shift without date → Should not appear

### Verification Steps

1. Log in as staff member with past and future allocations
2. Check Pending Shift Responses section
3. Verify only today's and future shifts appear
4. Confirm past shifts are hidden
5. Test accept/decline functionality on visible shifts

## Related Features

This filtering improves:
- Staff productivity (focus on relevant tasks)
- Dashboard performance (fewer items to render)
- Overall user experience (less confusion)

## Configuration

No configuration required - the feature is automatically active for all users.

## Browser Compatibility

Works on all modern browsers that support:
- `Date` object
- `Array.filter()`
- `Array.includes()`

## Future Enhancements

1. **Time-based Filtering**: Hide shifts that started more than 1 hour ago
2. **Preference Setting**: Allow users to show/hide past shifts
3. **Archive View**: Separate section for viewing past shift history
4. **Notification Badge**: Show count of pending future shifts

## Related Documentation

- [Dashboard Overview](./DASHBOARD_OVERVIEW.md)
- [Shift Allocation System](../allocations/SHIFT_ALLOCATIONS.md)
- [Staff Schedule View](./MY_SCHEDULE.md)
