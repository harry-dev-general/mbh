const express = require('express');
const crypto = require('crypto');
const router = express.Router();

/**
 * Square Webhook Handler
 * Processes payment events from Square and creates bookings in Airtable
 * 
 * Events handled:
 * - payment.created
 * - payment.updated
 */

// Verify Square webhook signature for security
function verifyWebhookSignature(body, signature, signingKey) {
    const hash = crypto
        .createHmac('sha256', signingKey)
        .update(body)
        .digest('base64');
    return hash === signature;
}

// Format date to AEST (Australia/Sydney timezone)
function formatDateAEST(date) {
    return date.toLocaleDateString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('-');
}

// Format time to AEST with AM/PM
function formatTimeAEST(date) {
    return date.toLocaleTimeString('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Map Square payment status to MBH status
function mapSquareStatus(squareStatus) {
    const statusMap = {
        'COMPLETED': 'PAID',
        'PENDING': 'PEND',
        'CANCELED': 'CANCELLED',
        'FAILED': 'FAILED'
    };
    return statusMap[squareStatus] || 'PEND';
}

// Extract customer name from payment data
function extractCustomerName(payment) {
    // Try various sources for customer name
    if (payment.shipping_address?.recipient_name) {
        return payment.shipping_address.recipient_name;
    }
    
    if (payment.buyer_email_address) {
        // Parse name from email if no other source
        const emailName = payment.buyer_email_address.split('@')[0];
        return emailName.replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    return 'Walk-in Customer';
}

// Generate booking code if not provided
function generateBookingCode() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SQ-${dateStr}-${random}`;
}

// Main webhook handler
router.post('/square-webhook', async (req, res) => {
    console.log('\n🔔 Square webhook received at', new Date().toISOString());
    
    try {
        // 1. Verify webhook signature
        const signature = req.headers['x-square-hmacsha256-signature'];
        const body = JSON.stringify(req.body);
        
        if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
            console.error('❌ SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
            return res.status(500).send('Server configuration error');
        }
        
        if (!verifyWebhookSignature(body, signature, process.env.SQUARE_WEBHOOK_SIGNATURE_KEY)) {
            console.error('❌ Invalid webhook signature');
            return res.status(401).send('Unauthorized');
        }
        
        // 2. Parse webhook data
        const { type, data } = req.body;
        console.log(`📋 Event type: ${type}`);
        console.log(`📋 Event ID: ${req.body.event_id}`);
        
        // 3. Handle payment events
        if (type === 'payment.created' || type === 'payment.updated') {
            const payment = data.object.payment;
            
            // Only process completed payments
            if (payment.status !== 'COMPLETED') {
                console.log(`⏭️ Skipping ${payment.status} payment`);
                return res.status(200).send('OK');
            }
            
            // 4. Extract payment details
            const paymentId = payment.id;
            const orderId = payment.order_id;
            const amount = payment.amount_money.amount / 100; // Convert cents to dollars
            const currency = payment.amount_money.currency;
            const receiptNumber = payment.receipt_number || generateBookingCode();
            
            console.log(`💰 Payment ${paymentId}: $${amount} ${currency}`);
            console.log(`📄 Receipt: ${receiptNumber}`);
            
            // 5. Extract customer details
            const customerEmail = payment.buyer_email_address || '';
            const customerName = extractCustomerName(payment);
            const customerPhone = payment.buyer_phone_number || '';
            
            console.log(`👤 Customer: ${customerName} (${customerEmail})`);
            
            // 6. Set default booking details
            // These would ideally come from order metadata or catalog items
            const now = new Date();
            const bookingDetails = {
                boatType: 'Square Payment', // Update when order API is integrated
                addOns: '',
                bookingDate: formatDateAEST(now),
                startTime: '09:00 am',
                endTime: '05:00 pm'
            };
            
            // TODO: If order_id exists, fetch order details from Square API
            // to get actual boat type, add-ons, and booking times
            
            // 7. Check for duplicate payment
            // TODO: Implement duplicate check by querying Airtable for Square Payment ID
            
            // 8. Prepare Airtable record
            const recordData = {
                'Booking Code': receiptNumber,
                'Customer Name': customerName,
                'Customer Email': customerEmail,
                'Phone Number': customerPhone,
                'Status': mapSquareStatus(payment.status),
                'Total Amount': amount,
                'Booking Items': bookingDetails.boatType,
                'Add-ons': bookingDetails.addOns,
                'Booking Date': bookingDetails.bookingDate,
                'Start Time': bookingDetails.startTime,
                'Finish Time': bookingDetails.endTime,
                'Created Date': formatDateAEST(now),
                'Payment Source': 'Square',
                'Square Payment ID': paymentId,
                'Square Order ID': orderId || ''
            };
            
            console.log('📊 Creating Airtable record...');
            
            // 9. Create record in Airtable
            const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf'; // Bookings Dashboard table
            const airtableResponse = await fetch(
                `${process.env.BASE_URL || 'http://localhost:3000'}/api/airtable/applkAFOn2qxtu7tx/${BOOKINGS_TABLE_ID}`,
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
            
            if (!airtableResponse.ok) {
                const error = await airtableResponse.text();
                throw new Error(`Airtable error: ${airtableResponse.status} - ${error}`);
            }
            
            const result = await airtableResponse.json();
            const newRecordId = result.records[0].id;
            console.log(`✅ Booking created: ${newRecordId}`);
            
            // 10. Send SMS notification (optional)
            // TODO: Add SMS notification similar to Checkfront webhook
            // if (customerPhone) {
            //     await sendBookingConfirmationSMS(customerPhone, recordData);
            // }
            
            console.log('✅ Webhook processed successfully\n');
        } else {
            console.log(`ℹ️ Ignoring event type: ${type}`);
        }
        
        // Always return 200 to acknowledge receipt
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Square webhook error:', error);
        console.error('Stack:', error.stack);
        
        // Return 200 to prevent Square from retrying
        // Log error for manual investigation
        res.status(200).send('Error logged');
    }
});

// Health check endpoint
router.get('/square-webhook/health', (req, res) => {
    res.json({
        status: 'ok',
        configured: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
