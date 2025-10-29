# Daily Run Sheet v2 - 500 Error Fix

## Issue
The daily run sheet page was returning a 500 Internal Server Error when trying to load data from `/api/daily-run-sheet`.

## Root Cause
In the debugging process, we added a filter to the `getAllVesselStatuses()` function to only fetch "active" boats:
```javascript
const boatsFilter = encodeURIComponent('{Active}=1');
```

However, the Boats table in Airtable doesn't have an "Active" field, causing the Airtable API to fail with an error.

## Solution
Removed the filter and fetched all boats from the table:
```javascript
// Get all boats (no Active field in this table)
const boatsUrl = `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE}?pageSize=100`;
```

## Verification
The Boats table has fields like:
- Name
- Boat Type
- Overall Vessel Condition
- Current Fuel Level (%)
- Various equipment conditions

But no "Active" field to filter on.

## Key Learning
Always verify that fields exist in Airtable before adding filters. The Airtable API will return an error if you try to filter on non-existent fields.
