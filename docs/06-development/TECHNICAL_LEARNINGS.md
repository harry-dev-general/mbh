# Technical Learnings & Quick Reference

## 🔑 Key Configuration Steps

### Supabase Email Verification Setup
1. **Site URL** must match your dev server (e.g., `http://localhost:8000`)
2. **Redirect URLs** must include your callback URL
3. Create `auth-callback.html` to handle tokens from URL hash

### Airtable Employee Linking
```javascript
// The magic formula for finding employees by email
`filterByFormula={Email}='${email}'`

// Linked records must be arrays
"Employee": [employeeRecordId]  // ✓ Correct
"Employee": employeeRecordId    // ✗ Wrong
```

## 🐛 Common Pitfalls & Solutions

### 1. Navigation Links Not Working
**Problem**: `preventDefault()` on all nav links
```javascript
// ❌ Bad - blocks all navigation
document.querySelectorAll('.nav a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();  // Blocks everything!
    });
});

// ✅ Good - only for anchor links
if (href && href.startsWith('#')) {
    e.preventDefault();
}
```

### 2. Email Verification Redirects to Wrong Port
**Fix**: Update Supabase Dashboard → Authentication → URL Configuration → Site URL

### 3. Airtable Time Format
**Convert 24h to 12h**:
```javascript
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}
```

## 📊 Data Flow

```
User Login (Supabase) 
    ↓
Email Lookup (Airtable Employee Table)
    ↓
Get Employee Record ID
    ↓
Submit Availability (Linked to Employee)
    ↓
Status: "Pending" → Manager Review
```

## 🔒 Security Notes

1. **Supabase Anon Key**: Safe for client-side (public by design)
2. **Airtable API Key**: Should be server-side in production
3. **Email Verification**: Required for new accounts
4. **Session Management**: Handled automatically by Supabase

## 📁 Project Structure
```
mbh-staff-portal/
├── training/
│   ├── auth.html              # Login/signup
│   ├── auth-callback.html     # Email verification handler
│   ├── availability.html      # Weekly submission form
│   ├── index.html            # Main portal (protected)
│   └── test-*.html           # Testing utilities
└── docs/
    └── [All documentation]
```

## 🚀 Quick Commands

**Start Development Server**:
```bash
cd mbh-staff-portal/training
python3 -m http.server 8000
```

**Test URLs**:
- Main Portal: http://localhost:8000/
- Auth Test: http://localhost:8000/test-auth.html
- Employee Lookup: http://localhost:8000/test-employee-lookup.html

## ⚡ Performance Tips

1. Cache employee lookups to reduce API calls
2. Debounce form submissions to prevent duplicates
3. Show loading states for better UX
4. Validate client-side before API calls

## 🚢 Boat Type Conditional Fields (November 2025)

### Key Learning: SSR vs Client-Side
**Problem**: SMS links use server-rendered versions (`*-ssr.html`), not client-side HTML files.
```javascript
// Client-side changes in .html files won't affect SMS links!
// Must update api/checklist-renderer.js for SSR
```

### Airtable Single-Select Field Constraints
**Problem**: Cannot submit values not in predefined options
```javascript
// ❌ Bad - Airtable rejects "N/A"
'Gas Bottle Check': data.gasLevel === 'N/A' ? 'N/A' : data.gasLevel

// ✅ Good - Omit field entirely
...(data.gasLevel && data.gasLevel !== 'N/A' ? {'Gas Bottle Check': data.gasLevel} : {})
```

### Conditional Field Pattern
```javascript
// Effective pattern for optional Airtable fields
const fields = {
    'Required Field': value,
    // Conditionally include optional fields
    ...(isBBQBoat ? {
        'Gas Bottle Check': data.gasLevel,
        'Water Tank Level': data.waterLevel
    } : {}),
    // Handle undefined checkbox fields
    ...(data.bbqCleaned !== undefined ? {'BBQ Cleaned': data.bbqCleaned || false} : {})
};
```

### Boat Type Detection
```javascript
const BBQ_BOAT_TYPES = ['8 Person BBQ Boat', '12 Person BBQ Boat'];
const isBBQBoat = BBQ_BOAT_TYPES.includes(boat?.fields?.['Boat Type']);
```

---
*Quick reference for MBH Staff Portal development* 