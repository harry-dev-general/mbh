# Checkfront Webhook Fix - Implementation Checklist

## Problem Solved
The webhook from Checkfront sends items in an XML-converted-to-JSON structure. Your current script wasn't parsing the nested `booking.order.items.item` array correctly, resulting in only the booking code being saved instead of the actual item details.

## Implementation Steps

### 1. Create the "Add-ons" Field in Airtable

- [ ] Go to your **Bookings Dashboard** table in Airtable
- [ ] Click "+" to add a new field
- [ ] **Field Name**: `Add-ons`
- [ ] **Field Type**: "Single line text" (or "Long text" if you expect many add-ons)
- [ ] Save the field

### 2. Update Your Airtable Automation Script

- [ ] In your Airtable automation, go to the second step (Run a script)
- [ ] Replace the entire script with the contents of `airtable-webhook-checkfront-fix.js`
- [ ] The new script will:
  - Parse the Checkfront XML structure correctly
  - Identify boats by category ID (2, 3) or SKU patterns
  - Put boat SKU in "Booking Items" field
  - Put add-ons in the new "Add-ons" field

### 3. Test the Implementation

1. **Create a test booking** with:
   - 1x Boat (any type)
   - 1x Lilly Pad
   - 1x Fishing Rods

2. **Check Airtable** to verify:
   - "Booking Items" contains: `12personbbqboat-halfday` (or your boat SKU)
   - "Add-ons" contains: `Lilly Pad - $55.00, Fishing Rods - $20.00`
   - "Booked Boat Type" still shows the correct boat name

### 4. (Optional) Update SMS Script

If you want SMS notifications to include add-ons:
- [ ] Update step 3 of your automation with `airtable-sms-script-with-addons.js`
- [ ] This will include add-ons in booking confirmations

## What Changed

### Before:
- **Booking Items**: "2437" (just the booking code)

### After:
- **Booking Items**: "12personbbqboat-halfday" (actual boat SKU)
- **Add-ons**: "Lilly Pad - $55.00, Fishing Rods - $20.00" (formatted add-ons)

## Key Features of the Fix

1. **Handles Checkfront's XML structure**: Properly parses `booking.order.items.item`
2. **Smart categorization**: Uses category IDs to identify boats vs add-ons
3. **Preserves existing functionality**: Your "Booked Boat Type" field continues to work
4. **Detailed logging**: Console logs show exactly what's being processed
5. **Price formatting**: Shows individual prices for each add-on

## Category Mapping

Based on your Checkfront setup:
- **Category ID 2**: Pontoon BBQ Boat (BOAT)
- **Category ID 3**: 4.1m Polycraft 4 Person (BOAT)
- **Category ID 4**: Add ons (ADD-ON)
- **Category ID 5**: Child Life Jacket (ADD-ON)
- **Other IDs**: Treated as add-ons by default

The script uses this mapping to determine which items are boats vs add-ons. If you add new boat categories in Checkfront, update the `categoryMapping` object in the script.

## Troubleshooting

If items aren't being categorized correctly:

1. **Check console logs** in the Airtable automation run history
2. **Verify category IDs** - you may need to add more boat category IDs to the array
3. **Test with different products** to ensure all SKUs are handled

## Benefits

✅ Complete order visibility in Airtable
✅ Staff can see all items booked (boats + add-ons)
✅ Better financial tracking with individual prices
✅ No disruption to existing workflows
✅ SMS notifications can include full order details

## Next Steps

1. Implement the changes above
2. Test with a real booking
3. Monitor for a day to ensure all bookings are captured correctly
4. Remove the webhook logger (if you deployed it) once everything is working
