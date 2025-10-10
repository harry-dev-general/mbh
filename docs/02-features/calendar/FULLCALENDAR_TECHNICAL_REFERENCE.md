# FullCalendar Technical Reference

**Last Updated**: October 10, 2025  
**Component**: Weekly Schedule Calendar  
**Location**: `/training/management-allocations.html`  
**FullCalendar Version**: 6.1.19  

## Overview

The MBH Staff Portal's calendar component was migrated from a custom CSS Grid implementation to FullCalendar v6 to resolve event overlap issues and improve overall functionality. This document details the technical implementation, data flow, and integration points.

## Architecture

### Core Components

1. **FullCalendar Instance**
   - Global variable: `calendar`
   - Container: `<div id="calendar"></div>`
   - CDN: `unpkg.com` (jsdelivr blocked by CSP)

2. **Data Sources**
   - Allocations: `allocationsData` (from Shift Allocations table)
   - Bookings: `bookingsData` (from Bookings table)
   - Staff: `staffData` (from Employee Details table)
   - Boats: `boatsData` (from Boats table)

3. **View Configuration**
   - Default: `timeGridWeek` (Monday-Sunday)
   - Alternative: `timeGridDay` (with auto-jump to today)
   - Time Range: 6:00 AM - 8:00 PM
   - Slot Duration: 30 minutes
   - Timezone: Australia/Sydney

## Data Transformation

### Allocations → Events

```javascript
transformAllocationsToEvents(allocationsData)
```

Maps allocation records to FullCalendar events with:
- ID format: `allocation-{recordId}`
- Title: Employee name or "Unassigned"
- Color coding based on Response Status:
  - Green (`allocation-accepted`): Accepted
  - Orange (`allocation-pending`): Pending
  - Red (`allocation-declined`): Declined
  - Gray (`allocation-unassigned`): No employee assigned

### Bookings → Events

```javascript
transformBookingsToEvents(bookingsData)
```

Creates two events per booking (onboarding/deloading):
- Onboarding ID: `booking-on-{recordId}`
- Deloading ID: `booking-off-{recordId}`
- Title format: `🚢 ON {Customer}` / `🏁 OFF {Customer}`
- Field fallbacks:
  - `Onboarding Time` || `Start Time`
  - `Deloading Time` || `Finish Time`
- Time conversion: 12-hour → 24-hour format

## Event Interaction

### Click Handlers

1. **Empty Cell Click** (`dateClick`)
   - Opens allocation modal
   - Pre-fills date and time from clicked slot
   - Rounds time to nearest 30-minute slot

2. **Event Click** (`eventClick`)
   - Allocation events → `openAllocationEditModal()`
   - Booking events → `openBookingAllocationModal()`
   - Passes complete record data via `extendedProps`

### Custom Event Rendering

Events display:
- Staff name and status icons (✅/❌/⏳)
- Add-on indicator (orange "+" badge)
- Notes indicator (📝)
- Boat assignment
- Response status

## Navigation & Views

### Week Navigation
- Handled by FullCalendar's built-in prev/next buttons
- `datesSet` callback updates `currentWeekStart`
- Triggers data reload for new week

### Day View
- Custom button: `todayDayView`
- Auto-jumps to current day when clicked
- Active state managed via `viewDidMount`

## Styling Architecture

### CSS Classes

```css
/* Event status colors */
.allocation-accepted { background: #10b981; }
.allocation-pending { background: #f59e0b; }
.allocation-declined { background: #ef4444; }
.allocation-unassigned { background: #9ca3af; }

/* Booking types */
.booking-onboarding { background: #3b82f6; }
.booking-deloading { background: #8b5cf6; }
.booking-needs-staff { opacity: 0.7; }

/* Layout control */
.fc-timegrid-slot { height: 50px; }
@media (max-width: 768px) {
    .fc-timegrid-slot { height: 40px !important; }
}
```

### Theme Integration
- Primary color: #1B4F72 (navy blue)
- Secondary color: #2E86AB
- Matches existing MBH branding

## Data Flow

1. **Initial Load**
   ```
   checkAuth() → loadWeekData() → parallel load:
   - loadStaffAvailability()
   - loadStaffData()
   - loadBookings()
   - loadAllocations()
   - loadBoats()
   → renderScheduleGrid() → updateCalendarEvents()
   ```

2. **Event Updates**
   ```
   Form submission → Airtable API → loadWeekData() → updateCalendarEvents()
   ```

3. **Week Navigation**
   ```
   User clicks prev/next → datesSet callback → update currentWeekStart → loadWeekData()
   ```

## Airtable Integration

### Field Mappings

**Shift Allocations Table**
- `Shift Date`: Event date
- `Start Time` / `End Time`: Event times
- `Employee`: Linked to Employee Details
- `Response Status`: Determines color
- `Notes`: Displayed with 📝 icon

**Bookings Table**
- `Booking Date`: Event date
- `Onboarding Time` / `Start Time`: Onboarding event
- `Deloading Time` / `Finish Time`: Deloading event
- `Customer Name`: Event title
- `Boat`: Linked to Boats table
- `Add-ons`: Shows orange badge if present

### API Endpoints
- Base: `https://api.airtable.com/v0/${BASE_ID}`
- Tables:
  - Allocations: `tbl22YKtQXZtDFtEX`
  - Bookings: `tblcBoyuVsbB1dt1I`
  - Employee Details: `tblxGdQWMPgR6XkR5`
  - Boats: `tblJC0PDpgYaYpI7A`

## Performance Considerations

1. **Calendar Initialization**
   - Only initializes once (checks for existing instance)
   - Subsequent calls update events only

2. **Event Rendering**
   - Batch updates via `removeAllEvents()` + `addEvent()`
   - No DOM manipulation for individual events

3. **Data Loading**
   - Parallel API calls for all data sources
   - Week-based filtering to limit data volume

## Browser Compatibility

Tested and verified on:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile Safari (iOS)
- Mobile Chrome (Android)

## Known Limitations

1. **Slot Height**: FullCalendar v6 removed `slotHeight` option; controlled via CSS
2. **Print Support**: Not optimized for printing
3. **Drag & Drop**: Not implemented (events are read-only)
4. **Recurring Events**: Not supported (each allocation is individual)

## Error Handling

1. **API Failures**: Logged to console, user alerted
2. **Missing Data**: Graceful fallbacks (e.g., "Unknown" for customer name)
3. **Calendar Errors**: Wrapped in try-catch to prevent page breakage

## Security Considerations

1. **API Key**: Stored in environment variable
2. **CSP Compliance**: Using unpkg.com CDN (approved)
3. **XSS Prevention**: All user data escaped in event rendering
4. **CORS**: Handled by Airtable API

## Future Enhancement Opportunities

1. **Resource Timeline**: Show staff as rows with their allocations
2. **Conflict Detection**: Highlight double-bookings
3. **Bulk Operations**: Select multiple slots for allocation
4. **Export**: Generate PDF/Excel schedules
5. **Real-time Updates**: WebSocket integration for live changes
6. **Recurring Shifts**: Template-based allocation creation

## Debugging Tips

1. **Console Logging**: Extensive logs for data loading (remove for production)
2. **Event Data**: Access via `calendar.getEvents()`
3. **Current View**: Check `calendar.view.type`
4. **Date Issues**: Verify timezone with `calendar.getOption('timeZone')`

## Rollback Procedure

If critical issues arise:

1. Remove FullCalendar CDN links
2. Change `<div id="calendar">` back to `<div id="scheduleGrid" class="time-grid">`
3. Restore original functions from git history:
   - `renderScheduleGrid()`
   - `renderAllocations()`
   - `renderBookingsOnGrid()`
4. Remove FullCalendar-specific CSS

Original implementation preserved in git history at commit before FullCalendar migration.
