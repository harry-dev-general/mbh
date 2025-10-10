# Webhook SMS + Deduplication Integration

## Your Current Setup
1. **Webhook received** → Booking data from website
2. **Script 1** → Convert timestamps to Sydney time
3. **Create record** → New record in Bookings Dashboard
4. **Script 2** → Send SMS notification

## The Problem
When deduplication runs, it might delete the record right after SMS is sent, causing confusion.

## Solution: Enhanced SMS Script

### Step 1: Update SMS Script Input Variables

In your automation, between "Create record" and "Run a script" (SMS), you need to add the record ID as an input variable:

**Add this input variable to your SMS script:**
- Variable name: `recordId`
- Value: Click the dynamic value picker → Select "Create record" step → Choose "Airtable record ID"

Your input variables should now include:
- customerName
- bookingItems
- startDate
- startTime
- endTime
- bookingDurationFormatted
- status
- bookingCode
- **recordId** ← New!

### Step 2: Replace Your SMS Script

Replace your current SMS script with the enhanced version from `airtable-webhook-sms-enhanced.js`

This enhanced script:
1. Checks if the booking is a duplicate
2. Only sends SMS for significant changes
3. Uses different message templates based on the change type

### Step 3: Add Deduplication Automation

Create a new automation:
- **Name**: "Booking Deduplication"
- **Trigger**: When record created in Bookings Dashboard
- **Action**: Run script → Use `airtable-booking-deduplication-enhanced.js`
- **Input**: recordId from trigger

## How They Work Together

### Scenario 1: New Booking
```
Webhook → Create record (pending) → SMS: "🚤 Booking Confirmed" → Dedup: Keep record
```

### Scenario 2: Payment Update
```
Webhook → Create record (Paid) → SMS: "✅ Payment Confirmed" → Dedup: Merge & delete duplicate
```

### Scenario 3: Minor Update
```
Webhook → Create record (held) → SMS: Not sent → Dedup: Merge & delete duplicate
```

## Message Templates

The enhanced script provides different messages:

**New Booking:**
```
🚤 Boat Hire Manly - Booking Confirmed
Booking: BK123
Customer: John Smith
📅 Date: Saturday, 21 Dec 2024
⏰ Time: 10:00 AM - 12:00 PM
```

**Payment Confirmed:**
```
✅ Boat Hire Manly - Payment Confirmed
Booking: BK123
Your payment has been received!
See you on Saturday, 21 Dec 2024 at 10:00 AM. 🚤
```

**Cancellation:**
```
⚠️ Boat Hire Manly - Booking Cancelled
Booking: BK123
Your booking has been cancelled.
If you have questions, please call us.
```

## Testing Steps

1. **Test new booking**: 
   - Send webhook with new booking (pending)
   - Should receive "Booking Confirmed" SMS
   - Record should remain

2. **Test payment update**:
   - Send webhook with same booking code, status = Paid
   - Should receive "Payment Confirmed" SMS
   - Duplicate should be merged

3. **Test minor change**:
   - Send webhook changing pending → held
   - Should NOT receive SMS
   - Duplicate should be merged

## Important Notes

1. **Timing**: The SMS script runs immediately after record creation, so it can check for duplicates before deduplication automation runs

2. **Booking Code**: Essential for duplicate detection - ensure your webhook always includes this

3. **Customer Communication**: Customers only get notified about meaningful changes:
   - Initial booking confirmation
   - Payment confirmation
   - Cancellations

4. **Staff Notification**: This is customer-facing SMS. You may want separate internal notifications for staff.

## Rollback Plan

If issues occur:
1. Revert to your original SMS script
2. Disable deduplication automation
3. Review logs to identify issues

## Benefits

✅ No phantom notifications about deleted records
✅ Customers get appropriate updates only
✅ Clean data for staff allocation
✅ Reduced SMS costs (no duplicate messages) 