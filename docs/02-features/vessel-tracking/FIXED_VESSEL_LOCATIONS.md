# Fixed Vessel Locations

**Implementation Date**: September 11, 2025  
**Version**: 1.0

## Overview

Certain vessels in the MBH fleet have permanent mooring locations that should not be updated dynamically through Post-Departure Checklists. This document describes the implementation of fixed locations for these vessels.

## Fixed Location Vessels

### Work Boat
- **Location**: Manly Wharf East Side
- **Coordinates**: -33.7972, 151.2873
- **Address**: Manly Wharf East Side, NSW 2095

### Ice Cream Boat
- **Location**: Manly Cove Marina
- **Coordinates**: -33.7983, 151.2847
- **Address**: Manly Cove Marina, NSW 2095

## Implementation Details

### 1. Management Dashboard
- Displays "Fixed Location" with lock icon (🔒) instead of timestamp
- "Update" button is hidden for fixed location vessels
- Map button still available to view location

### 2. Vessel Locations Map
- Fixed locations are automatically applied when data loads
- Info windows show "🔒 Fixed Location" instead of last update time
- Vessels appear on map at their permanent positions

### 3. My Schedule Page
- Booking allocation popups show fixed locations
- Display "🔒 Fixed Location" instead of timestamp
- Mini-maps show the permanent mooring position

### 4. Post-Departure Checklist
- Location capture button is hidden for fixed vessels
- Displays fixed location automatically with lock icon
- Shows message: "This vessel has a permanent mooring location"
- Fixed location is still saved to Airtable for consistency

## Technical Implementation

### Fixed Location Data Structure
```javascript
const fixedLocations = {
    'Work Boat': {
        latitude: -33.7972,
        longitude: 151.2873,
        address: 'Manly Wharf East Side, NSW 2095',
        captured: true,
        isFixed: true
    },
    'Ice Cream Boat': {
        latitude: -33.7983,
        longitude: 151.2847,
        address: 'Manly Cove Marina, NSW 2095',
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
   - Fixed location is displayed automatically
   - Location is saved with checklist submission

2. When viewing vessel locations:
   - Fixed vessels show lock icon
   - No "last updated" timestamp
   - Clear indication of permanent location

### Management Perspective
1. Cannot manually update location for fixed vessels
2. Always see current fixed location on dashboard
3. Historical checklists still record the fixed location

## Benefits

1. **Consistency**: These vessels always show at correct locations
2. **Clarity**: Clear visual distinction between fixed and dynamic locations
3. **Simplicity**: Staff don't need to capture location for stationary vessels
4. **Accuracy**: Prevents accidental location updates

## Adding New Fixed Vessels

To add a new vessel with fixed location:

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

- Fixed locations are hardcoded in frontend files
- No database changes required
- API continues to work normally
- Fixed locations override any dynamic data

## Related Documentation

- [Vessel Location Tracking Implementation](./VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)
- [Location Tracking Troubleshooting](../../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md)
