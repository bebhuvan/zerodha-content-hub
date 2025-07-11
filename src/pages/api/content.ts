import type { APIRoute } from 'astro';
import contentData from '../../data/content.json';

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

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    }
  });
};