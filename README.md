# Zerodha Content Hub

A comprehensive content aggregation platform that brings together all of Zerodha's educational and market insights content in one place. Built with Astro for optimal performance and user experience.

## 🎯 Overview

The Zerodha Content Hub aggregates content from multiple sources including YouTube channels, podcasts, newsletters, and blogs to provide users with a unified platform to discover and consume financial education and market analysis content.

## ✨ Features

### Content Aggregation
- **14 Content Sources**: Aggregates from YouTube channels, podcasts, newsletters, and blogs
- **311+ Content Items**: Videos, podcasts, newsletters, and blog posts
- **Real-time Updates**: RSS feed integration with cache-busting for fresh content
- **Smart Categorization**: Content organized by type, source, and publication date

### User Experience
- **Advanced Search**: Full-text search across titles, descriptions, and keywords
- **Smart Filtering**: Filter by content type (Videos, Podcasts, Newsletters, Blogs)
- **Date Grouping**: Content organized by Today, Yesterday, This Week, etc.
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Progressive Web App**: Installable with offline capabilities

### Performance & SEO
- **Paginated API**: Reduces initial load from 344KB to ~20KB per request
- **Lazy Loading**: Images and content loaded on demand
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, structured data
- **Cache Strategy**: Multi-layer caching for optimal performance
- **Font Optimization**: Preloaded fonts with display swap

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clean focus indicators without visual clutter
- **Mobile Responsive**: Horizontal scrolling filter tabs on mobile

## 📊 Content Sources

### Newsletters (5 sources)
- **The Daily Brief**: Daily market wrap-up and analysis
- **After Market Report**: Quick daily market summary
- **The Chatter**: Weekly insights on markets and technology
- **Varsity Newsletter**: Educational content on personal finance
- **What The Hell Is Happening**: Unconventional takes on current events

### Podcasts (3 sources)
- **The Daily Brief Podcast**: Audio discussions on market trends
- **Side Notes by Zerodha Varsity**: Educational finance content
- **Investing in India**: Insights into India's investment landscape

### YouTube Channels (4 sources)
- **Markets**: Educational videos on market analysis and trading
- **Zerodha**: Daily market outlook and technical analysis
- **Zero1**: Quick market updates and financial literacy
- **Varsity**: Personal finance and investment education

### Blogs (2 sources)
- **Z-Connect Blog**: Market insights, IPO analysis, investment guides
- **Varsity Blog**: Educational articles on trading and financial markets

## 🛠 Tech Stack

- **Framework**: Astro v4.16.18 (Static Site Generator)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **RSS Parsing**: rss-parser
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/bebhuvan/zerodha-content-hub.git
cd zerodha-content-hub

# Install dependencies
npm install

# Fetch latest content
npm run fetch-feeds

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run fetch-feeds  # Update RSS feed content
npm run astro        # Astro CLI commands
```

## 📁 Project Structure

```
src/
├── components/
│   ├── SearchBar.astro          # Search input component
│   ├── FilterTabs.astro         # Content type filter tabs
│   ├── SearchAndFilter.astro    # Main content display logic
│   ├── HeroSection.astro        # Homepage hero section
│   └── ContentList.astro        # Content list container
├── layouts/
│   └── Layout.astro             # Base layout with SEO
├── pages/
│   ├── index.astro              # Homepage
│   ├── archive.astro            # Archive page
│   ├── sources.astro            # Sources directory
│   ├── feed.xml.ts              # RSS feed endpoint
│   ├── sitemap.xml.ts           # SEO sitemap
│   ├── robots.txt.ts            # SEO robots file
│   └── api/
│       └── content.ts           # Paginated content API
├── data/
│   ├── content.json             # Aggregated content data
│   └── stats.json               # Content statistics
└── constants/
    └── app.ts                   # Application constants
```

## 🔄 Content Updates

### Automated Updates
Content is automatically updated twice daily via GitHub Actions:
- **9:00 AM IST**: Morning update before market hours
- **8:00 PM IST**: Evening update after market close

### Manual Updates
```bash
# Update content manually
npm run fetch-feeds

# Deploy to production
git add . && git commit -m "Update content" && git push
```

## 🎨 Customization

### Adding New Content Sources
1. Add feed configuration to `scripts/fetchFeeds.js`:
```javascript
{
  name: 'Source Name',
  url: 'https://example.com/feed.xml',
  type: 'newsletter', // or 'podcast', 'video', 'blog'
  category: 'Newsletter'
}
```

2. Update the sources directory in `src/pages/sources.astro`
3. Run `npm run fetch-feeds` to test

### Styling Customization
- Global styles: `src/layouts/Layout.astro`
- Component styles: Individual `.astro` files
- Tailwind config: `tailwind.config.js`

## 📈 Performance

### Core Web Vitals
- **LCP**: < 2.5s (Fast loading with image optimization)
- **FID**: < 100ms (Responsive with efficient JavaScript)
- **CLS**: < 0.1 (Stable layout with proper sizing)

### Optimization Features
- **API Pagination**: 20 items per request vs 311 items
- **Image Lazy Loading**: YouTube thumbnails loaded on demand
- **Font Optimization**: Preconnected Google Fonts with swap
- **Cache Headers**: Appropriate caching for different content types
- **Bundle Optimization**: Tree-shaking and code splitting

## 🔧 Configuration

### Environment Variables
```bash
# Not currently required - all feeds are public RSS
# Future: Add API keys for enhanced features
```

### Cache Configuration
- **RSS Feeds**: No caching (always fresh)
- **API Responses**: 5-minute cache
- **Static Assets**: 1-hour cache
- **Feed Endpoint**: 1-hour cache

## 🐛 Troubleshooting

### Common Issues

**Server won't start**
```bash
# Check if port is in use
lsof -i :4321
# Kill existing processes
pkill -f "astro dev"
```

**Missing content**
```bash
# Clear cache and refetch
rm -rf .astro dist node_modules/.cache
npm run fetch-feeds
```

**Build errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📱 Mobile Experience

- **Responsive Design**: Optimized for all screen sizes
- **Touch Friendly**: Large tap targets and smooth scrolling
- **PWA Support**: Add to home screen functionality
- **Offline Capability**: Service worker caching
- **Performance**: Lazy loading and efficient rendering

## 🔒 Security & Privacy

- **No User Data Collection**: Content-only platform
- **XSS Prevention**: Safe DOM manipulation
- **Content Security**: Sanitized RSS content
- **HTTPS**: Secure content delivery
- **Privacy Focused**: No tracking or analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit with descriptive messages
6. Push to your fork: `git push origin feature-name`
7. Create a Pull Request

### Development Guidelines
- Follow existing code style
- Add TypeScript types for new features
- Test on mobile and desktop
- Ensure accessibility compliance
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- **Issues**: [GitHub Issues](https://github.com/bebhuvan/zerodha-content-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bebhuvan/zerodha-content-hub/discussions)

## 🙏 Acknowledgments

- **Zerodha**: For providing quality financial education content
- **Astro**: For the excellent static site generator
- **Tailwind CSS**: For utility-first styling
- **Community**: For feedback and contributions

---

Built with ❤️ for the Zerodha community