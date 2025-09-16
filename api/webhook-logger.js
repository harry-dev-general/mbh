// Simple webhook logger endpoint for debugging
// Add this to your MBH Staff Portal API routes

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Webhook logging endpoint
router.post('/webhook-logger', async (req, res) => {
    try {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, '../logs');
        try {
            await fs.mkdir(logsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        // Generate timestamp for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logsDir, `webhook-${timestamp}.json`);

        // Prepare log data
        const logData = {
            timestamp: new Date().toISOString(),
            headers: req.headers,
            body: req.body,
            query: req.query,
            method: req.method,
            url: req.url,
            // Pretty print for readability
            bodyFormatted: JSON.stringify(req.body, null, 2)
        };

        // Write to file
        await fs.writeFile(logFile, JSON.stringify(logData, null, 2));

        // Also log to console
        console.log('\n=== WEBHOOK RECEIVED ===');
        console.log('Timestamp:', logData.timestamp);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Saved to:', logFile);
        console.log('=======================\n');

        // Send success response
        res.json({
            success: true,
            message: 'Webhook logged successfully',
            logFile: logFile,
            timestamp: logData.timestamp
        });

    } catch (error) {
        console.error('Error logging webhook:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET endpoint to retrieve logs
router.get('/webhook-logs', async (req, res) => {
    try {
        const logsDir = path.join(__dirname, '../logs');
        
        // Read all log files
        const files = await fs.readdir(logsDir);
        const webhookFiles = files.filter(f => f.startsWith('webhook-') && f.endsWith('.json'));
        
        // Sort by newest first
        webhookFiles.sort().reverse();
        
        // Get the latest log or all logs based on query param
        const getAll = req.query.all === 'true';
        const filesToRead = getAll ? webhookFiles : webhookFiles.slice(0, 1);
        
        const logs = [];
        for (const file of filesToRead) {
            const content = await fs.readFile(path.join(logsDir, file), 'utf8');
            logs.push({
                filename: file,
                data: JSON.parse(content)
            });
        }
        
        res.json({
            success: true,
            count: logs.length,
            logs: logs
        });
        
    } catch (error) {
        console.error('Error reading logs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
