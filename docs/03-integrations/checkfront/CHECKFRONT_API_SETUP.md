# Checkfront API Setup Guide

## Overview

This guide explains how to set up the Checkfront API integration for the MBH Staff Portal reconciliation tool. The reconciliation tool compares bookings between Checkfront and Airtable to identify discrepancies and automatically sync missing bookings.

**Last Updated**: December 11, 2025

---

## Authentication Method

Checkfront API v3.0 uses **OAuth 1.0a style credentials** with HTTP Basic Authentication. This is NOT OAuth2.

**Authentication Flow**:
```javascript
// Consumer Key and Secret are combined and Base64 encoded
const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

// Sent as Basic Auth header
headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
}
```

---

## Required Environment Variables

Add these environment variables to your Railway deployment:

### Checkfront API Credentials

| Variable | Description | Example |
|----------|-------------|---------|
| `CHECKFRONT_HOST` | Your Checkfront subdomain (without https://) | `boat-hire-manly.checkfront.com` |
| `CHECKFRONT_CONSUMER_KEY` | API Consumer Key from Checkfront | `abcd1234...` |
| `CHECKFRONT_CONSUMER_SECRET` | API Consumer Secret from Checkfront | `xyz5678...` |

### ⚠️ Variables NOT Needed

Checkfront provides these in their Developer settings, but they are **NOT required** for API Key authentication:

| Variable | When Needed |
|----------|-------------|
| `Authorize Token URL` | Only for full OAuth flow with user authorization |
| `Access Token URL` | Only for full OAuth flow with user authorization |

These are only needed if you're building an app that authorizes on behalf of other Checkfront users. For API key access to your own account, Consumer Key/Secret is sufficient.

### Admin Authentication

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_KEY` | Key required to access reconciliation endpoints | Required (no default) |

---

## Getting Checkfront API Credentials

1. Log in to your Checkfront account
2. Go to **Manage** → **Developer** → **API**
3. Find or create your API credentials
4. Copy the values:
   - **Consumer Key** → `CHECKFRONT_CONSUMER_KEY`
   - **Consumer Secret** → `CHECKFRONT_CONSUMER_SECRET`
5. Your host is your Checkfront URL without `https://` (e.g., `boat-hire-manly.checkfront.com`)

---

## Setting Up in Railway

1. Go to your Railway project dashboard
2. Click on your MBH Staff Portal service
3. Navigate to **Variables**
4. Add each environment variable:

```
CHECKFRONT_HOST=boat-hire-manly.checkfront.com
CHECKFRONT_CONSUMER_KEY=your-consumer-key-here
CHECKFRONT_CONSUMER_SECRET=your-consumer-secret-here
ADMIN_API_KEY=your-secure-admin-key
```

5. Railway will automatically redeploy with the new variables

---

## Verifying the Setup

### Option 1: Admin Status Endpoint

```bash
curl -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status
```

**Successful Response**:
```json
{
  "success": true,
  "active": true,
  "lastRun": "2025-12-11T04:19:15.003Z",
  "lastResult": {
    "checkfrontCount": 41,
    "airtableCount": 39,
    "missingCount": 0
  }
}
```

### Option 2: Web UI

1. Navigate to `/training/checkfront-reconciliation.html`
2. Enter your Admin API Key
3. The connection status should show "Connected" for both Checkfront and Airtable

---

## API Endpoints

### Check Scheduler Status
```
GET /api/admin/reconciliation-status
Header: X-Admin-Key: YOUR_KEY
```
Returns the reconciliation scheduler status including last run results.

### Trigger Manual Reconciliation
```
POST /api/admin/trigger-reconciliation
Header: X-Admin-Key: YOUR_KEY
```
Forces an immediate reconciliation run.

### View Webhook Logs
```
GET /api/admin/webhook-logs
Header: X-Admin-Key: YOUR_KEY
```
Returns the in-memory webhook audit log.

### Debug Checkfront API
```
GET /api/reconciliation/debug?adminKey=YOUR_KEY
```
Returns raw Checkfront API response for debugging.

### Compare Bookings
```
GET /api/reconciliation/compare?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&adminKey=YOUR_KEY
```
Compares bookings between the two systems for the given date range.

### Sync Missing Bookings
```
POST /api/reconciliation/sync
Header: X-Admin-Key: YOUR_KEY
Body: { "bookingCodes": ["CODE1", "CODE2"] }
```
Syncs specified bookings from Checkfront to Airtable.

### Get Single Booking
```
GET /api/reconciliation/booking/BOOKING_CODE?adminKey=YOUR_KEY
```
Fetches a specific booking from both systems for comparison.

---

## Checkfront API Technical Details

### Base URL
```
https://{CHECKFRONT_HOST}/api/3.0/
```

### Key Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/booking/index` | List bookings | Use this, NOT `/booking` |
| `/booking/{id}` | Get single booking | By booking_id |
| `/item` | List items/products | For category mapping |
| `/ping` | Test connection | Quick health check |
| `/account` | Account info | Verify credentials |

### Booking List Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | YYYY-MM-DD | Filter start date |
| `end_date` | YYYY-MM-DD | Filter end date |
| `limit` | Integer | Results per page (max 100) |
| `page` | Integer | Page number (1-indexed) |
| `status_id` | String | Filter by status (PAID, PART, PEND, VOID, STOP) |

### Response Structure

```json
{
  "version": "3.0",
  "account_id": 2,
  "host_id": "boat-hire-manly.checkfront.com",
  "request": {
    "records": 10,
    "total_records": 45,
    "page": 1,
    "pages": 5
  },
  "booking/index": {
    "2411": {
      "booking_id": 2411,
      "code": "AVHY-260825",
      "status_id": "PAID",
      "status_name": "Paid",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "total": "770.00",
      "created_date": 1756164798
    }
  }
}
```

**⚠️ Key Point**: Bookings are in `response['booking/index']`, NOT `response.booking` or `response.bookings`.

---

## Security Notes

1. **Never commit credentials** to version control
2. **Use a strong admin key** - create a unique secure key
3. **Limit API key permissions** in Checkfront if possible
4. The admin key can be provided via:
   - `X-Admin-Key` header (preferred)
   - `adminKey` query parameter

---

## Troubleshooting

### "Checkfront API not configured"
- Ensure all three environment variables are set in Railway:
  - `CHECKFRONT_HOST`
  - `CHECKFRONT_CONSUMER_KEY`
  - `CHECKFRONT_CONSUMER_SECRET`
- Check for typos in variable names
- Verify Railway has redeployed after adding variables

### "Authentication failed" or 401 Error
- Verify your Consumer Key and Secret are correct
- Check that the API credentials are still active in Checkfront
- Ensure the host doesn't include `https://`
- Try the `/ping` endpoint first to test basic connectivity

### "Unauthorized - Invalid admin key"
- Check the admin key matches what's set in `ADMIN_API_KEY`
- The key is case-sensitive
- Try both header and query parameter methods

### No bookings returned
- Verify the date range is correct
- Check that bookings exist in Checkfront for that period
- The API uses Sydney timezone for date calculations
- Use the debug endpoint to see raw response

### 403 Forbidden Error
- Your API credentials may not have permission to access bookings
- Check API permissions in Checkfront Developer settings

### 0 bookings but API connected
- Verify you're parsing `response['booking/index']` not `response.booking`
- Check pagination - you may need to fetch multiple pages
- Use the debug endpoint to see the actual response structure

---

## File Locations

| File | Purpose |
|------|---------|
| `/api/checkfront-api.js` | Checkfront API client with OAuth 1.0a |
| `/api/checkfront-reconciliation.js` | Reconciliation API endpoints |
| `/api/reconciliation-scheduler.js` | Automatic reconciliation scheduler |
| `/api/webhook-audit-log.js` | Webhook audit logging |
| `/training/checkfront-reconciliation.html` | Admin UI for running reconciliation |

---

## Related Documentation

- [Webhook Reliability Solution](./WEBHOOK_RELIABILITY_SOLUTION.md)
- [Checkfront Booking Flow Analysis](./CHECKFRONT_BOOKING_FLOW_ANALYSIS_DEC_2025.md)
- [Checkfront Webhook Flow](./CHECKFRONT_WEBHOOK_FLOW.md)
- [Full Investigation Guide](../../05-troubleshooting/CHECKFRONT_AIRTABLE_RECONCILIATION_DEC_2025.md)

---

*Last updated: December 11, 2025*

