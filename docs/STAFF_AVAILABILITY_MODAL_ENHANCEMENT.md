# Staff Availability Modal Enhancement

## Overview
Added interactive functionality to the Available Staff container in the management-allocations page. Staff members can now be clicked to display a detailed calendar view of their weekly availability.

## Date Implemented
Date of implementation specified in the documentation

## What Was Added

### 1. New Modal Component
- **Staff Availability Modal**: A popup modal that displays detailed availability information
- **Calendar View**: Weekly grid showing each day's availability status
- **Time Ranges**: Shows specific hours when staff is available
- **Notes Display**: Shows any notes added by staff for specific days
- **Weekly Summary**: Displays total days available out of 7

### 2. Visual Enhancements to Staff Items
- **Hover Effect**: Staff items now show a subtle shadow and arrow icon on hover
- **Visual Feedback**: Arrow icon appears on the right side indicating clickability
- **Disabled State**: Unavailable staff members don't show the arrow and can't be clicked

### 3. CSS Styles Added
```css
/* Enhanced staff item hover effects */
.staff-item:hover {
    background: #e8f5e9;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.staff-item:hover::after {
    content: '\f054'; /* Font Awesome arrow */
    /* Positioned on the right side */
}

/* Calendar grid styling */
.availability-day {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    min-height: 120px;
}

/* Status indicators */
.availability-status.available {
    background: #d4edda;
    color: #155724;
}

.availability-status.unavailable {
    background: #f8d7da;
    color: #721c24;
}
```

### 4. JavaScript Functions
- **`showStaffAvailabilityModal(staffId, staffName)`**: Opens the modal and populates the calendar
- **`closeStaffAvailabilityModal()`**: Closes the modal with animation
- **Click Handler**: Added to available staff items in the renderStaffList function

## How It Works

### User Flow
1. Manager views the Available Staff panel on the left sidebar
2. Hovering over an available staff member shows an arrow icon
3. Clicking on a staff member opens the availability modal
4. Modal displays a 7-day calendar view for the current week
5. Each day shows:
   - Day name and date
   - Availability status (Available/Not Available)
   - Time range (if specified)
   - Any notes from the staff member
6. A summary shows total days available
7. User can close the modal via the X button or Close button

### Data Integration
The modal pulls data from the Roster table in Airtable:
- **Employee** (linked field) - matches to staff ID
- **Date** - specific date for availability
- **Available From** - start time
- **Available Until** - end time
- **Notes** - optional notes field

### Visual Indicators
- **Green background**: Days when staff is available
- **Red background**: Days when staff is not available
- **Blue highlight**: Today's date
- **Clock icon**: Shows time ranges when specified

## Technical Implementation

### Modal Structure
```html
<div id="staffAvailabilityModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Staff Availability - [Staff Name]</h3>
            <button class="close-btn">×</button>
        </div>
        <div class="modal-body">
            <div class="availability-calendar">
                <!-- Legend -->
                <!-- 7-day grid -->
                <!-- Summary -->
            </div>
        </div>
    </div>
</div>
```

### Data Filtering
```javascript
// Get staff's roster records for the week
const staffAvailability = rosterData.filter(record => {
    const employeeId = record.fields['Employee']?.[0];
    return employeeId === staffId;
});

// For each day, find matching availability
const dayAvailability = staffAvailability.find(record => {
    const recordDate = record.fields['Date'];
    return recordDate === dateStr;
});
```

## Benefits

1. **Improved Visibility**: Managers can quickly see detailed availability without navigating away
2. **Better Planning**: Visual calendar makes it easy to understand weekly patterns
3. **Time Specificity**: Shows exact hours when staff is available
4. **Context**: Notes provide additional context for availability
5. **User-Friendly**: Simple click interaction with clear visual feedback

## Future Enhancements

Potential improvements for future iterations:
1. **Multi-week View**: Allow navigation to previous/next weeks
2. **Allocation Overlay**: Show existing allocations on the availability calendar
3. **Quick Allocation**: Add allocation buttons directly in the modal
4. **Availability Patterns**: Highlight recurring availability patterns
5. **Export Function**: Allow exporting availability data
6. **Mobile Optimization**: Improve modal display on mobile devices

## Testing Checklist

- [ ] Click on available staff member opens modal
- [ ] Staff name displays correctly in modal header
- [ ] All 7 days of the week are shown
- [ ] Available days show green status
- [ ] Unavailable days show red status
- [ ] Today's date is highlighted in blue
- [ ] Time ranges display when available
- [ ] Notes display when present
- [ ] Weekly summary shows correct count
- [ ] Close button works
- [ ] X button works
- [ ] Clicking outside modal closes it
- [ ] Unavailable staff cannot be clicked

## Files Modified

1. `/training/management-allocations.html`
   - Added CSS styles for availability modal
   - Added HTML structure for modal
   - Added JavaScript functions for modal management
   - Modified renderStaffList to add click handlers
   - Enhanced staff item hover effects

## Dependencies

- Font Awesome 6.0 (for icons)
- Existing Airtable integration
- Roster table data structure

## Notes

- The modal uses the current week's data (same as the main schedule grid)
- Availability is determined by presence of a roster record for that date
- Time defaults to "00:00 - 23:59" if not specified
- The enhancement maintains consistency with the existing UI design patterns
