// Optimized SMS Script for Webhook Automation
// Uses the isUpdate flag from deduplication script to determine message type

// Get input variables from the deduplication script
let inputConfig = input.config();
let customerName = inputConfig['customerName'];
let bookingItems = inputConfig['bookingItems'];
let startDate = inputConfig['startDate'];
let startTime = inputConfig['startTime'];
let endTime = inputConfig['endTime'];
let bookingDuration = inputConfig['bookingDurationFormatted'];
let status = inputConfig['status'];
let bookingCode = inputConfig['bookingCode'];
let recordId = inputConfig['recordId'];
let isUpdate = inputConfig['isUpdate']; // NEW: From deduplication script

// Initialize variables
let shouldSendSMS = true;
let messageType = isUpdate ? "update" : "new";
let message = "";

// If this is an update, check if it's a significant status change
if (isUpdate && bookingCode) {
    console.log(`📝 Processing update for booking ${bookingCode}`);
    
    // Get the bookings table to check previous status
    let bookingsTable = base.getTable("Bookings Dashboard");
    
    // Get the current record to see its history
    let record = await bookingsTable.selectRecordAsync(recordId, {
        fields: ["Status", "Booking Code"]
    });
    
    if (record) {
        // Since we just updated the record, we need to look at other records
        // with the same booking code to find the previous status
        let allRecords = await bookingsTable.selectRecordsAsync({
            fields: ["Booking Code", "Status", "Created Date"],
            sorts: [{field: "Created Date", direction: "desc"}],
            maxRecords: 100
        });
        
        // Find other records with same booking code (excluding current)
        let previousRecords = allRecords.records.filter(r => 
            r.getCellValueAsString("Booking Code") === bookingCode && 
            r.id !== recordId
        );
        
        if (previousRecords.length > 0) {
            let previousStatus = previousRecords[0].getCellValueAsString("Status");
            console.log(`📊 Status change: ${previousStatus} → ${status}`);
            
            // Check if this is a significant change
            if (!isSignificantStatusChange(previousStatus, status)) {
                shouldSendSMS = false;
                console.log(`📵 Not sending SMS - minor change from ${previousStatus} to ${status}`);
            }
        }
    }
}

// Format the date nicely
let formattedDate = new Date(startDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

// Build appropriate message based on type
if (shouldSendSMS) {
    if (messageType === "new") {
        // New booking message
        message = `🚤 Boat Hire Manly - Booking Confirmed

Booking: ${bookingCode || 'N/A'}
Customer: ${customerName}

📅 Date: ${formattedDate}
⏰ Time: ${startTime} - ${endTime}
⏱️ Duration: ${bookingDuration}

Boat: ${bookingItems}
Status: ${status}

See you at the marina! 🌊`;

    } else if (messageType === "update") {
        // Status update message
        if (status === "VOID" || status === "STOP") {
            message = `⚠️ Boat Hire Manly - Booking Cancelled

Booking: ${bookingCode}
Customer: ${customerName}
Date: ${formattedDate}

Your booking has been cancelled. 
If you have questions, please call us.`;
            
        } else if (status === "PAID") {
            message = `✅ Boat Hire Manly - Payment Confirmed

Booking: ${bookingCode}
Customer: ${customerName}

Your payment has been received!
See you on ${formattedDate} at ${startTime}. 🚤`;
            
        } else if (status === "PART") {
            message = `💳 Boat Hire Manly - Partial Payment Received

Booking: ${bookingCode}
Customer: ${customerName}

We've received your partial payment.
Please complete payment before ${formattedDate}.`;
            
        } else {
            message = `📝 Boat Hire Manly - Booking Updated

Booking: ${bookingCode}
Status: ${status}

Your booking for ${formattedDate} has been updated.`;
        }
    }
}

// Only send SMS if we should
if (shouldSendSMS && message) {
    // Twilio credentials - REPLACE WITH YOUR ACTUAL CREDENTIALS
    let twilioSid = 'YOUR_TWILIO_ACCOUNT_SID';
    let twilioToken = 'YOUR_TWILIO_AUTH_TOKEN';
    let fromNumber = 'YOUR_TWILIO_PHONE_NUMBER';
    
    // Manual Base64 encoding function
    function base64Encode(str) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        let i = 0;
        
        while (i < str.length) {
            let char1 = str.charCodeAt(i++);
            let char2 = str.charCodeAt(i++);
            let char3 = str.charCodeAt(i++);
            
            let enc1 = char1 >> 2;
            let enc2 = ((char1 & 3) << 4) | (char2 >> 4);
            let enc3 = ((char2 & 15) << 2) | (char3 >> 6);
            let enc4 = char3 & 63;
            
            if (isNaN(char2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(char3)) {
                enc4 = 64;
            }
            
            output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
        }
        return output;
    }
    
    // Encode Twilio credentials for Basic Auth
    let authString = `${twilioSid}:${twilioToken}`;
    let encodedAuth = base64Encode(authString);
    
    // Send SMS via Twilio API
    let response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'From': fromNumber,
            'To': '+61414960734',
            'Body': message
        })
    });
    
    // Check for errors in the response
    if (!response.ok) {
        let errorText = await response.text();
        throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
    }
    
    // Log success
    console.log(`✅ SMS sent successfully! Type: ${messageType}`);
    output.set('smsSent', true);
    output.set('smsMessage', message);
    output.set('smsType', messageType);
    
} else {
    console.log('📵 SMS not sent - duplicate with no significant changes');
    output.set('smsSent', false);
    output.set('skipReason', shouldSendSMS ? 'No message to send' : 'Not a significant change');
}

// Helper function to determine significant status changes
function isSignificantStatusChange(oldStatus, newStatus) {
    // Always notify for cancellations
    if (newStatus === "VOID" || newStatus === "STOP") return true;
    
    // Notify when payment is confirmed
    if ((oldStatus === "PEND" || oldStatus === "HOLD" || oldStatus === "WAIT" || oldStatus === "PART") 
        && newStatus === "PAID") {
        return true;
    }
    
    // Don't notify for same status
    if (oldStatus === newStatus) return false;
    
    // Don't notify for minor progressions
    if (oldStatus === "PEND" && (newStatus === "HOLD" || newStatus === "WAIT")) return false;
    if (oldStatus === "HOLD" && newStatus === "WAIT") return false;
    if (oldStatus === "WAIT" && newStatus === "HOLD") return false;
    
    // Notify for partial payment
    if ((oldStatus === "PEND" || oldStatus === "HOLD" || oldStatus === "WAIT") && newStatus === "PART") {
        return true;
    }
    
    // Default to not sending for other cases
    return false;
}
