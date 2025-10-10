# Airtable Negative Transaction Categorization Script

## Overview
This script automatically categorizes all negative transactions in your Airtable base as "Expense" in the "Type" field.

## Prerequisites
- An Airtable base with a table named "Transactions"
- A currency field named "Amount" containing transaction amounts
- A single select field named "Type" with at least "Expense" as an option

## How to Use

### 1. Add the Script to Airtable
1. Open your Airtable base
2. Click on "Extensions" in the top menu
3. Search for and add the "Scripting" extension
4. Create a new script

### 2. Copy the Script
Copy the entire content from `airtable-categorize-negative-transactions.js` into the script editor.

### 3. Run the Script
1. Click the "Run" button in the script editor
2. The script will:
   - Load all records from the Transactions table
   - Find records with negative amounts
   - Update the "Type" field to "Expense" for negative amounts
   - Skip records already marked as "Expense"
   - Provide a summary of changes

### 4. What the Script Does
- **Checks**: All records in the "Transactions" table
- **Identifies**: Records where the "Amount" field is negative (< 0)
- **Updates**: Sets the "Type" field to "Expense" for negative amounts
- **Preserves**: Existing "Expense" categorizations (won't overwrite)
- **Batches**: Updates in groups of 50 (Airtable's limit)

## Script Output Example
```
🚀 Starting transaction categorization...
📊 Loading records from Transactions table...
✅ Found 150 total records
📝 Marking record "Office Supplies" as Expense (Amount: -45.99)
📝 Marking record "Monthly Subscription" as Expense (Amount: -29.99)
🔄 Updating 25 records...
✅ Updated batch 1 of 1
✅ SUCCESS! Updated 25 records to "Expense"

📊 Summary:
   Total records: 150
   Negative transactions: 45
   Records updated: 25
```

## Automation Options

### Option 1: Manual Run
Run the script manually whenever you need to categorize new transactions.

### Option 2: Scheduled Automation
1. Use Airtable Automations to run the script on a schedule
2. Go to Automations → Create → Time-based trigger
3. Set your preferred schedule (daily, weekly, etc.)
4. Add "Run script" action with this script

### Option 3: Trigger on New Records
1. Create an automation that triggers "When record created"
2. Add "Run script" action
3. Modify the script to only check the new record:
   ```javascript
   // Add this at the beginning to handle single record
   const newRecord = input.record;
   const amount = newRecord.getCellValue(AMOUNT_FIELD);
   if (amount < 0) {
       await table.updateRecordAsync(newRecord.id, {
           [TYPE_FIELD]: TYPE_VALUE
       });
   }
   ```

## Customization

### Change the Type Value
To use a different value instead of "Expense":
```javascript
const TYPE_VALUE = 'Your Custom Value'; // Change this line
```

### Add Additional Logic
To categorize positive amounts as well:
```javascript
// In the main loop, add:
if (amount !== null) {
    let typeValue;
    if (amount < 0) {
        typeValue = 'Expense';
    } else if (amount > 0) {
        typeValue = 'Income';
    }
    // ... rest of update logic
}
```

## Troubleshooting

### "Table not found" Error
- Ensure your table is named exactly "Transactions"
- Check for any trailing spaces in the table name

### "Field not found" Error
- Verify field names match exactly: "Amount" and "Type"
- Check that "Type" is a single select field
- Ensure "Expense" is an option in the Type field

### No Records Updated
- Check if negative transactions already have "Expense" set
- Verify the Amount field contains numeric values
- Ensure the Amount field is a currency or number type

## Safety Features
- The script only updates records that need updating
- It won't overwrite existing "Expense" categorizations
- Provides detailed logging of all changes
- Handles batch updates safely within Airtable's limits 