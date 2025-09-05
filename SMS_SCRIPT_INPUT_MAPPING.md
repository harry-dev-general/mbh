# SMS Script Input Variable Mapping Guide

## Update these Input Variables in the SMS Script Action

In your Airtable automation, click on the SMS script action and update the input variables to map from the **Deduplication Script** outputs (Step 2):

| SMS Script Variable | Map To |
|-------------------|---------|
| `customerName` | Step 2 (Deduplication Script) → customerName |
| `bookingItems` | Step 2 (Deduplication Script) → bookingItems |
| `startDate` | Step 2 (Deduplication Script) → startDate |
| `startTime` | Step 2 (Deduplication Script) → startTime |
| `endTime` | Step 2 (Deduplication Script) → endTime |
| `bookingDurationFormatted` | Step 2 (Deduplication Script) → bookingDurationFormatted |
| `status` | Step 2 (Deduplication Script) → status |
| `bookingCode` | Step 2 (Deduplication Script) → bookingCode |
| `recordId` | Step 2 (Deduplication Script) → recordId |

## How to Update:

1. **Click on your SMS Script action** in the automation
2. **Look for "Input variables"** section at the top
3. **For each variable showing "Invalid value"**:
   - Click the dropdown
   - Select "Step 2" (your deduplication script)
   - Choose the matching output variable name

## Available Outputs from Deduplication Script:

All these are available from Step 2:
- recordId ✅
- isUpdate (new - can use for enhanced logic)
- bookingCode ✅
- status ✅
- customerName ✅
- customerEmail (available but not used)
- bookingItems ✅
- startDate ✅
- endDate (available but not used)
- createdDate (available but not used)
- startTime ✅
- endTime ✅
- bookingDurationFormatted ✅
- totalAmount (available but not used)
- startDateTime (ISO format)
- endDateTime (ISO format)
- createdDateTime (ISO format)

## Example:
Instead of:
- `customerName` → Step 3 (Create Record) → Customer Name ❌

Change to:
- `customerName` → Step 2 (Deduplication Script) → customerName ✅
