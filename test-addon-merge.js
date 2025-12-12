// Test script for add-on merge functionality
// Run with: node test-addon-merge.js

// Copy of the functions from checkfront-webhook.js for testing
function parseAddOns(addOnsString) {
    if (!addOnsString || addOnsString.trim() === '') return [];
    
    try {
        return addOnsString.split(',').map(item => {
            const trimmedItem = item.trim();
            // Handle formats: "Item - $XX.XX" or "N x Item - $XX.XX"
            const match = trimmedItem.match(/^(?:(\d+)\s*x\s*)?(.+?)\s*-\s*\$(\d+(?:\.\d{2})?)$/);
            
            if (match) {
                return {
                    quantity: match[1] ? parseInt(match[1]) : 1,
                    name: match[2].trim(),
                    price: parseFloat(match[3]),
                    original: trimmedItem
                };
            }
            
            // Handle items without price
            return {
                quantity: 1,
                name: trimmedItem,
                price: 0,
                original: trimmedItem
            };
        }).filter(item => item.name);
    } catch (error) {
        console.error('Error parsing add-ons:', error);
        return [];
    }
}

function formatAddOns(addOnsArray) {
    if (!Array.isArray(addOnsArray) || addOnsArray.length === 0) return '';
    
    return addOnsArray
        .filter(item => item && item.name)
        .map(item => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const qty = item.quantity && item.quantity > 1 ? `${item.quantity} x ` : '';
            return `${qty}${item.name} - $${price.toFixed(2)}`;
        })
        .join(', ');
}

function mergeAddOns(existingAddOns, newAddOns) {
    const addOnsMap = new Map();
    
    existingAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        addOnsMap.set(key, addon);
    });
    
    newAddOns.forEach(addon => {
        const key = addon.name.toLowerCase().replace(/\s+/g, ' ').trim();
        addOnsMap.set(key, addon);
    });
    
    return Array.from(addOnsMap.values());
}

// Test cases
console.log('🧪 Testing Add-on Merge Functionality\n');

// Test 1: Existing booking has add-ons, new webhook adds more
console.log('Test 1: Adding new add-ons to existing booking');
const existing1 = "Lilly Pad - $55.00, Fishing Rods - $20.00";
const new1 = "Kayak - $45.00";
const merged1 = mergeAddOns(parseAddOns(existing1), parseAddOns(new1));
console.log(`  Existing: ${existing1}`);
console.log(`  New:      ${new1}`);
console.log(`  Result:   ${formatAddOns(merged1)}`);
console.log(`  ✅ Expected: Lilly Pad - $55.00, Fishing Rods - $20.00, Kayak - $45.00\n`);

// Test 2: Webhook updates price of existing add-on
console.log('Test 2: Price update for existing add-on');
const existing2 = "Lilly Pad - $55.00";
const new2 = "Lilly Pad - $60.00";
const merged2 = mergeAddOns(parseAddOns(existing2), parseAddOns(new2));
console.log(`  Existing: ${existing2}`);
console.log(`  New:      ${new2}`);
console.log(`  Result:   ${formatAddOns(merged2)}`);
console.log(`  ✅ Expected: Lilly Pad - $60.00 (new price takes precedence)\n`);

// Test 3: Manual add-on preserved (not in webhook)
console.log('Test 3: Manual add-on preserved when webhook has different items');
const existing3 = "Custom Item - $10.00, Kayak - $45.00";
const new3 = "Lilly Pad - $55.00";
const merged3 = mergeAddOns(parseAddOns(existing3), parseAddOns(new3));
console.log(`  Existing: ${existing3}`);
console.log(`  New:      ${new3}`);
console.log(`  Result:   ${formatAddOns(merged3)}`);
console.log(`  ✅ Expected: Custom Item - $10.00, Kayak - $45.00, Lilly Pad - $55.00\n`);

// Test 4: Quantity handling
console.log('Test 4: Quantity handling');
const existing4 = "2 x Fishing Rods - $40.00";
const new4 = "3 x Fishing Rods - $60.00";
const merged4 = mergeAddOns(parseAddOns(existing4), parseAddOns(new4));
console.log(`  Existing: ${existing4}`);
console.log(`  New:      ${new4}`);
console.log(`  Result:   ${formatAddOns(merged4)}`);
console.log(`  ✅ Expected: 3 x Fishing Rods - $60.00 (new quantity takes precedence)\n`);

// Test 5: Empty existing, new adds items
console.log('Test 5: Empty existing, webhook adds items');
const existing5 = "";
const new5 = "Lilly Pad - $55.00, Kayak - $45.00";
const merged5 = mergeAddOns(parseAddOns(existing5), parseAddOns(new5));
console.log(`  Existing: (empty)`);
console.log(`  New:      ${new5}`);
console.log(`  Result:   ${formatAddOns(merged5)}`);
console.log(`  ✅ Expected: Lilly Pad - $55.00, Kayak - $45.00\n`);

// Test 6: Case insensitivity
console.log('Test 6: Case insensitivity');
const existing6 = "LILLY PAD - $55.00";
const new6 = "lilly pad - $60.00";
const merged6 = mergeAddOns(parseAddOns(existing6), parseAddOns(new6));
console.log(`  Existing: ${existing6}`);
console.log(`  New:      ${new6}`);
console.log(`  Result:   ${formatAddOns(merged6)}`);
console.log(`  ✅ Expected: lilly pad - $60.00 (one item, new overwrites)\n`);

console.log('🎉 All tests completed!');
