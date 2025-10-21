# Booking SMS Reminder System Monitoring Guide
**Created**: October 21, 2025
**Purpose**: Monitor the fixed booking reminder system to ensure no duplicate SMS are sent

## Executive Summary

On October 21, 2025, we discovered that server.js was still referencing the old in-memory booking reminder scheduler instead of the fixed version with Airtable persistence. This was causing duplicate SMS reminders in production.

**Critical Fix Applied**: 
- Changed `require('./api/booking-reminder-scheduler')` to `require('./api/booking-reminder-scheduler-fixed')`
- Deployed at approximately 10:00 AM Sydney time

## System Components

### Fixed Implementation
- **File**: `/api/booking-reminder-scheduler-fixed.js`
- **Tracking Method**: Airtable fields (persistent across instances)
- **Fields Used**:
  - `Onboarding Reminder Sent` (checkbox)
  - `Onboarding Reminder Sent Date` (datetime)
  - `Deloading Reminder Sent` (checkbox)
  - `Deloading Reminder Sent Date` (datetime)

### Key Features
1. **Update-First Pattern**: Marks reminder as sent BEFORE sending SMS
2. **Persistent Storage**: Uses Airtable instead of in-memory Map
3. **Multi-Instance Safe**: Works across Railway's multiple instances

## Monitoring Checklist

### 1. Railway Deployment Logs
Check for these key messages:
```
🚀 Starting booking reminder scheduler (FIXED VERSION with Airtable tracking)...
   - Using Airtable fields instead of in-memory tracking
   - Prevents duplicates across multiple instances
```

### 2. Airtable Field Verification
Monitor the Bookings Dashboard table (tblRe0cDmK3bG2kPf):
- [ ] Onboarding Reminder Sent checkboxes being set
- [ ] Onboarding Reminder Sent Date populated with timestamps
- [ ] Deloading Reminder Sent checkboxes being set
- [ ] Deloading Reminder Sent Date populated with timestamps

### 3. Log Patterns to Monitor

**Successful Operation**:
```
✅ Marked onboarding reminder as sent for booking recXXXXX
📤 Sent onboarding reminder to [Staff Name] for [Customer Name]
```

**Time Checking**:
```
⏰ Time check for onboarding reminder:
   Target time: 8:15 AM (495 minutes)
   Current time: 8:15 (495 minutes)
   Time difference: 0 minutes
   Will send: true
```

**Error Patterns**:
```
Error marking onboarding reminder as sent: [error details]
Error sending onboarding reminder: [error details]
```

### 4. Test Verification Process

1. **Create Test Booking**:
   - Set onboarding time 5-10 minutes in future
   - Assign onboarding staff
   - Ensure status is PAID/PART/Confirmed

2. **Monitor at Reminder Time**:
   - Check Railway logs for processing
   - Verify SMS received by:
     - Assigned staff
     - Full-time staff (Max, Joshua)
   - Check Airtable fields updated

3. **Verify No Duplicates**:
   - Wait 2-3 minutes after first SMS
   - Confirm no duplicate SMS sent
   - Check logs show "already sent" messages

## Common Issues & Solutions

### Issue 1: No SMS Sent
**Symptoms**: Logs show processing but no SMS received
**Checks**:
- Verify Twilio credentials in environment
- Check staff phone numbers in Airtable
- Confirm booking status is valid

### Issue 2: Airtable Update Fails
**Symptoms**: "Error marking reminder as sent"
**Checks**:
- Verify Airtable API key is valid
- Check network connectivity
- Ensure fields exist in table

### Issue 3: Time Zone Mismatch
**Symptoms**: Reminders sent at wrong times
**Checks**:
- Verify Sydney timezone in logs
- Check time parsing output
- Confirm server timezone settings

## SQL Queries for Analysis

### Find Today's Bookings
```javascript
// In browser console or script
const today = new Date().toISOString().split('T')[0];
filterByFormula: `AND({Booking Date} = '${today}', OR({Status} = 'PAID', {Status} = 'PART', {Status} = 'Confirmed'))`
```

### Check Reminder Status
```javascript
filterByFormula: `AND({Booking Date} = '${today}', {Onboarding Reminder Sent} = TRUE())`
```

## Monitoring Timeline

### First 24 Hours (Critical)
- [ ] Every 2 hours: Check Railway logs
- [ ] Every booking time: Verify single SMS sent
- [ ] After each reminder: Check Airtable fields

### Days 2-7 (Stabilization)
- [ ] Daily: Review all bookings for duplicates
- [ ] Daily: Check error patterns in logs
- [ ] Daily: Verify field updates

### Ongoing (Maintenance)
- [ ] Weekly: Audit reminder history
- [ ] Monthly: Performance review
- [ ] Quarterly: System optimization

## Emergency Procedures

### If Duplicates Detected
1. **Immediate**: Check which scheduler is running in server.js
2. **Verify**: Deployment actually used fixed version
3. **Rollback**: If needed, manually update server.js again
4. **Document**: Add findings to this guide

### If SMS Not Sending
1. **Check**: Airtable fields - are they being updated?
2. **Verify**: Twilio account status and credentials
3. **Test**: Use admin endpoint to force send
4. **Escalate**: Contact system administrator

## Admin Endpoints

### Check Current Status
```bash
GET https://mbh-production-f0d1.up.railway.app/api/admin/booking-reminder-status
Headers: X-Admin-Key: mbh-admin-2025
```

### Force Send Test
```bash
POST https://mbh-production-f0d1.up.railway.app/api/admin/trigger-booking-reminders?forceImmediate=true
Headers: X-Admin-Key: mbh-admin-2025
```

## Related Documentation
- [SMS Booking Reminders Duplication Journey](./SMS_BOOKING_REMINDERS_DUPLICATION_JOURNEY.md)
- [Booking SMS Duplicate Fix Oct 2025](./BOOKING_SMS_DUPLICATE_FIX_OCT_2025.md)
- [SMS Duplicate Reminders Fix (Shift Allocations)](./SMS_DUPLICATE_REMINDERS_FIX.md)

## Initial Findings - October 21, 2025

### Discovery
At 10:00 AM Sydney time, discovered that server.js was still using the old in-memory scheduler despite the fixed version being created and documented. This explains why duplicate SMS were still being sent in production.

### Fix Applied
- Updated server.js to use booking-reminder-scheduler-fixed.js
- Committed with message: "CRITICAL FIX: Use booking-reminder-scheduler-fixed.js instead of old scheduler"
- Deployed to Railway via git push

### Next Steps
1. Monitor Railway logs for deployment completion
2. Verify scheduler starts with "FIXED VERSION" message
3. Watch for today's bookings and reminder sending
4. Document any issues that arise

## Log Samples

### Expected Startup Log
```
🚀 Starting booking reminder scheduler (FIXED VERSION with Airtable tracking)...
   - Using Airtable fields instead of in-memory tracking
   - Prevents duplicates across multiple instances
```

### Expected Processing Log
```
⏰ Running booking reminder check...
Found 3 bookings today, 2 full-time staff
Current Sydney time: 11:30:00 AM

📋 Checking booking DANIELLE DEAN:
   Onboarding Time: 8:15 AM
   Deloading Time: 12:15 PM
   Deloading reminder already sent at 2025-10-19T02:15:00.000Z

📋 Checking booking Aimee Liang:
   Onboarding Time: 11:30 AM
   Deloading Time: 3:30 PM
⏰ Time check for onboarding reminder:
   Target time: 11:30 AM (690 minutes)
   Current time: 11:30 (690 minutes)
   Time difference: 0 minutes
   Will send: true
✅ Marked onboarding reminder as sent for booking recABC123
📤 Sent onboarding reminder to Bronte for Aimee Liang
   Message SID: SMxxxxxxxxxxxxxxxx
```
