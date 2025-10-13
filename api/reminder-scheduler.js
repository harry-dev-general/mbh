// Reminder Scheduler Module
// Sends automatic reminder SMS every 6 hours for pending shift allocations

const axios = require('axios');
const notifications = require('./notifications');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I';
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Reminder intervals
const REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
const MAX_REMINDER_AGE_MS = 72 * 60 * 60 * 1000; // Stop after 72 hours

// Track reminders sent (in production, store in Airtable)
const reminderTracker = new Map();

/**
 * Get a unique key for tracking reminders
 */
function getReminderKey(type, id, role = null) {
    return role ? `${type}-${id}-${role}` : `${type}-${id}`;
}

/**
 * Check if a reminder should be sent
 */
function shouldSendReminder(key, createdAt) {
    const now = Date.now();
    const age = now - new Date(createdAt).getTime();
    
    // Don't send reminders for allocations older than 72 hours
    if (age > MAX_REMINDER_AGE_MS) {
        return false;
    }
    
    // Check last reminder time
    const lastReminder = reminderTracker.get(key);
    if (!lastReminder) {
        // First reminder - wait at least 6 hours after initial allocation
        return age >= REMINDER_INTERVAL_MS;
    }
    
    // Subsequent reminders - check if 6 hours have passed
    return (now - lastReminder) >= REMINDER_INTERVAL_MS;
}

/**
 * Process pending shift allocations
 */
async function processPendingAllocations() {
    try {
        console.log('🔍 Checking for pending allocations needing reminders...');
        
        // Get allocations from the last 72 hours that are still pending
        const cutoffDate = new Date(Date.now() - MAX_REMINDER_AGE_MS);
        
        // Fetch ALL allocations and filter client-side (more reliable than filterByFormula)
        let allAllocations = [];
        let offset = null;
        
        do {
            let url = `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}?pageSize=100`;
            if (offset) {
                url += `&offset=${offset}`;
            }
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            });
            
            allAllocations = allAllocations.concat(response.data.records || []);
            offset = response.data.offset;
            
        } while (offset);
        
        // Filter client-side for pending status and creation date
        const pendingAllocations = allAllocations.filter(record => {
            // Check response status
            const responseStatus = record.fields['Response Status'];
            const isPending = !responseStatus || responseStatus === '' || responseStatus === 'Pending';
            if (!isPending) return false;
            
            // Check creation date
            const created = record.fields['Created'] || record.createdTime;
            if (!created) return false;
            
            const createdDate = new Date(created);
            return createdDate > cutoffDate;
        });
        
        console.log(`Found ${pendingAllocations.length} pending shift allocations from last 72 hours (out of ${allAllocations.length} total pending)`);
        
        // Process each pending allocation
        for (const allocation of pendingAllocations) {
            const key = getReminderKey('allocation', allocation.id);
            const created = allocation.fields['Created'] || allocation.createdTime;
            
            if (shouldSendReminder(key, created)) {
                await sendAllocationReminder(allocation);
                reminderTracker.set(key, Date.now());
            }
        }
        
    } catch (error) {
        console.error('Error processing pending allocations:', error);
    }
}

/**
 * Process pending booking allocations
 */
async function processPendingBookings() {
    try {
        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch ALL paid bookings and filter client-side (more reliable than filterByFormula)
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
        
        // Filter client-side for PAID bookings with pending assignments and future dates
        const pendingBookings = allBookings.filter(record => {
            const fields = record.fields;
            
            // Check booking status
            if (fields['Booking Status'] !== 'PAID') return false;
            
            // Check if booking date is in the future
            const bookingDate = fields['Booking Date'];
            if (!bookingDate) return false;
            
            const bookingDateObj = new Date(bookingDate + 'T00:00:00');
            if (bookingDateObj <= today) return false;
            
            // Check if there are pending staff assignments
            const hasOnboardingPending = fields['Onboarding Employee']?.length && 
                (!fields['Onboarding Response'] || fields['Onboarding Response'] === 'Pending');
            
            const hasDeloadingPending = fields['Deloading Employee']?.length && 
                (!fields['Deloading Response'] || fields['Deloading Response'] === 'Pending');
            
            return hasOnboardingPending || hasDeloadingPending;
        });
        
        console.log(`Found ${pendingBookings.length} bookings with pending staff responses (out of ${allBookings.length} total bookings)`);
        
        // Process each booking
        for (const booking of pendingBookings) {
            const fields = booking.fields;
            const created = fields['Created'] || booking.createdTime;
            
            // Check onboarding
            if (fields['Onboarding Employee']?.length && 
                (!fields['Onboarding Response'] || fields['Onboarding Response'] === 'Pending')) {
                
                const key = getReminderKey('booking', booking.id, 'Onboarding');
                if (shouldSendReminder(key, created)) {
                    await sendBookingReminder(booking, 'Onboarding');
                    reminderTracker.set(key, Date.now());
                }
            }
            
            // Check deloading
            if (fields['Deloading Employee']?.length && 
                (!fields['Deloading Response'] || fields['Deloading Response'] === 'Pending')) {
                
                const key = getReminderKey('booking', booking.id, 'Deloading');
                if (shouldSendReminder(key, created)) {
                    await sendBookingReminder(booking, 'Deloading');
                    reminderTracker.set(key, Date.now());
                }
            }
        }
        
    } catch (error) {
        console.error('Error processing pending bookings:', error);
    }
}

/**
 * Send reminder for a shift allocation
 */
async function sendAllocationReminder(allocation) {
    try {
        const fields = allocation.fields;
        const employeeId = fields['Employee']?.[0];
        
        if (!employeeId) return;
        
        // Get employee details
        const employeeResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${employeeId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const employee = employeeResponse.data.fields;
        const phone = employee['Phone'] || employee['Mobile'] || employee['Mobile Number'];
        
        if (!phone) {
            console.log(`No phone number for employee ${employee['Name']}`);
            return;
        }
        
        // Calculate hours until shift
        const shiftDateTime = new Date(`${fields['Shift Date']}T${fields['Start Time']}`);
        const hoursUntilShift = Math.floor((shiftDateTime - Date.now()) / (1000 * 60 * 60));
        
        // Send reminder
        await notifications.sendShiftReminder({
            employeePhone: phone,
            employeeName: employee['Name'] || employee['First Name'],
            allocationId: allocation.id,
            employeeId: employeeId,
            shiftDate: fields['Shift Date'],
            startTime: fields['Start Time'],
            hoursUntilShift: hoursUntilShift > 0 ? hoursUntilShift : 'soon'
        });
        
        console.log(`📤 Sent reminder to ${employee['Name']} for shift on ${fields['Shift Date']}`);
        
    } catch (error) {
        console.error('Error sending allocation reminder:', error);
    }
}

/**
 * Send reminder for a booking allocation
 */
async function sendBookingReminder(booking, role) {
    try {
        const fields = booking.fields;
        const employeeField = `${role} Employee`;
        const employeeId = fields[employeeField]?.[0];
        
        if (!employeeId) return;
        
        // Get employee details
        const employeeResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${EMPLOYEES_TABLE_ID}/${employeeId}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const employee = employeeResponse.data.fields;
        const phone = employee['Phone'] || employee['Mobile'] || employee['Mobile Number'];
        
        if (!phone) {
            console.log(`No phone number for employee ${employee['Name']}`);
            return;
        }
        
        // Get times based on role
        const startTime = role === 'Onboarding' 
            ? (fields['Onboarding Time'] || fields['Start Time'])
            : (fields['Deloading Time'] || fields['Finish Time']);
            
        const endTime = role === 'Onboarding'
            ? fields['Start Time']
            : fields['Deloading Time'];
        
        // Send reminder as a booking allocation
        await notifications.sendShiftNotification({
            employeePhone: phone,
            employeeName: employee['Name'] || employee['First Name'],
            allocationId: booking.id,
            employeeId: employeeId,
            shiftType: `${role} - ${fields['Customer Name']}`,
            shiftDate: fields['Booking Date'],
            startTime: startTime,
            endTime: endTime,
            customerName: fields['Customer Name'],
            role: role,
            isBookingAllocation: true,
            notes: `REMINDER: Please confirm your availability for this ${role.toLowerCase()} assignment.`
        });
        
        console.log(`📤 Sent ${role} reminder to ${employee['Name']} for ${fields['Customer Name']} on ${fields['Booking Date']}`);
        
    } catch (error) {
        console.error(`Error sending booking reminder for ${role}:`, error);
    }
}

/**
 * Main reminder check function
 */
async function checkAndSendReminders() {
    console.log(`\n⏰ Running reminder check at ${new Date().toLocaleString('en-AU')}`);
    
    try {
        // Process both types of allocations
        await processPendingAllocations();
        await processPendingBookings();
        
        // Clean up old entries from tracker
        const now = Date.now();
        for (const [key, timestamp] of reminderTracker.entries()) {
            if (now - timestamp > MAX_REMINDER_AGE_MS) {
                reminderTracker.delete(key);
            }
        }
        
        console.log(`✅ Reminder check complete. Tracker size: ${reminderTracker.size}`);
        
    } catch (error) {
        console.error('Error in reminder check:', error);
    }
}

/**
 * Start the reminder scheduler
 */
function startReminderScheduler() {
    console.log('🚀 Starting reminder scheduler...');
    console.log(`   - Checking every ${CHECK_INTERVAL_MS / 1000 / 60} minutes`);
    console.log(`   - Sending reminders every ${REMINDER_INTERVAL_MS / 1000 / 60 / 60} hours for pending allocations`);
    console.log(`   - Stopping reminders after ${MAX_REMINDER_AGE_MS / 1000 / 60 / 60} hours`);
    
    // Run initial check
    checkAndSendReminders();
    
    // Schedule regular checks
    setInterval(checkAndSendReminders, CHECK_INTERVAL_MS);
}

/**
 * Stop the reminder scheduler (for testing)
 */
function stopReminderScheduler() {
    if (global.reminderInterval) {
        clearInterval(global.reminderInterval);
        console.log('🛑 Reminder scheduler stopped');
    }
}

module.exports = {
    startReminderScheduler,
    stopReminderScheduler,
    checkAndSendReminders,
    // Export for testing
    shouldSendReminder,
    reminderTracker
};
