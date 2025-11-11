# Calendar Timezone and Grid Alignment Fixes - January 2025

## Issues Resolved

### 1. Y-Axis Grid Misalignment
**Problem**: The calendar grid was not fixed to the Y-axis (time of day), causing click and drag event creation to incorrectly record event times.

**Root Cause**: Mismatch between `slotDuration` (30min/1hr) and `snapDuration` (15min).

**Fix**: Set `slotDuration: '00:15:00'` to match `snapDuration`, ensuring visual grid aligns with interaction grid.

### 2. Click Position vs Form Time Mismatch
**Problem**: Clicking on the calendar showed different times in the "Start Date & Time" and "End Date & Time" form fields than where the user clicked.

**Root Cause**: Timezone handling mismatch - calendar configured for Australia/Sydney but form fields using browser local time.

**Fix**: Implemented proper timezone conversion utilities:
- `formatDateTimeLocal()` - Converts calendar dates to local time for form display
- `localToSydneyDate()` - Converts form input back to Sydney time for storage

### 3. Fixed Slot Height
**Problem**: Variable slot heights could cause Y-axis misalignment.

**Fix**: Added fixed height to time slots: `height: 30px`

## Technical Implementation

### Calendar Configuration Changes
```javascript
slotDuration: '00:15:00', // Changed from 30min/1hr to 15min
slotLabelInterval: '01:00:00', // Keep hourly labels
snapDuration: '00:15:00', // Unchanged - 15min precision
```

### Timezone Conversion Functions
```javascript
// Convert calendar date (Sydney time) to local time for form
function formatDateTimeLocal(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    const localDate = new Date(date);
    return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
}

// Convert form input (local time) to Sydney time for storage
function localToSydneyDate(dateTimeLocalValue) {
    // Complex conversion logic to handle DST correctly
    // See implementation in task-scheduler.html
}
```

### CSS Updates
```css
.fc .fc-timegrid-slot {
    min-height: 30px;
    height: 30px; /* Fixed height for Y-axis alignment */
}
```

## Testing Checklist
- [ ] Click on calendar grid - form shows correct time
- [ ] Drag to create event - correct start/end times
- [ ] Test across different timezones
- [ ] Test during Sydney DST transitions
- [ ] Verify 15-minute precision works correctly
- [ ] Check mobile view still functions properly

## Related Files
- `/training/task-scheduler.html` - Main implementation
- Memory ID: 10409524 - Previous calendar configuration (now outdated)
