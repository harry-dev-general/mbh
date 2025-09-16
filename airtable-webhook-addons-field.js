// Enhanced Airtable Webhook Automation Script - Separates Boats and Add-ons
// Preserves existing "Booking Items" functionality while capturing add-ons separately

let inputConfig = input.config();

// Parse the webhook payload if it's a string
let webhookData = inputConfig;
if (typeof inputConfig.webhook === 'string') {
    try {
        webhookData = JSON.parse(inputConfig.webhook);
    } catch (e) {
        webhookData = inputConfig;
    }
}

// Extract booking data from webhook
let bookingData = webhookData.booking || webhookData;
let orderData = webhookData.order || bookingData.order || {};

// Convert Unix timestamps (in seconds) to Date objects
let startDate = inputConfig['startDate'] || bookingData.start_date;
let endDate = inputConfig['endDate'] || bookingData.end_date;
let createdDate = inputConfig['createdDate'] || bookingData.created_date;

let startDateTime = new Date(startDate * 1000);
let endDateTime = new Date(endDate * 1000);
let createdDateTime = new Date(createdDate * 1000);

// Get booking details
let bookingCode = inputConfig['bookingCode'] || bookingData.code || null;
let customerEmail = inputConfig['customerEmail'] || bookingData.customer?.email || null;
let customerName = inputConfig['customerName'] || bookingData.customer?.name || null;
let bookingStatus = inputConfig['status'] || bookingData.status || 'PEND';
let totalAmount = parseFloat(orderData.total || inputConfig['totalAmount'] || 0);

// Define boat SKUs vs add-on SKUs
const boatSKUs = [
    '12personbbqboat-hire', '12personbbqboat', 'fullday12personbbqboat',
    '4personpolycraft-hire', '4personpolycraft', '4personpolycraft-halfday',
    '6personpolycraft-hire', '6personpolycraft',
    'bbqboat', 'skiboat', 'pontoon', 'polycraft',
    'sandstone', 'junior', 'pumicestone', 'icecreamboat', 'workboat'
];

const addOnSKUs = [
    'lillypad', 'lilly-pad', 'lilly_pad',
    'fishingrods', 'fishing-rods', 'fishing_rods', 'fishingrod',
    'kayak', 'sup', 'standuppaddle', 'paddleboard',
    'esky', 'cooler', 'icebox',
    'bbqpack', 'foodpack', 'cateringpack'
];

// Process order items
let boatSKU = '';
let addOnsArray = [];
let boatPrice = 0;

if (orderData.items) {
    // If items is already an array
    let itemsArray = Array.isArray(orderData.items) ? orderData.items : [orderData.items];
    
    // Process each item
    itemsArray.forEach(item => {
        // Handle nested structure - sometimes items have numbered keys
        if (item['1'] || item['2'] || item['3']) {
            // Items are nested with numeric keys
            for (let key in item) {
                if (!isNaN(key)) {
                    let subItem = item[key];
                    processItem(subItem);
                }
            }
        } else {
            // Direct item structure
            processItem(item);
        }
    });
}

function processItem(item) {
    if (!item || !item.sku) return;
    
    let sku = item.sku.toLowerCase().replace(/[-_\s]/g, '');
    let quantity = item.qty || 1;
    let price = parseFloat(item.total || 0);
    
    // Check if it's a boat SKU
    let isBoat = boatSKUs.some(boatSku => 
        sku.includes(boatSku.toLowerCase().replace(/[-_\s]/g, ''))
    );
    
    if (isBoat && !boatSKU) {
        // Store the first boat SKU found (maintain original format)
        boatSKU = item.sku;
        boatPrice = price;
    } else if (!isBoat && item.sku) {
        // It's an add-on
        let addOnName = formatAddOnName(item.sku);
        let addOnStr = addOnName;
        
        if (quantity > 1) {
            addOnStr += ` (x${quantity})`;
        }
        if (price > 0) {
            addOnStr += ` - $${price.toFixed(2)}`;
        }
        
        addOnsArray.push(addOnStr);
    }
}

// Format add-on names to be more readable
function formatAddOnName(sku) {
    const addOnMappings = {
        'lillypad': 'Lilly Pad',
        'lilly-pad': 'Lilly Pad',
        'lilly_pad': 'Lilly Pad',
        'fishingrods': 'Fishing Rods',
        'fishing-rods': 'Fishing Rods',
        'fishingrod': 'Fishing Rod',
        'kayak': 'Kayak',
        'sup': 'Stand Up Paddleboard',
        'standuppaddle': 'Stand Up Paddleboard',
        'paddleboard': 'Paddleboard',
        'esky': 'Esky/Cooler',
        'cooler': 'Cooler',
        'icebox': 'Ice Box',
        'bbqpack': 'BBQ Pack',
        'foodpack': 'Food Package',
        'cateringpack': 'Catering Package'
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

// If no boat SKU was found in items, fall back to original bookingItems
if (!boatSKU && inputConfig['bookingItems']) {
    boatSKU = inputConfig['bookingItems'];
}

console.log(`🚤 Boat SKU: ${boatSKU}`);
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
    console.log(`🔍 Checking for existing booking: ${bookingCode}`);
    
    // Query for existing records with this booking code
    const queryResult = await bookingsTable.selectRecordsAsync({
        fields: ["Booking Code", "Status", "Total Amount", "Onboarding Employee", "Deloading Employee"],
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
    console.log(`📝 Updated booking ${bookingCode} to status ${bookingStatus}`);
} else {
    // Create new record
    recordId = await bookingsTable.createRecordAsync(fieldData);
    console.log(`✅ Created new booking ${bookingCode} with status ${bookingStatus}`);
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
console.log(`\n📊 Summary: ${actionType} ${bookingCode} - ${customerName}`);
console.log(`   Status: ${bookingStatus} - Amount: $${totalAmount}`);
console.log(`   Boat: ${boatSKU}`);
console.log(`   Add-ons: ${addOnsFormatted || 'None'}`);
