# Airtable Automation Fix - July 2025

## Issue Summary
The Airtable automation for processing Weekly Availability Submissions started failing with two main errors:
1. **Field Not Found Error**: "Could not find a field with name or ID 'Test'"
2. **Record Not Found Error**: "Submission record not found"

## Root Causes

### 1. Incorrect Field Name in Automation Script
The automation script was using `"Test"` as the field name for the employee link, but the actual field name in the Roster table is `"Employee"`.

### 2. Missing Submission ID from Web App
The MBH Staff Portal web app was creating availability submissions without the required `Submission ID` field, which other records had in the format `WK[date]-[employeeCode]`.

## Solutions Applied

### 1. Fixed Automation Script Field Name
Changed the field mapping in the Airtable automation script:

```javascript
// BEFORE (incorrect)
let fieldData = {
    "Test": [{id: employeeId}],  // Wrong field name
    "Date": dateString,
    "Availability Status": {name: "Active"}
};

// AFTER (correct)
let fieldData = {
    "Employee": [{id: employeeId}],  // Correct field name
    "Date": dateString,
    "Availability Status": {name: "Active"}
};
```

### 2. Updated Web App to Generate Submission IDs
Modified `mbh-staff-portal/training/availability.html` to automatically generate Submission IDs:

```javascript
// Generate Submission ID
const weekStarting = document.getElementById('weekStarting').value;
// Extract last part of employee ID for the code (e.g., "recdInFO4p3ennWpe" -> "ennWpe")
const employeeCode = employeeRecordId.slice(-6);
const submissionId = `WK${weekStarting}-${employeeCode}`;

// Include in form data
const formData = {
    "fields": {
        "Submission ID": submissionId,  // Now included
        "Employee": [employeeRecordId],
        "Week Starting": weekStarting,
        // ... other fields
    }
};
```

### 3. Cleaned Up Invalid Records
Deleted availability submission records that were missing Submission IDs to prevent processing errors.

## Verification
After applying these fixes:
- The automation successfully processed submission `recLWkFNkXRL8Frbr`
- Created 4 roster records for the available days
- Updated submission status to "Processed"

## Time Format Handling
The automation correctly handles various time formats:
- Plain numbers: "8" → 8:00 AM, "5" → 5:00 PM
- 12-hour format: "9:00 AM", "5:30 PM"
- 24-hour format: "18:00", "14:30"
- Informal format: "9am", "2.30pm"

Business hours logic for plain numbers:
- 7-23: Interpreted as-is (7am-11pm)
- 1-6: Assumed PM (1pm-6pm)

## Lessons Learned

1. **Field Name Consistency**: Always verify field names match between Airtable tables and automation scripts
2. **Required Fields**: Ensure web applications generate all fields that Airtable automations expect
3. **Data Validation**: The Submission ID field is critical for tracking and processing submissions
4. **Time Format Flexibility**: The automation handles multiple time formats, making it user-friendly

## Future Recommendations

1. **Add Validation**: The web app should validate that all required fields are present before submission
2. **Error Handling**: Improve error messages in the automation to clearly indicate which fields are missing
3. **Documentation**: Keep field mappings documented and updated when table structures change
4. **Testing**: Test automations after any changes to table structures or field names 