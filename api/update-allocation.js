/**
 * Update booking allocation (onboarding/deloading staff and times)
 * Used by the Daily Run Sheet calendar interface
 */

const axios = require('axios');

module.exports = async (req, res) => {
    const { bookingId, allocationType, staffName, time } = req.body;
    
    // Validate required fields
    if (!bookingId || !allocationType) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            details: 'bookingId and allocationType are required'
        });
    }
    
    // Validate allocation type
    const validTypes = ['onboarding', 'deloading'];
    if (!validTypes.includes(allocationType)) {
        return res.status(400).json({ 
            error: 'Invalid allocation type',
            details: 'allocationType must be either "onboarding" or "deloading"'
        });
    }
    
    try {
        // Prepare the fields to update based on allocation type
        const updateFields = {};
        
        if (allocationType === 'onboarding') {
            if (staffName !== undefined) {
                updateFields['Onboarding Assigned To'] = staffName || '';
            }
            if (time !== undefined) {
                updateFields['Onboarding Time'] = time || '';
            }
        } else if (allocationType === 'deloading') {
            if (staffName !== undefined) {
                updateFields['Deloading Assigned To'] = staffName || '';
            }
            if (time !== undefined) {
                updateFields['Deloading Time'] = time || '';
            }
        }
        
        // If no fields to update, return error
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ 
                error: 'No fields to update',
                details: 'Must provide at least staffName or time'
            });
        }
        
        // Update booking in Airtable
        const response = await axios.patch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings%20Dashboard/${bookingId}`,
            {
                fields: updateFields
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // If staff was assigned, check if we need to create/update shift allocation
        if (staffName && staffName !== '' && staffName !== 'Unassigned') {
            await createOrUpdateShiftAllocation(
                bookingId, 
                response.data.fields,
                allocationType,
                staffName
            );
        }
        
        // Log the update
        console.log(`Updated ${allocationType} allocation for booking ${bookingId}:`, updateFields);
        
        res.json({ 
            success: true,
            booking: response.data,
            updatedFields: updateFields
        });
        
    } catch (error) {
        console.error('Error updating allocation:', error.response?.data || error);
        res.status(500).json({ 
            error: 'Failed to update allocation',
            details: error.response?.data?.error || error.message 
        });
    }
};

// Helper function to create or update shift allocation record
async function createOrUpdateShiftAllocation(bookingId, bookingFields, allocationType, staffName) {
    try {
        // First, find the employee record by name
        const employeeResponse = await axios.get(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Employee%20Details?filterByFormula=` +
            encodeURIComponent(`{Name}="${staffName}"`),
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
                }
            }
        );
        
        if (!employeeResponse.data.records || employeeResponse.data.records.length === 0) {
            console.warn(`Employee not found: ${staffName}`);
            return;
        }
        
        const employeeId = employeeResponse.data.records[0].id;
        const bookingDate = bookingFields['Booking Date'];
        const customerName = bookingFields['Customer Name'];
        
        // Determine shift time and type based on allocation type
        let shiftTime, shiftType;
        if (allocationType === 'onboarding') {
            shiftTime = bookingFields['Onboarding Time'];
            shiftType = 'Onboarding';
        } else {
            shiftTime = bookingFields['Deloading Time'];
            shiftType = 'Deloading';
        }
        
        if (!shiftTime) return; // No time set, skip allocation creation
        
        // Check if allocation already exists
        const existingAllocationResponse = await axios.get(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Shift%20Allocations?filterByFormula=` +
            encodeURIComponent(`AND({Booking}="${bookingId}",{Shift Type}="${shiftType}")`),
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
                }
            }
        );
        
        const allocationFields = {
            'Name': `${customerName} - ${shiftType}`,
            'Shift Status': 'Active',
            'Shift Type': shiftType,
            'Employee': [employeeId],
            'Shift Date': bookingDate,
            'Start Time': shiftTime,
            'End Time': shiftTime, // Same as start for allocations
            'Booking': [bookingId],
            'Response Status': 'Accepted',
            'Response Date': new Date().toISOString(),
            'Response Method': 'Calendar Assignment'
        };
        
        if (existingAllocationResponse.data.records.length > 0) {
            // Update existing allocation
            const allocationId = existingAllocationResponse.data.records[0].id;
            await axios.patch(
                `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Shift%20Allocations/${allocationId}`,
                { fields: allocationFields },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`Updated shift allocation ${allocationId} for ${staffName}`);
        } else {
            // Create new allocation
            await axios.post(
                `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Shift%20Allocations`,
                { fields: allocationFields },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`Created new shift allocation for ${staffName}`);
        }
        
    } catch (error) {
        console.error('Error managing shift allocation:', error.response?.data || error);
        // Don't throw - this is a secondary operation
    }
}
