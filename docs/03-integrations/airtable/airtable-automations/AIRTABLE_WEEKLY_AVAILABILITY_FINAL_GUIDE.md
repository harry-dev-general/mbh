# Airtable Weekly Availability Form - Final Implementation Guide

## Overview
This system sends personalized SMS messages to employees every Monday at 9am, asking them to submit their availability for the upcoming week. Each employee receives a unique form link that prefills some fields while allowing them to manually select their name.

## Form Behavior

### Prefilled Fields (Hidden):
- **Week Starting**: Automatically set to the upcoming Monday
- **Submission ID**: Unique identifier for tracking (format: WK{date}-{employeeId})
- **Processing Status**: Hidden from employees

### Manual Selection:
- **Employee**: Dropdown list where employees select their own name
- **Availability Fields**: Checkboxes and time fields for each day of the week

## Why Manual Employee Selection?

After testing various approaches to prefill the Employee field, we've determined that manual selection is the most reliable method because:

1. **Technical Limitations**: The Employee field is a multiple linked records field, which has inconsistent prefill behavior in Airtable forms
2. **Reliability**: Manual selection ensures the form always works correctly
3. **User Familiarity**: Employees quickly learn to select their name from the dropdown
4. **Data Accuracy**: The personalized SMS ensures employees know which form is theirs

## The Final Script

```javascript
// Final SMS Automation Script - Employee field visible for manual selection

// Get inputs from automation
let inputConfig = input.config();
let employeeName = inputConfig.employeeName;
let employeeId = inputConfig.employeeId;

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

// Build URL parameters - Employee field visible for manual selection
let prefillParams = [
    `prefill_Week%20Starting=${weekStartingFormatted}`,
    `prefill_Submission%20ID=${encodeURIComponent(submissionId)}`,
    // Employee field NOT prefilled - employees will select themselves
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
```

## SMS Message Example

```
Hi John! 📅 Please submit your availability for December 16 - December 22.

https://airtable.com/applkAFOn2qxtu7tx/paggtyI5T8EOrLRSU/form?prefill_Week%20Starting=2024-12-16&prefill_Submission%20ID=WK2024-12-16-ABC123&hide_Week%20Starting=true&hide_Submission%20ID=true&hide_Processing%20Status=true
```

## Employee Instructions

When employees receive the SMS and click the link:

1. **Select Your Name**: Choose your name from the Employee dropdown (this is the only required manual step)
2. **Enter Availability**: For each day you're available:
   - Check the "Available" box
   - Enter your start time (e.g., "9:00 AM")
   - Enter your end time (e.g., "5:00 PM")
3. **Add Notes**: Optional field for any special requests or limitations
4. **Submit**: Click submit to send your availability

## Benefits of This Approach

1. **Personalized Links**: Each employee gets their own trackable submission
2. **Reduced Errors**: Week and submission ID are automatically correct
3. **Simple Process**: Only one manual selection required
4. **Reliable**: No complex prefill logic that might break
5. **Audit Trail**: Unique submission IDs help track who submitted what

## Automation Setup Checklist

- [ ] Automation triggers every Monday at 9am
- [ ] Find Records action retrieves all active employees
- [ ] Script generates personalized URLs for each employee
- [ ] SMS integration sends messages with the form links
- [ ] Processing automation converts submissions to roster entries

## Future Enhancements

While the current system works well, potential improvements could include:

1. **Confirmation Messages**: Send SMS confirmation when availability is submitted
2. **Reminder System**: Follow up with employees who haven't submitted by Wednesday
3. **Default Availability**: Pre-populate based on previous week's submission
4. **Mobile Optimization**: Ensure form works smoothly on all devices

## Troubleshooting

**Issue**: Employee can't find their name in dropdown
- **Solution**: Ensure they're added to the Employee Details table

**Issue**: Form shows old week
- **Solution**: Check the date calculation logic in the script

**Issue**: SMS not sending
- **Solution**: Verify SMS integration credentials and employee phone numbers

This manual selection approach provides the best balance of automation and reliability for your weekly availability collection process. 