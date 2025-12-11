# MBH Staff Portal Documentation

Welcome to the MBH Staff Portal documentation. This documentation is organized for easy navigation and AI-assisted development.

## 📚 Documentation Structure

### 🏠 [00-overview/](00-overview/)
- Project overview and AI onboarding guides
- Quick start documentation
- Architecture overview
- AI continuation prompts

### 🔧 [01-setup/](01-setup/)
- Environment setup and configuration
- Authentication setup
- Deployment guides
- API keys and security

### ✨ [02-features/](02-features/)
- **[allocations/](02-features/allocations/)** - Staff allocation system
- **[announcements/](02-features/announcements/)** - Announcement system
- **[bookings/](02-features/bookings/)** - Booking management
- **[calendar/](02-features/calendar/)** - Calendar views and add-on indicators
- **[checklists/](02-features/checklists/)** - Vessel checklists
- **[checkfront-webhook/](02-features/checkfront-webhook/)** - Booking webhook integration
- **[daily-run-sheet/](02-features/daily-run-sheet/)** - Daily operations view
- **[dashboard/](02-features/dashboard/)** - Staff dashboard
- **[dashboard-overview/](02-features/dashboard-overview/)** - Management dashboard
- **[employee-management/](02-features/employee-management/)** - Staff management
- **[fleet-map/](02-features/fleet-map/)** - Fleet tracking map
- **[ice-cream-sales/](02-features/ice-cream-sales/)** - Ice cream sales tracking
- **[management-dashboard/](02-features/management-dashboard/)** - Management UI
- **[sms/](02-features/sms/)** - SMS notification system
- **[vessel-maintenance/](02-features/vessel-maintenance/)** - Vessel management
- **[vessel-tracking/](02-features/vessel-tracking/)** - Location tracking

### 🔌 [03-integrations/](03-integrations/)
- **[airtable/](03-integrations/airtable/)** - Airtable database integration
- **[checkfront/](03-integrations/checkfront/)** - Booking system integration
- **[square/](03-integrations/square/)** - Payment processing
- **[supabase/](03-integrations/supabase/)** - Authentication

### 🔨 [04-technical/](04-technical/)
- API references
- Database schemas
- Technical architecture
- Platform requirements

### 🐛 [05-troubleshooting/](05-troubleshooting/)
- Common issues and solutions
- Debugging guides
- Error references
- Date handling issues

### 💻 [06-development/](06-development/)
- Coding standards
- Git workflow
- Testing guides
- Technical learnings

### 🤝 [07-handover/](07-handover/)
- Project handover documentation
- Session summaries
- Implementation notes
- LLM handoff prompts

### 🗄️ [99-archive/](99-archive/)
- Deprecated documentation
- Old implementation notes
- Historical references

## 🚀 Quick Start

1. **For AI Assistants**: Start with [`00-overview/AI_ONBOARDING_PROMPT.md`](00-overview/AI_ONBOARDING_PROMPT.md)
2. **For Developers**: Begin with [`00-overview/PROJECT_SUMMARY.md`](00-overview/PROJECT_SUMMARY.md)
3. **For Setup**: Follow [`01-setup/ENVIRONMENT_VARIABLES_SETUP.md`](01-setup/ENVIRONMENT_VARIABLES_SETUP.md)

## 📅 Current Context

- **Date**: December 2025
- **Latest Features**: 
  - Checkfront-Airtable automatic reconciliation system
  - Webhook reliability improvements with audit logging
  - Admin API endpoints for system monitoring
  - Square integration for ice cream sales
  - Performance optimizations
  - Add-on indicators on calendars
  - Phone number capture from webhooks

## 🔑 Key Technologies

- **Frontend**: Vanilla HTML/JS/CSS (no frameworks)
- **Backend**: Node.js/Express.js
- **Database**: Airtable
- **Auth**: Supabase
- **Deployment**: Railway

## 📞 Important Links

- **Production**: https://mbh-production-f0d1.up.railway.app
- **Airtable Base**: applkAFOn2qxtu7tx
- **Management Dashboard**: /training/management-dashboard.html

## ⚠️ Critical Rules

1. **NO FRAMEWORKS** - Vanilla HTML/JS/CSS only
2. **PRODUCTION SYSTEM** - Real business with active bookings
3. **SYDNEY TIMEZONE** - All dates in Australia/Sydney
4. **API PROXY** - All Airtable calls via `/api/airtable/*`

---

*Documentation last updated: December 11, 2025*