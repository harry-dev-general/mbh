# Boat Selection Feature for Management Allocations

## Overview
Add boat selection functionality to the management allocations page, allowing managers to assign boats to customer bookings.

## Current System Analysis

### Existing Structure
1. **Management Allocations Page** (`/management-allocations.html`)
   - Shows calendar view with bookings
   - Click on booking opens modal for staff allocation
   - Currently focused only on assigning staff (Onboarding/Deloading)

2. **Airtable Structure**
   - **Bookings Dashboard**: Has "Boat" field (ID: `flde5X7IYKUpKo7ik`)
   - **Boats Table**: Contains 7 boats with details
   - Boats are linked records (multiple record links field)

3. **Available Boats**
   - Polycraft Yam
   - Sandstone (8 Seater)
   - Pumice Stone (12 Seater)
   - Junior (12 Seater new)
   - Polycraft Merc
   - Ice Cream Boat
   - Work Boat

## Proposed Solution

### Option 1: Enhance Existing Modal (Recommended)
Add boat selection to the current allocation modal when dealing with bookings.

**Advantages:**
- Single interface for all booking management
- Less clicks for managers
- Maintains current workflow

### Option 2: Separate Booking Details Modal
Create a new modal specifically for booking details including boat selection.

**Advantages:**
- Cleaner separation of concerns
- More room for future booking features
- Could show more booking details

## Implementation Plan (Option 1)

### 1. Modify Allocation Modal
```html
<!-- Add after the booking selection dropdown -->
<div class="form-group" id="boatGroup" style="display: none;">
    <label for="boatSelect">
        <i class="fas fa-ship"></i> Assign Boat
        <span class="field-required">*</span>
    </label>
    <select id="boatSelect" class="form-control">
        <option value="">Select Boat</option>
        <!-- Populated dynamically -->
    </select>
    <small class="form-text text-muted">
        Current boat: <span id="currentBoat">None assigned</span>
    </small>
</div>
```

### 2. JavaScript Modifications

#### Load Boats Data
```javascript
let boatsData = [];

async function loadBoats() {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const data = await response.json();
        boatsData = data.records || [];
        populateBoatSelect();
    } catch (error) {
        console.error('Error loading boats:', error);
    }
}

function populateBoatSelect() {
    const boatSelect = document.getElementById('boatSelect');
    boatSelect.innerHTML = '<option value="">Select Boat</option>';
    
    boatsData.forEach(boat => {
        const name = boat.fields['Name'];
        const description = boat.fields['Description'] || '';
        const label = description ? `${name} - ${description}` : name;
        
        boatSelect.innerHTML += `
            <option value="${boat.id}">${label}</option>
        `;
    });
}
```

#### Modify openBookingAllocationModal
```javascript
function openBookingAllocationModal(bookingRecord, allocationType) {
    // ... existing code ...
    
    // Show boat selection for bookings
    const boatGroup = document.getElementById('boatGroup');
    boatGroup.style.display = 'block';
    
    // Display current boat if any
    const currentBoatId = booking['Boat'] && booking['Boat'][0];
    const currentBoatSpan = document.getElementById('currentBoat');
    
    if (currentBoatId) {
        const boat = boatsData.find(b => b.id === currentBoatId);
        currentBoatSpan.textContent = boat ? boat.fields['Name'] : 'Unknown boat';
        document.getElementById('boatSelect').value = currentBoatId;
    } else {
        currentBoatSpan.textContent = 'None assigned';
        document.getElementById('boatSelect').value = '';
    }
    
    // ... rest of existing code ...
}
```

#### Update Form Submission
```javascript
// In the form submission handler, add boat update
if (bookingId && document.getElementById('boatSelect').value) {
    // Update booking with selected boat
    const boatUpdateFields = {
        'Boat': [document.getElementById('boatSelect').value]
    };
    
    const boatUpdateResponse = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: boatUpdateFields })
        }
    );
    
    if (!boatUpdateResponse.ok) {
        throw new Error('Failed to update boat assignment');
    }
}
```

### 3. Visual Enhancements

#### Show Boat in Calendar View
Add boat info to booking blocks:
```javascript
// In createBookingBlock function
const boatId = booking['Boat'] && booking['Boat'][0];
const boatName = boatId ? boatsData.find(b => b.id === boatId)?.fields['Name'] : null;

if (boatName) {
    bookingBlock.innerHTML += `
        <div style="font-size: 8px; opacity: 0.8;">
            <i class="fas fa-ship"></i> ${boatName}
        </div>
    `;
}
```

#### Add Boat Badge to Bookings List
```javascript
// In displayBookings function
if (fields['Boat'] && fields['Boat'][0]) {
    const boat = boatsData.find(b => b.id === fields['Boat'][0]);
    if (boat) {
        html += `
            <span class="staff-badge" style="background: #3498db; color: white;">
                <i class="fas fa-ship"></i> ${boat.fields['Name']}
            </span>
        `;
    }
}
```

## Benefits

1. **Centralized Management**: Managers can assign both staff and boats in one place
2. **Visual Clarity**: Boat assignments visible in calendar and list views
3. **Efficiency**: Reduces clicks and navigation
4. **Data Integrity**: Updates directly to Airtable
5. **User-Friendly**: Clear indication of current assignments

## Testing Plan

1. **Load Boats**: Verify all boats load in dropdown
2. **Assign Boat**: Test assigning boat to booking
3. **Update Boat**: Test changing boat assignment
4. **Display**: Verify boat shows in calendar and list views
5. **Persistence**: Confirm changes saved to Airtable

## Future Enhancements

1. **Availability Check**: Show which boats are available for the booking date
2. **Capacity Matching**: Highlight boats that match booking party size
3. **Maintenance Status**: Show/hide boats based on maintenance schedule
4. **Quick Actions**: Bulk boat assignments
5. **Boat Schedule View**: Dedicated view showing boat utilization
