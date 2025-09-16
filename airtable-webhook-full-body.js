// Airtable Webhook Script - Expects Full Webhook Body as Input
// Configure Airtable to pass the entire webhook body as a single input variable

let inputConfig = input.config();

// Get the full webhook data - expecting it to be passed as 'webhookData' or 'body'
let webhookData = inputConfig.webhookData || inputConfig.body || inputConfig;

console.log('📊 Raw webhook data type:', typeof webhookData);
console.log('📊 Webhook data keys:', Object.keys(webhookData));

// If webhookData is a string, try to parse it
if (typeof webhookData === 'string') {
    try {
        webhookData = JSON.parse(webhookData);
        console.log('✅ Parsed webhook data from string');
    } catch (e) {
        console.log('❌ Failed to parse webhook data as JSON');
    }
}

// Extract booking data from the webhook structure
let booking = webhookData.booking || {};
let order = booking.order || {};
let customer = booking.customer || {};

// Get timestamps
let startDate = parseInt(booking.start_date) || 0;
let endDate = parseInt(booking.end_date) || 0;
let createdDate = parseInt(booking.created_date) || 0;

// Convert to Date objects
let startDateTime = new Date(startDate * 1000);
let endDateTime = new Date(endDate * 1000);
let createdDateTime = new Date(createdDate * 1000);

// Get booking details
let bookingCode = booking.code || null;
let customerEmail = customer.email || null;
let customerName = customer.name || null;
let bookingStatus = booking.status || 'PEND';
let totalAmount = parseFloat(order.total || 0);

console.log('📋 Booking Details:');
console.log(`  Code: ${bookingCode}`);
console.log(`  Customer: ${customerName}`);
console.log(`  Email: ${customerEmail}`);
console.log(`  Status: ${bookingStatus}`);
console.log(`  Total: $${totalAmount}`);

// Process order items
let boatSKU = '';
let addOnsArray = [];

// Category mapping
const categoryMapping = {
    '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
    '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
    '4': { name: 'Add ons', type: 'addon' },
    '5': { name: 'Child Life Jacket', type: 'addon' },
    '6': { name: 'Add ons', type: 'addon' },
    '7': { name: 'Add ons', type: 'addon' }
};

// Process items from the order
if (order.items && order.items.item) {
    // Ensure items is an array
    let itemsArray = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
    
    console.log(`\n📦 Processing ${itemsArray.length} items from order`);
    
    itemsArray.forEach((item, index) => {
        let sku = item.sku || '';
        let quantity = parseInt(item.qty) || 1;
        let price = parseFloat(item.total || 0);
        let categoryId = item.category_id || '';
        
        console.log(`  Item ${index + 1}: ${sku} (Category: ${categoryId}, Qty: ${quantity}, Price: $${price})`);
        
        // Check if it's a boat
        let isBoat = false;
        const category = categoryMapping[categoryId];
        
        if (category) {
            isBoat = category.type === 'boat';
            console.log(`    Category: ${category.name} (${category.type})`);
        } else {
            // Fallback to SKU patterns
            isBoat = sku.toLowerCase().includes('boat') || 
                    sku.toLowerCase().includes('polycraft') ||
                    sku.toLowerCase().includes('bbq');
        }
        
        if (isBoat && !boatSKU) {
            boatSKU = sku;
            console.log(`    ✅ Identified as BOAT`);
        } else if (!isBoat && sku) {
            let addOnName = formatAddOnName(sku);
            let addOnStr = addOnName;
            
            if (quantity > 1) {
                addOnStr += ` (x${quantity})`;
            }
            if (price > 0) {
                addOnStr += ` - $${price.toFixed(2)}`;
            }
            
            addOnsArray.push(addOnStr);
            console.log(`    ✅ Identified as ADD-ON: ${addOnStr}`);
        }
    });
} else {
    console.log('⚠️ No items found in order');
    console.log('Order structure:', JSON.stringify(order, null, 2));
}

// Format add-on names
function formatAddOnName(sku) {
    const addOnMappings = {
        'lillypad': 'Lilly Pad',
        'fishingrods': 'Fishing Rods',
        'fishingrod': 'Fishing Rod',
        'kayak': 'Kayak',
        'sup': 'Stand Up Paddleboard',
        'esky': 'Esky/Cooler'
    };
    
    let cleanSku = sku.toLowerCase().replace(/[-_\s]/g, '');
    return addOnMappings[cleanSku] || sku.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

let addOnsFormatted = addOnsArray.join(', ');

console.log(`\n📊 Summary:`);
console.log(`🚤 Boat: ${boatSKU || 'None found'}`);
console.log(`🎣 Add-ons: ${addOnsFormatted || 'None'}`);

// Format functions
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
    });
}

function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Australia/Sydney'
    }).split('/').reverse().join('-');
}

// Check for existing booking
const bookingsTable = base.getTable("Bookings Dashboard");
let existingRecord = null;
let shouldUpdate = false;

if (bookingCode) {
    const queryResult = await bookingsTable.selectRecordsAsync({
        fields: ["Booking Code", "Status", "Total Amount"],
        maxRecords: 100
    });
    
    const matchingRecords = queryResult.records.filter(record => 
        record.getCellValueAsString("Booking Code") === bookingCode
    );
    
    if (matchingRecords.length > 0) {
        existingRecord = matchingRecords[0];
        shouldUpdate = true;
        console.log(`\n✅ Found existing booking to update`);
    }
}

// Calculate duration
let durationMs = endDateTime - startDateTime;
let hours = Math.floor(durationMs / (1000 * 60 * 60));
let minutes = Math.floor((durationMs / (1000 * 60)) % 60);

// Prepare field data
const fieldData = {
    'Booking Code': bookingCode,
    'Customer Name': customerName,
    'Customer Email': customerEmail,
    'Status': bookingStatus,
    'Total Amount': totalAmount,
    'Booking Items': boatSKU,
    'Add-ons': addOnsFormatted,
    'Booking Date': formatDateAEST(startDateTime),
    'End Date': formatDateAEST(endDateTime),
    'Created Date': formatDateAEST(createdDateTime),
    'Start Time': formatTimeAEST(startDateTime),
    'Finish Time': formatTimeAEST(endDateTime),
    'Duration': `${hours} hours ${minutes} minutes`
};

// Remove empty fields
Object.keys(fieldData).forEach(key => {
    if (!fieldData[key]) delete fieldData[key];
});

// Create or update record
let recordId;
if (shouldUpdate && existingRecord) {
    await bookingsTable.updateRecordAsync(existingRecord.id, fieldData);
    recordId = existingRecord.id;
} else {
    recordId = await bookingsTable.createRecordAsync(fieldData);
}

// Set outputs
output.set('recordId', recordId);
output.set('isUpdate', shouldUpdate);
output.set('bookingCode', bookingCode);
output.set('status', bookingStatus);
output.set('customerName', customerName);
output.set('customerEmail', customerEmail);
output.set('bookingItems', boatSKU);
output.set('addOns', addOnsFormatted);
output.set('totalAmount', totalAmount);

console.log(`\n✅ ${shouldUpdate ? 'Updated' : 'Created'} booking ${bookingCode}`);
