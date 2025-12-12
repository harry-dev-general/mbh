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
 * Get a single booking by ID or code
 */
async function getBooking(bookingId) {
    try {
        const response = await apiRequest(`booking/${bookingId}`);
        return response.booking || null;
    } catch (error) {
        console.error(`Error fetching booking ${bookingId}:`, error.message);
        return null;
    }
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

module.exports = {
    isConfigured,
    getAuthHeader,
    apiRequest,
    getBookings,
    getBooking,
    getBookingByCode,
    testConnection,
    debugApiCall
};

