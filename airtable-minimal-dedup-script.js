// Minimal Deduplication Script for Airtable Automation
// Place this INSTEAD of the "Create Record" action

let inputConfig = input.config();

// Get booking identifier
let bookingCode = inputConfig['bookingCode'] || inputConfig['Booking Code'];
let status = inputConfig['status'] || inputConfig['Status'] || 'PEND';

// Get all the fields from your webhook/previous script
let fields = {
    'Booking Code': bookingCode,
    'Customer Name': inputConfig['customerName'] || inputConfig['Customer Name'],
    'Customer Email': inputConfig['customerEmail'] || inputConfig['Customer Email'],
    'Status': status,
    'Total Amount': inputConfig['totalAmount'] || inputConfig['Total Amount'] || 0,
    'Booking Items': inputConfig['bookingItems'] || inputConfig['Booking Items'],
    'Booking Date': inputConfig['startDate'],
    'End Date': inputConfig['endDate'],
    'Created Date': inputConfig['createdDate'],
    'Start Time': inputConfig['startTime'],
    'Finish Time': inputConfig['endTime'],
    'Created Time': inputConfig['createdTime'],
    'Duration': inputConfig['bookingDurationFormatted'],
    'Onboarding Time': inputConfig['Onboarding Time'],
    'Deloading Time': inputConfig['Deloading Time'],
    'Pre-Departure Checklist or 1hr After Onboarding': inputConfig['Pre-Departure Checklist or 1hr After Onboarding'],
    'Pre-Departure Checklist or 1hr After Onboarding copy': inputConfig['Pre-Departure Checklist or 1hr After Onboarding copy'],
    'Full Booking Status': '❌ Unstaffed'
};

// Check for existing booking
const bookingsTable = base.getTable("Bookings Dashboard");
let recordId;
let existingRecord = null;

if (bookingCode) {
    console.log(`🔍 Checking for existing booking: ${bookingCode}`);
    
    // Query for existing records
    const queryResult = await bookingsTable.selectRecordsAsync({
        fields: ["Booking Code", "Status", "Onboarding Employee", "Deloading Employee"],
        maxRecords: 500
    });
    
    // Find matching records
    const matchingRecords = queryResult.records.filter(record => 
        record.getCellValueAsString("Booking Code") === bookingCode
    );
    
    if (matchingRecords.length > 0) {
        console.log(`📋 Found ${matchingRecords.length} existing record(s)`);
        
        // Find the best record to update (prefer PAID, then highest status)
        existingRecord = matchingRecords.reduce((best, current) => {
            const bestStatus = best.getCellValueAsString("Status");
            const currentStatus = current.getCellValueAsString("Status");
            
            if (currentStatus === "PAID") return current;
            if (bestStatus === "PAID") return best;
            
            const statusPriority = {
                'PEND': 1, 'HOLD': 2, 'WAIT': 2, 'PART': 3, 'PAID': 4
            };
            
            return (statusPriority[currentStatus] || 0) > (statusPriority[bestStatus] || 0) ? current : best;
        }, matchingRecords[0]);
        
        // Preserve staff assignments
        const onboarding = existingRecord.getCellValue("Onboarding Employee");
        const deloading = existingRecord.getCellValue("Deloading Employee");
        
        if (onboarding && onboarding.length > 0) {
            fields['Onboarding Employee'] = onboarding;
        }
        if (deloading && deloading.length > 0) {
            fields['Deloading Employee'] = deloading;
        }
        
        // Update existing record
        await bookingsTable.updateRecordAsync(existingRecord.id, fields);
        recordId = existingRecord.id;
        console.log(`✅ Updated existing booking to status: ${status}`);
        
        // Delete other duplicates if updating to PAID
        if (status === "PAID" && matchingRecords.length > 1) {
            const toDelete = matchingRecords
                .filter(r => r.id !== existingRecord.id)
                .map(r => r.id);
            
            if (toDelete.length > 0) {
                console.log(`🗑️ Deleting ${toDelete.length} duplicate records`);
                await bookingsTable.deleteRecordsAsync(toDelete);
            }
        }
    } else {
        // Create new record
        recordId = await bookingsTable.createRecordAsync(fields);
        console.log(`✨ Created new booking: ${bookingCode}`);
    }
} else {
    // No booking code - create anyway
    recordId = await bookingsTable.createRecordAsync(fields);
    console.log(`⚠️ Created booking without code`);
}

// Output for next steps
output.set('recordId', recordId);
output.set('isUpdate', existingRecord !== null);
output.set('bookingCode', bookingCode);
output.set('status', status);

// Pass through all other fields for SMS script
for (let key in inputConfig) {
    if (!output.get(key)) {
        output.set(key, inputConfig[key]);
    }
}
