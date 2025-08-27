// Shift Response Handler
// Processes employee responses to shift allocation notifications

const axios = require('axios');
const notifications = require('./notifications');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

/**
 * Handle shift response from magic link
 * @param {string} token - The magic link token
 * @returns {object} - Result of the operation
 */
async function handleShiftResponse(token) {
    // Validate the token
    const tokenData = notifications.validateMagicToken(token);
    
    if (!tokenData) {
        return {
            success: false,
            error: 'Invalid or expired link. Please contact management.',
            statusCode: 400
        };
    }
    
    const { allocationId, employeeId, action } = tokenData;
    
    try {
        // Update the allocation record with the response
        const updateFields = {
            'Response Status': action === 'accept' ? 'Accepted' : 'Declined',
            'Response Date': new Date().toISOString(),
            'Response Method': 'SMS Link'
        };
        
        // Update Airtable record
        const response = await axios.patch(
            `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}/${allocationId}`,
            {
                fields: updateFields
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status === 200) {
            // Mark token as used
            notifications.consumeToken(token);
            
            // Get employee and shift details for confirmation message
            const allocationData = response.data.fields;
            
            // Fetch employee details for phone number
            const employeeResponse = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${employeeId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    }
                }
            );
            
            const employeeData = employeeResponse.data.fields;
            
            // Send confirmation SMS
            await notifications.sendShiftConfirmation({
                employeePhone: employeeData['Phone'] || employeeData['Mobile'] || employeeData['Mobile Number'],
                employeeName: employeeData['Name'] || employeeData['First Name'],
                action: action === 'accept' ? 'accepted' : 'denied',
                shiftDate: allocationData['Shift Date'],
                startTime: allocationData['Start Time'],
                endTime: allocationData['End Time'],
                shiftType: allocationData['Shift Type']
            });
            
            // If declined, notify management for coverage
            if (action === 'deny') {
                await notifyManagementOfDecline({
                    employeeName: employeeData['Name'],
                    shiftDate: allocationData['Shift Date'],
                    startTime: allocationData['Start Time'],
                    shiftType: allocationData['Shift Type']
                });
            }
            
            return {
                success: true,
                action: action === 'accept' ? 'accepted' : 'declined',
                message: action === 'accept' 
                    ? 'Thank you! Your shift has been confirmed.' 
                    : 'Your response has been recorded. We will find coverage.',
                shiftDetails: {
                    date: allocationData['Shift Date'],
                    time: `${allocationData['Start Time']} - ${allocationData['End Time']}`,
                    type: allocationData['Shift Type']
                }
            };
        }
        
    } catch (error) {
        console.error('Error handling shift response:', error);
        return {
            success: false,
            error: 'Failed to process your response. Please contact management.',
            statusCode: 500
        };
    }
}

/**
 * Notify management when a shift is declined
 * @param {object} params - Notification parameters
 */
async function notifyManagementOfDecline(params) {
    const { employeeName, shiftDate, startTime, shiftType } = params;
    
    // List of management phone numbers from environment variables
    const managementNumbers = [];
    if (process.env.MANAGER_PHONE_1) {
        managementNumbers.push(process.env.MANAGER_PHONE_1);
    }
    if (process.env.MANAGER_PHONE_2) {
        managementNumbers.push(process.env.MANAGER_PHONE_2);
    }
    // Add more management numbers as needed from environment variables
    
    const message = `⚠️ MBH Coverage Needed

${employeeName} has declined their shift:
📅 ${shiftDate}
⏰ ${startTime}
📋 ${shiftType}

Please find coverage ASAP.`;
    
    // Send to each manager
    for (const phoneNumber of managementNumbers) {
        try {
            const authString = `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`;
            const encodedAuth = Buffer.from(authString).toString('base64');
            
            await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${encodedAuth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'From': process.env.TWILIO_FROM_NUMBER,
                        'To': phoneNumber,
                        'Body': message
                    })
                }
            );
            console.log(`✅ Management notified at ${phoneNumber}`);
        } catch (error) {
            console.error(`Failed to notify management at ${phoneNumber}:`, error);
        }
    }
}

/**
 * Get shift acceptance status for display
 * @param {string} allocationId - The allocation ID
 * @returns {object} - Status information
 */
async function getShiftStatus(allocationId) {
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}/${allocationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const fields = response.data.fields;
        return {
            responseStatus: fields['Response Status'] || 'Pending',
            responseDate: fields['Response Date'],
            responseMethod: fields['Response Method']
        };
        
    } catch (error) {
        console.error('Error fetching shift status:', error);
        return {
            responseStatus: 'Unknown',
            error: error.message
        };
    }
}

module.exports = {
    handleShiftResponse,
    getShiftStatus,
    notifyManagementOfDecline
};
