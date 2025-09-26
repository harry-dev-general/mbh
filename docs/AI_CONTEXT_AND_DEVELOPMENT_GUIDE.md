# MBH Staff Portal - AI Context and Development Guide

## Project Overview
**Project**: MBH Staff Portal  
**Client**: Manly Boat Hire  
**Location**: Sydney, Australia  
**Stack**: Vanilla HTML/JS/CSS + Node.js/Express backend  
**Databases**: Supabase (auth) + Airtable (data)  
**Deployment**: Railway  

## Critical Project Rules
1. **NO FRAMEWORKS** - Pure vanilla HTML/JS/CSS only
2. **PRODUCTION SYSTEM** - Real business with active bookings
3. **SYDNEY TIMEZONE** - All dates/times in Australia/Sydney
4. **API PROXY** - All Airtable calls through `/api/airtable/*`
5. **MOBILE FIRST** - Staff primarily use phones

## Project Structure
```
mbh-staff-portal/
├── training/               # All HTML pages (misnomer - production pages)
├── api/                   # Backend endpoints and webhooks
├── docs/                  # Comprehensive documentation
├── server.js              # Express server with API proxy
├── package.json           # Dependencies
└── .env                   # Environment variables
```

## Key Documentation Files
1. `/docs/AI_PROJECT_UNDERSTANDING_GUIDE.md` - Quick overview
2. `/docs/SEPTEMBER_2025_FEATURE_IMPLEMENTATIONS.md` - Latest features
3. `/docs/01-overview/PROJECT_SUMMARY.md` - Business context
4. `/docs/02-features/` - Feature-specific documentation
5. `/docs/03-integrations/` - External service integrations
6. `/docs/04-api/` - API endpoint documentation
7. `/docs/05-troubleshooting/` - Common issues and solutions

## Recent Implementations (September 2025)

### 1. Square Payment Integration
- **Webhook**: `/api/square-webhook.js`
- **Purpose**: Sync ice cream boat sales
- **Security**: HMAC-SHA256 signature verification
- **Filter**: Only "Ice-Cream-Boat-Sales" category
- **Table**: Ice Cream Boat Sales (`tblTajm845Fiij8ud`)

### 2. Ice Cream Sales Dashboard
- **Page**: `/training/ice-cream-sales.html`
- **Features**: Live stats, filtering, export, auto-refresh
- **Access**: Manager-only via management dashboard
- **Stats**: Sales Today, Revenue Today (removed avg sale & vessels)

### 3. Performance Optimizations
- **Timeouts**: 30s for sales, 15s for stats
- **Payload**: Reduced from 100 to 50 records
- **Loading**: Sequential with 500ms delays
- **Refresh**: 60s interval (was 30s)
- **Date Filters**: Use `IS_SAME()` for Airtable dates

### 4. Security Enhancements
- **Google Maps API**: Moved to `/api/config` endpoint
- **Environment Variables**: All sensitive data secured
- **Webhook Verification**: Square signature validation

### 5. UI Improvements
- **Add-on Indicators**: Orange "+" badge on bookings
- **Phone Capture**: From Checkfront webhooks
- **Loading States**: Fixed browser tab animations
- **Manual Refresh**: User-controlled data updates

## Airtable Structure

### Base: MBH Bookings Operation (`applkAFOn2qxtu7tx`)

#### Key Tables:
1. **Bookings Dashboard** (`tblRe0cDmK3bG2kPf`)
   - Customer bookings from Checkfront
   - Phone numbers, add-ons, status
   
2. **Ice Cream Boat Sales** (`tblTajm845Fiij8ud`)
   - Square payment records
   - Sales data and statistics
   
3. **Shift Allocations** (`tbl22YKtQXZtDFtEX`)
   - Staff assignments
   - Onboarding/deloading shifts
   
4. **MBH Roster** (`tblR5VflL9shGB1vS`)
   - Staff information
   - Availability and preferences

## Common Patterns

### Date Handling
```javascript
// Always use Sydney timezone
const sydneyTime = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney'
});

// Format for Airtable
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Airtable date filtering
const filter = `IS_SAME({Sale Date}, '${formatDate(today)}', 'day')`;
```

### API Calls with Timeout
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
} catch (error) {
    if (error.name === 'AbortError') {
        // Handle timeout
    }
}
```

### Error Handling
```javascript
try {
    // API call
} catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load data</p>
        </div>
    `;
}
```

## Environment Variables
```bash
# Core APIs
AIRTABLE_API_KEY=
GOOGLE_MAPS_API_KEY=

# Square Integration
SQUARE_ACCESS_TOKEN=
SQUARE_APPLICATION_ID=
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_WEBHOOK_SIGNATURE_KEY=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Deployment
BASE_URL=https://mbh-production-f0d1.up.railway.app
PORT=3000
NODE_ENV=production
```

## Development Workflow

### Local Development
```bash
cd mbh-staff-portal
npm install
npm run dev  # Uses nodemon for auto-reload
# Access at http://localhost:8080
```

### Testing
1. Use real dates (current September 2025)
2. Test on mobile devices
3. Check Sydney timezone handling
4. Verify Airtable field names exactly

### Deployment
```bash
git add .
git commit -m "Description"
git push origin main
# Railway auto-deploys from main branch
railway logs -f  # Monitor deployment
```

## Troubleshooting Guide

### Common Issues
1. **Loading Forever**: Airtable API timeout - add request timeouts
2. **No Data**: Check date filters - use `IS_SAME()` for dates
3. **Auth Loops**: Use `getSession()` not `getUser()`
4. **Missing Fields**: Verify exact Airtable field names
5. **Map Issues**: Check `/api/config` endpoint

### Performance Issues
- Airtable rate limit: 5 req/sec per base
- Use sequential loading with delays
- Reduce payload sizes
- Implement request timeouts

## Future Considerations
1. **Server-side caching** for Airtable data
2. **Background sync** with service workers
3. **Pagination** for large datasets
4. **Real-time updates** via webhooks

## Quick Reference

### Key URLs
- Production: https://mbh-production-f0d1.up.railway.app
- Management Dashboard: /training/management-dashboard.html
- Ice Cream Sales: /training/ice-cream-sales.html
- Daily Run Sheet: /training/daily-run-sheet.html

### API Endpoints
- `/api/airtable/{baseId}/{tableId}` - Airtable proxy
- `/api/config` - Frontend configuration
- `/api/square-webhook` - Square payment webhook
- `/api/checkfront-webhook` - Booking webhook
- `/api/send-sms` - SMS notifications

### Testing Commands
```javascript
// Check auth
supabase.auth.getSession()

// Test Airtable
fetch('/api/airtable/applkAFOn2qxtu7tx/tblRe0cDmK3bG2kPf?maxRecords=1')
    .then(r => r.json())
    .then(console.log)

// Current Sydney time
new Date().toLocaleString('en-AU', {timeZone: 'Australia/Sydney'})
```

## Important Notes
- Always maintain backwards compatibility
- Test thoroughly before deploying
- Document any new patterns
- Follow existing code style
- Consider mobile experience first
- Handle missing/null data gracefully
- Use console.log for debugging (production system)

---

*This guide is optimized for AI consumption. For specific implementation details, refer to the documentation files listed above.*
