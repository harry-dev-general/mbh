# MBH Staff Portal - Handoff Notes

## Quick Context
You're continuing development of a web app for Manly Boat Hire (MBH) staff. The app integrates with existing Airtable databases to manage boat bookings, staff availability, and vessel safety checklists.

## What's Been Done
1. **Database Setup**: Supabase tables created with proper security (RLS)
2. **Project Organization**: Clean folder structure in `/mbh-staff-portal/`
3. **Documentation**: Comprehensive docs in the `/docs/` folder
4. **Training UI**: Existing HTML-based training portal in `/training/`

## Key Information
- **Supabase Project ID**: `etkugeooigiwahikrmzr`
- **Airtable Base IDs**:
  - MBH Bookings Operation: `applkAFOn2qxtu7tx`
  - Vessel Maintenance: `appjgJmfEkisWbUKh`

## Next Priority Tasks

### 1. Authentication Implementation
```typescript
// Link Supabase users to Airtable employees
// Key table: staff_profiles
// Must match on airtable_employee_id
```

### 2. Availability Submission Interface
- Replace Airtable form with web UI
- Weekly calendar view
- Sync submissions to Airtable's "Weekly Availability Submissions" table

### 3. Staff Dashboard
- Show today's bookings with vessel assignments
- Display as onboarding/deloading staff
- Quick access to checklists

## Technical Approach
1. **Use Supabase for auth and caching** - Don't hit Airtable API directly from frontend
2. **Sync pattern**: Frontend → Supabase → Background sync → Airtable
3. **Mobile-first design** - Staff use phones on boats
4. **Offline capability** - Critical for reliability on water

## Important Relationships
```
Booking → Vessel → Staff (Onboarding/Deloading)
Staff → Availability Submission → Roster → Booking Assignment
Booking → Pre-Departure Checklist → Vessel Usage → Post-Departure Checklist
```

## File Locations
- **Database Schema**: `/database/migrations/001_create_mbh_staff_tables.sql`
- **Airtable Structure**: `/docs/AIRTABLE_STRUCTURE.md`
- **Project Overview**: `/docs/PROJECT_SUMMARY.md`
- **Training UI**: `/training/` (can reuse components/styling)

## Development Tips
1. Start with authentication - it's the foundation
2. Use the training UI's styling for consistency
3. Test with real Airtable data early
4. Consider API rate limits (5 requests/second for Airtable)
5. The Boats table is synced FROM Vessel Maintenance TO MBH Bookings

## Questions to Resolve
- Airtable API key location/security
- Deployment target (Vercel recommended)
- Push notification service choice
- Offline sync strategy details

Good luck! The foundation is solid - focus on connecting the pieces. 