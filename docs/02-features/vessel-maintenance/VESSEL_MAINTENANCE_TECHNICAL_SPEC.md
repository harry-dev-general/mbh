# Vessel Maintenance Dashboard - Technical Specification

**Date**: September 4, 2025

## Current Data Structure Analysis

### 1. Data Flow Gaps

**Current State:**
```
Pre-Departure Checklist → [NO CONNECTION] → Boats Table
Post-Departure Checklist → [NO CONNECTION] → Boats Table
                         ↓
                [EMPTY] Vessel Usage Tracking
```

**Desired State:**
```
Pre-Departure Checklist → Update Boats Current Status
                       ↘
                         Vessel Usage Tracking Record
                       ↗
Post-Departure Checklist → Calculate Consumption
```

### 2. Field Mapping Issues

| Checklist Fields | Boats Table Fields | Issue |
|-----------------|-------------------|--------|
| Fuel Level Check (5 options) | Current Fuel Level (%) (3 options) | Inconsistent scale |
| Gas Bottle Check (5 options) | Current Gas Level (%) (2 options) | Missing Empty option |
| Water Tank Level (5 options) | Current Water Level (%) (2 options) | Missing options |

### 3. Required Airtable Changes

#### A. Update Boats Table Fields

1. **Standardize Level Fields** - Update to match checklist scale:
   - Current Fuel Level: Empty, Quarter, Half, Three-Quarter, Full
   - Current Gas Level: Empty, Quarter, Half, Three-Quarter, Full  
   - Current Water Level: Empty, Quarter, Half, Three-Quarter, Full

2. **Add Status Tracking Fields**:
   - `Last Pre-Departure Check` (Link to Pre-Departure Checklist)
   - `Last Post-Departure Check` (Link to Post-Departure Checklist)
   - `Fuel Needs Refill` (Checkbox)
   - `Gas Needs Replace` (Checkbox)
   - `Water Needs Refill` (Checkbox)
   - `Maintenance Alert` (Text)

#### B. Create Airtable Automations

**Automation 1: Update Boat Status from Pre-Departure**
```
Trigger: When Pre-Departure Checklist record created/updated with Status = "Completed"
Actions:
1. Find linked Boat record
2. Update Boat fields:
   - Current Fuel Level = Checklist Fuel Level Check
   - Current Gas Level = Checklist Gas Bottle Check
   - Current Water Level = Checklist Water Tank Level
   - Last Pre-Departure Check = This checklist
   - Last Status Update = Now
   - Last Updated By = Checklist Staff Member
```

**Automation 2: Update Boat Status from Post-Departure**
```
Trigger: When Post-Departure Checklist record created/updated with Status = "Completed"
Actions:
1. Find linked Boat record
2. Update Boat fields:
   - Current Fuel Level = Checklist Fuel Level After Use
   - Current Gas Level = Checklist Gas Bottle Level After Use
   - Current Water Level = Checklist Water Tank Level After Use
   - Last Post-Departure Check = This checklist
   - Set flags if levels are Quarter or Empty:
     - Fuel Needs Refill = true if Quarter/Empty
     - Gas Needs Replace = true if Quarter/Empty
   - Create Vessel Usage Tracking record
```

**Automation 3: Create Usage Tracking Record**
```
Trigger: Post-Departure Checklist completed
Actions:
1. Find matching Pre-Departure Checklist (same booking)
2. Create Vessel Usage Tracking record:
   - Date = Booking Date
   - Vessel Name = Boat Name
   - Pre-Departure Checklist = Link
   - Post-Departure Checklist = Link
   - Fuel Level Start = Pre-Dep Fuel Level
   - Fuel Level End = Post-Dep Fuel Level
   - Calculate fuel used based on levels
```

### 4. API Implementation

#### A. Endpoints Needed

```javascript
// Get all vessels with current status
GET /api/vessels/status
Response: {
  vessels: [{
    id: "recXXX",
    name: "Junior",
    type: "12 Person BBQ Boat",
    status: {
      fuel: "Quarter", // or percentage: 25
      gas: "Quarter",
      water: "Three-Quarter",
      overall: "Ready", // or "Low Resources", "Needs Attention"
      lastCheck: "2025-08-07T10:38:04Z",
      lastCheckType: "post-departure"
    },
    alerts: ["Low fuel", "Low gas"],
    location: "Seaforth Mooring",
    nextBooking: {
      date: "2025-09-08",
      time: "09:00",
      customer: "Smith Family"
    }
  }]
}

// Get vessel detail with history
GET /api/vessels/:id/detail
Response: {
  vessel: { /* current status */ },
  checklists: [/* last 10 checklists */],
  usage: [/* usage tracking records */],
  upcomingBookings: [/* next 5 bookings */]
}

// Quick update vessel levels
POST /api/vessels/:id/refuel
Body: {
  type: "fuel", // or "gas", "water"
  action: "refilled",
  staffId: "recXXX"
}
```

#### B. Frontend Integration

```javascript
// vessel-api.js
class VesselAPI {
  async getVesselStatus() {
    const response = await fetch('/api/vessels/status');
    return response.json();
  }
  
  async getVesselDetail(vesselId) {
    const response = await fetch(`/api/vessels/${vesselId}/detail`);
    return response.json();
  }
  
  async logRefuel(vesselId, type) {
    const response = await fetch(`/api/vessels/${vesselId}/refuel`, {
      method: 'POST',
      body: JSON.stringify({ type, action: 'refilled' })
    });
    return response.json();
  }
}

// fuel-gauge.js - Reusable component
class FuelGauge {
  constructor(containerId, level, type) {
    this.container = document.getElementById(containerId);
    this.level = this.parseLevel(level);
    this.type = type; // fuel, gas, water
  }
  
  parseLevel(level) {
    const levels = {
      'Empty': 0,
      'Quarter': 25,
      'Half': 50,
      'Three-Quarter': 75,
      'Full': 100
    };
    return levels[level] || 0;
  }
  
  render() {
    const color = this.getColor();
    const icon = this.getIcon();
    
    this.container.innerHTML = `
      <div class="fuel-gauge">
        <div class="gauge-label">${icon} ${this.type}</div>
        <div class="gauge-bar">
          <div class="gauge-fill" style="width: ${this.level}%; background: ${color}"></div>
        </div>
        <div class="gauge-text">${this.level}% ${this.getWarning()}</div>
      </div>
    `;
  }
  
  getColor() {
    if (this.level >= 75) return '#4CAF50';
    if (this.level >= 50) return '#FFC107';
    if (this.level >= 25) return '#FF9800';
    return '#F44336';
  }
  
  getIcon() {
    const icons = {
      'fuel': '⛽',
      'gas': '🔥',
      'water': '💧'
    };
    return icons[this.type] || '📊';
  }
  
  getWarning() {
    return this.level <= 25 ? '⚠️' : '';
  }
}
```

### 5. Implementation Priority

1. **Phase 1 - Data Structure** (Week 1)
   - Update Airtable fields for consistency
   - Create automations for data flow
   - Test with manual checklist submissions

2. **Phase 2 - Basic Dashboard** (Week 2)
   - Build vessel status grid view
   - Implement fuel gauges
   - Create API endpoints

3. **Phase 3 - Detail Views** (Week 3)
   - Individual vessel pages
   - Checklist history
   - Quick action buttons

4. **Phase 4 - Enhancements** (Week 4)
   - Predictive alerts
   - Usage analytics
   - Mobile optimization

### 6. Testing Checklist

- [ ] Pre-departure checklist updates boat status
- [ ] Post-departure checklist updates boat status
- [ ] Usage tracking records created automatically
- [ ] Low level alerts trigger correctly
- [ ] Dashboard loads vessel data
- [ ] Gauges display correct levels
- [ ] Quick refuel action works
- [ ] History shows all checklists
- [ ] Mobile responsive design
