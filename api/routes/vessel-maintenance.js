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

module.exports = router;
