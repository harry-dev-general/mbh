# FullCalendar Implementation Technical Guide

**Date**: October 28, 2025  
**Component**: Task Scheduler  
**Library**: FullCalendar v6 with Scheduler plugin

## Technical Overview

The MBH Task Scheduler uses FullCalendar v6 with the Scheduler plugin for resource-based scheduling. This document covers technical implementation details, discoveries, and best practices learned during development.

## Key Technical Discoveries

### 1. View Type Management

**Discovery**: Resource views and standard views are fundamentally different in FullCalendar
- Resource views: `resourceTimeGridWeek`, `resourceTimeGridDay`
- Standard views: `timeGridWeek`, `timeGridDay`

**Implementation**:
```javascript
// Must switch entire view type when changing between all/individual
initialView: selectedEmployeeId === 'all' ? 'resourceTimeGridDay' : 'timeGridDay'
```

**Important**: Calendar must be destroyed and recreated when switching between resource and non-resource views.

### 2. Event Handling Best Practices

#### Mouse Events
```javascript
eventMouseEnter: handleEventMouseEnter,  // Hover tooltips
eventMouseLeave: handleEventMouseLeave,   // Hide tooltips
eventClick: handleEventClick,             // Click to edit
```

#### Drag Events
```javascript
eventDrop: handleEventDrop,          // After drag completes
eventResize: handleEventResize,      // After resize completes
eventReceive: handleEventReceive,    // External drag into calendar
```

#### Date Selection
```javascript
dateClick: handleDateClick,    // Single click on time slot
select: handleDateSelect,      // Drag to select range
selectable: true,             // Enable selection
selectMirror: true,           // Show selection preview
```

### 3. Performance Optimizations

#### View Caching Strategy
Instead of destroying/recreating calendar on every employee switch:
```javascript
if (!needsViewTypeChange) {
    // Just update events/resources
    calendar.removeAllEvents();
    calendar.addEventSource(getCalendarEvents());
} else {
    // Only recreate when view type changes
    calendar.destroy();
    initializeCalendar();
}
```

#### Event Mounting Hook
Use `eventDidMount` for adding custom behavior to events:
```javascript
eventDidMount: function(info) {
    // Add right-click handler
    info.el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, task);
    });
    // Add cursor feedback
    info.el.style.cursor = 'pointer';
}
```

### 4. Time Slot Configuration

**Optimal Settings for 15-minute scheduling**:
```javascript
slotDuration: '00:15:00',      // 15-minute slots
slotLabelInterval: '01:00:00', // Labels every hour
expandRows: true,              // Fill available height
slotMinTime: '07:00:00',      // Start at 7am
slotMaxTime: '21:00:00',      // End at 9pm
```

### 5. External Dragging Integration

FullCalendar's Draggable class for external elements:
```javascript
new FullCalendar.Draggable(containerEl, {
    itemSelector: '.task-card',
    eventData: function(eventEl) {
        // Return event data for dropped item
        return {
            id: task.id,
            title: task.title,
            extendedProps: { /* custom data */ }
        };
    }
});
```

### 6. Button Text Customization

Override default button text:
```javascript
buttonText: {
    today: 'Today',
    month: 'Month', 
    week: 'Week',
    day: 'Day'
}
```

### 7. Event Display Optimization

```javascript
eventTimeFormat: {
    hour: 'numeric',
    minute: '2-digit',
    omitZeroMinute: false,  // Always show :00
    meridiem: 'short'
},
displayEventEnd: true,      // Show end times
eventMaxStack: 3,          // Max stacked events
dayMaxEvents: true,        // Enable "more" popover
```

## Integration with Airtable

### Resource Mapping
- Staff members from Employee Details → FullCalendar resources
- Employee Profile IDs used as resource IDs for consistency
- Linked record fields (assignee) are arrays even for single values

### Event Data Structure
```javascript
{
    id: task.id,                    // Airtable record ID
    title: task.title,
    start: task.start,              // ISO date string
    end: task.end || task.start,
    resourceId: task.assignee[0],   // Employee Profile ID
    extendedProps: {
        description: task.description,
        priority: task.priority,
        status: task.status
    }
}
```

## Common Pitfalls and Solutions

### 1. Service Worker Interference
- Exclude dynamic pages from service worker caching
- Use absolute paths for resources

### 2. Modal Scroll Locking
- Always restore body overflow when closing modals
- Track modal state to prevent conflicts

### 3. View Type Checking
```javascript
// Correct way to check view types
if (info.view.type.includes('timeGrid') || 
    info.view.type.includes('resourceTimeGrid')) {
    // Handle time grid views
}
```

### 4. Touch Support
```javascript
// Enable touch dragging
if ('ontouchstart' in window) {
    cards.forEach(card => {
        card.style.touchAction = 'none';
    });
}
```

## Configuration Reference

### Complete Calendar Options
```javascript
{
    // Scheduler license
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    
    // View settings
    initialView: 'resourceTimeGridDay',
    timeZone: 'Australia/Sydney',
    
    // Time configuration
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00:00',
    
    // Interaction
    editable: true,
    droppable: true,
    selectable: true,
    
    // Display
    expandRows: true,
    allDaySlot: false,
    displayEventEnd: true,
    
    // Performance
    eventDragMinDistance: 5,
    dragRevertDuration: 250,
    
    // Event handling
    eventClick: handleEventClick,
    eventMouseEnter: handleEventMouseEnter,
    eventMouseLeave: handleEventMouseLeave,
    dateClick: handleDateClick,
    select: handleDateSelect
}
```

## Browser Compatibility Notes

- Chrome/Edge: Full support, best performance
- Safari: Full support, smooth animations
- Firefox: Full support, occasional tooltip positioning quirks
- Mobile Safari: Touch support works with proper configuration
- Mobile Chrome: Excellent touch support

## Future Enhancement Opportunities

1. **Virtual Scrolling**: For calendars with many resources
2. **Lazy Loading**: Load events as user navigates dates
3. **Resource Grouping**: Group staff by department/role
4. **Timeline View**: Gantt-style project visualization
5. **Recurring Events**: Native support exists but needs implementation
