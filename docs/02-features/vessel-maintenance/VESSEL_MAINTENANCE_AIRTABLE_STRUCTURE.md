# Vessel Maintenance - Airtable Structure Solution

**Date**: September 4, 2025

## Current Problem

You're absolutely right - the Boats table has static fields that aren't being updated when checklists are submitted. Creating automations to update these fields is complex and error-prone.

## Solution: Use Airtable Lookup Fields

Since the Boats table already has linked record fields to both Pre and Post-Departure Checklists, we can leverage Airtable's built-in lookup and rollup fields to dynamically display the latest checklist data.

### 1. Remove Static Fields from Boats Table

These fields should be removed (or kept for legacy data only):
- `Current Fuel Level (%)`
- `Current Gas Level (%)`
- `Current Water Level (%)`
- `Fuel Refilled`
- `Gas Replaced`
- `Water Refilled`

### 2. Add Lookup/Rollup Fields to Boats Table

#### A. Latest Checklist Data (Using Rollup Fields)

Create these rollup fields in the Boats table:

**Latest Pre-Departure Fuel Level**
- Linked Table: Pre-Departure Checklist
- Field to Roll Up: Fuel Level Check
- Aggregation: Show value from most recent record (MAX on Created time)

**Latest Pre-Departure Gas Level**
- Linked Table: Pre-Departure Checklist
- Field to Roll Up: Gas Bottle Check
- Aggregation: Show value from most recent record

**Latest Pre-Departure Water Level**
- Linked Table: Pre-Departure Checklist
- Field to Roll Up: Water Tank Level
- Aggregation: Show value from most recent record

**Latest Post-Departure Fuel Level**
- Linked Table: Post-Departure Checklist
- Field to Roll Up: Fuel Level After Use
- Aggregation: Show value from most recent record

**Latest Post-Departure Gas Level**
- Linked Table: Post-Departure Checklist
- Field to Roll Up: Gas Bottle Level After Use
- Aggregation: Show value from most recent record

**Latest Post-Departure Water Level**
- Linked Table: Post-Departure Checklist
- Field to Roll Up: Water Tank Level After Use
- Aggregation: Show value from most recent record

#### B. Most Recent Checklist Info

**Last Checklist Type** (Formula Field)
```
IF(
  {Latest Post-Departure Time} > {Latest Pre-Departure Time},
  "Post-Departure",
  IF(
    {Latest Pre-Departure Time},
    "Pre-Departure",
    "No Checklists"
  )
)
```

**Current Fuel Level** (Formula Field)
```
IF(
  {Last Checklist Type} = "Post-Departure",
  {Latest Post-Departure Fuel Level},
  IF(
    {Last Checklist Type} = "Pre-Departure",
    {Latest Pre-Departure Fuel Level},
    "Unknown"
  )
)
```

**Current Gas Level** (Formula Field)
```
IF(
  {Last Checklist Type} = "Post-Departure",
  {Latest Post-Departure Gas Level},
  IF(
    {Last Checklist Type} = "Pre-Departure",
    {Latest Pre-Departure Gas Level},
    "Unknown"
  )
)
```

**Current Water Level** (Formula Field)
```
IF(
  {Last Checklist Type} = "Post-Departure",
  {Latest Post-Departure Water Level},
  IF(
    {Last Checklist Type} = "Pre-Departure",
    {Latest Pre-Departure Water Level},
    "Unknown"
  )
)
```

#### C. Status Indicators

**Fuel Status** (Formula Field)
```
IF(
  OR({Current Fuel Level} = "Empty", {Current Fuel Level} = "Quarter"),
  "🚨 Needs Refuel",
  IF(
    {Current Fuel Level} = "Half",
    "⚠️ Low",
    "✅ OK"
  )
)
```

**Gas Status** (Formula Field)
```
IF(
  OR({Current Gas Level} = "Empty", {Current Gas Level} = "Quarter"),
  "🚨 Needs Replace",
  IF(
    {Current Gas Level} = "Half",
    "⚠️ Low",
    "✅ OK"
  )
)
```

**Overall Status** (Formula Field)
```
IF(
  OR(
    FIND("🚨", {Fuel Status}),
    FIND("🚨", {Gas Status}),
    {Latest Post-Departure Overall Condition} = "Major Issues - Do Not Use"
  ),
  "❌ Not Ready",
  IF(
    OR(
      FIND("⚠️", {Fuel Status}),
      FIND("⚠️", {Gas Status}),
      {Latest Post-Departure Overall Condition} = "Needs Attention"
    ),
    "⚠️ Needs Attention",
    "✅ Ready"
  )
)
```

### 3. Benefits of This Approach

1. **No Automations Needed** - Data updates automatically through lookups
2. **Always Current** - Shows the most recent checklist data
3. **Historical Context** - Can see both pre and post departure levels
4. **Easy to Maintain** - No scripts or complex logic
5. **Works with Existing Data** - Uses the linked records already in place

### 4. API Implementation

When fetching boat data for the dashboard, we'll read these formula fields:

```javascript
// Example API response structure
{
  id: "recNyQ4NXCEtZAaW0",
  name: "Sandstone",
  currentFuelLevel: "Full",      // From formula field
  currentGasLevel: "Full",       // From formula field
  currentWaterLevel: "Quarter",  // From formula field
  fuelStatus: "✅ OK",
  gasStatus: "✅ OK",
  waterStatus: "⚠️ Low",
  overallStatus: "⚠️ Needs Attention",
  lastChecklistType: "Post-Departure",
  lastChecklistTime: "2025-09-04T10:17:03.985Z"
}
```

### 5. Dashboard Display Logic

The frontend will:
1. Fetch boat records with all the formula fields
2. Parse the status emoji indicators for styling
3. Convert text levels to percentages for gauges:
   - Empty = 0%
   - Quarter = 25%
   - Half = 50%
   - Three-Quarter = 75%
   - Full = 100%

### 6. Next Steps

1. **Add the lookup/rollup fields** to the Boats table
2. **Create the formula fields** for current levels and status
3. **Test with existing checklist data**
4. **Update API to read these new fields**
5. **Implement dashboard to display the data**

This approach works within Airtable's constraints and leverages its powerful relational features instead of fighting against them!
