# Airtable Location Tracking Integration

**Last Updated**: September 11, 2025  
**Version**: 1.0

## Overview

This document details the Airtable-specific implementation for vessel location tracking, including field structures, API patterns, and critical lessons learned about updating linked record fields.

## Table Structure

### Post-Departure Checklist Table (`tblYkbSQGP6zveYNi`)

#### Location Fields Added
| Field Name | Type | Description |
|------------|------|-------------|
| GPS Latitude | Number | Decimal latitude coordinate |
| GPS Longitude | Number | Decimal longitude coordinate |
| Location Address | Long text | Geocoded address string |
| Location Accuracy | Number | GPS accuracy in meters |
| Location Captured | Checkbox | Whether location was captured |
| Last modified time | Last modified time | Auto-tracked modification timestamp |

### Key Relationships
- **Vessel** (Linked Record): Links to Boats table
- **Completed by** (Single line text): Staff member name
- **Staff Member** (Linked Record): Links to Employee Details

## Critical Implementation Details

### 1. Updating Linked Record Fields

**Challenge**: When updating the most recent Post-Departure checklist, we needed to find records where the Vessel field (a linked record array) contained a specific boat ID.

**Failed Approach**:
```javascript
// This DOESN'T work for linked fields
filterByFormula: `{Vessel} = '${vesselId}'`
```

**Working Solution**:
```javascript
// Method 1: Using SEARCH and ARRAYJOIN (limited reliability)
filterByFormula: `SEARCH('${vesselId}', ARRAYJOIN({Vessel}))`

// Method 2: Fetch recent records and filter in JavaScript (recommended)
const recentRecords = await fetchRecords({
  sort: [{ field: 'Created time', direction: 'desc' }],
  maxRecords: 100
});

const vesselRecords = recentRecords.filter(record => 
  record.fields['Vessel'] && record.fields['Vessel'].includes(vesselId)
);
```

### 2. PATCH Request Structure

**Correct Format for Updating Location**:
```javascript
const updateData = {
  fields: {
    'GPS Latitude': Number(latitude),      // Must be Number type
    'GPS Longitude': Number(longitude),    // Must be Number type
    'Location Address': address || '',     // String
    'Location Captured': true,             // Boolean
    'Location Accuracy': Number(accuracy)  // Number
  }
};

await axios.patch(
  `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${recordId}`,
  updateData,
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### 3. Field Type Constraints

**Number Fields**:
- Latitude/Longitude must be proper Number type
- Airtable rejects string representations of numbers
- Always use `Number()` conversion

**Checkbox Fields**:
- Accept only boolean values (true/false)
- Not "Yes"/"No" or 1/0

**Formula/Computed Fields**:
- Cannot be written to (e.g., "Completed by")
- Will cause 422 errors if included in updates

### 4. Finding Most Recent Checklist

**Robust Pattern**:
```javascript
// 1. Fetch recent records sorted by creation
const response = await axios.get(
  `${AIRTABLE_API}/v0/${BASE_ID}/${TABLE_ID}`,
  {
    params: {
      sort: [{ field: 'Created time', direction: 'desc' }],
      maxRecords: 100,
      filterByFormula: `IS_AFTER({Created time}, '${ninetyDaysAgo}')`
    }
  }
);

// 2. Filter for specific vessel in JavaScript
const vesselChecklists = response.data.records.filter(record => {
  const vesselField = record.fields['Vessel'];
  return vesselField && Array.isArray(vesselField) && 
         vesselField.includes(vesselId);
});

// 3. Take the most recent
const mostRecent = vesselChecklists[0];
```

## API Patterns

### Location Update Endpoint Flow

1. **Search for Recent Post-Departure Checklist**
   ```javascript
   // Find within last 90 days
   const cutoffDate = new Date();
   cutoffDate.setDate(cutoffDate.getDate() - 90);
   ```

2. **Fallback to Pre-Departure if Needed**
   ```javascript
   if (!postDepartureFound) {
     // Search Pre-Departure table
     // If found, create minimal Post-Departure with location only
   }
   ```

3. **Update Only Location Fields**
   ```javascript
   // Never update computed fields or unrelated data
   const locationOnlyUpdate = {
     fields: {
       'GPS Latitude': lat,
       'GPS Longitude': lng,
       'Location Address': address,
       'Location Accuracy': accuracy,
       'Location Captured': true
     }
   };
   ```

## Common Pitfalls and Solutions

### Pitfall 1: Formula Syntax in Filters
**Problem**: Complex filterByFormula with linked records  
**Solution**: Fetch more records and filter client-side

### Pitfall 2: Invalid Select Options
**Problem**: Creating records with non-existent select options  
**Solution**: Only include fields with valid predefined values

### Pitfall 3: Timezone Issues
**Problem**: Date filtering affected by timezone  
**Solution**: Use ISO date strings with explicit timezone

### Pitfall 4: Rate Limiting
**Problem**: Too many API calls  
**Solution**: Batch operations, implement retry logic

## Best Practices

1. **Always Validate Field Types**
   ```javascript
   const safeNumber = (val) => {
     const num = Number(val);
     return isNaN(num) ? 0 : num;
   };
   ```

2. **Handle Linked Fields as Arrays**
   ```javascript
   // Even single links are arrays
   const vesselId = record.fields['Vessel']?.[0];
   ```

3. **Use Explicit Field Selection**
   ```javascript
   params: {
     fields: ['GPS Latitude', 'GPS Longitude', 'Location Address', 
              'Vessel', 'Created time', 'Last modified time']
   }
   ```

4. **Implement Retry Logic**
   ```javascript
   async function retryableRequest(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

## Debugging Tips

### Enable Detailed Logging
```javascript
console.log('Searching for vessel:', vesselId);
console.log('Found records:', records.length);
console.log('Filtered to:', filtered.length);
console.log('Update payload:', JSON.stringify(updateData, null, 2));
```

### Check Airtable Logs
- View API request history in Airtable
- Verify field names match exactly (case-sensitive)
- Check for formula field errors

### Common Error Codes
- **404**: Record or table not found
- **422**: Invalid field value or type mismatch
- **403**: Permission denied or invalid API key
- **429**: Rate limit exceeded

## Performance Optimization

1. **Minimize API Calls**
   - Cache vessel data where possible
   - Batch read operations
   - Use field selection to reduce payload

2. **Efficient Filtering**
   - Limit date ranges in queries
   - Use maxRecords parameter
   - Filter in JavaScript for complex conditions

3. **Response Caching**
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   function getCachedOrFetch(key, fetchFn) {
     const cached = cache.get(key);
     if (cached && Date.now() - cached.time < CACHE_TTL) {
       return cached.data;
     }
     const data = await fetchFn();
     cache.set(key, { data, time: Date.now() });
     return data;
   }
   ```

## Related Documentation

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Field Type Reference](https://airtable.com/developers/web/api/field-model)
- [Rate Limits Guide](https://airtable.com/developers/web/api/rate-limits)
