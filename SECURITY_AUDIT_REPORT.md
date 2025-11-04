# MBH Staff Portal Security Audit Report

## Date: November 2025

## Executive Summary
A comprehensive security audit has been performed on the MBH Staff Portal repository. Multiple exposed API keys and credentials were discovered in the codebase and have been remediated.

## Exposed Credentials Found and Remediated

### 1. **Airtable API Key**
- **Key**: `patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14`
- **Locations**: Multiple HTML files in `/training/` directory
- **Status**: ✅ REMOVED - Replaced with server-side configuration

### 2. **Supabase Credentials**
- **URL**: `https://etkugeooigiwahikrmzr.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Locations**: Multiple HTML and JS files
- **Status**: ✅ REMOVED - Replaced with server-side configuration

### 3. **Square Credentials**
- **Access Token**: `EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb`
- **Application ID**: `sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ`
- **Locations**: `test-square-sandbox.js`, `api/square-webhook.js`
- **Status**: ✅ REMOVED - Replaced with environment variables

### 4. **Admin API Key**
- **Default Key**: `mbh-admin-2025`
- **Locations**: `server.js`, monitoring scripts
- **Status**: ✅ REMOVED - Now requires environment variable

## Changes Made

### 1. **Server Configuration**
- Updated `/api/config` endpoint to serve API credentials securely
- Added validation to ensure environment variables are set
- Removed all hardcoded fallback values

### 2. **Client-Side Updates**
- Modified all HTML files to load configuration from server
- Added initialization functions to fetch credentials before use
- Implemented proper error handling for missing configuration

### 3. **Environment Variables**
Created `.env.example` file documenting all required variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_APPLICATION_ID`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `ADMIN_API_KEY`

## Immediate Actions Required

### 1. **Rotate All Exposed Keys**
⚠️ **CRITICAL**: All exposed API keys should be considered compromised and must be rotated immediately:

1. **Airtable**: Generate new API key at https://airtable.com/account
2. **Supabase**: Rotate keys at https://app.supabase.com/project/[project-id]/settings/api
3. **Square**: Generate new credentials in Square Developer Dashboard
4. **Admin Key**: Generate a new secure random string

### 2. **Update Environment Variables**
After rotating keys, update environment variables in:
- Local development `.env` file
- Railway dashboard environment variables
- Any other deployment environments

### 3. **Clean Git History**
The exposed keys are still present in git history. Use BFG Repo-Cleaner or git-filter-branch to remove them:
```bash
# Using BFG Repo-Cleaner (recommended)
bfg --delete-files .env --delete-folders logs --replace-text passwords.txt repo.git
```

### 4. **Monitor for Unauthorized Access**
Review logs and access patterns for any unauthorized use of the exposed credentials:
- Check Airtable API usage logs
- Review Supabase authentication logs
- Monitor Square transaction logs
- Check server access logs

## Security Best Practices Going Forward

1. **Never commit credentials to version control**
   - Always use environment variables
   - Add sensitive files to `.gitignore`
   - Use `.env.example` files for documentation

2. **Implement secrets scanning**
   - Add pre-commit hooks to scan for credentials
   - Use GitHub secret scanning
   - Consider tools like git-secrets or truffleHog

3. **Regular security audits**
   - Perform quarterly credential audits
   - Rotate keys periodically
   - Review access logs regularly

4. **Principle of least privilege**
   - Use read-only keys where possible
   - Limit API key permissions
   - Create service-specific credentials

## Migration Guide for Developers

1. Copy `.env.example` to `.env`
2. Fill in all required environment variables
3. Ensure Railway/deployment environment has all variables set
4. Test all functionality after migration

## Conclusion

All identified security vulnerabilities have been addressed in the code. However, immediate action is required to rotate the exposed credentials and clean the git history to fully secure the application.

For questions or assistance, please contact the security team.
