# SMS Reminder System - Quick Reference Guide

## Current Status: ✅ WORKING (v2.2)
No duplicate SMS since deployment. System stable.

## Key Commands

### Check System Status
```bash
curl https://mbh-development.up.railway.app/api/admin/reminder-status \
  -H "X-Admin-Key: mbh-admin-2025"
```

### Monitor Health
```bash
node scripts/monitor-reminders.js
# Or continuous monitoring:
node scripts/monitor-reminders.js --continuous
```

### Trigger Manual Check (Testing)
```bash
curl -X POST https://mbh-development.up.railway.app/api/admin/trigger-reminders \
  -H "X-Admin-Key: mbh-admin-2025"
```

## What to Monitor

### 🟢 Green Flags (System Healthy)
- Scheduler active in status check
- No 422 errors in logs
- Reminders sent at 6-hour intervals
- Single SMS per allocation
- Airtable fields updating

### 🔴 Red Flags (Need Investigation)
- Multiple SMS for same allocation
- 422 errors appearing
- "Error updating reminder status" in logs
- Scheduler inactive
- No reminders sent for new allocations

## Common Issues & Solutions

### Issue: 422 Errors
**Cause**: Field format or permissions issue  
**Solution**: 
1. Verify checkbox fields use boolean `true`
2. Check API key has write permissions
3. Ensure fields exist in Airtable

### Issue: No Reminders Sent
**Cause**: Scheduler stopped or Airtable connection issue  
**Solution**:
1. Check scheduler status
2. Restart server if needed
3. Verify Airtable API key valid

### Issue: Duplicate SMS (Resolved in v2.2)
**Previous Cause**: Multiple Railway instances with in-memory tracking  
**Current Solution**: Direct Airtable field tracking + update-first pattern

## Architecture Overview

```
Every 30 minutes:
1. Fetch pending allocations (< 72 hours old)
2. For each allocation:
   - Check if 6+ hours since last reminder
   - If yes:
     a. UPDATE Airtable fields FIRST ✅
     b. Send SMS only if update succeeds
   - If no: Skip
3. Log results
```

## Key Files
- `/api/reminder-scheduler.js` - Main logic (v2.2)
- `/api/reminder-scheduler-enhanced.js` - Enhanced version with retry
- `/api/notifications.js` - SMS sending
- `/server.js` - Admin endpoints
- `/scripts/monitor-reminders.js` - Health monitoring

## Airtable Fields

### Shift Allocations Table
- `Reminder Sent` (checkbox) - boolean `true`/`false`
- `Reminder Sent Date` (datetime) - ISO string

### Bookings Dashboard Table
- `Onboarding Reminder Sent` (checkbox)
- `Onboarding Reminder Sent Date` (datetime)
- `Deloading Reminder Sent` (checkbox)
- `Deloading Reminder Sent Date` (datetime)

## Emergency Procedures

### Stop All Reminders
1. Edit `/server.js`
2. Comment out: `reminderScheduler.startReminderScheduler();`
3. Deploy to Railway
4. Reminders will stop (initial SMS still works)

### Clear Reminder History
1. Go to Airtable
2. Select all records with `Reminder Sent` = true
3. Uncheck the field
4. Clear `Reminder Sent Date` field

### Debug Specific Allocation
```javascript
// Browser console on admin page
fetch('/api/admin/debug-allocation/ALLOCATION_ID', {
  headers: { 'X-Admin-Key': 'mbh-admin-2025' }
}).then(r => r.json()).then(console.log)
```

## Best Practices

1. **Monitor Daily**: Check status endpoint once per day
2. **User Reports**: Investigate any duplicate SMS reports immediately
3. **Log Review**: Check for 422 errors weekly
4. **Test Monthly**: Create test allocation, verify reminder after 6 hours
5. **Document Issues**: Update this guide with new findings

## Contact for Issues
- Check logs first
- Review error messages
- Test with monitoring script
- Document steps taken
- Escalate if pattern emerges

## Version History
- v1.0: Initial implementation (had duplicate issue)
- v2.0: Added Airtable tracking (still had duplicates)
- v2.1: Tried numeric checkbox values (422 errors)
- v2.2: **CURRENT** - Boolean values + update-first pattern ✅
