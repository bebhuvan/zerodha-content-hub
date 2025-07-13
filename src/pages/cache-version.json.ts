import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const GET: APIRoute = () => {
  try {
    const versionPath = join(process.cwd(), 'public', 'cache-version.json');
    
    if (existsSync(versionPath)) {
      const versionData = JSON.parse(readFileSync(versionPath, 'utf8'));
      
      return new Response(JSON.stringify(versionData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    // Return default version if file doesn't exist
    const defaultVersion = {
      version: Date.now().toString(),
      timestamp: Date.now(),
      contentHash: 'initial',
      lastUpdate: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(defaultVersion), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get cache version' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
};