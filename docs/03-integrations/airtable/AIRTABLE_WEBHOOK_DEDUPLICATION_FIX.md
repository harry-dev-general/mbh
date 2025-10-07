# Airtable Webhook Deduplication Fix

## Problem Summary
The webhook automation is creating duplicate booking records in Airtable as bookings progress through different payment statuses (PEND → PART → PAID). Each status change triggers a new webhook that creates a new record instead of updating the existing one.

### Example of Duplicates Found:
- **Mackelagh Spence** (Booking Code: LXQT-300825): 3 records (PEND, PART, PAID)
- **Sam Cupples** (Booking Code: SJQA-150825): 3 records (PEND, PART, PAID)

## Root Cause
The current webhook automation script only creates new records and doesn't check if a booking already exists with the same booking code.

## Solution Implementation

### Step 1: Update the Airtable Automation Script
Replace your current webhook automation script with the deduplication script in `airtable-webhook-deduplication-script.js`.

### Step 2: Modify Automation Workflow
After the script runs, add conditional logic:

1. **Add a Conditional Group** after the "Run a script" action
2. **Condition 1**: If `shouldUpdate` is true
   - Action: Update record
   - Record ID: Use the `existingRecordId` from script output
   - Update fields: Status, Total Amount, and any other changed fields
3. **Condition 2**: If `shouldCreate` is true
   - Action: Create record (your existing create action)
4. **Default/Else**: No action (skip)

### Step 3: Ensure Webhook Includes Required Fields
Your webhook payload must include:
- `bookingCode` or `bookingId` (unique identifier)
- `status` or `bookingStatus` (PEND/PART/PAID)
- `customerEmail` (fallback identifier)
- `totalAmount` (payment amount)
- All existing timestamp fields

### Step 4: Clean Up Existing Duplicates

#### Option A: Manual Cleanup
1. Create a view in Airtable grouped by Booking Code
2. Sort by Status (PAID first)
3. Manually delete PEND and PART records where PAID exists

#### Option B: Automated Cleanup Script
```javascript
// Airtable script to clean up duplicates
let table = base.getTable('Bookings Dashboard');
let query = await table.selectRecordsAsync({
    fields: ['Booking Code', 'Status', 'Customer Name', 'Booking Date'],
    sorts: [{field: 'Booking Code'}, {field: 'Status', direction: 'desc'}]
});

let bookingGroups = {};
for (let record of query.records) {
    let code = record.getCellValue('Booking Code');
    if (!code) continue;
    
    if (!bookingGroups[code]) {
        bookingGroups[code] = [];
    }
    bookingGroups[code].push(record);
}

let recordsToDelete = [];
for (let code in bookingGroups) {
    let records = bookingGroups[code];
    if (records.length > 1) {
        // Keep the PAID record (or the first one if no PAID)
        let keepRecord = records.find(r => r.getCellValue('Status') === 'PAID') || records[0];
        
        for (let record of records) {
            if (record.id !== keepRecord.id) {
                recordsToDelete.push(record);
            }
        }
    }
}

console.log(`Found ${recordsToDelete.length} duplicate records to delete`);

// Uncomment to actually delete
// for (let record of recordsToDelete) {
//     await table.deleteRecordAsync(record.id);
// }
```

## Prevention Measures

### 1. Add Unique Constraint View
Create a view in Airtable that shows potential duplicates:
- Filter: `{Booking Code} != ""`
- Group by: Booking Code
- Sort by: Status (descending)

### 2. Webhook Idempotency
Consider adding an idempotency key to your webhook:
- Add a unique request ID to each webhook
- Store processed request IDs to prevent reprocessing

### 3. Status Transition Validation
Only allow valid status transitions:
- PEND → PART → PAID (forward only)
- Never downgrade status (PAID → PART)

## Monitoring
1. Set up an Airtable automation to alert when duplicate Booking Codes are detected
2. Create a dashboard view showing booking counts by status
3. Monitor webhook logs for multiple calls with same booking code

## Testing
1. Send a test webhook with status PEND
2. Send same booking code with status PART - should update, not create
3. Send same booking code with status PAID - should update, not create
4. Verify only one record exists for the booking code
