# MBH SMS Automation - Final Implementation Guide

## Overview
This guide provides the complete setup for the Monday SMS automation that collects weekly availability from employees. The Employee field will be visible for manual selection (Airtable limitation).

## Automation Setup

### 1. Create the Automation in MBH Bookings Operation Base

**Trigger:**
- Type: "At scheduled time"
- Time: Every Monday at 6:00 AM
- Timezone: Your local timezone

### 2. Add "Find Records" Action

**Configuration:**
- Table: Employee Details
- View: Use existing view or create "Active Employees"
- Conditions:
  - Active Roster = ✓ (checked)
  - Mobile = is not empty

### 3. Add "Run Script" Action

**Input Variables:**
```javascript
let inputConfig = input.config();
let employeeName = inputConfig.employeeName;
let employeeId = inputConfig.employeeId;
```

**Field Mapping:**
- employeeName → Employee Details > Name
- employeeId → Employee Details > Record ID

**Script:** Copy the entire content from `final-sms-automation-script.js`

### 4. Add "Send SMS" Action

**Configuration:**
- To: Employee Details > Mobile
- Message: Script Output > smsMessage

## How It Works

1. **Every Monday at 6 AM**: Automation triggers
2. **Find Active Employees**: Gets all employees with Active Roster checked and mobile numbers
3. **For Each Employee**: 
   - Generates personalized form URL
   - Creates friendly SMS message
   - Prefills Week Starting and Submission ID
   - Employee field remains visible for selection

## Employee Experience

1. **Receive SMS**: "Hi [Name]! 📅 Please submit your availability for [Date Range]."
2. **Click Link**: Opens form with prefilled data
3. **Select Name**: Choose their name from dropdown (one click)
4. **Enter Availability**: Fill in times for each day
5. **Submit**: Creates roster records automatically

## Form Fields

### Visible to Employee:
- **Employee** (dropdown) - Must select their name
- **Availability fields** for each day

### Hidden (Prefilled):
- **Week Starting** - Automatically set to upcoming Monday
- **Submission ID** - Unique identifier (WK2025-01-20-ABC123)
- **Processing Status** - Hidden system field

## Testing

1. **Test with Single Employee**:
   - Temporarily filter "Find Records" to one test employee
   - Run automation manually
   - Verify SMS content and URL

2. **Verify Form**:
   - Click generated URL
   - Confirm Week Starting is prefilled
   - Confirm Submission ID is prefilled
   - Confirm Employee dropdown is visible
   - Submit test data

3. **Check Roster Creation**:
   - Verify 7 roster records created
   - Check dates and times are correct

## Important Notes

- **Employee Selection**: Due to Airtable limitations, linked record fields (Employee) cannot be prefilled via URL
- **Date Logic**: 
  - Sunday runs → Monday's week
  - Monday runs → Current week
  - Other days → Following Monday
- **SMS Costs**: Each message counts against your Twilio/SMS quota
- **Active Roster Control**: Uncheck "Active Roster" to exclude employees temporarily

## Troubleshooting

**No SMS Sent:**
- Check employee has "Active Roster" checked
- Verify mobile number is filled
- Check automation run history for errors

**Wrong Dates:**
- Verify server timezone settings
- Test date calculation logic

**Form Issues:**
- Ensure form is published
- Check form permissions
- Test URL manually

## Next Steps

After successful implementation:
1. Monitor first full run on Monday
2. Collect employee feedback
3. Adjust SMS message if needed
4. Consider reminder automation for non-submitters 