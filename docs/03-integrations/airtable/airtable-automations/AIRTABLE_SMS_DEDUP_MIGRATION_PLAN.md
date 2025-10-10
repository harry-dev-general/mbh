# Migration Plan: SMS + Deduplication

## Current State → Target State

**Current:**
- Booking created → SMS sent immediately
- Duplicate records accumulating
- Staff get multiple notifications

**Target:**
- Booking created → Smart check → SMS only when needed
- Duplicates automatically merged
- Staff get relevant notifications only

## Step-by-Step Migration

### Phase 1: Preparation (Do First)
1. **Backup your data** - Export Bookings Dashboard
2. **Document current SMS automation** - Screenshot the setup
3. **Run cleanup script** in dry-run mode to see duplicates
4. **Test scripts** in a test base if possible

### Phase 2: Clean Existing Data
1. Run `airtable-booking-duplicate-cleanup.js`:
   - First with `dryRun = true` to review
   - Then with `dryRun = false` to clean
2. Verify staff assignments were preserved
3. Check that booking statuses are correct

### Phase 3: Implement Deduplication
1. Create new automation: "Booking Deduplication"
   - Trigger: When record created in Bookings Dashboard
   - Action: Run script → `airtable-booking-deduplication-enhanced.js`
   - Input: recordId from trigger
2. **Keep it DISABLED for now**

### Phase 4: Update SMS Automation
1. **Duplicate** your current SMS automation (keep original as backup)
2. In the duplicate:
   - Replace script with `airtable-booking-sms-smart-notification.js`
   - Add conditional: Only send if `sendNotification = true`
   - Use `notificationMessage` for SMS content
3. **Test** with a few manual record creations
4. **Disable** original SMS automation
5. **Enable** new smart SMS automation

### Phase 5: Go Live
1. **Enable** deduplication automation
2. **Monitor** closely for first day:
   - Check automation history
   - Verify SMS are being sent correctly
   - Confirm duplicates are being merged
3. **Delete** original SMS automation after 1 week

## Testing Checklist

Before going live, test these scenarios:

- [ ] New booking → SMS sent, no deduplication
- [ ] Status change to Paid → SMS sent, duplicate deleted
- [ ] Status change to VOID → SMS sent, duplicate deleted  
- [ ] Minor change (pending→held) → No SMS, duplicate deleted
- [ ] Booking with staff assigned → Staff preserved after dedup

## Rollback Plan

If issues arise:
1. Disable both new automations immediately
2. Re-enable original SMS automation
3. Review automation history to identify issue
4. Fix and re-test before trying again

## Timeline

- **Day 1**: Preparation & cleanup (2-3 hours)
- **Day 2**: Implement & test new automations (1-2 hours)
- **Day 3-7**: Monitor closely
- **Day 8**: Remove old automation

## Success Metrics

After 1 week, you should see:
- ✅ No duplicate booking records
- ✅ Staff getting appropriate notifications
- ✅ No lost staff assignments
- ✅ Cleaner Bookings Dashboard
- ✅ Better reporting accuracy

## Quick Wins

Immediate benefits:
1. Cleaner data for staff allocation
2. Reduced SMS costs (fewer duplicate notifications)
3. Less confusion for staff
4. Accurate booking counts 