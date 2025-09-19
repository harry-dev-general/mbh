// Add-ons Management API for MBH Staff Portal
// Handles catalog retrieval and booking add-ons updates

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard
const ADDONS_CATALOG_TABLE_ID = 'tblXXXXXXXXXXXX'; // To be created in Airtable

// Known add-ons with default prices (fallback if catalog not available)
const DEFAULT_ADDONS = {
    'lillypad': { name: 'Lilly Pad', price: 55.00, category: 'Water Sports' },
    'fishingrods': { name: 'Fishing Rods', price: 20.00, category: 'Activities' },
    'icebag': { name: 'Icebag', price: 12.50, category: 'Comfort' },
    'kayak': { name: 'Kayak', price: 45.00, category: 'Water Sports' },
    'sup': { name: 'Stand Up Paddleboard', price: 65.00, category: 'Water Sports' },
    'paddleboard': { name: 'Paddleboard', price: 65.00, category: 'Water Sports' },
    'esky': { name: 'Esky/Cooler', price: 25.00, category: 'Comfort' },
    'baitpack': { name: 'Bait Pack', price: 15.00, category: 'Activities' },
    'icepack': { name: 'Ice Pack', price: 12.50, category: 'Comfort' },
    'bbqpack': { name: 'BBQ Pack', price: 35.00, category: 'Comfort' },
    'foodpack': { name: 'Food Package', price: 45.00, category: 'Comfort' }
};

// Utility function to parse add-ons string to array
function parseAddOns(addOnsString) {
    if (!addOnsString || addOnsString.trim() === '') return [];
    
    try {
        return addOnsString.split(',').map(item => {
            const trimmedItem = item.trim();
            const match = trimmedItem.match(/^(.+?)\s*-\s*\$(\d+(?:\.\d{2})?)$/);
            
            if (match) {
                return {
                    name: match[1].trim(),
                    price: parseFloat(match[2]),
                    original: trimmedItem
                };
            }
            
            // Handle items without price
            return {
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
        .filter(item => item && item.name) // Remove null/undefined items
        .map(item => {
            const price = typeof item.price === 'number' ? item.price : 0;
            return `${item.name} - $${price.toFixed(2)}`;
        })
        .join(', ');
}

// Get add-ons catalog (for now, return default catalog)
router.get('/catalog', async (req, res) => {
    try {
        // In future, fetch from Airtable catalog table
        // For now, return organized default catalog
        
        const catalog = Object.entries(DEFAULT_ADDONS).map(([sku, item]) => ({
            id: sku,
            sku: sku,
            name: item.name,
            price: item.price,
            category: item.category,
            active: true
        }));
        
        // Group by category
        const categorized = catalog.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});
        
        res.json({
            success: true,
            catalog: catalog,
            categorized: categorized,
            categories: Object.keys(categorized)
        });
        
    } catch (error) {
        console.error('Error fetching add-ons catalog:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch add-ons catalog'
        });
    }
});

// Get current add-ons for a booking
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Fetch booking from Airtable
        const response = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const booking = response.data;
        const currentAddOns = booking.fields['Add-ons'] || '';
        const parsedAddOns = parseAddOns(currentAddOns);
        
        // Calculate total
        const total = parsedAddOns.reduce((sum, item) => sum + (item.price || 0), 0);
        
        res.json({
            success: true,
            bookingId: bookingId,
            currentAddOns: currentAddOns,
            items: parsedAddOns,
            total: total,
            customerName: booking.fields['Customer Name'],
            bookingCode: booking.fields['Booking Code']
        });
        
    } catch (error) {
        console.error('Error fetching booking add-ons:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking add-ons'
        });
    }
});

// Update booking add-ons
router.patch('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action, item, itemName } = req.body;
        
        // Fetch current booking
        const getResponse = await axios.get(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const booking = getResponse.data;
        const currentAddOns = booking.fields['Add-ons'] || '';
        let addOnsArray = parseAddOns(currentAddOns);
        
        if (action === 'add' && item) {
            // Check if item already exists
            const exists = addOnsArray.some(addon => 
                addon.name.toLowerCase() === item.name.toLowerCase()
            );
            
            if (!exists) {
                addOnsArray.push({
                    name: item.name,
                    price: item.price || 0
                });
            }
            
        } else if (action === 'remove' && itemName) {
            // Remove item by name
            addOnsArray = addOnsArray.filter(addon => 
                addon.name.toLowerCase() !== itemName.toLowerCase()
            );
            
        } else if (action === 'set' && Array.isArray(req.body.items)) {
            // Replace all items
            addOnsArray = req.body.items;
        }
        
        // Format back to string
        const newAddOnsString = formatAddOns(addOnsArray);
        
        // Update Airtable
        const updateResponse = await axios.patch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
            {
                fields: {
                    'Add-ons': newAddOnsString
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Calculate new total
        const total = addOnsArray.reduce((sum, item) => sum + (item.price || 0), 0);
        
        res.json({
            success: true,
            bookingId: bookingId,
            action: action,
            updatedAddOns: newAddOnsString,
            items: addOnsArray,
            total: total,
            message: `Add-ons ${action === 'add' ? 'added' : action === 'remove' ? 'removed' : 'updated'} successfully`
        });
        
    } catch (error) {
        console.error('Error updating booking add-ons:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || 'Failed to update booking add-ons'
        });
    }
});

// Validate add-on format
router.post('/validate', (req, res) => {
    try {
        const { addOnsString } = req.body;
        const parsed = parseAddOns(addOnsString);
        const formatted = formatAddOns(parsed);
        
        res.json({
            success: true,
            original: addOnsString,
            parsed: parsed,
            formatted: formatted,
            isValid: parsed.length > 0
        });
        
    } catch (error) {
        res.json({
            success: false,
            error: 'Invalid add-ons format'
        });
    }
});

module.exports = router;
