# Booking Time-Based SMS Reminders - Deployment Guide

**Date**: October 14, 2025  
**Feature**: SMS reminders at Onboarding/Deloading times  
**Status**: Ready for Deployment

## What's Been Implemented

### 1. New Module: `/api/booking-reminder-scheduler.js`
- Sends SMS at exact Onboarding and Deloading times
- Recipients: Assigned staff + all Full-Time staff (Max & Joshua)
- Includes vessel details, add-ons, and checklist links
- Checks every minute for precision timing
- Prevents duplicates within 20 hours

### 2. Server Integration: `/server.js`
- Imports and starts booking reminder scheduler
- Added admin endpoints for monitoring and testing
- Graceful shutdown handling

### 3. Documentation
- Complete feature documentation in `/docs/02-features/sms/BOOKING_TIME_BASED_REMINDERS.md`
- This deployment guide

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Created booking-reminder-scheduler.js
- [x] Updated server.js to import and start scheduler
- [x] Added admin endpoints for monitoring
- [x] Added graceful shutdown handling

### ⚠️ Environment Variables Required
Ensure these are set in Railway:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  
TWILIO_FROM_NUMBER=+your_phone_number
AIRTABLE_API_KEY=your_airtable_key
BASE_URL=https://mbh-production-f0d1.up.railway.app
```

### 📋 Airtable Requirements
No new fields needed! Uses existing:
- `Onboarding Time` (formula field)
- `Deloading Time` (formula field)
- `Staff Type` in Employee Details table
- Phone number fields in Employee Details

## Deployment Steps

1. **Commit Changes**
```bash
git add .
git commit -m "Add booking time-based SMS reminders for onboarding/deloading"
git push origin main
```

2. **Deploy to Railway**
- Automatic deployment should trigger
- Verify deployment logs show:
  ```
  🚀 Starting booking time-based reminder scheduler...
     - Checking every 60 seconds
     - Sending reminders at Onboarding Time and Deloading Time
     - Recipients: Assigned staff + all Full Time staff
  ```

3. **Verify Deployment**
```bash
# Check status
curl https://mbh-production-f0d1.up.railway.app/api/admin/booking-reminder-status \
  -H "X-Admin-Key: mbh-admin-2025"

# Should return:
{
  "active": true,
  "checkInterval": "1 minute",
  "reminderTypes": ["Onboarding Time", "Deloading Time"],
  "recipients": "Assigned staff + All Full-Time staff",
  ...
}
```

## Testing in Production

### Quick Test
1. Create a test booking for today
2. Set Onboarding Time to ~5 minutes from now
3. Assign a staff member (e.g., Test Staff)
4. Wait for the time
5. Verify SMS received by:
   - Assigned staff
   - Max (Full-Time)
   - Joshua (Full-Time)

### Manual Trigger (Testing)
```bash
curl -X POST https://mbh-production-f0d1.up.railway.app/api/admin/trigger-booking-reminders \
  -H "X-Admin-Key: mbh-admin-2025"
```

## Monitoring

### Check Logs
Look for these patterns in Railway logs:
```
Found X bookings today, Y full-time staff
📤 Sent onboarding reminder to [Name] for [Customer]
📤 Sent deloading reminder to [Name] for [Customer]
```

### Common Log Messages
- `No phone number for [Name]` - Staff missing phone number
- `Found 0 bookings today` - No bookings with PAID/PART/Confirmed status
- `Error sending reminder` - Twilio issue, check credentials

## Rollback Plan

If issues occur:

1. **Quick Disable** (without code changes)
   - Set env var: `DISABLE_BOOKING_REMINDERS=true`
   - Restart Railway app

2. **Code Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Post-Deployment

### Monitor for 24 Hours
- Check Railway logs every few hours
- Verify no duplicate SMS complaints
- Confirm Full-Time staff receiving reminders

### Success Metrics
- SMS sent at correct times (±1 minute)
- All recipients receive SMS
- Checklist links work correctly
- No duplicate messages

## Integration Points

This feature integrates with:
1. **Existing SMS System** - Uses same Twilio setup
2. **Checklist System** - Links include bookingId parameter
3. **Shift Reminder System** - Runs alongside 6-hour reminders

## Support Information

### If SMS Not Sending
1. Check Twilio credentials in Railway
2. Verify phone numbers in Employee Details
3. Check booking status is PAID/PART/Confirmed
4. Ensure Onboarding/Deloading Time fields have values

### If Wrong Recipients
1. Verify Staff Type = "Full Time" for Max and Joshua
2. Check Employee assignments in booking
3. Review logs for recipient list

### If Timing Issues
1. Verify server timezone (should be Sydney)
2. Check Onboarding/Deloading Time formulas in Airtable
3. Look for "shouldSendReminder" logs

## Contact

For issues after deployment:
1. Check Railway logs
2. Review this guide
3. Test with manual trigger endpoint
4. Document any new patterns discovered
