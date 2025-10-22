# Complete SSR Checklist Restoration Guide

## Overview
This guide provides the complete solution to restore all missing functionality to the SSR checklists, including:
- 5-level resource tracking (fuel/gas/water)
- GPS location tracking
- Proper field mapping to Airtable
- All original checklist items

## Step 1: Update Pre-Departure Checklist Template

In `renderPreDepartureChecklist` function in `/api/checklist-renderer.js`, replace the checklist sections with:

```javascript
// After the booking info section, add:

                <!-- Fuel & Resources -->
                <div class="checklist-section">
                    <h3 class="group-title"><i class="fas fa-gas-pump"></i> Fuel & Resources</h3>
                    
                    <div class="form-group">
                        <label>Fuel Level Check</label>
                        <select id="fuelLevel" name="fuelLevel" class="form-control" required 
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
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
                        <select id="gasLevel" name="gasLevel" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
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
                        <select id="waterLevel" name="waterLevel" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="fuelRefilled" name="fuelRefilled">
                        <label for="fuelRefilled">Fuel Refilled (if needed)</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="gasReplaced" name="gasReplaced">
                        <label for="gasReplaced">Gas Bottle Replaced (if needed)</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="waterRefilled" name="waterRefilled">
                        <label for="waterRefilled">Water Tank Refilled (if needed)</label>
                    </div>
                </div>

                <!-- Cleanliness -->
                <div class="checklist-section">
                    <h3 class="group-title"><i class="fas fa-broom"></i> Cleanliness</h3>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="bbqCleaned" name="bbqCleaned">
                        <label for="bbqCleaned">BBQ Cleaned</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="toiletCleaned" name="toiletCleaned">
                        <label for="toiletCleaned">Toilet Cleaned</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="deckWashed" name="deckWashed">
                        <label for="deckWashed">Deck Washed</label>
                    </div>
                </div>

                <!-- Safety Equipment -->
                <div class="checklist-section">
                    <h3 class="group-title"><i class="fas fa-life-ring"></i> Safety Equipment</h3>
                    
                    <div class="form-group">
                        <label for="lifeJackets">Life Jackets Count</label>
                        <input type="number" id="lifeJackets" name="lifeJackets" min="0" max="50" required
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="safetyEquipment" name="safetyEquipment">
                        <label for="safetyEquipment">Safety Equipment Check (flares, first aid, etc.)</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="lightsWorking" name="lightsWorking">
                        <label for="lightsWorking">All Lights Working</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="anchorSecured" name="anchorSecured">
                        <label for="anchorSecured">Anchor Secured</label>
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="fireExtinguisher" name="fireExtinguisher">
                        <label for="fireExtinguisher">Fire Extinguisher Check</label>
                    </div>
                </div>

                <!-- Overall Assessment -->
                <div class="checklist-section">
                    <h3 class="group-title"><i class="fas fa-clipboard-check"></i> Overall Assessment</h3>
                    
                    <div class="form-group">
                        <label>Overall Vessel Condition</label>
                        <select id="overallCondition" name="overallCondition" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Condition</option>
                            <option value="Ready">Ready for Use</option>
                            <option value="Issues Found">Issues Found</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="notes">Notes (Optional)</label>
                        <textarea id="notes" name="notes" rows="4" 
                                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                                  placeholder="Any issues or observations..."></textarea>
                    </div>
                </div>
```

## Step 2: Update Post-Departure Checklist Template

Add these sections for resource tracking and location:

```javascript
                <!-- Resource Levels After Use -->
                <div class="checklist-section">
                    <h3 class="group-title"><i class="fas fa-gas-pump"></i> Resource Levels After Use</h3>
                    
                    <div class="form-group">
                        <label>Fuel Level After Use</label>
                        <select id="fuelLevelAfter" name="fuelLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Gas Bottle Level After Use</label>
                        <select id="gasLevelAfter" name="gasLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Water Tank Level After Use</label>
                        <select id="waterLevelAfter" name="waterLevelAfter" class="form-control" required
                                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="">Select Level</option>
                            <option value="Empty">Empty</option>
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Three-Quarter">3/4</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>
                </div>

                <!-- Add the GPS Location section from the restoration guide -->
                <div class="checklist-section" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 25px 0;">
                    <h3 style="color: #0066cc; margin-bottom: 15px;">
                        <i class="fas fa-map-marker-alt"></i> Vessel Location
                    </h3>
                    <p style="color: #666; margin-bottom: 1rem;">Record where you've moored the vessel</p>
                    
                    <button type="button" id="captureLocationBtn" onclick="captureLocation()" 
                            style="background: #28a745; color: white; border: none; padding: 12px 24px; 
                                   border-radius: 6px; font-size: 16px; cursor: pointer;">
                        <i class="fas fa-location-arrow"></i> Capture Current Location
                    </button>
                    
                    <div id="locationStatus" style="display: none; margin-top: 1rem; padding: 1rem; 
                                                    border-radius: 5px; font-size: 0.9rem;"></div>
                    
                    <!-- Hidden fields to store location data -->
                    <input type="hidden" id="gpsLatitude" name="gpsLatitude">
                    <input type="hidden" id="gpsLongitude" name="gpsLongitude">
                    <input type="hidden" id="locationAddress" name="locationAddress">
                    <input type="hidden" id="locationAccuracy" name="locationAccuracy">
                </div>
```

## Step 3: Update Form Data Collection

Update the `handleSubmit` function in both templates:

```javascript
// Collect form data
const checklistData = {
    // Pre-Departure specific fields
    fuelLevel: document.getElementById('fuelLevel')?.value,
    gasLevel: document.getElementById('gasLevel')?.value,
    waterLevel: document.getElementById('waterLevel')?.value,
    bbqCleaned: document.getElementById('bbqCleaned')?.checked,
    toiletCleaned: document.getElementById('toiletCleaned')?.checked,
    deckWashed: document.getElementById('deckWashed')?.checked,
    lifeJackets: document.getElementById('lifeJackets')?.value,
    safetyEquipment: document.getElementById('safetyEquipment')?.checked,
    lightsWorking: document.getElementById('lightsWorking')?.checked,
    anchorSecured: document.getElementById('anchorSecured')?.checked,
    fireExtinguisher: document.getElementById('fireExtinguisher')?.checked,
    fuelRefilled: document.getElementById('fuelRefilled')?.checked,
    gasReplaced: document.getElementById('gasReplaced')?.checked,
    waterRefilled: document.getElementById('waterRefilled')?.checked,
    overallCondition: document.getElementById('overallCondition')?.value,
    
    // Post-Departure specific fields
    fuelLevelAfter: document.getElementById('fuelLevelAfter')?.value,
    gasLevelAfter: document.getElementById('gasLevelAfter')?.value,
    waterLevelAfter: document.getElementById('waterLevelAfter')?.value,
    vessel_cleaned: document.getElementById('vessel_cleaned')?.checked,
    equipment_returned: document.getElementById('equipment_returned')?.checked,
    no_damage: document.getElementById('no_damage')?.checked,
    fuel_topped: document.getElementById('fuel_topped')?.checked,
    lifejackets_returned: document.getElementById('lifejackets_returned')?.checked,
    safety_equipment_complete: document.getElementById('safety_equipment_complete')?.checked,
    customer_satisfied: document.getElementById('customer_satisfied')?.checked,
    no_incidents: document.getElementById('no_incidents')?.checked,
    
    // GPS fields
    gpsLatitude: document.getElementById('gpsLatitude')?.value,
    gpsLongitude: document.getElementById('gpsLongitude')?.value,
    locationAddress: document.getElementById('locationAddress')?.value,
    locationAccuracy: document.getElementById('locationAccuracy')?.value,
    
    // Common field
    notes: document.getElementById('notes')?.value
};
```

## Step 4: Update Field Mapping in handleChecklistSubmission

```javascript
// In handleChecklistSubmission function, update the field mapping:
fields: checklistType === 'Pre-Departure' ? {
    // Pre-Departure fields
    'Booking': [bookingId],
    'Fuel Level Check': data.fuelLevel || null,
    'Gas Bottle Check': data.gasLevel || null,
    'Water Tank Level': data.waterLevel || null,
    'BBQ Cleaned': data.bbqCleaned || false,
    'Toilet Cleaned': data.toiletCleaned || false,
    'Deck Washed': data.deckWashed || false,
    'Life Jackets Count': data.lifeJackets ? parseInt(data.lifeJackets) : null,
    'Safety Equipment Check': data.safetyEquipment || false,
    'Lights Working': data.lightsWorking || false,
    'Anchor Secured': data.anchorSecured || false,
    'Fire Extinguisher Check': data.fireExtinguisher || false,
    'Overall Vessel Condition': data.overallCondition || null,
    'Notes': data.notes || '',
    'Fuel Refilled': data.fuelRefilled || false,
    'Gas Bottle Replaced': data.gasReplaced || false,
    'Water Tank Refilled': data.waterRefilled || false,
    'Checklist Date/Time': new Date().toISOString(),
    'Completion Status': 'Completed',
    'Completion Time': new Date().toISOString()
} : {
    // Post-Departure fields
    'Booking': [bookingId],
    'Fuel Level After Use': data.fuelLevelAfter || null,
    'Gas Bottle Level After Use': data.gasLevelAfter || null,
    'Water Tank Level After Use': data.waterLevelAfter || null,
    'Fuel Refilled': data.fuel_topped || false,
    'Gas Bottle Replaced': data.gasReplaced || false,
    'Water Tank Refilled': data.waterRefilled || false,
    'Toilet Pumped Out': data.toiletPumped || false,
    'Toilet Cleaned': data.vessel_cleaned || false,
    'BBQ Cleaned': data.bbqCleaned || false,
    'Deck Cleaned': data.deckCleaned || false,
    'Rubbish Removed': data.rubbishRemoved || false,
    'Equipment Returned': data.equipment_returned || false,
    'Damage Report': data.damageReport || data.notes || '',
    'Customer Items Left': data.itemsLeft || false,
    'Items Description': data.itemsDescription || '',
    'GPS Latitude': data.gpsLatitude ? parseFloat(data.gpsLatitude) : null,
    'GPS Longitude': data.gpsLongitude ? parseFloat(data.gpsLongitude) : null,
    'Location Address': data.locationAddress || null,
    'Location Accuracy': data.locationAccuracy ? parseInt(data.locationAccuracy) : null,
    'Location Captured': data.gpsLatitude ? true : false,
    'Overall Vessel Condition After Use': data.no_damage 
        ? 'Good - Ready for Next Booking' 
        : 'Needs Attention',
    'Checklist Date/Time': new Date().toISOString(),
    'Completion Status': 'Completed',
    'Completion Time': new Date().toISOString()
}
```

## Step 5: Add CSS Styles

Add these styles to make the form elements consistent:

```css
.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.form-control:focus {
    outline: none;
    border-color: #0066cc;
}
```

## Complete Solution Benefits

This implementation:
- ✅ Restores all missing functionality
- ✅ Matches the exact Airtable field structure
- ✅ Includes GPS location tracking
- ✅ Supports 5-level resource tracking
- ✅ Maintains SSR reliability
- ✅ Works without external dependencies
- ✅ Compatible with SMS link access

## Testing Checklist

1. Test all form fields populate correctly
2. Verify 5-level selections save properly
3. Test GPS location capture on mobile
4. Confirm data saves to correct Airtable fields
5. Test both pre-departure and post-departure forms
6. Verify fixed marina locations (Work Boat, Ice Cream Boat)

