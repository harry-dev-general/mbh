# Complete Security Remediation Guide - November 2025

## Overview

This document provides a comprehensive guide to the security remediation efforts undertaken in November 2025 to address exposed API keys in the MBH Staff Portal git repository. This guide serves as both historical documentation and a reference for future security incidents.

## Table of Contents

1. [Initial Problem Discovery](#initial-problem-discovery)
2. [Phase 1: Code Remediation](#phase-1-code-remediation)
3. [Phase 2: Security Hardening](#phase-2-security-hardening)
4. [Technical Discoveries](#technical-discoveries)
5. [Solutions Implemented](#solutions-implemented)
6. [Lessons Learned](#lessons-learned)
7. [Future Recommendations](#future-recommendations)

## Initial Problem Discovery

### The Issue
A security audit revealed that sensitive API keys were hardcoded directly in production HTML and JavaScript files, exposing them in the git repository history. This created multiple security risks:

1. **Financial Risk**: Square API key could be used for unauthorized transactions
2. **SMS Cost Risk**: Twilio credentials could be exploited for sending bulk SMS
3. **Data Access Risk**: Airtable API key provided full database access
4. **Service Abuse**: Google Maps API key lacked domain restrictions
5. **Admin Access**: Default admin key was exposed in scripts

### Exposed Credentials
- **Airtable API Key**: `patYiJdXfvcSenMU4...` (Personal Access Token)
- **Supabase Keys**: JWT-based anon key hardcoded in multiple files
- **Square Access Token**: `EAAAlxvlv1BGVkvp...`
- **Admin Key**: Default `mbh-admin-2025` in scripts
- **Google Maps API Key**: No domain restrictions
- **Twilio Auth Token**: Exposed in notification files

## Phase 1: Code Remediation

### Approach 1: Dynamic Configuration Loading

**What We Tried:**
Created a tiered configuration endpoint (`/api/config`) that serves different levels of configuration based on authentication status.

**Implementation:**
```javascript
// Server-side endpoint
app.get('/api/config', optionalAuthenticate, async (req, res) => {
    const baseConfig = { 
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY 
    };
    
    if (req.user) {
        // Authenticated users get sensitive configs
        return res.json({
            ...baseConfig,
            airtableApiKey: process.env.AIRTABLE_API_KEY,
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        });
    }
    
    res.json(baseConfig);
});
```

**Client-side implementation:**
```javascript
async function loadConfig() {
    try {
        const token = await getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch('/api/config', { headers });
        window.CONFIG = await response.json();
        
        // Initialize services after config loads
        window.supabase = createClient(window.CONFIG.supabaseUrl, window.CONFIG.supabaseAnonKey);
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}
```

**Result:** ✅ Successfully removed all hardcoded keys from production files

### Approach 2: Authentication Flow Fix

**Problem Discovered:**
Circular dependency between Supabase initialization and authentication state checking.

**What We Tried:**
1. **Failed Approach**: Initialize Supabase with dummy values
   - Result: Authentication broke completely
   
2. **Failed Approach**: Delay auth state checking
   - Result: Race conditions and inconsistent behavior

3. **Successful Approach**: Deferred initialization pattern
   ```javascript
   // supabase-init-fix.js
   let supabaseInstance = null;
   let initPromise = null;
   
   window.getSupabase = async function() {
       if (supabaseInstance) return supabaseInstance;
       if (!initPromise) {
           initPromise = loadConfig().then(() => {
               supabaseInstance = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
               return supabaseInstance;
           });
       }
       return initPromise;
   };
   ```

**Result:** ✅ Fixed circular dependency while maintaining security

### Files Updated in Phase 1

1. **Production HTML Files** (27 total):
   - All shift allocation pages
   - Management dashboards
   - Staff portal pages
   - Training system files

2. **JavaScript Libraries**:
   - `js/supabase-init.js` → `js/supabase-init-fix.js`
   - Created `js/config-loader.js`
   - Updated all dependent scripts

3. **API Endpoints**:
   - Added `/api/config` endpoint
   - Updated authentication middleware
   - Added optional authentication support

## Phase 2: Security Hardening

### Task 1: Test File Cleanup

**What We Did:**
1. Identified test files with hardcoded credentials
2. Moved sensitive test files to gitignored `test-files/` directory
3. Deleted unnecessary backup files
4. Updated `.gitignore` to prevent future exposure

**Files Handled:**
- `auth-no-check.html` → moved to `test-files/`
- `supabase-test.html` → moved to `test-files/`
- `supabase-direct-test.html` → moved to `test-files/`
- `management-dashboard-backup-*.html` → deleted

### Task 2: Preventive Measures

**Pre-commit Hook Implementation:**
Created `.githooks/pre-commit` to scan for common secret patterns:

```bash
#!/bin/bash
# Patterns checked:
# - Airtable: pat[A-Za-z0-9]{8,}\.
# - Square: sk_test_|sk_live_|sq0[a-z]{3}-
# - JWT tokens: eyJ[A-Za-z0-9_-]+\.
# - Hardcoded URLs with credentials
# - Default admin keys

if git diff --cached --no-ext-diff | grep -E "$PATTERNS" > /dev/null; then
    echo "❌ Potential API key detected in commit!"
    exit 1
fi
```

**Installation Script:**
Created `setup-git-hooks.sh` for easy team adoption.

### Task 3: Key Rotation Process

**Complete Rotation Status (November 5, 2025):**

| Service | Old Key Status | New Key Status | Risk Eliminated |
|---------|----------------|----------------|-----------------|
| Square | ❌ Exposed | ✅ Rotated | Financial fraud |
| Twilio | ❌ Exposed | ✅ Rotated | SMS spam costs |
| Airtable | ❌ Exposed | ✅ Rotated | Data breach |
| Supabase | ❌ Exposed | ✅ Rotated | Auth bypass |
| Google Maps | ❌ No restrictions | ✅ Domain locked | Service abuse |
| Admin API | ❌ Default key | ✅ Secure 32-byte | Admin access |

### Task 4: Git History Cleanup

**Status:** Optional (all exposed keys are now invalid)

**Prepared Script:** `REMOVE_SECRETS_FROM_GIT_HISTORY.sh`
- Uses BFG Repo-Cleaner
- Removes specific exposed secrets
- Requires team coordination for force push

**Decision:** Since all keys are rotated, immediate risk is eliminated. Cleanup is now a best practice rather than urgent security need.

## Technical Discoveries

### 1. JavaScript Initialization Order Issues

**Discovery:**
The Supabase auth state listener must be set up AFTER the client is initialized, but the client needs auth state to load configuration.

**Solution:**
Implemented a promise-based initialization queue that ensures proper order:
1. Load basic config (public keys)
2. Initialize Supabase client
3. Set up auth listener
4. Load authenticated config if user is logged in

### 2. Railway Environment Specifics

**Discovery:**
Railway auto-deploys on environment variable changes, which can cause temporary outages during key rotation.

**Solution:**
- Batch environment variable updates
- Use Railway's deployment settings to control rollout
- Test in development environment first

### 3. Service Worker Caching Issues

**Discovery:**
Service workers were caching old HTML with hardcoded keys, serving them even after updates.

**Solution:**
- Added cache-busting headers
- Excluded sensitive paths from service worker
- Created force-update utility: `/training/sw-force-update.html`

### 4. Authentication Middleware Patterns

**Discovery:**
Strict authentication on config endpoint prevented public pages from loading.

**Solution:**
Created `optionalAuthenticate` middleware:
```javascript
async function optionalAuthenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(); // Continue without user
    }
    // Verify token if provided
    try {
        const payload = await verifyJWT(token);
        req.user = payload;
    } catch (error) {
        // Invalid token, continue without user
    }
    next();
}
```

## Solutions Implemented

### 1. Tiered Configuration System

**Architecture:**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│ /api/config  │────▶│ Environment Vars│
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │
       │                    ├─── No Auth ──▶ Public Config
       │                    │
       │                    └─── Authenticated ──▶ Full Config
       │
       └─── Initialize Services with Config
```

### 2. Secure Key Storage

**Environment Variables Required:**
```bash
# Supabase (Public)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Sensitive (Requires Auth)
AIRTABLE_API_KEY=patXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXX
GOOGLE_MAPS_API_KEY=AIzaXXXXXXX

# Server Only
ADMIN_API_KEY=[32-byte random string]
TWILIO_ACCOUNT_SID=ACXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXX
SQUARE_ACCESS_TOKEN=EAAAlXXXXXXX
```

### 3. Documentation Structure

Created comprehensive documentation:
- Security architecture guides
- Setup instructions
- Best practices
- Troubleshooting guides
- Key rotation procedures

## Lessons Learned

### 1. Never Hardcode Credentials
- Always use environment variables
- Implement configuration endpoints
- Use proper secret management

### 2. Plan for Initialization Order
- Map out service dependencies
- Handle circular dependencies
- Use deferred initialization patterns

### 3. Consider Deployment Pipeline
- Understand platform auto-deploy behavior
- Plan for zero-downtime updates
- Test configuration changes thoroughly

### 4. Implement Defense in Depth
- Pre-commit hooks
- Code review processes
- Automated secret scanning
- Regular security audits

### 5. Document Everything
- Security procedures
- Architecture decisions
- Troubleshooting steps
- Recovery procedures

## Future Recommendations

### Immediate Actions
1. **Enable GitHub Secret Scanning**
   - Prevents accidental commits
   - Provides immediate alerts
   - Free for public repos

2. **Implement CI/CD Secret Scanning**
   - Add to build pipeline
   - Fail builds with exposed secrets
   - Use tools like TruffleHog or GitLeaks

3. **Regular Key Rotation Schedule**
   - Quarterly for all API keys
   - Immediately on personnel changes
   - Automated where possible

### Long-term Improvements

1. **Migrate to OAuth/JWT Where Possible**
   - Reduces long-lived credentials
   - Better access control
   - Easier revocation

2. **Implement Secret Management Service**
   - Consider HashiCorp Vault
   - Or cloud provider solutions
   - Centralized secret rotation

3. **Enhanced Monitoring**
   - API usage monitoring
   - Anomaly detection
   - Immediate alerting

4. **Security Training**
   - Regular team training
   - Security best practices
   - Incident response procedures

## Conclusion

This security remediation successfully eliminated immediate risks by:
- Removing all hardcoded credentials from production code
- Rotating all exposed API keys
- Implementing preventive measures
- Creating comprehensive documentation

While git history still contains invalid keys, the security posture is significantly improved with multiple layers of protection now in place.

---

**Last Updated:** November 5, 2025  
**Status:** Remediation Complete  
**Risk Level:** Low (mitigated)
