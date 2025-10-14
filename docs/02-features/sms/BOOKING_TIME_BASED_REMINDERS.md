# Booking Time-Based SMS Reminders

**Date**: October 14, 2025  
**Feature**: Automatic SMS reminders at Onboarding and Deloading times  
**Status**: Ready for Implementation

## Overview

This feature sends automatic SMS reminders to staff members at specific times related to customer bookings:
- **Onboarding Reminder**: Sent at the "Onboarding Time" (30 minutes before boarding)
- **Deloading Reminder**: Sent at the "Deloading Time" (30 minutes before return)

## Recipients

For each reminder, SMS is sent to:
1. **Assigned Staff**: The staff member assigned to the Onboarding/Deloading role
2. **All Full-Time Staff**: Currently Max and Joshua (identified by Staff Type = "Full Time")

## SMS Content

### Onboarding Reminder
```
📅 MBH Onboarding Reminder

Customer: Ben Smith
Vessel: Sandstone
Boarding Time: 12:30 PM

Add-ons: 2x Fishing Rods, Ice Box

Pre-Departure Checklist:
https://mbh-portal.com/training/pre-departure-checklist.html?bookingId=recXXX

Please ensure vessel is ready before customer arrival.
```

### Deloading Reminder
```
🏁 MBH Deloading Reminder

Customer: Ben Smith
Vessel: Sandstone
Finish Time: 4:30 PM

Post-Departure Checklist:
https://mbh-portal.com/training/post-departure-checklist.html?bookingId=recXXX

Please prepare for customer return and complete vessel check.
```

## Technical Implementation

### Architecture
- **Scheduler**: Runs every minute to check for reminders due
- **Time Matching**: Sends when current time matches Onboarding/Deloading time (±1 minute)
- **Duplicate Prevention**: Tracks sent reminders to avoid duplicates within 20 hours
- **Timezone**: All times in Sydney timezone

### Key Components

1. **`/api/booking-reminder-scheduler.js`**
   - Core scheduling logic
   - Time parsing and comparison
   - SMS sending via Twilio

2. **Integration with server.js**
   - Starts scheduler on server startup
   - Admin endpoints for monitoring

3. **Airtable Fields Used**
   - `Onboarding Time` (formula field)
   - `Deloading Time` (formula field)
   - `Onboarding Employee` (linked record)
   - `Deloading Employee` (linked record)
   - `Staff Type` (from Employee Details)

### Checklist Links

The SMS includes direct links to the appropriate checklist:
- Pre-Departure: `/training/pre-departure-checklist.html?bookingId={bookingId}`
- Post-Departure: `/training/post-departure-checklist.html?bookingId={bookingId}`

These links automatically pre-select the booking, allowing staff to immediately complete the checklist.

## Configuration

### Environment Variables
```bash
# Required for SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Base URL for links
BASE_URL=https://mbh-production-f0d1.up.railway.app
```

### Timing Configuration
```javascript
// In booking-reminder-scheduler.js
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
```

## Admin Tools

### Check Scheduler Status
```bash
GET /api/admin/booking-reminder-status
Headers: X-Admin-Key: mbh-admin-2025
```

### Manual Trigger (Testing)
```bash
POST /api/admin/trigger-booking-reminders
Headers: X-Admin-Key: mbh-admin-2025
```

## How It Works

1. **Every Minute**: Scheduler checks all bookings for today
2. **Time Comparison**: Compares current time with Onboarding/Deloading times
3. **Recipient Collection**:
   - Gets assigned staff from booking
   - Gets all Full-Time staff
   - Removes duplicates
4. **SMS Sending**: Sends personalized SMS to each recipient
5. **Tracking**: Records sent reminders to prevent duplicates

## Testing

### Test Scenario
1. Create a booking for today
2. Set Onboarding Employee (e.g., Bronte)
3. Set Start Time (Onboarding Time will be 30 min before)
4. Wait for Onboarding Time
5. Verify SMS received by:
   - Bronte (assigned staff)
   - Max (Full-Time)
   - Joshua (Full-Time)

### Manual Testing
```javascript
// From browser console on admin page
fetch('/api/admin/trigger-booking-reminders', {
    method: 'POST',
    headers: { 'X-Admin-Key': 'mbh-admin-2025' }
}).then(r => r.json()).then(console.log)
```

## Monitoring

### Log Output
```
🚀 Starting booking time-based reminder scheduler...
Found 5 bookings today, 2 full-time staff
📤 Sent onboarding reminder to Bronte for Ben Smith
📤 Sent onboarding reminder to Max for Ben Smith
📤 Sent onboarding reminder to Joshua for Ben Smith
```

### Common Issues

1. **No SMS Sent**
   - Check Twilio credentials
   - Verify phone numbers in Employee Details
   - Check booking has valid status (PAID/PART/Confirmed)

2. **Wrong Recipients**
   - Verify Staff Type field is set correctly
   - Check Employee assignments in booking

3. **Timing Issues**
   - Ensure server timezone is Sydney
   - Check Onboarding/Deloading Time formulas

## Benefits

1. **Timely Notifications**: Staff reminded exactly when needed
2. **No Manual Work**: Fully automated based on booking times
3. **Full Coverage**: Full-Time staff always informed
4. **Direct Action**: Links go straight to checklists
5. **Vessel Preparation**: Ensures boats ready for customers

## Future Enhancements

1. **Configurable Lead Time**: Adjust how early reminders are sent
2. **Role-Based Recipients**: Different staff groups for different vessels
3. **Weather Integration**: Include weather info in reminders
4. **Response Tracking**: Track who viewed/completed checklists
5. **Escalation**: Alert management if checklists not completed

## Integration with Existing Systems

This feature complements:
- **Shift Reminder System**: 6-hour reminders for pending shifts
- **Initial Allocation SMS**: Immediate notification when assigned
- **Checklist System**: Direct integration via bookingId parameter

All SMS systems use the same:
- Twilio configuration
- Phone number lookup logic
- Error handling patterns
