# Customer Add-ons Portal

## Overview

The Customer Add-ons Portal allows customers to purchase additional items (Lilly Pad, Kayak, Fishing Rods, etc.) after they've created their initial boat booking. This solves the problem of customers needing to create separate bookings for add-ons.

## How It Works

### Customer Journey

1. **Customer books a boat** on Checkfront (as normal)
2. **They receive an email** with a link to add extras (future enhancement)
3. **Customer visits the portal**: `/add-extras.html?code=XSQG-121225`
4. **Portal shows**:
   - Their booking details (date, time, boat)
   - Already-added items
   - Available add-ons with prices
5. **Customer selects add-ons** and clicks "Add & Pay"
6. **System updates Checkfront** booking with new items
7. **Checkfront handles payment** and sends confirmation
8. **Webhook fires** → Airtable record updated with merged add-ons

### Technical Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Customer   │ ──── │  Portal UI  │ ──── │  Portal API │
│  Browser    │      │  HTML/JS    │      │  Express.js │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            ▼                            │
              ┌──────┴──────┐            ┌───────────────┐            ┌────────┴───────┐
              │  Airtable   │◄───────────│  Checkfront   │───────────►│    Webhook     │
              │  (Verify)   │            │  API Update   │            │  (Auto-update) │
              └─────────────┘            └───────────────┘            └────────────────┘
```

## API Endpoints

### GET `/api/customer-addons/booking/:code`
Get booking details for customer portal.

**Response:**
```json
{
  "success": true,
  "booking": {
    "code": "XSQG-121225",
    "customerName": "John Smith",
    "bookingDate": "2025-12-15",
    "startTime": "09:00 am",
    "finishTime": "01:00 pm",
    "boatType": "12 Person BBQ Boat",
    "existingAddons": [
      { "name": "Lilly Pad", "price": 55.00, "quantity": 1 }
    ]
  }
}
```

### GET `/api/customer-addons/available/:code`
Get available add-ons for a specific booking date.

**Response:**
```json
{
  "success": true,
  "availableAddons": [
    {
      "sku": "kayak",
      "name": "Kayak",
      "price": 45.00,
      "available": true,
      "alreadyAdded": false
    }
  ]
}
```

### POST `/api/customer-addons/add`
Add selected add-ons to an existing booking.

**Request:**
```json
{
  "bookingCode": "XSQG-121225",
  "addons": [
    { "sku": "kayak", "quantity": 1 },
    { "sku": "fishingrods", "quantity": 2 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Add-ons added to your booking!",
  "addedItems": [
    { "name": "Kayak", "price": 45.00 }
  ],
  "addedTotal": 45.00,
  "paymentUrl": "https://checkfront.com/payment/..."
}
```

## Files

| File | Purpose |
|------|---------|
| `/api/customer-addons.js` | Backend API for customer add-ons |
| `/api/checkfront-api.js` | Extended with `addItemsToBooking()` |
| `/training/add-extras.html` | Customer-facing UI |

## Checkfront API Integration

The system uses Checkfront's API to:
1. **Get item SLIPs** (Secure Line Item Parameters)
2. **Create booking session** with new items
3. **Update existing booking** with the session

```javascript
// Simplified flow
const slip = await checkfrontApi.getItemSlip(itemId, startDate, endDate);
const session = await checkfrontApi.createBookingSession([slip]);
const result = await checkfrontApi.addItemsToBooking(bookingId, [slip]);
```

## Configuration

### Add-on Item IDs

The `ADDON_ITEMS` object in `/api/customer-addons.js` maps SKUs to Checkfront item IDs:

```javascript
const ADDON_ITEMS = {
    'lillypad': { itemId: '8', name: 'Lilly Pad', price: 55.00 },
    'kayak': { itemId: '9', name: 'Kayak', price: 45.00 },
    // ... etc
};
```

**Action Required:** Update these `itemId` values with the actual Checkfront item IDs.

To find item IDs:
1. Log into Checkfront admin
2. Go to Inventory → Items
3. Click on each add-on item
4. The item ID is in the URL or item details

### Environment Variables

No new environment variables required. Uses existing:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `CHECKFRONT_HOST`
- `CHECKFRONT_CONSUMER_KEY`
- `CHECKFRONT_CONSUMER_SECRET`

## Email Integration (Future)

To automatically send customers the add-ons link after booking:

### Option 1: Checkfront Email Template
Add a link to the confirmation email template in Checkfront:
```
Add extras to your booking: https://mbh-production-f0d1.up.railway.app/add-extras.html?code={{booking.code}}
```

### Option 2: Webhook-triggered Email
Modify the webhook handler to send an email with the add-ons link when a new booking is created.

## Testing

### Manual Testing

1. Open: `https://mbh-production-f0d1.up.railway.app/add-extras.html`
2. Enter a valid booking code (e.g., `XSQG-121225`)
3. Verify booking details load
4. Select add-ons
5. Click "Add & Pay"

### API Testing

```bash
# Get booking details
curl https://mbh-production-f0d1.up.railway.app/api/customer-addons/booking/XSQG-121225

# Get available add-ons
curl https://mbh-production-f0d1.up.railway.app/api/customer-addons/available/XSQG-121225

# Get catalog
curl https://mbh-production-f0d1.up.railway.app/api/customer-addons/catalog
```

## Limitations & Notes

1. **Checkfront Item IDs**: Need to be configured with actual values
2. **Payment Flow**: Depends on Checkfront's API returning payment URLs
3. **Availability**: Currently uses hardcoded catalog as fallback if live data unavailable
4. **No Removal**: Customers can only ADD items, not remove them

## Future Enhancements

1. **Email automation**: Send add-ons link in booking confirmation
2. **Quantity selection**: Allow customers to select quantities
3. **Dynamic pricing**: Pull live prices from Checkfront
4. **Mobile app**: Deep links into the portal
5. **Remove items**: Allow customers to modify add-ons

## Date Implemented

December 12, 2025
