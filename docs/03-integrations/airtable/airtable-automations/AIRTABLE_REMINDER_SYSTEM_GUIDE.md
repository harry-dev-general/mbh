# Weekly Availability Reminder System Guide

## Overview
This reminder system automatically identifies employees who haven't submitted their weekly availability and sends them reminder messages. It ensures you get complete roster information in time for planning.

## How It Works

1. **Tracks Submissions**: Monitors which employees have submitted for the current week
2. **Identifies Gaps**: Finds active employees who haven't submitted
3. **Sends Reminders**: Generates personalized reminder messages with form links
4. **Only Active Staff**: Uses the "Active Roster" field to skip inactive employees

## Reminder Message Example

```
Hi Luca! ⏰ Reminder: Please submit your availability for December 16 - December 22. We need this by end of day to plan next week's schedule.

https://airtable.com/applkAFOn2qxtu7tx/paggtyI5T8EOrLRSU/form?prefill_Week%20Starting=2024-12-16&prefill_Submission%20ID=WK2024-12-16-iQAS&hide_Week%20Starting=true&hide_Submission%20ID=true&hide_Processing%20Status=true
```

## Setting Up the Automation

### 1. Create the Automation in Airtable

1. Go to **Automations** in your MBH Bookings Operation base
2. Click **Create automation**
3. Name it: "Weekly Availability Reminders"

### 2. Configure the Trigger

Choose ONE of these timing options:

#### Option A: Wednesday Afternoon (Recommended)
- **Trigger**: At scheduled time
- **Frequency**: Every week
- **Day**: Wednesday
- **Time**: 2:00 PM
- **Timezone**: Your local timezone

#### Option B: Multiple Reminders
Set up separate automations for:
- **First Reminder**: Wednesday 2:00 PM
- **Final Reminder**: Thursday 4:00 PM
- **Last Chance**: Friday 10:00 AM

#### Option C: Daily Check
- **Trigger**: At scheduled time
- **Frequency**: Every day
- **Time**: 3:00 PM
- Run Tuesday through Friday

### 3. Add the Script Action

1. Add action: **Run a script**
2. Copy the entire script from `airtable-availability-reminder-automation.js`
3. Paste into the script editor
4. No input variables needed (the script calculates the current week)

### 4. Add SMS Actions

After the script runs, add a repeating group to send SMS:

1. **Add action**: Repeating group
2. **List**: Use output from script → `reminderMessages`
3. **Inside the repeating group**, add your SMS action:
   - **To**: Current item → mobileNumber
   - **Message**: Current item → message

### 5. Optional: Add Email Backup

Add another action in the repeating group:
- **Action**: Send email
- **To**: Look up employee email from Employee Details table
- **Subject**: "Reminder: Weekly Availability Needed"
- **Body**: Current item → message

## Script Features

### Active Employee Filtering
- Only reminds employees with `Active Roster = true`
- Automatically skips terminated or inactive staff

### Duplicate Prevention
- Checks if employee has already submitted for the week
- Won't send multiple reminders if they've already responded

### Smart Date Handling
- Always calculates the current week's Monday
- Works correctly even if run on different days

### Detailed Logging
Console output shows:
```
Checking submissions for week starting: 2024-12-16
Employee recsYdiaQMt0CTduT has submitted
Skipping inactive employee: John Doe
Need to remind: Luca Searl
Need to remind: Bronte Sprouster

Reminder Summary:
Total active employees: 3
Submissions received: 1
Reminders to send: 2

Employees to remind:
- Luca Searl (0432540256)
- Bronte Sprouster (0451022803)
```

## Customization Options

### 1. Change Reminder Tone
Edit the message template in the script:
```javascript
// Urgent tone
let reminderMessage = `Hi ${firstName}! 🚨 URGENT: Availability needed by 5pm today...`

// Friendly tone
let reminderMessage = `Hi ${firstName}! 😊 Just a friendly reminder about your availability...`

// Professional tone
let reminderMessage = `Dear ${firstName}, This is a reminder to submit your weekly availability...`
```

### 2. Add Deadline Information
Include specific deadlines:
```javascript
let deadline = "5:00 PM today";
let reminderMessage = `Hi ${firstName}! ⏰ Reminder: Please submit your availability for ${friendlyStartDate} - ${friendlyEndDate} by ${deadline}...`
```

### 3. Track Reminder Count
Add a field to Employee Details to track how many reminders sent:
- Field name: "Reminders This Week"
- Increment in the automation after sending

## Best Practices

1. **Timing**: Send reminders when employees are likely to see them (not too early/late)
2. **Frequency**: Don't over-remind - 2-3 times per week maximum
3. **Clear CTAs**: Always include the form link and deadline
4. **Test First**: Run manually with a test group before automating

## Monitoring & Reporting

### Weekly Metrics to Track:
- Submission rate before reminders
- Submission rate after reminders
- Average reminders needed per employee
- Time between reminder and submission

### Create a Dashboard View:
1. In Weekly Availability Submissions table
2. Group by Week Starting
3. Show count of submissions
4. Filter by Processing Status = "Processed"

## Troubleshooting

**No reminders being sent:**
- Check that employees have "Active Roster" checked
- Verify the Week Starting calculation is correct
- Ensure mobile numbers are properly formatted

**Too many reminders:**
- Check that submissions are being linked to employees correctly
- Verify Processing Status is set to "Processed"

**Wrong week calculated:**
- Test the date calculation logic
- Check timezone settings in automation

## Future Enhancements

1. **Smart Timing**: Send reminders based on employee's usual submission time
2. **Escalation**: CC manager if no response after 2 reminders
3. **Preferences**: Let employees choose their reminder schedule
4. **Analytics**: Track which reminder times get best response rates 