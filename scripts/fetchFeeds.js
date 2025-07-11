import Parser from 'rss-parser';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail'],
      ['yt:videoId', 'videoId'],
      ['itunes:duration', 'itunesDuration'],
      ['enclosure', 'enclosure']
    ]
  },
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

const feedConfigs = [
  {
    name: 'Zero1',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCUUlw3anBIkbW9W44Y-eURw',
    type: 'video',
    category: 'YouTube'
  },
  {
    name: 'Varsity',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCQXwgooTlP6tk2a-u6vgyUA',
    type: 'video',
    category: 'YouTube'
  },
  {
    name: 'Markets',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXbKJML9pVclFHLFzpvBgWw',
    type: 'video',
    category: 'YouTube'
  },
  {
    name: 'Zerodha',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC59YUBhNLMkS2Q8NBWBGHAA',
    type: 'video',
    category: 'YouTube'
  },
  {
    name: 'The Daily Brief Podcast',
    url: 'https://feeds.simplecast.com/1H1JSMd0',
    type: 'podcast',
    category: 'Podcast'
  },
  {
    name: 'Side Notes by Zerodha Varsity',
    url: 'https://feeds.simplecast.com/HusrooqN',
    type: 'podcast',
    category: 'Podcast'
  },
  {
    name: 'Investing in India',
    url: 'https://feeds.simplecast.com/1ANGOSmm',
    type: 'podcast',
    category: 'Podcast'
  },
  {
    name: 'Varsity Newsletter',
    url: 'https://zerodhavarsity.substack.com/feed',
    type: 'newsletter',
    category: 'Newsletter'
  },
  {
    name: 'The Chatter',
    url: 'https://thechatterbyzerodha.substack.com/feed',
    type: 'newsletter',
    category: 'Newsletter'
  },
  {
    name: 'Daily Brief',
    url: 'https://thedailybrief.zerodha.com/feed',
    type: 'newsletter',
    category: 'Newsletter'
  },
  {
    name: 'After Market Report',
    url: 'https://aftermarketreport.substack.com/feed',
    type: 'newsletter',
    category: 'Newsletter'
  },
  {
    name: 'What The Hell Is Happening',
    url: 'https://whatthehellishappening.substack.com/feed',
    type: 'newsletter',
    category: 'Newsletter'
  },
  {
    name: 'Z-Connect Blog',
    url: 'https://zerodha.com/z-connect/feed',
    type: 'blog',
    category: 'Blog'
  },
  {
    name: 'Varsity Blog',
    url: 'https://zerodha.com/varsity/feed/',
    type: 'blog',
    category: 'Blog'
  }
];

function extractYouTubeId(item) {
  if (item.videoId) return item.videoId;
  
  const urlMatch = item.link?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  return urlMatch ? urlMatch[1] : null;
}

function isYouTubeShort(url) {
  return url && url.includes('youtube.com/shorts/');
}

function parseDuration(duration) {
  if (!duration) return null;
  
  // Handle iTunes duration format (seconds)
  if (!isNaN(duration)) {
    const totalSeconds = parseInt(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Handle HH:MM:SS format
  if (duration.includes(':')) {
    return duration;
  }
  
  return null;
}

function estimateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

function isNewContent(date) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return new Date(date) > oneWeekAgo;
}

function extractKeywords(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were']);
  
  const words = text.match(/\b\w+\b/g) || [];
  const keywords = words
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10);
  
  return [...new Set(keywords)];
}

async function fetchAllFeeds() {
  const allContent = [];
  
  for (const config of feedConfigs) {
    try {
      console.log(`Fetching ${config.name}...`);
      // Add cache-busting parameter for better freshness
      const urlWithCacheBust = config.url + (config.url.includes('?') ? '&' : '?') + `v=${Date.now()}`;
      const feed = await parser.parseURL(urlWithCacheBust);
      
      console.log(`  📊 Feed contains ${feed.items.length} total items`);
      const items = feed.items.slice(0, 50).map(item => {
        const publishDate = new Date(item.pubDate || item.isoDate);
        
        return {
          id: `${config.name}-${item.guid || item.link}`.replace(/[^a-zA-Z0-9]/g, '-'),
          title: item.title,
          description: item.contentSnippet || item.description || '',
          url: item.link,
          publishDate: publishDate.toISOString(),
          type: config.type,
          source: config.name,
          author: item.creator || item['dc:creator'] || config.name,
          duration: config.type === 'video' || config.type === 'podcast' 
            ? parseDuration(item.itunesDuration) 
            : null,
          readingTime: config.type === 'newsletter' 
            ? estimateReadingTime(item.content || item.description || '') 
            : null,
          thumbnail: item['media:thumbnail']?.url || item.enclosure?.url || null,
          keywords: extractKeywords(item.title, item.description || ''),
          categories: item.categories || [],
          isNew: isNewContent(publishDate),
          isShort: config.type === 'video' ? isYouTubeShort(item.link) : false,
          embedId: config.type === 'video' ? extractYouTubeId(item) : null,
          viewCount: null // Would need YouTube API for actual view counts
        };
      });
      
      allContent.push(...items);
      console.log(`✓ Fetched ${items.length} items from ${config.name}`);
    } catch (error) {
      console.error(`✗ Error fetching ${config.name}:`, error.message);
    }
  }
  
  // Sort by publish date (newest first)
  allContent.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  
  // Save to JSON file
  const outputPath = join(__dirname, '..', 'src', 'data', 'content.json');
  writeFileSync(outputPath, JSON.stringify(allContent, null, 2));
  
  // Also save to public folder for archive page
  const publicPath = join(__dirname, '..', 'public', 'content.json');
  writeFileSync(publicPath, JSON.stringify(allContent, null, 2));
  
  console.log(`\n✓ Total content items: ${allContent.length}`);
  console.log(`✓ Saved to: ${outputPath}`);
  console.log(`✓ Also saved to: ${publicPath}`);
  
  // Generate stats
  const stats = {
    totalContent: allContent.length,
    thisWeek: allContent.filter(item => isNewContent(item.publishDate)).length,
    contentTypes: {
      videos: allContent.filter(item => item.type === 'video').length,
      podcasts: allContent.filter(item => item.type === 'podcast').length,
      newsletters: allContent.filter(item => item.type === 'newsletter').length,
      blogs: allContent.filter(item => item.type === 'blog').length
    },
    lastUpdated: new Date().toISOString()
  };
  
  const statsPath = join(__dirname, '..', 'src', 'data', 'stats.json');
  writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`✓ Stats saved to: ${statsPath}`);
}

// Run the script
fetchAllFeeds().catch(console.error);