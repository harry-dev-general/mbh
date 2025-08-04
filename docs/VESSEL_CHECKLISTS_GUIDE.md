# Vessel Checklists Guide

## Overview
The Vessel Checklists feature allows MBH staff to complete mandatory pre-departure and post-departure safety checks for each booking. The system integrates with Airtable to ensure proper vessel maintenance and safety compliance.

## How It Works

### 1. Landing Page (`vessel-checklists.html`)
- Two main options: Pre-Departure and Post-Departure checklists
- Shows badge count of pending checklists for each type
- Only displays bookings assigned to the logged-in staff member

### 2. Pre-Departure Checklist
Staff assigned as "Onboarding Employee" complete safety checks before customers board:

#### Checklist Items:
- **Fuel & Resources**
  - Fuel level check (Empty to Full)
  - Gas bottle check (Empty to Full)
  - Water tank level (Empty to Full)
  - Refill confirmations

- **Cleanliness**
  - BBQ cleaned
  - Toilet cleaned
  - Deck washed

- **Safety Equipment**
  - Life jackets count
  - Safety equipment check
  - Lights working
  - Anchor secured
  - Fire extinguisher check

- **Overall Assessment**
  - Vessel condition (Ready/Issues Found)
  - Notes for any observations

### 3. Post-Departure Checklist
Staff assigned as "Deloading Employee" complete vessel inspection after customers leave:

#### Checklist Items:
- **Resources Used**
  - Fuel used (None to Full Tank)
  - Gas used (None to Empty Bottle)
  - Resource levels after use
  - Refill confirmations

- **Vessel Condition**
  - BBQ condition (Clean/Needs Cleaning/Damaged)
  - Deck condition
  - Toilet pumped out
  - Rubbish removed
  - Equipment returned

- **Safety & Equipment**
  - Lights condition
  - Safety equipment condition
  - Anchor & mooring equipment

- **Damage & Lost Items**
  - Damage report (with photo reminder)
  - Customer items left behind
  - Items description

- **Overall Assessment**
  - Ready for next booking / Needs attention / Do not use

## Data Flow

```
1. Staff logs in → Email matched to Airtable Employee record
2. System queries bookings where:
   - Status = "PAID" (active bookings only)
   - Staff is assigned as Onboarding/Deloading Employee
3. Staff selects a booking → Shows customer, boat, and time details
4. Staff completes checklist → Submits to Airtable
5. Checklist linked to: Booking, Staff Member, and Vessel records
```

## Key Features

### Smart Filtering
- Only shows bookings with Status = "PAID"
- Automatically excludes cancelled bookings (VOID/STOP status)
- Shows only bookings assigned to the logged-in staff member

### Visual Feedback
- Color-coded select options
- Checkbox items highlight when checked
- Damage alerts prompt for photos
- Conditional fields (e.g., items description only shows if items left)

### Data Validation
- All critical fields are required
- Time stamps automatically recorded
- Links maintained to booking, vessel, and staff records

## Airtable Integration

### Tables Used:
1. **Bookings Dashboard** (`tblRe0cDmK3bG2kPf`)
   - Source for booking assignments
   - Links staff to specific bookings

2. **Pre-Departure Checklist** (`tbl9igu5g1bPG4Ahu`)
   - Stores all pre-departure safety checks
   - Links to booking, staff, and vessel

3. **Post-Departure Checklist** (`tblYkbSQGP6zveYNi`)
   - Stores all post-departure inspections
   - Links to booking, staff, and vessel

4. **Employee Details** (`tbltAE4NlNePvnkpY`)
   - Matches Supabase users to Airtable employees

5. **Boats** (`tblNLoBNb4daWzjob`)
   - Provides vessel names and details

## Important Business Rules

1. **Assignment Logic**:
   - Pre-departure: Shows bookings where user is "Onboarding Employee"
   - Post-departure: Shows bookings where user is "Deloading Employee"
   - Same staff member can be assigned to both roles

2. **Status Filtering**:
   - Only "PAID" bookings appear
   - Cancelled bookings (VOID/STOP) are automatically hidden

3. **Time Display**:
   - Shows ALL assigned bookings regardless of date
   - Sorted by booking date, then by time
   - Allows staff to complete checklists for bookings weeks in advance

4. **Completion Tracking**:
   - Completed checklists show "Completed" badge
   - Pending checklists show "Pending" badge
   - Badge counts update in real-time

## Technical Implementation

### Authentication
- Uses Supabase Auth for user verification
- Email-based employee lookup in Airtable
- Secure session management

### API Integration
- Direct Airtable API calls from frontend
- Real-time data fetching
- Proper error handling and user feedback

### Responsive Design
- Mobile-friendly interface
- Works on tablets and phones
- Touch-optimized controls

## Troubleshooting

### Common Issues:

1. **"Employee record not found"**
   - Ensure user's email exists in Airtable Employee Details table
   - Check for exact email match (case-sensitive)

2. **No bookings showing**
   - Verify staff is assigned to bookings in Airtable
   - Check booking status is "PAID"
   - Check that you have the correct Onboarding/Deloading Employee assignment

3. **Submission fails**
   - Check internet connection
   - Verify all required fields are completed
   - Check Airtable API key is valid

## Future Enhancements

1. **Photo Upload**: Direct photo attachment for damage reports
2. **Offline Mode**: Cache checklists for completion without internet
3. **Signature Capture**: Digital signatures for accountability
4. **Auto-save**: Save progress as staff complete checklist
5. **Historical View**: Access past completed checklists 

## Database Schema

### Tables Used
1. **Bookings Dashboard** - Main booking records
2. **Pre-Departure Checklist** - Safety checks before customer boards
3. **Post-Departure Checklist** - Vessel inspection after customer leaves
4. **Employee Details** - Staff records with email mapping
5. **Boats** - Vessel information

### Key Relationships
- Employee lookup by email (Supabase → Airtable)
- Onboarding Employee field links to pre-departure
- Deloading Employee field links to post-departure
- Bookings filtered by Status = "PAID"
- Staff assigned 1-2 weeks in advance

## Technical Notes

### Employee Assignment Query Fix
The Onboarding Employee and Deloading Employee fields in Airtable can contain:
- Single employee ID: `recdInFO4p3ennWpe`
- Multiple employee IDs: `recsYdiaQMt0CTduT,rec84sGwE55HsiQAS`

To handle both cases, we use the `SEARCH()` function with string concatenation in Airtable formulas:
```javascript
// Instead of exact match:
filterByFormula=AND({Status}='PAID',{Onboarding Employee}='${employeeRecordId}')

// We concatenate the linked field with an empty string to make it searchable:
filterByFormula=AND({Status}='PAID',SEARCH('${employeeRecordId}',{Onboarding Employee}&''))
```

The concatenation with an empty string (`&''`) is necessary because linked record fields in Airtable are stored as arrays, and the `SEARCH()` function needs a string to search in. This approach converts the array to a searchable format, ensuring that employees can see their assignments whether they're the sole assignee or part of a group assignment. 