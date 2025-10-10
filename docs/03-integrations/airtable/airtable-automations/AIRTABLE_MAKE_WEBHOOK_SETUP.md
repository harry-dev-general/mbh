# Airtable to Make.com Webhook Automation Setup Guide

## Overview
This automation triggers a Make.com scenario via webhook when the "Generate Video" checkbox is checked in the HeyGen Vid table.

## Setup Instructions

### 1. Create the Automation in Airtable

1. Go to your Airtable base: **Automated Videos Database** (appLKOOKUfWF1x1u9)
2. Click on **Automations** in the top menu
3. Click **Create automation** or the **+** button

### 2. Configure the Trigger

1. Choose trigger type: **When record matches conditions**
2. Configure the trigger:
   - Table: **HeyGen Vid** (tblQPHLqeMdioxUBu)
   - When: **Generate Video** checkbox is **checked**
3. Test the trigger to ensure it works

### 3. Add the Script Action

1. Click **+ Add action**
2. Choose **Run a script**
3. Copy the entire contents of `airtable_make_webhook_script.js`
4. Paste it into the script editor

### 4. Configure Input Variables

In the script action, you need to define an input variable:
1. Click **Add input variable**
2. Name: `recordId`
3. Value: Select the **Record ID** from the trigger step (it will show as "Record (from Step 1: When record matches conditions)")

### 5. Test and Activate

1. Click **Test action** to run the script with a test record
2. Check the console output for success/error messages
3. Verify the webhook was received in your Make.com scenario
4. If everything works, toggle the automation **ON**

## What the Script Does

The script performs the following actions:
1. Gets the record that triggered the automation
2. Extracts ALL fields from the record, including:
   - Text fields
   - Numbers
   - Checkboxes
   - Single/Multiple select fields
   - Attachments (converted to a simpler format)
   - Linked records (converted to ID and name)
   - Dates
   - All other field types
3. Sends a POST request to the Make.com webhook with:
   - Record ID and name
   - All field values
   - Metadata (base info, table info, timestamp)

## Webhook Payload Structure

The webhook sends a JSON payload with this structure:
```json
{
  "recordId": "recXXXXXXXXXXXXXX",
  "recordName": "Record Name",
  "fields": {
    "Generate Video": true,
    "Field Name": "Field Value",
    // ... all other fields
  },
  "metadata": {
    "baseId": "appLKOOKUfWF1x1u9",
    "baseName": "Automated Videos Database",
    "tableId": "tblQPHLqeMdioxUBu",
    "tableName": "HeyGen Vid",
    "triggeredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues:

1. **Webhook not sending**: 
   - Check the console output in the test results
   - Ensure the webhook URL is correct
   - Verify your Make.com scenario is active

2. **Missing fields**: 
   - The script automatically includes ALL fields from the record
   - Empty fields will have `null` values

3. **Attachment fields**: 
   - Attachments are converted to objects with url, filename, size, and type
   - Make.com can use the URLs to download files if needed

4. **Linked records**: 
   - Only the ID and name of linked records are sent
   - If you need full linked record data, you'll need to modify the script

## Customization Options

If you need to:
- **Filter fields**: Add field name checks in the loop
- **Transform data**: Add custom logic for specific fields
- **Add authentication**: Include headers in the fetch request
- **Handle errors differently**: Modify the error handling section

## Make.com Scenario Setup

In your Make.com scenario:
1. The webhook module will receive the data
2. Access record fields via: `{{recordData.fields.FieldName}}`
3. Access metadata via: `{{recordData.metadata.triggeredAt}}`
4. The record ID is available as: `{{recordData.recordId}}`