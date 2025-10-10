// Employee Shift SMS Notification Service
// Handles SMS notifications for shift allocations with secure magic links

const crypto = require('crypto');
const tokenStorage = require('./token-storage');

// Twilio credentials - MUST be set in environment variables
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

// Validate required environment variables
if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM_NUMBER) {
    console.error('ERROR: Missing required Twilio environment variables');
    console.error('Please set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
}

// Base URL for magic links
const BASE_URL = process.env.BASE_URL || 'https://mbh-production-f0d1.up.railway.app';

/**
 * Generate a secure magic link token for shift acceptance
 * @param {string} allocationId - The shift allocation record ID (or booking ID for booking allocations)
 * @param {string} employeeId - The employee record ID
 * @param {string} action - 'accept' or 'deny'
 * @param {boolean} isBookingAllocation - Whether this is a booking-specific allocation
 * @param {string} role - The role for booking allocations (Onboarding/Deloading)
 * @returns {Promise<string>} - The generated token
 */
async function generateMagicToken(allocationId, employeeId, action, isBookingAllocation = false, role = null) {
    // Use persistent token storage instead of in-memory Map
    return await tokenStorage.generateAndStoreToken(allocationId, employeeId, action, isBookingAllocation, role);
}

/**
 * Validate a magic link token
 * @param {string} token - The token to validate
 * @returns {Promise<object|null>} - Token data if valid, null otherwise
 */
async function validateMagicToken(token) {
    // Use persistent token storage
    return await tokenStorage.validateToken(token);
}

/**
 * Mark a token as used
 * @param {string} token - The token to mark as used
 * @param {string} recordId - The Airtable record ID of the token
 */
async function consumeToken(token, recordId) {
    // Use persistent token storage
    await tokenStorage.markTokenAsUsed(token, recordId);
}

/**
 * Send SMS notification for shift allocation
 * @param {object} params - Notification parameters
 * @param {string} params.employeePhone - Employee phone number
 * @param {string} params.employeeName - Employee name
 * @param {string} params.allocationId - Allocation record ID
 * @param {string} params.employeeId - Employee record ID
 * @param {string} params.shiftType - Type of shift (e.g., 'Boat Hire', 'General Operations')
 * @param {string} params.shiftDate - Date of the shift
 * @param {string} params.startTime - Start time
 * @param {string} params.endTime - End time
 * @param {string} params.customerName - Customer name (for booking allocations)
 * @param {string} params.role - Role (e.g., 'Onboarding', 'Deloading')
 * @param {boolean} params.isBookingAllocation - Whether this is a booking-specific allocation
 * @param {string} params.notes - Additional notes/instructions for the shift
 * @param {boolean} params.isUpdate - Whether this is an update to an existing accepted shift
 * @param {string} params.originalNotes - Original notes before update (for comparison)
 * @returns {Promise<object>} - Result of SMS send operation
 */
async function sendShiftNotification(params) {
    const {
        employeePhone,
        employeeName,
        allocationId,
        employeeId,
        shiftType,
        shiftDate,
        startTime,
        endTime,
        customerName,
        role,
        isBookingAllocation = false,
        notes,
        isUpdate = false,
        originalNotes
    } = params;
    
    // Format the date nicely
    const formattedDate = new Date(shiftDate).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    
    // Generate magic link tokens for accept and deny
    const acceptToken = await generateMagicToken(allocationId, employeeId, 'accept', isBookingAllocation, role);
    const denyToken = await generateMagicToken(allocationId, employeeId, 'deny', isBookingAllocation, role);
    
    // Create magic links
    const acceptLink = `${BASE_URL}/api/shift-response?token=${acceptToken}`;
    const denyLink = `${BASE_URL}/api/shift-response?token=${denyToken}`;
    
    // Build the message
    let message = '';
    
    if (isUpdate) {
        // Update message for already accepted shifts
        message = `📝 MBH Staff Update - Shift Instructions Changed

Hi ${employeeName},

Your shift details have been updated:

📅 ${formattedDate}
⏰ ${startTime} - ${endTime}
📋 Type: ${shiftType}
${role ? `🎯 Role: ${role}` : ''}

🆕 NEW INSTRUCTIONS:
${notes}

${originalNotes ? `Previous instructions: ${originalNotes}` : 'No previous instructions'}

Your shift acceptance is still confirmed. This is just an update to the instructions.

Questions? Contact management.`;
    } else if (isBookingAllocation) {
        // Booking-specific allocation message
        message = `🚤 MBH Staff Alert - New ${role} Assignment

Hi ${employeeName},

You've been assigned to a customer booking:

📅 ${formattedDate}
⏰ ${startTime} - ${endTime}
👤 Customer: ${customerName}
📋 Role: ${role}
${notes ? `\n📝 Notes: ${notes}` : ''}

Please confirm your availability:

✅ ACCEPT: ${acceptLink}

❌ DECLINE: ${denyLink}

Reply by clicking a link above.`;
    } else {
        // General shift allocation message
        message = `📋 MBH Staff Alert - New Shift Assignment

Hi ${employeeName},

You've been assigned a new shift:

📅 ${formattedDate}
⏰ ${startTime} - ${endTime}
📋 Type: ${shiftType}
${role ? `🎯 Role: ${role}` : ''}
${notes ? `📝 Notes: ${notes}` : ''}

Please confirm your availability:

✅ ACCEPT: ${acceptLink}

❌ DECLINE: ${denyLink}

Reply by clicking a link above.`;
    }
    
    // Encode credentials for Basic Auth
    const authString = `${TWILIO_SID}:${TWILIO_TOKEN}`;
    const encodedAuth = Buffer.from(authString).toString('base64');
    
    try {
        // Send SMS via Twilio API
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'From': TWILIO_FROM_NUMBER,
                    'To': employeePhone,
                    'Body': message
                })
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log(`✅ SMS sent successfully to ${employeeName} (${employeePhone})`);
        console.log(`   Shift: ${shiftType} on ${formattedDate}`);
        console.log(`   Message SID: ${result.sid}`);
        
        return {
            success: true,
            messageSid: result.sid,
            acceptToken,
            denyToken,
            message
        };
        
    } catch (error) {
        console.error(`❌ Failed to send SMS to ${employeePhone}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send reminder SMS for unconfirmed shifts
 * @param {object} params - Similar to sendShiftNotification but for reminders
 */
async function sendShiftReminder(params) {
    const {
        employeePhone,
        employeeName,
        allocationId,
        employeeId,
        shiftDate,
        startTime,
        hoursUntilShift
    } = params;
    
    // Generate new magic link tokens
    const acceptToken = await generateMagicToken(allocationId, employeeId, 'accept');
    const denyToken = await generateMagicToken(allocationId, employeeId, 'deny');
    
    // Create magic links
    const acceptLink = `${BASE_URL}/api/shift-response?token=${acceptToken}`;
    const denyLink = `${BASE_URL}/api/shift-response?token=${denyToken}`;
    
    const message = `⏰ MBH Shift Reminder

Hi ${employeeName},

Your shift starts in ${hoursUntilShift} hours:
📅 ${shiftDate} at ${startTime}

Please confirm ASAP:

✅ ACCEPT: ${acceptLink}
❌ DECLINE: ${denyLink}`;
    
    // Send via Twilio (same as above)
    const authString = `${TWILIO_SID}:${TWILIO_TOKEN}`;
    const encodedAuth = Buffer.from(authString).toString('base64');
    
    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'From': TWILIO_FROM_NUMBER,
                    'To': employeePhone,
                    'Body': message
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Twilio error: ${response.status}`);
        }
        
        console.log(`✅ Reminder sent to ${employeeName}`);
        return { success: true };
        
    } catch (error) {
        console.error(`❌ Failed to send reminder:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send confirmation SMS after shift acceptance/denial
 * @param {object} params - Confirmation parameters
 */
async function sendShiftConfirmation(params) {
    const {
        employeePhone,
        employeeName,
        action, // 'accepted' or 'denied'
        shiftDate,
        startTime,
        endTime,
        shiftType
    } = params;
    
    const formattedDate = new Date(shiftDate).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    
    let message;
    if (action === 'accepted') {
        message = `✅ Shift Confirmed - MBH

Thanks ${employeeName}!

Your shift is confirmed:
📅 ${formattedDate}
⏰ ${startTime} - ${endTime}
📋 ${shiftType}

See you at the marina! 🚤`;
    } else {
        message = `❌ Shift Declined - MBH

Hi ${employeeName},

We've noted you're unavailable for:
📅 ${formattedDate}
⏰ ${startTime} - ${endTime}

We'll find coverage. Thanks for letting us know.`;
    }
    
    const authString = `${TWILIO_SID}:${TWILIO_TOKEN}`;
    const encodedAuth = Buffer.from(authString).toString('base64');
    
    try {
        await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'From': TWILIO_FROM_NUMBER,
                    'To': employeePhone,
                    'Body': message
                })
            }
        );
        
        console.log(`✅ Confirmation sent: ${action} by ${employeeName}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to send confirmation:', error);
        return { success: false };
    }
}

module.exports = {
    sendShiftNotification,
    sendShiftReminder,
    sendShiftConfirmation,
    validateMagicToken,
    consumeToken,
    generateMagicToken
};
