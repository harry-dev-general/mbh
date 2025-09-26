# Square Webhook Implementation Guide

**Date**: September 26, 2025  
**Version**: 1.0

## Quick Start Implementation

Based on your existing Checkfront webhook, here's how to implement Square integration.

## Step 1: Create Square Webhook Handler

Create `/api/square-webhook.js`:

```javascript
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Square webhook signature verification
function verifyWebhookSignature(body, signature, signingKey) {
    const hash = crypto
        .createHmac('sha256', signingKey)
        .update(body)
        .digest('base64');
    return hash === signature;
}

// Format date/time to AEST
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('-');
}

function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Main webhook handler
router.post('/square-webhook', async (req, res) => {
    console.log('📦 Square webhook received');
    
    try {
        // Verify webhook signature
        const signature = req.headers['x-square-hmacsha256-signature'];
        const body = JSON.stringify(req.body);
        
        if (!verifyWebhookSignature(body, signature, process.env.SQUARE_WEBHOOK_SIGNATURE_KEY)) {
            console.error('❌ Invalid webhook signature');
            return res.status(401).send('Unauthorized');
        }

        const { type, data } = req.body;
        console.log(`📋 Event type: ${type}`);

        // Handle payment events
        if (type === 'payment.created' || type === 'payment.updated') {
            const payment = data.object.payment;
            
            // Only process completed payments
            if (payment.status !== 'COMPLETED') {
                console.log(`⏭️ Skipping ${payment.status} payment`);
                return res.status(200).send('OK');
            }

            // Extract payment details
            const paymentId = payment.id;
            const orderId = payment.order_id;
            const amount = payment.amount_money.amount / 100; // Convert cents to dollars
            const receiptNumber = payment.receipt_number || `SQ-${Date.now()}`;
            
            // Get customer details
            const customerEmail = payment.buyer_email_address || 'No email provided';
            const customerName = extractCustomerName(payment);
            const customerPhone = payment.buyer_phone_number || '';
            
            // Get order details if available
            let bookingDetails = {
                boatType: 'Square Booking',
                addOns: '',
                bookingDate: new Date().toISOString().split('T')[0],
                startTime: '09:00 am',
                endTime: '05:00 pm'
            };

            // If we have order details, extract them
            if (orderId) {
                // You would need to make an API call to Square to get order details
                // For now, we'll use placeholder data
                console.log('📦 Order ID:', orderId);
            }

            // Prepare Airtable record
            const recordData = {
                'Booking Code': receiptNumber,
                'Customer Name': customerName,
                'Customer Email': customerEmail,
                'Phone Number': customerPhone,
                'Status': 'PAID',
                'Total Amount': amount,
                'Booking Items': bookingDetails.boatType,
                'Add-ons': bookingDetails.addOns,
                'Booking Date': bookingDetails.bookingDate,
                'Start Time': bookingDetails.startTime,
                'Finish Time': bookingDetails.endTime,
                'Created Date': formatDateAEST(new Date()),
                'Payment Source': 'Square',
                'Square Payment ID': paymentId,
                'Square Order ID': orderId || ''
            };

            console.log('📊 Creating Airtable record:', recordData);

            // Create record in Airtable
            const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';
            const response = await fetch(
                `${process.env.BASE_URL}/api/airtable/applkAFOn2qxtu7tx/${BOOKINGS_TABLE_ID}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        records: [{
                            fields: recordData
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Airtable error: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Booking created:', result.records[0].id);

            // Send SMS notification (optional)
            // You can add SMS notification here similar to Checkfront webhook

        }

        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Square webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Helper function to extract customer name
function extractCustomerName(payment) {
    if (payment.shipping_address?.recipient_name) {
        return payment.shipping_address.recipient_name;
    }
    
    // Try to parse from email
    if (payment.buyer_email_address) {
        const emailName = payment.buyer_email_address.split('@')[0];
        return emailName.replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    return 'Square Customer';
}

module.exports = router;
```

## Step 2: Add Square Routes to Server

Update `/server.js`:

```javascript
// Add after other route imports
const squareWebhookRoutes = require('./api/square-webhook');

// Add after other route definitions
app.use('/api', squareWebhookRoutes);
```

## Step 3: Environment Variables

Add to `.env`:

```env
# Square Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_application_id  
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key
SQUARE_ENVIRONMENT=production
```

## Step 4: Enhanced Order Details (Optional)

To get detailed order information, add Square API client:

```javascript
// Add to square-webhook.js
const { Client, Environment } = require('square');

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
});

// Function to get order details
async function getOrderDetails(orderId) {
    try {
        const response = await squareClient.ordersApi.retrieveOrder(orderId);
        const order = response.result.order;
        
        // Extract line items
        const lineItems = order.lineItems || [];
        const boatType = lineItems.find(item => item.catalogObjectId)?.name || 'Boat Rental';
        
        // Extract modifiers (add-ons)
        const addOns = [];
        lineItems.forEach(item => {
            if (item.modifiers) {
                item.modifiers.forEach(modifier => {
                    addOns.push(`${modifier.name} - $${modifier.totalPriceMoney.amount / 100}`);
                });
            }
        });
        
        // Extract fulfillment details (booking time)
        const fulfillment = order.fulfillments?.[0];
        let bookingDate = new Date().toISOString().split('T')[0];
        let startTime = '09:00 am';
        
        if (fulfillment?.pickupDetails?.pickupAt) {
            const pickupDate = new Date(fulfillment.pickupDetails.pickupAt);
            bookingDate = formatDateAEST(pickupDate);
            startTime = formatTimeAEST(pickupDate);
        }
        
        return {
            boatType,
            addOns: addOns.join(', '),
            bookingDate,
            startTime,
            customerNote: order.note || ''
        };
        
    } catch (error) {
        console.error('Error fetching order details:', error);
        return null;
    }
}
```

## Step 5: Testing with Square Sandbox

1. **Get Sandbox Credentials**
   - Go to https://developer.squareup.com/apps
   - Switch to Sandbox mode
   - Copy sandbox credentials

2. **Test Webhook Locally**
   - Use ngrok to expose local server: `ngrok http 3000`
   - Configure webhook URL in Square: `https://your-ngrok-url.ngrok.io/api/square-webhook`

3. **Simulate Payments**
   - Use Square sandbox test cards
   - Monitor console logs
   - Verify Airtable records

## Step 6: Production Deployment

1. **Update Railway Environment**
   ```bash
   railway variables set SQUARE_ACCESS_TOKEN=your_production_token
   railway variables set SQUARE_WEBHOOK_SIGNATURE_KEY=your_signature_key
   railway variables set SQUARE_APPLICATION_ID=your_app_id
   ```

2. **Configure Production Webhook**
   - URL: `https://mbh-production-f0d1.up.railway.app/api/square-webhook`
   - Events: payment.created, payment.updated, order.created

3. **Monitor Logs**
   ```bash
   railway logs -f
   ```

## Common Issues & Solutions

### Issue 1: Missing Customer Details
Square doesn't always provide full customer info. Add fallbacks:

```javascript
const customerName = payment.note || 
                    payment.buyer_email_address?.split('@')[0] || 
                    'Walk-in Customer';
```

### Issue 2: Time Zone Confusion
Always convert Square UTC times to Sydney time:

```javascript
const sydneyTime = new Date(payment.created_at).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney'
});
```

### Issue 3: Duplicate Records
Implement idempotency:

```javascript
// Check if payment already processed
const existingRecord = await checkExistingPayment(paymentId);
if (existingRecord) {
    console.log('Payment already processed');
    return res.status(200).send('Already processed');
}
```

## Next Steps

1. Install Square SDK: `npm install square`
2. Test with sandbox payments
3. Map your boat types to Square catalog items
4. Configure production webhook
5. Monitor and refine

This implementation follows the same pattern as your Checkfront webhook, making it easy to maintain and understand.
