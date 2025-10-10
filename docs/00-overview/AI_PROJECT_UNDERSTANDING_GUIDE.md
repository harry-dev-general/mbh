# MBH Staff Portal - AI Project Understanding Guide

## 🎯 Quick Start for AI Assistants

This guide provides a comprehensive understanding of the MBH Staff Portal project for AI assistants. Follow this structured approach to quickly get up to speed and continue development effectively.

## 📋 Project Overview

**What**: MBH Staff Portal - A full-stack web application for Manly Boat Hire's operations
**Purpose**: Manages boat hire operations including staff scheduling, vessel tracking, customer bookings, and SMS notifications
**Status**: In active production use (September 2025)
**Stack**: Vanilla HTML/JS/CSS frontend, Node.js/Express backend, Airtable database, Supabase auth

## 🗂️ Essential Documentation Reading Order

### 1. Start Here (Project Context)
- `@docs/README.md` - Central documentation hub and navigation
- `@docs/PROJECT_SUMMARY.md` - High-level overview and architecture
- `@docs/SEPTEMBER_2025_IMPLEMENTATIONS.md` - Recent features and current state

### 2. Technical Foundation
- `@docs/04-technical/TECHNICAL_REFERENCE_AIRTABLE_API.md` - Critical API patterns
- `@docs/04-technical/AIRTABLE_SINGLE_SELECT_FIELDS.md` - Common pitfalls to avoid
- `@docs/05-troubleshooting/date-handling-issues.md` - Date/timezone handling guide

### 3. Key Features
- `@docs/02-features/management-dashboard/ui-redesign-2025.md` - Latest UI implementation
- `@docs/02-features/daily-run-sheet/implementation.md` - Operational dashboard
- `@docs/02-features/fleet-map/FLEET_MAP_IMPLEMENTATION.md` - Vessel tracking visualization
- `@docs/02-features/allocations/MANAGEMENT_ALLOCATIONS_ARCHITECTURE.md` - Staff scheduling

### 4. Integrations
- `@docs/03-integrations/checkfront/WEBHOOK_INTEGRATION.md` - Booking system
- `@docs/03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md` - GPS tracking
- `@docs/02-features/sms/INTEGRATED_WEBHOOK_SMS.md` - SMS notifications

## 🔑 Critical Information

### Airtable Configuration
```javascript
// Base ID (never changes)
const BASE_ID = 'applkAFOn2qxtu7tx';

// Key Table IDs
const TABLES = {
    bookings: 'tblRe0cDmK3bG2kPf',        // Bookings Dashboard
    allocations: 'tbl22YKtQXZtDFtEX',     // Shift Allocations  
    employees: 'tbltAE4NlNePvnkpY',       // Employee Details
    boats: 'tblNLoBNb4daWzjob',           // Boats
    preChecklist: 'tbl9igu5g1bPG4Ahu',    // Pre-Departure Checklist
    postChecklist: 'tblYkbSQGP6zveYNi',   // Post-Departure Checklist
    announcements: 'tblDCSmGREv0tF0Rq'    // Announcements
};
```

### Authentication Setup
```javascript
// Supabase configuration (unified across all pages)
const SUPABASE_URL = 'https://etkugeooigiwahikrmzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Management emails
const MANAGEMENT_EMAILS = [
    'harry@priceoffice.com.au',
    'brad@boathiremanly.com.au',
    'george@boathiremanly.com.au'
];
```

### Common Patterns

#### 1. API Proxy Pattern
All Airtable requests go through backend proxy:
```javascript
// Frontend
fetch(`/api/airtable/${BASE_ID}/${TABLE_ID}?filterByFormula=...`)

// Backend handles auth headers
app.get('/api/airtable/:baseId/:tableId', async (req, res) => {
    // Proxy with API key
});
```

#### 2. Date Handling
Always use Sydney timezone and consistent formatting:
```javascript
// Helper function for consistent date strings
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Timezone-aware display
new Intl.DateTimeFormat('en-AU', { 
    timeZone: 'Australia/Sydney'
});
```

#### 3. Error Handling
SMS failures should never block operations:
```javascript
try {
    await sendSMS(phoneNumber, message);
} catch (error) {
    console.error('SMS failed:', error);
    // Continue operation - don't throw
}
```

## ⚠️ Critical Warnings

### 1. No Frameworks Rule
- **NEVER** introduce React, Vue, or other frameworks
- Use vanilla JavaScript only
- CSS without preprocessors
- No build steps or transpilation

### 2. Date Handling Pitfalls
- **NEVER** hardcode dates in production code
- Always handle Sydney timezone explicitly
- Use `formatLocalDate()` for consistent comparisons
- Be aware of Date vs DateTime fields in Airtable

### 3. Airtable Gotchas
- Single select fields return strings, not objects
- DateTime fields use ISO format with timezone
- Client-side filtering needed for complex queries
- 100 record limit per request

### 4. Deployment
- Git push to `main` branch triggers Railway auto-deploy
- No staging environment - test thoroughly
- Environment variables managed in Railway

## 🚀 Development Workflow

### 1. Before Making Changes
```bash
# Check current state
git status
git pull origin main

# Review recent changes
git log --oneline -10
```

### 2. Common Tasks

#### Adding a New Feature
1. Read relevant documentation
2. Check `@docs/SEPTEMBER_2025_IMPLEMENTATIONS.md` for recent similar work
3. Follow existing patterns (no frameworks!)
4. Test with actual Airtable data
5. Handle edge cases (missing data, timezone issues)

#### Fixing a Bug
1. Check `@docs/05-troubleshooting/` for known issues
2. Verify in browser console
3. Test date/timezone handling
4. Ensure SMS failures don't break flow

#### Updating UI
1. Follow navy blue theme (#1B4F72)
2. Mobile-first responsive design
3. Use existing CSS patterns
4. Test on actual mobile devices

### 3. After Changes
```bash
# Commit with descriptive message
git add -A
git commit -m "Fix: [component] - [what was fixed]

- Detailed change 1
- Detailed change 2"

# Push to deploy
git push origin main
```

## 📱 Testing Checklist

### Essential Tests
- [ ] Date displays correctly (current date, not hardcoded)
- [ ] Timezone handling (Sydney time for all displays)
- [ ] Mobile responsive (test at 768px, 1024px)
- [ ] Authentication flow (both staff and management)
- [ ] Airtable data loading (handle empty/missing fields)
- [ ] SMS notifications (graceful failure)

### Browser Testing
- Chrome (primary)
- Safari (management often uses)
- Mobile Safari (staff primary)
- Mobile Chrome

## 🔧 Debugging Tips

### Console Commands
```javascript
// Check auth state
supabase.auth.getSession()

// Test Airtable connection
fetch('/api/airtable/applkAFOn2qxtu7tx/tblRe0cDmK3bG2kPf?maxRecords=1')
    .then(r => r.json())
    .then(console.log)

// Check current Sydney time
new Date().toLocaleString('en-AU', {timeZone: 'Australia/Sydney'})
```

### Common Issues
1. **Redirect loops**: Check auth state with `getSession()` not `getUser()`
2. **Missing data**: Verify Airtable field names match exactly
3. **Wrong dates**: Check for hardcoded dates or timezone issues
4. **Map not loading**: Verify Google Maps API key (now served via `/api/config`)
5. **Slow API responses**: Airtable rate limits (5 req/sec), use timeouts
6. **Date filtering**: Use `IS_SAME()` for Airtable date field comparisons

## 🚀 Recent Implementations (September 2025)

### New Features
1. **Square Integration** - Automatic ice cream sales sync (`/api/square-webhook.js`)
2. **Ice Cream Sales Page** - Live dashboard at `/training/ice-cream-sales.html`
3. **Add-on Indicators** - Visual badges on bookings with add-ons
4. **Phone Number Capture** - From Checkfront webhooks
5. **Secure API Keys** - Google Maps key via `/api/config` endpoint

### Performance Fixes
- Request timeouts (30s sales, 15s stats)
- Sequential loading with delays
- Reduced payload sizes
- Smart refresh intervals

### Key Documentation
- `/docs/SEPTEMBER_2025_FEATURE_IMPLEMENTATIONS.md` - Detailed implementation guide
- `/docs/02-features/ice-cream-sales/` - Ice cream feature docs
- `/docs/03-integrations/square/` - Square integration docs

## 📞 Support Resources

### Documentation
- Internal: `/docs/` directory structure
- Airtable API: https://airtable.com/api
- Supabase Auth: https://supabase.com/docs/guides/auth
- Square API: https://developer.squareup.com/docs

### Project Context
- **Client**: Manly Boat Hire
- **Location**: Sydney, Australia
- **Timezone**: Australia/Sydney (AEST/AEDT)
- **Business Hours**: Generally 8 AM - 6 PM

## 🎯 Current Priorities (September 2025)

1. **Operational Efficiency**: Real-time tracking and status
2. **Mobile Experience**: Staff primarily use phones
3. **Reliability**: System must work during peak season
4. **SMS Communications**: Critical for staff coordination
5. **Payment Integration**: Square integration for ice cream sales
6. **Performance**: Handling slow Airtable API responses

## 💡 Best Practices Summary

1. **Always** test with real dates (not hardcoded)
2. **Never** let SMS failures break the flow
3. **Follow** existing patterns (no frameworks)
4. **Handle** missing/null Airtable data gracefully
5. **Consider** Sydney timezone in all date operations
6. **Test** on mobile devices frequently
7. **Document** any new patterns or fixes

---

## Quick Reference Commands

```bash
# Start local development
cd /path/to/mbh-staff-portal
npm install
npm start

# Check logs
git log --oneline -20

# Search for patterns
grep -r "pattern" --include="*.js" --include="*.html"

# Find TODOs
grep -r "TODO" --include="*.js" --include="*.html"
```

---

*For specific implementation details, always refer to the documentation files mentioned above. When in doubt, check existing code patterns rather than introducing new approaches.*
