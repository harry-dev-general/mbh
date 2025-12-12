# Checkfront-Airtable Booking Reconciliation - Complete Investigation (December 2025)

## Overview

This document provides a comprehensive guide for LLMs and developers investigating issues with Checkfront webhook reliability and booking data synchronization to Airtable. It covers the full investigation journey, including approaches tried, technical discoveries made, and the final solution implemented.

**Investigation Dates**: December 10-12, 2025  
**Status**: RESOLVED ✅  
**Final Result**: 0 missing PAID/PART bookings in Airtable (including future bookings)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Initial Investigation](#initial-investigation)
3. [Approaches Tried](#approaches-tried)
4. [Technical Discoveries](#technical-discoveries)
5. [Final Solution](#final-solution)
6. [Verification Results](#verification-results)
7. [December 12 Update: Future Bookings Fix](#december-12-update-future-bookings-fix)
8. [Files Created/Modified](#files-createdmodified)
9. [For Future LLMs](#for-future-llms)

---

## Problem Statement

### Original Issue
The user reported that some bookings visible in Checkfront were not appearing in Airtable's "Bookings Dashboard" table. This data discrepancy was a critical issue as:

1. Staff allocations depend on accurate booking data
2. SMS notifications depend on Airtable records
3. The daily run sheet pulls from Airtable

### Initial Scope
- Verify Checkfront webhook is correctly syncing all bookings to Airtable
- Cross-reference bookings from Checkfront with Airtable
- Identify and resolve any discrepancies

### Affected Bookings (Initially Reported)
| Booking Code | Customer | Date | Status | Total |
|--------------|----------|------|--------|-------|
| NMHZ-140925 | Louise Thwaites | Oct 4, 2025 | PAID | $250.00 |
| ZCCV-160925 | Kevin Reeve | Oct 3, 2025 | PAID | $250.00 |
| MACN-031025 | Bryan Smeall | Oct 6, 2025 | PAID | $585.00 |
| AJPM-291025 | Peter Macnamara | Oct 30, 2025 | PAID | $485.00 |
| ZXDA-311025 | Davina Julliard | Dec 9, 2025 | PAID | $717.50 |
| (+ 4 test/VOID/STOP bookings) | | | | |

---

## Initial Investigation

### Step 1: Read Existing Documentation
Started by reading:
- `/docs/03-integrations/checkfront/CHECKFRONT_BOOKING_FLOW_ANALYSIS_DEC_2025.md`
- `/docs/03-integrations/checkfront/CHECKFRONT_WEBHOOK_FLOW.md`
- `/api/checkfront-webhook.js` (webhook handler code)

**Key Finding**: The existing webhook handler was correctly implemented but had no mechanism to recover from webhook delivery failures.

### Step 2: Understand the Current Flow
```
Checkfront → Webhook POST → Railway Server → Airtable
                              │
                              └── If server down, webhook LOST permanently
```

**Critical Finding**: Checkfront does NOT retry failed webhooks.

### Step 3: Identify Root Causes

| Root Cause | Impact | Evidence |
|------------|--------|----------|
| Railway deployment downtime (~5-30 seconds) | Webhooks during this window are lost | Booking dates clustered around known deployment periods |
| No Checkfront webhook retry | Failed webhooks never resent | Checkfront documentation confirms single-fire |
| Initial webhook setup period | Early bookings may have been missed | Sep 14-16, 2025 bookings affected |
| No audit trail | Impossible to diagnose missing bookings | No webhook logs existed |

---

## Approaches Tried

### Approach A: Use Airtable MCP Tool (Not Viable)
**Idea**: Use the Airtable MCP tool to directly query both systems.

**Result**: The MCP tool doesn't have access to Checkfront, only Airtable. This approach couldn't compare both systems.

### Approach B: Build Checkfront API Client (Implemented ✅)
**Idea**: Create a server-side API client to query Checkfront directly, then build reconciliation endpoints.

**Initial Implementation**:
```javascript
// First attempt - OAuth2 style (INCORRECT)
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
});
```

**Problem**: Checkfront uses **OAuth 1.0a** style API authentication, NOT OAuth2.

**Correct Implementation**:
```javascript
// OAuth 1.0a - HTTP Basic Auth with Consumer Key/Secret
const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
const response = await fetch(url, {
    headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    }
});
```

### Approach C: Debug API Endpoint (Implemented ✅)
**Idea**: Add a debug endpoint to test raw API responses before building full reconciliation.

**Implementation**: `/api/reconciliation/debug` - Returns raw Checkfront API response for analysis.

**Key Discovery from Debug Output**:
```json
{
  "booking/index": {
    "2411": { "booking_id": 2411, "code": "AVHY-260825", ... },
    "2412": { ... }
  }
}
```

The bookings are nested under `response['booking/index']`, NOT `response.booking` or `response.bookings`.

### Approach D: Fix Response Parsing (Implemented ✅)
**Original (broken)**:
```javascript
const bookings = response.booking || response.bookings || [];
```

**Fixed**:
```javascript
const bookingIndex = response['booking/index'];
if (bookingIndex && typeof bookingIndex === 'object') {
    const bookings = Object.values(bookingIndex).filter(b => b && b.booking_id);
}
```

### Approach E: Fix Airtable Date Filtering (Implemented ✅)
**Problem**: Some bookings existing in Airtable were incorrectly flagged as missing.

**Original Filter (exclusive)**:
```javascript
filterByFormula: `AND(
    IS_AFTER({Booking Date}, '${startDate}'),
    IS_BEFORE({Booking Date}, '${endDate}')
)`
```

**Fixed Filter (inclusive)**:
```javascript
filterByFormula: `AND(
    OR(IS_SAME({Booking Date}, '${startDate}'), IS_AFTER({Booking Date}, '${startDate}')),
    OR(IS_SAME({Booking Date}, '${endDate}'), IS_BEFORE({Booking Date}, '${endDate}'))
)`
```

**Result**: Reduced false positives from 11 to 9 missing bookings.

---

## Technical Discoveries

### 1. Checkfront API v3.0 Authentication
**Discovery**: Checkfront API v3.0 uses OAuth 1.0a style credentials (Consumer Key/Secret) with HTTP Basic Auth.

**Environment Variables Required**:
| Variable | Value Format | Notes |
|----------|--------------|-------|
| `CHECKFRONT_HOST` | `boat-hire-manly.checkfront.com` | Without `https://` |
| `CHECKFRONT_CONSUMER_KEY` | `xxxxxxxx` | From Checkfront Developer settings |
| `CHECKFRONT_CONSUMER_SECRET` | `xxxxxxxx` | From Checkfront Developer settings |

**The following are NOT needed for API Key auth**:
- `Authorize Token URL`
- `Access Token URL`

### 2. Checkfront Booking Index Endpoint
**Correct Endpoint**: `/api/3.0/booking/index`

**NOT**: `/api/3.0/booking` (returns 404 or different format)

**Pagination**:
```javascript
// Checkfront uses page-based pagination
const params = {
    start_date: '2025-11-01',
    end_date: '2025-12-01',
    limit: 100,
    page: 1  // 1-indexed
};

// Response includes:
response.request.pages;      // Total pages
response.request.total_records; // Total booking count
```

### 3. Checkfront Response Structure
```json
{
  "version": "3.0",
  "account_id": 2,
  "host_id": "boat-hire-manly.checkfront.com",
  "request": {
    "records": 10,
    "total_records": 22,
    "page": 1,
    "pages": 3
  },
  "booking/index": {
    "2411": {
      "booking_id": 2411,
      "code": "AVHY-260825",
      "status_id": "PAID",        // Note: status_id, not status
      "status_name": "Paid",
      "customer_name": "John Doe",
      "total": "770.00",          // String, not number
      "created_date": 1756164798  // Unix timestamp
    }
  }
}
```

**Key Field Mappings**:
| Checkfront Field | Normalized Field | Notes |
|------------------|------------------|-------|
| `status_id` | `status` | PAID, PART, PEND, VOID, STOP |
| `customer_name` | `customerName` | Already combined |
| `total` | `total` | String - parse as needed |
| `created_date` | `createdDate` | Unix timestamp |

### 4. Airtable Date Formula Quirk
Airtable's `IS_AFTER()` and `IS_BEFORE()` are **exclusive** by default:
- `IS_AFTER('2025-10-01', '2025-10-01')` → `false`
- `IS_BEFORE('2025-10-01', '2025-10-01')` → `false`

**Solution**: Combine with `IS_SAME()`:
```
OR(IS_SAME({Date}, 'target'), IS_AFTER({Date}, 'target'))
```

### 5. Webhook Failure Patterns
Analysis of missing booking dates revealed patterns:

| Date Range | Bookings Missed | Likely Cause |
|------------|-----------------|--------------|
| Sep 14-16, 2025 | 2 | Initial webhook setup |
| Oct 27-31, 2025 | 3 | Railway deployment window |
| Nov 18, 2025 | 3 | Test/development activity |

**Insight**: Railway deployments cause ~5-30 seconds of downtime. During this window, any incoming webhooks are lost permanently because Checkfront doesn't retry.

---

## Final Solution

### Three-Tier Protection System

#### 1. Automatic Reconciliation Scheduler
**File**: `/api/reconciliation-scheduler.js`

```javascript
// Runs every 6 hours
const RECONCILIATION_INTERVAL_HOURS = 6;
const RECONCILIATION_LOOKBACK_DAYS = 14;

// On each run:
// 1. Fetch Checkfront bookings for last 14 days
// 2. Fetch Airtable bookings for same period
// 3. Compare and identify missing PAID/PART bookings
// 4. Auto-sync missing bookings to Airtable
// 5. Send admin SMS alert if discrepancies found
```

#### 2. Webhook Audit Log
**File**: `/api/webhook-audit-log.js`

```javascript
// In-memory log of last 1000 webhooks
// Stores: timestamp, source, payload, headers
// Enables post-hoc debugging of webhook failures
```

#### 3. Admin API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/reconciliation-status` | GET | Check scheduler status |
| `/api/admin/trigger-reconciliation` | POST | Force immediate run |
| `/api/admin/webhook-logs` | GET | View audit logs |

All endpoints require `X-Admin-Key` header.

### Architecture Diagram

```
┌─────────────────┐
│   Checkfront    │
│  (Booking)      │
└────────┬────────┘
         │ Webhook POST
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Railway API    │────►│  Webhook Audit   │
│ /api/checkfront │     │  Log (in-memory) │
│ /webhook        │     └──────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Airtable     │◄────────────────────────┐
│ Bookings Table  │                         │
└─────────────────┘                         │
                                            │
┌───────────────────────────────────────────┤
│  Reconciliation Scheduler (Every 6 hrs)   │
│  • Compare Checkfront vs Airtable         │
│  • Auto-sync missing PAID/PART bookings   │
│  • SMS alert if discrepancies found       │
└───────────────────────────────────────────┘
```

---

## Verification Results

### Final Reconciliation Run (Dec 11, 2025)

```json
{
  "success": true,
  "active": true,
  "lastRun": "2025-12-11T04:19:15.003Z",
  "lastResult": {
    "checkfrontCount": 41,
    "airtableCount": 39,
    "missingCount": 0,
    "missingBookings": []
  }
}
```

### Explanation of 2-Booking Difference
- **41 bookings** in Checkfront (all statuses)
- **39 bookings** in Airtable (PAID/PART only)
- **Difference**: 2 test/STOP/VOID bookings intentionally not synced

### Scheduler Logs Confirming Success

```
🚀 Starting Checkfront-Airtable reconciliation scheduler...
   - Running every 6 hours
   - Checking last 14 days of bookings
   - Auto-syncing missing PAID/PART bookings
✅ Reconciliation scheduler started

🔄 Running scheduled Checkfront-Airtable reconciliation...
📅 Checking bookings from 2025-11-27 to 2025-12-11...
📊 Checkfront: 41 bookings
📊 Airtable: 39 bookings
⚠️ Missing in Airtable: 0 PAID/PART bookings
```

---

## December 12 Update: Future Bookings Fix

### New Issue Discovered

On December 12, 2025, another missing booking was reported: `MTAH-041125` (Syed, booking date December 13, 2025). Despite the reconciliation system showing "0 missing bookings", this booking was not in Airtable.

### Root Cause Analysis

**Issue 1: Reconciliation Only Checked Past Dates**

The scheduler was configured to check `today - 14 days` to `today`, missing all **future bookings**.

```javascript
// BROKEN - Only checked past dates
const endDate = new Date();  // Today (Dec 12)
startDate.setDate(startDate.getDate() - 14);  // Nov 28

// MTAH-041125 was for Dec 13 (tomorrow) - NEVER CHECKED!
```

**Issue 2: Synced Bookings Missing Data Fields**

When reconciliation synced bookings, they were missing:
- Phone Number
- Start Time  
- Finish Time
- Duration

**Root Cause**: The `/booking/index` endpoint returns limited data. Full details require fetching `/booking/{id}`.

**Issue 3: Different API Response Formats**

The individual booking endpoint returns a DIFFERENT structure than webhooks:

| Field | Webhook Format | API `/booking/{id}` Format |
|-------|---------------|---------------------------|
| Booking code | `booking.code` | `booking.id` |
| Status | `booking.status` | `booking.status_id` |
| Customer | `booking.customer.phone` | `booking.customer_phone` |
| Items | `booking.order.items.item[]` | `booking.items{}` (object) |

### Fixes Implemented

**Fix 1: Extended Date Range**
```javascript
// NOW - Checks past AND future (14 days each direction)
async function runReconciliation(daysBack = 14, daysForward = 14) {
    const today = new Date();
    startDate.setDate(today.getDate() - daysBack);
    endDate.setDate(today.getDate() + daysForward);
}
```

**Fix 2: Fetch Full Booking Details**
```javascript
// Now fetches complete data before syncing
const fullBooking = await checkfrontApi.getBooking(indexBooking.booking_id);
```

**Fix 3: Handle Both API Formats**
```javascript
// Handles flat (API) and nested (webhook) structures
const customerPhone = booking.customer_phone || booking.customer?.phone || '';
const bookingCode = booking.id || booking.code;
```

**Fix 4: Parse `date_desc` String**
```javascript
// Parses "Sat Dec 13, 2025" when start_date timestamp unavailable
function parseDateDesc(dateDesc) {
    const parsed = new Date(dateDesc);
    return parsed.toISOString().split('T')[0];
}
```

### Technical Discovery: Full Booking API Response

The `/booking/{id}` endpoint returns complete data:

```json
{
  "id": "MTAH-041125",
  "booking_id": 2620,
  "status_id": "PAID",
  "customer_name": "Syed",
  "customer_phone": "+61417270996",
  "start_date": 1765589400,
  "end_date": 1765603800,
  "items": {
    "1": {
      "sku": "8personbbqboat-halfday",
      "name": "1/2 Day 8 Person BBQ Boat",
      "category_id": 2
    }
  }
}
```

### Verification Results (Dec 12)

```
MTAH-041125 (Syed) - After Fix:
  ✅ Phone: +61417270996
  ✅ Start Time: 12:30 pm
  ✅ Finish Time: 04:30 pm
  ✅ Duration: 4 hours 0 minutes
  ✅ Booking Date: 2025-12-13

Reconciliation Config:
  daysBack: 14
  daysForward: 14  (NEW!)
  
Full System Status:
  Checkfront: 95 bookings
  Airtable: 94 bookings
  Missing PAID/PART: 0 ✅
```

### New Debug Endpoint

Added `/api/reconciliation/booking-debug/:id` to view raw Checkfront API responses:

```bash
curl -H "X-Admin-Key: mbh-admin-2025" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking-debug/2620
```

### December 12 Commits

1. `e8acc25` - Fix reconciliation to include future bookings
2. `c0719a1` - Fix booking date parsing for /booking/index endpoint
3. `249adb3` - Fetch full booking details for sync
4. `2b603d1` - Fix sync to handle Checkfront API response format
5. `cce3745` - Fix booking endpoint to show correct customer data

---

## Files Created/Modified

### New Files (Dec 10-11)

| File | Purpose |
|------|---------|
| `/api/checkfront-api.js` | Checkfront API client with OAuth 1.0a auth |
| `/api/checkfront-reconciliation.js` | Reconciliation API endpoints |
| `/api/reconciliation-scheduler.js` | Automatic scheduled reconciliation |
| `/api/webhook-audit-log.js` | In-memory webhook audit logging |
| `/training/checkfront-reconciliation.html` | Admin UI for reconciliation |
| `/docs/03-integrations/checkfront/CHECKFRONT_API_SETUP.md` | API setup documentation |
| `/docs/03-integrations/checkfront/WEBHOOK_RELIABILITY_SOLUTION.md` | Solution documentation |

### Modified Files (Dec 10-11)

| File | Changes |
|------|---------|
| `/server.js` | Added reconciliation routes, scheduler startup, admin endpoints |
| `/api/checkfront-webhook.js` | Integrated webhook audit logging |

### Modified Files (Dec 12)

| File | Changes |
|------|---------|
| `/api/checkfront-api.js` | Added `getFullBookingByCode()`, extended date search range |
| `/api/checkfront-reconciliation.js` | Full data sync, debug endpoint, API format handling |
| `/api/reconciliation-scheduler.js` | Future dates, full data fetch, format handling |

---

## For Future LLMs

### Quick Context
- **Issue**: Checkfront webhooks occasionally fail during Railway deployments
- **Impact**: Bookings missing from Airtable
- **Solution**: Automatic reconciliation every 6 hours catches and syncs missing bookings
- **Dec 12 Fix**: Now checks FUTURE bookings too, not just past dates

### Key Environment Variables
```
CHECKFRONT_HOST=boat-hire-manly.checkfront.com
CHECKFRONT_CONSUMER_KEY=<from Checkfront Developer settings>
CHECKFRONT_CONSUMER_SECRET=<from Checkfront Developer settings>
ADMIN_API_KEY=<secure key for admin endpoints>
```

### Common Commands

```bash
# Check reconciliation status (verify daysForward is set!)
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/reconciliation-status

# Manually trigger reconciliation
curl -X POST -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/trigger-reconciliation

# View webhook logs
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/admin/webhook-logs

# Check specific booking with full details
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking/BOOKING_CODE

# Debug raw Checkfront data by booking ID
curl -H "X-Admin-Key: YOUR_KEY" \
  https://mbh-production-f0d1.up.railway.app/api/reconciliation/booking-debug/BOOKING_ID
```

### If Bookings Are Missing Again

1. **Check scheduler status**: Is it running? When did it last run?
2. **Verify date range**: Does config show `daysForward: 14`?
3. **Check if booking is FUTURE**: Scheduler now checks ±14 days from today
4. **Check Railway logs**: Look for reconciliation output
5. **Manually trigger**: Use the trigger endpoint
6. **Check Airtable**: Verify "Bookings Dashboard" table
7. **Use debug endpoint**: `/api/reconciliation/booking-debug/{id}` for raw data

### API Quirks to Remember

1. **Checkfront endpoint**: Use `/booking/index`, not `/booking`
2. **Response key**: Bookings are in `response['booking/index']`, not `response.booking`
3. **Status field**: It's `status_id`, not `status`
4. **Airtable dates**: Use `IS_SAME()` combined with `IS_AFTER()`/`IS_BEFORE()` for inclusive ranges
5. **Future bookings**: Reconciliation must check dates AHEAD of today
6. **Full details**: `/booking/index` has LIMITED data - fetch `/booking/{id}` for phone/times
7. **API vs Webhook format**: Different field structures (see Dec 12 section)
8. **Timestamps**: Can be strings OR numbers - always `parseInt()`

### Two Checkfront Endpoints to Know

| Endpoint | Returns | Use For |
|----------|---------|---------|
| `/booking/index` | Limited data (no phone, no timestamps) | Listing bookings |
| `/booking/{id}` | Full data (phone, times, items) | Getting complete details |

---

## Related Documentation

- [Checkfront API Setup](../03-integrations/checkfront/CHECKFRONT_API_SETUP.md)
- [Webhook Reliability Solution](../03-integrations/checkfront/WEBHOOK_RELIABILITY_SOLUTION.md)
- [Checkfront Booking Flow Analysis](../03-integrations/checkfront/CHECKFRONT_BOOKING_FLOW_ANALYSIS_DEC_2025.md)
- [Checkfront Webhook Flow](../03-integrations/checkfront/CHECKFRONT_WEBHOOK_FLOW.md)
- [Dec 12 Session Summary](../07-handover/session-summaries/DECEMBER_12_2025_RECONCILIATION_FUTURE_BOOKINGS_FIX.md)

---

## Appendix: Debugging Log Samples

### Successful API Connection
```
🔗 Checkfront API Request: https://boat-hire-manly.checkfront.com/api/3.0/booking/index
📦 Parameters: {
  "start_date": "2025-11-27",
  "end_date": "2025-12-11",
  "limit": 100,
  "page": 1
}
📥 Checkfront Response Status: 200
📄 Page 1 - Response keys: version, account_id, host_id, name, locale, request, booking/index
📚 Found 41 booking entries
✅ Retrieved 41 bookings from Checkfront
```

### Successful Reconciliation
```
🔄 Running scheduled Checkfront-Airtable reconciliation...
📅 Checking bookings from 2025-11-27 to 2025-12-11...
📊 Checkfront: 41 bookings
📊 Airtable: 39 bookings
⚠️ Missing in Airtable: 0 PAID/PART bookings
✅ Reconciliation complete.
```

---

*Document created: December 11, 2025*  
*Last updated: December 12, 2025*


