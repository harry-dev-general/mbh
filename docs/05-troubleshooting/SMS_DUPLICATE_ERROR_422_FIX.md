# SMS Duplicate Reminders - 422 Error Investigation

## Issue Date: October 14, 2025

## Problem
Users continue receiving duplicate SMS reminders despite implementing Airtable field-based tracking. The system was getting HTTP 422 (Unprocessable Entity) errors when trying to update Airtable checkbox fields.

## Investigation Steps

### 1. Enhanced Error Logging (v2.2)
Added detailed error logging to see Airtable's error response:
```javascript
} catch (error) {
    console.error('Error updating reminder status:', error);
    if (error.response) {
        console.error('Airtable error response:', error.response.data);
    }
    throw error; // Re-throw to prevent sending SMS if update fails
}
```

### 2. Update-First Approach
Changed the order of operations to update Airtable BEFORE sending SMS:
```javascript
try {
    // First try to update the reminder status - if this fails, don't send SMS
    await updateReminderStatus(ALLOCATIONS_TABLE_ID, allocation.id, {
        'Reminder Sent': true,  // Testing if Airtable expects boolean true
        'Reminder Sent Date': new Date().toISOString()
    });
    
    // Only send SMS if update was successful
    await sendAllocationReminder(allocation);
} catch (error) {
    console.error(`Failed to process reminder for allocation ${allocation.id}:`, error);
    // Continue to next allocation
}
```

### 3. Checkbox Field Format Testing
Tested different formats for checkbox fields:
- v2.0: Used `true` (boolean) → Got 422 error
- v2.1: Used `1` (numeric) → Still got 422 error
- v2.2: Back to `true` (boolean) with better error handling

## Key Changes in v2.2

1. **Error Details**: Now logs the actual Airtable error response
2. **Update-First**: Updates tracking before sending SMS
3. **Fail-Safe**: If update fails, SMS is not sent
4. **All Reminders**: Applied fix to shift allocations and both booking types

## Deployment
```bash
git add -A
git commit -m "fix: SMS duplicate reminders - test boolean true for checkbox fields and prevent SMS on update failure"
git push origin development
```

## Next Steps
1. Monitor Railway logs for detailed error messages
2. Check if 422 errors show specific field validation issues
3. Verify field permissions in Airtable

## Expected Behavior
- If Airtable update succeeds → SMS is sent
- If Airtable update fails → SMS is NOT sent, error is logged
- No more duplicate SMS due to failed tracking updates
