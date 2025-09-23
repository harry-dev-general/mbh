# Portal Response Status Bug

## Issue Description
When staff respond to shift allocations through the Portal (web interface), the system sets:
- ✅ Response Date
- ✅ Response Method = "Portal"
- ❌ Response Status (missing!)

This causes shifts to not be counted in the "Staff on Duty" metric.

## Example Case
Bronte Sprouster's shift on 2025-09-18:
```json
{
  "Response Date": "2025-09-17T10:45:51.893Z",
  "Response Method": "Portal",
  "Response Status": null  // Should be "Accepted" or "Declined"
}
```

## Current Workaround
The dashboard API now assumes any shift with Response Date or Response Method is accepted:
```javascript
if (shift.fields['Response Date'] || shift.fields['Response Method']) {
    return true; // Count as accepted
}
```

## Proper Fix Needed
The Portal response handler should set the Response Status field when staff respond:
- When accepting: Set Response Status = "Accepted"
- When declining: Set Response Status = "Declined"

## Files to Update
1. Portal response handler (likely in the frontend when staff click accept/decline)
2. Any API endpoint that handles Portal responses

## Impact
Without this fix, the workaround assumes ALL Portal responses are acceptances, which may not be accurate if staff declined through the Portal.
