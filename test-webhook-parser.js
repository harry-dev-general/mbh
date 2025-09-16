// Test script to help debug webhook payload structure
// This can be used in the Airtable automation to log the raw webhook data

let inputConfig = input.config();

// Log the entire input config
console.log("=== RAW INPUT CONFIG ===");
console.log(JSON.stringify(inputConfig, null, 2));

// Try to parse webhook if it's a string
let webhookData = inputConfig;
if (typeof inputConfig.webhook === 'string') {
    try {
        webhookData = JSON.parse(inputConfig.webhook);
        console.log("\n=== PARSED WEBHOOK DATA ===");
        console.log(JSON.stringify(webhookData, null, 2));
    } catch (e) {
        console.log("Failed to parse webhook as JSON");
    }
}

// Check for order structure
if (webhookData.order) {
    console.log("\n=== ORDER DATA ===");
    console.log(JSON.stringify(webhookData.order, null, 2));
    
    if (webhookData.order.items) {
        console.log("\n=== ORDER ITEMS ===");
        console.log(JSON.stringify(webhookData.order.items, null, 2));
        
        // Try to access items different ways
        console.log("\n=== ITEM ACCESS TESTS ===");
        console.log("Direct items:", webhookData.order.items);
        console.log("Items type:", typeof webhookData.order.items);
        console.log("Is array?", Array.isArray(webhookData.order.items));
        
        // Check for numeric keys
        for (let key in webhookData.order.items) {
            console.log(`Key '${key}':`, webhookData.order.items[key]);
        }
    }
}

// Check inputConfig for direct fields
console.log("\n=== DIRECT FIELDS ===");
console.log("bookingItems:", inputConfig.bookingItems);
console.log("items:", inputConfig.items);
console.log("bookingCode:", inputConfig.bookingCode);

// Output something so the script doesn't fail
output.set('debug', 'Complete');
