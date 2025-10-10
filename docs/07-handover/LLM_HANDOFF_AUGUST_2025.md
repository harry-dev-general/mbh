# LLM Handoff Prompt - MBH Staff Portal (August 26, 2025)

## Prompt for Next LLM

You are about to work on the **MBH Staff Portal** project, a boat rental booking management system. This prompt provides complete context from the latest development session.

### 🚀 Quick Start

```
You are working on the MBH Staff Portal at /Users/harryprice/kursol-projects/mbh-staff-portal/

Repository: https://github.com/harry-dev-general/mbh (branch: main)
Production: https://mbh-production-f0d1.up.railway.app
Deployment: Railway (auto-deploys from GitHub main)

The system uses:
- Frontend: Vanilla HTML/CSS/JavaScript (NO framework)
- Database: Airtable (Base ID: applkAFOn2qxtu7tx)
- Auth: Supabase (Project: etkugeooigiwahikrmzr)

CRITICAL: Read @docs/BOOKING_ALLOCATION_FIX_2025.md for latest fixes
```

### 📊 Current System State (August 26, 2025)

#### What's Working
1. **Booking Allocation System** ✅
   - Staff can be allocated to customer bookings without creating duplicates
   - Booking blocks change color (red→green) when staff assigned
   - 1-hour allocations (30min before + 30min after)
   - Customer names display prominently

2. **Employee Schedule View** ✅
   - Shows both general allocations AND booking assignments
   - Fetches from Shift Allocations table AND Bookings Dashboard
   - Today highlighted with blue outline
   - Proper time calculations

3. **Management Dashboard** ✅
   - Weekly calendar grid with current week
   - Staff availability from Roster
   - Click-to-allocate functionality
   - Dynamic staff dropdown per date

### 🔧 Recent Fixes Applied (This Session)

1. **Duplicate Allocation Prevention**
   - Booking-specific allocations now ONLY update booking record
   - No longer creates duplicate records in Shift Allocations table
   - See lines 1715-1785 in `/training/management-allocations.html`

2. **Date Handling Fix**
   ```javascript
   // CRITICAL: Always use actual current date
   let today = new Date(); // NOT new Date('2025-08-20')
   today.setHours(12, 0, 0, 0); // Prevent timezone issues
   ```

3. **Time Calculation Helpers**
   - `addTime()`, `subtractTime()`, `convertTo24Hour()` functions
   - Handle 12/24 hour formats, midnight wraparound
   - Used for booking allocation times

4. **Employee View Integration**
   - `/training/my-schedule.html` now fetches from both data sources
   - Shows customer names with roles
   - Proper 1-hour duration for bookings

### ⚠️ Critical Technical Considerations

#### Airtable Quirks
1. **Field Names are Case-Sensitive**: `Status` ≠ `status`
2. **Linked Records Must Be Arrays**: `[employeeId]` not `employeeId`
3. **Formula Fields are Read-Only**: Cannot write to `Onboarding Time`, `Deloading Time`
4. **Time Formats Vary**: Can be "09:00 am", "9:00 AM", or "09:00"
5. **Client-Side Filtering Required**: `filterByFormula` unreliable for complex queries

#### Date/Time Handling
```javascript
// ALWAYS do this for dates:
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// DON'T use toISOString() - causes timezone shifts
// DON'T hardcode dates
// DO set hours to noon when initializing dates
```

#### Table IDs (NEVER change without verification)
```javascript
const BASE_ID = 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE_ID = 'tblRe0cDmK3bG2kPf';      // Bookings Dashboard
const EMPLOYEES_TABLE_ID = 'tbltAE4NlNePvnkpY';     // Employee Details (NOT tblTJrOT3WD0hrLAW)
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';   // Shift Allocations
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';        // Roster
```

### 🐛 Known Issues & Limitations

1. **API Key Exposed**: Airtable key visible in client code (security risk)
2. **No Real-time Updates**: Manual refresh required
3. **Rate Limiting**: 5 req/sec shared by all users
4. **No Offline Support**: Requires constant internet
5. **Status Filter**: Must include both 'PAID' and 'PART' statuses

### 📁 Key Files to Understand

1. **`/training/management-allocations.html`** (2000+ lines)
   - Main allocation dashboard for management
   - Contains all time helper functions
   - Handles booking→staff assignment

2. **`/training/my-schedule.html`** (1200+ lines)
   - Employee personal schedule view
   - Dual data source loading (recent fix)
   - Calendar and list views

3. **`/docs/BOOKING_ALLOCATION_FIX_2025.md`**
   - Detailed documentation of latest fixes
   - Technical implementation details
   - Platform requirements

### 🎯 Immediate Tasks If Issues Arise

#### If Bookings Don't Show:
1. Check console for date logging
2. Verify Status includes 'PAID' and 'PART'
3. Check `formatLocalDate()` is used, not `toISOString()`
4. Ensure `pageSize=100` in API calls

#### If Allocations Create Duplicates:
1. Check allocation type (Boat Hire vs General)
2. Verify only booking record is updated for booking types
3. Check lines 1715-1785 in management-allocations.html

#### If Staff Dropdown Empty:
1. Check `populateStaffForDate()` is called
2. Verify roster data has correct date format
3. Check both 'Date' and 'Week Starting' fields

### 💡 Common Patterns in This Codebase

#### Pattern 1: Dual Field Checking
```javascript
// Roster data has inconsistent field usage
if (record.fields['Week Starting'] === targetWeek) return true;
if (record.fields['Date'] && isWithinWeek(record.fields['Date'])) return true;
```

#### Pattern 2: Client-Side Filtering
```javascript
// Fetch all, filter locally (more reliable than filterByFormula)
const allRecords = await fetchAll();
const filtered = allRecords.filter(r => /* conditions */);
```

#### Pattern 3: Time Format Handling
```javascript
// Always convert to 24-hour for calculations
const time24 = convertTo24Hour(timeStr);
// Then apply time math
const newTime = addTime(time24, 1, 0);
```

### 🚀 Deployment Process

```bash
# Make changes
git add -A
git commit -m "Descriptive message"
git push origin main
# Railway auto-deploys in ~2 minutes
```

### 📞 Testing Accounts

- **Management**: harry@priceoffice.com.au, mmckelvey03@gmail.com
- **Test Staff**: harry@kursol.io (Employee ID: recU2yfUOIGFsIuZV)
- **Test Booking**: Test Customer on Aug 27, 2025

### 🔮 Future Improvements Needed

1. **Security**: Move Airtable API to backend service
2. **Performance**: Implement caching layer
3. **UX**: Add loading states and error recovery
4. **Features**: Real-time updates via WebSocket
5. **Scale**: Pagination for large datasets

### 📚 Essential Documentation

Read these in order:
1. `@docs/BOOKING_ALLOCATION_FIX_2025.md` - Latest fixes (TODAY)
2. `@docs/AIRTABLE_DATA_INTEGRATION_GUIDE.md` - Data handling patterns
3. `@docs/TECHNICAL_IMPLEMENTATION_GUIDE.md` - Architecture details
4. `@docs/CORRECT_TABLE_IDS.md` - Verified table/field IDs

### ⚡ Quick Diagnostic Commands

```javascript
// In browser console:

// Check current date handling
console.log('Today:', new Date());
console.log('Week start:', currentWeekStart);

// Check employee
console.log('Employee ID:', employeeRecordId);

// Check allocations
console.log('Allocations:', myAllocations);

// Force data refresh
await loadWeekData();
renderScheduleGrid();
```

### 🎯 Your First Actions

1. **Verify the system is working**: Visit https://mbh-production-f0d1.up.railway.app
2. **Login as Test Staff**: harry@kursol.io
3. **Check both views**: `/training/management-allocations.html` and `/training/my-schedule.html`
4. **Read recent fixes**: `@docs/BOOKING_ALLOCATION_FIX_2025.md`
5. **Check for any console errors**: Browser DevTools

### ⚠️ DO NOT:
- Change table IDs without verification
- Use `toISOString()` for date formatting
- Write to formula fields
- Forget linked records must be arrays
- Hardcode dates
- Trust Airtable field formats to be consistent

### ✅ DO:
- Use client-side filtering for reliability
- Test with actual current date
- Handle multiple time formats
- Check both 'Date' and 'Week Starting' fields
- Use `formatLocalDate()` for dates
- Add debug logging when investigating issues

---

**System Status**: Fully operational as of August 26, 2025
**Latest Deployment**: All fixes from this session are live
**Next Priority**: Consider moving Airtable API to backend for security
