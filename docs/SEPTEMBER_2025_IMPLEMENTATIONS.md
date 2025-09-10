# September 2025 Implementations - MBH Staff Portal

## Overview
This document details all implementations and fixes completed during the September 8-9, 2025 development session for the MBH Staff Portal.

## Table of Contents
1. [Availability Form Prefill Logic Fix](#1-availability-form-prefill-logic-fix)
2. [Management Allocations Bug Fixes](#2-management-allocations-bug-fixes)
3. [Staff Deselection Feature](#3-staff-deselection-feature)
4. [Allocation Color Coding Update](#4-allocation-color-coding-update)
5. [Announcements System Implementation](#5-announcements-system-implementation)
6. [Technical Considerations](#technical-considerations)

---

## 1. Availability Form Prefill Logic Fix

### Issue
The "Week Starting (Monday)" field on `/availability.html` was incorrectly prefilling for next week's Monday when accessed Monday-Saturday, instead of showing the current week.

### Solution
Modified the `setDefaultWeekStarting()` function to correctly calculate the target Monday:

```javascript
function setDefaultWeekStarting() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    let targetMonday = new Date(today);
    
    if (dayOfWeek === 0) {
        // If it's Sunday, show next Monday
        targetMonday.setDate(today.getDate() + 1);
    } else {
        // If it's Monday-Saturday, show this week's Monday
        const daysBackToMonday = dayOfWeek - 1;
        targetMonday.setDate(today.getDate() - daysBackToMonday);
    }
    
    const dateString = targetMonday.toISOString().split('T')[0];
    document.getElementById('weekStarting').value = dateString;
    document.getElementById('weekStarting').min = dateString; // Prevent selecting past weeks
}
```

### Business Logic
- **Monday-Saturday**: Show current week's Monday
- **Sunday**: Show next week's Monday (as current week is ending)

---

## 2. Management Allocations Bug Fixes

### 2.1 ID Collision Fix

#### Issue
Selecting "onboarding" allocation incorrectly updated the "deloading" field due to duplicate `id="allocationType"` elements.

#### Solution
Renamed the hidden input in the booking allocation modal:
- From: `id="allocationType"`
- To: `id="bookingAllocationType"`

Updated all JavaScript references accordingly.

### 2.2 SMS Notification Integration

#### Issue
SMS confirmation messages were not being sent when staff were assigned to bookings.

#### Root Cause
The form submission was missing the API call to `/api/send-shift-notification`.

#### Solution
Added SMS notification logic to the booking allocation form submission:

```javascript
// Send SMS notification if staff was assigned
if (selectedStaffId) {
    try {
        const booking = bookingsData.find(b => b.id === bookingId);
        if (booking && booking.fields) {
            const roleValue = allocationType === 'onboarding' ? 'Onboarding' : 'Deloading';
            const bookingDate = booking.fields['Booking Date'];
            const customerName = booking.fields['Customer Name'] || 'Unknown Customer';
            
            let shiftStart, shiftEnd;
            if (allocationType === 'onboarding') {
                shiftStart = booking.fields['Onboarding Time'] || booking.fields['Start Time'] || '9:00 AM';
                shiftEnd = booking.fields['Start Time'] || '10:00 AM';
            } else {
                shiftStart = booking.fields['Deloading Time'] || booking.fields['Finish Time'] || '4:00 PM';
                shiftEnd = booking.fields['Finish Time'] || '5:00 PM';
            }
            
            const notificationData = {
                employeeId: selectedStaffId,
                allocationId: bookingId,
                shiftType: `${roleValue} - ${booking.fields['Booking Code'] || 'Booking'}`,
                shiftDate: bookingDate,
                startTime: shiftStart,
                endTime: shiftEnd,
                customerName: customerName,
                role: roleValue,
                isBookingAllocation: true
            };
            
            const smsResponse = await fetch('/api/send-shift-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notificationData)
            });
            
            const smsResult = await smsResponse.json();
            if (!smsResult.success) {
                console.warn('Failed to send SMS notification:', smsResult.error);
            }
        }
    } catch (smsError) {
        console.error('Error sending SMS notification:', smsError);
    }
}
```

---

## 3. Staff Deselection Feature

### Issue
Users couldn't remove assigned staff or boats from bookings - the system forced a selection.

### Solution
Modified the validation logic to allow empty submissions:

```javascript
const currentStaffInfo = document.getElementById('currentStaffInfo').textContent;
const currentBoatInfo = document.getElementById('currentBoatInfo').textContent;
const hasCurrentStaff = !currentStaffInfo.includes('Not assigned');
const hasCurrentBoat = !currentBoatInfo.includes('Not assigned');

if (!selectedStaffId && !selectedBoatId && !hasCurrentStaff && !hasCurrentBoat) {
    alert('Please select at least a staff member or a boat');
    return;
}
```

This allows users to:
- Clear staff while keeping boat
- Clear boat while keeping staff
- Clear both (if at least one was previously assigned)

---

## 4. Allocation Color Coding Update

### Previous Behavior
- Green: Only when BOTH onboarding AND deloading had staff
- Red: Any allocation missing staff

### New Behavior
- Green: Individual allocation has BOTH staff AND boat assigned
- Red: Missing either staff OR boat
- Each allocation evaluated independently

### Implementation
```javascript
// Check if this specific allocation is complete
const hasStaff = (type === 'onboarding' && bookingRecord.fields['Onboarding Employee']?.length > 0) ||
                 (type === 'deloading' && bookingRecord.fields['Deloading Employee']?.length > 0);
const hasBoat = bookingRecord.fields['Boat']?.length > 0;

const isAllocationComplete = hasStaff && hasBoat;

const bgColor = isAllocationComplete ? '#4caf50' : '#f44336'; // Green if complete, red if not
const borderColor = isAllocationComplete ? '#2e7d32' : '#c62828';
const opacity = (hasStaff || hasBoat) ? '0.85' : '0.7';

// Display status icons
bookingBlock.innerHTML = `
    <div style="font-weight: bold;">
        ${typeLabel} ${customerName}
    </div>
    <div style="font-size: 9px; opacity: 0.9;">
        Staff:${hasStaff ? '✓' : '✗'} Boat:${hasBoat ? '⚓' : '✗'}
    </div>
`;
```

---

## 5. Announcements System Implementation

### 5.1 Overview
Complete announcements system allowing management to post updates that appear on staff dashboards and can be sent as SMS.

### 5.2 Airtable Setup

#### Table: Announcements (ID: `tblDCSmGREv0tF0Rq`)
Fields:
- **Title** (Single line text) - Required
- **Message** (Long text) - Required  
- **Priority** (Single select: Low, Medium, High)
- **Posted By** (Single line text)
- **Expiry Date** (Date) - Optional
- **SMS Sent** (Checkbox)
- **Created Time** (Created time) - Auto-generated

### 5.3 Backend Implementation

#### File: `api/announcements.js`

Key features:
- CRUD operations for announcements
- SMS integration via Twilio
- Active roster filtering

```javascript
const axios = require('axios');

// Environment variables with fallbacks
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patYiJdXfvcSenMU4.xxx';
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq';
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';

// SMS to active roster staff
async function sendAnnouncementSMS(title, message, priority) {
    // Fetch employees where {Active Roster}=1
    const employeeResponse = await axios.get(
        `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}?` +
        `filterByFormula=${encodeURIComponent(`{Active Roster}=1`)}`,
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        }
    );
    
    // Send SMS via Twilio to each active employee
    // ...
}
```

#### API Endpoints (in `server.js`)
```javascript
app.get('/api/announcements', async (req, res) => { /* ... */ });
app.post('/api/announcements', async (req, res) => { /* ... */ });
app.patch('/api/announcements/:id', async (req, res) => { /* ... */ });
app.delete('/api/announcements/:id', async (req, res) => { /* ... */ });
```

### 5.4 Frontend Implementation

#### Management Dashboard (`management-dashboard.html`)
- Form to create announcements
- List of all announcements with delete option
- SMS confirmation dialog

#### Staff Dashboard (`dashboard.html`)
- Displays active (non-expired) announcements
- Priority indicators (🚨 High, ⚠️ Medium, ℹ️ Low)
- Auto-refresh on page load

### 5.5 Error Handling & Debugging

#### Issue 1: Node.js Compatibility
**Problem**: Used `fetch` which isn't available in Node.js  
**Solution**: Replaced with `axios` throughout

#### Issue 2: Empty Date Handling
**Problem**: Airtable 422 error for empty expiry dates  
**Solution**: Conditionally include field only if value exists
```javascript
...(expiryDate ? { 'Expiry Date': expiryDate } : {})
```

#### Issue 3: SMS Targeting
**Problem**: Initially filtered by weekly roster  
**Solution**: Changed to filter by Active Roster checkbox in Employee Details

---

## Technical Considerations

### 1. Airtable API
- **Rate Limit**: 5 requests/second
- **Authentication**: Bearer token in headers
- **Field Names**: Case-sensitive
- **Linked Records**: Must be arrays `[recordId]`
- **Page Size**: Default 20, use `pageSize=100` for complete data

### 2. Error Handling Patterns
```javascript
try {
    const response = await axios.get(url, config);
    const data = response.data;
    // Process data
} catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return {
        success: false,
        error: error.response?.data?.error?.message || error.message
    };
}
```

### 3. Environment Variables
Required for production:
```
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+xxx
```

### 4. Client-Side Filtering
Used when Airtable's `filterByFormula` is insufficient:
- Complex date ranges
- Linked record filtering
- Multiple condition logic

### 5. Git Workflow
All changes deployed via:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
Railway auto-deploys from main branch.

---

## Summary

This session delivered:
1. ✅ Fixed availability form date logic
2. ✅ Resolved management allocations bugs
3. ✅ Enabled staff/boat deselection
4. ✅ Improved allocation visual feedback
5. ✅ Implemented complete announcements system

All features are live in production at: https://mbh-production-f0d1.up.railway.app

---

*Documentation created: September 9, 2025*
*Last updated: September 9, 2025*
