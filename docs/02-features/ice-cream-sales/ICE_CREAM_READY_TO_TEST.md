# 🍦 Ice Cream Boat Sales - Ready to Test!

## ✅ Setup Complete

Your Square webhook is now configured to save ice cream sales to the new **"Ice Cream Boat Sales"** table in Airtable!

### What's Changed:
1. **Created all necessary fields** in your Ice Cream Boat Sales table
2. **Updated webhook** to save to the new table (ID: `tblTajm845Fiij8ud`)
3. **Deployed to Railway** - webhook is live and ready

## 🧪 Test Your Integration

### Option 1: Test with Square Dashboard (Recommended)
1. Go to Square Dashboard
2. Create a test sale with an item from "Ice-Cream-Boat-Sales" category
3. Complete the payment
4. Check Railway logs: `railway logs -f`
5. Check your "Ice Cream Boat Sales" table in Airtable

### Option 2: Test with Local Script
```bash
# Make sure server is running locally
npm run dev

# In another terminal
node test-square-webhook.js
```

## 📊 What to Look For

### In Railway Logs:
```
🔔 Square webhook received
✅ Order contains Ice-Cream-Boat-Sales items
🍦 Ice Cream Sale Summary:
  Receipt: ICE-XXXXXX
  Customer: Sarah Johnson
  Vessel/Operation: Ice Cream Boat - Walker Courtney
  Total: $25
✅ Ice cream sale recorded: recXXXXXXXXXXXXXX
```

### In Airtable Ice Cream Boat Sales Table:
- New record with all sale details
- Customer information captured
- Correct vessel/operation name
- Proper date/time in Sydney timezone

## 🚫 Non-Ice Cream Sales
Regular boat hire sales will be filtered out:
```
❌ Order does not contain Ice-Cream-Boat-Sales items
⏭️ Skipping - Not an Ice-Cream-Boat-Sale
```

## 🎯 Next Steps
1. Process a real ice cream sale in Square
2. Verify it appears in the Ice Cream Boat Sales table
3. Regular boat bookings continue to use Checkfront

## 🆘 Troubleshooting
- **No webhook received?** Check webhook URL in Square: `https://mbh-production-f0d1.up.railway.app/api/square-webhook`
- **Signature error?** Verify SQUARE_WEBHOOK_SIGNATURE_KEY in Railway
- **Not recording?** Ensure items have "Ice-Cream-Boat-Sales" category in Square

The system is now live and ready for ice cream sales! 🎉
