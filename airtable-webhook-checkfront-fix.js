// Fixed Airtable Webhook Automation Script for Checkfront XML Structure
// Properly handles the XML-to-JSON webhook format with @attributes

let inputConfig = input.config();

// The webhook data comes from Checkfront in XML format converted to JSON
let webhookData = inputConfig;

// Extract booking data - handle the nested structure
let booking = webhookData.booking || {};
let order = booking.order || {};
let customer = booking.customer || {};

// Convert Unix timestamps (in seconds) to Date objects
let startDate = parseInt(booking.start_date) || 0;
let endDate = parseInt(booking.end_date) || 0;
let createdDate = parseInt(booking.created_date) || 0;

let startDateTime = new Date(startDate * 1000);
let endDateTime = new Date(endDate * 1000);
let createdDateTime = new Date(createdDate * 1000);

// Get booking details
let bookingCode = booking.code || null;
let customerEmail = customer.email || null;
let customerName = customer.name || null;
let bookingStatus = booking.status || 'PEND';
let totalAmount = parseFloat(order.total || 0);

// Process order items - handle the Checkfront structure
let boatSKU = '';
let addOnsArray = [];

// Category mapping based on your Checkfront setup
// The webhook only provides category IDs, so we map them to types
const categoryMapping = {
    // Boat categories
    '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
    '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
    // Add-on categories
    '4': { name: 'Add ons', type: 'addon' },
    '5': { name: 'Child Life Jacket', type: 'addon' },
    '6': { name: 'Add ons', type: 'addon' },
    '7': { name: 'Add ons', type: 'addon' }
};

// Function to check if a category ID represents a boat
function isBoatCategory(categoryId) {
    const category = categoryMapping[categoryId];
    return category && category.type === 'boat';
}

if (order.items && order.items.item) {
    // Ensure items is an array (sometimes single items come as objects)
    let itemsArray = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
    
    console.log(`📦 Processing ${itemsArray.length} items from order`);
    
    // Process each item
    itemsArray.forEach((item, index) => {
        let sku = item.sku || '';
        let quantity = parseInt(item.qty) || 1;
        let price = parseFloat(item.total || 0);
        let categoryId = item.category_id || '';
        
        console.log(`  Item ${index + 1}: ${sku} (Category: ${categoryId}, Qty: ${quantity}, Price: $${price})`);
        
        // Determine if it's a boat based on category ID
        let isBoat = isBoatCategory(categoryId);
        
        // If category mapping doesn't exist, fall back to SKU pattern matching
        if (!categoryMapping[categoryId]) {
            console.log(`  ⚠️ Unknown category ID: ${categoryId}, checking SKU pattern`);
            isBoat = sku.toLowerCase().includes('boat') || 
                    sku.toLowerCase().includes('polycraft') ||
                    sku.toLowerCase().includes('bbq');
        }
        
        if (isBoat && !boatSKU) {
            // Store the first boat SKU found
            boatSKU = sku;
            const categoryName = categoryMapping[categoryId]?.name || 'Unknown';
            console.log(`  ✅ Identified as BOAT: ${sku} (Category: ${categoryName})`);
        } else if (!isBoat && sku) {
            // It's an add-on
            let addOnName = formatAddOnName(sku);
            let addOnStr = addOnName;
            
            if (quantity > 1) {
                addOnStr += ` (x${quantity})`;
            }
            if (price > 0) {
                addOnStr += ` - $${price.toFixed(2)}`;
            }
            
            addOnsArray.push(addOnStr);
            const categoryName = categoryMapping[categoryId]?.name || 'Unknown';
            console.log(`  ✅ Identified as ADD-ON: ${addOnStr} (Category: ${categoryName})`);
        }
    });
}

// Format add-on names to be more readable
function formatAddOnName(sku) {
    const addOnMappings = {
        'lillypad': 'Lilly Pad',
        'fishingrods': 'Fishing Rods',
        'fishingrod': 'Fishing Rod',
        'kayak': 'Kayak',
        'sup': 'Stand Up Paddleboard',
        'paddleboard': 'Paddleboard',
        'esky': 'Esky/Cooler',
        'baitpack': 'Bait Pack',
        'icepack': 'Ice Pack',
        'bbqpack': 'BBQ Pack',
        'foodpack': 'Food Package'
    };
    
    let cleanSku = sku.toLowerCase().replace(/[-_\s]/g, '');
    if (addOnMappings[cleanSku]) {
        return addOnMappings[cleanSku];
    }
    
    // Default formatting
    return sku
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Format add-ons for display
let addOnsFormatted = addOnsArray.join(', ');

console.log(`\n📊 Summary:`);
console.log(`🚤 Boat: ${boatSKU || 'None found'}`);
console.log(`🎣 Add-ons: ${addOnsFormatted || 'None'}`);

// Function to format time in Sydney timezone
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
    });
}

// Function to format date in Sydney timezone
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Australia/Sydney'
    }).split('/').reverse().join('-'); // Convert to YYYY-MM-DD format
}

// DEDUPLICATION LOGIC - Check for existing booking
const bookingsTable = base.getTable("Bookings Dashboard");
let existingRecord = null;
let shouldUpdate = false;

if (bookingCode) {
    console.log(`\n🔍 Checking for existing booking: ${bookingCode}`);
    
    // Query for existing records with this booking code
    const queryResult = await bookingsTable.selectRecordsAsync({
        fields: ["Booking Code", "Status", "Total Amount", "Onboarding Employee", "Deloading Employee", "Add-ons"],
        maxRecords: 100
    });
    
    // Find records with matching booking code
    const matchingRecords = queryResult.records.filter(record => 
        record.getCellValueAsString("Booking Code") === bookingCode
    );
    
    if (matchingRecords.length > 0) {
        console.log(`📋 Found ${matchingRecords.length} existing record(s) for ${bookingCode}`);
        
        // Find the best record to update
        existingRecord = matchingRecords.reduce((best, current) => {
            const bestStatus = best.getCellValueAsString("Status");
            const currentStatus = current.getCellValueAsString("Status");
            const bestAmount = best.getCellValue("Total Amount") || 0;
            const currentAmount = current.getCellValue("Total Amount") || 0;
            
            // Always prefer PAID with highest amount
            if (currentStatus === "PAID" && currentAmount >= bestAmount) {
                return current;
            }
            if (bestStatus === "PAID") {
                return best;
            }
            
            // Otherwise, prefer higher status
            const statusPriority = {
                'PEND': 1, 'HOLD': 2, 'WAIT': 2, 'PART': 3, 'PAID': 4
            };
            
            if ((statusPriority[currentStatus] || 0) > (statusPriority[bestStatus] || 0)) {
                return current;
            }
            
            return best;
        }, matchingRecords[0]);
        
        shouldUpdate = true;
        console.log(`✅ Will update existing record (Status: ${existingRecord.getCellValueAsString("Status")})`);
        
        // Delete other duplicate records if updating to PAID
        if (bookingStatus === "PAID" && matchingRecords.length > 1) {
            const recordsToDelete = matchingRecords
                .filter(r => r.id !== existingRecord.id)
                .map(r => r.id);
            
            if (recordsToDelete.length > 0) {
                console.log(`🗑️ Deleting ${recordsToDelete.length} duplicate records`);
                await bookingsTable.deleteRecordsAsync(recordsToDelete);
            }
        }
    } else {
        console.log(`✨ New booking ${bookingCode} - will create record`);
    }
}

// Calculate duration
let durationMs = endDateTime - startDateTime;
let hours = Math.floor(durationMs / (1000 * 60 * 60));
let minutes = Math.floor((durationMs / (1000 * 60)) % 60);
let durationFormatted = `${hours} hours ${minutes} minutes`;

// Prepare field data
const fieldData = {
    'Booking Code': bookingCode,
    'Customer Name': customerName,
    'Customer Email': customerEmail,
    'Status': bookingStatus,
    'Total Amount': totalAmount,
    'Booking Items': boatSKU, // Preserve original boat SKU for linked field
    'Add-ons': addOnsFormatted, // NEW FIELD for additional items
    'Booking Date': formatDateAEST(startDateTime),
    'End Date': formatDateAEST(endDateTime),
    'Created Date': formatDateAEST(createdDateTime),
    'Start Time': formatTimeAEST(startDateTime),
    'Finish Time': formatTimeAEST(endDateTime),
    'Duration': durationFormatted
};

// Only add non-empty fields
Object.keys(fieldData).forEach(key => {
    if (fieldData[key] === '' || fieldData[key] === null || fieldData[key] === undefined) {
        delete fieldData[key];
    }
});

// Create or update record
let recordId;

if (shouldUpdate && existingRecord) {
    // Preserve existing staff assignments if any
    const existingOnboarding = existingRecord.getCellValue("Onboarding Employee");
    const existingDeloading = existingRecord.getCellValue("Deloading Employee");
    
    if (existingOnboarding && existingOnboarding.length > 0) {
        fieldData['Onboarding Employee'] = existingOnboarding;
    }
    if (existingDeloading && existingDeloading.length > 0) {
        fieldData['Deloading Employee'] = existingDeloading;
    }
    
    // Update existing record
    await bookingsTable.updateRecordAsync(existingRecord.id, fieldData);
    recordId = existingRecord.id;
    console.log(`\n📝 Updated booking ${bookingCode} to status ${bookingStatus}`);
} else {
    // Create new record
    recordId = await bookingsTable.createRecordAsync(fieldData);
    console.log(`\n✅ Created new booking ${bookingCode} with status ${bookingStatus}`);
}

// Set outputs for next steps
output.set('recordId', recordId);
output.set('isUpdate', shouldUpdate);
output.set('bookingCode', bookingCode);
output.set('status', bookingStatus);
output.set('customerName', customerName);
output.set('customerEmail', customerEmail);
output.set('bookingItems', boatSKU); // Pass boat SKU
output.set('addOns', addOnsFormatted); // Pass add-ons separately
output.set('startDate', formatDateAEST(startDateTime));
output.set('endDate', formatDateAEST(endDateTime));
output.set('createdDate', formatDateAEST(createdDateTime));
output.set('startTime', formatTimeAEST(startDateTime));
output.set('endTime', formatTimeAEST(endDateTime));
output.set('bookingDurationFormatted', durationFormatted);
output.set('totalAmount', totalAmount);

// Pass through datetime objects
output.set('startDateTime', startDateTime.toISOString());
output.set('endDateTime', endDateTime.toISOString());
output.set('createdDateTime', createdDateTime.toISOString());

// Add summary for logging
let actionType = shouldUpdate ? 'UPDATED' : 'CREATED';
console.log(`\n📊 Final Summary: ${actionType} ${bookingCode} - ${customerName}`);
console.log(`   Status: ${bookingStatus} - Amount: $${totalAmount}`);
console.log(`   Boat: ${boatSKU}`);
console.log(`   Add-ons: ${addOnsFormatted || 'None'}`);
