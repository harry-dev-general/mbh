# Pending Shift Responses - Management Dashboard Implementation Plan

## Overview
This document outlines the plan to adapt the "Pending Shift Responses" component from the employee dashboard to the management dashboard, showing ALL pending responses across ALL employees.

## Current Employee Dashboard Implementation

### Data Flow
1. Fetches employee record based on logged-in user's email
2. Loads allocations from two sources:
   - **Shift Allocations Table**: General shift assignments
   - **Bookings Dashboard**: Boat hire bookings requiring staff
3. Filters for:
   - Records assigned to current employee
   - Response Status = 'Pending' or null
   - Future dates only
4. Allows Accept/Decline actions that update the response fields

### API Endpoints Used
- `GET /api/airtable/{BASE_ID}/{TABLE_ID}?pageSize=100`
- `PATCH /api/airtable/{BASE_ID}/{TABLE_ID}/{RECORD_ID}`

## Management Dashboard Requirements

### Key Differences
1. **Show ALL pending responses** across all employees (not filtered by user)
2. **Include employee name** in each allocation display
3. **Group by date or employee** for better organization
4. **Read-only view** - no Accept/Decline actions (managed via SMS system)
5. **Add employee contact info** for quick reference
6. **Show response deadline/reminder status** if available

### Implementation Steps

#### Step 1: Create Management Version of Load Functions
```javascript
// Load ALL pending allocations (not filtered by employee)
async function loadAllPendingAllocations() {
    const [generalAllocations, bookingAllocations] = await Promise.all([
        loadAllGeneralAllocations(),
        loadAllBookingAllocations()
    ]);
    
    // Merge and sort by date
    const allPendingAllocations = [...generalAllocations, ...bookingAllocations]
        .filter(allocation => (!allocation.responseStatus || allocation.responseStatus === 'Pending'))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return allPendingAllocations;
}
```

#### Step 2: Enhance Data with Employee Information
- Fetch employee details (name, phone) for each allocation
- Cache employee data to avoid multiple API calls
- Add employee info to allocation objects

#### Step 3: Create Management-Specific Display Component
```javascript
function displayManagementPendingAllocations(allocations, employees) {
    // Group allocations by date
    const groupedByDate = groupAllocationsByDate(allocations);
    
    // Render with employee info and management view
    // No Accept/Decline buttons
    // Show employee name, phone number
    // Add visual indicators for urgency
}
```

#### Step 4: Add to Management Dashboard Layout
- Create a dedicated card/section in the dashboard
- Position prominently (e.g., top-right or dedicated tab)
- Add refresh button for real-time updates
- Include count badge for quick reference

#### Step 5: Styling Considerations
- Use consistent styling with existing management dashboard
- Color-code by urgency (today = red, tomorrow = orange, etc.)
- Highlight bookings vs. general shifts differently
- Mobile-responsive design

## Technical Implementation Details

### Modified Load Functions

```javascript
// Load general allocations without employee filter
async function loadAllGeneralAllocations() {
    const response = await fetch(
        `/api/airtable/${BASE_ID}/${ALLOCATIONS_TABLE_ID}?pageSize=100`
    );
    
    const data = await response.json();
    if (!data.records) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.records
        .filter(record => {
            const shiftDate = record.fields['Shift Date'];
            const shiftDateObj = shiftDate ? new Date(shiftDate) : null;
            const isFutureShift = shiftDateObj && shiftDateObj >= today;
            
            // Include all future shifts regardless of employee
            return isFutureShift;
        })
        .map(record => ({
            id: record.id,
            date: record.fields['Shift Date'],
            startTime: record.fields['Start Time'] || '09:00',
            endTime: record.fields['End Time'] || '17:00',
            type: record.fields['Shift Type'] || 'General Operations',
            role: record.fields['Role'] || null,
            responseStatus: record.fields['Response Status'] || 'Pending',
            employeeId: record.fields['Employee']?.[0], // Get first linked employee
            source: 'allocation'
        }));
}
```

### Employee Data Fetching

```javascript
// Cache employee data
const employeeCache = new Map();

async function getEmployeeDetails(employeeId) {
    if (employeeCache.has(employeeId)) {
        return employeeCache.get(employeeId);
    }
    
    const response = await fetch(
        `/api/airtable/${BASE_ID}/${EMPLOYEE_TABLE_ID}/${employeeId}`
    );
    
    if (response.ok) {
        const data = await response.json();
        const employee = {
            id: data.id,
            name: data.fields['Name'],
            phone: data.fields['Phone'] || 'No phone',
            email: data.fields['Email']
        };
        employeeCache.set(employeeId, employee);
        return employee;
    }
    
    return null;
}
```

### Display Component Structure

```html
<div class="management-pending-shifts">
    <div class="pending-header">
        <h3>
            <i class="fas fa-clock"></i> 
            Pending Shift Responses 
            <span class="badge">12</span>
        </h3>
        <button class="refresh-btn" onclick="refreshPendingAllocations()">
            <i class="fas fa-sync"></i>
        </button>
    </div>
    
    <div class="pending-content">
        <!-- Date Group -->
        <div class="date-group">
            <h4 class="date-header">Today - Dec 24</h4>
            
            <div class="allocation-item urgent">
                <div class="allocation-info">
                    <div class="employee-details">
                        <strong>John Smith</strong>
                        <span class="phone">0412 345 678</span>
                    </div>
                    <div class="shift-details">
                        <span class="time">09:00 - 17:00</span>
                        <span class="type">General Operations</span>
                    </div>
                </div>
                <div class="allocation-status">
                    <span class="status-badge pending">Awaiting Response</span>
                    <span class="reminder-info">Reminder sent 2h ago</span>
                </div>
            </div>
        </div>
    </div>
</div>
```

## Styling

```css
.management-pending-shifts {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 1.5rem;
    height: 600px;
    display: flex;
    flex-direction: column;
}

.pending-content {
    flex: 1;
    overflow-y: auto;
}

.date-group {
    margin-bottom: 1.5rem;
}

.date-header {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.allocation-item {
    background: #f8fafc;
    border-left: 4px solid #94a3b8;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-radius: 0 8px 8px 0;
}

.allocation-item.urgent {
    border-left-color: #ef4444;
    background: #fee2e2;
}

.employee-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.phone {
    color: #64748b;
    font-size: 0.875rem;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}

.status-badge.pending {
    background: #fef3c7;
    color: #92400e;
}
```

## Integration Points

1. **Add to sidebar navigation** - New menu item or under existing "Staff Management"
2. **Dashboard overview widget** - Show count of pending responses
3. **Real-time updates** - Consider WebSocket or polling for live updates
4. **Notification system** - Alert managers of new pending allocations

## Testing Checklist

- [ ] Load all pending allocations across all employees
- [ ] Display employee information correctly
- [ ] Group by date properly
- [ ] Handle timezone conversions
- [ ] Mobile responsive design
- [ ] Performance with large datasets
- [ ] Error handling for API failures
- [ ] Refresh functionality
- [ ] Visual urgency indicators

## Future Enhancements

1. **Filtering Options**
   - By employee
   - By shift type
   - By date range

2. **Export Functionality**
   - CSV export of pending responses
   - Email summary report

3. **Integration with SMS System**
   - Show SMS reminder history
   - Manual reminder trigger button

4. **Analytics**
   - Response time metrics
   - Acceptance rate tracking
