# View Toggle Feature - Management Dashboard

## Overview
Management users can now seamlessly switch between the Employee View (regular dashboard) and Manager View (management dashboard) using an intuitive toggle switch.

## How It Works

### For Management Users

#### Automatic Redirect
When a management user logs in:
1. They are automatically redirected to the Management Dashboard
2. This provides immediate access to all management tools

#### Switching to Employee View
To see what regular staff see:
1. Click the toggle switch in the header (shows "Employee" and "Manager" options)
2. Toggle to "Employee" to view the regular dashboard
3. The URL will show `dashboard.html?view=regular`
4. The Staff Allocation button will be visible (for management users only)

#### Switching Back to Manager View
From the employee view:
1. Click the toggle switch in the header
2. Toggle to "Manager" to return to the Management Dashboard
3. Or click the "Staff Allocation" button which also leads to management tools

### Visual Indicators

#### On Management Dashboard
- Toggle shows **Manager** selected (slider on right, red background)
- White slider on red background indicates management mode

#### On Regular Dashboard (for management users)
- Toggle shows **Employee** selected (slider on left)
- Toggle is only visible to management users
- Staff Allocation button visible as additional management access point

## Technical Implementation

### URL Parameters
- `dashboard.html` - Regular dashboard, redirects management users
- `dashboard.html?view=regular` - Forces regular view for management users
- `management-dashboard.html` - Management dashboard

### Authentication Check Flow
```javascript
// In dashboard.html
if (isManagementUser) {
    if (urlParam !== 'view=regular') {
        redirect to management-dashboard.html
    } else {
        show regular dashboard with toggle
    }
}
```

### Management User List
Current management emails:
- `harry@priceoffice.com.au`
- `mmckelvey03@gmail.com`
- Any email ending with `@mbh.com`
- Additional emails can be added to the `managementEmails` array

## User Experience

### Benefits
1. **No Redirect Loop**: The view parameter prevents infinite redirects
2. **Easy Testing**: Management can easily see the employee experience
3. **Quick Switching**: One-click toggle between views
4. **Visual Clarity**: Clear indication of current view mode
5. **Persistent Choice**: View choice is maintained until explicitly changed

### Use Cases
- **Quality Assurance**: Check how features appear to regular staff
- **Training**: Demonstrate both views during staff training
- **Support**: Troubleshoot issues from the employee perspective
- **Development**: Test features in both contexts

## Security
- Only management users see the toggle
- Regular staff cannot access management dashboard
- Server-side validation should be implemented for production
- View parameter doesn't bypass authentication

## Future Enhancements
1. **Remember Preference**: Store last used view in localStorage
2. **Role-Based Features**: Show different features based on sub-roles
3. **Animated Transition**: Smooth visual transition between views
4. **Keyboard Shortcut**: Add Alt+V to toggle views quickly

---

*Last Updated: [Current Date]*
*Version: 1.0*
