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

// CORRECT endpoint
'/api/3.0/booking/index'  // NOT '/booking'

// CORRECT response parsing
const bookings = response['booking/index'];  // NOT response.booking
```

### Environment Variables

```
CHECKFRONT_HOST=boat-hire-manly.checkfront.com
CHECKFRONT_CONSUMER_KEY=<key>
CHECKFRONT_CONSUMER_SECRET=<secret>
ADMIN_API_KEY=<admin key for endpoints>
```

### Admin Endpoints

```bash
# Check status
curl -H "X-Admin-Key: KEY" https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status

# Trigger reconciliation
curl -X POST -H "X-Admin-Key: KEY" https://mbh-production-f0d1.up.railway.app/api/admin/trigger-reconciliation
```

---

## If You Need To Debug

1. **Check scheduler is running**: Look for startup logs with "🚀 Starting Checkfront-Airtable reconciliation scheduler"
2. **Use debug endpoint**: `GET /api/reconciliation/debug?adminKey=KEY`
3. **Check Railway logs**: Look for reconciliation output every 6 hours
4. **Verify API response structure**: Bookings are in `response['booking/index']`

---

## Common Gotchas

1. **Airtable date filters**: Use `OR(IS_SAME(...), IS_AFTER(...))` for inclusive ranges
2. **Checkfront status field**: It's `status_id`, not `status`
3. **Response parsing**: Bookings keyed by ID in object, not array
4. **Pagination**: Use `response.request.pages` for total page count

---

## Full Documentation

- [Complete Investigation Guide](../../05-troubleshooting/CHECKFRONT_AIRTABLE_RECONCILIATION_DEC_2025.md)
- [Webhook Reliability Solution](./WEBHOOK_RELIABILITY_SOLUTION.md)
- [API Setup Guide](./CHECKFRONT_API_SETUP.md)
- [Session Summary](../../07-handover/session-summaries/DECEMBER_10_11_2025_CHECKFRONT_RECONCILIATION.md)

---

*Created: December 11, 2025*


