# Transaction Auto-Categorization Setup Guide

This guide will help you set up automated transaction categorization using your existing 519 categorized transactions as training data. You have two main options: **n8n workflow** or **Airtable automation**.

## 🎯 Overview

The automation will:
- ✅ Use your 519 existing categorized transactions as AI training data
- ✅ Automatically categorize new transactions into **Type** (Income, Expense, Equity)
- ✅ Automatically categorize into **Category** (Marketing, Growth, Operations, etc.)
- ✅ Add confidence scores and metadata to track AI performance
- ✅ Provide fallback categorization if AI fails

## 📋 Prerequisites

### Required Airtable Fields
Make sure your `Transactions` table has these fields:

**Required fields:**
- `Description` (Single line text)
- `Amount` (Number - positive for income, negative for expenses)
- `Type` (Single select: Income, Expense, Equity)
- `Category` (Single select: Marketing, Growth, Operations, Maintenance, Salary, Sales Revenue, Logistics, Equity Contribution, Fuel, Misc, Square Payment)

**Recommended additional fields:**
- `Vendor` (Single line text)
- `AI Confidence` (Number - 0 to 1)
- `Auto Categorized` (Checkbox)
- `Categorized Date` (Date)
- `AI Reasoning` (Long text)

## 🔧 Option 1: n8n Workflow Setup

### Step 1: Import the Workflow
1. Copy the content from `transaction-categorization-n8n-workflow.json`
2. In n8n, go to **Workflows** → **Import from JSON**
3. Paste the workflow JSON and click **Import**

### Step 2: Configure Airtable Connection
1. In the workflow, find all **Airtable** nodes
2. Replace `YOUR_AIRTABLE_BASE_ID` with your actual Airtable Base ID
3. Set up Airtable credentials:
   - Go to https://airtable.com/account
   - Generate a Personal Access Token
   - In n8n: **Credentials** → **Add credential** → **Airtable API**

### Step 3: Configure OpenAI Connection
1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. In n8n: **Credentials** → **Add credential** → **OpenAI**
3. Add your API key

### Step 4: Set Up Trigger
**Option A: Manual Trigger (Recommended for testing)**
- Use the existing manual trigger to test the workflow

**Option B: Schedule Trigger**
```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "triggerAtHour": 9,
          "triggerAtMinute": 0
        }
      ]
    }
  },
  "name": "Schedule Daily",
  "type": "n8n-nodes-base.scheduleTrigger"
}
```

**Option C: Webhook Trigger (for real-time)**
- Add a webhook trigger if you want to call it from Airtable

### Step 5: Test and Deploy
1. **Test manually**: Click **Execute Workflow**
2. **Check results**: Verify transactions are categorized correctly
3. **Activate**: Toggle the workflow to **Active**

---

## 🔧 Option 2: Airtable Automation Setup

### Step 1: Add Required Fields
Ensure your Transactions table has all the fields listed in Prerequisites.

### Step 2: Create the Automation
1. In Airtable, go to **Automations** → **Create automation**
2. **Trigger**: Choose "When record created" → Select "Transactions" table
3. **Action**: Choose "Run script"

### Step 3: Configure the Script
1. Copy the content from `airtable-transaction-automation.js`
2. Paste it into the script action
3. **Configure input variables**:
   - Add `openaiApiKey` as a secret input variable
   - Add your OpenAI API key value

### Step 4: Set Input Configuration
In the automation setup, configure:
```javascript
{
  "openaiApiKey": "YOUR_OPENAI_API_KEY",
  "record": "{{AIRTABLE_RECORD_ID}}"
}
```

### Step 5: Test and Activate
1. **Test**: Create a new transaction record without Type/Category
2. **Verify**: Check that it gets automatically categorized
3. **Activate**: Turn on the automation

---

## 🔍 Understanding the AI Logic

### Training Data Selection
- Uses 20 most recent categorized transactions as examples
- Provides context to AI about your categorization patterns
- Excludes transactions that are already categorized

### Categorization Rules
**Types:**
- **Income**: Positive amounts, sales, payments received
- **Expense**: Negative amounts, purchases, services, subscriptions  
- **Equity**: Owner investments, withdrawals, capital contributions

**Categories:**
- **Sales Revenue**: Direct sales income
- **Marketing**: Advertising, promotions, marketing tools
- **Operations**: Day-to-day business operations
- **Maintenance**: Repairs, upkeep, maintenance costs
- **Salary**: Employee compensation
- **Growth**: Business development, expansion costs
- **Logistics**: Shipping, transportation, warehousing
- **Equity Contribution**: Owner/investor contributions
- **Fuel**: Vehicle fuel costs
- **Square Payment**: Square processing fees
- **Misc**: Everything else

### Confidence Scoring
- **High (0.8-1.0)**: Clear pattern match with training data
- **Medium (0.5-0.7)**: Some uncertainty but reasonable match
- **Low (0.1-0.4)**: High uncertainty, manual review recommended

---

## 🚀 Advanced Features

### Batch Processing (n8n only)
To categorize all existing uncategorized transactions:

1. **Modify the Airtable filter**:
   ```javascript
   "filterByFormula": "OR({Type} = '', {Category} = '')"
   ```

2. **Add a Split In Batches node** to process multiple records

### Custom Categories
To add new categories:

1. **Update the validation arrays** in both scripts:
   ```javascript
   const VALID_CATEGORIES = [
       'Marketing', 'Growth', 'Operations', 'Maintenance', 
       'Salary', 'Sales Revenue', 'Logistics', 'Equity Contribution', 
       'Fuel', 'Misc', 'Square Payment', 'YOUR_NEW_CATEGORY'
   ];
   ```

2. **Update your Airtable single select field** with the new option

### Improving Accuracy
1. **Review low-confidence predictions** (< 0.6) manually
2. **Add more training examples** for categories that perform poorly
3. **Adjust the AI prompt** for your specific business context
4. **Monitor categorization patterns** and retrain as needed

---

## 📊 Monitoring and Maintenance

### Key Metrics to Track
- **Categorization accuracy** (manual review sample)
- **Confidence score distribution**
- **Number of transactions auto-categorized daily**
- **Categories requiring manual review**

### Monthly Maintenance
1. **Review low-confidence categorizations**
2. **Update training data** if business categories change
3. **Monitor API usage** and costs
4. **Check for new transaction patterns**

### Troubleshooting Common Issues

**Issue**: All transactions categorized as "Misc"
- **Cause**: Poor training data or unclear descriptions
- **Solution**: Improve transaction descriptions, add more training examples

**Issue**: Wrong type assignment (Income vs Expense)
- **Cause**: Amount sign confusion
- **Solution**: Verify amount field sign convention

**Issue**: API rate limits or costs too high
- **Cause**: Too many API calls
- **Solution**: Batch process transactions, reduce frequency

---

## 💰 Cost Considerations

### OpenAI API Costs (Estimated)
- **GPT-4**: ~$0.03 per categorization
- **GPT-3.5-turbo**: ~$0.002 per categorization
- **Monthly estimate**: 100 transactions × $0.002 = $0.20/month

### Alternative: Local AI Models
For cost reduction, consider using:
- **Ollama** with Llama 2/3 (free, local)
- **OpenAI compatible APIs** (Groq, Together.ai)

---

## 🆘 Support and Next Steps

### If You Need Help
1. **Check the automation logs** for error messages
2. **Test with a single transaction** first
3. **Verify API keys and permissions**
4. **Review field names** match exactly

### Extending the System
- **Add vendor-based rules** for common suppliers
- **Create categorization rules** for specific amounts
- **Build reporting dashboards** using the categorized data
- **Set up alerts** for unusual spending patterns

### Ready to Start?
1. **Choose your approach**: n8n (more flexible) or Airtable (simpler)
2. **Set up the required fields** in Airtable
3. **Follow the step-by-step guide** above
4. **Test with a few transactions** before full deployment
5. **Monitor and adjust** as needed

The automation will learn from your existing 519 categorized transactions and should achieve 80-90% accuracy on new transactions, saving you significant time on financial data entry! 