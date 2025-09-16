# Webhook Payload Testing Guide

## Overview
This guide explains how to capture and analyze the exact webhook payload from your booking system to properly debug the order items issue.

## Option 1: Using the Built-in Webhook Logger (Recommended)

I've created a webhook logger endpoint in your MBH Staff Portal that will capture and save webhook payloads.

### Setup Steps

1. **Deploy the updated code** (already added to your server.js):
   ```bash
   git add -A
   git commit -m "Add webhook logger for debugging booking payloads"
   git push origin main
   ```

2. **Configure your booking system** to send webhooks to:
   ```
   https://[your-railway-domain]/api/webhook-logger
   ```

3. **Create a test booking** with multiple items (boat + add-ons)

4. **View the captured webhook data**:
   - Visit: `https://[your-railway-domain]/api/webhook-logs`
   - Or check server logs in Railway

### The Logger Captures:
- Full request body
- Headers
- Query parameters
- Timestamp
- Saves to `/logs/webhook-[timestamp].json`

## Option 2: Using Webhook.site (External Service)

If you prefer not to deploy code changes:

1. **Go to https://webhook.site**
   - You'll get a unique URL like: `https://webhook.site/[unique-id]`

2. **Configure your booking system** to send webhooks to this URL

3. **Create a test booking**

4. **View the payload** on webhook.site and copy it

5. **Share the JSON payload** with me for analysis

## Option 3: Using RequestBin

1. **Go to https://requestbin.com**
2. **Create a new bin**
3. **Use the provided URL** in your booking system
4. **Make a test booking**
5. **View and copy the payload**

## What to Look For

When you capture the webhook, we need to see:
- How the order items are structured
- Whether items are in an array or object
- The exact field names being used
- How SKUs and prices are formatted

## Example Test Booking

Create a booking with:
- 1x 12 Person BBQ Boat
- 1x Lilly Pad
- 1x Fishing Rods

This will help us see how multiple items are sent in the payload.

## Sharing the Results

Once you have the webhook payload:

1. **If using the built-in logger**:
   - Copy the response from `/api/webhook-logs`
   - Or copy from the log file

2. **If using external service**:
   - Copy the entire JSON payload

3. **Share it here** so I can:
   - Analyze the exact structure
   - Update the webhook script accordingly
   - Ensure all items are captured correctly

## Troubleshooting

If the webhook logger isn't working:

1. **Check Railway logs** for any errors
2. **Ensure the route is accessible**:
   ```bash
   curl -X POST https://[your-domain]/api/webhook-logger \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
3. **Check file permissions** for the logs directory

## Security Note

The webhook logger is for debugging only. Once we've fixed the issue:
1. Remove the webhook logger route from server.js
2. Delete the `/api/webhook-logger.js` file
3. Clear any logged webhook data

This ensures no sensitive booking data is stored unnecessarily.
