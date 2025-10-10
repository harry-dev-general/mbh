# Shift Notification System Setup Guide

## Overview
This guide covers the setup of the SMS notification system for employee shift allocations in the MBH Staff Portal. Employees receive SMS notifications when allocated to shifts and can accept/decline via secure magic links.

## Airtable Field Setup

### 1. Shift Allocations Table (`tbl22YKtQXZtDFtEX`)
Add the following fields to track shift acceptance:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| **Response Status** | Single Select | Options: `Pending`, `Accepted`, `Declined`, `No Response` |
| **Response Date** | Date & Time | When the employee responded |
| **Response Method** | Single Select | Options: `SMS Link`, `Portal`, `Phone`, `In Person` |
| **SMS Sent** | Checkbox | Whether notification SMS was sent |
| **SMS Sent Date** | Date & Time | When the SMS was sent |
| **Reminder Sent** | Checkbox | Whether reminder SMS was sent |
| **Reminder Sent Date** | Date & Time | When reminder was sent |

### 2. Employee Details Table (`tbltAE4NlNePvnkpY`)
Ensure these fields exist:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| **Phone** or **Mobile** | Phone Number | Employee's mobile number for SMS |
| **SMS Notifications** | Checkbox | Whether employee wants SMS notifications |
| **Notification Preferences** | Multiple Select | Options: `Shift Allocations`, `Reminders`, `Updates` |

### 3. Bookings Dashboard Table (`tblRe0cDmK3bG2kPf`)
Already has necessary fields:
- **Onboarding Employee** (Linked Record)
- **Deloading Employee** (Linked Record)

## Environment Variables Setup

Add these to your `.env` file (or Railway environment variables):

```env
# Twilio Configuration (Replace with your actual values)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_FROM_NUMBER=your_twilio_phone_number

# Base URL for magic links
BASE_URL=https://mbh-production-f0d1.up.railway.app

# Manager notification numbers (optional)
MANAGER_PHONE_1=your_manager_phone_1
MANAGER_PHONE_2=your_manager_phone_2

# Airtable Configuration (already exists)
AIRTABLE_API_KEY=patYiJdXfvcSenMU4...
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
```

## SMS Notification Flow

### 1. When Shift is Allocated
```javascript
// Triggered in management-allocations.html after allocation
fetch('/api/send-shift-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        employeeId: 'recXXXXX',
        allocationId: 'recYYYYY',
        shiftType: 'Boat Hire',
        shiftDate: '2025-08-27',
        startTime: '09:00',
        endTime: '17:00',
        customerName: 'John Smith', // for booking allocations
        role: 'Onboarding', // if applicable
        isBookingAllocation: true
    })
});
```

### 2. SMS Message Format

#### For Booking Allocations:
```
🚤 MBH Staff Alert - New Onboarding Assignment

Hi Sarah,

You've been assigned to a customer booking:

📅 Wed, 27 Aug
⏰ 08:30 - 09:30
👤 Customer: John Smith
📋 Role: Onboarding

Please confirm your availability:

✅ ACCEPT: [magic link]

❌ DECLINE: [magic link]

Reply by clicking a link above.
```

#### For General Shifts:
```
📋 MBH Staff Alert - New Shift Assignment

Hi Sarah,

You've been assigned a new shift:

📅 Wed, 27 Aug
⏰ 09:00 - 17:00
📋 Type: General Operations

Please confirm your availability:

✅ ACCEPT: [magic link]

❌ DECLINE: [magic link]

Reply by clicking a link above.
```

### 3. Magic Link Security
- Links contain secure, random 32-byte tokens
- Tokens expire after 72 hours
- Each token can only be used once
- Tokens are validated server-side before processing

### 4. Response Handling
When employee clicks a link:
1. Token is validated
2. Airtable record is updated with response
3. Confirmation SMS is sent to employee
4. If declined, management is notified

## Testing the System

### 1. Test SMS Notification
```bash
curl -X POST https://mbh-production-f0d1.up.railway.app/api/send-shift-notification \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "recU2yfUOIGFsIuZV",
    "allocationId": "recTestAllocation",
    "shiftType": "General Operations",
    "shiftDate": "2025-08-28",
    "startTime": "09:00",
    "endTime": "17:00",
    "isBookingAllocation": false
  }'
```

### 2. Test Magic Link
Visit: `https://mbh-production-f0d1.up.railway.app/api/shift-response?token=TEST_TOKEN`

### 3. Check Response Status
```bash
curl https://mbh-production-f0d1.up.railway.app/api/shift-status/recAllocationId
```

## UI Updates in my-schedule.html

The employee schedule page now shows:
- Response status badge (Pending/Accepted/Declined)
- Accept/Deny buttons for pending shifts
- Response date/time for confirmed shifts
- Visual indicators:
  - 🟡 Yellow = Pending response
  - 🟢 Green = Accepted
  - 🔴 Red = Declined

## Reminder System (Optional Enhancement)

Set up an Airtable automation to send reminders:

### Trigger Conditions:
- Response Status = "Pending"
- Shift Date is within 24 hours
- Reminder Sent = false

### Action:
Call webhook to `/api/send-shift-reminder` endpoint

## Security Considerations

1. **Token Storage**: Currently using in-memory storage. For production, consider:
   - Redis for token storage
   - Database table for audit trail
   
2. **Phone Number Validation**: Add validation to ensure phone numbers are in correct format

3. **Rate Limiting**: Consider adding rate limiting to prevent SMS spam

4. **HTTPS Only**: Ensure all magic links use HTTPS in production

## Troubleshooting

### SMS Not Sending
1. Check Twilio credentials in environment variables
2. Verify phone number format (+61XXXXXXXXX for Australian numbers)
3. Check Twilio account balance
4. Review server logs for error messages

### Magic Links Not Working
1. Check token expiry (72 hours)
2. Verify BASE_URL environment variable
3. Check if token was already used
4. Review server logs for validation errors

### Airtable Updates Failing
1. Verify AIRTABLE_API_KEY is correct
2. Check field names match exactly (case-sensitive)
3. Ensure linked records are arrays
4. Check API rate limits (5 req/sec)

## Next Steps

1. **Add to Allocation Form**: Update management-allocations.html to trigger SMS on allocation
2. **Add Reminder Automation**: Set up Airtable automation for shift reminders
3. **Add Analytics**: Track response rates and times
4. **Add Bulk Notifications**: For notifying multiple employees at once
5. **Add Template System**: For customizable message templates

---
*Created: August 2025*
*Version: 1.0*
