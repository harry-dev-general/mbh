# Manly Boat Hire - Interactive Staff Training Resources

## Overview
This comprehensive training resource provides everything needed for new and existing staff members at Manly Boat Hire to operate safely and professionally.

## Resources Included

### 1. **Main Training Portal** (`index.html`)
- Complete interactive training guide with all 10 modules
- Progress tracking with saved checkboxes
- Embedded video tutorials
- Visual Mermaid diagrams for procedures
- Training timeline and assessment tracking
- Certificate generation upon completion
- Print-friendly design

### 2. **Quick Reference Card** (`quick-reference.html`)
- Printable quick reference guide
- Emergency contacts and procedures
- Pre-departure checklists
- Weather limits and safe anchorages
- Troubleshooting guide
- End-of-day procedures

### 3. **Interactive Vessel Diagram** (`vessel-diagram.html`)
- Visual representation of vessel layout
- Clickable hotspots for equipment locations
- Detailed information panels
- Filter by equipment type
- Safety equipment locations
- Engine and fuel system details

### 4. **Vessel Locations Map** (`vessel-locations-map.html`)
- Interactive Google Maps integration with two views:
  - **Vessel Locations View**: All five vessel storage locations
  - **Safe Anchorages View**: Four protected anchorage areas for S/SE winds
- Toggle between views with easy-to-use buttons
- Safe anchorage areas shown as blue shaded circles (50m radius)
- Detailed access information for each location
- Get directions functionality
- Color-coded location types (swing mooring, marina berth, temporary)
- Mobile responsive design

### 5. **Simple Locations Map** (`vessel-locations-map-simple.html`)
- No API key required version
- Embedded Google Maps overview
- All vessel locations and safe anchorage areas listed
- Direct navigation links for all locations

## How to Use

1. **Initial Training**: Start with `index.html` for comprehensive training
2. **Quick Reference**: Print `quick-reference.html` for daily use
3. **Visual Learning**: Use `vessel-diagram.html` to familiarize with equipment locations

## Launching the Training

To start the training locally:
```bash
cd manly-boat-hire-training
# Open in browser
open index.html  # Mac
xdg-open index.html  # Linux
start index.html  # Windows
```

Or use a local web server:
```bash
python3 -m http.server 8000
# Then navigate to http://localhost:8000
```

## Features

- **Interactive Checklists**: Track progress through training modules
- **Visual Diagrams**: Mermaid flowcharts for procedures
- **Progress Saving**: Uses localStorage to save checklist progress
- **Mobile Responsive**: Works on tablets and phones
- **Print Friendly**: Optimized CSS for printing
- **Video Integration**: Links to YouTube training videos
- **Certificate Generation**: Creates completion certificate

## Training Modules Covered

1. Company Overview
2. Vessel Locations & Access
3. Pre-Departure Procedures
4. Customer Service Standards
5. Operating Procedures
6. Weather Procedures
7. Emergency Procedures
8. End of Day Procedures
9. Communication Protocols
10. Maintenance & Troubleshooting

## Important Contacts

- **Emergency**: 000
- **Water Police**: 02 9320 7099
- **Management (Max)**: 0403 580 669

## Updates and Maintenance

To update content:
1. Edit the relevant HTML file
2. Test all interactive features
3. Ensure print layout still works
4. Update video links if needed

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Notes

- Internet connection required for:
  - Font Awesome icons
  - Mermaid diagram rendering
  - YouTube video links
- Progress is saved locally in browser
- Clear browser data will reset progress

## Google Maps Setup

The interactive vessel locations map (`vessel-locations-map.html`) now includes your API key and shows:
- **5 Vessel Locations**: Little Manly, Balmoral, Seaforth, d'Albora Marina (Ice Cream Boat), Fergusons Marina (Work Boat)
- **4 Safe Anchorage Areas**: Forty Baskets Beach, Collins Beach, Store Beach, Quarantine Beach

The simple map (`vessel-locations-map-simple.html`) works without an API key and provides all location information with navigation links. 