const axios = require('axios');

// Airtable configuration
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE = 'tblRe0cDmK3bG2kPf';  // Bookings Dashboard
const ALLOCATIONS_TABLE = 'tbl22YKtQXZtDFtEX';  // Shift Allocations (matching frontend)
const ROSTER_TABLE = 'tblGv7fBQoKIDU5jr';  // Roster (alternative source for staff data)
const EMPLOYEE_TABLE = 'tbltAE4NlNePvnkpY';  // Employee Details
const PRE_DEPARTURE_TABLE = 'tbl9igu5g1bPG4Ahu';  // Pre-Departure Checklist
const POST_DEPARTURE_TABLE = 'tblYkbSQGP6zveYNi';  // Post-Departure Checklist
const BOATS_TABLE = 'tblNLoBNb4daWzjob';  // Boats
const VESSEL_MAINTENANCE_TABLE = 'tblGCuXN3qKUJvHHz';  // Vessel Maintenance

const headers = {
    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};

/**
 * Get dashboard overview statistics for today
 */
async function getDashboardOverview(date) {
    try {
        // Set to September 18, 2025 if no date provided to match system context
        const defaultDate = new Date();
        defaultDate.setFullYear(2025);
        defaultDate.setMonth(8); // September
        defaultDate.setDate(18);
        
        const dateString = date || defaultDate.toISOString().split('T')[0];
        console.log('Getting dashboard overview for date:', dateString);
        
        // Fetch all data in parallel
        const [
            todayBookings,
            shiftAllocations,
            vesselStatuses,
            vesselMaintenance
        ] = await Promise.all([
            getTodayBookings(dateString),
            getShiftAllocations(dateString),
            getAllVesselStatuses(),
            getVesselMaintenanceStatus()
        ]);
        
        // Debug logging
        console.log('Today bookings count:', todayBookings.length);
        console.log('Shift allocations count:', shiftAllocations.length);
        if (shiftAllocations.length > 0) {
            console.log('Sample shift allocation:', shiftAllocations[0].fields);
        }
        
        // Calculate Today's Bookings
        const confirmedBookings = todayBookings.filter(b => 
            ['PAID', 'PEND', 'PART'].includes(b.fields['Status'])
        );
        console.log('Confirmed bookings:', confirmedBookings.length);
        
        // Calculate Staff on Duty (from both bookings and shift allocations)
        const staffFromBookings = new Set();
        todayBookings.forEach(booking => {
            if (booking.fields['Onboarding Employee']?.[0]) {
                staffFromBookings.add(booking.fields['Onboarding Employee'][0]);
            }
            if (booking.fields['Deloading Employee']?.[0]) {
                staffFromBookings.add(booking.fields['Deloading Employee'][0]);
            }
        });
        
        const staffFromShifts = new Set(
            shiftAllocations
                .map(shift => shift.fields['Employee']?.[0])
                .filter(Boolean)
        );
        
        console.log('Staff from bookings:', staffFromBookings.size);
        console.log('Staff from shifts:', staffFromShifts.size);
        
        // Combine unique staff
        const allStaffOnDuty = new Set([...staffFromBookings, ...staffFromShifts]);
        
        // Calculate Vessels Active (currently on water)
        const vesselsOnWater = vesselStatuses.filter(v => v.status === 'on_water');
        
        // Calculate Pending Issues (non-operational vessels)
        const nonOperationalVessels = vesselMaintenance.filter(v => 
            v.fields['Current Status'] === 'Non-Operational' ||
            v.fields['Current Status'] === 'Under Maintenance'
        );
        
        return {
            todayBookings: confirmedBookings.length,
            staffOnDuty: allStaffOnDuty.size,
            vesselsActive: vesselsOnWater.length,
            pendingIssues: nonOperationalVessels.length,
            details: {
                bookings: confirmedBookings,
                vesselsOnWater: vesselsOnWater.map(v => ({
                    id: v.id,
                    name: v.name,
                    departureTime: v.departureTime,
                    location: v.location
                })),
                nonOperationalVessels: nonOperationalVessels.map(v => ({
                    name: v.fields['Vessel Name'],
                    status: v.fields['Current Status'],
                    issue: v.fields['Maintenance Issues']
                }))
            }
        };
    } catch (error) {
        console.error('Error getting dashboard overview:', error);
        throw error;
    }
}

/**
 * Get today's bookings
 */
async function getTodayBookings(dateString) {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE}?` +
            `filterByFormula=${encodeURIComponent(`{Booking Date}='${dateString}'`)}&` +
            `pageSize=100&` +
            `fields[]=Booking Code&fields[]=Customer Name&fields[]=Status&` +
            `fields[]=Onboarding Employee&fields[]=Deloading Employee&` +
            `fields[]=Boat&fields[]=Start Time&fields[]=Finish Time`;
        
        const response = await axios.get(url, { headers });
        return response.data.records || [];
    } catch (error) {
        console.error('Error fetching today bookings:', error);
        return [];
    }
}

/**
 * Get shift allocations for today
 */
async function getShiftAllocations(dateString) {
    try {
        // First try the allocations table
        const url = `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE}?` +
            `filterByFormula=${encodeURIComponent(`{Shift Date}='${dateString}'`)}&` +
            `pageSize=100&` +
            `fields[]=Employee&fields[]=Shift Type&fields[]=Start Time&fields[]=End Time&fields[]=Status`;
        
        console.log('Fetching shift allocations from:', ALLOCATIONS_TABLE);
        console.log('With filter:', `{Shift Date}='${dateString}'`);
        
        const response = await axios.get(url, { headers });
        const records = response.data.records || [];
        
        console.log('Allocations table response:', records.length, 'records');
        if (records.length > 0) {
            console.log('First allocation fields:', Object.keys(records[0].fields));
            return records;
        }
        
        // If no allocations found, try the Roster table as fallback
        console.log('No allocations found, trying Roster table...');
        const rosterUrl = `https://api.airtable.com/v0/${BASE_ID}/${ROSTER_TABLE}?` +
            `pageSize=100`;
        
        const rosterResponse = await axios.get(rosterUrl, { headers });
        const rosterRecords = rosterResponse.data.records || [];
        
        console.log('Roster table has', rosterRecords.length, 'total records');
        if (rosterRecords.length > 0) {
            console.log('Sample roster fields:', Object.keys(rosterRecords[0].fields));
            // For now, return empty array until we understand the roster structure
            // This prevents breaking the dashboard while we investigate
        }
        
        return records;
    } catch (error) {
        console.error('Error fetching shift allocations:', error.response?.status, error.response?.data || error.message);
        return [];
    }
}

/**
 * Get all vessel statuses from checklists
 */
async function getAllVesselStatuses() {
    try {
        // Get all boats first
        const boatsUrl = `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE}?` +
            `pageSize=100&` +
            `fields[]=Name&fields[]=Boat Type`;
        
        const boatsResponse = await axios.get(boatsUrl, { headers });
        const vessels = boatsResponse.data.records || [];
        
        // Get today's date for filtering
        const today = new Date().toISOString().split('T')[0];
        const todayFilter = `IS_SAME({Created time}, '${today}', 'day')`;
        
        // Get today's pre-departure checklists
        const preDepUrl = `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEPARTURE_TABLE}?` +
            `filterByFormula=${encodeURIComponent(todayFilter)}&` +
            `sort[0][field]=Created time&sort[0][direction]=desc&` +
            `pageSize=100&` +
            `fields[]=Vessel&fields[]=Created time&fields[]=Booking`;
        
        const preDepResponse = await axios.get(preDepUrl, { headers });
        
        // Get today's post-departure checklists
        const postDepUrl = `https://api.airtable.com/v0/${BASE_ID}/${POST_DEPARTURE_TABLE}?` +
            `filterByFormula=${encodeURIComponent(todayFilter)}&` +
            `sort[0][field]=Created time&sort[0][direction]=desc&` +
            `pageSize=100&` +
            `fields[]=Vessel&fields[]=Created time&fields[]=GPS Latitude&fields[]=GPS Longitude`;
        
        const postDepResponse = await axios.get(postDepUrl, { headers });
        
        // Process vessel statuses
        return vessels.map(vessel => {
            const vesselPreDeps = preDepResponse.data.records.filter(record => 
                record.fields['Vessel'] && record.fields['Vessel'].includes(vessel.id)
            );
            
            const vesselPostDeps = postDepResponse.data.records.filter(record => 
                record.fields['Vessel'] && record.fields['Vessel'].includes(vessel.id)
            );
            
            // Determine status based on latest checklists
            let status = 'ready';
            let departureTime = null;
            let location = null;
            
            if (vesselPreDeps.length > 0 && vesselPostDeps.length > 0) {
                const latestPreDep = vesselPreDeps[0];
                const latestPostDep = vesselPostDeps[0];
                const preDepTime = new Date(latestPreDep.fields['Created time']);
                const postDepTime = new Date(latestPostDep.fields['Created time']);
                
                if (preDepTime > postDepTime) {
                    // Pre-departure is newer - vessel is out
                    status = 'on_water';
                    departureTime = preDepTime.toISOString();
                } else {
                    // Post-departure is newer - vessel is back
                    status = 'ready';
                }
            } else if (vesselPreDeps.length > 0 && vesselPostDeps.length === 0) {
                // Only pre-departure exists - vessel is out
                status = 'on_water';
                departureTime = new Date(vesselPreDeps[0].fields['Created time']).toISOString();
            }
            
            // Get location from latest post-departure if available
            if (vesselPostDeps.length > 0 && vesselPostDeps[0].fields['GPS Latitude']) {
                location = {
                    latitude: vesselPostDeps[0].fields['GPS Latitude'],
                    longitude: vesselPostDeps[0].fields['GPS Longitude']
                };
            }
            
            return {
                id: vessel.id,
                name: vessel.fields['Name'] || 'Unknown',
                status,
                departureTime,
                location
            };
        });
    } catch (error) {
        console.error('Error fetching vessel statuses:', error);
        return [];
    }
}

/**
 * Get vessel maintenance status
 */
async function getVesselMaintenanceStatus() {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${VESSEL_MAINTENANCE_TABLE}?` +
            `filterByFormula=${encodeURIComponent(`OR({Current Status}='Non-Operational',{Current Status}='Under Maintenance')`)}&` +
            `pageSize=100&` +
            `fields[]=Vessel Name&fields[]=Current Status&fields[]=Maintenance Issues`;
        
        const response = await axios.get(url, { headers });
        return response.data.records || [];
    } catch (error) {
        console.error('Error fetching vessel maintenance status:', error);
        return [];
    }
}

module.exports = {
    getDashboardOverview
};
