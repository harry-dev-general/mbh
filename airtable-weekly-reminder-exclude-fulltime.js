// Weekly Availability Reminder Automation - WITH FRIDAY CUTOFF & FULL-TIME EXCLUSION
// Sends reminder texts to CASUAL staff only who haven't submitted availability
// Full-time staff are excluded as they have fixed schedules
// Stops sending reminders on Friday to give staff the weekend off

// Calculate the current week's Monday
var today = new Date();
var dayOfWeek = today.getDay();
var daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
var currentMonday = new Date(today);
currentMonday.setDate(today.getDate() - daysSinceMonday);
currentMonday.setHours(0, 0, 0, 0);

// Format date as YYYY-MM-DD
var weekStartingFormatted = currentMonday.toISOString().split('T')[0];

// Day names for logging
var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

console.log('Checking submissions for week starting: ' + weekStartingFormatted);
console.log('Current date: ' + today.toDateString() + ' (' + dayNames[dayOfWeek] + ')');

// Check if we should send reminders today
var shouldSendReminders = dayOfWeek >= 1 && dayOfWeek <= 4; // Monday through Thursday only

if (!shouldSendReminders) {
    console.log('\n🛑 REMINDER CUTOFF: Today is ' + dayNames[dayOfWeek] + '.');
    console.log('SMS reminders are only sent Monday through Thursday.');
    console.log('Staff have until end of Friday to submit their availability.');
}

// Table references
var employeesTable = base.getTable("Employee Details");
var submissionsTable = base.getTable("Weekly Availability Submissions");

// Get all employees - INCLUDE STAFF TYPE FIELD
var employeeQuery = await employeesTable.selectRecordsAsync({
    fields: ["Name", "Mobile Number", "Email", "Active Roster", "Staff Type"]
});

// Get ALL submissions
var allSubmissionsQuery = await submissionsTable.selectRecordsAsync({
    fields: ["Employee", "Week Starting", "Processing Status", "Submission ID"]
});

// Debug date formats
console.log('\n🔍 Checking submission dates:');
var thisWeekSubmissions = [];
var submittedEmployeeIds = {};

for (var i = 0; i < allSubmissionsQuery.records.length; i++) {
    var submission = allSubmissionsQuery.records[i];
    var weekStartingValue = submission.getCellValue("Week Starting");
    var submissionId = submission.getCellValueAsString("Submission ID");
    
    if (weekStartingValue) {
        // Convert Airtable date to YYYY-MM-DD string
        var submissionDate = new Date(weekStartingValue);
        var submissionDateString = submissionDate.toISOString().split('T')[0];
        
        // Check if it's for this week
        if (submissionDateString === weekStartingFormatted) {
            thisWeekSubmissions.push(submission);
            
            var employeeIds = submission.getCellValue("Employee");
            if (employeeIds && employeeIds.length > 0) {
                var employeeId = typeof employeeIds[0] === 'string' ? employeeIds[0] : employeeIds[0].id;
                submittedEmployeeIds[employeeId] = true;
                console.log('✓ Found submission ' + submissionId + ' for ' + weekStartingFormatted);
            }
        }
    }
}

console.log('\n📋 Submissions for ' + weekStartingFormatted + ': ' + thisWeekSubmissions.length + ' found');

// Process employees and create reminder data
var remindersToSend = [];
var activeEmployeeCount = 0;
var skippedEmployees = [];
var fullTimeEmployees = [];
var staffNeedingSubmission = []; // Track for reporting even on non-send days

// Format friendly dates
var weekEnding = new Date(currentMonday);
weekEnding.setDate(currentMonday.getDate() + 6);
var friendlyStartDate = currentMonday.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
});
var friendlyEndDate = weekEnding.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
});

console.log('\n🔍 Processing employees:');

for (var j = 0; j < employeeQuery.records.length; j++) {
    var employee = employeeQuery.records[j];
    var name = employee.getCellValueAsString("Name");
    var isActive = employee.getCellValue("Active Roster");
    var staffType = employee.getCellValueAsString("Staff Type");
    
    if (isActive === true) {
        activeEmployeeCount++;
        
        // Check if employee is full-time
        if (staffType === "Full Time") {
            fullTimeEmployees.push(name);
            console.log('🏢 ' + name + ' - Full Time staff (no reminder needed)');
        } else if (!submittedEmployeeIds[employee.id]) {
            var mobileNumber = employee.getCellValueAsString("Mobile Number");
            
            if (name && mobileNumber) {
                // Generate form URL
                var employeeIdSuffix = employee.id ? employee.id.slice(-6) : 'UNKNOWN';
                var submissionId = 'WK' + weekStartingFormatted + '-' + employeeIdSuffix;
                var baseFormUrl = 'https://airtable.com/applkAFOn2qxtu7tx/paggtyI5T8EOrLRSU/form';
                
                var prefillParams = [
                    'prefill_Week%20Starting=' + weekStartingFormatted,
                    'prefill_Submission%20ID=' + encodeURIComponent(submissionId),
                    'hide_Week%20Starting=true',
                    'hide_Submission%20ID=true',
                    'hide_Processing%20Status=true'
                ].join('&');
                
                var formUrl = baseFormUrl + '?' + prefillParams;
                
                // Create reminder message
                var firstName = name.split(' ')[0];
                var message = 'Hi ' + firstName + '! ⏰ Reminder: Please submit your availability for ' + 
                            friendlyStartDate + ' - ' + friendlyEndDate + 
                            '. We need this by end of day to plan next week\'s schedule.\n\n' + formUrl;
                
                var reminderData = {
                    phone: mobileNumber,
                    message: message,
                    name: name,
                    firstName: firstName,
                    formUrl: formUrl,
                    employeeId: employee.id
                };
                
                // Always track who needs submission (casual staff only)
                staffNeedingSubmission.push(name);
                
                // Only add to reminders if we're in the send window
                if (shouldSendReminders) {
                    remindersToSend.push(reminderData);
                    console.log('📱 ' + name + ' - Needs reminder (will send)');
                } else {
                    console.log('📱 ' + name + ' - Needs reminder (won\'t send - after cutoff)');
                }
            }
        } else {
            console.log('✓ ' + name + ' - Already submitted');
        }
    } else {
        skippedEmployees.push(name);
        console.log('⏭️  ' + name + ' - Not on active roster');
    }
}

// Clear reminders if we're past the cutoff
if (!shouldSendReminders && remindersToSend.length > 0) {
    console.log('\n⚠️  Clearing ' + remindersToSend.length + ' reminders due to day cutoff.');
    remindersToSend = [];
}

// Output data
output.set('reminders', remindersToSend);

if (remindersToSend.length > 0) {
    output.set('phoneNumbers', remindersToSend.map(function(r) { return r.phone; }));
    output.set('messages', remindersToSend.map(function(r) { return r.message; }));
    output.set('names', remindersToSend.map(function(r) { return r.name; }));
} else {
    // Set empty arrays to prevent errors in the SMS action
    output.set('phoneNumbers', []);
    output.set('messages', []);
    output.set('names', []);
}

output.set('totalReminders', remindersToSend.length);
output.set('weekStarting', weekStartingFormatted);

// Summary
console.log('\n📊 Summary for week ' + friendlyStartDate + ' - ' + friendlyEndDate + ':');
console.log('Active employees: ' + activeEmployeeCount);
console.log('Full-time staff (excluded): ' + fullTimeEmployees.length);
console.log('Submissions received: ' + thisWeekSubmissions.length);
console.log('Casual staff still needing to submit: ' + staffNeedingSubmission.length);

if (fullTimeEmployees.length > 0) {
    console.log('\n🏢 Full-time staff (no reminders needed):');
    for (var k = 0; k < fullTimeEmployees.length; k++) {
        console.log('- ' + fullTimeEmployees[k]);
    }
}

if (!shouldSendReminders) {
    console.log('\n🛑 NO REMINDERS SENT - ' + dayNames[dayOfWeek] + ' is past the Thursday cutoff');
    if (staffNeedingSubmission.length > 0) {
        console.log('\nCasual staff who still need to submit (for reference):');
        for (var l = 0; l < staffNeedingSubmission.length; l++) {
            console.log('- ' + staffNeedingSubmission[l]);
        }
    }
} else {
    console.log('Reminders to send: ' + remindersToSend.length);
    if (remindersToSend.length > 0) {
        console.log('\n📱 Sending reminders to:');
        for (var m = 0; m < remindersToSend.length; m++) {
            var r = remindersToSend[m];
            console.log('- ' + r.name + ' (' + r.phone + ')');
        }
    }
}

console.log('\n🏁 Complete at ' + new Date().toLocaleTimeString());
