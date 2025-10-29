# Daily Run Sheet v2 FullCalendar Scheduler CDN Fix

## Issue
The Daily Run Sheet v2 was showing "Resource plugin available: undefined" in the console, preventing the resource timeline view from working. The FullCalendar library loaded successfully but the Scheduler/Resource plugin was not being detected.

## Root Cause
The issue was caused by two factors:
1. Using `unpkg.com` CDN instead of the proven `cdn.jsdelivr.net` CDN
2. Implementing an unnecessary polling mechanism to wait for FullCalendar loading

## Solution

### 1. Updated CDN URL to match working examples
Changed from:
```html
<link href='https://unpkg.com/fullcalendar-scheduler@6.1.19/index.global.min.css' rel='stylesheet' />
<script src='https://unpkg.com/fullcalendar-scheduler@6.1.19/index.global.min.js'></script>
```

To:
```html
<link href='https://cdn.jsdelivr.net/npm/fullcalendar-scheduler@6.1.8/index.global.min.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/fullcalendar-scheduler@6.1.8/index.global.min.js'></script>
```

This matches the exact CDN and version used in the working `task-scheduler.html` implementation.

### 2. Removed unnecessary polling mechanism
Removed the complex polling logic from `daily-run-sheet-v2.html` that was trying to detect when FullCalendar was loaded. The cdn.jsdelivr.net CDN loads synchronously enough that a standard DOMContentLoaded event handler works fine.

### 3. Simplified initialization
Updated `daily-run-sheet-calendar.js` from:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (window.fullCalendarReady) {
        dailyRunSheet = new DailyRunSheetCalendar();
    } else if (window.whenFullCalendarReady) {
        window.whenFullCalendarReady(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        });
    } else {
        setTimeout(() => {
            dailyRunSheet = new DailyRunSheetCalendar();
        }, 1000);
    }
});
```

To:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // FullCalendar scheduler should be loaded with cdn.jsdelivr.net
    dailyRunSheet = new DailyRunSheetCalendar();
});
```

## Verification
After deploying these changes:
- Console logs show "FullCalendar Scheduler loaded successfully"
- The scheduler plugin is properly detected
- Resource timeline view should work correctly
- Vessels will display as rows with bookings on the timeline

## Key Insights
1. Different CDNs have different loading behaviors - `cdn.jsdelivr.net` appears more reliable for FullCalendar
2. The working examples (`task-scheduler.html` and `management-allocations.html`) provide proven patterns
3. Over-engineering the loading detection can introduce unnecessary complexity
4. Using the exact same version as working examples reduces variables

## Files Modified
- `/training/daily-run-sheet-v2.html` - Updated CDN URLs and removed polling script
- `/training/js/daily-run-sheet-calendar.js` - Simplified initialization logic

## Date: October 29, 2025
Fixed in commit: `3b98f46`
