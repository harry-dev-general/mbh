# Deloading Reminder Bug Analysis - October 23, 2025

## Problem Description
User created a test booking with:
- Start Time: 7:17 PM → Onboarding: 6:47 PM
- Finish Time: 7:19 PM → Deloading: 6:49 PM

Result:
- ✅ Onboarding reminder was sent at 6:47 PM
- ❌ Deloading reminder was marked as sent at 6:47:13 PM but NO SMS was actually sent

## Root Cause Analysis

The bug is in the `processBookingReminders` function in `booking-reminder-scheduler-fixed.js`:

```javascript
// Check deloading reminders
if (fields['Deloading Time'] && 
    (forceImmediate || shouldSendReminder(booking, 'deloading'))) {
    
    // Mark as sent FIRST to prevent duplicates  ← BUG HERE!
    const marked = await markReminderSent(booking.id, 'deloading');
    
    if (marked) {
        // ... get recipients and send SMS ...
    }
}
```

### The Problem:
1. The code marks the reminder as sent BEFORE actually sending the SMS messages
2. If there's any error in:
   - Getting the employee records
   - Building the recipient list
   - Sending the actual SMS
   - The reminder is still marked as sent, preventing future attempts

### Why it happened at 6:47:13 PM:
The scheduler runs every minute. At 6:47:00, the deloading time (6:49 PM) was within the 2-minute window, so:
1. The condition passed
2. It marked the reminder as sent in Airtable
3. But then failed to send the actual SMS (possibly no recipients found or SMS error)

## Solution

Move the `markReminderSent` call to AFTER successfully sending at least one SMS:

```javascript
// Check deloading reminders
if (fields['Deloading Time'] && 
    (forceImmediate || shouldSendReminder(booking, 'deloading'))) {
    
    const recipients = new Set();
    
    // Add assigned deloading staff
    if (fields['Deloading Employee']?.length) {
        for (const employeeId of fields['Deloading Employee']) {
            const employee = await getEmployeeById(employeeId);
            if (employee) recipients.add(employee);
        }
    }
    
    // Add all full-time staff
    fullTimeStaff.forEach(staff => recipients.add(staff));
    
    // Send reminders
    let sentCount = 0;
    for (const recipient of recipients) {
        try {
            await sendDeloadingReminder(booking, recipient);
            sentCount++;
        } catch (error) {
            console.error(`Failed to send deloading reminder to ${recipient.fields['Name']}:`, error);
        }
    }
    
    // Only mark as sent if at least one SMS was successfully sent
    if (sentCount > 0) {
        await markReminderSent(booking.id, 'deloading');
    }
}
```

This ensures:
1. We only mark as sent after successfully sending at least one SMS
2. If all SMS attempts fail, the reminder won't be marked as sent
3. The scheduler will retry on the next run (1 minute later)
</contents>
