# Session Summary: Reconciliation Future Bookings & Full Data Sync Fix (December 12, 2025)

## Session Overview

**Date**: December 12, 2025  
**Duration**: Extended session  
**Primary Focus**: Fixing reconciliation to detect future bookings and sync complete booking data  
**Status**: COMPLETED ✅

---

## Problem Addressed

User reported that booking `MTAH-041125` (Syed, Dec 13, 2025) was visible in Checkfront but missing from Airtable, despite the reconciliation system claiming "0 missing bookings".

### Initial Investigation

1. Checked Railway logs - no reconciliation activity visible
2. Ran manual reconciliation compare - **found the missing booking**
3. Discovered the scheduler was running but NOT detecting the booking

---

## Root Causes Identified

### Issue 1: Reconciliation Only Checked Past Dates

**The Bug**:
```javascript
// OLD CODE - Only checked past 14 days
const endDate = new Date();  // Today
const startDate = new Date();
startDate.setDate(startDate.getDate() - daysBack);  // 14 days ago
```

**The Problem**: Booking `MTAH-041125` was for December 13 (tomorrow), but the scheduler only checked up to "today" (December 12). Future bookings were never detected.

**The Fix**:
```javascript
// NEW CODE - Checks 14 days back AND 14 days forward
const today = new Date();
const startDate = new Date();
const endDate = new Date();
startDate.setDate(today.getDate() - daysBack);   // 14 days ago
endDate.setDate(today.getDate() + daysForward);  // 14 days ahead
```

### Issue 2: `getBookingByCode` Only Searched Past Dates

**The Bug**: When looking up a specific booking, the function only searched past 6 months, missing future bookings.

**The Fix**: Extended to search ±6 months (past AND future).

### Issue 3: Synced Bookings Missing Fields

When the reconciliation synced bookings, they were missing:
- Phone Number
- Start Time
- Finish Time
- Duration

**Root Cause**: The `/booking/index` endpoint returns **limited data**:
```json
{
  "booking_id": 2620,
  "code": "MTAH-041125",
  "customer_name": "Syed",
  "date_desc": "Sat Dec 13, 2025",  // String, not timestamp!
  // NO phone, NO start_date, NO end_date
}
```

**The Fix**: Fetch FULL booking details via `/booking/{id}` endpoint before syncing.

### Issue 4: Different API Response Formats

**Discovery**: The individual `/booking/{id}` endpoint returns a DIFFERENT structure than webhooks:

| Field | Webhook Format | API `/booking/{id}` Format |
|-------|---------------|---------------------------|
| Booking code | `booking.code` | `booking.id` |
| Status | `booking.status` | `booking.status_id` |
| Customer name | `booking.customer.name` | `booking.customer_name` |
| Phone | `booking.customer.phone` | `booking.customer_phone` |
| Items | `booking.order.items.item[]` | `booking.items{}` (object) |
| Timestamps | Numbers | Can be strings or numbers |

**The Fix**: Updated sync functions to handle both formats.

### Issue 5: Booking Date Parsing from `date_desc`

**The Bug**: When `start_date` timestamp wasn't available, the code fell back to "today's date" instead of parsing `date_desc`.

**The Fix**: Added `parseDateDesc()` function:
```javascript
function parseDateDesc(dateDesc) {
    // Parses "Sat Dec 13, 2025" → "2025-12-13"
    const parsed = new Date(dateDesc);
    return parsed.toISOString().split('T')[0];
}
```

---

## Technical Discoveries

### 1. Checkfront `/booking/index` vs `/booking/{id}` Endpoints

| Endpoint | Data Included | Use Case |
|----------|--------------|----------|
| `/booking/index` | Limited (name, email, date_desc, total) | List bookings |
| `/booking/{id}` | Complete (phone, timestamps, items, transactions) | Full details |

### 2. Full Booking API Response Structure

```json
{
  "id": "MTAH-041125",           // Booking code (not 'code')
  "booking_id": 2620,
  "status_id": "PAID",           // Not 'status'
  "customer_name": "Syed",       // Flat, not nested
  "customer_email": "...",
  "customer_phone": "+61417270996",
  "start_date": 1765589400,      // Unix timestamp (can be string)
  "end_date": 1765603800,
  "items": {
    "1": {
      "sku": "8personbbqboat-halfday",
      "name": "1/2 Day 8 Person BBQ Boat",
      "category_id": 2,
      "total": "485.00"
    }
  }
}
```

### 3. Timestamp Handling Quirks

Timestamps from the API can be:
- Numbers: `1765589400`
- Strings: `"1765589400"`

Must handle both:
```javascript
let timestamp = booking.start_date;
if (typeof timestamp === 'string') timestamp = parseInt(timestamp);
```

---

## What Was Built/Modified

### New Functions

| Function | File | Purpose |
|----------|------|---------|
| `getFullBookingByCode()` | `checkfront-api.js` | Fetch complete booking details |
| `parseDateDesc()` | Both sync files | Parse "Sat Dec 13, 2025" to ISO date |
| `formatTimeAEST()` | Both sync files | Format time in Sydney timezone |
| `formatDateAEST()` | Both sync files | Format date in Sydney timezone |

### Modified Functions

| Function | Changes |
|----------|---------|
| `runReconciliation()` | Now checks `daysForward` (default 14) |
| `getBookingByCode()` | Searches ±6 months |
| `syncBookingToAirtable()` | Fetches full details, handles both formats |
| `autoSyncMissingBookings()` | Same improvements as above |

### New Endpoint

| Endpoint | Purpose |
|----------|---------|
| `GET /api/reconciliation/booking-debug/:id` | Debug raw booking data |

---

## Files Modified

| File | Changes |
|------|---------|
| `/api/checkfront-api.js` | Added `getFullBookingByCode()`, extended date range |
| `/api/checkfront-reconciliation.js` | Complete sync function rewrite, debug endpoint |
| `/api/reconciliation-scheduler.js` | Future dates, full data fetch, format handling |

---

## Commits Made

1. `e8acc25` - Fix reconciliation to include future bookings
2. `c0719a1` - Fix booking date parsing for /booking/index endpoint
3. `249adb3` - Fetch full booking details for sync to include phone, times, items
4. `39c0d64` - Add booking-debug endpoint for raw Checkfront data
5. `2b603d1` - Fix sync to handle Checkfront API response format
6. `cce3745` - Fix booking endpoint to show correct customer data from API format

---

## Verification Results

### Before Fix
```
MTAH-041125 (Syed): MISSING from Airtable
Scheduler reported: 0 missing bookings (INCORRECT)
```

### After Fix
```
MTAH-041125 (Syed):
  ✅ Phone: +61417270996
  ✅ Start Time: 12:30 pm
  ✅ Finish Time: 04:30 pm
  ✅ Duration: 4 hours 0 minutes
  ✅ Booking Date: 2025-12-13
```

### Reconciliation Status
```json
{
  "config": {
    "daysBack": 14,
    "daysForward": 14,   // NEW!
    "autoSync": true
  },
  "lastResult": {
    "checkfrontCount": 95,
    "airtableCount": 94,
    "missingCount": 0
  }
}
```

---

## Key Learnings for Future LLMs

### 1. Always Check Future Dates
When reconciling booking data, check BOTH past AND future dates. Customers book ahead of time!

### 2. `/booking/index` Has Limited Data
To get phone, times, and item details, you MUST fetch individual booking via `/booking/{id}`.

### 3. API Response Format Differs from Webhooks
The Checkfront API returns data in a different structure than what webhooks send. Handle both.

### 4. Timestamps Can Be Strings
Always `parseInt()` timestamps from the API - they might be strings.

### 5. Test with Real Data
Use the `/booking-debug/{id}` endpoint to see raw Checkfront responses.

---

## Verification Commands

```bash
# Check scheduler includes future dates
curl -H "X-Admin-Key: mbh-admin-2025" \
  https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status

# Compare specific date range
curl -H "X-Admin-Key: mbh-admin-2025" \
  "https://mbh-production-f0d1.up.railway.app/api/reconciliation/compare?startDate=2025-12-13&endDate=2025-12-15"

# Check specific booking (with full details)
curl -H "X-Admin-Key: mbh-admin-2025" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking/MTAH-041125

# Debug raw Checkfront data by booking ID
curl -H "X-Admin-Key: mbh-admin-2025" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking-debug/2620
```

---

## Related Documentation

- [Main Investigation Guide](../../05-troubleshooting/CHECKFRONT_AIRTABLE_RECONCILIATION_DEC_2025.md)
- [Previous Session (Dec 10-11)](./DECEMBER_10_11_2025_CHECKFRONT_RECONCILIATION.md)
- [LLM Quick Reference](../../03-integrations/checkfront/LLM_CHECKFRONT_RECONCILIATION_PROMPT.md)

---

*Session completed: December 12, 2025*
