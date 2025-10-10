# SMS Reminder System Implementation

**Date**: October 10, 2025  
**Feature**: Automatic 6-hour reminder SMS for pending shift allocations  
**Status**: Implemented and Ready for Testing  

## Overview

Implemented an automatic reminder system that sends SMS reminders every 6 hours to staff members who haven't responded to their shift allocation notifications. This ensures critical shifts don't go unfilled due to missed or forgotten SMS messages.

## Features

### 1. Automatic Reminders

- **Frequency**: Every 6 hours after initial allocation
- **Duration**: Up to 72 hours (then stops)
- **Targets**: 
  - Pending shift allocations
  - Pending booking allocations (both onboarding and deloading)

### 2. Smart Scheduling

- **First Reminder**: 6 hours after initial SMS
- **Subsequent Reminders**: Every 6 hours
- **Check Frequency**: System checks every 30 minutes for allocations needing reminders
- **Stops When**: Staff accepts/declines OR 72 hours pass

### 3. Fresh Magic Links

Each reminder generates new accept/decline links to ensure they work even if the original links are getting old.

## Technical Implementation

### Files Created/Modified

1. **`/api/reminder-scheduler.js`** (New)
   - Core reminder logic
   - Tracks sent reminders
   - Processes pending allocations
   - Handles both shift and booking allocations

2. **`/api/notifications.js`** (Updated)
   - Enhanced `sendShiftReminder()` to support booking allocations
   - Generates fresh magic links for each reminder

3. **`/server.js`** (Updated)
   - Starts reminder scheduler on server startup
   - Added admin endpoints for monitoring/testing

## Configuration

### Default Settings

```javascript
REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000;  // 6 hours between reminders
CHECK_INTERVAL_MS = 30 * 60 * 1000;         // Check every 30 minutes
MAX_REMINDER_AGE_MS = 72 * 60 * 60 * 1000; // Stop after 72 hours
```

### To Change Reminder Frequency

Edit `/api/reminder-scheduler.js` line 16:
```javascript
// For 4-hour reminders:
const REMINDER_INTERVAL_MS = 4 * 60 * 60 * 1000;

// For 12-hour reminders:
const REMINDER_INTERVAL_MS = 12 * 60 * 60 * 1000;
```

## Admin Tools

**Security**: These endpoints require an admin API key. Pass it via:
- Header: `X-Admin-Key: your-key`
- Query parameter: `?adminKey=your-key`

Default key: `mbh-admin-2025` (set `ADMIN_API_KEY` env var in production)

### 1. Manual Trigger (for testing)

```bash
POST /api/admin/trigger-reminders
Headers: X-Admin-Key: mbh-admin-2025
```

Manually triggers a reminder check. Useful for testing without waiting.

### 2. View Reminder Status

```bash
GET /api/admin/reminder-status?adminKey=mbh-admin-2025
```

Shows:
- Active reminders being tracked
- When each reminder was last sent
- Total reminders in tracker

## How It Works

1. **Server Starts** → Reminder scheduler starts automatically
2. **Every 30 minutes** → System checks for pending allocations
3. **For each pending allocation**:
   - Check if 6+ hours have passed since allocation/last reminder
   - If yes → Send reminder SMS with fresh links
   - Track that reminder was sent

4. **Stops sending when**:
   - Staff accepts or declines
   - 72 hours have passed since allocation

## Example Timeline

```
Hour 0:   Initial SMS sent to staff member
Hour 6:   First reminder sent (if still pending)
Hour 12:  Second reminder sent (if still pending)
Hour 18:  Third reminder sent (if still pending)
Hour 24:  Fourth reminder sent (if still pending)
...
Hour 72:  Final reminder (if still pending)
Hour 78:  No more reminders sent (expired)
```

## SMS Message Format

**Initial Allocation**:
```
📋 MBH Staff Alert - New Shift Assignment

Hi [Name],
You've been assigned a new shift:
📅 [Date]
⏰ [Time]

✅ ACCEPT: [link]
❌ DECLINE: [link]
```

**Reminder**:
```
⏰ MBH Shift Reminder

Hi [Name],
Your shift starts in [X] hours:
📅 [Date] at [Time]

Please confirm ASAP:
✅ ACCEPT: [link]
❌ DECLINE: [link]
```

## Testing

### 1. Create Test Allocation

1. Go to management allocations page
2. Assign Test Staff to a shift
3. Verify initial SMS is sent

### 2. Test Reminders

**Option A: Wait 6 hours**
- Leave allocation pending
- Check for reminder SMS after 6 hours

**Option B: Manual Trigger (Faster)**
```javascript
// From browser console:
fetch('/api/admin/trigger-reminders', { 
  method: 'POST',
  headers: { 'X-Admin-Key': 'mbh-admin-2025' }
})
  .then(r => r.json())
  .then(console.log)
```

### 3. Check Status

```javascript
// From browser console:
fetch('/api/admin/reminder-status?adminKey=mbh-admin-2025')
  .then(r => r.json())
  .then(console.log)
```

## Monitoring

Watch server logs for:
```
🚀 Starting reminder scheduler...
⏰ Running reminder check at [timestamp]
🔍 Checking for pending allocations needing reminders...
📤 Sent reminder to [Name] for shift on [Date]
✅ Reminder check complete. Tracker size: [X]
```

## Benefits

1. **Reduced No-Shows**: Staff less likely to miss shifts
2. **Better Coverage**: More time to find replacements if declined
3. **Less Manual Work**: No need to manually follow up
4. **Audit Trail**: System tracks all reminders sent

## Future Enhancements

1. **Escalation**: Notify management after X reminders with no response
2. **Custom Schedules**: Different reminder frequencies for different shift types
3. **SMS Reply Support**: Allow staff to reply "YES" or "NO" to SMS
4. **Analytics**: Track reminder effectiveness and response rates

## Rollback

If issues occur:

1. **Stop Scheduler**: Comment out `reminderScheduler.startReminderScheduler()` in server.js
2. **Deploy**: The system will stop sending reminders
3. **Initial SMS**: Will continue to work normally

## Best Practices

1. **Don't Over-Remind**: 6 hours is reasonable; too frequent may annoy staff
2. **Monitor Response**: Check if reminders improve response rates
3. **Weekend Consideration**: 6-hour intervals work well across weekends
4. **Clear Messages**: Reminders clearly show urgency with "Please confirm ASAP"
