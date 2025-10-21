# MBH Staff Portal - Performance Optimization Plan

## Current Performance Issues

### 1. API Response Time: 1551ms (Target: <1000ms)

**Root Causes Analysis**:
- Railway cold starts after periods of inactivity
- No connection pooling for external APIs
- Sequential processing of reminders
- Potential N+1 query issues with Airtable

### 2. Resource Usage Patterns

**Current State**:
- Memory: 9MB (Excellent)
- Check Interval: 60 seconds
- Instance Count: Multiple (Railway auto-scaling)

## Optimization Strategies

### Phase 1: Quick Wins (Implement This Week)

#### 1. Connection Keep-Alive
```javascript
// Add to booking-reminder-scheduler-fixed.js
const https = require('https');
const keepAliveAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 10
});

// Use with axios
const axiosConfig = {
    httpsAgent: keepAliveAgent,
    timeout: 10000
};
```

#### 2. Batch Airtable Queries
```javascript
// Instead of individual queries per booking
async function getTodaysBookingsOptimized() {
    const today = new Date().toISOString().split('T')[0];
    
    // Single query with all needed fields
    const formula = `AND(
        {Booking Date} = '${today}',
        OR(
            {Status} = 'PAID',
            {Status} = 'PART',
            {Status} = 'Confirmed'
        )
    )`;
    
    return await airtable('Bookings Dashboard')
        .select({
            filterByFormula: formula,
            fields: [
                'Customer Name', 'Booking Date', 'Status',
                'Start Time', 'Finish Time', 
                'Onboarding Time', 'Deloading Time',
                'Onboarding Reminder Sent', 'Deloading Reminder Sent',
                'Onboarding Employee', 'Deloading Employee',
                'Vessel', 'Booked Boat Type', 'Add-ons'
            ]
        })
        .all();
}
```

#### 3. Implement Response Caching
```javascript
// Cache employee data for 5 minutes
const employeeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getEmployeeByIdCached(employeeId) {
    const cacheKey = `employee_${employeeId}`;
    const cached = employeeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const employee = await getEmployeeById(employeeId);
    employeeCache.set(cacheKey, {
        data: employee,
        timestamp: Date.now()
    });
    
    return employee;
}
```

### Phase 2: Architecture Improvements (Next Month)

#### 1. Parallel Processing
```javascript
// Process reminders in parallel, not sequentially
async function processBookingRemindersOptimized() {
    const bookings = await getTodaysBookingsOptimized();
    const fullTimeStaff = await getFullTimeStaff();
    
    // Process all bookings in parallel
    const reminderPromises = bookings.map(booking => 
        processBookingReminder(booking, fullTimeStaff)
    );
    
    // Wait for all with error handling
    const results = await Promise.allSettled(reminderPromises);
    
    // Log any failures
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to process booking ${bookings[index].id}:`, result.reason);
        }
    });
}
```

#### 2. Database Query Optimization
```javascript
// Fetch only bookings needing reminders
async function getBookingsNeedingReminders() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const windowStart = currentMinutes - 2;
    const windowEnd = currentMinutes + 2;
    
    // More specific query to reduce data transfer
    const formula = `AND(
        {Booking Date} = TODAY(),
        OR({Status} = 'PAID', {Status} = 'PART', {Status} = 'Confirmed'),
        OR(
            AND(
                {Onboarding Time} != '',
                {Onboarding Reminder Sent} = FALSE()
            ),
            AND(
                {Deloading Time} != '',
                {Deloading Reminder Sent} = FALSE()
            )
        )
    )`;
    
    return await airtable('Bookings Dashboard')
        .select({ filterByFormula: formula })
        .all();
}
```

#### 3. Add Request Queuing
```javascript
// Queue manager for API requests
class RequestQueue {
    constructor(concurrency = 5) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }
    
    async add(fn) {
        if (this.running >= this.concurrency) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        
        this.running++;
        try {
            return await fn();
        } finally {
            this.running--;
            const next = this.queue.shift();
            if (next) next();
        }
    }
}

const smsQueue = new RequestQueue(3); // Max 3 concurrent SMS
const airtableQueue = new RequestQueue(5); // Max 5 concurrent Airtable ops
```

### Phase 3: Infrastructure Optimization (Future)

#### 1. Edge Function for Time-Critical Operations
- Move reminder checking to Cloudflare Workers or Vercel Edge
- Reduce cold start impact
- Geographic distribution for lower latency

#### 2. Redis for State Management
- Replace in-process caching with Redis
- Share state across instances
- Implement distributed locks for deduplication

#### 3. Webhook-Based Architecture
- Airtable webhooks for real-time updates
- Event-driven processing
- Eliminate polling overhead

## Monitoring & Metrics

### Key Performance Indicators (KPIs)

1. **Response Time Metrics**
   - P50: < 500ms
   - P95: < 1000ms
   - P99: < 2000ms

2. **Success Rate Metrics**
   - SMS Delivery Rate: > 99%
   - Reminder Accuracy: 100%
   - Duplicate Rate: 0%

3. **Resource Metrics**
   - Memory Usage: < 100MB
   - CPU Usage: < 50%
   - API Rate Limit Usage: < 50%

### Implementation Timeline

**Week 1 (Oct 21-27)**:
- [ ] Implement connection keep-alive
- [ ] Add basic caching
- [ ] Deploy and monitor impact

**Week 2 (Oct 28-Nov 3)**:
- [ ] Batch Airtable queries
- [ ] Implement parallel processing
- [ ] Add performance logging

**Month 2**:
- [ ] Evaluate need for Redis
- [ ] Consider edge functions
- [ ] Plan webhook migration

## Testing Strategy

### Load Testing Script
```javascript
// generate-test-bookings.js
async function generateTestBookings(count = 50) {
    const bookings = [];
    const baseTime = new Date();
    baseTime.setHours(10, 0, 0, 0);
    
    for (let i = 0; i < count; i++) {
        const startTime = new Date(baseTime);
        startTime.setMinutes(startTime.getMinutes() + (i * 15));
        
        bookings.push({
            'Customer Name': `Test Customer ${i}`,
            'Booking Date': new Date().toISOString().split('T')[0],
            'Start Time': formatTime(startTime),
            'Finish Time': formatTime(new Date(startTime.getTime() + 2 * 60 * 60 * 1000)),
            'Status': 'PAID',
            'Vessel': 'Test Boat'
        });
    }
    
    // Batch create in Airtable
    await createBookings(bookings);
}
```

### Performance Benchmarking
```bash
#!/bin/bash
# benchmark.sh
echo "Starting performance benchmark..."

# Measure API response time
for i in {1..10}; do
    time curl -s -H "X-Admin-Key: mbh-admin-2025" \
        https://mbh-production-f0d1.up.railway.app/api/admin/booking-reminder-status \
        > /dev/null
    sleep 1
done

# Monitor memory usage
while true; do
    curl -s -H "X-Admin-Key: mbh-admin-2025" \
        https://mbh-production-f0d1.up.railway.app/api/admin/system-stats
    sleep 60
done
```

## Expected Results

After implementing Phase 1 optimizations:
- API response time: 500-800ms (↓50%)
- Memory usage: 15-20MB (minimal increase)
- SMS processing time: < 2s per batch

After implementing Phase 2 optimizations:
- API response time: 200-400ms (↓75%)
- Concurrent reminder processing
- Zero duplicate messages

## Risk Mitigation

1. **Rollback Plan**
   - Keep original scheduler as backup
   - Feature flag for new optimizations
   - Gradual rollout strategy

2. **Monitoring During Changes**
   - Real-time alerts for errors
   - Performance degradation detection
   - Automated rollback triggers

3. **Testing Requirements**
   - Load test each optimization
   - Edge case validation
   - Production-like test environment
