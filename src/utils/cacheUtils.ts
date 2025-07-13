import crypto from 'crypto';

/**
 * Cache utilities for content management
 */
export class CacheUtils {
  /**
   * Generate ETag for any data
   */
  static generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
  }

  /**
   * Generate Last-Modified header from content array
   */
  static getLastModified(items: any[]): string {
    if (!items.length) return new Date().toUTCString();
    
    const latestDate = items.reduce((latest, item) => {
      const itemDate = new Date(item.publishDate || item.lastUpdated || item.updatedAt || 0);
      return itemDate > latest ? itemDate : latest;
    }, new Date(0));
    
    return latestDate.toUTCString();
  }

  /**
   * Check if request can be served from cache based on conditional headers
   */
  static shouldServeFromCache(request: Request, etag: string, lastModified: string): boolean {
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    
    // Check ETag match
    if (ifNoneMatch === etag) return true;
    
    // Check Last-Modified date
    if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate cache control header based on content type and freshness requirements
   */
  static getCacheControl(type: 'api' | 'static' | 'content' | 'feed' | 'sitemap' | 'immutable'): string {
    switch (type) {
      case 'api':
        return 'public, max-age=60, stale-while-revalidate=180, must-revalidate';
      case 'content':
        return 'public, max-age=60, stale-while-revalidate=300, must-revalidate';
      case 'feed':
        return 'public, max-age=300, stale-while-revalidate=600, must-revalidate';
      case 'sitemap':
        return 'public, max-age=1800, stale-while-revalidate=3600';
      case 'static':
        return 'public, max-age=3600, stale-while-revalidate=7200';
      case 'immutable':
        return 'public, max-age=31536000, immutable';
      default:
        return 'public, max-age=300, must-revalidate';
    }
  }

  /**
   * Generate versioned URL for cache busting
   */
  static addCacheBuster(url: string, version?: string): string {
    const timestamp = Date.now();
    const versionStr = version || timestamp.toString();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${versionStr}&t=${timestamp}`;
  }

  /**
   * Create 304 Not Modified response
   */
  static createNotModifiedResponse(): Response {
    return new Response(null, { 
      status: 304,
      headers: {
        'Cache-Control': 'public, max-age=60, must-revalidate'
      }
    });
  }

  /**
   * Create optimized response headers for content
   */
  static createResponseHeaders(
    etag: string, 
    lastModified: string, 
    cacheType: 'api' | 'static' | 'content' | 'feed' | 'sitemap' | 'immutable',
    contentType: string = 'application/json'
  ): Record<string, string> {
    return {
      'Content-Type': contentType,
      'Cache-Control': this.getCacheControl(cacheType),
      'ETag': etag,
      'Last-Modified': lastModified,
      'Vary': 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff'
    };
  }

  /**
   * Generate content hash for cache invalidation
   */
  static generateContentHash(items: any[]): string {
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

  /**
   * Check if content needs invalidation based on hash comparison
   */
  static shouldInvalidateCache(newHash: string, existingHash?: string): boolean {
    return !existingHash || newHash !== existingHash;
  }
}

/**
 * Cache invalidation helper for build-time
 */
export class CacheInvalidator {
  private static readonly CACHE_VERSION_FILE = 'cache-version.json';

  static async updateCacheVersion(contentHash: string): Promise<void> {
    const versionData = {
      contentHash,
      timestamp: Date.now(),
      version: Date.now().toString()
    };

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const versionPath = path.join(process.cwd(), 'public', this.CACHE_VERSION_FILE);
      fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      
      console.log(`✅ Cache version updated: ${versionData.version}`);
    } catch (error) {
      console.error('❌ Failed to update cache version:', error);
    }
  }

  static async getCurrentCacheVersion(): Promise<string | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const versionPath = path.join(process.cwd(), 'public', this.CACHE_VERSION_FILE);
      
      if (fs.existsSync(versionPath)) {
        const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        return versionData.version;
      }
    } catch (error) {
      console.warn('⚠️ Could not read cache version:', error);
    }
    
    return null;
  }

  static async shouldRegenerateCache(newContentHash: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const versionPath = path.join(process.cwd(), 'public', this.CACHE_VERSION_FILE);
      
      if (!fs.existsSync(versionPath)) return true;
      
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      return versionData.contentHash !== newContentHash;
    } catch (error) {
      return true; // Regenerate on error
    }
  }
}