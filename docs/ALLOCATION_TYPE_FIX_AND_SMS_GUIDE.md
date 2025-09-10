# Allocation Type Fix and SMS Guide

## Issue Fixed (September 8, 2025)

### Problem
When allocating staff to bookings via the management-allocations page, selecting "onboarding" would incorrectly update the "deloading" field instead.

### Root Cause
HTML ID collision - two different elements had `id="allocationType"`:
1. A `<select>` dropdown in the general allocation modal
2. A hidden `<input>` in the booking allocation modal

When JavaScript tried to read the allocation type, it was getting the wrong element's value.

### Solution
Renamed the booking allocation modal's hidden input from:
- `id="allocationType"` → `id="bookingAllocationType"`

Updated all JavaScript references to use the new ID.

## SMS Notification System

### How SMS Works for Bookings
1. **Booking Allocations**: SMS notifications are handled by Airtable automations
2. **General Allocations**: SMS sent via `/api/send-shift-notification` endpoint

### Troubleshooting Missing SMS for Bookings

If SMS notifications aren't being sent when allocating staff to bookings:

1. **Check Airtable Automation History**
   - Go to your Airtable base (applkAFOn2qxtu7tx)
   - Click on "Automations" 
   - Look for automations that trigger on "Onboarding Employee" or "Deloading Employee" field updates
   - Check the run history to see if it's triggering

2. **Common Automation Conditions to Verify**
   - Booking date is in the future
   - Booking status is "PAID" or "PART"
   - Employee has a valid phone number
   - No duplicate SMS prevention rules blocking it

3. **Test Staff Considerations**
   - "Test Staff" (recU2yfUOIGFsIuZV) uses phone +61414960734
   - Ensure this number is whitelisted in your SMS system
   - Check if test mode affects SMS sending

4. **Timing Windows**
   - Some automations only send SMS within certain time windows
   - Check if there's a "days before booking" condition
   - Verify time zone settings (should be Sydney time)

### Manual SMS Trigger
If you need to manually trigger an SMS for a booking allocation:
1. Go to the booking record in Airtable
2. Clear and re-set the employee field
3. This should re-trigger the automation

## Testing the Fix
1. Open management-allocations page
2. Click on an onboarding allocation
3. Select a staff member
4. Submit → Should update "Onboarding Employee" field
5. Repeat for deloading → Should update "Deloading Employee" field

## Deployment
Fix deployed on September 8, 2025 via commit `191b89b`
