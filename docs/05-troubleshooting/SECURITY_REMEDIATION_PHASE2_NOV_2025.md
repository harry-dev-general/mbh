# Security Remediation Phase 2 - November 2025

**Status**: In Progress  
**Start Date**: November 5, 2025  
**Target Completion**: November 8, 2025

## Executive Summary

Phase 2 focuses on cleaning exposed secrets from git history, rotating compromised keys, removing test files with hardcoded credentials, and implementing preventive measures to ensure this security issue doesn't recur.

## Phase 2 Tasks

### 1. Git History Cleanup (CRITICAL - URGENT)

**Status**: ⚠️ Ready to Execute  
**Script**: `REMOVE_SECRETS_FROM_GIT_HISTORY.sh`  
**Impact**: High - Requires team coordination

#### Exposed Secrets to Remove
- Airtable API Key: `patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14`
- Supabase Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (old JWT)
- Square Access Token: `EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb`
- Square Application ID: `sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ`
- Admin API Key: `mbh-admin-2025`

#### Execution Plan
1. **Pre-execution Checklist**:
   - [ ] Notify all team members
   - [ ] Schedule maintenance window
   - [ ] Backup current repository state
   - [ ] Ensure all team members have pushed changes
   - [ ] Confirm all keys have been rotated

2. **Execution Steps**:
   ```bash
   # Run the cleanup script
   cd /Users/harryprice/kursol-projects/mbh-staff-portal
   chmod +x REMOVE_SECRETS_FROM_GIT_HISTORY.sh
   ./REMOVE_SECRETS_FROM_GIT_HISTORY.sh
   ```

3. **Post-execution**:
   - [ ] Verify cleaned history
   - [ ] Force push to GitHub
   - [ ] Notify team to re-clone repository
   - [ ] Delete local backups with secrets
   - [ ] Verify production still works

### 2. Key Rotations Required

#### 2.1 Square API Key (HIGH PRIORITY)

**Status**: 🔴 Exposed in git history  
**Risk**: Payment processing compromise

**Actions**:
1. [ ] Login to Square Dashboard
2. [ ] Generate new Access Token
3. [ ] Update Railway environment variable: `SQUARE_ACCESS_TOKEN`
4. [ ] Regenerate webhook signature key
5. [ ] Update Railway: `SQUARE_WEBHOOK_SIGNATURE_KEY`
6. [ ] Test payment processing functionality

#### 2.2 Twilio Auth Token (HIGH PRIORITY)

**Status**: 🟡 Potentially exposed  
**Risk**: SMS system compromise, unauthorized charges

**Actions**:
1. [ ] Login to Twilio Console
2. [ ] Generate new Auth Token
3. [ ] Update Railway environment variable: `TWILIO_AUTH_TOKEN`
4. [ ] Test SMS functionality:
   - Shift allocation SMS
   - Reminder SMS
   - Announcement SMS

#### 2.3 Admin API Key (MEDIUM PRIORITY)

**Status**: 🟡 Partially complete  
**Current**: Default removed from code, but still in docs

**Actions**:
1. [ ] Generate secure random key: `openssl rand -base64 32`
2. [ ] Update Railway environment variable: `ADMIN_API_KEY`
3. [x] Remove hardcoded defaults from:
   - ✅ `monitoring/quick-health-check.sh` - Now requires env var
   - [ ] Documentation files (update examples)
4. [ ] Update admin documentation with new authentication process

#### 2.4 Google Maps API Key (MEDIUM PRIORITY)

**Status**: 🟡 Needs restrictions  
**Risk**: Unauthorized usage, potential charges

**Actions**:
1. [ ] Login to Google Cloud Console
2. [ ] Add API key restrictions:
   - HTTP referrers: `https://mbh-production-f0d1.up.railway.app/*`
   - API restrictions: Maps JavaScript API only
3. [ ] Monitor usage for anomalies

### 3. Test File Cleanup

**Status**: ✅ COMPLETED - Test files secured

#### Files to Remove/Secure

**High Priority (Contains Active Keys)**:
- [ ] `training/auth-no-check.html` - Contains Supabase key
- [ ] `training/supabase-test.html` - Contains Supabase key
- [ ] `training/supabase-direct-test.html` - Contains Supabase key

**Medium Priority (Test Files)**:
- [ ] `training/*-test.html` (10 files total)
- [ ] Any backup files: `*-backup-*.html`

**Actions**:
1. [ ] Move test files to `.gitignore`d directory: `test-files/`
2. [ ] Or delete if no longer needed
3. [ ] Update `.gitignore` to prevent future commits:
   ```
   # Test files
   test-files/
   *-test.html
   *-backup-*.html
   ```

### 4. Preventive Measures

#### 4.1 Pre-commit Hook Setup

**Status**: ✅ COMPLETED - Hook created and ready

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Scan for potential secrets before commit

# Check for API keys
if git diff --cached | grep -E "pat[A-Za-z0-9]{8}\.|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9|sk_test_|sk_live_|EAA[A-Za-z0-9]+" ; then
    echo "❌ Potential API key detected in commit!"
    echo "Remove the key and use environment variables instead."
    exit 1
fi

# Check for hardcoded URLs with keys
if git diff --cached | grep -E "apikey=|api_key=|access_token=|auth_token=" ; then
    echo "❌ Potential hardcoded credential detected!"
    exit 1
fi
```

#### 4.2 GitHub Security Features

**Actions**:
1. [ ] Enable GitHub secret scanning (Settings → Security → Secret scanning)
2. [ ] Enable push protection
3. [ ] Review and dismiss current alerts after cleanup

#### 4.3 Documentation Updates

**Actions**:
1. [ ] Create `SECURITY_BEST_PRACTICES.md`
2. [ ] Update onboarding documentation
3. [ ] Add security checklist to PR template

#### 4.4 Monitoring & Alerts

**Actions**:
1. [ ] Set up key usage monitoring in Supabase dashboard
2. [ ] Configure Airtable API usage alerts
3. [ ] Set up Square webhook for suspicious activity
4. [ ] Create quarterly key rotation calendar

### 5. Verification Checklist

After completing all tasks:

#### Code Verification
- [ ] No API keys in source code: `grep -r "pat[A-Za-z0-9]" . --exclude-dir=node_modules`
- [ ] No Supabase keys: `grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .`
- [ ] No admin defaults: `grep -r "mbh-admin-2025" . --exclude-dir=docs`

#### Functionality Testing
- [ ] Login/Signup works
- [ ] Management dashboard loads
- [ ] Airtable data displays
- [ ] SMS sending works
- [ ] Google Maps displays
- [ ] Admin endpoints require new key

#### Security Verification
- [ ] Git history cleaned
- [ ] All keys rotated
- [ ] Test files removed/secured
- [ ] Pre-commit hooks working
- [ ] GitHub scanning enabled

## Timeline

### Day 1 (Nov 5, 2025)
- [x] Create comprehensive plan
- [ ] Begin key rotations
- [ ] Clean up test files

### Day 2 (Nov 6, 2025)
- [ ] Complete key rotations
- [ ] Coordinate git history cleanup
- [ ] Execute git history cleanup

### Day 3 (Nov 7, 2025)
- [ ] Implement preventive measures
- [ ] Update documentation
- [ ] Complete verification

### Day 4 (Nov 8, 2025)
- [ ] Final testing
- [ ] Team training
- [ ] Close security remediation

## Risk Mitigation

### During Git History Cleanup
- **Risk**: Team members lose work
- **Mitigation**: Coordinate timing, ensure all work pushed

### During Key Rotation
- **Risk**: Service disruption
- **Mitigation**: Test each service immediately after rotation

### Post-Remediation
- **Risk**: Keys re-exposed
- **Mitigation**: Pre-commit hooks, training, monitoring

## Communication Plan

1. **Team Notification Template**:
   ```
   Subject: URGENT - Security Remediation Git History Cleanup
   
   Team,
   
   We will be cleaning sensitive data from git history on [DATE] at [TIME].
   
   Required Actions:
   1. Push all your changes by [DEADLINE]
   2. Do NOT pull/push during maintenance window
   3. Delete and re-clone repository after notification
   
   Maintenance Window: [START] - [END]
   ```

2. **Completion Notification**:
   ```
   Subject: Security Remediation Complete
   
   All exposed credentials have been rotated and removed.
   Please delete your local repository and re-clone.
   
   New security measures are in place - see documentation.
   ```

## Success Criteria

- ✅ Zero exposed credentials in git history
- ✅ All services functioning with new keys
- ✅ Preventive measures implemented
- ✅ Team trained on security practices
- ✅ Documentation updated

## References

- [SECURITY_AUDIT_NOV_2025.md](./SECURITY_AUDIT_NOV_2025.md)
- [SECURITY_REMEDIATION_REPORT_NOV_2025.md](./SECURITY_REMEDIATION_REPORT_NOV_2025.md)
- [API_KEY_SECURITY_ARCHITECTURE.md](../04-technical/API_KEY_SECURITY_ARCHITECTURE.md)
