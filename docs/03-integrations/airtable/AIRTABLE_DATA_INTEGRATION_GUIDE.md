# Airtable Data Integration Guide for MBH Staff Portal

## Overview
This guide documents the Airtable integration patterns, data structures, and technical considerations for the MBH Staff Portal's booking management system. Created after successfully debugging booking display issues on January 26, 2025.

## Table of Contents
1. [Airtable Base Structure](#airtable-base-structure)
2. [Critical Tables and Fields](#critical-tables-and-fields)
3. [Data Flow and Integration](#data-flow-and-integration)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Technical Considerations](#technical-considerations)
6. [Best Practices](#best-practices)

---

## Airtable Base Structure

### Primary Base: MBH Bookings Operation
- **Base ID**: `applkAFOn2qxtu7tx`
- **Purpose**: Contains all booking, staff, roster, and allocation data
- **Environment**: Production

### Key Tables
| Table Name | Table ID | Purpose |
|------------|----------|---------|
| Bookings Dashboard | `tblRe0cDmK3bG2kPf` | Customer booking records |
| Employee Details | `tbltAE4NlNePvnkpY` | Staff information |
| Shift Allocations | `tbl22YKtQXZtDFtEX` | Staff-to-booking allocations |
| Roster | `tblwwK1jWGxnfuzAN` | Weekly staff availability |

---

## Critical Tables and Fields

### Bookings Dashboard Table (`tblRe0cDmK3bG2kPf`)

#### Core Fields
```javascript
{
  'Customer Name': 'string',        // e.g., "Raoa Zaoud"
  'Customer Email': 'email',        // e.g., "rawa_z@hotmail.com"
  'Booking Code': 'string',         // e.g., "AAZQ-110825"
  'Booking Date': 'date',           // Format: "2025-08-31"
  'Start Time': 'string',           // Format: "09:00 am" or "09:00"
  'Finish Time': 'string',          // Format: "01:00 pm" or "13:00"
  'Status': 'string',               // Values: "PAID", "Confirmed", "Pending"
  'Total Amount': 'currency',       // e.g., 550
  'Duration': 'string'              // Format: "6:00" or "4 hours 0 minutes"
}
```

#### Computed Fields (Formula)
```javascript
{
  'Onboarding Time': 'formula',     // Start Time - 30 minutes
  'Deloading Time': 'formula'       // Finish Time - 30 minutes
}
```

#### Linked Fields (Important!)
```javascript
{
  'Onboarding Employee': 'multipleRecordLinks[]',  // Links to Employee Details
  'Deloading Employee': 'multipleRecordLinks[]',   // Links to Employee Details
  'Shift Allocations': 'multipleRecordLinks[]'     // Links to Shift Allocations
}
```

#### Status Fields
```javascript
{
  'Onboarding Status': 'singleSelect',  // "Unassigned", "Assigned", "Confirmed", "Completed"
  'Deloading Status': 'singleSelect',   // Same options as above
  'Full Booking Status': 'formula'      // "✅ Fully Staffed", "⚠️ Partially Staffed", "❌ Unstaffed"
}
```

### Employee Details Table (`tbltAE4NlNePvnkpY`)
```javascript
{
  'Name': 'string',                // Staff member name
  'Email': 'email',               
  'Phone': 'phone',
  'Role': 'singleSelect',         // Staff role/position
  'Status': 'singleSelect'        // Active/Inactive
}
```

### Shift Allocations Table (`tbl22YKtQXZtDFtEX`)
```javascript
{
  'Employee': 'multipleRecordLinks[]',   // Link to Employee Details
  'Booking': 'multipleRecordLinks[]',    // Link to Bookings Dashboard
  'Shift Date': 'date',
  'Start Time': 'string',
  'End Time': 'string',
  'Shift Type': 'string',                // "Onboarding" or "Deloading"
  'Role': 'string'
}
```

---

## Data Flow and Integration

### 1. Fetching Bookings
```javascript
// CRITICAL: Use client-side filtering for reliability
const response = await fetch(
  `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}?` +
  `filterByFormula=${encodeURIComponent("{Status}='PAID'")}&` +
  `pageSize=100&` +  // Important: Default is 20, may miss records!
  `_t=${Date.now()}`, // Cache busting
  {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  }
);

// Then filter client-side for date range
const bookingsForWeek = allBookings.filter(record => {
  const bookingDate = record.fields['Booking Date'];
  const date = new Date(bookingDate + 'T00:00:00'); // Timezone fix
  return date >= weekStart && date <= weekEnd;
});
```

### 2. Understanding Time Formats

**CRITICAL DISCOVERY**: Airtable returns time in various formats!

```javascript
// Airtable may return any of these:
"09:00 am"    // 12-hour with lowercase am/pm
"9:00 AM"     // 12-hour with uppercase AM/PM
"09:00"       // 24-hour format
"1:00 pm"     // 12-hour without leading zero

// Solution: Robust time parser
function parseTime(timeStr) {
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    // Handle 12-hour format
    const cleaned = timeStr.replace(/\s/g, '').toLowerCase();
    let hour = parseInt(cleaned.match(/(\d{1,2}):/)[1]);
    
    if (cleaned.includes('pm') && hour !== 12) {
      hour += 12;
    } else if (cleaned.includes('am') && hour === 12) {
      hour = 0;
    }
    return hour;
  } else {
    // Handle 24-hour format
    return parseInt(timeStr.split(':')[0]);
  }
}
```

### 3. Date Handling

**CRITICAL**: Always use string comparison for dates to avoid timezone issues

```javascript
// DON'T DO THIS - Timezone issues!
const date = new Date(bookingDate);
return date >= currentWeekStart && date <= weekEnd;

// DO THIS - String comparison
const dateStr = formatLocalDate(new Date(bookingDate + 'T00:00:00'));
const weekStartStr = formatLocalDate(currentWeekStart);
const weekEndStr = formatLocalDate(weekEnd);
return dateStr >= weekStartStr && dateStr <= weekEndStr;

// Helper function
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 4. Updating Linked Records

**CRITICAL**: Linked records must be arrays of record IDs

```javascript
// Updating employee assignment
const updateData = {
  fields: {
    'Onboarding Employee': [employeeRecordId], // Must be array!
    'Onboarding Status': 'Assigned'
  }
};

// PATCH to update existing booking
await fetch(
  `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  }
);
```

---

## Common Issues and Solutions

### Issue 1: Bookings Not Showing
**Symptoms**: Console shows bookings exist but 0 for current week

**Common Causes**:
1. **Hardcoded dates** - System using fixed date instead of current date
2. **Timezone issues** - Date parsing creates day offset
3. **Time format mismatch** - "09:00 am" vs "09:00"
4. **Status filtering** - Only showing PAID but booking has different status

**Solution**: Use robust date/time parsing and client-side filtering

### Issue 2: CORS Errors
**Error**: "Request header field cache-control is not allowed"

**Solution**: Remove `Cache-Control` header, use URL parameter for cache busting
```javascript
// Wrong
headers: { 'Cache-Control': 'no-cache' }

// Right
`${url}?_t=${Date.now()}`
```

### Issue 3: Formula Fields
**Error**: "Field 'Onboarding Time' cannot accept a value because the field is computed"

**Solution**: Never try to write to formula fields. They're read-only!

### Issue 4: Duplicate Allocations
**Cause**: Creating new allocation instead of updating booking

**Solution**: 
1. First PATCH the booking to update employee assignment
2. Then POST new allocation record for tracking

---

## Technical Considerations

### 1. API Rate Limits
- Airtable has rate limits (5 requests/second)
- Implement retry logic with exponential backoff
- Use batch operations where possible

### 2. Pagination
- Default page size is 20 records
- Always specify `pageSize=100` for complete data
- Handle multiple pages if needed

### 3. Field Name Case Sensitivity
- Field names are **case-sensitive**
- `Status` ≠ `status`
- Always verify exact field names via API

### 4. Linked Records
- Always returned as arrays, even for single links
- Empty links may be `undefined` or `[]`
- Check both conditions

### 5. Date Storage
- Dates stored as "YYYY-MM-DD" strings
- No timezone information
- Always parse with explicit timezone handling

---

## Best Practices

### 1. Always Use Debug Logging
```javascript
if (record.fields['Customer Name']?.includes('Raoa')) {
  console.log('Debug specific booking:', {
    date: record.fields['Booking Date'],
    status: record.fields['Status'],
    times: {
      start: record.fields['Start Time'],
      finish: record.fields['Finish Time'],
      onboarding: record.fields['Onboarding Time'],
      deloading: record.fields['Deloading Time']
    }
  });
}
```

### 2. Verify Data with MCP Tools
```bash
# Use Airtable MCP to verify table structure
mcp_airtable_describe_table(
  baseId: "applkAFOn2qxtu7tx",
  tableId: "tblRe0cDmK3bG2kPf",
  detailLevel: "full"
)

# Search for specific records
mcp_airtable_search_records(
  baseId: "applkAFOn2qxtu7tx",
  tableId: "tblRe0cDmK3bG2kPf",
  searchTerm: "Raoa Zaoud"
)
```

### 3. Handle All Data Formats
- Don't assume consistent formatting
- Support multiple date/time formats
- Gracefully handle missing/null fields

### 4. Client-Side Filtering
- More reliable than complex `filterByFormula`
- Easier to debug
- Avoids Airtable formula syntax issues

### 5. Document Table IDs
Never hardcode table IDs without documentation:
```javascript
// Always document the table name with the ID
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY'; // Employee Details
```

---

## Testing Checklist

When debugging booking display issues:

- [ ] Check current date is not hardcoded
- [ ] Verify table IDs are correct
- [ ] Confirm field names are exact (case-sensitive)
- [ ] Test with different time formats
- [ ] Check timezone handling
- [ ] Verify status filtering
- [ ] Ensure pageSize is adequate
- [ ] Test with debug logging enabled
- [ ] Verify linked records are arrays
- [ ] Check formula fields aren't being written to

---

## Example: Complete Booking Fetch
```javascript
async function loadBookings() {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  console.log('Loading bookings for week:', 
    formatLocalDate(currentWeekStart), 'to', formatLocalDate(weekEnd));
  
  // Fetch with proper parameters
  const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}?` +
    `filterByFormula=${encodeURIComponent("OR({Status}='PAID', {Status}='Confirmed')")}&` +
    `pageSize=100&` +
    `_t=${Date.now()}`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    }
  );
  
  const data = await response.json();
  const allBookings = data.records || [];
  
  // Filter client-side for reliability
  const weekBookings = allBookings.filter(record => {
    const bookingDate = record.fields['Booking Date'];
    const status = record.fields['Status'];
    
    if (status !== 'PAID') return false;
    if (!bookingDate) return false;
    
    const dateStr = formatLocalDate(new Date(bookingDate + 'T00:00:00'));
    const weekStartStr = formatLocalDate(currentWeekStart);
    const weekEndStr = formatLocalDate(weekEnd);
    
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
  });
  
  console.log(`Found ${allBookings.length} total, ${weekBookings.length} for week`);
  return weekBookings;
}
```

---

## Conclusion

The key to successful Airtable integration is:
1. **Never trust data formats** - Always handle variations
2. **Use client-side filtering** - More reliable than filterByFormula
3. **Debug with actual data** - Use MCP tools to verify
4. **Document everything** - Table IDs, field names, formats
5. **Test edge cases** - Different times, dates, statuses

This guide reflects real-world debugging experience from the MBH Staff Portal project.
