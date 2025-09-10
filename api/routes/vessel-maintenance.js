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
        
        const axios = require('axios');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const BASE_ID = 'applkAFOn2qxtu7tx';
        const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';
        const PRE_DEP_TABLE_ID = 'tbl9igu5g1bPG4Ahu';
        
        // Get recent Post-Departure checklists and find the one for this vessel
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
        
        const postDepResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
            {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
                params: {
                    filterByFormula: `IS_AFTER({Created time}, '${dateFilter}')`,
                    sort: [{ field: 'Created time', direction: 'desc' }],
                    maxRecords: 100,
                    fields: ['Vessel', 'Created time']
                }
            }
        );
        
        // Find the most recent checklist for this specific vessel
        let latestPostDep = null;
        if (postDepResponse.data.records) {
            for (const record of postDepResponse.data.records) {
                if (record.fields['Vessel'] && record.fields['Vessel'].includes(vesselId)) {
                    latestPostDep = record;
                    break;
                }
            }
        }
        
        console.log(`Post-Departure search for vessel ${vesselId} found:`, latestPostDep ? 'checklist' : 'no checklist');
        
        let checklistId = null;
        let tableId = POST_DEP_TABLE_ID;
        
        if (latestPostDep) {
            // Use Post-Departure checklist
            checklistId = latestPostDep.id;
            console.log(`Found Post-Departure checklist ${checklistId} for location update`);
        } else {
            // No Post-Departure checklist, try Pre-Departure
            const preDepResponse = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEP_TABLE_ID}`,
                {
                    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
                    params: {
                        filterByFormula: `IS_AFTER({Created time}, '${dateFilter}')`,
                        sort: [{ field: 'Created time', direction: 'desc' }],
                        maxRecords: 100,
                        fields: ['Vessel', 'Created time']
                    }
                }
            );
            
            // Find the most recent Pre-Departure checklist for this vessel
            let latestPreDep = null;
            if (preDepResponse.data.records) {
                for (const record of preDepResponse.data.records) {
                    if (record.fields['Vessel'] && record.fields['Vessel'].includes(vesselId)) {
                        latestPreDep = record;
                        break;
                    }
                }
            }
            
            console.log(`Pre-Departure search for vessel ${vesselId} found:`, latestPreDep ? 'checklist' : 'no checklist');
            
            if (latestPreDep) {
                // Create a new Post-Departure checklist with location data
                // since Pre-Departure doesn't have location fields
                console.log('No Post-Departure checklist found, creating one for location update');
                
                const createData = {
                    fields: {
                        'Vessel': [vesselId],
                        'GPS Latitude': latitude,
                        'GPS Longitude': longitude,
                        'Location Address': address || 'Manual location update',
                        'Location Captured': true,
                        'Location Accuracy': 10,
                        'Checklist ID': `LOC-UPDATE-${Date.now()}`
                    }
                };
                
                const createResponse = await axios.post(
                    `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
                    createData,
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('Created location-only checklist:', createResponse.data.id);
                
                // Clear cache to force refresh
                statusCache = null;
                cacheTimestamp = null;
                
                return res.json({
                    success: true,
                    checklistId: createResponse.data.id,
                    message: 'Location saved successfully'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: 'No checklist found for this vessel'
                });
            }
        }
        
        console.log(`Updating checklist ${checklistId} with new location data`);
        
        // Update ONLY the location fields on the existing checklist
        const updateData = {
            fields: {
                'GPS Latitude': latitude,
                'GPS Longitude': longitude,
                'Location Address': address || 'Manual location update',
                'Location Captured': true,
                'Location Accuracy': 10 // Default accuracy for manual updates
            }
        };
        
        // Update the existing checklist record
        const response = await axios.patch(
            `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${checklistId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Location updated on existing checklist:', response.data.id);
        
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
