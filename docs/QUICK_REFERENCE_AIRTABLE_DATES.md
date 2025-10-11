# Quick Reference: Airtable Date Filtering

## ❌ DON'T Use filterByFormula for Dates
```javascript
// This is UNRELIABLE - Don't use!
const filter = `AND(IS_AFTER({Date}, '${start}'), IS_BEFORE({Date}, '${end}'))`;
```

## ✅ DO Use Client-Side Filtering
```javascript
// 1. Fetch ALL records (with pagination)
let allRecords = [];
let offset = null;
do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    const data = await response.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
} while (offset);

// 2. Filter in JavaScript
const filtered = allRecords.filter(record => {
    const dateStr = formatLocalDate(new Date(record.fields['Date'] + 'T00:00:00'));
    return dateStr >= startStr && dateStr <= endStr;
});
```

## Why?
- Airtable's filterByFormula has known date comparison issues
- Production migrated to client-side filtering in January 2025
- Client-side filtering is reliable and consistent

## Remember
1. Always implement pagination
2. Add 'T00:00:00' when parsing dates
3. Use YYYY-MM-DD format for comparisons
4. Don't use Cache-Control headers (CORS blocked)
