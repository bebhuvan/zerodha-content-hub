import Parser from 'rss-parser';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration class for feed parsing
 */
class FeedConfig {
  static CONSTANTS = {
    // Content type specific limits
    MAX_VIDEO_ITEMS: 15,        // YouTube videos (recent content focus)
    MAX_PODCAST_ITEMS: 50,      // Podcasts (archive important)
    MAX_NEWSLETTER_ITEMS: 100,  // Newsletters (archive very important)
    MAX_BLOG_ITEMS: 50,         // Blog posts (good archive balance)
    
    // Fallback for unknown types
    MAX_ITEMS_PER_FEED: 50,
    
    // Processing constants
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE_MS: 3000, // Longer delays between retries
    RATE_LIMIT_DELAY_MS: 2000, // Increased delay to avoid rate limiting
    REQUEST_TIMEOUT_MS: 30000,
    FALLBACK_DAYS: 90, // Extended for better content preservation
    NEWSLETTER_RETENTION_DAYS: 365, // Keep newsletters for 1 year
    NEW_CONTENT_DAYS: 7,
    READING_WPM: 200,
    MAX_KEYWORDS: 10,
    MIN_KEYWORD_LENGTH: 3,
    PARALLEL_FETCH_LIMIT: 5
  };

  static USER_AGENTS = [
    // More diverse and recent user agents to avoid detection
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
  ];

  /**
   * Get the appropriate item limit for a content type
   */
  static getItemLimit(contentType) {
    switch (contentType) {
      case 'video':
        return this.CONSTANTS.MAX_VIDEO_ITEMS;
      case 'podcast':
        return this.CONSTANTS.MAX_PODCAST_ITEMS;
      case 'newsletter':
        return this.CONSTANTS.MAX_NEWSLETTER_ITEMS;
      case 'blog':
        return this.CONSTANTS.MAX_BLOG_ITEMS;
      default:
        return this.CONSTANTS.MAX_ITEMS_PER_FEED;
    }
  }

  static FEED_CONFIGS = [
    { name: 'Zero1', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCUUlw3anBIkbW9W44Y-eURw', type: 'video', category: 'YouTube' },
    { name: 'Varsity', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCQXwgooTlP6tk2a-u6vgyUA', type: 'video', category: 'YouTube' },
    { name: 'Markets', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXbKJML9pVclFHLFzpvBgWw', type: 'video', category: 'YouTube' },
    { name: 'Zerodha', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC59YUBhNLMkS2Q8NBWBGHAA', type: 'video', category: 'YouTube' },
    { name: 'The Daily Brief Podcast', url: 'https://feeds.simplecast.com/1H1JSMd0', type: 'podcast', category: 'Podcast' },
    { name: 'Side Notes by Zerodha Varsity', url: 'https://feeds.simplecast.com/HusrooqN', type: 'podcast', category: 'Podcast' },
    { name: 'Investing in India', url: 'https://feeds.simplecast.com/1ANGOSmm', type: 'podcast', category: 'Podcast' },
    { name: 'Varsity Newsletter', url: 'https://zerodhavarsity.substack.com/feed', type: 'newsletter', category: 'Newsletter' },
    { name: 'The Chatter', url: 'https://thechatterbyzerodha.substack.com/feed', type: 'newsletter', category: 'Newsletter' },
    { name: 'Daily Brief', url: 'https://thedailybrief.zerodha.com/feed', type: 'newsletter', category: 'Newsletter' },
    { name: 'After Market Report', url: 'https://aftermarketreport.substack.com/feed', type: 'newsletter', category: 'Newsletter' },
    { name: 'What The Hell Is Happening', url: 'https://whatthehellishappening.substack.com/feed', type: 'newsletter', category: 'Newsletter' },
    { name: 'Z-Connect Blog', url: 'https://zerodha.com/z-connect/feed', type: 'blog', category: 'Blog' },
    { name: 'Varsity Blog', url: 'https://zerodha.com/varsity/feed/', type: 'blog', category: 'Blog' }
  ];
}

/**
 * Logger utility class
 */
class Logger {
  static levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  static currentLevel = Logger.levels.INFO;

  static log(level, message, ...args) {
    if (level <= Logger.currentLevel) {
      const timestamp = new Date().toISOString();
      const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
      const prefix = `[${timestamp}] ${levelNames[level]}:`;
      console.log(prefix, message, ...args);
    }
  }

  static error(message, ...args) { Logger.log(Logger.levels.ERROR, message, ...args); }
  static warn(message, ...args) { Logger.log(Logger.levels.WARN, message, ...args); }
  static info(message, ...args) { Logger.log(Logger.levels.INFO, message, ...args); }
  static debug(message, ...args) { Logger.log(Logger.levels.DEBUG, message, ...args); }
}

/**
 * Content validation and transformation utilities
 */
class ContentValidator {
  static validateFeedItem(item, source) {
    const errors = [];
    
    if (!item.title?.trim()) errors.push('Missing title');
    if (!item.link?.trim()) errors.push('Missing link');
    if (!item.pubDate && !item.isoDate) errors.push('Missing publish date');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  static generateId(source, link) {
    return `${source}-${link}`.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 100);
  }
}

/**
 * Content processing utilities
 */
class ContentProcessor {
  static extractYouTubeId(item) {
    if (item.videoId) return item.videoId;
    
    const urlMatch = item.link?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  static isYouTubeShort(url) {
    return url && url.includes('youtube.com/shorts/');
  }

  static parseDuration(duration) {
    if (!duration) return null;
    
    if (!isNaN(duration)) {
      const totalSeconds = parseInt(duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (duration.includes(':')) {
      return duration;
    }
    
    return null;
  }

  static estimateReadingTime(content) {
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / FeedConfig.CONSTANTS.READING_WPM);
    return `${minutes} min read`;
  }

  static isNewContent(date) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FeedConfig.CONSTANTS.NEW_CONTENT_DAYS);
    return new Date(date) > cutoffDate;
  }

  static extractKeywords(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were']);
    
    const words = text.match(/\b\w+\b/g) || [];
    const keywords = words
      .filter(word => word.length > FeedConfig.CONSTANTS.MIN_KEYWORD_LENGTH && !commonWords.has(word))
      .slice(0, FeedConfig.CONSTANTS.MAX_KEYWORDS);
    
    return [...new Set(keywords)];
  }

  static transformFeedItem(item, config) {
    const validation = ContentValidator.validateFeedItem(item, config.name);
    if (!validation.isValid) {
      throw new Error(`Invalid feed item: ${validation.errors.join(', ')}`);
    }

    const publishDate = new Date(item.pubDate || item.isoDate);
    
    return {
      id: ContentValidator.generateId(config.name, item.link),
      title: ContentValidator.sanitizeText(item.title),
      description: ContentValidator.sanitizeText(item.contentSnippet || item.description || ''),
      url: item.link,
      publishDate: publishDate.toISOString(),
      type: config.type,
      source: config.name,
      author: ContentValidator.sanitizeText(item.creator || item['dc:creator'] || config.name),
      duration: config.type === 'video' || config.type === 'podcast' 
        ? ContentProcessor.parseDuration(item.itunesDuration) 
        : null,
      readingTime: config.type === 'newsletter' 
        ? ContentProcessor.estimateReadingTime(item.content || item.description || '') 
        : null,
      thumbnail: item['media:thumbnail']?.url || item.enclosure?.url || null,
      keywords: ContentProcessor.extractKeywords(item.title, item.description || ''),
      categories: item.categories || [],
      isNew: ContentProcessor.isNewContent(publishDate),
      isShort: config.type === 'video' ? ContentProcessor.isYouTubeShort(item.link) : false,
      embedId: config.type === 'video' ? ContentProcessor.extractYouTubeId(item) : null,
      viewCount: null
    };
  }
}

/**
 * Main feed fetcher class
 */
class FeedFetcher {
  constructor() {
    this.existingContent = [];
    this.loadExistingContent();
  }

  loadExistingContent() {
    try {
      const contentPath = join(__dirname, '..', 'src', 'data', 'content.json');
      if (existsSync(contentPath)) {
        this.existingContent = JSON.parse(readFileSync(contentPath, 'utf8'));
        Logger.info(`Loaded ${this.existingContent.length} existing content items for fallback`);
      }
    } catch (error) {
      Logger.warn('No existing content found for fallback:', error.message);
    }
  }

  createParser(userAgent) {
    return new Parser({
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
        'User-Agent': userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: FeedConfig.CONSTANTS.REQUEST_TIMEOUT_MS
    });
  }

  generateCacheBustUrl(url) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${timestamp}&r=${random}&bust=${Math.floor(timestamp/1000)}`;
  }

  async fetchFeedWithRetry(config, maxRetries = FeedConfig.CONSTANTS.MAX_RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const userAgent = FeedConfig.USER_AGENTS[attempt % FeedConfig.USER_AGENTS.length];
        const parser = this.createParser(userAgent);
        
        Logger.info(`Fetching ${config.name}... (attempt ${attempt + 1}/${maxRetries})`);
        if (attempt > 0) {
          Logger.debug(`Using User-Agent: ${userAgent.substring(0, 50)}...`);
        }
        
        const urlWithCacheBust = this.generateCacheBustUrl(config.url);
        const feed = await parser.parseURL(urlWithCacheBust);
        
        Logger.info(`Successfully fetched ${feed.items.length} items from ${config.name}`);
        return feed;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          Logger.warn(`Attempt ${attempt + 1} failed for ${config.name}: ${error.message}`);
          await new Promise(resolve => 
            setTimeout(resolve, FeedConfig.CONSTANTS.RETRY_DELAY_BASE_MS * (attempt + 1))
          );
        }
      }
    }
    
    throw lastError;
  }

  async fetchSingleFeed(config) {
    try {
      const feed = await this.fetchFeedWithRetry(config);
      
      // Get appropriate item limit for this content type
      const itemLimit = FeedConfig.getItemLimit(config.type);
      
      const items = feed.items
        .slice(0, itemLimit)
        .map(item => ContentProcessor.transformFeedItem(item, config))
        .filter(item => item !== null);
      
      Logger.info(`✓ Processed ${items.length} valid items from ${config.name} (limit: ${itemLimit})`);
      return { success: true, items, config };
    } catch (error) {
      Logger.error(`✗ Error fetching ${config.name}:`, error.message);
      
      // Try fallback to existing content
      const fallbackItems = this.getFallbackContent(config);
      if (fallbackItems.length > 0) {
        Logger.info(`📄 Using ${fallbackItems.length} fallback items from ${config.name}`);
        return { success: false, items: fallbackItems, config, error: error.message };
      }
      
      return { success: false, items: [], config, error: error.message };
    }
  }

  getFallbackContent(config) {
    return this.existingContent.filter(item => {
      if (item.source !== config.name) return false;
      
      const itemDate = new Date(item.publishDate);
      // Use longer retention for newsletters
      const retentionDays = config.type === 'newsletter' 
        ? FeedConfig.CONSTANTS.NEWSLETTER_RETENTION_DAYS 
        : FeedConfig.CONSTANTS.FALLBACK_DAYS;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      return itemDate > cutoffDate;
    });
  }

  async fetchAllFeedsParallel() {
    Logger.info(`Starting parallel fetch of ${FeedConfig.FEED_CONFIGS.length} feeds`);
    
    const results = [];
    const feedConfigs = [...FeedConfig.FEED_CONFIGS];
    const fetchedSources = new Set();
    
    // Process feeds in batches to avoid overwhelming servers
    for (let i = 0; i < feedConfigs.length; i += FeedConfig.CONSTANTS.PARALLEL_FETCH_LIMIT) {
      const batch = feedConfigs.slice(i, i + FeedConfig.CONSTANTS.PARALLEL_FETCH_LIMIT);
      
      Logger.info(`Processing batch ${Math.floor(i / FeedConfig.CONSTANTS.PARALLEL_FETCH_LIMIT) + 1} (${batch.length} feeds)`);
      
      const batchPromises = batch.map(config => this.fetchSingleFeed(config));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.success) {
            fetchedSources.add(result.value.config.name);
          }
        } else {
          const config = batch[index];
          Logger.error(`Batch fetch failed for ${config.name}:`, result.reason);
          results.push({ success: false, items: [], config, error: result.reason.message });
        }
      });
      
      // Rate limiting between batches
      if (i + FeedConfig.CONSTANTS.PARALLEL_FETCH_LIMIT < feedConfigs.length) {
        await new Promise(resolve => 
          setTimeout(resolve, FeedConfig.CONSTANTS.RATE_LIMIT_DELAY_MS)
        );
      }
    }
    
    // Add preservation logic for unfetched sources
    const unfetchedSources = feedConfigs.filter(config => !fetchedSources.has(config.name));
    
    if (unfetchedSources.length > 0) {
      Logger.warn(`Preserving existing content from ${unfetchedSources.length} unfetched sources`);
      
      unfetchedSources.forEach(config => {
        const preservedItems = this.existingContent.filter(item => item.source === config.name);
        if (preservedItems.length > 0) {
          Logger.info(`📄 Preserving ${preservedItems.length} items from ${config.name}`);
          results.push({ success: false, items: preservedItems, config, preserved: true });
        }
      });
    }
    
    return results;
  }

  generateStats(allContent) {
    return {
      totalContent: allContent.length,
      thisWeek: allContent.filter(item => ContentProcessor.isNewContent(item.publishDate)).length,
      contentTypes: {
        videos: allContent.filter(item => item.type === 'video').length,
        podcasts: allContent.filter(item => item.type === 'podcast').length,
        newsletters: allContent.filter(item => item.type === 'newsletter').length,
        blogs: allContent.filter(item => item.type === 'blog').length
      },
      sources: Object.fromEntries(
        FeedConfig.FEED_CONFIGS.map(config => [
          config.name,
          allContent.filter(item => item.source === config.name).length
        ])
      ),
      lastUpdated: new Date().toISOString()
    };
  }

  saveResults(allContent, stats) {
    // Generate content hash for cache invalidation
    const contentHash = this.generateContentHash(allContent);
    
    // Save content to data directory
    const contentPath = join(__dirname, '..', 'src', 'data', 'content.json');
    writeFileSync(contentPath, JSON.stringify(allContent, null, 2));
    Logger.info(`✓ Content saved to: ${contentPath}`);
    
    // Save content to public directory for archive page
    const publicPath = join(__dirname, '..', 'public', 'content.json');
    writeFileSync(publicPath, JSON.stringify(allContent, null, 2));
    Logger.info(`✓ Content also saved to: ${publicPath}`);
    
    // Save stats
    const statsPath = join(__dirname, '..', 'src', 'data', 'stats.json');
    writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    Logger.info(`✓ Stats saved to: ${statsPath}`);
    
    // Update cache version for invalidation
    this.updateCacheVersion(contentHash);
  }

  generateContentHash(items) {
    const contentSignature = items.map(item => ({
      id: item.id,
      title: item.title,
      publishDate: item.publishDate,
      source: item.source
    }));
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(contentSignature))
      .digest('hex')
      .substring(0, 16);
  }

  updateCacheVersion(contentHash) {
    try {
      const versionData = {
        contentHash,
        timestamp: Date.now(),
        version: Date.now().toString(),
        lastUpdate: new Date().toISOString()
      };

      const versionPath = join(__dirname, '..', 'public', 'cache-version.json');
      writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      
      Logger.info(`✅ Cache version updated: ${versionData.version}`);
    } catch (error) {
      Logger.error('❌ Failed to update cache version:', error);
    }
  }

  async run() {
    const startTime = Date.now();
    Logger.info('🚀 Starting feed fetch process');
    
    try {
      const results = await this.fetchAllFeedsParallel();
      
      // Collect all content
      const allContent = results.flatMap(result => result.items);
      
      // Sort by publish date (newest first)
      allContent.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
      
      // Generate stats
      const stats = this.generateStats(allContent);
      
      // Save results
      this.saveResults(allContent, stats);
      
      // Summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      Logger.info(`\n🎉 Feed fetch completed in ${duration}s`);
      Logger.info(`✓ Total content items: ${allContent.length}`);
      Logger.info(`✓ Successful feeds: ${successCount}/${results.length}`);
      if (failCount > 0) {
        Logger.warn(`⚠️  Failed feeds: ${failCount}`);
        results.filter(r => !r.success).forEach(r => {
          Logger.warn(`   - ${r.config.name}: ${r.error}`);
        });
      }
      
      return {
        success: true,
        totalItems: allContent.length,
        successfulFeeds: successCount,
        failedFeeds: failCount,
        duration: parseFloat(duration)
      };
    } catch (error) {
      Logger.error('💥 Feed fetch process failed:', error);
      throw error;
    }
  }
}

// Export for testing
export { FeedFetcher, ContentProcessor, ContentValidator, Logger, FeedConfig };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new FeedFetcher();
  fetcher.run().catch(error => {
    Logger.error('Fatal error:', error);
    process.exit(1);
  });
}