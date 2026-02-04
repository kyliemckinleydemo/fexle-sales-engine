/**
 * @module scripts/migration-helper
 * @description Browser console script to export localStorage data for Supabase migration
 *
 * PURPOSE:
 * - Export all localStorage data to a JSON file
 * - Provide data summary and statistics
 * - Guide users through the migration process
 *
 * EXPORTS:
 * - Self-executing function that downloads export file
 *
 * PATTERNS:
 * - Run directly in browser console
 * - Creates timestamped JSON backup file
 * - Returns export data object for inspection
 *
 * CLAUDE NOTES:
 * - Must be run while app is in Single User mode
 * - Downloads file automatically to user's downloads folder
 * - Works with any browser that supports Blob and download
 *
 * USAGE:
 * Run this in your browser console while in Single User mode
 * to export all your data for migration to Supabase.
 *
 * Usage:
 * 1. Open the app in Single User mode
 * 2. Open browser DevTools (F12)
 * 3. Copy and paste this entire script into the Console
 * 4. Press Enter to run
 * 5. Check your downloads folder for the export file
 */

(function() {
  console.log('🚀 Sales Engine Migration Helper');
  console.log('================================\n');

  // Gather all localStorage data
  const mainData = JSON.parse(localStorage.getItem('fexleSalesEngine') || '{}');
  const customScripts = JSON.parse(localStorage.getItem('customScripts') || '{}');

  // Create export object
  const exportData = {
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    appVersion: '2.1.0',
    source: 'localStorage',

    // Main application data
    leads: mainData.leads || [],
    tasks: mainData.tasks || [],
    meetings: mainData.meetings || [],
    calls: mainData.calls || [],

    // Custom playbooks
    customScripts: customScripts,

    // Settings (for reference, not imported)
    settings: {
      mode: localStorage.getItem('outboundSalesEngineMode'),
      onboardingComplete: localStorage.getItem('onboardingComplete'),
      milestonesExpanded: localStorage.getItem('milestonesExpanded'),
      hasSeenOnboarding: localStorage.getItem('hasSeenOnboarding')
    },

    // Summary statistics
    stats: {
      leadsCount: (mainData.leads || []).length,
      tasksCount: (mainData.tasks || []).length,
      meetingsCount: (mainData.meetings || []).length,
      callsCount: (mainData.calls || []).length,
      customScriptsCount: Object.keys(customScripts || {}).length
    }
  };

  // Display summary
  console.log('📊 Export Summary:');
  console.log(`   Leads: ${exportData.stats.leadsCount}`);
  console.log(`   Tasks: ${exportData.stats.tasksCount}`);
  console.log(`   Meetings: ${exportData.stats.meetingsCount}`);
  console.log(`   Call Logs: ${exportData.stats.callsCount}`);
  console.log(`   Custom Playbooks: ${exportData.stats.customScriptsCount}`);
  console.log('');

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `sales-engine-export-${dateStr}.json`;

  // Download the file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`✅ Export saved to: ${filename}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Set up Supabase (see docs/SETUP.md)');
  console.log('   2. Create your account in the app');
  console.log('   3. Import your data (see docs/MIGRATION.md)');
  console.log('');
  console.log('💡 Tip: Keep this export file as a backup!');

  // Also return the data for inspection
  return exportData;
})();
