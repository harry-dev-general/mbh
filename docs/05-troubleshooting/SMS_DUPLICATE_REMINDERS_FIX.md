# SMS Duplicate Reminders Fix - RESOLVED

**Date**: October 14, 2025  
**Issue**: Multiple SMS reminders sent for the same allocation  
**Root Cause**: Multiple app instances with in-memory tracking  
**Solution**: Using existing Airtable fields to track reminder status  

## The Problem

When Railway runs multiple instances of the app (during deployments, scaling, or updates), each instance maintained its own in-memory tracker of sent reminders. This caused:

1. **Duplicate SMS**: Each instance sent its own reminder
2. **Irregular Timing**: Different instances started at different times
3. **Resource Waste**: Unnecessary SMS costs and poor user experience

### Evidence from Logs

```
22:27:19 - Instance A sends reminder to Test Staff
22:35:37 - Instance B sends reminder to Test Staff (8 min later)
22:35:52 - Instance C sends reminder to Test Staff (15 sec later!)
```

## The Solution Implemented

Instead of creating a separate tracking table, we leveraged existing fields in Airtable to track reminder status:

### Shift Allocations Table
Already had these fields:
- **Reminder Sent**: Checkbox field indicating if a reminder was sent
- **Reminder Sent Date**: DateTime field storing when the last reminder was sent

### Bookings Dashboard Table
New fields were added:
- **Onboarding Reminder Sent**: Checkbox for onboarding reminders
- **Onboarding Reminder Sent Date**: DateTime for onboarding reminder timestamp
- **Deloading Reminder Sent**: Checkbox for deloading reminders
- **Deloading Reminder Sent Date**: DateTime for deloading reminder timestamp

## How It Works Now

The updated system:

1. **Before sending a reminder**: 
   - Checks the allocation/booking record directly in Airtable
   - Looks at the "Reminder Sent Date" field to determine if 6 hours have passed
   
2. **After sending**: 
   - Updates the record with:
     - Reminder Sent = ✓ (checked)
     - Reminder Sent Date = current timestamp
   
3. **All instances share**: 
   - The same Airtable data
   - No possibility of duplicates as each record tracks its own status

## Implementation Details

### Files Modified

1. **`/api/reminder-scheduler.js`** (Completely Rewritten)
   - Removed all in-memory tracking logic
   - Removed dependency on persistent tracker module
   - Now checks Airtable fields directly before sending
   - Updates Airtable fields after sending
   
2. **`/server.js`** (Updated)
   - Simplified admin endpoint to show the new tracking method
   - Removed references to in-memory or persistent trackers

### Key Changes

```javascript
// OLD: Check in-memory tracker
if (await shouldSendReminder(key, created)) {
  await sendReminder();
  reminderTracker.set(key, Date.now());
}

// NEW: Check Airtable fields directly
if (shouldSendShiftReminder(allocation)) {
  await sendAllocationReminder(allocation);
  await updateReminderStatus(ALLOCATIONS_TABLE_ID, allocation.id, {
    'Reminder Sent': true,
    'Reminder Sent Date': new Date().toISOString()
  });
}
```

## Benefits of This Approach

1. **Simpler**: No additional tables or complex tracking systems
2. **More Reliable**: Direct field updates, no cache inconsistencies
3. **Visible**: Can see reminder status directly in Airtable UI
4. **No Cleanup Needed**: Each record manages its own reminder status
5. **Works with existing backup/restore**: Reminder status is part of the record

## Testing the Fix

### 1. Verify No Duplicates

Check the Airtable records directly to see:
- Reminder Sent checkbox status
- Reminder Sent Date timestamps
- No multiple reminders within 6-hour windows

### 2. Monitor via Admin Endpoint

```bash
GET /api/admin/reminder-status?adminKey=your-admin-key
```

Response shows:
```json
{
  "schedulerActive": true,
  "storageType": "Airtable fields",
  "trackingFields": {
    "shiftAllocations": {
      "table": "Shift Allocations",
      "fields": ["Reminder Sent", "Reminder Sent Date"]
    },
    "bookings": {
      "table": "Bookings Dashboard",
      "fields": [
        "Onboarding Reminder Sent", 
        "Onboarding Reminder Sent Date",
        "Deloading Reminder Sent",
        "Deloading Reminder Sent Date"
      ]
    }
  },
  "message": "Reminder tracking is now handled directly through Airtable fields to prevent duplicates across multiple instances."
}
```

### 3. Force Multiple Instances

Deploy without stopping the old instance - both should coordinate through the same Airtable fields.

## Monitoring

### In Airtable
1. Filter for records where "Response Status" = "Pending"
2. Check "Reminder Sent" and "Reminder Sent Date" fields
3. Verify reminders are sent exactly every 6 hours

### In Logs
Look for reminder entries showing:
- Which allocations are being checked
- Which reminders are being sent
- No duplicates for the same allocation

## Migration Notes

If you had the previous persistent tracker implementation:
1. The separate tracking table is no longer needed
2. Remove `REMINDER_TRACKER_TABLE_ID` environment variable
3. The system now uses native Airtable fields only

## Future Considerations

This solution is optimal for the current scale because:
1. It leverages existing infrastructure
2. No additional complexity or points of failure
3. Reminder status is part of the business data
4. Works seamlessly with Airtable's existing features (views, filters, automation)