# 🔧 Square Integration Environment Setup

## Current Status
The Square webhook is deployed and ready, but it needs environment variables to function properly.

### What's Working ✅
- Square webhook endpoint is live
- Ice Cream Boat Sales table is created with all fields
- Webhook filters for "Ice-Cream-Boat-Sales" category only

### What's Needed ⚠️
You need to create a `.env` file locally and set Railway environment variables.

## Step 1: Create Local .env File

Create a file named `.env` in the project root:

```bash
cd /Users/harryprice/kursol-projects/mbh-staff-portal
touch .env
```

Add these variables to your `.env` file:

```env
# Airtable Configuration (REQUIRED)
AIRTABLE_API_KEY=your_actual_airtable_api_key_here

# Square Configuration
SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ

# Twilio Configuration (optional for testing)
TWILIO_ACCOUNT_SID=dummy_for_testing
TWILIO_AUTH_TOKEN=dummy_for_testing
TWILIO_FROM_NUMBER=+1234567890

# Server Configuration
PORT=8080
NODE_ENV=development
```

## Step 2: Get Your Airtable API Key

1. Go to https://airtable.com/account
2. Click "Generate API key" or copy your existing key
3. Replace `your_actual_airtable_api_key_here` in the .env file

## Step 3: Restart Local Server

```bash
# Stop the current server (Ctrl+C)
# Start with environment variables
npm run dev
```

## Step 4: Test Locally

```bash
# Run the webhook test
SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ node test-square-webhook.js

# Or test direct Airtable integration
node test-ice-cream-direct.js
```

## Step 5: Test on Railway (Production)

The webhook is already live at:
```
https://mbh-production-f0d1.up.railway.app/api/square-webhook
```

1. **In Square Dashboard:**
   - Process a test sale with an item from "Ice-Cream-Boat-Sales" category
   - The webhook will automatically receive the payment event

2. **Monitor Railway Logs:**
   ```bash
   railway logs -f
   ```

3. **Check Airtable:**
   - Look in the "Ice Cream Boat Sales" table for new records

## Troubleshooting

### "Authentication required" error
- You need to add your Airtable API key to the .env file

### "Invalid webhook signature" error  
- Verify SQUARE_WEBHOOK_SIGNATURE_KEY matches: `CPK571BwzDvZCy58EhV8FQ`

### No records appearing
- Ensure Square items have "Ice-Cream-Boat-Sales" category (exact match)
- Check Railway logs for "Not an Ice-Cream-Boat-Sale" messages

## Next Steps
1. Add environment variables locally
2. Test with a real Square ice cream sale
3. Verify record appears in Airtable
