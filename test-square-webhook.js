/**
 * Test script for Square webhook
 * Run with: node test-square-webhook.js
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/square-webhook';
const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || 'CPK571BwzDvZCy58EhV8FQ';

// Generate Square webhook signature
function generateSignature(body, key) {
    return crypto
        .createHmac('sha256', key)
        .update(JSON.stringify(body))
        .digest('base64');
}

// Test payment completed event
async function testPaymentCompleted() {
    console.log('🧪 Testing Square webhook with completed payment...\n');
    
    const webhookBody = {
        merchant_id: 'MLXXXXXXXX',
        type: 'payment.updated',
        event_id: `test_event_${Date.now()}`,
        created_at: new Date().toISOString(),
        data: {
            type: 'payment',
            id: `test_payment_${Date.now()}`,
            object: {
                payment: {
                    id: `test_payment_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'COMPLETED',
                    amount_money: {
                        amount: 2500, // $25.00 (ice cream sale)
                        currency: 'AUD'
                    },
                    total_money: {
                        amount: 2500,
                        currency: 'AUD'
                    },
                    receipt_number: `ICE-${Date.now()}`,
                    receipt_url: 'https://example.com/receipt',
                    order_id: `test_order_${Date.now()}`,
                    buyer_email_address: 'icecream.customer@example.com',
                    buyer_phone_number: '+61412345678',
                    card_details: {
                        card: {
                            cardholder_name: 'Sarah Johnson'
                        }
                    },
                    note: 'Ice cream boat sale - Walker Courtney',
                    location_id: 'LXXXXXXXXX',
                    source_type: 'CARD'
                }
            }
        }
    };
    
    const signature = generateSignature(webhookBody, SIGNATURE_KEY);
    
    console.log('📤 Sending webhook to:', WEBHOOK_URL);
    console.log('📝 Event type:', webhookBody.type);
    console.log('💰 Amount: $' + (webhookBody.data.object.payment.amount_money.amount / 100));
    console.log('📧 Customer:', webhookBody.data.object.payment.buyer_email_address);
    console.log('🔐 Signature:', signature.substring(0, 20) + '...');
    console.log('');
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-square-hmacsha256-signature': signature
            },
            body: JSON.stringify(webhookBody)
        });
        
        const responseText = await response.text();
        
        console.log('✅ Response status:', response.status);
        console.log('📥 Response body:', responseText);
        
        if (response.status === 200) {
            console.log('\n🎉 Webhook test successful!');
            console.log('Check your "Ice Cream Boat Sales" table in Airtable for the new sale record.');
        } else {
            console.log('\n❌ Webhook test failed');
        }
        
    } catch (error) {
        console.error('❌ Error sending webhook:', error.message);
        console.log('\nMake sure the server is running on port 3000');
    }
}

// Test payment pending event (should be skipped)
async function testPaymentPending() {
    console.log('\n🧪 Testing Square webhook with pending payment...\n');
    
    const webhookBody = {
        merchant_id: 'MLXXXXXXXX',
        type: 'payment.created',
        event_id: `test_event_pending_${Date.now()}`,
        created_at: new Date().toISOString(),
        data: {
            type: 'payment',
            id: `test_payment_pending_${Date.now()}`,
            object: {
                payment: {
                    id: `test_payment_pending_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    status: 'PENDING',
                    amount_money: {
                        amount: 38500, // $385.00
                        currency: 'AUD'
                    },
                    buyer_email_address: 'pending.customer@example.com'
                }
            }
        }
    };
    
    const signature = generateSignature(webhookBody, SIGNATURE_KEY);
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-square-hmacsha256-signature': signature
            },
            body: JSON.stringify(webhookBody)
        });
        
        console.log('✅ Response status:', response.status);
        console.log('📥 Response:', await response.text());
        console.log('\nThis should have been skipped (PENDING status)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Test invalid signature
async function testInvalidSignature() {
    console.log('\n🧪 Testing Square webhook with invalid signature...\n');
    
    const webhookBody = {
        type: 'payment.updated',
        data: {
            object: {
                payment: {
                    status: 'COMPLETED'
                }
            }
        }
    };
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-square-hmacsha256-signature': 'invalid-signature'
            },
            body: JSON.stringify(webhookBody)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('Should be 401 Unauthorized');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Square Webhook Test Suite');
    console.log('============================\n');
    
    if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
        console.log('⚠️  Warning: SQUARE_WEBHOOK_SIGNATURE_KEY not set');
        console.log('Using test key for signature generation\n');
    }
    
    // Test 1: Completed payment
    await testPaymentCompleted();
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Pending payment
    await testPaymentPending();
    
    // Test 3: Invalid signature
    await testInvalidSignature();
    
    console.log('\n✅ All tests completed!');
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
    console.error('❌ node-fetch is required. Install with: npm install node-fetch@2');
    process.exit(1);
}

// Run the tests
runTests().catch(console.error);
