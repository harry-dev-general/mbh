# MBH Staff Portal - Technical Infrastructure Summary (2025)

## LLM Context Prompt
```
You are working on the MBH Staff Portal, a production boat rental management system.
Location: /Users/harryprice/kursol-projects/mbh-staff-portal/
Production URL: https://mbh-production-f0d1.up.railway.app
GitHub: https://github.com/harry-dev-general/mbh (branch: main)

CRITICAL: This system uses vanilla HTML/CSS/JavaScript with direct Airtable API calls.
No React/Vue/Angular frameworks. All data operations are client-side with exposed API keys.
```

## 🏗️ System Architecture Overview

### Technology Stack
```yaml
Frontend:
  - Technology: Vanilla HTML/CSS/JavaScript
  - Authentication: Supabase (etkugeooigiwahikrmzr)
  - Styling: Inline CSS, no frameworks
  - Libraries: None (pure JavaScript)

Backend:
  - Server: Express.js (Node.js)
  - Port: 8080 (Railway requirement)
  - Deployment: Railway (auto-deploy from GitHub)
  - SMS: Twilio API
  - Database: Airtable (direct API calls)

Data Storage:
  - Primary: Airtable (Base: applkAFOn2qxtu7tx)
  - Authentication: Supabase PostgreSQL
  - Session: Browser localStorage
  - Tokens: Server memory (temporary)
```

## 📊 Airtable Data Infrastructure

### Base: MBH Bookings Operation (`applkAFOn2qxtu7tx`)

#### 1. Shift Allocations Table (`tbl22YKtQXZtDFtEX`)
**Purpose**: Stores all staff shift assignments and responses
```javascript
Fields:
├── Name (fld3KXeMXQgxl2TlX) - Primary key
├── Employee (fldBeJLV9opsmGyxo) - Linked to Employee Details
├── Shift Date (fld1MEVKPnIAgYLk1) - Date field
├── Start Time (fldGSJ1Zr1IsL3n0K) - Text (HH:MM format)
├── End Time (fldG3ejHJkA2E9wDI) - Text (HH:MM format)
├── Duration (fld12cVaNAEAzxbxu) - Formula field
├── Shift Type (fldoGILMCLFeX93SL) - Single select
├── Shift Status (fldceNcZL87yGZ15v) - Single select
├── Booking (fldU1zAJYqa2XnckA) - Linked to Bookings Dashboard
├── Customer Name (fldHkJw2arNNSDXJ5) - Lookup from Booking
├── Role (fldmuc9X2B0vTdegp) - Single select [Onboarding/Deloading/Support]
├── Response Status (fldoBaSIBDccJYEX2) - Text [Pending/Accepted/Declined]
├── Response Date (fldtodgfNEIvL6LYv) - DateTime
└── Response Method (fldHSEo1sDHB89Lkf) - Text [SMS Link/Portal/Manual]
```

#### 2. Bookings Dashboard Table (`tblRe0cDmK3bG2kPf`)
**Purpose**: Customer bookings with staff assignments
```javascript
Key Fields:
├── Customer Name (fldOkgdq7lsyGaIe0)
├── Booking Date (fldBQ4OxkYiVKnLhQ)
├── Start Time (fldau7A3iD5JRbPft) - Can be "09:00 am" or "09:00"
├── Finish Time (fldw5ypehkBk5bzUV)
├── Status (fldinc7O9XSR5t0az) - Must check for 'PAID' or 'PART'
├── Onboarding Time (fldQUSViuol9OYS5G) - Formula (READ-ONLY)
├── Deloading Time (fldJbXhkykaqNrTA4) - Formula (READ-ONLY)
├── Onboarding Employee (fld2sMrEDDPat22Nv) - Linked array
├── Deloading Employee (fldJ7reYmNeO8eT7Q) - Linked array
├── Onboarding Response (fldlBrF2QIg4Pujxz) - Single select [NEW]
├── Deloading Response (fldLNHWgHl6bNa903) - Single select [NEW]
└── Shift Allocations (fldrVLG8zWkcyYReQ) - Linked records
```

#### 3. Employee Details Table (`tbltAE4NlNePvnkpY`)
**Purpose**: Staff information and contact details
```javascript
Fields:
├── Name (fldYEMNgdzKGnuQaJ)
├── Mobile Number (fldT4n24LYPrLU54j) - Phone field for SMS
├── Email (fldsC2ttcvzTHnTAN) - Used for auth matching
├── Roster (fldNOK2iCEJ8b3ds8) - Linked to Roster
├── Shift Allocations (fldRcUcxXCGml6eUT) - Linked records
└── Bookings Dashboard (fldV9vR9RDpIq0DOp) - Linked bookings
```

#### 4. Roster Table (`tblwwK1jWGxnfuzAN`)
**Purpose**: Staff availability and scheduling
```javascript
Fields:
├── Employee (fld2ZYbreTXdUOlVK) - Linked to Employee Details
├── Date (fldULOnO1QCoJsWDV) - Specific date
├── Week Starting (fldvAcL7DjbGOmvZB) - Week identifier
├── Available From (fldnR9xbkp0nWIVkv) - Time
├── Available Until (fldnjcWN4zRO78D7B) - Time
└── Availability Status (fldmMCNdedcLfEkHO) - Active/Inactive
```

## 🎯 Implemented Features & Data Flow

### 1. Dashboard Role-Based Content
**Files**: `/training/dashboard.html`
**Data Flow**:
```mermaid
Supabase Auth → Email → Employee Details (Email match)
                  ↓
            Check Management List
                  ↓
    Management? → Show Fleet Status
    Staff? → Show Pending Allocations
                  ↓
         Fetch from Shift Allocations
         Fetch from Bookings Dashboard
                  ↓
         Display with Accept/Decline
```

**Key Implementation**:
```javascript
// Management detection
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com',
    'manager@mbh.com'
];
isManagement = managementEmails.includes(user.email.toLowerCase());

// Dual data source for staff allocations
const [generalAllocations, bookingAllocations] = await Promise.all([
    loadGeneralAllocations(), // From Shift Allocations
    loadBookingAllocations()  // From Bookings Dashboard
]);
```

### 2. Shift Response System (Calendar & Dashboard)
**Files**: `/training/my-schedule.html`, `/training/dashboard.html`
**Airtable Updates**:

#### For General Shifts:
```javascript
// Updates Shift Allocations table
PATCH /v0/{BASE_ID}/tbl22YKtQXZtDFtEX/{recordId}
{
    fields: {
        'Response Status': 'Accepted'|'Declined',
        'Response Date': new Date().toISOString(),
        'Response Method': 'Portal'
    }
}
```

#### For Booking Allocations:
```javascript
// Updates Bookings Dashboard table
PATCH /v0/{BASE_ID}/tblRe0cDmK3bG2kPf/{bookingId}
{
    fields: {
        'Onboarding Response': 'Accepted'|'Declined', // If onboarding role
        'Deloading Response': 'Accepted'|'Declined'    // If deloading role
    }
}
```

### 3. Visual Status Management
**Status Flow**:
```
Initial → Pending (Yellow #fff9e6)
   ↓
Accept → Accepted (Green #e8f5e9)
   OR
Decline → Declined (Red #ffebee)
```

**Modal Implementation**:
```javascript
// Key functions in my-schedule.html
showShiftDetails(shiftId) - Opens modal with shift info
toggleStatusChange(shiftId) - Shows/hides response options
handleModalShiftResponse(shiftId, action) - Processes response
```

## 🔐 Security & Authentication

### Current State (CRITICAL for LLM understanding)
```yaml
Security Issues:
  - Airtable API Key: EXPOSED in client-side code
  - No server-side validation: Direct Airtable calls from browser
  - Session management: Supabase only, not integrated with Airtable
  
Authentication Flow:
  1. User logs in via Supabase
  2. Email matched against Employee Details table
  3. Employee record ID stored in memory
  4. All subsequent operations use this ID
```

### Environment Variables (Railway)
```env
# Required for server
PORT=8080
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=[public key]
AIRTABLE_API_KEY=patYiJdXfvcSenMU4.[rest of key]
BASE_URL=https://mbh-production-f0d1.up.railway.app

# SMS System (if implemented)
TWILIO_ACCOUNT_SID=[if using SMS]
TWILIO_AUTH_TOKEN=[if using SMS]
TWILIO_FROM_NUMBER=[if using SMS]
```

## ⚠️ Critical Implementation Patterns

### 1. Airtable API Quirks
```javascript
// ALWAYS check multiple field names
const phone = employee['Phone'] || 
              employee['Mobile'] || 
              employee['Mobile Number'];

// Linked records MUST be arrays
fields: { 'Employee': [employeeId] } // NOT employeeId

// Time formats vary - always parse
"09:00 am" vs "9:00 AM" vs "09:00" // All possible

// Formula fields are READ-ONLY
// Cannot write to: Onboarding Time, Deloading Time
```

### 2. Date/Time Handling
```javascript
// NEVER use toISOString() for dates (timezone issues)
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Always set to noon to avoid date shifts
let today = new Date();
today.setHours(12, 0, 0, 0);
```

### 3. Client-Side Filtering Pattern
```javascript
// Airtable filterByFormula unreliable for arrays
// ALWAYS fetch all and filter client-side
const allRecords = await fetchAll();
const filtered = allRecords.filter(record => {
    const employees = record.fields['Employee'] || [];
    return employees.includes(employeeId);
});
```

### 4. Response Handling Pattern
```javascript
// Check if it's a booking allocation
const isBookingAllocation = allocationId.includes('-onboarding') || 
                           allocationId.includes('-deloading');

if (isBookingAllocation) {
    // Parse allocation ID: "bookingId-role"
    const [bookingId, role] = allocationId.split('-');
    const fieldName = role === 'onboarding' 
        ? 'Onboarding Response' 
        : 'Deloading Response';
    // Update Bookings Dashboard
} else {
    // Update Shift Allocations table
}
```

## 📁 Key Files Reference

### Core UI Files
```
/training/
├── dashboard.html         # Main hub with role-based content
├── my-schedule.html      # Personal schedule with response modal
├── management-allocations.html # Management allocation dashboard
├── auth.html            # Login/signup
└── shift-confirmation.html # Standalone SMS response page
```

### Server Components
```
/
├── server.js            # Express server with routing
├── api/
│   ├── notifications.js # Twilio SMS service
│   └── shift-response-handler.js # Magic link processing
```

### Critical Functions by File

#### dashboard.html
- `loadDynamicCard()` - Determines user role and content
- `loadPendingAllocations()` - Fetches pending shifts
- `handleAllocationResponse()` - Quick accept/decline

#### my-schedule.html
- `loadGeneralAllocations()` - Shift Allocations table
- `loadBookingAllocations()` - Bookings Dashboard table
- `showShiftDetails()` - Modal display
- `handleModalShiftResponse()` - Process responses

## 🚨 Common Issues & Solutions

### Issue: Bookings not showing
```javascript
// Check: Date not hardcoded
new Date() // NOT new Date('2025-08-20')

// Check: Status filtering
status === 'PAID' || status === 'PART'

// Check: pageSize
pageSize=100 // Default is 20, may miss records
```

### Issue: Response not updating
```javascript
// Verify field exists in Airtable
// For bookings: Onboarding Response, Deloading Response
// For shifts: Response Status, Response Date, Response Method

// Check linked record format
[employeeId] // Must be array
```

### Issue: Phone/Mobile field variations
```javascript
// Always check all variations
const phone = record['Phone'] || 
              record['Mobile'] || 
              record['Mobile Number'];
```

## 🔄 Data Synchronization

### Current Implementation
- **No real-time sync** - Manual refresh required
- **Client-side operations** - Direct Airtable API calls
- **No caching** - Fresh fetch on each load
- **Rate limiting risk** - 5 req/sec shared limit

### Data Flow Patterns
```
User Action → Browser JS → Airtable API → Update UI
                ↓
        Supabase (auth only)
```

## 📈 Performance Considerations

### Current Limitations
1. **API Key Exposure** - Security risk
2. **No Pagination** - Fetches all records
3. **No Caching** - Repeated API calls
4. **Client Processing** - Heavy filtering in browser

### Optimization Opportunities
```javascript
// Future: Move to server-side
app.post('/api/allocations', authenticate, async (req, res) => {
    // Server-side Airtable operations
    // Hidden API key
    // Response caching
    // Rate limiting protection
});
```

## 🎯 Testing Checklist for Features

### Dashboard Pending Allocations
- [ ] Login as non-management staff
- [ ] Verify "Pending Shift Responses" card appears
- [ ] Check both shift and booking allocations display
- [ ] Test Accept button updates Airtable
- [ ] Test Decline button updates Airtable
- [ ] Verify animations and removal after response

### My Schedule Response Modal
- [ ] Click shift to open modal
- [ ] Verify details display correctly
- [ ] Click status badge to show options
- [ ] Test Accept/Decline updates
- [ ] Check calendar refreshes with new colors
- [ ] Verify status icons (✅❌⏳)

### Management vs Staff Views
- [ ] Management sees Fleet Status
- [ ] Staff sees Pending Allocations
- [ ] Management button visible for authorized emails

## 🚀 Deployment & Maintenance

### Deployment Process
```bash
git add -A
git commit -m "feat: description"
git push origin main
# Railway auto-deploys in ~2 minutes
```

### Monitoring Points
- Railway logs for server errors
- Browser console for API errors
- Airtable API usage dashboard
- Supabase auth logs

## 📝 LLM Development Guidelines

### When Working on This System:
1. **Always verify table/field IDs** - Never assume, always check
2. **Use client-side filtering** - Don't trust filterByFormula
3. **Handle time format variations** - Multiple formats exist
4. **Check for field existence** - Airtable omits null fields
5. **Test with actual data** - Mock data often differs
6. **Preserve vanilla JS** - No frameworks or libraries
7. **Maintain Railway compatibility** - Port 8080, env vars

### Code Pattern to Follow:
```javascript
// 1. Fetch with generous pageSize
const response = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }}
);

// 2. Handle response carefully
const data = await response.json();
if (!response.ok) {
    console.error('Airtable error:', data);
    return [];
}

// 3. Filter client-side
const filtered = (data.records || []).filter(record => {
    // Your filtering logic
    // Check for field existence
    // Handle variations
});

// 4. Process with defensive coding
filtered.forEach(record => {
    const field = record.fields['FieldName'] || defaultValue;
    // Process safely
});
```

## 🔮 Future Architecture Recommendations

### Immediate Security Fixes Needed
1. Move Airtable operations to server
2. Implement proper API authentication
3. Add request validation
4. Hide API keys

### Scalability Improvements
1. Add Redis for caching
2. Implement WebSocket for real-time
3. Add pagination for large datasets
4. Create API rate limiting

### Maintenance Improvements
1. Add comprehensive logging
2. Implement error tracking (Sentry)
3. Add automated testing
4. Create staging environment

---

**Document Version**: 1.0
**Last Updated**: January 2025
**System Status**: Production (with security concerns)
**Primary Maintainer**: Via Railway deployment

## Quick Debug Commands for LLM

```javascript
// In browser console to check state:
console.log('Employee ID:', employeeRecordId);
console.log('Is Management:', isManagement);
console.log('Current Week:', currentWeekStart);
console.log('Allocations:', myAllocations);

// Force refresh:
await loadPendingAllocations();
displayPendingAllocations([]);

// Check Airtable connection:
fetch(`https://api.airtable.com/v0/${BASE_ID}/${ALLOCATIONS_TABLE_ID}?maxRecords=1`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
}).then(r => r.json()).then(console.log);
```
