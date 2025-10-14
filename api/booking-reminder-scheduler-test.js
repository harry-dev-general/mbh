// Test script for booking reminder scheduler
// Run this to test the booking reminder system

const bookingReminderScheduler = require('./booking-reminder-scheduler');

console.log('🧪 Testing Booking Reminder Scheduler...\n');

// Test immediate processing
console.log('Running immediate test...');
bookingReminderScheduler.processBookingReminders()
    .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
