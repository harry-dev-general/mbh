# MBH Staff Portal - Technical Implementation Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Decisions](#architecture-decisions)
4. [Platform-Specific Requirements](#platform-specific-requirements)
5. [Integration Challenges & Solutions](#integration-challenges--solutions)
6. [Date/Time Handling](#datetime-handling)
7. [Authentication Implementation](#authentication-implementation)
8. [Data Flow Patterns](#data-flow-patterns)
9. [Performance Optimizations](#performance-optimizations)
10. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
11. [Deployment Considerations](#deployment-considerations)
12. [Future LLM Handoff Notes](#future-llm-handoff-notes)

## System Overview

The MBH Staff Portal is a web-based management system for Manly Boat Hire operations. It integrates two primary data sources (Supabase and Airtable) to provide staff scheduling, vessel management, and operational checklists.

### Core Functionality
- **Staff Management**: Availability submission, shift allocation, personal schedules
- **Booking Management**: Staff assignment to customer bookings
- **Vessel Management**: Pre/post-departure checklists, maintenance tracking
- **Authentication**: Email-based auth with role-based access control

## Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**: Pure vanilla implementation, no framework
  - **Decision Rationale**: Rapid prototyping, minimal build complexity, easy deployment
  - **Trade-offs**: Manual DOM manipulation, no component reusability
- **Font Awesome 6.4.0**: Icon library
- **Google Maps API**: Vessel location mapping
- **No Build Tools**: Direct file serving, no bundling/transpilation

### Backend
- **Node.js/Express**: Simple server for routing and static file serving
- **Environment**: Railway deployment platform
- **No Database**: All data stored in external services

### Data Layer
- **Airtable**: Primary data storage
  - Base IDs: `applkAFOn2qxtu7tx` (Bookings), `appjgJmfEkisWbUKh` (Maintenance)
  - API Version: REST API v0
  - Rate Limits: 5 requests/second
- **Supabase**: Authentication and future caching layer
  - Project: `etkugeooigiwahikrmzr`
  - Auth: Email/password with verification
  - Future: RLS-protected tables for caching

### Deployment
- **Railway**: Auto-deploy from GitHub
- **GitHub**: `harry-dev-general/mbh` (main branch)
- **Environment Variables**: Managed in Railway dashboard

## Architecture Decisions

### 1. Client-Side Airtable Integration
**Decision**: Direct API calls from browser to Airtable
```javascript
// Pattern used throughout the application
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }}
);
```

**Rationale**: 
- Quick MVP development
- Real-time data without caching layer
- Simplified architecture

**Trade-offs**:
- API key exposed in client (security concern)
- Rate limiting affects all users
- No offline capability

### 2. Stateless Authentication
**Decision**: Each page independently verifies authentication
```javascript
// Pattern on every protected page
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
    }
    // Continue with page logic
}
```

**Rationale**: Simple, no state management needed
**Trade-off**: Redundant auth checks, no global state

### 3. Employee Linking via Email
**Decision**: Match Supabase users to Airtable employees by email
```javascript
filterByFormula={Email}='${user.email}'
```

**Rationale**: No additional user management needed
**Requirement**: Emails must match exactly between systems

## Platform-Specific Requirements

### Airtable Requirements Discovered

#### 1. Linked Record Fields
**Requirement**: Must pass arrays even for single records
```javascript
// ❌ Wrong
"Employee": employeeRecordId

// ✅ Correct
"Employee": [employeeRecordId]
```

#### 2. Filter Formula Limitations
**Discovery**: Standard filtering doesn't work with linked record arrays
```javascript
// ❌ Doesn't work for linked records
filterByFormula={Onboarding Employee}='${employeeId}'

// ✅ Solution 1: SEARCH with concatenation
filterByFormula=SEARCH('${employeeId}', {Onboarding Employee}&'')

// ✅ Solution 2: Client-side filtering (used in final implementation)
const filtered = data.records.filter(r => 
    r.fields['Employee']?.includes(employeeId)
);
```

#### 3. Date/Time Format Requirements
- Dates: ISO format `YYYY-MM-DD`
- Times: 12-hour format with AM/PM for display
- Filter dates: Must handle timezone conversions

#### 4. Formula Field Syntax
```javascript
// DATESTR for exact date matching
DATESTR({Date})='2025-08-20'

// IS_AFTER/IS_BEFORE for ranges (exclusive)
IS_AFTER({Date}, '2025-08-18')

// Combining conditions
OR(DATESTR({Date})='2025-08-18', AND(...))
```

### Supabase Requirements

#### 1. Email Template Configuration
**Critical Discovery**: Must use `{{ .ConfirmationURL }}` variable
```html
<!-- ✅ Correct -->
<a href="{{ .ConfirmationURL }}">Confirm Email</a>

<!-- ❌ Wrong - Token is OTP, not JWT -->
<a href="{{ .SiteURL }}#access_token={{ .Token }}">
```

#### 2. URL Configuration
- Site URL must match deployment URL
- Redirect URLs must be explicitly listed
- Email rate limits: 2/hour (without custom SMTP)

### Railway Deployment Requirements

#### 1. Port Configuration
- Default port: 8080 (not 3000)
- Environment variable: `PORT`

#### 2. Static File Serving
**Issue**: Railway serves static files directly, bypassing Express routes
**Solution**: Rename conflicting files
```javascript
// Renamed index.html to training-resources.html
// to prevent static serving bypass
```

#### 3. Content Security Policy
```javascript
// Required for inline scripts and external resources
helmet.contentSecurityPolicy({
    directives: {
        scriptSrc: ["'self'", "'unsafe-inline'", 
                    "https://maps.googleapis.com"],
        // ... other directives
    }
})
```

## Integration Challenges & Solutions

### Challenge 1: Roster Data Structure Inconsistency
**Problem**: Some roster records have "Week Starting", others have individual "Date" fields

**Solution**: Check both fields
```javascript
// Comprehensive filter for roster data
const filteredRecords = records.filter(record => {
    const weekStarting = record.fields['Week Starting'];
    const date = record.fields['Date'];
    
    // Check Week Starting
    if (weekStarting === targetWeek) return true;
    
    // Check individual Date
    if (date && isWithinWeek(date)) return true;
    
    return false;
});
```

### Challenge 2: Employee Assignment Filtering
**Problem**: Airtable filterByFormula doesn't work with linked record arrays

**Solution Evolution**:
1. First attempt: Direct field matching ❌
2. Second attempt: FIND() function ❌
3. Third attempt: SEARCH() with concatenation ❌
4. Final solution: Fetch all, filter client-side ✅

```javascript
// Final working solution
const allRecords = await fetchAllRecords();
const myAllocations = allRecords.filter(record => {
    const employees = record.fields['Employee'] || [];
    return employees.includes(employeeId);
});
```

### Challenge 3: Date Timezone Issues
**Problem**: `toISOString()` converts to UTC, causing day shifts

**Solution**: Local date formatting
```javascript
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

## Date/Time Handling

### Critical Pattern: The 2025 Context
**Important**: System operates in 2025 context, not current year
```javascript
// Force year to 2025 for all date operations
let today = new Date();
today.setFullYear(2025);
today.setMonth(7); // August (0-indexed)
today.setDate(20);
```

### Week Calculation
```javascript
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0); // Reset to midnight
    return d;
}
```

### Duration Calculation
```javascript
function calculateDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const totalMinutes = (endHour * 60 + endMin) - 
                        (startHour * 60 + startMin);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return hours > 0 && minutes > 0 ? `${hours}h ${minutes}min` :
           hours > 0 ? `${hours}h` :
           `${minutes}min`;
}
```

## Authentication Implementation

### Session Management Pattern
```javascript
// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true
    }
});

// Check authentication on page load
async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/training/auth.html';
        return;
    }
    
    // Find employee record
    const employeeId = await findEmployeeByEmail(user.email);
    if (!employeeId) {
        showError('Employee record not found');
        return;
    }
    
    // Continue with page initialization
    loadPageData(employeeId);
}
```

## Data Flow Patterns

### Pattern 1: Employee-Centric Data Loading
```javascript
async function loadEmployeeData(email) {
    // 1. Find employee in Airtable
    const employee = await findEmployeeByEmail(email);
    
    // 2. Load related data
    const [allocations, roster, bookings] = await Promise.all([
        loadAllocations(employee.id),
        loadRoster(employee.id),
        loadBookings(employee.id)
    ]);
    
    // 3. Render UI
    renderDashboard({ employee, allocations, roster, bookings });
}
```

### Pattern 2: Booking Assignment Flow
```javascript
// Management creates allocation
async function createAllocation(data) {
    // 1. Create in Shift Allocations table
    const allocation = await createAirtableRecord('Shift Allocations', {
        Employee: [data.employeeId],
        'Shift Date': data.date,
        'Shift Type': 'Booking Specific',
        Booking: [data.bookingId],
        Role: data.role
    });
    
    // 2. Update booking (optional, via automation)
    // Airtable automation updates Onboarding/Deloading Employee
    
    return allocation;
}
```

## Performance Optimizations

### 1. Parallel Data Loading
```javascript
// ✅ Good - Parallel loading
const [staff, roster, bookings] = await Promise.all([
    loadStaffData(),
    loadRosterData(),
    loadBookingsData()
]);

// ❌ Bad - Sequential loading
const staff = await loadStaffData();
const roster = await loadRosterData();
const bookings = await loadBookingsData();
```

### 2. Client-Side Data Caching
```javascript
let cachedEmployeeData = null;

async function getEmployeeData(email) {
    if (cachedEmployeeData?.email === email) {
        return cachedEmployeeData;
    }
    
    const data = await fetchEmployeeFromAirtable(email);
    cachedEmployeeData = { email, ...data };
    return data;
}
```

### 3. Debounced Form Submission
```javascript
let isSubmitting = false;

async function handleSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
        await submitData();
    } finally {
        isSubmitting = false;
    }
}
```

## Common Pitfalls & Solutions

### Pitfall 1: Navigation preventDefault
**Issue**: Smooth scroll script blocks all navigation
```javascript
// Problem
anchor.addEventListener('click', e => e.preventDefault());

// Solution
if (href.startsWith('#')) e.preventDefault();
```

### Pitfall 2: Airtable 422 Errors
**Issue**: Field values don't match Airtable's expected format
```javascript
// Problem: Sending invalid select option
{ "Shift Type": "General" }

// Solution: Match exact Airtable option
{ "Shift Type": "General Operations" }
```

### Pitfall 3: Missing Employee Records
**Issue**: Email mismatch between Supabase and Airtable
```javascript
// Robust employee lookup
async function findEmployee(email) {
    // Try exact match
    let employee = await findByEmail(email);
    
    // Try case-insensitive
    if (!employee) {
        employee = await findByEmailIgnoreCase(email);
    }
    
    return employee;
}
```

## Deployment Considerations

### Environment Variables
```bash
# Railway environment variables
PORT=8080
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
AIRTABLE_API_KEY=pat...
```

### Security Headers
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    }
}));
```

### CORS Configuration
```javascript
// Not needed for current architecture
// Would be required if separating frontend/backend
```

## Future LLM Handoff Notes

### Critical Context
1. **Year Context**: System operates in 2025, hardcoded in date operations
2. **No Framework**: Pure vanilla JS, no build process
3. **Dual Integration**: Supabase (auth) + Airtable (data)
4. **Production URL**: https://mbh-production-f0d1.up.railway.app

### Key Files to Review
```
/training/management-allocations.html  # Staff allocation dashboard
/training/my-schedule.html             # Personal schedule view
/training/dashboard.html               # Main hub
/training/auth.html                    # Authentication
/server.js                            # Express server
```

### Common Tasks You Might Need

#### Add New Table Integration
1. Get table ID from Airtable URL
2. Add constant: `const NEW_TABLE_ID = 'tbl...'`
3. Create fetch function with filterByFormula
4. Handle linked records as arrays

#### Add New User Role
1. Update `managementEmails` array in dashboard.html
2. Add role check in relevant pages
3. Consider Airtable field updates

#### Fix Date Issues
1. Check timezone handling (use formatLocalDate)
2. Verify year context (2025)
3. Test filter formulas with DATESTR

#### Debug Airtable Filtering
1. Start with fetch all records
2. Log the response structure
3. Filter client-side first
4. Optimize with filterByFormula if possible

### Testing Checklist
- [ ] Login with Test Staff account
- [ ] Check staff availability displays
- [ ] Create allocation
- [ ] Verify in My Schedule
- [ ] Test booking assignment
- [ ] Check date calculations
- [ ] Verify mobile responsiveness

### Known Issues
1. API key exposed in client (needs backend)
2. No offline support
3. Limited error recovery
4. No real-time updates
5. Manual page refreshes needed

### Recommended Next Steps
1. Implement backend API for Airtable
2. Add WebSocket for real-time updates
3. Implement service worker for offline
4. Add comprehensive error handling
5. Create automated tests

---

## Quick Reference

### Airtable Table IDs
```javascript
const EMPLOYEE_TABLE_ID = 'tblTJrOT3WD0hrLAW';
const ROSTER_TABLE_ID = 'tblwwK1jWGxnfuzAN';
const BOOKINGS_TABLE_ID = 'tblcBoyuVsbB1dt1I';
const ALLOCATIONS_TABLE_ID = 'tbl22YKtQXZtDFtEX';
```

### Common Patterns
```javascript
// Employee lookup
filterByFormula={Email}='${email}'

// Date filtering
DATESTR({Date})='2025-08-20'

// Linked record search
SEARCH('${id}', {Field}&'')

// Client-side filter
records.filter(r => r.fields['Employee']?.includes(id))
```

### Debug Commands
```javascript
// Check all allocations
console.log('All records:', await fetchAllAllocations());

// Test employee lookup
console.log('Employee:', await findEmployeeByEmail('test@example.com'));

// Verify date formatting
console.log('Formatted:', formatLocalDate(new Date()));
```

---

*Last Updated: August 2025*
*Version: 2.0*
*Status: Production with known limitations*
