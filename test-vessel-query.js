// Test script to demonstrate vessel status querying
// This shows exactly how to get current vessel status from checklist data

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = 'applkAFOn2qxtu7tx';

// Table IDs
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';
const PRE_DEP_TABLE_ID = 'tbl9igu5g1bPG4Ahu';
const POST_DEP_TABLE_ID = 'tblYkbSQGP6zveYNi';

async function testVesselQuery() {
  console.log('Testing vessel status query...\n');
  
  // 1. Get Sandstone boat details
  const boatResponse = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${BOATS_TABLE_ID}/recNyQ4NXCEtZAaW0`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    }
  );
  
  const boat = await boatResponse.json();
  console.log('Boat Name:', boat.fields.Name);
  console.log('Boat Type:', boat.fields['Boat Type']);
  console.log('Static Fuel Level:', boat.fields['Current Fuel Level (%)']);
  console.log('Linked Post-Departure Checklists:', boat.fields['Post-Departure Checklist']?.length || 0);
  
  // 2. Get the linked post-departure checklist
  if (boat.fields['Post-Departure Checklist']?.[0]) {
    const checklistId = boat.fields['Post-Departure Checklist'][0];
    
    const checklistResponse = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}/${checklistId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );
    
    const checklist = await checklistResponse.json();
    console.log('\nLatest Post-Departure Checklist:');
    console.log('- Date:', new Date(checklist.fields['Created time']).toLocaleString());
    console.log('- Fuel Level After Use:', checklist.fields['Fuel Level After Use']);
    console.log('- Gas Level After Use:', checklist.fields['Gas Bottle Level After Use']);
    console.log('- Water Level After Use:', checklist.fields['Water Tank Level After Use']);
    console.log('- Overall Condition:', checklist.fields['Overall Vessel Condition After Use']);
    console.log('- Staff:', checklist.fields['Staff Member']);
  }
  
  // 3. Show how to query ALL recent checklists for this boat
  console.log('\n--- Alternative: Query all recent checklists ---');
  
  const recentChecklistsResponse = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${POST_DEP_TABLE_ID}?` + 
    `filterByFormula=${encodeURIComponent(`SEARCH("${boat.id}", ARRAYJOIN({Vessel}))`)}` +
    `&sort[0][field]=Created time&sort[0][direction]=desc&maxRecords=5`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    }
  );
  
  const recentChecklists = await recentChecklistsResponse.json();
  console.log('\nFound', recentChecklists.records.length, 'post-departure checklists for Sandstone:');
  
  recentChecklists.records.forEach((record, index) => {
    console.log(`\n${index + 1}. ${new Date(record.fields['Created time']).toLocaleDateString()}`);
    console.log(`   Fuel: ${record.fields['Fuel Level After Use']}`);
    console.log(`   Gas: ${record.fields['Gas Bottle Level After Use']}`);
    console.log(`   Water: ${record.fields['Water Tank Level After Use']}`);
  });
}

// Helper function to convert levels to percentages
function levelToPercentage(level) {
  const map = {
    'Empty': 0,
    'Quarter': 25,
    'Half': 50,
    'Three-Quarter': 75,
    'Full': 100
  };
  return map[level] || 0;
}

// Run the test
testVesselQuery().catch(console.error);

/* 
Expected output:

Testing vessel status query...

Boat Name: Sandstone
Boat Type: 8 Person BBQ Boat
Static Fuel Level: Full
Linked Post-Departure Checklists: 1

Latest Post-Departure Checklist:
- Date: 9/4/2025, 8:17:03 PM
- Fuel Level After Use: Full
- Gas Level After Use: Full  
- Water Level After Use: Quarter
- Overall Condition: Needs Attention
- Staff: ['recU2yfUOIGFsIuZV']

--- Alternative: Query all recent checklists ---
...
*/
