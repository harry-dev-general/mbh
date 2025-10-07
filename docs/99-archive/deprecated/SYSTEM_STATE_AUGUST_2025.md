# MBH Staff Portal - System State (August 2025)

## 🚀 Current Production Status

**Live URL**: https://mbh-production-f0d1.up.railway.app  
**Repository**: https://github.com/harry-dev-general/mbh  
**Branch**: main  
**Auto-Deploy**: Enabled via Railway  

## ✅ What's Currently Working

### 1. Authentication System
- **Supabase Email Auth**: Full signup/login flow
- **Email Verification**: Working with correct templates
- **Session Persistence**: Automatic session management
- **Protected Routes**: All pages require authentication

### 2. Staff Allocation System (NEW - August 2025)
- **Management Dashboard** (`/training/management-allocations.html`)
  - View all staff availability from Roster
  - See bookings requiring staff
  - Create hourly shift allocations
  - Assign staff to specific booking roles
  - Visual calendar grid with color-coded shifts
  - Date display (DD/MM) under days
  - Current day highlighting

- **Personal Schedule** (`/training/my-schedule.html`)
  - Staff view their allocated shifts
  - Accurate hours display (7h 47min format)
  - Calendar and list views
  - Total hours tracking
  - Week navigation

### 3. Weekly Availability Submission
- Form at `/training/availability.html`
- Auto-generates Submission IDs
- Links to employee records
- Integrates with Airtable automations

### 4. Vessel Checklists
- Pre-departure safety checks
- Post-departure vessel inspection
- Links to bookings and staff
- Photo upload reminders

### 5. Dashboard Hub
- Central navigation at `/training/dashboard.html`
- Role-based feature access
- Management sees allocation tools
- All staff see schedules

## 📊 Airtable Structure

### Base: MBH Bookings Operation
**Base ID**: `applkAFOn2qxtu7tx`

| Table | ID | Purpose | Status |
|-------|-----|---------|--------|
| Employee Details | `tblTJrOT3WD0hrLAW` | Staff records | ✅ Active |
| Roster | `tblwwK1jWGxnfuzAN` | Weekly availability | ✅ Active |
| Bookings Dashboard | `tblRe0cDmK3bG2kPf` | Customer bookings | ✅ Active |
| Shift Allocations | `tbl22YKtQXZtDFtEX` | Staff schedules | ✅ Active |
| Pre-Departure Checklist | `tbl9igu5g1bPG4Ahu` | Safety checks | ✅ Active |
| Post-Departure Checklist | `tblYkbSQGP6zveYNi` | Vessel inspection | ✅ Active |
| Boats | `tblA2b3OFfqPFbOM` | Vessel info | ✅ Synced |

## 🔧 Technical Implementation Details

### Frontend Architecture
```
Pure HTML/CSS/JavaScript
No build process
No framework dependencies
Direct Airtable API calls
```

### Authentication Flow
```
Supabase Email → Airtable Employee Lookup → Access Grant
```

### Data Flow
```
User Action → Client JS → Airtable API → UI Update
```

### Date/Time Context
**CRITICAL**: System operates in August 2025 context
```javascript
// All dates forced to 2025
let today = new Date();
today.setFullYear(2025);
today.setMonth(7); // August
today.setDate(20); // Current context: Aug 20, 2025
```

## 🐛 Known Issues & Solutions Applied

### Issue 1: Test Staff Allocations Not Showing
**Problem**: Filter formulas couldn't match linked record arrays  
**Solution**: Fetch all records, filter client-side
```javascript
// Instead of complex filterByFormula
const filtered = allRecords.filter(r => 
    r.fields['Employee']?.includes(employeeId)
);
```

### Issue 2: Timezone Date Shifts
**Problem**: `toISOString()` converts to UTC, shifting dates  
**Solution**: Local date formatter
```javascript
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

### Issue 3: Roster Data Inconsistency
**Problem**: Some records use "Week Starting", others use "Date"  
**Solution**: Check both fields
```javascript
if (record.fields['Week Starting'] === targetWeek) return true;
if (record.fields['Date'] && isWithinWeek(record.fields['Date'])) return true;
```

### Issue 4: Hours Display Accuracy
**Problem**: Showed "7h" instead of "7h 47min"  
**Solution**: Precise minute calculation
```javascript
const totalMinutes = endMinutes - startMinutes;
const hours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;
return `${hours}h ${minutes}min`;
```

## 🔑 Critical Configuration

### Management Emails (dashboard.html:369)
```javascript
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com'
];
```

### Forced 2025 Context
All date operations assume year 2025. This is hardcoded in:
- `/training/management-allocations.html`
- `/training/my-schedule.html`

### Environment Variables (Railway)
```
PORT=8080
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[configured]
AIRTABLE_API_KEY=[configured]
```

## 📁 Key Files

### Core System Files
```
/server.js                              # Express server with routing
/training/dashboard.html                # Main hub with navigation
/training/auth.html                     # Login/signup page
/training/auth-callback.html            # Email verification handler
```

### Staff Allocation System
```
/training/management-allocations.html   # Management dashboard
/training/my-schedule.html              # Personal schedule view
```

### Other Features
```
/training/availability.html             # Weekly availability form
/training/vessel-checklists.html        # Checklist selector
/training/pre-departure-checklist.html  # Safety checks
/training/post-departure-checklist.html # Vessel inspection
```

## 🎯 Current User Accounts

### Test Accounts
- **Test Staff**: harry@kursol.io (Employee ID: recU2yfUOIGFsIuZV)
- **Management**: harry@priceoffice.com.au, mmckelvey03@gmail.com

### Sample Data
- **Bronte**: 6 days available current week
- **Test Staff**: 1 allocation on Aug 21, 2025 (9:00-16:47)

## ⚠️ Important Limitations

1. **API Key Exposure**: Airtable key visible in client code
2. **No Offline Support**: Requires constant internet
3. **No Real-time Updates**: Manual refresh needed
4. **Rate Limiting**: 5 req/sec Airtable limit shared by all users
5. **No Build Process**: Direct file editing only

## 🔄 Recent Changes (August 2025)

### Week of Aug 18-24, 2025
1. ✅ Created Shift Allocations table in Airtable
2. ✅ Built management allocation dashboard
3. ✅ Implemented personal schedule view
4. ✅ Fixed Test Staff visibility issues
5. ✅ Added precise hours/minutes display
6. ✅ Fixed timezone date shifting
7. ✅ Added booking display on calendar
8. ✅ Implemented click-to-allocate for bookings
9. ✅ Added date display and current day highlighting

## 📝 For Next LLM: Quick Start

### 1. Understand the Context
- System operates in August 2025 (hardcoded)
- No framework, pure vanilla JS
- Dual integration: Supabase (auth) + Airtable (data)

### 2. Common Tasks

#### To Add a New Feature:
1. Create HTML file in `/training/`
2. Add authentication check
3. Find employee by email
4. Fetch from Airtable
5. Update dashboard navigation

#### To Fix Date Issues:
1. Check year is 2025
2. Use `formatLocalDate()` not `toISOString()`
3. Test with current week (Aug 18-24, 2025)

#### To Debug Airtable:
1. Console.log the raw response
2. Check field names match exactly
3. Try client-side filtering first
4. Verify linked records are arrays

### 3. Testing Flow
```bash
# Local testing
cd mbh-staff-portal
node server.js
# Visit http://localhost:8080

# Production
git add -A
git commit -m "Your changes"
git push origin main
# Railway auto-deploys
```

### 4. Emergency Fixes

#### If allocations don't show:
```javascript
// Check employee ID matching
console.log('Employee field:', record.fields['Employee']);
console.log('Looking for:', employeeRecordId);
```

#### If dates are wrong:
```javascript
// Force to 2025 context
const today = new Date();
today.setFullYear(2025);
```

#### If Airtable 422 error:
```javascript
// Log exact payload
console.log('Sending to Airtable:', JSON.stringify(payload));
// Compare with Airtable field configuration
```

## 🚦 System Health Check

| Component | Status | Notes |
|-----------|--------|-------|
| Railway Deployment | ✅ Active | Auto-deploy enabled |
| Supabase Auth | ✅ Working | Email verification functional |
| Airtable API | ✅ Connected | Rate limits apply |
| Staff Allocations | ✅ Operational | All CRUD operations working |
| Email System | ✅ Working | 2/hour limit without custom SMTP |
| Mobile Support | ✅ Responsive | All features mobile-friendly |

## 📈 Next Priority Items

1. **Security**: Move Airtable API to backend
2. **Performance**: Implement caching layer
3. **UX**: Add loading states and error recovery
4. **Features**: Real-time updates via webhooks
5. **Scale**: Implement pagination for large datasets

---

**Handoff Date**: August 20, 2025  
**System Version**: 2.0  
**Status**: Fully Operational with Known Limitations  
**Last Deployment**: Successfully tested with Test Staff allocation  

## Contact for Questions
Check git history for recent changes and commit messages for context.
