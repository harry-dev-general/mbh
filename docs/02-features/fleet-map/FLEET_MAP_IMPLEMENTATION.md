# Fleet Map Implementation Guide

## Overview
The fleet map component on the management dashboard provides real-time visualization of all vessel locations, integrating GPS tracking data with fixed storage locations.

## Architecture

### Data Sources
1. **GPS Tracking**: Real-time location data from Pre/Post Departure Checklists
2. **Fixed Locations**: Default storage/mooring locations for vessels without GPS data
3. **Vessel Status API**: `/api/vessels/maintenance-status` endpoint

### Components
- **Map Display**: Google Maps JavaScript API integration
- **Vessel Cards**: Interactive cards showing vessel status and location
- **Info Windows**: Detailed vessel information popups on map

## Implementation Details

### 1. Fixed Vessel Locations

All vessels have designated storage locations for when GPS data is unavailable:

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
        address: 'Dalbora The Spit',
        captured: true,
        isFixed: true
    },
    'Sandstone': {
        latitude: -33.8028,
        longitude: 151.2659,
        address: 'Balmoral Mooring',
        captured: true,
        isFixed: true
    },
    'Pumice Stone': {
        latitude: -33.8074,
        longitude: 151.2723,
        address: 'Little Manly Commercial Mooring',
        captured: true,
        isFixed: true
    },
    'Junior': {
        latitude: -33.7974,
        longitude: 151.2508,
        address: 'Seaforth Mooring',
        captured: true,
        isFixed: true
    },
    'Polycraft Yam': {
        latitude: -33.8085,
        longitude: 151.2735,
        address: 'Manly Boat Hire Base',
        captured: true,
        isFixed: true
    },
    'Polycraft Merc': {
        latitude: -33.8085,
        longitude: 151.2735,
        address: 'Manly Boat Hire Base',
        captured: true,
        isFixed: true
    }
};
```

### 2. Location Priority Logic

The system prioritizes location data as follows:
1. **GPS Data**: If available from recent checklist (`vessel.currentStatus?.location?.latitude`)
2. **Fixed Location**: Falls back to predefined storage location
3. **No Display**: Only if neither is available (should not happen)

```javascript
vessels.forEach(vessel => {
    let location = vessel.currentStatus?.location;
    
    // Use fixed location if vessel doesn't have GPS data
    if (!location?.latitude && fixedLocations[vessel.name]) {
        location = fixedLocations[vessel.name];
    }
    
    if (location?.latitude) {
        // Create marker and display on map
    }
});
```

### 3. Visual Differentiation

The UI clearly distinguishes between GPS and fixed locations:

#### Map Markers
- **Color Coding**:
  - Green: Good condition
  - Yellow: Needs attention  
  - Red: Major issues/Non-operational
  - Blue: Default/Unknown

#### Info Windows
- Shows "Last Known Location" for GPS data
- Shows "Storage Location" for fixed locations
- Includes timestamp for GPS locations
- Shows GPS icon (📍) for fixed storage locations

#### Vessel Cards
- Map pin icon (📍) for GPS locations
- Anchor icon (⚓) for storage locations
- "(Storage)" label appended to location name

### 4. Interactive Features

#### Card-to-Map Linking
Clicking a vessel card:
1. Opens corresponding map marker info window
2. Centers map on vessel location
3. Zooms to level 15
4. Smooth scrolls to map if not visible

```javascript
function initializeVesselInteractivity() {
    document.querySelectorAll('.vessel-card').forEach(card => {
        card.addEventListener('click', function() {
            const vesselName = this.getAttribute('data-vessel-name');
            const marker = fleetMarkers.find(m => m.vesselName === vesselName);
            
            if (marker) {
                // Close other info windows
                fleetMarkers.forEach(m => {
                    if (m.infoWindow) m.infoWindow.close();
                });
                
                // Open selected vessel info window
                marker.infoWindow.open(fleetMap, marker);
                fleetMap.setCenter(marker.getPosition());
                fleetMap.setZoom(15);
                
                // Scroll to map
                const mapContainer = document.getElementById('fleetMap');
                if (mapContainer) {
                    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
}
```

### 5. Map Initialization

```javascript
function initFleetMap() {
    fleetMap = new google.maps.Map(document.getElementById('fleetMap'), {
        center: { lat: -33.8063, lng: 151.2680 }, // Manly area
        zoom: 13,
        mapTypeId: 'roadmap',
        styles: [ /* Custom map styling */ ]
    });
    
    loadVesselMarkers();
}
```

## API Integration

### Vessel Status Endpoint
`GET /api/vessels/maintenance-status`

Returns vessel data including:
- Basic vessel information
- Current status/condition
- GPS location (if available)
- Fuel and water levels
- Maintenance status

### Location Data Structure
```javascript
{
    currentStatus: {
        location: {
            latitude: -33.8126,
            longitude: 151.2738,
            address: "Fergusons Marina, Manly",
            captured: true,
            lastModified: "2025-09-25T10:30:00Z"
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Missing Vessels on Map**
   - Check if vessel name matches exactly in `fixedLocations`
   - Verify vessel is returned by API
   - Check browser console for errors

2. **Incorrect Locations**
   - Verify GPS coordinates are valid
   - Check timezone handling for lastModified timestamps
   - Ensure fixed locations are accurate

3. **Map Not Loading**
   - Verify Google Maps API key is valid
   - Check for RefererNotAllowedMapError
   - Ensure initFleetMap callback is properly configured

### Debugging Tips

```javascript
// Log vessel location resolution
console.log(`Vessel ${vessel.name}: GPS=${!!vessel.currentStatus?.location?.latitude}, Fixed=${!!fixedLocations[vessel.name]}`);

// Check marker creation
console.log(`Created ${fleetMarkers.length} markers`);
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live location updates
2. **Route History**: Display vessel movement paths
3. **Geofencing**: Alerts when vessels leave designated areas
4. **Weather Overlay**: Show weather conditions on map
5. **Customer Tracking**: Show active booking locations

## Related Documentation
- `/docs/02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md`
- `/docs/04-technical/VESSEL_STATUS_API.md`
- `/docs/03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md`
