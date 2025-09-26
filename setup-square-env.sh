#!/bin/bash

echo "🔧 Square Integration Environment Setup"
echo "======================================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Please edit it manually."
    echo ""
    echo "Make sure it contains:"
    echo "  AIRTABLE_API_KEY=your_actual_key_here"
    echo "  SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ"
    echo ""
else
    echo "Creating .env file with Square configuration..."
    
    cat > .env << 'EOF'
# Airtable Configuration (REQUIRED - ADD YOUR KEY)
AIRTABLE_API_KEY=YOUR_AIRTABLE_API_KEY_HERE

# Square Configuration
SQUARE_ACCESS_TOKEN=EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
SQUARE_APPLICATION_ID=sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ

# Twilio Configuration (optional for testing)
TWILIO_ACCOUNT_SID=dummy_for_testing
TWILIO_AUTH_TOKEN=dummy_for_testing
TWILIO_FROM_NUMBER=+1234567890

# Server Configuration
PORT=8080
NODE_ENV=development
EOF

    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and replace YOUR_AIRTABLE_API_KEY_HERE with your actual key"
    echo ""
fi

echo "📝 Next Steps:"
echo "1. Edit .env and add your Airtable API key"
echo "2. Restart server: npm run dev"
echo "3. Test webhook: SQUARE_WEBHOOK_SIGNATURE_KEY=CPK571BwzDvZCy58EhV8FQ node test-square-webhook.js"
echo ""
echo "🚀 Railway Deployment:"
echo "Don't forget to set the same environment variables in Railway!"
