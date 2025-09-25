# Date Handling Issues and Solutions

## Overview
This document covers common date handling issues in the MBH Staff Portal and their solutions. Date handling is critical for accurate booking displays, scheduling, and time calculations.

## Common Issues and Fixes

### 1. Hardcoded Dates in Production Code

**Issue**: Multiple components had hardcoded dates (e.g., September 24, 2025) causing incorrect displays.

**Affected Components**:
- `/training/management-dashboard.html` - Weekly Schedule component
- `/training/daily-run-sheet.html` - Calendar default date
- `getTimeAgo()` function in management dashboard

**Solution**:
```javascript
// ❌ WRONG - Hardcoded date
const now = new Date();
now.setFullYear(2025);
now.setMonth(8); // September
now.setDate(24);

// ✅ CORRECT - Use actual current date
const now = new Date();
```

### 2. Timezone Issues with Date Comparisons

**Issue**: Date strings from Airtable were being interpreted as UTC when creating Date objects, causing off-by-one errors.

**Example**: September 27, 2025 (Saturday) was displaying as Friday.

**Solution**:
```javascript
// ❌ WRONG - Interprets as UTC
const date = new Date('2025-09-27');

// ✅ CORRECT - Parse components and use local timezone
const [year, month, day] = dateString.split('-').map(Number);
const date = new Date(year, month - 1, day); // month is 0-indexed

// For display with explicit timezone
const formatter = new Intl.DateTimeFormat('en-AU', { 
    timeZone: 'Australia/Sydney',
    weekday: 'long',
    month: 'short',
    day: 'numeric'
});
```

### 3. Inconsistent Date Filtering

**Issue**: Date filtering was inconsistent, sometimes missing bookings due to timezone conversions.

**Solution**: Created `formatLocalDate()` helper function for consistent YYYY-MM-DD formatting:
```javascript
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Use for filtering
const dateStr = formatLocalDate(date);
const startStr = formatLocalDate(weekStart);
const endStr = formatLocalDate(weekEnd);

// Compare as strings
return dateStr >= startStr && dateStr <= endStr;
```

### 4. Airtable DateTime Field Filtering

**Issue**: Filtering datetime fields (like `Created Time`) with date-only strings fails.

**Airtable Fields**:
- Date fields: `Booking Date`, `Created Date` - format: "2025-09-27"
- DateTime fields: `Created Time` - format: "2025-09-14T22:29:39.000Z"

**Solution**:
```javascript
// For datetime field filtering
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const sevenDaysAgoISO = sevenDaysAgo.toISOString();

// Use in filter
`filterByFormula=${encodeURIComponent(`{Created Time}>='${sevenDaysAgoISO}'`)}`
```

### 5. Time Parsing for Business Logic

**Issue**: Incorrect interpretation of time fields for operational status.

**Time Fields in Bookings Dashboard**:
- `Onboarding Time`: Staff preparation start time
- `Start Time`: Customer trip start time  
- `Finish Time`: Customer trip end time
- `Deloading Time`: Staff cleanup end time

**Solution**:
```javascript
// Parse time string to minutes for comparison
const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

// Use Sydney timezone for current time
const now = new Date();
const sydneyTime = new Date(now.toLocaleString("en-US", {timeZone: "Australia/Sydney"}));
const currentTime = sydneyTime.getHours() * 60 + sydneyTime.getMinutes();
```

## Best Practices

### 1. Always Use Real Dates
- Never hardcode dates in production code
- Use `new Date()` for current date/time
- Document any date used for testing

### 2. Handle Timezones Explicitly
- Sydney timezone: "Australia/Sydney" 
- Use `Intl.DateTimeFormat` with explicit timezone for display
- Parse date components when creating Date objects from strings

### 3. Consistent Date Formatting
- Use `formatLocalDate()` for YYYY-MM-DD comparisons
- Use ISO format for datetime field filtering
- Always specify timezone when displaying dates to users

### 4. Validate Date Fields
```javascript
// Check for valid date
if (fields['Created Time']) {
    const createdTime = new Date(fields['Created Time']);
    if (!isNaN(createdTime.getTime())) {
        // Use the date
    }
}
```

### 5. Document Field Meanings
Always clarify the business meaning of time fields to avoid confusion:
- Customer-facing times vs Staff preparation times
- Created times vs Booking dates
- Start/End times vs Onboarding/Deloading times

## Testing Recommendations

1. Test across timezone boundaries
2. Test with dates near month/year boundaries  
3. Verify daylight saving time transitions
4. Test with missing or invalid date values
5. Use browser dev tools to simulate different timezones

## Related Documentation
- `/docs/04-technical/TECHNICAL_REFERENCE_AIRTABLE_API.md`
- `/docs/02-features/daily-run-sheet/implementation.md`
- `/docs/02-features/management-dashboard/ui-redesign-2025.md`
