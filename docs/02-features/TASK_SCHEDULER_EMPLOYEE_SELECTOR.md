# Task Scheduler Employee Selector Feature

**Date**: October 26, 2025  
**Updated By**: Development Team

## Overview
The task scheduler now includes an employee selector feature that allows managers to filter the calendar view by individual staff members or view all staff at once.

## Feature Details

### Employee Selector Tabs
- Located above the calendar view
- Includes "All Staff" option plus individual tabs for each active roster employee
- Visual indicator shows the currently selected view

### View Modes

#### All Staff View (Default)
- Uses `resourceTimeGridWeek` view
- Shows all employees as columns under each day
- Time displayed on Y-axis (6am-8pm)
- Best for overall scheduling and workload balancing

#### Individual Employee View
- Uses standard `timeGridWeek` view
- Shows only the selected employee's schedule
- Simplified view for focused task management
- Drag-drop automatically assigns tasks to the selected employee

## How It Works

### Tab Selection
```javascript
// Click any employee tab to filter
selectEmployee(employeeId)
```

### Calendar Filtering
- Calendar recreates with filtered resources
- Only shows tasks assigned to selected employee
- Maintains all time settings and preferences

### Task Assignment
- **All Staff View**: Drop tasks on specific staff columns
- **Individual View**: Drop anywhere assigns to selected employee
- Visual feedback confirms assignment

## Benefits

1. **Focused View**: Managers can concentrate on one employee's schedule
2. **Quick Assignment**: Simplified drag-drop in individual view
3. **Easy Switching**: One-click switching between views
4. **Maintains Context**: Selected view persists during session

## Usage Examples

### Viewing Individual Workload
1. Click on an employee's tab
2. See only their assigned tasks
3. Quickly identify available time slots
4. Drag unassigned tasks to fill gaps

### Bulk Scheduling
1. Stay in "All Staff" view
2. See everyone's availability at once
3. Distribute tasks across multiple employees
4. Balance workload visually

## Technical Implementation

### Key Components
- Dynamic tab generation from staff list
- Calendar view switching (resource vs standard)
- Filtered event rendering
- Responsive design for mobile

### State Management
```javascript
let selectedEmployeeId = 'all'; // Track current selection
```

### Resource Filtering
```javascript
function getFilteredResources() {
    if (selectedEmployeeId === 'all') {
        return staffMembers;
    }
    return staffMembers.filter(staff => staff.id === selectedEmployeeId);
}
```

## Mobile Responsive
- Tabs stack nicely on small screens
- Touch-friendly tab selection
- Maintains full functionality on mobile devices

## Future Enhancements
- Remember last selected employee between sessions
- Keyboard shortcuts for tab switching
- Multi-select for viewing specific team subsets
- Export filtered views
