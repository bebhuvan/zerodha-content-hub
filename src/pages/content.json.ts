import type { APIRoute } from 'astro';
import contentData from '../data/content.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(contentData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};