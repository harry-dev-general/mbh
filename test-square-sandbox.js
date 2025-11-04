/**
 * Quick test to verify Square Sandbox credentials
 * Run with: node test-square-sandbox.js
 */

const fetch = require('node-fetch');

// Load credentials from environment
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;

if (!SQUARE_ACCESS_TOKEN || !SQUARE_APPLICATION_ID) {
    console.error('ERROR: Square credentials not set in environment variables');
    process.exit(1);
}

async function testSquareConnection() {
    console.log('🧪 Testing Square Sandbox Connection...\n');
    
    try {
        // Test 1: List locations
        console.log('📍 Fetching Square locations...');
        const locationsResponse = await fetch('https://connect.squareupsandbox.com/v2/locations', {
            headers: {
                'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
                'Square-Version': '2025-09-24',
                'Content-Type': 'application/json'
            }
        });
        
        if (!locationsResponse.ok) {
            throw new Error(`Locations API error: ${locationsResponse.status}`);
        }
        
        const locationsData = await locationsResponse.json();
        console.log('✅ Locations found:', locationsData.locations?.length || 0);
        
        if (locationsData.locations?.length > 0) {
            console.log('📍 First location:', locationsData.locations[0].name);
            console.log('🆔 Location ID:', locationsData.locations[0].id);
        }
        
        // Test 2: List catalog items
        console.log('\n📦 Fetching catalog items...');
        const catalogResponse = await fetch('https://connect.squareupsandbox.com/v2/catalog/list?types=ITEM', {
            headers: {
                'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
                'Square-Version': '2025-09-24',
                'Content-Type': 'application/json'
            }
        });
        
        if (!catalogResponse.ok) {
            throw new Error(`Catalog API error: ${catalogResponse.status}`);
        }
        
        const catalogData = await catalogResponse.json();
        console.log('✅ Catalog items found:', catalogData.objects?.length || 0);
        
        if (catalogData.objects?.length > 0) {
            console.log('\nFirst few items:');
            catalogData.objects.slice(0, 3).forEach(item => {
                console.log(`- ${item.item_data.name}: $${(item.item_data.variations?.[0]?.item_variation_data?.price_money?.amount || 0) / 100}`);
            });
        }
        
        // Test 3: Create a test payment (optional)
        console.log('\n💳 Ready to create test payments!');
        console.log('\nTest payment command:');
        console.log(`curl -X POST https://connect.squareupsandbox.com/v2/payments \\
  -H 'Authorization: Bearer ${SQUARE_ACCESS_TOKEN}' \\
  -H 'Square-Version: 2025-09-24' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "source_id": "cnon:card-nonce-ok",
    "idempotency_key": "test-${Date.now()}",
    "amount_money": {
      "amount": 25000,
      "currency": "AUD"
    },
    "buyer_email_address": "test@manlybouthire.com"
  }'`);
        
        console.log('\n✅ Square Sandbox is configured correctly!');
        console.log('\nNext steps:');
        console.log('1. Create webhook endpoint in Square Dashboard');
        console.log('2. Add SQUARE_WEBHOOK_SIGNATURE_KEY to .env');
        console.log('3. Start local server and test webhook');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('- Check if credentials are correct');
        console.log('- Make sure you\'re using sandbox credentials');
        console.log('- Try regenerating access token in Square Dashboard');
    }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
    console.error('❌ node-fetch is required. Install with: npm install node-fetch@2');
    process.exit(1);
}

// Run the test
testSquareConnection().catch(console.error);
