# Quick Setup: Reminder Automation

## Script Selection
Use: `airtable-reminder-automation-final.js`

## Script Outputs

The script provides multiple output formats for flexibility:

### Output Variables Available:
- `reminders` - Array of objects, each containing:
  - `phone` - Mobile number
  - `message` - Full SMS message with link
  - `name` - Employee full name
  - `firstName` - First name only
  - `formUrl` - Direct form link
  - `employeeId` - Employee record ID

- `phoneNumbers` - Array of just phone numbers
- `messages` - Array of just message texts
- `names` - Array of employee names
- `totalReminders` - Number count
- `weekStarting` - Week date

## Airtable Automation Setup

### Method 1: Using Repeating Group (Recommended)

1. **Add Action**: Repeating group
2. **List source**: Choose output from previous step → `reminders`
3. **Inside the repeating group**, add SMS action:
   - **To**: Current item → phone
   - **Message**: Current item → message

### Method 2: Using Individual Arrays

If Method 1 doesn't work with your SMS integration:

1. **Add Action**: Your SMS integration
2. **Configure bulk send**:
   - **Phone numbers**: Choose output → `phoneNumbers`
   - **Messages**: Choose output → `messages`

## Testing Before Going Live

1. Run the script manually first
2. Check console output shows correct employees
3. Verify message format looks good
4. Test with one employee before scheduling

## Example Output Structure

When the script runs, `reminders` will contain:
```javascript
[
  {
    phone: "0432540256",
    message: "Hi Luca! ⏰ Reminder: Please submit...",
    name: "Luca Searl",
    firstName: "Luca",
    formUrl: "https://airtable.com/...",
    employeeId: "rec84sGwE55HsiQAS"
  },
  {
    phone: "0451022803",
    message: "Hi Bronte! ⏰ Reminder: Please submit...",
    name: "Bronte Sprouster",
    firstName: "Bronte",
    formUrl: "https://airtable.com/...",
    employeeId: "recyoRnqUxVuMjW17"
  }
]
```

## Troubleshooting

**"Can't find message field"**
- Make sure you're inside the repeating group
- Use "Current item" → then select the field

**"No outputs available"**
- Run the script manually once first
- Check that there are employees who need reminders

**"SMS not sending"**
- Verify phone numbers are formatted correctly
- Check SMS integration credentials
- Test with a single number first 