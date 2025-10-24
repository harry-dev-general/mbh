# MBH Staff Portal Checklist System - Technical Architecture Guide
**Date**: October 23, 2025  
**Purpose**: Technical reference for developers and AI assistants working on the checklist system

## System Overview

The MBH Staff Portal checklist system enables staff to complete pre-departure and post-departure checklists for boat bookings via SMS reminder links. The system uses Server-Side Rendering (SSR) to ensure reliability and compatibility.

## Architecture Components

### 1. Data Storage (Airtable)

#### Base Structure
- **Base Name**: MBH Bookings Operation
- **Base ID**: `applkAFOn2qxtu7tx`

#### Key Tables
```
Bookings Dashboard (tblRe0cDmK3bG2kPf)
├── Booking ID (auto)
├── Customer Name
├── Boat (linked to Boats table)
├── Booking Date
├── Start Time
├── Finish Time
├── Status (PAID, etc.)
├── Allocated Staff (linked to Staff)
├── Onboarding Reminder Sent (checkbox)
├── Deloading Reminder Sent (checkbox)
└── [Other booking fields]

Pre-Departure Checklist (tbl9igu5g1bPG4Ahu)
├── Booking (linked to Bookings Dashboard)
├── Staff Member (linked to Staff)
├── Checklist ID (unique identifier)
├── Checklist Date/Time
├── Fuel Level Check (1-5)
├── Gas Level Check (1-5)
├── Water Level Check (1-5)
├── Cabin Cleanliness (Good/Fair/Poor)
├── Life Jackets Count (number)
├── Notes (multiline text)
└── [Other checklist fields]

Post-Departure Checklist (tblYkbSQGP6zveYNi)
├── Booking (linked to Bookings Dashboard)
├── Vessel (linked to Boats)
├── Staff Member (linked to Staff)
├── Checklist ID (unique identifier)
├── GPS Latitude
├── GPS Longitude
├── Location Address
├── Fuel Level After Use (1-5)
├── Damage (checkbox)
├── Damage Report (multiline text)
└── [Other return condition fields]

Staff (tblzByHN0LfGncdCJ)
├── Name
├── Email
├── Phone
├── Employment Type (Full Time/Part Time/Casual)
├── Status (Active/Inactive)
└── [Other staff fields]
```

### 2. Backend Services

#### Server Configuration (`server.js`)
```javascript
// Key routes
app.get('/training/pre-departure-checklist-ssr.html', checklistRenderer.handleChecklistPage);
app.get('/training/post-departure-checklist-ssr.html', checklistRenderer.handleChecklistPage);
app.post('/api/checklist/submit-ssr', checklistRenderer.handleChecklistSubmission);

// CSP Configuration
const skipCSPPaths = [
  '/training/pre-departure-checklist-ssr.html',
  '/training/post-departure-checklist-ssr.html'
];

// Helmet CSP for other routes
helmet.contentSecurityPolicy({
  directives: {
    'connect-src': ["'self'", 
      'https://api.airtable.com',
      'https://nominatim.openstreetmap.org'
    ]
  }
})
```

#### Checklist Renderer (`api/checklist-renderer.js`)
Core functions:
1. **handleChecklistPage(req, res)**
   - Extracts `bookingId` and `staffId` from query params
   - Fetches booking data from Airtable
   - Fetches employee data if staffId provided
   - Renders appropriate checklist HTML

2. **handleChecklistSubmission(req, res)**
   - Processes form data
   - Generates unique checklist ID
   - Maps form fields to Airtable fields
   - Creates record in appropriate checklist table

3. **Helper Functions**
   - `fetchBooking(bookingId)` - Retrieves booking with vessel info
   - `fetchEmployee(staffId)` - Gets staff details
   - `generateChecklistId(type, bookingId)` - Creates unique IDs
   - `renderPreDepartureChecklist(bookingData, employee)`
   - `renderPostDepartureChecklist(bookingData, employee)`

#### Reminder Scheduler (`api/booking-reminder-scheduler-fixed.js`)
Handles automated SMS reminders:
```javascript
// Key functions
processBookingReminders() {
  // 1. Fetch bookings needing reminders
  // 2. Determine recipients (allocated + full-time staff)
  // 3. Send SMS with enhanced URLs
  // 4. Mark reminders as sent
}

sendOnboardingReminder(booking, recipientStaff) {
  const checklistLink = `${BASE_URL}/training/pre-departure-checklist-ssr.html`
    + `?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
  // Send SMS via Twilio
}

sendDeloadingReminder(booking, recipientStaff) {
  const checklistLink = `${BASE_URL}/training/post-departure-checklist-ssr.html`
    + `?bookingId=${booking.id}&staffId=${recipientStaff.id}`;
  // Send SMS via Twilio
}
```

### 3. Frontend Components

#### SSR HTML Structure
Both checklists follow similar patterns:
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>/* Inline styles for reliability */</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pre/Post-Departure Checklist</h1>
      <div class="booking-info"><!-- Booking details --></div>
    </div>
    
    <form id="checklistForm">
      <!-- Resource tracking (5-level selects) -->
      <!-- Condition checks (radio/checkbox) -->
      <!-- GPS capture (post-departure only) -->
      <!-- Staff info (pre-filled if staffId) -->
      
      <button type="submit">Submit Checklist</button>
    </form>
  </div>
  
  <script>
    // Inline JavaScript for form handling
    // GPS capture logic
    // Form submission via fetch API
  </script>
</body>
</html>
```

#### Key JavaScript Functions
1. **Form Submission**
   ```javascript
   async function handleSubmit(event) {
     event.preventDefault();
     const formData = collectFormData();
     const response = await fetch('/api/checklist/submit-ssr', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         bookingId,
         checklistType,
         data: formData,
         submittedBy: staffInfo
       })
     });
   }
   ```

2. **GPS Capture (Post-Departure)**
   ```javascript
   navigator.geolocation.getCurrentPosition(
     async (position) => {
       const { latitude, longitude } = position.coords;
       // Store in hidden fields
       // Reverse geocode for address
       const address = await reverseGeocode(latitude, longitude);
     }
   );
   ```

## Integration Points

### 1. SMS to Checklist Flow
```
Booking Created → Reminder Scheduled → SMS Sent → User Clicks Link
                                          ↓
                                    SSR Checklist Page
                                          ↓
                                    Form Submission
                                          ↓
                                    Airtable Record
```

### 2. Data Validation Rules
- Booking must be in 'PAID' status
- Staff ID must exist in Staff table
- Required fields must be completed
- GPS coordinates within Australia bounds
- Checklist ID must be unique

### 3. Error Handling Patterns
```javascript
try {
  // Airtable operation
} catch (error) {
  console.error('Detailed error context:', error);
  // User-friendly error response
  res.status(500).json({ 
    error: 'Generic message',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

## Common Issues and Solutions

### 1. Airtable API Errors
- **422 Unprocessable Entity**: Check field names match exactly
- **403 Forbidden**: Verify API key permissions
- **404 Not Found**: Confirm table/base IDs

### 2. CSP Violations
- Add external domains to `connect-src`
- Skip CSP for SSR routes
- Use inline styles/scripts carefully

### 3. Reminder System Issues
- Empty recipient sets: Still mark as sent
- Timing windows: Check timezone handling
- Duplicate sends: Verify reminder flags

### 4. Field Mapping Problems
- Linked records need array format: `[recordId]`
- Dates need ISO format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Numbers stored as strings need parsing

## Development Workflow

### 1. Local Testing
```bash
# Start server
npm run dev

# Test checklist rendering
curl http://localhost:3000/training/pre-departure-checklist-ssr.html?bookingId=xxx

# Monitor logs
tail -f railway.log
```

### 2. Debugging Tools
- Railway logs: Real-time production logs
- Airtable MCP: Direct table inspection
- Test scripts: Automated verification
- Browser DevTools: Client-side debugging

### 3. Deployment Process
```bash
# Commit changes
git add -A
git commit -m "Fix: [specific issue]"

# Push to production
git push origin main

# Railway auto-deploys from main branch
```

## Security Considerations

### 1. Input Validation
- Sanitize all user inputs
- Validate booking ownership
- Check staff permissions
- Verify data types

### 2. API Security
- API keys in environment variables
- Rate limiting on endpoints
- Request size limits
- CORS configuration

### 3. Data Privacy
- No sensitive data in URLs
- Staff IDs are opaque
- GPS data anonymized
- Audit trail maintained

## Performance Optimization

### 1. SSR Benefits
- No client-side loading delays
- Reduced JavaScript parsing
- Works on slow connections
- No dependency conflicts

### 2. Caching Strategy
- Static assets: 1 year cache
- API responses: No cache
- HTML pages: No cache
- Booking data: Real-time

### 3. Database Queries
- Fetch only required fields
- Use Airtable views for filtering
- Batch operations where possible
- Index commonly searched fields

## Monitoring and Maintenance

### 1. Key Metrics
- Checklist completion rate
- Submission success rate
- Average load time
- Error frequency

### 2. Log Analysis
```javascript
// Important log patterns
"Rendering .* checklist for booking"  // Page loads
"Checklist submitted successfully"     // Completions
"Error submitting checklist"          // Failures
"Sending .* reminder for booking"     // SMS sends
```

### 3. Regular Maintenance
- Review error logs weekly
- Update field mappings as needed
- Test SMS delivery monthly
- Verify GPS accuracy quarterly

## Future Enhancement Opportunities

1. **Real-time Updates**: WebSocket for live booking changes
2. **Offline Mode**: Service worker for offline capability  
3. **Batch Operations**: Multiple checklist submissions
4. **Analytics Dashboard**: Completion metrics and trends
5. **Mobile App**: Native experience for heavy users
6. **AI Assistance**: Predictive text for common issues
7. **Photo Upload**: Damage documentation with images
8. **Digital Signatures**: Legal compliance for checklists

## Conclusion

This technical guide provides the essential knowledge needed to maintain and extend the MBH Staff Portal checklist system. The SSR approach has proven robust and reliable, while the modular architecture allows for future enhancements without disrupting core functionality.
