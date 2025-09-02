# Tab Navigation Context - Management Dashboard

## Overview
The management dashboard now supports URL parameters to maintain navigation context when users navigate between pages. This ensures users return to the correct tab when using "Back to Dashboard" buttons.

## Implementation

### URL Parameter Support
The management dashboard accepts a `tab` parameter in the URL:
- `management-dashboard.html?tab=overview` - Opens Overview tab
- `management-dashboard.html?tab=staff` - Opens Staff Management tab  
- `management-dashboard.html?tab=vessels` - Opens Vessel Maintenance tab
- `management-dashboard.html?tab=announcements` - Opens Announcements tab

### How It Works

1. **Management Dashboard** (`management-dashboard.html`):
   ```javascript
   // Check for tab parameter in URL
   const urlParams = new URLSearchParams(window.location.search);
   const tabParam = urlParams.get('tab');
   if (tabParam && ['overview', 'staff', 'vessels', 'announcements'].includes(tabParam)) {
       // Switch to specified tab
       switchTab(tabParam);
   } else {
       // Load initial data for overview
       loadOverviewData();
   }
   ```

2. **Back Navigation Links**:
   - Employee Directory: `<a href="management-dashboard.html?tab=staff">`
   - Staff Allocation: `onclick="window.location.href='management-dashboard.html?tab=staff'"`

## Pages Updated

### From Staff Management Tab
1. **Employee Directory** (`employee-directory.html`)
   - Back button redirects to: `management-dashboard.html?tab=staff`
   
2. **Staff Allocation Dashboard** (`management-allocations.html`)
   - Dashboard button redirects to: `management-dashboard.html?tab=staff`

## Usage Guidelines

### When Adding New Pages
If you add a new page that's accessed from a specific tab:

1. **Identify the source tab** where the link originates
2. **Update the back/dashboard button** to include the tab parameter:
   ```html
   <a href="management-dashboard.html?tab=TABNAME" class="btn">
       <i class="fas fa-arrow-left"></i> Back to Dashboard
   </a>
   ```

3. **Valid tab values**:
   - `overview` - Overview/Home tab
   - `staff` - Staff Management tab
   - `vessels` - Vessel Maintenance tab
   - `announcements` - Announcements tab

### Benefits
- **Improved UX**: Users return to where they started
- **Context Preservation**: Navigation flow feels more natural
- **Reduced Clicks**: Users don't need to re-navigate to their working tab

## Examples

### User Flow Example
1. User is on Management Dashboard → Staff Management tab
2. Clicks "Employee Directory" 
3. Views/edits employee information
4. Clicks "Back to Dashboard"
5. Returns to Management Dashboard with Staff Management tab active ✓

### Without This Feature
1. User is on Management Dashboard → Staff Management tab
2. Clicks "Employee Directory"
3. Views/edits employee information  
4. Clicks "Back to Dashboard"
5. Returns to Management Dashboard → Overview tab ✗
6. Must manually click Staff Management tab again

## Future Enhancements
1. **Breadcrumb Navigation**: Show full navigation path
2. **Session Storage**: Remember last active tab across sessions
3. **Deep Linking**: Support for specific records/views within tabs
4. **Mobile Support**: Swipe gestures for tab navigation

---

*Created: Sep 2, 2025*  
*Version: 1.0*
