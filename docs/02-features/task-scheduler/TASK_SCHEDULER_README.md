# Task Scheduler Feature

## Overview
The Task Scheduler is a management tool that allows scheduling and assigning tasks to staff members using a visual calendar interface. It integrates with Airtable's "MBH Management" base and uses FullCalendar's Resource Timeline view.

## Access
- URL: `/training/task-scheduler.html`
- Access Level: Management and Admin only

## Features
1. **Visual Task Management**
   - Drag-and-drop task assignment
   - Resource timeline view (staff as columns, time as rows)
   - Color-coded task priorities

2. **Task Operations**
   - Create new tasks
   - Edit existing tasks
   - Assign tasks to staff members
   - Schedule tasks with start/end times
   - Filter tasks by priority and status

3. **Integration**
   - Syncs with Airtable "Tasks" table
   - Shows active roster staff as resources
   - Real-time updates to Airtable

## Implementation Details

### Assignee Field
The Airtable "Assignee" field is a linked record field that links to Employee Profiles in the Management base:
- The system can both READ and WRITE assignees correctly
- Tasks can be assigned by dragging to staff columns or using the assignee dropdown in the modal
- Staff members are matched between Employee Details (Operations base) and Employee Profiles (Management base) using email addresses
- Only staff with matching Employee Profiles can be assigned tasks

### Implementation Notes
- Tasks assigned in Airtable display correctly on the calendar
- Dragging tasks to staff members sets both the schedule and the assignee
- Moving tasks between staff members updates the assignee automatically
- All times are displayed in Sydney timezone (AEDT/AEST)

## Usage Instructions

### Viewing Tasks
1. Access the Task Scheduler from the Management Dashboard
2. Assigned tasks appear on the calendar under their assigned staff member
3. Unassigned tasks appear in the left sidebar

### Creating Tasks
1. Click "New Task" in the sidebar
2. Fill in task details (title, description, priority, status)
3. Optionally set start/end dates
4. Click "Save Task"
5. The task will appear in the unassigned tasks sidebar

### Scheduling Tasks
1. Drag an unassigned task from the sidebar
2. Drop it on a staff member's timeline at the desired time
3. The task will be scheduled and assigned to that staff member

### Editing Tasks
1. Click on any task in the calendar
2. Update the details in the modal
3. Click "Save Task" to update

### Filtering Tasks
Use the filter panel in the sidebar to:
- Filter by priority (High, Medium, Low)
- Filter by status (Not Started, In Progress, etc.)

## Technical Details
- Frontend: HTML/JavaScript with FullCalendar v6
- Backend: Express.js with Airtable API proxy
- Data Source: Airtable "MBH Management" base
- Authentication: Supabase Auth with role-based access

## Known Issues

### Task Scheduler Inaccessible in Production (UNRESOLVED - October 2025)
- **Issue**: Task scheduler pages return 502 errors and fail to load completely
- **Impact**: The entire task scheduler feature is currently inaccessible in production
- **Initial Theory**: Calendar service worker was intercepting page requests (fix attempted but unsuccessful)
- **Current Status**: Under investigation - appears to be a server-side or deployment issue
- **Details**: See [Service Worker Interference Issue Documentation](/docs/05-troubleshooting/SERVICE_WORKER_INTERFERENCE_ISSUE_OCT_2025.md)

**WARNING**: The task scheduler feature is currently non-functional in production. Do not attempt to use it until this issue is resolved.

## Future Enhancements
1. Task dependencies visualization
2. Project grouping and filtering
3. Recurring tasks
4. Task templates
5. Email notifications for task assignments
6. Mobile-responsive design improvements
7. Bulk task operations (assign multiple tasks at once)
