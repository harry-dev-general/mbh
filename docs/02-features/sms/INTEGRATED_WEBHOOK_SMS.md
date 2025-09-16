# Integrated Webhook SMS System

**Last Updated**: September 16, 2025  
**Version**: 2.0

## Overview

The SMS notification system has been integrated directly into the Checkfront webhook handler, replacing the separate Airtable automation. This provides better control over notification logic and reduces system complexity.

## Architecture Change

### Previous Architecture (v1.0)
```
Checkfront → Airtable Webhook → Create/Update Record → Airtable Automation → Twilio SMS
```

### Current Architecture (v2.0)
```
Checkfront → Railway API → Create/Update Record + Send SMS → Twilio API
                         ↓
                    Single Transaction
```

## Benefits of Integration

1. **Single Source of Truth**: All booking logic in one place
2. **Better Control**: Conditional SMS based on status changes
3. **Deduplication**: SMS logic aware of booking updates vs creates
4. **Performance**: No delay waiting for Airtable automations
5. **Debugging**: Unified logs for webhook and SMS

## SMS Notification Logic

### When SMS is Sent

#### New Bookings
- Always sent for new bookings
- Includes full booking details and add-ons

#### Booking Updates
Only sent for significant status changes:
- **Payment Confirmed**: PEND/HOLD → PAID
- **Cancellation**: Any status → VOID/STOP
- **Partial Payment**: PEND/HOLD → PART

#### Not Sent For
- Same status updates (PAID → PAID)
- Minor progressions (PEND → HOLD)
- System updates without status change

### Implementation

```javascript
function isSignificantStatusChange(oldStatus, newStatus) {
  // Always notify for cancellations
  if (newStatus === "VOID" || newStatus === "STOP") return true;
  
  // Notify when payment is confirmed
  if ((oldStatus === "PEND" || oldStatus === "HOLD" || 
       oldStatus === "WAIT" || oldStatus === "PART") 
      && newStatus === "PAID") {
    return true;
  }
  
  // Don't notify for same status
  if (oldStatus === newStatus) return false;
  
  // Don't notify for minor progressions
  if (oldStatus === "PEND" && (newStatus === "HOLD" || newStatus === "WAIT")) return false;
  
  // Notify for partial payment
  if ((oldStatus === "PEND" || oldStatus === "HOLD" || oldStatus === "WAIT") 
      && newStatus === "PART") {
    return true;
  }
  
  return false;
}
```

## Message Templates

### New Booking
```
🚤 Boat Hire Manly - Booking Confirmed

Booking: {code}
Customer: {name}

📅 Date: {formatted_date}
⏰ Time: {start} - {finish}
⏱️ Duration: {duration}

Boat: {boat_type}
Add-ons: {add_ons_list}
Status: {status}

See you at the marina! 🌊
```

### Status Updates

#### Payment Confirmed
```
✅ Boat Hire Manly - Payment Confirmed

Booking: {code}
Customer: {name}

Your payment has been received!
See you on {date} at {time}. 🚤
```

#### Booking Cancelled
```
⚠️ Boat Hire Manly - Booking Cancelled

Booking: {code}
Customer: {name}
Date: {date}

Your booking has been cancelled.
If you have questions, please call us.
```

## Deduplication System

The integrated system maintains the deduplication logic from the original Airtable automation:

1. **Find Best Record**: When multiple records exist for same booking code
   - Prioritize PAID status
   - Use highest total amount
   - Select most complete record

2. **Clean Duplicates**: When updating to PAID status
   - Delete other records with same booking code
   - Preserve the updated record

3. **Preserve Assignments**: During updates
   - Keep existing staff assignments
   - Maintain linked relationships

## Configuration

### Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+61xxxxxxxxx  # Already exists in Railway
SMS_RECIPIENT=+61414960734      # Default recipient (optional)

# Airtable Configuration
AIRTABLE_API_KEY=patxxxxxxxxxx.xxxxxxxxxx
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
```

### Manual Base64 Encoding

For environments without Buffer support:
```javascript
function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}
```

## Error Handling

### SMS Failures Don't Block Webhooks
```javascript
try {
  await sendSMS(SMS_RECIPIENT, messageBody, messageType);
} catch (error) {
  console.error('SMS send failed:', error);
  // Continue processing - don't fail the webhook
}
```

### Twilio Error Responses
Common errors and handling:
- **Invalid credentials**: Check environment variables
- **Invalid phone number**: Verify format (+61...)
- **Rate limit**: Implement retry logic
- **Balance insufficient**: Alert admin, continue webhook

## Testing

### Test Without SMS
```bash
# Remove SMS_RECIPIENT temporarily
unset SMS_RECIPIENT
```

### Test Specific Scenarios

1. **New Booking**: Create booking → Verify SMS sent
2. **Payment Update**: Change PEND → PAID → Verify SMS sent
3. **Duplicate Update**: Update PAID → PAID → Verify NO SMS
4. **Cancellation**: Change to VOID → Verify cancellation SMS

### Debug Logging

Enable detailed logging:
```javascript
console.log(`📱 SMS Decision: shouldSend=${shouldSendSMS}, messageType=${messageType}`);
console.log(`📱 Status Change: ${oldStatus} → ${recordData['Status']}`);
console.log(`📱 Message: ${messageBody.substring(0, 100)}...`);
```

## Migration from Airtable Automation

### Steps Taken

1. **Analysis**: Studied original Airtable scripts for logic
2. **Integration**: Merged SMS logic into webhook handler
3. **Testing**: Verified with test bookings
4. **Deployment**: Pushed to Railway with env vars
5. **Verification**: Confirmed SMS delivery

### Deprecated Components

- Airtable SMS automation script
- Separate deduplication script
- Webhook-triggered SMS automation

## Monitoring

### Railway Logs
```bash
# View recent logs
railway logs --service=mbh-production

# Filter for SMS
railway logs --service=mbh-production | grep "SMS"
```

### Twilio Console
- Message logs: Status, delivery time
- Error reports: Failed sends
- Usage: SMS count and costs

### Airtable History
- Booking updates: Track changes
- Deleted duplicates: Audit trail

## Troubleshooting

### SMS Not Sending

1. **Check Environment**:
   ```bash
   curl https://mbh-production-f0d1.up.railway.app/api/checkfront/test
   # Should show: "twilioConfigured": true
   ```

2. **Verify Credentials**:
   - TWILIO_ACCOUNT_SID starts with "AC"
   - TWILIO_AUTH_TOKEN is correct
   - TWILIO_FROM_NUMBER is verified number

3. **Check Logs**:
   - Look for "SMS sent successfully!" or error messages
   - Verify status change logic triggered

### Wrong Message Format

- Check date formatting (en-AU locale)
- Verify add-ons field populated
- Ensure boat type linked correctly

## Related Documentation

- [Checkfront Webhook Integration](../../03-integrations/checkfront/WEBHOOK_INTEGRATION.md)
- [Original SMS Implementation](./SMS_NOTIFICATION_IMPLEMENTATION_SUMMARY.md)
- [Twilio Setup Guide](../../03-integrations/twilio/SETUP.md)
