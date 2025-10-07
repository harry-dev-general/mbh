# AI Assistant Onboarding - MBH Staff Portal

You are about to work on the MBH Staff Portal, a production web application for Manly Boat Hire's boat rental operations in Sydney, Australia.

## 🚨 CRITICAL RULES
1. **NO FRAMEWORKS** - This project uses vanilla HTML/JS/CSS only. No React, Vue, Angular, etc.
2. **PRODUCTION SYSTEM** - Real business with active bookings and staff. Be careful with changes.
3. **SYDNEY TIMEZONE** - All date/time operations must use Australia/Sydney timezone.
4. **API PROXY** - All Airtable API calls must go through the backend proxy at `/api/airtable/*`
5. **MOBILE FIRST** - Staff primarily use phones. Test all changes on mobile viewports.

## 📚 ESSENTIAL DOCUMENTATION

Start by reading these files in order:

1. **Quick Start**: `/docs/AI_PROJECT_UNDERSTANDING_GUIDE.md`
   - Project overview and key concepts
   - Common patterns and issues
   - Quick reference commands

2. **Technical Context**: `/docs/AI_CONTEXT_AND_DEVELOPMENT_GUIDE.md`  
   - Comprehensive technical guide
   - API endpoints and patterns
   - Environment variables

3. **Recent Features**: `/docs/SEPTEMBER_2025_FEATURE_IMPLEMENTATIONS.md`
   - Latest implementations (Sept 2025)
   - Square integration details
   - Performance optimizations

4. **Business Context**: `/docs/01-overview/PROJECT_SUMMARY.md`
   - Understanding the business
   - User roles and workflows
   - Operational requirements

## 🗂️ PROJECT STRUCTURE

```
mbh-staff-portal/
├── training/               # HTML pages (production pages, not training)
│   ├── management-dashboard.html    # Main manager dashboard
│   ├── ice-cream-sales.html        # Ice cream sales tracking
│   ├── daily-run-sheet.html        # Daily operations view
│   └── ...                         # Other pages
├── api/                   # Backend endpoints
│   ├── square-webhook.js          # Square payment integration
│   ├── checkfront-webhook.js      # Booking system webhook
│   └── ...                       # Other endpoints
├── docs/                  # Comprehensive documentation
│   ├── 02-features/              # Feature-specific docs
│   ├── 03-integrations/          # External service docs
│   └── 05-troubleshooting/       # Common issues
├── server.js              # Express server with API proxy
└── package.json          # Dependencies
```

## 🔑 KEY INTEGRATIONS

### Airtable (Primary Database)
- Base ID: `applkAFOn2qxtu7tx`
- Main Tables:
  - Bookings Dashboard: `tblRe0cDmK3bG2kPf`
  - Ice Cream Boat Sales: `tblTajm845Fiij8ud`
  - Shift Allocations: `tbl22YKtQXZtDFtEX`
  - MBH Roster: `tblR5VflL9shGB1vS`

### External Services
- **Supabase**: Authentication only
- **Square**: Payment processing for ice cream sales
- **Checkfront**: Booking system webhooks
- **Twilio**: SMS notifications
- **Google Maps**: Vessel tracking

## 💡 COMMON PATTERNS

### Date Handling
```javascript
// Always use Sydney timezone
const sydneyNow = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney'
});

// Airtable date filtering - MUST use IS_SAME()
const filter = `IS_SAME({Sale Date}, '2025-09-26', 'day')`;
```

### API Calls with Timeout
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
    const response = await fetch('/api/airtable/...', {
        signal: controller.signal
    });
    clearTimeout(timeoutId);
} catch (error) {
    if (error.name === 'AbortError') {
        // Handle timeout
    }
}
```

### Error Handling
- Always handle null/missing Airtable data
- Show user-friendly error messages
- Log errors to console for debugging
- Continue with partial data when possible

## ⚠️ KNOWN ISSUES

1. **Airtable API Performance**
   - Rate limit: 5 requests/second per base
   - Can take minutes to respond during peak times
   - Solution: Use timeouts and manual refresh buttons

2. **Date Filtering**
   - Simple equality (`=`) doesn't work with Airtable date fields
   - Must use `IS_SAME()` function for date comparisons

3. **Loading Animations**
   - Browser tabs can show infinite loading
   - Solution: Proper cleanup of intervals and fetch requests

## 🚀 CURRENT FEATURES (September 2025)

### Ice Cream Sales Integration
- Square webhook processes payments
- Filters by "Ice-Cream-Boat-Sales" category
- Live dashboard at `/training/ice-cream-sales.html`
- Stats show Sales Today and Revenue Today

### Visual Enhancements
- Add-on indicators (orange "+" badge) on bookings
- Phone number capture from Checkfront
- Improved loading states and error messages

### Security Improvements
- Google Maps API key served via backend
- All sensitive data in environment variables
- Webhook signature verification

## 📝 DEVELOPMENT WORKFLOW

1. **Local Setup**
   ```bash
   cd mbh-staff-portal
   npm install
   npm run dev  # Runs on port 8080
   ```

2. **Make Changes**
   - Follow existing patterns
   - Test on mobile viewport
   - Verify Sydney timezone handling

3. **Deploy**
   ```bash
   git add .
   git commit -m "Clear description"
   git push origin main
   # Railway auto-deploys
   ```

4. **Monitor**
   ```bash
   railway logs -f
   ```

## 🎯 NEXT STEPS

1. Review the documentation files listed above
2. Check current TODO items in the codebase
3. Test the existing features to understand the flow
4. Look for any `TODO` or `FIXME` comments

## 🆘 NEED HELP?

- Check `/docs/05-troubleshooting/` for common issues
- Review existing code for patterns
- Test in Sydney timezone context
- Remember: This is a production system with real users

---

**Remember**: When in doubt, follow existing patterns. This is a working production system - don't introduce new frameworks or major architectural changes without explicit requirements.

Good luck! The portal is well-documented and follows consistent patterns. Take time to understand the existing code before making changes.
