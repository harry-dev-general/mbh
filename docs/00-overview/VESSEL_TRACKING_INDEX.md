# Vessel Location Tracking - Documentation Index

**Feature Status**: ✅ Complete and Operational  
**Implementation Date**: September 10-11, 2025

## Quick Navigation

### For Users
- **[How to capture vessel location](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md#staff-completing-post-departure-checklist)** - Step-by-step guide
- **[Viewing vessel locations](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md#viewing-vessel-locations)** - Using the map interface
- **[Troubleshooting location issues](../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md#location-capture-issues)** - Common problems

### For Developers
- **[Technical Overview](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)** - Complete implementation guide
- **[API Reference](../04-technical/VESSEL_STATUS_API.md)** - Endpoint documentation
- **[Frontend Implementation](../04-technical/LOCATION_TRACKING_FRONTEND.md)** - Client-side details
- **[Airtable Integration](../03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md)** - Database specifics

### For Troubleshooting
- **[Common Issues](../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md)** - Solutions guide
- **[Debugging Tools](../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md#debugging-tools)** - Console commands
- **[Mobile Issues](../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md#mobile-specific-issues)** - Device-specific problems

## Feature Summary

The vessel location tracking system allows MBH staff to:
- 📍 Capture GPS location during Post-Departure Checklist
- 🗺️ View all vessel locations on an interactive map
- 📱 See vessel locations in booking allocation popups
- ✏️ Manually update vessel locations from Management Dashboard
- 🕐 Track when and by whom locations were last updated

## Technical Stack

- **Frontend**: HTML5 Geolocation API, Google Maps JavaScript API
- **Backend**: Node.js/Express REST API
- **Database**: Airtable (Post-Departure Checklist table)
- **Deployment**: Railway (auto-deploy from GitHub)

## Key Integration Points

1. **Post-Departure Checklist** - Location capture interface
2. **Vessel Status API** - Aggregates location with maintenance data
3. **Vessel Locations Map** - Real-time visualization
4. **My Schedule** - Mini-maps in allocation popups
5. **Management Dashboard** - Manual update capability

## Quick Start for New Developers

1. Read the [Feature Overview](../02-features/vessel-tracking/VESSEL_LOCATION_TRACKING_IMPLEMENTATION.md)
2. Review [Airtable field structure](../03-integrations/airtable/LOCATION_TRACKING_AIRTABLE.md#table-structure)
3. Understand the [API data flow](../04-technical/VESSEL_STATUS_API.md#data-sources)
4. Check [browser requirements](../04-technical/LOCATION_TRACKING_FRONTEND.md#browser-compatibility)

## Related Systems

- **Google Maps API** - Geocoding and map display
- **Airtable API** - Data storage and retrieval
- **Browser Geolocation** - GPS coordinate capture
- **Railway Deployment** - Production hosting

## Maintenance Notes

- Google Maps API key is stored in environment variables
- Airtable API has rate limits (5 req/sec)
- Location accuracy depends on device GPS capability
- HTTPS is required for geolocation to work

## Contact & Support

For issues or questions about the vessel location tracking system:
1. Check the [troubleshooting guide](../05-troubleshooting/VESSEL_LOCATION_TRACKING_TROUBLESHOOTING.md)
2. Review [session summary](../07-handover/session-summaries/SEPTEMBER_11_2025_LOCATION_TRACKING.md)
3. Check browser console for error messages
4. Verify Airtable field permissions

---

*This documentation index provides quick access to all vessel location tracking documentation. For the complete MBH Staff Portal documentation, see the main [README](../README.md).*
