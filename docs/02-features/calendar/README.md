# Calendar Features Documentation

This directory contains documentation for calendar-related features in the MBH Staff Portal.

## Files

- `ADDON_INDICATOR_IMPLEMENTATION.md` - Implementation guide for add-on indicators on calendar events (September 26, 2025)
- `FULLCALENDAR_MIGRATION_PLAN.md` - Technical analysis and migration plan for FullCalendar implementation (October 10, 2025)
- `FULLCALENDAR_IMPLEMENTATION_PROMPT.md` - Ready-to-use prompt for implementing FullCalendar (October 10, 2025)

## Current Status

The Weekly Schedule component on `/training/management-allocations.html` currently uses a custom CSS Grid implementation that has issues with overlapping events. A migration to FullCalendar v6 has been approved to resolve these issues.

## Implementation Priority

1. Read `FULLCALENDAR_MIGRATION_PLAN.md` for technical details
2. Use `FULLCALENDAR_IMPLEMENTATION_PROMPT.md` to implement the migration
3. Ensure add-on indicators continue working as per `ADDON_INDICATOR_IMPLEMENTATION.md`
