/**
 * Direct test for Ice Cream Boat Sales table
 * This bypasses the Square category check to test the Airtable integration
 */

const axios = require('axios');

async function testDirectIceCreamSale() {
    console.log('🍦 Testing Direct Ice Cream Sale to Airtable...\n');
    
    const saleData = {
        records: [{
            fields: {
                'Sale Code': `TEST-ICE-${Date.now()}`,
                'Customer Name': 'Test Customer - Sarah Johnson',
                'Customer Email': 'test.icecream@example.com',
                'Phone Number': '+61412345678',
                'Status': 'PAID',
                'Sale Amount': 25.00,
                'Vessel/Operation': 'Ice Cream Boat - Walker Courtney',
                'Add-ons': 'Extra Scoop - $5.00, Waffle Cone - $2.00',
                'Sale Date': new Date().toISOString().split('T')[0],
                'Sale Time': new Date().toLocaleString('en-AU', { 
                    timeZone: 'Australia/Sydney', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                }),
                'Square Payment ID': `test_payment_${Date.now()}`,
                'Square Order ID': `test_order_${Date.now()}`,
                'Notes': `Test ice cream sale created at ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}`
            }
        }]
    };
    
    try {
        console.log('📤 Sending to Airtable Ice Cream Boat Sales table...');
        console.log('🍦 Sale Details:');
        console.log(`   Customer: ${saleData.records[0].fields['Customer Name']}`);
        console.log(`   Amount: $${saleData.records[0].fields['Sale Amount']}`);
        console.log(`   Vessel: ${saleData.records[0].fields['Vessel/Operation']}`);
        console.log(`   Add-ons: ${saleData.records[0].fields['Add-ons']}`);
        console.log('');
        
        const response = await axios.post(
            'http://localhost:8080/api/airtable/applkAFOn2qxtu7tx/tblTajm845Fiij8ud',
            saleData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Response status:', response.status);
        console.log('📊 Created record:', response.data.records[0].id);
        console.log('\n🎉 Ice cream sale successfully recorded!');
        console.log('Check your "Ice Cream Boat Sales" table in Airtable');
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Error:', error.response.status);
            console.error('Details:', error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run the test
testDirectIceCreamSale();
