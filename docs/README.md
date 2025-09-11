# MBH Staff Portal Documentation

Welcome to the MBH Staff Portal documentation. This portal is a comprehensive web-based management system for Manly Boat Hire operations, handling staff allocations, vessel maintenance, bookings, and SMS notifications.

## 🚀 Quick Start

- **New to the project?** Start with the [Project Overview](./00-overview/project-overview.md)
- **Setting up?** Check the [Deployment Guide](./01-setup/deployment-guide.md)
- **Need help?** See [Troubleshooting Guide](./05-troubleshooting/common-issues.md)

## 📚 Documentation Structure

### [00. Overview](./00-overview/)
- Project architecture and system design
- Technology stack overview
- Getting started guide

### [01. Setup & Deployment](./01-setup/)
- Environment configuration
- Deployment to Railway
- Authentication setup (Supabase)
- Database configuration

### [02. Features](./02-features/)
Core functionality documentation:
- **[Allocations](./02-features/allocations/)** - Staff allocation system
- **[Announcements](./02-features/announcements/)** - Management announcements with SMS
- **[Bookings](./02-features/bookings/)** - Booking management and deduplication
- **[Checklists](./02-features/checklists/)** - Vessel safety checklists
- **[SMS](./02-features/sms/)** - Notification system via Twilio
- **[Vessel Tracking](./02-features/vessel-tracking/)** - GPS location tracking for vessels

### [03. Integrations](./03-integrations/)
External service integrations:
- **[Airtable](./03-integrations/airtable/)** - Database and automations
- **[Supabase](./03-integrations/supabase/)** - Authentication
- **[Twilio](./03-integrations/twilio/)** - SMS services

### [04. Technical Reference](./04-technical/)
- API documentation
- Database schema
- Architecture diagrams
- Performance guidelines

### [05. Troubleshooting](./05-troubleshooting/)
- Common issues and solutions
- Debugging guides
- Error reference

### [06. Development](./06-development/)
- Coding standards
- Git workflow
- Testing procedures
- Contributing guidelines

### [07. Handover & History](./07-handover/)
- Project handover documents
- LLM prompts for AI assistance
- Session summaries and changelogs

## 🔑 Key Information

### Production Environment
- **URL**: https://mbh-production-f0d1.up.railway.app
- **Platform**: Railway (auto-deploy from main branch)
- **Repository**: https://github.com/harry-dev-general/mbh

### Critical Tables (Airtable)
- **Base ID**: `applkAFOn2qxtu7tx`
- **Bookings Dashboard**: `tblcBoyuVsbB1dt1I`
- **Employee Details**: `tbltAE4NlNePvnkpY`
- **Boats**: `tblNLoBNb4daWzjob`
- **Announcements**: `tblDCSmGREv0tF0Rq`

### Technology Stack
- **Frontend**: Vanilla HTML/JS/CSS
- **Backend**: Node.js/Express
- **Database**: Airtable
- **Auth**: Supabase
- **SMS**: Twilio
- **Hosting**: Railway

## 🔍 Recent Updates

### September 2025
- ✅ Fixed availability form prefill logic
- ✅ Resolved management allocations bugs
- ✅ Implemented staff deselection feature
- ✅ Updated allocation color coding
- ✅ Launched announcements system with SMS
- ✅ **NEW: Vessel Location Tracking** - GPS tracking in Post-Departure Checklists

### August 2025
- Major system overhaul and stabilization
- Fixed booking allocation issues
- Improved vessel maintenance dashboard

## 📖 How to Use This Documentation

1. **Browse by Category**: Use the numbered sections above
2. **Search**: Use Ctrl/Cmd+F to search within documents
3. **Follow Cross-References**: Blue links connect related topics
4. **Check Dates**: Look for "Last Updated" at document bottoms

## 🚨 Important Notes

### For Developers
- Always check [Environment Setup](./01-setup/environment-setup.md) before starting
- Review [Coding Standards](./06-development/coding-standards.md)
- Test thoroughly - see [Testing Guide](./06-development/testing-guide.md)

### For Operations
- SMS notifications require active Twilio account
- Airtable automations must be enabled
- Regular backups recommended

## 📞 Support

### Technical Issues
1. Check [Troubleshooting Guide](./05-troubleshooting/)
2. Review [Common Issues](./05-troubleshooting/common-issues.md)
3. Contact development team

### Documentation Issues
- Report missing information
- Suggest improvements
- Submit corrections via GitHub

---

## Quick Links

### Most Accessed Documents
- [SMS Implementation Guide](./02-features/sms/comprehensive-guide.md)
- [Booking Allocation Guide](./02-features/allocations/allocation-guide.md)
- [Airtable API Reference](./03-integrations/airtable/api-reference.md)
- [Deployment Guide](./01-setup/deployment-guide.md)
- [Vessel Location Tracking](./00-overview/VESSEL_TRACKING_INDEX.md) - Complete tracking system docs

### Recent Additions
- [Announcements System](./02-features/announcements/implementation-guide.md)
- [September 2025 Updates](./07-handover/session-summaries/september-2025.md)
- [Documentation Organization](./DOCUMENTATION_ORGANIZATION_REPORT.md)

### For AI/LLM Development
- **Quick Start**: [LLM Quick Start Prompt](./LLM_QUICK_START_PROMPT.md) - Essential info for AI assistants
- **Full Context**: [LLM Continuation Prompt](./LLM_CONTINUATION_PROMPT.md) - Comprehensive development guide

---

*Documentation Version: 2.0*  
*Last Updated: September 10, 2025*  
*Next Review: October 2025*

> **Note**: This documentation is being reorganized. See [Migration Checklist](./DOCUMENTATION_MIGRATION_CHECKLIST.md) for details.
