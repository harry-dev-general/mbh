# SMS Notifications + Deduplication Integration Guide

## The Challenge

When you have both SMS notifications and deduplication automations triggered by "record created":
- Both automations fire simultaneously
- SMS might notify about a duplicate that gets deleted
- Staff confusion from notifications about phantom records

## Solution Options

### Option 1: Smart SMS Script (Recommended)
Replace your current SMS script with `airtable-booking-sms-smart-notification.js`

**Advantages:**
- Only sends notifications for meaningful changes
- Checks if record is a duplicate before sending
- Provides different messages for different scenarios

**How it works:**
```
New record created → Smart SMS checks:
├─ Is this a duplicate? 
│  ├─ Yes → Is it a significant change?
│  │  ├─ Yes (e.g., paid, cancelled) → Send notification
│  │  └─ No (e.g., pending→held) → Don't send
│  └─ No → Send "New Booking" notification
```

### Option 2: Delay SMS Notifications
Add a delay to SMS automation to let deduplication run first

**Setup:**
1. In SMS automation, add a "Wait" action (30-60 seconds)
2. Then add a "Find records" action to check if record still exists
3. Only send SMS if record is found

**Pros:** Simple to implement
**Cons:** Delays all notifications, even legitimate ones

### Option 3: Combine Into Single Automation
Merge deduplication and SMS into one workflow

**Setup:**
1. Trigger: Record created
2. Run deduplication script
3. Check output: If `action` = "kept", send SMS
4. If `action` = "deduplicated", send update SMS only

**Pros:** Perfect coordination
**Cons:** More complex setup

## Recommended Implementation

### 1. Update Your SMS Automation

Replace current SMS script with the smart version:

```javascript
// In your SMS automation:
1. Trigger: When record created
2. Action: Run script (smart SMS script)
3. Conditional action: If sendNotification = true
   - Send SMS with notificationMessage
```

### 2. SMS Examples

**New Booking:**
```
🚤 NEW BOOKING
Customer: John Smith
Date: Dec 20, 2024
Time: 10:00 AM
Amount: $350
Code: BK2024-1220-001
```

**Payment Confirmed:**
```
✅ PAYMENT CONFIRMED
Customer: John Smith
Date: Dec 20, 2024
Status: pending → Paid
Code: BK2024-1220-001
```

**Booking Cancelled:**
```
⚠️ BOOKING CANCELLED
Customer: John Smith
Date: Dec 20, 2024
Status: Paid → VOID
Code: BK2024-1220-001
```

### 3. Notification Rules

The smart script only sends notifications for:

✅ **Always Notify:**
- First booking record (new booking)
- Cancellations (→ VOID/STOP)
- Payment confirmations (→ Paid)

❌ **Don't Notify:**
- Duplicate records with same status
- Minor status changes (pending → held)
- Invalid status progressions

## Testing Your Setup

### Test Scenario 1: New Booking
1. Create new booking (status: pending)
2. Expected: SMS "NEW BOOKING" sent
3. Deduplication: Record kept (first instance)

### Test Scenario 2: Payment Update
1. Create duplicate with status: Paid
2. Expected: SMS "PAYMENT CONFIRMED" sent
3. Deduplication: Original updated, duplicate deleted

### Test Scenario 3: Minor Change
1. Create duplicate changing pending → held
2. Expected: No SMS sent
3. Deduplication: Original updated, duplicate deleted

## Monitoring & Debugging

### Check Automation History
Look for patterns:
- SMS sent → Record deleted = Need smart SMS
- Multiple SMS for same booking = Duplicates getting through
- No SMS for important changes = Check notification rules

### Console Logs
Smart SMS script logs:
```
🔔 Processing notification for record: rec123
📋 Booking: BK2024-001
📊 Status: Paid
🔄 Found 1 other record(s) for this booking
✅ Sending notification: medium priority
```

## Advanced Configuration

### Custom Notification Rules
Edit the `isSignificantStatusChange` function:

```javascript
// Add custom rules
if (oldStatus === "confirmed" && newStatus === "in_progress") {
    return true; // Notify when booking starts
}
```

### Different Recipients by Status
```javascript
// In output section
if (currentStatus === "VOID") {
    output.set('notifyManager', true);
    output.set('managerMessage', 'Booking cancelled - review refund');
}
```

### Priority Levels
The script sets priority levels:
- **High**: Cancellations (VOID/STOP)
- **Medium**: New bookings, payments
- **Low**: Other updates

Use these to route notifications differently.

## Best Practices

1. **Test Thoroughly**: Run through all status change scenarios
2. **Monitor Early**: Watch automation history closely first week
3. **Adjust Rules**: Customize notification rules based on staff feedback
4. **Document Changes**: Keep track of which statuses trigger notifications
5. **Regular Review**: Check for notification fatigue or missed alerts

## Quick Reference

### Status Change Matrix
| From | To | Notify? | Message Type |
|------|----|---------|-----------| 
| - | pending | ✅ | New Booking |
| pending | held | ❌ | - |
| pending | Paid | ✅ | Payment Confirmed |
| held | Paid | ✅ | Payment Confirmed |
| Paid | VOID | ✅ | Booking Cancelled |
| Any | STOP | ✅ | Booking Cancelled |

### Required Fields for SMS
Ensure these fields are populated:
- Booking Code (for deduplication)
- Customer Name (for message)
- Status (for logic)
- Booking Date (for message)

This integration ensures your staff get the right notifications at the right time, without confusion from duplicate records! 