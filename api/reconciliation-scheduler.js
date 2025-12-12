// Automatic Checkfront-Airtable Reconciliation Scheduler
// Runs daily to catch any bookings missed by webhooks
// This is a critical data integrity safeguard

const axios = require('axios');
const checkfrontApi = require('./checkfront-api');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

// Twilio for notifications
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const ADMIN_SMS_RECIPIENT = process.env.ADMIN_SMS_RECIPIENT || process.env.SMS_RECIPIENT || '+61414960734';

// Scheduler state
let reconciliationInterval = null;
let lastReconciliationRun = null;
let lastReconciliationResult = null;

/**
 * Send admin notification SMS
 */
async function sendAdminAlert(message) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        console.log('⚠️ Admin SMS not sent - Twilio credentials not configured');
        return false;
    }

    try {
        const authString = `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`;
        const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

        await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            new URLSearchParams({
                'From': TWILIO_FROM_NUMBER,
                'To': ADMIN_SMS_RECIPIENT,
                'Body': message
            }),
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('✅ Admin alert SMS sent');
        return true;
    } catch (error) {
        console.error('❌ Admin SMS send error:', error.message);
        return false;
    }
}

/**
 * Get Airtable bookings for a date range
 */
async function getAirtableBookings(startDate, endDate) {
    const allRecords = [];
    let offset = null;

    do {
        const params = {
            filterByFormula: `AND(
                OR(IS_SAME({Booking Date}, '${startDate}'), IS_AFTER({Booking Date}, '${startDate}')),
                OR(IS_SAME({Booking Date}, '${endDate}'), IS_BEFORE({Booking Date}, '${endDate}'))
            )`,
            pageSize: 100,
            fields: ['Booking Code', 'Status']
        };

        if (offset) {
            params.offset = offset;
        }

        try {
            const response = await axios.get(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    params
                }
            );

            allRecords.push(...response.data.records);
            offset = response.data.offset;
        } catch (error) {
            console.error('Airtable fetch error:', error.message);
            throw error;
        }
    } while (offset);

    return allRecords;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Run the reconciliation check
 * Compares bookings from daysBack in the past to daysForward in the future
 * This ensures we catch bookings that are upcoming (not just past bookings)
 */
async function runReconciliation(daysBack = 14, daysForward = 14) {
    console.log('\n🔄 Running scheduled Checkfront-Airtable reconciliation...');

    // Check if Checkfront API is configured
    if (!checkfrontApi.isConfigured()) {
        console.log('⚠️ Checkfront API not configured - skipping reconciliation');
        return {
            success: false,
            error: 'Checkfront API not configured'
        };
    }

    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();
    startDate.setDate(today.getDate() - daysBack);
    endDate.setDate(today.getDate() + daysForward);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log(`📅 Checking bookings from ${startDateStr} to ${endDateStr} (${daysBack} days back, ${daysForward} days forward)...`);

    try {
        // Fetch from both systems
        const [checkfrontBookings, airtableRecords] = await Promise.all([
            checkfrontApi.getBookings(startDateStr, endDateStr),
            getAirtableBookings(startDateStr, endDateStr)
        ]);

        // Create lookup sets
        const airtableCodes = new Set(
            airtableRecords
                .map(r => r.fields['Booking Code'])
                .filter(Boolean)
        );

        // Find missing bookings (in Checkfront but not Airtable)
        // Only consider PAID and PART status as important
        const missingBookings = checkfrontBookings.filter(booking => {
            const status = booking.status || booking.status_id;
            const isPaidOrPart = status === 'PAID' || status === 'PART';
            return isPaidOrPart && !airtableCodes.has(booking.code);
        });

        // Log results
        console.log(`📊 Checkfront: ${checkfrontBookings.length} bookings`);
        console.log(`📊 Airtable: ${airtableRecords.length} bookings`);
        console.log(`⚠️ Missing in Airtable: ${missingBookings.length} PAID/PART bookings`);

        lastReconciliationRun = new Date();
        lastReconciliationResult = {
            checkfrontCount: checkfrontBookings.length,
            airtableCount: airtableRecords.length,
            missingCount: missingBookings.length,
            missingBookings: missingBookings.map(b => ({
                code: b.code,
                status: b.status || b.status_id,
                customer: b.customer_name,
                total: b.total
            }))
        };

        // If there are missing bookings, send an alert and attempt auto-sync
        if (missingBookings.length > 0) {
            console.log('\n🚨 Missing bookings detected:');
            missingBookings.forEach(b => {
                console.log(`   - ${b.code}: ${b.customer_name} ($${b.total})`);
            });

            // Send admin SMS alert
            const alertMessage = `⚠️ MBH Booking Alert\n\n${missingBookings.length} booking(s) missing from Airtable:\n` +
                missingBookings.slice(0, 3).map(b => `• ${b.code}`).join('\n') +
                (missingBookings.length > 3 ? `\n...and ${missingBookings.length - 3} more` : '') +
                `\n\nVisit reconciliation tool to sync.`;

            await sendAdminAlert(alertMessage);

            // Attempt auto-sync for missing bookings
            const syncResults = await autoSyncMissingBookings(missingBookings);
            lastReconciliationResult.syncResults = syncResults;
        }

        return {
            success: true,
            ...lastReconciliationResult
        };

    } catch (error) {
        console.error('❌ Reconciliation error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Parse date_desc string (e.g., "Sat Dec 13, 2025") to YYYY-MM-DD format
 */
function parseDateDesc(dateDesc) {
    if (!dateDesc) return null;
    try {
        const parsed = new Date(dateDesc);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
    } catch (e) {
        console.log(`⚠️ Could not parse date_desc: ${dateDesc}`);
    }
    return null;
}

/**
 * Format time in Sydney timezone
 */
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
    });
}

/**
 * Format date in Sydney timezone (YYYY-MM-DD)
 */
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Australia/Sydney'
    }).split('/').reverse().join('-');
}

/**
 * Auto-sync missing bookings to Airtable
 * Fetches FULL booking details to get phone, times, items
 * 
 * Note: The individual /booking/{id} endpoint returns a different structure:
 * - customer_name, customer_email, customer_phone (not nested)
 * - items object (not order.items.item)
 * - id field contains booking code (not code)
 */
async function autoSyncMissingBookings(missingBookings) {
    console.log(`\n📥 Auto-syncing ${missingBookings.length} missing bookings...`);

    const results = {
        synced: [],
        failed: []
    };

    for (const indexBooking of missingBookings) {
        try {
            console.log(`📋 Syncing booking ${indexBooking.code}...`);
            
            // Try to fetch full booking details using the booking ID
            let fullBooking = null;
            if (indexBooking.booking_id) {
                try {
                    fullBooking = await checkfrontApi.getBooking(indexBooking.booking_id);
                } catch (err) {
                    console.log(`   ⚠️ Could not fetch full details: ${err.message}`);
                }
            }
            
            // Use full booking data if available, otherwise fall back to index data
            const booking = fullBooking || indexBooking;
            
            // Handle both API format (flat) and webhook format (nested)
            const customer = booking.customer || {};
            const order = booking.order || {};
            
            // Extract customer info - try API format first, then webhook format
            const customerName = booking.customer_name || customer.name || indexBooking.customer_name || 'Unknown';
            const customerEmail = booking.customer_email || customer.email || indexBooking.customer_email || '';
            const customerPhone = booking.customer_phone || customer.phone || '';
            
            // Get booking code - API returns as 'id', webhook as 'code'
            const bookingCode = indexBooking.code || booking.id || booking.code;
            
            // Parse timestamps - could be number or string
            let startTimestamp = booking.start_date;
            if (typeof startTimestamp === 'string') startTimestamp = parseInt(startTimestamp);
            
            let endTimestamp = booking.end_date;
            if (typeof endTimestamp === 'string') endTimestamp = parseInt(endTimestamp);
            
            // Determine booking date
            let bookingDate, startDateTime, endDateTime;
            if (startTimestamp) {
                startDateTime = new Date(startTimestamp * 1000);
                bookingDate = formatDateAEST(startDateTime);
            } else if (indexBooking.date_desc) {
                bookingDate = parseDateDesc(indexBooking.date_desc);
            }
            if (!bookingDate) {
                bookingDate = new Date().toISOString().split('T')[0];
                console.log(`   ⚠️ No booking date, using today`);
            }
            
            if (endTimestamp) {
                endDateTime = new Date(endTimestamp * 1000);
            }
            
            // Process items - API uses 'items' object, webhook uses 'order.items.item' array
            let boatSKU = indexBooking.summary || '';
            const addOnsArray = [];
            
            const items = booking.items || {};
            const itemsArray = Object.values(items).filter(item => item && item.sku);
            
            if (order.items && order.items.item) {
                const webhookItems = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
                itemsArray.push(...webhookItems);
            }
            
            itemsArray.forEach(item => {
                const sku = item.sku || '';
                const name = item.name || sku;
                const categoryId = String(item.category_id || '');
                const quantity = parseInt(item.qty) || 1;
                const price = parseFloat(item.total || 0);
                
                const isBoat = categoryId === '2' || categoryId === '3' || 
                               sku.toLowerCase().includes('boat') || 
                               sku.toLowerCase().includes('polycraft');
                
                if (isBoat) {
                    boatSKU = name || sku;
                } else if (sku && !isBoat) {
                    let addOnStr = name || sku.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    if (quantity > 1) addOnStr = `${quantity} x ${addOnStr}`;
                    if (price > 0) addOnStr += ` - $${price.toFixed(2)}`;
                    addOnsArray.push(addOnStr);
                }
            });
            
            // Calculate duration
            let duration = '';
            if (startDateTime && endDateTime) {
                const durationMs = endDateTime - startDateTime;
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
                duration = `${hours} hours ${minutes} minutes`;
            }
            
            // Get created date
            let createdTimestamp = booking.created_date;
            if (typeof createdTimestamp === 'string') createdTimestamp = parseInt(createdTimestamp);
            const createdDate = createdTimestamp 
                ? new Date(createdTimestamp * 1000).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            
            // Get total
            const totalAmount = parseFloat(booking.total || order.total || indexBooking.total) || 0;

            // Prepare Airtable record
            const recordData = {
                'Booking Code': bookingCode,
                'Customer Name': customerName,
                'Customer Email': customerEmail,
                'Status': booking.status_id || booking.status || indexBooking.status_id || 'PAID',
                'Total Amount': totalAmount,
                'Booking Date': bookingDate,
                'Booking Items': boatSKU,
                'Created Date': createdDate
            };
            
            // Add optional fields
            if (customerPhone) recordData['Phone Number'] = customerPhone;
            if (startDateTime) recordData['Start Time'] = formatTimeAEST(startDateTime);
            if (endDateTime) {
                recordData['Finish Time'] = formatTimeAEST(endDateTime);
                recordData['End Date'] = formatDateAEST(endDateTime);
            }
            if (duration) recordData['Duration'] = duration;
            if (addOnsArray.length > 0) recordData['Add-ons'] = addOnsArray.join(', ');

            console.log(`   Customer: ${customerName}, Phone: ${customerPhone || 'N/A'}`);
            console.log(`   Time: ${recordData['Start Time'] || 'N/A'} - ${recordData['Finish Time'] || 'N/A'}`);

            // Create record in Airtable
            const response = await axios.post(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                { fields: recordData },
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`   ✅ Synced: ${bookingCode}`);
            results.synced.push({
                code: bookingCode,
                airtableId: response.data.id
            });

        } catch (error) {
            console.error(`   ❌ Failed to sync ${booking.code}:`, error.message);
            results.failed.push({
                code: booking.code,
                error: error.message
            });
        }
    }

    console.log(`\n📊 Sync complete: ${results.synced.length} synced, ${results.failed.length} failed`);
    return results;
}

/**
 * Start the reconciliation scheduler
 * Runs at startup and then every 6 hours
 */
function startReconciliationScheduler() {
    console.log('🚀 Starting Checkfront-Airtable reconciliation scheduler...');
    console.log('   - Running every 6 hours');
    console.log('   - Checking 14 days back AND 14 days forward');
    console.log('   - Auto-syncing missing PAID/PART bookings');

    // Run immediately on startup (after a short delay to let other services initialize)
    setTimeout(() => {
        runReconciliation(14).catch(err => {
            console.error('Initial reconciliation failed:', err.message);
        });
    }, 30000); // 30 second delay on startup

    // Then run every 6 hours
    reconciliationInterval = setInterval(() => {
        runReconciliation(14).catch(err => {
            console.error('Scheduled reconciliation failed:', err.message);
        });
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('✅ Reconciliation scheduler started');
}

/**
 * Stop the reconciliation scheduler
 */
function stopReconciliationScheduler() {
    if (reconciliationInterval) {
        clearInterval(reconciliationInterval);
        reconciliationInterval = null;
        console.log('🛑 Reconciliation scheduler stopped');
    }
}

/**
 * Get the status of the reconciliation scheduler
 */
function getReconciliationStatus() {
    return {
        active: !!reconciliationInterval,
        lastRun: lastReconciliationRun,
        lastResult: lastReconciliationResult,
        config: {
            checkInterval: '6 hours',
            daysBack: 14,
            daysForward: 14,
            autoSync: true,
            adminSmsEnabled: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER)
        }
    };
}

module.exports = {
    startReconciliationScheduler,
    stopReconciliationScheduler,
    runReconciliation,
    getReconciliationStatus
};



