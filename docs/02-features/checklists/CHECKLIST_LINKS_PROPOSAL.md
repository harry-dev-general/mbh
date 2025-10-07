# Proposal: Add Vessel Checklist Links to My Schedule Page

## Overview
Add direct links to Pre-Departure and Post-Departure checklists from the My Schedule page when staff click on booking allocations they're assigned to.

## Current System Analysis

### Data Structure (Airtable)
1. **Bookings Dashboard Table** (`tblRe0cDmK3bG2kPf`)
   - Links to Pre-Departure Checklist via field `fld5wDB7CrLDrFCZ2`
   - Links to Post-Departure Checklist via field `fldJc6f6jLyBB2Nj3`
   - Has Onboarding Employee field (`fld2sMrEDDPat22Nv`)
   - Has Deloading Employee field (`fldJ7reYmNeO8eT7Q`)

2. **Pre-Departure Checklist Table** (`tbl9igu5g1bPG4Ahu`)
   - Links to Booking via field `fldXMkAsWfgryft6S`
   - Links to Staff Member via field `fld3KUtFsXe22gysP`
   - Has completion status field

3. **Post-Departure Checklist Table** (`tblYkbSQGP6zveYNi`)
   - Links to Booking via field `fldZf0EwbGuMHVKww`
   - Links to Staff Member via field `fld2UsQChRLb0gX7g`
   - Has completion status field

### Current Implementation
1. **My Schedule Page** (`/training/my-schedule.html`)
   - Shows all staff allocations (bookings and regular shifts)
   - Click on allocation opens modal with details
   - Modal allows accepting/declining shifts

2. **Vessel Checklists Page** (`/training/vessel-checklists.html`)
   - Shows count of pending checklists
   - Links to Pre-Departure and Post-Departure checklist pages

3. **Checklist Pages** (`/training/pre-departure-checklist.html` & `/training/post-departure-checklist.html`)
   - Show list of bookings assigned to staff
   - Staff selects a booking to fill out checklist
   - Form submission creates checklist record in Airtable

## Proposed Solution

### 1. Modify Shift Details Modal
Add a new section in the shift details modal for booking allocations that shows:
- Link to Pre-Departure Checklist (for Onboarding role)
- Link to Post-Departure Checklist (for Deloading role)
- Status indicator showing if checklist is already completed

### 2. URL Parameter Approach
Pass booking ID as URL parameter to checklist pages:
- Pre-Departure: `/training/pre-departure-checklist.html?bookingId=recXXXXXX`
- Post-Departure: `/training/post-departure-checklist.html?bookingId=recXXXXXX`

### 3. Enhanced Checklist Pages
Modify checklist pages to:
- Check for bookingId parameter
- If present, auto-select that booking
- Skip booking selection step and go directly to checklist form
- If not present, show normal booking selection interface

## Implementation Details

### Step 1: Update My Schedule Modal (my-schedule.html)
```javascript
// In showShiftDetails function, add after response button section:

// Add checklist link for booking allocations
if (shift.source === 'booking') {
    // Check if checklist already exists
    const checklistType = shift.role === 'Onboarding' ? 'Pre-Departure' : 'Post-Departure';
    const checklistField = shift.role === 'Onboarding' ? 'Pre-Departure Checklist' : 'Post-Departure Checklist';
    const checklistPage = shift.role === 'Onboarding' ? 'pre-departure-checklist.html' : 'post-departure-checklist.html';
    
    modalHTML += `
        <div class="checklist-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
            <h4 style="margin-bottom: 1rem; color: #2E86AB;">
                <i class="fas fa-clipboard-check"></i> Vessel Checklist
            </h4>
            <a href="${checklistPage}?bookingId=${shift.id}" 
               class="btn btn-primary" 
               style="width: 100%; background: #2E86AB; color: white; padding: 0.75rem; text-align: center; border-radius: 4px; text-decoration: none; display: block;">
                <i class="fas fa-clipboard-list"></i> 
                Complete ${checklistType} Checklist
            </a>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #666; text-align: center;">
                ${checklistType === 'Pre-Departure' ? 
                  'Complete safety checks before customer boards' : 
                  'Complete vessel checks after customer departs'}
            </p>
        </div>
    `;
}
```

### Step 2: Update Checklist Pages
Add URL parameter handling to both pre-departure-checklist.html and post-departure-checklist.html:

```javascript
// Add at the beginning of script section
const urlParams = new URLSearchParams(window.location.search);
const bookingIdParam = urlParams.get('bookingId');

// Modify loadBookings function
async function loadBookings() {
    // ... existing code to fetch bookings ...
    
    // If bookingId parameter exists, auto-select that booking
    if (bookingIdParam && data.records) {
        const targetBooking = data.records.find(record => record.id === bookingIdParam);
        if (targetBooking) {
            // Auto-select the booking
            const boatName = targetBooking.fields['Boat'] && targetBooking.fields['Boat'][0] ? 
                           await getBoatName(targetBooking.fields['Boat'][0]) : 'Unknown Vessel';
            selectBooking(targetBooking, boatName);
            return; // Skip rendering booking cards
        }
    }
    
    // ... existing code to render booking cards ...
}
```

### Step 3: Add Status Check (Optional Enhancement)
Check if checklist already exists for the booking:

```javascript
// In my-schedule.html, when loading allocations
async function checkChecklistStatus(bookingId, checklistType) {
    const tableId = checklistType === 'Pre-Departure' ? 'tbl9igu5g1bPG4Ahu' : 'tblYkbSQGP6zveYNi';
    
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${tableId}?filterByFormula={Booking}='${bookingId}'`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const data = await response.json();
        return data.records && data.records.length > 0;
    } catch (error) {
        console.error('Error checking checklist status:', error);
        return false;
    }
}
```

## Benefits

1. **Improved Workflow**: Staff can navigate directly from their schedule to the relevant checklist
2. **Context Preservation**: Booking context is maintained when navigating to checklist
3. **Time Savings**: Eliminates need to search for the booking in checklist page
4. **Better UX**: More intuitive navigation flow
5. **Flexibility**: Maintains existing functionality while adding new convenience features

## Testing Plan

1. **Test Direct Navigation**
   - Click on Onboarding allocation → Navigate to Pre-Departure Checklist
   - Click on Deloading allocation → Navigate to Post-Departure Checklist
   - Verify correct booking is auto-selected

2. **Test Backward Compatibility**
   - Access checklist pages without bookingId parameter
   - Verify normal booking selection still works

3. **Test Edge Cases**
   - Invalid bookingId parameter
   - Booking not assigned to current user
   - Already completed checklists

## Future Enhancements

1. **Status Indicators**: Show checklist completion status in My Schedule
2. **Quick Actions**: Allow marking checklist as complete directly from My Schedule
3. **Notifications**: Alert staff when checklists are due
4. **Mobile Optimization**: Ensure smooth experience on mobile devices

## Implementation Timeline

- **Phase 1** (Immediate): Add basic navigation links
- **Phase 2** (Next Sprint): Add status checking and indicators
- **Phase 3** (Future): Add advanced features like quick actions
