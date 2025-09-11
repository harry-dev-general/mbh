# Fixed Vessel Locations - Marina Berths

**Implementation Date**: September 11, 2025  
**Version**: 1.1

## Overview

Certain vessels in the MBH fleet have permanent marina berths that should not be updated dynamically through Post-Departure Checklists. This document describes the implementation of fixed marina berth locations for these vessels.

## Marina Berth Vessels

### Work Boat
- **Location**: Fergusons Marina
- **Coordinates**: -33.8126, 151.2738
- **Address**: Fergusons Marina

### Ice Cream Boat
- **Location**: Dalbora Marina The Spit, A Arm
- **Coordinates**: -33.8058, 151.2485
- **Address**: Dalbora Marina The Spit, A Arm

## Implementation Details

### 1. Management Dashboard
- Displays "Marina Berth" with lock icon (🔒) instead of timestamp
- "Update" button is hidden for marina berth vessels
- Map button still available to view location

### 2. Vessel Locations Map
- Marina berth locations are automatically applied when data loads
- Info windows show "🔒 Marina Berth" instead of last update time
- Vessels appear on map at their permanent marina positions

### 3. My Schedule Page
- Booking allocation popups show marina berth locations
- Display "🔒 Marina Berth" instead of timestamp
- Mini-maps show the permanent marina berth position

### 4. Post-Departure Checklist
- Location capture button is hidden for marina berth vessels
- Displays marina berth location automatically with lock icon
- Shows message: "This vessel has a permanent marina berth"
- Marina berth location is still saved to Airtable for consistency

## Technical Implementation

### Fixed Location Data Structure
```javascript
const fixedLocations = {
    'Work Boat': {
        latitude: -33.8126,
        longitude: 151.2738,
        address: 'Fergusons Marina',
        captured: true,
        isFixed: true
    },
    'Ice Cream Boat': {
        latitude: -33.8058,
        longitude: 151.2485,
        address: 'Dalbora Marina The Spit, A Arm',
        captured: true,
        isFixed: true
    }
};
```

### Override Pattern
```javascript
// Override location for fixed vessels
if (fixedLocations[vessel.name]) {
    if (!vessel.currentStatus) {
        vessel.currentStatus = {};
    }
    vessel.currentStatus.location = fixedLocations[vessel.name];
}
```

## User Experience

### Staff Perspective
1. When completing Post-Departure Checklist for Work Boat or Ice Cream Boat:
   - No location capture button appears
   - Marina berth location is displayed automatically
   - Location is saved with checklist submission

2. When viewing vessel locations:
   - Marina berth vessels show lock icon
   - No "last updated" timestamp
   - Clear indication of permanent marina berth

### Management Perspective
1. Cannot manually update location for marina berth vessels
2. Always see current marina berth location on dashboard
3. Historical checklists still record the marina berth location

## Benefits

1. **Consistency**: These vessels always show at correct marina locations
2. **Clarity**: Clear visual distinction between marina berths and dynamic locations
3. **Simplicity**: Staff don't need to capture location for marina-berthed vessels
4. **Accuracy**: Prevents accidental location updates

## Adding New Marina Berth Vessels

To add a new vessel with marina berth:

1. Add to `fixedLocations` object in each file:
   - `management-dashboard.html`
   - `vessel-locations-map.html`
   - `my-schedule.html`
   - `post-departure-checklist.html`

2. Include required fields:
   ```javascript
   'Vessel Name': {
       latitude: -33.XXXX,
       longitude: 151.XXXX,
       address: 'Location Description',
       captured: true,
       isFixed: true
   }
   ```

## Maintenance Notes

- Marina berth locations are hardcoded in frontend files
- No database changes required
- API continues to work normally
- Marina berth locations override any dynamic data

## Related Documentation

- [Vessel Location Tracking Implementation](./VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)
- [Location Tracking Troubleshooting](../../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md)
