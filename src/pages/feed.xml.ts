import type { APIRoute } from 'astro';
import contentData from '../data/content.json';
import crypto from 'crypto';

export const GET: APIRoute = () => {
  const siteUrl = 'https://zerodha-market-insights.pages.dev'; // Update with your actual domain
  const siteTitle = 'Market Insights by Zerodha';
  const siteDescription = 'Decode the world of finance with expert insights, market updates, and educational content from Zerodha\'s teams';
  
  // Sort content by date (newest first) and take latest 50 items
  const sortedContent = contentData
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 50);
  
  const rssItems = sortedContent.map(item => {
    const pubDate = new Date(item.publishDate).toUTCString();
    const contentType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    
    return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${contentType}</category>
      <source>${item.source}</source>
      ${item.duration ? `<itunes:duration>${item.duration}</itunes:duration>` : ''}
    </item>`.trim();
  }).join('\n');
  
  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${siteTitle}</title>
    <description>${siteDescription}</description>
    <link>${siteUrl}</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>noreply@zerodha.com (Zerodha)</managingEditor>
    <webMaster>noreply@zerodha.com (Zerodha)</webMaster>
    <generator>Astro</generator>
    <image>
      <url>${siteUrl}/favicon.svg</url>
      <title>${siteTitle}</title>
      <link>${siteUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

  // Generate ETag based on content
  const etag = `"${crypto.createHash('md5').update(rssContent).digest('hex')}"`;
  
  // Get latest publish date from sorted content
  const lastModified = sortedContent.length > 0 
    ? new Date(sortedContent[0].publishDate).toUTCString()
    : new Date().toUTCString();

  return new Response(rssContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600, must-revalidate',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Vary': 'Accept-Encoding'
    }
  });
};