# Documentation Migration Checklist

## Overview
This checklist provides step-by-step instructions for migrating misplaced MBH Staff Portal documentation to the proper organized structure.

## Files to Migrate

### From `/kursol-projects/` (Root Folder)

#### Airtable Documentation (23 files)
- [ ] AIRTABLE_BOOKING_DEDUPLICATION_GUIDE.md → `/docs/03-integrations/airtable/automations/booking-deduplication-guide.md`
- [ ] AIRTABLE_MAKE_WEBHOOK_SETUP.md → `/docs/03-integrations/airtable/webhook-setup.md`
- [ ] AIRTABLE_NEGATIVE_TRANSACTION_CATEGORIZATION_GUIDE.md → `/docs/03-integrations/airtable/automations/transaction-categorization.md`
- [ ] AIRTABLE_REMINDER_AUTOMATION_SETUP.md → `/docs/03-integrations/airtable/automations/reminder-automation.md`
- [ ] AIRTABLE_REMINDER_SYSTEM_GUIDE.md → `/docs/03-integrations/airtable/automations/reminder-system-guide.md`
- [ ] AIRTABLE_ROSTER_AUTOMATION_TIME_FIX_GUIDE.md → `/docs/03-integrations/airtable/automations/roster-time-fix.md`
- [ ] AIRTABLE_SMS_DEDUP_MIGRATION_PLAN.md → `/docs/03-integrations/airtable/sms-deduplication-plan.md`
- [ ] AIRTABLE_SMS_DEDUPLICATION_INTEGRATION_GUIDE.md → `/docs/03-integrations/airtable/sms-deduplication-guide.md`
- [ ] AIRTABLE_WEEKLY_AVAILABILITY_FINAL_GUIDE.md → `/docs/03-integrations/airtable/automations/weekly-availability-final.md`
- [ ] AIRTABLE_WEEKLY_AVAILABILITY_FIX_GUIDE.md → `/docs/03-integrations/airtable/automations/weekly-availability-fix.md`

#### Other MBH Documentation
- [ ] BOOKING_STATUS_VALUES_SUMMARY.md → `/docs/02-features/bookings/status-values-reference.md`
- [ ] sms-automation-final-guide.md → `/docs/02-features/sms/automation-guide.md`
- [ ] ROSTER_AUTOMATION_TIME_PARSING_FIX.md → `/docs/03-integrations/airtable/automations/roster-time-parsing-fix.md`
- [ ] TRANSACTION_CATEGORIZATION_SETUP_GUIDE.md → `/docs/03-integrations/airtable/automations/transaction-categorization-setup.md`
- [ ] WEBHOOK_SMS_DEDUP_INTEGRATION.md → `/docs/03-integrations/webhook-sms-integration.md`

#### Airtable Scripts (Keep in root but document)
- [ ] Document these scripts in `/docs/03-integrations/airtable/automation-scripts/README.md`:
  - airtable-availability-reminder-automation.js
  - airtable-booking-deduplication-automation.js
  - airtable-booking-deduplication-enhanced.js
  - airtable-booking-duplicate-cleanup.js
  - airtable-booking-sms-smart-notification.js
  - airtable-categorize-negative-transactions.js
  - airtable-reminder-automation-final.js
  - airtable-reminder-debug.js
  - airtable-reminder-test-script.js
  - airtable-roster-automation-complete.js
  - airtable-roster-timezone-fix.js
  - airtable-transaction-automation-*.js
  - airtable-webhook-sms-enhanced.js
  - airtable-weekly-availability-automation-*.js

### From `/mbh-staff-portal/` (Project Root)

#### Setup & Deployment
- [ ] PROJECT_HANDOVER_PROMPT.md → `/docs/07-handover/project-handover-august-2025.md`
- [ ] DEPLOYMENT_GUIDE.md → `/docs/01-setup/deployment-guide.md`
- [ ] DEPLOYMENT_README.md → `/docs/01-setup/deployment-readme.md`
- [ ] URGENT_GOOGLE_MAPS_ACTION_REQUIRED.md → `/docs/05-troubleshooting/google-maps-api-urgent.md`

#### Feature Documentation
- [ ] BOOKING_DUPLICATE_SOLUTION.md → `/docs/02-features/bookings/duplicate-solution.md`
- [ ] SMS_SCRIPT_INPUT_MAPPING.md → `/docs/02-features/sms/script-input-mapping.md`
- [ ] AIRTABLE_ANNOUNCEMENTS_TABLE_SETUP.md → `/docs/03-integrations/airtable/announcements-table-setup.md`
- [ ] AIRTABLE_AUTOMATION_UPDATE_GUIDE.md → `/docs/03-integrations/airtable/automation-update-guide.md`

## New Folder Structure to Create

```bash
# Create the new folder structure
mkdir -p docs/00-overview
mkdir -p docs/01-setup
mkdir -p docs/02-features/{allocations,announcements,bookings,checklists,sms}
mkdir -p docs/03-integrations/{airtable/{automations,automation-scripts},supabase,twilio}
mkdir -p docs/04-technical
mkdir -p docs/05-troubleshooting
mkdir -p docs/06-development
mkdir -p docs/07-handover/session-summaries
mkdir -p docs/99-archive/deprecated
```

## Index Files to Create

### Main Index
- [ ] Create `/docs/README.md` with full documentation index
- [ ] Create `/docs/00-overview/README.md` with project overview

### Category Indexes
- [ ] `/docs/01-setup/README.md` - Setup and deployment guides
- [ ] `/docs/02-features/README.md` - Feature documentation index
- [ ] `/docs/03-integrations/README.md` - Integration guides index
- [ ] `/docs/03-integrations/airtable/README.md` - Airtable documentation index
- [ ] `/docs/03-integrations/airtable/automations/README.md` - Automation scripts index

## Consolidation Tasks

### SMS Documentation
Merge these files into `/docs/02-features/sms/comprehensive-guide.md`:
- [ ] SMS_IMPLEMENTATION_FIXED.md
- [ ] SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md
- [ ] SMS_NOTIFICATION_IMPLEMENTATION_SUMMARY.md
- [ ] SMS_NOTIFICATION_LESSONS_LEARNED.md
- [ ] sms-automation-final-guide.md
- [ ] SMS_BOOKING_ALLOCATION_TROUBLESHOOTING.md

### Booking Allocation Documentation
Merge these files into `/docs/02-features/allocations/allocation-guide.md`:
- [ ] BOOKING_ALLOCATION_FIX.md
- [ ] BOOKING_ALLOCATION_FIX_2025.md
- [ ] BOOKING_ALLOCATION_COMPLETE_FIX.md
- [ ] BOOKING_ALLOCATION_DEBUG_GUIDE.md
- [ ] BOOKING_ALLOCATION_SMS_FIX.md

### Vessel Maintenance Documentation
Consolidate into `/docs/02-features/vessel-maintenance/`:
- [ ] VESSEL_MAINTENANCE_SYSTEM_COMPREHENSIVE_ANALYSIS.md
- [ ] VESSEL_MAINTENANCE_TECHNICAL_SPEC.md
- [ ] VESSEL_MAINTENANCE_PRACTICAL_SOLUTION.md
- [ ] VESSEL_MAINTENANCE_LIVE_SUMMARY.md

## Post-Migration Cleanup

### Update References
- [ ] Update all internal documentation links
- [ ] Update README.md files with new paths
- [ ] Update any code comments referencing documentation

### Create Redirects
- [ ] Create a MIGRATION_MAP.md showing old → new paths
- [ ] Leave README files in old locations pointing to new paths (temporary)

### Verify Migration
- [ ] All files moved successfully
- [ ] No broken links
- [ ] All team members notified of new structure
- [ ] Documentation is searchable and findable

## Timeline

### Day 1-2: Structure Creation
- Create folder structure
- Create index files
- Set up main README

### Day 3-4: File Migration
- Move files to new locations
- Update file names to match conventions
- Create category indexes

### Day 5-6: Consolidation
- Merge duplicate content
- Update cross-references
- Clean up old locations

### Day 7: Verification
- Test all links
- Review organization
- Get team feedback

---
*Checklist Created: September 10, 2025*
*Target Completion: September 17, 2025*
