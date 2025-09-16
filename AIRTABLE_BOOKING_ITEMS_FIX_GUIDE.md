# Airtable Webhook Booking Items Fix Guide

## Problem Description
The Airtable automation was only recording the booking code (e.g., "2437") in the "Booking Items" field instead of capturing all the actual items ordered by customers (e.g., "12 Person BBQ Boat, Lilly Pad, Fishing Rods").

## Root Cause
The webhook payload contains items in a nested structure under `order.items`, but the original script wasn't properly parsing this array structure. It was trying to read `bookingItems` directly from the input config, which resulted in capturing the wrong data.

## Solution Overview
The fixed script now:
1. Properly parses the webhook payload to extract the `order.items` array
2. Handles both direct and nested item structures
3. Extracts SKU, quantity, and price for each item
4. Formats SKU names to be human-readable
5. Combines all items into a formatted string for the "Booking Items" field

## Implementation Steps

### 1. Update the Airtable Automation Script

Replace the existing webhook automation script with the fixed version that includes:

```javascript
// Extract all items from the order
let bookingItemsArray = [];
if (orderData.items) {
    // Parse items array and extract details
    // Format each item with name, quantity, and price
}
```

### 2. Key Changes Made

1. **Webhook Parsing**: Added logic to parse the webhook payload if it's a string
2. **Items Extraction**: Created logic to handle the nested `order.items` structure
3. **SKU Formatting**: Added `formatSKUName()` function to convert SKUs like "12personbbqboat-hire" to "12 Person BBQ Boat"
4. **Multiple Items Support**: Builds a comma-separated list of all items with quantities and prices

### 3. Example Output

**Before Fix:**
- Booking Items: "2437"

**After Fix:**
- Booking Items: "12 Person BBQ Boat - $550.00, Lilly Pad - $55.00, Fishing Rods - $20.00"

### 4. Testing the Fix

1. Send a test webhook with multiple items
2. Check that the "Booking Items" field contains all items, not just a code
3. Verify that quantities and prices are displayed correctly
4. Confirm that the SMS notification includes all booked items

### 5. Additional Considerations

- The script maintains backward compatibility - if the new parsing fails, it falls back to the original `bookingItems` value
- SKU mappings can be extended in the `skuMappings` object for new products
- The formatted output includes quantity (if > 1) and price for each item

## Benefits

1. **Complete Order Visibility**: Staff can see all items booked, not just the boat
2. **Better Customer Communication**: SMS confirmations include full booking details
3. **Accurate Record Keeping**: Airtable records reflect the complete order
4. **Financial Tracking**: Individual item prices are preserved

## Troubleshooting

If items are still not appearing correctly:

1. **Check Webhook Format**: Log the raw webhook data to ensure items are being sent
2. **Verify Field Names**: Ensure "Booking Items" field exists in Airtable
3. **Test SKU Mappings**: Add new SKUs to the mapping object as needed
4. **Review Console Logs**: The script logs the number of items found and their formatted output

## Future Enhancements

Consider:
1. Creating a separate "Order Items" table with linked records for better data structure
2. Adding item categories (boats, accessories, packages)
3. Tracking inventory availability per item
4. Creating item-specific pricing rules
