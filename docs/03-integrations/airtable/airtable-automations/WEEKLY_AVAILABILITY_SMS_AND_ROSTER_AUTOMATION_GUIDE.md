# Weekly Availability SMS and Roster Automation Guide
**Last Updated**: November 7, 2025  
**Components**: SMS Reminder Automation, Roster Processing Automation

## Overview

Two Airtable automations work together to manage staff availability:
1. **SMS Reminder**: Sends weekly links to staff
2. **Roster Processing**: Converts submissions into individual day records

## SMS Reminder Automation

### Configuration
- **Name**: "Weekly Availability SMS Reminder"
- **Trigger**: At scheduled time - Every Sunday at 10:00am AEDT
- **Table**: Employee Details
- **Filter**: 
  - Mobile Number is not empty
  - Active Roster is checked
  - Staff Type is "Casual"

### Script Input Variables
```javascript
employeeName   // From Employee Details: Name
employeeId     // From trigger: Record ID
employeeEmail  // From Employee Details: Email
```

### Script Code
```javascript
// Weekly SMS Automation Script - Send to Custom Availability Page

// Get inputs from automation
let inputConfig = input.config();
let employeeName = inputConfig.employeeName;      
let employeeId = inputConfig.employeeId;          
let employeeEmail = inputConfig.employeeEmail;

// Calculate the upcoming Monday's date
let today = new Date();
let dayOfWeek = today.getDay();

let daysUntilMonday;
if (dayOfWeek === 0) {
    daysUntilMonday = 1;  // Sunday → Monday
} else if (dayOfWeek === 1) {
    daysUntilMonday = 7;  // Monday → Next Monday
} else {
    daysUntilMonday = 8 - dayOfWeek;
}

let weekStarting = new Date(today);
weekStarting.setDate(today.getDate() + daysUntilMonday);
let weekStartingFormatted = weekStarting.toISOString().split('T')[0];

// Build URL with week parameter
let baseUrl = 'https://mbh-production-f0d1.up.railway.app/availability.html';
let availabilityUrl = `${baseUrl}?week=${weekStartingFormatted}`;

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
let smsMessage = `Hi ${firstName}! 📅 Please submit your availability for ${friendlyDate} - ${friendlyEndDate}.

${availabilityUrl}

Log in with your email: ${employeeEmail}`;

// Output values
output.set('availabilityUrl', availabilityUrl);
output.set('smsMessage', smsMessage);
output.set('weekStarting', weekStartingFormatted);
output.set('employeeEmail', employeeEmail || 'Not provided');
```

### SMS Action Configuration
- **To**: Employee Mobile Number (from trigger record)
- **Message**: Use output variable `{{smsMessage}}`
- **From**: Your Twilio phone number

## Roster Processing Automation

### Configuration
- **Name**: "Process Weekly Availability Submissions"
- **Trigger**: When record is created in Weekly Availability Submissions
- **Table**: Weekly Availability Submissions

### Script Input Variables
```javascript
submissionRecordId  // From trigger: Record ID
employeeId          // From trigger: Employee (first linked record)
weekStarting        // From trigger: Week Starting
```

### Script Code
[See the complete roster automation script in the previous response]

### Key Features
1. **Time Format Handling**: Expects "H:MM AM/PM" from availability.html
2. **Timezone Conversion**: Converts local time (UTC+10) to UTC for storage
3. **Default Times**: 6:00 AM - 10:00 PM when not specified
4. **Error Handling**: Updates submission status on failure
5. **Batch Processing**: Handles up to 50 records per batch

## Data Flow Example

### 1. SMS Sent (Sunday 10am)
```
Hi Sarah! 📅 Please submit your availability for November 10 - November 16.

https://mbh-production-f0d1.up.railway.app/availability.html?week=2025-11-10

Log in with your email: sarah@example.com
```

### 2. Form Submission
```json
{
  "Submission ID": "WK2025-11-10-abc123",
  "Employee": ["recXXXXXXXXXXXX"],
  "Week Starting": "2025-11-10",
  "Monday Available": true,
  "Monday From": "9:00 AM",
  "Monday Until": "5:00 PM"
}
```

### 3. Roster Record Created
```json
{
  "Employee": ["recXXXXXXXXXXXX"],
  "Date": "2025-11-10",
  "Week Starting": "2025-11-10",
  "Available From": "2025-11-09T23:00:00.000Z",  // 9 AM local → UTC
  "Available Until": "2025-11-10T07:00:00.000Z", // 5 PM local → UTC
  "Availability Status": "Active"
}
```

## Troubleshooting

### Common Issues
1. **No SMS received**: Check mobile number format and Active Roster status
2. **Form won't load**: Verify email matches Employee Details record
3. **No roster records created**: Check Processing Status in submissions table
4. **Wrong timezone**: Adjust TIMEZONE_OFFSET in roster script

### Testing
1. Create test employee with your mobile number
2. Manually trigger SMS automation
3. Submit test availability
4. Verify roster records created with correct times

## Migration Notes

### From Airtable Form (Old System)
- Disabled old form automation (was causing double AM/PM bug)
- Updated SMS to send to availability.html instead
- No data migration needed - new submissions use new system

### Key Differences
- **Old**: Airtable form → Complex automation with time parsing
- **New**: Web form → Clean data → Simple automation
