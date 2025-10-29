# Daily Run Sheet v2 FullCalendar Scheduler Loading Fix

## Issue
The Daily Run Sheet v2 was showing "Resource plugin available: undefined" in the console, indicating the FullCalendar scheduler plugin wasn't loading properly, even though the correct CDN URL was being used.

## Root Cause
The FullCalendar scheduler plugin from the CDN wasn't fully loaded when the calendar initialization code ran. This is a timing issue where:
1. The scheduler script loads asynchronously from unpkg.com
2. DOMContentLoaded can fire before the external script is ready
3. The calendar tries to initialize without the resource/timeline views available

## Solution

### 1. Added Loading Detection Script
Created a polling mechanism to detect when FullCalendar and its scheduler plugin are fully loaded:
```javascript
function waitForFullCalendar(callback) {
    if (typeof FullCalendar !== 'undefined' && FullCalendar.Calendar) {
        // Test if scheduler plugin works by trying to create a resource timeline
        const testCal = document.createElement('div');
        try {
            const cal = new FullCalendar.Calendar(testCal, {
                initialView: 'resourceTimelineDay'
            });
            // If no error, scheduler is loaded
            console.log('FullCalendar Scheduler loaded successfully');
            callback();
        } catch (e) {
            // Scheduler not ready yet
            setTimeout(() => waitForFullCalendar(callback), 100);
        }
    } else {
        setTimeout(() => waitForFullCalendar(callback), 100);
    }
}
```

### 2. Updated Initialization Logic
Modified the calendar initialization to wait for the scheduler to be ready:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (window.fullCalendarReady) {
        dailyRunSheet = new DailyRunSheetCalendar();
    } else if (window.whenFullCalendarReady) {
        window.whenFullCalendarReady(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        });
    } else {
        // Fallback
        setTimeout(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        }, 1000);
    }
});
```

### 3. Enhanced Debug Logging
Added comprehensive logging to help diagnose loading issues:
```javascript
console.log('FullCalendar version:', FullCalendar.version);
console.log('FullCalendar plugins:', Object.keys(FullCalendar));
console.log('Calendar prototype has resources:', 
    FullCalendar.Calendar && FullCalendar.Calendar.prototype && 
    typeof FullCalendar.Calendar.prototype.getResources !== 'undefined');
```

## Key Insights

### CDN Loading Behavior
- External scripts from CDNs can load after DOMContentLoaded
- The scheduler plugin extends the base FullCalendar object
- Need to verify the plugin is loaded before using resource views

### FullCalendar Scheduler Detection
The most reliable way to detect if the scheduler plugin is loaded is to:
1. Check if FullCalendar.Calendar exists
2. Try to create a calendar with a resource view
3. If it throws an error, the scheduler isn't ready

## Testing
1. Clear browser cache
2. Load Daily Run Sheet v2
3. Check console for "FullCalendar Scheduler loaded successfully"
4. Verify calendar displays with resource timeline view
5. Confirm bookings appear correctly

## Prevention
For future FullCalendar implementations:
1. Always use a loading detection mechanism for CDN scripts
2. Don't assume DOMContentLoaded means external scripts are ready
3. Test with slow network conditions to catch timing issues
4. Consider using local copies of critical scripts

## Date: October 29, 2025
Fixed in commit: `d51e5b6`
