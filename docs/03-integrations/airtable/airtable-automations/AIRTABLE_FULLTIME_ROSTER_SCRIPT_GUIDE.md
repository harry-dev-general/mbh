# Airtable Full-Time Roster Generation Script Guide

## Overview
This script generates weekly roster entries for full-time staff based on their fixed availability schedule.

## Script Location
`airtable-fulltime-roster-generation.js`

## How to Use in Airtable

### 1. Create New Automation
1. Go to your Airtable base (MBH Bookings Operation)
2. Click "Automations" in the top menu
3. Create new automation: "Generate Full-Time Staff Roster"

### 2. Set Trigger
- **Type**: "At scheduled time"
- **Frequency**: Weekly
- **Day**: Sunday
- **Time**: 11:00 PM
- **Timezone**: Australia/Sydney

### 3. Add Script Action
1. Add action: "Run a script"
2. Copy the entire contents of `airtable-fulltime-roster-generation.js`
3. Paste into the script editor

### 4. Test the Script
1. Click "Test" in the script editor
2. Check console output for:
   - Number of full-time staff found
   - Roster records created
   - Any errors

## Script Features

### Compatibility
- ✅ Uses `var` declarations (no const/let)
- ✅ Traditional function syntax (no arrow functions)
- ✅ String concatenation (no template literals)
- ✅ Explicit loops (no forEach)
- ✅ Proper linked record handling (arrays)

### Error Handling
- Checks for null/empty values
- Handles batch creation errors
- Provides detailed console logging

### Field Mapping
```javascript
// Input fields from Employee Details
'Staff Type' → Must be "Full Time"
'Active Roster' → Must be checked
'Fixed [Day]' → Checkbox for each day
'Fixed [Day] Start' → Start time (defaults to 6:00 AM)
'Fixed [Day] End' → End time (defaults to 10:00 PM)

// Supported time formats:
- "9:00 AM" or "2:30 PM" (standard format)
- "6am" or "10pm" (simple format)
- "2.30pm" (with dot separator)
- Note: Typos like "10om" are corrected to "10pm"

// Output fields to Roster table
'Employee' → Linked to employee record
'Date' → Specific date (YYYY-MM-DD)
'Week Starting' → Monday date
'Available From' → Start time
'Available Until' → End time
'Availability Status' → "Active"
'Notes' → "Auto-generated from fixed schedule"
```

## Troubleshooting

### "Unexpected identifier" Error
- Check for template literals (backticks `)
- Ensure all strings use quotes (' or ")
- Verify no modern JS syntax

### Field Cannot Accept Value Error
- **Issue**: "Field 'fldnR9xbkp0nWIVkv' cannot accept the provided value"
- **Cause**: Available From/Until fields are DateTime type, not text
- **Solution**: Script now converts time strings to full datetime ISO values

### No Records Created
- Check Staff Type is exactly "Full Time"
- Verify Active Roster is checked
- Ensure at least one Fixed [Day] is checked
- Verify staff has fixed schedule times configured

### Linked Record Errors
- Employee field must be array: `[{id: employeeId}]`
- Even for single links

## Example Console Output
```
Processing 3 full-time staff members
Processing employee: John Smith
Processing employee: Jane Doe
Processing employee: Bob Johnson
Total roster records to create: 15
Created batch of 15 roster records
Roster generation complete!
Week starting: 2025-11-24
Records created: 15
Staff processed: John Smith, Jane Doe, Bob Johnson
```
