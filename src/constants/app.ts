/**
 * Application constants
 */

// Timing constants
export const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds
export const CACHE_BUST_PARAM = 't'; // cache busting parameter name

// API endpoints
export const CONTENT_API_URL = '/content.json';

// Content type styles
export const CONTENT_TYPE_STYLES = {
  video: { bg: 'bg-blue-50', text: 'text-blue-700' },
  podcast: { bg: 'bg-purple-50', text: 'text-purple-700' },
  newsletter: { bg: 'bg-gray-50', text: 'text-gray-700' },
  blog: { bg: 'bg-green-50', text: 'text-green-700' }
} as const;

// Date group icons
export const DATE_GROUP_ICONS = {
  'Today': '📰',
  'Yesterday': '⏰',
  'This Week': '📋',
  'Last Week': '📊', 
  'This Month': '📈',
  'Older': '📚'
} as const;

// Content type icons
export const CONTENT_TYPE_ICONS = {
  video: '▶',
  podcast: '🎧',
  newsletter: '📧',
  blog: '📝'
} as const;

// RSS feed URLs
export const RSS_FEEDS = {
  varsity: 'https://zerodha.com/varsity/feed/',
  zconnect: 'https://zerodha.com/z-connect/feed/'
} as const;

// Default values
export const DEFAULT_CONTENT_TYPE_STYLE = { bg: 'bg-gray-50', text: 'text-gray-700' };
export const DEFAULT_DATE_GROUP_ICON = '📄';