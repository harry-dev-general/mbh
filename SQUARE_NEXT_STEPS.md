# Square Integration - Next Steps

## ✅ Completed
- Square webhook handler implemented
- Documentation created
- Test scripts ready
- Sandbox credentials received

## 🔄 Immediate Actions Required

### 1. Add to your local .env file:
```
SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=to_be_added
```

### 2. Test the connection:
```bash
node test-square-sandbox.js
```

### 3. Create webhook in Square:
1. Go to https://developer.squareup.com/apps
2. Select your sandbox app
3. Go to Webhooks → Add Endpoint
4. For local testing, use ngrok:
   ```bash
   ngrok http 3000
   ```
   Then use: `https://your-ngrok-url.ngrok.io/api/square-webhook`

### 4. Get the webhook signature key and add to .env

### 5. Test webhook locally:
```bash
# Terminal 1
npm run dev

# Terminal 2  
node test-square-webhook.js
```

### 6. Deploy to Railway:
```bash
railway variables set SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
railway variables set SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
railway variables set SQUARE_ENVIRONMENT=sandbox
railway variables set SQUARE_WEBHOOK_SIGNATURE_KEY=your_key_here
```

## 📝 Notes
- Webhook will create bookings in your existing Bookings Dashboard table
- Phone numbers will be captured automatically
- Add-on indicators will show if Square order includes modifiers
- All times converted to Sydney timezone

## 🚀 Production Checklist
- [ ] Get production Square credentials
- [ ] Update Railway environment variables
- [ ] Create production webhook endpoint
- [ ] Test with small real transaction
- [ ] Monitor logs for first week
