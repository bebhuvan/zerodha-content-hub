import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteUrl = 'https://zerodha-market-insights.pages.dev'; // Update with your actual domain
  
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml

# Prevent crawling of API endpoints
Disallow: /api/`;

  return new Response(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};