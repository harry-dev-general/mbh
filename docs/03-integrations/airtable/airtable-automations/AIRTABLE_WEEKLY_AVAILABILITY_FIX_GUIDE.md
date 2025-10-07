# Airtable Weekly Availability Form - Employee Field Prefilling Fix

## Problem Summary
The Employee field in the "New Weekly Availability Submissions" form was not being prefilled when employees clicked the SMS link, even though the Week Starting and Submission ID fields were properly prefilled.

## Root Cause
The original script had two issues:
1. The Employee field parameter was missing from the form URL
2. The Employee field is a **multiple linked records** field (multipleRecordLinks), which requires an array format even when prefilling a single employee

For linked record fields in Airtable forms, you need to:
1. Include the field in the prefill parameters
2. Use the record ID (not the name) as the value
3. For multiple linked records fields, pass the ID(s) as a JSON array

## Solution

### Key Changes Made:

1. **Added Employee Field to Prefill Parameters with Array Format**
   ```javascript
   `prefill_Employee=${encodeURIComponent(JSON.stringify([employeeId]))}`,  // Pass as array
   ```

2. **Hidden the Employee Field**
   ```javascript
   `hide_Employee=true`,  // Hide since it's automatically prefilled
   ```

### Complete Fixed Script:

The main changes in the URL parameter section:
```javascript
// Build URL parameters - Now INCLUDING Employee field prefill
let prefillParams = [
    `prefill_Employee=${employeeId}`,  // Added: Prefill the Employee linked record field
    `prefill_Week%20Starting=${weekStartingFormatted}`,
    `prefill_Submission%20ID=${encodeURIComponent(submissionId)}`,
    `hide_Employee=true`,  // Hide the Employee field since it's prefilled
    `hide_Week%20Starting=true`,
    `hide_Submission%20ID=true`,
    `hide_Processing%20Status=true`
].join('&');
```

## Implementation Steps:

1. **Update Your Airtable Automation Script**
   - Go to your MBH Bookings Operation base
   - Navigate to Automations
   - Find your Monday 9am automation
   - Replace the script with the fixed version

2. **Verify the Automation Input Configuration**
   - Ensure the Find Records action is passing both:
     - `employeeName` (from the Name field)
     - `employeeId` (the Airtable record ID)
   - The employeeId must be the actual Airtable record ID (starts with "rec...")

3. **Test the Fix**
   - Run a test of the automation
   - Click the generated form URL
   - Verify that:
     - The form loads correctly
     - Employee field is prefilled and hidden
     - Week Starting is prefilled and hidden
     - Submission ID is prefilled and hidden
     - Only the availability fields are visible

## Important Notes:

1. **Employee ID Format**: The `employeeId` variable must contain the Airtable record ID (e.g., "recXXXXXXXXXXXXXX"), not just an employee number or name.

2. **URL Encoding**: The script properly handles URL encoding for special characters in the submission ID.

3. **Field Visibility**: The Employee field is now hidden since it's automatically prefilled, preventing any accidental changes by employees.

4. **Debugging**: The console.log statements will help verify the correct values are being used during testing.

## Alternative Approach:

If the JSON array format doesn't work with your form, try this alternative URL format:

```javascript
// Alternative: Use bracket notation for array
`prefill_Employee[0]=${employeeId}`,  // Alternative array syntax
```

This would make your prefill parameters look like:
```javascript
let prefillParams = [
    `prefill_Employee[0]=${employeeId}`,  // Alternative array syntax
    `prefill_Week%20Starting=${weekStartingFormatted}`,
    `prefill_Submission%20ID=${encodeURIComponent(submissionId)}`,
    `hide_Employee=true`,
    `hide_Week%20Starting=true`,
    `hide_Submission%20ID=true`,
    `hide_Processing%20Status=true`
].join('&');
```

## Troubleshooting:

If the Employee field is still not prefilling:

1. **Check the employeeId value**: Add a console.log to verify it's a valid Airtable record ID:
   ```javascript
   console.log("Employee ID format:", employeeId);  // Should show "recXXXXXXXXXXXXXX"
   ```

2. **Verify the field name**: Ensure "Employee" matches exactly (case-sensitive) with the field name in your form.

3. **Test the URL manually**: Copy a generated URL and check if all parameters are properly formatted.

4. **Check form settings**: Ensure the Employee field is not set to "required" in a way that conflicts with prefilling.

## Benefits of This Fix:

1. **Improved Data Accuracy**: Ensures submissions are always linked to the correct employee
2. **Better User Experience**: Employees don't need to find and select their name
3. **Reduced Errors**: Eliminates the possibility of employees selecting the wrong name
4. **Faster Form Completion**: One less field for employees to worry about 