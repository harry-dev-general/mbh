# Checkfront Category Mapping Guide

## Current Category Structure

Your Checkfront system has 4 main categories:
1. **Pontoon BBQ Boat** (Category ID: 2) - BOAT
2. **4.1m Polycraft 4 Person** (Category ID: 3) - BOAT
3. **Add ons** (Category ID: 4+) - ADD-ONS
4. **Child Life Jacket** (Category ID: 5) - ADD-ONS

## How the Script Uses Categories

The webhook script uses category IDs to determine if an item is a boat or an add-on:

```javascript
const categoryMapping = {
    // Boat categories
    '2': { name: 'Pontoon BBQ Boat', type: 'boat' },
    '3': { name: '4.1m Polycraft 4 Person', type: 'boat' },
    // Add-on categories
    '4': { name: 'Add ons', type: 'addon' },
    '5': { name: 'Child Life Jacket', type: 'addon' },
    '6': { name: 'Add ons', type: 'addon' },
    '7': { name: 'Add ons', type: 'addon' }
};
```

## Adding New Categories

When you add new categories in Checkfront:

### For New Boats:
1. Find the category ID in Checkfront
2. Add to the mapping with `type: 'boat'`:
   ```javascript
   '8': { name: 'New Boat Type', type: 'boat' },
   ```

### For New Add-ons:
1. Find the category ID in Checkfront
2. Add to the mapping with `type: 'addon'`:
   ```javascript
   '9': { name: 'New Add-on Type', type: 'addon' },
   ```

## Finding Category IDs

To find category IDs in Checkfront:
1. Create a test booking with the item
2. Check the webhook payload - each item has a `category_id` field
3. Or check Checkfront's admin panel for category settings

## Fallback Logic

If the script encounters an unknown category ID:
1. It logs a warning: "Unknown category ID: X"
2. Falls back to SKU pattern matching:
   - Contains "boat", "polycraft", or "bbq" → BOAT
   - Otherwise → ADD-ON

## Testing Changes

After updating the category mapping:
1. Create a test booking with the new category items
2. Check Airtable automation logs for proper categorization
3. Verify "Booking Items" contains boats only
4. Verify "Add-ons" contains all non-boat items

## Example Scenarios

### Scenario 1: Adding a Jet Ski category
```javascript
'10': { name: 'Jet Ski', type: 'boat' },
```

### Scenario 2: Adding a Safety Equipment category
```javascript
'11': { name: 'Safety Equipment', type: 'addon' },
```

### Scenario 3: Renaming a category
Just update the name in the mapping - the ID stays the same:
```javascript
'4': { name: 'Accessories & Add-ons', type: 'addon' },
```
