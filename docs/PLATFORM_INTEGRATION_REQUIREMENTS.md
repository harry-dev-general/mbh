# Platform Integration Requirements - MBH Staff Portal

## Executive Summary
This document outlines platform-specific requirements and integration patterns discovered during the development of the MBH Staff Portal, particularly focusing on the SMS notification system implementation in August 2025.

## Platform Stack Overview

### Core Platforms
1. **Railway** - Deployment and hosting
2. **Airtable** - Primary database
3. **Supabase** - Authentication
4. **Twilio** - SMS notifications
5. **GitHub** - Version control with push protection

## Railway Platform Requirements

### Environment Configuration
```yaml
Required Variables:
  PORT: 8080
  SUPABASE_URL: https://[project].supabase.co
  SUPABASE_ANON_KEY: [public anon key]
  AIRTABLE_API_KEY: [personal access token]
  TWILIO_ACCOUNT_SID: [account sid]
  TWILIO_AUTH_TOKEN: [auth token]
  TWILIO_FROM_NUMBER: [phone number]
  BASE_URL: https://[app-name].up.railway.app
  MANAGER_PHONE_1: [optional]
  MANAGER_PHONE_2: [optional]
```

### Deployment Configuration
- **Auto-Deploy**: Enabled from main branch
- **Build Command**: None (static files)
- **Start Command**: `node server.js`
- **Health Check**: GET /
- **Region**: Auto-selected

### Railway-Specific Considerations
1. **Port Binding**: Must use `process.env.PORT`
2. **HTTPS**: Automatically provided
3. **Static Files**: Served directly if no server intercepts
4. **Logs**: Available via Railway dashboard
5. **Restart Policy**: Automatic on crash

## Airtable Integration Requirements

### API Configuration
```javascript
const AIRTABLE_CONFIG = {
    baseUrl: 'https://api.airtable.com/v0',
    baseId: 'applkAFOn2qxtu7tx',
    headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
    },
    rateLimit: 5, // requests per second
    pageSize: 100 // max records per request
};
```

### Critical Table Structure Requirements

#### Employee Details Table
**Required Fields** (with variations discovered):
```javascript
{
    'Name': 'string',
    'Email': 'email',
    'Phone': 'phone',       // Field name variation 1
    'Mobile': 'phone',      // Field name variation 2
    'Mobile Number': 'phone' // Field name variation 3
}
```

#### Shift Allocations Table
**Required Fields for SMS System**:
```javascript
{
    'Employee': ['linkedRecord'],     // Must be array
    'Shift Date': 'date',
    'Start Time': 'string',
    'End Time': 'string',
    'Shift Type': 'string',
    'Response Status': 'string',      // Added for SMS
    'Response Date': 'datetime',      // Added for SMS
    'Response Method': 'string',      // Added for SMS
    'Booking': ['linkedRecord']       // Optional, array
}
```

#### Bookings Dashboard Table
**Fields Used by SMS System**:
```javascript
{
    'Booking Date': 'date',
    'Customer Name': 'string',
    'Start Time': 'string',
    'Finish Time': 'string',
    'Onboarding Time': 'formula',     // Read-only
    'Deloading Time': 'formula',      // Read-only
    'Onboarding Employee': ['linkedRecord'],
    'Deloading Employee': ['linkedRecord']
}
```

### Airtable API Patterns

#### Pattern 1: Flexible Field Access
```javascript
// Always implement fallback for field variations
function getEmployeePhone(employee) {
    return employee['Phone'] || 
           employee['Mobile'] || 
           employee['Mobile Number'] ||
           employee['Contact Number'] || // Future-proofing
           null;
}
```

#### Pattern 2: Linked Record Handling
```javascript
// ALWAYS use arrays for linked records
const payload = {
    fields: {
        'Employee': [employeeId],        // Array required
        'Booking': bookingId ? [bookingId] : undefined
    }
};
```

#### Pattern 3: Error Handling
```javascript
try {
    const response = await fetch(airtableUrl, options);
    if (response.status === 422) {
        // Field validation error - log full response
        const error = await response.json();
        console.error('Airtable validation error:', error);
    }
} catch (error) {
    // Network or other error
    console.error('Airtable request failed:', error);
}
```

## Supabase Integration Requirements

### Authentication Configuration
```javascript
const supabaseConfig = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // Important for magic links
    }
};
```

### Session Management Requirements
1. **Standalone Pages**: Some pages (like confirmation pages) should NOT require authentication
2. **Auth State Listeners**: Should only handle specific events to avoid loops
3. **Session Context**: API endpoints don't share browser session context

### Critical Discoveries
```javascript
// DON'T reload on all auth events
supabase.auth.onAuthStateChange((event, session) => {
    // Only handle logout
    if (event === 'SIGNED_OUT') {
        window.location.href = '/auth.html';
    }
    // Ignore SIGNED_IN to prevent reload loops
});
```

## Twilio SMS Requirements

### Configuration
```javascript
const twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
    // Australian number format
    numberFormat: /^\+61\d{9}$/
};
```

### Message Structure Requirements
- **Max Length**: 160 characters (or use concatenated SMS)
- **Unicode Support**: Reduces character limit
- **Link Shortening**: Not implemented (full URLs used)
- **Delivery Reports**: Available via webhook (not implemented)

### Best Practices Discovered
1. **Phone Number Validation**:
```javascript
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Australian mobile
    if (cleaned.startsWith('04')) {
        return '+61' + cleaned.substring(1);
    }
    // Already has country code
    if (cleaned.startsWith('614')) {
        return '+' + cleaned;
    }
    // Invalid format
    throw new Error('Invalid Australian mobile number');
}
```

2. **Message Template Pattern**:
```javascript
const templates = {
    shiftNotification: {
        booking: '🚤 MBH Staff Alert - New {role} Assignment\n\n' +
                'Hi {name},\n\n' +
                'You\'ve been assigned to a customer booking:\n\n' +
                '📅 {date}\n' +
                '⏰ {time}\n' +
                '👤 Customer: {customer}\n' +
                '📋 Role: {role}\n\n' +
                'Please confirm your availability:\n\n' +
                '✅ ACCEPT: {acceptLink}\n\n' +
                '❌ DECLINE: {declineLink}\n\n' +
                'Reply by clicking a link above.',
        general: '📋 MBH Staff Alert - New Shift Assignment\n\n' +
                'Hi {name},\n\n' +
                'You\'ve been assigned a new shift:\n\n' +
                '📅 {date}\n' +
                '⏰ {time}\n' +
                '📋 Type: {type}\n\n' +
                'Please confirm your availability:\n\n' +
                '✅ ACCEPT: {acceptLink}\n\n' +
                '❌ DECLINE: {declineLink}\n\n' +
                'Reply by clicking a link above.'
    }
};
```

## GitHub Integration Requirements

### Push Protection
GitHub's push protection will block commits containing:
- API keys and tokens
- Passwords and secrets
- Private keys
- Webhook URLs with tokens

### Resolution Process
1. Remove sensitive data from code
2. Move to environment variables
3. Use `git reset --soft HEAD~n` to uncommit
4. Recommit with clean code

### Example Fix
```javascript
// BLOCKED by push protection
const client = twilio('ACxxxxx', 'auth_token');

// ACCEPTED
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
```

## Express.js Server Requirements

### Middleware Order (Critical)
```javascript
// 1. Custom middleware (CSP bypass)
app.use((req, res, next) => {
    if (shouldBypassCSP(req.path)) {
        return next();
    }
    helmetMiddleware(req, res, next);
});

// 2. CORS (if needed)
app.use(cors());

// 3. Body parsing
app.use(express.json());

// 4. Specific routes
app.get('/training/shift-confirmation.html', specificHandler);

// 5. Static files (last)
app.use(express.static(path.join(__dirname, 'training')));

// 6. API routes
app.use('/api', apiRouter);

// 7. Catch-all 404
app.use((req, res) => {
    res.status(404).send('Not Found');
});
```

### Response Patterns
```javascript
// HTML Response
res.send(`<!DOCTYPE html><html>...</html>`);

// JSON API Response
res.json({ success: true, data: {} });

// File Response
res.sendFile(path.join(__dirname, 'file.html'));

// Redirect
res.redirect(302, '/new-path');

// Error Response
res.status(400).json({ error: 'Bad Request' });
```

### Security Headers
```javascript
const securityConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", supabaseUrl, airtableUrl]
        }
    },
    // Other Helmet options...
};
```

## Integration Testing Requirements

### Test Matrix
| Component | Test Scenario | Expected Result |
|-----------|--------------|-----------------|
| Railway | Environment variables loaded | All process.env values available |
| Airtable | Field name variations | Phone found under any field name |
| Airtable | Linked records | Arrays accepted, single values rejected |
| Supabase | Session management | No reload loops |
| Twilio | SMS delivery | Message received within 30 seconds |
| Express | Route precedence | Specific routes override static |
| Express | CSP bypass | Confirmation page loads without CSP |

### Critical Test Cases
1. **Cross-Platform Token Flow**:
   - Generate token in Node.js
   - Send via Twilio
   - Click link on mobile
   - Process in Express
   - Update in Airtable
   - Display confirmation

2. **Field Variation Handling**:
   - Create employees with different phone field names
   - Verify SMS sends to all variants
   - Confirm no failures due to missing fields

3. **Session Isolation**:
   - Access magic link without login
   - Verify confirmation page loads
   - Ensure no auth redirect
   - Confirm data updates

## Performance Considerations

### Airtable API Limits
- **Rate Limit**: 5 requests/second
- **Page Size**: 100 records max
- **Timeout**: 30 seconds
- **Retry Strategy**: Exponential backoff

### Optimization Patterns
```javascript
// Batch operations where possible
const updates = records.map(record => ({
    id: record.id,
    fields: { /* updates */ }
}));
await updateBatch(updates);

// Cache frequently accessed data
const employeeCache = new Map();
function getCachedEmployee(id) {
    if (!employeeCache.has(id)) {
        employeeCache.set(id, fetchEmployee(id));
    }
    return employeeCache.get(id);
}
```

## Monitoring Requirements

### Key Metrics
1. **SMS Delivery Rate**: Track successful deliveries
2. **Token Expiration**: Monitor expired vs used tokens
3. **API Rate Limiting**: Track 429 responses
4. **Response Times**: Monitor Airtable API latency
5. **Error Rates**: Track 4xx and 5xx responses

### Logging Strategy
```javascript
// Structured logging
console.log('SMS_SENT', {
    to: phoneNumber,
    messageId: twilioResponse.sid,
    timestamp: new Date().toISOString(),
    allocationId: allocationId,
    employeeId: employeeId
});

// Error logging
console.error('SMS_FAILED', {
    error: error.message,
    code: error.code,
    phoneNumber: phoneNumber,
    timestamp: new Date().toISOString()
});
```

## Compliance & Security

### Data Protection
1. **PII Handling**: Phone numbers, names, emails are PII
2. **Token Security**: Use crypto-random generation
3. **HTTPS Only**: All production traffic must be HTTPS
4. **Environment Variables**: Never commit secrets

### Audit Requirements
```javascript
// Log all state changes
function logAuditEvent(event) {
    console.log('AUDIT', {
        event: event.type,
        user: event.userId,
        target: event.targetId,
        timestamp: new Date().toISOString(),
        metadata: event.metadata
    });
}
```

## Future Platform Considerations

### Scalability Path
1. **Token Storage**: Move from memory to Redis
2. **SMS Queue**: Implement job queue for SMS
3. **Caching Layer**: Add Redis for Airtable data
4. **Rate Limiting**: Implement per-user limits
5. **Monitoring**: Add APM solution

### Platform Alternatives
| Current | Alternative | Migration Complexity |
|---------|------------|---------------------|
| Railway | Vercel, Heroku | Low |
| Airtable | PostgreSQL | High |
| Twilio | AWS SNS, MessageBird | Medium |
| In-memory tokens | Redis, Database | Low |

---
*Document Created: August 2025*
*Platform Stack Version: Production v2.0*
