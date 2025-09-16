// Fixed Airtable Webhook Automation Script - Properly captures all booking items
// This version correctly parses the items array from the webhook payload

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

// CRITICAL FIX: Extract all items from the order
let bookingItemsArray = [];
if (orderData.items) {
    // If items is already an array
    let itemsArray = Array.isArray(orderData.items) ? orderData.items : [orderData.items];
    
    // For each item, extract relevant details
    bookingItemsArray = itemsArray.map(item => {
        let itemData = {};
        
        // Handle nested structure - sometimes items have numbered keys
        if (item['1'] || item['2'] || item['3']) {
            // Items are nested with numeric keys
            for (let key in item) {
                if (!isNaN(key)) {
                    let subItem = item[key];
                    return {
                        sku: subItem.sku || '',
                        name: formatSKUName(subItem.sku),
                        quantity: subItem.qty || 1,
                        price: parseFloat(subItem.total || 0)
                    };
                }
            }
        } else {
            // Direct item structure
            return {
                sku: item.sku || '',
                name: formatSKUName(item.sku),
                quantity: item.qty || 1,
                price: parseFloat(item.total || 0)
            };
        }
    }).filter(item => item && item.sku); // Filter out any empty items
}

// Format SKU names to be more readable
function formatSKUName(sku) {
    if (!sku) return '';
    
    // Common SKU mappings
    const skuMappings = {
        '12personbbqboat-hire': '12 Person BBQ Boat',
        'lillypad': 'Lilly Pad',
        'fishingrods': 'Fishing Rods',
        'fishingrod': 'Fishing Rod',
        'kayak': 'Kayak',
        'sup': 'Stand Up Paddleboard',
        'esky': 'Esky/Cooler',
        'bbqboat': 'BBQ Boat',
        'skiboat': 'Ski Boat',
        'pontoon': 'Pontoon Boat'
    };
    
    // Check if we have a mapping
    let cleanSku = sku.toLowerCase().replace(/[_-]/g, '');
    if (skuMappings[cleanSku]) {
        return skuMappings[cleanSku];
    }
    
    // Otherwise, format the SKU nicely
    return sku
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\bhire\b/gi, 'Hire')
        .replace(/\bboat\b/gi, 'Boat')
        .replace(/\bbbq\b/gi, 'BBQ');
}

// Format booking items for display
let bookingItemsFormatted = '';
if (bookingItemsArray.length > 0) {
    bookingItemsFormatted = bookingItemsArray
        .map(item => {
            let itemStr = item.name || item.sku;
            if (item.quantity > 1) {
                itemStr += ` (x${item.quantity})`;
            }
            if (item.price > 0) {
                itemStr += ` - $${item.price.toFixed(2)}`;
            }
            return itemStr;
        })
        .join(', ');
} else {
    // Fallback to original bookingItems if no array found
    bookingItemsFormatted = inputConfig['bookingItems'] || '';
}

console.log(`📦 Booking items found: ${bookingItemsArray.length}`);
console.log(`📝 Items: ${bookingItemsFormatted}`);

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
    'Booking Items': bookingItemsFormatted, // Now contains all items!
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
output.set('bookingItems', bookingItemsFormatted); // Pass formatted items to SMS script
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
console.log(`   Items: ${bookingItemsFormatted}`);
