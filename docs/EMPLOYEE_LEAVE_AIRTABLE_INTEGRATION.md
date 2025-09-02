# Employee Leave - Airtable Integration

## Overview
Employee leave management has been migrated from browser localStorage to a dedicated Airtable table for permanent, centralized storage.

## Airtable Table Details

### Table Name: Employee Leave
**Table ID**: `tblTBEimQK9vyWs8r`  
**Base**: MBH Bookings Operation (`applkAFOn2qxtu7tx`)

### Table Fields

| Field Name | Field Type | Description | Notes |
|------------|------------|-------------|-------|
| **Leave ID** | Single Line Text | Unique identifier (e.g., LEAVE-1693814400000) | Primary field, auto-generated |
| **Employee** | Link to Employee Details | Links to employee record | Required, single employee per leave |
| **Leave Type** | Single Select | Type of leave | Options: Annual Leave, Sick Leave, Personal Leave, Public Holiday, Other |
| **Start Date** | Date | First day of leave | ISO format (YYYY-MM-DD) |
| **End Date** | Date | Last day of leave | ISO format (YYYY-MM-DD) |
| **Notes** | Long Text | Additional comments | Optional |
| **Status** | Single Select | Approval status | Options: Pending, Approved, Rejected, Cancelled |
| **Submitted Date** | Date | When leave was submitted | Auto-set to current date |
| **Submitted By** | Single Line Text | Email of submitter | Auto-populated from logged-in user |

## Implementation Details

### Data Flow

1. **Loading Leave Data**:
   - On page load, fetches all non-cancelled leave records
   - Filters to show only approved leaves in the status column
   - Console logs number of records loaded

2. **Creating Leave**:
   - Form submission creates record in Airtable
   - Auto-generates Leave ID with timestamp
   - Sets status to "Approved" by default
   - Captures submitter's email

3. **Displaying Leave**:
   - Checks if employee has approved leave for current date
   - Shows leave type and end date
   - Highlights row with yellow background

### API Integration

```javascript
// Table ID
const LEAVE_TABLE_ID = 'tblTBEimQK9vyWs8r';

// Create leave record
POST https://api.airtable.com/v0/{BASE_ID}/{LEAVE_TABLE_ID}
{
  "fields": {
    "Leave ID": "LEAVE-1693814400000",
    "Employee": ["recEmployeeId"],
    "Leave Type": "Annual Leave",
    "Start Date": "2025-09-02",
    "End Date": "2025-09-10",
    "Notes": "Holiday in Bali",
    "Status": "Approved",
    "Submitted Date": "2025-09-02",
    "Submitted By": "manager@mbh.com"
  }
}

// Fetch leave records
GET https://api.airtable.com/v0/{BASE_ID}/{LEAVE_TABLE_ID}?filterByFormula={Status}!='Cancelled'
```

## Migration from localStorage

### Previous System
- Data stored in browser localStorage
- Key: `mbh_leave_data`
- Format: JSON object with employee IDs as keys
- Not synced across devices/users

### New System
- Centralized storage in Airtable
- Accessible from any device
- Shared across all management users
- Permanent storage with backup capability

### Migration Steps
If you have existing leave data in localStorage:

1. **Export from localStorage**:
   ```javascript
   const oldData = JSON.parse(localStorage.getItem('mbh_leave_data') || '{}');
   console.log(JSON.stringify(oldData, null, 2));
   ```

2. **Manually create records** in Airtable for each leave

3. **Clear localStorage**:
   ```javascript
   localStorage.removeItem('mbh_leave_data');
   ```

## Features

### Current Implementation
- ✅ Create leave records
- ✅ Display current leave status
- ✅ Visual indicators (red text, yellow background)
- ✅ Auto-approval of leave
- ✅ Link to employee records
- ✅ Audit trail (submitted by/date)

### Future Enhancements
1. **Approval Workflow**:
   - Default status to "Pending"
   - Manager approval interface
   - Email notifications

2. **Leave Balance**:
   - Track available leave days
   - Deduct from balance
   - Annual reset

3. **Calendar View**:
   - Visual calendar of all leave
   - Team availability overview
   - Conflict detection

4. **Reporting**:
   - Leave summary reports
   - Export functionality
   - Analytics dashboard

## Troubleshooting

### Common Issues

1. **Leave Not Showing**:
   - Check Status field is "Approved"
   - Verify dates include today
   - Check Employee link is set

2. **Cannot Create Leave**:
   - Verify all required fields
   - Check date format (YYYY-MM-DD)
   - Ensure Employee ID is valid

3. **Performance**:
   - Currently loads all leave records
   - Consider date filtering for large datasets
   - Implement pagination if needed

## Usage Notes

### For Managers
- All leave records are now shared
- Changes are immediate and visible to all
- Use Notes field for important details
- Status can be updated in Airtable

### For Developers
- Leave ID format: LEAVE-{timestamp}
- Dates must be ISO format
- Employee field expects array with single ID
- Status filtering happens client-side

## Access Control

Currently, all management users can:
- View all leave records
- Create new leave
- Auto-approval is enabled

Future considerations:
- Role-based permissions
- Department-specific views
- Self-service leave requests

---

*Created: Sep 2, 2025*  
*Version: 2.0 - Airtable Integration*  
*Previous: 1.0 - localStorage Implementation*
