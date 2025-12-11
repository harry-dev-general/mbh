# Checkfront Webhook Reliability Solution

**Created**: December 10, 2025  
**Status**: Implemented  
**Issue**: Webhooks failing during Railway deployments causing missed bookings

---

## Problem Summary

Webhook failures were causing bookings to be missed in Airtable. Analysis revealed the following patterns:

| Created Date | Bookings Affected | Likely Cause |
|--------------|-------------------|--------------|
| Sep 14-16, 2025 | 2 bookings | Initial webhook setup period |
| Oct 27-31, 2025 | 3 bookings | Railway deployment window |
| Nov 18, 2025 | 3 test bookings | Test/development activity |

### Root Causes Identified

1. **Railway Deployment Downtime** (~5-30 seconds per deployment)
   - No webhook queue or retry mechanism
   - Webhooks during this window are permanently lost

2. **No Checkfront Webhook Retry**
   - Checkfront sends webhooks once only
   - Failed webhooks are not retried

3. **No Webhook Audit Trail**
   - No way to compare received vs processed webhooks
   - Difficult to diagnose missing bookings

---

## Solution Implemented

### 1. Automatic Reconciliation Scheduler

**File**: `/api/reconciliation-scheduler.js`

Runs every **6 hours** to compare Checkfront and Airtable bookings:

- Checks last 14 days of bookings
- Identifies PAID/PART bookings missing from Airtable
- **Auto-syncs** missing bookings to Airtable
- **Sends admin SMS alert** for any discrepancies

```
⚠️ MBH Booking Alert

3 booking(s) missing from Airtable:
• NMHZ-140925
• ZCCV-160925
• MACN-031025

Visit reconciliation tool to sync.
```

### 2. Webhook Audit Log

**File**: `/api/webhook-audit-log.js`

Logs all incoming webhooks for debugging:

- In-memory log (last 1000 webhooks)
- Optional Airtable persistence
- Tracks success/failure status
- Includes full payload for debugging

### 3. Admin API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/reconciliation-status` | Check scheduler status |
| `POST /api/admin/trigger-reconciliation` | Manual reconciliation |
| `GET /api/admin/webhook-logs` | View webhook audit logs |

### 4. Existing Reconciliation Tool

The existing `/training/checkfront-reconciliation.html` tool provides:

- Manual comparison between systems
- Visual identification of missing bookings
- Sync functionality for individual bookings

---

## System Architecture

```
┌─────────────────┐
│   Checkfront    │
│  (Booking)      │
└────────┬────────┘
         │ Webhook POST
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Railway API    │────►│ Webhook Audit    │
│ /api/checkfront │     │ Log (in-memory)  │
│ /webhook        │     └──────────────────┘
└────────┬────────┘
         │ Create/Update
         ▼
┌─────────────────┐
│    Airtable     │◄───────────────────────┐
│ Bookings Table  │                        │
└─────────────────┘                        │
                                           │
┌──────────────────────────────────────────┤
│  Reconciliation Scheduler (Every 6 hrs)  │
│  • Compare Checkfront vs Airtable        │
│  • Auto-sync missing PAID/PART bookings  │
│  • Send admin SMS if discrepancies found │
└──────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CHECKFRONT_HOST` | Checkfront subdomain | Required |
| `CHECKFRONT_CONSUMER_KEY` | API key | Required |
| `CHECKFRONT_CONSUMER_SECRET` | API secret | Required |
| `ADMIN_SMS_RECIPIENT` | Admin phone for alerts | SMS_RECIPIENT |
| `TWILIO_*` | SMS credentials | Required for alerts |

### Scheduler Timing

- **Startup delay**: 30 seconds (lets services initialize)
- **Reconciliation interval**: 6 hours
- **Days to check**: 14 days (configurable via API)

---

## Admin Usage

### Check Reconciliation Status

```bash
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status
```

Response:
```json
{
  "success": true,
  "active": true,
  "lastRun": "2025-12-10T05:30:00.000Z",
  "lastResult": {
    "checkfrontCount": 147,
    "airtableCount": 145,
    "missingCount": 2
  },
  "config": {
    "checkInterval": "6 hours",
    "daysToCheck": 14,
    "autoSync": true,
    "adminSmsEnabled": true
  }
}
```

### Trigger Manual Reconciliation

```bash
curl -X POST -H "X-Admin-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 30}' \
  https://mbh-production-f0d1.up.railway.app/api/admin/trigger-reconciliation
```

### View Webhook Logs

```bash
# Recent logs
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/webhook-logs

# Failed webhooks only
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/webhook-logs?failedOnly=true

# Logs for specific booking
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/webhook-logs?bookingCode=NMHZ-140925
```

---

## Monitoring Recommendations

### Daily Checks

1. Review Railway logs for webhook failures
2. Check `/api/admin/reconciliation-status` for last run status
3. Verify admin SMS alerts are received

### After Deployments

1. Webhook processing may fail during 5-30 second deployment window
2. Reconciliation will catch missing bookings within 6 hours
3. Manual reconciliation available if urgent

### Periodic Review

1. Monthly review of reconciliation history
2. Verify Checkfront webhook URL is still configured
3. Check Twilio balance for SMS alerts

---

## Troubleshooting

### Reconciliation Not Running

1. Check if Checkfront API credentials are configured
2. Verify `CHECKFRONT_HOST`, `CHECKFRONT_CONSUMER_KEY`, `CHECKFRONT_CONSUMER_SECRET`
3. Check Railway logs for scheduler startup messages

### Webhook Logs Empty

1. Webhook logs are stored in memory (reset on restart)
2. Optional: Create "Webhook Audit Log" table in Airtable for persistence
3. Fields needed: Timestamp, Booking Code, Status, Processing Result, Action, Error, Payload

### Auto-Sync Failing

1. Check Airtable API key permissions
2. Verify AIRTABLE_BASE_ID is correct
3. Check if Bookings Dashboard table exists

### Admin SMS Not Received

1. Verify Twilio credentials are configured
2. Check ADMIN_SMS_RECIPIENT or SMS_RECIPIENT is set
3. Verify Twilio account has balance

---

## Files Modified

| File | Changes |
|------|---------|
| `/api/reconciliation-scheduler.js` | **NEW** - Automatic reconciliation |
| `/api/webhook-audit-log.js` | **NEW** - Webhook logging |
| `/api/checkfront-webhook.js` | Added webhook logging |
| `/server.js` | Added scheduler startup and admin endpoints |
| `/docs/03-integrations/checkfront/WEBHOOK_RELIABILITY_SOLUTION.md` | **NEW** - This documentation |

---

## Future Improvements

1. **Airtable Webhook Log Table**: Create persistent audit log
2. **Dashboard Widget**: Show reconciliation status on main dashboard
3. **Webhook Queue**: Queue failed webhooks for retry
4. **Slack Notifications**: Additional notification channel for admins
5. **Custom Alert Thresholds**: Configure when to send alerts

---

## Related Documentation

- [Checkfront API Setup](./CHECKFRONT_API_SETUP.md)
- [Checkfront Booking Flow Analysis](./CHECKFRONT_BOOKING_FLOW_ANALYSIS_DEC_2025.md)
- [Webhook Integration](./WEBHOOK_INTEGRATION.md)



