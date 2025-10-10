# Booking Status Values Summary

## Status Codes Found in Your System

Based on the duplicate cleanup scan, your booking system uses abbreviated status codes:

| Code | Meaning | Description |
|------|---------|-------------|
| PEND | Pending | Initial booking, awaiting payment |
| HOLD | Hold | Booking on hold (manual review needed?) |
| WAIT | Waiting | Similar to hold, possibly waiting for confirmation |
| PART | Partial Payment | Customer has made partial payment |
| PAID | Paid | Full payment received, booking confirmed |
| VOID | Void | Booking cancelled/voided |
| STOP | Stop | Booking stopped/cancelled |

## Duplicate Summary

Your scan found:
- **11 booking codes** with duplicates
- **15 total duplicate records** to clean up
- Most duplicates show status progression (e.g., PEND → PAID)
- No staff assignments on any duplicates (good - no data to lose)

## Example Progressions

1. **Payment Success**: PEND → PAID
2. **Payment with Hold**: PEND → PART → PAID
3. **Cancellation**: PEND → VOID
4. **Complex**: PEND → HOLD → STOP

## Next Steps

### 1. Clean Up Existing Duplicates
Run the cleanup script with `dryRun = false`:
```javascript
// Change this line in the script:
let dryRun = false;
```

This will:
- Keep the oldest record (original)
- Update it to the latest status
- Delete the duplicates

### 2. Set Up Deduplication Automation
Create automation to prevent future duplicates:
- Trigger: Record created in Bookings Dashboard
- Action: Run deduplication script
- This will automatically merge duplicates going forward

### 3. Update SMS Notifications
The scripts have been updated to handle your status codes:
- **PEND → PAID**: "Payment Confirmed" SMS
- **PEND → PART**: "Partial Payment Received" SMS
- **Any → VOID/STOP**: "Booking Cancelled" SMS
- **PEND → HOLD/WAIT**: No SMS (minor change)

## SMS Message Examples

**New Booking (PEND):**
```
🚤 Boat Hire Manly - Booking Confirmed
Booking: DBFL-030725
Date: Thursday, 3 July 2025
Time: 10:00 AM - 12:00 PM
```

**Partial Payment (PART):**
```
💳 Boat Hire Manly - Partial Payment Received
We've received your partial payment.
Please complete payment before July 3.
```

**Payment Complete (PAID):**
```
✅ Boat Hire Manly - Payment Confirmed
Your payment has been received!
See you on July 3 at 10:00 AM. 🚤
```

**Cancellation (VOID/STOP):**
```
⚠️ Boat Hire Manly - Booking Cancelled
Your booking has been cancelled.
If you have questions, please call us.
```

## Benefits After Implementation

1. **Clean Data**: One record per booking
2. **Smart Notifications**: Customers only notified of important changes
3. **Accurate Reporting**: No duplicate bookings inflating numbers
4. **Better Staff Allocation**: Clear view of actual bookings

Ready to proceed with the cleanup! 