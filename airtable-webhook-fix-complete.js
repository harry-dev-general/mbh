// Complete Airtable Webhook Automation Script
// This replaces your current script and prevents duplicates

let inputConfig = input.config();

// Convert Unix timestamps (in seconds) to Date objects
let startDateTime = new Date(inputConfig['startDate'] * 1000);
let endDateTime = new Date(inputConfig['endDate'] * 1000);
let createdDateTime = new Date(inputConfig['createdDate'] * 1000);

// CRITICAL: Get booking identifier and current data
let bookingCode = inputConfig['bookingCode'] || inputConfig['bookingId'] || null;
let customerEmail = inputConfig['customerEmail'] || inputConfig['email'] || null;
let customerName = inputConfig['customerName'] || inputConfig['name'] || null;
let bookingStatus = inputConfig['status'] || inputConfig['bookingStatus'] || 'PEND';
let totalAmount = inputConfig['totalAmount'] || inputConfig['amount'] || 0;
let bookingItems = inputConfig['bookingItems'] || inputConfig['items'] || '';

// Function to format time in Sydney timezone
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Sydney'
    });
}

// Function to format date in Sydney timezone
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Australia/Sydney'
    }).split('/').reverse().join('-'); // Convert to YYYY-MM-DD format
}

// Function to format full datetime in Sydney timezone
function formatDateTimeAEST(date) {
    return date.toLocaleString('en-AU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Australia/Sydney',
        hour12: false
    });
}

// DEDUPLICATION LOGIC - Check for existing booking
const bookingsTable = base.getTable("Bookings Dashboard");
let existingRecord = null;
let shouldUpdate = false;

if (bookingCode) {
    console.log(`🔍 Checking for existing booking: ${bookingCode}`);
    
    // Query for existing records with this booking code
    const queryResult = await bookingsTable.selectRecordsAsync({
        fields: ["Booking Code", "Status", "Total Amount", "Onboarding Employee", "Deloading Employee"],
        maxRecords: 100
    });
    
    // Find records with matching booking code
    const matchingRecords = queryResult.records.filter(record => 
        record.getCellValueAsString("Booking Code") === bookingCode
    );
    
    if (matchingRecords.length > 0) {
        console.log(`📋 Found ${matchingRecords.length} existing record(s) for ${bookingCode}`);
        
        // Find the best record to update (prefer PAID, then highest status)
        existingRecord = matchingRecords.reduce((best, current) => {
            const bestStatus = best.getCellValueAsString("Status");
            const currentStatus = current.getCellValueAsString("Status");
            const bestAmount = best.getCellValue("Total Amount") || 0;
            const currentAmount = current.getCellValue("Total Amount") || 0;
            
            // Always prefer PAID with highest amount
            if (currentStatus === "PAID" && currentAmount >= bestAmount) {
                return current;
            }
            if (bestStatus === "PAID") {
                return best;
            }
            
            // Otherwise, prefer higher status
            const statusPriority = {
                'PEND': 1, 'HOLD': 2, 'WAIT': 2, 'PART': 3, 'PAID': 4
            };
            
            if ((statusPriority[currentStatus] || 0) > (statusPriority[bestStatus] || 0)) {
                return current;
            }
            
            return best;
        }, matchingRecords[0]);
        
        shouldUpdate = true;
        console.log(`✅ Will update existing record (Status: ${existingRecord.getCellValueAsString("Status")})`);
        
        // Delete other duplicate records if updating to PAID
        if (bookingStatus === "PAID" && matchingRecords.length > 1) {
            const recordsToDelete = matchingRecords
                .filter(r => r.id !== existingRecord.id)
                .map(r => r.id);
            
            if (recordsToDelete.length > 0) {
                console.log(`🗑️ Deleting ${recordsToDelete.length} duplicate records`);
                await bookingsTable.deleteRecordsAsync(recordsToDelete);
            }
        }
    } else {
        console.log(`✨ New booking ${bookingCode} - will create record`);
    }
}

// Prepare field data
const fieldData = {
    'Booking Code': bookingCode,
    'Customer Name': customerName,
    'Customer Email': customerEmail,
    'Status': bookingStatus,
    'Total Amount': totalAmount,
    'Booking Items': bookingItems,
    'Booking Date': formatDateAEST(startDateTime),
    'End Date': formatDateAEST(endDateTime),
    'Created Date': formatDateAEST(createdDateTime),
    'Start Time': formatTimeAEST(startDateTime),
    'Finish Time': formatTimeAEST(endDateTime),
    'Created Time': formatTimeAEST(createdDateTime)
};

// Calculate booking duration
let durationMinutes = (endDateTime - startDateTime) / (1000 * 60);
let durationHours = durationMinutes / 60;
fieldData['Duration'] = `${Math.floor(durationHours)} hours ${durationMinutes % 60} minutes`;

// Calculate onboarding/deloading times
let onboardingTime = new Date(startDateTime.getTime() - 30 * 60000); // 30 min before
let deloadingTime = new Date(endDateTime.getTime() - 30 * 60000); // 30 min before
fieldData['Onboarding Time'] = formatTimeAEST(onboardingTime);
fieldData['Deloading Time'] = formatTimeAEST(deloadingTime);

// Calculate checklist times
let preDepTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min after start
let postDepTime = new Date(endDateTime.getTime() + 30 * 60000); // 30 min after end
fieldData['Pre-Departure Checklist or 1hr After Onboarding'] = formatTimeAEST(preDepTime);
fieldData['Pre-Departure Checklist or 1hr After Onboarding copy'] = formatTimeAEST(postDepTime);

// Set booking status
fieldData['Full Booking Status'] = '❌ Unstaffed';

// Create or update record
let recordId;

if (shouldUpdate && existingRecord) {
    // Preserve existing staff assignments if any
    const existingOnboarding = existingRecord.getCellValue("Onboarding Employee");
    const existingDeloading = existingRecord.getCellValue("Deloading Employee");
    
    if (existingOnboarding && existingOnboarding.length > 0) {
        fieldData['Onboarding Employee'] = existingOnboarding;
    }
    if (existingDeloading && existingDeloading.length > 0) {
        fieldData['Deloading Employee'] = existingDeloading;
    }
    
    // Update existing record
    await bookingsTable.updateRecordAsync(existingRecord.id, fieldData);
    recordId = existingRecord.id;
    console.log(`📝 Updated booking ${bookingCode} to status ${bookingStatus}`);
} else {
    // Create new record
    recordId = await bookingsTable.createRecordAsync(fieldData);
    console.log(`✅ Created new booking ${bookingCode} with status ${bookingStatus}`);
}

// Set outputs for next steps
output.set('recordId', recordId);
output.set('isUpdate', shouldUpdate);
output.set('bookingCode', bookingCode);
output.set('status', bookingStatus);
output.set('customerName', customerName);
output.set('bookingItems', bookingItems);
output.set('startDate', formatDateAEST(startDateTime));
output.set('startTime', formatTimeAEST(startDateTime));
output.set('endTime', formatTimeAEST(endDateTime));
output.set('bookingDurationFormatted', fieldData['Duration']);

// Add summary for logging
let actionType = shouldUpdate ? 'UPDATED' : 'CREATED';
console.log(`\n📊 Summary: ${actionType} ${bookingCode} - ${customerName} - Status: ${bookingStatus} - Amount: $${totalAmount}`);
