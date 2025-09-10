# Vessel Location Tracking API Update Guide

## Overview
This guide explains how to update the vessel-status.js API to include location data from the Post-Departure Checklists, allowing the Vessel Locations map to display the last known location of each vessel.

## Required API Updates

### 1. Update vessel-status.js

Add location fields to the data fetching:

```javascript
// In getVesselMaintenanceStatus() function

// Update the Post-Departure checklist fields to include location data
const postDepResponse = await axios.get(
    `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
    {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
        params: {
            filterByFormula: `IS_AFTER({Created time}, '${dateFilter}')`,
            fields: [
                'Vessel', 
                'Fuel Level After Use', 
                'Gas Bottle Level After Use', 
                'Water Tank Level After Use', 
                'Overall Vessel Condition After Use', 
                'Created time', 
                'Staff Member', 
                'Checklist ID',
                // Add location fields
                'GPS Latitude',
                'GPS Longitude',
                'Location Address',
                'Location Accuracy',
                'Location Captured'
            ],
            sort: [{ field: 'Created time', direction: 'desc' }]
        }
    }
);
```

### 2. Update the currentStatus object

When building the vessel status, include location data:

```javascript
// When using post-departure checklist data
currentStatus = {
    fuel: latestPostDep.fields['Fuel Level After Use'],
    gas: latestPostDep.fields['Gas Bottle Level After Use'],
    water: latestPostDep.fields['Water Tank Level After Use'],
    condition: latestPostDep.fields['Overall Vessel Condition After Use'],
    // Add location data
    location: {
        latitude: latestPostDep.fields['GPS Latitude'],
        longitude: latestPostDep.fields['GPS Longitude'],
        address: latestPostDep.fields['Location Address'],
        accuracy: latestPostDep.fields['Location Accuracy'],
        captured: latestPostDep.fields['Location Captured'],
        timestamp: latestPostDep.fields['Created time']
    }
};
```

### 3. Update the vessel status return object

Include location in the returned vessel data:

```javascript
return {
    id: boatId,
    name: boatName,
    type: boat.fields['Boat Type'] || 'Unknown Type',
    location: boat.fields['Vessel Location'] || 'Unknown Location',
    currentStatus: currentStatus ? {
        fuel: { /* existing */ },
        gas: { /* existing */ },
        water: { /* existing */ },
        condition: currentStatus.condition,
        // Add location data
        location: currentStatus.location
    } : null,
    lastCheck: {
        type: lastCheckType,
        time: lastCheckTime,
        checklistId: lastChecklistId,
        daysSince: daysSinceCheck,
        // Add who captured the location
        capturedBy: currentStatus?.location?.captured ? 
            (lastCheckType === 'Post-Departure' ? 
                latestPostDep.fields['Staff Member'] : null) : null
    },
    // ... rest of existing fields
};
```

## Vessel Locations Map Updates

### 1. Create new API endpoint

Add to server.js or create api/vessel-locations.js:

```javascript
app.get('/api/vessel-locations', async (req, res) => {
    try {
        // Get vessel maintenance status (includes location data)
        const vesselData = await getVesselMaintenanceStatus();
        
        if (!vesselData.success) {
            return res.status(500).json(vesselData);
        }
        
        // Transform data for map display
        const mapData = vesselData.vessels.map(vessel => ({
            id: vessel.id,
            name: vessel.name,
            type: vessel.type,
            // Home location (from Boats table)
            homeLocation: vessel.location,
            // Last known location (from checklist)
            lastKnownLocation: vessel.currentStatus?.location ? {
                latitude: vessel.currentStatus.location.latitude,
                longitude: vessel.currentStatus.location.longitude,
                address: vessel.currentStatus.location.address,
                accuracy: vessel.currentStatus.location.accuracy,
                timestamp: vessel.currentStatus.location.timestamp,
                capturedBy: vessel.lastCheck.capturedBy
            } : null,
            // Status info
            status: vessel.overallStatus,
            lastCheckType: vessel.lastCheck.type,
            lastCheckTime: vessel.lastCheck.time
        }));
        
        res.json({
            success: true,
            vessels: mapData
        });
        
    } catch (error) {
        console.error('Error fetching vessel locations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

### 2. Update vessel-locations-map.html

Add functionality to display last known locations:

```javascript
// Add to vessel-locations-map.html
async function loadVesselLastKnownLocations() {
    try {
        const response = await fetch('/api/vessel-locations');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to load vessel locations');
            return;
        }
        
        // Add markers for last known locations
        data.vessels.forEach(vessel => {
            if (vessel.lastKnownLocation && 
                vessel.lastKnownLocation.latitude && 
                vessel.lastKnownLocation.longitude) {
                
                // Create a different colored marker for current location
                const currentLocationMarker = new google.maps.Marker({
                    position: {
                        lat: vessel.lastKnownLocation.latitude,
                        lng: vessel.lastKnownLocation.longitude
                    },
                    map: map,
                    title: `${vessel.name} - Current Location`,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: '#FF0000',
                        fillOpacity: 0.9,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2,
                        scale: 10
                    }
                });
                
                // Info window with location details
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="info-window">
                            <h3>${vessel.name} - Current Location</h3>
                            <p><strong>Address:</strong> ${vessel.lastKnownLocation.address}</p>
                            <p><strong>Updated:</strong> ${new Date(vessel.lastKnownLocation.timestamp).toLocaleString()}</p>
                            <p><strong>Reported by:</strong> ${vessel.lastKnownLocation.capturedBy || 'Unknown'}</p>
                            <p><strong>GPS:</strong> ${vessel.lastKnownLocation.latitude.toFixed(6)}, ${vessel.lastKnownLocation.longitude.toFixed(6)}</p>
                            <p><strong>Accuracy:</strong> ±${Math.round(vessel.lastKnownLocation.accuracy)}m</p>
                        </div>
                    `
                });
                
                currentLocationMarker.addListener('click', () => {
                    infoWindow.open(map, currentLocationMarker);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading vessel locations:', error);
    }
}

// Call this function when the map loads
window.onload = function() {
    if (typeof google !== 'undefined' && map) {
        setTimeout(() => {
            showAllLocations();
            loadVesselLastKnownLocations(); // Add this line
        }, 1000);
    }
};
```

## Testing the Implementation

1. **Test Location Capture**:
   - Open Post-Departure Checklist on mobile device
   - Complete a checklist for a vessel
   - Click "Capture Current Location"
   - Verify location is captured with address

2. **Verify Data Storage**:
   - Check Airtable Post-Departure Checklist table
   - Confirm GPS Latitude/Longitude are populated
   - Verify Location Address is saved

3. **Test Map Display**:
   - Open Vessel Locations map
   - Verify current vessel locations appear as red circles
   - Click markers to see location details

## Notes

- Location capture works best on mobile devices with GPS
- Google Maps geocoding requires internet connection
- Coordinates are stored even if geocoding fails
- Consider adding a toggle to show/hide current vs home locations
