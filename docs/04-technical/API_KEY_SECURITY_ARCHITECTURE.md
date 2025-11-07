# API Key Security Architecture

**Last Updated**: November 2025  
**Purpose**: Technical documentation of secure API key management architecture

## Architecture Overview

The MBH Staff Portal implements a multi-layered security architecture for API key management following the November 2025 security audit.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Frontend HTML  │────▶│  /api/config     │────▶│ Railway Env Vars│
│  (No hardcoded  │     │  (Authenticated) │     │ (Secure Storage)│
│   credentials)  │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Security Layers

### Layer 1: Environment Variable Storage

**Railway Platform Variables**:
```javascript
// Never stored in code
process.env.SUPABASE_URL
process.env.SUPABASE_ANON_KEY
process.env.SUPABASE_SERVICE_KEY
process.env.AIRTABLE_API_KEY
process.env.ADMIN_API_KEY
// ... other services
```

### Layer 2: Server-Side Validation

**Startup Validation**:
```javascript
// server.js - Early validation
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'ADMIN_API_KEY'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`ERROR: ${varName} must be set`);
        process.exit(1);
    }
});
```

### Layer 3: Tiered Configuration Endpoint

**Implementation**:
```javascript
app.get('/api/config', optionalAuthenticate, (req, res) => {
    // Public config always available (for auth pages)
    const publicConfig = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    };
    
    // Sensitive config only for authenticated users
    if (req.user) {
        publicConfig.airtableApiKey = process.env.AIRTABLE_API_KEY;
        // ... other sensitive keys
    }
    
    res.json(publicConfig);
});
```

This tiered approach ensures:
- Authentication pages can initialize Supabase
- Sensitive keys remain protected
- No circular dependency issues

### Layer 4: Frontend Lazy Loading

**Pattern Implementation**:
```javascript
// Standardized across all HTML files
let CONFIG_LOADED = false;
let AIRTABLE_API_KEY = null;
let SUPABASE_CLIENT = null;

async function loadConfig() {
    if (CONFIG_LOADED) return;
    
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to load configuration');
        
        const config = await response.json();
        AIRTABLE_API_KEY = config.airtableApiKey;
        
        // Initialize services only after config loads
        if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
            SUPABASE_CLIENT = supabase.createClient(
                config.SUPABASE_URL,
                config.SUPABASE_ANON_KEY
            );
        }
        
        CONFIG_LOADED = true;
    } catch (error) {
        console.error('Configuration loading failed:', error);
        throw error;
    }
}

// Usage pattern
async function initializePage() {
    await loadConfig();
    // Now safe to use AIRTABLE_API_KEY, SUPABASE_CLIENT, etc.
}
```

**Important**: For management pages that require Airtable configuration, the loadConfig function must include authentication headers:

```javascript
async function loadConfig() {
    try {
        // Get current session for auth header
        const { data: { session } } = await window.SupabaseInit.getSession();
        
        // Include auth header if available
        const headers = {};
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch('/api/config', { headers });
        const config = await response.json();
        
        // Management pages require Airtable config
        if (!config.airtableApiKey) {
            throw new Error('Airtable configuration not available');
        }
        
        AIRTABLE_API_KEY = config.airtableApiKey;
    } catch (error) {
        console.error('Failed to load configuration:', error);
        throw error;
    }
}
```

## API Key Types and Usage

### Public Keys (Safe for Frontend)

| Key Type | Format | Usage | Exposure Risk |
|----------|---------|--------|---------------|
| Supabase Anon | `eyJhbGc...` or `sb_publishable_` | Frontend auth | Low (but rotate if hardcoded) |
| Google Maps API Key* | `AIza...` | Maps display | Medium (restrict by domain) |
| Airtable API Key** | `pat...` | Data queries | High (full access) |

*Should be domain-restricted  
**Should ideally be proxied through backend

### Secret Keys (Backend Only)

| Key Type | Format | Usage | Exposure Risk |
|----------|---------|--------|---------------|
| Supabase Service | `eyJhbGc...` or `sb_secret_` | Admin operations | Critical |
| Twilio Auth Token | Various | SMS sending | Critical |
| Square Access Token | `EAAxxxxx` | Payment processing | Critical |
| Admin API Key | Custom | Internal auth | Critical |

## Migration Patterns

### Before (Insecure)
```html
<script>
    // ❌ NEVER DO THIS
    const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4.xxxxx';
    const BASE_ID = 'applkAFOn2qxtu7tx';
    
    // Direct usage
    fetch(`https://api.airtable.com/v0/${BASE_ID}/Staff`, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
</script>
```

### After (Secure)
```html
<script>
    // ✅ CORRECT APPROACH
    let AIRTABLE_API_KEY = null;
    let BASE_ID = null;
    
    async function loadConfig() {
        const response = await fetch('/api/config');
        const config = await response.json();
        AIRTABLE_API_KEY = config.airtableApiKey;
        BASE_ID = config.airtableBaseId;
    }
    
    async function fetchStaff() {
        await loadConfig(); // Ensure config is loaded
        
        fetch(`https://api.airtable.com/v0/${BASE_ID}/Staff`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        });
    }
</script>
```

## Supabase Key Architecture

### JWT Signing Key Rotation

Supabase uses JWT signing keys for authentication tokens:

```
Legacy System (HS256):
┌──────────────┐
│ Shared Secret│───▶ Signs all JWTs
└──────────────┘

Modern System (ECC P-256):
┌──────────────┐     ┌──────────────┐
│ Current Key  │     │ Standby Key  │
│   (Active)   │     │  (Ready)     │
└──────────────┘     └──────────────┘
         ↓                    ↓
    Signs new JWTs      Verifies JWTs
```

### API Key Generation Flow

```
JWT Signing Key Rotation
         ↓
New JWKS published
         ↓
Generate new API Keys:
- Anon (public) key: Contains role=anon
- Service key: Contains role=service_role
         ↓
Update environment variables
```

## Security Best Practices

### 1. Key Rotation Schedule

- **Monthly**: Review all API keys
- **Quarterly**: Rotate non-critical keys
- **Immediately**: Rotate any exposed key
- **Annually**: Full security audit

### 2. Access Patterns

```javascript
// Backend: Can access any env variable
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// Frontend: Only through /api/config
const config = await fetch('/api/config');
// Never gets service keys
```

### 3. Error Handling

```javascript
// Graceful degradation
async function initializeServices() {
    try {
        await loadConfig();
    } catch (error) {
        // Show user-friendly message
        showConfigError();
        // Log for debugging
        console.error('Config failed:', error);
        // Prevent further operations
        disableFeatures();
    }
}
```

## Monitoring and Alerts

### Key Usage Monitoring

1. **Supabase Dashboard**: Shows last API key usage
2. **Railway Logs**: Track config endpoint access
3. **Browser Console**: Check for exposed keys

### Security Indicators

```javascript
// Add to health checks
app.get('/api/health', (req, res) => {
    const securityStatus = {
        configEndpoint: true,
        envVarsSet: !!process.env.SUPABASE_URL,
        noHardcodedKeys: true, // Verified by audit
        lastKeyRotation: '2025-11-04'
    };
    
    res.json({ security: securityStatus });
});
```

## Emergency Response

### If Key Exposed

1. **Immediately**: Rotate the exposed key
2. **Within 1 hour**: Deploy update to Railway
3. **Within 24 hours**: Clean git history
4. **Within 48 hours**: Audit all key usage

### Rotation Commands

```bash
# Check for exposed keys in code
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
grep -r "pat[A-Za-z0-9]" .
grep -r "sb_publishable_" .

# Update Railway
railway variables set SUPABASE_ANON_KEY="new_key_value"
```

## Common Implementation Pitfalls

### 1. JavaScript Initialization Order

**Issue**: Auth listeners called before client initialization
```javascript
// ❌ WRONG - This will throw "Cannot read properties of undefined"
supabase.auth.onAuthStateChange((event, session) => {
    // supabase is still null!
});

async function loadConfig() {
    // This runs later...
    supabase = window.supabase.createClient(...);
}
```

**Solution**: Setup listeners after initialization
```javascript
// ✅ CORRECT - Setup listener after client is ready
function setupAuthListener() {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event, session) => {
        // Now safe to use
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig(); // Initialize supabase
    setupAuthListener(); // Then setup listeners
});
```

### 2. Missing Authentication Headers

**Issue**: Management pages fail to load Airtable config
```javascript
// ❌ WRONG - No auth header sent
const response = await fetch('/api/config');
// Returns only public config, no Airtable keys
```

**Solution**: Include session token in request
```javascript
// ✅ CORRECT - Include auth header
const { data: { session } } = await window.SupabaseInit.getSession();
const headers = session?.access_token 
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : {};
const response = await fetch('/api/config', { headers });
```

### 3. Circular Dependencies

**Issue**: Auth needs config, config needs auth
- Login page needs Supabase config to authenticate
- But `/api/config` requires authentication
- Creates impossible circular dependency

**Solution**: Tiered access with `optionalAuthenticate`
- Public config (Supabase) available without auth
- Sensitive config (Airtable) requires auth
- No circular dependencies

## Related Documentation

- [SECURITY_AUDIT_NOV_2025.md](../05-troubleshooting/SECURITY_AUDIT_NOV_2025.md)
- [API_KEY_SECURITY_SETUP.md](../01-setup/API_KEY_SECURITY_SETUP.md)
- [AUTHENTICATION_ARCHITECTURE.md](./AUTHENTICATION_ARCHITECTURE.md)
- [AUTHENTICATION_CONFIG_LOADING_JOURNEY_NOV_2025.md](../05-troubleshooting/AUTHENTICATION_CONFIG_LOADING_JOURNEY_NOV_2025.md)
