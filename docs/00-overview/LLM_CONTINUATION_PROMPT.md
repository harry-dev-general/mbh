# MBH Staff Portal - LLM Development Continuation Prompt

## Project Context

You are working on the MBH Staff Portal, a comprehensive web-based management system for Manly Boat Hire (MBH) operations. This system handles staff allocations, vessel maintenance, bookings, and SMS notifications for a boat rental business in Sydney, Australia.

## Essential Documentation to Review

### 1. Start Here (Priority Reading)
- **Project Overview**: `/mbh-staff-portal/PROJECT_HANDOVER_PROMPT.md` - Contains API keys, table structures, and critical configuration
- **Documentation Index**: `/mbh-staff-portal/docs/README.md` - Central hub for all documentation
- **Recent Implementations**: `/mbh-staff-portal/docs/SEPTEMBER_2025_IMPLEMENTATIONS.md` - Latest features and fixes
- **Technical Reference**: `/mbh-staff-portal/docs/TECHNICAL_REFERENCE_AIRTABLE_API.md` - API patterns and examples

### 2. System Architecture
- **Infrastructure Summary**: `/mbh-staff-portal/docs/TECHNICAL_INFRASTRUCTURE_SUMMARY_2025.md`
- **Airtable Structure**: `/mbh-staff-portal/docs/AIRTABLE_STRUCTURE.md`
- **Vessel Maintenance Analysis**: `/mbh-staff-portal/docs/VESSEL_MAINTENANCE_SYSTEM_COMPREHENSIVE_ANALYSIS.md`

### 3. Recent Development Sessions
- **August 2025 Handoff**: `/mbh-staff-portal/docs/LLM_HANDOFF_AUGUST_2025.md`
- **September 2025 Work**: Check `/mbh-staff-portal/docs/SEPTEMBER_2025_IMPLEMENTATIONS.md`
- **Session Summaries**: Look in `/mbh-staff-portal/docs/` for SESSION_SUMMARY_*.md files

## Key Technical Information

### Technology Stack
- **Frontend**: Vanilla HTML/JS/CSS (intentionally simple for maintainability)
- **Backend**: Node.js/Express on Railway platform
- **Database**: Airtable (Base ID: `applkAFOn2qxtu7tx`)
- **Authentication**: Supabase
- **SMS**: Twilio API
- **Deployment**: Railway (auto-deploys from main branch)

### Critical Airtable Tables
```javascript
const BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I';  // Bookings Dashboard
const EMPLOYEE_TABLE_ID = 'tbltAE4NlNePvnkpY';   // Employee Details
const BOATS_TABLE_ID = 'tblNLoBNb4daWzjob';      // Boats
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX'; // Shift Allocations
const ANNOUNCEMENTS_TABLE_ID = 'tblDCSmGREv0tF0Rq'; // Announcements
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';     // Roster
```

### Environment Variables Required
```bash
# Check env.example for all required variables
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=xxx
PORT=8080  # For Railway
```

## Important Concepts and Patterns

### 1. Airtable Integration Pattern
- Always use axios in backend (Node.js) - fetch is not available in older Node versions
- Client-side can use fetch
- Handle rate limiting (5 req/sec)
- Always specify pageSize=100 to get all records
- Linked records must be arrays: `[recordId]`

### 2. Date/Time Handling
- System operates in Sydney timezone (AEST/AEDT)
- Always set dates to noon to avoid timezone issues
- Airtable returns various time formats ("9:00 AM", "09:00", etc.)
- Use robust parsing - see examples in codebase

### 3. Authentication Flow
- Supabase handles user auth
- Match user email to Airtable Employee record
- Management emails hardcoded in dashboard.html
- Check user type for feature access

### 4. SMS Notification System
- Twilio for sending
- Airtable automations for some triggers
- Direct API calls for immediate notifications
- Always check for "Active Roster" employees

## Common Development Tasks

### When Adding New Features
1. Review existing patterns in similar features
2. Check documentation in `/mbh-staff-portal/docs/`
3. Update relevant documentation after implementation
4. Test on both web and mobile views
5. Ensure Railway deployment works

### When Fixing Bugs
1. Check troubleshooting guides in `/mbh-staff-portal/docs/`
2. Review recent fixes for similar issues
3. Add console.log for debugging (remove after fixing)
4. Test the specific user workflow mentioned
5. Document the fix

### When Working with Airtable
1. Verify field names are exact (case-sensitive)
2. Check for formula fields (read-only)
3. Test with actual data, not assumptions
4. Use Airtable MCP tools to verify structure
5. Handle empty/null fields gracefully

## Project Structure
```
mbh-staff-portal/
├── training/          # Frontend HTML files
│   ├── dashboard.html
│   ├── management-allocations.html
│   ├── my-schedule.html
│   └── ...
├── api/              # Backend API modules
│   ├── announcements.js
│   ├── notifications.js
│   └── ...
├── docs/             # All documentation
├── server.js         # Express server
└── package.json      # Dependencies
```

## Key Features to Understand

### 1. Booking Allocations
- Managers assign staff to customer bookings
- Two phases: Onboarding (before) and Deloading (after)
- Color coding: Green = fully staffed, Red = needs staff
- SMS notifications sent on assignment

### 2. Weekly Availability
- Staff submit availability each week
- Airtable automation processes submissions
- Creates roster records for scheduling

### 3. Vessel Checklists
- Pre-departure: Safety checks before rental
- Post-departure: Condition assessment after
- Linked to bookings and vessels

### 4. Announcements System
- Management posts announcements
- Visible on staff dashboard
- Optional SMS to all active roster staff

## Development Workflow

### Git & Deployment
1. Work on main branch (small team approach)
2. Commit with clear messages
3. Push to GitHub
4. Railway auto-deploys to production

### Testing Approach
1. Test locally first
2. Clear browser cache for JS changes
3. Test on production after deploy
4. Check mobile responsiveness

## Important Warnings

### Do Not:
- Remove the axios dependency (needed for Node.js)
- Change Airtable field types (breaks integrations)
- Modify authentication without testing
- Assume data formats (always verify)

### Always:
- Check existing documentation before implementing
- Test with real Airtable data
- Handle errors gracefully
- Update documentation after changes
- Consider mobile users

## Getting Started with Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/harry-dev-general/mbh.git
   cd mbh-staff-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   - Copy env.example to .env
   - Add required API keys

4. **Start development server**
   ```bash
   npm start
   ```

5. **Review key documentation**
   - Start with PROJECT_HANDOVER_PROMPT.md
   - Check recent implementations
   - Review relevant feature docs

## Questions to Ask Yourself

Before implementing anything:
1. Has this been done before? (Check docs)
2. What's the existing pattern? (Review similar features)
3. Will this work on mobile? (Test responsive design)
4. Does this need documentation? (Usually yes)
5. Will the Airtable API handle this? (Check rate limits)

## Need More Context?

- **For specific features**: Check `/docs/02-features/[feature-name]/`
- **For integrations**: Check `/docs/03-integrations/[service-name]/`
- **For troubleshooting**: Check `/docs/05-troubleshooting/`
- **For recent changes**: Check `/docs/07-handover/session-summaries/`

## Final Notes

This is a production system actively used by MBH staff. Always:
- Test thoroughly before deploying
- Consider impact on active users
- Maintain backward compatibility
- Document significant changes

The system prioritizes simplicity and reliability over complex features. When in doubt, choose the simpler solution that works reliably.

---

*Remember: The documentation in `/mbh-staff-portal/docs/` is comprehensive. When this prompt doesn't have enough detail, the answer is likely in the documentation. Use the new organized structure to quickly find what you need.*

*Last Updated: September 15, 2025*
