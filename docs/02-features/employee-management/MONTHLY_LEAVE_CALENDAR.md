# Monthly Leave Calendar - Employee Directory

## Overview
A visual monthly calendar has been added beneath the Employee Directory table that displays all employee leave as colored time blocks. This provides managers with an at-a-glance view of team availability.

## Features

### Calendar Display
- **Monthly View**: Shows full month grid with all days
- **Previous/Next Navigation**: Navigate between months with arrow buttons
- **Today Button**: Quick return to current month
- **Current Day Highlight**: Today's date has a light yellow background
- **Other Month Days**: Shows previous/next month days in lighter shade

### Leave Visualization
- **Color-Coded Blocks**: Each leave type has distinct color:
  - 🟢 **Annual Leave**: Green (#4caf50)
  - 🟠 **Sick Leave**: Orange (#ff9800)
  - 🔵 **Personal Leave**: Blue (#2196f3)
  - 🟣 **Public Holiday**: Purple (#9c27b0)
  - ⚫ **Other**: Gray (#9e9e9e)

- **Employee Names**: Each block shows employee name
- **Interactive**: Click any leave block to see full details
- **Smart Layout**: Multiple leaves on same day stack vertically

### Data Integration
- **Real-Time Updates**: Calendar refreshes when:
  - New leave is created
  - Page is loaded
  - Month is changed
- **Linked to Airtable**: Pulls data from Employee Leave table
- **Status Filtering**: Only shows approved leave

## Technical Implementation

### HTML Structure
```html
<div id="monthlyCalendar" class="monthly-calendar">
  <!-- Day headers (Sun-Sat) -->
  <div class="calendar-header">Sun</div>
  ...
  <!-- Calendar days -->
  <div class="calendar-day">
    <div class="calendar-day-number">1</div>
    <div class="leave-block annual-leave">Employee Name</div>
  </div>
</div>
```

### Key Functions
1. **`initializeMonth()`**: Sets up current month on page load
2. **`renderMonthlyCalendar()`**: Builds calendar grid and populates leave
3. **`getLeaveForDate(dateStr)`**: Filters leave records for specific date
4. **`createLeaveBlock(leaveRecord)`**: Creates visual leave element
5. **`navigateMonth(direction)`**: Handles month navigation

### CSS Classes
- `.monthly-calendar`: Grid container (7 columns)
- `.calendar-day`: Individual day cell
- `.calendar-day.today`: Current day highlight
- `.calendar-day.other-month`: Previous/next month days
- `.leave-block`: Base leave block styling
- `.leave-block.[type]`: Type-specific colors

## Usage

### For Managers
1. **View Team Leave**: Scroll down to see calendar below employee table
2. **Navigate Months**: Use arrows or "Today" button
3. **Check Details**: Click any leave block for full information
4. **Plan Coverage**: See overlapping leaves at a glance

### Creating Leave
1. Click "Leave" button for employee in table
2. Fill out form and submit
3. Calendar updates automatically
4. New leave appears immediately

### Understanding the Display
- **Block Position**: Leave spans all days from start to end date
- **Employee Name**: Truncated if too long (hover for full details)
- **Multiple Leaves**: Stack vertically on same day
- **Month Context**: Lighter days are from previous/next month

## Examples

### Single Day Leave
```
Sept 2: [Bronte Sprouster]
```

### Multi-Day Leave
```
Sept 2: [Bronte Sprouster]
Sept 3: [Bronte Sprouster]
Sept 4: [Bronte Sprouster]
Sept 5: [Bronte Sprouster]
Sept 6: [Bronte Sprouster]
```

### Overlapping Leave
```
Sept 15: [Max Mckelvey]
         [Luca Searl]
```

## Troubleshooting

### Leave Not Showing
1. **Check Status**: Only "Approved" leave displays
2. **Verify Dates**: Ensure dates are in YYYY-MM-DD format
3. **Refresh Page**: May need to reload after creating leave
4. **Check Employee Link**: Leave must be linked to employee

### Performance
- Calendar renders ~42 days (6 weeks)
- May slow with many leaves per day
- Consider pagination for large teams

## Future Enhancements
1. **Week View Option**: Toggle between month/week
2. **Export Calendar**: Download as PDF/image
3. **Leave Conflicts**: Highlight understaffed days
4. **Recurring Leave**: Support for repeated patterns
5. **Leave Balance**: Show remaining days per employee
6. **Filter by Type**: Show/hide specific leave types
7. **Team Calendar**: Separate view for departments

## Mobile Responsiveness
Currently optimized for desktop viewing. Mobile improvements planned:
- Responsive grid for smaller screens
- Touch-friendly navigation
- Condensed leave blocks
- Swipe gestures for month navigation

---

*Created: Sep 2, 2025*  
*Version: 1.0*
