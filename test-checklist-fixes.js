const fetch = require('node-fetch');

const BASE_URL = 'https://mbh-production-f0d1.up.railway.app';

async function testChecklistFixes() {
    console.log('Testing checklist fixes...\n');
    
    // Test data
    const bookingId = 'recyCccPfpGVwp1gB';
    const staffId = 'recdInFO4p3ennWpe';
    
    try {
        // Test 1: Check if booking has vessel information
        console.log('1. Fetching booking to verify vessel information...');
        const bookingResponse = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (bookingResponse.ok) {
            const booking = await bookingResponse.json();
            console.log(`   ✓ Booking found: ${booking.fields['Customer Name']}`);
            console.log(`   ✓ Vessel (Boat field): ${booking.fields['Boat'] ? booking.fields['Boat'][0] : 'Not set'}`);
        } else {
            console.log(`   ✗ Failed to fetch booking: ${bookingResponse.status}`);
        }
        
        // Test 2: Submit a test checklist to verify all fields are mapped correctly
        console.log('\n2. Submitting test checklist...');
        const checklistData = {
            bookingId: bookingId,
            checklistType: 'Post-Departure',
            submittedBy: 'Test User',
            data: {
                // Staff info
                staffName: 'Test Staff',
                staffPhone: '+61400000000',
                employeeId: staffId,
                
                // Resource levels
                fuelLevelAfter: 'Three Quarters',
                gasLevelAfter: 'Half',
                waterLevelAfter: 'Full',
                
                // GPS data (simulated)
                gpsLatitude: '-33.8688',
                gpsLongitude: '151.2093',
                locationAddress: 'Sydney Harbour, NSW', // This would normally come from OpenStreetMap
                locationAccuracy: '10',
                
                // Cleanliness
                toiletPumped: true,
                vessel_cleaned: true,
                bbqCleaned: true,
                deckCleaned: true,
                rubbishRemoved: true,
                
                // Equipment
                equipment_returned: true,
                itemsLeft: false,
                
                // Condition
                overallConditionAfter: 'Good - Ready for Next Booking',
                no_damage: true,
                
                // Refills
                fuel_topped: true,
                gasReplaced: false,
                waterRefilled: false,
                
                // Notes
                notes: 'Test submission with all fixes applied'
            }
        };
        
        const submitResponse = await fetch(`${BASE_URL}/api/checklist-submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checklistData)
        });
        
        if (submitResponse.ok) {
            const result = await submitResponse.json();
            console.log('   ✓ Checklist submitted successfully');
            
            // Give it a moment to save
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test 3: Verify the checklist was saved with all fields
            console.log('\n3. Verifying saved checklist fields...');
            console.log('   Please check Airtable to verify:');
            console.log('   - Checklist ID is generated (format: POST-YYYYMMDDHHMMSS-XXXX)');
            console.log('   - Vessel field is linked to the boat from the booking');
            console.log('   - Staff Member field is linked');
            console.log('   - Location Address is populated');
            console.log('   - All other fields are correctly mapped');
            
        } else {
            const error = await submitResponse.text();
            console.log(`   ✗ Failed to submit checklist: ${submitResponse.status}`);
            console.log(`   Error: ${error}`);
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the test
testChecklistFixes();
