# Add-ons Management Implementation Guide

## Overview
This guide outlines the implementation of add-ons management functionality for the MBH Staff Portal, allowing managers to add/remove add-ons from existing bookings.

## Architecture Decision

### Chosen Approach: Hybrid Solution
We'll implement a **catalog-based system with text field storage** that:
1. Creates an Add-ons Catalog table for standardized options
2. Maintains the existing text field format for webhook compatibility
3. Allows manual text entry for custom/one-off items

### Why This Approach?
- **Maintains compatibility** with existing webhook system
- **Provides flexibility** for both standard and custom add-ons
- **Simple implementation** without major refactoring
- **Preserves data format** expected by other systems

## Implementation Plan

### Phase 1: Airtable Structure

#### 1.1 Create Add-ons Catalog Table
Create a new table in Airtable with the following fields:
- **Name** (Single line text) - Display name
- **SKU** (Single line text) - Matches Checkfront SKUs
- **Price** (Currency) - Standard price
- **Category** (Single select) - Water Sports, Safety, Comfort, etc.
- **Active** (Checkbox) - Whether available for selection
- **Description** (Long text) - Optional details
- **Sort Order** (Number) - For display ordering

#### 1.2 Initial Data Population
Populate with known add-ons from webhook mappings:
```javascript
// Known add-ons from current system
- Lilly Pad (lillypad) - $55.00
- Fishing Rods (fishingrods) - $20.00  
- Icebag (icebag) - $12.50
- Kayak (kayak) - $45.00
- Stand Up Paddleboard (sup) - $65.00
- Esky/Cooler (esky) - $25.00
- Bait Pack (baitpack) - $15.00
- BBQ Pack (bbqpack) - $35.00
```

### Phase 2: Backend API

#### 2.1 Create Add-ons API Module
File: `api/addons-management.js`
```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');

const ADDONS_CATALOG_TABLE_ID = 'tblXXXXXXXXXXXX'; // To be created

// Get all active add-ons
router.get('/catalog', async (req, res) => {
    // Fetch from Airtable with Active=1 filter
    // Sort by Sort Order or Category
});

// Update booking add-ons
router.patch('/booking/:bookingId', async (req, res) => {
    // Parse existing add-ons
    // Apply changes
    // Format back to string
    // Update Airtable
});
```

#### 2.2 Add-ons Parser Utility
Create utility functions to parse and format add-ons:
```javascript
// Parse "Item - $Price, Item - $Price" to array
function parseAddOns(addOnsString) {
    if (!addOnsString) return [];
    return addOnsString.split(',').map(item => {
        const [name, price] = item.trim().split(' - ');
        return { 
            name: name.trim(), 
            price: price ? parseFloat(price.replace('$', '')) : 0 
        };
    });
}

// Format array back to string
function formatAddOns(addOnsArray) {
    return addOnsArray
        .map(item => `${item.name} - $${item.price.toFixed(2)}`)
        .join(', ');
}
```

### Phase 3: Frontend UI

#### 3.1 Update Booking Allocation Modal
Enhance the existing modal in `management-allocations.html`:
1. Add "Manage Add-ons" button in the modal
2. Display current add-ons with remove buttons
3. Show total value of add-ons

#### 3.2 Create Add-ons Management Interface
```html
<!-- Add-ons Management Section -->
<div id="addOnsManagement" style="display: none;">
    <h4>Current Add-ons</h4>
    <div id="currentAddOnsList">
        <!-- Dynamic list with remove buttons -->
    </div>
    
    <h4>Add New Items</h4>
    <div id="addOnsCatalog">
        <!-- Categorized list from catalog -->
    </div>
    
    <div class="custom-addon-section">
        <h5>Custom Item</h5>
        <input type="text" id="customItemName" placeholder="Item name">
        <input type="number" id="customItemPrice" placeholder="Price" step="0.01">
        <button onclick="addCustomItem()">Add Custom</button>
    </div>
    
    <div class="addon-totals">
        <strong>Total Add-ons Value: $<span id="addOnsTotal">0.00</span></strong>
    </div>
</div>
```

### Phase 4: Integration Features

#### 4.1 Smart Formatting
- Maintain consistent formatting with webhook data
- Preserve price formatting ($XX.XX)
- Sort items alphabetically or by category

#### 4.2 Change Tracking
- Log who made changes and when
- Optional: Store change history in a separate field

#### 4.3 Validation
- Prevent duplicate items
- Validate prices are positive numbers
- Check against catalog for standard items

### Phase 5: User Experience

#### 5.1 Interface Flow
1. Manager clicks on booking allocation
2. Modal shows current add-ons with inline remove buttons
3. "Manage Add-ons" expands detailed interface
4. Catalog items shown in categories with quick-add buttons
5. Custom item option at bottom
6. Live total updates
7. Save updates the booking

#### 5.2 Visual Design
```css
.addon-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    border-bottom: 1px solid #eee;
}

.addon-remove-btn {
    color: #dc3545;
    cursor: pointer;
}

.addon-catalog-item {
    display: flex;
    align-items: center;
    padding: 8px;
    cursor: pointer;
}

.addon-catalog-item:hover {
    background: #f0f0f0;
}

.addon-price {
    margin-left: auto;
    font-weight: bold;
}
```

## Implementation Steps

### Step 1: Create Airtable Structure
1. Create Add-ons Catalog table
2. Populate with initial data
3. Test API access

### Step 2: Build Backend API
1. Create `api/addons-management.js`
2. Add routes to `server.js`
3. Test endpoints

### Step 3: Update Frontend
1. Enhance booking modal
2. Add add-ons management UI
3. Implement JavaScript functions

### Step 4: Testing
1. Test adding standard items
2. Test removing items
3. Test custom items
4. Verify webhook compatibility

### Step 5: Documentation
1. Update user guide
2. Document API endpoints
3. Add to troubleshooting guide

## Code Examples

### Frontend JavaScript Functions
```javascript
// Load add-ons catalog
async function loadAddOnsCatalog() {
    const response = await fetch('/api/addons/catalog');
    const catalog = await response.json();
    renderCatalog(catalog);
}

// Add item to booking
async function addAddOn(bookingId, item) {
    const response = await fetch(`/api/addons/booking/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'add',
            item: item
        })
    });
    return response.json();
}

// Remove item from booking
async function removeAddOn(bookingId, itemName) {
    const response = await fetch(`/api/addons/booking/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'remove',
            itemName: itemName
        })
    });
    return response.json();
}
```

## Considerations

### Data Integrity
- Preserve webhook format exactly
- Handle edge cases (empty strings, malformed data)
- Validate against business rules

### Performance
- Cache catalog data
- Minimize API calls
- Batch updates when possible

### Future Enhancements
1. Inventory tracking
2. Add-on packages/bundles
3. Time-based pricing
4. Availability by date
5. Integration with payment system

## Migration Notes

### No Breaking Changes
- Existing add-ons field continues to work
- Webhook integration unchanged
- All current features preserved

### Gradual Adoption
- Catalog is optional enhancement
- Custom text entry always available
- Can migrate historical data later

## Success Criteria
1. ✅ Managers can add/remove add-ons from any booking
2. ✅ Webhook-created data format is preserved
3. ✅ System remains compatible with existing features
4. ✅ UI is intuitive and responsive
5. ✅ Changes are logged and trackable

## Implementation Status

### Completed ✅
1. **API Module** (`/api/addons-management.js`)
   - Catalog endpoint with hardcoded items
   - Get current add-ons for booking
   - Update booking add-ons (add/remove/set)
   - Format validation endpoint

2. **Server Integration** (`server.js`)
   - Added route `/api/addons`
   - Imported and configured module

3. **Frontend UI** (`management-allocations.html`)
   - Enhanced booking modal with add-ons section
   - "Manage" button to toggle editor
   - Current items display with remove buttons
   - Catalog display by category
   - Custom item addition
   - Real-time total calculation
   - Automatic UI updates after changes

4. **Data Synchronization**
   - Maintains exact webhook format
   - Updates local data cache
   - Preserves price formatting

### Ready for Production
The implementation is complete and ready for deployment. The system:
- Works with existing add-ons data
- Maintains backward compatibility
- Provides intuitive management interface
- Handles edge cases gracefully

### Optional Future Setup
- Create Add-ons Catalog table in Airtable (see `AIRTABLE_ADDONS_CATALOG_SETUP.md`)
- Switch from hardcoded to dynamic catalog
- Add inventory tracking
- Implement bundling/packages

## Testing Instructions

1. **Local Testing**
   ```bash
   npm start
   # Run test script
   node test-addons-api.js
   ```

2. **Manual Testing**
   - Open management allocations page
   - Click on any booking with add-ons
   - Click "Manage" in add-ons section
   - Try adding/removing items
   - Test custom item addition
   - Verify total updates correctly

3. **Production Deployment**
   ```bash
   git add .
   git commit -m "Add add-ons management feature for bookings"
   git push origin main
   # Railway auto-deploys
   ```

## User Guide

### For Managers
1. Click on any booking allocation
2. In the yellow Add-ons section, click "Manage"
3. Remove items by clicking the red "Remove" button
4. Add catalog items by clicking green "Add" buttons
5. Add custom items using the bottom form
6. Changes save automatically
7. Total value updates in real-time

### Important Notes
- Changes are immediate (no save button needed)
- Custom items can have any name and price
- Duplicate items are prevented
- Original webhook format is preserved
- All existing features continue to work
