# Ice Cream Boat Sales Table Setup

## Overview
Ice cream sales from Square are now recorded in a dedicated "Ice Cream Boat Sales" table in Airtable, separate from regular boat hire bookings.

## Table Details
- **Base**: MBH Bookings Operation (`applkAFOn2qxtu7tx`)
- **Table**: Ice Cream Boat Sales (`tblTajm845Fiij8ud`)

## Fields Created

### Customer Information
- **Sale Code** (Single Line Text) - Unique identifier from Square receipt number
- **Customer Name** (Single Line Text) - Name of the customer
- **Customer Email** (Email) - Customer email if provided
- **Phone Number** (Phone) - Customer contact number

### Sale Details
- **Sale Amount** (Currency) - Total amount of the ice cream sale
- **Vessel/Operation** (Single Line Text) - Which ice cream boat (e.g., Walker Courtney, Pumice Stone)
- **Sale Date** (Date) - Date of the sale in YYYY-MM-DD format
- **Sale Time** (Single Line Text) - Time of sale in AEST
- **Add-ons** (Long Text) - Any modifiers or additional items

### Square Integration
- **Square Payment ID** (Single Line Text) - Unique payment ID for deduplication
- **Square Order ID** (Single Line Text) - Order reference from Square
- **Status** (Single Select) - Payment status (PAID, PENDING, REFUNDED)
- **Notes** (Long Text) - Additional notes about the sale

### Default Fields (from template)
- **Name** - Primary field (auto-populated with Sale Code)
- **Assignee** - Staff member if applicable
- **Attachments** - Any related files

## Data Flow

1. **Square Sale** → Customer purchases from "Ice-Cream-Boat-Sales" category
2. **Webhook Triggered** → Square sends payment.created/updated event
3. **Category Check** → System verifies it's an ice cream sale
4. **Record Created** → Sale recorded in Ice Cream Boat Sales table
5. **Portal Display** → Sales visible in MBH Portal (future feature)

## Status Mapping
- Square `COMPLETED` → Airtable `PAID`
- Square `PENDING` → Airtable `PENDING`
- Square `CANCELED`/`FAILED` → Airtable `REFUNDED`

## Example Record
```
Sale Code: ICE-20250926-ABC1
Customer Name: John Smith
Customer Email: john@example.com
Phone Number: +61412345678
Sale Amount: $25.00
Vessel/Operation: Ice Cream Boat - Walker Courtney
Sale Date: 2025-09-26
Sale Time: 2:30 pm
Add-ons: Extra Scoop - $5.00, Waffle Cone - $2.00
Square Payment ID: payment_ABC123
Square Order ID: order_XYZ789
Status: PAID
Notes: Ice cream sale processed at 2:30 pm on 2025-09-26
```

## Future Enhancements
- Dashboard view for ice cream sales
- Daily/weekly sales reports
- Integration with vessel tracking
- SMS notifications for large orders
