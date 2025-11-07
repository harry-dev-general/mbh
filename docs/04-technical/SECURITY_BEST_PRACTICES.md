# Security Best Practices - MBH Staff Portal

**Last Updated**: November 2025  
**Purpose**: Ensure secure development practices to prevent credential exposure

## 🔐 Core Principles

### 1. Never Hardcode Credentials

**❌ BAD - Never do this:**
```javascript
const AIRTABLE_API_KEY = 'patYiJdXfvcSenMU4.xxxxx';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const ADMIN_KEY = 'mbh-admin-2025';
```

**✅ GOOD - Always do this:**
```javascript
// Load from server config endpoint
let AIRTABLE_API_KEY = null;

async function loadConfig() {
    const response = await fetch('/api/config');
    const config = await response.json();
    AIRTABLE_API_KEY = config.airtableApiKey;
}
```

### 2. Use Environment Variables

All sensitive configuration must be stored in Railway environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `AIRTABLE_API_KEY`
- `TWILIO_AUTH_TOKEN`
- `SQUARE_ACCESS_TOKEN`
- `ADMIN_API_KEY`

### 3. Git Security

#### Pre-commit Hooks
Run `./setup-git-hooks.sh` to install security scanning:
```bash
# First time setup
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh
```

The hook will block commits containing:
- API keys (Airtable, Square, Google Maps patterns)
- JWT tokens (Supabase keys)
- Hardcoded credentials in URLs
- Default admin keys

#### .gitignore Patterns
Always gitignore:
```
# Environment files
.env
.env.*

# Test files with potential secrets
test-files/
*-test.html
*-backup-*.html
auth-no-check.html

# Temporary files
secrets-to-remove.txt
```

## 🛡️ Development Guidelines

### 1. Loading Configuration

**For Authentication Pages (login/signup):**
```javascript
// Can load without authentication
async function loadConfig() {
    const response = await fetch('/api/config');
    const config = await response.json();
    // Will receive SUPABASE_URL and SUPABASE_ANON_KEY only
}
```

**For Management Pages:**
```javascript
// Must include authentication
async function loadConfig() {
    const { data: { session } } = await window.SupabaseInit.getSession();
    const headers = session?.access_token 
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {};
    
    const response = await fetch('/api/config', { headers });
    const config = await response.json();
    // Will receive all configured keys including Airtable
}
```

### 2. JavaScript Initialization Order

**CRITICAL**: Always initialize before using:
```javascript
// ❌ WRONG - Will throw "Cannot read properties of undefined"
supabase.auth.onAuthStateChange((event, session) => {
    // supabase is still null!
});

// ✅ CORRECT - Initialize first, then setup listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig(); // Creates supabase client
    setupAuthListener(); // Now safe to use supabase
});
```

### 3. Error Handling

Always handle configuration failures gracefully:
```javascript
async function initializePage() {
    try {
        await loadConfig();
        // Continue with initialization
    } catch (error) {
        console.error('Failed to load configuration:', error);
        showErrorMessage('Unable to load application configuration');
        // Disable features that require config
    }
}
```

## 🔑 Key Rotation Schedule

### Quarterly Rotation
- All API keys should be rotated every 90 days
- Use calendar reminders for rotation dates
- Document rotation in security log

### Immediate Rotation Required When:
- Key exposed in code/logs
- Team member leaves
- Suspicious activity detected
- Security audit findings

### Rotation Process
1. Generate new key in service dashboard
2. Update Railway environment variable
3. Deploy and verify functionality
4. Revoke old key
5. Update documentation

## 🚨 Incident Response

### If a Key is Exposed:

1. **Immediate (< 15 minutes)**
   - Rotate the exposed key
   - Update Railway environment

2. **Short-term (< 1 hour)**
   - Deploy updated configuration
   - Verify all services working

3. **Follow-up (< 24 hours)**
   - Clean git history if needed
   - Audit usage logs
   - Document incident

## 📋 Security Checklist

### Before Committing Code
- [ ] No hardcoded API keys
- [ ] No hardcoded URLs with credentials
- [ ] No test files with real credentials
- [ ] Pre-commit hook passes

### During Code Review
- [ ] Check for console.log of sensitive data
- [ ] Verify error messages don't expose keys
- [ ] Confirm proper config loading pattern

### Before Deployment
- [ ] All environment variables set in Railway
- [ ] No .env files in repository
- [ ] Security scan passes

## 🛠️ Tools and Resources

### Security Scanning
```bash
# Manual scan for common patterns
grep -r "pat[A-Za-z0-9]" . --exclude-dir=node_modules
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .
grep -r "sk_test_\|sk_live_" .
```

### Environment Validation
```javascript
// Add to server startup
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'AIRTABLE_API_KEY'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Missing required: ${varName}`);
        process.exit(1);
    }
});
```

## 🎓 Training Resources

### For New Developers
1. Read this document completely
2. Review [API_KEY_SECURITY_ARCHITECTURE.md](./API_KEY_SECURITY_ARCHITECTURE.md)
3. Run security setup script
4. Practice secure config loading

### Security Awareness
- Never share credentials via email/Slack
- Use Railway's secure environment variables
- Report any suspected exposure immediately
- Keep local .env files out of version control

## 📝 Compliance

### Regular Audits
- Monthly: Review environment variables
- Quarterly: Rotate all keys
- Annually: Full security audit

### Documentation
- Log all key rotations
- Document security incidents
- Update this guide as needed

---

*Remember: Security is everyone's responsibility. When in doubt, ask for help rather than risk exposure.*
