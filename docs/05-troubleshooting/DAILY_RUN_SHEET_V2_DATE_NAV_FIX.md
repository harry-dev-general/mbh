# Daily Run Sheet v2 Date Navigation Fix

## Issue
The Daily Run Sheet v2 calendar component was not showing bookings when navigating to different dates. The calendar would only display bookings for today, even when navigating to other dates using the prev/next buttons.

## Root Cause
The `loadData()` function was hardcoded to always load today's date (`new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })`) regardless of what date the calendar was displaying.

## Solution

### 1. Modified loadData() Function
Added optional `dateStr` parameter to allow loading data for specific dates:
```javascript
async loadData(dateStr = null) {
    const dateToLoad = dateStr || new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    // ... rest of the function
}
```

### 2. Added datesSet Event Handler
Added a `datesSet` event handler to the FullCalendar initialization that fires when the calendar navigates to different dates:
```javascript
datesSet: (dateInfo) => this.handleDatesSet(dateInfo)
```

### 3. Implemented handleDatesSet() Method
Created a method that loads data for the newly navigated date:
```javascript
async handleDatesSet(dateInfo) {
    const currentDate = dateInfo.start;
    const dateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    
    await this.loadData(dateStr);
    this.updateCalendarEvents();
}
```

### 4. Updated refreshData() Function
Modified the global `refreshData()` function to use the current calendar date:
```javascript
function refreshData() {
    if (dailyRunSheet && dailyRunSheet.calendar) {
        const currentDate = dailyRunSheet.calendar.getDate();
        const dateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
        dailyRunSheet.loadData(dateStr);
    } else {
        dailyRunSheet.loadData();
    }
}
```

## Testing
1. Navigate to the Daily Run Sheet v2 page
2. Use the prev/next buttons to navigate to different dates
3. Verify that bookings load correctly for each selected date
4. Use the "Today" button to return to current date
5. Verify manual refresh button loads correct date's data

## Related Files
- `/training/js/daily-run-sheet-calendar.js` - Main calendar JavaScript file
- `/api/daily-run-sheet.js` - API endpoint that provides booking data

## Date: October 29, 2025
Fixed in commits:
- `3e97b96` - fix: Daily Run Sheet v2 calendar now loads bookings for navigated dates
