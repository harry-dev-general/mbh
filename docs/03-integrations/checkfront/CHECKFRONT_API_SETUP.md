# Checkfront API Setup Guide

## Overview

This guide explains how to set up the Checkfront API integration for the MBH Staff Portal reconciliation tool. The reconciliation tool compares bookings between Checkfront and Airtable to identify discrepancies.

## Required Environment Variables

Add these environment variables to your Railway deployment:

### Checkfront API Credentials

| Variable | Description | From Checkfront |
|----------|-------------|-----------------|
| `CHECKFRONT_HOST` | Your Checkfront subdomain (without https://) | Your account URL |
| `CHECKFRONT_CONSUMER_KEY` | API Consumer Key | Consumer Key |
| `CHECKFRONT_CONSUMER_SECRET` | API Consumer Secret | Consumer Secret |

### Optional (Usually Not Needed)

| Variable | Description |
|----------|-------------|
| `CHECKFRONT_AUTHORIZE_URL` | Authorize Token URL (only if using OAuth flow) |
| `CHECKFRONT_ACCESS_TOKEN_URL` | Access Token URL (only if using OAuth flow) |

### Admin Authentication

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_KEY` | Key required to access reconciliation endpoints | `mbh-admin-2025` |

## Getting Checkfront API Credentials

1. Log in to your Checkfront account
2. Go to **Manage** → **Developer** → **API**
3. Find or create your API credentials
4. Copy the values:
   - **Consumer Key** → `CHECKFRONT_CONSUMER_KEY`
   - **Consumer Secret** → `CHECKFRONT_CONSUMER_SECRET`
5. Your host is your Checkfront URL without `https://` (e.g., `boathiremanly.checkfront.com`)

## Setting Up in Railway

1. Go to your Railway project dashboard
2. Click on your MBH Staff Portal service
3. Navigate to **Variables**
4. Add each environment variable:

```
CHECKFRONT_HOST=boathiremanly.checkfront.com
CHECKFRONT_CONSUMER_KEY=your-consumer-key-here
CHECKFRONT_CONSUMER_SECRET=your-consumer-secret-here
ADMIN_API_KEY=your-secure-admin-key
```

5. Railway will automatically redeploy with the new variables

## Verifying the Setup

1. Navigate to `/training/checkfront-reconciliation.html`
2. Enter your Admin API Key
3. The connection status should show "Connected" for both Checkfront and Airtable

## API Endpoints

### Check Status
```
GET /api/reconciliation/status?adminKey=YOUR_KEY
```
Returns the connection status for Checkfront and Airtable APIs.

### Compare Bookings
```
GET /api/reconciliation/compare?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&adminKey=YOUR_KEY
```
Compares bookings between the two systems for the given date range.

### Sync Missing Bookings
```
POST /api/reconciliation/sync
Headers: X-Admin-Key: YOUR_KEY
Body: { "bookingCodes": ["CODE1", "CODE2"] }
```
Syncs specified bookings from Checkfront to Airtable.

### Get Single Booking
```
GET /api/reconciliation/booking/BOOKING_CODE?adminKey=YOUR_KEY
```
Fetches a specific booking from both systems for comparison.

## Security Notes

1. **Never commit credentials** to version control
2. **Use a strong admin key** - change the default `mbh-admin-2025` to something unique
3. **Limit API key permissions** in Checkfront to read-only if possible
4. The admin key can be provided via:
   - `X-Admin-Key` header
   - `adminKey` query parameter

## Troubleshooting

### "Checkfront API not configured"
- Ensure all three environment variables are set in Railway:
  - `CHECKFRONT_HOST`
  - `CHECKFRONT_CONSUMER_KEY`
  - `CHECKFRONT_CONSUMER_SECRET`
- Check for typos in variable names

### "Authentication failed" or 401 Error
- Verify your Consumer Key and Secret are correct
- Check that the API credentials are still active in Checkfront
- Ensure the host doesn't include `https://`

### "Unauthorized - Invalid admin key"
- Check the admin key matches what's set in `ADMIN_API_KEY`
- The key is case-sensitive

### No bookings returned
- Verify the date range is correct
- Check that bookings exist in Checkfront for that period
- The API uses Sydney timezone for date calculations

### 403 Forbidden Error
- Your API credentials may not have permission to access bookings
- Check API permissions in Checkfront Developer settings

## File Locations

| File | Purpose |
|------|---------|
| `/api/checkfront-api.js` | Checkfront API client with OAuth2 |
| `/api/checkfront-reconciliation.js` | Reconciliation API endpoints |
| `/training/checkfront-reconciliation.html` | Admin UI for running reconciliation |

## Related Documentation

- [Checkfront Webhook Flow](./CHECKFRONT_WEBHOOK_FLOW.md)
- [Checkfront Booking Flow Analysis](./CHECKFRONT_BOOKING_FLOW_ANALYSIS_DEC_2025.md)

