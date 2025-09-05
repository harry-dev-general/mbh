// Airtable Booking Deduplication Solution
// This script identifies and merges duplicate bookings, keeping only PAID records

// INSTRUCTIONS:
// 1. Copy this script into Airtable Scripting app
// 2. Run it to analyze duplicates
// 3. Review the analysis
// 4. Uncomment the cleanup section to perform deduplication

const TABLE_NAME = 'Bookings Dashboard';
const bookingsTable = base.getTable(TABLE_NAME);

// Status priority (higher = keep)
const STATUS_PRIORITY = {
    'VOID': -2,
    'STOP': -1,
    'PEND': 1,
    'HOLD': 2,
    'WAIT': 2,
    'PART': 3,
    'PAID': 4
};

console.log('🔍 Analyzing duplicate bookings...\n');

// Fetch all records
const query = await bookingsTable.selectRecordsAsync({
    fields: [
        'Booking Code',
        'Customer Name',
        'Customer Email',
        'Status',
        'Total Amount',
        'Created Date',
        'Booking Date',
        'Booking Items',
        'Start Time',
        'Finish Time',
        'Onboarding Employee',
        'Deloading Employee',
        'Duration'
    ]
});

// Group by booking code
const bookingGroups = {};
for (const record of query.records) {
    const bookingCode = record.getCellValueAsString('Booking Code');
    if (!bookingCode) continue;
    
    if (!bookingGroups[bookingCode]) {
        bookingGroups[bookingCode] = [];
    }
    bookingGroups[bookingCode].push(record);
}

// Find duplicates
const duplicates = Object.entries(bookingGroups)
    .filter(([code, records]) => records.length > 1)
    .sort(([a], [b]) => a.localeCompare(b));

console.log(`Found ${duplicates.length} booking codes with duplicates\n`);

// Analyze duplicates
let recordsToDelete = [];
let recordsToUpdate = [];
let manualReviewNeeded = [];

for (const [bookingCode, records] of duplicates) {
    const customerName = records[0].getCellValueAsString('Customer Name');
    const bookingDate = records[0].getCellValueAsString('Booking Date');
    
    console.log(`📋 ${bookingCode} - ${customerName} (${bookingDate})`);
    
    // Find all PAID records
    const paidRecords = records.filter(r => r.getCellValueAsString('Status') === 'PAID');
    const nonPaidRecords = records.filter(r => r.getCellValueAsString('Status') !== 'PAID');
    
    if (paidRecords.length === 0) {
        console.log(`   ⚠️ No PAID record found - needs manual review`);
        manualReviewNeeded.push({ bookingCode, records });
        console.log('');
        continue;
    }
    
    // Find PAID record with highest amount
    let recordToKeep = paidRecords[0];
    let highestAmount = recordToKeep.getCellValue('Total Amount') || 0;
    
    for (const record of paidRecords) {
        const amount = record.getCellValue('Total Amount') || 0;
        if (amount > highestAmount) {
            highestAmount = amount;
            recordToKeep = record;
        }
    }
    
    // Collect staff assignments from all records
    let allOnboardingStaff = [];
    let allDeloadingStaff = [];
    
    for (const record of records) {
        const onboarding = record.getCellValue('Onboarding Employee') || [];
        const deloading = record.getCellValue('Deloading Employee') || [];
        
        allOnboardingStaff.push(...onboarding);
        allDeloadingStaff.push(...deloading);
    }
    
    // Remove duplicates from staff arrays
    allOnboardingStaff = [...new Set(allOnboardingStaff.map(s => s.id))].map(id => ({id}));
    allDeloadingStaff = [...new Set(allDeloadingStaff.map(s => s.id))].map(id => ({id}));
    
    console.log(`   ✅ KEEP: ${recordToKeep.getCellValueAsString('Status')} - $${highestAmount}`);
    
    // Check if we need to update the kept record with staff info
    const currentOnboarding = recordToKeep.getCellValue('Onboarding Employee') || [];
    const currentDeloading = recordToKeep.getCellValue('Deloading Employee') || [];
    
    if (allOnboardingStaff.length > currentOnboarding.length || 
        allDeloadingStaff.length > currentDeloading.length) {
        console.log(`   📝 Will merge staff assignments`);
        recordsToUpdate.push({
            record: recordToKeep,
            updates: {
                'Onboarding Employee': allOnboardingStaff.length > 0 ? allOnboardingStaff : undefined,
                'Deloading Employee': allDeloadingStaff.length > 0 ? allDeloadingStaff : undefined
            }
        });
    }
    
    // Mark other records for deletion
    const toDelete = records.filter(r => r.id !== recordToKeep.id);
    for (const record of toDelete) {
        const status = record.getCellValueAsString('Status');
        const amount = record.getCellValue('Total Amount') || 0;
        console.log(`   ❌ DELETE: ${status} - $${amount}`);
        recordsToDelete.push(record);
    }
    
    // Special cases
    if (highestAmount === 0 && recordToKeep.getCellValueAsString('Booking Items') !== 'icebag') {
        console.log(`   ⚠️ WARNING: PAID record has $0 (not ice bag) - may need amount update`);
    }
    
    console.log('');
}

// Summary
console.log('\n📊 SUMMARY:');
console.log(`   Total duplicated booking codes: ${duplicates.length}`);
console.log(`   Records to delete: ${recordsToDelete.length}`);
console.log(`   Records to update: ${recordsToUpdate.length}`);
console.log(`   Need manual review: ${manualReviewNeeded.length}`);

// Show manual review cases
if (manualReviewNeeded.length > 0) {
    console.log('\n⚠️ MANUAL REVIEW NEEDED:');
    for (const {bookingCode, records} of manualReviewNeeded) {
        const statuses = records.map(r => r.getCellValueAsString('Status')).join(', ');
        console.log(`   ${bookingCode}: ${statuses}`);
    }
}

// UNCOMMENT TO PERFORM CLEANUP
/*
console.log('\n🔧 Starting cleanup...');

// Update records with merged staff
if (recordsToUpdate.length > 0) {
    console.log(`\n📝 Updating ${recordsToUpdate.length} records with merged staff...`);
    for (const {record, updates} of recordsToUpdate) {
        // Remove undefined values
        const cleanUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }
        
        if (Object.keys(cleanUpdates).length > 0) {
            await bookingsTable.updateRecordAsync(record.id, cleanUpdates);
            console.log(`   Updated ${record.getCellValueAsString('Booking Code')}`);
        }
    }
}

// Delete duplicate records
if (recordsToDelete.length > 0) {
    console.log(`\n🗑️ Deleting ${recordsToDelete.length} duplicate records...`);
    
    // Delete in batches of 50
    while (recordsToDelete.length > 0) {
        const batch = recordsToDelete.splice(0, 50);
        await bookingsTable.deleteRecordsAsync(batch.map(r => r.id));
        console.log(`   Deleted ${batch.length} records`);
    }
}

console.log('\n✅ Cleanup complete!');
*/

console.log('\n💡 NEXT STEPS:');
console.log('1. Review the analysis above');
console.log('2. Check bookings with $0 amounts that should have values');
console.log('3. Uncomment the cleanup section to perform deduplication');
console.log('4. Fix your webhook automation to prevent future duplicates');
