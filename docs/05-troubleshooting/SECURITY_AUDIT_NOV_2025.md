# Security Audit and API Key Exposure Resolution

**Date**: November 2025  
**Issue**: Multiple API keys exposed in git repository  
**Status**: Resolved

## Executive Summary

A comprehensive security audit revealed multiple API keys hardcoded in the codebase. All exposed keys have been removed, replaced with environment variables, and rotated. This document details the entire resolution process.

## Exposed Credentials Found

### 1. Airtable API Key
- **Location**: Multiple HTML files in `/training/` directory
- **Pattern**: Hardcoded in JavaScript sections
- **Example**: `const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14';`

### 2. Supabase Credentials
- **Anon Key**: Exposed in multiple files
- **URL**: Also hardcoded but less sensitive
- **Risk**: While anon key is "public", hardcoding prevents rotation

### 3. Square API Credentials
- **Files**: `test-square-sandbox.js`, `api/square-webhook.js`
- **Tokens**: Access token, Application ID, Webhook signature key

### 4. Admin API Key
- **Default**: `mbh-admin-2025` used as fallback
- **Files**: `server.js`, monitoring scripts

### 5. Additional Services
- **Google Maps API Key**: In server configuration
- **Twilio Auth Token**: In example configurations

## Resolution Process

### Phase 1: Code Remediation

#### 1.1 Server Configuration Enhancement

Created `/api/config` endpoint pattern:
```javascript
app.get('/api/config', authMiddlewareV2, async (req, res) => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        airtableApiKey: process.env.AIRTABLE_API_KEY,
        airtableBaseId: process.env.AIRTABLE_BASE_ID,
        // Only public/frontend-safe keys
    });
});
```

#### 1.2 Frontend Pattern Migration

All HTML files updated from:
```javascript
// BAD - Hardcoded
const AIRTABLE_API_KEY = 'patXXXXXX...';
const SUPABASE_URL = 'https://...';
```

To:
```javascript
// GOOD - Dynamic loading
let AIRTABLE_API_KEY = null;
let SUPABASE_URL = null;

async function loadConfig() {
    const response = await fetch('/api/config');
    const config = await response.json();
    AIRTABLE_API_KEY = config.airtableApiKey;
    SUPABASE_URL = config.SUPABASE_URL;
    // Initialize services
}
```

### Phase 2: Git History Cleanup

#### 2.1 Script Creation

Created `REMOVE_SECRETS_FROM_GIT_HISTORY.sh` using BFG Repo-Cleaner to remove all exposed keys from git history.

#### 2.2 GitHub Push Issues

Encountered authentication issues when pushing cleaned history:
- SSH key verification failed
- HTTPS required authentication
- Solution: Used `GIT_ASKPASS=true git push origin main`

### Phase 3: Key Rotation

#### 3.1 Supabase Key Rotation Journey

**Initial Confusion**: Two rotation methods available
1. Legacy JWT Secret change (disruptive)
2. JWT Signing Keys (zero-downtime) ✓

**Process Discovered**:
1. Create new JWT Signing Key (ECC P-256)
2. Rotate from Legacy HS256 to new key
3. Both old and new tokens work during transition
4. New API keys generated automatically

**Key Learning**: Supabase offers two API key systems:
- Legacy API Keys (JWT-based, older format)
- Modern API Keys (Publishable keys with `sb_publishable_` prefix)

#### 3.2 Airtable Rotation
- Generated new Personal Access Token
- Updated Railway immediately
- Old key deactivated

## Technical Discoveries

### 1. Supabase API Key Systems

Supabase maintains two parallel API key systems:

```
Legacy System:
- anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Modern System:
- Publishable key: sb_publishable_XXXXXXXXXXXX
- Secret keys: sb_secret_XXXXXXXXXXXX
```

Both work, but modern system offers better security features.

### 2. Environment Variable Loading Pattern

Discovered Railway auto-deploys on environment variable changes, making rotation seamless.

### 3. Frontend Security Pattern

Established pattern for secure frontend configuration:
1. Never hardcode any API keys
2. Load config from authenticated endpoint
3. Handle loading states gracefully
4. Cache config for session

## Files Modified

### Server-Side
- `server.js`: Enhanced `/api/config`, removed hardcoded fallbacks
- `api/square-webhook.js`: Environment variables
- Various monitoring scripts: Removed admin key fallbacks

### Client-Side (Pattern Applied)
- `/training/management-allocations.html`
- `/training/dashboard.html`
- `/training/management-dashboard.html`
- `/training/auth.html`
- And 15+ other HTML files

## Verification Steps

1. **Code Review**: `grep -r "patYiJdXf" .` returns no results
2. **Runtime Check**: All features working with new keys
3. **Git History**: Old commits no longer contain keys (after cleanup)
4. **Monitoring**: Legacy API keys showing no new activity

## Lessons Learned

1. **Never use fallback values for sensitive keys**
2. **Implement key rotation early in project lifecycle**
3. **Use server-side config endpoints for frontend needs**
4. **Distinguish between "public" and "exposed" keys**
5. **Supabase anon keys, while public, should still be managed properly**

## Prevention Measures

1. **Pre-commit hooks**: Scan for potential secrets
2. **Environment variable validation**: Fail fast if missing
3. **Documentation**: Clear setup guides for developers
4. **Regular audits**: Quarterly security reviews

## Related Issues

- Previous JWT verification failures were due to mismatched keys
- Google Maps API key was also exposed but lower risk
- Admin dashboard access was using default key

## Next Steps

1. Set up automated secret scanning in CI/CD
2. Implement key rotation reminders
3. Document emergency key rotation procedure
4. Train team on secure credential management

## References

- [API_KEY_SECURITY_SETUP.md](../01-setup/API_KEY_SECURITY_SETUP.md)
- [Supabase JWT Signing Keys Docs](https://supabase.com/docs/guides/auth/jwts)
- [Railway Environment Variables](https://docs.railway.app/guides/variables)
