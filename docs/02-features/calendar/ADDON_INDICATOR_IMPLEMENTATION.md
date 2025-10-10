# Add-On Indicator Implementation for Calendar Views

**Date**: September 26, 2025  
**Version**: 1.0

## Overview

This document describes the implementation of add-on indicators across all calendar views in the MBH Staff Portal. The indicators provide a visual cue when bookings contain add-ons without cluttering the booking slots.

## Design Approach

### Visual Design
- **Symbol**: Plus icon (+) in a small badge
- **Position**: Top-right corner of booking blocks
- **Style**: Semi-transparent background with contrasting color
- **Size**: Small enough not to interfere with text

### Implementation Details

1. **Daily Run Sheet** (`/daily-run-sheet.html`)
   - Already has `getAddOnIcons()` function
   - Shows emoji icons inline
   - Will add corner badge for consistency

2. **Management Dashboard** (`/management-dashboard.html`)
   - Weekly schedule view
   - Add corner badge to booking blocks

3. **Management Allocations** (`/management-allocations.html`)
   - Already has add-ons data available
   - Add corner badge to booking blocks

## CSS Implementation

```css
/* Add-on indicator badge */
.addon-indicator {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ff9800;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    z-index: 15;
}

/* Ensure booking blocks are positioned for absolute children */
.booking-block,
.calendar-event,
.allocation-block {
    position: relative;
}
```

## JavaScript Implementation

```javascript
// Check if booking has add-ons
function hasAddOns(booking) {
    return booking['Add-ons'] && 
           booking['Add-ons'].trim() !== '' && 
           booking['Add-ons'] !== 'None';
}

// Create add-on indicator element
function createAddOnIndicator() {
    return '<span class="addon-indicator" title="This booking includes add-ons">+</span>';
}
```

## Usage Pattern

When creating booking blocks:
```javascript
const addOnIndicator = hasAddOns(booking) ? createAddOnIndicator() : '';
bookingBlock.innerHTML = `
    ${addOnIndicator}
    <!-- existing booking content -->
`;
```

## Benefits

1. **Non-intrusive**: Doesn't interfere with existing text
2. **Consistent**: Same visual across all views
3. **Informative**: Quick visual scan for add-ons
4. **Accessible**: Includes tooltip for clarity

## Testing Checklist

- [ ] Badge appears on bookings with add-ons
- [ ] Badge doesn't appear on bookings without add-ons
- [ ] Badge positioned correctly in all views
- [ ] Badge doesn't overlap important information
- [ ] Tooltip shows on hover
- [ ] Works on mobile devices
