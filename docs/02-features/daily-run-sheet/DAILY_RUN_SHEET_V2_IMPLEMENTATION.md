# Daily Run Sheet v2 - Calendar Implementation

## Overview

A new enhanced version of the Daily Run Sheet has been implemented using FullCalendar's resource timeline view. This provides a more interactive and feature-rich experience for managing daily boat operations.

## Key Features

### 1. Resource Timeline View
- **Vessels as Resources**: Each vessel appears as a row with status indicators
- **Visual Status**: Color-coded vessel status (Ready, Preparing, On Water, etc.)
- **Resource Gauges**: Mini indicators for fuel, water, and gas levels

### 2. Enhanced Event Display
- **Booking Blocks**: Main booking events shown in blue
- **Allocation Blocks**: 
  - Onboarding (green when staffed, red when unassigned)
  - Deloading (blue when staffed, red when unassigned)
- **Add-on Indicators**: Orange badge (+) shows bookings with add-ons

### 3. Interactive Features
- **Click Events**: Click any event to view full booking details
- **Admin Controls**:
  - Click on allocations to assign/change staff
  - Drag allocations to adjust times
  - Create new allocations by clicking in booking timeframes

### 4. View Options
- **Timeline View**: Horizontal timeline with vessels as rows
- **Grid View**: Vertical time grid with vessels as columns
- **Mobile View**: Automatically switches to list view on small screens

### 5. Live Updates
- **Auto-refresh**: Data refreshes every 30 seconds
- **Current Time Indicator**: Red line shows current time
- **Real-time Clock**: Display updates every minute

## Technical Implementation

### Files Created
1. `daily-run-sheet-v2.html` - Main HTML page
2. `js/daily-run-sheet-calendar.js` - Calendar logic and interactions
3. `css/daily-run-sheet-calendar.css` - Styling and responsive design
4. `api/update-allocation.js` - API endpoint for updating allocations

### Key Technologies
- **FullCalendar v6**: With Scheduler plugin for resource timeline
- **Supabase Auth**: For user authentication and role checking
- **Airtable API**: For data persistence
- **Responsive Design**: Mobile-first approach

## Usage

### For Staff
- View daily bookings and allocations
- See vessel status and resource levels
- Check add-ons required for the day
- View booking details by clicking events

### For Management/Admin
- All staff features plus:
- Assign staff to onboarding/deloading slots
- Adjust allocation times by dragging
- Create new allocations
- Monitor unstaffed allocations (shown in red)

## API Integration

The implementation uses existing API endpoints:
- `/api/daily-run-sheet` - Fetch daily data
- `/api/update-allocation` - Update staff assignments and times

## Migration Notes

Both versions are available:
- **Original**: `daily-run-sheet.html` (timeline with pixel positioning)
- **New**: `daily-run-sheet-v2.html` (FullCalendar resource timeline)

Users can test both versions before fully migrating.

## Future Enhancements

1. **Conflict Detection**: Warn when staff are double-booked
2. **Drag & Drop Vessels**: Allow vessel reassignment
3. **Print View**: Optimized layout for printing
4. **Filters**: Filter by vessel type, staff member, or status
5. **Integration**: Connect with GPS tracking for live vessel locations

## Performance Considerations

- Calendar handles large datasets efficiently
- Events are rendered on-demand as user scrolls
- Mobile view reduces data shown for better performance
- Auto-refresh can be disabled if needed

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)
