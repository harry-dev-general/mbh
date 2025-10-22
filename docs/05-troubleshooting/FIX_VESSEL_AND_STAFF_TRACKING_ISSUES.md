# Fix Vessel Display and Staff Tracking Issues - October 2025

## Issues Identified

### 1. Vessel Information Shows as "N/A"
The code is looking for `bookingData['Vessel']` but in the Bookings Dashboard table:
- There's a "Vessel" field (single line text) that might be empty
- There's also a "Boat" field (linked record) that might contain the actual boat information

### 2. Staff Member Not Tracked
When accessed via SMS links:
- `const employee = null` means no employee context
- `submittedBy` is hardcoded to 'Staff Member'
- The submittedBy value is extracted from request but NOT used in Airtable submission

## Solutions

### Fix 1: Display Vessel Information Correctly

Update the vessel display in both checklist templates to check multiple fields:

```javascript
// In renderPreDepartureChecklist and renderPostDepartureChecklist:
<span>${bookingData['Vessel'] || bookingData['Booked Boat Type'] || (bookingData['Boat'] && bookingData['Boat'].length > 0 ? 'Boat Assigned' : 'N/A')}</span>
```

### Fix 2: Track Staff Members Properly

1. **Add a prompt for staff identification** when accessing via SMS:

```javascript
// Add this to the checklist form
<div class="form-group">
    <label for="staffName">Your Name (Required)</label>
    <input type="text" id="staffName" name="staffName" required 
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
           placeholder="Enter your full name">
</div>

<div class="form-group">
    <label for="staffPhone">Your Phone Number (Required)</label>
    <input type="tel" id="staffPhone" name="staffPhone" required 
           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
           placeholder="Enter your mobile number">
</div>
```

2. **Update the data collection**:

```javascript
// In handleSubmit function
const checklistData = {
    // ... existing fields ...
    staffName: document.getElementById('staffName')?.value,
    staffPhone: document.getElementById('staffPhone')?.value
};
```

3. **Map staff information to Airtable fields**:

```javascript
// In handleChecklistSubmission
// Pre-Departure fields
'Completed by': data.staffName || submittedBy || 'Unknown Staff',

// Post-Departure fields
'Completed by': data.staffName || submittedBy || 'Unknown Staff',
```

## Alternative Solution: Use Phone Link Tracking

Since SMS links already contain magic tokens, we could:
1. Store employee info with the magic token
2. Retrieve employee details when the checklist is accessed
3. Automatically populate the staff member field

## Implementation Priority

1. **Immediate Fix**: Update vessel display to check multiple fields
2. **Quick Fix**: Add staff name/phone input fields
3. **Better Solution**: Implement token-based staff tracking

## Testing
- Test with bookings that have different vessel field configurations
- Verify staff information is captured and saved to Airtable
- Check that vessel information displays correctly for all booking types
