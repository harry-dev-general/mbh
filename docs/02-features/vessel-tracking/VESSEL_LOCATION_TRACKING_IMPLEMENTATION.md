# Vessel Location Tracking Implementation

**Implementation Date**: September 10-11, 2025  
**Version**: 1.0

## Overview

The vessel location tracking feature allows staff to capture and record the exact GPS location of boats when completing Post-Departure Checklists. This location data is then displayed dynamically across multiple interfaces including the Vessel Locations Map, booking allocation popups, and the management dashboard.

## Feature Components

### 1. Location Capture (Post-Departure Checklist)
- **Browser Geolocation API** captures current GPS coordinates
- **Google Maps Geocoding** converts coordinates to human-readable addresses
- **Visual feedback** during capture process
- **Map preview** shows captured location
- **Accuracy tracking** for location precision

### 2. Dynamic Map Display
- **Real-time vessel locations** from latest checklists
- **Sidebar navigation** with click-to-focus functionality
- **Info windows** showing vessel details and last update time
- **Polyline connections** from home locations to current positions
- **Color-coded markers** for different vessel states

### 3. Booking Integration
- **Mini-maps in allocation popups** on My Schedule page
- **Current location display** with last update timestamp
- **Address information** for easy reference

### 4. Management Dashboard
- **Location cards** for each vessel
- **Manual location update** capability
- **Draggable map interface** for position adjustments
- **Last updated by** tracking from checklist data

## User Workflows

### Staff Completing Post-Departure Checklist
1. Complete standard checklist items
2. Click "Capture Current Location" button
3. Allow browser location access if prompted
4. View captured location on mini-map
5. Submit checklist with location data

### Viewing Vessel Locations
1. Navigate to Vessel Locations Map
2. See all vessels with last known locations
3. Click vessel in sidebar to zoom/focus
4. View detailed info in popup windows

### Manual Location Update (Management)
1. Open Management Dashboard → Vessel Maintenance
2. Click "Update" button on vessel card
3. Drag marker to new location on map
4. Confirm update with green checkmark
5. Location updates most recent checklist record

## Data Flow

```
Location Capture → Airtable Storage → API Retrieval → Frontend Display
       ↓                    ↓                ↓              ↓
  GPS Coordinates    Post-Departure    vessel-status.js   Maps/Cards
  + Geocoding         Checklist          Endpoint       + Mini-maps
```

## Key Features

### Accuracy and Reliability
- High-accuracy GPS mode enabled
- Fallback to network-based location
- Error handling for denied permissions
- Visual confirmation of captured location

### Real-time Updates
- Automatic refresh on page load
- Timestamp tracking with "Last modified time"
- Fallback to creation time if modification not available

### User Experience
- One-click location capture
- Visual feedback during process
- Mobile-optimized interface
- Clear error messages

## Technical Specifications

### Location Data Structure
```javascript
{
  latitude: Number,        // GPS latitude
  longitude: Number,       // GPS longitude
  address: String,         // Geocoded address
  accuracy: Number,        // Meters
  captured: Boolean,       // Success flag
  lastModified: DateTime   // Update timestamp
}
```

### Geolocation Options
```javascript
{
  enableHighAccuracy: true,  // GPS precision
  timeout: 30000,           // 30 second timeout
  maximumAge: 0             // No cached positions
}
```

## Browser Requirements

### Desktop
- Chrome 50+
- Firefox 55+
- Safari 10+
- Edge 12+

### Mobile
- iOS Safari 10+
- Chrome for Android
- Samsung Internet

### Permissions
- HTTPS required for geolocation
- User must grant location permission
- Settings vary by device/browser

## Security Considerations

1. **HTTPS Requirement**: Geolocation API only works over secure connections
2. **Permission Model**: Explicit user consent required
3. **Data Privacy**: Location data stored in secured Airtable base
4. **Access Control**: Only authenticated staff can capture locations

## Troubleshooting

### Common Issues

#### "Location access denied"
- Check browser location settings
- Ensure site has location permission
- Try different browser if persistent

#### "Unknown" timestamp
- Verify "Last modified time" field exists in Airtable
- Check field permissions
- Falls back to "Created time" automatically

#### Location not updating on map
- Verify checklist saved successfully
- Check browser console for errors
- Refresh page to reload data

## Future Enhancements

1. **Offline Support**: Cache locations for poor connectivity
2. **Location History**: Track vessel movement over time
3. **Geofencing**: Alerts when vessels leave designated areas
4. **Route Tracking**: Record entire trip paths
5. **Integration**: Connect with marine traffic APIs

## Related Documentation

- [Airtable Integration Guide](../../03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md)
- [API Endpoint Reference](../../04-technical/VESSEL_STATUS_API.md)
- [Frontend Implementation](../../04-technical/LOCATION_TRACKING_FRONTEND.md)
