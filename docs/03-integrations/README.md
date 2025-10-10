# Integration Documentation

This directory contains documentation for all external service integrations.

## 🔌 Integrations

### 📊 [Airtable](airtable/)
Primary database for all operational data:
- Bookings, Staff, Vessels, Checklists
- API integration via proxy
- Automation scripts and webhooks
- **[Airtable Automations](airtable/airtable-automations/)** - Collection of automation guides

### 📅 [Checkfront](checkfront/)
Booking system integration:
- Webhook handler for real-time bookings
- Customer data synchronization
- Add-ons and pricing integration
- Phone number capture

### 💳 [Square](square/)
Payment processing for ice cream sales:
- Webhook integration
- Category-based filtering
- Real-time sales tracking
- Sandbox and production setup

### 🔐 Supabase
Authentication system:
- User management
- Session handling
- Email verification

### 📱 Twilio
SMS notification service:
- Booking confirmations
- Staff shift notifications
- Integrated with webhooks

## 🔄 Integration Flow

```
Checkfront Booking → Webhook → Airtable → SMS Notification
Square Payment → Webhook → Ice Cream Sales Table
User Login → Supabase Auth → Portal Access
```

## 🔑 Key Concepts

### API Proxy Pattern
All Airtable API calls go through the backend proxy:
```
Frontend → /api/airtable/* → Backend → Airtable API
```

### Webhook Security
- Signature verification (Square)
- IP whitelisting (where applicable)
- Error handling without blocking

### Environment Variables
Each integration requires specific environment variables:
- See individual integration folders for details
- All keys stored securely in Railway

## 📚 Quick Links

- [Airtable Structure](airtable/AIRTABLE_STRUCTURE.md)
- [Checkfront Webhook Flow](checkfront/CHECKFRONT_WEBHOOK_FLOW.md)
- [Square Integration Plan](square/SQUARE_INTEGRATION_PLAN.md)
