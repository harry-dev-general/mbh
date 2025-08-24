# Correct Airtable Table IDs

## MBH Bookings Operation Base
**Base ID**: `applkAFOn2qxtu7tx`

### Verified Table IDs (January 2025)

| Table Name | Table ID | Notes |
|------------|----------|-------|
| **Bookings Dashboard** | `tblRe0cDmK3bG2kPf` | Customer bookings with Status, Onboarding/Deloading fields |
| **Weekly Availability Submissions** | `tblcBoyuVsbB1dt1I` | Staff availability forms |
| **Employee Details** | `tblTJrOT3WD0hrLAW` | Staff records |
| **Roster** | `tblwwK1jWGxnfuzAN` | Weekly staff availability display |
| **Shift Allocations** | `tbl22YKtQXZtDFtEX` | Staff shift schedules |
| **Pre-Departure Checklist** | `tbl9igu5g1bPG4Ahu` | Safety checks before trips |
| **Post-Departure Checklist** | `tblYkbSQGP6zveYNi` | Vessel condition after trips |
| **Boats** | `tblA2b3OFfqPFbOM` | Vessel information (synced) |

## Important Field Names - Bookings Dashboard

### Key Fields (Case-Sensitive!)
- `Customer Name` - Customer's name
- `Customer Email` - Customer's email
- `Booking Date` - Date of the booking
- `Start Time` - Booking start time
- `Finish Time` - Booking end time (NOT "End Time")
- `Status` - Booking status (e.g., "PAID")
- `Onboarding Time` - When customer boards
- `Deloading Time` - When customer disembarks
- `Onboarding Employee` - Linked to Employee Details
- `Deloading Employee` - Linked to Employee Details
- `Booking Code` - Unique booking identifier (NOT "Booking Name")
- `Duration` - Booking duration (NOT "Total Duration")

### Common Mistakes
1. ❌ Using `status` instead of `Status` (case matters!)
2. ❌ Using `End Time` instead of `Finish Time`
3. ❌ Using `Booking Name` instead of `Booking Code`
4. ❌ Using wrong table ID `tblcBoyuVsbB1dt1I` (that's Weekly Availability)
5. ❌ Using wrong table ID `tblh0PxQWr6vRGHVZ` (doesn't exist)

## Verification Method
These IDs were verified using the Airtable MCP tool:
```javascript
mcp_airtable_describe_table({
    baseId: "applkAFOn2qxtu7tx",
    tableId: "tblRe0cDmK3bG2kPf"
})
```

## Last Updated
January 2025 - Verified via Airtable API
