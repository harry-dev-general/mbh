# Airtable Database Structure

## Overview
The MBH system uses two Airtable bases that work together to manage boat hire operations and vessel maintenance.

## Base 1: MBH Bookings Operation
**Base ID**: `applkAFOn2qxtu7tx`

### Tables

#### 1. Bookings Dashboard (`tblRe0cDmK3bG2kPf`)
Central table for managing customer bookings.

**Key Fields**:
- Booking ID (primary key)
- Customer details
- Booking date/time
- Assigned vessel (linked to Boats)
- Onboarding Employee (linked to Employee Details)
- Deloading Employee (linked to Employee Details)
- Status

#### 2. Employee Details (`tblTJrOT3WD0hrLAW`)
Staff information and contact details.

**Key Fields**:
- Employee ID (primary key)
- Name
- Email
- Mobile
- Role
- Active status

#### 3. Roster (`tblGv7fBQoKIDU5jr`)
Displays staff availability for scheduling.

**Key Fields**:
- Employee (linked)
- Week dates
- Availability slots
- Assigned bookings

#### 4. Weekly Availability Submissions (`tblNrlMdJzGD5u6dI`)
Form submissions from staff indicating their availability.

**Key Fields**:
- Employee (linked)
- Week commencing
- Available days/times
- Submission timestamp
- Notes

#### 5. Pre-Departure Checklist (`tbl9igu5g1bPG4Ahu`)
Safety checks completed before each booking.

**Key Fields**:
- Checklist ID
- Booking (linked)
- Vessel (linked)
- Employee completing
- Safety equipment checks (multiple checkbox fields)
- Engine checks
- Issues noted
- Timestamp

#### 6. Post-Departure Checklist (`tblYkbSQGP6zveYNi`)
Vessel condition checks after each booking.

**Key Fields**:
- Checklist ID
- Booking (linked)
- Vessel (linked)
- Employee completing
- Vessel condition items
- Fuel level
- Damage report
- Cleaning status
- Timestamp

#### 7. Vessel Usage Tracking (`tbl63IUmb9vZdyIu2`)
Links checklists to bookings and tracks vessel usage patterns.

**Key Fields**:
- Usage ID
- Booking (linked)
- Vessel (linked)
- Pre-departure checklist (linked)
- Post-departure checklist (linked)
- Duration
- Issues flagged

#### 8. Boats (`tblA2b3OFfqPFbOM`) 
*Synced from Vessel Maintenance base*

**Key Fields**:
- Boat ID
- Name
- Capacity
- Location
- Status
- Maintenance due

## Base 2: Vessel Maintenance
**Base ID**: `appjgJmfEkisWbUKh`

### Tables

#### 1. Boats (Source table)
Master vessel information that syncs to MBH Bookings Operation.

**Key Fields**:
- Boat ID
- Registration
- Model
- Capacity
- Current location
- Maintenance schedule
- Service history

## Key Relationships

### Booking Flow
```
Customer Booking (Bookings Dashboard)
    ├── Assigned Vessel (Boats)
    ├── Onboarding Employee (Employee Details)
    ├── Deloading Employee (Employee Details)
    └── Vessel Usage Tracking
            ├── Pre-Departure Checklist
            └── Post-Departure Checklist
```

### Availability Flow
```
Employee (Employee Details)
    ├── Weekly Availability Submissions
    └── Roster Display
            └── Available for Booking Assignment
```

### Vessel Tracking Flow
```
Vessel (Boats - synced from Maintenance)
    ├── Bookings Dashboard (assignments)
    ├── Pre-Departure Checklists
    ├── Post-Departure Checklists
    └── Vessel Usage Tracking (usage patterns)
```

## Important Notes

1. **Data Sync**: The Boats table in MBH Bookings Operation is synced from the Vessel Maintenance base
2. **Relationships**: Most tables use Airtable's linked record fields for relationships
3. **Forms**: Weekly Availability Submissions table is populated via an Airtable form
4. **Automation**: Consider that Airtable may have automations running (check base for details)

## Integration Considerations

When building the web app:
1. Respect existing relationships and data types
2. Maintain data integrity when syncing
3. Handle linked records appropriately
4. Consider Airtable's API rate limits
5. Plan for offline scenarios where Airtable sync may be delayed 