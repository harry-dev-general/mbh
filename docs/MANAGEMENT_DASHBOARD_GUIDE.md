# Management Dashboard - Comprehensive Guide

## Overview
A dedicated management dashboard for MBH administrators and managers, providing a centralized hub for all operational oversight and control functions.

## Access Control

### Who Has Access
Management access is granted to users with emails in the approved list:
- `harry@priceoffice.com.au`
- `mmckelvey03@gmail.com`
- Any email ending in `@mbh.com`
- Additional emails can be added to the `managementEmails` array

### Automatic Redirection
When a management user logs into the system:
1. They are automatically redirected from `dashboard.html` to `management-dashboard.html`
2. Non-management users remain on the regular dashboard
3. Management users can switch to "Regular View" if needed

## Dashboard Features

### 1. Overview Tab (Default)
The main landing page showing:

#### Key Metrics
- **Today's Bookings**: Total confirmed bookings for the current day
- **Staff on Duty**: Number of unique staff members allocated today
- **Vessels Active**: Number of vessels currently in operation
- **Pending Issues**: Count of unresolved maintenance or operational issues

#### Quick Action Cards
Interactive cards providing one-click access to:
- **Staff Allocation**: Direct link to `management-allocations.html`
  - Shows unallocated shifts count
  - Today's total allocations
- **Vessel Status**: Quick view of maintenance status
  - Pending checklists count
  - Due maintenance items
- **Post Announcement**: Access to announcement system
  - Active announcements count
  - Last posted timestamp
- **View Reports**: Analytics dashboard
  - Week's revenue
  - Fleet utilization rate

### 2. Staff Management Tab
Comprehensive staff oversight including:

#### Features
- **Weekly Schedule**: Link to allocation management page
- **Employee Directory**: Manage employee records and contact information
- **Roster Planning**: Plan future rosters and manage availability
- **Real-time Staff Status**: See who's on duty, available, or off

#### Key Capabilities
- View all staff allocations at a glance
- Reassign shifts instantly
- Track staff performance metrics
- Manage leave requests and availability

### 3. Vessel Maintenance Tab
Complete vessel management system showing:

#### Vessel Cards
Each vessel displays:
- **Vessel Name & Status**:
  - Operational (Green)
  - Maintenance (Orange)
  - Issue (Red)
- **Checklist Status**:
  - Pre-Departure Checklist completion
  - Post-Departure Checklist status
  - Last completed timestamps
  - Overdue items highlighted

#### Maintenance Tracking
- Service schedule adherence
- Maintenance history
- Current issues and repairs
- Compliance status

### 4. Announcements Tab
Communication hub for staff-wide messages:

#### Post New Announcement
- **Title**: Brief summary of announcement
- **Message**: Full announcement content
- **Priority Levels**:
  - Low (Green): General information
  - Medium (Yellow): Important updates
  - High (Red): Critical/urgent messages
- **Expiry Date**: Optional auto-removal date

#### Active Announcements
- Displays all current announcements
- Shows poster, timestamp, and expiry
- Priority-based color coding
- Edit/delete capabilities for management

### 5. Reports Tab
Analytics and performance metrics:

#### Available Reports
- **Revenue Report**: Daily, weekly, monthly breakdowns
- **Staff Performance**: Attendance, allocations, efficiency
- **Fleet Utilization**: Vessel usage patterns and optimization
- **Export Data**: Download reports as CSV or PDF

## Technical Implementation

### Architecture
```javascript
// Authentication Check
const managementEmails = [
    'harry@priceoffice.com.au',
    'mmckelvey03@gmail.com',
    // ... additional emails
];

// Redirect logic in dashboard.html
if (managementEmails.includes(user.email.toLowerCase())) {
    window.location.href = 'management-dashboard.html';
}
```

### Data Sources
- **Supabase**: Authentication and user management
- **Airtable Tables**:
  - Bookings Dashboard (`tblRe0cDmK3bG2kPf`)
  - Employee Details (`tbltAE4NlNePvnkpY`)
  - Shift Allocations (`tbl22YKtQXZtDFtEX`)
  - Vessels (needs table creation)
  - Announcements (needs table creation)

### Tab Navigation
- Uses JavaScript-based tab switching
- Lazy loading of tab content for performance
- Active tab state persisted in URL hash

## UI/UX Features

### Design Elements
- **Color Scheme**: Management red gradient (#8B0000 to #DC143C)
- **Icons**: Font Awesome 6.0 for consistent iconography
- **Responsive**: Mobile-optimized with breakpoints at 768px
- **Animations**: Smooth transitions and hover effects

### Interactive Elements
- **Hover Effects**: Cards lift on hover with shadow enhancement
- **Loading States**: Spinners for async data loading
- **Form Validation**: Real-time validation on announcement forms
- **Success Feedback**: Toast notifications for actions

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Analytics**: 
   - Predictive maintenance schedules
   - Staff optimization algorithms
   - Revenue forecasting
3. **Mobile App**: Dedicated management mobile application
4. **Integration Expansions**:
   - SMS notifications for critical alerts
   - Email digest of daily operations
   - Calendar sync for bookings
5. **Automation**:
   - Auto-allocation based on staff preferences
   - Maintenance scheduling optimization
   - Announcement scheduling

### Database Additions Needed
1. **Vessels Table**: Track vessel information and status
2. **Announcements Table**: Store staff announcements
3. **Maintenance Log Table**: Detailed maintenance history
4. **Analytics Table**: Cached metrics for performance

## Security Considerations

### Access Control
- Server-side validation of management status
- Session-based authentication via Supabase
- API key protection (move to backend in production)

### Audit Trail
- Log all management actions
- Track announcement posting
- Monitor allocation changes
- Record maintenance updates

## Usage Guidelines

### Daily Workflow
1. **Morning Check**:
   - Review overview metrics
   - Check pending allocations
   - Review vessel status
   
2. **Throughout Day**:
   - Monitor real-time updates
   - Handle allocation changes
   - Post announcements as needed
   
3. **End of Day**:
   - Review completion status
   - Check tomorrow's schedule
   - Address any pending issues

### Best Practices
- Post high-priority announcements sparingly
- Review vessel maintenance daily
- Keep staff allocations balanced
- Export reports weekly for records

## Troubleshooting

### Common Issues
1. **Not Redirecting to Management Dashboard**:
   - Verify email is in management list
   - Clear browser cache
   - Check console for errors

2. **Data Not Loading**:
   - Verify Airtable API key is valid
   - Check network connectivity
   - Ensure table IDs are correct

3. **Announcements Not Saving**:
   - Verify Announcements table exists in Airtable
   - Check field permissions
   - Validate form data

## Support & Maintenance

### Regular Tasks
- Weekly review of management email list
- Monthly analytics report generation
- Quarterly feature review and updates
- Annual security audit

### Contact
For technical support or feature requests, contact the development team.

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Initial Release*
