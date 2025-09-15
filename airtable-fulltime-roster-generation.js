// Airtable Automation Script: Generate Roster for Full-Time Staff
// This script follows Airtable scripting environment best practices
// Run weekly (e.g., Sunday night for the following week)

// Configuration
var EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY'; // Employee Details
var ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN'; // Roster

// Calculate next Monday
var today = new Date();
var daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
var nextMonday = new Date(today);
nextMonday.setDate(today.getDate() + daysUntilMonday);

// Helper function to format dates
function formatDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Helper function to create datetime from date and time string
function createDateTime(date, timeString) {
    var hours = 9; // Default hour
    var minutes = 0; // Default minutes
    var isPM = false;
    
    // First try standard format (e.g., "9:00 AM" or "2:30 PM")
    var timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    if (timeParts) {
        hours = parseInt(timeParts[1]);
        minutes = parseInt(timeParts[2]);
        isPM = timeParts[3].toUpperCase() === 'PM';
    } else {
        // Try simple format (e.g., "6am", "10pm", "2.30pm")
        var simpleTime = timeString.match(/(\d{1,2})(?:\.(\d{2}))?\s*(am|pm|om)/i);
        
        if (simpleTime) {
            hours = parseInt(simpleTime[1]);
            minutes = simpleTime[2] ? parseInt(simpleTime[2]) : 0;
            var suffix = simpleTime[3].toLowerCase();
            
            // Handle typos like "10om" as "10pm"
            if (suffix === 'om') {
                suffix = 'pm';
                console.log('Correcting typo: ' + timeString + ' to ' + hours + 'pm');
            }
            
            isPM = suffix === 'pm';
        } else {
            console.log('Invalid time format: ' + timeString + ', using 9:00 AM');
            hours = 9;
            minutes = 0;
            isPM = false;
        }
    }
    
    // Convert to 24-hour format
    if (isPM && hours !== 12) {
        hours += 12;
    } else if (!isPM && hours === 12) {
        hours = 0;
    }
    
    // Create new date object with the time
    var dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    
    // Return ISO string for Airtable
    return dateTime.toISOString();
}

// Get all full-time staff
var employeeTable = base.getTable(EMPLOYEE_TABLE_ID);
var employeeQuery = await employeeTable.selectRecordsAsync({
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

// Filter for full-time active staff
var fullTimeStaff = [];
for (var i = 0; i < employeeQuery.records.length; i++) {
    var record = employeeQuery.records[i];
    var staffType = record.getCellValue('Staff Type');
    var isActiveRoster = record.getCellValue('Active Roster');
    
    if (staffType && staffType.name === 'Full Time' && isActiveRoster === true) {
        fullTimeStaff.push(record);
    }
}

console.log('Processing ' + fullTimeStaff.length + ' full-time staff members');

// Get roster table
var rosterTable = base.getTable(ROSTER_TABLE_ID);
var recordsToCreate = [];

// Days of the week
var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Process each full-time employee
for (var i = 0; i < fullTimeStaff.length; i++) {
    var employee = fullTimeStaff[i];
    var employeeId = employee.id;
    var employeeName = employee.getCellValue('Name');
    
    console.log('Processing employee: ' + employeeName);
    
    var employeeDaysFound = 0;
    
    // Check each day of the week
    for (var dayIndex = 0; dayIndex < days.length; dayIndex++) {
        var day = days[dayIndex];
        var isAvailable = employee.getCellValue('Fixed ' + day);
        
        if (isAvailable === true) {
            employeeDaysFound++;
            
            var startTime = employee.getCellValue('Fixed ' + day + ' Start');
            var endTime = employee.getCellValue('Fixed ' + day + ' End');
            
            // Use defaults if not specified
            if (!startTime || startTime === '') {
                startTime = '6:00 AM';  // Match MBH's typical start time
            }
            if (!endTime || endTime === '') {
                endTime = '10:00 PM';   // Match MBH's typical end time
            }
            
            // Calculate the date for this day
            var rosterDate = new Date(nextMonday.getTime());
            rosterDate.setDate(nextMonday.getDate() + dayIndex);
            
            // Convert time strings to full datetime values
            var availableFrom = createDateTime(rosterDate, startTime);
            var availableUntil = createDateTime(rosterDate, endTime);
            
            // Create roster record data
            var recordData = {
                fields: {
                    'Employee': [{id: employeeId}],  // Linked record must be array
                    'Date': formatDate(rosterDate),
                    'Week Starting': formatDate(nextMonday),
                    'Available From': availableFrom,
                    'Available Until': availableUntil,
                    'Availability Status': {name: 'Active'},  // Select field format
                    'Notes': 'Auto-generated from fixed schedule'
                }
            };
            
            recordsToCreate.push(recordData);
        }
    }
    
    if (employeeDaysFound === 0) {
        console.log('Warning: ' + employeeName + ' has no fixed days configured');
    } else {
        console.log('Added ' + employeeDaysFound + ' days for ' + employeeName);
    }
}

console.log('Total roster records to create: ' + recordsToCreate.length);

// Create all roster records in batches
if (recordsToCreate.length > 0) {
    var batchSize = 50;  // Airtable limit
    var totalCreated = 0;
    
    for (var i = 0; i < recordsToCreate.length; i += batchSize) {
        var endIndex = Math.min(i + batchSize, recordsToCreate.length);
        var batch = recordsToCreate.slice(i, endIndex);
        
        try {
            await rosterTable.createRecordsAsync(batch);
            totalCreated += batch.length;
            console.log('Created batch of ' + batch.length + ' roster records');
        } catch (error) {
            console.log('Error creating batch: ' + error.message);
        }
    }
}

// Build list of processed staff names
var processedStaffNames = [];
for (var j = 0; j < fullTimeStaff.length; j++) {
    var staffName = fullTimeStaff[j].getCellValue('Name');
    if (staffName) {
        processedStaffNames.push(staffName);
    }
}

// Set output variables for the automation
output.set('records_created', recordsToCreate.length);
output.set('week_starting', formatDate(nextMonday));
output.set('staff_processed', processedStaffNames.join(', '));

console.log('Roster generation complete!');
console.log('Week starting: ' + formatDate(nextMonday));
console.log('Records created: ' + recordsToCreate.length);
console.log('Staff processed: ' + processedStaffNames.join(', '));
