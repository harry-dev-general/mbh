const axios = require('axios');

// Test booking IDs - replace with actual IDs from your Airtable
const TEST_BOOKING_ID = 'recIxHJdpQfoSsaeT';

// Base URL - adjust for local or production testing
const BASE_URL = 'https://mbh-production-f0d1.up.railway.app';

async function testChecklistRendering() {
    console.log('🧪 Testing restored checklist functionality...\n');
    
    // Test Pre-Departure Checklist
    try {
        console.log('📋 Testing Pre-Departure Checklist:');
        const preDepResponse = await axios.get(`${BASE_URL}/checklist/pre-departure-ssr.html?bookingId=${TEST_BOOKING_ID}`);
        
        // Check for new fields in the HTML
        const preDepHtml = preDepResponse.data;
        const preDepChecks = {
            'Fuel Level Select': preDepHtml.includes('id="fuelLevel"'),
            'Gas Level Select': preDepHtml.includes('id="gasLevel"'),
            'Water Level Select': preDepHtml.includes('id="waterLevel"'),
            'Life Jackets Number Input': preDepHtml.includes('id="lifeJackets"'),
            'BBQ Cleaned Checkbox': preDepHtml.includes('id="bbqCleaned"'),
            'Toilet Cleaned Checkbox': preDepHtml.includes('id="toiletCleaned"'),
            'Deck Washed Checkbox': preDepHtml.includes('id="deckWashed"'),
            'Overall Condition Select': preDepHtml.includes('id="overallCondition"'),
            'Notes Textarea': preDepHtml.includes('id="notes"')
        };
        
        console.log('Pre-Departure Checklist Fields:');
        Object.entries(preDepChecks).forEach(([field, found]) => {
            console.log(`  ${found ? '✅' : '❌'} ${field}`);
        });
        
    } catch (error) {
        console.error('❌ Pre-Departure test failed:', error.response?.status, error.message);
    }
    
    console.log('\n');
    
    // Test Post-Departure Checklist
    try {
        console.log('📋 Testing Post-Departure Checklist:');
        const postDepResponse = await axios.get(`${BASE_URL}/checklist/post-departure-ssr.html?bookingId=${TEST_BOOKING_ID}`);
        
        // Check for new fields in the HTML
        const postDepHtml = postDepResponse.data;
        const postDepChecks = {
            'Fuel Level After Select': postDepHtml.includes('id="fuelLevelAfter"'),
            'Gas Level After Select': postDepHtml.includes('id="gasLevelAfter"'),
            'Water Level After Select': postDepHtml.includes('id="waterLevelAfter"'),
            'GPS Location Button': postDepHtml.includes('id="captureLocationBtn"'),
            'GPS Latitude Hidden': postDepHtml.includes('id="gpsLatitude"'),
            'GPS Longitude Hidden': postDepHtml.includes('id="gpsLongitude"'),
            'Location Address Hidden': postDepHtml.includes('id="locationAddress"'),
            'Toilet Pumped Checkbox': postDepHtml.includes('id="toiletPumped"'),
            'Rubbish Removed Checkbox': postDepHtml.includes('id="rubbishRemoved"'),
            'Overall Condition After Select': postDepHtml.includes('id="overallConditionAfter"'),
            'GPS Capture Function': postDepHtml.includes('function captureLocation()')
        };
        
        console.log('Post-Departure Checklist Fields:');
        Object.entries(postDepChecks).forEach(([field, found]) => {
            console.log(`  ${found ? '✅' : '❌'} ${field}`);
        });
        
    } catch (error) {
        console.error('❌ Post-Departure test failed:', error.response?.status, error.message);
    }
    
    console.log('\n✨ Testing complete!');
}

// Run the test
testChecklistRendering().catch(console.error);
