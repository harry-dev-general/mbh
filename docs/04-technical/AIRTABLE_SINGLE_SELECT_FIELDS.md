# Airtable Single Select Field Handling

**Last Updated**: September 17, 2025
**Version**: 1.0

## Overview

Airtable single select fields are strict about the values they accept. This document outlines best practices and common pitfalls when working with these fields through the API.

## Key Principles

### 1. Exact Match Required
Single select fields only accept values that exactly match predefined options:
- Case-sensitive matching
- Whitespace-sensitive
- No automatic option creation (unlike some database systems)

### 2. API Behavior
When an invalid value is provided:
- **Error**: "Insufficient permissions to create new select option '[value]'"
- **HTTP Status**: 422 (Unprocessable Entity)
- **Impact**: Entire record update fails

## Common Issues and Solutions

### Issue 1: Mismatched Option Values

**Problem**: UI shows different values than Airtable expects
```javascript
// UI Option: "Ready for Use"
// Airtable Expects: "Good - Ready for Next Booking"
```

**Solution**: Always verify exact field options using Airtable MCP:
```javascript
mcp_airtable_describe_table(
  baseId: "applkAFOn2qxtu7tx",
  tableId: "tblYkbSQGP6zveYNi",
  detailLevel: "full"
)
```

### Issue 2: Server-Side Validation Mismatch

**Problem**: Backend validation doesn't match Airtable options
```javascript
// Server validation
const validConditions = ['Ready for Use', 'Minor Issues', 'Issues Found'];

// Airtable actual options
const actualOptions = [
  'Good - Ready for Next Booking',
  'Needs Attention',
  'Major Issues - Do Not Use'
];
```

**Solution**: Keep validation arrays synchronized with Airtable

### Issue 3: Creating Records with Invalid Options

**Problem**: Trying to create records with non-existent select options
```javascript
// This will fail
{
  'Completion Status': 'Location Update Only' // Not a valid option
}
```

**Solution**: Use existing valid options or leave field empty
```javascript
// Use valid option
{
  'Completion Status': 'Completed' // Valid option
}
```

## Best Practices

### 1. Document Valid Options
Always document valid options in code:
```javascript
// Valid options for "Overall Vessel Condition After Use"
const VESSEL_CONDITIONS = {
  GOOD: 'Good - Ready for Next Booking',
  WARNING: 'Needs Attention',
  CRITICAL: 'Major Issues - Do Not Use'
};
```

### 2. Validate Before Sending
Validate on both client and server:
```javascript
function validateCondition(value) {
  const validOptions = Object.values(VESSEL_CONDITIONS);
  if (!validOptions.includes(value)) {
    throw new Error(`Invalid condition: ${value}`);
  }
  return value;
}
```

### 3. Handle Empty/Null Values
Single select fields can be empty:
```javascript
// Safe to send
{
  'Overall Vessel Condition After Use': null // Clears the field
}

// Also safe
{
  // Omit the field entirely
}
```

### 4. Use Constants for Options
Avoid hardcoding strings throughout the codebase:
```javascript
// Bad
updateData['Status'] = 'Completed';

// Good
const STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};
updateData['Status'] = STATUS.COMPLETED;
```

## Debugging Tips

### 1. Check Exact Field Configuration
Use Airtable's API to get field configuration:
```javascript
const response = await axios.get(
  `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);
```

### 2. Log Failed Updates
Always log the exact values being sent:
```javascript
console.log('Updating with values:', JSON.stringify(updateData, null, 2));
```

### 3. Test in Airtable UI First
Before coding, manually test values in Airtable's interface to confirm valid options.

## Common Single Select Fields in MBH

### Post-Departure Checklist Table
- **Completion Status**: "Not Started", "In Progress", "Completed"
- **Overall Vessel Condition After Use**: "Good - Ready for Next Booking", "Needs Attention", "Major Issues - Do Not Use"

### Bookings Dashboard Table
- **Status**: "PAID", "PEND", "HOLD", "VOID", "STOP", "PART"
- **Onboarding Status**: "Unassigned", "Assigned", "Confirmed", "Completed"
- **Deloading Status**: "Unassigned", "Assigned", "Confirmed", "Completed"

### Shift Allocations Table
- **Response Status**: "Pending", "Accepted", "Declined"
- **Response Method**: "SMS", "Portal", "Manual"

## Error Recovery

When encountering single select errors:

1. **Immediate Fix**: Remove or correct the invalid field value
2. **Long-term Fix**: Update validation to match Airtable
3. **Prevention**: Add field validation tests

Example error handling:
```javascript
try {
  await updateRecord(data);
} catch (error) {
  if (error.message.includes('create new select option')) {
    console.error('Invalid select option. Valid options are:', validOptions);
    // Retry without the problematic field
    delete data.fields[problematicField];
    await updateRecord(data);
  }
}
```

## Related Documentation

- [Airtable API Field Types](https://airtable.com/developers/web/api/field-model)
- [Technical Reference - Airtable API](./TECHNICAL_REFERENCE_AIRTABLE_API.md)
- [Troubleshooting Guide](../05-troubleshooting/TROUBLESHOOTING_GUIDE.md)
