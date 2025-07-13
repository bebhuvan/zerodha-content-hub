/**
 * SEO utility functions for content enhancement
 */

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishDate: string;
  type: 'video' | 'podcast' | 'newsletter' | 'blog';
  source: string;
  author: string;
  duration?: string | null;
  readingTime?: string | null;
  thumbnail?: string | null;
  keywords: string[];
  categories: string[];
  isNew: boolean;
}

/**
 * Generate Article schema markup for a content item
 */
export function generateArticleSchema(item: ContentItem): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": getSchemaType(item.type),
    "headline": item.title,
    "description": item.description,
    "url": item.url,
    "datePublished": item.publishDate,
    "dateModified": item.publishDate,
    "author": {
      "@type": "Organization",
      "name": item.author,
      "url": "https://zerodha.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Zerodha",
      "url": "https://zerodha.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://zerodha-market-insights.pages.dev/icon-512.svg",
        "width": 512,
        "height": 512
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": item.url
    },
    "keywords": item.keywords.join(", "),
    "articleSection": item.categories.join(", ") || item.type,
    "inLanguage": "en"
  };

  // Add type-specific properties with proper typing
  const extendedSchema = schema as any;
  
  if (item.type === 'video' && item.duration) {
    extendedSchema["video"] = {
      "@type": "VideoObject",
      "name": item.title,
      "description": item.description,
      "duration": item.duration,
      "uploadDate": item.publishDate
    };
  }

  if (item.type === 'podcast' && item.duration) {
    extendedSchema["audio"] = {
      "@type": "AudioObject",
      "name": item.title,
      "description": item.description,
      "duration": item.duration
    };
  }

  if (item.thumbnail) {
    extendedSchema["image"] = {
      "@type": "ImageObject",
      "url": item.thumbnail,
      "width": 1200,
      "height": 630
    };
  }

  if (item.readingTime) {
    extendedSchema["timeRequired"] = item.readingTime;
  }

  return JSON.stringify(extendedSchema);
}

/**
 * Get appropriate Schema.org type based on content type
 */
function getSchemaType(contentType: string): string {
  switch (contentType) {
    case 'video':
      return 'VideoObject';
    case 'podcast':
      return 'PodcastEpisode';
    case 'newsletter':
      return 'NewsArticle';
    case 'blog':
      return 'BlogPosting';
    default:
      return 'Article';
  }
}

/**
 * Generate breadcrumb schema markup
 */
export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>): string {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return JSON.stringify(breadcrumbList);
}

/**
 * Generate FAQ schema markup for educational content
 */
export function generateFAQSchema(faqs: Array<{question: string, answer: string}>): string {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return JSON.stringify(faqSchema);
}

/**
 * Generate Organization schema markup for Zerodha
 */
export function generateOrganizationSchema(): string {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Zerodha",
    "alternateName": "Zerodha Broking Ltd",
    "description": "India's largest retail stockbroker offering equity, commodity and currency trading",
    "url": "https://zerodha.com",
    "logo": "https://zerodha.com/static/images/logo.svg",
    "sameAs": [
      "https://twitter.com/zerodhaonline",
      "https://www.facebook.com/zerodha.social",
      "https://www.linkedin.com/company/zerodha",
      "https://www.youtube.com/user/zerodhaonline"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-80-4719-2020",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School",
      "addressLocality": "Bengaluru",
      "addressRegion": "Karnataka",
      "postalCode": "560068",
      "addressCountry": "IN"
    },
    "foundingDate": "2010",
    "founders": [
      {
        "@type": "Person",
        "name": "Nithin Kamath"
      }
    ]
  };

  return JSON.stringify(orgSchema);
}

/**
 * Generate meta tags for social sharing
 */
export function generateSocialMetaTags(item: ContentItem): string {
  const ogImage = item.thumbnail || "https://zerodha-market-insights.pages.dev/icon-512.svg";
  
  return `
    <meta property="og:title" content="${escapeHtml(item.title)}" />
    <meta property="og:description" content="${escapeHtml(item.description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${item.url}" />
    <meta property="og:type" content="article" />
    <meta property="article:published_time" content="${item.publishDate}" />
    <meta property="article:author" content="${escapeHtml(item.author)}" />
    <meta property="article:section" content="${item.type}" />
    <meta property="article:tag" content="${item.keywords.join(', ')}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(item.title)}" />
    <meta name="twitter:description" content="${escapeHtml(item.description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:site" content="@zerodhaonline" />
  `;
}

/**
 * Escape HTML for safe insertion
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}