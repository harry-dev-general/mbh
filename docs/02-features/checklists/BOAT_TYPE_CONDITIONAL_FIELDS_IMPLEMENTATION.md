# Boat Type Conditional Fields Implementation

## Overview
This document details the implementation of conditional field display in Pre-Departure and Post-Departure checklists based on vessel boat type. BBQ boats (8 Person BBQ Boat and 12 Person BBQ Boat) require additional fields compared to other vessel types.

## Problem Statement
The checklist system was treating all vessels the same, showing gas and water level fields for all boat types. However, only BBQ boats have gas bottles and water tanks that need tracking. Other vessels (Polycrafts, Work Boats, Ice Cream Boats) only require fuel level tracking.

## Technical Architecture

### Boat Type Differentiation
- **BBQ Boats**: "8 Person BBQ Boat", "12 Person BBQ Boat"
  - Require: Fuel, Gas, Water tracking
  - Additional fields: BBQ Cleaned, Toilet Cleaned, Lights Working, Battery Check, Toilet Pumped Out
- **Non-BBQ Boats**: All other boat types
  - Require: Fuel tracking only
  - Simplified checklist without gas/water/BBQ-specific fields

### Implementation Layers

#### 1. Client-Side Checklists
- **Files**: 
  - `/training/pre-departure-checklist.html`
  - `/training/post-departure-checklist.html`
- **Implementation**:
  - Added `selectedBoatType` global variable and `BBQ_BOAT_TYPES` constant
  - Created `getBoatDetails()` function to fetch boat information from API
  - Added `configureFieldsForBoatType()` to dynamically show/hide fields
  - Modified submission logic to handle conditional field validation

#### 2. Server-Side Rendering (SSR)
- **File**: `/api/checklist-renderer.js`
- **Key Discovery**: SMS system links to SSR versions (`*-ssr.html`), not client-side versions
- **Implementation**:
  - Added boat type fetching in `handleChecklistPage()`
  - Conditional rendering using template literals: `${isBBQBoat ? '...' : ''}`
  - Dynamic field inclusion in Airtable submissions using spread syntax

#### 3. API Layer
- **File**: `/api/checklist-api.js`
- **Endpoint**: `/api/checklist/boat/:boatId`
- **Change**: Added `boatType` field to response

## Technical Discoveries & Solutions

### 1. SSR vs Client-Side Rendering
**Problem**: Initial implementation only updated client-side checklists, but SMS links pointed to SSR versions.
**Solution**: Updated `checklist-renderer.js` to include the same conditional logic.

### 2. Airtable Field Validation
**Problem**: Airtable rejected "N/A" values for single-select fields with error:
```
type: 'INVALID_MULTIPLE_CHOICE_OPTIONS',
message: 'Insufficient permissions to create new select option "N/A"'
```
**Solution**: Use spread syntax to conditionally include fields rather than sending invalid values:
```javascript
// Instead of:
'Gas Bottle Check': data.gasLevel === 'N/A' ? 'N/A' : data.gasLevel

// Use:
...(data.gasLevel && data.gasLevel !== 'N/A' ? {'Gas Bottle Check': data.gasLevel} : {})
```

### 3. Checkbox Field Handling
**Problem**: Undefined checkbox values causing submission errors.
**Solution**: Only include checkbox fields if they exist in the form data:
```javascript
...(data.bbqCleaned !== undefined ? {'BBQ Cleaned': data.bbqCleaned || false} : {})
```

## Fields Affected

### Pre-Departure Checklist
**Removed for Non-BBQ Boats**:
- Gas Bottle Check (dropdown)
- Water Tank Level (dropdown)
- Gas Bottle Replaced (checkbox)
- Water Tank Refilled (checkbox)
- BBQ Cleaned (checkbox)
- Toilet Cleaned (checkbox)
- All Lights Working (checkbox)
- Battery condition checked (checkbox)

### Post-Departure Checklist
**Removed for Non-BBQ Boats**:
- Gas Bottle Level After Use (dropdown)
- Water Tank Level After Use (dropdown)
- Gas Bottle Replaced (checkbox)
- Water Tank Refilled (checkbox)
- Toilet Pumped Out (checkbox)
- BBQ Cleaned (checkbox)
- Toilet Cleaned (checkbox)

## Implementation Steps

1. **Identify boat type**: Fetch from Airtable Boats table
2. **Configure UI**: Show/hide fields based on boat type
3. **Handle submission**: Only validate and send applicable fields
4. **Update SSR**: Apply same logic to server-rendered versions

## Testing Approach

1. Test with BBQ boat - verify all fields appear and submit correctly
2. Test with non-BBQ boat - verify conditional fields are hidden
3. Test SMS links - ensure SSR versions work correctly
4. Verify Airtable data - check that non-applicable fields aren't stored

## Key Code Patterns

### Conditional Rendering (SSR)
```javascript
${isBBQBoat ? `
<div class="checklist-item">
    <input type="checkbox" id="toiletPumped" name="toiletPumped">
    <label for="toiletPumped">Toilet Pumped Out</label>
</div>
` : ''}
```

### Conditional Field Submission
```javascript
// Only include field if it has a valid value
...(data.gasLevel && data.gasLevel !== 'N/A' ? {'Gas Bottle Check': data.gasLevel} : {})
```

### Client-Side Field Configuration
```javascript
function configureFieldsForBoatType(boatType) {
    const isBBQBoat = BBQ_BOAT_TYPES.includes(boatType);
    document.querySelectorAll('.bbq-only').forEach(el => {
        el.style.display = isBBQBoat ? 'block' : 'none';
    });
}
```

## Related Documentation
- [Vessel Checklists Guide](./VESSEL_CHECKLISTS_GUIDE.md)
- [Checklist System Operational](./CHECKLIST_SYSTEM_OPERATIONAL.md)
- [Boat Type Implementation](../bookings/BOAT_TYPE_IMPLEMENTATION_SIMPLE.md)
