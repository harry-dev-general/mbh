# Add-on Management Feature

## Overview
Implemented a comprehensive add-on management system for the booking allocations page, allowing managers to view and update add-ons associated with customer bookings.

## Table of Contents
- [Feature Description](#feature-description)
- [Implementation Details](#implementation-details)
- [API Integration](#api-integration)
- [UI Components](#ui-components)
- [Data Flow](#data-flow)
- [Future Enhancements](#future-enhancements)

## Last Updated
Date: 2025-09-23
Version: 1.0

## Feature Description

The add-on management feature enables managers to:
- View current add-ons associated with each booking
- Access a catalog of available add-ons
- Add or remove add-ons from bookings
- Add custom add-ons not in the catalog
- See add-on pricing information

## Implementation Details

### Location
- **Page**: `/training/management-allocations.html`
- **Modal**: Booking allocation popup with new "Manage Add-ons" section

### Key Components

#### 1. Add-ons Display
Shows current add-ons in the booking modal with:
- Formatted list of add-on names and prices
- "Manage" button to open add-ons interface
- Visual styling to distinguish add-ons section

#### 2. Add-ons Management Modal
Nested modal containing:
- Current add-ons display with remove buttons
- Available add-ons catalog with checkboxes
- Custom add-on input form
- Save/Cancel actions

### Data Structure

Add-ons are stored in Airtable's Bookings Dashboard table:
- **Field**: `Add-ons` (multilineText)
- **Format**: Comma-separated string with prices
- **Example**: "Lilly Pad - $55.00, Icebag - $12.50"

## API Integration

### New Module: `/api/addons-management.js`

```javascript
// Get add-ons catalog
router.get('/catalog', async (req, res) => {
  // Returns hardcoded catalog for now
  // Future: fetch from Airtable Add-ons Catalog table
});

// Update booking add-ons
router.put('/booking/:bookingId', async (req, res) => {
  // Updates the Add-ons field in Bookings Dashboard
  // Formats add-ons with prices
  // Returns success/error status
});
```

### Endpoints
- `GET /api/addons/catalog` - Fetch available add-ons
- `PUT /api/addons/booking/:bookingId` - Update booking add-ons

## UI Components

### Add-ons Section in Booking Modal
```html
<div class="form-group" id="addonsSection">
    <label>Add-ons:</label>
    <div class="addons-display">
        <span id="currentAddons">No add-ons</span>
        <button class="manage-addons-btn">
            <i class="fas fa-edit"></i> Manage
        </button>
    </div>
</div>
```

### Management Interface
- Checkbox list for catalog items
- Dynamic pricing display
- Custom add-on form with name and price inputs
- Real-time validation

## Data Flow

1. **Initial Load**: Booking data includes add-ons from Checkfront webhook
2. **Display**: Add-ons shown in allocation modal
3. **Edit**: Manager opens add-ons management interface
4. **Update**: Changes sent to API endpoint
5. **Persist**: Airtable record updated with new add-ons
6. **Refresh**: UI updates to show changes

## SMS Notification Logic

When updating add-ons, the system checks if staff assignment has changed:
- If staff unchanged: No SMS sent (prevents duplicate notifications)
- If staff changed: SMS sent with updated booking details including add-ons

## Future Enhancements

1. **Dynamic Catalog**: Create Airtable Add-ons Catalog table
2. **Inventory Tracking**: Monitor add-on availability
3. **Pricing Updates**: Sync prices with Checkfront
4. **Usage Reports**: Track popular add-ons
5. **Bundle Management**: Create add-on packages

## Related Documentation
- [Checkfront Webhook Integration](../../03-integrations/checkfront/WEBHOOK_INTEGRATION.md)
- [SMS Notification System](../sms/INTEGRATED_WEBHOOK_SMS.md)
- [Booking Allocation System](../allocations/allocation-system-guide.md)
