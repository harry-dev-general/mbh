// Announcements API Handler
// Manages announcements creation, updates, deletion, and SMS notifications

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const ANNOUNCEMENTS_TABLE_ID = 'tblAnnouncements'; // You'll need to create this table
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
        let filter = '';
        if (!includeExpired) {
            const today = new Date().toISOString().split('T')[0];
            filter = `OR({Expiry Date}='', {Expiry Date}>='${today}')`;
        }

        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ANNOUNCEMENTS_TABLE_ID}?` +
            `filterByFormula=${encodeURIComponent(filter)}&` +
            `sort[0][field]=Created Time&sort[0][direction]=desc`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch announcements');
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
                        'Priority': priority || 'low',
                        'Expiry Date': expiryDate || '',
                        'Posted By': postedBy,
                        'SMS Sent': false
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create announcement');
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
        // Get current week for roster lookup
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        const weekStart = monday.toISOString().split('T')[0];

        // Get staff on roster this week
        const rosterResponse = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ROSTER_TABLE_ID}?` +
            `filterByFormula=${encodeURIComponent(`{Week Starting}='${weekStart}'`)}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!rosterResponse.ok) {
            throw new Error('Failed to fetch roster');
        }

        const rosterData = await rosterResponse.json();
        const employeeIds = new Set();

        // Collect unique employee IDs from roster
        rosterData.records.forEach(record => {
            const employeeId = record.fields['Employee']?.[0];
            if (employeeId) {
                employeeIds.add(employeeId);
            }
        });

        // Get employee details for phone numbers
        const employeeFilter = `OR(${Array.from(employeeIds).map(id => `RECORD_ID()='${id}'`).join(',')})`;
        
        const employeeResponse = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEE_TABLE_ID}?` +
            `filterByFormula=${encodeURIComponent(employeeFilter)}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );

        if (!employeeResponse.ok) {
            throw new Error('Failed to fetch employee details');
        }

        const employeeData = await employeeResponse.json();
        
        // Prepare SMS message
        const priorityEmoji = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : 'ℹ️';
        const smsMessage = `${priorityEmoji} MBH Staff Announcement

${title.toUpperCase()}

${message}

Check your dashboard for more details.`;

        // Send SMS to each staff member
        const authString = `${TWILIO_SID}:${TWILIO_TOKEN}`;
        const encodedAuth = Buffer.from(authString).toString('base64');

        let successCount = 0;
        let failCount = 0;

        for (const employee of employeeData.records) {
            const phone = employee.fields['Mobile Number'];
            const name = employee.fields['Name'];
            
            if (!phone) {
                console.log(`No phone number for ${name}`);
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
            total: employeeIds.size
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
