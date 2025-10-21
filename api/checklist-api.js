/**
 * Checklist API Endpoints
 * Handles pre-departure and post-departure checklist operations
 * Provides secure server-side access to Airtable
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';
const PRE_DEPARTURE_TABLE_ID = 'tbl9igu5g1bPG4Ahu';
const POST_DEPARTURE_TABLE_ID = 'tblYkbSQGP6zveYNi';
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';

const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};

/**
 * Find employee by email
 */
router.get('/employee-by-email', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}`,
            {
                headers,
                params: {
                    filterByFormula: `{Email}='${email}'`
                }
            }
        );
        
        if (response.data.records && response.data.records.length > 0) {
            const employee = response.data.records[0];
            res.json({
                success: true,
                employee: {
                    id: employee.id,
                    name: employee.fields.Name || '',
                    email: employee.fields.Email || '',
                    firstName: (employee.fields.Name || '').split(' ')[0] || 'Unknown'
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Employee record not found'
            });
        }
    } catch (error) {
        console.error('Error finding employee:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to find employee',
            details: error.response?.data || error.message 
        });
    }
});

/**
 * Get assigned bookings for an employee or all bookings for management
 */
router.get('/assigned-bookings', async (req, res) => {
    const { employeeId, type, bookingId, isManagement } = req.query;
    
    try {
        // Build filter formula
        let filterFormula = "{Status}='PAID'";
        
        // If a specific booking ID is provided, just get that booking (regardless of status)
        if (bookingId) {
            filterFormula = `RECORD_ID()='${bookingId}'`;
        } else if (employeeId && !isManagement) {
            // For regular employees, filter by assignment
            const employeeField = type === 'pre-departure' ? 'Onboarding Employee' : 'Deloading Employee';
            filterFormula = `AND({Status}='PAID',SEARCH('${employeeId}',{${employeeField}}&''))`;
        }
        // For management (isManagement=true), get all PAID bookings
        
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}`,
            {
                headers,
                params: {
                    filterByFormula,
                    sort: [
                        { field: 'Booking Date', direction: 'asc' },
                        { field: type === 'pre-departure' ? 'Onboarding Time' : 'Deloading Time', direction: 'asc' }
                    ],
                    pageSize: 100
                }
            }
        );
        
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter for today or future bookings
        const bookings = response.data.records.filter(record => {
            const bookingDate = record.fields['Booking Date'];
            if (bookingDate) {
                const bookingDateObj = new Date(bookingDate);
                bookingDateObj.setHours(0, 0, 0, 0);
                return bookingDateObj >= today;
            }
            return false;
        });
        
        res.json({
            success: true,
            bookings,
            total: bookings.length
        });
    } catch (error) {
        console.error('Error fetching bookings:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch bookings',
            details: error.response?.data || error.message 
        });
    }
});

/**
 * Get boat details
 */
router.get('/boat/:boatId', async (req, res) => {
    const { boatId } = req.params;
    
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE_ID}/${boatId}`,
            { headers }
        );
        
        res.json({
            success: true,
            boat: {
                id: response.data.id,
                name: response.data.fields.Name || 'Unknown Boat'
            }
        });
    } catch (error) {
        console.error('Error fetching boat:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to fetch boat details',
            details: error.response?.data || error.message 
        });
    }
});

/**
 * Submit pre-departure checklist
 */
router.post('/pre-departure-checklist', async (req, res) => {
    try {
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEPARTURE_TABLE_ID}`,
            {
                fields: req.body.fields
            },
            { headers }
        );
        
        res.json({
            success: true,
            record: response.data
        });
    } catch (error) {
        console.error('Error submitting pre-departure checklist:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to submit checklist',
            details: error.response?.data || error.message 
        });
    }
});

/**
 * Submit post-departure checklist
 */
router.post('/post-departure-checklist', async (req, res) => {
    try {
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEPARTURE_TABLE_ID}`,
            {
                fields: req.body.fields
            },
            { headers }
        );
        
        res.json({
            success: true,
            record: response.data
        });
    } catch (error) {
        console.error('Error submitting post-departure checklist:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to submit checklist',
            details: error.response?.data || error.message 
        });
    }
});

module.exports = router;
