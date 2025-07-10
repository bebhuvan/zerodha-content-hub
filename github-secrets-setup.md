# GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

## Required Secrets:

### 1. CLOUDFLARE_API_TOKEN
- Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Click "Create Token"
- Use "Custom token" template
- **Permissions**:
  - Zone - Zone:Read
  - Zone - Page Rules:Edit
  - Account - Cloudflare Pages:Edit
- **Account Resources**: Include your account
- **Zone Resources**: Include all zones
- Copy the token and add it as `CLOUDFLARE_API_TOKEN`

### 2. CLOUDFLARE_ACCOUNT_ID
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- On the right sidebar, copy your "Account ID"
- Add it as `CLOUDFLARE_ACCOUNT_ID`

## Verification:

After adding secrets, you can:
1. Go to Actions tab in your GitHub repo
2. Run the "Update RSS Feeds and Deploy" workflow manually
3. Check if it builds and deploys successfully

## Project Structure:

The workflow will:
- ✅ Fetch RSS feeds twice daily (9 AM & 8 PM IST)
- ✅ Build the Astro site
- ✅ Deploy to Cloudflare Pages
- ✅ Auto-update content.json with new posts

## Domain Setup (Optional):

If you want to use a custom domain:
1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add your domain
3. Follow the DNS setup instructions