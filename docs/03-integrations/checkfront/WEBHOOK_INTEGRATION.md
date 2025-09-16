# Checkfront Webhook Integration

**Last Updated**: September 16, 2025  
**Version**: 2.0 (Custom API Implementation)

## Overview

The Checkfront webhook integration processes booking data from Checkfront and updates Airtable records. Version 2.0 implements a custom API endpoint to properly handle all order items including add-ons, replacing the limited Airtable native webhook automation.

## Architecture

```
Checkfront → Railway API → Airtable → SMS Notification
     ↓            ↓           ↓              ↓
  Webhook    Parse Items   Update DB    Twilio API
```

## Implementation Details

### Custom API Endpoint

**URL**: `https://mbh-production-f0d1.up.railway.app/api/checkfront/webhook`  
**Method**: POST  
**Content-Type**: application/json

### Webhook Payload Structure

Checkfront sends webhooks in XML format converted to JSON with nested structure:

```json
{
  "booking": {
    "@attributes": {
      "booking_id": "JGMX-160925",
      "status": "PEND"
    },
    "customer": {
      "name": "Test Booking v3",
      "email": "test@example.com"
    },
    "order": {
      "items": {
        "item": [
          {
            "@attributes": {
              "sku": "12personbbqboat-halfday",
              "category_id": "2"
            },
            "qty": "1",
            "total": "550"
          },
          {
            "@attributes": {
              "sku": "lillypad",
              "category_id": "7"
            },
            "qty": "1",
            "total": "55"
          }
        ]
      }
    }
  }
}
```

### Category Mapping

The system uses category IDs to identify item types:

```javascript
const categoryMapping = {
  '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
  '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
  '4': { name: 'Add ons', type: 'addon' },
  '5': { name: 'Child Life Jacket', type: 'addon' },
  '6': { name: 'Add ons', type: 'addon' },
  '7': { name: 'Add ons', type: 'addon' }
};
```

### Add-on Name Formatting

The system automatically formats add-on SKUs to readable names with pricing:

```javascript
const addOnMappings = {
  'lillypad': 'Lilly Pad',
  'lillypads': 'Lilly Pads',
  'fishingrods': 'Fishing Rods',
  'fishingrod': 'Fishing Rod',
  'icebag': 'Icebag',
  'icebags': 'Icebags'
};
```

## Data Processing Flow

1. **Webhook Receipt**: Railway server receives POST request
2. **Item Parsing**: Extract all items from nested JSON structure
3. **Categorization**: Separate boats from add-ons using category mapping
4. **Data Formatting**:
   - Boat SKU → "Booking Items" field (for linked record compatibility)
   - Add-ons → "Add-ons" field (comma-separated with prices)
5. **Deduplication**: Check for existing booking by code
6. **Update/Create**: PATCH existing or POST new record
7. **SMS Notification**: Send if significant status change

## Airtable Integration

### Fields Updated

| Field | Type | Example |
|-------|------|---------|
| Booking Code | Text | "JGMX-160925" |
| Customer Name | Text | "Test Booking v3" |
| Customer Email | Email | "test@example.com" |
| Booking Date | Date | "2025-09-18" |
| Start Time | Text | "08:45 am" |
| Finish Time | Text | "01:00 pm" |
| Status | Text | "PAID" |
| Total Amount | Currency | 637.50 |
| Booking Items | Text | "12personbbqboat-halfday" |
| Add-ons | Text | "Lilly Pad - $55.00, Icebag - $12.50" |

### Deduplication Logic

The system prevents duplicate records by:
1. Searching for existing bookings with same code
2. Prioritizing PAID status records
3. Deleting lower-priority duplicates when updating to PAID
4. Preserving staff assignments during updates

## SMS Integration

### Notification Triggers

SMS notifications are sent for:
- New bookings (status: PEND/PAID)
- Payment confirmations (PEND → PAID)
- Cancellations (any → VOID/STOP)
- Partial payments (any → PART)

### Message Templates

**New Booking**:
```
🚤 Boat Hire Manly - Booking Confirmed

Booking: JGMX-160925
Customer: Test Booking v3

📅 Date: Wednesday, 18 Sep 2025
⏰ Time: 08:45 am - 01:00 pm
⏱️ Duration: 4 hours 15 minutes

Boat: 12personbbqboat-halfday
Add-ons: Lilly Pad - $55.00, Icebag - $12.50
Status: PEND

See you at the marina! 🌊
```

### Conditional SMS Logic

```javascript
function isSignificantStatusChange(oldStatus, newStatus) {
  // Always notify for cancellations
  if (newStatus === "VOID" || newStatus === "STOP") return true;
  
  // Notify when payment is confirmed
  if ((oldStatus === "PEND" || oldStatus === "HOLD") && newStatus === "PAID") {
    return true;
  }
  
  // Don't notify for same status or minor progressions
  if (oldStatus === newStatus) return false;
  
  return false;
}
```

## Environment Variables

Required for Railway deployment:

```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+61xxxxxxxxx  # Already exists in Railway
SMS_RECIPIENT=+61414960734      # Default recipient
```

## Error Handling

### Common Errors

1. **Invalid webhook payload**: Returns 400 with error message
2. **Airtable API errors**: Logged and returns 500
3. **SMS send failures**: Logged but doesn't fail webhook
4. **Missing required fields**: Returns 400 with details

### Logging

Comprehensive logging for debugging:
- Webhook headers and payload
- Item parsing details
- Airtable API responses
- SMS send status
- Error stack traces

## Testing

### Test Endpoint

`GET /api/checkfront/test`

Returns:
```json
{
  "success": true,
  "message": "Checkfront webhook handler is running",
  "timestamp": "2025-09-16T05:32:09.000Z",
  "twilioConfigured": true
}
```

### Manual Testing

1. Use the test script in `/test-checkfront-webhook.js`
2. Modify the payload for different scenarios
3. Check Railway logs for processing details
4. Verify Airtable record creation/updates
5. Confirm SMS delivery in Twilio console

## Migration from Airtable Automation

### Previous Issues
- Only captured boat SKU, missed all add-ons
- Airtable's input mapping couldn't handle nested arrays
- No intelligent item categorization
- Separate SMS automation required

### Migration Steps
1. Update Checkfront webhook URL to Railway endpoint
2. Disable old Airtable webhook automation
3. Test with sample bookings
4. Monitor for successful processing
5. Archive old automation scripts

## Maintenance

### Adding New Categories

Update category mapping in `/api/checkfront-webhook.js`:
```javascript
const categoryMapping = {
  // ... existing mappings ...
  '8': { name: 'New Category', type: 'addon' }
};
```

### Adding New Add-on Names

Update add-on mappings:
```javascript
const addOnMappings = {
  // ... existing mappings ...
  'newitem': 'New Item Display Name'
};
```

### Monitoring

- Railway logs: Real-time processing status
- Airtable history: Record creation/updates
- Twilio logs: SMS delivery status

## Related Documentation

- [Airtable Booking Structure](../airtable/BOOKINGS_STRUCTURE.md)
- [SMS Notification System](../../02-features/sms/NOTIFICATION_SYSTEM.md)
- [Railway Deployment](../../01-setup/railway-deployment.md)
