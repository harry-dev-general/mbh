# Vessel Location Tracking Troubleshooting Guide

**Last Updated**: September 11, 2025  
**Version**: 1.0

## Common Issues and Solutions

### Location Capture Issues

#### "Location access denied. Please enable location services."

**Symptoms**: 
- Error appears when clicking "Capture Current Location"
- Browser shows blocked location icon

**Solutions**:

1. **Browser Settings (Desktop)**
   - Chrome: Settings → Privacy and security → Site Settings → Location
   - Firefox: Settings → Privacy & Security → Permissions → Location
   - Safari: Preferences → Websites → Location
   - Edge: Settings → Site permissions → Location

2. **Mobile Device Settings**
   - iOS: Settings → Privacy & Security → Location Services → Safari
   - Android: Settings → Location → App permissions → Browser

3. **Site-Specific Permissions**
   ```javascript
   // Clear and re-request permission
   navigator.permissions.revoke({ name: 'geolocation' })
     .then(() => {
       // User will be prompted again
       captureVesselLocation();
     });
   ```

#### "Location request timed out"

**Causes**:
- Poor GPS signal
- Slow network connection
- Device location services issues

**Solutions**:
1. Move to area with better GPS reception
2. Increase timeout in code:
   ```javascript
   navigator.geolocation.getCurrentPosition(success, error, {
     timeout: 60000 // 60 seconds instead of 30
   });
   ```
3. Use lower accuracy mode:
   ```javascript
   enableHighAccuracy: false // Uses network positioning
   ```

### Map Display Issues

#### Map shows "Unknown" for vessel location

**Diagnosis**:
```javascript
// Check console for vessel data
console.log('Vessel location data:', vessel.currentStatus.location);
```

**Common Causes**:
1. No Post-Departure checklist completed
2. Location not captured in checklist
3. API not returning location fields

**Solutions**:
1. Complete a Post-Departure checklist with location
2. Verify Airtable has location fields
3. Check API response includes location data

#### Timestamp shows "Unknown" for all vessels

**Issue**: Missing or incorrect `lastModified` field

**Solution Applied**:
```javascript
// Fallback chain for timestamps
const timestamp = location?.lastModified || 
                 vessel.lastCheck?.time || 
                 'Unknown';
```

**Verification**:
- Check browser console for "Last modified time" logs
- Verify Airtable field exists and is populated
- Ensure API includes field in response

### Manual Location Update Issues

#### "No checklist found for this vessel"

**Causes**:
1. No checklists exist within 90-day window
2. Vessel ID mismatch
3. Airtable filtering issue

**Debug Steps**:
```javascript
// Add to update-location endpoint
console.log('Searching for vessel:', vesselId);
console.log('Records found:', records.length);
console.log('Filtered records:', filtered.length);
```

**Solutions**:
1. Create a new checklist for the vessel
2. Verify vessel ID matches Airtable
3. Check date range in query

#### Update button not working

**Symptoms**:
- Click does nothing
- Modal doesn't open
- Console errors

**Common Fixes**:
1. Check for JavaScript errors:
   ```javascript
   // Look for undefined variables
   console.error('vesselId:', vesselId);
   console.error('coords:', currentLat, currentLng);
   ```

2. Verify Google Maps loaded:
   ```javascript
   if (typeof google === 'undefined') {
     console.error('Google Maps not loaded');
   }
   ```

3. Check function binding:
   ```javascript
   // Ensure function is globally accessible
   window.updateVesselLocation = updateVesselLocation;
   ```

### Airtable Integration Issues

#### 422 Error: "Invalid field type"

**Error Message**:
```
INVALID_VALUE_FOR_COLUMN: Field "GPS Latitude" can only accept number values
```

**Fix**:
```javascript
// Ensure numbers are properly typed
const updateData = {
  fields: {
    'GPS Latitude': Number(latitude),  // Not string!
    'GPS Longitude': Number(longitude),
    'Location Accuracy': Number(accuracy)
  }
};
```

#### Cannot update linked vessel field

**Issue**: Linked record fields require special handling

**Wrong**:
```javascript
filterByFormula: `{Vessel} = '${vesselId}'`
```

**Correct**:
```javascript
// Fetch recent then filter in JavaScript
const vesselRecords = records.filter(r => 
  r.fields['Vessel']?.includes(vesselId)
);
```

### Performance Issues

#### Maps loading slowly

**Optimizations**:
1. Lazy load Google Maps:
   ```javascript
   // Only load when needed
   if (document.getElementById('map')) {
     loadGoogleMapsAPI();
   }
   ```

2. Reduce marker complexity:
   ```javascript
   // Use simple markers for many vessels
   icon: {
     path: google.maps.SymbolPath.CIRCLE,
     scale: 8
   }
   ```

3. Limit vessel data fields:
   ```javascript
   fields: ['Name', 'GPS Latitude', 'GPS Longitude', 'Location Address']
   ```

#### API timeouts

**Solutions**:
1. Implement retry logic:
   ```javascript
   async function fetchWithRetry(url, options, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fetch(url, options);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

2. Cache vessel data:
   ```javascript
   const CACHE_KEY = 'vessel_data';
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   function getCachedData() {
     const cached = localStorage.getItem(CACHE_KEY);
     if (cached) {
       const { data, timestamp } = JSON.parse(cached);
       if (Date.now() - timestamp < CACHE_TTL) {
         return data;
       }
     }
     return null;
   }
   ```

### Mobile-Specific Issues

#### Location capture not working on iOS

**Common Causes**:
1. iOS requires HTTPS
2. Safari location permissions
3. iOS battery saving mode

**Solutions**:
1. Ensure site uses HTTPS
2. Check Safari settings:
   - Settings → Safari → Location → Allow
3. Add iOS-specific handling:
   ```javascript
   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
   if (isIOS) {
     // Show iOS-specific instructions
     showIOSLocationInstructions();
   }
   ```

#### Map controls too small on mobile

**Fix with CSS**:
```css
@media (max-width: 768px) {
  .gm-control-container {
    transform: scale(1.2);
  }
  
  .vessel-location-map-btn,
  .update-location-btn {
    padding: 12px 20px;
    font-size: 16px;
  }
}
```

## Debugging Tools

### Browser Console Commands

```javascript
// Check vessel data
vessels = await (await fetch('/api/vessels/maintenance-status')).json();
console.table(vessels.vessels);

// Test location capture
navigator.geolocation.getCurrentPosition(
  pos => console.log('Location:', pos.coords),
  err => console.error('Error:', err)
);

// Check Airtable fields
console.log('Location fields:', Object.keys(vesselData[0].currentStatus.location));
```

### Network Debugging

1. **Check API calls**: Browser DevTools → Network tab
2. **Verify responses**: Look for location data in JSON
3. **Monitor errors**: Filter by status codes 4xx/5xx

### Airtable Debugging

1. **API Request History**: Airtable → Account → API request history
2. **Field Verification**: Check exact field names and types
3. **Test Queries**: Use Airtable API playground

## Error Recovery Strategies

### Graceful Degradation

```javascript
// Always show vessel even without location
function displayVessel(vessel) {
  const location = vessel.currentStatus?.location;
  
  if (location) {
    addMapMarker(vessel);
  } else {
    showVesselWithoutLocation(vessel);
  }
}
```

### User Feedback

```javascript
// Clear error messages
function showUserError(error) {
  const messages = {
    'PERMISSION_DENIED': 'Please enable location access in your browser settings',
    'NETWORK_ERROR': 'Check your internet connection and try again',
    'NO_CHECKLIST': 'Complete a vessel checklist first',
    'UPDATE_FAILED': 'Location update failed. Please try again'
  };
  
  const message = messages[error.code] || 'An error occurred. Please try again.';
  showNotification(message, 'error');
}
```

## Prevention Best Practices

1. **Always validate inputs**
   ```javascript
   if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
     throw new Error('Invalid coordinates');
   }
   ```

2. **Check feature availability**
   ```javascript
   if (!('geolocation' in navigator)) {
     showAlternativeLocationInput();
     return;
   }
   ```

3. **Handle missing data**
   ```javascript
   const safeAccess = (obj, path, defaultValue = null) => {
     return path.split('.').reduce((acc, part) => 
       acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
   };
   
   const location = safeAccess(vessel, 'currentStatus.location', {});
   ```

## Getting Help

### Logs to Provide

When reporting issues, include:
1. Browser console errors
2. Network request/response
3. Vessel ID and checklist ID
4. Browser and device info
5. Steps to reproduce

### Quick Checks

- [ ] HTTPS enabled?
- [ ] Location permissions granted?
- [ ] Recent checklist exists?
- [ ] API returning data?
- [ ] Google Maps API key valid?
- [ ] Airtable fields correct?

## Related Documentation

- [Location Tracking Implementation](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)
- [Airtable Integration Guide](../03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md)
- [Common Issues](./common-issues.md)
