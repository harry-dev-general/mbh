// Test script to verify Shift Allocations system is working
// Run this in your browser console on the management-allocations.html page

async function testAllocationSystem() {
    console.log('🔧 Testing Shift Allocations System...\n');
    
    const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14';
    const BASE_ID = 'applkAFOn2qxtu7tx';
    const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';
    
    try {
        // Test 1: Fetch allocations
        console.log('Test 1: Fetching allocations from table...');
        const response = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}?maxRecords=3`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                }
            }
        );
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Successfully connected to Shift Allocations table');
            console.log(`   Found ${data.records ? data.records.length : 0} records`);
            
            if (data.records && data.records.length > 0) {
                console.log('\n📊 Sample record structure:');
                console.log(JSON.stringify(data.records[0].fields, null, 2));
            }
        } else {
            console.error('❌ Failed to fetch allocations:', data);
        }
        
        // Test 2: Check table structure
        console.log('\nTest 2: Verifying table structure...');
        if (data.records && data.records.length > 0) {
            const expectedFields = ['Name', 'Employee', 'Shift Date', 'Start Time', 'End Time', 'Shift Type', 'Shift Status'];
            const record = data.records[0].fields;
            const missingFields = expectedFields.filter(field => !(field in record));
            
            if (missingFields.length === 0) {
                console.log('✅ All expected fields are present');
            } else {
                console.log('⚠️ Missing fields:', missingFields);
            }
        }
        
        // Test 3: Create a test allocation (commented out by default)
        console.log('\nTest 3: Ready to create test allocation');
        console.log('To create a test allocation, uncomment the code below:');
        console.log(`
// Uncomment to create a test allocation:
/*
const testAllocation = {
    fields: {
        'Name': 'Test Shift - ${new Date().toISOString().split('T')[0]}',
        'Employee': ['rec3Z2lgo6yHIe7uO'], // Replace with actual employee ID
        'Shift Date': '${new Date().toISOString().split('T')[0]}',
        'Start Time': '09:00',
        'End Time': '17:00',
        'Shift Type': 'General Operations',
        'Shift Status': 'Scheduled'
    }
};

const createResponse = await fetch(
    'https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}',
    {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ${AIRTABLE_API_KEY}',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testAllocation)
    }
);

if (createResponse.ok) {
    console.log('✅ Test allocation created successfully');
} else {
    console.error('❌ Failed to create test allocation');
}
*/
        `);
        
        console.log('\n✨ System test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAllocationSystem();
