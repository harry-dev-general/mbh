# Vessel Maintenance Dashboard - Integration Guide

**Date**: September 4, 2025

## Quick Start

The vessel maintenance system uses the **most recent checklist** (whether pre or post-departure) to show current vessel status.

## 1. Add to Your Express App

In your main server file (e.g., `server.js` or `app.js`):

```javascript
const vesselRoutes = require('./api/routes/vessel-maintenance');

// Add the vessel routes
app.use('/api/vessels', vesselRoutes);
```

## 2. Available API Endpoints

### Get All Vessel Status
```
GET /api/vessels/maintenance-status

Response:
{
  "success": true,
  "vessels": [
    {
      "id": "recNyQ4NXCEtZAaW0",
      "name": "Sandstone",
      "type": "8 Person BBQ Boat",
      "currentStatus": {
        "fuel": { "level": "Full", "percentage": 100 },
        "gas": { "level": "Full", "percentage": 100 },
        "water": { "level": "Quarter", "percentage": 25 }
      },
      "lastCheck": {
        "type": "Post-Departure",
        "time": "2025-09-04T10:17:03.985Z",
        "daysSince": 0
      },
      "alerts": [
        { "type": "warning", "message": "Water tank low" }
      ],
      "overallStatus": "Warning"
    }
  ],
  "summary": {
    "total": 7,
    "critical": 1,
    "warning": 2,
    "ready": 3,
    "unknown": 1
  }
}
```

### Get Specific Vessel Detail
```
GET /api/vessels/:id/detail

Response: Same vessel object with full checklist history
```

### Quick Update (Fuel/Gas/Water)
```
POST /api/vessels/:id/quick-update
Body:
{
  "type": "fuel",  // or "gas", "water"
  "level": "Full", // Empty, Quarter, Half, Three-Quarter, Full
  "staffId": "recU2yfUOIGFsIuZV", // optional
  "notes": "Refueled at marina" // optional
}
```

## 3. Frontend Integration

Add to your vessel maintenance page:

```html
<!-- vessel-maintenance.html -->
<script>
async function loadVesselStatus() {
    try {
        const response = await fetch('/api/vessels/maintenance-status');
        const data = await response.json();
        
        if (data.success) {
            renderVesselDashboard(data.vessels);
            updateSummary(data.summary);
        }
    } catch (error) {
        console.error('Failed to load vessel status:', error);
    }
}

function renderVesselDashboard(vessels) {
    const container = document.getElementById('vessel-grid');
    container.innerHTML = '';
    
    vessels.forEach(vessel => {
        const card = createVesselCard(vessel);
        container.appendChild(card);
    });
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadVesselStatus);
</script>
```

## 4. Understanding the Logic

The system determines current status by:

1. **Finding all checklists** for each vessel (last 30 days)
2. **Comparing timestamps** of the most recent pre-departure vs post-departure
3. **Using data from whichever is newer**

Example:
- Pre-Departure on Sept 5 at 8:00 AM (Fuel: Full)
- Post-Departure on Sept 4 at 4:00 PM (Fuel: Quarter)
- **Result**: Shows Full (from Sept 5 Pre-Departure)

## 5. Status Indicators

**Overall Status**:
- `Critical` - Empty fuel/gas OR vessel marked "Do Not Use"
- `Warning` - Low resources (Quarter) OR needs attention
- `Ready` - Adequate resources, no issues
- `Unknown` - No checklist data

**Resource Levels**:
- 🟢 75-100% (Three-Quarter or Full)
- 🟡 50-74% (Half)
- 🟠 25-49% (Quarter) 
- 🔴 0-24% (Empty)

## 6. Performance Notes

- Results are **cached for 5 minutes** to improve performance
- Force refresh: `POST /api/vessels/refresh-cache`
- Only queries checklists from last 30 days

## 7. Testing

Run the test script to see the logic in action:

```bash
node test-vessel-status-logic.js
```

This will show:
- Which checklist is being used for each vessel
- Current levels and alerts
- Recent checklist history

## 8. Quick Implementation Checklist

- [ ] Add `api/vessel-status.js` to your project
- [ ] Add `api/routes/vessel-maintenance.js` 
- [ ] Include routes in your Express app
- [ ] Update `vessel-maintenance.html` with API calls
- [ ] Test with real checklist data
- [ ] Deploy and monitor performance

## 9. Troubleshooting

**No data showing?**
- Check if vessels have checklists in last 30 days
- Verify Airtable API key is set correctly

**Wrong status showing?**
- Remember: MOST RECENT checklist wins
- Check timestamps in both checklist tables

**Slow loading?**
- First load fetches from Airtable (2-3 seconds)
- Subsequent loads use cache (instant)
