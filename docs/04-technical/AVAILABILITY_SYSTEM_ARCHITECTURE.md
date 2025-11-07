# Availability System Architecture
**Last Updated**: November 7, 2025  
**Components**: availability.html, SMS automation, Roster automation, management-allocations.html

## System Overview

The MBH Staff Portal availability system allows casual staff to submit their weekly availability, which is then processed and made visible to management for shift allocation.

## Data Flow

```
1. SMS Reminder (Sunday 10am)
       ↓
2. availability.html?week=YYYY-MM-DD
       ↓
3. Weekly Availability Submissions table
       ↓
4. Roster Automation (creates individual day records)
       ↓
5. Roster table
       ↓
6. management-allocations.html (displays available staff)
```

## Component Details

### 1. SMS Automation (Airtable)
- **Trigger**: Weekly schedule (Sunday 10:00am AEDT)
- **Targets**: Active roster casual staff with mobile numbers
- **Message**: Personalized link to availability.html with week parameter
- **Script Variables**:
  - `employeeName`: From Employee Details
  - `employeeId`: Airtable record ID
  - `employeeEmail`: For login reminder

### 2. availability.html
- **Authentication**: Supabase Auth (email/password)
- **Employee Matching**: Email lookup in Employee Details table
- **Input Format**: HTML5 time inputs (24-hour format)
- **Output Format**: "H:MM AM/PM" via formatTime() function
- **Submission**: POST to `/api/airtable/{BASE_ID}/{TABLE_ID}`
- **URL Parameters**: `?week=YYYY-MM-DD` pre-selects week

### 3. Weekly Availability Submissions Table
**Table ID**: `tblcBoyuVsbB1dt1I`

**Fields**:
- `Submission ID`: "WK{date}-{employeeCode}"
- `Employee`: Linked to Employee Details
- `Week Starting`: Date field
- `[Day] Available`: Checkbox for each day
- `[Day] From/Until`: Text fields (format: "9:00 AM")
- `Processing Status`: Pending/Processed/Error
- `Additional Notes`: Text field

### 4. Roster Automation Script
**Trigger**: When record created in Weekly Availability Submissions
**Input Config**:
- `submissionRecordId`
- `employeeId` 
- `weekStarting`

**Process**:
1. Reads submission record
2. For each available day:
   - Calculates actual date
   - Parses time strings (expects "H:MM AM/PM")
   - Converts to UTC datetime
   - Creates Roster record

**Timezone Handling**:
- Configured for UTC+10 (Brisbane/Sydney)
- Converts local times to UTC for storage

### 5. Roster Table
**Table ID**: `tblwwK1jWGxnfuzAN`

**Fields**:
- `Employee`: Link to Employee Details
- `Date`: Specific date (YYYY-MM-DD)
- `Week Starting`: Week identifier
- `Available From/Until`: DateTime fields (UTC)
- `Availability Status`: Active/Cancelled/Modified
- `Notes`: From submission

### 6. management-allocations.html
**Data Sources**:
- Employee Details (all active staff)
- Roster table (filtered by current week)
- Does NOT read from Weekly Availability Submissions

**Display Logic**:
- Groups roster records by employee
- Shows "X days available" in sidebar
- Only displays staff with roster records for the week

## Critical Dependencies

1. **Roster automation is REQUIRED**: Without it, management-allocations.html shows no available staff
2. **Email matching**: Staff must log in with same email as Employee Details record
3. **Time format consistency**: availability.html must output "H:MM AM/PM" format
4. **Weekly processing**: Each week requires new submissions

## Configuration

### Environment Variables
- `AIRTABLE_API_KEY`: For API proxy
- `AIRTABLE_BASE_ID`: Default `applkAFOn2qxtu7tx`
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: For authentication

### Hardcoded Values
- Timezone offset: 10 hours (in roster automation)
- Default times: 6:00 AM - 10:00 PM (when not specified)
- Week starts: Monday

## Security Considerations

1. All Airtable API calls go through `/api/airtable/*` proxy
2. Authentication required for availability.html access
3. Role checking prevents unauthorized access to management views
4. API keys never exposed to client-side code
