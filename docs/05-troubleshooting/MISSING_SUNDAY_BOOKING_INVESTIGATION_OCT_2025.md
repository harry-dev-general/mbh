# Missing Sunday Booking Investigation - October 2025

## Issue Description
A booking for Minh Mai on Sunday, October 26, 2025, was not appearing on the `/management-allocations.html` page's Weekly Calendar component, despite existing in Airtable.

## Investigation Details

### Booking Information (from Airtable)
- **Customer**: Minh Mai
- **Booking Date**: 2025-10-26 (Sunday)
- **Status**: PAID
- **Booking Code**: JMAN-141025
- **Time**: 08:30 am - 04:30 pm (8 hours)
- **Onboarding Employee**: Bronte Sprouster (recyoRnqUxVuMjW17)
- **Deloading Employee**: Joshua John Vasco (recxBgElxxfxyp2SN)
- **Boat**: recNyQ4NXCEtZAaW0

### Console Logs Showed
- Page looking for bookings between 2025-10-20 and 2025-10-26
- Found 100 PAID/PART bookings total
- Found 11 bookings for current week
- But Minh Mai's booking was not appearing in the calendar

## Root Causes Investigated

### 1. Client-Side Status Filter (PARTIALLY FIXED)
The original code was filtering for only 'PAID' or 'PART' status bookings:
```javascript
if (status !== 'PAID' && status !== 'PART') {
    return false;
}
```

We updated this to include 'Confirmed' status:
```javascript
if (status !== 'PAID' && status !== 'PART' && status !== 'Confirmed') {
    return false;
}
```

However, since Minh Mai's booking has 'PAID' status, this was not the issue.

### 2. Calendar Week View Configuration
The calendar is configured with:
- `firstDay: 1` (Monday as first day)
- Week view should show Monday through Sunday
- Time slots from 06:00:00 to 24:00:00

### 3. Debug Logging Added
1. **Booking Filter Debug**: Added logging for Minh Mai bookings in the filter function
2. **Calendar Transform Debug**: Added logging in `transformBookingsToEvents` function
3. **Sunday Events Debug**: Added specific logging for Sunday events
4. **Calendar Date Range Debug**: Added logging to show what dates the calendar is displaying
5. **Comprehensive Customer Name Logging**: Added logging to display ALL customer names in bookings
6. **Case-Insensitive Name Matching**: Updated Minh Mai detection to check for variations (lowercase "minh" or "mai")

## Current Status
The following debug logging has been added and deployed:
- When Minh Mai's booking is processed during filtering
- When Minh Mai's booking is transformed to a calendar event
- Total booking events created
- Sunday-specific booking events
- Calendar date range display
- **NEW**: All customer names and their status/date
- **NEW**: Sunday-specific bookings with full details
- **NEW**: Case-insensitive matching for names containing "minh" or "mai"

## Recent Findings
Based on the latest console logs provided by the user:
- Total bookings: 11
- Total booking events created: 22 (suggests each booking creates 2 events for onboarding/deloading)
- Sunday booking events: Array(4) - This indicates 4 events ARE being created for Sunday
- However, the specific "Minh Mai" debug logs are NOT triggering

This suggests that either:
1. The customer name is not exactly "Minh Mai" in the data
2. The booking is present but under a different customer name format

## Next Steps
1. Have the user refresh the page and check the console logs for:
   - **"All customer names in bookings:"** - This will show EVERY customer name exactly as stored
   - **"Sunday (2025-10-26) bookings:"** - This will show ALL Sunday bookings with full details
   - **"Processing booking with customer name containing 'minh' or 'mai':"** - Case-insensitive match
   - **"Sunday booking events:"** - To see what events are actually created

2. Based on the debug output, we can determine:
   - The exact customer name format in the data (might be "Mai Minh" or have extra spaces/characters)
   - If the booking exists but under a different name
   - If the Sunday events are being created but not displayed
   - If there's a data formatting issue preventing the match

## Possible Additional Causes
1. **Timezone Issues**: The booking date might be parsed differently due to timezone
2. **Calendar Event Creation**: The event might not be created with the correct date/time
3. **Visual Rendering**: The event might exist but not be visible due to CSS or overlapping issues
4. **Date Range Edge Case**: Sunday being the last day of the week might have an edge case

## Code Changes Made
- Updated status filter to include 'Confirmed' bookings
- Added comprehensive debug logging throughout the booking processing pipeline
- Deployed to production for testing
