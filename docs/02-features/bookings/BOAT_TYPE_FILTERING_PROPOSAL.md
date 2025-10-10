# Boat Type Filtering Implementation Proposal

## Overview
Enhance the management allocations page to:
1. Display boat type information from booking items
2. Filter boat selection dropdown based on the booked boat type
3. Handle both legacy and new SKU formats

## Current State Analysis

### Boat Categories (from Boats table)
- **12 Person BBQ Boat**: Pumice Stone, Junior
- **8 Person BBQ Boat**: Sandstone
- **4 Person Polycraft**: Polycraft Yam, Polycraft Merc
- **Work Boat**: Ice Cream Boat, Work Boat

### Booking Item SKUs

#### New Format (to implement)
```
12personbbqboat-halfday
12personbbqboat-fullday
8personbbqboat-fullday
8personbbqboat-halfday
4personpolycraft-halfday
4personpolycraft-fullday
```

#### Legacy Format (currently in use)
```
12personbbqboat
fullday12personbbqboat
8personbbqboat
fullday8personbbqboat
4personpolycraft
fullday4personpolycraft
```

## Implementation Plan

### 1. Create Boat Type Parser Function
```javascript
function parseBoatType(bookingItems) {
    if (!bookingItems) return null;
    
    // Convert to lowercase for case-insensitive matching
    const items = bookingItems.toLowerCase();
    
    // Check for boat type patterns (both new and legacy)
    if (items.includes('12personbbqboat')) {
        return '12 Person BBQ Boat';
    } else if (items.includes('8personbbqboat')) {
        return '8 Person BBQ Boat';
    } else if (items.includes('4personpolycraft')) {
        return '4 Person Polycraft';
    }
    
    return null; // No boat type found (could be add-ons only)
}

function isFullDay(bookingItems) {
    if (!bookingItems) return false;
    const items = bookingItems.toLowerCase();
    return items.includes('fullday') || items.includes('-fullday');
}
```

### 2. Update Booking Display

#### Calendar View Enhancement
Add boat type indicator to booking blocks:
```javascript
// In createBookingBlock function
const boatType = parseBoatType(booking['Booking Items']);
const duration = isFullDay(booking['Booking Items']) ? 'Full Day' : 'Half Day';
const boatTypeInfo = boatType ? 
    `<div style="font-size: 8px; opacity: 0.8; color: #1976d2;">
        <i class="fas fa-anchor"></i> ${boatType} (${duration})
    </div>` : '';
```

#### Booking List Enhancement
Add boat type badge to booking cards:
```javascript
// In renderBookingsList function
const boatType = parseBoatType(fields['Booking Items']);
const boatTypeBadge = boatType ? 
    `<span class="staff-badge" style="background: #1976d2; color: white;">
        <i class="fas fa-anchor"></i> ${boatType}
    </span>` : '';
```

### 3. Filter Boat Selection Dropdown

#### Modify populateBoatSelect Function
```javascript
function populateBoatSelect(filterByType = null) {
    const boatSelect = document.getElementById('boatSelect');
    if (!boatSelect) return;
    
    boatSelect.innerHTML = '<option value="">Select Boat</option>';
    
    // Filter boats based on type if specified
    const filteredBoats = filterByType ? 
        boatsData.filter(boat => boat.fields['Boat Type'] === filterByType) : 
        boatsData;
    
    if (filteredBoats.length === 0 && filterByType) {
        boatSelect.innerHTML += `
            <option value="" disabled>No ${filterByType} available</option>
        `;
        return;
    }
    
    filteredBoats.forEach(boat => {
        const name = boat.fields['Name'];
        const description = boat.fields['Description'] || '';
        const boatType = boat.fields['Boat Type'];
        const label = description ? 
            `${name} - ${description}` : 
            `${name} (${boatType})`;
        
        boatSelect.innerHTML += `
            <option value="${boat.id}">${label}</option>
        `;
    });
}
```

#### Update openBookingAllocationModal
```javascript
function openBookingAllocationModal(bookingRecord, allocationType) {
    // ... existing code ...
    
    // Parse boat type from booking items
    const boatType = parseBoatType(booking['Booking Items']);
    
    // Populate boat dropdown with filtered options
    if (boatType) {
        populateBoatSelect(boatType);
        
        // Add info message about filtering
        const boatGroup = document.getElementById('boatGroup');
        const filterInfo = boatGroup.querySelector('.filter-info');
        if (filterInfo) filterInfo.remove();
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'filter-info';
        infoDiv.style.cssText = 'font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;';
        infoDiv.innerHTML = `
            <i class="fas fa-info-circle"></i> 
            Showing only ${boatType} vessels for this booking
        `;
        boatGroup.insertBefore(infoDiv, boatGroup.firstChild);
    } else {
        // No boat type detected, show all boats
        populateBoatSelect();
    }
    
    // ... rest of existing code ...
}
```

### 4. Visual Enhancements

#### Add CSS for Boat Type Styling
```css
.boat-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 12px;
    background: #e3f2fd;
    color: #1565c0;
    border: 1px solid #90caf9;
}

.boat-type-12 { background: #e8f5e9; color: #2e7d32; border-color: #81c784; }
.boat-type-8 { background: #e3f2fd; color: #1565c0; border-color: #64b5f6; }
.boat-type-4 { background: #f3e5f5; color: #6a1b9a; border-color: #ba68c8; }
```

## Benefits

1. **Improved User Experience**
   - Managers immediately see what type of boat was booked
   - Boat selection is pre-filtered to relevant options
   - Reduces chance of assigning wrong boat type

2. **Better Visual Clarity**
   - Boat type visible in calendar and list views
   - Full/Half day duration displayed
   - Color coding for different boat types

3. **Backwards Compatibility**
   - Handles both new and legacy SKU formats
   - Gracefully handles bookings without boat items

4. **Operational Efficiency**
   - Faster boat assignment process
   - Fewer mistakes in boat allocation
   - Clear visibility of booking requirements

## Testing Scenarios

1. **Legacy SKU**: "fullday12personbbqboat"
   - Should show "12 Person BBQ Boat (Full Day)"
   - Should filter to show only Pumice Stone and Junior

2. **New SKU**: "8personbbqboat-halfday"
   - Should show "8 Person BBQ Boat (Half Day)"
   - Should filter to show only Sandstone

3. **Mixed Items**: "4personpolycraft-fullday,icebags,fishingrods"
   - Should show "4 Person Polycraft (Full Day)"
   - Should filter to show only Polycraft boats

4. **No Boat Items**: "icebags,lilypads"
   - Should not show boat type
   - Should show all boats in dropdown

## Future Enhancements

1. **Availability Checking**
   - Cross-reference with other bookings
   - Show only available boats for the time slot

2. **Capacity Validation**
   - Warn if booking party size exceeds boat capacity
   - Suggest appropriate boats based on group size

3. **Maintenance Status**
   - Hide boats under maintenance
   - Show maintenance schedule warnings
