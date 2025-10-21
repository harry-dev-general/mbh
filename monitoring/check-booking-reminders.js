#!/usr/bin/env node

// Script to check the current status of booking reminders
// Usage: node check-booking-reminders.js

const axios = require('axios');

const PRODUCTION_URL = 'https://mbh-production-f0d1.up.railway.app';
const ADMIN_KEY = 'mbh-admin-2025';

async function checkBookingReminderStatus() {
    console.log('🔍 Checking MBH Booking Reminder System Status...\n');
    
    try {
        // Check current status
        console.log('📊 Fetching current status...');
        const statusResponse = await axios.get(
            `${PRODUCTION_URL}/api/admin/booking-reminder-status`,
            {
                headers: {
                    'X-Admin-Key': ADMIN_KEY
                }
            }
        );
        
        const status = statusResponse.data;
        console.log('\n✅ System Status Retrieved:');
        console.log('━'.repeat(50));
        
        // Display bookings
        if (status.bookings && status.bookings.length > 0) {
            console.log(`\n📅 Today's Bookings (${status.bookings.length} total):\n`);
            
            status.bookings.forEach((booking, index) => {
                console.log(`${index + 1}. ${booking['Customer Name']}`);
                console.log(`   Status: ${booking.Status}`);
                console.log(`   Vessel: ${booking.Vessel || booking['Booked Boat Type'] || 'TBD'}`);
                console.log(`   Start Time: ${booking['Start Time'] || 'Not set'}`);
                console.log(`   Finish Time: ${booking['Finish Time'] || 'Not set'}`);
                console.log(`   Onboarding Time: ${booking['Onboarding Time'] || 'Not set'}`);
                console.log(`   Deloading Time: ${booking['Deloading Time'] || 'Not set'}`);
                
                // Check reminder status
                console.log(`   📱 Reminder Status:`);
                console.log(`      - Onboarding Sent: ${booking['Onboarding Reminder Sent'] ? '✅' : '❌'} ${booking['Onboarding Reminder Sent Date'] || ''}`);
                console.log(`      - Deloading Sent: ${booking['Deloading Reminder Sent'] ? '✅' : '❌'} ${booking['Deloading Reminder Sent Date'] || ''}`);
                
                // Show assigned staff
                if (booking['Onboarding Employee Names']) {
                    console.log(`   👤 Onboarding Staff: ${booking['Onboarding Employee Names']}`);
                }
                if (booking['Deloading Employee Names']) {
                    console.log(`   👤 Deloading Staff: ${booking['Deloading Employee Names']}`);
                }
                
                console.log('');
            });
        } else {
            console.log('\n📅 No bookings found for today.');
        }
        
        // Display full-time staff
        if (status.fullTimeStaff && status.fullTimeStaff.length > 0) {
            console.log(`\n👥 Full-Time Staff (${status.fullTimeStaff.length}):`);
            status.fullTimeStaff.forEach(staff => {
                console.log(`   - ${staff.Name} (${staff.Phone || staff.Mobile || 'No phone'})`);
            });
        }
        
        // Display current time
        console.log(`\n🕐 Current Sydney Time: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`);
        
        // Check for upcoming reminders
        console.log('\n⏰ Upcoming Reminders:');
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        let upcomingFound = false;
        status.bookings?.forEach(booking => {
            // Check onboarding
            if (booking['Onboarding Time'] && !booking['Onboarding Reminder Sent']) {
                const timeMatch = booking['Onboarding Time'].match(/(\d+):(\d+)\s*(AM|PM)/);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    if (timeMatch[3] === 'PM' && hours !== 12) hours += 12;
                    if (timeMatch[3] === 'AM' && hours === 12) hours = 0;
                    const targetMinutes = hours * 60 + minutes;
                    
                    if (targetMinutes > currentMinutes) {
                        console.log(`   - ${booking['Customer Name']} onboarding at ${booking['Onboarding Time']}`);
                        upcomingFound = true;
                    }
                }
            }
            
            // Check deloading
            if (booking['Deloading Time'] && !booking['Deloading Reminder Sent']) {
                const timeMatch = booking['Deloading Time'].match(/(\d+):(\d+)\s*(AM|PM)/);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    if (timeMatch[3] === 'PM' && hours !== 12) hours += 12;
                    if (timeMatch[3] === 'AM' && hours === 12) hours = 0;
                    const targetMinutes = hours * 60 + minutes;
                    
                    if (targetMinutes > currentMinutes) {
                        console.log(`   - ${booking['Customer Name']} deloading at ${booking['Deloading Time']}`);
                        upcomingFound = true;
                    }
                }
            }
        });
        
        if (!upcomingFound) {
            console.log('   No upcoming reminders for today.');
        }
        
    } catch (error) {
        console.error('\n❌ Error checking status:', error.response?.data || error.message);
        
        if (error.response?.status === 502) {
            console.log('\n⚠️  The server appears to be restarting after deployment.');
            console.log('Please wait a few moments and try again.');
        }
    }
}

// Run the check
checkBookingReminderStatus();
