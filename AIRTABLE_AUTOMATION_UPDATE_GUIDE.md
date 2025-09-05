# Airtable Automation Update Guide

## Configure Script Input Variables

In your Airtable automation, you need to configure the script to receive ALL webhook data. 

### Step 1: Edit the Script Action
Click on your script action and look for "Input variables" section at the top.

### Step 2: Add These Input Variables
You need to add the following input variables and map them to your webhook trigger data:

| Variable Name | Map To (From Webhook) |
|--------------|----------------------|
| `startDate` | ✅ Already configured |
| `endDate` | ✅ Already configured |
| `createdDate` | ✅ Already configured |
| `bookingCode` | Webhook → bookingCode (or bookingId) |
| `customerName` | Webhook → customerName (or name) |
| `customerEmail` | Webhook → customerEmail (or email) |
| `status` | Webhook → status (or bookingStatus) |
| `totalAmount` | Webhook → totalAmount (or amount) |
| `bookingItems` | Webhook → bookingItems (or items) |

### Step 3: How to Add Each Variable
1. Click "+ Add input variable"
2. Name: Enter the variable name exactly as shown above
3. Value: Click the blue "+" and select from webhook trigger data
4. Repeat for each variable

### Important Notes:
- Variable names are case-sensitive
- The webhook field names might be slightly different (e.g., "bookingId" instead of "bookingCode")
- Map to whatever field names your webhook actually sends

### Example Webhook Data Structure
Your webhook likely sends data like:
```json
{
  "bookingCode": "ABCD-123456",
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "status": "PEND",
  "totalAmount": 250,
  "bookingItems": "boat6person4hr",
  "startDate": 1751080500,
  "endDate": 1751094900,
  "createdDate": 1750815969
}
```

### After Configuration
Once all variables are mapped, the script will receive the actual booking data and properly check for/update existing records instead of creating empty ones.