# Square to Airtable Integration Plan for MBH Portal

**Date**: September 26, 2025  
**Version**: 1.0

## Overview

This document outlines the implementation plan for automatically syncing Square payment data to Airtable, which will then be displayed in the MBH Portal.

## Integration Architecture

```
Square Payment → Square Webhook → Your Server → Airtable → MBH Portal
```

## Key Components from Square API

### 1. Payments API
- **Purpose**: Process and manage payments
- **Key Events**: Payment created, updated, completed
- **Data Available**: Amount, customer info, payment method, items purchased

### 2. Webhooks API
- **Purpose**: Real-time notifications for Square events
- **Key Events**: 
  - `payment.created` - When a payment is initiated
  - `payment.updated` - When payment status changes
  - `order.created` - When an order is created
  - `order.updated` - When order status changes

### 3. Catalog API
- **Purpose**: Manage products/services (boat rentals, add-ons)
- **Use Case**: Sync boat types and add-ons between Square and Airtable

## Implementation Steps

### Phase 1: Square Setup

1. **Create Square Application**
   - Go to Square Developer Dashboard
   - Create new application for MBH
   - Note the Application ID and Access Token

2. **Configure Webhook Endpoints**
   - Set up webhook URL: `https://your-domain.com/api/square-webhook`
   - Subscribe to events:
     - `payment.created`
     - `payment.updated`
     - `order.created`
     - `order.updated`

3. **Set Up Catalog Items**
   - Create catalog items for each boat type
   - Create modifier lists for add-ons (ice bags, fishing rods, etc.)
   - Map Square item IDs to Airtable boat types

### Phase 2: Webhook Handler Development

Create a new webhook handler similar to your existing Checkfront webhook:

```javascript
// api/square-webhook.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Verify Square webhook signature
function verifySquareWebhook(body, signature, signingKey) {
    const hash = crypto
        .createHmac('sha256', signingKey)
        .update(body)
        .digest('base64');
    return hash === signature;
}

router.post('/square-webhook', async (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-square-hmacsha256-signature'];
        const body = JSON.stringify(req.body);
        
        if (!verifySquareWebhook(body, signature, process.env.SQUARE_WEBHOOK_SIGNATURE_KEY)) {
            return res.status(401).send('Unauthorized');
        }

        const { type, data } = req.body;

        switch (type) {
            case 'payment.created':
            case 'payment.updated':
                await handlePaymentEvent(data);
                break;
            case 'order.created':
            case 'order.updated':
                await handleOrderEvent(data);
                break;
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Square webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});
```

### Phase 3: Data Mapping

**Square Payment Object → Airtable Bookings Dashboard**

| Square Field | Airtable Field | Notes |
|-------------|----------------|-------|
| `payment.amount_money.amount` | Total Amount | Divide by 100 (cents to dollars) |
| `payment.created_at` | Created Date | Convert to AEST |
| `order.line_items[].name` | Booking Items | Boat type |
| `order.line_items[].modifiers` | Add-ons | Ice bags, fishing rods, etc. |
| `payment.buyer_email_address` | Customer Email | |
| `payment.receipt_number` | Booking Code | Or generate custom code |
| `payment.status` | Status | Map to PAID/PEND/etc. |
| `order.fulfillments[].pickup_details.pickup_at` | Booking Date | Rental start date/time |

### Phase 4: Airtable Integration

1. **Create New Table (if needed)**
   - Square Transactions table for raw data
   - Link to existing Bookings Dashboard

2. **Add Fields to Bookings Dashboard**
   - Square Payment ID
   - Square Order ID
   - Payment Source (Square/Checkfront)

3. **Update Existing API**
   ```javascript
   async function createSquareBooking(paymentData) {
       const recordData = {
           'Booking Code': paymentData.receipt_number || generateBookingCode(),
           'Customer Name': paymentData.customer_name,
           'Customer Email': paymentData.buyer_email_address,
           'Phone Number': paymentData.buyer_phone_number,
           'Status': mapSquareStatus(paymentData.status),
           'Total Amount': paymentData.amount_money.amount / 100,
           'Booking Items': extractBoatType(paymentData.order),
           'Add-ons': extractAddOns(paymentData.order),
           'Booking Date': extractBookingDate(paymentData.order),
           'Payment Source': 'Square',
           'Square Payment ID': paymentData.id,
           'Square Order ID': paymentData.order_id
       };

       // Create Airtable record
       await createAirtableRecord('Bookings Dashboard', recordData);
   }
   ```

### Phase 5: Testing & Deployment

1. **Test in Square Sandbox**
   - Use Square sandbox environment
   - Test various payment scenarios
   - Verify webhook delivery

2. **Deploy Webhook Handler**
   - Add to existing Express server
   - Configure environment variables:
     - `SQUARE_ACCESS_TOKEN`
     - `SQUARE_WEBHOOK_SIGNATURE_KEY`
     - `SQUARE_APPLICATION_ID`

3. **Monitor & Debug**
   - Add comprehensive logging
   - Set up error notifications
   - Monitor webhook failures

## Required Environment Variables

```env
# Square Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_application_id
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key
SQUARE_ENVIRONMENT=production # or sandbox for testing
```

## Data Flow Example

1. **Customer makes payment in Square POS**
2. **Square sends webhook** with payment/order data
3. **Webhook handler processes data**:
   - Validates signature
   - Extracts booking details
   - Maps boat types and add-ons
4. **Creates Airtable record**
5. **MBH Portal displays** new booking

## Considerations

### 1. Duplicate Prevention
- Check for existing Square Payment ID before creating records
- Implement idempotency for webhook processing

### 2. Time Zone Handling
- Square uses UTC timestamps
- Convert to Australia/Sydney timezone
- Match existing date handling patterns

### 3. Product Mapping
- Maintain mapping table between Square catalog items and boat types
- Handle variations and modifiers for add-ons

### 4. Status Mapping
```javascript
function mapSquareStatus(squareStatus) {
    const statusMap = {
        'COMPLETED': 'PAID',
        'PENDING': 'PEND',
        'CANCELED': 'CANCELLED',
        'FAILED': 'FAILED'
    };
    return statusMap[squareStatus] || 'PEND';
}
```

### 5. Customer Information
- Square may not always have full customer details
- Implement fallbacks for missing data
- Consider using Square Customer API for additional info

## Next Steps

1. **Obtain Square API Credentials**
2. **Set up Square Catalog** with boat types and add-ons
3. **Develop webhook handler** based on existing Checkfront pattern
4. **Test in sandbox environment**
5. **Deploy and monitor**

## Benefits

- **Real-time sync**: Instant booking updates
- **Unified dashboard**: All bookings in one place
- **Automated workflow**: No manual data entry
- **Better tracking**: Complete payment history
