# Dashboard Pending Allocations Feature

## Overview
The Dashboard has been enhanced with role-based content that shows different information based on whether the user is management or regular staff. Non-management staff now see a "Pending Shift Responses" card instead of "Fleet Status", allowing them to quickly accept or decline pending allocations directly from the dashboard.

## Feature Description

### For Non-Management Staff:
- **Pending Shift Responses Card**: Replaces the Fleet Status card
- **Quick Actions**: Accept/Decline buttons for each pending allocation
- **Complete View**: Shows both general shifts and booking allocations
- **Smart Filtering**: Only displays allocations with "Pending" status
- **Smooth Animations**: Visual feedback when accepting/declining

### For Management Staff:
- **Fleet Status Card**: Continues to display as before
- **No Changes**: Management experience remains unchanged

## User Detection
Management users are identified by email addresses in the following list:
- harry@priceoffice.com.au
- mmckelvey03@gmail.com
- manager@mbh.com
- admin@mbh.com
- operations@mbh.com
- Any email containing @mbh.com

## Technical Implementation

### Data Sources
1. **General Allocations**: From Shift Allocations table (`tbl22YKtQXZtDFtEX`)
2. **Booking Allocations**: From Bookings Dashboard table (`tblRe0cDmK3bG2kPf`)

### Key Functions

#### `loadDynamicCard()`
- Determines user role and loads appropriate content
- Management → Fleet Status
- Staff → Pending Allocations

#### `loadPendingAllocations()`
- Fetches all allocations for the employee
- Filters for pending status only
- Sorts by date (earliest first)

#### `displayPendingAllocations(allocations)`
- Renders the allocation cards
- Shows "No pending shifts" message when empty
- Includes link to full schedule view

#### `handleAllocationResponse(allocationId, action)`
- Processes accept/decline actions
- Updates Airtable with response
- Provides visual feedback
- Removes card with animation after success

## Visual Design

### Allocation Card Colors:
- **General Shifts**: Blue accent border (`#f39c12`)
- **Booking Allocations**: Orange accent border (`#ff9800`)

### Action Buttons:
- **Accept**: Green button (`#27ae60`)
- **Decline**: Red button (`#e74c3c`)

### Status Messages:
- Loading spinner while fetching data
- "No pending shift responses" when all caught up
- Error message if data fails to load

## User Experience Flow

### For Staff Members:
1. **Login** → Dashboard loads
2. **Third Card** → Shows "Pending Shift Responses"
3. **View Allocations** → List of pending shifts/bookings
4. **Quick Actions** → Accept or Decline buttons
5. **Confirmation** → Simple confirm dialog
6. **Visual Feedback** → Card slides out when processed
7. **Auto Update** → List refreshes automatically

### Data Displayed Per Allocation:
- Date (formatted as "Mon, Aug 26")
- Type badge (Shift/Booking)
- Time range (start - end)
- Details (role, customer, or shift type)
- Accept/Decline buttons

## Response Handling

### For General Allocations:
Updates in Shift Allocations table:
- `Response Status`: Accepted/Declined
- `Response Date`: Current timestamp
- `Response Method`: "Portal"

### For Booking Allocations:
Updates in Bookings Dashboard table:
- `Onboarding Response`: Accepted/Declined (for onboarding roles)
- `Deloading Response`: Accepted/Declined (for deloading roles)

## Benefits

1. **Quick Access**: No need to navigate to My Schedule for pending responses
2. **Clear Priority**: Pending items front and center on dashboard
3. **Reduced Friction**: One-click responses from main dashboard
4. **Better Engagement**: Staff more likely to respond promptly
5. **Role-Appropriate**: Different content for different user types

## Testing Scenarios

### Test as Non-Management Staff:
1. Login with non-management email
2. Verify third card shows "Pending Shift Responses"
3. Create test allocations with Pending status
4. Verify they appear in the dashboard
5. Test Accept button - verify Airtable update
6. Test Decline button - verify Airtable update
7. Verify smooth animations on response

### Test as Management Staff:
1. Login with management email
2. Verify third card shows "Fleet Status"
3. Confirm no pending allocations shown
4. Verify management button visible in toolbar

## Edge Cases Handled

1. **No Employee Record**: Shows appropriate error message
2. **No Pending Allocations**: Shows friendly "all caught up" message
3. **API Errors**: Shows error message with refresh suggestion
4. **Mixed Allocations**: Handles both shifts and bookings correctly
5. **Response Failures**: Reloads list on error

## Future Enhancements

### Potential Improvements:
1. **Badge Counter**: Show number of pending items in header
2. **Due Date Highlighting**: Color code by urgency
3. **Batch Actions**: Select multiple and respond at once
4. **Push Notifications**: Browser notifications for new allocations
5. **Response History**: Show recently responded items
6. **Customizable Threshold**: Settings for how many days ahead to show

## Related Files

- `/training/dashboard.html` - Main dashboard page
- `/training/my-schedule.html` - Full schedule view
- `/api/shift-response-handler.js` - Backend response processing

## Deployment

Changes deploy automatically via Railway when pushed to main branch:
```bash
git add -A
git commit -m "Your message"
git push origin main
```

## Support & Troubleshooting

### Common Issues:

**Issue**: Pending allocations not showing
- Check employee record exists in Airtable
- Verify allocations have Employee field linked
- Check Response Status field is empty or "Pending"

**Issue**: Accept/Decline not working
- Check browser console for errors
- Verify Airtable API key is valid
- Ensure response fields exist in tables

**Issue**: Wrong card showing
- Verify email in management list
- Check isManagement flag in console

## Conclusion

This enhancement significantly improves the staff experience by providing immediate visibility and quick actions for pending shift responses right from the dashboard. The role-based approach ensures each user type sees the most relevant information for their needs.
