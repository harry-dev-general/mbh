# Boat Type Conditional Fields Troubleshooting Guide - November 2025

## Issue Summary
Checklists were showing unnecessary fields (gas, water, toilet) for non-BBQ boats. Implementation of conditional field display based on boat type encountered multiple technical challenges.

## Timeline of Issues and Fixes

### Issue 1: Client-Side Implementation Not Working
**Date**: November 10, 2025
**Problem**: Updated client-side checklists (`pre-departure-checklist.html`, `post-departure-checklist.html`) but changes weren't visible when accessed via SMS links.

**Root Cause**: SMS system was sending links to SSR versions (`*-ssr.html`), not the client-side versions.

**Diagnostic Steps**:
1. Examined SMS message URLs
2. Identified `-ssr.html` suffix in links
3. Traced to `checklist-renderer.js` handling

**Solution**: Updated `api/checklist-renderer.js` to include conditional rendering logic.

### Issue 2: Airtable Field Validation Error (500)
**Error Message**:
```
type: 'INVALID_MULTIPLE_CHOICE_OPTIONS',
message: 'Insufficient permissions to create new select option "N/A"'
```

**Root Cause**: Attempting to submit "N/A" as a value for single-select dropdown fields in Airtable.

**Solution**: Changed from sending "N/A" to completely omitting fields for non-applicable boat types using spread syntax:
```javascript
// Before (causing error):
'Gas Bottle Check': (!data.gasLevel || data.gasLevel === 'N/A') ? 'N/A' : data.gasLevel

// After (working):
...(data.gasLevel && data.gasLevel !== 'N/A' ? {'Gas Bottle Check': data.gasLevel} : {})
```

### Issue 3: Additional Field Simplification
**Date**: November 10, 2025
**Request**: Further simplify checklists by removing BBQ/toilet/lights/battery fields for non-BBQ boats.

**Implementation**:
- Wrapped additional fields in conditional rendering
- Updated submission logic to handle undefined checkbox values
- Ensured backward compatibility with existing data

## Key Technical Learnings

### 1. SSR vs Client-Side Architecture
- SMS notifications link to server-rendered versions for security and reliability
- Changes must be implemented in both client-side and SSR versions
- SSR handled by `checklist-renderer.js`, not the HTML files

### 2. Airtable API Constraints
- Single-select fields reject values not in their predefined options
- API doesn't have permission to create new options dynamically
- Solution: Omit fields entirely rather than sending placeholder values

### 3. Conditional Field Pattern
```javascript
// Effective pattern for optional Airtable fields
const fields = {
    // Always included fields
    'Checklist ID': checklistId,
    'Booking': [bookingId],
    
    // Conditionally included fields
    ...(condition ? {'Field Name': value} : {}),
    ...(data.field !== undefined ? {'Field': data.field || defaultValue} : {})
};
```

### 4. Form Field State Management
- Use `undefined` checks for checkbox fields that might not exist
- Default to `false` for boolean fields when they do exist
- Handle "N/A" string values from client-side JavaScript

## Debugging Commands

### Check Railway Logs
```bash
# View recent logs
railway logs -n 100

# Filter for checklist-related logs
railway logs | grep -i checklist

# Check for Airtable errors
railway logs | grep -i "airtable\|error"
```

### Test URLs
```
# Pre-Departure SSR (Polycraft)
https://mbh-production-f0d1.up.railway.app/training/pre-departure-checklist-ssr.html?bookingId=BOOKING_ID&staffId=STAFF_ID

# Pre-Departure SSR (BBQ Boat)
https://mbh-production-f0d1.up.railway.app/training/pre-departure-checklist-ssr.html?bookingId=BBQ_BOOKING_ID&staffId=STAFF_ID
```

## Common Error Patterns

### 1. "Failed to submit checklist" (500 error)
- Check Railway logs for Airtable API response
- Look for field validation errors
- Verify all submitted fields exist in Airtable table

### 2. Fields not hiding/showing
- Verify boat type is being fetched correctly
- Check if using SSR vs client-side version
- Inspect `isBBQBoat` variable in browser console

### 3. Submission succeeds but data missing
- Check if fields are being conditionally excluded
- Verify field names match Airtable exactly (case-sensitive)
- Review spread syntax implementation

## Future Considerations

1. **Field Configuration**: Consider moving boat type field mappings to configuration file
2. **Validation**: Add server-side validation for boat-type-specific requirements
3. **Testing**: Implement automated tests for different boat type scenarios
4. **Documentation**: Keep boat type list updated as fleet changes

## Related Files
- `/api/checklist-renderer.js` - SSR implementation
- `/training/pre-departure-checklist.html` - Client-side pre-departure
- `/training/post-departure-checklist.html` - Client-side post-departure
- `/api/checklist-api.js` - API endpoints
- Railway logs: `logs.1762752654803.json`, `logs.1762753032396.json`
