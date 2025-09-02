# Employee Directory - Feature Guide

## Overview
The Employee Directory is a management tool for controlling employee roster status, monitoring weekly hours, tracking availability submissions, and managing leave/holidays.

## Access
- **Location**: Staff Management > Employee Directory
- **URL**: `/training/employee-directory.html`
- **Access Level**: Management users only

## Features

### 1. Active Roster Management
The primary function is controlling the **Active Roster** checkbox field in Airtable's Employee Details table.

#### What Active Roster Controls:
- ✅ **Checked**: Employee receives weekly availability submission reminders
- ❌ **Unchecked**: Employee does NOT receive reminders
- **Real-time Updates**: Changes are saved immediately to Airtable

#### How to Use:
1. Click the checkbox in the "Active Roster" column
2. Confirmation message appears when updated
3. Changes take effect immediately

### 2. Employee Information Display
Each employee shows:
- **Name**: From Employee Details table
- **Email**: Contact email address
- **Phone**: Mobile number
- **Active Roster Status**: Checkbox (editable)
- **Hours This Week**: Calculated from Shift Allocations
- **Availability Status**: Current week's submission status

### 3. Weekly Hours Calculation
Automatically calculates total hours worked in the selected week:
- Pulls data from Shift Allocations table
- Sums up all shift durations for the employee
- Displays in format: "8h 30m" or "40h"
- Updates when changing weeks

### 4. Availability Status Tracking
Shows submission status for the current week:

#### Status Types:
- **Submitted** (Green): Availability form completed and processed
- **Pending** (Orange): Form submitted but not yet processed
- **Not Submitted** (Red): No submission for the week

#### Data Source:
- Reads from Weekly Availability Submissions table
- Matches by employee and week starting date
- Real-time status updates

### 5. Search and Filters

#### Search Box:
- Search by employee name or email
- Real-time filtering as you type
- Case-insensitive search

#### Filter Options:
- **Active Roster Only**: Show only employees on active roster (default: checked)
- **Pending Availability**: Show only employees who haven't submitted availability

### 6. Week Navigation
- **Previous/Next Week**: Navigate through different weeks
- **Week Display**: Shows date range (e.g., "Sep 1 - Sep 7")
- **Current Week**: Defaults to current week on load
- Maintains 2025 context for consistency

### 7. Leave/Holiday Management
Each employee has a "Leave" button to block out time:

#### Leave Form Fields:
- **Employee**: Pre-filled, read-only
- **Leave Type**: 
  - Annual Leave
  - Sick Leave
  - Personal Leave
  - Public Holiday
  - Other
- **Start Date**: Beginning of leave period
- **End Date**: End of leave period
- **Notes**: Optional additional information

#### Current Implementation:
- Shows confirmation alert with leave details
- **Note**: Full integration with leave tracking table pending

## Technical Details

### Airtable Integration
```javascript
// Table IDs
EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY'        // Employee Details
AVAILABILITY_TABLE_ID = 'tblcBoyuVsbB1dt1I'    // Weekly Availability
ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX'     // Shift Allocations

// Key Fields
'Active Roster' (fldGTT1tFDS2NPi18)            // Checkbox field
'Name' (fldYEMNgdzKGnuQaJ)                     // Employee name
'Weekly Availability Submissions' (fldqb9lfYRuxD5Spb)  // Linked submissions
'Shift Allocations' (fldRcUcxXCGml6eUT)        // Linked allocations
```

### Data Flow
1. **On Page Load**:
   - Fetch all employees from Employee Details
   - Fetch availability submissions for current week
   - Fetch shift allocations for current week
   - Calculate hours and determine statuses

2. **On Week Change**:
   - Refetch availability and allocation data
   - Recalculate hours for new week
   - Update display

3. **On Roster Toggle**:
   - PATCH request to Airtable
   - Update Active Roster field
   - Local state update for immediate feedback

## User Interface

### Responsive Design
- Desktop: Full table view with all columns
- Mobile: Horizontal scroll for table
- Sticky header for easy reference

### Visual Feedback
- Hover effects on table rows
- Loading spinners during data fetch
- Success/error messages for actions
- Color-coded status badges

## Future Enhancements

### Planned Features
1. **Leave Integration**:
   - Create dedicated Leave/Holiday table
   - Auto-block availability for leave periods
   - Leave balance tracking

2. **Bulk Actions**:
   - Select multiple employees
   - Bulk update active roster status
   - Bulk leave assignment

3. **Export Functionality**:
   - Export employee list to CSV
   - Print-friendly view
   - Email roster reports

4. **Advanced Filtering**:
   - Filter by department/role
   - Filter by hour ranges
   - Custom date ranges

5. **Notifications**:
   - Email reminders for pending submissions
   - SMS integration for urgent updates
   - Automated follow-ups

## Troubleshooting

### Common Issues

1. **Hours Not Showing**:
   - Check Shift Allocations have Duration field populated
   - Verify employee links are correct
   - Ensure dates fall within selected week

2. **Availability Status Incorrect**:
   - Check Week Starting date matches
   - Verify Processing Status field values
   - Ensure employee links are set

3. **Cannot Update Active Roster**:
   - Check Airtable API permissions
   - Verify field is not locked
   - Check for formula field conflicts

## Best Practices

1. **Regular Reviews**:
   - Weekly check of pending submissions
   - Monthly review of active roster
   - Quarterly cleanup of inactive employees

2. **Communication**:
   - Notify employees when removing from active roster
   - Follow up on pending submissions
   - Announce leave policies clearly

3. **Data Integrity**:
   - Keep employee records up to date
   - Ensure email/phone numbers are current
   - Regular audits of roster status

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Initial Release*
