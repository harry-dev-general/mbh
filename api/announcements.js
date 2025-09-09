// Announcements API Handler
// Manages announcements creation, updates, deletion, and SMS notifications

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

        const response = await fetch(url,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Airtable error:', response.status, errorText);
            throw new Error(`Failed to fetch announcements: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return {
            success: true,
            announcements: data.records
        };
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return {
            success: false,
            error: error.message
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
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'Title': title,
                        'Message': message,
                        'Priority': priority || 'Low',
                        ...(expiryDate ? { 'Expiry Date': expiryDate } : {}),
                        'Posted By': postedBy,
                        'SMS Sent': false
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Airtable create error:', response.status, errorText);
            throw new Error(`Failed to create announcement: ${response.status} ${errorText}`);
        }

        const announcement = await response.json();

        // Send SMS if requested
        if (sendSMS) {
            await sendAnnouncementSMS(title, message, priority);
            
            // Update record to mark SMS as sent
            await updateAnnouncement(announcement.id, { 'SMS Sent': true });
        }

        return {
            success: true,
            announcement
        };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update an announcement
 */
async function updateAnnouncement(id, updates) {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}/${id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: updates })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update announcement');
        }

        const announcement = await response.json();
        return {
            success: true,
            announcement
        };
    } catch (error) {
        console.error('Error updating announcement:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete an announcement
 */
async function deleteAnnouncement(id) {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}/${id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete announcement');
        }

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return {
            success: false,
            error: error.message
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
        
        const employeeResponse = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}?` +
            `filterByFormula=${encodeURIComponent(`{Active Roster}=1`)}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!employeeResponse.ok) {
            const errorText = await employeeResponse.text();
            console.error('Employee fetch error:', errorText);
            throw new Error('Failed to fetch employee details');
        }

        const employeeData = await employeeResponse.json();
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
                            'To': phone,
                            'Body': smsMessage
                        })
                    }
                );

                if (response.ok) {
                    successCount++;
                    console.log(`✅ SMS sent to ${name} (${phone})`);
                } else {
                    failCount++;
                    const error = await response.text();
                    console.error(`❌ Failed to send SMS to ${name}: ${error}`);
                }
            } catch (error) {
                failCount++;
                console.error(`❌ Error sending SMS to ${name}:`, error);
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
        console.error('Error sending announcement SMS:', error);
        return {
            success: false,
            error: error.message
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
