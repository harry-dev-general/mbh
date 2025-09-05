# Airtable Rollup Field Setup Guide

**Date**: September 4, 2025

## Step-by-Step Setup for Dynamic Vessel Status

### 1. Add Date/Time Rollup Fields First

These are needed to determine which checklist is most recent.

#### In the Boats Table, create:

**Latest Pre-Departure Time** (Rollup Field)
- Table: Pre-Departure Checklist
- Field: Created time
- Aggregation function: MAX(values)

**Latest Post-Departure Time** (Rollup Field)
- Table: Post-Departure Checklist  
- Field: Created time
- Aggregation function: MAX(values)

### 2. Add Conditional Rollup Fields

Since Airtable rollups aggregate ALL linked records, we need to get creative to show only the LATEST value.

#### Option A: Use Lookup Fields (Simpler but Limited)

**Pre-Departure Fuel Levels** (Lookup Field)
- Table: Pre-Departure Checklist
- Field: Fuel Level Check
- Note: This will show ALL linked checklist fuel levels as an array

**Post-Departure Fuel Levels** (Lookup Field)
- Table: Post-Departure Checklist
- Field: Fuel Level After Use
- Note: This will show ALL linked checklist fuel levels as an array

Then create a formula to extract the last value:
```
IF(
  {Pre-Departure Fuel Levels},
  REGEX_EXTRACT(
    ARRAYJOIN({Pre-Departure Fuel Levels}),
    "[^,]+$"
  ),
  "No Data"
)
```

#### Option B: Use Filtered Views (More Complex but Accurate)

1. In Pre-Departure Checklist table, create a formula field:
   **Is Latest for Boat** = Formula that checks if this is the most recent checklist for the linked boat

2. Create a filtered linked record field in Boats table that only shows records where "Is Latest for Boat" = TRUE

3. Then use lookup fields on this filtered relationship

### 3. Recommended Approach: Keep It Simple

Given Airtable's limitations with rollups, here's the pragmatic approach:

#### A. Create These Lookup Fields in Boats Table:

**All Pre-Departure Checklists** (Count Field)
- Count of Pre-Departure Checklist records

**All Post-Departure Checklists** (Count Field)  
- Count of Post-Departure Checklist records

**Pre-Departure Fuel History** (Lookup)
- Table: Pre-Departure Checklist
- Field: Fuel Level Check

**Post-Departure Fuel History** (Lookup)
- Table: Post-Departure Checklist
- Field: Fuel Level After Use

(Repeat for Gas and Water levels)

#### B. Create Status Display Fields:

**Latest Fuel Level** (Formula Field)
```
IF(
  {All Post-Departure Checklists} > 0,
  IF(
    {Post-Departure Fuel History},
    REGEX_EXTRACT(
      ARRAYJOIN({Post-Departure Fuel History}),
      "[^,]+$"
    ),
    "Unknown"
  ),
  IF(
    {All Pre-Departure Checklists} > 0,
    IF(
      {Pre-Departure Fuel History},
      REGEX_EXTRACT(
        ARRAYJOIN({Pre-Departure Fuel History}),
        "[^,]+$"
      ),
      "Unknown"
    ),
    "No Checklists"
  )
)
```

**Fuel Needs Attention** (Formula Field)
```
OR(
  {Latest Fuel Level} = "Empty",
  {Latest Fuel Level} = "Quarter"
)
```

### 4. Alternative: Use Last Modified Time

A simpler approach that works well:

**Last Checklist Update** (Last Modified Time Field)
- Watch fields: Pre-Departure Checklist, Post-Departure Checklist

**Days Since Last Check** (Formula Field)
```
IF(
  {Last Checklist Update},
  DATETIME_DIFF(
    NOW(),
    {Last Checklist Update},
    'days'
  ) & " days ago",
  "Never checked"
)
```

### 5. For the Dashboard Implementation

Since Airtable's lookup fields return arrays, our API should:

1. Fetch the boat record with all lookup fields
2. Parse the arrays to get the most recent values
3. Or better: Query the checklist tables directly for each boat's most recent checklist

```javascript
// API endpoint pseudocode
async function getBoatStatus(boatId) {
  // Get boat basic info
  const boat = await getBoatRecord(boatId);
  
  // Get most recent checklists
  const preDepChecklists = await getChecklists({
    filter: `{Vessel} = '${boatId}'`,
    sort: [{ field: 'Created time', direction: 'desc' }],
    maxRecords: 1
  });
  
  const postDepChecklists = await getChecklists({
    filter: `{Vessel} = '${boatId}'`,
    sort: [{ field: 'Created time', direction: 'desc' }],
    maxRecords: 1
  });
  
  // Determine current levels from most recent checklist
  const currentLevels = postDepChecklists[0] || preDepChecklists[0] || null;
  
  return {
    ...boat,
    currentFuelLevel: currentLevels?.fuelLevel || 'Unknown',
    currentGasLevel: currentLevels?.gasLevel || 'Unknown',
    currentWaterLevel: currentLevels?.waterLevel || 'Unknown'
  };
}
```

### 6. Recommended Immediate Action

1. **Start with lookup fields** to see all historical values
2. **Add formula fields** to extract the last value from arrays
3. **Test with your existing data**
4. **Consider API-side logic** for more complex aggregations

The key insight is: Rather than trying to make Airtable do complex rollups, use it for what it's good at (relationships and lookups) and handle the "latest value" logic in your application code!
