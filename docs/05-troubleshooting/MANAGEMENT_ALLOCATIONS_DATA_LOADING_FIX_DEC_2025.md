# Management Allocations Page - Data Loading & Roster Duplicate Fix (December 2025)

## Overview
This document details the investigation and resolution of multiple data loading issues on the `/training/management-allocations.html` page, including duplicate roster records, multiple data loading cycles, and FullCalendar compatibility errors.

**Date Investigated**: December 9, 2025  
**Status**: RESOLVED ✅

---

## Issues Identified

### Issue 1: FullCalendar `calendar-enhancements.js` TypeError
**Severity**: CRITICAL

**Symptom**:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'eventContent')
at CalendarEnhancements.setupLazyLoading (calendar-enhancements.js:576:60)
```

**Root Cause**:
The `CalendarEnhancements` class was trying to access `this.calendar.options.eventContent` directly, which is not the correct API for FullCalendar v6. In v6, options must be accessed via `getOption()` method.

**Fix Applied**:
```javascript
// Before (broken in v6):
const originalEventContent = this.calendar.options.eventContent;

// After (v6 compatible):
if (!this.calendar || typeof this.calendar.getOption !== 'function') {
    console.log('Calendar not ready for lazy loading setup, skipping...');
    return;
}
const originalEventContent = this.calendar.getOption('eventContent');

if (typeof this.calendar.setOption !== 'function') {
    console.log('Calendar does not support setOption, skipping lazy loading');
    return;
}
```

**File Modified**: `/training/calendar-enhancements.js` (lines 574-588)

---

### Issue 2: Duplicate Roster Records - Inflated Availability Counts
**Severity**: HIGH

**Symptom**:
Console logs showed inflated availability counts (e.g., "Henry Conick: 20 days available" for a 7-day week display), indicating duplicate roster entries were being loaded.

**Root Cause**:
The filtering logic in `loadStaffAvailability()` used OR conditions that were too broad:
```javascript
// Problematic code - caused duplicates:
if (weekStarting && weekStarting === weekString) { return true; }
if (date && isWithinWeek(date)) { return true; }
```

When a roster record had BOTH a `Week Starting` field AND a `Date` field that matched conditions, it would be included multiple times (once for each condition).

**Fix Applied**:
```javascript
rosterData = allRosterData.filter(record => {
    const weekStarting = record.fields['Week Starting'];
    const date = record.fields['Date'];
    const recordDate = date ? new Date(date + 'T00:00:00') : null;
    const weekStartDate = new Date(weekString + 'T00:00:00');
    const weekEndDate = new Date(weekEndString + 'T23:59:59');

    // Prioritize 'Week Starting' field if available and matches
    if (weekStarting && weekStarting === weekString) {
        return true;
    }
    // Fallback to 'Date' field ONLY if 'Week Starting' is not present
    if (date && !weekStarting && recordDate >= weekStartDate && recordDate <= weekEndDate) {
        return true;
    }
    return false;
});
```

**File Modified**: `/training/management-allocations.html` (in `loadStaffAvailability()` function)

---

### Issue 3: Multiple Data Loading Cycles
**Severity**: MEDIUM

**Symptom**:
Console logs showed data loading 3+ times on page load:
```
Loading week data...
Loading week data...
Loading week data...
```

**Root Cause**:
1. `loadWeekData()` was called explicitly on initial page load
2. FullCalendar's `datesSet` callback also triggered `loadWeekData()` when the calendar rendered
3. No mechanism to prevent redundant calls when the week hadn't actually changed

**Fix Applied**:
Introduced loading flags and week tracking:
```javascript
let isLoadingWeekData = false;
let lastLoadedWeek = null;

async function loadWeekData(forceReload = false) {
    const currentWeekString = formatLocalDate(currentWeekStart);
    
    // Prevent concurrent loads
    if (isLoadingWeekData) {
        console.log('Already loading data, skipping...');
        return;
    }
    
    // Skip if same week already loaded (unless forced)
    if (!forceReload && lastLoadedWeek === currentWeekString) {
        console.log('Data for current week already loaded, skipping...');
        return;
    }

    isLoadingWeekData = true;
    try {
        // ... existing data loading logic ...
        lastLoadedWeek = currentWeekString;
    } finally {
        isLoadingWeekData = false;
    }
}
```

Also updated `datesSet` callback:
```javascript
datesSet: function(dateInfo) {
    const newWeekStart = getMonday(dateInfo.start);
    const newWeekStartString = formatLocalDate(newWeekStart);

    if (formatLocalDate(currentWeekStart) !== newWeekStartString) {
        currentWeekStart = newWeekStart;
        loadWeekData(true); // Force reload when week changes
    }
},
```

**File Modified**: `/training/management-allocations.html`

---

### Issue 4: Service Worker Registration Warning
**Severity**: LOW (Non-blocking)

**Symptom**:
```
calendar-enhancements.js:478 Service worker registration failed: TypeError: Failed to register a ServiceWorker...
```

**Status**: NOT FIXED (intentionally)

**Reason**:
This is a non-critical warning that occurs due to:
- Local development without HTTPS
- Service worker scope limitations
- The service worker is already correctly configured with excluded paths

The service worker failure does not impact calendar functionality. The `CalendarEnhancements` class has proper fallback logic when service worker registration fails.

---

### Issue 5: Staff Type Field Showing "undefined"
**Severity**: LOW

**Status**: OUT OF SCOPE

**Reason**:
The user confirmed this is due to the "Staff Type" value not being set in Airtable for some employee records. This is a data issue, not a code issue.

---

## Technical Discoveries

### 1. FullCalendar v6 API Changes
FullCalendar v6 changed how options are accessed:
- **v5 (deprecated)**: `calendar.options.eventContent`
- **v6 (current)**: `calendar.getOption('eventContent')` and `calendar.setOption('eventContent', value)`

Always check for method existence before calling to ensure graceful degradation.

### 2. Airtable Roster Table Data Structure
The Roster table (`tblwwK1jWGxnfuzAN`) can have records with:
- `Week Starting` field only (weekly availability records)
- `Date` field only (specific day availability)
- Both fields (which was causing duplicates)

When filtering, prioritize `Week Starting` over `Date` to avoid counting the same availability multiple times.

### 3. FullCalendar `datesSet` Callback Timing
The `datesSet` callback fires:
1. On initial calendar render
2. When navigating between weeks
3. When the view changes

Always compare the new date range with the current state before triggering data reloads.

### 4. Data Loading Best Practices
For pages with multiple data dependencies:
- Use loading flags to prevent concurrent requests
- Track the last successfully loaded state
- Provide a `forceReload` parameter for explicit refresh scenarios
- Update data loading after form submissions with explicit reload calls

---

## Files Modified

| File | Changes |
|------|---------|
| `/training/calendar-enhancements.js` | Fixed `setupLazyLoading()` to use FullCalendar v6 API |
| `/training/management-allocations.html` | Fixed roster filtering, added loading flags, updated datesSet callback |

---

## Verification Steps

After deploying fixes:

1. **Open browser DevTools Console** before navigating to the page
2. **Navigate to** `/training/management-allocations.html`
3. **Verify no TypeError** for `eventContent`
4. **Check console for** single "Loading week data..." message on initial load
5. **Navigate to next/previous week** and verify data loads once per navigation
6. **Check staff availability counts** are reasonable (≤7 days for a 7-day week)

---

## Related Documentation

- [Management Allocations Architecture](/docs/02-features/allocations/MANAGEMENT_ALLOCATIONS_ARCHITECTURE.md)
- [Calendar Enhancements Guide](/docs/02-features/calendar/CALENDAR_ENHANCEMENTS_GUIDE.md)
- [Service Worker Interference Issue](/docs/05-troubleshooting/SERVICE_WORKER_INTERFERENCE_ISSUE_OCT_2025.md)
- [Checkfront Webhook Flow](/docs/03-integrations/checkfront/CHECKFRONT_WEBHOOK_FLOW.md)

---

## Commit Details

**Commit**: `49ad618` (December 9, 2025)  
**Branch**: `main`  
**Message**: "Fix management-allocations page issues"  
**Repository**: https://github.com/harry-dev-general/mbh.git

---

## Next Steps for Investigation

The Checkfront webhook integration should be analyzed next to understand:
1. How customer bookings flow from Checkfront to Airtable
2. How booking records appear on the management-allocations calendar
3. Any potential issues with booking data accuracy or timing

