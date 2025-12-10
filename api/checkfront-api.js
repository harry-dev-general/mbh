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

    try {
        const response = await axios.get(
            `https://${CHECKFRONT_HOST}/api/3.0/${endpoint}`,
            {
                headers: {
                    'Authorization': getAuthHeader(),
                    'Accept': 'application/json'
                },
                params
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Checkfront API error for ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get bookings from Checkfront within a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} status - Optional status filter (e.g., 'PAID', 'PART', 'VOID')
 */
async function getBookings(startDate, endDate, status = null) {
    console.log(`📅 Fetching Checkfront bookings from ${startDate} to ${endDate}...`);

    const params = {
        start_date: startDate,
        end_date: endDate,
        limit: 100 // Max per page
    };

    if (status) {
        params.status = status;
    }

    let allBookings = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        params.page = page;
        
        try {
            const response = await apiRequest('booking', params);
            
            if (response.booking && typeof response.booking === 'object') {
                // Checkfront returns bookings as an object with booking IDs as keys
                const bookings = Object.values(response.booking);
                allBookings = allBookings.concat(bookings);
                
                // Check if there are more pages
                const totalPages = response.request?.pages || 1;
                hasMore = page < totalPages;
                page++;
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error.message);
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
 * Get booking by code (searches recent bookings)
 */
async function getBookingByCode(bookingCode) {
    // Search in last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

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
        // Try to fetch account info or a small amount of data to verify access
        // Using the /api/3.0/booking endpoint with minimal params
        const today = new Date().toISOString().split('T')[0];
        await apiRequest('booking', { 
            start_date: today, 
            end_date: today,
            limit: 1 
        });

        return {
            success: true,
            configured: true,
            host: CHECKFRONT_HOST
        };
    } catch (error) {
        return {
            success: false,
            configured: true,
            error: error.response?.data?.error || error.message,
            host: CHECKFRONT_HOST,
            statusCode: error.response?.status
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
    testConnection
};

