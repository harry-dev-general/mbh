# Weekly Availability Form Guide

## Overview
The Weekly Availability Submission form allows MBH staff to submit their work availability for upcoming weeks. The form integrates with Airtable and automatically links submissions to the correct employee record.

## How It Works

### 1. Authentication & Employee Linking
- User must be logged in via Supabase Auth
- System automatically finds the employee's Airtable record by matching email addresses
- If no matching employee record is found, the form will display an error

### 2. Form Features

#### Week Selection
- Defaults to next Monday
- Cannot select past dates
- Week always starts on Monday

#### Daily Availability
- Each day has a checkbox to indicate availability
- When checked, time inputs appear for start/end times
- Times are converted to 12-hour format (e.g., "9:00 AM")
- Default times: 9:00 AM - 5:00 PM if not specified

#### Visual Feedback
- Available days highlighted in green
- Clear visual distinction between available/unavailable days
- Loading spinner during submission

### 3. Data Submission

The form submits to Airtable with the following structure:
```javascript
{
  "Submission ID": "WK2024-01-22-ennWpe", // Auto-generated: WK[date]-[last 6 chars of employee ID]
  "Employee": [employeeRecordId], // Linked to Employee Details table
  "Week Starting": "2024-01-22",
  "Monday Available": true,
  "Monday From": "9:00 AM",
  "Monday Until": "5:00 PM",
  // ... same pattern for all days
  "Additional Notes": "Optional notes",
  "Processing Status": "Pending"
}
```

#### Submission ID Generation
The form automatically generates a unique Submission ID in the format:
- `WK` prefix
- Week starting date (YYYY-MM-DD)
- Last 6 characters of the employee record ID
- Example: `WK2025-07-21-ennWpe`

This ensures compatibility with Airtable automations that depend on the Submission ID field.

### 4. Employee Table Lookup

The form queries the Employee Details table (`tbltAE4NlNePvnkpY`) using:
```
filterByFormula={Email}='user@example.com'
```

This ensures the submission is correctly linked to the staff member's employee record.

## File Location
- **Form Page**: `/mbh-staff-portal/training/availability.html`
- **Access Link**: Added to main navigation in `index.html`

## Technical Details

### Airtable Configuration
- **Base ID**: `applkAFOn2qxtu7tx`
- **Table ID**: `tblcBoyuVsbB1dt1I` (Weekly Availability Submissions)
- **Employee Table ID**: `tbltAE4NlNePvnkpY` (Employee Details)

### Field Mapping
| Form Field | Airtable Field | Type |
|------------|----------------|------|
| (auto-generated) | Submission ID | Text |
| Week Starting | Week Starting | Date |
| [Day] checkbox | [Day] Available | Checkbox |
| [Day] from time | [Day] From | Text |
| [Day] until time | [Day] Until | Text |
| Notes textarea | Additional Notes | Long text |
| (automatic) | Employee | Linked Record |
| (automatic) | Processing Status | Single Select |

## Error Handling

1. **No Employee Record**: Shows error message and disables submission
2. **Network Errors**: Clear error messages with retry option
3. **Validation**: Week starting date must be in the future

## User Flow

1. Staff member logs in
2. Clicks "Submit Availability" in navigation
3. System finds their employee record
4. Staff selects week and available days/times
5. Submission saved to Airtable
6. Redirect to main portal with success message

## Testing

To test the form:
1. Ensure user email exists in Employee Details table
2. Submit availability for next week
3. Check Airtable for new record with correct employee link
4. Verify Processing Status is "Pending"

## Future Enhancements

1. **View Past Submissions**: Show history of submitted availability
2. **Edit Submissions**: Allow updates before manager processes
3. **Conflict Detection**: Warn if submitting for same week twice
4. **Default Schedule**: Remember common patterns
5. **Bulk Entry**: Submit multiple weeks at once 