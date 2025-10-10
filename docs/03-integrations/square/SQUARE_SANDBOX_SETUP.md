# Square Sandbox Setup Guide

**Date**: September 26, 2025  
**Status**: Ready for Testing

## Your Sandbox Credentials

```
Application ID: sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
Access Token: EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
Environment: sandbox
```

## Step 1: Local Environment Setup

Add these to your `.env` file:

```env
# Square Sandbox Configuration
SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=to_be_added_after_webhook_creation
```

## Step 2: Create Webhook Endpoint

1. Go to: https://developer.squareup.com/apps
2. Select your sandbox application
3. Click on "Webhooks" in the left menu
4. Click "Add Endpoint"
5. Configure:
   - **Endpoint URL**: 
     - For local testing: Use ngrok URL (see Step 3)
     - For production: `https://mbh-production-f0d1.up.railway.app/api/square-webhook`
   - **Events to Listen For**:
     - ✅ payment.created
     - ✅ payment.updated
     - ✅ order.created (optional)
     - ✅ order.updated (optional)
6. Click "Save"
7. Copy the **Signature Key** and add to your `.env` as `SQUARE_WEBHOOK_SIGNATURE_KEY`

## Step 3: Local Testing with Ngrok

```bash
# 1. Install ngrok if needed
brew install ngrok

# 2. Start your local server
cd /Users/harryprice/kursol-projects/mbh-staff-portal
npm run dev

# 3. In another terminal, expose your local server
ngrok http 3000

# 4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# 5. Update webhook endpoint in Square to: https://abc123.ngrok.io/api/square-webhook
```

## Step 4: Test the Integration

### Option A: Use the Test Script

```bash
# Make sure server is running
node test-square-webhook.js
```

### Option B: Use Square Sandbox Dashboard

1. Go to Square Sandbox Dashboard
2. Create a test payment
3. Watch your server logs for webhook events
4. Check Airtable for new booking record

### Option C: Use Square API Explorer

1. Go to: https://developer.squareup.com/explorer/square/payments-api/create-payment
2. Switch to Sandbox mode
3. Create a test payment with:

```json
{
  "source_id": "cnon:card-nonce-ok",
  "idempotency_key": "test-payment-{{$timestamp}}",
  "amount_money": {
    "amount": 25000,
    "currency": "AUD"
  },
  "buyer_email_address": "test@example.com",
  "note": "Test boat rental from API"
}
```

## Step 5: Verify Integration

Check for:
- ✅ Webhook received (check server logs)
- ✅ Signature verified
- ✅ Airtable record created
- ✅ Booking appears in MBH Portal
- ✅ Add-on indicator shows (if applicable)

## Step 6: Set Up Catalog Items (Optional)

To test with actual boat types and add-ons:

1. Go to Square Sandbox Dashboard
2. Navigate to Items → Library
3. Create test items:
   - "4 Person Polycraft - Half Day" ($250)
   - "8 Person BBQ Boat - Full Day" ($605)
4. Create modifiers:
   - "Fishing Rods" ($30)
   - "Ice Bag" ($10)

## Common Issues & Solutions

### "Invalid signature" error
- Make sure you copied the webhook signature key correctly
- Verify it's in your .env file
- Restart your server after adding

### Webhook not receiving events
- Check ngrok is running and URL is correct
- Verify webhook is enabled in Square
- Check event types are selected

### No Airtable record created
- Check server logs for errors
- Verify Airtable API is working
- Check booking doesn't already exist

## Security Reminders

⚠️ **IMPORTANT**: 
- These are SANDBOX credentials for testing only
- Never commit real credentials to git
- Use Railway environment variables for production
- Rotate access tokens regularly

## Next Steps

Once testing is successful:
1. Get production credentials
2. Update Railway environment variables
3. Create production webhook
4. Test with small real transaction
5. Monitor logs for first few days

---

**Support**: Check server logs with `railway logs -f` when deployed
