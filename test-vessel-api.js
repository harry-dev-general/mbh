// Test the vessel API endpoint
const axios = require('axios');

async function testVesselAPI() {
  try {
    console.log('Testing vessel maintenance API...\n');
    
    // Test locally - adjust URL for production
    const apiUrl = process.env.BASE_URL || 'http://localhost:8080';
    
    console.log(`Making request to: ${apiUrl}/api/vessels/maintenance-status`);
    
    const response = await axios.get(`${apiUrl}/api/vessels/maintenance-status`);
    
    if (response.data.success) {
      console.log('✅ API call successful!\n');
      console.log('Summary:', response.data.summary);
      console.log(`\nFound ${response.data.vessels.length} vessels:\n`);
      
      response.data.vessels.forEach(vessel => {
        console.log(`🚢 ${vessel.name} (${vessel.type})`);
        console.log(`   Status: ${vessel.overallStatus}`);
        if (vessel.currentStatus) {
          console.log(`   Fuel: ${vessel.currentStatus.fuel.percentage}%`);
          console.log(`   Gas: ${vessel.currentStatus.gas.percentage}%`);
          console.log(`   Water: ${vessel.currentStatus.water.percentage}%`);
        } else {
          console.log('   No checklist data');
        }
        console.log('');
      });
    } else {
      console.error('❌ API returned error:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error calling API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    console.error('\nMake sure the server is running with: npm start');
  }
}

testVesselAPI();
