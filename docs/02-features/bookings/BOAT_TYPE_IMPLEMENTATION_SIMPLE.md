# Simplified Boat Type Implementation

## Approach
Since you've updated the SKUs to the new format, we'll implement a clean solution that:
1. Works with current structure (parsing Booking Items)
2. Is easily replaceable when you add the "Booked Boat Type" field

## Implementation Steps

### 1. Add Boat Type Parser (Temporary)
```javascript
// This will be replaced when "Booked Boat Type" field is added
function getBookedBoatType(booking) {
    // Future: return booking['Booked Boat Type'];
    
    const items = booking['Booking Items'];
    if (!items) return null;
    
    if (items.includes('12personbbqboat')) return '12 Person BBQ Boat';
    if (items.includes('8personbbqboat')) return '8 Person BBQ Boat';
    if (items.includes('4personpolycraft')) return '4 Person Polycraft';
    
    return null;
}
```

### 2. Update Boat Selection Filter
```javascript
function filterBoatsByType(boatType) {
    if (!boatType) return boatsData;
    return boatsData.filter(boat => boat.fields['Boat Type'] === boatType);
}
```

### 3. Modify Modal to Show Filtered Boats
```javascript
// In openBookingAllocationModal
const bookedBoatType = getBookedBoatType(booking);
const availableBoats = filterBoatsByType(bookedBoatType);

// Update dropdown
populateBoatSelect(availableBoats, bookedBoatType);
```

### 4. Add Visual Indicators
```javascript
// Show what type of boat was booked
if (bookedBoatType) {
    const boatTypeIndicator = `
        <div style="margin-bottom: 1rem; padding: 0.5rem; 
                    background: #e3f2fd; border-radius: 4px;">
            <i class="fas fa-info-circle"></i> 
            Customer booked: <strong>${bookedBoatType}</strong>
        </div>
    `;
}
```

## Future Migration Path

When "Booked Boat Type" field is added to Airtable:

1. Update webhook to populate the field
2. Change one line of code:
   ```javascript
   // Old:
   const bookedBoatType = getBookedBoatType(booking);
   
   // New:
   const bookedBoatType = booking['Booked Boat Type'];
   ```
3. Remove the parser function

## Why This Works

1. **Clean Separation**: Boat type logic is isolated in one function
2. **Easy Migration**: One-line change when field is added
3. **No Hardcoded Mappings**: Uses actual "Boat Type" field from Boats table
4. **Visual Clarity**: Shows managers what was booked vs what's available
