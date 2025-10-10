# Airtable Formula Field for Booked Boat Type

## Field Setup
1. **Table**: Bookings Dashboard
2. **Field Name**: Booked Boat Type
3. **Field Type**: Formula
4. **Return Type**: String

## Formula Option 1: Simple IF Statements
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

## Formula Option 2: With NULL Handling
```
IF(
  {Booking Items} = BLANK(),
  "",
  IF(
    FIND("12person", LOWER({Booking Items})),
    "12 Person BBQ Boat",
    IF(
      FIND("8person", LOWER({Booking Items})),
      "8 Person BBQ Boat",
      IF(
        FIND("4person", LOWER({Booking Items})),
        "4 Person Polycraft",
        "No Boat"
      )
    )
  )
)
```

## Formula Option 3: More Readable Format
```
IF(
  OR(
    FIND("12personbbqboat", LOWER({Booking Items})),
    FIND("12person", LOWER({Booking Items}))
  ),
  "12 Person BBQ Boat",
  IF(
    OR(
      FIND("8personbbqboat", LOWER({Booking Items})),
      FIND("8person", LOWER({Booking Items}))
    ),
    "8 Person BBQ Boat",
    IF(
      OR(
        FIND("4personpolycraft", LOWER({Booking Items})),
        FIND("4person", LOWER({Booking Items}))
      ),
      "4 Person Polycraft",
      ""
    )
  )
)
```

## Benefits of Formula Field

1. **Automatic**: Updates instantly for all records
2. **Retroactive**: Works on existing bookings
3. **No Code Changes**: Available immediately in API responses
4. **Consistent**: Can't be accidentally overwritten
5. **Maintenance Free**: No webhook updates needed

## How It Works

- `FIND()` searches for text within the Booking Items field
- `LOWER()` makes the search case-insensitive
- Nested `IF()` statements check each boat type in order
- Returns empty string if no boat type found

## Usage in Code

Once added, the management allocations page can simply read:
```javascript
const bookedBoatType = booking['Booked Boat Type'];
// Returns: "12 Person BBQ Boat", "8 Person BBQ Boat", "4 Person Polycraft", or ""
```

## Testing Examples

| Booking Items | Result |
|--------------|--------|
| "12personbbqboat-fullday" | "12 Person BBQ Boat" |
| "8personbbqboat-halfday,icebags" | "8 Person BBQ Boat" |
| "4personpolycraft-fullday,fishingrods" | "4 Person Polycraft" |
| "icebags,lilypads" | "" |
| "" or NULL | "" |

## Next Steps

1. Add this formula field to Bookings Dashboard in Airtable
2. Test with a few bookings to verify it works
3. Update the management allocations code to use this field
4. Remove any string parsing logic
