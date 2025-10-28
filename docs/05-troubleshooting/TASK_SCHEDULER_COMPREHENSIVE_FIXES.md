# Task Scheduler Comprehensive Fixes and Discoveries

**Date**: October 27, 2025  
**Component**: /training/task-scheduler.html  
**Purpose**: Document all approaches, fixes, and technical discoveries for the task scheduler

## Overview

The task scheduler underwent multiple improvements to transform it from a basic horizontal timeline into a fully-featured vertical resource scheduling system with enhanced usability. This document captures all issues encountered, solutions implemented, and technical insights gained.

## Issues Addressed

### 1. Vertical Resource View Implementation
**Issue**: Original horizontal timeline view was difficult to read with staff on Y-axis  
**Solution**: Switched to vertical resource view using FullCalendar's `resourceTimeGridWeek`

**Technical Discoveries**:
- View type must change based on selection: `resourceTimeGridWeek` for all staff, `timeGridWeek` for individual
- Resources must be properly filtered when switching views
- Calendar requires destruction and recreation when changing view types

**Implementation**:
```javascript
initialView: selectedEmployeeId === 'all' ? 'resourceTimeGridWeek' : 'timeGridWeek'
```

### 2. Employee Selector Feature
**Issue**: No way to focus on individual employee schedules  
**Solution**: Added dynamic employee tabs above calendar

**Technical Insights**:
- Tabs must be dynamically generated from `staffMembers` array
- Selected state tracked via `selectedEmployeeId` variable
- Calendar recreates on selection change to apply proper view and filtering
- Drag-drop behavior must adapt: in individual view, drops anywhere assign to selected employee

### 3. Project Filter Implementation
**Issue**: Unable to filter tasks by project  
**Multiple Problems Discovered**:

1. **Incorrect Table ID**: Initially used `tblOflPIiqfIhzfIR` (wrong)
   - **Discovery**: Found correct ID by examining Tasks table's Project linked field
   - **Correct ID**: `tblhqQZOrGw7rqW1p`

2. **Wrong Field Name**: Used `'Name'` instead of `'Project name'`
   - **Discovery**: Used Airtable describe_table to find correct field names

3. **Filter Placement**: Initially placed in wrong panel
   - **Fix**: Moved from "Filter Tasks" panel to top of "Tasks" panel
   - **Added**: `panel-body` CSS class for proper styling

### 4. Modal Scrolling Issues
**Issue**: Task creation modal content cut off, background scrolled instead of modal

**Root Causes**:
1. Modal had fixed positioning without scroll handling
2. Body scroll not prevented when modal open
3. Modal content exceeded viewport height

**Solutions Applied**:
- Added `overflow-y: auto` to modal wrapper
- Set `max-height: 90vh` on modal content
- Prevent body scroll: `document.body.style.overflow = 'hidden'`
- Made header/footer sticky with modal-body scrollable
- Mobile adjustments for better viewport usage

### 5. Time Slot Display Compression
**Issue**: Y-axis time slots extremely compressed, difficult to read

**Progressive Solutions**:
1. **Initial Fix**: Changed from 1-hour to 30-minute slots
2. **Final Solution**: 15-minute slots (4 per hour) for maximum granularity

**Technical Optimizations**:
- `slotDuration: '00:15:00'` - 15-minute intervals
- `slotLabelInterval: '01:00:00'` - Labels every hour
- `expandRows: true` - Fill available height
- `snapDuration: '00:15:00'` - Precise dragging
- Time range: 7am-7pm (reduced from 6am-8pm)
- Visual hierarchy with different line styles

## Key Technical Discoveries

### 1. FullCalendar Resource Views
- Resource views require scheduler plugin
- Views must be switched entirely when changing between resource/non-resource modes
- `expandRows` critical for proper height utilization

### 2. Airtable Integration
- Linked record fields return arrays even for single-select
- Table IDs can be found via linked field examination
- Field names must match exactly (case-sensitive)

### 3. Modal Behavior
- Sticky positioning works well for modal headers/footers
- Body scroll must be explicitly controlled
- Max-height calculations must account for header/footer

### 4. Calendar Height Management
- `calc(100vh - XXXpx)` crucial for dynamic sizing
- Flex display with `min-height: 0` prevents overflow issues
- Mobile requires different height strategies

### 5. Service Worker Interference
- From previous fix: Service workers can intercept and break new features
- Must exclude new pages in service worker fetch handler
- Version bumping required for service worker updates

## Configuration Reference

### Current Calendar Settings
```javascript
{
    initialView: 'resourceTimeGridWeek' or 'timeGridWeek',
    slotMinTime: '07:00:00',
    slotMaxTime: '19:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00:00',
    expandRows: true,
    height: '100%',
    dayMinWidth: 150,
    allDaySlot: false,
    slotEventOverlap: false,
    snapDuration: '00:15:00'
}
```

### CSS Key Values
- Main layout height: `calc(100vh - 200px)`
- Calendar container min-height: `600px`
- Modal max-height: `90vh`
- Modal body max-height: `calc(90vh - 200px)`
- Time axis width: `70px`
- Minimum slot height: `25px`

## Lessons Learned

1. **Always Verify Airtable IDs**: Use describe_table to confirm structure
2. **Test Modal Scrolling**: Check on various screen sizes
3. **Consider Service Workers**: They persist and can break new features
4. **Calendar Views Are Complex**: Changing between resource/standard requires full recreation
5. **Visual Hierarchy Matters**: Different line styles help users parse time intervals

## Testing Checklist

- [ ] All staff view shows multiple columns
- [ ] Individual employee view shows single column
- [ ] Project filter loads all projects from Airtable
- [ ] Modal scrolls properly on all screen sizes
- [ ] Time slots are clearly visible and readable
- [ ] Drag-drop works in both view modes
- [ ] Tasks filter correctly by project/priority/status
- [ ] Mobile responsive design functions properly

## Future Considerations

1. Consider caching project list for performance
2. Add keyboard navigation for employee tabs
3. Implement view preference persistence
4. Add time slot zoom controls for accessibility
5. Consider lazy loading for large numbers of tasks
