# FullCalendar Implementation Prompt

Copy the text below this line to provide to another LLM for implementing the FullCalendar migration.

---

## 🎯 Task: Implement FullCalendar for MBH Staff Portal Weekly Schedule

You'll be implementing FullCalendar v6 to replace the existing custom calendar grid in the MBH Staff Portal's management allocations page. This is a production system for a boat rental business in Sydney, Australia.

### 🚨 Critical Project Rules
1. **NO FRAMEWORKS** - This project uses vanilla HTML/JS/CSS only. Use FullCalendar's standard JavaScript bundle, NOT the React/Vue/Angular versions
2. **PRODUCTION SYSTEM** - Real business with active bookings and staff. Test thoroughly
3. **SYDNEY TIMEZONE** - All date/time operations must use Australia/Sydney timezone
4. **PRESERVE FUNCTIONALITY** - All existing modals, forms, and business logic must work exactly as before
5. **MOBILE FIRST** - Staff primarily use phones

### 📍 File Location
- **Target File**: `/Users/harryprice/kursol-projects/mbh-staff-portal/training/management-allocations.html`
- **Documentation**: `/Users/harryprice/kursol-projects/mbh-staff-portal/docs/02-features/calendar/FULLCALENDAR_MIGRATION_PLAN.md`

### 📋 Implementation Requirements

1. **Read the Technical Documentation First**
   - Read: `@docs/02-features/calendar/FULLCALENDAR_MIGRATION_PLAN.md`
   - This contains the complete technical analysis and implementation plan

2. **Current Implementation to Replace**
   - Find and replace the `renderScheduleGrid()` function
   - Replace the manual event rendering in `renderAllocations()` and `renderBookingsOnGrid()`
   - Keep all modal functions unchanged
   - Preserve all click handlers and business logic

3. **Key Features to Implement**
   - Weekly calendar view (Monday-Sunday, 6am-8pm)
   - Click empty cells to create allocations
   - Click events to open edit modals
   - Color coding: Green (accepted), Orange (pending), Red (declined/unassigned)
   - Add-on indicators (orange "+" badge)
   - Show both allocations AND bookings (onboarding/deloading)

4. **Data Sources**
   - `allocationsData` - Staff shift allocations
   - `bookingsData` - Customer bookings requiring staff
   - `staffData` - Employee information
   - `boatsData` - Vessel information

5. **Preserve These Functions**
   - `openAllocationModal()` - Create new allocation
   - `openBookingAllocationModal()` - Assign staff to booking
   - `openAllocationEditModal()` - Edit existing allocation
   - All form submission handlers
   - All Airtable API calls
   - SMS notification triggers

### 🔧 Implementation Steps

1. **Add FullCalendar CDN** (in `<head>`):
```html
<link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.js'></script>
```

2. **Replace Calendar Container**:
Find: `<div id="scheduleGrid" class="time-grid">`
Replace with: `<div id="calendar"></div>`

3. **Initialize FullCalendar** (after data loads):
- Use configuration from the technical documentation
- Transform existing data to FullCalendar event format
- Implement click handlers that call existing modal functions

4. **Style Appropriately**:
- Match existing color scheme (navy #1B4F72 theme)
- Preserve mobile responsiveness
- Keep event blocks compact for multiple overlapping events

### ⚠️ Critical Considerations

1. **Event Overlap**: The main goal is to fix overlapping events displaying incorrectly
2. **Don't Break**: All existing functionality must continue working
3. **Test Cases**:
   - Multiple allocations at same time
   - Booking with both onboarding and deloading
   - Staff assignment workflow
   - SMS notifications still trigger
   - Mobile display

### 📊 Current Data Structure Examples

**Allocation Record**:
```javascript
{
    id: "rec123",
    fields: {
        "Employee": ["recEmp456"],
        "Shift Date": "2025-10-11",
        "Start Time": "08:00",
        "End Time": "12:00",
        "Shift Type": "General Operations",
        "Response Status": "Accepted",
        "Notes": "Morning shift"
    }
}
```

**Booking Record**:
```javascript
{
    id: "recBook789",
    fields: {
        "Customer Name": "John Smith",
        "Booking Date": "2025-10-11",
        "Onboarding Time": "08:00",
        "Start Time": "08:30",
        "Finish Time": "16:30",
        "Deloading Time": "17:00",
        "Onboarding Employee": ["recEmp456"],
        "Deloading Employee": ["recEmp789"],
        "Boat": ["recBoat123"],
        "Add-ons": "Esky - $20.00, Fishing Rod - $30.00"
    }
}
```

### ✅ Success Criteria
- Calendar displays without event truncation
- Overlapping events show side-by-side clearly
- All clicks open correct modals with correct data
- No regression in existing functionality
- Works on mobile devices
- Maintains Sydney timezone

### 🚀 Start Here
1. Read the full technical documentation
2. Study the existing `renderScheduleGrid()`, `renderAllocations()`, and `renderBookingsOnGrid()` functions
3. Create the FullCalendar instance with proper configuration
4. Transform the data and test with real allocations
5. Implement all interaction handlers
6. Test thoroughly before marking complete

Remember: This is a production system. Preserve all existing business logic while improving the calendar display.
