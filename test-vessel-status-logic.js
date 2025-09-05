// Test script to demonstrate the "most recent checklist" logic
// Run this to see exactly how vessel status is determined

const { getVesselMaintenanceStatus } = require('./api/vessel-status');

async function demonstrateStatusLogic() {
    console.log('=== Vessel Status Logic Demonstration ===\n');
    console.log('This shows how we determine current vessel status');
    console.log('by using the MOST RECENT checklist (pre or post departure)\n');
    
    const result = await getVesselMaintenanceStatus();
    
    if (!result.success) {
        console.error('Failed to fetch status:', result.error);
        return;
    }
    
    console.log(`Found ${result.vessels.length} vessels\n`);
    
    // Show detailed logic for each vessel
    result.vessels.forEach(vessel => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🚢 ${vessel.name} (${vessel.type})`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        if (!vessel.currentStatus) {
            console.log('❌ No checklist data available\n');
            return;
        }
        
        // Show which checklist we're using
        console.log(`📋 Using: ${vessel.lastCheck.type} checklist`);
        console.log(`📅 Date: ${new Date(vessel.lastCheck.time).toLocaleString()}`);
        console.log(`⏱️  Age: ${vessel.lastCheck.daysSince} days ago\n`);
        
        // Show current levels
        console.log('Current Status:');
        console.log(`  ⛽ Fuel:  ${vessel.currentStatus.fuel.level} (${vessel.currentStatus.fuel.percentage}%)`);
        console.log(`  🔥 Gas:   ${vessel.currentStatus.gas.level} (${vessel.currentStatus.gas.percentage}%)`);
        console.log(`  💧 Water: ${vessel.currentStatus.water.level} (${vessel.currentStatus.water.percentage}%)`);
        console.log(`  🔧 Condition: ${vessel.currentStatus.condition}\n`);
        
        // Show alerts
        if (vessel.alerts.length > 0) {
            console.log('⚠️  Alerts:');
            vessel.alerts.forEach(alert => {
                const icon = alert.type === 'critical' ? '🚨' : '⚠️';
                console.log(`  ${icon} ${alert.message}`);
            });
            console.log('');
        }
        
        // Show recent checklist history
        console.log('Recent Checklist History:');
        
        if (vessel.recentChecklists.preDeparture.length > 0) {
            console.log('  Pre-Departure:');
            vessel.recentChecklists.preDeparture.slice(0, 3).forEach(check => {
                const date = new Date(check.date).toLocaleDateString();
                console.log(`    • ${date}: Fuel=${check.fuel}, Gas=${check.gas}, Water=${check.water}`);
            });
        }
        
        if (vessel.recentChecklists.postDeparture.length > 0) {
            console.log('  Post-Departure:');
            vessel.recentChecklists.postDeparture.slice(0, 3).forEach(check => {
                const date = new Date(check.date).toLocaleDateString();
                console.log(`    • ${date}: Fuel=${check.fuel}, Gas=${check.gas}, Water=${check.water}`);
            });
        }
        
        console.log('');
    });
    
    // Show summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Fleet Summary:');
    console.log(`   Total Vessels: ${result.summary.total}`);
    console.log(`   ✅ Ready: ${result.summary.ready}`);
    console.log(`   ⚠️  Warning: ${result.summary.warning}`);
    console.log(`   🚨 Critical: ${result.summary.critical}`);
    console.log(`   ❓ Unknown: ${result.summary.unknown}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the demonstration
demonstrateStatusLogic().catch(console.error);
