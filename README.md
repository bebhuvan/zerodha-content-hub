# Zerodha Content Hub

A minimal, elegant content aggregation site that pulls from Zerodha's YouTube channels, podcasts, and newsletters.

## Features

- 🎥 YouTube video embeds with automatic ID extraction
- 🎙️ Podcast episode listings
- 📰 Newsletter content previews
- 🔍 Real-time fuzzy search across all content
- 🏷️ Filter by content type
- 📱 Progressive Web App (PWA) support
- ⚡ Static site generation with Astro
- 🔄 Automated RSS feed updates via GitHub Actions
- ☁️ Deployed on Cloudflare Pages

## Setup Instructions

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/zerodha-content-hub.git
cd zerodha-content-hub
npm install
```

### 2. Initial Feed Fetch

```bash
npm run fetch-feeds
```

This will create `src/data/content.json` and `src/data/stats.json` files.

### 3. Local Development

```bash
npm run dev
```

Visit `http://localhost:4321` to see the site.

### 4. Cloudflare Pages Setup

1. **Connect GitHub Repository**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com)
   - Click "Create a project"
   - Connect your GitHub account and select this repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: None required

3. **Deploy**
   - Cloudflare will automatically deploy on every push to `main`

### 5. GitHub Actions Setup

The repository includes automated RSS feed updates that run twice daily. To enable:

1. **Get Cloudflare API Token**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create a token with "Cloudflare Pages:Edit" permissions

2. **Add GitHub Secrets**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

3. **Enable Actions**
   - Go to Actions tab in your repository
   - Enable workflows

The feeds will now update automatically at 9 AM and 8 PM IST daily.

## Manual Feed Update

To manually trigger a feed update:

1. Go to Actions tab
2. Select "Update RSS Feeds and Deploy"
3. Click "Run workflow"

## Customization

### Adding New RSS Feeds

Edit `src/config/feeds.ts`:

```typescript
{
  name: 'New Feed',
  url: 'https://example.com/feed.xml',
  type: 'newsletter', // 'video' | 'podcast' | 'newsletter'
  category: 'Newsletter',
  color: {
    bg: '#f9fafb',
    text: '#6b7280'
  }
}
```

### Styling

The site uses Tailwind CSS. Modify styles in:
- `tailwind.config.mjs` - Theme configuration
- Component files in `src/components/`

### PWA Configuration

Edit `public/manifest.json` to customize:
- App name and description
- Theme colors
- Icons (add your icons to `public/`)

## Tech Stack

- **Framework**: Astro 4.x
- **Styling**: Tailwind CSS
- **Search**: Fuse.js
- **RSS Parsing**: rss-parser
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## Project Structure

```
zerodha-content-hub/
├── src/
│   ├── components/     # Astro components
│   ├── config/        # Feed configurations
│   ├── data/          # Generated JSON data
│   ├── layouts/       # Page layouts
│   ├── pages/         # Routes
│   ├── styles/        # Global styles
│   └── types/         # TypeScript types
├── scripts/
│   └── fetchFeeds.js  # RSS fetching script
├── public/            # Static assets
└── .github/workflows/ # GitHub Actions
```

## License

MIT