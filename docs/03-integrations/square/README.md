# Square Integration for MBH Portal

## Overview

This integration automatically syncs Square payment transactions to Airtable, making them visible in the MBH Staff Portal alongside Checkfront bookings.

## Documentation

1. **[Integration Plan](./SQUARE_INTEGRATION_PLAN.md)** - High-level architecture and approach
2. **[Implementation Guide](./SQUARE_WEBHOOK_IMPLEMENTATION.md)** - Step-by-step webhook setup
3. **[Catalog Mapping](./SQUARE_CATALOG_MAPPING.md)** - Boat types and add-ons configuration

## Quick Start

### 1. Square Setup (15 minutes)
- [ ] Create Square application at https://developer.squareup.com/apps
- [ ] Note your credentials:
  - Application ID: ________________
  - Access Token: ________________
  - Webhook Signature Key: ________________

### 2. Catalog Configuration (30 minutes)
- [ ] Create boat rental items in Square Catalog
- [ ] Set up modifier list for add-ons
- [ ] Note catalog IDs for mapping

### 3. Code Implementation (1 hour)
- [ ] Create `/api/square-webhook.js` handler
- [ ] Add environment variables
- [ ] Update server.js routes
- [ ] Deploy to Railway

### 4. Testing (30 minutes)
- [ ] Configure sandbox webhook
- [ ] Process test payments
- [ ] Verify Airtable records
- [ ] Check portal display

### 5. Go Live
- [ ] Switch to production credentials
- [ ] Update webhook URL
- [ ] Monitor first real transactions

## Key Features

✅ **Real-time Sync**: Payments appear instantly in portal  
✅ **Unified Dashboard**: Square & Checkfront bookings together  
✅ **Add-on Tracking**: All extras captured automatically  
✅ **Phone Numbers**: Customer contact info preserved  
✅ **SMS Ready**: Can trigger notifications like Checkfront  

## Architecture

```
Square POS/Terminal
       ↓
   Payment Made
       ↓
Square Webhook Event
       ↓
Your Server (Railway)
       ↓
Process & Map Data
       ↓
Create Airtable Record
       ↓
MBH Portal Display
```

## Data Flow Example

**Square Payment**:
```json
{
  "payment": {
    "id": "XXXXXXXXXXXX",
    "amount_money": { "amount": 25000 },
    "receipt_number": "SQ-1234",
    "buyer_email_address": "customer@email.com"
  }
}
```

**Becomes Airtable Record**:
```json
{
  "Booking Code": "SQ-1234",
  "Customer Name": "Customer Name",
  "Total Amount": 250.00,
  "Status": "PAID",
  "Payment Source": "Square"
}
```

## Environment Variables Required

```env
# Add to Railway
SQUARE_ACCESS_TOKEN=sq0atp-XXXXXXXXXXXXXXXXXXXX
SQUARE_APPLICATION_ID=sq0idp-XXXXXXXXXXXXXXXXXXXX
SQUARE_WEBHOOK_SIGNATURE_KEY=XXXXXXXXXXXXXXXXXXXX
SQUARE_ENVIRONMENT=production
```

## Common Commands

```bash
# Install Square SDK
npm install square

# Test webhook locally
ngrok http 3000

# Deploy to Railway
git add .
git commit -m "Add Square webhook integration"
git push origin main

# View Railway logs
railway logs -f
```

## Support Resources

- [Square API Docs](https://developer.squareup.com/docs)
- [Webhook Events](https://developer.squareup.com/docs/webhooks/overview)
- [Testing Guide](https://developer.squareup.com/docs/testing/sandbox)

## Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL is correct
2. Verify signature key matches
3. Ensure events are subscribed

### Missing Booking Details
1. Check Square catalog setup
2. Verify order includes metadata
3. Review console logs

### Duplicate Records
1. Implement idempotency check
2. Store Square Payment ID
3. Skip if already exists

## Next Phase Enhancements

- [ ] Two-way sync (update Square from portal)
- [ ] Refund handling
- [ ] Customer database sync
- [ ] Inventory management
- [ ] Financial reporting

---

**Questions?** The implementation follows the same patterns as your existing Checkfront integration, making it familiar and maintainable.
