import type { APIRoute } from 'astro';
import contentData from '../../data/content.json';
import crypto from 'crypto';

export const GET: APIRoute = ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const search = url.searchParams.get('search') || '';
  const source = url.searchParams.get('source') || '';
  const type = url.searchParams.get('type') || '';

  let filteredContent = contentData;

  // Apply filters
  if (search) {
    const searchLower = search.toLowerCase();
    filteredContent = filteredContent.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  }

  if (source) {
    filteredContent = filteredContent.filter(item => item.source === source);
  }

  if (type) {
    filteredContent = filteredContent.filter(item => item.type === type);
  }

  // Sort by date (newest first)
  filteredContent.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedContent = filteredContent.slice(startIndex, endIndex);

  const response = {
    content: paginatedContent,
    pagination: {
      page,
      limit,
      total: filteredContent.length,
      pages: Math.ceil(filteredContent.length / limit),
      hasNext: endIndex < filteredContent.length,
      hasPrev: page > 1
    },
    filters: {
      search,
      source,
      type
    }
  };

  // Generate ETag for this specific response
  const etag = `"${crypto.createHash('md5').update(JSON.stringify(response)).digest('hex')}"`;
  
  // Get latest publish date from filtered content
  const lastModified = filteredContent.length > 0 
    ? new Date(Math.max(...filteredContent.map(item => new Date(item.publishDate).getTime()))).toUTCString()
    : new Date().toUTCString();

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=180, must-revalidate',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Vary': 'Accept-Encoding'
    }
  });
};