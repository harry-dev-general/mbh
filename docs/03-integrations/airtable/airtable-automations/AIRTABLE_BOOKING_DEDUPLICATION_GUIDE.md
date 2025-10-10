# Booking Deduplication Automation Guide

## Problem Solved
When your booking system creates new records for status changes (pending → paid → void), it creates duplicate records that can:
- Confuse staff allocation systems
- Create inaccurate reporting
- Waste storage space
- Make it hard to track booking history

This automation automatically merges duplicates while preserving important information like staff assignments.

## How It Works

1. **Triggers on**: New record created in Bookings Dashboard
2. **Checks for**: Existing records with the same Booking Code
3. **If duplicate found**:
   - Updates the original record with new status/information
   - Preserves existing staff assignments
   - Deletes the duplicate record
4. **If no duplicate**: Keeps the new record (it's the first instance)

## Key Features

### 🛡️ Preserves Staff Assignments
- Never overwrites existing Onboarding/Deloading Employee assignments
- Only adds staff if the field was previously empty
- Maintains staff status fields (Assigned, Confirmed, etc.)

### ✅ Validates Status Progression
Valid progressions:
- `pending` → `held` → `Paid` → `VOID/STOP`
- `Pending` → `Held` → `Paid` → `VOID/STOP`

Invalid progressions are rejected (e.g., `VOID` → `Paid`)

### 💰 Smart Field Updates
- Payment amount only updates when changing to "Paid" status
- Customer details update if better information is available
- Booking times and items are preserved unless explicitly changed

## Setting Up the Automation

### 1. Create New Automation
- Go to Automations in your MBH Bookings Operation base
- Click "Create automation"
- Name it: "Booking Deduplication"

### 2. Configure Trigger
- **Trigger**: When record is created
- **Table**: Bookings Dashboard

### 3. Add Script Action
- **Action**: Run a script
- **Script**: Copy from `airtable-booking-deduplication-enhanced.js`
- **Input variable**: 
  - Variable name: `recordId`
  - Value: Record ID from trigger

### 4. Optional: Add Notification
After the script, add an email/Slack notification:
- **Condition**: When `action` = "deduplicated"
- **Message**: Include `bookingCode`, `statusChange`, and `actionLog`

## Script Versions

### Basic Version
`airtable-booking-deduplication-automation.js`
- Simple deduplication
- Updates status and basic fields
- Good for simple use cases

### Enhanced Version (Recommended)
`airtable-booking-deduplication-enhanced.js`
- Preserves staff assignments
- Validates status progressions
- Smart field merging
- Detailed logging

## Example Scenarios

### Scenario 1: Payment Confirmation
```
1. Original: Booking ABC123, Status: "pending"
2. New record: Booking ABC123, Status: "Paid", Amount: $500
3. Result: Original updated to "Paid" with amount, duplicate deleted
```

### Scenario 2: Cancellation with Staff
```
1. Original: Booking XYZ789, Status: "Paid", Onboarding: "Max"
2. New record: Booking XYZ789, Status: "VOID"
3. Result: Original updated to "VOID", Max remains assigned, duplicate deleted
```

### Scenario 3: Invalid Progression
```
1. Original: Booking DEF456, Status: "VOID"
2. New record: Booking DEF456, Status: "Paid"
3. Result: Duplicate rejected and deleted (can't un-void a booking)
```

## Console Output Examples

### Successful Deduplication:
```
📋 Booking Code: ABC123
📊 New Status: Paid
🔍 Found 1 existing record(s) with booking code: ABC123
📌 Original record found (rec...)
🔄 Status change: pending → Paid
💰 Updating payment amount
✅ Updated original record with new information
🗑️ Deleted duplicate record
Deduplication: Updated booking ABC123 from pending to Paid (Preserved: Onboarding staff)
```

### First Instance:
```
📋 Booking Code: NEW999
📊 New Status: pending
🔍 Found 0 existing record(s) with booking code: NEW999
✅ No duplicates found - keeping new record as first instance
```

## Monitoring & Maintenance

### Create a Deduplication Log View
1. Add a formula field: "Has Duplicates"
   ```
   COUNTALL({Booking Code}) > 1
   ```
2. Create filtered view showing records where "Has Duplicates" = true
3. Regularly review for any missed duplicates

### Performance Considerations
- Script runs quickly for individual records
- For bulk imports, consider running in batches
- Monitor automation run history for errors

## Troubleshooting

**Duplicates still appearing:**
- Check that Booking Code field is consistently populated
- Verify automation is enabled and triggering
- Look for variations in Booking Code format

**Staff assignments being lost:**
- Ensure using the enhanced version of the script
- Check that staff fields are properly linked
- Review console logs for preservation messages

**Status not updating:**
- Verify the status progression is valid
- Check for typos in status values (case-sensitive)
- Ensure original record isn't locked/protected

## Best Practices

1. **Consistent Booking Codes**: Ensure your booking system always generates unique, consistent codes
2. **Status Standardization**: Use consistent status values (decide on "Paid" vs "PAID")
3. **Test First**: Run manually on a few test records before enabling
4. **Monitor Regularly**: Check the automation run history weekly
5. **Backup**: Export your Bookings Dashboard regularly as backup

## Integration with Staff Allocation

This deduplication ensures your staff allocation system:
- Only sees one record per booking
- Maintains staff assignments through status changes
- Has accurate booking statuses for scheduling
- Reduces confusion from duplicate entries

Your automated staff allocation can now reliably:
- Find available bookings that need staff
- Track which bookings are confirmed vs cancelled
- Avoid double-booking staff on duplicate records 