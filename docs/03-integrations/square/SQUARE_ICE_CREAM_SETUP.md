# Square Ice Cream Boat Sales Integration

**Date**: September 26, 2025  
**Status**: Configured and Ready

## Webhook Configuration

Your webhook is now configured with:
- **Signature Key**: `CPK571BwzDvZCy58EhV8FQ`
- **Subscription ID**: `wbhk_580abb9ed1d5478684ff5da3f269e21e`
- **Category Filter**: `Ice-Cream-Boat-Sales`

## How It Works

The webhook handler now:
1. ✅ Verifies webhook signatures using your key
2. ✅ Filters for only "Ice-Cream-Boat-Sales" category transactions
3. ✅ Extracts ice cream boat details from orders
4. ✅ Creates bookings in Airtable with proper categorization

## Ice Cream Sales Flow

```
Square Ice Cream Sale
        ↓
Payment Completed
        ↓
Webhook Triggered
        ↓
Check Category = "Ice-Cream-Boat-Sales"?
        ↓ Yes              ↓ No
Create Booking      Skip (Return OK)
        ↓
Appears in Portal
```

## Setting Up Ice Cream Items in Square

1. **Create Category**
   - Name: `Ice-Cream-Boat-Sales` (exactly as shown)
   - Apply to all ice cream related items

2. **Create Items**
   ```
   Examples:
   - "Ice Cream Boat - Walker Courtney" 
   - "Ice Cream Boat - Bronte Sproustte"
   - "Ice Cream Operations - Pumice Stone"
   ```

3. **Add Modifiers** (Optional)
   ```
   - Extra Ice
   - Special Flavors
   - Delivery charges
   ```

## Environment Variables

Add to Railway:
```bash
railway variables set SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ
```

Or add to local `.env`:
```
SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ
```

## Testing Ice Cream Sales

### 1. Create Test Sale in Square
- Use an item from "Ice-Cream-Boat-Sales" category
- Complete the payment

### 2. Monitor Logs
```bash
# Local
npm run dev

# Railway
railway logs -f
```

### 3. Expected Log Output
```
🔔 Square webhook received
📋 Event type: payment.updated
💰 Payment xxx: $250 AUD
🔍 Checking order for Ice-Cream-Boat-Sales category...
📦 Item category: Ice-Cream-Boat-Sales
✅ Order contains Ice-Cream-Boat-Sales items
📊 Creating Airtable record...
✅ Booking created: recXXXXXXXXXX
```

### 4. Skipped Transactions
For non-ice cream sales:
```
🔍 Checking order for Ice-Cream-Boat-Sales category...
📦 Item category: Boat Rentals
❌ Order does not contain Ice-Cream-Boat-Sales items
⏭️ Skipping - Not an Ice-Cream-Boat-Sale
```

## Booking Record Format

Ice cream sales will appear in Airtable as:
```
Booking Code: SQ-20250926-XXXX
Customer Name: [From payment]
Phone Number: [If provided]
Status: PAID
Total Amount: [Sale amount]
Booking Items: Ice Cream Boat - [Vessel Name]
Add-ons: [Any modifiers]
Booking Date: [Current date]
Payment Source: Square
```

## Troubleshooting

### "Invalid webhook signature" Error
- Verify `SQUARE_WEBHOOK_SIGNATURE_KEY` is set correctly
- Check Railway environment variables
- Restart server after adding key

### No Ice Cream Sales Recording
- Verify items are in "Ice-Cream-Boat-Sales" category
- Check category name matches exactly (case-sensitive)
- Review webhook logs for category check

### All Sales Being Recorded
- Check category filter is working
- Verify items are properly categorized in Square
- Look for "Checking order for Ice-Cream-Boat-Sales" in logs

## Next Steps

1. **Production Testing**
   - Make a real ice cream sale
   - Verify it appears in portal
   - Check add-on indicators show

2. **Staff Training**
   - Ensure ice cream items are categorized correctly
   - Train on Square POS for ice cream sales
   - Show how to view in portal

3. **Reporting**
   - Ice cream sales will be separate in Airtable
   - Can filter by "Ice Cream Boat Operations"
   - Track vessel-specific ice cream revenue
