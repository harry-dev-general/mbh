# Employee Directory Updates - Sep 2025

## Issues Addressed

### 1. Availability Status Issue (Max Mckelvey)
**Problem**: Max Mckelvey showing "Not Submitted" despite having submitted availability for current week.

**Debugging Added**:
- Console logging for availability submissions count
- Debug logging specifically for Max Mckelvey
- Week start date verification

**Possible Causes**:
1. **Date Format Mismatch**: The Week Starting field in Airtable might not match exactly (e.g., different time component)
2. **Employee Link Issue**: The Employee field link might not be properly set
3. **Processing Status**: The submission might exist but have a different processing status

**To Debug Further**:
1. Check browser console for debug output
2. Verify the Week Starting format in Airtable matches YYYY-MM-DD
3. Confirm Employee field is properly linked in Weekly Availability Submissions

### 2. Leave Management System
**Implementation**: Added temporary leave tracking using browser localStorage

**Features Added**:
1. **Leave Status Column**: Shows current leave status for each employee
2. **Visual Indicators**:
   - Red text with plane icon for employees on leave
   - Yellow background for employee rows on leave
   - Shows leave type and end date
3. **Leave Form**: Now actually saves leave data
4. **Data Persistence**: Leave data saved to browser localStorage

**How It Works**:
```javascript
// Leave data structure
{
  "employeeId": [
    {
      "id": "timestamp",
      "type": "Annual Leave",
      "startDate": "2025-09-02",
      "endDate": "2025-09-10",
      "notes": "Holiday in Bali",
      "createdAt": "2025-09-02T..."
    }
  ]
}
```

## New Features

### Leave Status Display
- Shows "-" when not on leave
- Shows "✈️ [Leave Type] until [Date]" when on leave
- Row highlighted in light orange when employee is on leave

### Leave Management
1. Click "Leave" button for any employee
2. Fill out form:
   - Leave Type (Annual/Sick/Personal/Public Holiday/Other)
   - Start Date
   - End Date
   - Notes (optional)
3. Submit to save leave
4. Leave immediately displays in the table

## Technical Details

### localStorage Implementation
- **Key**: `mbh_leave_data`
- **Format**: JSON object with employee IDs as keys
- **Persistence**: Data persists across browser sessions
- **Limitation**: Data is browser-specific (not synced across devices)

### Date Handling
- All dates use 2025 context for consistency
- Dates stored in YYYY-MM-DD format
- Leave status checked against current date

## Future Improvements

### 1. Airtable Integration
Create dedicated Leave/Holiday table with fields:
- Employee (Link to Employee Details)
- Leave Type (Single Select)
- Start Date (Date)
- End Date (Date)
- Notes (Long Text)
- Status (Single Select: Pending/Approved/Rejected)
- Created By (Link to Employee Details)

### 2. Availability Fix
- Implement server-side debugging
- Add date normalization for Week Starting field
- Consider using date range filtering instead of exact match

### 3. Enhanced Features
- Leave approval workflow
- Leave balance tracking
- Calendar view of all leave
- Export leave reports
- Email notifications

## Troubleshooting

### Availability Not Showing
1. **Check Console**: Look for debug output about availability submissions
2. **Verify Dates**: Ensure Week Starting matches exactly (YYYY-MM-DD)
3. **Check Links**: Confirm Employee field is properly linked
4. **Processing Status**: Check if status is "Processed" or something else

### Leave Not Persisting
1. **Browser Storage**: Check if localStorage is enabled
2. **Clear Cache**: Try clearing browser cache if issues persist
3. **Check Console**: Look for any JavaScript errors

### Performance Issues
1. **Large Dataset**: Consider pagination for many employees
2. **API Limits**: Watch for Airtable rate limits
3. **Caching**: Implement caching for frequently accessed data

## Usage Notes

### For Managers
- Leave data is currently stored locally in your browser
- Each manager sees their own leave records (not synced)
- Export/backup leave data regularly until Airtable integration

### For Developers
- Leave data structure is extensible
- Easy to migrate to Airtable when ready
- Console logging helps debug issues
- All dates forced to 2025 context

---

*Last Updated: Sep 2, 2025*
*Version: 1.1*
*Status: Temporary Implementation*
