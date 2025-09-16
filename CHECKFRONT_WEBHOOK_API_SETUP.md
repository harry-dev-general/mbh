# Checkfront Webhook API Setup Guide

## Overview
This guide will help you set up a custom API endpoint on your Railway-hosted MBH Staff Portal to properly handle Checkfront webhooks and create/update Airtable records with all order items.

## Setup Steps

### 1. Add Environment Variables to Railway

Go to your Railway project and add these environment variables:

```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
```

To get your Airtable API key:
1. Go to https://airtable.com/account
2. Generate a personal access token with these scopes:
   - `data.records:read`
   - `data.records:write`
   - Base: Select your "MBH Bookings Operation" base

### 2. Deploy the Code

The webhook handler is already added to your codebase. Just push to GitHub:

```bash
git add -A
git commit -m "Add Checkfront webhook handler API"
git push origin main
```

Railway will automatically deploy the changes.

### 3. Configure Checkfront Webhook

Once deployed, update your Checkfront webhook URL to:

```
https://mbh-production-f0d1.up.railway.app/api/checkfront/webhook
```

### 4. Test the Endpoint

You can verify the endpoint is working by visiting:
```
https://mbh-production-f0d1.up.railway.app/api/checkfront/test
```

You should see:
```json
{
  "success": true,
  "message": "Checkfront webhook handler is running",
  "timestamp": "2025-09-16T..."
}
```

## How It Works

1. **Checkfront sends webhook** → Your Railway API
2. **API processes all items** (boats and add-ons)
3. **API categorizes items** using category mappings
4. **API calls Airtable API** to create/update records
5. **Airtable automation** triggers for SMS notifications

## Features

- ✅ Processes ALL order items (not just the first)
- ✅ Properly categorizes boats vs add-ons
- ✅ Formats add-on names and prices
- ✅ Handles booking updates (deduplication)
- ✅ Timezone-aware date/time formatting
- ✅ Comprehensive error logging

## Testing with Sample Data

You can test the webhook with curl:

```bash
curl -X POST https://mbh-production-f0d1.up.railway.app/api/checkfront/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "booking": {
      "code": "TEST-123",
      "status": "PEND",
      "start_date": "1757976300",
      "end_date": "1757991600",
      "created_date": "1757920054",
      "customer": {
        "name": "Test Customer",
        "email": "test@example.com"
      },
      "order": {
        "total": "625.00",
        "items": {
          "item": [
            {
              "sku": "12personbbqboat-halfday",
              "category_id": "2",
              "qty": "1",
              "total": "550.00"
            },
            {
              "sku": "lillypad",
              "category_id": "4",
              "qty": "1",
              "total": "55.00"
            },
            {
              "sku": "fishingrods",
              "category_id": "7",
              "qty": "1",
              "total": "20.00"
            }
          ]
        }
      }
    }
  }'
```

## Monitoring

Check Railway logs to see webhook processing:
- 📥 Incoming webhooks
- 📦 Item processing details
- ✅ Success/failure status
- 📊 Booking summaries

## Troubleshooting

### "Invalid API Key" Error
- Verify `AIRTABLE_API_KEY` is set correctly in Railway
- Ensure the API key has the required scopes

### "Table not found" Error
- Verify `AIRTABLE_BASE_ID` matches your base
- Check that the Bookings Dashboard table exists

### Items not categorizing correctly
- Review category mappings in `/api/checkfront-webhook.js`
- Add new category IDs as needed

## Next Steps

1. **Update Airtable Automation**
   - Remove the webhook trigger
   - Add "When record is created" trigger
   - Keep your SMS script for notifications

2. **Remove Webhook Logger** (if you added it)
   - Delete `/api/webhook-logger.js`
   - Remove the route from `server.js`

3. **Monitor Performance**
   - Check Railway metrics
   - Review Airtable API usage
   - Optimize as needed

## Benefits

✅ **Full Data Capture**: All order items are processed correctly
✅ **No Airtable Limitations**: Bypasses webhook interface restrictions
✅ **Better Error Handling**: Comprehensive logging and error messages
✅ **Scalable**: Can handle any number of items per order
✅ **Maintainable**: Easy to update category mappings and add features
