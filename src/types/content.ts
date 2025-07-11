export type ContentType = 'video' | 'podcast' | 'newsletter' | 'blog';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishDate: Date;
  type: ContentType;
  source: string;
  author?: string;
  duration?: string;
  readingTime?: string;
  thumbnail?: string;
  keywords: string[];
  categories: string[];
  isNew: boolean;
  embedId?: string;
  viewCount?: string;
}

export interface FeedConfig {
  name: string;
  url: string;
  type: ContentType;
  category: string;
  color: {
    bg: string;
    text: string;
  };
}