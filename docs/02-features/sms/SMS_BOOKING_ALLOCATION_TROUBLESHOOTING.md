# SMS Booking Allocation Troubleshooting Guide

## Confirmed Working
- Staff allocation saves correctly to Airtable ✅
- Onboarding/Deloading fields update properly ✅

## SMS Not Sending - Common Causes

### 1. Check Airtable Automation
Go to your Airtable base (applkAFOn2qxtu7tx) and check:

1. **Automations Tab** → Find the automation that triggers on "Onboarding Employee" or "Deloading Employee" field changes
2. **Check Conditions** - Common conditions that block SMS:
   - Booking date must be within X days (often 1-3 days)
   - Time restrictions (business hours only)
   - Status must be PAID or PART
   - Employee must have valid phone number

### 2. Quick Tests

#### Test 1: Near-Future Booking
1. Find or create a booking for tomorrow or day after
2. Assign Test Staff
3. Check if SMS sends

#### Test 2: Check Automation History
1. In Airtable → Automations
2. Click on the relevant automation
3. View "Run history"
4. Look for recent runs and any errors

#### Test 3: Manual Trigger
1. Find the booking in Airtable
2. Clear the "Onboarding Employee" field
3. Re-add Test Staff
4. This should re-trigger the automation

### 3. Test Staff Details
- Record ID: recU2yfUOIGFsIuZV
- Phone: +61424913757
- Ensure this number is not blocked/blacklisted

### 4. Booking Details to Check
For the David Heibl booking:
- Booking Date: 2025-09-14 (6 days from now)
- Status: PAID ✅
- Onboarding Time: 8:30 AM
- This might be too far in advance for SMS

## Recommended Actions

1. **Check Automation Conditions**
   - Look for date range restrictions
   - Check for "days before booking" conditions

2. **Test with Tomorrow's Booking**
   - Create a test booking for tomorrow
   - Assign staff and check if SMS sends

3. **Review Automation Logic**
   - The automation might be designed to send SMS closer to the booking date
   - This prevents early notifications that customers might forget

## Code Reference
The web app correctly notes (line 2149 in management-allocations.html):
```javascript
// Note: SMS notifications are handled by Airtable automations
// when staff are assigned to bookings
```

The system relies entirely on Airtable automations for booking allocation SMS.
