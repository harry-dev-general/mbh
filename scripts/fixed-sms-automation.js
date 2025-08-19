// Fixed SMS Automation Script - With Employee Prefill
// Use this in your Airtable automation

// Get inputs from automation
let inputConfig = input.config();
let employeeName = inputConfig.employeeName;
let employeeId = inputConfig.employeeId;  // This should be the Airtable record ID

// Calculate the upcoming Monday's date
let today = new Date();
let dayOfWeek = today.getDay();

// Calculate days until Monday
let daysUntilMonday;
if (dayOfWeek === 0) {
    // Sunday - Monday is tomorrow
    daysUntilMonday = 1;
} else if (dayOfWeek === 1) {
    // Monday - use today
    daysUntilMonday = 0;
} else {
    // Tuesday-Saturday - next Monday
    daysUntilMonday = 8 - dayOfWeek;
}

let weekStarting = new Date(today);
weekStarting.setDate(today.getDate() + daysUntilMonday);

// Format date as YYYY-MM-DD
let weekStartingFormatted = weekStarting.toISOString().split('T')[0];

// Generate unique submission ID
let submissionId = `WK${weekStartingFormatted}-${employeeId.slice(-6)}`;

// Build the personalized form URL
let baseFormUrl = 'https://airtable.com/applkAFOn2qxtu7tx/paggtyI5T8EOrLRSU/form';

// Build URL parameters - NOW INCLUDING EMPLOYEE PREFILL
let prefillParams = [
    `prefill_Week%20Starting=${weekStartingFormatted}`,
    `prefill_Submission%20ID=${encodeURIComponent(submissionId)}`,
    `prefill_Employee=${employeeId}`,  // ADD THIS LINE - Prefills the employee
    `hide_Week%20Starting=true`,
    `hide_Submission%20ID=true`,
    `hide_Processing%20Status=true`
].join('&');

// Complete URL
let formUrl = `${baseFormUrl}?${prefillParams}`;

// Format friendly dates
let friendlyDate = weekStarting.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
});

let weekEnding = new Date(weekStarting);
weekEnding.setDate(weekStarting.getDate() + 6);
let friendlyEndDate = weekEnding.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
});

// Create SMS message
let firstName = employeeName.split(' ')[0];
let smsMessage = `Hi ${firstName}! 📅 Please submit your availability for ${friendlyDate} - ${friendlyEndDate}.\n\n${formUrl}`;

// Output values
output.set('formUrl', formUrl);
output.set('smsMessage', smsMessage);
output.set('weekStarting', weekStartingFormatted);
output.set('submissionId', submissionId);

// Log for debugging
console.log(`Generated URL for ${employeeName}:`, formUrl);
console.log(`SMS Message:`, smsMessage);
console.log(`Employee will be pre-selected in the form`);
