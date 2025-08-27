# Airtable Booking Response Fields - Setup Guide

## Overview
To enable employees to accept/decline booking allocations (onboarding/deloading), the following fields need to be added to the Bookings Dashboard table in Airtable.

## Required Fields to Add

### In Bookings Dashboard Table (tblRe0cDmK3bG2kPf)

Add these two new fields:

1. **Onboarding Response**
   - Field Type: Single Select
   - Options:
     - `Pending` (default)
     - `Accepted` 
     - `Declined`
   - Description: Tracks the onboarding employee's response to this booking allocation

2. **Deloading Response**
   - Field Type: Single Select
   - Options:
     - `Pending` (default)
     - `Accepted`
     - `Declined`
   - Description: Tracks the deloading employee's response to this booking allocation

## How to Add These Fields

### Step 1: Access Airtable Base
1. Log into Airtable
2. Open the "MBH Bookings Operation" base (applkAFOn2qxtu7tx)
3. Navigate to the "Bookings Dashboard" table

### Step 2: Add Onboarding Response Field
1. Click the "+" button at the end of your field headers
2. Select "Single select" as the field type
3. Name it: `Onboarding Response`
4. Add options:
   - Click "Add an option" 
   - Type `Pending` and choose a yellow/orange color
   - Add `Accepted` with a green color
   - Add `Declined` with a red color
5. Click "Create field"

### Step 3: Add Deloading Response Field
1. Repeat the same process
2. Name it: `Deloading Response`
3. Add the same three options with the same colors
4. Click "Create field"

## How It Works

### Employee Perspective:
1. Employee opens My Schedule page
2. Sees booking allocations in their calendar
3. Clicks on a booking to open details modal
4. Clicks the status badge (shows "Pending" by default)
5. Selects Accept or Decline
6. Status updates immediately in Airtable

### Data Flow:
```
Employee clicks Accept/Decline
  ↓
System identifies booking ID and role (Onboarding/Deloading)
  ↓
Updates appropriate response field in Bookings Dashboard
  ↓
Calendar refreshes to show new status color
  ↓
Management can see responses in Airtable
```

### Visual Indicators:
- **Pending (⏳)**: Yellow/orange background - awaiting response
- **Accepted (✅)**: Green background - employee confirmed
- **Declined (❌)**: Red background - employee unavailable

## Benefits

1. **Visibility**: Management can see at a glance which bookings have confirmed staff
2. **Flexibility**: Employees can update their availability anytime
3. **Tracking**: Historical record of responses for each booking
4. **Integration**: Works seamlessly with existing SMS notification system

## Testing

After adding the fields:
1. Assign an employee to a booking (Onboarding or Deloading)
2. Log in as that employee on the staff portal
3. Go to My Schedule
4. Click on the booking allocation
5. Click the status badge and change response
6. Verify the field updates in Airtable

## Future Enhancements

Consider adding:
- **Response Date/Time**: Track when the response was made
- **Response Method**: Track if response came from SMS, Portal, or Manual
- **Response Notes**: Allow employees to add availability notes
- **Auto-notifications**: Alert managers when bookings are declined

## Important Notes

- These fields are independent of the Shift Allocations table
- Booking responses are stored directly in the booking record
- The system will check these fields when loading schedules
- Default to "Pending" if fields are empty

## Support

If you need help setting up these fields:
1. Check Airtable's documentation on Single Select fields
2. Ensure you have edit permissions for the base
3. Test with a few bookings before full deployment
