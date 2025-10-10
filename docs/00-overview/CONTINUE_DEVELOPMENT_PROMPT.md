# MBH Staff Portal - Development Continuation Prompt

## 🚀 Quick Start Instructions for AI Assistant

You'll be working on the **MBH Staff Portal**, a production web application for Manly Boat Hire's operations. This system manages boat rentals, staff scheduling, vessel tracking, and customer bookings in Sydney, Australia.

## 📍 First Steps

1. **Read the AI Understanding Guide**: Start with `@docs/AI_PROJECT_UNDERSTANDING_GUIDE.md` for a structured overview
2. **Check Recent Work**: Review `@docs/SEPTEMBER_2025_IMPLEMENTATIONS.md` to understand the latest changes
3. **Understand the Stack**: Vanilla HTML/JS/CSS frontend, Node.js backend, Airtable database, NO FRAMEWORKS

## 🗺️ Critical Documentation Map

### Project Foundation
- `@docs/README.md` - Documentation hub with full navigation
- `@docs/PROJECT_SUMMARY.md` - Architecture and system overview
- `@docs/AI_PROJECT_UNDERSTANDING_GUIDE.md` - AI-optimized project guide

### Technical References
- `@docs/04-technical/TECHNICAL_REFERENCE_AIRTABLE_API.md` - API patterns and proxy setup
- `@docs/05-troubleshooting/date-handling-issues.md` - Critical date/timezone handling
- `@docs/04-technical/AIRTABLE_SINGLE_SELECT_FIELDS.md` - Common Airtable pitfalls

### Feature Documentation
- `@docs/02-features/management-dashboard/ui-redesign-2025.md` - Current UI implementation
- `@docs/02-features/daily-run-sheet/implementation.md` - Operational dashboard details
- `@docs/02-features/fleet-map/FLEET_MAP_IMPLEMENTATION.md` - Vessel tracking system
- `@docs/02-features/allocations/MANAGEMENT_ALLOCATIONS_ARCHITECTURE.md` - Staff scheduling

### Recent Implementations
- `@docs/SEPTEMBER_2025_IMPLEMENTATIONS.md` - All September 2025 updates and fixes

## ⚡ Quick Context

### Current Date Context
- Operating in September 2025
- Sydney timezone (Australia/Sydney)
- System has real bookings and active staff

### Key URLs
- Staff Dashboard: `/dashboard.html`
- Management Dashboard: `/management-dashboard.html`
- Daily Run Sheet: `/daily-run-sheet.html`
- Staff Allocations: `/allocations.html`

### Database Structure
```javascript
// Airtable Base ID
const BASE_ID = 'applkAFOn2qxtu7tx';

// Critical Tables
- Bookings Dashboard: tblRe0cDmK3bG2kPf
- Shift Allocations: tbl22YKtQXZtDFtEX
- Employee Details: tbltAE4NlNePvnkpY
- Boats: tblNLoBNb4daWzjob
```

## 🚨 Critical Rules

### 1. NO FRAMEWORKS
- ❌ No React, Vue, Angular, etc.
- ❌ No build tools or transpilation
- ✅ Vanilla JavaScript only
- ✅ Pure CSS (no preprocessors)

### 2. Date Handling
```javascript
// Always use real current date
const now = new Date(); // ✅ CORRECT

// Never hardcode dates
now.setFullYear(2025); // ❌ WRONG

// Use Sydney timezone
new Intl.DateTimeFormat('en-AU', { 
    timeZone: 'Australia/Sydney' 
});
```

### 3. API Pattern
All Airtable requests must go through the backend proxy:
```javascript
// Frontend
fetch(`/api/airtable/${BASE_ID}/${TABLE_ID}?filterByFormula=...`)

// NOT direct Airtable API calls
```

### 4. Error Handling
SMS failures must not block operations:
```javascript
try {
    await sendSMS(number, message);
} catch (error) {
    console.error('SMS failed:', error);
    // Continue - don't throw
}
```

## 💡 Common Tasks Reference

### Fixing Date Issues
1. Check `@docs/05-troubleshooting/date-handling-issues.md`
2. Look for hardcoded dates
3. Use `formatLocalDate()` helper
4. Test timezone handling

### Adding New Features
1. Follow existing patterns in `/training/` directory
2. Check similar features in recent implementations
3. Use navy blue theme (#1B4F72)
4. Ensure mobile responsiveness

### Working with Airtable
1. Use exact field names (case-sensitive)
2. Handle null/undefined gracefully
3. Remember 100 record limit
4. Use client-side filtering for complex queries

### Debugging Production Issues
1. Check Railway logs
2. Verify Airtable field names
3. Test with real current dates
4. Check browser console

## 🔧 Development Commands

```bash
# Navigate to project
cd /Users/harryprice/kursol-projects/mbh-staff-portal

# Install dependencies
npm install

# Start local server
npm start

# Deploy (auto-deploys on push)
git add -A
git commit -m "Descriptive message"
git push origin main
```

## 📝 Current TODOs

Key pending tasks from the todo list:
- Daily Run Sheet Phase 2: Integrate pre/post departure checklist data
- Daily Run Sheet Phase 3: Add predictive analytics and alerts
- Weather integration for operational planning
- Real-time booking updates feature

## 🎯 What to Focus On

1. **Reliability**: System is in production use
2. **Mobile First**: Staff primarily use phones
3. **Sydney Time**: All displays must be Sydney timezone
4. **No Breaking Changes**: Test thoroughly before deploying

## 🆘 Getting Help

1. Search existing documentation with grep
2. Check similar implementations in codebase
3. Review troubleshooting guides
4. Look at recent git commits for patterns

## 📋 Pre-Development Checklist

Before starting any work:
- [ ] Read `@docs/AI_PROJECT_UNDERSTANDING_GUIDE.md`
- [ ] Check `@docs/SEPTEMBER_2025_IMPLEMENTATIONS.md`
- [ ] Understand the no-frameworks rule
- [ ] Know the Sydney timezone requirement
- [ ] Familiarize with Airtable proxy pattern

Remember: This is a production system for a real business. Always test thoroughly and follow existing patterns rather than introducing new approaches.

---

*When ready to start, begin by reading the AI Understanding Guide and checking recent implementations. The codebase follows consistent patterns - learn them before making changes.*
