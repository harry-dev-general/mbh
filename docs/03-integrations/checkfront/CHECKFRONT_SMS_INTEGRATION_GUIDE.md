# Checkfront Webhook with SMS Integration Guide

## Overview

The Checkfront webhook handler now includes integrated SMS notifications, eliminating the need for separate Airtable automations. All booking processing and SMS sending happens in one place on the Railway server.

## Features

### 1. Duplicate Management
- Automatically detects existing bookings by booking code
- Updates existing records instead of creating duplicates
- Preserves staff assignments when updating
- Deletes duplicate records when booking is marked as PAID

### 2. Smart SMS Notifications
- **New Bookings**: Sends confirmation with full booking details including add-ons
- **Status Updates**: Only sends SMS for significant changes:
  - Payment confirmed (→ PAID)
  - Partial payment received (→ PART)
  - Booking cancelled (→ VOID/STOP)
- **Avoids Spam**: Doesn't send SMS for minor status changes (PEND → HOLD, etc.)

### 3. Message Templates

#### New Booking Confirmation
```
🚤 Boat Hire Manly - Booking Confirmed

Booking: KSDA-160925
Customer: John Smith

📅 Date: Tuesday, 17 Sep 2025
⏰ Time: 08:45 am - 01:00 pm
⏱️ Duration: 4 hours 15 minutes

Boat: 12personbbqboat-halfday
Add-ons: Lilly Pad - $55.00, Fishing Rods - $20.00
Status: PEND

See you at the marina! 🌊
```

#### Payment Confirmation
```
✅ Boat Hire Manly - Payment Confirmed

Booking: KSDA-160925
Customer: John Smith

Your payment has been received!
See you on Tuesday, 17 Sep 2025 at 08:45 am. 🚤
```

#### Cancellation Notice
```
⚠️ Boat Hire Manly - Booking Cancelled

Booking: KSDA-160925
Customer: John Smith
Date: Tuesday, 17 Sep 2025

Your booking has been cancelled.
If you have questions, please call us.
```

## Environment Variables

Add these to your Railway environment:

```bash
# Existing variables
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx

# New Twilio variables
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+61483919629   # Already exists in Railway
SMS_RECIPIENT=+61414960734         # Default recipient (optional)
```

## Setup Instructions

### 1. Update Railway Environment Variables
1. Go to your Railway project dashboard
2. Navigate to Variables
3. Add the Twilio environment variables above
4. Railway will automatically redeploy with the new variables

### 2. Verify Configuration
Test that SMS is configured by visiting:
```
https://mbh-production-f0d1.up.railway.app/api/checkfront/test
```

You should see:
```json
{
  "success": true,
  "message": "Checkfront webhook handler is running",
  "timestamp": "2025-09-16T05:30:00.000Z",
  "twilioConfigured": true  // Should be true
}
```

### 3. Test SMS Functionality
Create a test booking in Checkfront and verify:
1. Booking is created in Airtable
2. SMS is sent with booking confirmation
3. Check Railway logs for SMS status

## Important Notes

### Twilio Credentials
- Never commit Twilio credentials to code
- Always use environment variables
- Rotate credentials periodically

### SMS Rate Limiting
- The system prevents duplicate SMS for minor updates
- Only significant status changes trigger SMS
- Each booking update is evaluated for SMS necessity

### Error Handling
- If SMS fails, the booking is still processed
- SMS errors are logged but don't block webhook processing
- Check Railway logs for SMS send status

## Migration from Airtable Automation

1. **Disable Old Automation**: Turn off the Airtable webhook automation
2. **Remove SMS Script**: The separate SMS script is no longer needed
3. **All-in-One**: Everything now happens in the Railway webhook handler

## Monitoring

### Railway Logs
View real-time logs in Railway dashboard to see:
- Incoming webhooks
- Booking processing
- SMS send status
- Any errors

### Log Examples
```
🚀 Checkfront webhook received
📦 Processing 4 items
  Item 1: 12personbbqboat-halfday (Category: 2, Qty: 1, Price: $550)
    ✅ Identified as BOAT
  Item 2: lillypad (Category: 7, Qty: 1, Price: $55)
    ✅ Identified as ADD-ON: Lilly Pad - $55.00
✨ Creating new booking: KSDA-160925
✅ SMS sent successfully!
✅ Successfully created booking KSDA-160925 (SMS sent)
```

## Troubleshooting

### SMS Not Sending
1. Check Twilio credentials in Railway environment
2. Verify phone numbers are in correct format (+61...)
3. Check Twilio account balance and status
4. Review Railway logs for specific errors

### Duplicate Messages
- System tracks status changes to prevent duplicates
- Only significant changes trigger SMS
- Check logs to see why SMS was/wasn't sent

### Testing Without SMS
To test without sending SMS, temporarily remove Twilio credentials from Railway environment.

## Future Enhancements

Consider adding:
- Multiple SMS recipients based on booking type
- Customer SMS notifications (with opt-in)
- WhatsApp integration
- SMS delivery status tracking
