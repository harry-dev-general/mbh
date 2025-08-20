# MBH Staff Portal - Troubleshooting Guide

## 🔍 Quick Diagnostics

### System Not Loading?
1. Check Railway deployment status
2. Verify environment variables are set
3. Check browser console for errors
4. Clear cache and cookies

### Can't Log In?
1. Email must exist in Airtable Employee Details
2. Check exact email match (case-sensitive)
3. Verify email confirmation completed
4. Check Supabase auth logs

## 🐛 Common Issues & Solutions

### Issue: "No Employee Record Found"
**Symptoms**: User can log in but gets employee error  
**Cause**: Email mismatch between Supabase and Airtable  

**Solution**:
1. Check exact email in Airtable Employee Details table
2. Ensure no trailing spaces
3. Verify case matches exactly

**Debug Code**:
```javascript
// Add to any page to debug
console.log('Supabase email:', user.email);
console.log('Searching Airtable for:', email);
```

---

### Issue: Staff Schedule Shows Empty
**Symptoms**: Staff member sees no allocations despite having them  
**Cause**: Employee ID filtering not working  

**Solution**:
1. Check console for employee ID
2. Verify allocations have correct Employee field
3. Use client-side filtering approach

**Debug Code**:
```javascript
// Check what's being fetched
const all = await fetch(`/api/allocations`);
console.log('All allocations:', await all.json());
console.log('My ID:', employeeRecordId);
```

---

### Issue: Dates Showing Wrong Year
**Symptoms**: Dates display as 2024 instead of 2025  
**Cause**: JavaScript defaults to current year  

**Solution**:
```javascript
// Force to 2025
let today = new Date();
today.setFullYear(2025);
today.setMonth(7); // August
today.setDate(20);
```

---

### Issue: Day Shifts in Dates (Off by One Day)
**Symptoms**: Aug 20 shows as Aug 19  
**Cause**: `toISOString()` converts to UTC  

**Solution**:
```javascript
// Use local date formatter
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Don't use
date.toISOString().split('T')[0] // ❌ Causes timezone shift

// Do use
formatLocalDate(date) // ✅ Maintains local date
```

---

### Issue: Allocations Not Visible on Calendar
**Symptoms**: Created allocations don't appear on grid  
**Cause**: Rendering function not called or incorrect  

**Solution**:
1. Check `renderAllocations()` is called after loading
2. Verify allocation date matches current week
3. Check console for rendering logs

**Debug Code**:
```javascript
console.log('Allocations to render:', allocations);
console.log('Current week:', currentWeekStart);
```

---

### Issue: Staff Availability Not Showing
**Symptoms**: Management can't see who's available  
**Cause**: Roster data structure inconsistency  

**Solution**:
```javascript
// Check both Week Starting and Date fields
const available = roster.filter(r => {
    if (r.fields['Week Starting'] === weekString) return true;
    if (r.fields['Date'] && isInWeek(r.fields['Date'])) return true;
    return false;
});
```

---

### Issue: Airtable 422 Error on Submit
**Symptoms**: Form submission fails with 422 error  
**Cause**: Field values don't match Airtable schema  

**Solution**:
1. Log exact payload being sent
2. Compare with Airtable field configuration
3. Ensure select options match exactly

**Debug Code**:
```javascript
console.log('Payload:', JSON.stringify(formData, null, 2));
// Compare with Airtable single-select options
```

**Common Mismatches**:
- "General" → "General Operations"
- "Booking" → "Booking Specific"
- Missing required fields

---

### Issue: Clicking Booking Doesn't Open Modal
**Symptoms**: Booking blocks on calendar not interactive  
**Cause**: Event listener not attached or event bubbling  

**Solution**:
```javascript
// Ensure event delegation
document.addEventListener('click', (e) => {
    if (e.target.closest('.booking-block')) {
        const bookingId = e.target.closest('.booking-block').dataset.bookingId;
        openBookingAllocationModal(bookingId);
    }
});
```

---

### Issue: Hours Showing as Whole Numbers
**Symptoms**: Shows "7 hours" instead of "7h 47min"  
**Cause**: Not calculating minutes  

**Solution**:
```javascript
function calculateDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return hours > 0 && minutes > 0 ? `${hours}h ${minutes}min` :
           hours > 0 ? `${hours}h` : `${minutes}min`;
}
```

---

### Issue: Navigation Links Not Working
**Symptoms**: Clicking links doesn't navigate  
**Cause**: preventDefault() on all links  

**Solution**:
```javascript
// Only prevent default for anchor links
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            // Handle anchor scroll
        }
        // Let other links work normally
    });
});
```

---

### Issue: Duplicate Allocations Created
**Symptoms**: Single click creates multiple records  
**Cause**: No debouncing on form submission  

**Solution**:
```javascript
let isSubmitting = false;

async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';
    
    try {
        await createAllocation(formData);
    } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Create Allocation';
    }
}
```

## 🛠️ Debug Tools

### Browser Console Commands

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check employee record
const emp = await findEmployeeByEmail(user.email);
console.log('Employee:', emp);

// Check all allocations
const allocs = await fetch(`${AIRTABLE_BASE}/Shift%20Allocations`);
console.log('All allocations:', await allocs.json());

// Check current week
console.log('Week start:', currentWeekStart);
console.log('Week start string:', formatLocalDate(currentWeekStart));

// Force reload data
await loadStaffAvailability();
await loadAllocations();
await renderScheduleGrid();
```

### Airtable Checks

1. **Verify Table IDs**:
   - Go to Airtable table
   - Check URL for table ID
   - Ensure matches code

2. **Check Field Names**:
   - Exact case matching required
   - No trailing spaces
   - Special characters must match

3. **Verify Linked Records**:
   - Must be arrays `[id]`
   - Check both directions of link

### Railway Deployment

```bash
# Check deployment logs
railway logs

# Restart service
railway restart

# Check environment variables
railway variables
```

## 📞 Escalation Path

### Level 1: Browser Issues
1. Clear cache and cookies
2. Try incognito/private mode
3. Try different browser
4. Check console for errors

### Level 2: Data Issues
1. Verify Airtable data
2. Check field configurations
3. Test with different user
4. Review recent changes

### Level 3: System Issues
1. Check Railway status
2. Verify Supabase status
3. Check Airtable API status
4. Review deployment logs

### Level 4: Code Issues
1. Check recent commits
2. Review error logs
3. Add debug logging
4. Test locally

## 🔑 Quick Fixes

### Reset User Session
```javascript
// In browser console
await supabase.auth.signOut();
localStorage.clear();
location.reload();
```

### Force Data Refresh
```javascript
// Clear cached data
cachedEmployeeData = null;
rosterData = [];
allocations = [];
await initializePage();
```

### Emergency Rollback
```bash
# If deployment breaks
git revert HEAD
git push origin main
# Railway auto-deploys previous version
```

## 📋 Diagnostic Checklist

When user reports issue:

- [ ] Get exact error message
- [ ] Check browser console
- [ ] Note user email
- [ ] Check time of occurrence
- [ ] Verify user exists in Airtable
- [ ] Check for recent deployments
- [ ] Test with your account
- [ ] Review Railway logs
- [ ] Check Airtable audit log
- [ ] Test locally if needed

---

**Last Updated**: August 20, 2025  
**Version**: 1.0  
**For**: MBH Staff Portal v2.0
