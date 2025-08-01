// Deploy this as a Cloudflare Worker to proxy RSS feeds
// This will give you a free, fast proxy that bypasses IP blocking

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing url parameter', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      // Validate URL to prevent abuse
      const target = new URL(targetUrl);
      const allowedDomains = [
        'substack.com',
        'zerodha.com',
        'simplecast.com',
        'youtube.com'
      ];
      
      const isAllowed = allowedDomains.some(domain => 
        target.hostname.endsWith(domain)
      );
      
      if (!isAllowed) {
        return new Response('Domain not allowed', { 
          status: 403,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Fetch with realistic headers
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cf: {
          // Cloudflare specific options
          cacheEverything: true,
          cacheTtl: 300, // Cache for 5 minutes
        }
      });

      if (!response.ok) {
        return new Response(`Failed to fetch: ${response.status} ${response.statusText}`, {
          status: response.status,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Return the RSS content with CORS headers
      return new Response(response.body, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/xml',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });

    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  },
};

// To deploy:
// 1. Create Cloudflare Worker at workers.cloudflare.com
// 2. Paste this code
// 3. Deploy with subdomain like: rss-proxy.your-worker.workers.dev
// 4. Update feedParser.js to use: https://rss-proxy.your-worker.workers.dev/?url=