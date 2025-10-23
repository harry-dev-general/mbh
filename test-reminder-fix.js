// Test script for reminder scheduler fix
const axios = require('axios');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';

async function verifyReminderFix() {
    console.log('Testing reminder scheduler fix...\n');
    
    try {
        // Fetch the test booking
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    filterByFormula: `{Customer Name} = "Test Booking"`,
                    maxRecords: 1
                }
            }
        );
        
        const bookings = response.data.records;
        if (bookings.length === 0) {
            console.log('❌ Test booking not found');
            return;
        }
        
        const booking = bookings[0];
        const fields = booking.fields;
        
        console.log('📋 Test Booking Details:');
        console.log(`   Customer: ${fields['Customer Name']}`);
        console.log(`   Start Time: ${fields['Start Time']} → Onboarding: ${fields['Onboarding Time']}`);
        console.log(`   Finish Time: ${fields['Finish Time']} → Deloading: ${fields['Deloading Time']}`);
        console.log(`   Onboarding Reminder Sent: ${fields['Onboarding Reminder Sent'] ? '✅' : '❌'}`);
        console.log(`   Deloading Reminder Sent: ${fields['Deloading Reminder Sent'] ? '✅' : '❌'}`);
        
        if (fields['Deloading Reminder Sent']) {
            console.log(`   Deloading marked sent at: ${fields['Deloading Reminder Sent Date']}`);
        }
        
        console.log('\n🔧 Fix Applied:');
        console.log('   - Reminders now marked as sent AFTER successful SMS delivery');
        console.log('   - If SMS fails, reminder won\'t be marked as sent');
        console.log('   - Scheduler will retry on next cycle if no SMS sent');
        
        // Check if we need to clear the deloading reminder flag for testing
        if (fields['Deloading Reminder Sent'] && !fields['Deloading Reminder Sent Date']) {
            console.log('\n⚠️  Warning: Deloading reminder marked as sent but no date recorded');
            console.log('   This suggests the reminder was marked without actually being sent');
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run the test
verifyReminderFix();
