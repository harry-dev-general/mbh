# Airtable Add-ons Catalog Table Setup Guide

## Overview
This guide explains how to create the Add-ons Catalog table in your Airtable base. While the current implementation uses a hardcoded catalog in the API, creating this table will allow for future expansion and easier management of add-on items.

## Table Creation Steps

### 1. Create New Table
1. Go to your MBH Bookings Operation base (`applkAFOn2qxtu7tx`)
2. Click the "+" button to add a new table
3. Name it: **Add-ons Catalog**
4. Start with a blank table

### 2. Configure Fields

Create the following fields in order:

#### Name (Primary Field)
- **Field Type**: Single line text
- **Description**: Display name of the add-on item
- **Examples**: "Lilly Pad", "Fishing Rods", "Kayak"

#### SKU
- **Field Type**: Single line text
- **Description**: Matches the SKU from Checkfront
- **Examples**: "lillypad", "fishingrods", "kayak"

#### Price
- **Field Type**: Currency
- **Currency Symbol**: $
- **Precision**: 2 decimal places
- **Description**: Standard rental price
- **Examples**: $55.00, $20.00, $45.00

#### Category
- **Field Type**: Single select
- **Options**:
  - Water Sports (Blue)
  - Activities (Green)
  - Comfort (Orange)
  - Safety (Red)
- **Description**: Grouping for display purposes

#### Active
- **Field Type**: Checkbox
- **Description**: Whether this item is currently available for selection
- **Default**: Checked ✓

#### Description
- **Field Type**: Long text
- **Description**: Optional details about the item
- **Examples**: "2-person inflatable water mat", "Set of 4 rods with tackle"

#### Sort Order
- **Field Type**: Number
- **Description**: Controls display order (lower numbers appear first)
- **Default**: 10

#### Created
- **Field Type**: Created time
- **Description**: Auto-generated timestamp

### 3. Initial Data Entry

Add the following items to get started:

| Name | SKU | Price | Category | Active | Sort Order |
|------|-----|-------|----------|--------|------------|
| Lilly Pad | lillypad | $55.00 | Water Sports | ✓ | 10 |
| Fishing Rods | fishingrods | $20.00 | Activities | ✓ | 20 |
| Icebag | icebag | $12.50 | Comfort | ✓ | 30 |
| Kayak | kayak | $45.00 | Water Sports | ✓ | 11 |
| Stand Up Paddleboard | sup | $65.00 | Water Sports | ✓ | 12 |
| Paddleboard | paddleboard | $65.00 | Water Sports | ✓ | 13 |
| Esky/Cooler | esky | $25.00 | Comfort | ✓ | 31 |
| Bait Pack | baitpack | $15.00 | Activities | ✓ | 21 |
| Ice Pack | icepack | $12.50 | Comfort | ✓ | 32 |
| BBQ Pack | bbqpack | $35.00 | Comfort | ✓ | 33 |
| Food Package | foodpack | $45.00 | Comfort | ✓ | 34 |

### 4. Create Views

#### All Items (Grid View)
- Default view showing all records
- Sort by: Category (A→Z), then Sort Order (1→9)

#### Active Items Only
- Filter: Where Active is checked
- Sort by: Category (A→Z), then Sort Order (1→9)
- Use for: API queries

#### By Category (Kanban View)
- Stack by: Category
- Card preview: Name, Price
- Use for: Visual management

### 5. Update API Configuration

Once the table is created, update the API to use the actual table ID:

1. Get the table ID from Airtable (starts with `tbl`)
2. Update `/api/addons-management.js`:
   ```javascript
   const ADDONS_CATALOG_TABLE_ID = 'tblYourActualTableId'; // Replace with actual ID
   ```

### 6. Enable API Access

To switch from hardcoded catalog to Airtable:

1. Update the `loadAddOnsCatalog` function in the API to fetch from Airtable
2. Implement caching to reduce API calls
3. Test thoroughly before deploying

## Benefits of Using Catalog Table

1. **Dynamic Pricing**: Update prices without code changes
2. **Seasonal Items**: Enable/disable items based on season
3. **New Items**: Add new rental items easily
4. **Categories**: Reorganize items as needed
5. **Descriptions**: Add helpful details for staff
6. **Analytics**: Track which add-ons are most popular

## Future Enhancements

### Inventory Tracking
Add fields for:
- Quantity Available
- Currently Rented
- Maintenance Status

### Dynamic Pricing
Add fields for:
- Peak Season Price
- Off-Season Price
- Weekend Price

### Bundling
Create a "Packages" table that references multiple catalog items

## Maintenance

### Regular Tasks
1. Review and update prices monthly
2. Check SKU matches with Checkfront
3. Add new items as they become available
4. Disable out-of-service items

### Integration Points
- Checkfront webhook uses SKU field for matching
- Management portal uses Name and Price for display
- Reports can aggregate by Category

## Troubleshooting

### Items Not Appearing
1. Check "Active" is checked
2. Verify table ID in API configuration
3. Check Airtable API permissions

### Price Mismatches
1. Ensure Price field is Currency type
2. Check decimal places (should be 2)
3. Verify no formula fields are interfering

### Category Issues
1. Ensure Category is Single Select (not Text)
2. Check spelling matches exactly
3. Verify no trailing spaces

## Notes

- The current implementation works without this table
- Creating the table prepares for future enhancements
- Existing add-ons in bookings remain unchanged
- The webhook continues to work independently
