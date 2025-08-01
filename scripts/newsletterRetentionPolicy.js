import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Retention policies by content type
const RETENTION_POLICIES = {
  newsletter: {
    days: 365,  // 1 year for newsletters
    minItems: 20, // Always keep at least 20 items per newsletter source
    description: 'Newsletters are retained for 1 year or minimum 20 items'
  },
  video: {
    days: 90,   // 3 months for videos
    minItems: 15,
    description: 'Videos are retained for 90 days or minimum 15 items'
  },
  podcast: {
    days: 180,  // 6 months for podcasts
    minItems: 20,
    description: 'Podcasts are retained for 6 months or minimum 20 items'
  },
  blog: {
    days: 180,  // 6 months for blogs
    minItems: 15,
    description: 'Blog posts are retained for 6 months or minimum 15 items'
  }
};

export function applyRetentionPolicy(content) {
  const now = new Date();
  const retainedContent = [];
  const removalStats = {};
  
  // Group content by source and type
  const contentBySource = {};
  content.forEach(item => {
    const key = `${item.source}-${item.type}`;
    if (!contentBySource[key]) {
      contentBySource[key] = [];
    }
    contentBySource[key].push(item);
  });
  
  // Apply retention policy to each group
  Object.entries(contentBySource).forEach(([key, items]) => {
    const [source, type] = key.split('-').slice(0, -1).join('-') + '-' + key.split('-').slice(-1);
    const policy = RETENTION_POLICIES[type] || RETENTION_POLICIES.blog;
    
    // Sort by date (newest first)
    items.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    
    // Keep minimum items regardless of age
    const keepItems = items.slice(0, policy.minItems);
    
    // Check remaining items against date policy
    const remainingItems = items.slice(policy.minItems);
    const cutoffDate = new Date(now.getTime() - policy.days * 24 * 60 * 60 * 1000);
    
    remainingItems.forEach(item => {
      if (new Date(item.publishDate) > cutoffDate) {
        keepItems.push(item);
      } else {
        // Track removals
        if (!removalStats[source]) {
          removalStats[source] = 0;
        }
        removalStats[source]++;
      }
    });
    
    retainedContent.push(...keepItems);
  });
  
  return {
    content: retainedContent,
    stats: {
      original: content.length,
      retained: retainedContent.length,
      removed: content.length - retainedContent.length,
      removalsBySource: removalStats
    }
  };
}

// Analyze current retention status
export function analyzeRetention() {
  const contentPath = join(__dirname, '..', 'src', 'data', 'content.json');
  
  try {
    const content = JSON.parse(readFileSync(contentPath, 'utf8'));
    console.log('📊 Content Retention Analysis\n');
    console.log(`Total items: ${content.length}`);
    
    // Group by type and source
    const stats = {};
    content.forEach(item => {
      if (!stats[item.type]) {
        stats[item.type] = {};
      }
      if (!stats[item.type][item.source]) {
        stats[item.type][item.source] = {
          count: 0,
          oldest: null,
          newest: null
        };
      }
      
      const sourceStats = stats[item.type][item.source];
      sourceStats.count++;
      
      const itemDate = new Date(item.publishDate);
      if (!sourceStats.oldest || itemDate < sourceStats.oldest) {
        sourceStats.oldest = itemDate;
      }
      if (!sourceStats.newest || itemDate > sourceStats.newest) {
        sourceStats.newest = itemDate;
      }
    });
    
    // Display analysis
    Object.entries(RETENTION_POLICIES).forEach(([type, policy]) => {
      console.log(`\n📌 ${type.toUpperCase()} (${policy.description})`);
      
      if (stats[type]) {
        Object.entries(stats[type]).forEach(([source, sourceStats]) => {
          const ageInDays = Math.floor((new Date() - sourceStats.oldest) / (1000 * 60 * 60 * 24));
          console.log(`  ${source}:`);
          console.log(`    - Items: ${sourceStats.count}`);
          console.log(`    - Oldest: ${sourceStats.oldest.toLocaleDateString()} (${ageInDays} days ago)`);
          console.log(`    - Newest: ${sourceStats.newest.toLocaleDateString()}`);
          
          if (ageInDays > policy.days && sourceStats.count > policy.minItems) {
            console.log(`    ⚠️  Has content older than ${policy.days} days`);
          }
        });
      } else {
        console.log(`  No ${type} content found`);
      }
    });
    
    // Test retention policy
    console.log('\n🧪 Testing retention policy...');
    const result = applyRetentionPolicy(content);
    console.log(`\nWould retain: ${result.stats.retained} items`);
    console.log(`Would remove: ${result.stats.removed} items`);
    
    if (Object.keys(result.stats.removalsBySource).length > 0) {
      console.log('\nRemovals by source:');
      Object.entries(result.stats.removalsBySource).forEach(([source, count]) => {
        console.log(`  ${source}: ${count} items`);
      });
    }
    
  } catch (error) {
    console.error('Failed to analyze retention:', error.message);
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeRetention();
}