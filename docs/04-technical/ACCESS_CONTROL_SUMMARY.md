# Access Control Summary - MBH Staff Portal

## Dashboard Access Levels

### Regular Employees
When regular staff members log in, they see:
- **Dashboard**: Regular employee dashboard
- **Features Available**:
  - Weekly Availability submission
  - Booking Calendar view  
  - Employee Information updates
  - Roster viewing
  - Vessel Checklists
- **Features NOT Available**:
  - ❌ Staff Allocation button (hidden)
  - ❌ View toggle switch (hidden)
  - ❌ Management Dashboard access

### Management Users
When management users log in, they are redirected to:
- **Default View**: Management Dashboard (automatic redirect)
- **Features Available**:
  - ✅ Full Management Dashboard
  - ✅ Staff Management
  - ✅ Vessel Maintenance tracking
  - ✅ Announcements system
  - ✅ Reports and Analytics
  - ✅ View toggle switch (can switch to employee view)

### Management Users in Employee View
When management users switch to Employee View (`dashboard.html?view=regular`):
- **Dashboard**: Regular employee dashboard
- **Special Features**:
  - ✅ Staff Allocation button (RED, visible only to management)
  - ✅ View toggle switch (can switch back to management)
  - ✅ All regular employee features
- **Purpose**: See what employees see while maintaining quick access to management tools

## Security Implementation

### Client-Side Checks
```javascript
// Management email list
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com',
    'manager@mbh.com',
    'admin@mbh.com',
    'operations@mbh.com'
];

// Access control logic
if (isManagementUser) {
    // Show management features
    showStaffAllocationButton();
    showViewToggle();
} else {
    // Explicitly hide management features
    hideStaffAllocationButton();
    hideViewToggle();
}
```

### Visual Indicators
- **Staff Allocation Button**: Red gradient background, only for management
- **View Toggle**: Shows current view mode, only for management
- **Management Dashboard**: Red theme indicating administrative access

## Important Notes

1. **Regular Employees NEVER See**:
   - Staff Allocation button
   - View toggle switch
   - Management dashboard

2. **Management Users ALWAYS Have Access To**:
   - Management dashboard (default)
   - Employee view (optional)
   - Toggle between views

3. **Security Considerations**:
   - Current implementation is client-side
   - Production should add server-side validation
   - API endpoints should verify user roles

## Testing Access Levels

### Test as Regular Employee
1. Log in with a non-management email
2. Verify: No Staff Allocation button
3. Verify: No view toggle
4. Verify: Cannot access management-dashboard.html

### Test as Management User
1. Log in with management email
2. Verify: Auto-redirect to management dashboard
3. Toggle to employee view
4. Verify: Staff Allocation button visible
5. Verify: View toggle visible
6. Toggle back to management
7. Verify: Returns to management dashboard

---

*Last Updated: [Current Date]*
*Version: 1.0*
