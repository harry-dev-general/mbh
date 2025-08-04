#!/usr/bin/env node

/**
 * Migration script to help update HTML files to use the API proxy
 * instead of hardcoded Airtable API keys
 * 
 * Usage: node scripts/migrate-api-keys.js
 */

const fs = require('fs');
const path = require('path');

const TRAINING_DIR = path.join(__dirname, '..', 'training');

// Patterns to find and replace
const patterns = [
    {
        name: 'Airtable API Key Declaration',
        find: /const AIRTABLE_API_KEY = ['"`]pat[^'"`]+['"`];?\s*/g,
        replace: '// Airtable API key now handled server-side\n'
    },
    {
        name: 'Airtable Fetch Calls',
        find: /fetch\s*\(\s*[`'"]https:\/\/api\.airtable\.com\/v0\/([^'"`]+)[`'"],\s*{\s*headers:\s*{\s*['"]Authorization['"]\s*:\s*[`'"]Bearer \$\{AIRTABLE_API_KEY\}[`'"]/g,
        replace: 'MBHConfig.airtableFetch(\'$1\', {\n        // Authorization header added server-side'
    },
    {
        name: 'Direct Airtable URL References',
        find: /https:\/\/api\.airtable\.com\/v0\//g,
        replace: '/api/airtable/'
    }
];

// Files to process
const htmlFiles = fs.readdirSync(TRAINING_DIR)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(TRAINING_DIR, file));

console.log(`Found ${htmlFiles.length} HTML files to process\n`);

// Process each file
htmlFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    console.log(`Processing: ${fileName}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = false;
    
    patterns.forEach(pattern => {
        const matches = content.match(pattern.find);
        if (matches) {
            console.log(`  ✓ Found ${matches.length} instances of "${pattern.name}"`);
            content = content.replace(pattern.find, pattern.replace);
            changesMade = true;
        }
    });
    
    // Check if config.js is included
    if (changesMade && !content.includes('/js/config.js')) {
        // Add config.js script tag before closing head tag
        content = content.replace('</head>', '    <script src="/js/config.js"></script>\n</head>');
        console.log('  ✓ Added config.js script tag');
    }
    
    if (changesMade) {
        // Create backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`  ✓ Created backup: ${fileName}.backup`);
        
        // Write updated content
        fs.writeFileSync(filePath, content);
        console.log(`  ✓ Updated ${fileName}\n`);
    } else {
        console.log(`  - No changes needed\n`);
    }
});

console.log('\nMigration Summary:');
console.log('1. Backup files created with .backup extension');
console.log('2. Review the changes and test thoroughly');
console.log('3. Remember to update any custom API calls not caught by this script');
console.log('\nIMPORTANT: This script makes basic replacements. Manual review is recommended!');