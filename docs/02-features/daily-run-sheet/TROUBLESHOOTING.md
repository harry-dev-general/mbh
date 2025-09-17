# Daily Run Sheet Troubleshooting Guide

## Quick Diagnosis

If you're getting a 500 error, check these in order:
1. **Authentication**: Are you using the correct Supabase key?
2. **Table IDs**: Are all Airtable table IDs correct?
3. **Field Names**: Are you requesting fields that actually exist?
4. **API Format**: Are you using proper URL encoding for Airtable?

## Common Issues and Solutions

### 1. Authentication Error (401) - Page Stuck Loading

**Symptoms:**
- Page shows loading animation indefinitely
- Console shows: `Failed to load resource: the server responded with a status of 401`
- Authentication check fails

**Cause:**
- Incorrect Supabase client initialization
- Wrong API key or authentication pattern

**Solution:**
The Daily Run Sheet must use the same authentication pattern as other management pages:

```javascript
// Correct pattern:
const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check authentication
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';  // Redirect to auth.html, not login.html
        return;
    }
    // Continue with initialization...
}
```

**Fixed in:** Commit `bc4feca` (September 17, 2025)

### 2. API 500 Error - Failed to Load Data

**Symptoms:**
- Page loads but data fails to fetch
- Console shows: `Failed to load resource: the server responded with a status of 500`
- Error message: "Failed to load data"

**Cause:**
- Incorrect Airtable table IDs in the API module

**Solution:**
Verify all table IDs match the actual Airtable base:
```javascript
// Correct table IDs:
const BOOKINGS_TABLE = 'tblRe0cDmK3bG2kPf';  // Bookings Dashboard
const PRE_DEPARTURE_TABLE = 'tbl9igu5g1bPG4Ahu';  // Pre-Departure Checklist
const POST_DEPARTURE_TABLE = 'tblYkbSQGP6zveYNi';  // Post-Departure Checklist
const BOATS_TABLE = 'tblNLoBNb4daWzjob';  // Boats (CORRECT ID)
const EMPLOYEE_TABLE = 'tbltAE4NlNePvnkpY';  // Employee Details
```

**Fixed in:** Commit `566c750` (September 17, 2025)

### 2.1 API 500 Error - Axios Parameter Encoding

**Symptoms:**
- Same as above but caused by different issue
- Console shows: `Failed to load resource: the server responded with a status of 500`

**Cause:**
- Incorrect parameter encoding when using axios with Airtable API
- The `params` object in axios doesn't format arrays correctly for Airtable

**Problem Code:**
```javascript
// Incorrect - causes 500 error
const response = await axios.get(url, {
    headers,
    params: {
        sort: [{ field: 'Start Time', direction: 'asc' }],
        fields: ['Field1', 'Field2']
    }
});
```

**Solution:**
Build URL with proper encoding:
```javascript
// Correct - works with Airtable API
const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?` +
    `filterByFormula=${encodeURIComponent(formula)}&` +
    `sort[0][field]=Start Time&sort[0][direction]=asc&` +
    `fields[]=Field1&fields[]=Field2`;

const response = await axios.get(url, { headers });
```

**Fixed in:** Commit `62b0a5e` (September 17, 2025)

### 2.2 API 500 Error - Non-existent Fields

**Symptoms:**
- Same 500 error after fixing table IDs and parameter encoding
- Server logs show field access errors

**Cause:**
- Requesting fields that don't exist in the Bookings Dashboard table
- Fields like `Onboarding Status`, `Deloading Status`, `Notes` were assumed but don't exist

**Solution:**
Only request fields that actually exist:
```javascript
// Fields that exist:
'Booking Code', 'Customer Name', 'Booking Date', 
'Start Time', 'Finish Time', 'Duration',
'Status', 'Add-ons', 'Booking Items',
'Boat', 'Onboarding Employee', 'Deloading Employee',
'Total Amount', 'Pre Departure Checklist', 'Post Departure Checklist'
```

**Fixed in:** Commit `bbc8a8c` and `e18aa48` (September 17, 2025)

### 2.3 API 500 Error - Incorrect Boats Table ID

**Symptoms:**
- Error persists even after fixing fields
- Vessel status queries fail

**Cause:**
- Wrong Boats table ID: `tblA2b3OFfqPFbOM` (incorrect)
- Should be: `tblNLoBNb4daWzjob` (correct)

**Solution:**
Update the table ID in daily-run-sheet.js:
```javascript
const BOATS_TABLE = 'tblNLoBNb4daWzjob';  // Correct ID
```

**Fixed in:** Commit `b418413` (September 17, 2025)

### 2.4 API 500 Error - Non-existent Status Field

**Symptoms:**
- Error persists even after all previous fixes
- Vessel status queries fail

**Cause:**
- Trying to filter boats by `{Status} = 'Active'`
- The Status field doesn't exist in the Boats table

**Solution:**
Remove the filter and fetch all boats:
```javascript
// Wrong - Status field doesn't exist
filterByFormula: "{Status} = 'Active'"

// Correct - fetch all boats
const boatsUrl = `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE}?pageSize=100`;
```

**Fixed in:** Commit `a949045` (September 17, 2025)

### 3. No Data Displaying

**Symptoms:**
- Page loads but shows "No bookings scheduled"
- API returns empty results

**Possible Causes:**
1. **Date Format Issues:** Ensure date is in Sydney timezone
2. **Airtable Permissions:** Check API key has access to required tables
3. **Filter Formula:** Verify booking status filter includes PAID, PEND, PART

**Debugging Steps:**
1. Check browser console for API errors
2. Verify date being sent to API (should be YYYY-MM-DD format)
3. Check Network tab for API response

### 4. Missing Vessel Information

**Symptoms:**
- Bookings show "Unassigned" for vessel
- Vessel status cards don't appear

**Causes:**
- Vessel not linked in Airtable booking record
- Vessel record missing from Boats table
- API not fetching linked records properly

**Solution:**
Ensure bookings have vessels assigned in Airtable and the API includes vessel fields:
```javascript
fields: [
    'Booking Code',
    'Customer Name',
    'Boat',  // This must be included
    // ... other fields
]
```

### 5. Add-ons Not Displaying

**Symptoms:**
- Add-ons section is empty or shows incorrect counts

**Causes:**
- Add-ons field format changed in Airtable
- Parsing logic not handling all formats

**Solution:**
Check that add-ons are stored in expected format in Airtable:
- Should be in 'Addons' field
- Format: "Item 1 x2, Item 2 x1" or similar

## Performance Issues

### Slow Loading Times

**Optimization Tips:**
1. **Caching:** The API implements 5-minute cache for vessel status
2. **Pagination:** Limit bookings query to specific date range
3. **Parallel Requests:** Frontend could fetch vessel status while loading bookings

### API Rate Limiting

**Symptoms:**
- 429 errors from Airtable
- Intermittent failures

**Solution:**
- Implement request queuing
- Increase cache TTL
- Batch requests where possible

## Development and Testing

### Local Testing
The Daily Run Sheet requires:
1. Valid Airtable API key in environment
2. Supabase authentication
3. Access to production Airtable base

### Test Data
Create test bookings with:
- Various add-ons
- Different vessels
- Multiple time slots
- Pre/post departure checklists

## Debugging Steps for Persistent 500 Errors

If you're still getting 500 errors after applying all fixes:

1. **Check Server Logs**
   - Add detailed logging to server.js:
   ```javascript
   console.error('Error details:', error.response?.data || error.stack);
   ```

2. **Verify All Table IDs**
   ```javascript
   // Correct IDs for MBH Bookings Operation base
   const BOOKINGS_TABLE = 'tblRe0cDmK3bG2kPf';
   const PRE_DEPARTURE_TABLE = 'tbl9igu5g1bPG4Ahu';
   const POST_DEPARTURE_TABLE = 'tblYkbSQGP6zveYNi';
   const BOATS_TABLE = 'tblNLoBNb4daWzjob';
   const EMPLOYEE_TABLE = 'tbltAE4NlNePvnkpY';
   ```

3. **Test API Endpoints Individually**
   - Test bookings: `/api/daily-run-sheet?date=2025-09-17`
   - Check response in Network tab
   - Look for specific error messages

4. **Common Field Name Issues**
   - Don't assume fields exist - check Airtable directly
   - Use optional chaining: `vessel.fields?.['Name']`
   - Match exact field names (case-sensitive)

## Contact and Support

For issues not covered here:
1. Check server logs in Railway dashboard
2. Review Airtable API documentation
3. Verify Supabase authentication status
4. Use Airtable MCP to verify field names

Last Updated: September 17, 2025
