# Vessel Maintenance Dashboard Proposal

**Date**: September 4, 2025

## Current State Analysis

### Data Being Captured

#### Pre-Departure Checklist
- **Fuel/Gas/Water Levels**: Empty, Quarter, Half, Three-Quarter, Full
- **Cleaning Status**: BBQ, Toilet, Deck cleaned (checkboxes)
- **Safety Equipment**: Life jackets count, equipment check, fire extinguisher, lights
- **Overall Condition**: Ready / Issues Found
- **Refill Actions**: Fuel Refilled, Gas Replaced, Water Refilled (checkboxes)

#### Post-Departure Checklist  
- **Fuel/Gas/Water Levels After Use**: Same scale as pre-departure
- **Cleaning Tasks**: Toilet pumped out, rubbish removed, BBQ/toilet/deck cleaned
- **Equipment Condition**: Lights (All Working/Some Not Working/Major Issues)
- **Safety Equipment**: All Present & Good / Minor Issues / Missing or Damaged
- **Overall Vessel Condition**: Good - Ready / Needs Attention / Major Issues - Do Not Use
- **Damage Reporting**: Text description and photos
- **Lost Items**: Flag and description

### Current Issues
1. **No Automatic Updates**: Boat status fields don't update from checklists
2. **Empty Vessel Usage Tracking**: Table exists but isn't populated
3. **Inconsistent Scales**: Boats table has limited options (only Full/Quarter/Half)
4. **No Visual Dashboard**: Data exists but no centralized view

## Proposed Vessel Maintenance Dashboard

### 1. Main Dashboard View

```
┌─────────────────────────────────────────────────────────────────┐
│                    VESSEL MAINTENANCE DASHBOARD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PUMICE STONE   │  │     JUNIOR      │  │   SANDSTONE     │ │
│  │  12 Person BBQ   │  │  12 Person BBQ  │  │  8 Person BBQ   │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ ⛽ Fuel:   ███░░ │  │ ⛽ Fuel:   █░░░░ │  │ ⛽ Fuel:   ████░ │ │
│  │           75%    │  │           25% ⚠️ │  │           90%   │ │
│  │                  │  │                  │  │                  │ │
│  │ 🔥 Gas:    ██░░░ │  │ 🔥 Gas:    █░░░░ │  │ 🔥 Gas:    ███░░ │ │
│  │           50%    │  │           25% ⚠️ │  │           75%   │ │
│  │                  │  │                  │  │                  │ │
│  │ 💧 Water:  ████░ │  │ 💧 Water:  ███░░ │  │ 💧 Water:  ██░░░ │ │
│  │           90%    │  │           75%    │  │           50%   │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ Status: ✅ Ready │  │ Status: ⚠️ Low  │  │ Status: ✅ Ready│ │
│  │ Last Check: 2hrs │  │ Last Check: 1day│  │ Last Check: 3hrs│ │
│  │ [View Details]   │  │ [View Details]  │  │ [View Details]  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ POLYCRAFT YAM   │  │ POLYCRAFT MERC  │  │  ICE CREAM BOAT │ │
│  │  4 Person       │  │  4 Person       │  │  Work Boat      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Individual Vessel Detail View

When clicking "View Details" on a vessel:

```
┌─────────────────────────────────────────────────────────────────┐
│                        JUNIOR - Detail View                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Current Status                    Recent Activity               │
│  ┌────────────────────┐           ┌────────────────────────┐   │
│  │ ⛽ Fuel:     25% ⚠️ │           │ Last 5 Checklists:     │   │
│  │ 🔥 Gas:      25% ⚠️ │           │                        │   │
│  │ 💧 Water:    75%    │           │ ✅ Post-Dep 07/08 10:38│   │
│  │ 🚢 Location: Seaforth│           │    Fuel: 100% → 25%    │   │
│  │                     │           │    Staff: Harry Price   │   │
│  │ Overall: ✅ Ready   │           │                        │   │
│  │ Engine: Average     │           │ ✅ Pre-Dep 07/08 08:00 │   │
│  │ Lights: ✅ Working  │           │    All checks passed   │   │
│  │ Safety: ✅ Complete │           │    Staff: Test Staff   │   │
│  └────────────────────┘           │                        │   │
│                                    │ [View All History]     │   │
│  Action Buttons:                   └────────────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │ 🔧 Log Refuel│ │📋 Quick Check│  Maintenance Alerts:         │
│  └──────────────┘ └──────────────┘  ⚠️ Low fuel - needs refill │
│                                      ⚠️ Gas bottle low          │
│  Upcoming Bookings:                 📅 Service due in 2 weeks  │
│  • 08/09 - 9am: Smith Family                                    │
│  • 10/09 - 1pm: Johnson Group                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Key Features

#### A. Visual Fuel/Gas/Water Gauges
- Progress bars with color coding:
  - Green (75-100%)
  - Yellow (50-74%)
  - Orange (25-49%)
  - Red (0-24%)
- Percentage display
- Warning icons for low levels

#### B. Status Indicators
- **Ready**: All levels adequate, recent checks passed
- **Low Resources**: Fuel/gas/water below 50%
- **Needs Attention**: Issues reported in last checklist
- **Do Not Use**: Major issues flagged

#### C. Historical Data
- Links to all past checklists
- Fuel consumption trends
- Maintenance history
- Usage patterns

#### D. Quick Actions
- Log refuel/gas/water refill
- Quick status check (mini checklist)
- Report issue
- View full checklist history

#### E. Predictive Maintenance
- Alerts based on usage patterns
- Service reminders
- Resource consumption trends

### 4. Technical Implementation

#### A. Data Flow
1. Checklist submissions update vessel current status
2. Create Vessel Usage Tracking records automatically
3. Calculate consumption between pre/post checklists
4. Update Boats table with latest levels

#### B. Required Updates
1. **Airtable Automation**: When checklist submitted, update Boats table fields
2. **New Fields in Boats**: Standardize fuel/gas/water scales to match checklists
3. **Usage Tracking**: Auto-create records linking pre/post checklists
4. **API Endpoints**: Fetch vessel status, update levels, get history

#### C. Frontend Components
- `vessel-maintenance.html` - Main dashboard
- `vessel-detail-modal.js` - Individual vessel view
- `fuel-gauge-component.js` - Reusable gauge visualization
- `vessel-api.js` - API integration

### 5. Benefits

1. **At-a-Glance Status**: Managers see all vessels' readiness instantly
2. **Preventive Maintenance**: Catch issues before they become problems
3. **Resource Planning**: Know when refueling/restocking needed
4. **Historical Insights**: Track usage patterns and costs
5. **Compliance**: Ensure safety checks are completed
6. **Efficiency**: Reduce downtime from unexpected issues

### 6. Future Enhancements

1. **Mobile App**: Quick status checks from marina
2. **SMS Alerts**: Low fuel warnings to managers
3. **Cost Tracking**: Fuel/gas consumption costs
4. **Weather Integration**: Adjust maintenance based on conditions
5. **Predictive Analytics**: ML-based maintenance scheduling

## Next Steps

1. Update Airtable schema for consistent scales
2. Create automations for data flow
3. Build the dashboard UI
4. Implement API endpoints
5. Test with real checklist data
6. Deploy and train staff
