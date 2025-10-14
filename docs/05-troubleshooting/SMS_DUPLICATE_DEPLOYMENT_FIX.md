# SMS Duplicate Reminders - Mixed Deployment Fix

## Issue Date: October 14, 2025

## Problem
Users were receiving duplicate SMS reminders at irregular intervals despite implementing Airtable field-based tracking.

## Root Cause
Railway was running multiple instances with different versions of the code:
- **Old instances**: Using `"Reminder Sent": true` (boolean) → Failed with 422 error
- **New instances**: Using `"Reminder Sent": 1` (numeric) → Correct format

This caused:
1. Old instance sends SMS but fails to update Airtable (422 error)
2. Next check sees no "Reminder Sent" record
3. Sends SMS again

## Evidence
From Railway logs:
```json
// Old code (23:03:19):
data: '{"fields":{"Reminder Sent":true,"Reminder Sent Date":"2025-10-13T23:03:19.283Z"}}'

// New code (23:16:17):
data: '{"fields":{"Reminder Sent":1,"Reminder Sent Date":"2025-10-13T23:16:17.591Z"}}'
```

## Solution

### 1. Force Complete Redeployment
Added version logging to force Railway to restart all instances:
```javascript
console.log('🚀 Starting reminder scheduler v2.1...');
console.log('   - Checkbox format: Using numeric 1 (not boolean)');
```

### 2. Ensure Single Deployment
Railway should automatically replace all old instances when deploying.

## Verification Steps
1. Check Railway logs for "Starting reminder scheduler v2.1"
2. Monitor for 422 errors - should stop occurring
3. Verify only single SMS sent per 6-hour period

## Prevention
1. Always test Airtable field updates locally before deploying
2. Add deployment version logging for critical fixes
3. Monitor logs after deployment to ensure all instances updated

## Key Learning
Airtable checkbox fields require numeric values (1/0) not boolean (true/false) when updating via API.
