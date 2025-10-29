# Daily Run Sheet v2 - Calendar Events Not Displaying Issue

## Issue Summary
The Daily Run Sheet v2 page (`/daily-run-sheet-v2.html`) successfully loads and displays:
- ✅ Calendar grid with resource timeline view
- ✅ Vessel resources (columns) showing all boats
- ✅ Top statistics (Total Bookings, On Water Now, etc.)
- ✅ Today's Add-ons Required section
- ❌ Booking events on the calendar timeline

## Current State
- **Date**: October 29, 2025
- **Test Bookings**: 2 bookings for "Peter" and "Peter macnamara" on vessel "Sandstone" (ID: `recNyQ4NXCEtZAaW0`)
- **Console Output**: Shows events are being created and added to calendar
- **Visual Result**: No events appear on the timeline

## Technical Analysis

### Working Components
1. **FullCalendar Scheduler**: v6.1.8 loaded via CDN with all plugins
2. **Resources**: Vessels display correctly as columns
3. **API Data**: `/api/daily-run-sheet` returns correct booking data
4. **Event Creation**: Events are created with valid start/end dates and resource IDs
5. **Calendar State**: `calendar.getEvents()` returns all added events

### Console Evidence
```javascript
// Resources created successfully
Creating resources from vessels: 7 vessels
Vessel IDs: [{id: "recNyQ4NXCEtZAaW0", name: "Sandstone"}, ...]

// Events created and added
Transforming bookings to events: 3 bookings
Processing booking: Peter macnamara vesselId: recNyQ4NXCEtZAaW0
Adding event: Peter macnamara to resource: recNyQ4NXCEtZAaW0
Event added successfully: booking-rec...

// Events exist in calendar
Total events in calendar after update: 9
Event in calendar: {title: "Peter macnamara", start: "2025-10-29T01:00:00.000Z", ...}
```

## Approaches Attempted

### 1. API and Data Fixes
- **Fixed 500 Error**: Removed `{Active}=1` filter from boats query (Boats table has no Active field)
- **Fixed Date Filtering**: Changed from direct equality to `IS_SAME({Booking Date}, '${dateString}', 'day')`
- **Result**: API now returns correct data

### 2. Authentication and Initialization
- **Fixed Supabase Auth**: Used centralized `supabase-init-fix.js` module
- **Fixed Calendar Init**: Ensured calendar initializes after authentication
- **Result**: Calendar loads without errors

### 3. Resource and Event Debugging
- **Added Vessel ID Logging**: Shows correct mapping between bookings and vessels
- **Added Date Parse Logging**: Shows dates being created correctly
- **Added Event State Verification**: Confirms events exist in calendar after adding
- **Added Resource Association Check**: Verifies events link to correct resources
- **Result**: All data structures are correct, but events still don't display

### 4. Display Testing
- **Test Event 1 (Dynamic)**: Red TEST EVENT added after data loads
- **Test Event 2 (Inline)**: Green INLINE TEST EVENT added during calendar init
- **Force Render**: Explicitly calls `calendar.render()` after adding events
- **Result**: Neither test event displays

## Technical Discoveries

### 1. Event Structure
Events are created with correct structure:
```javascript
{
    id: 'booking-recXXX',
    resourceId: 'recNyQ4NXCEtZAaW0', // Matches vessel resource ID
    title: 'Customer Name',
    start: Date object (2025-10-29T01:00:00.000Z),
    end: Date object (2025-10-29T05:00:00.000Z),
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
    classNames: ['booking-main']
}
```

### 2. Calendar Configuration
- View: `resourceTimelineDay`
- TimeZone: `Australia/Sydney`
- Resources: Array of vessel objects with matching IDs
- License Key: `GPL-My-Project-Is-Open-Source`

### 3. Event Lifecycle
1. Events created from booking data ✓
2. Events added to calendar via `calendar.addEvent()` ✓
3. Events exist in calendar (verified by `calendar.getEvents()`) ✓
4. Events not rendered visually ✗

## Potential Causes

### 1. CSS/Styling Issue
- Events might be rendered but hidden by CSS
- Z-index or positioning issues
- Missing required FullCalendar CSS

### 2. License Key Issue
- Using GPL license key might have limitations
- Resource timeline view might require commercial license

### 3. View Configuration
- `resourceTimelineDay` view might have specific requirements
- Time slots or date range might not match event times

### 4. Event Association
- Despite correct resource IDs, events might not be properly associated
- Resources might need to be added before events

### 5. Render Timing
- Events might need to be added at a specific lifecycle point
- Calendar might need specific initialization order

## Files Modified

### Core Files
- `/training/daily-run-sheet-v2.html` - Main page with calendar
- `/training/js/daily-run-sheet-calendar.js` - Calendar logic and event handling
- `/api/daily-run-sheet.js` - Backend API for fetching data
- `/server.js` - Express server with API endpoints

### Documentation Created
- `/docs/05-troubleshooting/DAILY_RUN_SHEET_V2_DATE_FILTER_FIX.md`
- `/docs/05-troubleshooting/DAILY_RUN_SHEET_V2_500_ERROR_FIX.md`
- `/docs/05-troubleshooting/DAILY_RUN_SHEET_V2_EVENT_DISPLAY_DEBUG.md`
- `/docs/05-troubleshooting/DAILY_RUN_SHEET_V2_CALENDAR_EVENTS_NOT_DISPLAYING.md`

## Next Steps to Try

1. **Inspect DOM**: Check if events are rendered but hidden
2. **Try Different View**: Test with `timeGridWeek` or basic views
3. **Check License**: Verify GPL license supports resource timeline
4. **Minimal Test**: Create standalone HTML with just FullCalendar
5. **Compare Working Example**: Study `/management-allocations.html` implementation
6. **Browser Console**: Check for any silent JavaScript errors
7. **Network Tab**: Verify all FullCalendar assets load correctly
