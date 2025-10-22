# Fix SSR Checklist Field Mapping - October 2025

## Problem
The SSR implementation is failing to save checklist data because it's using incorrect field names and not matching the actual Airtable schema.

## Solution: Update Field Mappings in checklist-renderer.js

### 1. Fix Pre-Departure Checklist Field Mapping

Replace the current field mapping in `handleChecklistSubmission` with:

```javascript
// Pre-Departure fields
fields: checklistType === 'Pre-Departure' ? {
    // Link to booking
    'Booking': [bookingId],
    
    // Resource levels (5-level selections)
    'Fuel Level Check': data.fuelLevel || null,
    'Gas Bottle Check': data.gasLevel || null,
    'Water Tank Level': data.waterLevel || null,
    
    // Cleanliness checks
    'BBQ Cleaned': data.bbqCleaned || false,
    'Toilet Cleaned': data.toiletCleaned || false,
    'Deck Washed': data.deckWashed || false,
    
    // Safety equipment
    'Life Jackets Count': data.lifeJackets ? parseInt(data.lifeJackets) : null,
    'Safety Equipment Check': data.safetyEquipment || false,
    'Lights Working': data.lightsWorking || false,
    'Anchor Secured': data.anchorSecured || false,
    'Fire Extinguisher Check': data.fireExtinguisher || false,
    
    // Overall assessment
    'Overall Vessel Condition': data.overallCondition || null,
    'Notes': data.notes || '',
    
    // Refill tracking
    'Fuel Refilled': data.fuelRefilled || false,
    'Gas Bottle Replaced': data.gasReplaced || false,
    'Water Tank Refilled': data.waterRefilled || false,
    
    // Metadata
    'Checklist Date/Time': new Date().toISOString(),
    'Completion Status': 'Completed',
    'Completion Time': new Date().toISOString()
}
```

### 2. Fix Post-Departure Checklist Field Mapping

```javascript
// Post-Departure fields
: {
    // Link to booking
    'Booking': [bookingId],
    
    // Resource levels after use (5-level selections)
    'Fuel Level After Use': data.fuelLevelAfter || null,
    'Gas Bottle Level After Use': data.gasLevelAfter || null,
    'Water Tank Level After Use': data.waterLevelAfter || null,
    
    // Refill tracking
    'Fuel Refilled': data.fuelRefilled || false,
    'Gas Bottle Replaced': data.gasReplaced || false,
    'Water Tank Refilled': data.waterRefilled || false,
    
    // Cleanliness
    'Toilet Pumped Out': data.toiletPumped || false,
    'Toilet Cleaned': data.toiletCleaned || false,
    'BBQ Cleaned': data.bbqCleaned || false,
    'Deck Cleaned': data.deckCleaned || false,
    'Rubbish Removed': data.rubbishRemoved || false,
    
    // Equipment and damage
    'Equipment Returned': data.equipmentReturned || false,
    'Damage Report': data.damageReport || '',
    'Customer Items Left': data.itemsLeft || false,
    'Items Description': data.itemsDescription || '',
    
    // GPS Location fields
    'GPS Latitude': data.gpsLatitude ? parseFloat(data.gpsLatitude) : null,
    'GPS Longitude': data.gpsLongitude ? parseFloat(data.gpsLongitude) : null,
    'Location Address': data.locationAddress || null,
    'Location Accuracy': data.locationAccuracy ? parseInt(data.locationAccuracy) : null,
    'Location Captured': data.gpsLatitude ? true : false,
    
    // Overall assessment
    'Overall Vessel Condition After Use': data.overallConditionAfter || null,
    'Anchor & Mooring Equipment': data.anchorCondition || null,
    'Lights Condition': data.lightsCondition || null,
    'Safety Equipment Condition': data.safetyCondition || null,
    
    // Metadata
    'Checklist Date/Time': new Date().toISOString(),
    'Completion Status': 'Completed',
    'Completion Time': new Date().toISOString()
}
```

### 3. Update HTML Templates to Include 5-Level Selections

Add these select groups to the Pre-Departure template:

```html
<div class="form-group">
    <label>Fuel Level Check</label>
    <select id="fuelLevel" name="fuelLevel" style="width: 100%; padding: 10px; border-radius: 6px;">
        <option value="">Select Level</option>
        <option value="Empty">Empty</option>
        <option value="Quarter">Quarter</option>
        <option value="Half">Half</option>
        <option value="Three-Quarter">3/4</option>
        <option value="Full">Full</option>
    </select>
</div>

<div class="form-group">
    <label>Gas Bottle Check</label>
    <select id="gasLevel" name="gasLevel" style="width: 100%; padding: 10px; border-radius: 6px;">
        <option value="">Select Level</option>
        <option value="Empty">Empty</option>
        <option value="Quarter">Quarter</option>
        <option value="Half">Half</option>
        <option value="Three-Quarter">3/4</option>
        <option value="Full">Full</option>
    </select>
</div>

<div class="form-group">
    <label>Water Tank Level</label>
    <select id="waterLevel" name="waterLevel" style="width: 100%; padding: 10px; border-radius: 6px;">
        <option value="">Select Level</option>
        <option value="Empty">Empty</option>
        <option value="Quarter">Quarter</option>
        <option value="Half">Half</option>
        <option value="Three-Quarter">3/4</option>
        <option value="Full">Full</option>
    </select>
</div>
```

### 4. Update Form Data Collection

In the inline JavaScript `handleSubmit` function:

```javascript
// Collect all form data properly
const formData = new FormData(event.target);
const checklistData = {
    // Get select values
    fuelLevel: document.getElementById('fuelLevel').value,
    gasLevel: document.getElementById('gasLevel').value,
    waterLevel: document.getElementById('waterLevel').value,
    
    // Get checkbox values
    bbqCleaned: document.getElementById('bbqCleaned').checked,
    toiletCleaned: document.getElementById('toiletCleaned').checked,
    deckWashed: document.getElementById('deckWashed').checked,
    
    // Get number values
    lifeJackets: document.getElementById('lifeJackets').value,
    
    // Get text values
    notes: document.getElementById('notes').value,
    
    // Include other fields...
};
```

### 5. Alternative: Use Original API Endpoints

Instead of `/api/checklist/submit-rendered`, consider using the original endpoints that already work:

```javascript
// In handleSubmit function
const response = await fetch(
    checklistType === 'Pre-Departure' 
        ? '/api/checklist/pre-departure-checklist'
        : '/api/checklist/post-departure-checklist',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                // All the properly mapped fields
            }
        })
    }
);
```

## Summary

The original implementation worked because:
1. It used the exact Airtable field names
2. It supported all field types (single select, checkbox, number, text)
3. It passed the data in the correct format expected by Airtable

The SSR implementation needs to:
1. Use the exact same field names as in Airtable
2. Support all field types including 5-level selections
3. Include GPS location tracking for post-departure
4. Either fix the field mapping in `handleChecklistSubmission` or use the existing working API endpoints

