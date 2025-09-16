// Checkfront Webhook Handler for MBH Staff Portal
// Processes Checkfront webhooks and creates/updates Airtable records

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard table

// Category mapping
const categoryMapping = {
    '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
    '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
    '4': { name: 'Add ons', type: 'addon' },
    '5': { name: 'Child Life Jacket', type: 'addon' },
    '6': { name: 'Add ons', type: 'addon' },
    '7': { name: 'Add ons', type: 'addon' }
};

// Add-on name mappings
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

// Helper function to format add-on names
function formatAddOnName(sku) {
    const cleanSku = sku.toLowerCase().replace(/[-_\s]/g, '');
    if (addOnMappings[cleanSku]) {
        return addOnMappings[cleanSku];
    }
    
    // Default formatting
    return sku
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format time in Sydney timezone
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
    });
}

// Helper function to format date in Sydney timezone
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Australia/Sydney'
    }).split('/').reverse().join('-'); // Convert to YYYY-MM-DD format
}

// Process webhook data
async function processCheckfrontWebhook(webhookData) {
    console.log('📥 Processing Checkfront webhook...');
    
    // Extract booking data
    const booking = webhookData.booking || {};
    const order = booking.order || {};
    const customer = booking.customer || {};
    
    // Get booking details
    const bookingCode = booking.code || null;
    const customerEmail = customer.email || null;
    const customerName = customer.name || null;
    const bookingStatus = booking.status || 'PEND';
    const totalAmount = parseFloat(order.total || 0);
    
    // Convert timestamps
    const startDate = parseInt(booking.start_date) || 0;
    const endDate = parseInt(booking.end_date) || 0;
    const createdDate = parseInt(booking.created_date) || 0;
    
    const startDateTime = new Date(startDate * 1000);
    const endDateTime = new Date(endDate * 1000);
    const createdDateTime = new Date(createdDate * 1000);
    
    // Process order items
    let boatSKU = '';
    const addOnsArray = [];
    
    if (order.items && order.items.item) {
        // Ensure items is an array
        const itemsArray = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
        
        console.log(`📦 Processing ${itemsArray.length} items`);
        
        itemsArray.forEach((item, index) => {
            const sku = item.sku || '';
            const quantity = parseInt(item.qty) || 1;
            const price = parseFloat(item.total || 0);
            const categoryId = item.category_id || '';
            
            console.log(`  Item ${index + 1}: ${sku} (Category: ${categoryId}, Qty: ${quantity}, Price: $${price})`);
            
            // Determine if it's a boat
            const category = categoryMapping[categoryId];
            let isBoat = false;
            
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
                let addOnStr = formatAddOnName(sku);
                
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
    
    const addOnsFormatted = addOnsArray.join(', ');
    
    // Calculate duration
    const durationMs = endDateTime - startDateTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    
    // Prepare Airtable record data
    const recordData = {
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
    
    console.log('📊 Summary:');
    console.log(`  Booking: ${bookingCode}`);
    console.log(`  Customer: ${customerName}`);
    console.log(`  Boat: ${boatSKU || 'None'}`);
    console.log(`  Add-ons: ${addOnsFormatted || 'None'}`);
    console.log(`  Total: $${totalAmount}`);
    
    return recordData;
}

// Find existing booking in Airtable
async function findExistingBooking(bookingCode) {
    if (!bookingCode) return null;
    
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    filterByFormula: `{Booking Code} = "${bookingCode}"`,
                    maxRecords: 10
                }
            }
        );
        
        if (response.data.records && response.data.records.length > 0) {
            // Return the first matching record
            return response.data.records[0];
        }
        
        return null;
    } catch (error) {
        console.error('Error finding existing booking:', error.response?.data || error.message);
        return null;
    }
}

// Create or update Airtable record
async function createOrUpdateAirtableRecord(recordData) {
    try {
        // Check for existing booking
        const existingRecord = await findExistingBooking(recordData['Booking Code']);
        
        if (existingRecord) {
            // Update existing record
            console.log(`📝 Updating existing booking: ${recordData['Booking Code']}`);
            
            const response = await axios.patch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}/${existingRecord.id}`,
                {
                    fields: recordData
                },
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return { success: true, action: 'updated', recordId: response.data.id };
        } else {
            // Create new record
            console.log(`✨ Creating new booking: ${recordData['Booking Code']}`);
            
            const response = await axios.post(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                {
                    fields: recordData
                },
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return { success: true, action: 'created', recordId: response.data.id };
        }
    } catch (error) {
        console.error('Error creating/updating Airtable record:', error.response?.data || error.message);
        throw error;
    }
}

// Main webhook endpoint
router.post('/webhook', async (req, res) => {
    console.log('\n🚀 Checkfront webhook received');
    console.log('Headers:', req.headers);
    
    try {
        // Process the webhook data
        const recordData = await processCheckfrontWebhook(req.body);
        
        // Create or update Airtable record
        const result = await createOrUpdateAirtableRecord(recordData);
        
        console.log(`✅ Successfully ${result.action} booking ${recordData['Booking Code']}`);
        
        res.json({
            success: true,
            message: `Booking ${result.action} successfully`,
            bookingCode: recordData['Booking Code'],
            recordId: result.recordId
        });
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify the webhook handler is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Checkfront webhook handler is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
