# Airtable Webhook Solutions Summary

## The Problem
Airtable's webhook trigger interface forces you to drill down into nested structures and doesn't properly handle arrays. When you try to access `order.items`, it only gives you the first item's data instead of the full array.

## Solution Options

### 1. Single Script with Workarounds (CURRENT APPROACH)
Use the script in `airtable-webhook-text-parsing-solution.js` which:
- Works with the limited data Airtable provides
- Handles single-item bookings correctly
- Identifies boats vs add-ons based on SKU patterns
- Provides clear logging about limitations

### 2. Add Raw Webhook Body as Text
**Best workaround within Airtable:**

1. Add a new input variable:
   - Name: `webhookBodyText`
   - Value: Try to select just `body` without drilling down
   - If that doesn't work, contact Airtable support to enable raw webhook body access

2. The script will parse this JSON text and extract all items

### 3. External Webhook Processor (RECOMMENDED)
Since Airtable has limitations with nested webhook data, consider:

**Option A: Use Make/Integromat**
1. Point Checkfront webhook to Make
2. Make processes the webhook and extracts all items
3. Make creates/updates Airtable records with proper data

**Option B: Use Zapier**
1. Checkfront → Zapier webhook
2. Zapier formatter to extract items
3. Zapier → Airtable with formatted data

**Option C: Custom API (Most Control)**
1. Create a simple API endpoint (Vercel, Netlify Functions, etc.)
2. Receive Checkfront webhook
3. Process all items properly
4. Use Airtable API to create records

### 4. Repeating Group Approach (Limited)
While Repeating Groups are great for iterating over arrays, they can't solve the fundamental issue that Airtable's webhook trigger can't access the items array. You'd still need to get the array data first.

## Immediate Recommendation

For now, use the `airtable-webhook-text-parsing-solution.js` script which:
1. Handles single-item bookings (most common case)
2. Identifies boats correctly
3. Provides clear logging
4. Has provisions for parsing raw webhook text if Airtable enables it

## Long-term Recommendation

Set up an external webhook processor (Make, Zapier, or custom API) to:
1. Properly handle all order items
2. Calculate totals per item
3. Format data correctly
4. Send clean data to Airtable

This gives you full control and avoids Airtable's webhook limitations.

## Testing the Current Solution

1. Update your script to use `airtable-webhook-text-parsing-solution.js`
2. Test with a single-item booking (should work)
3. Check logs for guidance on multi-item bookings
4. Consider external processor for full functionality
