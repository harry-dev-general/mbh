# Supabase Email Configuration Quick Reference

## ✅ Working Email Templates

### Confirm Signup
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### Magic Link
```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

### Reset Password
```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### Change Email Address
```html
<h2>Confirm Change of Email</h2>

<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
```

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T Use These Formats:
```html
<!-- Wrong - Token is OTP code, not JWT -->
href="{{ .SiteURL }}/auth-callback.html#access_token={{ .Token }}"

<!-- Wrong - Manual URL construction -->
href="{{ .SiteURL }}/auth-callback.html?token_hash={{ .TokenHash }}&type=signup"

<!-- Wrong - Missing path -->
href="{{ .SiteURL }}?token_hash={{ .TokenHash }}"
```

### ✅ DO Use:
```html
<!-- Correct - Let Supabase build the URL -->
href="{{ .ConfirmationURL }}"
```

## 🔧 Required Supabase Settings

### URL Configuration
1. **Site URL**: Your production URL (e.g., `https://mbh-production-f0d1.up.railway.app`)
2. **Redirect URLs**: 
   - `https://your-domain.com/training/auth-callback.html`
   - `https://your-domain.com`

### Auth Settings
- Email confirmations: Enabled
- Email OTP expiration: 3600 seconds (1 hour) or less
- Leaked password protection: Enabled (recommended)

## 📝 Template Variables Reference

| Variable | Content | Usage |
|----------|---------|--------|
| `{{ .ConfirmationURL }}` | Complete URL with auth parameters | Use for all email links |
| `{{ .Token }}` | 6-digit OTP code | Display to user for manual entry |
| `{{ .TokenHash }}` | Hashed token | Don't use directly |
| `{{ .SiteURL }}` | Your configured site URL | Base URL only |
| `{{ .Email }}` | User's email address | Display in email body |

## 🧪 Testing Checklist

1. [ ] Update email templates in Supabase Dashboard
2. [ ] Save all template changes
3. [ ] Clear browser cache/cookies
4. [ ] Sign up with new test email
5. [ ] Check email arrives within 2 minutes
6. [ ] Click confirmation link
7. [ ] Verify redirect to dashboard/portal

## 🚨 Troubleshooting

### "Invalid JWT structure" Error
- **Cause**: Using `{{ .Token }}` as access_token
- **Fix**: Use `{{ .ConfirmationURL }}` instead

### "about:blank" Error
- **Cause**: Malformed URL in email template
- **Fix**: Use default templates with `{{ .ConfirmationURL }}`

### No Email Received
- **Cause**: Rate limit (2 emails/hour by default)
- **Fix**: 
  1. Add test email to Supabase team
  2. Set up custom SMTP
  3. Wait 1 hour between tests

### "Token expired" Error
- **Cause**: Email prefetching by email providers
- **Fix**: Use OTP code display instead of links

## 🔗 Related Documentation

- [Supabase Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [OnboardingRE SUPABASE_EMAIL_FIX.md](../OnboardingRE/SUPABASE_EMAIL_FIX.md)
- [Full Fix Summary](./EMAIL_CONFIRMATION_FIX_SUMMARY.md)