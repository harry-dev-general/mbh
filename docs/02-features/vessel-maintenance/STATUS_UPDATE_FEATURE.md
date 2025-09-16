# Vessel Status Update Feature

**Last Updated**: September 16, 2025  
**Version**: 1.0

## Overview

The vessel status update feature allows management to update vessel resource levels (fuel, gas, water) and overall condition without requiring a booking association. Updates are recorded in the Post-Departure Checklist table for audit trail and status tracking.

## User Interface

### Management Dashboard - Vessel Maintenance Tab

Each vessel card displays:
- Current resource levels with visual indicators
- Overall condition status
- Last update timestamp and staff member
- "Update Status" button for management actions

### Status Update Modal

The modal interface includes:
- **Fuel Level**: Dropdown (Empty, Quarter, Half, Three-Quarter, Full)
- **Gas Level**: Dropdown (Empty, Half, Full)
- **Water Level**: Dropdown (Empty, Half, Full)
- **Overall Condition**: Dropdown with options:
  - Good - Ready for Next Booking
  - Needs Attention - Minor Issues
  - Out of Service - Major Issues
- **Notes**: Text area for additional comments

## Technical Implementation

### Frontend (`management-dashboard.html`)

#### Key Functions

```javascript
// Open the status update modal
function openStatusUpdateModal(vesselId, vesselName, currentStatus) {
  // Pre-populate fields with current values
  // Display modal with vessel name in title
}

// Submit status update
async function submitStatusUpdate() {
  // Validate at least one field selected
  // Get employee record ID for Staff Member field
  // POST to /api/vessels/:id/status-update
  // Show success message with vessel name
  // Reload vessel data
}
```

#### Data Attributes Pattern

To fix the "null" vessel name issue, we use data attributes:
```html
<button class="update-status-btn" 
        data-vessel-id="${vessel.id}" 
        data-vessel-name="${vessel.name.replace(/"/g, '&quot;')}"
        onclick="handleStatusUpdateClick(this)">
  <i class="fas fa-clipboard-check"></i> Update Status
</button>
```

### Backend (`/api/routes/vessel-maintenance.js`)

#### Status Update Endpoint

```javascript
router.post('/:id/status-update', async (req, res) => {
  // Extract update data from request
  // Validate field values
  // Create checklist record with:
  //   - Checklist ID: "MGMT-UPDATE-{date}-{timestamp} - {notes}"
  //   - Only include fields that were updated
  //   - Link to vessel and staff member
  // Clear server cache for fresh data
  // Return success response
});
```

#### Checklist ID Format

Management updates use special IDs:
- Format: `MGMT-UPDATE-{date}-{timestamp}`
- Notes appended if provided: `MGMT-UPDATE-2025-09-16-123456 - Check gas bottle connection`
- Clearly distinguishes from booking-related checklists

### Airtable Integration

#### Post-Departure Checklist Table

Updates create records with:
- **Vessel**: Linked to vessel record
- **Staff Member**: Management user who performed update
- **Checklist ID**: Special format for management updates
- **Resource Levels**: Only populated fields that were updated
- **Overall Vessel Condition After Use**: If condition was updated

#### Data Flow

1. Management selects update fields
2. System creates new checklist record
3. Vessel status API aggregates latest values
4. Dashboard displays updated status

## Error Handling

### Common Issues and Solutions

1. **"Successfully updated null" message**
   - **Cause**: Modal closing before success message
   - **Solution**: Store vessel name before closing modal
   ```javascript
   const vesselName = currentStatusVesselName;
   closeStatusUpdateModal(); // This resets the variable
   alert(`${vesselName} status updated successfully!`);
   ```

2. **Notes field error**
   - **Cause**: Post-Departure Checklist has no Notes field
   - **Solution**: Append notes to Checklist ID instead

3. **Employee not found**
   - **Cause**: Email mismatch between Supabase and Airtable
   - **Solution**: Ensure management users exist in Employee Details

## Validation Rules

1. **Required Fields**: At least one resource level or condition must be selected
2. **Value Validation**: 
   - Type must be 'fuel', 'gas', 'water', or 'condition'
   - Levels must match predefined options
3. **Staff Assignment**: Valid employee record required

## Cache Management

Updates clear the server-side vessel status cache:
```javascript
// In status update endpoint
statusCache = null;
cacheTimestamp = null;
```

This ensures:
- Fresh data on next fetch
- Immediate visibility of updates
- No stale status information

## Security Considerations

1. **Authentication**: Only authenticated management users can update
2. **Audit Trail**: All updates tracked with timestamp and user
3. **Data Integrity**: Validation prevents invalid values
4. **Access Control**: Frontend shows button only for management

## Benefits

1. **Flexibility**: Update vessels anytime without booking
2. **Accuracy**: Current status always available
3. **Accountability**: Track who updated and when
4. **Efficiency**: Quick updates from dashboard
5. **History**: Maintain audit trail in checklist table

## Future Enhancements

1. **Bulk Updates**: Update multiple vessels at once
2. **Scheduled Checks**: Reminder system for regular updates
3. **Photo Attachments**: Add images to document issues
4. **Maintenance Scheduling**: Link to service requirements
5. **Notifications**: Alert staff of critical levels

## Testing Checklist

- [ ] Open update modal for each vessel
- [ ] Verify current values pre-populate
- [ ] Update single field - verify success
- [ ] Update multiple fields - verify all saved
- [ ] Add notes - verify in Checklist ID
- [ ] Check vessel name in success message
- [ ] Verify cache cleared (immediate update visible)
- [ ] Test validation (no fields selected)
- [ ] Confirm audit trail in Airtable

## Related Documentation

- [Vessel Status API](../../../04-technical/vessel-status-api.md)
- [Management Dashboard Guide](../management-dashboard/overview.md)
- [Airtable Checklist Structure](../../03-integrations/airtable/checklist-tables.md)
