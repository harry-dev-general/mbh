# Airtable Linked Records Filtering Solution

## Problem Summary

When trying to filter Airtable records based on linked record fields (like "Onboarding Employee" or "Deloading Employee"), the standard `filterByFormula` approaches fail because:

1. Linked record fields are stored as arrays in Airtable
2. The API returns these fields as arrays of record IDs
3. Standard formula functions have limitations when dealing with these arrays in the API context

## Failed Approaches

### 1. Direct String Matching
```javascript
filterByFormula=AND({Status}='PAID',{Onboarding Employee}='${employeeRecordId}')
```
**Result**: Failed - Can't use exact match on array fields

### 2. FIND() Function
```javascript
filterByFormula=AND({Status}='PAID',FIND('${employeeRecordId}',{Onboarding Employee}))
```
**Result**: Failed - FIND() doesn't work directly on array fields

### 3. ARRAYJOIN() with FIND()
```javascript
filterByFormula=AND({Status}='PAID',FIND('${employeeRecordId}',ARRAYJOIN({Onboarding Employee})))
```
**Result**: Failed - ARRAYJOIN() is not available in filterByFormula context

### 4. SEARCH() with String Concatenation
```javascript
filterByFormula=AND({Status}='PAID',SEARCH('${employeeRecordId}',{Onboarding Employee}&''))
```
**Result**: Failed - Still returns 0 records

## Implemented Solution: Client-Side Filtering

Instead of trying to filter on the server side using `filterByFormula`, we:

1. Fetch all records that meet the base criteria (e.g., `Status='PAID'`)
2. Filter the results client-side using JavaScript's array methods

### Example Implementation

```javascript
// Fetch ALL PAID bookings
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?` +
    `filterByFormula={Status}='PAID'&pageSize=100`,
    {
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
    }
);

const data = await response.json();

// Filter client-side for specific employee assignments
const assignedBookings = data.records.filter(record => {
    const linkedEmployees = record.fields['Onboarding Employee'] || [];
    return linkedEmployees.includes(employeeRecordId);
});
```

## Benefits of This Approach

1. **Reliability**: Works consistently regardless of Airtable's formula limitations
2. **Flexibility**: Easy to add complex filtering logic
3. **Performance**: For moderate datasets (< 1000 records), client-side filtering is fast
4. **Debugging**: Easier to debug and log what's happening

## Considerations

1. **Data Volume**: This approach fetches more data than needed. Use `pageSize` parameter and consider pagination for large datasets
2. **Performance**: For very large datasets, consider creating a view in Airtable or using a different data structure
3. **Security**: Ensure sensitive data isn't exposed if filtering client-side

## Files Updated

1. `vessel-checklists.html` - Updated `countPendingChecklists()` function
2. `pre-departure-checklist.html` - Updated `loadAssignedBookings()` function  
3. `post-departure-checklist.html` - Updated `loadAssignedBookings()` function

## Alternative Solutions (Not Implemented)

### 1. Formula Field in Airtable
Create a formula field that converts linked records to searchable text:
```
CONCATENATE(ARRAYJOIN({Onboarding Employee}, ","), ",")
```
Then search this field instead.

### 2. Airtable Views
Create filtered views in Airtable for each employee and use view-based filtering.

### 3. Rollup Field
Create a rollup field with ARRAYJOIN in Airtable, then search that field.

### 4. Backend Service
Implement a backend service that handles the filtering logic server-side. 