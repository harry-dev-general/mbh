# Location Tracking Frontend Implementation

**Last Updated**: September 11, 2025  
**Version**: 1.0

## Overview

This document details the client-side implementation of vessel location tracking across multiple pages, including geolocation capture, map displays, and UI interactions.

## Core Components

### 1. Location Capture (Post-Departure Checklist)

#### HTML Structure
```html
<div class="location-section">
    <h3><i class="fas fa-map-marker-alt"></i> Vessel Location Tracking</h3>
    <p>Capture the current location of the vessel for tracking purposes.</p>
    
    <button type="button" id="captureLocationBtn" class="btn btn-primary">
        <i class="fas fa-location-crosshairs"></i> Capture Current Location
    </button>
    
    <div id="locationStatus" class="location-status" style="display: none;"></div>
    <div id="locationMapPreview" style="display: none;"></div>
</div>
```

#### JavaScript Implementation
```javascript
async function captureVesselLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const mapDiv = document.getElementById('locationMapPreview');
    const captureBtn = document.getElementById('captureLocationBtn');
    
    // UI feedback
    statusDiv.style.display = 'block';
    statusDiv.className = 'location-status';
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing location...';
    captureBtn.disabled = true;
    
    try {
        // Get current position
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            });
        });
        
        const { latitude, longitude, accuracy } = position.coords;
        
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        const address = await reverseGeocode(geocoder, latitude, longitude);
        
        // Store in window for form submission
        window.vesselLocation = {
            latitude,
            longitude,
            address,
            accuracy: Math.round(accuracy),
            timestamp: new Date().toISOString()
        };
        
        // Show success
        statusDiv.className = 'location-status location-success';
        statusDiv.innerHTML = `
            <i class="fas fa-check-circle"></i> Location captured successfully!
            <br><small>${address}</small>
            <br><small>Accuracy: ±${Math.round(accuracy)}m</small>
        `;
        
        // Display map preview
        displayLocationMap(latitude, longitude, address);
        
    } catch (error) {
        handleLocationError(error);
    } finally {
        captureBtn.disabled = false;
    }
}
```

### 2. Map Display Components

#### Vessel Locations Map
```javascript
class VesselLocationsMap {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.infoWindows = new Map();
        this.polylines = [];
    }
    
    async initialize() {
        // Initialize map centered on Manly
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -33.8007, lng: 151.2848 },
            zoom: 14,
            mapTypeControl: false,
            fullscreenControl: false
        });
        
        // Load vessel data
        await this.loadVessels();
    }
    
    async loadVessels() {
        const response = await fetch('/api/vessels/maintenance-status');
        const data = await response.json();
        
        data.vessels.forEach(vessel => {
            if (vessel.currentStatus.location) {
                this.addVesselMarker(vessel);
            }
        });
        
        this.updateSidebar(data.vessels);
    }
    
    addVesselMarker(vessel) {
        const location = vessel.currentStatus.location;
        const position = { 
            lat: location.latitude, 
            lng: location.longitude 
        };
        
        // Custom marker with vessel icon
        const marker = new google.maps.Marker({
            position,
            map: this.map,
            title: vessel.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#ff0000',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10
            },
            animation: google.maps.Animation.DROP
        });
        
        // Info window with vessel details
        const infoWindow = new google.maps.InfoWindow({
            content: this.createInfoWindowContent(vessel)
        });
        
        marker.addListener('click', () => {
            this.closeAllInfoWindows();
            infoWindow.open(this.map, marker);
        });
        
        this.markers.set(vessel.id, marker);
        this.infoWindows.set(vessel.id, infoWindow);
    }
}
```

#### Mini-Map in Booking Popups
```javascript
function displayVesselLocationMiniMap(vessel, mapId) {
    const location = vessel.currentStatus.location;
    if (!location) return;
    
    const mapOptions = {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: 15,
        disableDefaultUI: true,
        draggable: false,
        scrollwheel: false
    };
    
    const miniMap = new google.maps.Map(
        document.getElementById(mapId), 
        mapOptions
    );
    
    new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: miniMap,
        title: vessel.name
    });
}
```

### 3. Manual Location Update Interface

#### Modal Structure
```html
<div id="locationUpdateModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="updateModalTitle">Update Location</h3>
            <button class="close-btn" onclick="closeLocationUpdateModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div id="updateLocationMap"></div>
            <div id="locationCoordinates"></div>
        </div>
        <div class="modal-footer">
            <button class="cancel-btn" onclick="closeLocationUpdateModal()">
                <i class="fas fa-times"></i> Cancel
            </button>
            <button class="confirm-btn" onclick="confirmLocationUpdate()">
                <i class="fas fa-check"></i> Confirm Location
            </button>
        </div>
    </div>
</div>
```

#### Draggable Marker Implementation
```javascript
function initUpdateLocationMap(vesselId, vesselName, currentLat, currentLng) {
    const map = new google.maps.Map(document.getElementById('updateLocationMap'), {
        center: { lat: currentLat, lng: currentLng },
        zoom: 15,
        mapTypeControl: false
    });
    
    // Draggable marker
    const marker = new google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: map,
        title: vesselName,
        draggable: true,
        animation: google.maps.Animation.DROP
    });
    
    // Update coordinates on drag
    marker.addListener('dragend', () => {
        const position = marker.getPosition();
        updateCoordinatesDisplay(position.lat(), position.lng());
    });
    
    // Store references
    window.updateLocation = {
        vesselId,
        vesselName,
        marker,
        map
    };
}
```

## UI/UX Patterns

### 1. Loading States
```javascript
function showLoading(element, message = 'Loading...') {
    element.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>${message}</span>
        </div>
    `;
}
```

### 2. Error Handling
```javascript
function handleLocationError(error) {
    const statusDiv = document.getElementById('locationStatus');
    let message = 'Unable to capture location';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
    }
    
    statusDiv.className = 'location-status location-error';
    statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}
```

### 3. Success Feedback
```javascript
function showSuccess(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('fade-out');
        setTimeout(() => successDiv.remove(), 300);
    }, duration);
}
```

## CSS Styling

### Location Capture Styles
```css
.location-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.location-status {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

.location-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.location-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

#locationMapPreview {
    height: 300px;
    margin-top: 1rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### Map Container Styles
```css
.vessel-location-map {
    height: 200px;
    width: 100%;
    border-radius: 8px;
    margin-top: 10px;
}

.map-sidebar {
    width: 300px;
    background: white;
    overflow-y: auto;
    box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

.vessel-list-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
}

.vessel-list-item:hover {
    background-color: #f5f5f5;
}
```

## Browser Compatibility

### Geolocation API Support
```javascript
// Feature detection
if (!('geolocation' in navigator)) {
    showError('Geolocation is not supported by your browser');
    return;
}

// HTTPS check
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    showError('Location services require a secure connection (HTTPS)');
    return;
}
```

### Polyfills and Fallbacks
```javascript
// Promise polyfill for older browsers
if (!window.Promise) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"></script>');
}

// Fetch polyfill
if (!window.fetch) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js"></script>');
}
```

## Performance Optimization

### 1. Lazy Loading Maps
```javascript
function loadGoogleMapsAPI() {
    return new Promise((resolve) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
        script.async = true;
        script.defer = true;
        window.initMap = resolve;
        document.head.appendChild(script);
    });
}
```

### 2. Debounced Updates
```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedLocationUpdate = debounce(updateLocationOnServer, 500);
```

### 3. Request Caching
```javascript
const vesselDataCache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutes
};

async function getCachedVesselData() {
    const now = Date.now();
    if (vesselDataCache.data && 
        vesselDataCache.timestamp && 
        now - vesselDataCache.timestamp < vesselDataCache.ttl) {
        return vesselDataCache.data;
    }
    
    const data = await fetchVesselData();
    vesselDataCache.data = data;
    vesselDataCache.timestamp = now;
    return data;
}
```

## Testing Considerations

### Unit Testing Key Functions
```javascript
// Example test for coordinate formatting
describe('formatCoordinates', () => {
    it('should format coordinates to 6 decimal places', () => {
        expect(formatCoordinates(-33.123456789, 151.987654321))
            .toBe('-33.123457, 151.987654');
    });
});
```

### E2E Testing Scenarios
1. Location capture with permission granted
2. Location capture with permission denied
3. Map marker drag and drop
4. Sidebar vessel selection
5. Info window interactions
6. Mobile responsiveness

## Accessibility Features

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **ARIA Labels**: Proper labeling for screen readers
3. **Focus Management**: Logical tab order maintained
4. **Status Announcements**: Location capture status announced to screen readers

## Mobile Optimization

1. **Touch-Friendly Controls**: Larger buttons and touch targets
2. **Responsive Maps**: Adjust zoom and controls for mobile
3. **Permission Prompts**: Clear instructions for enabling location
4. **Performance**: Reduced map detail on mobile devices

## Related Documentation

- [Vessel Location Tracking Implementation](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)
- [Vessel Status API](./VESSEL_STATUS_API.md)
- [Google Maps Best Practices](https://developers.google.com/maps/documentation/javascript/best-practices)
