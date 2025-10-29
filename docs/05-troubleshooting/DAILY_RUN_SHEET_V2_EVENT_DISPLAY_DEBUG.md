# Daily Run Sheet v2 - Event Display Debugging

## Issue
Calendar is not displaying bookings even though:
1. API returns booking data correctly
2. Calendar resources (vessels) are displayed
3. Events are being created and added to calendar
4. Console logs show events being processed

## Current Symptoms
From console logs:
- 7 vessels loaded as resources ✓
- 3 bookings found (Peter macnamara, Peter, Test Customer) ✓
- 9 events created (3 main bookings + 6 allocations) ✓
- Events have vessel ID `recNyQ4NXCEtZAaW0` (Sandstone) ✓
- But no events visible on calendar timeline ✗

## Debugging Added
1. **Date Parsing Logs**: Show exact dates being created from booking times
2. **Event Verification**: Check if events are successfully added to calendar
3. **Resource Association**: Verify events are linked to correct resources
4. **Calendar State Inspection**: List all events in calendar after adding
5. **Test Event**: Add a red TEST EVENT to verify calendar can display any events
6. **Force Render**: Explicitly call calendar.render() after adding events

## Expected Debug Output
When page loads, console should show:
- Vessel IDs mapping
- Date parsing details (ISO format)
- Event add success/failure
- Total events in calendar
- Test event creation

## Possible Causes to Investigate
1. **Timezone Issue**: Events might be created for wrong day/time
2. **Resource ID Mismatch**: Vessel IDs might not match between resources and events
3. **CSS Issue**: Events might be hidden by styles
4. **Calendar Configuration**: View settings might exclude events
5. **Date Format**: Start/end dates might not be valid Date objects

## Next Steps
1. Check debug output for date parsing issues
2. Verify TEST EVENT appears (red block)
3. Check if events exist in calendar but are invisible
4. Inspect CSS for event visibility
5. Try different calendar views (month/week)
