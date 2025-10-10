# Calendar Shift Response Feature - Implementation Guide

## Overview
The My Schedule page (`/training/my-schedule.html`) has been enhanced with an interactive modal system that allows staff to accept or decline shift allocations directly from the calendar view. This provides a more intuitive interface alongside the existing SMS notification system.

## Feature Description
Staff members can now:
1. Click on any shift/booking in the calendar view to see detailed information
2. Accept or decline pending shift allocations through the modal interface
3. View real-time status updates with color-coded visual indicators
4. See confirmation messages after successfully responding to shifts

## Visual Status Indicators

### Calendar View Colors:
- **Pending** (Yellow/Orange): `#fff9e6` background with `#f39c12` border
- **Accepted** (Green): `#e8f5e9` background with `#27ae60` border  
- **Declined** (Red): `#ffebee` background with `#e74c3c` border
- **Customer Bookings** (Orange): `#fff3e0` background with `#ff9800` border

### Status Icons:
- ⏳ Pending (for general allocations)
- ✅ Accepted
- ❌ Declined
- Customer bookings show as accepted by default

## Implementation Details

### Modal System
The modal provides a clean, focused interface for viewing shift details and responding:

```javascript
// Modal structure
<div id="shiftModal" class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Shift Details</h2>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
            <!-- Dynamic content -->
        </div>
    </div>
</div>
```

### Key Functions

#### `showShiftDetails(shiftId)`
Opens the modal and displays comprehensive shift information including:
- Date and time
- Duration
- Shift type and role
- Customer information (for bookings)
- Current response status
- Accept/Decline buttons (for pending allocations)

#### `handleModalShiftResponse(shiftId, action)`
Processes the accept/decline response:
1. Shows confirmation dialog
2. Updates Airtable via API
3. Updates local data
4. Refreshes calendar view
5. Shows success/error message

### Data Flow

1. **User clicks shift in calendar** → `showShiftDetails()` called
2. **Modal opens** → Shift data displayed with appropriate actions
3. **User clicks Accept/Decline** → Confirmation prompt shown
4. **User confirms** → API call to update Airtable
5. **Success response** → Local data updated, views refreshed
6. **Modal shows result** → User sees confirmation message

## Airtable Integration

### Required Fields in Shift Allocations Table
- `Response Status` (Text): Pending/Accepted/Declined
- `Response Date` (DateTime): When response was made
- `Response Method` (Text): Portal/SMS Link/Manual

### API Endpoint Used
```javascript
PATCH https://api.airtable.com/v0/{BASE_ID}/{ALLOCATIONS_TABLE_ID}/{recordId}
Body: {
    fields: {
        'Response Status': 'Accepted' | 'Declined',
        'Response Date': ISO timestamp,
        'Response Method': 'Portal'
    }
}
```

## User Experience Flow

### For Pending Shifts:
1. Staff sees yellow/orange shift in calendar with ⏳ icon
2. Clicks shift to open modal
3. Reviews shift details
4. Clicks Accept or Decline button
5. Confirms choice in dialog
6. Sees processing spinner
7. Receives success confirmation
8. Calendar updates to show new status

### For Already Responded Shifts:
1. Staff sees green (accepted) or red (declined) shift
2. Clicks to view details
3. Sees status confirmation message
4. Can close modal to return to calendar

### For Customer Bookings:
1. Staff sees orange booking allocation
2. Clicks to view booking details
3. Sees customer name and booking code
4. Notes that booking allocations are pre-accepted

## Error Handling

The system handles several error scenarios:
- **Network failures**: Shows connection error message
- **Airtable API errors**: Displays specific error details
- **Missing data**: Gracefully handles missing fields
- **Invalid responses**: Provides user-friendly error messages

## Mobile Responsiveness

The modal is fully responsive:
- Maximum width of 500px on larger screens
- 90% width on mobile devices
- Scrollable content for smaller screens
- Touch-friendly buttons and interactions

## Testing Checklist

### Basic Functionality:
- [ ] Calendar loads with correct shifts for the week
- [ ] Shifts display with appropriate colors based on status
- [ ] Status icons appear correctly (⏳, ✅, ❌)
- [ ] Modal opens when clicking on a shift
- [ ] Modal displays all shift details correctly
- [ ] Close button and overlay click close the modal

### Response Flow:
- [ ] Accept/Decline buttons appear only for pending allocations
- [ ] Confirmation dialog appears before processing
- [ ] Processing spinner shows during API call
- [ ] Success message displays after successful response
- [ ] Calendar refreshes to show new status
- [ ] Declined shifts trigger management notification

### Edge Cases:
- [ ] Booking allocations show as pre-accepted
- [ ] Network errors show appropriate message
- [ ] Multiple rapid clicks are handled properly
- [ ] Week navigation maintains response statuses
- [ ] List view also reflects status changes

## Benefits

1. **Improved UX**: Visual, interactive interface for shift management
2. **Real-time Updates**: Immediate visual feedback on responses
3. **Reduced Friction**: No need to leave the schedule view
4. **Clear Status**: Color coding makes shift status immediately obvious
5. **Mobile Friendly**: Works seamlessly on all devices

## Future Enhancements

### Potential Improvements:
1. **Bulk Actions**: Select multiple shifts to accept/decline at once
2. **Shift Trading**: Allow staff to request shift swaps
3. **Availability Calendar**: Let staff mark unavailable dates
4. **Push Notifications**: Browser notifications for new allocations
5. **Response History**: Track all previous responses with timestamps
6. **Manager View**: See all staff responses in one dashboard

## Troubleshooting

### Common Issues:

**Issue**: Modal doesn't open when clicking shift
- Check browser console for JavaScript errors
- Verify shift ID is valid
- Ensure modal HTML is present in page

**Issue**: Accept/Decline not working
- Check Airtable API key is valid
- Verify network connection
- Check browser console for API errors
- Ensure shift record exists in Airtable

**Issue**: Status not updating in calendar
- Verify API response was successful
- Check local data is being updated
- Ensure render functions are called after update

## Related Documentation

- [SMS Notification System](SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md)
- [Shift Response Handler API](../api/shift-response-handler.js)
- [Airtable Integration Guide](PLATFORM_INTEGRATION_REQUIREMENTS.md)

## Conclusion

This feature significantly enhances the staff portal by providing an intuitive, visual way to manage shift allocations. The combination of SMS notifications and in-app responses ensures staff can respond to shifts through their preferred method, improving overall engagement and reducing no-shows.
