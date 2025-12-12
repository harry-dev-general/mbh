// Checkfront API Client
// Handles authentication and API requests to Checkfront
// All credentials are loaded from environment variables for security

const axios = require('axios');

// Load Checkfront credentials from environment variables
// Checkfront uses OAuth 1.0a style credentials
const CHECKFRONT_HOST = process.env.CHECKFRONT_HOST; // e.g., 'boathiremanly.checkfront.com'
const CHECKFRONT_CONSUMER_KEY = process.env.CHECKFRONT_CONSUMER_KEY;
const CHECKFRONT_CONSUMER_SECRET = process.env.CHECKFRONT_CONSUMER_SECRET;

// Token URLs (optional - can be derived from host)
const CHECKFRONT_AUTHORIZE_URL = process.env.CHECKFRONT_AUTHORIZE_URL;
const CHECKFRONT_ACCESS_TOKEN_URL = process.env.CHECKFRONT_ACCESS_TOKEN_URL;

/**
 * Check if Checkfront credentials are configured
 */
function isConfigured() {
    return !!(CHECKFRONT_HOST && CHECKFRONT_CONSUMER_KEY && CHECKFRONT_CONSUMER_SECRET);
}

/**
 * Get Basic Auth header for Checkfront API
 * Checkfront API supports HTTP Basic Auth with Consumer Key:Secret
 */
function getAuthHeader() {
    if (!isConfigured()) {
        throw new Error('Checkfront API credentials not configured. Set CHECKFRONT_HOST, CHECKFRONT_CONSUMER_KEY, and CHECKFRONT_CONSUMER_SECRET environment variables.');
    }
    
    const credentials = Buffer.from(`${CHECKFRONT_CONSUMER_KEY}:${CHECKFRONT_CONSUMER_SECRET}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Make an authenticated request to Checkfront API
 * Uses HTTP Basic Auth with Consumer Key and Secret
 */
async function apiRequest(endpoint, params = {}) {
    if (!isConfigured()) {
        throw new Error('Checkfront API credentials not configured.');
    }

    const url = `https://${CHECKFRONT_HOST}/api/3.0/${endpoint}`;
    console.log(`🔗 Checkfront API Request: ${url}`);
    console.log(`📦 Parameters:`, JSON.stringify(params, null, 2));

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json'
            },
            params
        });

        // Log the full response structure for debugging
        console.log(`📥 Checkfront Response Status: ${response.status}`);
        console.log(`📥 Checkfront Response Keys:`, Object.keys(response.data || {}));
        
        // Log booking data if present (Checkfront returns under 'booking/index' key)
        if (response.data && response.data['booking/index']) {
            const bookingKeys = Object.keys(response.data['booking/index']);
            console.log(`📚 Found ${bookingKeys.length} booking entries`);
        }

        return response.data;
    } catch (error) {
        console.error(`❌ Checkfront API error for ${endpoint}:`);
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Data:`, error.response?.data);
        console.error(`   Message: ${error.message}`);
        throw error;
    }
}

/**
 * Get bookings from Checkfront within a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} status - Optional status filter (e.g., 'PAID', 'PART', 'VOID')
 * 
 * Note: Checkfront API v3.0 uses the /booking/index endpoint for listing bookings
 * The booking endpoint expects date parameters in different formats depending on version
 */
async function getBookings(startDate, endDate, status = null) {
    console.log(`📅 Fetching Checkfront bookings from ${startDate} to ${endDate}...`);
    console.log(`🏠 Using host: ${CHECKFRONT_HOST}`);

    // Try multiple parameter formats as Checkfront API can be inconsistent
    // Format 1: Checkfront v3.0 uses start_date/end_date for the booking date range
    // Format 2: Some implementations use date_start/date_end
    const params = {
        start_date: startDate,
        end_date: endDate,
        limit: 100 // Max per page
    };

    if (status) {
        params.status_id = status; // Some versions use status_id instead of status
    }

    let allBookings = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        params.page = page;
        
        try {
            // Try the booking/index endpoint which lists all bookings
            const response = await apiRequest('booking/index', params);
            
            // Checkfront API v3.0 returns bookings under 'booking/index' key (not 'booking')
            const bookingData = response['booking/index'] || response.booking;
            
            console.log(`📄 Page ${page} - Response keys:`, Object.keys(response).join(', '));
            console.log(`📄 Page ${page} - Booking data type:`, typeof bookingData);
            
            if (bookingData && typeof bookingData === 'object') {
                // Checkfront returns bookings as an object with booking IDs as keys
                const bookingEntries = Object.entries(bookingData);
                console.log(`📄 Page ${page}: Found ${bookingEntries.length} booking entries`);
                
                // Filter out non-booking entries (like metadata) - booking IDs are numeric
                const bookings = bookingEntries
                    .filter(([key, value]) => !isNaN(parseInt(key)) && typeof value === 'object' && value.booking_id)
                    .map(([key, value]) => ({
                        ...value,
                        // Normalize field names for consistency
                        code: value.code,
                        status: value.status_id,
                        customer: {
                            id: value.customer_id,
                            name: value.customer_name,
                            email: value.customer_email
                        },
                        order: {
                            total: value.total,
                            paid: value.paid_total,
                            tax: value.tax_total
                        }
                    }));
                
                allBookings = allBookings.concat(bookings);
                
                // Check if there are more pages - pagination info is in request object
                const totalPages = response.request?.pages || 1;
                const currentPage = response.request?.page || page;
                const totalRecords = response.request?.total_records || 0;
                console.log(`📄 Pagination: Page ${currentPage} of ${totalPages} (${totalRecords} total records)`);
                
                hasMore = page < totalPages;
                page++;
            } else if (Array.isArray(response.bookings)) {
                // Some API versions return bookings as an array
                allBookings = allBookings.concat(response.bookings);
                hasMore = false;
            } else {
                console.log(`⚠️ No booking data found. Response keys: ${Object.keys(response).join(', ')}`);
                hasMore = false;
            }
        } catch (error) {
            console.error(`❌ Error fetching page ${page}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`✅ Retrieved ${allBookings.length} bookings from Checkfront`);
    return allBookings;
}

/**
 * Get a single booking by ID - returns FULL booking details
 * This endpoint returns more data than /booking/index including:
 * - customer.phone
 * - start_date/end_date timestamps
 * - order.items (detailed breakdown)
 */
async function getBooking(bookingId) {
    try {
        console.log(`📋 Fetching full booking details for ID: ${bookingId}`);
        const response = await apiRequest(`booking/${bookingId}`);
        
        if (response.booking) {
            console.log(`✅ Got full booking: ${response.booking.code}`);
            console.log(`   Customer phone: ${response.booking.customer?.phone || 'N/A'}`);
            console.log(`   Start date: ${response.booking.start_date ? new Date(response.booking.start_date * 1000).toISOString() : 'N/A'}`);
        }
        
        return response.booking || null;
    } catch (error) {
        console.error(`Error fetching booking ${bookingId}:`, error.message);
        return null;
    }
}

/**
 * Get full booking details by booking code
 * First finds the booking ID from the index, then fetches full details
 */
async function getFullBookingByCode(bookingCode) {
    console.log(`🔍 Looking up full details for booking code: ${bookingCode}`);
    
    // First, find the booking in the index to get the ID
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();
    startDate.setMonth(today.getMonth() - 6);
    endDate.setMonth(today.getMonth() + 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const bookings = await getBookings(startStr, endStr);
    const indexBooking = bookings.find(b => b.code === bookingCode);
    
    if (!indexBooking) {
        console.log(`⚠️ Booking ${bookingCode} not found in index`);
        return null;
    }
    
    // Now fetch full details using the booking ID
    const fullBooking = await getBooking(indexBooking.booking_id);
    return fullBooking;
}

/**
 * Get booking by code (searches past and future bookings)
 */
async function getBookingByCode(bookingCode) {
    // Search from 6 months ago to 6 months in the future
    // This ensures we find both past bookings and upcoming future bookings
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();
    startDate.setMonth(today.getMonth() - 6);
    endDate.setMonth(today.getMonth() + 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const bookings = await getBookings(startStr, endStr);
    return bookings.find(b => b.code === bookingCode) || null;
}

/**
 * Test the Checkfront connection
 */
async function testConnection() {
    if (!isConfigured()) {
        return {
            success: false,
            error: 'Checkfront credentials not configured',
            configured: false,
            requiredVars: ['CHECKFRONT_HOST', 'CHECKFRONT_CONSUMER_KEY', 'CHECKFRONT_CONSUMER_SECRET']
        };
    }

    try {
        // First try the ping endpoint to verify authentication
        console.log('🔍 Testing Checkfront connection...');
        
        try {
            const pingResponse = await apiRequest('ping');
            console.log('✅ Ping successful:', pingResponse);
        } catch (pingError) {
            console.log('⚠️ Ping endpoint not available, trying account endpoint...');
        }
        
        // Try to fetch account info to verify we have proper access
        try {
            const accountResponse = await apiRequest('account');
            console.log('✅ Account info retrieved:', accountResponse.account?.name || 'Unknown');
            
            return {
                success: true,
                configured: true,
                host: CHECKFRONT_HOST,
                accountName: accountResponse.account?.name
            };
        } catch (accountError) {
            console.log('⚠️ Account endpoint failed, trying booking endpoint...');
        }
        
        // Fallback: Try to fetch a small amount of booking data
        const today = new Date().toISOString().split('T')[0];
        const response = await apiRequest('booking/index', { 
            start_date: today, 
            end_date: today,
            limit: 1 
        });

        return {
            success: true,
            configured: true,
            host: CHECKFRONT_HOST,
            responseKeys: Object.keys(response || {})
        };
    } catch (error) {
        return {
            success: false,
            configured: true,
            error: error.response?.data?.error || error.message,
            host: CHECKFRONT_HOST,
            statusCode: error.response?.status,
            fullError: error.response?.data
        };
    }
}

/**
 * Debug function to test raw API response
 * Returns the raw response from a booking query
 */
async function debugApiCall(endpoint, params = {}) {
    if (!isConfigured()) {
        return { error: 'Not configured' };
    }
    
    try {
        const response = await apiRequest(endpoint, params);
        return {
            success: true,
            endpoint,
            params,
            responseKeys: Object.keys(response || {}),
            data: response
        };
    } catch (error) {
        return {
            success: false,
            endpoint,
            params,
            error: error.message,
            statusCode: error.response?.status,
            responseData: error.response?.data
        };
    }
}

/**
 * Make a POST request to Checkfront API
 */
async function apiPost(endpoint, data = {}) {
    if (!isConfigured()) {
        throw new Error('Checkfront API credentials not configured.');
    }

    const url = `https://${CHECKFRONT_HOST}/api/3.0/${endpoint}`;
    console.log(`🔗 Checkfront API POST: ${url}`);
    console.log(`📦 Data:`, JSON.stringify(data, null, 2));

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(`📥 Checkfront POST Response Status: ${response.status}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Checkfront API POST error for ${endpoint}:`);
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Data:`, error.response?.data);
        throw error;
    }
}

/**
 * Get available items/add-ons from Checkfront
 * @param {string} startDate - Start date YYYYMMDD format
 * @param {string} endDate - End date YYYYMMDD format
 * @param {number} categoryId - Optional category ID (7 = add-ons typically)
 */
async function getItems(startDate, endDate, categoryId = null) {
    console.log(`📦 Fetching available items for ${startDate} to ${endDate}...`);
    
    const params = {
        start_date: startDate,
        end_date: endDate
    };
    
    if (categoryId) {
        params.category_id = categoryId;
    }
    
    try {
        const response = await apiRequest('item', params);
        const items = response.items || response.item || {};
        
        // Convert object to array
        const itemsArray = Object.values(items).filter(item => item && item.item_id);
        console.log(`✅ Found ${itemsArray.length} items`);
        
        return itemsArray;
    } catch (error) {
        console.error('Error fetching items:', error.message);
        return [];
    }
}

/**
 * Get SLIP (Secure Line Item Parameter) for an item
 * Required to add items to a booking session
 * @param {string} itemId - The item ID
 * @param {string} startDate - Start date YYYYMMDD format
 * @param {string} endDate - End date YYYYMMDD format
 * @param {object} params - Additional parameters (qty, guests, etc.)
 */
async function getItemSlip(itemId, startDate, endDate, params = {}) {
    console.log(`🎫 Getting SLIP for item ${itemId}...`);
    
    const queryParams = {
        start_date: startDate,
        end_date: endDate,
        ...params
    };
    
    try {
        const response = await apiRequest(`item/${itemId}`, queryParams);
        
        if (response.item && response.item.rate && response.item.rate.slip) {
            console.log(`✅ Got SLIP for item ${itemId}`);
            return {
                slip: response.item.rate.slip,
                price: response.item.rate.price || response.item.rate.summary?.price,
                available: response.item.rate.status === 'AVAILABLE',
                item: response.item
            };
        }
        
        console.log(`⚠️ No SLIP available for item ${itemId}`, response);
        return null;
    } catch (error) {
        console.error(`Error getting SLIP for item ${itemId}:`, error.message);
        return null;
    }
}

/**
 * Create a booking session with items
 * @param {string[]} slips - Array of SLIPs to add to the session
 */
async function createBookingSession(slips) {
    console.log(`📋 Creating booking session with ${slips.length} items...`);
    
    // Build the slip array for the request
    const data = new URLSearchParams();
    slips.forEach(slip => {
        data.append('slip[]', slip);
    });
    
    try {
        const response = await apiPost('booking/session', data);
        
        if (response.booking && response.booking.session) {
            console.log(`✅ Session created: ${response.booking.session.id}`);
            return response.booking.session;
        }
        
        return response;
    } catch (error) {
        console.error('Error creating booking session:', error.message);
        throw error;
    }
}

/**
 * Add items to an existing booking
 * @param {string} bookingId - The existing booking ID
 * @param {string[]} slips - Array of SLIPs to add
 */
async function addItemsToBooking(bookingId, slips) {
    console.log(`➕ Adding ${slips.length} items to booking ${bookingId}...`);
    
    // First create a session with the new items
    const session = await createBookingSession(slips);
    
    if (!session || !session.id) {
        throw new Error('Failed to create booking session');
    }
    
    // Now update the booking with the new session
    const data = new URLSearchParams();
    data.append('session_id', session.id);
    
    try {
        const response = await apiPost(`booking/${bookingId}/update`, data);
        console.log(`✅ Booking ${bookingId} updated with new items`);
        return response;
    } catch (error) {
        console.error(`Error updating booking ${bookingId}:`, error.message);
        throw error;
    }
}

/**
 * Get add-ons category items (typically category 7 for MBH)
 */
async function getAddOns(startDate, endDate) {
    // Add-ons are typically in categories 4, 5, 6, 7
    const addOnCategories = [4, 5, 6, 7];
    const allAddOns = [];
    
    for (const categoryId of addOnCategories) {
        try {
            const items = await getItems(startDate, endDate, categoryId);
            allAddOns.push(...items);
        } catch (error) {
            console.log(`⚠️ Could not fetch category ${categoryId}`);
        }
    }
    
    return allAddOns;
}

module.exports = {
    isConfigured,
    getAuthHeader,
    apiRequest,
    apiPost,
    getBookings,
    getBooking,
    getBookingByCode,
    getFullBookingByCode,
    testConnection,
    debugApiCall,
    // New add-on functions
    getItems,
    getItemSlip,
    createBookingSession,
    addItemsToBooking,
    getAddOns
};

