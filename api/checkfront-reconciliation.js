// Checkfront-Airtable Reconciliation API
// Compares bookings between Checkfront and Airtable to identify discrepancies
// All credentials loaded from environment variables for security

const express = require('express');
const router = express.Router();
const axios = require('axios');
const checkfrontApi = require('./checkfront-api');

// Airtable configuration (from environment)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

// Admin API key for protecting these endpoints
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'mbh-admin-2025';

/**
 * Middleware to verify admin authentication
 */
function requireAdmin(req, res, next) {
    const providedKey = req.headers['x-admin-key'] || req.query.adminKey;
    
    if (providedKey !== ADMIN_API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized. Provide valid admin key via X-Admin-Key header or adminKey query param.'
        });
    }
    
    next();
}

/**
 * Get all Airtable bookings within a date range
 */
async function getAirtableBookings(startDate, endDate) {
    console.log(`📊 Fetching Airtable bookings from ${startDate} to ${endDate}...`);
    
    const allRecords = [];
    let offset = null;
    
    do {
        // Use >= and <= logic for inclusive date range
        // IS_AFTER/IS_BEFORE are exclusive, so we use OR with IS_SAME to include boundary dates
        const params = {
            filterByFormula: `AND(
                OR(IS_SAME({Booking Date}, '${startDate}'), IS_AFTER({Booking Date}, '${startDate}')),
                OR(IS_SAME({Booking Date}, '${endDate}'), IS_BEFORE({Booking Date}, '${endDate}'))
            )`,
            pageSize: 100,
            fields: [
                'Booking Code',
                'Customer Name',
                'Customer Email',
                'Phone Number',
                'Booking Date',
                'Start Time',
                'Finish Time',
                'Status',
                'Total Amount',
                'Booking Items',
                'Add-ons',
                'Created Date'
            ]
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
            console.error('Airtable fetch error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch Airtable bookings: ${error.message}`);
        }
    } while (offset);
    
    console.log(`✅ Retrieved ${allRecords.length} bookings from Airtable`);
    return allRecords;
}

/**
 * Compare Checkfront and Airtable bookings
 */
function compareBookings(checkfrontBookings, airtableRecords) {
    // Create maps for easy lookup
    const airtableByCode = new Map();
    airtableRecords.forEach(record => {
        const code = record.fields['Booking Code'];
        if (code) {
            // Handle duplicates - keep the one with PAID status or most recent
            if (!airtableByCode.has(code)) {
                airtableByCode.set(code, record);
            } else {
                const existing = airtableByCode.get(code);
                if (record.fields['Status'] === 'PAID' && existing.fields['Status'] !== 'PAID') {
                    airtableByCode.set(code, record);
                }
            }
        }
    });
    
    const checkfrontByCode = new Map();
    checkfrontBookings.forEach(booking => {
        if (booking.code) {
            checkfrontByCode.set(booking.code, booking);
        }
    });
    
    // Find discrepancies
    const missingInAirtable = []; // In Checkfront but not in Airtable
    const missingInCheckfront = []; // In Airtable but not in Checkfront
    const statusMismatch = []; // Different status between systems
    const amountMismatch = []; // Different amounts between systems
    const matched = []; // Successfully matched
    
    // Check each Checkfront booking
    checkfrontBookings.forEach(cfBooking => {
        const code = cfBooking.code;
        const airtableRecord = airtableByCode.get(code);
        
        // Get customer info - handle both normalized and raw formats
        const customerName = cfBooking.customer?.name || cfBooking.customer_name || 'Unknown';
        const customerEmail = cfBooking.customer?.email || cfBooking.customer_email || '';
        
        // Get status - handle both formats
        const cfStatus = cfBooking.status || cfBooking.status_id || 'Unknown';
        
        // Get total amount - handle both formats
        const cfTotal = cfBooking.order?.total || cfBooking.total || 0;
        
        // Get booking date - handle both formats
        let bookingDate = 'Unknown';
        if (cfBooking.start_date) {
            bookingDate = new Date(cfBooking.start_date * 1000).toISOString().split('T')[0];
        } else if (cfBooking.date_desc) {
            bookingDate = cfBooking.date_desc;
        }
        
        if (!airtableRecord) {
            missingInAirtable.push({
                bookingCode: code,
                customerName: customerName,
                email: customerEmail,
                bookingDate: bookingDate,
                status: cfStatus,
                total: cfTotal,
                source: 'checkfront',
                checkfrontData: {
                    id: cfBooking.booking_id,
                    code: code,
                    status: cfStatus,
                    total: cfTotal,
                    summary: cfBooking.summary || '',
                    created: cfBooking.created_date ? new Date(cfBooking.created_date * 1000).toISOString() : null
                }
            });
        } else {
            // Check for mismatches
            const atStatus = airtableRecord.fields['Status'];
            const atAmount = parseFloat(airtableRecord.fields['Total Amount'] || 0);
            const cfAmount = parseFloat(cfTotal || 0);
            
            let hasMismatch = false;
            
            if (atStatus !== cfStatus) {
                statusMismatch.push({
                    bookingCode: code,
                    customerName: customerName || airtableRecord.fields['Customer Name'],
                    airtableStatus: atStatus,
                    checkfrontStatus: cfStatus,
                    airtableRecordId: airtableRecord.id
                });
                hasMismatch = true;
            }
            
            // Allow small amount differences (rounding)
            if (Math.abs(atAmount - cfAmount) > 1) {
                amountMismatch.push({
                    bookingCode: code,
                    customerName: customerName || airtableRecord.fields['Customer Name'],
                    airtableAmount: atAmount,
                    checkfrontAmount: cfAmount,
                    difference: cfAmount - atAmount,
                    airtableRecordId: airtableRecord.id
                });
                hasMismatch = true;
            }
            
            if (!hasMismatch) {
                matched.push({
                    bookingCode: code,
                    customerName: airtableRecord.fields['Customer Name'],
                    status: atStatus,
                    amount: atAmount
                });
            }
        }
    });
    
    // Check for Airtable records not in Checkfront
    airtableRecords.forEach(record => {
        const code = record.fields['Booking Code'];
        if (code && !checkfrontByCode.has(code)) {
            missingInCheckfront.push({
                bookingCode: code,
                customerName: record.fields['Customer Name'],
                bookingDate: record.fields['Booking Date'],
                status: record.fields['Status'],
                total: record.fields['Total Amount'],
                airtableRecordId: record.id,
                source: 'airtable'
            });
        }
    });
    
    return {
        summary: {
            checkfrontTotal: checkfrontBookings.length,
            airtableTotal: airtableRecords.length,
            matched: matched.length,
            missingInAirtable: missingInAirtable.length,
            missingInCheckfront: missingInCheckfront.length,
            statusMismatches: statusMismatch.length,
            amountMismatches: amountMismatch.length
        },
        missingInAirtable,
        missingInCheckfront,
        statusMismatch,
        amountMismatch,
        matched
    };
}

/**
 * Format date for display
 */
function formatDate(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Australia/Sydney'
    });
}

// ============== API ENDPOINTS ==============

/**
 * GET /api/reconciliation/status
 * Check if Checkfront API is configured and connected
 */
router.get('/status', requireAdmin, async (req, res) => {
    try {
        const checkfrontStatus = await checkfrontApi.testConnection();
        const airtableConfigured = !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);
        
        res.json({
            success: true,
            checkfront: checkfrontStatus,
            airtable: {
                configured: airtableConfigured,
                baseId: airtableConfigured ? AIRTABLE_BASE_ID : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/reconciliation/compare
 * Compare bookings between Checkfront and Airtable
 * Query params:
 *   - startDate: YYYY-MM-DD (required)
 *   - endDate: YYYY-MM-DD (required)
 *   - includeMatched: boolean (default false) - include matched bookings in response
 */
router.get('/compare', requireAdmin, async (req, res) => {
    const { startDate, endDate, includeMatched } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            error: 'startDate and endDate query parameters are required (YYYY-MM-DD format)'
        });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({
            success: false,
            error: 'Dates must be in YYYY-MM-DD format'
        });
    }
    
    try {
        console.log(`\n🔄 Starting reconciliation for ${startDate} to ${endDate}...`);
        
        // Check Checkfront configuration
        if (!checkfrontApi.isConfigured()) {
            return res.status(400).json({
                success: false,
                error: 'Checkfront API not configured. Set CHECKFRONT_HOST, CHECKFRONT_CONSUMER_KEY, and CHECKFRONT_CONSUMER_SECRET environment variables.'
            });
        }
        
        // Fetch bookings from both systems in parallel
        const [checkfrontBookings, airtableRecords] = await Promise.all([
            checkfrontApi.getBookings(startDate, endDate),
            getAirtableBookings(startDate, endDate)
        ]);
        
        // Compare bookings
        const comparison = compareBookings(checkfrontBookings, airtableRecords);
        
        // Build response
        const response = {
            success: true,
            dateRange: { startDate, endDate },
            summary: comparison.summary,
            discrepancies: {
                missingInAirtable: comparison.missingInAirtable,
                missingInCheckfront: comparison.missingInCheckfront,
                statusMismatch: comparison.statusMismatch,
                amountMismatch: comparison.amountMismatch
            }
        };
        
        // Optionally include matched records
        if (includeMatched === 'true') {
            response.matched = comparison.matched;
        }
        
        console.log(`✅ Reconciliation complete. Found ${comparison.missingInAirtable.length} missing in Airtable.`);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Reconciliation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Parse date_desc string (e.g., "Sat Dec 13, 2025") to YYYY-MM-DD format
 */
function parseDateDesc(dateDesc) {
    if (!dateDesc) return null;
    try {
        // Parse the date description string
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
 * Sync a single booking from Checkfront data to Airtable
 * Fetches FULL booking details to get phone, times, items
 * Does NOT send SMS notifications
 * 
 * Note: The individual /booking/{id} endpoint returns a different structure than webhooks:
 * - customer_name, customer_email, customer_phone (not nested)
 * - items object (not order.items.item)
 * - id field contains booking code (not code)
 */
async function syncBookingToAirtable(indexBooking) {
    console.log(`📋 Syncing booking ${indexBooking.code} to Airtable...`);
    
    // Try to fetch full booking details using the booking ID
    let fullBooking = null;
    if (indexBooking.booking_id) {
        try {
            fullBooking = await checkfrontApi.getBooking(indexBooking.booking_id);
        } catch (err) {
            console.log(`⚠️ Could not fetch full details for ${indexBooking.code}: ${err.message}`);
        }
    }
    
    // Use full booking data if available, otherwise fall back to index data
    const booking = fullBooking || indexBooking;
    
    // Handle both API format (flat) and webhook format (nested)
    // API format: customer_name, customer_email, customer_phone at root
    // Webhook format: customer.name, customer.email, customer.phone
    const customer = booking.customer || {};
    const order = booking.order || {};
    
    // Extract customer info - try API format first, then webhook format
    const customerName = booking.customer_name || customer.name || indexBooking.customer_name || 'Unknown';
    const customerEmail = booking.customer_email || customer.email || indexBooking.customer_email || '';
    const customerPhone = booking.customer_phone || customer.phone || '';
    
    // Get booking code - API returns as 'id', webhook as 'code'
    const bookingCode = indexBooking.code || booking.id || booking.code;
    
    // Parse start_date - could be number or string
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
        console.log(`⚠️ No booking date found for ${bookingCode}, using today`);
    }
    
    if (endTimestamp) {
        endDateTime = new Date(endTimestamp * 1000);
    }
    
    // Process items - API uses 'items' object, webhook uses 'order.items.item' array
    let boatSKU = indexBooking.summary || '';
    const addOnsArray = [];
    
    // Handle API format (items as object with numeric keys)
    const items = booking.items || {};
    const itemsArray = Object.values(items).filter(item => item && item.sku);
    
    // Also handle webhook format if present
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
        
        // Category 2, 3 are boats; 4, 5, 6, 7 are add-ons
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
    
    // Add optional fields only if we have the data
    if (customerPhone) {
        recordData['Phone Number'] = customerPhone;
    }
    
    if (startDateTime) {
        recordData['Start Time'] = formatTimeAEST(startDateTime);
    }
    
    if (endDateTime) {
        recordData['Finish Time'] = formatTimeAEST(endDateTime);
        recordData['End Date'] = formatDateAEST(endDateTime);
    }
    
    if (duration) {
        recordData['Duration'] = duration;
    }
    
    if (addOnsArray.length > 0) {
        recordData['Add-ons'] = addOnsArray.join(', ');
    }
    
    console.log(`   Customer: ${customerName}`);
    console.log(`   Phone: ${customerPhone || 'N/A'}`);
    console.log(`   Date: ${bookingDate}`);
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

    return {
        recordId: response.data.id,
        action: 'created'
    };
}

/**
 * POST /api/reconciliation/sync
 * Sync missing bookings from Checkfront to Airtable
 * Body: { bookingCodes: ['CODE1', 'CODE2'] } or { syncAll: true }
 */
router.post('/sync', requireAdmin, async (req, res) => {
    const { bookingCodes, syncAll, startDate, endDate } = req.body;
    
    if (!bookingCodes && !syncAll) {
        return res.status(400).json({
            success: false,
            error: 'Provide either bookingCodes array or syncAll: true with startDate/endDate'
        });
    }
    
    try {
        let bookingsToSync = [];
        
        if (syncAll && startDate && endDate) {
            // Get comparison first
            const checkfrontBookings = await checkfrontApi.getBookings(startDate, endDate);
            const airtableRecords = await getAirtableBookings(startDate, endDate);
            const comparison = compareBookings(checkfrontBookings, airtableRecords);
            
            // Get the full Checkfront data for each missing booking
            bookingsToSync = comparison.missingInAirtable.map(missing => ({
                ...missing.checkfrontData,
                customer_name: missing.customerName,
                customer_email: missing.email
            }));
        } else if (bookingCodes && Array.isArray(bookingCodes)) {
            // Fetch specific bookings from Checkfront
            for (const code of bookingCodes) {
                const booking = await checkfrontApi.getBookingByCode(code);
                if (booking) {
                    bookingsToSync.push(booking);
                } else {
                    console.log(`⚠️ Booking ${code} not found in Checkfront`);
                }
            }
        }
        
        if (bookingsToSync.length === 0) {
            return res.json({
                success: true,
                message: 'No bookings to sync',
                synced: 0
            });
        }
        
        console.log(`📥 Syncing ${bookingsToSync.length} bookings to Airtable...`);
        
        const results = {
            synced: [],
            failed: []
        };
        
        for (const booking of bookingsToSync) {
            try {
                const result = await syncBookingToAirtable(booking);
                
                console.log(`   ✅ Synced: ${booking.code}`);
                results.synced.push({
                    bookingCode: booking.code,
                    recordId: result.recordId,
                    action: result.action
                });
            } catch (error) {
                console.error(`   ❌ Failed to sync ${booking.code}:`, error.message);
                results.failed.push({
                    bookingCode: booking.code,
                    error: error.message
                });
            }
        }
        
        console.log(`📊 Sync complete: ${results.synced.length} synced, ${results.failed.length} failed`);
        
        res.json({
            success: true,
            message: `Synced ${results.synced.length} bookings`,
            synced: results.synced.length,
            failed: results.failed.length,
            details: results
        });
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/reconciliation/debug
 * Debug endpoint to test raw Checkfront API responses
 * Query params:
 *   - endpoint: API endpoint to test (default: 'booking/index')
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 */
router.get('/debug', requireAdmin, async (req, res) => {
    const { endpoint = 'booking/index', startDate, endDate } = req.query;
    
    try {
        // Test basic connection first
        console.log('\n🔍 Debug: Testing Checkfront API...');
        
        const connectionTest = await checkfrontApi.testConnection();
        console.log('Connection test result:', JSON.stringify(connectionTest, null, 2));
        
        // If dates provided, test a booking query
        let bookingQuery = null;
        if (startDate && endDate) {
            console.log(`\n🔍 Debug: Querying ${endpoint} from ${startDate} to ${endDate}...`);
            
            const params = {
                start_date: startDate,
                end_date: endDate,
                limit: 10
            };
            
            bookingQuery = await checkfrontApi.debugApiCall(endpoint, params);
        }
        
        // Also test a few different endpoints to see what works
        const endpointsToTest = ['ping', 'account', 'booking', 'booking/index'];
        const endpointTests = {};
        
        for (const ep of endpointsToTest) {
            try {
                const result = await checkfrontApi.debugApiCall(ep, { limit: 1 });
                endpointTests[ep] = {
                    success: result.success,
                    responseKeys: result.responseKeys,
                    error: result.error
                };
            } catch (error) {
                endpointTests[ep] = { success: false, error: error.message };
            }
        }
        
        res.json({
            success: true,
            debug: {
                host: process.env.CHECKFRONT_HOST,
                hasConsumerKey: !!process.env.CHECKFRONT_CONSUMER_KEY,
                hasConsumerSecret: !!process.env.CHECKFRONT_CONSUMER_SECRET,
                connectionTest,
                endpointTests,
                bookingQuery
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * GET /api/reconciliation/booking/:code
 * Get a specific booking from both systems for comparison
 */
/**
 * GET /api/reconciliation/booking-debug/:id
 * Debug endpoint to see raw Checkfront booking data by ID
 */
router.get('/booking-debug/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const rawBooking = await checkfrontApi.getBooking(id);
        res.json({
            success: true,
            bookingId: id,
            rawData: rawBooking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/booking/:code', requireAdmin, async (req, res) => {
    const { code } = req.params;
    
    try {
        // Fetch from both systems - use getFullBookingByCode for complete data
        const [checkfrontBooking, airtableResponse] = await Promise.all([
            checkfrontApi.getFullBookingByCode(code),
            axios.get(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        filterByFormula: `{Booking Code} = "${code}"`,
                        maxRecords: 10
                    }
                }
            ).catch(() => ({ data: { records: [] } }))
        ]);
        
        // Handle both API format (flat) and webhook format (nested)
        const parseTimestamp = (ts) => {
            if (!ts) return null;
            const num = typeof ts === 'string' ? parseInt(ts) : ts;
            return new Date(num * 1000).toISOString();
        };
        
        res.json({
            success: true,
            bookingCode: code,
            checkfront: checkfrontBooking ? {
                found: true,
                data: {
                    id: checkfrontBooking.booking_id,
                    code: checkfrontBooking.id || checkfrontBooking.code, // API uses 'id' for booking code
                    status: checkfrontBooking.status_id || checkfrontBooking.status,
                    customer: {
                        name: checkfrontBooking.customer_name || checkfrontBooking.customer?.name,
                        email: checkfrontBooking.customer_email || checkfrontBooking.customer?.email,
                        phone: checkfrontBooking.customer_phone || checkfrontBooking.customer?.phone
                    },
                    total: checkfrontBooking.total,
                    items: checkfrontBooking.items,
                    startDate: parseTimestamp(checkfrontBooking.start_date),
                    endDate: parseTimestamp(checkfrontBooking.end_date),
                    createdDate: parseTimestamp(checkfrontBooking.created_date)
                }
            } : { found: false },
            airtable: airtableResponse.data.records.length > 0 ? {
                found: true,
                recordCount: airtableResponse.data.records.length,
                records: airtableResponse.data.records.map(r => ({
                    id: r.id,
                    fields: r.fields
                }))
            } : { found: false }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

