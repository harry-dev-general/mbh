# Platform Requirements and Technical Considerations

**Last Updated**: September 16, 2025  
**Version**: 2.0

## Overview

This document outlines the technical requirements and considerations for the MBH Staff Portal, including platform dependencies, API integrations, and deployment requirements.

## Platform Stack

### Hosting & Deployment

**Railway** (Primary Host)
- Auto-deployment from GitHub main branch
- Node.js 18+ runtime
- Environment variable management
- SSL/HTTPS included
- Logs and monitoring

**Requirements**:
- GitHub repository connected
- Environment variables configured
- package.json with start script

### Core Technologies

**Backend**:
- Node.js 18+ (Express.js server)
- RESTful API architecture
- Axios for HTTP requests
- CORS enabled for frontend

**Frontend**:
- Vanilla JavaScript (ES6+)
- HTML5/CSS3
- Google Maps JavaScript API
- Mobile-responsive design

**Authentication**:
- Supabase Auth
- Email/password authentication
- Session management

## External Service Requirements

### Airtable

**Account Requirements**:
- Pro plan or higher (for API access)
- API rate limits: 5 requests/second
- Bases: 
  - MBH Bookings Operation (applkAFOn2qxtu7tx)
  - Vessel Maintenance (if separate)

**API Key Permissions**:
- Read access to all tables
- Write access to:
  - Bookings Dashboard
  - Shift Allocations
  - Employee Details
  - Weekly Availability
  - Checklists
  - Announcements

### Twilio

**Account Requirements**:
- Active account with SMS credits
- Verified phone number for sending
- Australian SMS capability (+61)

**Configuration**:
- Account SID
- Auth Token  
- From Number (verified)
- Webhook capability (optional)

### Google APIs

**Required APIs**:
- Maps JavaScript API
- Geocoding API (for location features)
- Places API (optional)

**Configuration**:
- API key with domain restrictions
- Billing account (for production usage)

### Supabase

**Project Requirements**:
- Authentication enabled
- Email provider configured
- Redirect URLs configured
- RLS policies (if using database)

## Environment Variables

### Required Variables

```bash
# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXX.XXXXXXXXXXXXX
AIRTABLE_BASE_ID=applkAFOn2qxtu7tx

# Twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_FROM_NUMBER=+61XXXXXXXXX

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional
SMS_RECIPIENT=+61414960734  # Default SMS recipient
NODE_ENV=production
PORT=8080
```

### Security Considerations

1. **Never commit credentials** to version control
2. **Use environment variables** for all secrets
3. **Implement API key rotation** schedule
4. **Domain restrictions** on Google Maps API
5. **HTTPS required** for production

## Browser Requirements

### Desktop Browsers
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Browsers
- iOS Safari 14+
- Chrome for Android
- Samsung Internet 14+

### Required Features
- JavaScript ES6+ support
- Local Storage
- Geolocation API (for vessel tracking)
- Fetch API
- CSS Grid/Flexbox

## API Rate Limits

### Airtable
- **Rate**: 5 requests per second
- **Mitigation**: 
  - Request queuing
  - Caching (5-30 min TTL)
  - Batch operations where possible

### Twilio
- **SMS**: 1 message per second per number
- **API**: 1 request per second
- **Mitigation**:
  - Queue SMS sends
  - Retry with backoff

### Google Maps
- **Free tier**: $200/month credit
- **Geocoding**: 50 requests/second
- **Maps JS**: Unlimited loads
- **Mitigation**:
  - Cache geocoding results
  - Minimize map instances

## Performance Considerations

### Frontend Optimization

1. **Lazy Loading**:
   - Load Google Maps only when needed
   - Defer non-critical scripts
   - Lazy load images

2. **Caching Strategy**:
   ```javascript
   // 5-minute cache for vessel data
   const CACHE_TTL = 5 * 60 * 1000;
   
   // 30-minute cache for employee data
   const EMPLOYEE_CACHE_TTL = 30 * 60 * 1000;
   ```

3. **Data Pagination**:
   - Limit Airtable queries to 100 records
   - Implement client-side pagination
   - Use field selection to reduce payload

### Backend Optimization

1. **Server Caching**:
   - In-memory cache for frequently accessed data
   - Clear cache on updates
   - TTL-based expiration

2. **Request Batching**:
   - Combine multiple Airtable queries
   - Bulk SMS sends
   - Parallel API calls where possible

3. **Error Handling**:
   - Retry logic with exponential backoff
   - Graceful degradation
   - User-friendly error messages

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set
- [ ] API keys tested and working
- [ ] Domain/URL configurations updated
- [ ] SSL certificate active
- [ ] Database migrations complete

### Railway Specific

- [ ] GitHub repo connected
- [ ] Auto-deploy enabled on main branch
- [ ] Environment variables added
- [ ] Custom domain configured (optional)
- [ ] Health checks passing

### Post-Deployment

- [ ] Test authentication flow
- [ ] Verify API connections
- [ ] Check SMS delivery
- [ ] Test all major features
- [ ] Monitor error logs

## Monitoring & Logging

### Application Logs

```javascript
// Structured logging
console.log('[Webhook] Processing booking:', bookingCode);
console.error('[SMS] Failed to send:', error.message);
console.warn('[Cache] TTL expired for:', cacheKey);
```

### External Monitoring

1. **Railway Logs**: Application logs and metrics
2. **Airtable History**: API request logs
3. **Twilio Console**: SMS delivery status
4. **Google Console**: Maps API usage

### Error Tracking

Common errors to monitor:
- API rate limit errors (429)
- Authentication failures (401)
- Invalid data errors (422)
- Network timeouts
- SMS delivery failures

## Scalability Considerations

### Current Limitations

1. **Single Server**: No load balancing
2. **In-Memory Cache**: Lost on restart
3. **Synchronous Processing**: No job queue
4. **Database**: Airtable limits

### Future Scaling Options

1. **Horizontal Scaling**:
   - Multiple Railway instances
   - Redis for shared cache
   - Load balancer

2. **Background Jobs**:
   - Queue for SMS sends
   - Scheduled tasks
   - Webhook processing queue

3. **Database Migration**:
   - PostgreSQL for heavy data
   - Keep Airtable for UI
   - Sync between systems

## Security Best Practices

### Authentication

1. **Session Management**:
   - Secure HTTP-only cookies
   - Session expiration
   - CSRF protection

2. **API Security**:
   - Rate limiting
   - Input validation
   - SQL injection prevention (when applicable)

### Data Protection

1. **Encryption**:
   - HTTPS for all traffic
   - Encrypt sensitive data at rest
   - Secure credential storage

2. **Access Control**:
   - Role-based permissions
   - Audit logging
   - Regular permission reviews

## Disaster Recovery

### Backup Strategy

1. **Airtable**: Built-in revision history
2. **Code**: GitHub repository
3. **Environment**: Document all variables
4. **Data**: Regular Airtable snapshots

### Recovery Plan

1. **Service Outage**:
   - Fallback to manual processes
   - Status page for users
   - Incident communication plan

2. **Data Loss**:
   - Restore from Airtable history
   - Re-sync from Checkfront
   - Audit trail reconstruction

## Related Documentation

- [Deployment Guide](../01-setup/deployment-guide.md)
- [API Documentation](./api-reference.md)
- [Security Guidelines](./security.md)
- [Performance Optimization](./performance.md)
