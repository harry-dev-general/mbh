# Airtable Input Variables Setup Guide

## The Issue
Your current Airtable automation is configured to pass individual values from the webhook, but the `bookingItems` variable is only capturing a single SKU string instead of the full items array.

## Solution: Pass the Full Webhook Data

Instead of mapping individual fields, you need to pass the entire webhook body to the script so it can process all items.

## Required Changes to Input Variables

### Option 1: Pass Full Webhook Body (Recommended)

Change your input variables to just one:

1. **Delete all existing input variables**
2. **Add ONE new input variable:**
   - Name: `webhookData`
   - Value: Click the blue (+) → Select `body` (the root level)

This will pass the entire webhook payload to the script.

### Option 2: Pass Specific Nested Objects

If Option 1 doesn't work, try these variables:

1. **booking**
   - Value: `body` → `booking`

2. **order** 
   - Value: `body` → `booking` → `order`

3. **items**
   - Value: `body` → `booking` → `order` → `items`

## Why This is Happening

The current setup has `bookingItems` pointing to `body → booking → order → items → item`, but this path returns just a single item's SKU, not the array of items. The webhook has multiple items, but your current mapping only captures one.

## Testing the Fix

1. Update your input variables as described above
2. Use the script from `airtable-webhook-checkfront-fix.js` (the original one)
3. Test with a booking that has multiple items
4. Check the console logs to see if all items are being processed

## Expected Console Output

After fixing, you should see:
```
📦 Processing 3 items from order
  Item 1: 12personbbqboat-halfday (Category: 2, Qty: 1, Price: $550)
    ✅ Identified as BOAT
  Item 2: lillypad (Category: 4, Qty: 1, Price: $55)
    ✅ Identified as ADD-ON: Lilly Pad - $55.00
  Item 3: fishingrods (Category: 7, Qty: 1, Price: $20)
    ✅ Identified as ADD-ON: Fishing Rods - $20.00
```

## Alternative: Use the Simple Script

If you prefer to keep individual variables, I've created `airtable-webhook-simple-inputs.js` that works with your current setup, but it won't capture multiple items properly. The webhook body approach is strongly recommended.
