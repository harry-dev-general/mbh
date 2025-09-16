// Fixed Airtable Webhook Script - Works with Simple Input Variables
// This version uses the input variables as configured in your Airtable automation

let inputConfig = input.config();

// Get values directly from input variables (as shown in your screenshots)
let startDate = inputConfig['startDate'] || 0;
let endDate = inputConfig['endDate'] || 0;
let createdDate = inputConfig['createdDate'] || 0;
let bookingCode = inputConfig['bookingCode'] || null;
let customerName = inputConfig['customerName'] || null;
let customerEmail = inputConfig['customerEmail'] || null;
let status = inputConfig['status'] || 'PEND';
let totalAmount = parseFloat(inputConfig['totalAmount'] || 0);
let bookingItems = inputConfig['bookingItems'] || null;

// Convert Unix timestamps to Date objects
let startDateTime = new Date(parseInt(startDate) * 1000);
let endDateTime = new Date(parseInt(endDate) * 1000);
let createdDateTime = new Date(parseInt(createdDate) * 1000);

console.log('📊 Input Data:');
console.log(`  Booking Code: ${bookingCode}`);
console.log(`  Customer: ${customerName} (${customerEmail})`);
console.log(`  Status: ${status}`);
console.log(`  Total: $${totalAmount}`);
console.log(`  Booking Items Raw: ${typeof bookingItems} - ${JSON.stringify(bookingItems)}`);

// Process booking items - handle the structure from Checkfront
let boatSKU = '';
let addOnsArray = [];

// Category mapping based on your Checkfront setup
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

// Check if bookingItems is a string that needs parsing
if (typeof bookingItems === 'string') {
    try {
        bookingItems = JSON.parse(bookingItems);
        console.log('📦 Parsed booking items from string');
    } catch (e) {
        console.log('⚠️ Could not parse bookingItems as JSON, treating as SKU');
        // If it's just a SKU string, use it directly
        boatSKU = bookingItems;
    }
}

// Process items if we have them
if (bookingItems && typeof bookingItems === 'object') {
    // Handle the items array
    let itemsArray = [];
    
    // Check different possible structures
    if (Array.isArray(bookingItems)) {
        itemsArray = bookingItems;
    } else if (bookingItems.item) {
        itemsArray = Array.isArray(bookingItems.item) ? bookingItems.item : [bookingItems.item];
    } else if (bookingItems['0'] || bookingItems['1']) {
        // Items might be an object with numeric keys
        itemsArray = Object.values(bookingItems);
    }
    
    console.log(`📦 Processing ${itemsArray.length} items`);
    
    // Process each item
    itemsArray.forEach((item, index) => {
        if (!item) return;
        
        let sku = item.sku || '';
        let quantity = parseInt(item.qty) || 1;
        let price = parseFloat(item.total || 0);
        let categoryId = item.category_id || '';
        
        console.log(`  Item ${index + 1}: ${sku} (Category: ${categoryId}, Qty: ${quantity}, Price: $${price})`);
        
        // Determine if it's a boat based on category ID
        let isBoat = false;
        const category = categoryMapping[categoryId];
        
        if (category) {
            isBoat = category.type === 'boat';
            console.log(`    Category: ${category.name} (${category.type})`);
        } else {
            // Fallback to SKU pattern matching
            console.log(`    Unknown category ${categoryId}, checking SKU`);
            isBoat = sku.toLowerCase().includes('boat') || 
                    sku.toLowerCase().includes('polycraft') ||
                    sku.toLowerCase().includes('bbq');
        }
        
        if (isBoat && !boatSKU) {
            boatSKU = sku;
            console.log(`    ✅ Identified as BOAT`);
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
            console.log(`    ✅ Identified as ADD-ON: ${addOnStr}`);
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
        
        // Find the best record to update (same logic as before)
        existingRecord = matchingRecords.reduce((best, current) => {
            const bestStatus = best.getCellValueAsString("Status");
            const currentStatus = current.getCellValueAsString("Status");
            const bestAmount = best.getCellValue("Total Amount") || 0;
            const currentAmount = current.getCellValue("Total Amount") || 0;
            
            if (currentStatus === "PAID" && currentAmount >= bestAmount) {
                return current;
            }
            if (bestStatus === "PAID") {
                return best;
            }
            
            const statusPriority = {
                'PEND': 1, 'HOLD': 2, 'WAIT': 2, 'PART': 3, 'PAID': 4
            };
            
            if ((statusPriority[currentStatus] || 0) > (statusPriority[bestStatus] || 0)) {
                return current;
            }
            
            return best;
        }, matchingRecords[0]);
        
        shouldUpdate = true;
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
    'Status': status,
    'Total Amount': totalAmount,
    'Booking Items': boatSKU,
    'Add-ons': addOnsFormatted,
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
    // Preserve existing staff assignments
    const existingOnboarding = existingRecord.getCellValue("Onboarding Employee");
    const existingDeloading = existingRecord.getCellValue("Deloading Employee");
    
    if (existingOnboarding && existingOnboarding.length > 0) {
        fieldData['Onboarding Employee'] = existingOnboarding;
    }
    if (existingDeloading && existingDeloading.length > 0) {
        fieldData['Deloading Employee'] = existingDeloading;
    }
    
    await bookingsTable.updateRecordAsync(existingRecord.id, fieldData);
    recordId = existingRecord.id;
    console.log(`\n📝 Updated booking ${bookingCode} to status ${status}`);
} else {
    recordId = await bookingsTable.createRecordAsync(fieldData);
    console.log(`\n✅ Created new booking ${bookingCode} with status ${status}`);
}

// Set outputs for next steps
output.set('recordId', recordId);
output.set('isUpdate', shouldUpdate);
output.set('bookingCode', bookingCode);
output.set('status', status);
output.set('customerName', customerName);
output.set('customerEmail', customerEmail);
output.set('bookingItems', boatSKU);
output.set('addOns', addOnsFormatted);
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
console.log(`   Status: ${status} - Amount: $${totalAmount}`);
console.log(`   Boat: ${boatSKU}`);
console.log(`   Add-ons: ${addOnsFormatted || 'None'}`);
