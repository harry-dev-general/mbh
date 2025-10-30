# Daily Run Sheet V2 - Technical Discoveries and Resolution Journey

## Overview
This document details the complete journey of fixing the Daily Run Sheet V2 calendar event display issue, including all approaches tried, technical discoveries made, and lessons learned.

## Timeline of Issues and Fixes

### Phase 1: Initial Discovery
- **Issue**: Calendar events not displaying despite being created correctly
- **Symptoms**: 
  - Events exist in calendar memory (`calendar.getEvents()` returns 9 events)
  - No visual rendering of events
  - No DOM elements created for events

### Phase 2: FullCalendar Scheduler Plugin Issues

#### Discovery 1: CDN Loading vs Initialization
- **Finding**: FullCalendar Scheduler plugin loaded via CDN but not initializing
- **Evidence**:
  ```javascript
  // Browser console evaluation showed:
  hasScheduler: false
  hasResourcePlugin: false
  ResourceTimelineView: undefined
  ResourceApi: undefined
  ```
- **Root Cause**: GPL license key incompatibility with CDN-loaded Scheduler plugin
- **Lesson**: License restrictions can prevent plugin initialization even when loaded correctly

#### Discovery 2: Resource-Specific Code Dependencies
- **Finding**: Code was heavily dependent on resource/timeline features
- **Issues**:
  - `resourceId` properties on events
  - `getVesselResources()` function
  - `renderResourceLabel()` function
  - Resource-specific event handlers
- **Solution**: Complete removal of all resource-specific code

### Phase 3: Date/Time Format Issues

#### Discovery 3: UTC vs Local Time Conversion
- **Finding**: Using `.toISOString()` caused timezone conversion issues
- **Evidence**:
  ```javascript
  // Generated: "2025-10-29T01:00:00.000Z" (UTC)
  // Expected: "2025-10-29T12:00:00" (local)
  // Result: Events appeared at 11 PM instead of 12 PM
  ```
- **Root Cause**: FullCalendar was converting UTC timestamps to local time
- **Solution**: Use local date/time strings without timezone suffix

#### Discovery 4: Working Implementation Pattern
- **Reference**: `/management-allocations.html` uses:
  ```javascript
  start: `${booking['Booking Date']}T${convertTo24Hour(onboardingTime)}`
  ```
- **Key Insight**: Simple string concatenation with local times works better than Date objects

### Phase 4: Event Rendering Issues

#### Discovery 5: Event Content Not Displaying
- **Finding**: Events appeared as blank blocks after date fix
- **Root Cause**: Property name mismatch
  - Code set: `extendedProps.recordType`
  - Renderer expected: `extendedProps.type`
- **Solution**: Check both property names for compatibility

#### Discovery 6: Timezone Configuration
- **Finding**: `timeZone: 'Australia/Sydney'` still caused conversion
- **Solution**: Changed to `timeZone: 'local'` to prevent any conversion
- **Result**: Events finally displayed at correct times

## Technical Insights

### 1. FullCalendar Version Compatibility
- Standard FullCalendar v6.1.19 works reliably
- Scheduler plugin via CDN has initialization issues
- Local files may behave differently than CDN versions

### 2. Date Handling Best Practices
```javascript
// BAD: Creates UTC timestamp
start: startDate.toISOString()  // "2025-10-29T01:00:00.000Z"

// GOOD: Local date/time string
start: `${date}T${time}`  // "2025-10-29T12:00:00"
```

### 3. Event Structure Requirements
```javascript
// Working event structure
{
    id: `booking-${id}`,
    title: 'Event Title',
    start: '2025-10-29T12:00:00',  // Local time string
    end: '2025-10-29T17:00:00',    // Local time string
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
    classNames: ['event-class'],
    extendedProps: {
        recordType: 'booking',      // Custom properties
        // ... other custom data
    }
}
```

### 4. Helper Functions from Working Implementation
```javascript
// Convert 12-hour to 24-hour format
function convertTo24Hour(timeStr) {
    if (!timeStr.includes('am') && !timeStr.includes('pm')) {
        return `${timeStr.padStart(5, '0')}:00`;
    }
    // Parse and convert AM/PM times
}

// Add minutes to time string
function addMinutes(timeStr, minutes) {
    // Convert to 24-hour, add minutes, return formatted string
}
```

## Debugging Techniques Used

1. **DOM Inspection**: Check if events exist but are hidden
2. **Browser Evaluation**: Test global FullCalendar object properties
3. **Event Lifecycle Logging**: Track event creation, addition, and mounting
4. **Date/Time Debugging**: Log all date transformations
5. **Comparison with Working Code**: Study `/management-allocations.html`

## Lessons Learned

1. **Start Simple**: Remove complex features (resources) to isolate issues
2. **Match Working Patterns**: If another page works, replicate its exact approach
3. **Avoid Over-Engineering**: Simple string concatenation often beats complex Date operations
4. **Check Property Names**: Ensure consistency between data creation and consumption
5. **Test Incrementally**: Fix one issue at a time (display → content → time)
6. **Use Debug Logging**: Add console logs at every transformation point

## Current Status

As of October 29, 2025:
- ✅ Events display visually
- ✅ Events show correct content
- ✅ Events appear at correct times
- ✅ Standard Day/Week views work
- ❌ Resource/Timeline views not available (requires commercial license)

## Future Considerations

1. **Purchase Scheduler License**: If resource timeline view is needed
2. **Custom Timeline View**: Build custom CSS Grid timeline as alternative
3. **Vessel Filtering**: Add dropdown filter instead of resource columns
4. **Performance Monitoring**: Track calendar performance with many events
