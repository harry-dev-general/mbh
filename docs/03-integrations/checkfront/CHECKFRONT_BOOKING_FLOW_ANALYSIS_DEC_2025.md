# Checkfront Booking Flow Analysis (December 2025)

## Overview

This document provides a comprehensive analysis of how customer bookings flow from Checkfront (the booking system) through the webhook to Airtable's "Bookings Dashboard" table, and how they appear on the management-allocations calendar.

**Analysis Date**: December 9, 2025  
**Status**: DOCUMENTATION - For LLM Continuation

---

## System Architecture

```
┌─────────────────────┐
│     Checkfront      │
│  (Booking System)   │
└──────────┬──────────┘
           │ POST /api/checkfront/webhook
           │ (booking create/update events)
           ▼
┌─────────────────────┐
│    Railway Server   │
│   (Express.js API)  │
│ /api/checkfront-    │
│    webhook.js       │
└──────────┬──────────┘
           │ Create/Update Record
           │ + Send SMS notification
           ▼
┌─────────────────────┐
│      Airtable       │
│ "Bookings Dashboard"│
│ (tblRe0cDmK3bG2kPf) │
└──────────┬──────────┘
           │ API Fetch (filtered by date/status)
           ▼
┌─────────────────────┐
│ management-         │
│ allocations.html    │
│ (Calendar Display)  │
└─────────────────────┘
```

---

## Webhook Handler Details

**Location**: `/api/checkfront-webhook.js`

### Data Processing Flow

1. **Receive Webhook Payload**
   - Checkfront sends booking data on create/update events
   - Payload includes: booking code, customer info, items, timestamps, status

2. **Extract Booking Information**
   ```javascript
   const booking = webhookData.booking || {};
   const order = booking.order || {};
   const customer = booking.customer || {};
   
   // Key fields extracted:
   // - bookingCode (e.g., "YCDC-150925")
   // - customerName, customerEmail, customerPhone
   // - bookingStatus (PEND, PART, PAID, VOID, STOP)
   // - totalAmount
   // - start_date, end_date (Unix timestamps)
   ```

3. **Process Order Items**
   - Categorize items as boats or add-ons based on `category_id`:
     - Categories 2, 3 → Boats → "Booking Items" field
     - Categories 4, 5, 6, 7 → Add-ons → "Add-ons" field
   - Format add-on names with quantities and prices

4. **Check for Existing Record**
   - Query Airtable for existing booking with same booking code
   - If found: UPDATE existing record
   - If not found: CREATE new record
   - If updating to PAID status: DELETE duplicate records

5. **Send SMS Notification**
   - Only sends for significant status changes:
     - New bookings
     - Payment confirmed (→ PAID)
     - Cancellations (→ VOID, STOP)
     - Partial payment received (→ PART)
   - Uses Twilio API via Railway environment variables

---

## Airtable Record Structure

### Bookings Dashboard Table (`tblRe0cDmK3bG2kPf`)

| Field Name | Type | Source | Description |
|------------|------|--------|-------------|
| Booking Code | Text | Checkfront | Unique identifier (e.g., "YCDC-150925") |
| Customer Name | Text | Checkfront | Customer full name |
| Customer Email | Email | Checkfront | Customer email |
| Phone Number | Text | Checkfront | Customer phone |
| Status | Single Select | Checkfront | PEND, PART, PAID, VOID, STOP |
| Total Amount | Currency | Checkfront | Booking total |
| Booking Items | Text | Checkfront | Boat SKU |
| Add-ons | Text | Checkfront | Formatted add-ons list |
| Booking Date | Date | Checkfront | Start date (YYYY-MM-DD) |
| End Date | Date | Checkfront | End date |
| Start Time | Text | Checkfront | Start time (HH:MM AM/PM) |
| Finish Time | Text | Checkfront | End time |
| Duration | Text | Calculated | e.g., "4 hours 0 minutes" |
| Created Date | Date | Checkfront | Record creation date |
| Onboarding Employee | Link | Portal | Assigned staff for onboarding |
| Deloading Employee | Link | Portal | Assigned staff for deloading |
| Onboarding Status | Select | Portal | Assigned, Pending, etc. |
| Deloading Status | Select | Portal | Assigned, Pending, etc. |

---

## Calendar Display Logic

### Booking Fetch (management-allocations.html)

```javascript
// Fetches PAID and PART status bookings only
const filter = "OR({Status}='PAID', {Status}='PART')";

// Client-side filtering for current week
bookingsData = allBookings.filter(record => {
    const bookingDate = record.fields['Booking Date'];
    const date = new Date(bookingDate + 'T00:00:00');
    return date >= weekStart && date <= weekEnd;
});
```

### Booking Block Rendering

Bookings are displayed on the calendar grid with:
- **Red blocks**: No staff assigned (needs allocation)
- **Green blocks**: Staff assigned
- **Onboarding blocks**: 30 minutes before start time
- **Deloading blocks**: 30 minutes before finish time

---

## Known Issues & Considerations

### 1. Duplicate Booking Records (RESOLVED)
**Issue**: Multiple records created for same booking as status changes (PEND → PART → PAID)  
**Solution**: Webhook now checks for existing booking and updates instead of creating new  
**Reference**: `/docs/03-integrations/checkfront/WEBHOOK_DEDUPLICATION_SOLUTION_SUMMARY.md`

### 2. Time Zone Handling
- All times processed in Sydney timezone (Australia/Sydney)
- Checkfront sends Unix timestamps
- Webhook converts to local Sydney time for display
- Calendar displays in browser's local timezone

### 3. Status Filtering
- Calendar only shows PAID and PART bookings
- PEND (pending) bookings are not displayed
- VOID and STOP (cancelled) bookings are not displayed

### 4. Phone Number Capture
**Added**: September 26, 2025  
- Customer phone extracted from `booking.customer.phone`
- Stored in "Phone Number" field
- Used for potential SMS features

---

## Webhook Endpoint Configuration

### Production URL
```
POST https://mbh-production-f0d1.up.railway.app/api/checkfront/webhook
```

### Environment Variables Required
```
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
SMS_RECIPIENT=+61414960734 (default)
```

### Test Endpoint
```
GET https://mbh-production-f0d1.up.railway.app/api/checkfront/test
```
Returns webhook handler status and Twilio configuration check.

---

## Debugging Checkfront Issues

### 1. Check Railway Logs
```bash
# In Railway dashboard, view application logs
# Look for: "📥 Processing Checkfront webhook..."
```

### 2. Verify Webhook Reception
Console output should show:
```
🚀 Checkfront webhook received
📥 Processing Checkfront webhook...
📦 Processing X items
📊 Summary:
  Booking: XXXX-XXXXXX
  Customer: Name
  Phone: +61...
  Boat: SKU
  Add-ons: List
  Total: $XXX
✨ Creating new booking: XXXX-XXXXXX
```

### 3. Check Airtable Record
- Navigate to Bookings Dashboard table
- Filter by Booking Code
- Verify all fields populated correctly

### 4. Test Webhook Manually
```bash
curl -X POST https://mbh-production-f0d1.up.railway.app/api/checkfront/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "booking": {
      "code": "TEST-123456",
      "status": "PAID",
      "customer": {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "+61400000000"
      },
      "order": {
        "total": 100,
        "items": {
          "item": [{
            "sku": "test-boat",
            "category_id": "2",
            "qty": 1,
            "total": 100
          }]
        }
      },
      "start_date": 1734220800,
      "end_date": 1734235200,
      "created_date": 1734134400
    }
  }'
```

---

## Areas for Investigation

### 1. Webhook Reliability
- Are all Checkfront events being received?
- Any webhook failures in Railway logs?
- Checkfront webhook retry behavior?

### 2. Data Accuracy
- Are booking items correctly categorized?
- Are add-ons being captured completely?
- Are timestamps converting correctly to Sydney time?

### 3. Calendar Display Sync
- Delay between webhook and calendar refresh?
- Client-side caching issues?
- Real-time update mechanism?

### 4. Status Change Flow
- All status transitions being captured?
- SMS notifications firing correctly?
- Duplicate prevention working?

---

## Related Documentation

- [Checkfront Webhook Flow](/docs/03-integrations/checkfront/CHECKFRONT_WEBHOOK_FLOW.md)
- [Webhook Deduplication Solution](/docs/03-integrations/checkfront/WEBHOOK_DEDUPLICATION_SOLUTION_SUMMARY.md)
- [Phone Number Capture](/docs/02-features/checkfront-webhook/PHONE_NUMBER_CAPTURE.md)
- [Management Allocations Architecture](/docs/02-features/allocations/MANAGEMENT_ALLOCATIONS_ARCHITECTURE.md)
- [Airtable Webhook Deduplication Fix](/docs/03-integrations/airtable/AIRTABLE_WEBHOOK_DEDUPLICATION_FIX.md)

---

## Next Steps

1. **Monitor Production Logs**: Watch Railway logs for webhook events over a period
2. **Compare Checkfront vs Airtable**: Verify booking counts match between systems
3. **Test Status Transitions**: Create test booking and progress through statuses
4. **Review Add-on Mapping**: Ensure all Checkfront add-ons are mapped correctly
5. **Analyze Calendar Refresh**: Determine if real-time updates are working



