# Vessel Maintenance Dashboard - Live Summary

**Date**: September 5, 2025  
**Status**: ✅ LIVE IN PRODUCTION

## What's Working

The vessel maintenance dashboard is now live and displaying real-time data from your Pre and Post-Departure checklists!

### Current Fleet Status (from API)
- **Junior** (12 Person BBQ): 🚨 Critical - Low fuel (25%) and gas (25%)
- **Sandstone** (8 Person BBQ): ⚠️ Warning - Low water (25%), needs attention
- **5 other vessels**: No recent checklist data

## How It Works

1. **Data Source**: Uses the most recent checklist (pre or post-departure)
2. **Real-time Updates**: Fetches current data from completed checklists
3. **Smart Alerts**: 
   - 🚨 Critical: Fuel/gas at 25% or below
   - ⚠️ Warning: Water low, needs attention, old data
4. **Visual Gauges**: Color-coded fuel/gas/water levels

## Access the Dashboard

1. Go to: https://mbh-production-f0d1.up.railway.app/training/management-dashboard.html
2. Click on the **"Vessel Maintenance"** tab
3. You'll see:
   - Fleet summary alert (1 critical, 1 warning)
   - Individual vessel cards with gauges
   - Last check information
   - Specific alerts for each vessel

## API Endpoint

The data is available at:
```
GET https://mbh-production-f0d1.up.railway.app/api/vessels/maintenance-status
```

## Next Steps

To get more vessels showing data:
1. Complete Pre/Post-Departure checklists for other vessels
2. The dashboard will automatically show their status

## Quick Actions (Future Enhancement)

The API supports quick fuel/gas/water updates:
```
POST /api/vessels/:id/quick-update
{
  "type": "fuel",
  "level": "Full",
  "staffId": "recXXX"
}
```

## Troubleshooting

If a vessel shows "No checklist data":
- It means no checklists have been completed in the last 30 days
- Complete a Pre or Post-Departure checklist to see data
