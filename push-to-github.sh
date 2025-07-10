#!/bin/bash

# Replace YOUR_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_USERNAME"
REPO_NAME="zerodha-content-hub"

echo "🚀 Pushing to GitHub..."
echo "Make sure you've created the repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo ""

# Add the remote origin
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Push to GitHub
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo "Next steps:"
echo "1. Set up Cloudflare Pages"
echo "2. Configure GitHub secrets"
echo "3. Run the workflow"