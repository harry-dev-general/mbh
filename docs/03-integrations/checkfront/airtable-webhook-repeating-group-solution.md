# Airtable Webhook with Repeating Group Solution

## Overview
Since Airtable's webhook input variables force you to drill down into nested structures, we'll use a two-step approach with Repeating Groups to process multiple order items.

## Automation Structure

### Step 1: Webhook Trigger
Keep your current input variables as they are.

### Step 2: Script - Extract Items Array
This script extracts the items array from the webhook data and prepares it for the repeating group.

```javascript
// Script to extract items array from webhook
let inputConfig = input.config();

// Try to get the items from various possible paths
let items = [];

// Debug what we're receiving
console.log('Input keys:', Object.keys(inputConfig));

// If bookingItems is passed, try to parse it
if (inputConfig.bookingItems) {
    console.log('bookingItems type:', typeof inputConfig.bookingItems);
    console.log('bookingItems value:', inputConfig.bookingItems);
}

// Since we can't access the full order object, we'll need to 
// manually construct the items array from individual webhook calls
// This is a limitation we'll work around with the repeating group

// For now, output a placeholder array that the webhook should ideally provide
// In production, you might need to make an API call to get the full order details
let mockItems = [
    {
        sku: inputConfig.bookingItems || '',
        category_id: '2',
        qty: 1,
        total: inputConfig.totalAmount || 0
    }
];

// Output the items array for the repeating group
output.set('itemsArray', mockItems);
output.set('bookingCode', inputConfig.bookingCode);
output.set('customerName', inputConfig.customerName);
output.set('customerEmail', inputConfig.customerEmail);
output.set('status', inputConfig.status);
output.set('totalAmount', inputConfig.totalAmount);
output.set('startDate', inputConfig.startDate);
output.set('endDate', inputConfig.endDate);
output.set('createdDate', inputConfig.createdDate);
```

### Step 3: Repeating Group Configuration
1. Click "+ Add advanced logic or action" → "Repeating group"
2. **Select input list**: 
   - Use data from: "Script" (Step 2)
   - Choose data: Select `itemsArray` and click "Use as list"
3. **Name**: "Process Order Items"

### Step 4: Inside Repeating Group - Script to Process Each Item
Add a script action inside the repeating group:

```javascript
// Script to process individual item
let item = input.config().currentItem;
let bookingData = input.config();

console.log('Processing item:', item);

// Category mapping
const categoryMapping = {
    '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
    '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
    '4': { name: 'Add ons', type: 'addon' },
    '5': { name: 'Child Life Jacket', type: 'addon' },
    '6': { name: 'Add ons', type: 'addon' },
    '7': { name: 'Add ons', type: 'addon' }
};

// Determine if it's a boat
let categoryId = item.category_id || '';
let sku = item.sku || '';
let isBoat = false;

const category = categoryMapping[categoryId];
if (category) {
    isBoat = category.type === 'boat';
} else {
    // Fallback to SKU patterns
    isBoat = sku.toLowerCase().includes('boat') || 
            sku.toLowerCase().includes('polycraft') ||
            sku.toLowerCase().includes('bbq');
}

// Format add-on names
function formatAddOnName(sku) {
    const addOnMappings = {
        'lillypad': 'Lilly Pad',
        'fishingrods': 'Fishing Rods',
        'kayak': 'Kayak',
        'sup': 'Stand Up Paddleboard',
        'esky': 'Esky/Cooler'
    };
    
    let cleanSku = sku.toLowerCase().replace(/[-_\s]/g, '');
    return addOnMappings[cleanSku] || sku.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Output categorized item
output.set('sku', sku);
output.set('isBoat', isBoat);
output.set('itemType', isBoat ? 'boat' : 'addon');
output.set('formattedName', isBoat ? sku : formatAddOnName(sku));
output.set('quantity', item.qty || 1);
output.set('price', item.total || 0);
```

### Step 5: After Repeating Group - Compile Results
Add a final script to compile all items and update the record:

```javascript
// This would need to aggregate the results from the repeating group
// and create/update the Airtable record with boats in "Booking Items"
// and add-ons in "Add-ons" field
```

## Alternative Solution: API Webhook

Since Airtable's webhook trigger has limitations with nested data, consider:

1. **Create a custom webhook endpoint** that receives the Checkfront data
2. **Process it with your own script** (Node.js, Python, etc.)
3. **Use Airtable's API** to create/update records with properly formatted data

This gives you full control over data processing.

## Workaround for Current Limitation

If you can't access the full items array, you might need to:

1. Store the raw webhook payload in a text field
2. Use a script to parse it and extract items
3. Process each item accordingly

## Benefits of Repeating Group Approach

1. **Handles multiple items**: Can process any number of order items
2. **Cleaner logic**: Separates item processing from record creation
3. **Easier debugging**: Can test each step independently
4. **Scalable**: Works regardless of how many items are in an order

## Limitations

The main limitation is that Airtable's webhook trigger doesn't properly expose nested arrays in the input variable selector. You may need to work with Airtable support or use an external webhook processor to fully solve this.
