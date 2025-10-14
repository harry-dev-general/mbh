# SMS Duplicate Reminders - Complete Investigation & Resolution

## Issue Overview
**Date**: October 14, 2025  
**Problem**: Users receiving duplicate SMS reminders for shift allocations at irregular intervals
**Impact**: Poor user experience, increased SMS costs, confusion for staff

## Timeline of Symptoms
- User received 2 SMS at 01:49
- 2 SMS at 08:19  
- 2 SMS at 09:27
- 4 SMS at 09:35
- Expected: 1 SMS every 6 hours for pending allocations

## Root Cause Analysis

### Primary Issue: Multi-Instance Deployment
Railway was running multiple application instances/replicas, each maintaining its own in-memory reminder tracker. This caused:
- Instance A sends SMS, tracks in its memory
- Instance B doesn't see Instance A's tracking
- Instance B sends duplicate SMS
- Inconsistent timing due to different instance check cycles

### Secondary Issue: Field Tracking Missing
The system lacked dedicated fields in Airtable to track reminder status, relying instead on in-memory storage that was lost on restart or not shared between instances.

### Tertiary Issue: Airtable API Format
Checkbox fields in Airtable were rejecting updates with 422 errors due to incorrect value format.

## Investigation Journey

### Phase 1: Initial Analysis
**Findings**:
- Reminder scheduler using in-memory tracker [[memory:9759577]]
- Multiple Railway app instances running simultaneously
- Each instance maintaining separate reminder state

**Key Discovery**: Railway logs showed different replica IDs processing the same allocations.

### Phase 2: Persistent Storage Attempt
**Approach**: Create separate "Reminder Tracking" table in Airtable
**Implementation**:
```javascript
// api/reminder-tracker-persistent.js
class PersistentReminderTracker {
    async hasReminderBeenSent(allocationId, allocationDate) {
        const existingRecord = await base(TRACKING_TABLE)
            .select({
                filterByFormula: `AND({Allocation ID} = '${allocationId}', {Reminder Type} = 'shift')`
            })
            .firstPage();
        return existingRecord.length > 0;
    }
}
```

**Result**: Still getting duplicates due to:
- Race conditions between instances
- Additional complexity of managing separate table
- Potential for tracking table to get out of sync

### Phase 3: Direct Field Tracking
**Solution**: Add tracking fields directly to existing tables
- **Shift Allocations Table**: 
  - `Reminder Sent` (checkbox)
  - `Reminder Sent Date` (dateTime)
- **Bookings Dashboard Table**:
  - `Onboarding Reminder Sent` (checkbox)
  - `Onboarding Reminder Sent Date` (dateTime)
  - `Deloading Reminder Sent` (checkbox)
  - `Deloading Reminder Sent Date` (dateTime)

**Benefits**:
- Single source of truth
- No race conditions
- Survives restarts/deployments
- Works across all instances

### Phase 4: Checkbox Format Discovery
**Initial Attempts**:
```javascript
// Attempt 1: Boolean true → 422 error
'Reminder Sent': true

// Attempt 2: Numeric 1 → 422 error  
'Reminder Sent': 1

// Attempt 3: Boolean true with update-first → SUCCESS
'Reminder Sent': true
```

**Key Learning**: The 422 errors were likely due to:
1. Missing fields initially
2. Permission issues
3. Update timing (trying to update after SMS sent)

### Phase 5: Update-First Pattern
**Critical Fix**: Reverse the order of operations
```javascript
// OLD: Send SMS → Update tracking (could fail)
await sendAllocationReminder(allocation);
await updateReminderStatus(ALLOCATIONS_TABLE_ID, allocation.id, fields);

// NEW: Update tracking → Send SMS (only if update succeeds)
try {
    await updateReminderStatus(ALLOCATIONS_TABLE_ID, allocation.id, {
        'Reminder Sent': true,
        'Reminder Sent Date': new Date().toISOString()
    });
    await sendAllocationReminder(allocation);
} catch (error) {
    console.error(`Failed to process reminder for allocation ${allocation.id}:`, error);
}
```

## Technical Discoveries

### 1. Railway Multi-Instance Behavior
- Railway can run multiple replicas of an application
- Each replica has unique ID (visible in logs)
- In-memory state is NOT shared between replicas
- Need persistent storage for any stateful operations

### 2. Airtable filterByFormula Limitations
- Date comparisons unreliable [[memory:9303989]]
- Client-side filtering more reliable
- Always fetch all records and filter in JavaScript for dates

### 3. Airtable Checkbox Fields
- Accept boolean `true` or numeric `1`
- May reject updates if field permissions incorrect
- 422 errors don't always provide clear error messages
- Better to verify field exists before attempting updates

### 4. Error Handling Patterns
- Always try state updates BEFORE side effects (SMS)
- Log detailed error responses for debugging
- Continue processing other items on individual failures
- Re-throw errors when operation must be atomic

## Final Solution Architecture

### Components
1. **Airtable Fields**: Direct tracking on allocation records
2. **Update-First Pattern**: Ensures no SMS without tracking
3. **Enhanced Error Logging**: Captures Airtable responses
4. **Version Tracking**: Logs help identify which code is running

### Code Structure
```javascript
// Check if reminder should be sent
function shouldSendShiftReminder(allocation) {
    const reminderSentDate = fields['Reminder Sent Date'];
    if (!reminderSentDate) {
        return age >= REMINDER_INTERVAL_MS; // First reminder
    }
    // Check if 6 hours passed since last reminder
    const hoursSinceLastReminder = 
        (now - new Date(reminderSentDate)) / (1000 * 60 * 60);
    return hoursSinceLastReminder >= 6;
}

// Process with update-first pattern
if (shouldSendShiftReminder(allocation)) {
    try {
        await updateReminderStatus(...); // Update first
        await sendAllocationReminder(...); // Then send
    } catch (error) {
        console.error(...); // Log but continue
    }
}
```

## Verification Steps
1. Check Railway logs for v2.2 deployment
2. Verify no 422 errors in logs
3. Confirm single SMS per allocation
4. Monitor 6-hour intervals working correctly
5. Check Airtable fields updating properly

## Lessons Learned
1. **Always consider multi-instance scenarios** in cloud deployments
2. **Persistent state** must be in external storage, not memory
3. **Update-first pattern** prevents side effects without tracking
4. **Field-based tracking** simpler than separate tracking tables
5. **Detailed error logging** essential for API debugging
6. **Version logging** helps identify which code is running

## Related Documentation
- [SMS Reminder System Implementation](../02-features/sms/SMS_REMINDER_SYSTEM_IMPLEMENTATION.md)
- [Airtable Filtering Patterns](../04-technical/AIRTABLE_FILTERING_PATTERNS.md)
- [Railway Deployment Guide](../01-setup/RAILWAY_VS_LOCAL_DEVELOPMENT.md)
