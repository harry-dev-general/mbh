# Technical Reference: Airtable API Integration

## Overview
This document provides technical reference for Airtable API integration patterns used throughout the MBH Staff Portal.

## Base Configuration

### Constants
```javascript
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patYiJdXfvcSenMU4.xxx';
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';

// Table IDs
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';      // Bookings Dashboard
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';     // Employee Details  
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';         // Boats
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';        // Roster
const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq'; // Announcements
```

## API Request Patterns

### 1. Basic GET Request (Client-Side)
```javascript
async function fetchRecords(tableId, filterFormula = '') {
    let url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?pageSize=100`;
    
    if (filterFormula) {
        url += `&filterByFormula=${encodeURIComponent(filterFormula)}`;
    }
    
    // Cache busting
    url += `&_t=${Date.now()}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.records || [];
}
```

### 2. Server-Side with Axios
```javascript
const axios = require('axios');

async function getRecords(tableId, filter) {
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
            {
                params: {
                    filterByFormula: filter,
                    pageSize: 100
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        return response.data.records;
    } catch (error) {
        console.error('Airtable error:', error.response?.data || error.message);
        throw error;
    }
}
```

### 3. CREATE Record
```javascript
async function createRecord(tableId, fields) {
    const response = await axios.post(
        `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
        {
            fields: fields
        },
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data;
}
```

### 4. UPDATE Record (PATCH)
```javascript
async function updateRecord(tableId, recordId, fields) {
    const response = await axios.patch(
        `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`,
        {
            fields: fields
        },
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data;
}
```

### 5. DELETE Record
```javascript
async function deleteRecord(tableId, recordId) {
    await axios.delete(
        `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`,
        {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        }
    );
}
```

## Common Filter Formulas

### Date Filtering
```javascript
// Records for specific date
`{Booking Date}='2025-09-08'`

// Records after date
`IS_AFTER({Booking Date}, '2025-09-08')`

// Records between dates
`AND(IS_AFTER({Booking Date}, '2025-09-07'), IS_BEFORE({Booking Date}, '2025-09-15'))`

// Records with optional date field
`OR(NOT({Expiry Date}), {Expiry Date} >= '${today}')`
```

### Status Filtering
```javascript
// Single status
`{Status}='PAID'`

// Multiple statuses
`OR({Status}='PAID', {Status}='PART')`

// Checkbox fields
`{Active Roster}=1`  // Checked
`{Active Roster}=0`  // Unchecked
```

### Linked Record Filtering
```javascript
// Note: Direct filtering on linked records is limited
// Better to fetch all and filter client-side

// Check if linked field has any value
`{Onboarding Employee}!=''`

// Cannot directly filter by linked record ID in filterByFormula
// Use client-side filtering instead:
records.filter(r => r.fields['Employee']?.includes(employeeId))
```

## Error Handling

### Comprehensive Error Response
```javascript
try {
    const response = await axios.get(url, config);
    return {
        success: true,
        data: response.data
    };
} catch (error) {
    // Log detailed error for debugging
    console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
    });
    
    // Return user-friendly error
    return {
        success: false,
        error: error.response?.data?.error?.message || 'An error occurred'
    };
}
```

### Common Error Codes
- **401**: Invalid API key
- **404**: Table or record not found
- **422**: Invalid field data (wrong type, missing required field)
- **429**: Rate limit exceeded
- **500**: Server error

## Field Type Handling

### Linked Records
```javascript
// Always use arrays for linked records
updateFields['Onboarding Employee'] = [employeeRecordId];

// Even for single links
updateFields['Boat'] = [boatRecordId];

// Check if linked field has value
if (record.fields['Employee'] && record.fields['Employee'].length > 0) {
    const employeeId = record.fields['Employee'][0];
}
```

### Date Fields
```javascript
// Airtable expects YYYY-MM-DD format
const dateString = date.toISOString().split('T')[0];
fields['Booking Date'] = dateString;

// Optional date fields - only include if value exists
if (expiryDate) {
    fields['Expiry Date'] = expiryDate;
}
```

### Select Fields
```javascript
// Single select - use exact option name
fields['Priority'] = 'High';  // Must match Airtable option exactly

// Multiple select - use array
fields['Tags'] = ['Urgent', 'VIP'];
```

## Performance Optimization

### 1. Specify Fields
```javascript
// Only request needed fields
`${url}&fields[]=Customer Name&fields[]=Booking Date&fields[]=Status`
```

### 2. Pagination
```javascript
async function getAllRecords(tableId) {
    let allRecords = [];
    let offset = null;
    
    do {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?pageSize=100` +
                    (offset ? `&offset=${offset}` : '');
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        allRecords = allRecords.concat(data.records);
        offset = data.offset;
    } while (offset);
    
    return allRecords;
}
```

### 3. Client-Side Filtering
When Airtable's filterByFormula is insufficient:
```javascript
// Fetch broader dataset
const allBookings = await fetchRecords(BOOKINGS_TABLE_ID, `{Status}='PAID'`);

// Filter client-side for complex logic
const filteredBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.fields['Booking Date']);
    const hasStaff = booking.fields['Onboarding Employee']?.length > 0;
    const isInDateRange = bookingDate >= startDate && bookingDate <= endDate;
    
    return isInDateRange && hasStaff;
});
```

## Rate Limiting

### Basic Retry Logic
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429) {
                // Rate limited - wait and retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
        }
    }
}
```

## Security Considerations

### 1. API Key Protection
- Never commit API keys to repository
- Use environment variables
- Consider proxy endpoints for client-side requests

### 2. Input Validation
```javascript
// Sanitize user input before using in filters
function sanitizeForAirtable(input) {
    // Escape single quotes
    return input.replace(/'/g, "\\'");
}

const safeEmail = sanitizeForAirtable(userEmail);
const filter = `{Email}='${safeEmail}'`;
```

### 3. Permission Checks
Always verify user permissions server-side before allowing Airtable operations.

---

## Quick Reference

### Common Patterns
```javascript
// Check if field exists and has value
if (record.fields['FieldName']?.length > 0) { }

// Safe field access with default
const value = record.fields['FieldName'] || 'Default';

// Format time from Airtable
const time = record.fields['Start Time']; // "09:00 am" or "09:00"

// Check linked record
const hasEmployee = record.fields['Employee']?.[0];

// Multiple conditions
const filter = `AND({Status}='PAID', {Date}='2025-09-08')`;
```

---

*Last updated: September 9, 2025*
