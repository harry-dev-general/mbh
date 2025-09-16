// Airtable Webhook Solution - Parse Raw Webhook as Text
// This script handles the limitation where Airtable can't properly access nested arrays

let inputConfig = input.config();

// Since Airtable forces you to drill down into nested structures,
// we'll work with what we can get and reconstruct the data

// Get all available inputs
let bookingCode = inputConfig.bookingCode || null;
let customerName = inputConfig.customerName || null;
let customerEmail = inputConfig.customerEmail || null;
let status = inputConfig.status || 'PEND';
let totalAmount = parseFloat(inputConfig.totalAmount || 0);
let startDate = inputConfig.startDate || 0;
let endDate = inputConfig.endDate || 0;
let createdDate = inputConfig.createdDate || 0;

// The key issue: bookingItems only gives us one SKU
let singleBookingItem = inputConfig.bookingItems || '';

console.log('📊 Webhook Data Received:');
console.log(`  Booking Code: ${bookingCode}`);
console.log(`  Customer: ${customerName}`);
console.log(`  Single Item SKU: ${singleBookingItem}`);
console.log(`  Total Amount: $${totalAmount}`);

// Since we can't get the full items array through Airtable's interface,
// we have a few options:

// OPTION 1: If this is the only item (simple booking)
if (singleBookingItem && totalAmount > 0) {
    // Determine if it's a boat based on SKU
    let isBoat = singleBookingItem.toLowerCase().includes('boat') || 
                 singleBookingItem.toLowerCase().includes('polycraft') ||
                 singleBookingItem.toLowerCase().includes('bbq') ||
                 singleBookingItem.toLowerCase().includes('day'); // for halfday/fullday
    
    if (isBoat) {
        console.log('✅ Single boat booking detected');
        // Process as boat-only booking
        processBooking(bookingCode, customerName, customerEmail, status, totalAmount, 
                      singleBookingItem, '', startDate, endDate, createdDate);
    } else {
        console.log('⚠️ Single non-boat item - unusual for a booking');
        // Process as add-on only (unusual case)
        processBooking(bookingCode, customerName, customerEmail, status, totalAmount, 
                      '', formatAddOnName(singleBookingItem), startDate, endDate, createdDate);
    }
}

// OPTION 2: Request the raw webhook body as a text field
// Add an input variable called 'webhookBodyText' that captures the entire webhook body as text
if (inputConfig.webhookBodyText) {
    try {
        console.log('📄 Parsing raw webhook body text...');
        let webhookData = JSON.parse(inputConfig.webhookBodyText);
        
        // Now we can access the full structure
        let booking = webhookData.booking || {};
        let order = booking.order || {};
        
        if (order.items && order.items.item) {
            let itemsArray = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
            console.log(`✅ Found ${itemsArray.length} items in parsed webhook`);
            
            // Process all items
            let boatSKU = '';
            let addOnsArray = [];
            
            itemsArray.forEach(item => {
                processItem(item, (sku, isBoat, formatted) => {
                    if (isBoat && !boatSKU) {
                        boatSKU = sku;
                    } else if (!isBoat) {
                        addOnsArray.push(formatted);
                    }
                });
            });
            
            let addOnsFormatted = addOnsArray.join(', ');
            processBooking(bookingCode, customerName, customerEmail, status, totalAmount,
                          boatSKU, addOnsFormatted, startDate, endDate, createdDate);
        }
    } catch (e) {
        console.log('❌ Failed to parse webhook body text:', e.message);
    }
}

// OPTION 3: Use external webhook processor
// If neither option works, mention this in the logs
if (!singleBookingItem && !inputConfig.webhookBodyText) {
    console.log('⚠️ No booking items found. Consider:');
    console.log('  1. Adding webhookBodyText input variable to capture full webhook');
    console.log('  2. Using an external webhook processor (Zapier, Make, n8n)');
    console.log('  3. Creating a custom API endpoint to handle Checkfront webhooks');
}

// Helper function to process items
function processItem(item, callback) {
    let sku = item.sku || '';
    let quantity = parseInt(item.qty) || 1;
    let price = parseFloat(item.total || 0);
    let categoryId = item.category_id || '';
    
    // Category mapping
    const categoryMapping = {
        '2': 'boat', '3': 'boat',
        '4': 'addon', '5': 'addon', '6': 'addon', '7': 'addon'
    };
    
    let isBoat = categoryMapping[categoryId] === 'boat' ||
                 sku.toLowerCase().includes('boat') ||
                 sku.toLowerCase().includes('polycraft');
    
    let formatted = isBoat ? sku : formatAddOnName(sku);
    if (!isBoat && quantity > 1) formatted += ` (x${quantity})`;
    if (!isBoat && price > 0) formatted += ` - $${price.toFixed(2)}`;
    
    callback(sku, isBoat, formatted);
}

// Helper function to format add-on names
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

// Main function to process the booking
async function processBooking(bookingCode, customerName, customerEmail, status, totalAmount, 
                             boatSKU, addOnsFormatted, startDate, endDate, createdDate) {
    
    // Convert timestamps
    let startDateTime = new Date(parseInt(startDate) * 1000);
    let endDateTime = new Date(parseInt(endDate) * 1000);
    let createdDateTime = new Date(parseInt(createdDate) * 1000);
    
    // Format dates and times
    function formatTimeAEST(date) {
        return date.toLocaleTimeString('en-AU', { 
            hour: '2-digit', minute: '2-digit', hour12: true,
            timeZone: 'Australia/Sydney'
        });
    }
    
    function formatDateAEST(date) {
        return date.toLocaleDateString('en-AU', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            timeZone: 'Australia/Sydney'
        }).split('/').reverse().join('-');
    }
    
    // Calculate duration
    let durationMs = endDateTime - startDateTime;
    let hours = Math.floor(durationMs / (1000 * 60 * 60));
    let minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    
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
        }
    }
    
    // Prepare field data
    const fieldData = {
        'Booking Code': bookingCode,
        'Customer Name': customerName,
        'Customer Email': customerEmail,
        'Status': status,
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
        console.log(`\n✅ Updated booking ${bookingCode}`);
    } else {
        recordId = await bookingsTable.createRecordAsync(fieldData);
        console.log(`\n✅ Created booking ${bookingCode}`);
    }
    
    // Set outputs
    output.set('recordId', recordId);
    output.set('isUpdate', shouldUpdate);
    output.set('bookingCode', bookingCode);
    output.set('status', status);
    output.set('customerName', customerName);
    output.set('customerEmail', customerEmail);
    output.set('bookingItems', boatSKU);
    output.set('addOns', addOnsFormatted);
    output.set('totalAmount', totalAmount);
    
    console.log(`\n📊 Final Summary:`);
    console.log(`   Boat: ${boatSKU || 'None'}`);
    console.log(`   Add-ons: ${addOnsFormatted || 'None'}`);
}
