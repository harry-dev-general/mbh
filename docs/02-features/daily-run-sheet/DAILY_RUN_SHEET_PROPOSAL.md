# Daily Run Sheet Feature Proposal
**MBH Staff Portal Enhancement**  
**Date**: September 17, 2025  
**Version**: 1.0

## Executive Summary

The Daily Run Sheet will be a comprehensive operational dashboard within the MBH Management Dashboard that provides real-time visibility into daily boat operations. It will serve as both a preparation tool for the day's bookings and a live tracking system for vessel status throughout the operational day.

## 1. Feature Overview

### Purpose
- **Pre-operational Planning**: View all bookings for the day with required add-ons and vessel assignments
- **Live Operations Tracking**: Monitor vessel departures, returns, and status in real-time
- **Resource Management**: Track fuel, water, gas levels and plan refueling/maintenance
- **Staff Coordination**: See which staff are assigned to each booking phase

### Key Benefits
- Centralized view of daily operations
- Proactive planning for add-ons and resources
- Real-time visibility of fleet status
- Improved communication between dock and office staff
- Data-driven decision making for vessel turnaround

## 2. Core Features

### 2.1 Daily Booking Overview
**Display Format**: Timeline view with hourly blocks (6 AM - 8 PM)

**Information Shown**:
- Booking reference and customer name
- Vessel assignment with visual boat icon
- Booking duration (visual bar across timeline)
- Add-ons required (with icons):
  - 🎣 Fishing Rods
  - 🧊 Ice Bags
  - 🏖️ Lilly Pad
  - 🍖 BBQ Equipment
  - 🦺 Extra Life Jackets
- Staff assignments (Onboarding/Deloading)
- Special notes/requirements

### 2.2 Vessel Status Board
**Real-time Status Indicators**:
- **🟢 Ready**: Vessel available and checked
- **🟡 Preparing**: Pre-departure checklist in progress
- **🔵 On Water**: Currently out with customer
- **🟠 Returning**: Expected back soon
- **🔴 Maintenance**: Issues requiring attention
- **⚫ Offline**: Not available for bookings

**Vessel Cards Display**:
```
┌─────────────────────────────────┐
│ 🚤 Pontoon BBQ 1               │
│ Status: 🔵 On Water            │
│ Booking: JGMX-160925           │
│ Return: 2:30 PM                │
│ Fuel: 75% | Water: 90%         │
│ Last GPS: Manly Cove (5m ago)  │
└─────────────────────────────────┘
```

### 2.3 Pre-Departure Integration
**Features**:
- Quick access to pre-departure checklist
- Visual indicator when checklist started/completed
- Flag critical issues that prevent departure
- Time tracking (preparation duration)

### 2.4 Live Operations Dashboard
**Real-time Updates**:
- Vessel departure times (from pre-departure completion)
- Current location (from GPS tracking)
- Expected return times
- Actual return times (from post-departure start)
- Turnaround times between bookings

### 2.5 Resource Tracking
**Fuel/Water/Gas Management**:
- Visual gauges for each vessel
- Alert thresholds (e.g., <25% fuel)
- Refueling recommendations based on day's schedule
- Historical consumption patterns

### 2.6 Add-On Preparation Checklist
**Morning Preparation View**:
- Consolidated list of all add-ons needed for the day
- Grouped by type with quantities
- Assignment to preparation staff
- Check-off system for prepared items

## 3. User Interface Design

### 3.1 Layout Structure
```
┌──────────────────────────────────────────────────────────┐
│                    Daily Run Sheet                       │
│                 Monday, Sept 17, 2025                    │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   Filters    │         Timeline View                     │
│              │    6AM  8AM  10AM  12PM  2PM  4PM  6PM  │
│  □ All Boats │    |    |    |     |     |    |    |    │
│  □ Active    │  ═══════BBQ1═══════                     │
│  □ Issues    │      ════SK14════                       │
│              │           ═══════BBQ2═══════             │
├──────────────┼───────────────────────────────────────────┤
│              │                                           │
│ Quick Stats  │         Vessel Status Cards              │
│              │   [BBQ1] [SK14] [BBQ2] [SK16] [SK18]    │
│ 12 Bookings  │                                          │
│ 8 Active     │                                          │
│ 2 Preparing  │                                          │
│              │                                          │
├──────────────┴───────────────────────────────────────────┤
│                    Add-Ons Required Today                │
│  🎣 Fishing Rods: 3  | 🧊 Ice Bags: 5 | 🏖️ Lilly Pad: 2 │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Mobile Responsive Design
- Vertical timeline for mobile devices
- Swipeable vessel cards
- Collapsible sections
- Touch-optimized controls

## 4. Technical Implementation

### 4.1 Data Sources (Existing Airtable Tables)
- **Bookings Dashboard**: Core booking information
- **Pre-Departure Checklist**: Departure status and times
- **Post-Departure Checklist**: Return status and resource levels
- **Boats**: Vessel information and current status
- **Employee Details**: Staff assignments

### 4.2 New API Endpoints
```javascript
// Get daily run sheet data
GET /api/daily-run-sheet?date=2025-09-17

// Update vessel status
POST /api/vessel-status
{
  "vesselId": "rec123",
  "status": "on_water",
  "departureTime": "2025-09-17T10:30:00Z"
}

// Get real-time vessel locations
GET /api/vessel-locations

// Get add-ons summary for date
GET /api/daily-addons?date=2025-09-17
```

### 4.3 Real-time Updates
- WebSocket connection for live updates
- Server-sent events as fallback
- 30-second polling for GPS locations
- Instant updates on checklist submissions

### 4.4 Frontend Components
```javascript
// Main components structure
DailyRunSheet/
├── DailyRunSheetContainer.js
├── components/
│   ├── TimelineView.js
│   ├── VesselStatusBoard.js
│   ├── AddOnsSummary.js
│   ├── BookingCard.js
│   └── ResourceGauge.js
├── utils/
│   ├── timelineHelpers.js
│   ├── statusCalculations.js
│   └── resourceTracking.js
└── styles/
    └── dailyRunSheet.css
```

## 5. Integration Points

### 5.1 Existing Features
- **Management Dashboard**: Add as new tab/section
- **Vessel Checklists**: Pull real-time data
- **Staff Allocations**: Display assignments
- **GPS Tracking**: Show vessel locations

### 5.2 Data Flow
1. Pre-departure checklist completion → Updates vessel status to "On Water"
2. GPS updates → Updates vessel location on map
3. Post-departure checklist start → Updates status to "Returning"
4. Resource level updates → Triggers refueling alerts

## 6. Implementation Phases

### Phase 1: Core Display (Week 1-2)
- [ ] Create daily run sheet page structure
- [ ] Implement timeline view with bookings
- [ ] Display basic vessel status cards
- [ ] Show add-ons summary

### Phase 2: Live Tracking (Week 3-4)
- [ ] Integrate pre/post departure checklist data
- [ ] Implement real-time status updates
- [ ] Add GPS location display
- [ ] Create resource level gauges

### Phase 3: Advanced Features (Week 5-6)
- [ ] Add predictive analytics (turnaround times)
- [ ] Implement alerts and notifications
- [ ] Create preparation checklists
- [ ] Add historical data views

### Phase 4: Optimization (Week 7-8)
- [ ] Performance optimization
- [ ] Mobile experience enhancement
- [ ] User feedback implementation
- [ ] Documentation and training

## 7. Success Metrics

### Operational Efficiency
- Reduction in vessel turnaround time
- Decrease in missed add-on preparations
- Improved on-time departure rate

### User Adoption
- Daily active users
- Feature engagement rate
- User satisfaction scores

### Business Impact
- Reduction in customer wait times
- Improved resource utilization
- Decreased operational incidents

## 8. User Stories

### As a Dock Manager
- I want to see all vessels' current status at a glance
- I need to know which add-ons to prepare for each booking
- I want alerts when vessels are running late

### As Operations Manager
- I need to track resource levels across the fleet
- I want to identify bottlenecks in vessel turnaround
- I need historical data for planning improvements

### As Dock Staff
- I want to quickly update vessel status
- I need to see upcoming bookings and requirements
- I want to know staff assignments for each booking

## 9. Security & Permissions

### Access Control
- Management role required for full access
- Read-only view for general staff
- Specific permissions for status updates

### Data Security
- Encrypted API communications
- Audit trail for all updates
- Secure storage of location data

## 10. Future Enhancements

### Potential Add-ons
- Weather integration for operational planning
- Predictive maintenance based on usage patterns
- Customer notification system for delays
- Integration with fuel supplier APIs
- Automated staff scheduling suggestions

## 11. Technical Considerations

### Performance
- Lazy loading for historical data
- Efficient real-time update mechanisms
- Caching strategies for static data

### Scalability
- Designed for 50+ daily bookings
- Support for 20+ vessels
- Concurrent user support (10+ managers)

### Browser Support
- Chrome, Safari, Firefox (latest versions)
- Mobile Safari and Chrome
- Progressive Web App potential

## 12. Conclusion

The Daily Run Sheet feature will transform MBH's daily operations management by providing unprecedented visibility and control over fleet operations. By leveraging existing data and adding real-time tracking capabilities, this feature will enable proactive management and improve overall operational efficiency.

The phased implementation approach ensures quick wins while building toward a comprehensive solution that will serve MBH's operational needs for years to come.
