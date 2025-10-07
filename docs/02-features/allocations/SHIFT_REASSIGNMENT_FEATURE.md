# General Shift Reassignment Feature

## Date: January 2025

## Overview
Added the ability for managers to reassign general shift allocations to different employees, matching the functionality already available for customer booking allocations. This is particularly useful when staff members reject shifts and managers need to quickly find replacements.

## Features Implemented

### 1. Click-to-Reassign Interface
- **Click any general shift allocation** on the calendar grid to open reassignment modal
- Works for all shift types: General Operations, Maintenance, Training, etc.
- Visual feedback shows current assignment and response status

### 2. Reassignment Modal
The modal displays:
- **Current Employee**: Shows who is currently assigned
- **Response Status**: Visual indicator (✅ Accepted, ❌ Declined, ⏳ Pending)
- **Special Alert**: Red warning message if the shift was declined
- **Employee Dropdown**: Select new staff member from available employees
- **Locked Fields**: Date, time, and type cannot be changed during reassignment

### 3. Status Reset on Reassignment
When a shift is reassigned:
- **Response Status** → Reset to "Pending"
- **Response Date** → Cleared
- **Response Method** → Cleared
- New employee receives notification to accept/decline

## Use Cases

### Primary Use Case: Handling Rejected Shifts
1. Staff member declines shift from dashboard
2. Shift appears RED on manager's calendar
3. Manager clicks the red shift block
4. Modal shows "⚠️ Declined - Needs Reassignment"
5. Manager selects replacement employee
6. Click "Reassign Shift"
7. New employee gets notified

### Secondary Use Cases
- **Rebalancing workload**: Move shifts between employees
- **Covering absences**: Quick reassignment when someone calls out
- **Optimizing schedules**: Adjust assignments based on availability

## Visual Indicators

### Calendar Grid
- 🔴 **Red blocks**: Declined shifts (high priority for reassignment)
- 🟠 **Orange blocks**: Pending response
- 🟢 **Green blocks**: Accepted shifts

### Modal Status Display
```
Current Assignment: John Smith
Response Status: Declined ❌
⚠️ Staff member declined this shift. Please select a replacement.
```

## Technical Implementation

### Files Modified
- `/training/management-allocations.html`

### Key Functions Added
```javascript
// New function to handle shift reassignment
function openShiftReassignmentModal(allocationRecord, currentEmployee)

// Modified click handler for shift blocks
allocationBlock.onclick = (e) => {
    e.stopPropagation();
    openShiftReassignmentModal(record, employee);
};
```

### Airtable Update
Updates the Shift Allocations table (`tbl22YKtQXZtDFtEX`):
```javascript
PATCH /v0/{BASE_ID}/{ALLOCATIONS_TABLE_ID}/{allocationId}
{
    fields: {
        'Employee': [newEmployeeId],
        'Response Status': 'Pending',
        'Response Date': '',
        'Response Method': ''
    }
}
```

## User Experience

### Manager Workflow
1. View calendar with color-coded shift allocations
2. Identify red (declined) or orange (pending) shifts
3. Click on shift to open reassignment modal
4. See current assignment and status
5. Select new employee from dropdown
6. Click "Reassign Shift"
7. Receive confirmation
8. Calendar refreshes with updated assignment

### Form Behavior
- **Pre-filled**: All shift details automatically populated
- **Locked fields**: Date, time, type cannot be modified
- **Dynamic button**: Changes from "Create Allocation" to "Reassign Shift"
- **Clear status**: Shows why reassignment may be needed

## Benefits

### 1. Rapid Response to Rejections
- Immediate visibility of declined shifts
- Quick reassignment without recreating allocation
- Maintains shift history and details

### 2. Improved Management Efficiency
- Single-click access to reassignment
- Clear visual status indicators
- No need to delete and recreate shifts

### 3. Better Staff Communication
- New assignee automatically notified
- Status reset ensures fresh response
- Maintains accountability trail

## Testing Checklist

- [x] Click general shift allocation opens modal
- [x] Modal shows current employee and status
- [x] Declined shifts show red warning message
- [x] Employee dropdown populated correctly
- [x] Reassignment updates Airtable record
- [x] Response Status resets to Pending
- [x] Calendar refreshes after reassignment
- [x] Form fields properly locked during reassignment
- [x] Button text changes to "Reassign Shift"
- [x] Modal cleanup on close

## Related Features
- Customer booking allocation reassignment
- Dashboard pending shift responses
- Shift response status coloring
- SMS notification system

## Future Enhancements
1. Add reassignment history tracking
2. Implement bulk reassignment for multiple shifts
3. Add notification to original employee about reassignment
4. Include reason for reassignment field

## Deployment
- **Committed**: January 2025
- **Repository**: https://github.com/harry-dev-general/mbh
- **Auto-deployed**: Via Railway to production
- **Status**: Live and operational

---
*This feature completes the shift management cycle by allowing managers to handle rejected shifts efficiently*
