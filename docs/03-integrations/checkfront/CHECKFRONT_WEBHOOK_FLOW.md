# Checkfront Webhook Flow

## Current Flow (with Custom API)

```
┌─────────────────┐
│   Checkfront    │
│  (New Booking)  │
└────────┬────────┘
         │ Webhook POST
         │ (Full order data)
         ▼
┌─────────────────┐
│  Railway API    │
│ /api/checkfront │
│    /webhook     │
└────────┬────────┘
         │ Process all items
         │ Categorize boats/add-ons
         ▼
┌─────────────────┐
│  Airtable API   │
│ Create/Update   │
│    Record       │
└────────┬────────┘
         │ Record created
         ▼
┌─────────────────┐
│ Airtable Auto   │
│ "When record    │
│    created"     │
└────────┬────────┘
         │ Trigger
         ▼
┌─────────────────┐
│   SMS Script    │
│ Send customer   │
│  notification   │
└─────────────────┘
```

## Old Flow (Direct to Airtable - LIMITED)

```
┌─────────────────┐
│   Checkfront    │
│  (New Booking)  │
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────┐
│ Airtable Auto   │
│ Webhook Trigger │
│ ⚠️ Can't access  │
│   items array   │
└────────┬────────┘
         │ Limited data
         ▼
┌─────────────────┐
│ Script Action   │
│ Only gets first │
│      item       │
└─────────────────┘
```

## Key Differences

### Custom API Approach (NEW)
- ✅ Receives complete webhook payload
- ✅ Processes ALL order items
- ✅ Proper error handling and logging
- ✅ Can be extended with additional features
- ✅ Uses Airtable API (more reliable)

### Direct Webhook (OLD)
- ❌ Airtable interface limitations
- ❌ Can't access nested arrays
- ❌ Only processes first item
- ❌ Limited debugging capabilities
- ❌ No control over data parsing

## Data Processing

### 1. Webhook Reception
```javascript
// Receives full Checkfront payload
{
  "booking": {
    "code": "YCDC-150925",
    "order": {
      "items": {
        "item": [
          { "sku": "boat", "category_id": "2" },
          { "sku": "lillypad", "category_id": "4" },
          { "sku": "fishingrods", "category_id": "7" }
        ]
      }
    }
  }
}
```

### 2. Item Categorization
- Categories 2, 3 → Boats → "Booking Items" field
- Categories 4, 5, 6, 7 → Add-ons → "Add-ons" field

### 3. Airtable Record
```javascript
{
  "Booking Code": "YCDC-150925",
  "Booking Items": "12personbbqboat-halfday",
  "Add-ons": "Lilly Pad - $55.00, Fishing Rods - $20.00",
  // ... other fields
}
```

## Monitoring Points

1. **Railway Logs**: Check webhook reception and processing
2. **Airtable Records**: Verify all items are captured
3. **SMS Logs**: Confirm notifications sent with all items

## Future Enhancements

- Add webhook signature verification
- Implement retry logic for failed Airtable API calls
- Add metrics/analytics for booking trends
- Create admin dashboard for webhook monitoring
