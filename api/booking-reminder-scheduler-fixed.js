// Booking Time-Based SMS Reminder Scheduler - FIXED VERSION
// Sends SMS reminders at Onboarding Time and Deloading Time
// To: Assigned staff + all Full Time staff (Max & Joshua)
// FIXED: Uses Airtable fields for tracking instead of in-memory storage

const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Time windows for sending reminders (in minutes)
const ONBOARDING_REMINDER_WINDOW = 2; // Send within 2 minute window
const DELOADING_REMINDER_WINDOW = 2; // Send within 2 minute window
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute for precision

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
 * Check if reminder should be sent based on Airtable fields
 * @param {Object} booking - Airtable booking record
 * @param {string} type - 'onboarding' or 'deloading'
 * @returns {boolean}
 */
function shouldSendReminder(booking, type) {
    const fields = booking.fields;
    
    // Check if already sent
    if (type === 'onboarding') {
        if (fields['Onboarding Reminder Sent']) {
            console.log(`   Onboarding reminder already sent at ${fields['Onboarding Reminder Sent Date']}`);
            return false;
        }
        
        // Check time window
        const targetTime = fields['Onboarding Time'];
        if (!targetTime) return false;
        
        const targetMinutes = parseTimeToMinutes(targetTime);
        if (targetMinutes === null) return false;
        
        const currentMinutes = getCurrentMinutes();
        const timeDiff = Math.abs(currentMinutes - targetMinutes);
        
        console.log(`⏰ Time check for onboarding reminder:`);
        console.log(`   Target time: ${targetTime} (${targetMinutes} minutes)`);
        console.log(`   Current time: ${Math.floor(currentMinutes/60)}:${String(currentMinutes%60).padStart(2,'0')} (${currentMinutes} minutes)`);
        console.log(`   Time difference: ${timeDiff} minutes`);
        console.log(`   Will send: ${timeDiff <= ONBOARDING_REMINDER_WINDOW}`);
        
        return timeDiff <= ONBOARDING_REMINDER_WINDOW;
        
    } else if (type === 'deloading') {
        if (fields['Deloading Reminder Sent']) {
            console.log(`   Deloading reminder already sent at ${fields['Deloading Reminder Sent Date']}`);
            return false;
        }
        
        // Check time window
        const targetTime = fields['Deloading Time'];
        if (!targetTime) return false;
        
        const targetMinutes = parseTimeToMinutes(targetTime);
        if (targetMinutes === null) return false;
        
        const currentMinutes = getCurrentMinutes();
        const timeDiff = Math.abs(currentMinutes - targetMinutes);
        
        console.log(`⏰ Time check for deloading reminder:`);
        console.log(`   Target time: ${targetTime} (${targetMinutes} minutes)`);
        console.log(`   Current time: ${Math.floor(currentMinutes/60)}:${String(currentMinutes%60).padStart(2,'0')} (${currentMinutes} minutes)`);
        console.log(`   Time difference: ${timeDiff} minutes`);
        console.log(`   Will send: ${timeDiff <= DELOADING_REMINDER_WINDOW}`);
        
        return timeDiff <= DELOADING_REMINDER_WINDOW;
    }
    
    return false;
}

/**
 * Mark reminder as sent in Airtable
 * @param {string} bookingId - Booking record ID
 * @param {string} type - 'onboarding' or 'deloading'
 */
async function markReminderSent(bookingId, type) {
    try {
        const fields = {};
        if (type === 'onboarding') {
            fields['Onboarding Reminder Sent'] = true;
            fields['Onboarding Reminder Sent Date'] = new Date().toISOString();
        } else if (type === 'deloading') {
            fields['Deloading Reminder Sent'] = true;
            fields['Deloading Reminder Sent Date'] = new Date().toISOString();
        }
        
        const response = await axios.patch(
            `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}/${bookingId}`,
            { fields },
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Marked ${type} reminder as sent for booking ${bookingId}`);
        return true;
        
    } catch (error) {
        console.error(`Error marking ${type} reminder as sent:`, error.response?.data || error.message);
        return false;
    }
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
        console.error('Error fetching employee:', error);
        return null;
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
        const fromNumber = process.env.TWILIO_FROM_NUMBER || '+61428396714';
        
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        
        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            new URLSearchParams({
                'To': phone,
                'From': fromNumber,
                'Body': message
            }),
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log(`📤 Sent onboarding reminder to ${recipientStaff.fields['Name']} for ${fields['Customer Name']}`);
        console.log(`   Message SID: ${response.data.sid}`);
        
    } catch (error) {
        console.error('Error sending onboarding reminder:', error.response?.data || error.message);
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
        // Send SMS using Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER || '+61428396714';
        
        const response = await axios({
            method: 'POST',
            url: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            auth: {
                username: accountSid,
                password: authToken
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: new URLSearchParams({
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
 * @param {boolean} forceImmediate - Force send all reminders immediately for testing
 */
async function processBookingReminders(forceImmediate = false) {
    try {
        const bookings = await getTodaysBookings();
        const fullTimeStaff = await getFullTimeStaff();
        
        console.log(`Found ${bookings.length} bookings today, ${fullTimeStaff.length} full-time staff`);
        
        // Log current Sydney time for debugging
        const now = new Date();
        const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        console.log(`Current Sydney time: ${sydneyTime.toLocaleTimeString('en-AU')}`);
        
        if (forceImmediate) {
            console.log('⚡ FORCE IMMEDIATE MODE - Sending all reminders regardless of time');
        }
        
        for (const booking of bookings) {
            const fields = booking.fields;
            
            console.log(`\n📋 Checking booking ${fields['Customer Name']}:`);
            console.log(`   Onboarding Time: ${fields['Onboarding Time']}`);
            console.log(`   Deloading Time: ${fields['Deloading Time']}`);
            
            // Check onboarding reminders
            if (fields['Onboarding Time'] && 
                (forceImmediate || shouldSendReminder(booking, 'onboarding'))) {
                
                // Mark as sent FIRST to prevent duplicates
                const marked = await markReminderSent(booking.id, 'onboarding');
                
                if (marked) {
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
                }
            }
            
            // Check deloading reminders
            if (fields['Deloading Time'] && 
                (forceImmediate || shouldSendReminder(booking, 'deloading'))) {
                
                // Mark as sent FIRST to prevent duplicates
                const marked = await markReminderSent(booking.id, 'deloading');
                
                if (marked) {
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
                }
            }
        }
        
    } catch (error) {
        console.error('Error processing booking reminders:', error);
    }
}

// Scheduler management
let schedulerInterval = null;

/**
 * Start the booking reminder scheduler
 */
function startBookingReminderScheduler() {
    console.log('🚀 Starting booking reminder scheduler (FIXED VERSION with Airtable tracking)...');
    console.log('   - Using Airtable fields instead of in-memory tracking');
    console.log('   - Prevents duplicates across multiple instances');
    
    // Run immediately on startup
    processBookingReminders();
    
    // Then run on interval
    schedulerInterval = setInterval(() => {
        console.log('\n⏰ Running booking reminder check...');
        processBookingReminders();
    }, CHECK_INTERVAL_MS);
}

/**
 * Stop the booking reminder scheduler
 */
function stopBookingReminderScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('🛑 Booking reminder scheduler stopped');
    }
}

// Export functions
module.exports = {
    startBookingReminderScheduler,
    stopBookingReminderScheduler,
    processBookingReminders
};
