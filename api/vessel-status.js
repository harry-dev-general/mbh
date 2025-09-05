// Vessel Status API - Shows current status from most recent checklist
// Uses whichever checklist (pre or post departure) was completed last

const axios = require('axios');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY; // Set in environment variables
const BASE_ID = 'applkAFOn2qxtu7tx';

// Table IDs
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';
const PRE_DEP_TABLE_ID = 'tbl9igu5g1bPG4Ahu';
const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';

// Convert level text to percentage
function levelToPercentage(level) {
    const map = {
        'Empty': 0,
        'Quarter': 25,
        'Half': 50,
        'Three-Quarter': 75,
        'Full': 100
    };
    return map[level] || 0;
}

// Generate alerts based on current status
function generateAlerts(status, daysSinceCheck) {
    const alerts = [];
    
    if (!status) {
        alerts.push({ 
            type: 'warning', 
            message: 'No checklist data available',
            priority: 2 
        });
        return alerts;
    }
    
    // Check age of data
    if (daysSinceCheck > 7) {
        alerts.push({ 
            type: 'warning', 
            message: `Last checked ${daysSinceCheck} days ago`,
            priority: 2 
        });
    }
    
    // Fuel alerts
    if (status.fuel === 'Empty') {
        alerts.push({ 
            type: 'critical', 
            message: 'Fuel tank empty - refuel immediately',
            priority: 1 
        });
    } else if (status.fuel === 'Quarter') {
        alerts.push({ 
            type: 'critical', 
            message: 'Low fuel - needs refill',
            priority: 1 
        });
    }
    
    // Gas alerts
    if (status.gas === 'Empty') {
        alerts.push({ 
            type: 'critical', 
            message: 'Gas bottle empty - replace immediately',
            priority: 1 
        });
    } else if (status.gas === 'Quarter') {
        alerts.push({ 
            type: 'critical', 
            message: 'Gas bottle low - needs replacement',
            priority: 1 
        });
    }
    
    // Water alerts
    if (status.water === 'Empty') {
        alerts.push({ 
            type: 'warning', 
            message: 'Water tank empty',
            priority: 2 
        });
    } else if (status.water === 'Quarter') {
        alerts.push({ 
            type: 'warning', 
            message: 'Water tank low',
            priority: 2 
        });
    }
    
    // Condition alerts
    if (status.condition === 'Major Issues - Do Not Use') {
        alerts.push({ 
            type: 'critical', 
            message: 'Vessel not safe - DO NOT USE',
            priority: 1 
        });
    } else if (status.condition === 'Needs Attention' || status.condition === 'Issues Found') {
        alerts.push({ 
            type: 'warning', 
            message: 'Vessel needs maintenance attention',
            priority: 2 
        });
    }
    
    // Sort by priority
    return alerts.sort((a, b) => a.priority - b.priority);
}

// Get all vessel maintenance status
async function getVesselMaintenanceStatus() {
    try {
        // 1. Fetch all boats
        const boatsResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE_ID}`,
            {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
                params: {
                    fields: ['Name', 'Boat Type', 'Vessel Location', 'Description']
                }
            }
        );
        
        const boats = boatsResponse.data.records;
        
        // 2. Fetch recent checklists (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
        
        // Get pre-departure checklists
        const preDepResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEP_TABLE_ID}`,
            {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
                params: {
                    filterByFormula: `IS_AFTER({Created time}, '${dateFilter}')`,
                    fields: ['Vessel', 'Fuel Level Check', 'Gas Bottle Check', 'Water Tank Level', 
                            'Overall Vessel Condition', 'Created time', 'Staff Member', 'Checklist ID'],
                    sort: [{ field: 'Created time', direction: 'desc' }]
                }
            }
        );
        
        // Get post-departure checklists
        const postDepResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}`,
            {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
                params: {
                    filterByFormula: `IS_AFTER({Created time}, '${dateFilter}')`,
                    fields: ['Vessel', 'Fuel Level After Use', 'Gas Bottle Level After Use', 
                            'Water Tank Level After Use', 'Overall Vessel Condition After Use', 
                            'Created time', 'Staff Member', 'Checklist ID'],
                    sort: [{ field: 'Created time', direction: 'desc' }]
                }
            }
        );
        
        const preDepChecklists = preDepResponse.data.records;
        const postDepChecklists = postDepResponse.data.records;
        
        console.log(`Found ${preDepChecklists.length} pre-departure and ${postDepChecklists.length} post-departure checklists`);
        
        // 3. Build vessel status for each boat
        const vesselStatuses = boats.map(boat => {
            const boatId = boat.id;
            const boatName = boat.fields.Name;
            
            // Find all checklists for this boat
            const boatPreDeps = preDepChecklists.filter(c => 
                c.fields.Vessel && c.fields.Vessel.includes(boatId)
            );
            
            const boatPostDeps = postDepChecklists.filter(c => 
                c.fields.Vessel && c.fields.Vessel.includes(boatId)
            );
            
            // Get the most recent checklist of each type
            const latestPreDep = boatPreDeps[0]; // Already sorted by date desc
            const latestPostDep = boatPostDeps[0];
            
            // Determine which checklist is most recent overall
            let currentStatus = null;
            let lastCheckType = 'None';
            let lastCheckTime = null;
            let lastChecklistId = null;
            
            if (latestPreDep && latestPostDep) {
                // Compare timestamps to see which is more recent
                const preDepTime = new Date(latestPreDep.fields['Created time']);
                const postDepTime = new Date(latestPostDep.fields['Created time']);
                
                if (preDepTime > postDepTime) {
                    // Pre-departure is more recent
                    currentStatus = {
                        fuel: latestPreDep.fields['Fuel Level Check'],
                        gas: latestPreDep.fields['Gas Bottle Check'],
                        water: latestPreDep.fields['Water Tank Level'],
                        condition: latestPreDep.fields['Overall Vessel Condition']
                    };
                    lastCheckType = 'Pre-Departure';
                    lastCheckTime = preDepTime;
                    lastChecklistId = latestPreDep.id;
                    
                    console.log(`${boatName}: Using pre-departure checklist from ${preDepTime.toLocaleDateString()}`);
                } else {
                    // Post-departure is more recent
                    currentStatus = {
                        fuel: latestPostDep.fields['Fuel Level After Use'],
                        gas: latestPostDep.fields['Gas Bottle Level After Use'],
                        water: latestPostDep.fields['Water Tank Level After Use'],
                        condition: latestPostDep.fields['Overall Vessel Condition After Use']
                    };
                    lastCheckType = 'Post-Departure';
                    lastCheckTime = postDepTime;
                    lastChecklistId = latestPostDep.id;
                    
                    console.log(`${boatName}: Using post-departure checklist from ${postDepTime.toLocaleDateString()}`);
                }
            } else if (latestPreDep) {
                // Only pre-departure exists
                currentStatus = {
                    fuel: latestPreDep.fields['Fuel Level Check'],
                    gas: latestPreDep.fields['Gas Bottle Check'],
                    water: latestPreDep.fields['Water Tank Level'],
                    condition: latestPreDep.fields['Overall Vessel Condition']
                };
                lastCheckType = 'Pre-Departure';
                lastCheckTime = new Date(latestPreDep.fields['Created time']);
                lastChecklistId = latestPreDep.id;
                
                console.log(`${boatName}: Only pre-departure checklist available`);
            } else if (latestPostDep) {
                // Only post-departure exists
                currentStatus = {
                    fuel: latestPostDep.fields['Fuel Level After Use'],
                    gas: latestPostDep.fields['Gas Bottle Level After Use'],
                    water: latestPostDep.fields['Water Tank Level After Use'],
                    condition: latestPostDep.fields['Overall Vessel Condition After Use']
                };
                lastCheckType = 'Post-Departure';
                lastCheckTime = new Date(latestPostDep.fields['Created time']);
                lastChecklistId = latestPostDep.id;
                
                console.log(`${boatName}: Only post-departure checklist available`);
            } else {
                console.log(`${boatName}: No checklists found`);
            }
            
            // Calculate days since last check
            const daysSinceCheck = lastCheckTime ? 
                Math.floor((new Date() - lastCheckTime) / (1000 * 60 * 60 * 24)) : null;
            
            // Generate alerts
            const alerts = generateAlerts(currentStatus, daysSinceCheck);
            
            // Determine overall status
            let overallStatus = 'Unknown';
            if (currentStatus) {
                if (alerts.some(a => a.type === 'critical')) {
                    overallStatus = 'Critical';
                } else if (alerts.some(a => a.type === 'warning')) {
                    overallStatus = 'Warning';
                } else {
                    overallStatus = 'Ready';
                }
            }
            
            return {
                id: boatId,
                name: boatName,
                type: boat.fields['Boat Type'] || 'Unknown Type',
                location: boat.fields['Vessel Location'] || 'Unknown Location',
                currentStatus: currentStatus ? {
                    fuel: {
                        level: currentStatus.fuel,
                        percentage: levelToPercentage(currentStatus.fuel)
                    },
                    gas: {
                        level: currentStatus.gas,
                        percentage: levelToPercentage(currentStatus.gas)
                    },
                    water: {
                        level: currentStatus.water,
                        percentage: levelToPercentage(currentStatus.water)
                    },
                    condition: currentStatus.condition
                } : null,
                lastCheck: {
                    type: lastCheckType,
                    time: lastCheckTime,
                    checklistId: lastChecklistId,
                    daysSince: daysSinceCheck
                },
                alerts: alerts,
                overallStatus: overallStatus,
                recentChecklists: {
                    preDeparture: boatPreDeps.slice(0, 5).map(c => ({
                        id: c.id,
                        date: c.fields['Created time'],
                        fuel: c.fields['Fuel Level Check'],
                        gas: c.fields['Gas Bottle Check'],
                        water: c.fields['Water Tank Level']
                    })),
                    postDeparture: boatPostDeps.slice(0, 5).map(c => ({
                        id: c.id,
                        date: c.fields['Created time'],
                        fuel: c.fields['Fuel Level After Use'],
                        gas: c.fields['Gas Bottle Level After Use'],
                        water: c.fields['Water Tank Level After Use']
                    }))
                }
            };
        });
        
        // Sort vessels by status priority (Critical > Warning > Ready > Unknown)
        const statusPriority = { 'Critical': 1, 'Warning': 2, 'Ready': 3, 'Unknown': 4 };
        vesselStatuses.sort((a, b) => 
            statusPriority[a.overallStatus] - statusPriority[b.overallStatus]
        );
        
        return {
            success: true,
            vessels: vesselStatuses,
            summary: {
                total: vesselStatuses.length,
                critical: vesselStatuses.filter(v => v.overallStatus === 'Critical').length,
                warning: vesselStatuses.filter(v => v.overallStatus === 'Warning').length,
                ready: vesselStatuses.filter(v => v.overallStatus === 'Ready').length,
                unknown: vesselStatuses.filter(v => v.overallStatus === 'Unknown').length
            }
        };
        
    } catch (error) {
        console.error('Error fetching vessel status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get status for a specific vessel
async function getVesselDetail(vesselId) {
    const allStatus = await getVesselMaintenanceStatus();
    const vessel = allStatus.vessels.find(v => v.id === vesselId);
    
    if (!vessel) {
        return {
            success: false,
            error: 'Vessel not found'
        };
    }
    
    return {
        success: true,
        vessel: vessel
    };
}

// Export for use in Express routes
module.exports = {
    getVesselMaintenanceStatus,
    getVesselDetail,
    levelToPercentage,
    generateAlerts
};
