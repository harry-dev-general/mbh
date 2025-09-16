// Test script for Checkfront webhook
// Run with: node test-checkfront-webhook.js

const axios = require('axios');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8080/api/checkfront/webhook';

// Test data - booking with multiple items
const testWebhookData = {
    "@attributes": {
        "version": "2025.09.09-b3830f82",
        "host": "boat-hire-manly.checkfront.com"
    },
    "booking": {
        "@attributes": {
            "booking_id": "TEST-001"
        },
        "status": "PEND",
        "code": "TEST-WEBHOOK-001",
        "tid": {},
        "created_date": "1757920054",
        "staff_id": "2",
        "source_ip": "127.0.0.1",
        "start_date": "1757976300",
        "end_date": "1757991600",
        "customer": {
            "code": "TEST-CUST-001",
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+61400000000",
            "address": "123 Test Street",
            "postal_zip": "2000"
        },
        "order": {
            "@attributes": {
                "currency_id": "AUD"
            },
            "sub_total": "625.00",
            "tax_total": "0.00",
            "paid_total": "0.00",
            "total": "625.00",
            "taxes": {
                "tax": {
                    "@attributes": {
                        "tax_id": "1"
                    },
                    "name": "GST",
                    "amount": "56.82"
                }
            },
            "discount": "0.00",
            "items": {
                "item": [
                    {
                        "@attributes": {
                            "line_id": "1",
                            "item_id": "2"
                        },
                        "start_date": "1757976300",
                        "end_date": "1757990700",
                        "sku": "12personbbqboat-halfday",
                        "slip": {},
                        "package_id": "0",
                        "status": "PEND",
                        "category_id": "2",
                        "total": "550.00",
                        "tax_total": "0.00",
                        "qty": "1"
                    },
                    {
                        "@attributes": {
                            "line_id": "1.1",
                            "item_id": "8"
                        },
                        "start_date": "1757976300",
                        "end_date": "1757990700",
                        "sku": "lillypad",
                        "slip": {},
                        "package_id": "8",
                        "status": "PEND",
                        "category_id": "4",
                        "total": "55.00",
                        "tax_total": "0.00",
                        "qty": "1"
                    },
                    {
                        "@attributes": {
                            "line_id": "1.3",
                            "item_id": "9"
                        },
                        "start_date": "1757977200",
                        "end_date": "1757991600",
                        "sku": "fishingrods",
                        "slip": {},
                        "package_id": "9",
                        "status": "PEND",
                        "category_id": "7",
                        "total": "20.00",
                        "tax_total": "0.00",
                        "qty": "1"
                    }
                ]
            }
        }
    }
};

async function testWebhook() {
    console.log('🚀 Testing Checkfront webhook...');
    console.log(`📍 URL: ${WEBHOOK_URL}`);
    console.log('');
    
    try {
        const response = await axios.post(WEBHOOK_URL, testWebhookData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
            console.error('Status:', error.response.status);
        }
    }
}

// Run the test
testWebhook();
