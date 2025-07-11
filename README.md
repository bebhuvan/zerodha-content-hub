# Zerodha Content Hub

A comprehensive content aggregation platform for Zerodha's videos, podcasts, and newsletters. Built with Astro, featuring automated RSS feed updates and clean, responsive design.

## 🎯 Overview

The Zerodha Content Hub aggregates content from **9 RSS feeds** across **3 content types**, providing a unified discovery platform for Zerodha's educational and market content.

### 📊 Content Sources (155 total items)

**📺 YouTube Channels (60 videos)**
- **Zero1** - Investment and trading education (15 items)
- **Varsity** - Market education and analysis (15 items)  
- **Markets** - Market news and updates (15 items)
- **Zerodha** - Company updates and insights (15 items)

**🎙️ Podcasts (40 episodes)**
- **The Daily Brief Podcast** - Daily market commentary (20 items)
- **Side Notes by Zerodha Varsity** - Investment insights (20 items)

**📄 Newsletters (55 articles)**
- **Varsity Newsletter** (Mind Over Markets) - Investment strategy (20 items)
- **The Chatter** - Market analysis and insights (15 items)
- **Daily Brief** - Daily market newsletter (20 items)

## ✨ Features

- **🔍 Smart Search**: Real-time search across titles, descriptions, and keywords
- **🏷️ Content Filtering**: Filter by Videos, Podcasts, Newsletters, or view All
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile
- **⚡ Fast Performance**: Static site generation with Astro
- **📋 Archive Page**: Complete searchable list of all content
- **🔄 Auto-Updates**: Automated RSS feed refresh twice daily
- **📱 PWA Support**: Installable progressive web app
- **🎨 Clean UI**: Minimal design with Inter font and Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Astro v4.11.0 (Static Site Generator)
- **Styling**: Tailwind CSS v3.4.0
- **RSS Parsing**: rss-parser v3.13.0
- **TypeScript**: v5.5.0
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Build Tool**: Vite (integrated with Astro)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/bebhuvan/zerodha-content-hub.git
cd zerodha-content-hub

# Install dependencies
npm install

# Fetch latest RSS feeds
npm run fetch-feeds

# Start development server
npm run dev
# → http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
zerodha-content-hub/
├── .github/workflows/           # GitHub Actions
│   ├── update-feeds.yml        # Main scheduled workflow
│   └── manual-deploy.yml       # Manual testing workflow
├── public/                     # Static assets
│   ├── favicon.svg
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── scripts/
│   └── fetchFeeds.js          # RSS feed fetching logic
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ContentList.astro  # Main content display
│   │   ├── FilterTabs.astro   # Content type filters
│   │   ├── HeroSection.astro  # Page header
│   │   ├── SearchAndFilter.astro # Search logic
│   │   └── SearchBar.astro    # Search input
│   ├── data/                  # Generated content
│   │   ├── content.json       # All RSS feed items
│   │   └── stats.json         # Content statistics
│   ├── layouts/
│   │   └── Layout.astro       # Base page layout
│   ├── pages/
│   │   ├── archive.astro      # Archive page
│   │   ├── content.json.ts    # API endpoint
│   │   └── index.astro        # Homepage
│   └── types/
│       └── content.ts         # TypeScript definitions
├── astro.config.mjs           # Astro configuration
├── tailwind.config.mjs        # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build
npm run fetch-feeds      # Manually fetch RSS feeds

# Type checking
npx astro check         # Check TypeScript and Astro files
```

## 🚀 Deployment

### Automated Deployment (GitHub Actions)

**Main Workflow** (`update-feeds.yml`):
- **Schedule**: Runs automatically at 9 AM & 8 PM IST daily
- **Trigger**: Manual trigger also available
- **Process**: Fetches RSS feeds → Builds site → Deploys to Cloudflare Pages
- **Commits**: Updates `src/data/` with `[skip ci]` tag

**Manual Testing** (`manual-deploy.yml`):
- **Purpose**: Testing newsletter fixes and verifying content
- **Trigger**: Manual only
- **Features**: Shows content statistics and newsletter verification

### Setup Instructions

1. **Cloudflare Pages Setup**:
   - Connect GitHub repository to Cloudflare Pages
   - Build command: `npm run build`
   - Build output directory: `dist`

2. **GitHub Secrets Configuration**:
   - `CLOUDFLARE_API_TOKEN`: API token with Cloudflare Pages:Edit permission
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

3. **Manual Deployment**:
   - Go to Actions tab → "Manual Deploy with All Newsletters" → Run workflow

## 🔍 Content Management

### RSS Feed Configuration

RSS feeds are configured in `scripts/fetchFeeds.js`:

```javascript
const feedConfigs = [
  {
    name: 'Source Name',
    url: 'https://example.com/feed',
    type: 'video|podcast|newsletter',
    category: 'Category'
  }
  // ... more feeds
];
```

### Data Structure

**Content Item**:
```typescript
{
  id: string;
  title: string;
  description: string;
  url: string;
  publishDate: string;
  source: string;
  type: 'video' | 'podcast' | 'newsletter';
  isNew: boolean;
  isShort?: boolean;  // YouTube Shorts
  duration?: string;  // Videos/Podcasts
  readingTime?: string; // Newsletters
  embedId?: string;   // YouTube video ID
  keywords?: string[];
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Newsletters not showing**:
- Check GitHub Actions logs for RSS fetch errors
- Verify all newsletter feeds are accessible
- Run manual deployment workflow for debugging

**2. Build failures**:
- Ensure `content.json` exists (run `npm run fetch-feeds`)
- Check TypeScript errors with `npx astro check`
- Verify dependencies are installed

**3. Deployment issues**:
- Check Cloudflare API token permissions
- Verify account ID is correct
- Check GitHub Actions secrets configuration

### Debug Commands

```bash
# Check content generation
npm run fetch-feeds
cat src/data/stats.json

# Verify newsletter content
cat src/data/content.json | jq '[.[] | select(.type == "newsletter") | .source] | unique'

# Test build locally
npm run build
ls -la dist/

# Check RSS feed accessibility
curl -I https://zerodhavarsity.substack.com/feed
```

## 🎨 Design System

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Semibold to Bold weights
- **Body**: Regular to Medium weights

### Color Palette
- **Background**: White (`#ffffff`)
- **Text**: Gray-900 (`#111827`)
- **Accent**: Black (`#000000`)
- **Muted**: Gray-500 to Gray-600

## 📈 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: <100KB gzipped
- **Load Time**: <2s on 3G networks
- **Caching**: Aggressive caching via Cloudflare CDN

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Repository**: https://github.com/bebhuvan/zerodha-content-hub
- **Issues**: https://github.com/bebhuvan/zerodha-content-hub/issues