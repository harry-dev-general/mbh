// Express routes for vessel maintenance dashboard
const express = require('express');
const router = express.Router();
const { getVesselMaintenanceStatus, getVesselDetail } = require('../vessel-status');

// Cache vessel status for 5 minutes to improve performance
let statusCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware to check cache
function checkCache(req, res, next) {
    if (statusCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        console.log('Serving vessel status from cache');
        return res.json(statusCache);
    }
    next();
}

// GET /api/vessels/maintenance-status
// Returns current status for all vessels
router.get('/maintenance-status', checkCache, async (req, res) => {
    try {
        console.log('Fetching fresh vessel maintenance status...');
        const status = await getVesselMaintenanceStatus();
        
        if (status.success) {
            // Update cache
            statusCache = status;
            cacheTimestamp = Date.now();
            
            res.json(status);
        } else {
            res.status(500).json({ 
                success: false, 
                error: status.error || 'Failed to fetch vessel status' 
            });
        }
    } catch (error) {
        console.error('Error in maintenance-status route:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/vessels/:id/detail
// Returns detailed status for a specific vessel
router.get('/:id/detail', async (req, res) => {
    try {
        const vesselId = req.params.id;
        console.log(`Fetching detail for vessel ${vesselId}`);
        
        const detail = await getVesselDetail(vesselId);
        
        if (detail.success) {
            res.json(detail);
        } else {
            res.status(404).json(detail);
        }
    } catch (error) {
        console.error('Error in vessel detail route:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// POST /api/vessels/:id/quick-update
// Allows quick fuel/gas/water level updates
router.post('/:id/quick-update', async (req, res) => {
    try {
        const vesselId = req.params.id;
        const { type, level, staffId, notes } = req.body;
        
        // Validate input
        if (!type || !level) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type and level'
            });
        }
        
        const validTypes = ['fuel', 'gas', 'water'];
        const validLevels = ['Empty', 'Quarter', 'Half', 'Three-Quarter', 'Full'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be: fuel, gas, or water'
            });
        }
        
        if (!validLevels.includes(level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid level. Must be: Empty, Quarter, Half, Three-Quarter, or Full'
            });
        }
        
        // Create a minimal post-departure checklist with the update
        const axios = require('axios');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY; // Set in environment variables
        const BASE_ID = 'applkAFOn2qxtu7tx';
        const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';
        
        const checklistData = {
            fields: {
                'Vessel': [vesselId],
                'Staff Member': staffId ? [staffId] : undefined,
                'Checklist Date/Time': new Date().toISOString(),
                'Completion Status': 'Completed',
                'Completion Time': new Date().toISOString(),
                'Notes': notes || `Quick ${type} level update`,
                'Checklist ID': `Quick Update - ${new Date().toLocaleDateString()}`
            }
        };
        
        // Set the appropriate level field based on type
        if (type === 'fuel') {
            checklistData.fields['Fuel Level After Use'] = level;
            checklistData.fields['Fuel Refilled'] = level === 'Full';
        } else if (type === 'gas') {
            checklistData.fields['Gas Bottle Level After Use'] = level;
            checklistData.fields['Gas Bottle Replaced'] = level === 'Full';
        } else if (type === 'water') {
            checklistData.fields['Water Tank Level After Use'] = level;
            checklistData.fields['Water Tank Refilled'] = level === 'Full';
        }
        
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
            checklistData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Clear cache to force refresh
        statusCache = null;
        cacheTimestamp = null;
        
        res.json({
            success: true,
            checklistId: response.data.id,
            message: `${type} level updated to ${level}`
        });
        
    } catch (error) {
        console.error('Error in quick update:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// POST /api/vessels/refresh-cache
// Forces a cache refresh
router.post('/refresh-cache', async (req, res) => {
    statusCache = null;
    cacheTimestamp = null;
    
    res.json({
        success: true,
        message: 'Cache cleared. Next request will fetch fresh data.'
    });
});

// POST /api/vessels/update-location
// Updates vessel location manually
router.post('/update-location', async (req, res) => {
    try {
        const { vesselId, latitude, longitude, address, manualUpdate } = req.body;
        const userEmail = req.user?.email || 'Unknown';
        
        console.log('Manual location update request:', {
            vesselId,
            latitude,
            longitude,
            address,
            userEmail
        });
        
        if (!vesselId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        // Get staff member name from email
        let staffMemberName = userEmail;
        if (userEmail && userEmail !== 'Unknown') {
            // Extract name from email if in format firstname.lastname@domain.com
            const emailParts = userEmail.split('@')[0].split('.');
            if (emailParts.length > 1) {
                staffMemberName = emailParts.map(part => 
                    part.charAt(0).toUpperCase() + part.slice(1)
                ).join(' ');
            }
        }
        
        const axios = require('axios');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const BASE_ID = 'applkAFOn2qxtu7tx';
        const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';
        
        // Create a new Post-Departure Checklist record with manual location update
        const checklistData = {
            fields: {
                'Vessel': [vesselId],
                'GPS Latitude': latitude,
                'GPS Longitude': longitude,
                'Location Address': address || 'Manual location update',
                'Location Captured': true,
                'Location Accuracy': 10, // Set a default accuracy for manual updates
                'Completed by': `${staffMemberName} (Manual Update)`,
                'Checklist ID': `MANUAL-LOC-${Date.now()}`,
                // Set default values for required fields
                'Fuel Level After Use': 'Half Full',
                'Gas Bottle Level After Use': 'Half Full',
                'Water Tank Level After Use': 'Half Full',
                'Overall Vessel Condition After Use': 'Good - Ready for Next Booking',
                'Notes': 'Manual location update'
            }
        };
        
        // Create the checklist record
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
            checklistData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Location update saved:', response.data.id);
        
        // Clear cache to force refresh
        statusCache = null;
        cacheTimestamp = null;
        
        res.json({
            success: true,
            checklistId: response.data.id,
            message: 'Location updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating vessel location:', error);
        
        if (error.response) {
            console.error('Airtable error response:', error.response.data);
            res.status(500).json({
                success: false,
                error: error.response.data.error?.message || 'Failed to update location'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update vessel location'
            });
        }
    }
});

module.exports = router;
