# FullCalendar Migration Plan - Weekly Schedule Component

**Date**: October 10, 2025  
**Author**: Technical Analysis  
**Status**: Approved for Implementation  
**Target Page**: `/training/management-allocations.html`

## Executive Summary

This document outlines the migration plan from the current custom CSS Grid calendar implementation to FullCalendar v6, addressing critical issues with event overlap, truncation, and display accuracy in the Weekly Schedule component.

## Current Implementation Analysis

### Problems with Existing Calendar

1. **Event Overlap Issues**
   - Multiple events in same time slot get compressed using flexbox percentages
   - Text truncation with `text-overflow: ellipsis` hides critical information
   - No intelligent layout algorithm for concurrent events

2. **Technical Implementation**
   - Custom CSS Grid: `grid-template-columns: 80px repeat(7, 1fr)`
   - Manual DOM manipulation for event placement
   - Basic hour-based positioning without minute precision

3. **Current Code Structure**
   ```javascript
   // Current rendering pattern
   function renderScheduleGrid() {
       // Builds static grid structure
       // Places events in cells based on hour
   }
   
   function renderAllocations() {
       // Creates allocation blocks with onclick handlers
   }
   
   function renderBookingsOnGrid() {
       // Creates booking blocks (onboarding/deloading)
   }
   ```

## FullCalendar Implementation Plan

### Core Configuration

```javascript
const calendarConfig = {
    // View Configuration
    initialView: 'timeGridWeek',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay'
    },
    
    // Time Configuration
    slotMinTime: '06:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:30:00',
    firstDay: 1, // Monday
    
    // Event Display
    eventMaxStack: 4,
    dayMaxEvents: false,
    eventOverlap: true,
    slotEventOverlap: true,
    
    // Timezone
    timeZone: 'Australia/Sydney',
    
    // Styling
    height: 'auto',
    expandRows: true
};
```

### Feature Mapping

| Current Feature | FullCalendar Implementation | Priority |
|-----------------|----------------------------|----------|
| Click empty cell → Create allocation | `dateClick` callback | HIGH |
| Click event → Edit modal | `eventClick` callback | HIGH |
| Color coding by status | `eventClassNames` + CSS | HIGH |
| Add-on indicators | `eventContent` custom rendering | HIGH |
| Hover tooltips | `eventMouseEnter`/`eventMouseLeave` | MEDIUM |
| Today highlighting | Built-in `.fc-day-today` class | LOW |
| Week navigation | Built-in prev/next buttons | HIGH |
| Staff availability overlay | Custom background events | MEDIUM |

### Data Structure Transformation

```javascript
// Transform existing data to FullCalendar events
function transformAllocationsToEvents(allocationsData) {
    return allocationsData.map(record => {
        const allocation = record.fields;
        const employee = staffData.find(s => s.id === allocation['Employee']?.[0]);
        
        return {
            id: `allocation-${record.id}`,
            title: employee?.fields.Name || 'Unassigned',
            start: `${allocation['Shift Date']}T${allocation['Start Time']}`,
            end: `${allocation['Shift Date']}T${allocation['End Time']}`,
            classNames: [
                'allocation-event',
                getAllocationStatusClass(allocation)
            ],
            extendedProps: {
                recordType: 'allocation',
                record: record,
                employeeId: allocation['Employee']?.[0],
                employeeName: employee?.fields.Name,
                shiftType: allocation['Shift Type'],
                responseStatus: allocation['Response Status'],
                notes: allocation['Notes']
            }
        };
    });
}

function transformBookingsToEvents(bookingsData) {
    const events = [];
    
    bookingsData.forEach(record => {
        const booking = record.fields;
        if (!booking['Booking Date']) return;
        
        // Onboarding event
        if (booking['Onboarding Time']) {
            events.push({
                id: `booking-on-${record.id}`,
                title: `🚢 ON ${booking['Customer Name']}`,
                start: `${booking['Booking Date']}T${booking['Onboarding Time']}`,
                end: `${booking['Booking Date']}T${addMinutes(booking['Onboarding Time'], 30)}`,
                classNames: [
                    'booking-event',
                    'booking-onboarding',
                    getBookingStatusClass(booking, 'onboarding')
                ],
                extendedProps: {
                    recordType: 'booking',
                    allocationType: 'onboarding',
                    record: record,
                    hasAddOns: hasAddOns(booking),
                    hasStaff: !!booking['Onboarding Employee']?.length,
                    staffId: booking['Onboarding Employee']?.[0],
                    boatId: booking['Boat']?.[0],
                    responseStatus: booking['Onboarding Response']
                }
            });
        }
        
        // Similar for deloading event...
    });
    
    return events;
}
```

### Event Interaction Handlers

```javascript
// Preserve all existing modal functionality
const calendarCallbacks = {
    dateClick: function(info) {
        // Same as current handleCellClick
        openAllocationModal();
        document.getElementById('allocationDate').value = info.dateStr;
        const hour = info.date.getHours();
        document.getElementById('startTime').value = `${hour.toString().padStart(2, '0')}:00`;
    },
    
    eventClick: function(info) {
        info.jsEvent.preventDefault();
        const props = info.event.extendedProps;
        
        if (props.recordType === 'booking') {
            openBookingAllocationModal(props.record, props.allocationType);
        } else {
            openAllocationEditModal(props.record, { id: props.employeeId, fields: { Name: props.employeeName }});
        }
    },
    
    eventMouseEnter: function(info) {
        // Enhanced tooltip display
    },
    
    events: function(fetchInfo, successCallback, failureCallback) {
        // Fetch and transform data
        Promise.all([
            loadAllocations(),
            loadBookings()
        ]).then(() => {
            const allEvents = [
                ...transformAllocationsToEvents(allocationsData),
                ...transformBookingsToEvents(bookingsData)
            ];
            successCallback(allEvents);
        }).catch(failureCallback);
    }
};
```

### Custom Event Rendering

```javascript
eventContent: function(arg) {
    const event = arg.event;
    const props = event.extendedProps;
    
    // Add-on indicator
    const addOnIndicator = props.hasAddOns ? 
        '<span class="addon-indicator" title="This booking includes add-ons">+</span>' : '';
    
    // Status icons
    let statusIcon = '';
    if (props.recordType === 'booking') {
        if (!props.hasStaff) {
            statusIcon = '❌';
        } else if (props.responseStatus === 'Accepted') {
            statusIcon = '✅';
        } else if (props.responseStatus === 'Declined') {
            statusIcon = '❌';
        } else {
            statusIcon = '⏳';
        }
    }
    
    // Boat info
    const boatInfo = props.boatName ? 
        `<div class="fc-event-boat">⚓ ${props.boatName}</div>` : '';
    
    return {
        html: `
            <div class="fc-event-custom">
                ${addOnIndicator}
                <div class="fc-event-title-wrap">
                    ${event.title} ${statusIcon}
                </div>
                ${boatInfo}
            </div>
        `
    };
}
```

### CSS Styling

```css
/* Preserve existing color scheme */
.fc-event.allocation-event {
    border: none;
    font-size: 11px;
}

.fc-event.allocation-accepted {
    background: #4caf50;
    border-color: #2e7d32;
}

.fc-event.allocation-declined {
    background: #f44336;
    border-color: #c62828;
}

.fc-event.allocation-pending {
    background: #ff9800;
    border-color: #f57c00;
}

.fc-event.booking-onboarding {
    background: #2196f3;
}

.fc-event.booking-deloading {
    background: #1976d2;
}

/* Add-on indicator positioning */
.fc-event-custom {
    position: relative;
    padding: 2px 4px;
}

.addon-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff9800;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    z-index: 10;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .fc-timegrid-slot {
        height: 40px;
    }
    
    .fc-event {
        font-size: 10px;
    }
}
```

## Implementation Steps

### Phase 1: Setup (2 hours)
1. Add FullCalendar v6 via CDN
2. Create new calendar container div
3. Initialize basic calendar with configuration
4. Test week navigation and time slots

### Phase 2: Data Integration (3 hours)
1. Implement data transformation functions
2. Connect to existing data loading functions
3. Test event display with real data
4. Verify timezone handling

### Phase 3: Interactions (3 hours)
1. Implement dateClick for new allocations
2. Implement eventClick for editing
3. Ensure all modals work unchanged
4. Test CRUD operations

### Phase 4: Styling (2 hours)
1. Apply custom CSS for MBH theme
2. Implement custom event rendering
3. Add responsive styles
4. Test on mobile devices

### Phase 5: Testing (2 hours)
1. Test all allocation workflows
2. Test booking assignment workflows
3. Verify SMS notifications still trigger
4. Test with overlapping events
5. Performance testing with full week data

## Critical Preservation Points

### Must Maintain Exactly
1. All modal functionality and forms
2. Airtable API integration
3. SMS notification triggers
4. Authentication and permissions
5. Business logic for allocations/bookings

### Can Be Enhanced
1. Visual event layout (main improvement)
2. Time precision (30-min slots vs 1-hour)
3. Additional calendar views
4. Print functionality
5. Drag-and-drop (future enhancement)

## Risk Mitigation

1. **Parallel Implementation**: Keep existing code, add FullCalendar alongside
2. **Feature Flag**: Toggle between old and new implementation
3. **Gradual Rollout**: Test with select users first
4. **Rollback Plan**: Keep old implementation for 2 weeks post-launch

## Success Criteria

- ✓ No event text truncation
- ✓ Clear display of overlapping events
- ✓ All existing functionality preserved
- ✓ Improved mobile experience
- ✓ Faster rendering performance
- ✓ Maintainable codebase

## Technical Dependencies

```html
<!-- FullCalendar v6 Standard Bundle -->
<link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.js'></script>
```

## Browser Support

- Chrome 90+ ✓
- Safari 14+ ✓
- Firefox 88+ ✓
- Edge 90+ ✓
- Mobile Safari ✓
- Mobile Chrome ✓

## Performance Considerations

- Initial load: ~150KB additional JavaScript
- Rendering: More efficient than current implementation
- Memory: Comparable to current usage
- API calls: No change (same Airtable integration)

## Conclusion

FullCalendar provides a robust, tested solution that addresses all current calendar display issues while maintaining 100% compatibility with existing business logic and integrations. The migration can be completed in approximately 12 hours with minimal risk to the production system.
