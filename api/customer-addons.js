// Customer Add-ons Portal API
// Allows customers to add extras to their existing bookings
// Integrates with Checkfront API to update bookings and handle payments

const express = require('express');
const router = express.Router();
const axios = require('axios');
const checkfrontApi = require('./checkfront-api');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

// Available add-ons with Checkfront item IDs
// Confirmed from Checkfront API and existing booking data
const ADDON_ITEMS = {
    // Water Sports
    'lillypad': { 
        itemId: '8',
        name: 'Lilly Pad', 
        price: 55.00, 
        description: 'Floating platform for swimming and relaxing',
        category: 'Water Sports'
    },
    
    // Fishing
    'fishingrods': { 
        itemId: '9',
        name: 'Fishing Rod (Rigged)', 
        price: 20.00, 
        description: 'Rigged fishing rod ready to use',
        category: 'Fishing'
    },
    'fishingbait-squidpack200g': { 
        itemId: '14',
        name: 'Fishing Bait - Squid Pack (200g)', 
        price: 20.00, 
        description: 'Fresh squid bait pack',
        category: 'Fishing'
    },
    'fishingbait-pilchardpack500g': { 
        itemId: '15',
        name: 'Fishing Bait - Pilchard Pack (500g)', 
        price: 40.00, 
        description: 'Fresh pilchard bait pack',
        category: 'Fishing'
    },
    
    // Comfort
    'icebag': { 
        itemId: '11',
        name: 'Ice Bag', 
        price: 12.50, 
        description: 'Bag of ice for your cooler',
        category: 'Comfort'
    },
    
    // Food & BBQ
    'largebbqmeatplatter': { 
        itemId: '16',
        name: 'Large BBQ Meat Platter', 
        price: 120.00, 
        description: 'Large meat platter for BBQ (serves 10-12)',
        category: 'Food'
    },
    'mediumbbqmeatplatter': { 
        itemId: '17',
        name: 'Medium BBQ Meat Platter', 
        price: 85.00, 
        description: 'Medium meat platter for BBQ (serves 6-8)',
        category: 'Food'
    },
    'smallbbqmeatplatter': { 
        itemId: '18',
        name: 'Small BBQ Meat Platter', 
        price: 55.00, 
        description: 'Small meat platter for BBQ (serves 4-5)',
        category: 'Food'
    }
};

/**
 * Format date to Checkfront YYYYMMDD format
 */
function formatDateCheckfront(dateStr) {
    // Convert YYYY-MM-DD to YYYYMMDD
    return dateStr.replace(/-/g, '');
}

/**
 * Get booking details from Airtable by booking code
 */
async function getBookingFromAirtable(bookingCode) {
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
                    maxRecords: 1
                }
            }
        );
        
        if (response.data.records && response.data.records.length > 0) {
            return response.data.records[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching booking from Airtable:', error.message);
        return null;
    }
}

/**
 * Parse existing add-ons from Airtable format
 */
function parseExistingAddons(addonsStr) {
    if (!addonsStr) return [];
    
    return addonsStr.split(',').map(item => {
        const trimmed = item.trim();
        const match = trimmed.match(/^(?:(\d+)\s*x\s*)?(.+?)\s*-\s*\$(\d+(?:\.\d{2})?)$/);
        
        if (match) {
            return {
                quantity: match[1] ? parseInt(match[1]) : 1,
                name: match[2].trim(),
                price: parseFloat(match[3])
            };
        }
        return { name: trimmed, quantity: 1, price: 0 };
    }).filter(item => item.name);
}

// ============== API ENDPOINTS ==============

/**
 * GET /api/customer-addons/booking/:code
 * Get booking details for the customer portal
 * Returns booking info and current add-ons
 */
router.get('/booking/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        // First check Airtable for the booking
        const airtableRecord = await getBookingFromAirtable(code);
        
        if (!airtableRecord) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found',
                message: 'Please check your booking code and try again.'
            });
        }
        
        const fields = airtableRecord.fields;
        
        // Check if booking is in the future
        const bookingDate = new Date(fields['Booking Date']);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
            return res.status(400).json({
                success: false,
                error: 'Booking has passed',
                message: 'This booking date has already passed. Add-ons can only be added to upcoming bookings.'
            });
        }
        
        // Check booking status
        const status = fields['Status'];
        if (status === 'VOID' || status === 'STOP') {
            return res.status(400).json({
                success: false,
                error: 'Booking cancelled',
                message: 'This booking has been cancelled.'
            });
        }
        
        // Parse existing add-ons
        const existingAddons = parseExistingAddons(fields['Add-ons']);
        
        res.json({
            success: true,
            booking: {
                code: fields['Booking Code'],
                customerName: fields['Customer Name'],
                customerFirstName: fields['First name'] || fields['Customer Name']?.split(' ')[0],
                bookingDate: fields['Booking Date'],
                startTime: fields['Start Time'],
                finishTime: fields['Finish Time'],
                duration: fields['Duration'],
                boatType: fields['Booked Boat Type'] || fields['Booking Items'],
                status: status,
                totalAmount: fields['Total Amount'],
                existingAddons: existingAddons,
                recordId: airtableRecord.id
            }
        });
        
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Unable to fetch booking details. Please try again.'
        });
    }
});

/**
 * GET /api/customer-addons/available/:code
 * Get available add-ons for a specific booking
 * Checks availability based on booking date
 */
router.get('/available/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        // Get booking details first
        const airtableRecord = await getBookingFromAirtable(code);
        
        if (!airtableRecord) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        
        const fields = airtableRecord.fields;
        const bookingDate = fields['Booking Date'];
        const checkfrontDate = formatDateCheckfront(bookingDate);
        
        // Get existing add-ons to filter out
        const existingAddons = parseExistingAddons(fields['Add-ons']);
        const existingNames = existingAddons.map(a => a.name.toLowerCase());
        
        // Try to get live availability from Checkfront
        let availableAddons = [];
        
        try {
            if (checkfrontApi.isConfigured()) {
                const addons = await checkfrontApi.getAddOns(checkfrontDate, checkfrontDate);
                
                availableAddons = addons.map(item => ({
                    id: item.item_id,
                    sku: item.sku,
                    name: item.name,
                    price: parseFloat(item.rate?.price || item.price || 0),
                    description: item.description || '',
                    available: item.rate?.status === 'AVAILABLE',
                    alreadyAdded: existingNames.includes(item.name.toLowerCase())
                }));
            }
        } catch (error) {
            console.log('Could not fetch live add-ons from Checkfront:', error.message);
        }
        
        // If no live data, use catalog
        if (availableAddons.length === 0) {
            availableAddons = Object.entries(ADDON_ITEMS).map(([sku, item]) => ({
                id: item.itemId,
                sku: sku,
                name: item.name,
                price: item.price,
                description: item.description,
                available: true,
                alreadyAdded: existingNames.includes(item.name.toLowerCase())
            }));
        }
        
        res.json({
            success: true,
            bookingCode: code,
            bookingDate: bookingDate,
            availableAddons: availableAddons.filter(a => !a.alreadyAdded),
            existingAddons: existingAddons
        });
        
    } catch (error) {
        console.error('Error fetching available add-ons:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * POST /api/customer-addons/add
 * Add selected add-ons to an existing booking
 * This will update Checkfront and trigger payment
 */
router.post('/add', async (req, res) => {
    const { bookingCode, addons } = req.body;
    
    if (!bookingCode || !addons || !Array.isArray(addons) || addons.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request',
            message: 'Please provide a booking code and at least one add-on.'
        });
    }
    
    try {
        // Verify booking exists
        const airtableRecord = await getBookingFromAirtable(bookingCode);
        
        if (!airtableRecord) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        
        const fields = airtableRecord.fields;
        const bookingDate = fields['Booking Date'];
        const checkfrontDate = formatDateCheckfront(bookingDate);
        
        // Check if Checkfront API is available
        if (!checkfrontApi.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'Payment system unavailable',
                message: 'Unable to connect to the booking system. Please try again later or contact us directly.',
                fallback: {
                    phone: '+61 2 9977 1223',
                    email: 'info@manlyboathire.com.au'
                }
            });
        }
        
        // Get the Checkfront booking ID
        const checkfrontBooking = await checkfrontApi.getFullBookingByCode(bookingCode);
        
        if (!checkfrontBooking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found in payment system',
                message: 'Unable to find this booking. Please contact us directly.'
            });
        }
        
        const bookingId = checkfrontBooking.booking_id;
        
        // Get SLIPs for each add-on
        const slips = [];
        const addedItems = [];
        const failedItems = [];
        
        for (const addon of addons) {
            try {
                const addonInfo = ADDON_ITEMS[addon.sku] || { itemId: addon.itemId };
                
                if (!addonInfo.itemId) {
                    failedItems.push({ sku: addon.sku, error: 'Unknown item' });
                    continue;
                }
                
                const slipResult = await checkfrontApi.getItemSlip(
                    addonInfo.itemId,
                    checkfrontDate,
                    checkfrontDate,
                    { qty: addon.quantity || 1 }
                );
                
                if (slipResult && slipResult.slip && slipResult.available) {
                    slips.push(slipResult.slip);
                    addedItems.push({
                        sku: addon.sku,
                        name: addonInfo.name || addon.name,
                        price: slipResult.price || addonInfo.price,
                        quantity: addon.quantity || 1
                    });
                } else {
                    failedItems.push({ 
                        sku: addon.sku, 
                        error: slipResult?.available === false ? 'Not available' : 'Could not get pricing'
                    });
                }
            } catch (error) {
                console.error(`Error getting SLIP for ${addon.sku}:`, error.message);
                failedItems.push({ sku: addon.sku, error: error.message });
            }
        }
        
        if (slips.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No items available',
                message: 'None of the selected add-ons are currently available.',
                failedItems
            });
        }
        
        // Add items to the booking
        try {
            const updateResult = await checkfrontApi.addItemsToBooking(bookingId, slips);
            
            // Calculate total for added items
            const addedTotal = addedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            res.json({
                success: true,
                message: 'Add-ons added to your booking!',
                addedItems,
                failedItems: failedItems.length > 0 ? failedItems : undefined,
                addedTotal,
                // If Checkfront returns a payment URL, include it
                paymentUrl: updateResult.payment_url || updateResult.checkout_url || null,
                // The webhook will update Airtable automatically
                note: 'Your booking has been updated. You will receive a confirmation email shortly.'
            });
            
        } catch (error) {
            console.error('Error adding items to booking:', error);
            
            // Check if it's a payment required error
            if (error.response?.data?.error?.includes('payment')) {
                return res.json({
                    success: true,
                    message: 'Items added - payment required',
                    addedItems,
                    paymentRequired: true,
                    paymentUrl: error.response?.data?.payment_url || null
                });
            }
            
            throw error;
        }
        
    } catch (error) {
        console.error('Error adding add-ons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add items',
            message: 'Unable to add items to your booking. Please try again or contact us.',
            fallback: {
                phone: '+61 2 9977 1223',
                email: 'info@manlyboathire.com.au'
            }
        });
    }
});

/**
 * GET /api/customer-addons/catalog
 * Get the full add-ons catalog (for display purposes)
 */
router.get('/catalog', (req, res) => {
    const catalog = Object.entries(ADDON_ITEMS).map(([sku, item]) => ({
        sku,
        ...item
    }));
    
    // Group by category
    const categorized = {};
    catalog.forEach(item => {
        const cat = item.category || 'Other';
        if (!categorized[cat]) categorized[cat] = [];
        categorized[cat].push(item.sku);
    });
    
    res.json({
        success: true,
        catalog,
        categories: categorized
    });
});

module.exports = router;
