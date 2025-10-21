#!/usr/bin/env node

// Analyze recent Railway logs for patterns, errors, and performance metrics
// Focuses on the booking reminder system post-fix deployment

const fs = require('fs').promises;
const path = require('path');

class LogAnalyzer {
    constructor() {
        this.patterns = {
            schedulerStart: /📅 Booking reminder scheduler fixed version started/,
            reminderCheck: /⏰ Running booking reminder check/,
            onboardingSent: /✅ Time matches! Sending onboarding reminder/,
            deloadingSent: /✅ Time matches! Sending deloading reminder/,
            smsSent: /📤 Sent (onboarding|deloading) reminder to/,
            messageSID: /Message SID: (SM[a-zA-Z0-9]+)/,
            airtableUpdate: /✅ Successfully updated Airtable/,
            alreadySent: /(Onboarding|Deloading) reminder already sent at/,
            error: /Error|ERROR|Failed|failed|TypeError/i,
            duplicate: /duplicate|multiple.*same/i,
            timeCheck: /⏰ Time check for (onboarding|deloading) reminder:/,
            willSend: /Will send: (true|false)/
        };
        
        this.stats = {
            totalLines: 0,
            schedulerStarts: 0,
            reminderChecks: 0,
            onboardingAttempts: 0,
            deloadingAttempts: 0,
            smsSuccesses: 0,
            airtableUpdates: 0,
            duplicatesPrevented: 0,
            errors: [],
            messageSIDs: new Set(),
            timeChecks: [],
            performanceMetrics: {
                checkIntervals: [],
                processingTimes: []
            }
        };
    }

    async analyzeLogFile(filePath) {
        try {
            console.log(`\n📄 Analyzing: ${path.basename(filePath)}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            
            let lastCheckTime = null;
            let currentBooking = null;
            
            for (const line of lines) {
                this.stats.totalLines++;
                
                // Check for scheduler starts
                if (this.patterns.schedulerStart.test(line)) {
                    this.stats.schedulerStarts++;
                    this.extractTimestamp(line);
                }
                
                // Check for reminder checks
                if (this.patterns.reminderCheck.test(line)) {
                    this.stats.reminderChecks++;
                    const timestamp = this.extractTimestamp(line);
                    if (lastCheckTime) {
                        const interval = timestamp - lastCheckTime;
                        this.stats.performanceMetrics.checkIntervals.push(interval);
                    }
                    lastCheckTime = timestamp;
                }
                
                // Check for time checks
                if (this.patterns.timeCheck.test(line)) {
                    const match = line.match(this.patterns.timeCheck);
                    currentBooking = { type: match[1] };
                }
                
                // Check for will send status
                if (this.patterns.willSend.test(line) && currentBooking) {
                    const match = line.match(this.patterns.willSend);
                    currentBooking.willSend = match[1] === 'true';
                    this.stats.timeChecks.push({ ...currentBooking });
                }
                
                // Check for onboarding attempts
                if (this.patterns.onboardingSent.test(line)) {
                    this.stats.onboardingAttempts++;
                }
                
                // Check for deloading attempts
                if (this.patterns.deloadingSent.test(line)) {
                    this.stats.deloadingAttempts++;
                }
                
                // Check for SMS successes
                if (this.patterns.smsSent.test(line)) {
                    this.stats.smsSuccesses++;
                }
                
                // Check for Message SIDs
                const sidMatch = line.match(this.patterns.messageSID);
                if (sidMatch) {
                    this.stats.messageSIDs.add(sidMatch[1]);
                }
                
                // Check for Airtable updates
                if (this.patterns.airtableUpdate.test(line)) {
                    this.stats.airtableUpdates++;
                }
                
                // Check for already sent (duplicate prevention)
                if (this.patterns.alreadySent.test(line)) {
                    this.stats.duplicatesPrevented++;
                }
                
                // Check for errors
                if (this.patterns.error.test(line)) {
                    this.stats.errors.push({
                        line: line.substring(0, 200),
                        timestamp: this.extractTimestamp(line)
                    });
                }
            }
            
            return true;
            
        } catch (error) {
            console.error(`   ❌ Error reading file: ${error.message}`);
            return false;
        }
    }

    extractTimestamp(line) {
        // Try to extract timestamp from log line
        const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (timestampMatch) {
            return new Date(timestampMatch[1]);
        }
        return null;
    }

    generateReport() {
        console.log('\n📊 Log Analysis Report');
        console.log('=' .repeat(60));
        
        console.log('\n🔢 Summary Statistics:');
        console.log(`   Total lines analyzed: ${this.stats.totalLines.toLocaleString()}`);
        console.log(`   Scheduler starts: ${this.stats.schedulerStarts}`);
        console.log(`   Reminder checks: ${this.stats.reminderChecks}`);
        console.log(`   Unique Message SIDs: ${this.stats.messageSIDs.size}`);
        
        console.log('\n📱 SMS Activity:');
        console.log(`   Onboarding attempts: ${this.stats.onboardingAttempts}`);
        console.log(`   Deloading attempts: ${this.stats.deloadingAttempts}`);
        console.log(`   SMS successfully sent: ${this.stats.smsSuccesses}`);
        console.log(`   Airtable updates: ${this.stats.airtableUpdates}`);
        
        console.log('\n🛡️ Duplicate Prevention:');
        console.log(`   Duplicates prevented: ${this.stats.duplicatesPrevented}`);
        const preventionRate = this.stats.duplicatesPrevented > 0 
            ? (this.stats.duplicatesPrevented / (this.stats.duplicatesPrevented + this.stats.smsSuccesses) * 100).toFixed(1)
            : 0;
        console.log(`   Prevention effectiveness: ${preventionRate}%`);
        
        console.log('\n⚡ Performance Metrics:');
        if (this.stats.performanceMetrics.checkIntervals.length > 0) {
            const avgInterval = this.stats.performanceMetrics.checkIntervals.reduce((a, b) => a + b, 0) 
                / this.stats.performanceMetrics.checkIntervals.length / 1000 / 60;
            console.log(`   Average check interval: ${avgInterval.toFixed(1)} minutes`);
        }
        
        console.log('\n❌ Errors Found:');
        if (this.stats.errors.length === 0) {
            console.log('   ✅ No errors detected!');
        } else {
            console.log(`   Total errors: ${this.stats.errors.length}`);
            // Show first 5 errors
            this.stats.errors.slice(0, 5).forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.line}`);
            });
            if (this.stats.errors.length > 5) {
                console.log(`   ... and ${this.stats.errors.length - 5} more`);
            }
        }
        
        console.log('\n🎯 Key Insights:');
        
        // Check for successful fix implementation
        if (this.stats.schedulerStarts > 0 && this.stats.errors.filter(e => e.line.includes('TypeError')).length === 0) {
            console.log('   ✅ Fixed scheduler is running without TypeError issues');
        }
        
        if (this.stats.duplicatesPrevented > 0) {
            console.log('   ✅ Airtable persistence is successfully preventing duplicates');
        }
        
        if (this.stats.messageSIDs.size === this.stats.smsSuccesses) {
            console.log('   ✅ All SMS have unique Message SIDs (no duplicates at Twilio level)');
        }
        
        // Calculate success rate
        const totalAttempts = this.stats.onboardingAttempts + this.stats.deloadingAttempts;
        if (totalAttempts > 0) {
            const successRate = (this.stats.smsSuccesses / totalAttempts * 100).toFixed(1);
            console.log(`   📊 Overall SMS success rate: ${successRate}%`);
        }
    }

    async analyzeDirectory(dirPath) {
        console.log(`🔍 Analyzing logs in: ${dirPath}`);
        
        try {
            const files = await fs.readdir(dirPath);
            const logFiles = files.filter(f => f.startsWith('logs.') && f.endsWith('.json'));
            
            console.log(`Found ${logFiles.length} log files to analyze`);
            
            for (const file of logFiles.sort()) {
                await this.analyzeLogFile(path.join(dirPath, file));
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error analyzing directory:', error.message);
        }
    }
}

// Main execution
async function main() {
    const analyzer = new LogAnalyzer();
    
    // Check multiple log locations
    const logDirs = [
        path.join(__dirname, '..', 'docs', '02-features', 'sms'),
        path.join(__dirname, '..')
    ];
    
    for (const dir of logDirs) {
        await analyzer.analyzeDirectory(dir);
    }
    
    console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
