// Proxy service configurations for RSS feeds

export const PROXY_SERVICES = {
  // Free RSS proxy services
  RSS2JSON: {
    name: 'RSS2JSON',
    url: 'https://api.rss2json.com/v1/api.json?rss_url=',
    rateLimitPerHour: 10000,
    maxRequestsPerSecond: 5,
    converter: (data) => ({
      title: data.feed.title,
      items: data.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.description,
        contentSnippet: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
      }))
    })
  },
  
  FEEDBURNER_PROXY: {
    name: 'FeedBurner Style',
    url: 'https://feeds.feedburner.com/~r/',
    suffix: '/~3/',
    converter: null // Uses standard RSS parser
  },
  
  // If you have a server/VPS, you can create your own proxy
  CUSTOM_PROXY: {
    name: 'Custom Proxy',
    url: 'https://your-proxy-server.com/fetch?url=',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
};

// Rotating proxy strategy
export class ProxyRotator {
  constructor() {
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.resetTime = Date.now() + 3600000; // Reset failed proxies every hour
  }
  
  getNextProxy() {
    if (Date.now() > this.resetTime) {
      this.failedProxies.clear();
      this.resetTime = Date.now() + 3600000;
    }
    
    const availableServices = Object.entries(PROXY_SERVICES)
      .filter(([key]) => !this.failedProxies.has(key));
    
    if (availableServices.length === 0) {
      // All proxies failed, reset and try again
      this.failedProxies.clear();
      return PROXY_SERVICES.RSS2JSON;
    }
    
    const service = availableServices[this.currentIndex % availableServices.length];
    this.currentIndex++;
    
    return service[1];
  }
  
  markFailed(serviceName) {
    this.failedProxies.add(serviceName);
  }
}

// Additional proxy options
export const PROXY_ALTERNATIVES = {
  // Method 1: Use Cloudflare Workers as proxy
  cloudflareWorker: {
    description: 'Deploy a Cloudflare Worker to proxy RSS feeds',
    code: `
// Cloudflare Worker code:
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml'
      }
    });
    
    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
    `
  },
  
  // Method 2: Use Vercel Edge Functions
  vercelEdge: {
    description: 'Deploy Vercel Edge Function as RSS proxy',
    endpoint: 'https://your-project.vercel.app/api/rss-proxy'
  },
  
  // Method 3: Use GitHub Actions with different approach
  githubActionsProxy: {
    description: 'Run fetch from different GitHub Action context or use Actions secrets for proxy credentials'
  }
};