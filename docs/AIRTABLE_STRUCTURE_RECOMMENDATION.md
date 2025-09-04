# Airtable Structure Recommendation for Boat Type Management

## Current Structure Analysis

### Current Fields in Bookings Dashboard
- **Booking Items**: Text field containing SKU strings (e.g., "12personbbqboat-fullday,icebags")
- **Boat**: Linked record to specific vessel (e.g., Sandstone, Pumice Stone)

### Current Fields in Boats Table
- **Boat Type**: Single select field with proper categories
  - 12 Person BBQ Boat
  - 8 Person BBQ Boat
  - 4 Person Polycraft
  - Work Boat

## The Problem

Currently, to determine what type of boat a customer booked, we must:
1. Parse the "Booking Items" text field
2. Look for patterns like "12personbbqboat" in the string
3. Hardcode the mapping logic

This approach is fragile and couples business logic to SKU naming conventions.

## Recommended Solution

### Add New Field to Bookings Dashboard

**Field Name**: "Booked Boat Type"
**Field Type**: Single Select
**Options**:
- 12 Person BBQ Boat
- 8 Person BBQ Boat
- 4 Person Polycraft
- None (for bookings without boats)

### Benefits

1. **Explicit Data**: No parsing or guessing required
2. **Data Integrity**: Can't have invalid boat types
3. **Easy Filtering**: Airtable views can filter by boat type
4. **Reporting**: Easy to analyze bookings by boat type
5. **Future Proof**: SKU formats can change without breaking logic

### Implementation Approach

#### Option 1: Manual Airtable Field Addition
1. Add "Booked Boat Type" field to Bookings Dashboard
2. Update webhook automation to populate this field based on SKU
3. Backfill existing records using Airtable formula or script

#### Option 2: Webhook Enhancement
Update the webhook processing to:
```javascript
// In webhook automation script
let bookedBoatType = null;
if (bookingItems.includes('12personbbqboat')) {
    bookedBoatType = '12 Person BBQ Boat';
} else if (bookingItems.includes('8personbbqboat')) {
    bookedBoatType = '8 Person BBQ Boat';
} else if (bookingItems.includes('4personpolycraft')) {
    bookedBoatType = '4 Person Polycraft';
}

// Add to fields being updated
fields['Booked Boat Type'] = bookedBoatType;
```

### Alternative: Create SKU Reference Table

For even better structure, create a new table:

**Table Name**: "Booking SKUs"
**Fields**:
- SKU (Primary, Text): "12personbbqboat-fullday"
- Boat Type (Single Select): "12 Person BBQ Boat"
- Duration (Single Select): "Full Day" / "Half Day"
- Base Price (Currency)
- Description (Text)

Then link bookings to SKUs instead of storing raw text.

## Immediate vs Long-term

### Immediate Solution (Recommended)
Add "Booked Boat Type" single select field to Bookings Dashboard and populate it via webhook.

### Long-term Solution
Implement full SKU reference table with proper relationships.

## Impact on Management Allocations

With proper field structure:
```javascript
// Instead of parsing strings:
const boatType = parseBoatType(booking['Booking Items']); // ❌

// Simply read the field:
const boatType = booking['Booked Boat Type']; // ✅

// Filter boats becomes trivial:
const matchingBoats = boatsData.filter(boat => 
    boat.fields['Boat Type'] === booking['Booked Boat Type']
);
```

## Next Steps

1. Add "Booked Boat Type" field to Bookings Dashboard in Airtable
2. Update webhook automation to populate this field
3. Update management allocations to use this field
4. Consider implementing SKU reference table for phase 2
