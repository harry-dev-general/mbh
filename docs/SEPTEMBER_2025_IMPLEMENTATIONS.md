# September 2025 Implementations - MBH Staff Portal

## Overview
This document details all implementations and fixes completed during September 2025 for the MBH Staff Portal, including sessions on September 8-9, 11, 15, and ongoing updates.

## Table of Contents
1. [Availability Form Prefill Logic Fix](#1-availability-form-prefill-logic-fix)
2. [Management Allocations Bug Fixes](#2-management-allocations-bug-fixes)
3. [Staff Deselection Feature](#3-staff-deselection-feature)
4. [Allocation Color Coding Update](#4-allocation-color-coding-update)
5. [Announcements System Implementation](#5-announcements-system-implementation)
6. [Vessel Location Tracking Implementation](#6-vessel-location-tracking-implementation)
7. [Fixed Weekly Availability System](#7-fixed-weekly-availability-system)
8. [Allocation Editing and Overlap Display](#8-allocation-editing-and-overlap-display)
9. [Pending Shift Responses Date Filtering](#9-pending-shift-responses-date-filtering)
10. [Vessel Status Management Update Feature](#10-vessel-status-management-update-feature)
11. [Technical Considerations](#technical-considerations)

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

## 6. Vessel Location Tracking Implementation

### Overview
Complete implementation of GPS-based vessel location tracking, allowing staff to capture boat locations during checklists and management to view/update locations.

### Features Implemented
1. **Location Capture**: Browser geolocation API integration in Post-Departure Checklist
2. **Map Displays**: Dynamic vessel locations map with sidebar navigation
3. **Booking Integration**: Mini-maps in allocation popups showing vessel locations
4. **Manual Updates**: Management can update vessel locations via draggable map

### Technical Details
- Used Google Maps API for geocoding and map displays
- Stored GPS coordinates in Airtable Post-Departure Checklist table
- Implemented fallback logic for timestamp display
- Created comprehensive troubleshooting documentation

---

## 7. Fixed Weekly Availability System

### Overview
Implemented a system for full-time staff to have fixed weekly schedules instead of submitting availability each week.

### Implementation
1. **Airtable Schema Changes**:
   - Added "Staff Type" field (Full Time/Casual) to Employee Details
   - Added 21 fields for fixed availability (7 days × 3 fields each)

2. **Automation Script**:
   - Created roster generation script for full-time staff
   - Handles various time formats (6am, 10pm, 9:00 AM)
   - Converts to DateTime format for Roster table

3. **Frontend Updates**:
   - Modified availability form to show fixed schedule for full-time staff
   - Updated management allocations to show staff type indicators
   - Added fixed hours editing in employee directory

### Key Technical Discovery
Airtable DateTime fields require full ISO strings, not just time values.

---

## 8. Allocation Editing and Overlap Display

### 8.1 Vertical Spanning Fix

#### Issue
Multi-hour allocations only displayed as 1-hour blocks on the calendar.

#### Solution
```javascript
const blockHeight = (durationHours * 60) - 4; // -4 for margins
allocationBlock.style.cssText = `
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    height: ${blockHeight}px;
    z-index: 10;
`;
```

### 8.2 Shift Deletion Fix

#### Issues
1. `ReferenceError: AIRTABLE_BASE_ID is not defined`
2. `ReferenceError: loadAllData is not defined`

#### Solutions
1. Changed to correct variable name: `BASE_ID`
2. Changed to correct function: `loadWeekData()`

### 8.3 Allocation Editing Feature

#### Implementation
- Click existing allocations to open edit modal
- Pre-fills current times and staff
- Updates via PATCH request to Airtable

#### Field Compatibility Issues
1. **Notes Field**: Doesn't exist in Shift Allocations table
2. **Response Method**: Must be "Portal" not "Portal Edit"

### 8.4 Overlap Display System

#### Algorithm
```javascript
function handleOverlappingAllocations() {
    // 1. Group blocks by date
    // 2. Sort by start time
    // 3. Find overlapping groups
    // 4. Calculate side-by-side positioning
    // 5. Apply dynamic width and left position
}
```

#### Result
Overlapping allocations now display side-by-side with automatic width adjustment.

---

## 9. Pending Shift Responses Date Filtering

### Issue
The Pending Shift Responses component on the staff dashboard was showing shifts/bookings that had already passed, even though staff could no longer meaningfully respond to them.

### Solution
Added date filtering to both allocation loading functions:

#### Updated `loadGeneralAllocations()`
```javascript
// Get today's date at midnight for comparison
const today = new Date();
today.setHours(0, 0, 0, 0);

// Filter for this employee's allocations and exclude past dates
return data.records
    .filter(record => {
        const shiftDate = record.fields['Shift Date'];
        const shiftDateObj = shiftDate ? new Date(shiftDate) : null;
        const isFutureShift = shiftDateObj && shiftDateObj >= today;
        
        return isAssignedToEmployee && isFutureShift;
    })
```

#### Updated `loadBookingAllocations()`
```javascript
data.records.forEach(record => {
    const bookingDate = fields['Booking Date'];
    
    // Skip if booking date is in the past
    const bookingDateObj = bookingDate ? new Date(bookingDate) : null;
    if (!bookingDateObj || bookingDateObj < today) {
        return; // Skip past bookings
    }
    // ... rest of allocation logic
});
```

### Result
- Staff only see pending responses for shifts/bookings scheduled for today or in the future
- Past shifts are automatically hidden from the Pending Shift Responses component
- Cleaner, more relevant UI for staff members

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

## 10. Vessel Status Management Update Feature

### Overview
Implemented a comprehensive vessel status update system that allows management to update vessel fuel, gas, water levels, and overall condition without requiring a booking association.

### Backend Implementation
Created new endpoint `/api/vessels/:id/status-update` that:
- Accepts fuel, gas, water, condition, and notes fields
- Validates all inputs for correct values
- Creates Post-Departure checklist records with 'MGMT-UPDATE-' prefix
- Clears vessel status cache after updates

### Frontend Implementation
1. **Update Status Button**: Added to each vessel card in the maintenance dashboard
2. **Status Update Modal**: 
   - Pre-populates with current vessel status values
   - Dropdown selects for fuel/gas/water levels (Empty to Full)
   - Dropdown for overall condition (Ready for Use to Major Issues)
   - Notes textarea for additional information
   - Validates at least one field is being updated

### Technical Details
- Uses existing Post-Departure checklist table structure
- Maintains audit trail with timestamps and staff member
- Distinguishes management updates with special Checklist ID prefix
- Leverages existing vessel status display logic

### Benefits
- Management can update vessel status anytime
- No need for dummy bookings
- Clear distinction between regular and management updates
- Maintains complete audit history

---

## 11. Checkfront Webhook Order Items Fix

### Problem
The Airtable webhook automation was only capturing the boat SKU in the "Booking Items" field, missing all additional items like lilly pads, ice bags, fishing rods, etc.

### Root Cause
1. Checkfront sends webhooks in XML format converted to JSON with a nested structure
2. The items are in `booking.order.items.item` as an array
3. Airtable's native webhook automation couldn't properly parse nested arrays

### Solution
Created a custom API endpoint on Railway that:
1. **Receives the full webhook**: Bypasses Airtable's input mapping limitations
2. **Properly parses all items**: Handles the XML-to-JSON format with nested arrays
3. **Intelligently categorizes items**: Uses category mappings to separate boats from add-ons
4. **Updates Airtable via API**: Creates/updates records with proper data structure

### Implementation
1. **Custom API Endpoint**: `/api/checkfront/webhook` on Railway server
2. **Category Mapping**:
   ```javascript
   const categoryMapping = {
     '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
     '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
     '4': { name: 'Add ons', type: 'addon' },
     '5': { name: 'Child Life Jacket', type: 'addon' },
     '6': { name: 'Add ons', type: 'addon' },
     '7': { name: 'Add ons', type: 'addon' }
   };
   ```
3. **New Airtable Field**: Added "Add-ons" field to store non-boat items
4. **Intelligent SKU Formatting**: Converts "lillypad" → "Lilly Pad - $55.00"
5. **Integrated SMS Notifications**: SMS functionality built directly into webhook handler
   - Uses existing `TWILIO_FROM_NUMBER` environment variable
   - Sends notifications only for significant status changes
   - Includes add-ons in booking confirmation messages
   - Handles deduplication to prevent multiple notifications

### Technical Details
- **Webhook URL**: Updated Checkfront to point to Railway endpoint
- **Processing Flow**: Checkfront → Railway API → Airtable API → Airtable Record
- **Data Preservation**: Boat SKU continues to populate linked "Booking Items" field
- **Add-ons Format**: Comma-separated list with pricing (e.g., "Lilly Pad - $55.00, Icebag - $12.50")

### Result ✅ VERIFIED WITH SMS
**Test Booking 1 (KSDA-160925)**:
- **Customer**: Test Booking v2
- **Boat**: 12personbbqboat-halfday (correctly linked to "12 Person BBQ Boat")
- **Add-ons**: "Lilly Pad - $55.00, Icebag - $12.50, Fishing Rods - $20.00"
- **Total**: $637.50 (all items accounted for)

**Test Booking 2 (JGMX-160925)** - WITH SMS INTEGRATION:
- **Customer**: Test Booking v3
- **Boat**: 12personbbqboat-halfday (correctly linked to "12 Person BBQ Boat")
- **Add-ons**: "Lilly Pad - $55.00, Icebag - $12.50, Fishing Rods - $20.00"
- **Total**: $637.50 (all items accounted for)
- **SMS**: ✅ Confirmation SMS sent successfully

The implementation has been deployed, tested, and verified working in production with full SMS integration.

---

### September 17, 2025 - Add-ons Display and Vessel Fixes

**Features Added**:
1. **Booking Add-ons Display** - Shows add-ons in allocation popup with formatted prices
2. **Ice Cream/Work Boat Tracking** - Enabled full location tracking for fixed vessels

**Fixes Applied**:
1. **Overall Condition Field** - Fixed single select validation errors
2. **Location Update for Idle Vessels** - Creates checklist when none exists
3. **Storage Location Display** - Shows both current and storage locations

**Technical Improvements**:
- Comprehensive documentation for Airtable single select handling
- Improved error handling for edge cases

## Summary

This session delivered:
1. ✅ Fixed availability form date logic
2. ✅ Resolved management allocations bugs
3. ✅ Enabled staff/boat deselection
4. ✅ Improved allocation visual feedback
5. ✅ Implemented complete announcements system
6. ✅ Added date filtering to Pending Shift Responses
7. ✅ Created vessel status management update feature
8. ✅ Fixed Checkfront webhook to capture all order items
9. ✅ Integrated SMS notifications directly into webhook handler
10. ✅ Added booking add-ons display to allocation popup
11. ✅ Fixed vessel status and location update issues
12. ✅ Enabled Ice Cream Boat and Work Boat location tracking

All features are live in production at: https://mbh-production-f0d1.up.railway.app

---

## 12. Add-ons Management Feature

### Overview
Implemented comprehensive add-ons management functionality allowing managers to add, remove, and customize add-on items directly from booking allocations.

### Features Implemented
1. **API Layer** (`/api/addons-management.js`)
   - Catalog endpoint with predefined items
   - CRUD operations for booking add-ons
   - Format validation and parsing utilities
   - Maintains webhook compatibility

2. **Frontend Enhancement** (`management-allocations.html`)
   - Integrated add-ons manager in booking modal
   - Categorized catalog display
   - Custom item addition capability
   - Real-time total calculation
   - Inline item removal

3. **Data Format Preservation**
   - Maintains exact webhook format: "Item - $Price, Item - $Price"
   - Seamless integration with existing systems
   - No breaking changes

### Technical Implementation
```javascript
// API endpoints
GET  /api/addons/catalog              // Get available add-ons
GET  /api/addons/booking/:bookingId   // Get current add-ons
PATCH /api/addons/booking/:bookingId  // Update add-ons
POST /api/addons/validate             // Validate format

// Format maintained
"Lilly Pad - $55.00, Fishing Rods - $20.00, Icebag - $12.50"
```

### User Experience
- One-click access from booking modal
- Intuitive add/remove interface
- Prevents duplicate items
- Automatic save on changes
- Visual feedback for all actions

---

## 13. SMS Notification Logic Fix

### Issue
Staff were receiving duplicate SMS notifications when managers updated booking details (add-ons, boats, etc.) even though they had already accepted the shift.

### Solution
Modified the booking allocation form to check if staff assignment is actually changing before sending SMS notifications.

### Implementation
```javascript
// Only send SMS if staff is being newly assigned or changed
const isStaffChanging = selectedStaffId && selectedStaffId !== currentStaffId;

if (isStaffChanging) {
    // Send SMS notification
}
```

### Result
- SMS only sent when staff assignment changes
- No duplicate notifications for other updates
- Console logging for debugging
- Improved user experience and reduced SMS costs

---

## 14. Management Dashboard UI Redesign

### Overview
Complete redesign of the management dashboard to provide a cleaner, more efficient interface with better operational visibility.

### Major Changes
1. **Weekly Calendar Component**
   - Replaced static overview cards with dynamic weekly calendar
   - Compact bi-hourly time slots (6 AM - 8 PM)
   - Color-coded bookings with vessel assignments
   - Current time indicator

2. **New Bookings Feed**
   - Changed from "Upcoming Bookings" to "New Bookings"
   - Shows recently added bookings with timestamps
   - Real-time simulation for demonstration

3. **UI Simplification**
   - Removed search bar and notification icons
   - Three-column responsive layout
   - Mobile-optimized with hamburger menu
   - Consistent color scheme throughout

4. **Logout Button Fix**
   - Fixed positioning issues with flexbox layout
   - Stays at bottom of sidebar without following scroll
   - Proper z-index layering

### Technical Implementation
- Pure CSS/JavaScript (no frameworks)
- Flexbox and CSS Grid for layouts
- Mobile breakpoints at 1440px, 1024px, 768px
- Performance optimized with minimal DOM updates

---

## 15. Authentication Redirect Loop Fix

### Critical Issue
Management users experienced infinite redirect loops between auth.html → dashboard.html → management-dashboard.html → auth.html

### Root Causes
1. **Different Supabase Projects**: Management dashboard using different credentials
2. **Session Check Method**: Using unreliable `getUser()` instead of `getSession()`
3. **Missing Auth Handler**: No `onAuthStateChange` listener
4. **Email List Mismatch**: Different authorized emails between dashboards

### Solution
1. **Unified Supabase Configuration**
   ```javascript
   // Both dashboards now use same project
   const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
   ```

2. **Robust Session Checking**
   ```javascript
   // Use getSession() for reliability
   const { data: { session }, error } = await supabase.auth.getSession();
   ```

3. **Auth State Monitoring**
   ```javascript
   supabase.auth.onAuthStateChange((event, session) => {
       // Handle auth events properly
   });
   ```

4. **Synchronized Management Lists**
   - Aligned email lists across all dashboards
   - Consistent authorization checks

### Key Learning
Always use `getSession()` for Supabase auth checks in multi-page applications to avoid race conditions during session restoration.

---

*Documentation created: September 9, 2025*
*Last updated: September 23, 2025 (Dashboard redesign, redirect loop fix, comprehensive documentation update)*
