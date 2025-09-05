// Airtable Webhook Automation Script with Deduplication
// This script prevents duplicate bookings by updating existing records

let inputConfig = input.config();

// Convert Unix timestamps (in seconds) to Date objects
let startDateTime = new Date(inputConfig['startDate'] * 1000);
let endDateTime = new Date(inputConfig['endDate'] * 1000);
let createdDateTime = new Date(inputConfig['createdDate'] * 1000);

// CRITICAL: Get booking identifier and status from webhook
let bookingCode = inputConfig['bookingCode'] || inputConfig['bookingId'] || null;
let customerEmail = inputConfig['customerEmail'] || inputConfig['email'] || null;
let bookingStatus = inputConfig['status'] || inputConfig['bookingStatus'] || 'PEND';
let totalAmount = inputConfig['totalAmount'] || inputConfig['amount'] || 0;

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

// DEDUPLICATION LOGIC
let existingBooking = null;
let shouldCreateNewBooking = true;
let shouldUpdateExisting = false;

// Search for existing booking by Booking Code
if (bookingCode) {
    console.log(`Checking for existing booking with code: ${bookingCode}`);
    
    let bookingsTable = base.getTable('Bookings Dashboard');
    let queryResult = await bookingsTable.selectRecordsAsync({
        fields: ['Booking Code', 'Status', 'Total Amount', 'Customer Email', 'Booking Date'],
        filterByFormula: `{Booking Code} = '${bookingCode}'`
    });
    
    if (queryResult.records.length > 0) {
        // Found existing booking(s) with this code
        console.log(`Found ${queryResult.records.length} existing booking(s) with code ${bookingCode}`);
        
        // Find the most relevant record to update
        // Priority: Update PAID > PART > PEND
        let recordToUpdate = null;
        
        for (let record of queryResult.records) {
            let recordStatus = record.getCellValue('Status');
            
            // If we find a PAID record and incoming is not PAID, skip this update
            if (recordStatus === 'PAID' && bookingStatus !== 'PAID') {
                console.log('Existing PAID booking found - skipping update as new status is not PAID');
                shouldCreateNewBooking = false;
                shouldUpdateExisting = false;
                break;
            }
            
            // Update logic based on status progression
            if (!recordToUpdate || 
                (recordStatus === 'PEND' && (bookingStatus === 'PART' || bookingStatus === 'PAID')) ||
                (recordStatus === 'PART' && bookingStatus === 'PAID')) {
                recordToUpdate = record;
            }
        }
        
        if (recordToUpdate) {
            existingBooking = recordToUpdate;
            shouldCreateNewBooking = false;
            shouldUpdateExisting = true;
            console.log(`Will update existing booking ${recordToUpdate.id} from ${recordToUpdate.getCellValue('Status')} to ${bookingStatus}`);
        }
    }
} else if (customerEmail) {
    // Fallback: Check by customer email and booking date/time if no booking code
    console.log(`No booking code provided, checking by email and date/time`);
    
    let bookingsTable = base.getTable('Bookings Dashboard');
    let bookingDate = formatDateAEST(startDateTime);
    let startTime = formatTimeAEST(startDateTime);
    
    let queryResult = await bookingsTable.selectRecordsAsync({
        fields: ['Customer Email', 'Booking Date', 'Start Time', 'Status'],
        filterByFormula: `AND(
            {Customer Email} = '${customerEmail}',
            {Booking Date} = '${bookingDate}',
            {Start Time} = '${startTime}'
        )`
    });
    
    if (queryResult.records.length > 0) {
        // Use similar logic to find the best record to update
        let recordToUpdate = queryResult.records[0]; // Simple approach - take first match
        existingBooking = recordToUpdate;
        shouldCreateNewBooking = false;
        shouldUpdateExisting = true;
        console.log(`Found existing booking by email/date match - will update`);
    }
}

// Prepare output data
let outputData = {
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    createdDateTime: createdDateTime.toISOString(),
    startDateTimeSydney: formatDateTimeAEST(startDateTime),
    endDateTimeSydney: formatDateTimeAEST(endDateTime),
    createdDateTimeSydney: formatDateTimeAEST(createdDateTime),
    startDate: formatDateAEST(startDateTime),
    endDate: formatDateAEST(endDateTime),
    createdDate: formatDateAEST(createdDateTime),
    startTime: formatTimeAEST(startDateTime),
    endTime: formatTimeAEST(endDateTime),
    createdTime: formatTimeAEST(createdDateTime)
};

// Calculate booking duration
let durationMinutes = (endDateTime - startDateTime) / (1000 * 60);
let durationHours = durationMinutes / 60;
outputData.bookingDurationHours = durationHours;
outputData.bookingDurationFormatted = `${Math.floor(durationHours)} hours ${durationMinutes % 60} minutes`;

// Add booking summary
let bookingSummary = `${formatDateAEST(startDateTime)} from ${formatTimeAEST(startDateTime)} to ${formatTimeAEST(endDateTime)}`;
outputData.bookingSummary = bookingSummary;

// Set action flags
output.set('shouldCreate', shouldCreateNewBooking);
output.set('shouldUpdate', shouldUpdateExisting);
output.set('existingRecordId', existingBooking ? existingBooking.id : null);

// Set all the datetime fields
for (let key in outputData) {
    output.set(key, outputData[key]);
}

// Log the decision
if (shouldUpdateExisting) {
    console.log(`Decision: UPDATE existing record ${existingBooking.id}`);
} else if (shouldCreateNewBooking) {
    console.log('Decision: CREATE new booking record');
} else {
    console.log('Decision: SKIP - No action needed');
}
