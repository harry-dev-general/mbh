# FullCalendar Continuation Prompt

## Context for Continuing Work on MBH Staff Portal Calendar

You are working on the MBH Staff Portal's calendar component that manages staff allocations for boat operations. The calendar has recently been migrated from a custom CSS Grid implementation to FullCalendar v6.

### Project Overview

**System**: MBH Staff Portal - Marine boat hire staff management system  
**Environment**: Production system (be careful!)  
**Tech Stack**: Vanilla HTML/JS/CSS (NO frameworks), Airtable backend, SMS notifications  
**Calendar Library**: FullCalendar v6.1.19 (via unpkg CDN)  
**File Location**: `/training/management-allocations.html`  
**Timezone**: Australia/Sydney (critical - all operations must use this timezone)  

### Current Implementation Status

✅ **Completed**:
- Migrated from CSS Grid to FullCalendar
- Week view (Mon-Sun, 6am-8pm) and Day view
- Event display for allocations and bookings
- Click handlers for creating/editing events
- Color coding by status (green=accepted, orange=pending, red=declined)
- Field name fallbacks for Airtable variations
- 12-hour to 24-hour time conversion
- CSP-compliant CDN (unpkg, not jsdelivr)
- Mobile responsive design

### Data Architecture

The calendar displays two types of events:

1. **Staff Allocations** (from Shift Allocations table)
   - Single event per allocation
   - Shows employee assignment and response status
   - Can be general shifts or linked to specific bookings

2. **Customer Bookings** (from Bookings table)
   - Two events per booking: Onboarding (🚢) and Deloading (🏁)
   - Shows which staff member is assigned (if any)
   - Displays boat assignment and add-ons

### Key Technical Details

**Global Variables**:
- `calendar` - FullCalendar instance
- `allocationsData` - Array of allocation records
- `bookingsData` - Array of booking records
- `staffData` - Array of staff records
- `currentWeekStart` - Monday of current week

**Core Functions**:
- `renderScheduleGrid()` - Initializes/updates calendar
- `transformAllocationsToEvents()` - Converts allocations to FC events
- `transformBookingsToEvents()` - Converts bookings to FC events
- `updateCalendarEvents()` - Refreshes all calendar events
- `openAllocationModal()` - Create new allocation
- `openAllocationEditModal()` - Edit existing allocation
- `openBookingAllocationModal()` - Assign staff to booking

**Airtable Tables** (BASE_ID: `applkAFOn2qxtu7tx`):
- Shift Allocations: `tbl22YKtQXZtDFtEX`
- Bookings: `tblcBoyuVsbB1dt1I`
- Employee Details: `tblxGdQWMPgR6XkR5`
- Boats: `tblJC0PDpgYaYpI7A`

### Important Constraints

1. **NO Frameworks**: Must use vanilla JavaScript only
2. **Preserve Business Logic**: All existing modals, forms, and API calls must continue working
3. **SMS Triggers**: Don't break SMS notification functionality
4. **Field Variations**: Airtable uses both old and new field names:
   - `Onboarding Time` OR `Start Time`
   - `Deloading Time` OR `Finish Time`
5. **Time Formats**: Handle both 12-hour (1:30 PM) and 24-hour (13:30) formats
6. **CSP**: Only use CDNs in the allowed list (unpkg.com is safe)

### Current Issues/Limitations

1. No drag-and-drop functionality
2. No recurring shifts support
3. No conflict detection for double-bookings
4. Print view not optimized
5. No real-time updates (requires manual refresh)

### Documentation References

1. **Technical Reference**: `/docs/02-features/calendar/FULLCALENDAR_TECHNICAL_REFERENCE.md`
2. **Implementation Log**: `/docs/02-features/calendar/FULLCALENDAR_IMPLEMENTATION_LOG.md`
3. **Migration Plan**: `/docs/02-features/calendar/FULLCALENDAR_MIGRATION_PLAN.md`
4. **Original Requirements**: `/docs/02-features/calendar/FULLCALENDAR_IMPLEMENTATION_PROMPT.md`

### Common Tasks You Might Work On

1. **Add Drag-and-Drop**: Enable dragging allocations to different times/days
2. **Conflict Detection**: Highlight when staff are double-booked
3. **Recurring Shifts**: Add weekly recurring allocation templates
4. **Export Feature**: Generate PDF or Excel schedules
5. **Real-time Updates**: Add WebSocket support for live updates
6. **Resource View**: Show timeline with staff as rows
7. **Bulk Operations**: Select multiple slots for batch allocation
8. **Performance**: Optimize for 100+ events per week

### Testing Checklist

Before deploying any changes:
- [ ] Calendar loads without errors
- [ ] All events display correctly
- [ ] Click empty cell → allocation modal opens
- [ ] Click event → appropriate edit modal opens
- [ ] Form submissions update calendar
- [ ] Week/day navigation works
- [ ] Mobile view is responsive
- [ ] SMS notifications still trigger
- [ ] No console errors
- [ ] Australia/Sydney timezone maintained

### Quick Start Commands

```bash
# Navigate to project
cd /Users/harryprice/kursol-projects/mbh-staff-portal

# Test in development branch
git checkout development

# View the calendar file
open training/management-allocations.html

# After making changes
git add training/management-allocations.html
git commit -m "feat/fix: Your change description"
git push origin development
```

### Important Notes

- This is a PRODUCTION system - test thoroughly
- The development branch is for testing
- Never push directly to production branch
- All times must be in Australia/Sydney timezone
- Preserve ALL existing functionality
- Document any new dependencies or changes

### Contact for Questions

Check the git history and documentation files for context. The original implementation was completed on October 10, 2025.
