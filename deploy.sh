#!/bin/bash

# EcoVest+ GitHub Deployment Script
# Usage: ./deploy.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
  echo "❌ Error: Please provide your GitHub username"
  echo "Usage: ./deploy.sh YOUR_GITHUB_USERNAME"
  echo "Example: ./deploy.sh prapathomsit"
  exit 1
fi

USERNAME=$1
REPO_URL="https://github.com/$USERNAME/ecovest-plus.git"

echo "🚀 Deploying EcoVest+ to GitHub..."
echo "📦 Repository: $REPO_URL"
echo ""

# Check if remote exists
if git remote | grep -q "^origin$"; then
  echo "🔄 Updating remote origin..."
  git remote remove origin
fi

# Add new remote
echo "➕ Adding GitHub remote..."
git remote add origin "$REPO_URL"

# Add all files
echo "📁 Adding all files..."
git add -A

# Show status
echo ""
echo "📊 Git Status:"
git status --short

# Commit if there are changes
if ! git diff --cached --quiet; then
  echo ""
  echo "💾 Creating commit..."
  git commit -m "feat: Complete EcoVest+ with unlimited media uploads

Features:
- Email-based authentication (one account per email)
- Stock trading game onboarding
- Unlimited image/video uploads via IndexedDB
- Multi-image grid display
- Follow system
- Developer mode (type 'icemonster')
- Responsive design"
else
  echo "✅ No changes to commit"
fi

# Push to GitHub
echo ""
echo "⬆️  Pushing to GitHub..."
echo "📍 Branch: main"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo ""
  echo "📖 Next Steps:"
  echo "1. Go to: https://github.com/$USERNAME/ecovest-plus"
  echo "2. Click 'Settings' tab"
  echo "3. Click 'Pages' in left sidebar"
  echo "4. Under 'Source', select branch: 'main'"
  echo "5. Click 'Save'"
  echo "6. Wait ~1 minute, then visit:"
  echo "   🌐 https://$USERNAME.github.io/ecovest-plus/"
  echo ""
else
  echo ""
  echo "❌ Push failed. You may need to:"
  echo "1. Create the repository on GitHub first:"
  echo "   https://github.com/new"
  echo "2. Use a Personal Access Token for authentication"
  echo "3. Or run: git push -u origin main"
  echo ""
fi

