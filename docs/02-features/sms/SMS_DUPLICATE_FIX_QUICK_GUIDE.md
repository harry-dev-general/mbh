# Quick Fix: SMS Duplicate Reminders

## Problem
You're receiving multiple SMS reminders because Railway runs multiple app instances that don't share tracking data.

## Solution Steps

### 1. Create Tracking Table (One-Time Setup)

```bash
# Run the setup script
cd mbh-staff-portal
node scripts/setup-reminder-tracking-table.js
```

This will:
- Create a new Airtable table "SMS Reminder Tracking"
- Give you the table ID to use

### 2. Add to Railway Environment

```bash
# Add the table ID from step 1
REMINDER_TRACKER_TABLE_ID=tblXXXXXXXXXXXX
```

### 3. Deploy

```bash
git add .
git commit -m "fix: Implement persistent SMS reminder tracking"
git push
```

Railway will automatically deploy and the duplicate SMS issue will be resolved.

## How It Works

**Before (Problem)**:
- Instance A: "I'll send a reminder" ✉️
- Instance B: "I don't know A sent one, I'll send too" ✉️
- Instance C: "Me too!" ✉️
- Result: 3 SMS for 1 reminder 😞

**After (Fixed)**:
- Instance A: "I'll check Airtable... no one sent yet, I'll send" ✉️
- Instance B: "I'll check Airtable... A already sent one, I'll skip" ✅
- Instance C: "I'll check Airtable... already sent, I'll skip" ✅
- Result: 1 SMS for 1 reminder 😊

## Verification

Check the logs after deployment:
```
✅ Reminder check complete. Tracker size: 1
```

Instead of multiple "Reminder sent" messages for the same allocation.

## Troubleshooting

If you still see duplicates:
1. Verify `REMINDER_TRACKER_TABLE_ID` is set in Railway
2. Check the Airtable table is receiving entries
3. Look for errors in logs about Airtable access

## Manual Table Creation

If the script doesn't work, create manually in Airtable:

| Field Name | Field Type |
|------------|------------|
| Key | Single Line Text |
| Last Sent | Date & Time |
| Created At | Date & Time |
| Updated At | Date & Time |

Then find the table ID (starts with "tbl") and add to Railway.
