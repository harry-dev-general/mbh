# Booking SMS Duplicate Reminders Fix - October 19, 2025

## Executive Summary

The booking SMS reminder system is experiencing duplicate messages due to using in-memory tracking instead of persistent storage. This is the same issue that was previously fixed for shift allocations but not yet implemented for booking reminders.

## Root Cause Analysis

### The Problem
The booking reminder system (`/api/booking-reminder-scheduler.js`) uses in-memory tracking:
```javascript
// Line 19: Track sent reminders in memory (will reset on restart)
const sentReminders = new Map(); // Key: `${bookingId}-${type}-${date}`, Value: timestamp
```

When Railway runs multiple instances of the app:
1. Each instance has its own `sentReminders` Map
2. Instance A sends SMS at 8:15 AM, tracks in its memory
3. Instance B checks at 8:16 AM, doesn't see Instance A's tracking
4. Instance B sends duplicate SMS

### Evidence from Logs
- The logs show the system checking bookings every minute
- "Will send: false" appears consistently (no SMS shown in these logs)
- The actual duplicate SMS are likely being sent at the exact reminder times (8:15 AM for onboarding, 12:15 PM for deloading)

## The Solution

### 1. Add Tracking Fields to Airtable
Based on the previous fix for shift allocations, we need to add these fields to the Bookings Dashboard table:
- **Onboarding Reminder Sent**: Checkbox
- **Onboarding Reminder Sent Date**: DateTime
- **Deloading Reminder Sent**: Checkbox  
- **Deloading Reminder Sent Date**: DateTime

### 2. Update booking-reminder-scheduler.js
Replace in-memory tracking with Airtable field updates:

```javascript
// Before sending reminder
async function shouldSendReminder(booking, type) {
    const fieldName = type === 'onboarding' ? 
        'Onboarding Reminder Sent' : 'Deloading Reminder Sent';
    const dateFieldName = type === 'onboarding' ? 
        'Onboarding Reminder Sent Date' : 'Deloading Reminder Sent Date';
    
    // Check if already sent
    if (booking.fields[fieldName]) {
        const sentDate = booking.fields[dateFieldName];
        // Check if enough time has passed for a repeat reminder
        // (if implementing repeat reminders)
        return false;
    }
    
    return true;
}

// After sending reminder
async function markReminderSent(bookingId, type) {
    const fields = {};
    if (type === 'onboarding') {
        fields['Onboarding Reminder Sent'] = true;
        fields['Onboarding Reminder Sent Date'] = new Date().toISOString();
    } else {
        fields['Deloading Reminder Sent'] = true;
        fields['Deloading Reminder Sent Date'] = new Date().toISOString();
    }
    
    await axios.patch(
        `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
        { fields },
        { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } }
    );
}
```

### 3. Update the Process Flow
1. **Before sending**: Check Airtable fields instead of in-memory Map
2. **Update fields first**: Mark as sent BEFORE sending SMS
3. **Send SMS**: Only if update successful
4. **Handle failures**: If SMS fails, unmark the reminder

## Implementation Steps

1. **Add fields to Airtable** (via Airtable UI)
   - Go to Bookings Dashboard table
   - Add the 4 new fields mentioned above

2. **Update booking-reminder-scheduler.js**
   - Remove in-memory Map
   - Add Airtable field checking
   - Update reminder marking logic

3. **Test the fix**
   - Use admin endpoint to trigger test
   - Verify only one SMS sent per reminder
   - Check Airtable fields update correctly

## Current Bookings (October 19, 2025)

From the logs, today's bookings are:
1. **DANIELLE DEAN** - Onboarding: 8:15 AM, Deloading: 12:15 PM
2. **Aimee Liang** - Onboarding: 11:30 AM, Deloading: 3:30 PM
3. **Grace Mason** - Onboarding: 8:15 AM, Deloading: 12:15 PM

## Admin Endpoints

- Check status: `GET /api/admin/booking-reminder-status`
- Force send: `POST /api/admin/trigger-booking-reminders?forceImmediate=true`

## Key Differences from Shift Allocation Fix

1. **Table**: Bookings Dashboard vs Shift Allocations
2. **Fields**: Need separate fields for onboarding/deloading
3. **Timing**: Exact time match vs 6-hour intervals
4. **Recipients**: Assigned staff + all Full Time staff

## Prevention

This fix ensures:
- All Railway instances share the same tracking data
- Reminders are sent exactly once
- Status is visible in Airtable
- Works across deployments and restarts
