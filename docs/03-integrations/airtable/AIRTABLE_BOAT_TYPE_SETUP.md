# Airtable Boat Type Formula Field Setup

**Date**: September 4, 2025

## Important Note

The boat type filtering feature requires either:
1. A formula field in Airtable (recommended for data consistency)
2. Client-side parsing from the "Booking Items" field (currently implemented)

## Current Implementation

The system now parses boat types directly from the "Booking Items" field on the client-side:
- Looks for "12person" → "12 Person BBQ Boat"
- Looks for "8person" → "8 Person BBQ Boat"  
- Looks for "4person" → "4 Person Polycraft"

## Recommended: Add Formula Field in Airtable

For better data consistency and reporting, you should create a formula field in the "Bookings Dashboard" table:

### Steps to Create the Formula Field

1. **Open your Airtable base** "MBH Bookings Operation"
2. **Go to the "Bookings Dashboard" table**
3. **Add a new field** with these settings:
   - **Field Name**: `Booked Boat Type`
   - **Field Type**: `Formula`
   - **Formula**:
   ```
   IF(
     FIND("12person", LOWER({Booking Items})),
     "12 Person BBQ Boat",
     IF(
       FIND("8person", LOWER({Booking Items})),
       "8 Person BBQ Boat",
       IF(
         FIND("4person", LOWER({Booking Items})),
         "4 Person Polycraft",
         ""
       )
     )
   )
   ```

### Benefits of Formula Field

1. **Centralized Logic**: Boat type parsing happens in one place
2. **Consistent Data**: All views and integrations see the same boat type
3. **Better Reporting**: Can group/filter by boat type in Airtable views
4. **Performance**: Reduces client-side processing

### Current SKU Formats Supported

The parsing logic supports these booking item formats:
- `12personbbqboat-halfday`
- `12personbbqboat-fullday`
- `8personbbqboat-fullday`
- `8personbbqboat-halfday`
- `4personpolycraft-halfday`
- `4personpolycraft-fullday`
- Legacy formats like `12personbbqboat`, `fullday12personbbqboat`

## Testing the Feature

1. Click on a booking allocation that has booking items
2. Check the console logs for:
   - "Booking Items: [value]"
   - "Parsed Boat Type: [type]"
   - "Available boats: [list]"
   - "Filtered boats: [filtered list]"
3. The boat dropdown should only show vessels matching the customer's booking type

## Troubleshooting

If boat filtering isn't working:
1. Check that the booking has "Booking Items" populated
2. Verify boats have the "Boat Type" field set correctly
3. Check console logs for parsing results
4. Ensure boat types match exactly (e.g., "12 Person BBQ Boat")
