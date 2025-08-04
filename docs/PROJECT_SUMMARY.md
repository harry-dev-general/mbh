# MBH Staff Portal Project Summary

## Project Overview
Development of a web application for Manly Boat Hire (MBH) staff to manage bookings, submit availability, and complete vessel checklists. The system integrates with existing Airtable databases while providing a more user-friendly interface for staff operations.

## Current Architecture

### Backend Systems
1. **Airtable Bases**:
   - **MBH Bookings Operation** (ID: `applkAFOn2qxtu7tx`)
     - Bookings Dashboard - Customer bookings management
     - Roster - Staff weekly availability display
     - Pre-Departure Checklist - Safety checks before trips
     - Post-Departure Checklist - Vessel condition after trips
     - Vessel Usage Tracking - Links checklists to bookings and vessels
     
   - **Vessel Maintenance** (ID: `appjgJmfEkisWbUKh`)
     - Boats table (synced to MBH Bookings Operation)
     - Maintenance tracking and vessel information

2. **Supabase Database** (Project ID: `etkugeooigiwahikrmzr`)
   - Authentication and user management
   - Staff profiles linking to Airtable employees
   - Data caching for performance
   - Checklist templates and completion tracking

### Key Relationships
- Customer bookings → Assigned vessel → Staff assignments (onboarding/deloading)
- Staff availability submissions → Roster display → Booking assignments
- Pre/Post departure checklists → Vessel usage tracking → Maintenance insights

## Completed Work

### 1. Database Schema Setup
Created comprehensive Supabase tables:
- `staff_profiles` - Links Supabase auth users with Airtable Employee IDs
- `availability_cache` - Stores weekly availability submissions
- `booking_cache` - Caches booking assignments for quick access
- `checklist_templates` - Pre/post departure checklist items
- `completed_checklists` - Stores completed checklist data
- `app_settings` - Configuration settings
- `sync_logs` - Tracks Airtable synchronization

### 2. Security Implementation
- Row Level Security (RLS) enabled on all user-facing tables
- Role-based access control (staff, manager, admin)
- Secure authentication flow design

### 3. Training UI Foundation
Existing training portal includes:
- Interactive vessel locations map
- Quick reference guides
- Pre-departure procedures
- Safety protocols
- Emergency procedures

## Next Steps

### Phase 1: Authentication & User Management
1. Implement Supabase authentication (email/password)
2. Create staff registration/login flows
3. Link Supabase users to Airtable Employee records
4. Build role-based access control

### Phase 2: Core Features
1. **Availability Submission**
   - Replace Airtable form with native web interface
   - Calendar view for selecting available days/times
   - Real-time sync to Airtable
   
2. **Staff Dashboard**
   - Today's assigned bookings
   - Vessel assignments
   - Quick access to checklists
   - Weekly schedule view

3. **Checklist Management**
   - Digital pre-departure checklist
   - Digital post-departure checklist
   - Photo upload for issues
   - Real-time sync to Airtable

### Phase 3: Advanced Features
1. Push notifications for booking assignments
2. Offline capability with sync
3. Weather integration
4. Vessel location tracking
5. Emergency contact quick access

## Technical Stack
- **Frontend**: React/Next.js (to be implemented)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Integration**: Airtable API for data sync
- **Hosting**: TBD (Vercel recommended)

## Environment Variables Needed
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[TO BE PROVIDED]
SUPABASE_SERVICE_ROLE_KEY=[TO BE PROVIDED]

# Airtable
AIRTABLE_API_KEY=[TO BE PROVIDED]
AIRTABLE_BASE_ID_BOOKINGS=applkAFOn2qxtu7tx
AIRTABLE_BASE_ID_MAINTENANCE=appjgJmfEkisWbUKh
```

## Key Design Decisions
1. **Hybrid Architecture**: Use Airtable as source of truth with Supabase caching for performance
2. **Progressive Enhancement**: Start with core features, add advanced features iteratively
3. **Mobile-First**: Design for staff using phones on boats
4. **Offline Support**: Critical features work offline with sync when connected

## Integration Points
1. **Airtable → Supabase**: Scheduled sync of bookings, roster, and vessel data
2. **Supabase → Airtable**: Real-time push of availability submissions and checklist completions
3. **Authentication**: Supabase Auth linked to Airtable Employee records
4. **Availability Processing**: Web app submissions include auto-generated Submission IDs compatible with Airtable automations

## Success Metrics
- Reduced time to submit availability (target: < 2 minutes)
- Increased checklist completion rate (target: 100%)
- Faster booking assignment visibility (target: real-time)
- Reduced training time for new staff (target: 50% reduction)

## Contact Information
- Project Lead: [TO BE FILLED]
- Technical Lead: [TO BE FILLED]
- Airtable Admin: [TO BE FILLED]

---
*Last Updated: [Current Date]*
*Version: 1.0* 