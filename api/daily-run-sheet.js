const axios = require('axios');

// Airtable configuration
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE = 'tblRe0cDmK3bG2kPf';  // Bookings Dashboard
const PRE_DEPARTURE_TABLE = 'tbl9igu5g1bPG4Ahu';  // Pre-Departure Checklist
const POST_DEPARTURE_TABLE = 'tblYkbSQGP6zveYNi';  // Post-Departure Checklist
const BOATS_TABLE = 'tblA2b3OFfqPFbOM';  // Boats
const EMPLOYEE_TABLE = 'tbltAE4NlNePvnkpY';  // Employee Details

const headers = {
    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};

// Cache for vessel status to reduce API calls
let vesselStatusCache = null;
let vesselCacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all bookings for a specific date
 */
async function getDailyBookings(date) {
    try {
        // Parse the date and set to Sydney noon to avoid timezone issues
        const targetDate = new Date(date);
        targetDate.setHours(12, 0, 0, 0);
        
        // Format date for Airtable (YYYY-MM-DD)
        const dateString = targetDate.toISOString().split('T')[0];
        
        // Filter formula to get bookings for the specified date
        const filterFormula = `AND(
            {Booking Date} = '${dateString}',
            OR({Status} = 'PAID', {Status} = 'PEND', {Status} = 'PART')
        )`;
        
        // Build URL with proper encoding for Airtable
        const url = `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE}?` +
            `filterByFormula=${encodeURIComponent(filterFormula)}&` +
            `sort[0][field]=Start Time&sort[0][direction]=asc&` +
            `pageSize=100&` +
            `fields[]=Booking Code&fields[]=Customer Name&fields[]=Booking Date&` +
            `fields[]=Start Time&fields[]=Finish Time&fields[]=Duration&` +
            `fields[]=Status&fields[]=Add-ons&fields[]=Booking Items&` +
            `fields[]=Boat&fields[]=Onboarding Employee&fields[]=Deloading Employee&` +
            `fields[]=Total Amount&fields[]=End Date`;
        
        const response = await axios.get(url, { headers });
        
        return response.data.records;
    } catch (error) {
        console.error('Error fetching daily bookings:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get vessel status with latest checklist data
 */
async function getVesselStatus(vesselId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateFilter = thirtyDaysAgo.toISOString();
        
        // Get latest pre-departure checklist
        const preDepUrl = `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEPARTURE_TABLE}?` +
            `filterByFormula=${encodeURIComponent(`AND({Created} > '${dateFilter}')`)}&` +
            `sort[0][field]=Created&sort[0][direction]=desc&` +
            `pageSize=100&` +
            `fields[]=Vessel&fields[]=Fuel Level Check&fields[]=Gas Bottle Status&` +
            `fields[]=Water Level&fields[]=Engine Check&fields[]=Completed&` +
            `fields[]=Created&fields[]=Completed by`;
        
        const preDepResponse = await axios.get(preDepUrl, { headers });
        
        // Get latest post-departure checklist
        const postDepUrl = `https://api.airtable.com/v0/${BASE_ID}/${POST_DEPARTURE_TABLE}?` +
            `filterByFormula=${encodeURIComponent(`AND({Created time} > '${dateFilter}')`)}&` +
            `sort[0][field]=Created time&sort[0][direction]=desc&` +
            `pageSize=100&` +
            `fields[]=Vessel&fields[]=Fuel Level After Use&fields[]=Gas Level After Use&` +
            `fields[]=Water Level After Use&fields[]=Overall Vessel Condition After Use&` +
            `fields[]=GPS Latitude&fields[]=GPS Longitude&fields[]=Location Address&` +
            `fields[]=Location Captured&fields[]=Created time&fields[]=Last modified time&` +
            `fields[]=Completed by`;
        
        const postDepResponse = await axios.get(postDepUrl, { headers });
        
        // Filter for this specific vessel
        const vesselPreDeps = preDepResponse.data.records.filter(record => 
            record.fields['Vessel'] && record.fields['Vessel'].includes(vesselId)
        );
        
        const vesselPostDeps = postDepResponse.data.records.filter(record => 
            record.fields['Vessel'] && record.fields['Vessel'].includes(vesselId)
        );
        
        const latestPreDep = vesselPreDeps[0];
        const latestPostDep = vesselPostDeps[0];
        
        // Determine vessel status based on checklists
        let status = 'ready';
        let departureTime = null;
        let returnTime = null;
        
        if (latestPreDep && latestPostDep) {
            const preDepTime = new Date(latestPreDep.fields['Created']);
            const postDepTime = new Date(latestPostDep.fields['Created time']);
            
            if (preDepTime > postDepTime) {
                // Pre-departure is newer - vessel is out
                status = 'on_water';
                departureTime = preDepTime.toISOString();
            } else {
                // Post-departure is newer - vessel is back
                status = 'ready';
                returnTime = postDepTime.toISOString();
            }
        } else if (latestPreDep && !latestPostDep) {
            status = 'on_water';
            departureTime = new Date(latestPreDep.fields['Created']).toISOString();
        }
        
        // Get resource levels from latest post-departure or pre-departure
        const fuelLevel = latestPostDep?.fields['Fuel Level After Use'] || 
                         latestPreDep?.fields['Fuel Level Check'] || 
                         'Unknown';
        const gasLevel = latestPostDep?.fields['Gas Level After Use'] || 
                        latestPreDep?.fields['Gas Bottle Status'] || 
                        'Unknown';
        const waterLevel = latestPostDep?.fields['Water Level After Use'] || 
                          latestPreDep?.fields['Water Level'] || 
                          'Unknown';
        const condition = latestPostDep?.fields['Overall Vessel Condition After Use'] || 
                         'Unknown';
        
        // Get location if available
        let location = null;
        if (latestPostDep?.fields['Location Captured']) {
            location = {
                latitude: latestPostDep.fields['GPS Latitude'],
                longitude: latestPostDep.fields['GPS Longitude'],
                address: latestPostDep.fields['Location Address'],
                lastModified: latestPostDep.fields['Last modified time'] || 
                             latestPostDep.fields['Created time']
            };
        }
        
        return {
            status,
            departureTime,
            returnTime,
            fuelLevel,
            gasLevel,
            waterLevel,
            condition,
            location,
            lastUpdate: latestPostDep?.fields['Created time'] || latestPreDep?.fields['Created']
        };
    } catch (error) {
        console.error('Error fetching vessel status:', error.response?.data || error.message);
        return {
            status: 'unknown',
            fuelLevel: 'Unknown',
            gasLevel: 'Unknown',
            waterLevel: 'Unknown',
            condition: 'Unknown',
            location: null
        };
    }
}

/**
 * Get all vessels and their current status
 */
async function getAllVesselStatuses() {
    try {
        // Check cache first
        if (vesselStatusCache && Date.now() - vesselCacheTimestamp < CACHE_TTL) {
            return vesselStatusCache;
        }
        
        // Get all boats
        const boatsUrl = `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE}?` +
            `filterByFormula=${encodeURIComponent("{Status} = 'Active'")}&` +
            `pageSize=100&` +
            `fields[]=Name&fields[]=Boat Type&fields[]=Capacity&fields[]=Home Location`;
        
        const boatsResponse = await axios.get(boatsUrl, { headers });
        
        const vessels = boatsResponse.data.records;
        
        // Get status for each vessel in parallel
        const vesselStatuses = await Promise.all(
            vessels.map(async (vessel) => {
                const status = await getVesselStatus(vessel.id);
                return {
                    id: vessel.id,
                    name: vessel.fields['Name'],
                    type: vessel.fields['Boat Type'],
                    capacity: vessel.fields['Capacity'],
                    ...status
                };
            })
        );
        
        // Update cache
        vesselStatusCache = vesselStatuses;
        vesselCacheTimestamp = Date.now();
        
        return vesselStatuses;
    } catch (error) {
        console.error('Error fetching all vessel statuses:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Convert resource level text to percentage
 */
function levelToPercentage(level) {
    const levelMap = {
        'Empty': 0,
        'Quarter': 25,
        'Half': 50,
        'Three-Quarter': 75,
        'Full': 100
    };
    
    return levelMap[level] || 0;
}

/**
 * Get status indicator based on percentage
 */
function getResourceStatus(percentage) {
    if (percentage >= 50) return 'good';
    if (percentage >= 25) return 'warning';
    return 'critical';
}

/**
 * Extract and aggregate add-ons from bookings
 */
function extractAddOns(bookings) {
    const addOnsCount = {};
    
    bookings.forEach(booking => {
        const addOnsField = booking.fields['Add-ons'];
        if (!addOnsField) return;
        
        // Parse add-ons string (format: "Item - $Price, Item - $Price")
        const addOnsArray = addOnsField.split(',').map(item => item.trim());
        
        addOnsArray.forEach(addon => {
            // Extract just the item name (before the price)
            const itemName = addon.split(' - ')[0].trim();
            if (itemName) {
                addOnsCount[itemName] = (addOnsCount[itemName] || 0) + 1;
            }
        });
    });
    
    return addOnsCount;
}

module.exports = {
    getDailyBookings,
    getVesselStatus,
    getAllVesselStatuses,
    extractAddOns,
    levelToPercentage,
    getResourceStatus
};
