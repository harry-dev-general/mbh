# Supabase Email Template Fix

## ✅ Problem Fixed in Code
The `auth-callback.html` has been updated to handle the correct token format. Railway will automatically redeploy with this fix.

## 🔧 Required: Update Your Supabase Email Templates

You need to update your email templates in the Supabase dashboard to use the correct token format.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Update these templates:

### 1. Confirm Signup Template

Replace the existing template with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
```

### 2. Magic Link Template

Replace the existing template with:

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html?token_hash={{ .TokenHash }}&type=magiclink">Log In</a></p>
```

### 3. Change Email Address Template

Replace with:

```html
<h2>Confirm Change of Email</h2>

<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html?token_hash={{ .TokenHash }}&type=email_change">Change Email</a></p>
```

### 4. Reset Password Template

Replace with:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/training/auth-callback.html?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

## 📝 Important Notes:

1. **Use Query Parameters**: The templates above use `?` (query parameters) not `#` (hash)
2. **Include `/training/` Path**: Since your app is served from the training directory
3. **Use TokenHash**: The variable is `{{ .TokenHash }}` not `{{ .Token }}`
4. **Save Changes**: Click "Save" after updating each template

## 🧪 Testing

After updating the templates:

1. Try signing up with a new email
2. Check the confirmation email
3. Click the link - it should now work without the "Invalid JWT" error
4. You can also use the debug page: https://mbh-production-f0d1.up.railway.app/training/auth-callback-debug.html

## 🚀 Alternative: Testing Without Email

If you're still hitting email rate limits, you can test the fix by manually constructing a URL:

```
https://mbh-production-f0d1.up.railway.app/training/auth-callback-debug.html
```

This debug page will show you exactly what parameters are being passed and help diagnose any remaining issues.