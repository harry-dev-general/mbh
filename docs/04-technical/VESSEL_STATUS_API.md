# Vessel Status API Documentation

**Last Updated**: September 11, 2025  
**Version**: 1.0

## Endpoint Overview

The vessel status API provides comprehensive vessel maintenance data including current resource levels, condition status, and location information from the most recent checklists.

### Endpoint
```
GET /api/vessels/maintenance-status
```

### Authentication
- Requires valid session (handled by middleware)
- No additional authentication headers needed

## Response Structure

### Successful Response (200)
```json
{
  "vessels": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "name": "Vessel Name",
      "type": "12 Person BBQ Boat",
      "currentStatus": {
        "fuel": {
          "level": "Three-Quarter",
          "percentage": 75,
          "status": "good"
        },
        "gas": {
          "level": "Half",
          "percentage": 50,
          "status": "warning"
        },
        "water": {
          "level": "Full",
          "percentage": 100,
          "status": "good"
        },
        "condition": "Good - Ready for Next Booking",
        "staffMember": "John Smith",
        "location": {
          "latitude": -33.8596,
          "longitude": 151.2069,
          "address": "Manly Wharf, NSW 2095",
          "accuracy": 15,
          "captured": true,
          "lastModified": "2025-09-10T08:30:00.000Z"
        }
      },
      "lastCheck": {
        "type": "Post-Departure",
        "time": "2025-09-10T06:00:00.000Z",
        "checklistId": "recYYYYYYYYYYYYYY"
      }
    }
  ]
}
```

### Error Response (500)
```json
{
  "error": "Failed to fetch vessel maintenance status",
  "details": "Error message"
}
```

## Data Sources

The API aggregates data from multiple Airtable tables:

1. **Boats Table** (`tblNLoBNb4daWzjob`)
   - Basic vessel information
   - Vessel type and capacity

2. **Pre-Departure Checklist** (`tbl9igu5g1bPG4Ahu`)
   - Initial resource levels
   - Safety check status

3. **Post-Departure Checklist** (`tblYkbSQGP6zveYNi`)
   - Final resource levels
   - Vessel condition
   - Location data

## Implementation Logic

### 1. Data Fetching
```javascript
// Parallel fetch for better performance
const [boatsData, preDepData, postDepData] = await Promise.all([
  fetchBoats(),
  fetchChecklists('pre-departure'),
  fetchChecklists('post-departure')
]);
```

### 2. Status Determination
The API uses intelligent fallback logic:

```javascript
if (latestPreDep && latestPostDep) {
  // Both exist - use post-departure with pre-departure fuel reference
  currentStatus = mergeStatuses(latestPreDep, latestPostDep);
} else if (latestPreDep && !latestPostDep) {
  // Only pre-departure - show initial state
  currentStatus = extractPreDepartureStatus(latestPreDep);
} else if (latestPostDep) {
  // Only post-departure - show final state
  currentStatus = extractPostDepartureStatus(latestPostDep);
}
```

### 3. Location Data Processing
```javascript
// Extract location if captured
if (checklist.fields['Location Captured']) {
  location = {
    latitude: checklist.fields['GPS Latitude'],
    longitude: checklist.fields['GPS Longitude'],
    address: checklist.fields['Location Address'],
    accuracy: checklist.fields['Location Accuracy'],
    captured: true,
    lastModified: checklist.fields['Last modified time'] || 
                  checklist.fields['Created time']
  };
}
```

### 4. Resource Level Mapping
```javascript
const levelToPercentage = {
  'Empty': 0,
  'Quarter': 25,
  'Half': 50,
  'Three-Quarter': 75,
  'Full': 100
};

const getStatus = (percentage) => {
  if (percentage >= 50) return 'good';
  if (percentage >= 25) return 'warning';
  return 'critical';
};
```

## Performance Optimizations

### 1. Field Selection
Only requested fields are fetched to minimize payload:
```javascript
const fields = [
  'Name', 'Boat Type', 'Home Location',
  'Fuel Level Check', 'Fuel Level After Use',
  'GPS Latitude', 'GPS Longitude', 'Location Address',
  'Last modified time', 'Created time'
  // ... other essential fields
];
```

### 2. Date Filtering
Limits checklist queries to recent records:
```javascript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

filterByFormula: `IS_AFTER({Created time}, '${thirtyDaysAgo.toISOString()}')`
```

### 3. Caching Strategy
- Checklist data cached for 5 minutes
- Boat data cached for 30 minutes
- Cache invalidated on vessel updates

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot read property 'fields' of undefined` | Missing checklist data | Add null checks, return empty status |
| `Invalid date value` | Malformed timestamp | Use fallback to Created time |
| `Rate limit exceeded` | Too many API calls | Implement request queuing |
| `Field not found` | Airtable schema change | Update field mappings |

### Graceful Degradation
```javascript
// Always return vessel data, even with partial status
if (!vessel.currentStatus) {
  vessel.currentStatus = {
    fuel: { level: 'Unknown', percentage: 0, status: 'unknown' },
    gas: { level: 'Unknown', percentage: 0, status: 'unknown' },
    water: { level: 'Unknown', percentage: 0, status: 'unknown' },
    condition: 'No checklist data',
    location: null
  };
}
```

## Usage Examples

### Frontend Integration
```javascript
// Fetch vessel status
async function loadVesselData() {
  try {
    const response = await fetch('/api/vessels/maintenance-status');
    const data = await response.json();
    
    data.vessels.forEach(vessel => {
      if (vessel.currentStatus.location) {
        displayVesselOnMap(vessel);
      }
    });
  } catch (error) {
    console.error('Failed to load vessel data:', error);
  }
}
```

### Location Display
```javascript
// Display location with fallback
const location = vessel.currentStatus.location;
const lastUpdate = location?.lastModified || vessel.lastCheck?.time;

const displayLocation = location ? 
  `${location.address} (±${location.accuracy}m)` : 
  'Location not available';

const displayTime = lastUpdate ? 
  new Date(lastUpdate).toLocaleString('en-AU') : 
  'Unknown';
```

## Security Considerations

1. **API Key Protection**: Never expose Airtable API key to frontend
2. **Data Sanitization**: All user inputs sanitized before queries
3. **Rate Limiting**: Implement per-user rate limits
4. **Access Control**: Verify user permissions for vessel data

## Monitoring and Logging

### Key Metrics to Track
- API response times
- Cache hit rates
- Airtable API quota usage
- Error rates by type

### Logging Strategy
```javascript
console.log(`[Vessel Status API] Processing ${boats.length} vessels`);
console.log(`[Vessel Status API] Found ${checklistCount} recent checklists`);
console.error(`[Vessel Status API] Error fetching boat ${boatId}:`, error);
```

## Future Enhancements

1. **WebSocket Support**: Real-time location updates
2. **Batch Operations**: Update multiple vessels in one call
3. **Historical Data**: Endpoint for location history
4. **Predictive Maintenance**: Alert when resources likely low
5. **GraphQL Interface**: More flexible data queries

## Related Documentation

- [Airtable Integration Guide](../03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md)
- [Frontend Implementation](./LOCATION_TRACKING_FRONTEND.md)
- [Management Dashboard](../02-features/management-dashboard/VESSEL_MAINTENANCE_TAB.md)
