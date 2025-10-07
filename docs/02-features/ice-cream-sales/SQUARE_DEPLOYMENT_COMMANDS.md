# Square Ice Cream Integration - Quick Deployment

Run these commands to deploy the Square webhook with ice cream filtering:

## 1. Install Square SDK locally (for testing)
```bash
cd /Users/harryprice/kursol-projects/mbh-staff-portal
npm install
```

## 2. Deploy to Railway with Environment Variables
```bash
# Set all Square environment variables
railway variables set SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
railway variables set SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
railway variables set SQUARE_ENVIRONMENT=sandbox
railway variables set SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ

# Deploy the latest code
railway up
```

## 3. Monitor Deployment
```bash
railway logs -f
```

## What's New:
- ✅ Square SDK added to package.json
- ✅ Webhook signature verification with your key
- ✅ Filters for only Ice-Cream-Boat-Sales category
- ✅ Extracts order details and modifiers
- ✅ Creates bookings with "Ice Cream Boat Operations" type

## Next Steps:
1. Create items in Square with "Ice-Cream-Boat-Sales" category
2. Make a test ice cream sale
3. Watch logs to see webhook processing
4. Check Airtable for new booking
