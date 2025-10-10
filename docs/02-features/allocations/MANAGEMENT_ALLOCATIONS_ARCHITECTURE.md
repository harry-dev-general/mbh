# Management Allocations Page - Architecture & Implementation Guide

## Overview
The `/training/management-allocations.html` page is the central dashboard for MBH management to allocate staff to boat rental bookings. It provides a comprehensive weekly view with interactive UI elements for managing staff assignments.

---

## 1. Frontend Architecture

### Technology Stack
- **Pure Vanilla JavaScript** - No framework dependencies
- **HTML5/CSS3** - Modern web standards
- **Font Awesome 6.0** - Icon library
- **Supabase JS Client v2** - Authentication

### Page Structure
```
management-allocations.html
├── Header Section
│   ├── Logo & Title
│   ├── User Info Display
│   └── Logout Button
├── Date Navigation
│   ├── Previous Week Button
│   ├── Current Week Display
│   ├── Next Week Button
│   └── Today Button
├── Main Grid Layout (CSS Grid)
│   ├── Left Sidebar (300px)
│   │   ├── Available Staff Panel
│   │   ├── Today's Bookings Panel
│   │   └── Week Statistics Panel
│   └── Schedule Grid (1fr)
│       ├── Day Headers (Mon-Sun with dates)
│       ├── Hour Rows (6am-8pm)
│       └── Interactive Cells
└── Allocation Modal (Hidden by default)
```

---

## 2. Data Integration with Airtable

### Configuration Constants
```javascript
const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4...'; // Bearer token
const BASE_ID = 'applkAFOn2qxtu7tx';              // MBH Bookings Operation

// Table IDs
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';    // Employee Details
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';    // Bookings Dashboard
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX'; // Shift Allocations
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';      // Roster
```

### API Communication Pattern
```javascript
// All API calls use fetchWithRetry for resilience
async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) { // Rate limited
                await new Promise(resolve => 
                    setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000))
                );
                continue;
            }
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
        }
    }
}
```

### Data Flow

#### 1. Initial Page Load
```
checkAuth() → loadWeekData() → Promise.all([
    loadStaffAvailability(),
    loadStaffData(),
    loadBookings(),
    loadAllocations()
]) → Render Components
```

#### 2. Booking Data Fetch
```javascript
// Fetches PAID and PART status bookings
const filter = "OR({Status}='PAID', {Status}='PART')";
// Client-side filtering for current week
bookingsData = allBookings.filter(record => {
    const bookingDate = record.fields['Booking Date'];
    const date = new Date(bookingDate + 'T00:00:00');
    return date >= weekStart && date <= weekEnd;
});
```

---

## 3. Interactive UI Components

### Schedule Grid System
- **Grid Layout**: 8 columns (time + 7 days) × 15 rows (6am-8pm)
- **Cell Identification**: Each cell has `data-date` and `data-hour` attributes
- **Visual Indicators**:
  - Today's column: Blue background highlight
  - Current hour: Light blue row highlight
  - Booking blocks: Color-coded by staff status
  - Allocation blocks: Show staff assignments

### Booking Block Rendering
```javascript
// Color coding system
if (type === 'onboarding') {
    hasStaff = booking['Onboarding Employee']?.length > 0;
    bookingBlock.style.background = hasStaff ? '#27ae60' : '#e74c3c'; // Green/Red
} else {
    hasStaff = booking['Deloading Employee']?.length > 0;
    bookingBlock.style.background = hasStaff ? '#27ae60' : '#e74c3c';
}
bookingBlock.style.opacity = hasStaff ? '1' : '0.7';
```

### Click Interactions
1. **Booking Blocks**: Click opens allocation modal pre-filled with booking details
2. **Empty Grid Cells**: Click opens modal for general staff allocation
3. **Allocation Blocks**: Click opens reassignment modal

---

## 4. Allocation Process

### Two Types of Allocations

#### A. Booking-Specific Allocations
When allocating staff to a customer booking:

```javascript
// 1. Update booking's employee field
const updateFields = {};
if (roleValue === 'Onboarding') {
    updateFields['Onboarding Employee'] = [employeeId];
    updateFields['Onboarding Status'] = 'Assigned';
} else if (roleValue === 'Deloading') {
    updateFields['Deloading Employee'] = [employeeId];
    updateFields['Deloading Status'] = 'Assigned';
}

// 2. PATCH booking record
await fetch(`${BOOKINGS_TABLE_ID}/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: updateFields })
});

// 3. Create allocation record for tracking (optional)
```

#### B. General Allocations
For non-booking shifts (maintenance, administration, etc.):

```javascript
// Create allocation record directly
const fields = {
    'Name': `${date} - ${employeeName}`,
    'Employee': [employeeId],
    'Shift Date': date,
    'Start Time': startTime,
    'End Time': endTime,
    'Shift Type': allocationType,
    'Shift Status': 'Scheduled'
};

await fetch(`${ALLOCATIONS_TABLE_ID}`, {
    method: 'POST',
    body: JSON.stringify({ fields })
});
```

---

## 5. Time Handling

### Critical Time Parsing Logic
The system handles multiple time formats from Airtable:

```javascript
function parseTime(timeStr) {
    // Handles: "09:00 am", "9:00 AM", "09:00", "1:00 pm"
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        // 12-hour format parsing
        const cleaned = timeStr.replace(/\s/g, '').toLowerCase();
        let hour = parseInt(cleaned.match(/(\d{1,2}):/)[1]);
        
        if (cleaned.includes('pm') && hour !== 12) {
            hour += 12;
        } else if (cleaned.includes('am') && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // 24-hour format
        return parseInt(timeStr.split(':')[0]);
    }
}
```

### Booking Time Calculations
- **Onboarding Time**: Start Time - 30 minutes
- **Deloading Time**: Finish Time - 30 minutes
- **Shift Duration**: Typically 1 hour for each role

---

## 6. Data Validation & Error Handling

### Field Requirements
```javascript
// Linked records MUST be arrays
'Onboarding Employee': [employeeId]  // ✓ Correct
'Onboarding Employee': employeeId     // ✗ Will fail

// Formula fields are READ-ONLY
'Onboarding Time'     // Cannot write - computed field
'Full Booking Status' // Cannot write - formula field
```

### Error Recovery
1. **Rate Limiting**: Exponential backoff with max 5-second delay
2. **Network Failures**: 3 retry attempts
3. **Field Validation**: Pre-submission validation
4. **User Feedback**: Clear error messages with console logging

---

## 7. Real-time Updates

### Current Implementation
- **Manual Refresh**: Data reloads after each action
- **Delay Strategy**: 1-second delay after updates to allow Airtable processing
- **Optimistic UI**: Shows loading states during operations

### Update Flow
```javascript
// After successful allocation
setTimeout(async () => {
    await loadBookings();      // Refresh booking data
    renderBookingsList();      // Update sidebar
    renderBookingsOnGrid();    // Update grid display
    alert('Staff allocated successfully!');
}, 1000);
```

---

## 8. Staff Availability Integration

### Roster Data Processing
```javascript
// Checks both roster patterns
function getStaffAvailability(date) {
    const dayName = getDayName(date);
    return rosterData.filter(record => {
        const available = record.fields[`${dayName} Available`];
        return available === true || available === 'Yes';
    });
}
```

### Visual Indicators
- **Available Staff**: Normal opacity, hover effect
- **Unavailable Staff**: 50% opacity, no-click cursor
- **Hours Display**: Shows available time range

---

## 9. Security Considerations

### Current Implementation
- **API Key Exposure**: Currently in client-side code (security risk)
- **Authentication**: Supabase session-based auth
- **Role Checking**: Email-based management access

### Recommended Improvements
1. Move Airtable API calls to backend proxy
2. Implement proper RBAC (Role-Based Access Control)
3. Add request signing/validation
4. Implement audit logging

---

## 10. Performance Optimizations

### Current Optimizations
```javascript
// Parallel data loading
await Promise.all([
    loadStaffAvailability(),
    loadStaffData(),
    loadBookings(),
    loadAllocations()
]);

// Client-side filtering instead of complex formulas
// Cache busting with timestamps
`${url}?_t=${Date.now()}`
```

### Rendering Strategy
- **Batch DOM Updates**: Build HTML strings, single innerHTML update
- **Lazy Loading**: Only load current week data
- **Debounced Actions**: Prevent duplicate submissions

---

## 11. Mobile Responsiveness

### Current State
- Fixed 1400px max-width container
- Grid layout not optimized for mobile
- Modal works on mobile but not optimized

### Needed Improvements
- Responsive grid layout
- Touch-friendly controls
- Mobile-specific navigation
- Swipe gestures for week navigation

---

## 12. Testing & Debugging

### Debug Functions Available
```javascript
window.createTestBooking()  // Creates test booking for current week
window.showAllBookings()    // Shows all bookings regardless of filter
```

### Console Logging
Extensive logging for:
- API responses
- Data filtering results
- Time parsing operations
- Allocation submissions

---

## 13. Common Issues & Solutions

### Issue: Bookings Not Displaying
- Check Status field (must be 'PAID' or 'PART')
- Verify date falls within current week
- Check console for "Found X bookings" message

### Issue: Allocation Fails
- Verify employee ID exists
- Check linked fields are arrays
- Ensure not writing to formula fields
- Confirm date/time formats

### Issue: Time Display Wrong
- Check Airtable field returns (various formats)
- Use parseTime() function consistently
- Consider timezone handling

---

## 14. Future Enhancements

### Planned Features
1. **Drag & Drop**: Move allocations between time slots
2. **Bulk Operations**: Allocate multiple shifts at once
3. **Conflict Detection**: Warn about double-bookings
4. **SMS Integration**: Currently sends notifications via `/api/send-shift-notification`
5. **Real-time Updates**: WebSocket for live changes
6. **Advanced Filtering**: By boat type, employee skills, etc.

### Architecture Improvements
1. **Backend API Layer**: Move Airtable calls server-side
2. **State Management**: Implement proper state management
3. **Component System**: Refactor to reusable components
4. **TypeScript**: Add type safety
5. **Testing Suite**: Unit and integration tests

---

## Summary

The management-allocations page is a complex but well-structured single-page application that effectively manages the interaction between multiple Airtable tables to provide a comprehensive staff allocation system. While built with vanilla JavaScript, it implements modern patterns like Promise-based async operations, retry logic, and optimistic UI updates.

The system successfully handles the complexity of boat rental operations, including different time formats, multiple allocation types, and real-time staff availability checking. The visual grid interface provides an intuitive way for management to see and manage the weekly schedule at a glance.

Key strengths:
- Robust error handling and retry logic
- Flexible time parsing for various formats
- Clear visual indicators for booking status
- Comprehensive allocation workflow

Main areas for improvement:
- Security (API key exposure)
- Mobile responsiveness
- Real-time updates
- Performance optimization for large datasets
