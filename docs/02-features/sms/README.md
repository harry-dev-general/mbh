# SMS Notification System

This directory contains documentation for the MBH Staff Portal SMS notification system.

## Current Implementation

The SMS system is integrated directly into the Checkfront webhook handler, providing automated notifications for bookings and shift allocations.

## Documentation Files

### 📱 Core Implementation
- **[INTEGRATED_WEBHOOK_SMS.md](INTEGRATED_WEBHOOK_SMS.md)** - Current integrated webhook SMS system (v2.0)
- **[duplicate-prevention-fix.md](duplicate-prevention-fix.md)** - Fix for preventing duplicate SMS notifications

### 🔧 Troubleshooting
- **[SMS_BOOKING_ALLOCATION_TROUBLESHOOTING.md](SMS_BOOKING_ALLOCATION_TROUBLESHOOTING.md)** - Common issues and solutions
- **[SMS_IMPLEMENTATION_FIXED.md](SMS_IMPLEMENTATION_FIXED.md)** - Implementation fixes

### 📝 Historical/Reference
- **[SMS_NOTIFICATION_IMPLEMENTATION_SUMMARY.md](SMS_NOTIFICATION_IMPLEMENTATION_SUMMARY.md)** - Original implementation summary
- **[SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md](SMS_NOTIFICATION_FINAL_IMPLEMENTATION.md)** - Final implementation details
- **[SMS_NOTIFICATION_LESSONS_LEARNED.md](SMS_NOTIFICATION_LESSONS_LEARNED.md)** - Lessons learned during implementation
- **[SMS_NOTIFICATION_LOGIC_UPDATE.md](SMS_NOTIFICATION_LOGIC_UPDATE.md)** - Logic updates
- **[SMS_SCRIPT_INPUT_MAPPING.md](SMS_SCRIPT_INPUT_MAPPING.md)** - Script input mapping guide
- **[sms-automation-final-guide.md](sms-automation-final-guide.md)** - Original automation guide

## Quick Reference

### SMS Triggers
1. **New Bookings** - Always sent
2. **Status Changes** - Only significant changes (PAID, CANCELLED, etc.)
3. **Staff Allocations** - When staff assigned/changed
4. **Shift Responses** - Acceptance/decline notifications

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+614xxxxxxxx
SMS_RECIPIENT=+614xxxxxxxx
```

### Key Features
- Integrated with Checkfront webhook
- Duplicate prevention logic
- Smart status change detection
- Sydney timezone formatting
- Error handling (SMS failures don't block webhooks)

## Architecture Evolution

1. **v1.0**: Separate Airtable automation
2. **v2.0**: Integrated into webhook handler (current)

## Related Documentation
- [Checkfront Webhook Integration](../../../03-integrations/checkfront/WEBHOOK_INTEGRATION.md)
- [Twilio Setup Guide](../../../03-integrations/twilio/) (if exists)
