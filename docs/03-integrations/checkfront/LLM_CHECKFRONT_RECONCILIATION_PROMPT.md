# LLM Continuation Prompt: Checkfront-Airtable Reconciliation

## Quick Context

You're working on the MBH Staff Portal, a booking management system for a boat hire business. This prompt focuses on the **Checkfront-Airtable reconciliation system** - a critical component that ensures booking data stays synchronized.

---

## The Problem We Solved

**Issue**: Checkfront webhooks occasionally fail during Railway deployments (5-30 second downtime). Checkfront does NOT retry failed webhooks, causing permanent data loss.

**Solution**: An automatic reconciliation system that:
1. Runs every 6 hours
2. Compares Checkfront and Airtable bookings
3. Auto-syncs missing PAID/PART bookings
4. Sends SMS alerts for discrepancies

**December 12 Update**: Fixed to check **FUTURE bookings** too (customers book ahead of time!)

---

## Key Files

| File | Purpose |
|------|---------|
| `/api/checkfront-api.js` | Checkfront API client (OAuth 1.0a auth) |
| `/api/checkfront-reconciliation.js` | Comparison and sync endpoints |
| `/api/reconciliation-scheduler.js` | Automatic 6-hour scheduler |
| `/api/webhook-audit-log.js` | Logs incoming webhooks |
| `/api/checkfront-webhook.js` | Original webhook handler |
| `/training/checkfront-reconciliation.html` | Admin UI |

---

## Critical Technical Details

### Checkfront API Quirks

```javascript
// CORRECT - OAuth 1.0a with Basic Auth
const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
headers: { 'Authorization': `Basic ${credentials}` }

// CORRECT endpoint for listing bookings
'/api/3.0/booking/index'  // NOT '/booking'

// CORRECT response parsing
const bookings = response['booking/index'];  // NOT response.booking
```

### Two Different Endpoints - Two Different Data Structures!

| Endpoint | Data Included | Use Case |
|----------|--------------|----------|
| `/api/3.0/booking/index` | Limited (name, email, date_desc) | List bookings |
| `/api/3.0/booking/{id}` | Complete (phone, timestamps, items) | Full details |

### API Response Format vs Webhook Format

The `/booking/{id}` endpoint returns **DIFFERENT** field names than webhooks:

| Data | Webhook Format | API `/booking/{id}` Format |
|------|---------------|---------------------------|
| Booking code | `booking.code` | `booking.id` |
| Status | `booking.status` | `booking.status_id` |
| Customer phone | `booking.customer.phone` | `booking.customer_phone` |
| Items | `order.items.item[]` | `items{}` (object with numeric keys) |

### Handling Timestamps

Timestamps from the API can be numbers OR strings - always parse:
```javascript
let timestamp = booking.start_date;
if (typeof timestamp === 'string') timestamp = parseInt(timestamp);
const date = new Date(timestamp * 1000);
```

### Date Range - Must Include Future!

```javascript
// CORRECT - Checks past AND future
runReconciliation(daysBack = 14, daysForward = 14)

// Config should show:
{
  "daysBack": 14,
  "daysForward": 14  // MUST have this!
}
```

---

## Environment Variables

```
CHECKFRONT_HOST=boat-hire-manly.checkfront.com
CHECKFRONT_CONSUMER_KEY=<key>
CHECKFRONT_CONSUMER_SECRET=<secret>
ADMIN_API_KEY=<admin key for endpoints>
```

---

## Admin Endpoints

```bash
# Check status (verify daysForward is set!)
curl -H "X-Admin-Key: KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status

# Trigger reconciliation
curl -X POST -H "X-Admin-Key: KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/trigger-reconciliation

# Check specific booking with full data
curl -H "X-Admin-Key: KEY" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking/MTAH-041125

# Debug raw Checkfront data by ID
curl -H "X-Admin-Key: KEY" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking-debug/2620

# Compare date range
curl -H "X-Admin-Key: KEY" \
  "https://mbh-production-f0d1.up.railway.app/api/reconciliation/compare?startDate=2025-12-13&endDate=2025-12-15"
```

---

## If You Need To Debug

1. **Check scheduler is running**: Look for "🚀 Starting Checkfront-Airtable reconciliation scheduler"
2. **Verify date range**: Config must show `daysForward: 14`
3. **Use debug endpoint**: `/api/reconciliation/booking-debug/{id}` for raw API response
4. **Check full booking data**: `/api/reconciliation/booking/{code}` shows both systems
5. **Verify API response structure**: Bookings are in `response['booking/index']`

---

## Common Gotchas

1. **Airtable date filters**: Use `OR(IS_SAME(...), IS_AFTER(...))` for inclusive ranges
2. **Checkfront status field**: It's `status_id`, not `status`
3. **Response parsing**: Bookings keyed by ID in object, not array
4. **Pagination**: Use `response.request.pages` for total page count
5. **Future bookings**: MUST check dates ahead of today!
6. **Full data**: `/booking/index` is LIMITED - fetch `/booking/{id}` for phone/times
7. **Format differences**: API and webhook return different structures

---

## Synced Booking Should Have These Fields

When a booking is synced correctly, Airtable should have:

| Field | Source |
|-------|--------|
| Booking Code | ✓ From index |
| Customer Name | ✓ From index |
| Customer Email | ✓ From index |
| Phone Number | ✓ From `/booking/{id}` |
| Start Time | ✓ From `/booking/{id}` |
| Finish Time | ✓ From `/booking/{id}` |
| Duration | ✓ Calculated |
| Booking Date | ✓ From timestamps or date_desc |
| Booking Items | ✓ From summary or items |
| Status | ✓ From index |
| Total Amount | ✓ From index |

---

## Full Documentation

- [Complete Investigation Guide](../../05-troubleshooting/CHECKFRONT_AIRTABLE_RECONCILIATION_DEC_2025.md)
- [Webhook Reliability Solution](./WEBHOOK_RELIABILITY_SOLUTION.md)
- [API Setup Guide](./CHECKFRONT_API_SETUP.md)
- [Dec 10-11 Session](../../07-handover/session-summaries/DECEMBER_10_11_2025_CHECKFRONT_RECONCILIATION.md)
- [Dec 12 Session](../../07-handover/session-summaries/DECEMBER_12_2025_RECONCILIATION_FUTURE_BOOKINGS_FIX.md)

---

*Last updated: December 12, 2025*
