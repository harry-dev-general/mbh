# LLM Project Handoff Prompt - MBH Staff Portal

## Initial Context for LLM

You are about to work on the **MBH Staff Portal** (Manly Boat Hire), a web application for managing boat rental bookings and staff allocations. This prompt provides all necessary context to continue development effectively.

---

## 🚀 Quick Start Command

```
You are working on the MBH Staff Portal project located at `/Users/harryprice/kursol-projects/mbh-staff-portal/`. 

Repository: https://github.com/harry-dev-general/mbh (branch: main)
Production URL: https://mbh-production-f0d1.up.railway.app

The project uses Airtable as the primary database and Supabase for authentication. 
Please read the documentation in the @docs/ folder, particularly:
- AIRTABLE_DATA_INTEGRATION_GUIDE.md
- TECHNICAL_IMPLEMENTATION_GUIDE.md
- SYSTEM_STATE_AUGUST_2025.md
- BOOKING_ALLOCATION_FIX.md
```

---

## 📋 Project Overview

### What This System Does
- Manages boat rental bookings for Manly Boat Hire
- Allows staff allocation to bookings (onboarding/deloading)
- Tracks staff availability and rosters
- Provides weekly schedule views for management
- Handles pre/post departure checklists

### Current State (as of January 26, 2025)
- ✅ Authentication system working (Supabase)
- ✅ Booking display and filtering working
- ✅ Staff allocation functional
- ✅ Weekly calendar view operational
- ✅ All critical bugs fixed and documented

---

## 🏗️ Technical Architecture

### Frontend
- **Technology**: Vanilla HTML/CSS/JavaScript (NO framework)
- **Key Files**:
  - `/training/management-allocations.html` - Main allocation dashboard
  - `/training/my-schedule.html` - Staff personal schedule
  - `/training/auth.html` - Authentication page

### Backend
- **Primary Database**: Airtable
  - Base ID: `applkAFOn2qxtu7tx` (MBH Bookings Operation)
  - API Key: In environment variables
  
- **Authentication**: Supabase
  - Project URL: `https://etkugeooigiwahikrmzr.supabase.co`
  - Anon Key: In environment variables

- **Deployment**: Railway (auto-deploys from GitHub main branch)

### Data Sources

#### Critical Airtable Tables
```javascript
const BASE_ID = 'applkAFOn2qxtu7tx';  // MBH Bookings Operation

// Table IDs (NEVER change these without verification!)
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';     // Bookings Dashboard
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';    // Employee Details  
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';  // Shift Allocations
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';       // Roster
```

---

## ⚠️ CRITICAL WARNINGS

### 1. Date/Time Handling
```javascript
// PROBLEM: Airtable returns times in various formats
"09:00 am"  // 12-hour with space
"9:00 AM"   // Different case
"09:00"     // 24-hour format

// SOLUTION: Always use the robust time parser in management-allocations.html
```

### 2. Field Names are Case-Sensitive
```javascript
// WRONG
record.fields['status']  // Will fail!

// CORRECT  
record.fields['Status']  // Exact case required
```

### 3. Never Write to Formula Fields
```javascript
// These fields are READ-ONLY (formulas):
'Onboarding Time'  // Start Time - 30 minutes
'Deloading Time'   // Finish Time - 30 minutes
'Full Booking Status'  // Computed from other fields
```

### 4. Linked Records Must Be Arrays
```javascript
// WRONG
fields: { 'Onboarding Employee': employeeId }

// CORRECT
fields: { 'Onboarding Employee': [employeeId] }  // Array required!
```

### 5. Always Use Client-Side Filtering
```javascript
// Airtable's filterByFormula is unreliable for complex queries
// Fetch all records then filter client-side for dates
```

---

## 📚 Essential Documentation

Read these files in order:

1. **`/docs/AIRTABLE_DATA_INTEGRATION_GUIDE.md`**
   - Complete Airtable schema
   - Field types and relationships
   - Common issues and solutions
   - Code examples

2. **`/docs/TECHNICAL_IMPLEMENTATION_GUIDE.md`**
   - System architecture
   - Platform requirements
   - Integration patterns
   - Common pitfalls

3. **`/docs/BOOKING_ALLOCATION_FIX.md`**
   - History of fixes applied
   - Debugging approaches
   - Solutions to past issues

4. **`/docs/CORRECT_TABLE_IDS.md`**
   - Verified table and field IDs
   - Common ID mistakes to avoid

---

## 🛠️ Common Tasks

### Testing the System
1. Go to: https://mbh-production-f0d1.up.railway.app
2. Login with test credentials (in Supabase)
3. Navigate to Management Allocations
4. Current week should show (check it's not hardcoded!)
5. Look for bookings in "Today's Bookings" section

### Creating Test Data
```javascript
// Use the debug button in the UI or:
window.createTestBooking()  // Creates booking for current week
```

### Debugging Bookings Not Showing
1. Check browser console for errors
2. Verify current date isn't hardcoded
3. Check `Status` field is 'PAID'
4. Verify date falls within current week
5. Check console for "Found X PAID bookings, Y for current week"

### Deploying Changes
```bash
git add -A
git commit -m "Your descriptive message"
git push origin main
# Railway auto-deploys in ~2 minutes
```

---

## 🔧 MCP Tools Available

### Airtable MCP
```javascript
// Verify table structure
mcp_airtable_describe_table(
  baseId: "applkAFOn2qxtu7tx",
  tableId: "tblRe0cDmK3bG2kPf",
  detailLevel: "full"
)

// Search for records
mcp_airtable_search_records(
  baseId: "applkAFOn2qxtu7tx",
  tableId: "tblRe0cDmK3bG2kPf",
  searchTerm: "Customer Name"
)
```

### Supabase MCP
```javascript
// Check project status
mcp_supabase_get_project(id: "etkugeooigiwahikrmzr")

// Execute queries
mcp_supabase_execute_sql(
  project_id: "etkugeooigiwahikrmzr",
  query: "SELECT * FROM auth.users LIMIT 5"
)
```

---

## 🐛 Known Issues & Solutions

### Issue: Bookings not displaying
**Solution**: Check the date isn't hardcoded. Should use `new Date()` not a fixed date.

### Issue: CORS errors with Airtable
**Solution**: Don't use `Cache-Control` header. Use `?_t=${Date.now()}` for cache busting.

### Issue: Time format parsing errors  
**Solution**: Use the robust time parser that handles both 12/24 hour formats.

### Issue: Bookings showing in wrong week
**Solution**: Use string comparison for dates, not Date object comparison.

---

## 📊 Current Week Context

As of the last update (January 26, 2025):
- System was showing week of Aug 25-31, 2025
- Test booking exists for Aug 27, 2025
- Raoa Zaoud booking exists for Aug 31, 2025
- Both bookings now display correctly

---

## 🎯 Next Potential Tasks

Based on the current state, consider:

1. **Reporting Features**
   - Weekly/monthly booking reports
   - Staff allocation summaries
   - Revenue tracking

2. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly interfaces
   - Native app considerations

3. **Automation**
   - Auto-assign staff based on availability
   - Booking confirmation emails
   - Staff shift reminders

4. **Performance**
   - Implement caching layer
   - Reduce API calls
   - Optimize grid rendering

---

## 💡 Pro Tips

1. **Always verify with real data** - Use Airtable MCP to check actual records
2. **Test date-sensitive code** - Change system date to test different weeks
3. **Check Railway logs** - Deployment issues often visible there
4. **Use debug buttons** - Built-in test data creation tools
5. **Read the docs** - Most issues already documented with solutions

---

## 🚨 Emergency Contacts

- **GitHub Repo**: harry-dev-general/mbh (main branch)
- **Railway Dashboard**: Check deployment status
- **Airtable Base**: https://airtable.com/applkAFOn2qxtu7tx
- **Supabase Dashboard**: https://app.supabase.com/project/etkugeooigiwahikrmzr

---

## Final Checklist Before Starting

- [ ] Read AIRTABLE_DATA_INTEGRATION_GUIDE.md
- [ ] Understand the date/time handling issues
- [ ] Know the correct table IDs
- [ ] Understand linked records must be arrays
- [ ] Know formula fields are read-only
- [ ] Prepared to use client-side filtering
- [ ] Ready to test with actual current date

---

## Sample First Command

```
Please review the @docs/ folder to understand the current system state, then check if bookings are displaying correctly for the current week in the management allocations dashboard. The system should show today's actual date, not a hardcoded date.
```

Good luck! The system is currently working well - all major bugs have been fixed and documented. Focus on enhancements rather than bug fixes unless new issues arise.
