// Announcements API Handler
// Manages announcements creation, updates, deletion, and SMS notifications

const axios = require('axios');

// For Railway deployment, these are set in environment variables
// For local development, you can hardcode them temporarily
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14';
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq'; // Announcements table
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';

// Twilio configuration
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

/**
 * Get all active announcements
 */
async function getAnnouncements(includeExpired = false) {
    try {
        // Build URL with optional date filtering
        let url = `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}?`;
        
        if (!includeExpired) {
            // Filter to show announcements that either have no expiry date OR haven't expired yet
            const today = new Date().toISOString().split('T')[0];
            const filter = `OR(NOT({Expiry Date}), {Expiry Date} >= '${today}')`;
            url += `filterByFormula=${encodeURIComponent(filter)}&`;
        }
        
        url += `sort[0][field]=Title&sort[0][direction]=desc`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        const data = response.data;
        return {
            success: true,
            announcements: data.records
        };
    } catch (error) {
        console.error('Error fetching announcements:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Create a new announcement
 */
async function createAnnouncement(data) {
    try {
        const { title, message, priority, expiryDate, sendSMS, postedBy } = data;
        
        // Create announcement in Airtable
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}`,
            {
                fields: {
                    'Title': title,
                    'Message': message,
                    'Priority': priority || 'Low',
                    ...(expiryDate ? { 'Expiry Date': expiryDate } : {}),
                    'Posted By': postedBy,
                    'SMS Sent': false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const announcement = response.data;

        // Send SMS if requested
        let smsResult = null;
        if (sendSMS) {
            smsResult = await sendAnnouncementSMS(title, message, priority);
            
            // Update record to mark SMS as sent
            await updateAnnouncement(announcement.id, { 'SMS Sent': true });
        }

        return {
            success: true,
            announcement,
            ...(smsResult ? { sent: smsResult.sent, failed: smsResult.failed, total: smsResult.total } : {})
        };
    } catch (error) {
        console.error('Error creating announcement:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Update an announcement
 */
async function updateAnnouncement(id, updates) {
    try {
        const response = await axios.patch(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}/${id}`,
            { fields: updates },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const announcement = response.data;
        return {
            success: true,
            announcement
        };
    } catch (error) {
        console.error('Error updating announcement:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Delete an announcement
 */
async function deleteAnnouncement(id) {
    try {
        await axios.delete(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}/${id}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting announcement:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Send SMS to all active roster staff
 */
async function sendAnnouncementSMS(title, message, priority) {
    try {
        // Get all employees with Active Roster checked
        console.log('Fetching active roster employees...');
        
        const employeeResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}?` +
            `filterByFormula=${encodeURIComponent(`{Active Roster}=1`)}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        const employeeData = employeeResponse.data;
        console.log(`Found ${employeeData.records.length} active roster employees`);
        
        if (employeeData.records.length === 0) {
            console.log('No active roster employees found');
            return {
                success: true,
                sent: 0,
                failed: 0,
                total: 0,
                message: 'No active roster employees found'
            };
        }
        
        // Prepare SMS message
        const priorityEmoji = priority === 'High' ? '🚨' : priority === 'Medium' ? '⚠️' : 'ℹ️';
        const smsMessage = `${priorityEmoji} MBH Staff Announcement

${title.toUpperCase()}

${message}

Check your dashboard for more details.`;

        // Check if Twilio credentials are configured
        if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM_NUMBER) {
            console.error('Twilio credentials not configured:', {
                SID: !!TWILIO_SID,
                TOKEN: !!TWILIO_TOKEN,
                FROM: !!TWILIO_FROM_NUMBER
            });
            return {
                success: false,
                error: 'SMS service not configured',
                sent: 0,
                failed: 0,
                total: employeeData.records.length
            };
        }

        // Send SMS to each staff member
        const authString = `${TWILIO_SID}:${TWILIO_TOKEN}`;
        const encodedAuth = Buffer.from(authString).toString('base64');

        let successCount = 0;
        let failCount = 0;

        for (const employee of employeeData.records) {
            const phone = employee.fields['Mobile Number'] || employee.fields['Mobile'] || employee.fields['Phone'];
            const name = employee.fields['Name'];
            
            if (!phone) {
                console.log(`No phone number for ${name}`);
                failCount++;
                continue;
            }

            try {
                const response = await axios.post(
                    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
                    new URLSearchParams({
                        'From': TWILIO_FROM_NUMBER,
                        'To': phone,
                        'Body': smsMessage
                    }),
                    {
                        headers: {
                            'Authorization': `Basic ${encodedAuth}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );

                successCount++;
                console.log(`✅ SMS sent to ${name} (${phone})`);
            
            } catch (error) {
                failCount++;
                const errorMessage = error.response?.data || error.message;
                console.error(`❌ Error sending SMS to ${name}:`, errorMessage);
            }
        }

        console.log(`Announcement SMS summary: ${successCount} sent, ${failCount} failed`);
        
        return {
            success: true,
            sent: successCount,
            failed: failCount,
            total: employeeData.records.length
        };
        
    } catch (error) {
        console.error('Error sending announcement SMS:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

module.exports = {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendAnnouncementSMS
};
