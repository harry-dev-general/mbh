# SMS Notification Logic Update

## Overview
Updated the booking allocation system to prevent duplicate SMS notifications when managers update booking details without changing staff assignments.

## Issue Fixed
Previously, any update to a booking (including add-ons, boat changes, etc.) would trigger an SMS notification to the assigned staff member, even if they had already been notified and accepted the shift. This created unnecessary spam and confusion.

## Solution Implemented
The system now checks if the staff assignment is actually changing before sending an SMS notification.

### Logic Flow
1. **On booking update**: System compares the selected staff ID with the current staff ID
2. **If staff unchanged**: No SMS is sent (console logs the skip for debugging)
3. **If staff changed**: SMS notification is sent to the new staff member
4. **If new assignment**: SMS notification is sent (no previous staff to compare)

### Code Changes
Located in `/training/management-allocations.html`:

```javascript
// Get current staff assignment to check if it's actually changing
const booking = bookingsData.find(b => b.id === bookingId);
const currentStaffId = allocationType === 'onboarding' ? 
    booking?.fields['Onboarding Employee']?.[0] : 
    booking?.fields['Deloading Employee']?.[0];

// Only send SMS if staff is being newly assigned or changed
const isStaffChanging = selectedStaffId && selectedStaffId !== currentStaffId;

if (selectedStaffId && !isStaffChanging) {
    console.log('Staff assignment unchanged - SMS notification skipped:', {
        currentStaff: currentStaffId,
        selectedStaff: selectedStaffId,
        allocationType: allocationType
    });
}

if (isStaffChanging) {
    // Send SMS notification
}
```

## Scenarios Covered

### SMS WILL be sent when:
- ✅ New staff member assigned to unassigned shift
- ✅ Staff member changed from one to another
- ✅ Staff member assigned after being removed

### SMS will NOT be sent when:
- ❌ Add-ons are added/removed
- ❌ Boat is changed
- ❌ Staff remains the same (even if other fields change)
- ❌ Manager clicks save without making changes

## Benefits
1. **Reduced SMS costs**: No duplicate messages
2. **Better UX**: Staff aren't confused by repeated notifications
3. **Clear communication**: Staff only notified when action is needed
4. **Audit trail**: Console logs show when SMS is skipped

## Testing
To verify the fix:
1. Assign a staff member to a booking → SMS sent ✓
2. Update add-ons on same booking → No SMS ✓
3. Change the boat on same booking → No SMS ✓
4. Change to different staff member → SMS sent to new staff ✓

## Future Considerations
- Could add a "Force Send SMS" checkbox for edge cases
- Could track SMS history to show managers when last notification was sent
- Could add different message templates for reassignments vs new assignments
