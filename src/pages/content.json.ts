import type { APIRoute } from 'astro';
import contentData from '../data/content.json';
import crypto from 'crypto';

function generateETag(data: any): string {
  return `"${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;
}

function getLastModified(data: any[]): string {
  if (!data.length) return new Date().toUTCString();
  
  const latestDate = data.reduce((latest, item) => {
    const itemDate = new Date(item.publishDate || item.lastUpdated || 0);
    return itemDate > latest ? itemDate : latest;
  }, new Date(0));
  
  return latestDate.toUTCString();
}

export const GET: APIRoute = ({ request }) => {
  const etag = generateETag(contentData);
  const lastModified = getLastModified(contentData);
  
  // Check if client has cached version
  const ifNoneMatch = request.headers.get('If-None-Match');
  const ifModifiedSince = request.headers.get('If-Modified-Since');
  
  if (ifNoneMatch === etag || 
      (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
    return new Response(null, { status: 304 });
  }
  
  return new Response(JSON.stringify(contentData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300, must-revalidate',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Vary': 'Accept-Encoding'
    }
  });
};