# Add-on Update & Merge Implementation

## Overview

This document describes the implementation of add-on merging functionality in the Checkfront webhook handler. When a customer or staff member adds new add-ons to an existing booking, the system now properly merges them with existing add-ons instead of replacing them.

## Problem Solved

**Previous Behavior:**
- When Checkfront sent a webhook for a booking update (e.g., customer adds a Kayak to existing booking)
- The webhook handler would REPLACE all existing add-ons with whatever came in the webhook
- This caused issues if:
  - Staff had manually added add-ons via the management UI
  - The webhook only sent new add-ons, not the full list

**New Behavior:**
- Existing add-ons are preserved
- New add-ons from the webhook are merged in
- Duplicate items are handled intelligently (webhook data takes precedence for price/quantity)

## Implementation Details

### Files Modified

**`/api/checkfront-webhook.js`**:
1. Added `parseAddOns()` function - Parses add-on strings like `"Lilly Pad - $55.00, 2 x Fishing Rods - $40.00"`
2. Added `formatAddOns()` function - Formats add-on arrays back to the standard string format
3. Added `mergeAddOns()` function - Merges two add-on arrays, avoiding duplicates
4. Updated `findExistingBooking()` - Now also fetches the `Add-ons` field
5. Updated `createOrUpdateAirtableRecord()` - Now merges add-ons when updating existing bookings

### Merge Logic

```javascript
function mergeAddOns(existingAddOns, newAddOns) {
    const addOnsMap = new Map();
    
    // Add existing add-ons to map
    existingAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        addOnsMap.set(key, addon);
    });
    
    // Add/update with new add-ons (new ones take precedence)
    newAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        addOnsMap.set(key, addon);
    });
    
    return Array.from(addOnsMap.values());
}
```

### Key Behaviors

| Scenario | Result |
|----------|--------|
| New add-on added | Appended to existing list |
| Same add-on with new price | Webhook price takes precedence |
| Same add-on with new quantity | Webhook quantity takes precedence |
| Manual add-on not in webhook | Preserved |
| Empty existing, webhook has items | All webhook items added |

## Data Format

The add-ons field uses a consistent string format:
```
"Item Name - $XX.XX, 2 x Another Item - $YY.YY"
```

### Parsed Structure
```javascript
{
    quantity: 2,
    name: "Another Item",
    price: 30.00,
    original: "2 x Another Item - $30.00"
}
```

## Logging

When add-ons are merged, the following is logged:
```
📝 Updating existing booking: MTAH-041125 (PEND → PAID)
🔀 Merged add-ons: 2 existing + 1 new = 3 total
   Result: Lilly Pad - $55.00, Fishing Rods - $20.00, Kayak - $45.00
```

## Testing

A test script is available at `/test-addon-merge.js`:
```bash
node test-addon-merge.js
```

This tests:
1. Adding new add-ons to existing booking
2. Price updates for existing add-ons
3. Manual add-ons preserved when not in webhook
4. Quantity handling
5. Empty existing, webhook adds items
6. Case insensitivity

## Verification

To verify the implementation is working in production:

1. **Check webhook logs**:
   ```bash
   curl -H "X-Admin-Key: mbh-admin-2025" \
     https://mbh-production-f0d1.up.railway.app/api/admin/webhook-logs
   ```

2. **Look for merge log entries** with the 🔀 emoji

3. **Test with a real booking**:
   - Find a booking in Checkfront with add-ons
   - Add a new add-on to it
   - Verify the Airtable record shows both old and new add-ons

## Related Files

- `/api/addons-management.js` - Manager UI add-ons API (unchanged)
- `/docs/02-features/bookings/ADD_ONS_MANAGEMENT_IMPLEMENTATION_GUIDE.md` - Manager add-ons guide
- `/docs/02-features/bookings/BOOKING_DUPLICATE_SOLUTION.md` - Deduplication context

## Date Implemented

December 12, 2025

## Author

AI Assistant (Claude)
