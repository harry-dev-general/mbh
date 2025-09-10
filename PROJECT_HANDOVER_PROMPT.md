# MBH Staff Portal - Project Handover Prompt

## Project Overview
I need help continuing development on the MBH Staff Portal, a web-based management system for a boat hire business. The portal manages staff allocations, vessel maintenance, bookings, and SMS notifications.

## Core Technologies
- **Frontend**: HTML5, JavaScript (vanilla), CSS
- **Backend**: Node.js/Express (deployed on Railway)
- **Database**: Airtable (primary), Supabase (authentication)
- **SMS**: Twilio (via Airtable automations)
- **Deployment**: Railway.app (production URL: https://mbh-production-f0d1.up.railway.app)

## Key Documentation to Review First

### 1. System Architecture & Recent Updates
- `/mbh-staff-portal/docs/VESSEL_MAINTENANCE_SYSTEM_COMPREHENSIVE_ANALYSIS.md` - Complete system overview
- `/mbh-staff-portal/docs/MANAGEMENT_DASHBOARD_UI_UPDATES.md` - Latest UI changes
- `/mbh-staff-portal/docs/SHIFT_RESPONSE_FIX_SUMMARY.md` - Critical shift response system fix
- `/mbh-staff-portal/docs/BOOKING_ALLOCATION_COMPLETE_FIX.md` - Latest booking allocation fixes

### 2. Feature Implementation Guides
- `/mbh-staff-portal/docs/CHECKLIST_LINKS_DEPLOYMENT_SUMMARY.md` - Vessel checklist integration
- `/mbh-staff-portal/docs/BOAT_SELECTION_IMPLEMENTATION.md` - Boat allocation feature
- `/mbh-staff-portal/docs/BOAT_TYPE_FILTERING_IMPLEMENTATION.md` - Dynamic boat filtering
- `/mbh-staff-portal/docs/VESSEL_MAINTENANCE_DASHBOARD_PROPOSAL.md` - Vessel maintenance system

### 3. API Documentation
- `/mbh-staff-portal/api/vessel-status.js` - Vessel maintenance status API
- `/mbh-staff-portal/api/shift-response-handler.js` - Shift response magic link handler
- `/mbh-staff-portal/api/routes/vessel-maintenance.js` - Vessel maintenance endpoints

## Airtable Structure
**Base ID**: `applkAFOn2qxtu7tx`

### Key Tables:
1. **Bookings Dashboard** (`tblRe0cDmK3bG2kPf`)
   - Customer bookings with staff allocations
   - Fields: Customer Name, Booking Date, Onboarding/Deloading Employee, Boat, Booked Boat Type

2. **Staff/Employees** (`tbltAE4NlNePvnkpY`)
   - Staff records with phone numbers for SMS

3. **Boats** (`tblNLoBNb4daWzjob`)
   - Vessel inventory with types

4. **Pre-Departure Checklist** (`tbl9igu5g1bPG4Ahu`)
   - Safety checks before customer boards

5. **Post-Departure Checklist** (`tblYkbSQGP6zveYNi`)
   - Vessel status after customer departs

6. **Shift Allocations** (`tbl22YKtQXZtDFtEX`)
   - General shift assignments (non-booking)

7. **Roster** (`tblwwK1jWGxnfuzAN`)
   - Staff availability schedule

## Critical Configuration
```javascript
// Supabase (Authentication)
SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU'

// Airtable
AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14'
BASE_ID = 'applkAFOn2qxtu7tx'
```

## Key Frontend Pages
1. `/training/management-allocations.html` - Main management dashboard
2. `/training/management-dashboard.html` - Overview with vessel maintenance tab
3. `/training/my-schedule.html` - Staff view of allocations
4. `/training/pre-departure-checklist.html` - Pre-departure vessel checks
5. `/training/post-departure-checklist.html` - Post-departure vessel checks

## Recent Work Completed (September 2025)
1. ✅ Fixed duplicate booking creation from webhooks
2. ✅ Implemented vessel maintenance dashboard
3. ✅ Added direct checklist links from staff schedules
4. ✅ Enabled boat allocation for managers
5. ✅ Implemented boat type filtering based on bookings
6. ✅ Fixed shift response system (magic links)
7. ✅ Redesigned booking allocation modal
8. ✅ Fixed booking allocation save/display issues

## Current System Flow
1. **Bookings** come from Checkfront via webhook → Airtable
2. **Managers** allocate staff/boats via management-allocations.html
3. **SMS notifications** sent via Airtable automations when staff assigned
4. **Staff** respond to shifts via magic links or my-schedule page
5. **Vessel checks** completed via checklist pages
6. **Vessel status** tracked via maintenance dashboard

## Important Patterns & Conventions
1. **Date Handling**: Use Sydney timezone (GMT+1000) for all dates
2. **Authentication**: Check Supabase auth on all protected pages
3. **API Calls**: Use retry logic for Airtable API resilience
4. **Field References**: Always use exact Airtable field names (case-sensitive)
5. **SMS**: Handled by Airtable automations, not client-side code

## Known Issues & Considerations
1. SMS may not send for past bookings (automation rules)
2. Roster records may have undefined "Week Starting" field
3. Some formula fields in Airtable are read-only
4. Browser caching can cause issues - always clear cache when testing

## Testing Accounts
- Use "Test Staff" (recU2yfUOIGFsIuZV) for testing allocations
- Phone: +61414960734 receives test SMS

## Git Repository
- **Repo**: https://github.com/harry-dev-general/mbh.git
- **Branch**: main
- **Deploy**: Pushes to main auto-deploy via Railway

## Next Potential Features
1. Historical vessel maintenance charts
2. Staff performance metrics
3. Automated booking confirmations
4. Revenue reporting dashboard
5. Mobile app version

## How to Get Started
1. Review the documentation files listed above
2. Check the current deployment at https://mbh-production-f0d1.up.railway.app
3. Examine the Airtable base structure
4. Test the booking allocation flow
5. Review recent commits for context

Please let me know what specific area you'd like to work on, and I'll provide more detailed guidance!
