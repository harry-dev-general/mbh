# Roster Automation Time Parsing Fix

## Issues Identified

After reviewing the Airtable data, I found several critical issues in the roster creation automation:

### 1. Timezone Issue (CRITICAL)
**Max Mckelvey's times are being stored incorrectly**:
- Input: "8:00am" 
- Expected: 8:00 AM Australian time
- Actual: Showing as 6:00-7:00 PM (evening) in Airtable

This is because the times are being stored as if they were UTC times when they're actually Australian local times.

### 2. Bronte Sprouster's Submission Issues
- **Tuesday**: "9am" ✓ parsed correctly, but "2pm" ✗ not stored
- **Wednesday**: "9am" ✗ incorrectly parsed as 11:00 AM instead of 9:00 AM, "2.30pm" ✗ not stored  
- **Thursday**: "11" ✗ and "4" ✗ - neither time was parsed/stored
- **Friday**: "8" ✗ and "12" ✗ - neither time was parsed/stored

## Root Causes

1. **Timezone handling bug** (Most Critical)
   - The `toISOString()` method treats the time as if it's already in UTC
   - Australian times (UTC+10/11) need proper conversion before storing
   - This causes all times to be shifted by 10-11 hours

2. **Plain numbers without AM/PM** (e.g., "11", "4", "8", "12")
   - The original regex patterns didn't handle this case at all
   - These inputs were completely ignored

3. **Decimal time format** (e.g., "2.30pm")
   - The regex expected a colon `:` not a period `.`
   - These times failed to parse

## The Complete Fix

The updated `combineDateTime` function now handles:

### 1. Timezone Correction (NEW)
```javascript
// Australia is UTC+10 (or UTC+11 during DST)
const TIMEZONE_OFFSET = 10; // hours ahead of UTC

// Calculate UTC time by subtracting the timezone offset
let utcHours = timeParts.hours - TIMEZONE_OFFSET;
```
- Properly converts Australian local time to UTC for storage
- Handles date changes when converting (e.g., 8 AM on July 7 → 10 PM on July 6 UTC)

### 2. Plain Numbers
```javascript
// Pattern 1: Plain number (assume 24-hour format if >= 7, otherwise PM if <= 6)
let plainNumberPattern = /^(\d{1,2})$/;
```
- Numbers 7-23 are interpreted as morning/daytime (7am-11pm)
- Numbers 1-6 are interpreted as afternoon (1pm-6pm)
- This matches typical business hours expectations

### 3. Decimal Time Format
```javascript
let normalizedTime = timeString.trim()
    .replace(/\./g, ':')  // Replace periods with colons (handles "2.30pm" → "2:30pm")
    .toLowerCase();       // Convert to lowercase for easier parsing
```
- Automatically converts "2.30pm" to "2:30pm" before parsing

### 4. Enhanced Logging
```javascript
console.log(`Successfully parsed "${timeString}" as ${timeParts.hours}:${timeParts.minutes.toString().padStart(2, '0')} local time`);
console.log(`Stored as UTC: ${isoString}`);
```
- Better debugging output to track parsing success/failure and timezone conversion

## Implementation Steps

1. **Update the Automation Script**
   - Replace the existing `combineDateTime` function with the fixed version from `airtable-roster-timezone-fix.js`
   - **IMPORTANT**: Adjust the `TIMEZONE_OFFSET` constant based on your location:
     - Sydney/Melbourne: Use 10 (or 11 during daylight saving)
     - Brisbane: Use 10 (no daylight saving)
     - Perth: Use 8

2. **Fix Existing Records**
   Since the times are stored incorrectly, you'll need to:
   - Delete the incorrectly stored roster records
   - Reset the "Processing Status" on the submissions from "Processed" to trigger reprocessing
   - Or manually update the times (subtract 10-11 hours from the displayed times)

3. **Test the Fix**
   - Create a test submission with various time formats:
     - Plain numbers: "8", "11", "4"
     - Decimal format: "2.30pm", "9.15am"
     - Standard formats: "8:00am", "5:30pm"
     - Verify times display correctly in your local timezone

## Supported Time Formats

The updated script now supports:
- ✅ "8am", "5pm", "11AM", "2PM" (simple AM/PM)
- ✅ "8:00am", "5:30pm", "11:15AM" (with minutes)
- ✅ "8", "11", "4" (plain numbers with smart interpretation)
- ✅ "2.30pm", "9.15am" (decimal format)
- ✅ "18:00", "09:30" (24-hour format)
- ✅ "2:30" (assumes PM for hours 1-6)

All times are now properly converted to UTC for storage and will display correctly in your local timezone.

## Important Notes

- **Timezone Configuration**: The script uses UTC+10. Adjust the `TIMEZONE_OFFSET` for your specific location
- **Daylight Saving**: If your location observes DST, you may need to add logic to detect and adjust the offset
- The script assumes business hours context for plain numbers
- All parsing is case-insensitive
- Enhanced logging helps debug any future parsing or timezone issues 