# Daily Run Sheet v2 - Complete Issue Summary

## Overview
The Daily Run Sheet v2 (`/daily-run-sheet-v2.html`) is a FullCalendar-based resource timeline view showing vessels as columns and bookings/allocations as events on a timeline. Multiple issues have been encountered and partially resolved.

## Issues Resolved
1. **Authentication** - Fixed middleware and Supabase initialization
2. **FullCalendar Scheduler Plugin** - Fixed CDN version alignment
3. **Date Navigation** - Fixed date picker and navigation controls
4. **API 500 Error** - Removed invalid Active field filter from boats query
5. **Airtable Date Filtering** - Changed to IS_SAME() function for accurate filtering
6. **Content Security Policy** - Added cdn.jsdelivr.net to allowed sources

## Current Unresolved Issue
**Calendar events not displaying visually** despite:
- Events being created correctly with valid data
- Events existing in calendar memory (`calendar.getEvents()` returns them)
- Resources (vessels) displaying correctly
- No JavaScript errors in console

## Architecture Overview

### Frontend Stack
- FullCalendar v6.1.8 with Scheduler plugin (CDN)
- Vanilla JavaScript (no framework)
- Resource Timeline view (`resourceTimelineDay`)
- Custom CSS for styling

### Backend Stack
- Node.js/Express server
- Airtable database (Bookings Dashboard, Boats tables)
- Supabase for authentication only
- RESTful API endpoints

### Key Files
- `/training/daily-run-sheet-v2.html` - Main HTML page
- `/training/js/daily-run-sheet-calendar.js` - Calendar logic class
- `/api/daily-run-sheet.js` - API module for Airtable queries
- `/server.js` - Express routes and middleware

## Data Flow
1. User authenticates via Supabase
2. Calendar initializes and fetches vessel resources
3. API queries Airtable for today's bookings
4. Bookings transformed to FullCalendar events
5. Events added to calendar with resource associations
6. ❌ Events fail to render visually

## Key Technical Details

### Working Reference Implementation
- `/management-allocations.html` uses FullCalendar successfully
- Uses local JS files vs CDN
- Different view type (timeGridWeek vs resourceTimelineDay)

### Event Structure
```javascript
{
    id: 'booking-recXXX',
    resourceId: 'recNyQ4NXCEtZAaW0', // Vessel ID from Airtable
    title: 'Customer Name',
    start: Date, // JavaScript Date object
    end: Date,
    backgroundColor: '#2196F3',
    classNames: ['booking-main']
}
```

### Console Debug Output
```
Creating resources from vessels: 7 vessels
Processing booking: Peter macnamara vesselId: recNyQ4NXCEtZAaW0
Event added successfully: booking-rec...
Total events in calendar after update: 9
```

## Debugging Attempted
1. Added comprehensive logging throughout event lifecycle
2. Created test events (both inline and dynamic)
3. Verified dates parse correctly to Sydney timezone
4. Checked resource-event associations
5. Force rendered calendar after adding events
6. Added vessel ID debugging to confirm matches

## Hypothesis for Root Cause
Likely one of:
1. **CSS Issue** - Events rendered but hidden
2. **License Issue** - GPL key may not support resource timeline
3. **View Configuration** - Missing required timeline settings
4. **CDN vs Local** - CDN version may have different behavior

## Related Documentation
- See all DAILY_RUN_SHEET_V2_*.md files in this directory
- `/docs/02-features/daily-run-sheet.md` - Feature documentation
- `/docs/04-technical/fullcalendar-integration.md` - Calendar details
