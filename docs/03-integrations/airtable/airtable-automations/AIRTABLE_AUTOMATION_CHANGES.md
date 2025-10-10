# Airtable Automation Changes Required

## Overview
Once you switch to the custom webhook API, you'll need to update your Airtable automation to trigger differently.

## Current Setup (Remove)
```
Trigger: Webhook
Action 1: Script (parse webhook)
Action 2: Script (send SMS)
```

## New Setup (Implement)
```
Trigger: When record is created
Table: Bookings Dashboard
Action: Script (send SMS - use existing script)
```

## Step-by-Step Changes

### 1. Create New Automation
Don't modify the existing one yet - create a new automation:

1. **Name**: "Booking Created - Send SMS"
2. **Trigger**: "When record is created"
   - Table: Bookings Dashboard
3. **Action**: "Run a script"
   - Copy your existing SMS script
   - Update input variables:
     - `recordId` → From trigger
     - `bookingCode` → From trigger record
     - `customerName` → From trigger record
     - `customerEmail` → From trigger record
     - `status` → From trigger record
     - `bookingItems` → From trigger record
     - `addOns` → From trigger record (NEW)
     - `startDate` → From trigger record
     - `endDate` → From trigger record
     - `startTime` → From trigger record
     - `endTime` → From trigger record
     - `bookingDuration` → From trigger record
     - `totalAmount` → From trigger record

### 2. Update SMS Script
Your existing SMS script should work, but ensure it includes add-ons:

```javascript
// Get add-ons from input
let addOns = inputConfig['addOns'] || '';

// Include in message if present
if (addOns) {
    message += `\n🎣 Add-ons: ${addOns}`;
}
```

### 3. Test the New Flow
1. Create a test booking via the API
2. Verify record appears in Airtable
3. Check that SMS automation triggers
4. Confirm SMS includes all items

### 4. Migration Plan
1. **Deploy** the webhook API to Railway
2. **Test** with a few bookings
3. **Create** the new Airtable automation
4. **Run both** automations in parallel briefly
5. **Update** Checkfront webhook URL
6. **Disable** the old webhook automation
7. **Monitor** for 24 hours
8. **Delete** the old automation

## Benefits of This Approach

✅ **Simpler**: No need to parse webhook data in Airtable
✅ **Reliable**: Airtable's "record created" trigger is rock solid
✅ **Debuggable**: Can see all data in the record before SMS sends
✅ **Flexible**: Easy to add conditions (e.g., only SMS for PAID status)

## Rollback Plan

If issues arise:
1. Update Checkfront webhook back to Airtable URL
2. Re-enable the old automation
3. Debug the API issue separately

The beauty is that both systems can run in parallel during testing!
