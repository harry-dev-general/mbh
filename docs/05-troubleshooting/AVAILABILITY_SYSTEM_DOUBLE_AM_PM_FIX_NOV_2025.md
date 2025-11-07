# Availability System Double AM/PM Bug Investigation & Fix
**Date**: November 7, 2025  
**Affected Components**: availability.html, Weekly Availability Submissions, Roster automation  
**Root Cause**: Incorrect default time format in availability.html  

## Problem Summary

After implementing security updates (October 2025), staff availability submissions started showing corrupted time data with double AM/PM patterns:
- "9:00 AM AM" instead of "9:00 AM"
- "5:00 PM AM" instead of "5:00 PM" (note: PM becomes AM!)

## Initial Investigation

### 1. First Hypothesis: Airtable Automation
We initially suspected an Airtable automation was corrupting the data because:
- The automation script showed complex time parsing logic
- Console logs showed "9:00 AM AM" being received by the script
- Multiple automations were running on the Weekly Availability Submissions table

**Result**: Disabling suspected automations did not fix the issue.

### 2. Second Hypothesis: Multiple Automations
Checked for other automations or webhooks that might be modifying data between submission and processing.

**Result**: No other automations found modifying time fields.

### 3. Direct API Testing
Created test record directly via Airtable API:
```javascript
{
  "Monday From": "9:00 AM",
  "Monday Until": "5:00 PM"
}
```

**Result**: Data stored correctly without corruption. This proved Airtable wasn't the problem.

## Root Cause Discovery

The bug was in availability.html's form submission code:

```javascript
// BUGGY CODE:
const from = document.getElementById(`${dayLower}From`).value || '9:00 AM';
const until = document.getElementById(`${dayLower}Until`).value || '5:00 PM';
formData.fields[`${day} From`] = formatTime(from);
formData.fields[`${day} Until`] = formatTime(until);
```

The `formatTime()` function expects 24-hour format input (from HTML time inputs):
```javascript
function formatTime(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');  // Expects "09:00" not "9:00 AM"
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}
```

When parsing "9:00 AM":
1. Splits on ':' → ["9", "00 AM"]
2. parseInt("9") → 9
3. Creates "9:00 AM" + existing " AM" → "9:00 AM AM"

## The Fix

Changed default values to 24-hour format:
```javascript
// FIXED CODE:
const from = fromRaw || '09:00';  // Default in 24h format
const until = untilRaw || '17:00'; // Default in 24h format
```

## Key Discoveries

1. **HTML time inputs return 24-hour format**: `<input type="time">` always returns "HH:MM" format
2. **The bug only affected empty fields**: When staff didn't specify times, defaults were used
3. **All corrupted records had identical patterns**: "9:00 AM AM" and "5:00 PM AM" (the defaults)
4. **No Airtable automation was at fault**: The data was corrupted before reaching Airtable

## Lessons Learned

1. **Always trace data flow from source**: The bug was at the very beginning of the pipeline
2. **Check default values match expected formats**: Mixing 12h and 24h formats caused the issue
3. **Test with empty fields**: The bug only appeared with default values
4. **Direct API testing is valuable**: Helped isolate the problem to the form submission

## Testing Performed

1. Created test HTML page to isolate formatTime() behavior
2. Direct Airtable API submissions to verify storage
3. Checked all records with "AM AM" pattern - all had default times
4. Verified fix by submitting form with empty time fields
