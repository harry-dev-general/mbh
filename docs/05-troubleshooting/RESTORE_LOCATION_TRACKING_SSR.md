# Restoring Location Tracking to SSR Checklists

## Overview
This guide shows how to add GPS location tracking to the server-side rendered checklist pages, restoring one of the most critical missing features.

## Implementation Plan

### 1. Update Post-Departure SSR Template

Add this location section to the `renderPostDepartureChecklist` function in `/api/checklist-renderer.js`:

```html
<!-- Add after the Customer Feedback section -->
<div class="checklist-section" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 25px 0;">
    <h3 style="color: #0066cc; margin-bottom: 15px;">
        <i class="fas fa-map-marker-alt"></i> Vessel Location
    </h3>
    <p style="color: #666; margin-bottom: 1rem;">Record where you've moored the vessel</p>
    
    <button type="button" id="captureLocationBtn" onclick="captureLocation()" 
            style="background: #28a745; color: white; border: none; padding: 12px 24px; 
                   border-radius: 6px; font-size: 16px; cursor: pointer;">
        <i class="fas fa-location-arrow"></i> Capture Current Location
    </button>
    
    <div id="locationStatus" style="display: none; margin-top: 1rem; padding: 1rem; 
                                    border-radius: 5px; font-size: 0.9rem;"></div>
    
    <!-- Hidden fields to store location data -->
    <input type="hidden" id="gpsLatitude" name="gpsLatitude">
    <input type="hidden" id="gpsLongitude" name="gpsLongitude">
    <input type="hidden" id="locationAddress" name="locationAddress">
    <input type="hidden" id="locationAccuracy" name="locationAccuracy">
</div>
```

### 2. Add Inline JavaScript for Location Capture

Add this script section to the SSR template:

```javascript
<script>
// Fixed marina locations for specific vessels
const FIXED_LOCATIONS = {
    'Work Boat': {
        latitude: -33.8126,
        longitude: 151.2738,
        address: 'Fergusons Marina',
        accuracy: 10
    },
    'Ice Cream Boat': {
        latitude: -33.8058,
        longitude: 151.2485,
        address: 'Dalbora Marina The Spit, A Arm',
        accuracy: 10
    }
};

// Check if vessel has fixed location on page load
window.addEventListener('DOMContentLoaded', function() {
    const vesselName = '${bookingData['Vessel'] || ''}';
    if (FIXED_LOCATIONS[vesselName]) {
        setFixedLocation(vesselName);
    }
});

function setFixedLocation(vesselName) {
    const location = FIXED_LOCATIONS[vesselName];
    
    // Set hidden fields
    document.getElementById('gpsLatitude').value = location.latitude;
    document.getElementById('gpsLongitude').value = location.longitude;
    document.getElementById('locationAddress').value = location.address;
    document.getElementById('locationAccuracy').value = location.accuracy;
    
    // Hide capture button
    document.getElementById('captureLocationBtn').style.display = 'none';
    
    // Show fixed location status
    const statusDiv = document.getElementById('locationStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.background = '#d4edda';
    statusDiv.style.color = '#155724';
    statusDiv.style.border = '1px solid #c3e6cb';
    statusDiv.innerHTML = 
        '<i class="fas fa-lock"></i> Marina Berth<br>' +
        '<strong>' + location.address + '</strong><br>' +
        '<small>This vessel has a permanent marina berth</small>';
}

async function captureLocation() {
    const btn = document.getElementById('captureLocationBtn');
    const statusDiv = document.getElementById('locationStatus');
    
    try {
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#cfe2ff';
        statusDiv.style.color = '#084298';
        statusDiv.style.border = '1px solid #b6d4fe';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting location access...';
        
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            throw new Error('Location services not supported on this device');
        }
        
        // Get position with high accuracy
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );
        });
        
        // Store coordinates
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        
        document.getElementById('gpsLatitude').value = lat;
        document.getElementById('gpsLongitude').value = lng;
        document.getElementById('locationAccuracy').value = accuracy;
        
        // Try to get address (optional)
        let address = lat.toFixed(6) + ', ' + lng.toFixed(6);
        try {
            const response = await fetch(
                'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + 
                lat + '&lon=' + lng
            );
            const data = await response.json();
            if (data.display_name) {
                address = data.display_name;
            }
        } catch (e) {
            console.log('Could not get address:', e);
        }
        
        document.getElementById('locationAddress').value = address;
        
        // Show success
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.style.border = '1px solid #c3e6cb';
        statusDiv.innerHTML = 
            '<i class="fas fa-check-circle"></i> Location captured successfully!<br>' +
            '<strong>Accuracy:</strong> ±' + accuracy + ' meters<br>' +
            '<small>' + address + '</small>';
        
        // Update button
        btn.innerHTML = '<i class="fas fa-redo"></i> Update Location';
        btn.disabled = false;
        
    } catch (error) {
        console.error('Location error:', error);
        
        // Show error
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        statusDiv.style.border = '1px solid #f5c6cb';
        
        let errorMsg = 'Could not get location: ';
        if (error.code === 1) {
            errorMsg += 'Permission denied. Please allow location access.';
        } else if (error.code === 2) {
            errorMsg += 'Position unavailable. Check your GPS settings.';
        } else if (error.code === 3) {
            errorMsg += 'Request timed out. Please try again.';
        } else {
            errorMsg += error.message;
        }
        
        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + errorMsg;
        
        // Reset button
        btn.innerHTML = '<i class="fas fa-location-arrow"></i> Capture Current Location';
        btn.disabled = false;
    }
}
</script>
```

### 3. Update Form Submission Handler

Modify the inline form submission JavaScript to include location data:

```javascript
// In the handleSubmit function, add location fields to the data object:
data: {
    vessel_cleaned: true,
    equipment_returned: true,
    // ... other fields ...
    gpsLatitude: document.getElementById('gpsLatitude').value || null,
    gpsLongitude: document.getElementById('gpsLongitude').value || null,
    locationAddress: document.getElementById('locationAddress').value || null,
    locationAccuracy: document.getElementById('locationAccuracy').value || null
}
```

### 4. Update Server-Side Field Mapping

In `/api/checklist-renderer.js`, update the `handleChecklistSubmission` function to map location fields:

```javascript
// Post-Departure fields
'GPS Latitude': data.gpsLatitude ? parseFloat(data.gpsLatitude) : null,
'GPS Longitude': data.gpsLongitude ? parseFloat(data.gpsLongitude) : null,
'Location Address': data.locationAddress || null,
'Location Accuracy': data.locationAccuracy ? parseInt(data.locationAccuracy) : null,
'Location Captured': data.gpsLatitude ? new Date().toISOString() : null,
```

### 5. Mobile-Friendly Enhancements

Add these CSS styles for better mobile experience:

```css
@media (max-width: 768px) {
    #captureLocationBtn {
        width: 100%;
        padding: 15px;
        font-size: 18px;
    }
    
    #locationStatus {
        font-size: 14px;
    }
}
```

## Benefits

This implementation:
- ✅ Works without external dependencies
- ✅ Supports both manual GPS capture and fixed locations
- ✅ Provides address lookup via OpenStreetMap
- ✅ Shows accuracy information
- ✅ Handles all error cases gracefully
- ✅ Works on all modern mobile browsers

## Testing

1. Test on actual mobile device (GPS more accurate than desktop)
2. Test permission denied scenario
3. Test fixed location vessels (Work Boat, Ice Cream Boat)
4. Test offline/poor connectivity
5. Verify data saves correctly to Airtable

## Future Enhancements

1. Add mini map preview using Leaflet
2. Allow manual location adjustment
3. Save recent locations for quick selection
4. Add photo capture with location EXIF data
5. Implement offline queue for poor connectivity
