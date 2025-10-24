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
                'Checklist ID': `Quick Update - ${new Date().toLocaleDateString()}${notes ? ` - ${notes}` : ''}`
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

// POST /api/vessels/:id/status-update
// Comprehensive vessel status update for management
router.post('/:id/status-update', async (req, res) => {
    try {
        const vesselId = req.params.id;
        const { fuel, gas, water, condition, notes, staffId } = req.body;
        
        console.log('=== MANAGEMENT STATUS UPDATE ===');
        console.log('Vessel ID:', vesselId);
        console.log('Update data:', { fuel, gas, water, condition });
        console.log('Staff ID:', staffId);
        console.log('Timestamp:', new Date().toISOString());
        
        // Validate that at least one field is being updated
        if (!fuel && !gas && !water && !condition) {
            return res.status(400).json({
                success: false,
                error: 'At least one status field must be provided'
            });
        }
        
        // Validate field values if provided
        const validLevels = ['Empty', 'Quarter', 'Half', 'Three-Quarter', 'Full'];
        const validConditions = [
            'Good - Ready for Next Booking',
            'Needs Attention',
            'Major Issues - Do Not Use'
        ];
        
        if (fuel && !validLevels.includes(fuel)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid fuel level'
            });
        }
        
        if (gas && !validLevels.includes(gas)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid gas level'
            });
        }
        
        if (water && !validLevels.includes(water)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid water level'
            });
        }
        
        if (condition && !validConditions.includes(condition)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid condition value'
            });
        }
        
        const axios = require('axios');
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const BASE_ID = 'applkAFOn2qxtu7tx';
        const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';
        const EMPLOYEE_TABLE_ID = 'tblFX0MXVqXfGGMov';
        
        // If staffId provided, fetch the employee name
        let completedByName = '';
        if (staffId) {
            try {
                const employeeResponse = await axios.get(
                    `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}/${staffId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                        }
                    }
                );
                completedByName = employeeResponse.data.fields['Name'] || employeeResponse.data.fields['Full Name'] || '';
                console.log('Found employee name:', completedByName);
            } catch (error) {
                console.error('Failed to fetch employee details:', error.message);
            }
        }
        
        // Create a management update checklist record
        const checklistData = {
            fields: {
                'Vessel': [vesselId],
                'Staff Member': staffId ? [staffId] : undefined,
                'Completed by': completedByName || undefined,
                'Checklist Date/Time': new Date().toISOString(),
                'Completion Status': 'Completed',
                'Completion Time': new Date().toISOString(),
                'Checklist ID': `MGMT-UPDATE-${new Date().toISOString().split('T')[0]}-${Date.now()}${notes ? ` - ${notes}` : ''}`
            }
        };
        
        // Add the status fields that were provided
        if (fuel) {
            checklistData.fields['Fuel Level After Use'] = fuel;
            checklistData.fields['Fuel Refilled'] = fuel === 'Full';
        }
        
        if (gas) {
            checklistData.fields['Gas Bottle Level After Use'] = gas;
            checklistData.fields['Gas Bottle Replaced'] = gas === 'Full';
        }
        
        if (water) {
            checklistData.fields['Water Tank Level After Use'] = water;
            checklistData.fields['Water Tank Refilled'] = water === 'Full';
        }
        
        if (condition) {
            checklistData.fields['Overall Vessel Condition After Use'] = condition;
        }
        
        console.log('Creating checklist with data:', JSON.stringify(checklistData, null, 2));
        
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
        
        console.log('Checklist created successfully:', response.data.id);
        
        // Clear cache to force refresh
        statusCache = null;
        cacheTimestamp = null;
        
        res.json({
            success: true,
            checklistId: response.data.id,
            message: 'Vessel status updated successfully',
            updatedFields: {
                fuel: fuel || 'Not updated',
                gas: gas || 'Not updated',
                water: water || 'Not updated',
                condition: condition || 'Not updated'
            }
        });
        
    } catch (error) {
        console.error('Error in status update:', error);
        
        if (error.response) {
            console.error('Airtable error:', error.response.data);
            res.status(500).json({
                success: false,
                error: error.response.data.error?.message || 'Failed to update status'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update vessel status'
            });
        }
    }
});

// POST /api/vessels/update-location
// Updates vessel location manually
router.post('/update-location', async (req, res) => {
    try {
        const { vesselId, latitude, longitude, address, manualUpdate, staffId } = req.body;
        const userEmail = req.user?.email || 'Unknown';
        
        console.log('=== MANUAL LOCATION UPDATE REQUEST ===');
        console.log('Vessel ID:', vesselId);
        console.log('Coordinates:', { latitude, longitude });
        console.log('Address:', address);
        console.log('User:', userEmail);
        console.log('Request timestamp:', new Date().toISOString());
        
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
        const EMPLOYEE_TABLE_ID = 'tblFX0MXVqXfGGMov';
        
        // Get recent Post-Departure checklists and find the one for this vessel
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        console.log(`Searching for checklists after: ${ninetyDaysAgo.toISOString()}`);
        
        // Fetch ALL Post-Departure checklists and filter client-side (more reliable than filterByFormula)
        let allPostDepRecords = [];
        let offset = null;
        
        do {
            let url = `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}?pageSize=100`;
            if (offset) {
                url += `&offset=${offset}`;
            }
            url += `&sort[0][field]=Created%20time&sort[0][direction]=desc`;
            url += `&fields[]=Vessel&fields[]=Created%20time`;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
            });
            
            allPostDepRecords = allPostDepRecords.concat(response.data.records || []);
            offset = response.data.offset;
            
        } while (offset);
        
        // Filter client-side for records created in the last 90 days
        const recentRecords = allPostDepRecords.filter(record => {
            const createdTime = record.fields['Created time'] || record.createdTime;
            if (!createdTime) return false;
            
            const createdDate = new Date(createdTime);
            return createdDate > ninetyDaysAgo;
        });
        
        // Find the most recent checklist for this specific vessel
        let latestPostDep = null;
        if (recentRecords.length > 0) {
            console.log(`Found ${recentRecords.length} Post-Departure records from last 90 days (out of ${allPostDepRecords.length} total)`);
            console.log('First 3 records for debugging:');
            recentRecords.slice(0, 3).forEach(record => {
                console.log(`- Record ${record.id}:`, {
                    vessel: record.fields['Vessel'],
                    createdTime: record.fields['Created time']
                });
            });
            
            for (const record of recentRecords) {
                if (record.fields['Vessel'] && Array.isArray(record.fields['Vessel']) && record.fields['Vessel'].includes(vesselId)) {
                    latestPostDep = record;
                    console.log(`✓ Found matching Post-Departure checklist: ${record.id}`);
                    break;
                }
            }
        } else {
            console.log('No Post-Departure records found in the last 90 days');
        }
        
        console.log(`Post-Departure search for vessel ${vesselId} found:`, latestPostDep ? 'checklist' : 'no checklist');
        
        let checklistId = null;
        let tableId = POST_DEP_TABLE_ID;
        
        if (latestPostDep) {
            // Use Post-Departure checklist
            checklistId = latestPostDep.id;
            console.log(`Found Post-Departure checklist ${checklistId} for location update`);
        } else {
            // No existing checklist found - create a new location-only checklist
            console.log('No existing checklist found, creating location-only checklist');
            
            // If staffId provided, fetch the employee name
            let completedByName = '';
            if (staffId) {
                try {
                    const employeeResponse = await axios.get(
                        `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}/${staffId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                            }
                        }
                    );
                    completedByName = employeeResponse.data.fields['Name'] || employeeResponse.data.fields['Full Name'] || '';
                    console.log('Found employee name for location update:', completedByName);
                } catch (error) {
                    console.error('Failed to fetch employee details for location update:', error.message);
                }
            }
            
            const createData = {
                fields: {
                    'Vessel': [vesselId],
                    'Staff Member': staffId ? [staffId] : undefined,
                    'Completed by': completedByName || undefined,
                    'GPS Latitude': latitude,
                    'GPS Longitude': longitude,
                    'Location Address': address || 'Manual location update',
                    'Location Captured': true,
                    'Location Accuracy': 10,
                    'Checklist ID': `LOC-UPDATE-${Date.now()}`,
                    'Checklist Date/Time': new Date().toISOString(),
                    'Completion Status': 'Completed',
                    'Completion Time': new Date().toISOString()
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
        }
        
        console.log(`Updating checklist ${checklistId} with new location data`);
        
        // Update ONLY the location fields on the existing checklist
        // Match the exact same structure as Post-Departure checklist
        const updateData = {
            fields: {
                'GPS Latitude': Number(latitude),
                'GPS Longitude': Number(longitude),
                'Location Address': address || 'Manual location update',
                'Location Captured': true,
                'Location Accuracy': Number(10) // Default accuracy for manual updates
            }
        };
        
        console.log('Update payload:', JSON.stringify(updateData, null, 2));
        
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
