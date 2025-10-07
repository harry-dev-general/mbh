# Airtable Add-ons Field Implementation Guide

## Overview
This guide explains how to implement a new "Add-ons" field in your Bookings Dashboard table to capture non-vessel booking items while preserving your existing "Booking Items" → "Booked Boat Type" functionality.

## Why This Approach?
- **Preserves existing functionality**: The "Booking Items" field continues to work with your linked "Booked Boat Type" field
- **Captures all order data**: Add-ons like lilly pads, fishing rods, etc. are stored separately
- **Better organization**: Boats and add-ons are logically separated
- **No disruption**: Your existing automations and views continue to work

## Implementation Steps

### 1. Create the Add-ons Field in Airtable

1. Go to your **Bookings Dashboard** table in Airtable
2. Add a new field:
   - **Field Name**: `Add-ons`
   - **Field Type**: Single line text (or Long text if you expect many add-ons)
   - **Description**: "Additional items booked (e.g., Lilly Pad, Fishing Rods)"

### 2. Update Your Webhook Automation Script

Replace your current webhook script (Step 2 in the automation) with the new version from `airtable-webhook-addons-field.js`.

**Key features of the new script:**
- Separates items into boats vs add-ons
- Maintains the boat SKU in "Booking Items" field
- Formats add-ons nicely in the new "Add-ons" field

### 3. Update Your SMS Script (Optional)

If you want SMS notifications to include add-ons, replace your SMS script (Step 3) with the version from `airtable-sms-script-with-addons.js`.

**Enhanced SMS features:**
- Shows boat and add-ons separately
- Includes add-ons in payment confirmations
- Better formatted messages

## How It Works

### Item Classification
The script identifies boats vs add-ons using predefined lists:

**Boat SKUs** (go to "Booking Items"):
- 12personbbqboat-hire
- 4personpolycraft
- fullday12personbbqboat
- etc.

**Add-on SKUs** (go to "Add-ons"):
- lillypad
- fishingrods
- kayak
- sup
- esky
- etc.

### Example Output

For a booking with multiple items:
- **Booking Items**: `12personbbqboat`
- **Add-ons**: `Lilly Pad - $55.00, Fishing Rods - $20.00`

### SMS Example
```
🚤 Boat Hire Manly - Booking Confirmed

Booking: YCDC-150925
Customer: Test Booking

📅 Date: Monday, 16 Sep 2025
⏰ Time: 08:45 am - 01:00 pm
⏱️ Duration: 4 hours 15 minutes

Boat: 12personbbqboat
🎣 Add-ons: Lilly Pad - $55.00, Fishing Rods - $20.00
Status: PEND

See you at the marina! 🌊
```

## Testing

1. **Test with a multi-item order**: Create a test booking with a boat + add-ons
2. **Verify field population**: Check that:
   - "Booking Items" contains only the boat SKU
   - "Add-ons" contains the additional items
   - "Booked Boat Type" still shows the correct boat name
3. **Check SMS**: Verify SMS includes both boat and add-ons

## Customization

### Adding New SKUs
To add new products, update the arrays in the script:

```javascript
// For new boats
const boatSKUs = [
    // ... existing SKUs ...
    'newboatsku'
];

// For new add-ons
const addOnSKUs = [
    // ... existing SKUs ...
    'newaddonsku'
];
```

### Formatting Add-on Names
Update the `addOnMappings` object to customize how SKUs appear:

```javascript
const addOnMappings = {
    'lillypad': 'Lilly Pad',
    'newfancyitem': 'New Fancy Item',
    // ... etc
};
```

## Benefits

1. **No Breaking Changes**: Existing automations, formulas, and views continue working
2. **Complete Data Capture**: All booking items are recorded
3. **Better Reporting**: Can analyze add-on sales separately
4. **Improved Operations**: Staff can see exactly what to prepare
5. **Enhanced Customer Communication**: SMS includes full order details

## Rollback Plan

If needed, you can easily rollback:
1. Keep the "Add-ons" field (no harm in having it)
2. Revert to your original webhook script
3. All existing functionality remains intact

## Future Enhancements

Consider these future improvements:
1. Create an "Add-ons Catalog" table with pricing
2. Link "Add-ons" field to the catalog for better data structure
3. Add inventory tracking for add-ons
4. Create add-on specific reports and analytics
