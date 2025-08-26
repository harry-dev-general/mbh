# Booking Allocation System Fixes - August 26, 2025

## Overview
This document details critical fixes applied to the MBH Staff Portal's booking allocation system on August 26, 2025, resolving issues with duplicate allocations, staff visibility, and booking display.

## Issues Fixed

### 1. Duplicate Allocation Blocks on Calendar
**Problem**: When allocating staff to a customer booking, the system created two visual elements:
- The original booking block
- A separate allocation block overlaying it

**Root Cause**: The system was performing two operations:
1. Updating the booking record's `Onboarding Employee`/`Deloading Employee` fields
2. Creating a new record in the `Shift Allocations` table

**Solution**: Modified the allocation form submission to only update the booking record for booking-specific allocations, preventing duplicate visual elements.

```javascript
// For booking-specific allocations (Boat Hire, Ice Cream Boat Operations)
if (allocationType === 'Boat Hire' || allocationType === 'Ice Cream Boat Operations') {
    // ONLY update the booking record, don't create allocation record
    await updateBookingRecord(bookingId, employeeId, role);
    // Skip creating shift allocation record
}
```

### 2. Staff Dropdown Not Populating
**Problem**: When clicking on bookings, the staff dropdown showed empty even though staff were available.

**Solution**: Created `populateStaffForDate()` function to dynamically load staff available on the specific booking date.

```javascript
function populateStaffForDate(date) {
    const availableStaff = rosterData.filter(r => 
        r.fields['Date'] === date || 
        (r.fields['Week Starting'] && isWithinWeek(date, r.fields['Week Starting']))
    );
    // Populate dropdown with available staff
}
```

### 3. Loading Animation Stuck
**Problem**: "Available Staff" and "Weekly Schedule" containers stuck on loading animation.

**Root Cause**: Missing `loadStaffData()` function and incomplete Promise.all chain.

**Solution**: 
- Added proper `loadStaffData()` function
- Fixed Promise.all to include all data loading functions
- Added explicit rendering calls after data loads

### 4. Employee Schedule View Missing Bookings
**Problem**: `/training/my-schedule.html` only showed allocations from Shift Allocations table, not booking assignments.

**Solution**: Modified to fetch from both sources:
```javascript
async function loadMyAllocations() {
    const [generalAllocations, bookingAllocations] = await Promise.all([
        loadGeneralAllocations(weekStartDate, weekEndDate),  // From Shift Allocations
        loadBookingAllocations(weekStartDate, weekEndDate)   // From Bookings Dashboard
    ]);
    myAllocations = [...generalAllocations, ...bookingAllocations];
}
```

### 5. Hardcoded Date Issue
**Problem**: System was hardcoded to August 20, 2025 instead of using current date.

**Solution**: 
```javascript
// OLD (BROKEN):
let today = new Date('2025-08-20');

// NEW (FIXED):
let today = new Date(); // Use actual current date
today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
```

### 6. Booking Duration Display
**Problem**: Booking allocations showed as 30 minutes instead of 1 hour.

**Solution**: Implemented time calculation helpers:
```javascript
// For onboarding: Start 30 min before, end 1 hour after start
const startTime24 = subtractTime(convertTo24Hour(bookingStartTime), 0, 30);
const endTime24 = addTime(startTime24, 1, 0);
```

### 7. Missing Customer Names on Calendar
**Problem**: Employee schedule didn't show customer names for booking allocations.

**Solution**: Updated display logic to show customer names prominently:
```javascript
if (shift.customer && isBooking) {
    shiftLabel = `${shift.role}: ${shift.customer}`;
}
```

## Technical Implementation Details

### Time Helper Functions
```javascript
function addTime(timeStr, hoursToAdd, minutesToAdd = 0) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let newHours = hours + hoursToAdd;
    let newMinutes = minutes + minutesToAdd;
    
    // Handle minute overflow
    if (newMinutes >= 60) {
        newHours += Math.floor(newMinutes / 60);
        newMinutes = newMinutes % 60;
    }
    
    // Handle hour overflow (wrap at 24)
    newHours = newHours % 24;
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

function subtractTime(timeStr, hoursToSubtract, minutesToSubtract = 0) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let newHours = hours - hoursToSubtract;
    let newMinutes = minutes - minutesToSubtract;
    
    // Handle minute underflow
    if (newMinutes < 0) {
        newHours -= Math.ceil(Math.abs(newMinutes) / 60);
        newMinutes = (60 + (newMinutes % 60)) % 60;
    }
    
    // Handle hour underflow (wrap at 24)
    if (newHours < 0) {
        newHours = 24 + (newHours % 24);
    }
    
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

function convertTo24Hour(timeStr) {
    if (!timeStr) return '09:00';
    const cleanTime = timeStr.replace(/\s/g, '').toLowerCase();
    if (!cleanTime.includes('am') && !cleanTime.includes('pm')) {
        return timeStr; // Already in 24-hour format
    }
    
    const [time, period] = cleanTime.split(/(am|pm)/);
    const [hours, minutes = '00'] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'pm' && hour !== 12) hour += 12;
    else if (period === 'am' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}
```

### Visual Styling for Today
```css
/* Highlights current day in calendar */
.day-cell.today {
    background: #f3f8ff;
    border: 2px solid #2196f3;
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.2);
}
```

## Platform Requirements

### Airtable
- **API Rate Limit**: 5 requests/second
- **Page Size**: Always use `pageSize=100` to fetch all records
- **Field Names**: Case-sensitive (e.g., `Status` not `status`)
- **Linked Records**: Must be arrays `[recordId]`
- **Formula Fields**: Read-only (cannot write to them)

### Date/Time Handling
- **Always use local dates** to avoid timezone issues
- **Set to noon** when initializing dates to prevent day shifts
- **Use string comparison** for date filtering
- **Handle multiple time formats** from Airtable (12-hour and 24-hour)

### Browser Compatibility
- Modern browsers with ES6+ support
- Fetch API support required
- CSS Grid and Flexbox support

## Files Modified

1. `/training/management-allocations.html`
   - Fixed duplicate allocation logic
   - Added staff dropdown population
   - Fixed loading issues
   - Added time helper functions

2. `/training/my-schedule.html`
   - Added booking allocation fetching
   - Fixed hardcoded date
   - Added today highlighting
   - Fixed duration calculations
   - Added customer name display

## Deployment

### Production Environment
- **Platform**: Railway
- **Auto-deploy**: From GitHub main branch
- **URL**: https://mbh-production-f0d1.up.railway.app
- **Repository**: https://github.com/harry-dev-general/mbh

### Environment Variables Required
- `AIRTABLE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT` (8080 for Railway)

## Testing Checklist

- [ ] Verify current date shows correctly (not hardcoded)
- [ ] Check booking allocations are 1 hour duration
- [ ] Confirm today is highlighted with blue outline
- [ ] Verify customer names display on bookings
- [ ] Test staff dropdown populates correctly
- [ ] Ensure no duplicate allocation blocks
- [ ] Confirm both general and booking allocations show in employee view
- [ ] Test week navigation maintains correct date context

## Known Limitations

1. **API Key Exposure**: Airtable API key is visible in client-side code
2. **No Real-time Updates**: Manual refresh required for updates
3. **Rate Limiting**: Shared 5 req/sec limit for all users
4. **Client-side Filtering**: Fetches all records then filters locally

## Future Improvements

1. Move Airtable API calls to backend service
2. Implement WebSocket for real-time updates
3. Add caching layer for frequently accessed data
4. Implement conflict detection for double-booking
5. Add loading states and error recovery

---
*Last Updated: August 26, 2025*
*Version: 2.1*
