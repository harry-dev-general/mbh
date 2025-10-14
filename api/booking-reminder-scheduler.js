// Booking Time-Based SMS Reminder Scheduler
// Sends SMS reminders at Onboarding Time and Deloading Time
// To: Assigned staff + all Full Time staff (Max & Joshua)

const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Time windows for sending reminders (in minutes)
const ONBOARDING_REMINDER_WINDOW = 0; // Send exactly at Onboarding Time
const DELOADING_REMINDER_WINDOW = 0; // Send exactly at Deloading Time
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute for precision

// Track sent reminders in memory (will reset on restart - consider persistent storage)
const sentReminders = new Map(); // Key: `${bookingId}-${type}-${date}`, Value: timestamp

/**
 * Parse time string to minutes since midnight
 * @param {string} timeStr - Time string in format "HH:MM AM/PM"
 * @returns {number} - Minutes since midnight
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    
    try {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(n => parseInt(n));
        
        let totalMinutes = minutes || 0;
        let adjustedHours = hours;
        
        if (period === 'PM' && hours !== 12) {
            adjustedHours += 12;
        } else if (period === 'AM' && hours === 12) {
            adjustedHours = 0;
        }
        
        totalMinutes += adjustedHours * 60;
        return totalMinutes;
    } catch (error) {
        console.error('Error parsing time:', timeStr, error);
        return null;
    }
}

/**
 * Get current time in minutes since midnight (Sydney timezone)
 */
function getCurrentMinutes() {
    const now = new Date();
    const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    return sydneyTime.getHours() * 60 + sydneyTime.getMinutes();
}

/**
 * Check if reminder should be sent for a specific time
 * @param {string} targetTime - Target time string
 * @param {string} bookingId - Booking ID
 * @param {string} type - 'onboarding' or 'deloading'
 * @param {string} bookingDate - Booking date
 * @returns {boolean}
 */
function shouldSendReminder(targetTime, bookingId, type, bookingDate) {
    if (!targetTime) return false;
    
    const targetMinutes = parseTimeToMinutes(targetTime);
    if (targetMinutes === null) return false;
    
    const currentMinutes = getCurrentMinutes();
    const reminderKey = `${bookingId}-${type}-${bookingDate}`;
    
    // Check if already sent today
    if (sentReminders.has(reminderKey)) {
        const sentTime = sentReminders.get(reminderKey);
        const hoursSinceSent = (Date.now() - sentTime) / (1000 * 60 * 60);
        if (hoursSinceSent < 20) { // Don't resend within 20 hours
            return false;
        }
    }
    
    // Check if current time matches target time (within 2 minute window)
    const timeDiff = Math.abs(currentMinutes - targetMinutes);
    console.log(`⏰ Time check for ${type} reminder:`);
    console.log(`   Target time: ${targetTime} (${targetMinutes} minutes)`);  
    console.log(`   Current time: ${Math.floor(currentMinutes/60)}:${String(currentMinutes%60).padStart(2,'0')} (${currentMinutes} minutes)`);
    console.log(`   Time difference: ${timeDiff} minutes`);
    console.log(`   Will send: ${timeDiff <= 2}`);
    
    return timeDiff <= 2;
}

/**
 * Get all Full Time staff members
 */
async function getFullTimeStaff() {
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}`,
            {
                params: {
                    filterByFormula: `{Staff Type} = 'Full Time'`
                },
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        return response.data.records || [];
    } catch (error) {
        console.error('Error fetching full time staff:', error);
        return [];
    }
}

/**
 * Get today's bookings
 */
async function getTodaysBookings() {
    try {
        const today = new Date();
        const sydneyDate = new Date(today.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        const dateStr = sydneyDate.toISOString().split('T')[0];
        
        // Fetch all bookings and filter client-side (more reliable)
        let allBookings = [];
        let offset = null;
        
        do {
            let url = `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}?pageSize=100`;
            if (offset) {
                url += `&offset=${offset}`;
            }
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            });
            
            allBookings = allBookings.concat(response.data.records || []);
            offset = response.data.offset;
            
        } while (offset);
        
        // Filter for today's bookings with valid status
        return allBookings.filter(record => {
            const bookingDate = record.fields['Booking Date'];
            const status = record.fields['Status'];
            
            return bookingDate === dateStr && 
                   (status === 'PAID' || status === 'PART' || status === 'Confirmed');
        });
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
}

/**
 * Send onboarding reminder SMS
 */
async function sendOnboardingReminder(booking, recipientStaff) {
    const fields = booking.fields;
    const phone = recipientStaff.fields['Phone'] || 
                  recipientStaff.fields['Mobile'] || 
                  recipientStaff.fields['Mobile Number'];
    
    if (!phone) {
        console.log(`No phone number for ${recipientStaff.fields['Name']}`);
        return;
    }
    
    // Generate checklist link with bookingId
    const baseUrl = process.env.BASE_URL || 
                    (process.env.RAILWAY_ENVIRONMENT === 'development' 
                      ? 'https://mbh-development.up.railway.app' 
                      : 'https://mbh-production-f0d1.up.railway.app');
    const checklistLink = `${baseUrl}/training/pre-departure-checklist.html?bookingId=${booking.id}`;
    
    // Format message
    const message = `📅 MBH Onboarding Reminder

Customer: ${fields['Customer Name']}
Vessel: ${fields['Vessel'] || fields['Booked Boat Type'] || 'TBD'}
Boarding Time: ${fields['Start Time']}

${fields['Add-ons'] ? `Add-ons: ${fields['Add-ons']}\n` : ''}
Pre-Departure Checklist:
${checklistLink}

Please ensure vessel is ready before customer arrival.`;
    
    try {
        // Send SMS directly using Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        
        if (!accountSid || !authToken || !fromNumber) {
            console.error('Missing Twilio credentials');
            return;
        }
        
        // Use fetch to send SMS via Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const authString = `${accountSid}:${authToken}`;
        const encodedAuth = Buffer.from(authString).toString('base64');
        
        const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'To': phone,
                'From': fromNumber,
                'Body': message
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Twilio API error: ${error}`);
        }
        
        const result = await response.json();
        console.log(`📤 Sent onboarding reminder to ${recipientStaff.fields['Name']} for ${fields['Customer Name']}`);
        console.log(`   Message SID: ${result.sid}`);
        
    } catch (error) {
        console.error('Error sending onboarding reminder:', error);
    }
}

/**
 * Send deloading reminder SMS
 */
async function sendDeloadingReminder(booking, recipientStaff) {
    const fields = booking.fields;
    const phone = recipientStaff.fields['Phone'] || 
                  recipientStaff.fields['Mobile'] || 
                  recipientStaff.fields['Mobile Number'];
    
    if (!phone) {
        console.log(`No phone number for ${recipientStaff.fields['Name']}`);
        return;
    }
    
    // Generate checklist link with bookingId
    const baseUrl = process.env.BASE_URL || 
                    (process.env.RAILWAY_ENVIRONMENT === 'development' 
                      ? 'https://mbh-development.up.railway.app' 
                      : 'https://mbh-production-f0d1.up.railway.app');
    const checklistLink = `${baseUrl}/training/post-departure-checklist.html?bookingId=${booking.id}`;
    
    // Format message
    const message = `🏁 MBH Deloading Reminder

Customer: ${fields['Customer Name']}
Vessel: ${fields['Vessel'] || fields['Booked Boat Type'] || 'TBD'}
Finish Time: ${fields['Finish Time']}

Post-Departure Checklist:
${checklistLink}

Please prepare for customer return and complete vessel check.`;
    
    try {
        // Send SMS directly using Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;
        
        if (!accountSid || !authToken || !fromNumber) {
            console.error('Missing Twilio credentials');
            return;
        }
        
        // Use fetch to send SMS via Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const authString = `${accountSid}:${authToken}`;
        const encodedAuth = Buffer.from(authString).toString('base64');
        
        const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'To': phone,
                'From': fromNumber,
                'Body': message
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Twilio API error: ${error}`);
        }
        
        const result = await response.json();
        console.log(`📤 Sent deloading reminder to ${recipientStaff.fields['Name']} for ${fields['Customer Name']}`);
        console.log(`   Message SID: ${result.sid}`);
        
    } catch (error) {
        console.error('Error sending deloading reminder:', error);
    }
}

/**
 * Process bookings and send reminders
 */
async function processBookingReminders() {
    try {
        const bookings = await getTodaysBookings();
        const fullTimeStaff = await getFullTimeStaff();
        
        console.log(`Found ${bookings.length} bookings today, ${fullTimeStaff.length} full-time staff`);
        
        // Log current Sydney time for debugging
        const now = new Date();
        const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        console.log(`Current Sydney time: ${sydneyTime.toLocaleTimeString('en-AU')}`);
        
        for (const booking of bookings) {
            const fields = booking.fields;
            const bookingDate = fields['Booking Date'];
            
            // Check onboarding reminders
            console.log(`\n📋 Checking booking ${fields['Customer Name']}:`);
            console.log(`   Onboarding Time: ${fields['Onboarding Time']}`);
            console.log(`   Deloading Time: ${fields['Deloading Time']}`);
            
            if (fields['Onboarding Time'] && 
                shouldSendReminder(fields['Onboarding Time'], booking.id, 'onboarding', bookingDate)) {
                
                const recipients = new Set();
                
                // Add assigned onboarding staff
                if (fields['Onboarding Employee']?.length) {
                    for (const employeeId of fields['Onboarding Employee']) {
                        const employee = await getEmployeeById(employeeId);
                        if (employee) recipients.add(employee);
                    }
                }
                
                // Add all full-time staff
                fullTimeStaff.forEach(staff => recipients.add(staff));
                
                // Send reminders
                for (const recipient of recipients) {
                    await sendOnboardingReminder(booking, recipient);
                }
                
                // Mark as sent
                sentReminders.set(`${booking.id}-onboarding-${bookingDate}`, Date.now());
            }
            
            // Check deloading reminders
            if (fields['Deloading Time'] && 
                shouldSendReminder(fields['Deloading Time'], booking.id, 'deloading', bookingDate)) {
                
                const recipients = new Set();
                
                // Add assigned deloading staff
                if (fields['Deloading Employee']?.length) {
                    for (const employeeId of fields['Deloading Employee']) {
                        const employee = await getEmployeeById(employeeId);
                        if (employee) recipients.add(employee);
                    }
                }
                
                // Add all full-time staff
                fullTimeStaff.forEach(staff => recipients.add(staff));
                
                // Send reminders
                for (const recipient of recipients) {
                    await sendDeloadingReminder(booking, recipient);
                }
                
                // Mark as sent
                sentReminders.set(`${booking.id}-deloading-${bookingDate}`, Date.now());
            }
        }
        
    } catch (error) {
        console.error('Error processing booking reminders:', error);
    }
}

/**
 * Get employee by ID
 */
async function getEmployeeById(employeeId) {
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${employeeId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error(`Error fetching employee ${employeeId}:`, error);
        return null;
    }
}

/**
 * Clean up old reminder tracking entries
 */
function cleanupOldReminders() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [key, timestamp] of sentReminders.entries()) {
        if (timestamp < oneDayAgo) {
            sentReminders.delete(key);
        }
    }
}

/**
 * Start the booking reminder scheduler
 */
let reminderInterval = null;

function startBookingReminderScheduler() {
    console.log('🚀 Starting booking time-based reminder scheduler...');
    console.log(`   - Checking every ${CHECK_INTERVAL_MS / 1000} seconds`);
    console.log('   - Sending reminders at Onboarding Time and Deloading Time');
    console.log('   - Recipients: Assigned staff + all Full Time staff');
    
    // Run initial check
    processBookingReminders();
    
    // Schedule regular checks
    reminderInterval = setInterval(() => {
        processBookingReminders();
        
        // Cleanup old entries every hour
        if (new Date().getMinutes() === 0) {
            cleanupOldReminders();
        }
    }, CHECK_INTERVAL_MS);
}

/**
 * Stop the reminder scheduler
 */
function stopBookingReminderScheduler() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log('🛑 Booking reminder scheduler stopped');
    }
}

module.exports = {
    startBookingReminderScheduler,
    stopBookingReminderScheduler,
    processBookingReminders
};
