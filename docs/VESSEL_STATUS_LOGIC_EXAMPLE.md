# Vessel Status Logic - Example

**Date**: September 4, 2025

## How the Most Recent Checklist Logic Works

The dashboard shows vessel status from **whichever checklist was completed most recently**, regardless of type.

### Example Scenario: Sandstone

Let's say Sandstone has these checklists:

```
Pre-Departure Checklists:
1. Sept 3, 2025 at 8:00 AM - Fuel: Full, Gas: Full, Water: Full
2. Sept 1, 2025 at 7:30 AM - Fuel: Half, Gas: Half, Water: Full

Post-Departure Checklists:
1. Sept 4, 2025 at 10:17 AM - Fuel: Full, Gas: Full, Water: Quarter ← MOST RECENT
2. Sept 1, 2025 at 4:00 PM - Fuel: Quarter, Gas: Quarter, Water: Half
```

**Result**: Dashboard shows data from Sept 4 Post-Departure (Fuel: Full, Gas: Full, Water: Quarter)

### Another Example: Junior

```
Pre-Departure Checklists:
1. Sept 5, 2025 at 7:00 AM - Fuel: Full, Gas: Full, Water: Full ← MOST RECENT
2. Sept 2, 2025 at 8:00 AM - Fuel: Half, Gas: Full, Water: Full

Post-Departure Checklists:
1. Sept 2, 2025 at 3:00 PM - Fuel: Quarter, Gas: Quarter, Water: Three-Quarter
2. Aug 30, 2025 at 2:00 PM - Fuel: Empty, Gas: Empty, Water: Half
```

**Result**: Dashboard shows data from Sept 5 Pre-Departure (Fuel: Full, Gas: Full, Water: Full)

## The Logic Flow

```javascript
for each boat {
    1. Get all pre-departure checklists (sorted by date, newest first)
    2. Get all post-departure checklists (sorted by date, newest first)
    3. Compare the timestamps of the FIRST (newest) record from each list
    4. Use data from whichever is more recent
}
```

## Why This Makes Sense

1. **Pre-Departure After Refuel**: If staff refueled and completed pre-departure checks, that's the current status
2. **Post-Departure Shows Usage**: After a trip, post-departure shows what's left
3. **Always Current**: The most recent check is the most accurate representation

## Visual Example

```
Timeline for Sandstone:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sept 1      Sept 2      Sept 3      Sept 4      Sept 5 (Today)
  │           │           │           │           │
  ├─ Pre      │           ├─ Pre     ├─ Post    │
  │  (Half)   │           │  (Full)  │  (Full)  │ ← CURRENT
  │           │           │           │           │
  └─ Post     │           │           │           │
     (Quarter)│           │           │           │
```

## Status Display

The dashboard would show:
- **Vessel**: Sandstone
- **Last Check**: Post-Departure (Sept 4, 10:17 AM)
- **Fuel**: 100% ✅
- **Gas**: 100% ✅  
- **Water**: 25% ⚠️
- **Alert**: Water tank low

## Edge Cases Handled

1. **No Checklists**: Shows "No checklist data available"
2. **Only Pre-Departure**: Uses pre-departure data
3. **Only Post-Departure**: Uses post-departure data
4. **Very Old Data**: Shows warning if last check > 7 days ago

## Benefits

- **Accurate**: Always shows the most current information
- **Flexible**: Works regardless of checklist completion patterns
- **Intuitive**: Staff understand "most recent = current status"
- **Complete**: Captures both preparation and usage data
