# API Key Rotation Log

**Purpose**: Track all API key rotations for security audit trail

## Rotation Schedule

| Service | Rotation Frequency | Next Rotation Due |
|---------|-------------------|-------------------|
| Supabase | Quarterly | February 5, 2025 |
| Airtable | Quarterly | February 5, 2025 |
| Square | Quarterly | February 4, 2026 |
| Twilio | Quarterly | February 4, 2026 |
| Google Maps | Annually | November 4, 2026 |
| Admin API | Quarterly | February 4, 2026 |

## Rotation History

### November 2025 - Security Remediation

**Date**: November 5, 2025  
**Reason**: Security audit - exposed keys in git history  
**Performed By**: Security Team

| Service | Action Taken | Status | Notes |
|---------|-------------|---------|-------|
| Supabase | ✅ Rotated | COMPLETED | New keys deployed (user confirmed) |
| Airtable | ✅ Rotated | COMPLETED | New personal access token deployed (user confirmed) |
| Square | ✅ Rotated | COMPLETED | New access token generated and deployed |
| Twilio | ✅ Rotated | COMPLETED | New auth token generated and deployed |
| Google Maps | ✅ Rotated | COMPLETED | New key with domain restrictions |
| Admin API | ✅ Generated new key | COMPLETED | New 32-byte secure key generated |

**Git History Status**: ⏳ Cleanup script ready, awaiting execution

### Previous Rotations

_(No previous rotation history documented)_

## Key Rotation Procedures

### Supabase
1. Login to Supabase Dashboard
2. Settings → Authentication → JWT Keys
3. Create new signing key (ECC P-256)
4. Rotate from Legacy HS256
5. Copy new anon and service keys
6. Update Railway environment variables

### Airtable
1. Login to [Airtable Account](https://airtable.com/account)
2. Generate new Personal Access Token
3. Select appropriate scopes
4. Update Railway: `AIRTABLE_API_KEY`
5. Delete old token immediately

### Square
1. Login to Square Dashboard
2. Apps → Your App → OAuth
3. Generate new Access Token
4. Update Railway: `SQUARE_ACCESS_TOKEN`
5. Regenerate webhook signature key
6. Update Railway: `SQUARE_WEBHOOK_SIGNATURE_KEY`

### Twilio
1. Login to Twilio Console
2. Account → API Keys & Tokens
3. Generate new Auth Token
4. Update Railway: `TWILIO_AUTH_TOKEN`
5. Test SMS functionality

### Google Maps
1. Login to Google Cloud Console
2. APIs & Services → Credentials
3. Edit API Key
4. Add Application Restrictions:
   - HTTP referrers
   - Add: `https://mbh-production-f0d1.up.railway.app/*`
5. Add API Restrictions:
   - Restrict to: Maps JavaScript API

### Admin API
1. Generate secure key: `openssl rand -base64 32`
2. Update Railway: `ADMIN_API_KEY`
3. Update all monitoring scripts
4. Document new key in secure location

## Verification Checklist

After each rotation:
- [ ] Old key revoked/deleted
- [ ] New key working in production
- [ ] All features tested
- [ ] Team notified of completion
- [ ] This log updated
- [ ] Next rotation scheduled

## Emergency Contact

For urgent key rotation needs:
- Primary: DevOps Lead
- Secondary: Security Team
- Escalation: CTO

---

*This document contains sensitive security information. Handle appropriately.*
