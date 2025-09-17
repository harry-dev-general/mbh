# Daily Run Sheet - Technical Implementation Guide

## Quick Start

This guide provides the technical details for implementing the Daily Run Sheet feature in the MBH Staff Portal.

## 1. Database Schema Updates

No new Airtable tables required! We'll leverage existing tables:
- **Bookings Dashboard** - Core booking data with add-ons
- **Pre-Departure Checklist** - Departure times and status
- **Post-Departure Checklist** - Return times and resource levels
- **Boats** - Vessel information
- **Employee Details** - Staff assignments

## 2. API Implementation

### 2.1 Create New API Module

Create `/api/daily-run-sheet.js`:

```javascript
const axios = require('axios');

// Airtable configuration
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'applkAFOn2qxtu7tx';
const BOOKINGS_TABLE = 'tblcBoyuVsbB1dt1I';
const PRE_DEPARTURE_TABLE = 'tbl8fZx0QH0bLYLGm';
const POST_DEPARTURE_TABLE = 'tblLbuaJoNs2yWXDC';
const BOATS_TABLE = 'tblNLoBNb4daWzjob';

const headers = {
    'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json'
};

/**
 * Get all bookings for a specific date
 */
async function getDailyBookings(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const filterFormula = `AND(
        IS_AFTER({Booking Date}, '${startOfDay.toISOString()}'),
        IS_BEFORE({Booking Date}, '${endOfDay.toISOString()}'),
        {Status} != 'Cancelled'
    )`;
    
    try {
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${BOOKINGS_TABLE}`,
            {
                headers,
                params: {
                    filterByFormula: filterFormula,
                    sort: [{ field: 'Booking Date', direction: 'asc' }],
                    pageSize: 100
                }
            }
        );
        
        return response.data.records;
    } catch (error) {
        console.error('Error fetching daily bookings:', error);
        throw error;
    }
}

/**
 * Get vessel status with latest checklist data
 */
async function getVesselStatus(vesselId) {
    try {
        // Get latest pre-departure checklist
        const preDepResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${PRE_DEPARTURE_TABLE}`,
            {
                headers,
                params: {
                    filterByFormula: `{Vessel} = '${vesselId}'`,
                    sort: [{ field: 'Created', direction: 'desc' }],
                    maxRecords: 1
                }
            }
        );
        
        // Get latest post-departure checklist
        const postDepResponse = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEPARTURE_TABLE}`,
            {
                headers,
                params: {
                    filterByFormula: `{Vessel} = '${vesselId}'`,
                    sort: [{ field: 'Created', direction: 'desc' }],
                    maxRecords: 1
                }
            }
        );
        
        const latestPreDep = preDepResponse.data.records[0];
        const latestPostDep = postDepResponse.data.records[0];
        
        // Determine vessel status based on checklists
        let status = 'ready';
        if (latestPreDep && !latestPreDep.fields['Completed']) {
            status = 'preparing';
        } else if (latestPreDep && latestPreDep.fields['Completed'] && 
                   (!latestPostDep || latestPostDep.fields['Created'] < latestPreDep.fields['Created'])) {
            status = 'on_water';
        } else if (latestPostDep && !latestPostDep.fields['Completed']) {
            status = 'returning';
        }
        
        return {
            status,
            fuelLevel: latestPostDep?.fields['Fuel Level'] || 100,
            waterLevel: latestPostDep?.fields['Water Level'] || 100,
            gasLevel: latestPostDep?.fields['Gas Level'] || 100,
            lastLocation: latestPostDep?.fields['GPS Location'] || null,
            lastUpdate: latestPostDep?.fields['Created'] || latestPreDep?.fields['Created']
        };
    } catch (error) {
        console.error('Error fetching vessel status:', error);
        return {
            status: 'unknown',
            fuelLevel: null,
            waterLevel: null,
            gasLevel: null,
            lastLocation: null,
            lastUpdate: null
        };
    }
}

/**
 * Process add-ons from booking items
 */
function extractAddOns(bookingItems) {
    const addOns = {
        'Fishing Rods': 0,
        'Ice Bags': 0,
        'Lilly Pad': 0,
        'BBQ Pack': 0,
        'Extra Life Jackets': 0,
        'Bluetooth Speaker': 0
    };
    
    if (!bookingItems) return addOns;
    
    // Parse add-ons from booking details
    const items = bookingItems.split(',').map(item => item.trim());
    items.forEach(item => {
        if (item.includes('fishing')) addOns['Fishing Rods']++;
        if (item.includes('ice')) addOns['Ice Bags']++;
        if (item.includes('lilly')) addOns['Lilly Pad']++;
        if (item.includes('bbq')) addOns['BBQ Pack']++;
        if (item.includes('life jacket')) addOns['Extra Life Jackets']++;
        if (item.includes('speaker')) addOns['Bluetooth Speaker']++;
    });
    
    return addOns;
}

module.exports = {
    getDailyBookings,
    getVesselStatus,
    extractAddOns
};
```

### 2.2 Add Routes to server.js

Add these routes to your `server.js`:

```javascript
const dailyRunSheet = require('./api/daily-run-sheet');

// Get daily run sheet data
app.get('/api/daily-run-sheet', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const bookings = await dailyRunSheet.getDailyBookings(date);
        
        // Get unique vessels from bookings
        const vessels = [...new Set(bookings.map(b => b.fields['Vessel']))].filter(Boolean);
        
        // Get status for each vessel
        const vesselStatuses = await Promise.all(
            vessels.map(async (vesselId) => {
                const status = await dailyRunSheet.getVesselStatus(vesselId);
                return { vesselId, ...status };
            })
        );
        
        // Aggregate add-ons
        const allAddOns = {};
        bookings.forEach(booking => {
            const addOns = dailyRunSheet.extractAddOns(booking.fields['Add-ons']);
            Object.entries(addOns).forEach(([item, count]) => {
                allAddOns[item] = (allAddOns[item] || 0) + count;
            });
        });
        
        res.json({
            date,
            bookings: bookings.map(b => ({
                id: b.id,
                bookingId: b.fields['Booking ID'],
                customerName: b.fields['Customer Name'],
                vesselId: b.fields['Vessel'],
                startTime: b.fields['Booking Date'],
                duration: b.fields['Duration'] || 4,
                addOns: b.fields['Add-ons'],
                onboardingStaff: b.fields['Onboarding Employee'],
                deloadingStaff: b.fields['Deloading Employee'],
                status: b.fields['Status']
            })),
            vesselStatuses,
            addOnsSummary: allAddOns,
            stats: {
                totalBookings: bookings.length,
                onWater: vesselStatuses.filter(v => v.status === 'on_water').length,
                preparing: vesselStatuses.filter(v => v.status === 'preparing').length,
                returning: vesselStatuses.filter(v => v.status === 'returning').length
            }
        });
    } catch (error) {
        console.error('Error in daily run sheet:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update vessel status (manual override)
app.post('/api/vessel-status', async (req, res) => {
    try {
        const { vesselId, status, notes } = req.body;
        
        // Create a status update record (you might want to create a new table for this)
        // For now, we'll return success
        res.json({ 
            success: true, 
            vesselId, 
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get real-time vessel locations
app.get('/api/vessel-locations', async (req, res) => {
    try {
        // Get all vessels with recent GPS data
        const response = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${POST_DEPARTURE_TABLE}`,
            {
                headers,
                params: {
                    filterByFormula: `AND(
                        {GPS Location} != '',
                        IS_AFTER({Created}, DATEADD(NOW(), -1, 'hours'))
                    )`,
                    sort: [{ field: 'Created', direction: 'desc' }],
                    pageSize: 100
                }
            }
        );
        
        const locations = {};
        response.data.records.forEach(record => {
            const vesselId = record.fields['Vessel'];
            if (!locations[vesselId]) {
                locations[vesselId] = {
                    coordinates: record.fields['GPS Location'],
                    timestamp: record.fields['Created'],
                    bookingId: record.fields['Booking']
                };
            }
        });
        
        res.json({ locations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## 3. Frontend Implementation

### 3.1 Create Daily Run Sheet Page

Create `/training/daily-run-sheet.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Run Sheet - MBH Staff Portal</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/daily-run-sheet.css">
</head>
<body>
    <div id="app">
        <!-- Loading spinner -->
        <div id="loading" class="loading-overlay">
            <div class="spinner"></div>
        </div>
        
        <!-- Main content will be inserted here -->
    </div>
    
    <script src="js/daily-run-sheet.js"></script>
</body>
</html>
```

### 3.2 JavaScript Implementation

Create `/training/js/daily-run-sheet.js`:

```javascript
// Daily Run Sheet Manager
class DailyRunSheet {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.data = null;
        this.refreshInterval = null;
        this.init();
    }
    
    async init() {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        // Load initial data
        await this.loadData();
        
        // Set up auto-refresh
        this.startAutoRefresh();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    async loadData() {
        try {
            const response = await fetch(`/api/daily-run-sheet?date=${this.currentDate}`);
            this.data = await response.json();
            this.render();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load daily run sheet data');
        }
    }
    
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="header">
                <h1><i class="fas fa-clipboard-list"></i> Daily Run Sheet</h1>
                <div class="date-selector">
                    <button id="prevDay" class="btn btn-icon">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <input type="date" id="dateInput" value="${this.currentDate}">
                    <button id="nextDay" class="btn btn-icon">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button id="today" class="btn btn-primary">Today</button>
                </div>
            </div>
            
            <div class="container">
                ${this.renderStats()}
                ${this.renderTimeline()}
                ${this.renderVesselCards()}
                ${this.renderAddOns()}
            </div>
        `;
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
    
    renderStats() {
        const { stats } = this.data;
        return `
            <div class="stats-bar">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalBookings}</div>
                    <div class="stat-label">Total Bookings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.onWater}</div>
                    <div class="stat-label">On Water Now</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.preparing}</div>
                    <div class="stat-label">Preparing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.returning}</div>
                    <div class="stat-label">Returning Soon</div>
                </div>
            </div>
        `;
    }
    
    renderTimeline() {
        // Group bookings by vessel
        const vesselBookings = {};
        this.data.bookings.forEach(booking => {
            if (!booking.vesselId) return;
            if (!vesselBookings[booking.vesselId]) {
                vesselBookings[booking.vesselId] = [];
            }
            vesselBookings[booking.vesselId].push(booking);
        });
        
        // Generate timeline HTML
        let timelineHtml = '<div class="timeline-section"><h2>Booking Timeline</h2>';
        timelineHtml += '<div class="timeline-container">';
        
        // Time headers
        timelineHtml += '<div class="time-grid"><div class="time-slot">Vessel</div>';
        for (let hour = 6; hour <= 20; hour++) {
            timelineHtml += `<div class="time-slot">${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}</div>`;
        }
        timelineHtml += '</div>';
        
        // Vessel rows
        Object.entries(vesselBookings).forEach(([vesselId, bookings]) => {
            timelineHtml += `<div class="vessel-row" data-vessel="${vesselId}">`;
            timelineHtml += `<div class="vessel-name">🚤 ${this.getVesselName(vesselId)}</div>`;
            
            // Add booking blocks
            bookings.forEach(booking => {
                const startHour = new Date(booking.startTime).getHours();
                const left = 120 + ((startHour - 6) * 85);
                const width = booking.duration * 85;
                
                timelineHtml += `
                    <div class="booking-block ${this.getBookingStatus(booking)}" 
                         style="left: ${left}px; width: ${width}px;"
                         data-booking="${booking.id}">
                        ${booking.bookingId} • ${booking.customerName}
                        ${this.getAddOnIcons(booking.addOns)}
                    </div>
                `;
            });
            
            timelineHtml += '</div>';
        });
        
        timelineHtml += '</div></div>';
        return timelineHtml;
    }
    
    renderVesselCards() {
        let html = '<h2>Fleet Status</h2><div class="vessel-grid">';
        
        this.data.vesselStatuses.forEach(vessel => {
            html += `
                <div class="vessel-card" data-vessel="${vessel.vesselId}">
                    <div class="vessel-header">
                        <div class="vessel-name-card">
                            🚤 ${this.getVesselName(vessel.vesselId)}
                        </div>
                        <div class="status-badge status-${vessel.status}">
                            ${this.formatStatus(vessel.status)}
                        </div>
                    </div>
                    <div class="vessel-details">
                        ${this.getVesselDetails(vessel)}
                    </div>
                    ${this.renderResourceGauges(vessel)}
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    renderAddOns() {
        const { addOnsSummary } = this.data;
        let html = '<div class="addons-section"><h2>Today\'s Add-ons Required</h2>';
        html += '<div class="addons-grid">';
        
        Object.entries(addOnsSummary).forEach(([item, count]) => {
            if (count > 0) {
                html += `
                    <div class="addon-item">
                        <div class="addon-icon">${this.getAddOnIcon(item)}</div>
                        <div class="addon-details">
                            <div class="addon-name">${item}</div>
                            <div class="addon-count">${count} needed</div>
                        </div>
                        <div class="addon-status">Preparing</div>
                    </div>
                `;
            }
        });
        
        html += '</div></div>';
        return html;
    }
    
    // Helper methods
    getVesselName(vesselId) {
        // In real implementation, this would lookup vessel name from data
        return `Vessel ${vesselId.slice(-3)}`;
    }
    
    formatStatus(status) {
        const statusMap = {
            'ready': 'Ready',
            'preparing': 'Preparing',
            'on_water': 'On Water',
            'returning': 'Returning',
            'maintenance': 'Maintenance'
        };
        return statusMap[status] || status;
    }
    
    getAddOnIcon(item) {
        const iconMap = {
            'Fishing Rods': '🎣',
            'Ice Bags': '🧊',
            'Lilly Pad': '🏖️',
            'BBQ Pack': '🍖',
            'Extra Life Jackets': '🦺',
            'Bluetooth Speaker': '📻'
        };
        return iconMap[item] || '📦';
    }
    
    renderResourceGauges(vessel) {
        return `
            <div class="resource-gauges">
                ${this.renderGauge('Fuel', vessel.fuelLevel)}
                ${this.renderGauge('Water', vessel.waterLevel)}
                ${this.renderGauge('Gas', vessel.gasLevel)}
            </div>
        `;
    }
    
    renderGauge(label, value) {
        const level = value || 0;
        const className = level < 25 ? 'low' : level < 50 ? 'medium' : '';
        
        return `
            <div class="gauge">
                <div class="gauge-label">${label}</div>
                <div class="gauge-bar">
                    <div class="gauge-fill ${className}" style="width: ${level}%;"></div>
                </div>
                <div class="gauge-value">${level}%</div>
            </div>
        `;
    }
    
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 30000);
    }
    
    setupEventListeners() {
        // Date navigation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'prevDay') {
                this.changeDate(-1);
            } else if (e.target.id === 'nextDay') {
                this.changeDate(1);
            } else if (e.target.id === 'today') {
                this.currentDate = new Date().toISOString().split('T')[0];
                this.loadData();
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'dateInput') {
                this.currentDate = e.target.value;
                this.loadData();
            }
        });
    }
    
    changeDate(days) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + days);
        this.currentDate = date.toISOString().split('T')[0];
        this.loadData();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new DailyRunSheet();
});
```

## 4. CSS Styling

Create `/training/css/daily-run-sheet.css`:

```css
/* Reuse existing portal styles */
@import 'portal-common.css';

/* Daily Run Sheet specific styles */
.timeline-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    overflow-x: auto;
}

.timeline-container {
    min-width: 1200px;
    position: relative;
}

.time-grid {
    display: grid;
    grid-template-columns: 120px repeat(15, 1fr);
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 1rem;
}

.vessel-row {
    display: grid;
    grid-template-columns: 120px repeat(15, 1fr);
    height: 60px;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
}

.booking-block {
    position: absolute;
    height: 45px;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.booking-block:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    z-index: 10;
}

/* Status-specific colors */
.booking-block.preparing {
    background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
}

.booking-block.on_water {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.booking-block.returning {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

/* Resource gauges */
.resource-gauges {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
}

.gauge {
    text-align: center;
}

.gauge-bar {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin: 0.25rem 0;
}

.gauge-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
}

.gauge-fill.low {
    background: #f44336;
}

.gauge-fill.medium {
    background: #FF9800;
}

/* Add-ons grid */
.addons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.addon-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.addon-item:hover {
    border-color: #DC143C;
    background: #fff;
    transform: translateY(-2px);
}

.addon-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .timeline-section {
        padding: 1rem;
    }
    
    .vessel-grid {
        grid-template-columns: 1fr;
    }
    
    .addons-grid {
        grid-template-columns: 1fr;
    }
    
    .stats-bar {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

## 5. Integration with Management Dashboard

Add the Daily Run Sheet link to `/training/management-dashboard.html`:

```javascript
// Add to the navigation menu
<div class="nav-item" onclick="navigateTo('daily-run-sheet')">
    <i class="fas fa-clipboard-list"></i>
    <span>Daily Run Sheet</span>
</div>

// Update the navigation function
function navigateTo(page) {
    switch(page) {
        // ... existing cases ...
        case 'daily-run-sheet':
            window.location.href = '/daily-run-sheet.html';
            break;
    }
}
```

## 6. Real-time Updates with WebSockets

For production implementation, add WebSocket support:

```javascript
// Add to server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

// Broadcast updates
function broadcastUpdate(type, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data }));
        }
    });
}

// When checklist is updated
app.post('/api/checklist-update', (req, res) => {
    // ... existing logic ...
    
    // Broadcast update
    broadcastUpdate('checklist', {
        vesselId: req.body.vesselId,
        type: req.body.checklistType,
        status: req.body.status
    });
});

// Client-side WebSocket connection
const ws = new WebSocket('wss://mbh-production.up.railway.app:8081');
ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    if (type === 'checklist') {
        // Update UI without full reload
        this.updateVesselStatus(data.vesselId, data.status);
    }
};
```

## 7. Testing Plan

### Unit Tests
- API endpoint responses
- Data aggregation functions
- Add-on extraction logic

### Integration Tests
- Airtable API interactions
- Real-time updates
- Date navigation

### User Acceptance Tests
- Timeline accuracy
- Status updates
- Resource tracking
- Mobile responsiveness

## 8. Deployment Checklist

- [ ] Add new API endpoints to server.js
- [ ] Create daily-run-sheet.html page
- [ ] Add CSS and JavaScript files
- [ ] Update management dashboard navigation
- [ ] Test on staging environment
- [ ] Update documentation
- [ ] Train staff on new feature
- [ ] Deploy to production
- [ ] Monitor for 24 hours

## Next Steps

1. Review this implementation guide with the team
2. Set up development branch
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
