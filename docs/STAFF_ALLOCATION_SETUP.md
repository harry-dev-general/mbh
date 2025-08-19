# Staff Allocation System Setup Guide

## Overview
The Staff Allocation System allows management to schedule staff for hourly work and assign them to specific bookings. Staff can view their allocated shifts through the portal.

## System Architecture

```
┌──────────────────────────────────────────┐
│     Management Allocation Dashboard       │
│  (management-allocations.html)           │
└────────────────┬─────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Shift Allocations│
        │   (Airtable)     │
        └────────┬─────────┘
                 │
     ┌───────────┴────────────┐
     ▼                        ▼
┌──────────────┐    ┌──────────────────┐
│ Staff Schedule│   │ Bookings Dashboard│
│  (my-schedule)│   │    (Airtable)      │
└───────────────┘   └──────────────────┘
```

## 1. Create Shift Allocations Table in Airtable

### Step 1: Navigate to Your Base
1. Open Airtable and go to **MBH Bookings Operation** base
2. Click on the **+** button to add a new table
3. Name it **"Shift Allocations"**

### Step 2: Create Fields

Add the following fields to your new table:

#### Primary Fields
1. **Shift ID** (Formula)
   - Type: Formula
   - Formula: `CONCATENATE(DATETIME_FORMAT({Shift Date}, "YYYY-MM-DD"), "-", {Employee}, "-", {Start Time})`
   - Purpose: Unique identifier for each shift

2. **Employee** (Link to Another Record)
   - Type: Link to another record
   - Link to: Employee Details table
   - Allow linking to multiple records: No

3. **Shift Date** (Date)
   - Type: Date
   - Date format: Local
   - Include time: No

4. **Start Time** (Single Line Text)
   - Type: Single line text
   - Format example: "09:00"

5. **End Time** (Single Line Text)
   - Type: Single line text
   - Format example: "17:00"

6. **Duration (Hours)** (Formula)
   - Type: Formula
   - Formula: 
   ```
   IF(
     AND({Start Time}, {End Time}),
     (VALUE(LEFT({End Time}, 2)) - VALUE(LEFT({Start Time}, 2))) + 
     ((VALUE(RIGHT({End Time}, 2)) - VALUE(RIGHT({Start Time}, 2))) / 60),
     0
   )
   ```

7. **Shift Type** (Single Select)
   - Type: Single select
   - Options:
     - General Operations (Blue)
     - Booking Specific (Orange)
     - Maintenance (Green)
     - Training (Purple)
     - Admin (Gray)

8. **Status** (Single Select)
   - Type: Single select
   - Options:
     - Scheduled (Blue)
     - In Progress (Yellow)
     - Completed (Green)
     - Cancelled (Red)
     - No Show (Gray)

#### Booking-Related Fields
9. **Booking** (Link to Another Record)
   - Type: Link to another record
   - Link to: Bookings Dashboard table
   - Allow linking to multiple records: No

10. **Role** (Single Select)
    - Type: Single select
    - Options:
      - Onboarding
      - Deloading
      - Support Staff
      - Dock Operations
      - Customer Service
      - Vessel Maintenance

11. **Customer Name** (Lookup)
    - Type: Lookup
    - Lookup field from: Booking
    - Field to lookup: Customer Name

#### Additional Fields
12. **Notes** (Long Text)
    - Type: Long text
    - Enable rich text: Yes

13. **Check-in Time** (Date/Time)
    - Type: Date
    - Include time: Yes
    - Time format: 24-hour

14. **Check-out Time** (Date/Time)
    - Type: Date
    - Include time: Yes
    - Time format: 24-hour

15. **Actual Hours Worked** (Formula)
    - Type: Formula
    - Formula:
    ```
    IF(
      AND({Check-in Time}, {Check-out Time}),
      DATETIME_DIFF({Check-out Time}, {Check-in Time}, 'hours'),
      0
    )
    ```

16. **Created By** (Created By)
    - Type: Created by
    - Automatically tracks who created the record

17. **Created Time** (Created Time)
    - Type: Created time
    - Automatically tracks when record was created

18. **Last Modified** (Last Modified Time)
    - Type: Last modified time
    - Automatically tracks last update

### Step 3: Create Views

Create the following views for different purposes:

#### 1. **Today's Allocations** (Grid View)
- Filter: `IS_SAME({Shift Date}, TODAY(), 'day')`
- Sort: Start Time (Ascending)
- Group by: Shift Type

#### 2. **This Week** (Calendar View)
- Calendar by: Shift Date
- Color by: Shift Type
- Display: Employee name and times

#### 3. **By Employee** (Grid View)
- Group by: Employee
- Sort: Shift Date (Ascending), Start Time (Ascending)

#### 4. **Booking Assignments** (Grid View)
- Filter: `{Shift Type} = "Booking Specific"`
- Group by: Booking
- Show: Employee, Role, Status

#### 5. **Pending Check-ins** (Grid View)
- Filter: `AND({Status} = "Scheduled", IS_BEFORE({Shift Date}, TODAY()))`
- Sort: Shift Date (Descending)

## 2. Update Table IDs in Code

After creating the table, you need to update the table ID in your code:

1. Get the new table ID:
   - In Airtable, click on the **Shift Allocations** table
   - Look at the URL: `https://airtable.com/BASE_ID/TABLE_ID/VIEW_ID`
   - Copy the TABLE_ID portion

2. Update in `management-allocations.html`:
   ```javascript
   const ALLOCATIONS_TABLE_ID = 'YOUR_NEW_TABLE_ID_HERE';
   ```

3. Update in `my-schedule.html`:
   ```javascript
   const ALLOCATIONS_TABLE_ID = 'YOUR_NEW_TABLE_ID_HERE';
   ```

## 3. Set Up Automations (Optional)

### Automation 1: Send Shift Reminder
**Trigger**: When a record matches conditions
- Condition: Status is "Scheduled" AND Shift Date is tomorrow

**Action**: Send email
- To: Employee email (from linked Employee record)
- Subject: "Reminder: Your shift tomorrow"
- Message: Include shift details

### Automation 2: Update Booking Staff
**Trigger**: When a record is created
- Condition: Shift Type is "Booking Specific"

**Action**: Update record (in Bookings Dashboard)
- Record: Linked Booking
- Update: Set Onboarding/Deloading Employee based on Role

### Automation 3: Mark Overdue Shifts
**Trigger**: At scheduled time (daily at midnight)
- Find records where: Status is "Scheduled" AND Shift Date is before today

**Action**: Update record
- Update Status to: "No Show" (if no check-in time)

## 4. Integration with Existing System

### Linking to Roster Data
The system reads from the existing Roster table to show staff availability:
- Management sees available staff when creating allocations
- System can prevent double-booking (with additional validation)

### Linking to Bookings
When allocating staff to bookings:
1. Select "Booking Specific" as Shift Type
2. Choose the Booking from dropdown
3. Select Role (Onboarding/Deloading)
4. System automatically pulls customer information

## 5. User Access Levels

### Management Access
- Full access to `management-allocations.html`
- Can create, edit, delete allocations
- View all staff schedules
- Access reports and analytics

### Staff Access
- Read-only access to `my-schedule.html`
- View only their own allocations
- Cannot modify schedules
- Can view booking details for their shifts

## 6. Testing the System

### Test Checklist
- [ ] Create test allocations for different shift types
- [ ] Verify staff can see their schedules
- [ ] Test booking-specific allocations
- [ ] Check time calculations are correct
- [ ] Verify filtering and sorting work
- [ ] Test on mobile devices
- [ ] Confirm email notifications (if set up)

## 7. Deployment Notes

### Environment Variables
No additional environment variables needed - uses existing Airtable API configuration.

### Security Considerations
1. API key is already proxied through your Railway server
2. Staff can only see their own data
3. Management features are email-restricted

### Performance Tips
1. Limit date ranges when loading allocations
2. Use pagination for large datasets
3. Cache employee data where possible
4. Consider implementing real-time updates with webhooks

## 8. Common Issues & Solutions

### Issue: Staff can't see their schedule
**Solution**: Ensure their email in Supabase matches their email in Airtable Employee Details table

### Issue: Allocations not saving
**Solution**: Check that all required fields are populated and table permissions are set correctly

### Issue: Time calculations incorrect
**Solution**: Ensure time format is consistent (HH:MM in 24-hour format)

## 9. Future Enhancements

Consider adding:
1. **Shift Templates**: Common shift patterns that can be quickly applied
2. **Bulk Allocation**: Assign multiple staff at once
3. **Conflict Detection**: Warn when staff is double-booked
4. **Time Clock Integration**: Staff can clock in/out from the app
5. **Payroll Export**: Generate reports for payroll processing
6. **Mobile App**: Native mobile app for easier access
7. **Push Notifications**: Real-time alerts for schedule changes

## Support

For issues or questions:
1. Check the Airtable API documentation
2. Review error logs in browser console
3. Verify all table IDs are correct
4. Ensure API key has proper permissions

---

Last Updated: January 2025
Version: 1.0
