/**
 * Test script for staff pre-fill functionality
 * Tests the automatic staff allocation via staffId parameter in URLs
 */

const axios = require('axios');
require('dotenv').config();

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_BOOKING_ID = 'recFI7jCHFfG7mH15'; // Replace with a valid booking ID
const TEST_STAFF_ID = 'recWQ3C4lfnj0O9R7'; // Replace with a valid staff ID

async function testStaffPrefill() {
    console.log('🧪 Testing Staff Pre-fill Functionality');
    console.log('=====================================\n');
    
    try {
        // Test 1: Pre-Departure Checklist WITH staffId
        console.log('Test 1: Pre-Departure Checklist WITH staffId');
        console.log(`URL: ${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${TEST_STAFF_ID}`);
        
        const preDepartureWithStaff = await axios.get(
            `${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${TEST_STAFF_ID}`
        );
        
        const hasPrefilledStaffName = preDepartureWithStaff.data.includes('readonly') && 
                                      preDepartureWithStaff.data.includes('Auto-filled from your profile');
        
        if (hasPrefilledStaffName) {
            console.log('✅ Staff fields are pre-filled and read-only');
            
            // Extract the actual staff name from the response
            const staffNameMatch = preDepartureWithStaff.data.match(/value="([^"]+)"\s+readonly/);
            if (staffNameMatch) {
                console.log(`   Staff Name: ${staffNameMatch[1]}`);
            }
        } else {
            console.log('❌ Staff fields are NOT pre-filled');
        }
        
        // Check for hidden employeeId field
        const hasEmployeeId = preDepartureWithStaff.data.includes(`<input type="hidden" id="employeeId" value="${TEST_STAFF_ID}">`);
        if (hasEmployeeId) {
            console.log('✅ Hidden employeeId field is present');
        } else {
            console.log('❌ Hidden employeeId field is missing');
        }
        
        console.log('\n');
        
        // Test 2: Pre-Departure Checklist WITHOUT staffId
        console.log('Test 2: Pre-Departure Checklist WITHOUT staffId');
        console.log(`URL: ${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}`);
        
        const preDepartureNoStaff = await axios.get(
            `${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}`
        );
        
        const hasEmptyStaffFields = !preDepartureNoStaff.data.includes('readonly') && 
                                    !preDepartureNoStaff.data.includes('Auto-filled from your profile');
        
        if (hasEmptyStaffFields) {
            console.log('✅ Staff fields are empty and editable (as expected)');
        } else {
            console.log('❌ Staff fields should be empty and editable');
        }
        
        console.log('\n');
        
        // Test 3: Post-Departure Checklist WITH staffId
        console.log('Test 3: Post-Departure Checklist WITH staffId');
        console.log(`URL: ${BASE_URL}/training/post-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${TEST_STAFF_ID}`);
        
        const postDepartureWithStaff = await axios.get(
            `${BASE_URL}/training/post-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${TEST_STAFF_ID}`
        );
        
        const hasPostPrefilledStaff = postDepartureWithStaff.data.includes('readonly') && 
                                      postDepartureWithStaff.data.includes('Auto-filled from your profile');
        
        if (hasPostPrefilledStaff) {
            console.log('✅ Staff fields are pre-filled and read-only');
        } else {
            console.log('❌ Staff fields are NOT pre-filled');
        }
        
        console.log('\n');
        
        // Test 4: Invalid staffId
        console.log('Test 4: Pre-Departure Checklist with INVALID staffId');
        const invalidStaffId = 'recINVALID123';
        console.log(`URL: ${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${invalidStaffId}`);
        
        const preDepartureInvalidStaff = await axios.get(
            `${BASE_URL}/training/pre-departure-checklist-ssr.html?bookingId=${TEST_BOOKING_ID}&staffId=${invalidStaffId}`
        );
        
        const handlesBadStaffId = !preDepartureInvalidStaff.data.includes('readonly') && 
                                  !preDepartureInvalidStaff.data.includes(`value="${invalidStaffId}"`);
        
        if (handlesBadStaffId) {
            console.log('✅ Invalid staffId handled gracefully (fields remain editable)');
        } else {
            console.log('❌ Invalid staffId not handled properly');
        }
        
        console.log('\n=====================================');
        console.log('✅ All staff pre-fill tests completed!');
        
    } catch (error) {
        if (error.response) {
            console.error(`❌ Test failed: ${error.response.status} - ${error.response.statusText}`);
            console.error('Response:', error.response.data.substring(0, 200) + '...');
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

// Run tests
testStaffPrefill();
