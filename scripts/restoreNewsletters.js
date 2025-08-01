import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Newsletter feed configurations
const newsletterFeeds = [
  'Varsity Newsletter',
  'The Chatter',
  'Daily Brief',
  'After Market Report',
  'What The Hell Is Happening'
];

async function restoreNewsletters() {
  console.log('🔍 Checking for missing newsletters...\n');
  
  // Load current content
  const contentPath = join(__dirname, '..', 'src', 'data', 'content.json');
  let currentContent = [];
  
  try {
    currentContent = JSON.parse(readFileSync(contentPath, 'utf8'));
    console.log(`📊 Current content: ${currentContent.length} total items`);
  } catch (error) {
    console.error('❌ Failed to load current content:', error.message);
    return;
  }
  
  // Count newsletters by source
  const newsletterCounts = {};
  newsletterFeeds.forEach(feed => {
    newsletterCounts[feed] = currentContent.filter(item => 
      item.source === feed && item.type === 'newsletter'
    ).length;
  });
  
  console.log('\n📈 Newsletter counts:');
  Object.entries(newsletterCounts).forEach(([source, count]) => {
    console.log(`  ${source}: ${count} items`);
  });
  
  // Check backups directory
  const backupsDir = join(__dirname, '..', 'backups');
  if (!existsSync(backupsDir)) {
    console.log('\n⚠️  No backups directory found');
    return;
  }
  
  // Try to restore from backup
  const backupPath = join(__dirname, '..', 'scripts', 'fetchFeeds.js.backup');
  if (existsSync(backupPath)) {
    console.log('\n📦 Found backup file, checking for missing newsletters...');
    
    try {
      // You could implement logic here to parse the backup and restore missing items
      console.log('✅ Backup file exists at:', backupPath);
    } catch (error) {
      console.error('❌ Failed to process backup:', error.message);
    }
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalContent: currentContent.length,
    newsletterCounts,
    missingFeeds: Object.entries(newsletterCounts)
      .filter(([_, count]) => count < 10)
      .map(([source, count]) => ({ source, count }))
  };
  
  const reportPath = join(__dirname, '..', 'logs', 'newsletter-check.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run the check
restoreNewsletters().catch(console.error);