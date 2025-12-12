// Checkfront Webhook Handler for MBH Staff Portal
// Processes Checkfront webhooks, creates/updates Airtable records, and sends SMS notifications

const express = require('express');
const router = express.Router();
const axios = require('axios');
const webhookAuditLog = require('./webhook-audit-log');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard table

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER; // Existing Railway variable
const SMS_RECIPIENT = process.env.SMS_RECIPIENT || '+61414960734'; // Default recipient

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
    'icebag': 'Icebag',
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

// Helper function to format date nicely for SMS
function formatDateNice(date) {
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Australia/Sydney'
    });
}

// Helper function to determine significant status changes
function isSignificantStatusChange(oldStatus, newStatus) {
    // Always notify for cancellations
    if (newStatus === "VOID" || newStatus === "STOP") return true;
    
    // Notify when payment is confirmed
    if ((oldStatus === "PEND" || oldStatus === "HOLD" || oldStatus === "WAIT" || oldStatus === "PART") 
        && newStatus === "PAID") {
        return true;
    }
    
    // Don't notify for same status
    if (oldStatus === newStatus) return false;
    
    // Don't notify for minor progressions
    if (oldStatus === "PEND" && (newStatus === "HOLD" || newStatus === "WAIT")) return false;
    if (oldStatus === "HOLD" && newStatus === "WAIT") return false;
    if (oldStatus === "WAIT" && newStatus === "HOLD") return false;
    
    // Notify for partial payment
    if ((oldStatus === "PEND" || oldStatus === "HOLD" || oldStatus === "WAIT") && newStatus === "PART") {
        return true;
    }
    
    // Default to not sending for other cases
    return false;
}

// Send SMS using Twilio
async function sendSMS(message) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        console.log('⚠️ SMS not sent - Twilio credentials not configured');
        return false;
    }
    
    try {
        const authString = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
        
        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            new URLSearchParams({
                'From': TWILIO_FROM_NUMBER,
                'To': SMS_RECIPIENT,
                'Body': message
            }),
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('✅ SMS sent successfully!');
        return true;
    } catch (error) {
        console.error('❌ SMS send error:', error.response?.data || error.message);
        return false;
    }
}

// Build SMS message based on booking data and action
function buildSMSMessage(recordData, action, oldStatus = null) {
    const { 
        'Customer Name': customerName,
        'Booking Code': bookingCode,
        'Booking Items': boatSKU,
        'Add-ons': addOns,
        'Booking Date': bookingDate,
        'Start Time': startTime,
        'Finish Time': endTime,
        'Duration': duration,
        'Status': status
    } = recordData;
    
    const formattedDate = formatDateNice(new Date(bookingDate));
    
    if (action === 'created') {
        // New booking message
        let message = `🚤 Boat Hire Manly - Booking Confirmed\n\n`;
        message += `Booking: ${bookingCode || 'N/A'}\n`;
        message += `Customer: ${customerName}\n\n`;
        message += `📅 Date: ${formattedDate}\n`;
        message += `⏰ Time: ${startTime} - ${endTime}\n`;
        message += `⏱️ Duration: ${duration}\n\n`;
        message += `Boat: ${boatSKU || 'Not specified'}\n`;
        
        if (addOns) {
            message += `Add-ons: ${addOns}\n`;
        }
        
        message += `Status: ${status}\n\n`;
        message += `See you at the marina! 🌊`;
        
        return message;
        
    } else if (action === 'updated') {
        // Status update messages
        if (status === "VOID" || status === "STOP") {
            return `⚠️ Boat Hire Manly - Booking Cancelled\n\n` +
                   `Booking: ${bookingCode}\n` +
                   `Customer: ${customerName}\n` +
                   `Date: ${formattedDate}\n\n` +
                   `Your booking has been cancelled.\n` +
                   `If you have questions, please call us.`;
            
        } else if (status === "PAID") {
            return `✅ Boat Hire Manly - Payment Confirmed\n\n` +
                   `Booking: ${bookingCode}\n` +
                   `Customer: ${customerName}\n\n` +
                   `Your payment has been received!\n` +
                   `See you on ${formattedDate} at ${startTime}. 🚤`;
            
        } else if (status === "PART") {
            return `💳 Boat Hire Manly - Partial Payment Received\n\n` +
                   `Booking: ${bookingCode}\n` +
                   `Customer: ${customerName}\n\n` +
                   `We've received your partial payment.\n` +
                   `Please complete payment before ${formattedDate}.`;
            
        } else {
            return `📝 Boat Hire Manly - Booking Updated\n\n` +
                   `Booking: ${bookingCode}\n` +
                   `Status: ${status}\n\n` +
                   `Your booking for ${formattedDate} has been updated.`;
        }
    }
    
    return null;
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
    const customerPhone = customer.phone || null;
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
                    addOnStr = `${quantity} x ${addOnStr}`;
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
        'Phone Number': customerPhone,
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
    console.log(`  Phone: ${customerPhone || 'Not provided'}`);
    console.log(`  Boat: ${boatSKU || 'None'}`);
    console.log(`  Add-ons: ${addOnsFormatted || 'None'}`);
    console.log(`  Total: $${totalAmount}`);
    
    return recordData;
}

// Utility function to parse add-ons string to array
function parseAddOns(addOnsString) {
    if (!addOnsString || addOnsString.trim() === '') return [];
    
    try {
        return addOnsString.split(',').map(item => {
            const trimmedItem = item.trim();
            // Handle formats: "Item - $XX.XX" or "N x Item - $XX.XX"
            const match = trimmedItem.match(/^(?:(\d+)\s*x\s*)?(.+?)\s*-\s*\$(\d+(?:\.\d{2})?)$/);
            
            if (match) {
                return {
                    quantity: match[1] ? parseInt(match[1]) : 1,
                    name: match[2].trim(),
                    price: parseFloat(match[3]),
                    original: trimmedItem
                };
            }
            
            // Handle items without price
            return {
                quantity: 1,
                name: trimmedItem,
                price: 0,
                original: trimmedItem
            };
        }).filter(item => item.name); // Remove empty items
    } catch (error) {
        console.error('Error parsing add-ons:', error);
        return [];
    }
}

// Utility function to format add-ons array to string
function formatAddOns(addOnsArray) {
    if (!Array.isArray(addOnsArray) || addOnsArray.length === 0) return '';
    
    return addOnsArray
        .filter(item => item && item.name)
        .map(item => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const qty = item.quantity && item.quantity > 1 ? `${item.quantity} x ` : '';
            return `${qty}${item.name} - $${price.toFixed(2)}`;
        })
        .join(', ');
}

// Utility function to merge add-ons arrays (avoiding duplicates)
function mergeAddOns(existingAddOns, newAddOns) {
    // Create a map of existing add-ons by normalized name
    const addOnsMap = new Map();
    
    // Add existing add-ons to map
    existingAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        addOnsMap.set(key, addon);
    });
    
    // Add/update with new add-ons (new ones take precedence for price/quantity)
    newAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        // New add-ons override existing ones (Checkfront is source of truth for items it sends)
        addOnsMap.set(key, addon);
    });
    
    return Array.from(addOnsMap.values());
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
                    maxRecords: 10,
                    // Include Add-ons field to enable merging
                    fields: ['Booking Code', 'Status', 'Total Amount', 'Onboarding Employee', 'Deloading Employee', 'Add-ons']
                }
            }
        );
        
        if (response.data.records && response.data.records.length > 0) {
            // Find the best record (prefer PAID, then highest status)
            const records = response.data.records;
            
            if (records.length === 1) {
                return records[0];
            }
            
            // Sort by status priority
            const statusPriority = {
                'PAID': 4, 'PART': 3, 'WAIT': 2, 'HOLD': 2, 'PEND': 1
            };
            
            const bestRecord = records.reduce((best, current) => {
                const bestStatus = best.fields['Status'] || 'PEND';
                const currentStatus = current.fields['Status'] || 'PEND';
                const bestAmount = best.fields['Total Amount'] || 0;
                const currentAmount = current.fields['Total Amount'] || 0;
                
                // Always prefer PAID with highest amount
                if (currentStatus === 'PAID' && currentAmount >= bestAmount) {
                    return current;
                }
                if (bestStatus === 'PAID') {
                    return best;
                }
                
                // Otherwise, prefer higher status priority
                if ((statusPriority[currentStatus] || 0) > (statusPriority[bestStatus] || 0)) {
                    return current;
                }
                
                return best;
            }, records[0]);
            
            return bestRecord;
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
        
        let oldStatus = null;
        let action = 'created';
        let shouldSendSMS = true;
        
        if (existingRecord) {
            action = 'updated';
            oldStatus = existingRecord.fields['Status'] || 'PEND';
            
            // Check if this is a significant status change
            if (!isSignificantStatusChange(oldStatus, recordData['Status'])) {
                shouldSendSMS = false;
                console.log(`📵 Not sending SMS - minor change from ${oldStatus} to ${recordData['Status']}`);
            }
            
            // Update existing record
            console.log(`📝 Updating existing booking: ${recordData['Booking Code']} (${oldStatus} → ${recordData['Status']})`);
            
            // Preserve existing staff assignments if any
            if (existingRecord.fields['Onboarding Employee']) {
                recordData['Onboarding Employee'] = existingRecord.fields['Onboarding Employee'];
            }
            if (existingRecord.fields['Deloading Employee']) {
                recordData['Deloading Employee'] = existingRecord.fields['Deloading Employee'];
            }
            
            // Merge add-ons: combine existing add-ons with new ones from webhook
            // This preserves manually-added add-ons while updating with Checkfront data
            const existingAddOns = parseAddOns(existingRecord.fields['Add-ons'] || '');
            const newAddOns = parseAddOns(recordData['Add-ons'] || '');
            
            if (existingAddOns.length > 0 || newAddOns.length > 0) {
                const mergedAddOns = mergeAddOns(existingAddOns, newAddOns);
                recordData['Add-ons'] = formatAddOns(mergedAddOns);
                console.log(`🔀 Merged add-ons: ${existingAddOns.length} existing + ${newAddOns.length} new = ${mergedAddOns.length} total`);
                console.log(`   Result: ${recordData['Add-ons']}`);
            }
            
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
            
            // Delete duplicates if updating to PAID
            if (recordData['Status'] === 'PAID') {
                // Find and delete other records with same booking code
                const allRecords = await axios.get(
                    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            filterByFormula: `{Booking Code} = "${recordData['Booking Code']}"`,
                            maxRecords: 100
                        }
                    }
                );
                
                const duplicates = allRecords.data.records.filter(r => r.id !== existingRecord.id);
                
                if (duplicates.length > 0) {
                    console.log(`🗑️ Deleting ${duplicates.length} duplicate records`);
                    
                    for (const duplicate of duplicates) {
                        await axios.delete(
                            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}/${duplicate.id}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                                }
                            }
                        );
                    }
                }
            }
            
            // Send SMS if significant change
            if (shouldSendSMS) {
                const message = buildSMSMessage(recordData, action, oldStatus);
                if (message) {
                    await sendSMS(message);
                }
            }
            
            return { success: true, action, recordId: response.data.id, smsSent: shouldSendSMS };
            
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
            
            // Send SMS for new booking
            const message = buildSMSMessage(recordData, action);
            if (message) {
                await sendSMS(message);
            }
            
            return { success: true, action, recordId: response.data.id, smsSent: true };
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
    
    let result = { success: false, action: 'none' };
    let bookingCode = 'Unknown';
    
    try {
        // Process the webhook data
        const recordData = await processCheckfrontWebhook(req.body);
        bookingCode = recordData['Booking Code'] || 'Unknown';
        
        // Create or update Airtable record (and send SMS)
        result = await createOrUpdateAirtableRecord(recordData);
        
        console.log(`✅ Successfully ${result.action} booking ${recordData['Booking Code']}${result.smsSent ? ' (SMS sent)' : ''}`);
        
        // Log successful webhook
        await webhookAuditLog.logWebhook(req.body, {
            success: true,
            action: result.action,
            recordId: result.recordId
        });
        
        res.json({
            success: true,
            message: `Booking ${result.action} successfully`,
            bookingCode: recordData['Booking Code'],
            recordId: result.recordId,
            smsSent: result.smsSent
        });
        
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        
        // Log failed webhook for audit trail
        await webhookAuditLog.logWebhook(req.body, {
            success: false,
            action: 'failed',
            error: error.message
        });
        
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
        timestamp: new Date().toISOString(),
        twilioConfigured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER)
    });
});

module.exports = router;