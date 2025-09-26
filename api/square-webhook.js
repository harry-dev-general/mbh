const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { Client, Environment } = require('square');

/**
 * Square Webhook Handler
 * Processes payment events from Square and creates bookings in Airtable
 * 
 * Events handled:
 * - payment.created
 * - payment.updated
 * 
 * Filters for: Ice-Cream-Boat-Sales category only
 */

// Initialize Square client
const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN || 'EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb',
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
        ? Environment.Production 
        : Environment.Sandbox
});

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

// Check if order belongs to Ice-Cream-Boat-Sales category
async function isIceCreamBoatSale(orderId) {
    if (!orderId) {
        console.log('❌ No order ID provided, skipping');
        return false;
    }
    
    try {
        console.log(`🔍 Checking order ${orderId} for Ice-Cream-Boat-Sales category...`);
        
        // Fetch order details from Square
        const response = await squareClient.ordersApi.retrieveOrder(orderId);
        const order = response.result.order;
        
        // Check line items for category
        const lineItems = order.lineItems || [];
        
        for (const item of lineItems) {
            // Check if item has catalog object ID
            if (item.catalogObjectId) {
                // Fetch catalog item details
                const catalogResponse = await squareClient.catalogApi.retrieveCatalogObject(
                    item.catalogObjectId,
                    true // Include related objects
                );
                
                const catalogItem = catalogResponse.result.object;
                
                // Check if item belongs to Ice-Cream-Boat-Sales category
                if (catalogItem.itemData?.categoryId) {
                    // Fetch category details
                    const categoryResponse = await squareClient.catalogApi.retrieveCatalogObject(
                        catalogItem.itemData.categoryId
                    );
                    
                    const category = categoryResponse.result.object;
                    const categoryName = category.categoryData?.name;
                    
                    console.log(`📦 Item category: ${categoryName}`);
                    
                    if (categoryName === 'Ice-Cream-Boat-Sales') {
                        console.log('✅ Order contains Ice-Cream-Boat-Sales items');
                        return true;
                    }
                }
            }
            
            // Also check item name as fallback
            if (item.name && item.name.toLowerCase().includes('ice cream')) {
                console.log('✅ Order contains ice cream items (by name)');
                return true;
            }
        }
        
        console.log('❌ Order does not contain Ice-Cream-Boat-Sales items');
        return false;
        
    } catch (error) {
        console.error('Error checking order category:', error);
        // If we can't check, default to false to avoid creating unwanted records
        return false;
    }
}

// Main webhook handler
router.post('/square-webhook', async (req, res) => {
    console.log('\n🔔 Square webhook received at', new Date().toISOString());
    
    try {
        // 1. Verify webhook signature
        const signature = req.headers['x-square-hmacsha256-signature'];
        const body = JSON.stringify(req.body);
        
        const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'CPK571BwzDvZCy58EhV8FQ';
        
        if (!verifyWebhookSignature(body, signature, webhookSignatureKey)) {
            console.error('❌ Invalid webhook signature');
            console.error('Expected signature with key:', webhookSignatureKey.substring(0, 10) + '...');
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
            
            // 4a. Check if this is an ice cream boat sale
            const isIceCreamSale = await isIceCreamBoatSale(orderId);
            if (!isIceCreamSale) {
                console.log('⏭️ Skipping - Not an Ice-Cream-Boat-Sale');
                return res.status(200).send('OK - Not ice cream sale');
            }
            
            // 5. Extract customer details
            const customerEmail = payment.buyer_email_address || '';
            const customerName = extractCustomerName(payment);
            const customerPhone = payment.buyer_phone_number || '';
            
            console.log(`👤 Customer: ${customerName} (${customerEmail})`);
            
            // 6. Extract booking details from order
            const now = new Date();
            let bookingDetails = {
                boatType: 'Ice Cream Boat Operations',
                addOns: '',
                bookingDate: formatDateAEST(now),
                startTime: '09:00 am',
                endTime: '05:00 pm'
            };
            
            // Fetch order details to get more specific information
            if (orderId) {
                try {
                    const orderResponse = await squareClient.ordersApi.retrieveOrder(orderId);
                    const order = orderResponse.result.order;
                    
                    // Extract first line item as boat type
                    if (order.lineItems && order.lineItems.length > 0) {
                        bookingDetails.boatType = order.lineItems[0].name || 'Ice Cream Boat Operations';
                        
                        // Extract modifiers as add-ons
                        const addOns = [];
                        order.lineItems.forEach(item => {
                            if (item.modifiers) {
                                item.modifiers.forEach(modifier => {
                                    addOns.push(`${modifier.name} - $${(modifier.totalPriceMoney.amount / 100).toFixed(2)}`);
                                });
                            }
                        });
                        bookingDetails.addOns = addOns.join(', ');
                    }
                    
                    // Check for custom attributes or metadata
                    if (order.metadata) {
                        bookingDetails.bookingDate = order.metadata.booking_date || bookingDetails.bookingDate;
                        bookingDetails.startTime = order.metadata.start_time || bookingDetails.startTime;
                        bookingDetails.endTime = order.metadata.end_time || bookingDetails.endTime;
                    }
                    
                } catch (error) {
                    console.error('Error fetching order details:', error);
                }
            }
            
            // 7. Check for duplicate payment
            // TODO: Implement duplicate check by querying Airtable for Square Payment ID
            
            // 8. Prepare Airtable record for Ice Cream Boat Sales table
            const recordData = {
                'Sale Code': receiptNumber,
                'Customer Name': customerName,
                'Customer Email': customerEmail,
                'Phone Number': customerPhone,
                'Status': mapSquareStatus(payment.status),
                'Sale Amount': amount,
                'Vessel/Operation': bookingDetails.boatType,
                'Add-ons': bookingDetails.addOns,
                'Sale Date': bookingDetails.bookingDate,
                'Sale Time': formatTimeAEST(now),
                'Square Payment ID': paymentId,
                'Square Order ID': orderId || '',
                'Notes': `Ice cream sale processed at ${formatTimeAEST(now)} on ${formatDateAEST(now)}`
            };
            
            console.log('📊 Creating Ice Cream Sale record in Airtable...');
            
            // 9. Create record in Airtable
            const ICE_CREAM_SALES_TABLE_ID = 'tblTajm845Fiij8ud'; // Ice Cream Boat Sales table
            const airtableResponse = await fetch(
                `${process.env.BASE_URL || 'http://localhost:3000'}/api/airtable/applkAFOn2qxtu7tx/${ICE_CREAM_SALES_TABLE_ID}`,
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
            console.log(`✅ Ice cream sale recorded: ${newRecordId}`);
            
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
