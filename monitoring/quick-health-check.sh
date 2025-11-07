#!/bin/bash

# Quick Health Check Script for MBH Booking Reminder System
# Run this script periodically to monitor system health

echo "🏥 MBH Booking Reminder System - Quick Health Check"
echo "=================================================="
echo "📅 Check Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Configuration
PRODUCTION_URL="https://mbh-production-f0d1.up.railway.app"
ADMIN_KEY="${ADMIN_API_KEY}"

# Check if admin key is provided
if [ -z "$ADMIN_KEY" ]; then
    echo "❌ Error: ADMIN_API_KEY environment variable not set"
    echo "   Please set: export ADMIN_API_KEY=your_admin_key"
    exit 1
fi

# Function to measure response time
measure_response_time() {
    local start=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}" -H "X-Admin-Key: $ADMIN_KEY" "$1" 2>/dev/null)
    local end=$(date +%s%N)
    local duration=$((($end - $start) / 1000000))
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    echo "$duration|$http_code|$body"
}

# 1. Check API Health
echo "🔍 Checking API Health..."
health_result=$(measure_response_time "$PRODUCTION_URL/health")
health_time=$(echo "$health_result" | cut -d'|' -f1)
health_code=$(echo "$health_result" | cut -d'|' -f2)

if [ "$health_code" = "200" ]; then
    if [ "$health_time" -lt 1000 ]; then
        echo "   ✅ API is healthy (${health_time}ms)"
    else
        echo "   ⚠️  API is slow (${health_time}ms)"
    fi
else
    echo "   ❌ API is down (HTTP $health_code)"
fi

# 2. Check Booking Reminder Status
echo ""
echo "📊 Checking Booking Reminder Status..."
status_result=$(measure_response_time "$PRODUCTION_URL/api/admin/booking-reminder-status")
status_time=$(echo "$status_result" | cut -d'|' -f1)
status_code=$(echo "$status_result" | cut -d'|' -f2)
status_body=$(echo "$status_result" | cut -d'|' -f3-)

if [ "$status_code" = "200" ]; then
    echo "   ✅ Status endpoint responding (${status_time}ms)"
    
    # Parse JSON response (requires jq)
    if command -v jq &> /dev/null; then
        booking_count=$(echo "$status_body" | jq -r '.bookings | length' 2>/dev/null || echo "0")
        echo "   📅 Bookings today: $booking_count"
        
        # Count reminders sent
        onboarding_sent=$(echo "$status_body" | jq -r '[.bookings[] | select(.["Onboarding Reminder Sent"] == true)] | length' 2>/dev/null || echo "0")
        deloading_sent=$(echo "$status_body" | jq -r '[.bookings[] | select(.["Deloading Reminder Sent"] == true)] | length' 2>/dev/null || echo "0")
        
        if [ "$booking_count" -gt 0 ]; then
            echo "   📱 Onboarding reminders sent: $onboarding_sent"
            echo "   📱 Deloading reminders sent: $deloading_sent"
        fi
    else
        echo "   ℹ️  Install 'jq' for detailed status parsing"
    fi
else
    echo "   ❌ Status check failed (HTTP $status_code)"
fi

# 3. Check Recent Logs for Errors
echo ""
echo "🔍 Checking for Recent Errors..."

# Create a test booking reminder check
echo ""
echo "🧪 Testing Reminder Check Endpoint..."
test_result=$(curl -s -X POST -H "X-Admin-Key: $ADMIN_KEY" "$PRODUCTION_URL/api/admin/trigger-reminders" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Manual trigger endpoint working"
else
    echo "   ❌ Manual trigger endpoint failed"
fi

# Summary
echo ""
echo "📋 Summary"
echo "=========="

# Calculate overall status
overall_status="HEALTHY"
if [ "$health_code" != "200" ] || [ "$status_code" != "200" ]; then
    overall_status="CRITICAL"
elif [ "$health_time" -gt 1500 ] || [ "$status_time" -gt 1500 ]; then
    overall_status="WARNING"
fi

case "$overall_status" in
    "HEALTHY")
        echo "✅ System Status: HEALTHY"
        echo "   All systems operational"
        ;;
    "WARNING")
        echo "⚠️  System Status: WARNING"
        echo "   Performance degradation detected"
        echo "   Recommended: Check Railway logs and metrics"
        ;;
    "CRITICAL")
        echo "🔴 System Status: CRITICAL"
        echo "   System is not responding properly"
        echo "   Immediate action required!"
        ;;
esac

echo ""
echo "💡 Next Steps:"
echo "   - Run full monitoring: node monitoring/enhanced-monitoring-dashboard.js"
echo "   - Check Railway logs: https://railway.app/project/b6a903ad-65a4-4a84-a037-9bd7555b604f"
echo "   - Analyze recent logs: node monitoring/analyze-recent-logs.js"
echo ""
echo "✅ Health check complete!"
