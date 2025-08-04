# MBH Staff Portal - Deployment Quick Start

## 🚀 Quick Deploy to Railway

### 1. Prepare Your Repository
```bash
cd mbh-staff-portal
npm install
git init (if not already initialized)
git add .
git commit -m "Initial deployment setup"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js

### 3. Set Environment Variables in Railway
Go to your project's Variables tab and add:

```
SUPABASE_URL=https://etkugeooigiwahikrmzr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhf
AIRTABLE_API_KEY=patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14
PORT=3000
NODE_ENV=production
```

### 4. Deploy
Railway will automatically deploy your app. Get your URL from the Settings tab.

### 5. Update Supabase
Add your Railway URL to Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Railway URL (e.g., `https://mbh-staff-portal.railway.app`)

## ⚠️ Important Security Note

**Before going to production**, you should:

1. **Update all HTML files** to use the proxy API instead of hardcoded keys
2. **Remove the Airtable API key** from client-side code
3. Use the example in `auth-updated.html` as a template

Example of updating API calls:
```javascript
// OLD (insecure)
const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
});

// NEW (secure)
const response = await MBHConfig.airtableFetch(`${BASE_ID}/${TABLE_ID}`);
```

## 📁 What Gets Deployed

```
mbh-staff-portal/
├── server.js           # Express server (serves files & proxies API)
├── package.json        # Dependencies
├── training/           # Your HTML/JS application
│   ├── *.html         # All your pages
│   └── js/
│       └── config.js  # Configuration loader
└── node_modules/      # Installed dependencies
```

## 🔍 Verify Deployment

1. Visit your Railway URL
2. Check that login works
3. Verify API calls are using the proxy (`/api/airtable/...`)
4. Check browser console for any exposed API keys

## 🐛 Troubleshooting

**Build fails**: Check package.json is valid JSON

**App crashes**: Check environment variables are set

**API errors**: Verify Airtable API key is correct

**Login issues**: Ensure Supabase URL is in allowed redirects

## 📊 Current Architecture

```
Browser → Railway Server → Airtable API
   ↓           ↓
   └─────→ Supabase ←──────┘
```

The server acts as a proxy to hide the Airtable API key from the browser.