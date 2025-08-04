# Checklist ID Implementation

## Overview
Implemented automatic Checklist ID generation for Post-Departure Checklist submissions.

## Format
`Vessel name - Employee first name - date`

Example: `Seafire - John - 23-07-2025`

## Implementation Details

### 1. **Added Global Variables**
- `employeeFirstName`: Stores the staff member's first name
- `selectedBoatName`: Stores the selected vessel's name

### 2. **Enhanced Employee Record Fetching**
The `findEmployeeRecord()` function now retrieves and stores:
- Employee Record ID (existing)
- Employee First Name (new) - extracted from the "Name" field by taking the first word

### 3. **Updated Booking Selection**
The `selectBooking()` function now stores:
- Selected booking object (existing)
- Selected boat name (new)

### 4. **Checklist ID Generation**
In `handleSubmit()`, before creating the checklist record:
1. Gets current date in DD-MM-YYYY format
2. Combines: `${vesselName} - ${firstName} - ${date}`
3. Adds to Airtable submission as "Checklist ID" field

## Date Format
- Uses Australian date format: DD-MM-YYYY
- Example: 23-07-2025 (July 23, 2025)

## Fallback Handling
- If employee first name is not found: Uses "Unknown"
- Example: `Seafire - Unknown - 23-07-2025`

## Benefits
1. **Unique Identification**: Each checklist has a human-readable ID
2. **Quick Reference**: Easy to identify who did what and when
3. **Searchable**: Can quickly find checklists by vessel, staff, or date
4. **Audit Trail**: Clear tracking of vessel checks

## Verification
Check browser console for:
- "Employee found:" log with firstName
- "Generated Checklist ID:" log with full ID

## Airtable Field
Ensure the "Checklist ID" field exists in the Post-Departure Checklist table as a single line text field. 