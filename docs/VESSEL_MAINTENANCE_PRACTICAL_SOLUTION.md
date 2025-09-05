# Vessel Maintenance - Practical Implementation

**Date**: September 4, 2025

## Understanding the Constraints

You've identified the key issues:
1. Boats table has duplicate data (some synced, some manual)
2. Linked records exist between Boats ↔ Checklists
3. Static fields in Boats table don't update when checklists are submitted
4. Need to work within Airtable's lookup field capabilities

## Practical Solution: Query Checklists Directly

Instead of trying to force Airtable to show "latest" values through complex formulas, let's use a simpler approach:

### 1. Keep Boats Table Simple

Don't add more fields to the already complex Boats table. Just ensure these links exist:
- `Pre-Departure Checklist` (multiple linked records)
- `Post-Departure Checklist` (multiple linked records)

### 2. Build Dashboard Logic in the Application

```javascript
// vessel-status-api.js

async function getVesselMaintenanceData() {
  // 1. Get all boats
  const boats = await airtable('Boats').select({
    fields: ['Name', 'Boat Type', 'Vessel Location', 'Description']
  }).all();
  
  // 2. Get recent checklists (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const preDepChecklists = await airtable('Pre-Departure Checklist').select({
    filterByFormula: `IS_AFTER({Created time}, '${thirtyDaysAgo.toISOString()}')`,
    fields: ['Vessel', 'Fuel Level Check', 'Gas Bottle Check', 'Water Tank Level', 
             'Overall Vessel Condition', 'Created time', 'Staff Member'],
    sort: [{field: 'Created time', direction: 'desc'}]
  }).all();
  
  const postDepChecklists = await airtable('Post-Departure Checklist').select({
    filterByFormula: `IS_AFTER({Created time}, '${thirtyDaysAgo.toISOString()}')`,
    fields: ['Vessel', 'Fuel Level After Use', 'Gas Bottle Level After Use', 
             'Water Tank Level After Use', 'Overall Vessel Condition After Use', 
             'Created time', 'Staff Member'],
    sort: [{field: 'Created time', direction: 'desc'}]
  }).all();
  
  // 3. Build vessel status map
  const vesselStatus = {};
  
  boats.forEach(boat => {
    const boatId = boat.id;
    
    // Find most recent checklists for this boat
    const latestPreDep = preDepChecklists.find(c => 
      c.fields.Vessel && c.fields.Vessel.includes(boatId)
    );
    
    const latestPostDep = postDepChecklists.find(c => 
      c.fields.Vessel && c.fields.Vessel.includes(boatId)
    );
    
    // Determine which is more recent
    let currentStatus = null;
    let lastCheckType = 'None';
    let lastCheckTime = null;
    
    if (latestPostDep && latestPreDep) {
      // Compare dates
      const postDepDate = new Date(latestPostDep.fields['Created time']);
      const preDepDate = new Date(latestPreDep.fields['Created time']);
      
      if (postDepDate > preDepDate) {
        currentStatus = {
          fuel: latestPostDep.fields['Fuel Level After Use'],
          gas: latestPostDep.fields['Gas Bottle Level After Use'],
          water: latestPostDep.fields['Water Tank Level After Use'],
          condition: latestPostDep.fields['Overall Vessel Condition After Use']
        };
        lastCheckType = 'Post-Departure';
        lastCheckTime = postDepDate;
      } else {
        currentStatus = {
          fuel: latestPreDep.fields['Fuel Level Check'],
          gas: latestPreDep.fields['Gas Bottle Check'],
          water: latestPreDep.fields['Water Tank Level'],
          condition: latestPreDep.fields['Overall Vessel Condition']
        };
        lastCheckType = 'Pre-Departure';
        lastCheckTime = preDepDate;
      }
    } else if (latestPostDep) {
      currentStatus = {
        fuel: latestPostDep.fields['Fuel Level After Use'],
        gas: latestPostDep.fields['Gas Bottle Level After Use'],
        water: latestPostDep.fields['Water Tank Level After Use'],
        condition: latestPostDep.fields['Overall Vessel Condition After Use']
      };
      lastCheckType = 'Post-Departure';
      lastCheckTime = new Date(latestPostDep.fields['Created time']);
    } else if (latestPreDep) {
      currentStatus = {
        fuel: latestPreDep.fields['Fuel Level Check'],
        gas: latestPreDep.fields['Gas Bottle Check'],
        water: latestPreDep.fields['Water Tank Level'],
        condition: latestPreDep.fields['Overall Vessel Condition']
      };
      lastCheckType = 'Pre-Departure';
      lastCheckTime = new Date(latestPreDep.fields['Created time']);
    }
    
    vesselStatus[boatId] = {
      name: boat.fields.Name,
      type: boat.fields['Boat Type'],
      location: boat.fields['Vessel Location'],
      currentStatus,
      lastCheckType,
      lastCheckTime,
      alerts: generateAlerts(currentStatus)
    };
  });
  
  return vesselStatus;
}

function generateAlerts(status) {
  const alerts = [];
  
  if (!status) {
    alerts.push({ type: 'warning', message: 'No recent checks' });
    return alerts;
  }
  
  // Fuel alerts
  if (status.fuel === 'Empty' || status.fuel === 'Quarter') {
    alerts.push({ type: 'critical', message: 'Low fuel - needs refill' });
  }
  
  // Gas alerts
  if (status.gas === 'Empty' || status.gas === 'Quarter') {
    alerts.push({ type: 'critical', message: 'Gas bottle low - needs replacement' });
  }
  
  // Water alerts
  if (status.water === 'Empty' || status.water === 'Quarter') {
    alerts.push({ type: 'warning', message: 'Water tank low' });
  }
  
  // Condition alerts
  if (status.condition === 'Major Issues - Do Not Use') {
    alerts.push({ type: 'critical', message: 'Vessel not safe - do not use' });
  } else if (status.condition === 'Needs Attention' || status.condition === 'Issues Found') {
    alerts.push({ type: 'warning', message: 'Vessel needs maintenance' });
  }
  
  return alerts;
}

function convertLevelToPercentage(level) {
  const levels = {
    'Empty': 0,
    'Quarter': 25,
    'Half': 50,
    'Three-Quarter': 75,
    'Full': 100
  };
  return levels[level] || 0;
}
```

### 3. Frontend Implementation

```javascript
// vessel-maintenance.js

async function loadVesselDashboard() {
  const vesselData = await fetch('/api/vessels/maintenance-status').then(r => r.json());
  
  const container = document.getElementById('vessel-grid');
  container.innerHTML = '';
  
  Object.entries(vesselData).forEach(([boatId, vessel]) => {
    const card = createVesselCard(vessel);
    container.appendChild(card);
  });
}

function createVesselCard(vessel) {
  const hasAlerts = vessel.alerts.some(a => a.type === 'critical');
  const status = vessel.currentStatus;
  
  const timeSinceCheck = vessel.lastCheckTime ? 
    getTimeSince(vessel.lastCheckTime) : 'Never checked';
  
  const html = `
    <div class="vessel-card ${hasAlerts ? 'alert' : ''}" data-vessel="${vessel.name}">
      <div class="vessel-header">
        <div>
          <div class="vessel-name">${vessel.name}</div>
          <div class="vessel-type">${vessel.type || 'Unknown Type'}</div>
        </div>
        <div class="vessel-status ${getStatusClass(vessel)}">
          ${getStatusIcon(vessel)} ${getStatusText(vessel)}
        </div>
      </div>
      
      ${status ? `
        <div class="gauge-container">
          ${createGauge('Fuel', status.fuel, '⛽')}
          ${createGauge('Gas', status.gas, '🔥')}
          ${createGauge('Water', status.water, '💧')}
        </div>
      ` : `
        <div class="no-data">
          <i class="fas fa-question-circle"></i>
          No checklist data available
        </div>
      `}
      
      <div class="vessel-footer">
        <div class="last-check">
          <i class="fas fa-clock"></i> 
          ${vessel.lastCheckType}: ${timeSinceCheck}
        </div>
        <a href="#" onclick="showVesselDetail('${vessel.name}')" class="view-details">
          View Details <i class="fas fa-arrow-right"></i>
        </a>
      </div>
      
      ${vessel.alerts.length > 0 ? `
        <div class="vessel-alerts">
          ${vessel.alerts.map(alert => `
            <div class="alert-item ${alert.type}">
              <i class="fas fa-exclamation-triangle"></i> ${alert.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

function createGauge(type, level, icon) {
  const percentage = convertLevelToPercentage(level);
  const colorClass = getGaugeColorClass(percentage);
  const warning = percentage <= 25 ? '⚠️' : '';
  
  return `
    <div class="gauge">
      <div class="gauge-header">
        <div class="gauge-label">
          <span>${icon}</span> ${type}
        </div>
        <div class="gauge-value">${percentage}% ${warning}</div>
      </div>
      <div class="gauge-bar">
        <div class="gauge-fill ${colorClass}" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}
```

### 4. Benefits of This Approach

1. **No Airtable Schema Changes** - Works with existing structure
2. **Always Accurate** - Queries real checklist data
3. **Flexible Logic** - Can easily add business rules
4. **Performance** - Can cache results for quick loading
5. **Handles Duplicates** - Works regardless of boat table complexity

### 5. Quick Implementation Steps

1. **Create API endpoint** `/api/vessels/maintenance-status`
2. **Implement the query logic** to fetch and combine checklist data
3. **Build the dashboard UI** using the mockup as a guide
4. **Add caching** to improve performance (5-minute cache)
5. **Test with real data**

### 6. Future Enhancement: Quick Update Feature

Add a simple "Quick Update" feature that creates a minimal checklist:

```javascript
async function quickFuelUpdate(boatId, fuelLevel) {
  // Create a minimal post-departure checklist with just fuel level
  await airtable('Post-Departure Checklist').create({
    'Vessel': [boatId],
    'Staff Member': [currentStaffId],
    'Checklist Date/Time': new Date().toISOString(),
    'Fuel Level After Use': fuelLevel,
    'Completion Status': 'Completed',
    'Notes': 'Quick fuel level update'
  });
  
  // Refresh dashboard
  await loadVesselDashboard();
}
```

This approach works with your existing data structure and provides the flexibility you need!
