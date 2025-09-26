# Square Catalog Mapping Guide

**Date**: September 26, 2025  
**Version**: 1.0

## Overview

This guide shows how to set up Square Catalog items to match MBH's boat types and add-ons for seamless integration.

## Boat Type Mapping

### Square Catalog Items → Airtable Boat Types

| Square Item Name | Square SKU | Airtable Boat Type | Notes |
|-----------------|------------|-------------------|--------|
| 4 Person Polycraft - Half Day | 4POLY-HD | 4 Person Polycraft | $250 |
| 4 Person Polycraft - Full Day | 4POLY-FD | 4 Person Polycraft | $385 |
| 8 Person BBQ Boat - Half Day | 8BBQ-HD | 8 Person BBQ Boat | $385 |
| 8 Person BBQ Boat - Full Day | 8BBQ-FD | 8 Person BBQ Boat | $605 |
| 12 Person BBQ Boat - Half Day | 12BBQ-HD | 12 Person BBQ Boat | $465 |
| 12 Person BBQ Boat - Full Day | 12BBQ-FD | 12 Person BBQ Boat | $650 |

## Add-On Modifiers

### Square Modifiers → Airtable Add-ons

Create a modifier list in Square called "Boat Rental Add-ons":

| Modifier Name | Price | Airtable Format |
|--------------|-------|-----------------|
| Fishing Rods (2) | $30 | Fishing Rods - $30 |
| Ice Bag | $10 | Icebag - $10 |
| Lilly Pad | $50 | Lilly Pad - $50 |
| BBQ Equipment | $40 | BBQ Pack - $40 |
| Extra Life Jackets | $20 | Extra Life Jackets - $20 |
| Bluetooth Speaker | $25 | Bluetooth Speaker - $25 |

## Square Catalog Setup Steps

### 1. Create Items via Square Dashboard

1. Go to Square Dashboard → Items → Library
2. Click "Create Item"
3. For each boat type:
   - Name: As shown in table above
   - SKU: Use the SKU format
   - Price: Set appropriate price
   - Category: Create "Boat Rentals"
   - Track Stock: No

### 2. Create Modifier List

1. Go to Modifiers → Create Modifier List
2. Name: "Boat Rental Add-ons"
3. Add each modifier with price
4. Apply to all boat rental items

### 3. Create Time-Based Variations (Alternative)

Instead of separate items, use variations:

```
Item: "4 Person Polycraft"
Variations:
- Half Day ($250)
- Full Day ($385)
```

## Handling in Webhook

```javascript
// Map Square catalog IDs to boat types
const BOAT_TYPE_MAP = {
    'CDXXXXXXXXXXXXXX': '4 Person Polycraft',
    'CDYYYYYYYYYYYYYY': '8 Person BBQ Boat',
    'CDZZZZZZZZZZZZZZ': '12 Person BBQ Boat'
};

// Map modifier IDs to add-on names
const ADDON_MAP = {
    'MDXXXXXXXXXXXXXX': 'Fishing Rods',
    'MDYYYYYYYYYYYYYY': 'Icebag',
    'MDZZZZZZZZZZZZZZ': 'Lilly Pad'
};

function extractBookingDetails(order) {
    const lineItems = order.line_items || [];
    
    // Get boat type
    const boatItem = lineItems.find(item => BOAT_TYPE_MAP[item.catalog_object_id]);
    const boatType = boatItem ? BOAT_TYPE_MAP[boatItem.catalog_object_id] : 'Unknown Boat';
    
    // Get duration from variation or name
    const duration = boatItem?.variation_name || 
                    (boatItem?.name.includes('Half') ? 'Half Day' : 'Full Day');
    
    // Get add-ons
    const addOns = [];
    lineItems.forEach(item => {
        if (item.modifiers) {
            item.modifiers.forEach(modifier => {
                const addonName = ADDON_MAP[modifier.catalog_object_id] || modifier.name;
                const price = modifier.total_price_money.amount / 100;
                addOns.push(`${addonName} - $${price}`);
            });
        }
    });
    
    return {
        boatType: `${boatType} - ${duration}`,
        addOns: addOns.join(', ')
    };
}
```

## Custom Attributes for Booking Details

Use Square Orders API custom attributes for booking times:

```javascript
// When creating order in Square POS
const order = {
    line_items: [...],
    metadata: {
        booking_date: '2025-09-27',
        start_time: '09:00 AM',
        end_time: '01:00 PM',
        customer_phone: '+61412345678'
    }
};
```

## Testing Catalog Sync

1. **Create Test Items** in Square Sandbox
2. **Make Test Purchase** with modifiers
3. **Verify Webhook** receives catalog IDs
4. **Check Mapping** produces correct boat types

## Maintenance

### When Adding New Boats
1. Create item in Square Catalog
2. Add catalog ID to BOAT_TYPE_MAP
3. Test webhook processing

### When Changing Prices
1. Update in Square Catalog
2. Prices automatically sync via webhook
3. No code changes needed

### When Adding Add-ons
1. Add to Square modifier list
2. Update ADDON_MAP with new ID
3. Test complete flow

## Alternative: Direct API Integration

For tighter integration, fetch catalog directly:

```javascript
async function syncCatalog() {
    const { result } = await squareClient.catalogApi.listCatalog({
        types: ['ITEM', 'MODIFIER_LIST']
    });
    
    // Build dynamic mapping
    const boatTypes = {};
    result.objects.forEach(obj => {
        if (obj.type === 'ITEM' && obj.itemData.categoryId === 'BOAT_RENTALS_CATEGORY_ID') {
            boatTypes[obj.id] = obj.itemData.name;
        }
    });
    
    return boatTypes;
}
```

This approach eliminates hard-coded mappings but requires more API calls.
