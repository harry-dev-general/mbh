# Full-Time Staff Fixed Availability System

## Overview
This document describes the implementation of fixed weekly availability for full-time staff in the MBH Staff Portal.

## Schema Changes Made

### Employee Details Table (`tbltAE4NlNePvnkpY`)

Added the following fields:

1. **Staff Type** (Single Select)
   - Options: "Full Time", "Casual"
   - Field ID: `fldWQXhgQIp3NnESH`

2. **Fixed Availability Fields** (for each day):
   - Fixed Monday (`checkbox`) + Fixed Monday Start/End (`text`)
   - Fixed Tuesday (`checkbox`) + Fixed Tuesday Start/End (`text`)
   - Fixed Wednesday (`checkbox`) + Fixed Wednesday Start/End (`text`)
   - Fixed Thursday (`checkbox`) + Fixed Thursday Start/End (`text`)
   - Fixed Friday (`checkbox`) + Fixed Friday Start/End (`text`)
   - Fixed Saturday (`checkbox`) + Fixed Saturday Start/End (`text`)
   - Fixed Sunday (`checkbox`) + Fixed Sunday Start/End (`text`)

## Airtable Automation Scripts

### 1. Weekly Availability Reminder - Only Send to Casual Staff

**Trigger**: Weekly schedule (e.g., Thursday at 3 PM)

**Script**:
```javascript
// Weekly Availability Reminder - Send only to Casual Staff
// This automation sends reminders only to casual staff who need to submit availability

const BASE_ID = 'applkAFOn2qxtu7tx';
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';

// Get all active roster employees who are Casual staff
const employeeTable = base.getTable(EMPLOYEE_TABLE_ID);
const employeeQuery = await employeeTable.selectRecordsAsync({
    fields: ['Name', 'Email', 'Mobile Number', 'Active Roster', 'Staff Type']
});

const casualStaff = employeeQuery.records.filter(record => {
    const isActiveRoster = record.getCellValue('Active Roster');
    const staffType = record.getCellValue('Staff Type');
    return isActiveRoster && staffType && staffType.name === 'Casual';
});

console.log(`Found ${casualStaff.length} casual staff members to notify`);

// Send reminders to each casual staff member
for (const employee of casualStaff) {
    const name = employee.getCellValue('Name');
    const email = employee.getCellValue('Email');
    const mobile = employee.getCellValue('Mobile Number');
    
    // Log for tracking (actual SMS sending would be done via webhook or integration)
    console.log(`Sending reminder to ${name} (${email}) - Mobile: ${mobile}`);
    
    // Here you would integrate with your SMS service
    // Example: Send to webhook or Twilio integration
}

output.set('notified_count', casualStaff.length);
output.set('notified_staff', casualStaff.map(r => r.getCellValue('Name')).join(', '));
```

### 2. Generate Weekly Roster for Full-Time Staff

**Trigger**: Weekly schedule (e.g., Sunday at midnight)

**Script**:
```javascript
// Generate Weekly Roster Records for Full-Time Staff
// This automation creates roster records for the upcoming week based on fixed availability

const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';

// Calculate the start of next week (Monday)
const today = new Date();
const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
const nextMonday = new Date(today);
nextMonday.setDate(today.getDate() + daysUntilMonday);
nextMonday.setHours(0, 0, 0, 0);

// Format date for Airtable
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Get all full-time staff
const employeeTable = base.getTable(EMPLOYEE_TABLE_ID);
const employeeQuery = await employeeTable.selectRecordsAsync({
    fields: [
        'Name', 'Staff Type', 'Active Roster',
        'Fixed Monday', 'Fixed Monday Start', 'Fixed Monday End',
        'Fixed Tuesday', 'Fixed Tuesday Start', 'Fixed Tuesday End',
        'Fixed Wednesday', 'Fixed Wednesday Start', 'Fixed Wednesday End',
        'Fixed Thursday', 'Fixed Thursday Start', 'Fixed Thursday End',
        'Fixed Friday', 'Fixed Friday Start', 'Fixed Friday End',
        'Fixed Saturday', 'Fixed Saturday Start', 'Fixed Saturday End',
        'Fixed Sunday', 'Fixed Sunday Start', 'Fixed Sunday End'
    ]
});

const fullTimeStaff = employeeQuery.records.filter(record => {
    const staffType = record.getCellValue('Staff Type');
    const isActiveRoster = record.getCellValue('Active Roster');
    return staffType && staffType.name === 'Full Time' && isActiveRoster;
});

console.log('Processing ' + fullTimeStaff.length + ' full-time staff members');

// Get roster table
const rosterTable = base.getTable(ROSTER_TABLE_ID);
const recordsToCreate = [];

// Days of the week
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Process each full-time employee
for (const employee of fullTimeStaff) {
    const employeeId = employee.id;
    const employeeName = employee.getCellValue('Name');
    
    // Check each day of the week
    days.forEach((day, index) => {
        const isAvailable = employee.getCellValue(`Fixed ${day}`);
        
        if (isAvailable) {
            const startTime = employee.getCellValue(`Fixed ${day} Start`) || '9:00 AM';
            const endTime = employee.getCellValue(`Fixed ${day} End`) || '5:00 PM';
            
            // Calculate the date for this day
            const rosterDate = new Date(nextMonday);
            rosterDate.setDate(nextMonday.getDate() + index);
            
            // Create roster record
            recordsToCreate.push({
                fields: {
                    'Employee': [{id: employeeId}],
                    'Date': formatDate(rosterDate),
                    'Week Starting': formatDate(nextMonday),
                    'Available From': startTime,
                    'Available Until': endTime,
                    'Availability Status': {name: 'Active'},
                    'Notes': 'Auto-generated from fixed schedule'
                }
            });
        }
    });
}

// Create all roster records in batches
if (recordsToCreate.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < recordsToCreate.length; i += batchSize) {
        const batch = recordsToCreate.slice(i, i + batchSize);
        await rosterTable.createRecordsAsync(batch);
        console.log('Created ' + batch.length + ' roster records');
    }
}

output.set('records_created', recordsToCreate.length);
output.set('week_starting', formatDate(nextMonday));
output.set('staff_processed', fullTimeStaff.map(r => r.getCellValue('Name')).join(', '));
```

### 3. Process Weekly Availability Submissions (Updated)

**Update the existing automation to skip processing for full-time staff**

```javascript
// Updated Weekly Availability Submission Processing
// Skip submissions from full-time staff (they shouldn't be submitting anyway)

// ... existing trigger and input code ...

// Get the employee record
const employeeId = submission.getCellValue('Employee')[0];
const employeeTable = base.getTable('tbltAE4NlNePvnkpY');
const employeeRecord = await employeeTable.selectRecordAsync(employeeId, {
    fields: ['Name', 'Staff Type']
});

// Check if employee is casual (only process casual staff submissions)
const staffType = employeeRecord.getCellValue('Staff Type');
if (staffType && staffType.name === 'Full Time') {
    console.log(`Skipping submission from full-time staff: ${employeeRecord.getCellValue('Name')}`);
    output.set('status', 'skipped');
    output.set('reason', 'Full-time staff - uses fixed schedule');
    return;
}

// Continue with existing processing logic for casual staff...
// ... rest of the existing automation code ...
```

## Implementation Steps

1. ✅ Added Staff Type field to Employee Details table
2. ✅ Added fixed availability fields for each day of the week
3. 📋 Configure the above automations in Airtable
4. 📋 Update existing reminder automation to filter by Staff Type
5. 📋 Test with sample full-time and casual staff

## Important: Airtable Script Compatibility

The Airtable scripting environment has limitations compared to modern JavaScript. A corrected version of the full-time roster generation script has been created at:

**`airtable-fulltime-roster-generation.js`**

This script follows Airtable best practices:
- ✅ Uses `var` instead of `const/let`
- ✅ No template literals (uses string concatenation)
- ✅ Traditional function syntax
- ✅ Proper handling of linked records as arrays
- ✅ Explicit null/empty checks
- ✅ Error handling for batch operations

When setting up the automation in Airtable, copy the contents from this file rather than using the inline script shown earlier.

### Key Syntax Differences for Airtable Scripts:

```javascript
// ❌ Don't use template literals
console.log(`Processing ${count} records`);

// ✅ Use string concatenation
console.log('Processing ' + count + ' records');

// ❌ Don't use arrow functions
const formatDate = (date) => date.toISOString();

// ✅ Use traditional functions
function formatDate(date) {
    return date.toISOString();
}

// ❌ Don't use const/let
const records = [];

// ✅ Use var
var records = [];

// ✅ Always handle linked records as arrays
fields['Employee'] = [{id: employeeId}];  // Even for single links

// ✅ Use explicit loops instead of forEach
for (var i = 0; i < array.length; i++) {
    var item = array[i];
    // process item
}
```

## Testing Checklist

- [ ] Set a staff member as "Full Time" with fixed availability
- [ ] Verify they don't receive availability submission reminders
- [ ] Run the roster generation automation
- [ ] Confirm roster records are created correctly
- [ ] Set a staff member as "Casual"
- [ ] Verify they receive reminders as normal
- [ ] Verify their submissions are processed normally

## Benefits

1. **Reduced Admin Work**: No need to process weekly submissions for full-time staff
2. **Consistency**: Full-time staff always have their regular schedule
3. **Flexibility**: Casual staff continue to submit availability as needed
4. **Automation**: Roster records are automatically generated weekly

## Frontend Changes Made

### 1. Management Allocations Page (`management-allocations.html`)

Added visual indicators for staff type:
- Full-time staff show a blue "FULL TIME" badge
- Casual staff show an orange "CASUAL" badge
- Staff type is loaded and displayed in the available staff list

### 2. Availability Form (`availability.html`)

Updated to handle full-time staff differently:
- Checks staff type when loading
- Full-time staff see their fixed schedule instead of the submission form
- Shows an informative message explaining they don't need to submit
- Displays their weekly fixed schedule in a nice grid format

## How to Set Up Fixed Availability

1. **In Airtable Employee Details**:
   - Set `Staff Type` to "Full Time"
   - Check the days they work (e.g., `Fixed Monday`, `Fixed Tuesday`)
   - Enter their start/end times (e.g., `Fixed Monday Start`: "9:00 AM", `Fixed Monday End`: "5:00 PM")
   - Ensure `Active Roster` is checked

2. **Example Configuration**:
   ```
   Name: John Smith
   Staff Type: Full Time
   Active Roster: ✓
   Fixed Monday: ✓
   Fixed Monday Start: 9:00 AM
   Fixed Monday End: 5:00 PM
   Fixed Tuesday: ✓
   Fixed Tuesday Start: 9:00 AM
   Fixed Tuesday End: 5:00 PM
   ... (continue for other days)
   Fixed Saturday: ✗
   Fixed Sunday: ✗
   ```

## System Behavior

### For Full-Time Staff:
1. **No Weekly Reminders**: They won't receive SMS reminders to submit availability
2. **Automatic Roster Creation**: System creates their roster records weekly based on fixed schedule
3. **Availability Form**: Shows their fixed schedule instead of submission form
4. **Manager View**: Shows "FULL TIME" badge in allocation screen

### For Casual Staff:
1. **Weekly Reminders**: Continue receiving SMS reminders (if Active Roster is checked)
2. **Manual Submission**: Must submit availability each week via the form
3. **Availability Form**: Works as before - they select days/times
4. **Manager View**: Shows "CASUAL" badge in allocation screen

## Maintenance Notes

- Fixed schedules are stored directly in Employee Details table
- Changes to fixed schedules take effect the following week
- Managers can update fixed schedules by editing Employee Details fields
- The system respects public holidays and special circumstances through manual adjustments

## Implementation Status

**Completed September 15, 2025:**
- ✅ Airtable schema updated with Staff Type and fixed availability fields
- ✅ Automation script created and tested successfully
- ✅ Frontend updates to management-allocations.html
- ✅ Availability form updated to show fixed schedules
- ✅ Employee directory enhanced with fixed hours editing
- ✅ SMS reminder script updated to exclude full-time staff
- ✅ All changes deployed to production

## Known Issues Resolved

1. **Time Format Parsing**: Script now handles "6am", "10pm", "9:00 AM" formats
2. **DateTime Field Requirements**: Converts time strings to full ISO datetime values
3. **Airtable Script Syntax**: Converted all modern JS to compatible syntax
4. **Staff Type Display**: Shows badges in management allocations interface
