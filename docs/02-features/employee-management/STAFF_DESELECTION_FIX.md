# Staff/Boat Deselection Fix - September 8, 2025

## Issue
Users couldn't remove/deselect assigned staff or boats from bookings. When trying to clear an assignment and update, they received the error: "Please select at least a staff member or a boat".

## Root Cause
The validation logic was too restrictive. It required at least one selection (staff or boat) for ALL updates, even when the user wanted to clear existing assignments.

## Solution
Modified the validation to check if there are existing assignments that need clearing:

```javascript
// Check if we're just clearing existing assignments
const currentStaffInfo = document.getElementById('currentStaffInfo').textContent;
const currentBoatInfo = document.getElementById('currentBoatInfo').textContent;
const hasCurrentStaff = !currentStaffInfo.includes('Not assigned');
const hasCurrentBoat = !currentBoatInfo.includes('Not assigned');

// Allow submission if:
// 1. New staff or boat is selected, OR
// 2. We're clearing existing staff/boat assignments
if (!selectedStaffId && !selectedBoatId && !hasCurrentStaff && !hasCurrentBoat) {
    alert('Please select at least a staff member or a boat');
    return;
}
```

## How It Works Now

### Allowed Operations:
1. ✅ **Add new assignment** - Select staff/boat when none assigned
2. ✅ **Change assignment** - Select different staff/boat
3. ✅ **Clear assignment** - Select "Select Staff Member" to remove current staff
4. ✅ **Clear both** - Remove both staff and boat assignments

### Blocked Operations:
1. ❌ **Empty submission** - Can't submit with no selections when nothing is assigned

## Testing
1. Open a booking with assigned staff
2. Change dropdown to "Select Staff Member" (empty option)
3. Click "Update Allocation"
4. Should successfully clear the staff assignment

## Technical Details
- The code already had logic to send empty arrays `[]` to Airtable to clear fields
- Only the validation was preventing this from executing
- Empty arrays in Airtable linked record fields effectively clear the relationship

## Deployment
Fixed in commit `7198cc5` and deployed to production.
